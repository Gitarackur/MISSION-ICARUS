from __future__ import annotations

import inspect
import math
from pathlib import Path
from typing import Callable, Optional

import numpy as np

from analysis.mice import run_mice


ProgressCallback = Callable[[Optional[float], Optional[str]], None]


def _bounded_int(value, fallback: int, minimum: int, maximum: int) -> int:
    try:
        parsed = int(value)
    except (TypeError, ValueError):
        parsed = fallback
    return max(minimum, min(maximum, parsed))


def _bounded_float(value, fallback: float, minimum: float, maximum: float) -> float:
    try:
        parsed = float(value)
    except (TypeError, ValueError):
        parsed = fallback
    if not math.isfinite(parsed):
        parsed = fallback
    return max(minimum, min(maximum, parsed))


def _required_path(payload: dict, key: str) -> Path:
    value = payload.get(key)
    if not isinstance(value, str) or not value:
        raise ValueError(f"{key} is required")
    return Path(value).expanduser().resolve()


def _load_matrix(payload: dict) -> tuple[np.ndarray, list[str], int]:
    input_path = _required_path(payload, "inputPath")
    if not input_path.is_file():
        raise ValueError("Scientific input file does not exist")

    column_names = payload.get("columnNames")
    if not isinstance(column_names, list) or not column_names:
        raise ValueError("At least one numeric input column is required")
    column_names = [str(name) for name in column_names]
    row_count = _bounded_int(payload.get("rowCount"), 0, 1, 2_000_000_000)
    expected_bytes = len(column_names) * row_count * np.dtype("<f8").itemsize
    if input_path.stat().st_size != expected_bytes:
        raise ValueError("Scientific input buffer size does not match its shape")

    mapped = np.memmap(
        input_path,
        dtype="<f8",
        mode="r",
        shape=(len(column_names), row_count),
        order="C",
    )
    return np.asarray(mapped), column_names, row_count


def _write_matrix(payload: dict, columns: np.ndarray) -> tuple[int, int]:
    output_path = _required_path(payload, "outputPath")
    output = np.asarray(columns, dtype="<f8", order="C")
    if output.ndim != 2:
        raise ValueError("Scientific output must be a two-dimensional matrix")
    output.tofile(output_path)
    return int(output.shape[0]), int(output.shape[1])


def _manifest(
    output_column_names: list[str],
    output_shape: tuple[int, int],
    backend: str,
    metadata: Optional[dict] = None,
    granularity: str = "row-aligned",
) -> dict:
    output_columns, output_rows = output_shape
    if output_columns != len(output_column_names):
        raise ValueError("Scientific output names do not match its matrix shape")
    return {
        "outputColumnNames": output_column_names,
        "outputColumnCount": output_columns,
        "outputRowCount": output_rows,
        "granularity": granularity,
        "metadata": {
            "executionBackend": backend,
            "numpyVersion": np.__version__,
            **(metadata or {}),
        },
    }


def _sample_matrix(columns: np.ndarray) -> np.ndarray:
    samples = np.asarray(columns.T, dtype=np.float64).copy()
    samples[~np.isfinite(samples)] = np.nan
    finite = np.isfinite(samples)
    counts = finite.sum(axis=0)
    sums = np.nansum(samples, axis=0)
    means = np.divide(
        sums,
        counts,
        out=np.zeros(samples.shape[1], dtype=np.float64),
        where=counts > 0,
    )
    missing_rows, missing_columns = np.where(~finite)
    samples[missing_rows, missing_columns] = means[missing_columns]
    return samples


def _run_knn(
    payload: dict,
    columns: np.ndarray,
    column_names: list[str],
    emit_progress: ProgressCallback,
) -> dict:
    from sklearn import __version__ as sklearn_version
    from sklearn.impute import KNNImputer

    emit_progress(0.1, "Preparing KNN neighbor index")
    samples = np.asarray(columns.T, dtype=np.float64).copy()
    samples[~np.isfinite(samples)] = np.nan
    all_missing = np.all(~np.isfinite(samples), axis=0)
    if np.any(all_missing):
        samples[:, all_missing] = 0.0
    neighbors = _bounded_int(payload.get("neighbors"), 5, 1, max(1, samples.shape[0]))
    weighted = bool(payload.get("weighted", True))
    imputer = KNNImputer(
        n_neighbors=neighbors,
        weights="distance" if weighted else "uniform",
    )
    result = imputer.fit_transform(samples)
    emit_progress(0.95, "Writing KNN-imputed matrix")
    shape = _write_matrix(payload, result.T)
    return _manifest(
        [f"{name}_imputed_knn" for name in column_names],
        shape,
        "python-scikit-learn",
        {
            "sklearnVersion": sklearn_version,
            "neighbors": neighbors,
            "weighted": weighted,
            "missingCount": int(np.sum(~np.isfinite(columns))),
        },
    )


def _pca_scores(
    payload: dict,
    columns: np.ndarray,
) -> tuple[np.ndarray, object, str]:
    from sklearn import __version__ as sklearn_version
    from sklearn.decomposition import PCA
    from sklearn.preprocessing import StandardScaler

    samples = _sample_matrix(columns)
    if samples.shape[0] < 2:
        raise ValueError("PCA requires at least two observations")
    requested = _bounded_int(payload.get("numComponents"), 2, 1, 10_000)
    components = min(requested, samples.shape[0], samples.shape[1])
    standardized = StandardScaler(copy=False).fit_transform(samples)
    solver = "randomized" if min(samples.shape) > 500 and components < min(samples.shape) // 2 else "auto"
    estimator = PCA(
        n_components=components,
        svd_solver=solver,
        random_state=_bounded_int(payload.get("seed"), 42, 0, 2**32 - 1),
    )
    return estimator.fit_transform(standardized), estimator, sklearn_version


def _run_pca(
    action: str,
    payload: dict,
    columns: np.ndarray,
    emit_progress: ProgressCallback,
) -> dict:
    emit_progress(0.1, "Computing PCA decomposition")
    scores, estimator, sklearn_version = _pca_scores(payload, columns)
    output = scores.T
    output_names = [
        f"PC{index + 1}_2d" if action == "2d" else f"PC{index + 1}"
        for index in range(output.shape[0])
    ]

    if action == "pca-analysis" and bool(payload.get("performClustering", False)):
        from sklearn.cluster import KMeans

        clusters = _bounded_int(payload.get("clusters"), 3, 1, scores.shape[0])
        assignments = KMeans(
            n_clusters=clusters,
            n_init=10,
            random_state=_bounded_int(payload.get("seed"), 42, 0, 2**32 - 1),
        ).fit_predict(scores)
        output = np.vstack((output, assignments.astype(np.float64)))
        output_names.append("Cluster_Assignment")

    emit_progress(0.95, "Writing PCA scores")
    shape = _write_matrix(payload, output)
    return _manifest(
        output_names,
        shape,
        "python-scikit-learn",
        {
            "sklearnVersion": sklearn_version,
            "explainedVariance": estimator.explained_variance_ratio_.tolist(),
            "components": int(scores.shape[1]),
            "svdSolver": estimator.svd_solver,
        },
        "visualization" if action == "pca-plot" else "row-aligned",
    )


def _run_plsda(payload: dict, columns: np.ndarray, emit_progress: ProgressCallback) -> dict:
    from sklearn import __version__ as sklearn_version
    from sklearn.cross_decomposition import PLSRegression

    samples = _sample_matrix(columns)
    raw_labels = payload.get("labels", [])
    if not isinstance(raw_labels, list) or len(raw_labels) != samples.shape[0]:
        raise ValueError("PLS-DA labels must contain one value per observation")
    labels = np.asarray([str(label) for label in raw_labels], dtype=str)
    if np.any(np.char.str_len(labels) == 0):
        raise ValueError("PLS-DA class labels cannot be empty")
    classes, encoded = np.unique(labels, return_inverse=True)
    if classes.size < 2:
        raise ValueError("PLS-DA requires at least two classes")
    targets = np.eye(classes.size, dtype=np.float64)[encoded]
    components = min(
        _bounded_int(payload.get("numComponents"), 2, 1, 10_000),
        samples.shape[1],
        max(1, samples.shape[0] - 1),
    )
    emit_progress(0.1, "Fitting PLS-DA model")
    estimator = PLSRegression(n_components=components, scale=True, max_iter=500)
    estimator.fit(samples, targets)
    scores = np.asarray(estimator.x_scores_, dtype=np.float64)
    shape = _write_matrix(payload, scores.T)
    return _manifest(
        [f"LV{index + 1}" for index in range(scores.shape[1])],
        shape,
        "python-scikit-learn",
        {
            "sklearnVersion": sklearn_version,
            "components": int(scores.shape[1]),
            "classes": classes.tolist(),
        },
    )


def _run_tsne(payload: dict, columns: np.ndarray, emit_progress: ProgressCallback) -> dict:
    from sklearn import __version__ as sklearn_version
    from sklearn.manifold import TSNE
    from sklearn.preprocessing import StandardScaler

    samples = _sample_matrix(columns)
    if samples.shape[0] < 3:
        raise ValueError("t-SNE requires at least three observations")
    samples = StandardScaler(copy=False).fit_transform(samples)
    dimensions = _bounded_int(payload.get("numDimensions"), 2, 1, 3)
    perplexity = _bounded_float(
        payload.get("perplexity"),
        30.0,
        1.0,
        max(1.0, min(float(samples.shape[0] - 1), (samples.shape[0] - 1) / 3.0)),
    )
    iterations = _bounded_int(payload.get("iterations"), 1000, 250, 5000)
    parameters = {
        "n_components": dimensions,
        "perplexity": perplexity,
        "learning_rate": "auto",
        "init": "pca",
        "random_state": _bounded_int(payload.get("seed"), 42, 0, 2**32 - 1),
        "method": "barnes_hut" if dimensions <= 3 else "exact",
    }
    signature = inspect.signature(TSNE).parameters
    parameters["max_iter" if "max_iter" in signature else "n_iter"] = iterations
    emit_progress(0.05, "Optimizing t-SNE embedding")
    embedding = TSNE(**parameters).fit_transform(samples)
    emit_progress(0.95, "Writing t-SNE embedding")
    shape = _write_matrix(payload, embedding.T)
    return _manifest(
        [f"tSNE{index + 1}" for index in range(dimensions)],
        shape,
        "python-scikit-learn",
        {
            "sklearnVersion": sklearn_version,
            "dimensions": dimensions,
            "perplexity": perplexity,
            "iterations": iterations,
        },
    )


def _run_kmeans(payload: dict, columns: np.ndarray, emit_progress: ProgressCallback) -> dict:
    from sklearn import __version__ as sklearn_version
    from sklearn.cluster import KMeans, MiniBatchKMeans

    samples = _sample_matrix(columns)
    clusters = _bounded_int(payload.get("clusters"), 3, 1, samples.shape[0])
    iterations = _bounded_int(payload.get("maxIterations"), 100, 1, 10_000)
    seed = _bounded_int(payload.get("seed"), 42, 0, 2**32 - 1)
    use_minibatch = samples.shape[0] >= 50_000
    estimator = (
        MiniBatchKMeans(
            n_clusters=clusters,
            max_iter=iterations,
            n_init=10,
            random_state=seed,
            batch_size=min(4096, samples.shape[0]),
        )
        if use_minibatch
        else KMeans(
            n_clusters=clusters,
            max_iter=iterations,
            n_init=10,
            random_state=seed,
        )
    )
    emit_progress(0.1, "Fitting K-means clusters")
    assignments = estimator.fit_predict(samples)
    shape = _write_matrix(payload, assignments.astype(np.float64)[None, :])
    return _manifest(
        ["Cluster_Assignment"],
        shape,
        "python-scikit-learn",
        {
            "sklearnVersion": sklearn_version,
            "clusters": clusters,
            "iterations": int(estimator.n_iter_),
            "inertia": float(estimator.inertia_),
            "algorithm": "mini-batch-k-means" if use_minibatch else "k-means",
        },
    )


def _run_hierarchical(payload: dict, columns: np.ndarray, emit_progress: ProgressCallback) -> dict:
    from sklearn import __version__ as sklearn_version
    from sklearn.cluster import AgglomerativeClustering
    from sklearn.neighbors import kneighbors_graph

    samples = _sample_matrix(columns)
    clusters = _bounded_int(payload.get("clusters"), 3, 1, samples.shape[0])
    linkage = str(payload.get("linkage", "average"))
    if linkage not in {"single", "complete", "average"}:
        linkage = "average"
    emit_progress(0.05, "Building hierarchical clusters")
    connectivity_neighbors = 0
    connectivity = None
    if samples.shape[0] >= 5_000:
        connectivity_neighbors = min(20, samples.shape[0] - 1)
        connectivity = kneighbors_graph(
            samples,
            n_neighbors=connectivity_neighbors,
            include_self=False,
            n_jobs=-1,
        )
        emit_progress(0.25, "Built sparse neighbor graph for clustering")
    estimator = AgglomerativeClustering(
        n_clusters=clusters,
        linkage=linkage,
        connectivity=connectivity,
    )
    assignments = estimator.fit_predict(samples)
    shape = _write_matrix(payload, assignments.astype(np.float64)[None, :])
    return _manifest(
        ["Cluster_Assignment"],
        shape,
        "python-scikit-learn",
        {
            "sklearnVersion": sklearn_version,
            "clusters": clusters,
            "linkage": linkage,
            "observations": int(samples.shape[0]),
            "connectivityNeighbors": connectivity_neighbors,
        },
    )


def _run_correlation(
    payload: dict,
    columns: np.ndarray,
    column_names: list[str],
    emit_progress: ProgressCallback,
) -> dict:
    column_count = columns.shape[0]
    if np.all(np.isfinite(columns)):
        correlations = np.atleast_2d(np.corrcoef(columns))
        correlations[~np.isfinite(correlations)] = 0.0
        emit_progress(1.0, "Correlation matrix complete")
    else:
        correlations = np.zeros((column_count, column_count), dtype=np.float64)
        for left in range(column_count):
            for right in range(left, column_count):
                finite = np.isfinite(columns[left]) & np.isfinite(columns[right])
                if int(finite.sum()) < 2:
                    value = 0.0
                else:
                    left_values = columns[left, finite]
                    right_values = columns[right, finite]
                    if np.std(left_values) <= 0 or np.std(right_values) <= 0:
                        value = 0.0
                    else:
                        value = float(np.corrcoef(left_values, right_values)[0, 1])
                        if not math.isfinite(value):
                            value = 0.0
                correlations[left, right] = value
                correlations[right, left] = value
            emit_progress(
                (left + 1) / column_count,
                f"Correlation column {left + 1}/{column_count}",
            )
    shape = _write_matrix(payload, correlations)
    return _manifest(
        [f"{name}_corr" for name in column_names],
        shape,
        "python-numpy",
        {"correlationMethod": "pairwise-pearson"},
        "visualization",
    )


def _run_quantile(
    payload: dict,
    columns: np.ndarray,
    column_names: list[str],
    emit_progress: ProgressCallback,
) -> dict:
    sorted_observed = [np.sort(column[np.isfinite(column)]) for column in columns]
    maximum_rank = max((values.size for values in sorted_observed), default=0)
    reference = np.zeros(maximum_rank, dtype=np.float64)
    counts = np.zeros(maximum_rank, dtype=np.int64)
    for values in sorted_observed:
        reference[: values.size] += values
        counts[: values.size] += 1
    reference = np.divide(reference, counts, out=reference, where=counts > 0)

    normalized = np.full(columns.shape, np.nan, dtype=np.float64)
    for column_index, column in enumerate(columns):
        observed_indices = np.flatnonzero(np.isfinite(column))
        if observed_indices.size == 0:
            continue
        order = np.argsort(column[observed_indices], kind="mergesort")
        sorted_indices = observed_indices[order]
        sorted_values = column[sorted_indices]
        position = 0
        while position < sorted_values.size:
            end = position
            while end + 1 < sorted_values.size and sorted_values[end + 1] == sorted_values[position]:
                end += 1
            shared_rank = int(math.floor(((position + end) / 2.0) + 0.5))
            normalized[column_index, sorted_indices[position : end + 1]] = reference[shared_rank]
            position = end + 1
        emit_progress(
            (column_index + 1) / columns.shape[0],
            f"Quantile-normalizing column {column_index + 1}/{columns.shape[0]}",
        )
    shape = _write_matrix(payload, normalized)
    return _manifest(
        [f"{name}_quantile" for name in column_names],
        shape,
        "python-numpy",
        {"normalizationMethod": "quantile"},
    )


def run_scientific(payload: dict, emit_progress: ProgressCallback) -> dict:
    action = str(payload.get("action", ""))
    if action == "impute-multiple":
        metadata = run_mice(payload, emit_progress)
        column_names = [str(name) for name in payload.get("columnNames", [])]
        row_count = _bounded_int(payload.get("rowCount"), 0, 1, 2_000_000_000)
        output_names = [f"{name}_mi" for name in column_names]
        return _manifest(
            output_names,
            (len(output_names), row_count),
            "python-numpy",
            {
                **metadata,
                "imputationMethod": metadata["method"],
                "iterationCycleUsed": metadata["iterationsPerformed"],
                "unimputedCount": metadata["missingCount"] - metadata["imputedCount"],
                "columnsPooled": column_names,
                "columnRubinSummary": metadata["columnSummaries"],
                "deterministicSeed": payload.get("reportedSeed"),
            },
        )

    columns, column_names, _ = _load_matrix(payload)
    if action == "impute-knn":
        return _run_knn(payload, columns, column_names, emit_progress)
    if action in {"pca-learning", "pca-plot", "pca-analysis", "2d"}:
        return _run_pca(action, payload, columns, emit_progress)
    if action == "plsda-learning":
        return _run_plsda(payload, columns, emit_progress)
    if action == "tsne-learning":
        return _run_tsne(payload, columns, emit_progress)
    if action in {"k-means-clustering", "k-means-clustering-run"}:
        return _run_kmeans(payload, columns, emit_progress)
    if action in {"hierarchical-clustering", "hierarchical-clustering-run"}:
        return _run_hierarchical(payload, columns, emit_progress)
    if action == "heatmap":
        return _run_correlation(payload, columns, column_names, emit_progress)
    if action == "quantile-normalization":
        return _run_quantile(payload, columns, column_names, emit_progress)
    raise ValueError(f"Unsupported Python scientific action: {action}")
