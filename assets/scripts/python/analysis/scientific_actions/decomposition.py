from __future__ import annotations

import inspect
from typing import cast

import numpy as np

from analysis.payloads import PcaAnalysisPayload, PcaPayload, PlsDaPayload, TsnePayload
from analysis.scientific_actions.base import ScientificActionHandler
from analysis.scientific_actions.contracts import (
    ScientificExecutionContext,
    bounded_float,
    bounded_int,
    sample_matrix,
)


class PcaHandler(ScientificActionHandler):
    actions = frozenset({"pca-learning", "pca-plot", "pca-analysis", "2d"})

    def run(self, context: ScientificExecutionContext) -> dict:
        from sklearn import __version__ as sklearn_version
        from sklearn.cluster import KMeans
        from sklearn.decomposition import PCA
        from sklearn.preprocessing import StandardScaler

        payload = (
            cast(PcaAnalysisPayload, context.payload)
            if context.action == "pca-analysis"
            else cast(PcaPayload, context.payload)
        )
        samples = sample_matrix(context.matrix.columns)
        if samples.shape[0] < 2:
            raise ValueError("PCA requires at least two observations")
        requested = bounded_int(
            payload.get("numComponents"), 2, 1, 10_000
        )
        components = min(requested, samples.shape[0], samples.shape[1])
        standardized = StandardScaler(copy=False).fit_transform(samples)
        solver = (
            "randomized"
            if min(samples.shape) > 500
            and components < min(samples.shape) // 2
            else "auto"
        )
        estimator = PCA(
            n_components=components,
            svd_solver=solver,
            random_state=bounded_int(
                payload.get("seed"), 42, 0, 2**32 - 1
            ),
        )
        context.emit_progress(0.1, "Computing PCA decomposition")
        scores = estimator.fit_transform(standardized)
        output = scores.T
        output_names = [
            f"PC{index + 1}_2d" if context.action == "2d" else f"PC{index + 1}"
            for index in range(output.shape[0])
        ]

        if context.action == "pca-analysis":
            analysis_payload = cast(PcaAnalysisPayload, payload)
            if bool(
                analysis_payload.get("performClustering", False)
            ):
                clusters = bounded_int(
                    analysis_payload.get("clusters"), 3, 1, scores.shape[0]
                )
                assignments = KMeans(
                    n_clusters=clusters,
                    n_init=10,
                    random_state=bounded_int(
                        analysis_payload.get("seed"), 42, 0, 2**32 - 1
                    ),
                ).fit_predict(scores)
            output = np.vstack((output, assignments.astype(np.float64)))
            output_names.append("Cluster_Assignment")

        context.emit_progress(0.95, "Writing PCA scores")
        shape = context.write(output)
        return context.manifest(
            output_names,
            shape,
            "python-scikit-learn",
            {
                "sklearnVersion": sklearn_version,
                "explainedVariance": estimator.explained_variance_ratio_.tolist(),
                "components": int(scores.shape[1]),
                "svdSolver": estimator.svd_solver,
            },
            "visualization" if context.action == "pca-plot" else "row-aligned",
        )


class PlsDaHandler(ScientificActionHandler):
    actions = frozenset({"plsda-learning"})

    def run(self, context: ScientificExecutionContext) -> dict:
        from sklearn import __version__ as sklearn_version
        from sklearn.cross_decomposition import PLSRegression

        payload = cast(PlsDaPayload, context.payload)
        samples = sample_matrix(context.matrix.columns)
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
            bounded_int(payload.get("numComponents"), 2, 1, 10_000),
            samples.shape[1],
            max(1, samples.shape[0] - 1),
        )
        context.emit_progress(0.1, "Fitting PLS-DA model")
        estimator = PLSRegression(n_components=components, scale=True, max_iter=500)
        estimator.fit(samples, targets)
        scores = np.asarray(estimator.x_scores_, dtype=np.float64)
        shape = context.write(scores.T)
        return context.manifest(
            [f"LV{index + 1}" for index in range(scores.shape[1])],
            shape,
            "python-scikit-learn",
            {
                "sklearnVersion": sklearn_version,
                "components": int(scores.shape[1]),
                "classes": classes.tolist(),
            },
        )


class TsneHandler(ScientificActionHandler):
    actions = frozenset({"tsne-learning"})

    def run(self, context: ScientificExecutionContext) -> dict:
        from sklearn import __version__ as sklearn_version
        from sklearn.manifold import TSNE
        from sklearn.preprocessing import StandardScaler

        payload = cast(TsnePayload, context.payload)
        samples = sample_matrix(context.matrix.columns)
        if samples.shape[0] < 3:
            raise ValueError("t-SNE requires at least three observations")
        samples = StandardScaler(copy=False).fit_transform(samples)
        dimensions = bounded_int(
            payload.get("numDimensions"), 2, 1, 3
        )
        perplexity = bounded_float(
            payload.get("perplexity"),
            30.0,
            1.0,
            max(
                1.0,
                min(float(samples.shape[0] - 1), (samples.shape[0] - 1) / 3.0),
            ),
        )
        iterations = bounded_int(
            payload.get("iterations"), 1000, 250, 5000
        )
        parameters = {
            "n_components": dimensions,
            "perplexity": perplexity,
            "learning_rate": "auto",
            "init": "pca",
            "random_state": bounded_int(
                payload.get("seed"), 42, 0, 2**32 - 1
            ),
            "method": "barnes_hut" if dimensions <= 3 else "exact",
        }
        signature = inspect.signature(TSNE).parameters
        parameters["max_iter" if "max_iter" in signature else "n_iter"] = iterations
        context.emit_progress(0.05, "Optimizing t-SNE embedding")
        embedding = TSNE(**parameters).fit_transform(samples)
        context.emit_progress(0.95, "Writing t-SNE embedding")
        shape = context.write(embedding.T)
        return context.manifest(
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
