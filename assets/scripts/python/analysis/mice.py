from __future__ import annotations

import math
import os
import threading
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path
from typing import Callable, Optional

import numpy as np


ProgressCallback = Callable[[Optional[float], Optional[str]], None]


def _bounded_int(value, fallback: int, minimum: int, maximum: int) -> int:
    try:
        parsed = int(value)
    except (TypeError, ValueError):
        parsed = fallback
    return max(minimum, min(maximum, parsed))


def _safe_float(value, fallback: float = 0.0) -> float:
    try:
        parsed = float(value)
    except (TypeError, ValueError):
        return fallback
    return parsed if math.isfinite(parsed) else fallback


def _validate_path(raw_path, label: str) -> Path:
    if not isinstance(raw_path, str) or not raw_path:
        raise ValueError(f"{label} path is required")
    path = Path(raw_path).expanduser().resolve()
    if path.parent == path:
        raise ValueError(f"Invalid {label} path")
    return path


def _predictor_indices(
    initialized: np.ndarray,
    target_index: int,
    maximum_predictors: int,
) -> np.ndarray:
    column_count, row_count = initialized.shape
    if column_count <= 1:
        return np.empty(0, dtype=np.intp)

    target = initialized[target_index]
    target_centered = target - target.mean()
    target_norm = np.linalg.norm(target_centered)
    if target_norm <= 0:
        candidates = np.delete(np.arange(column_count), target_index)
        return candidates[:maximum_predictors]

    centered = initialized - initialized.mean(axis=1, keepdims=True)
    norms = np.linalg.norm(centered, axis=1)
    denominators = norms * target_norm
    correlations = np.zeros(column_count, dtype=np.float64)
    valid = denominators > 0
    correlations[valid] = np.abs(
        centered[valid] @ target_centered / denominators[valid]
    )
    correlations[target_index] = -1.0

    count = min(maximum_predictors, column_count - 1)
    if count <= 0:
        return np.empty(0, dtype=np.intp)
    if count == column_count - 1:
        selected = np.delete(np.arange(column_count), target_index)
    else:
        selected = np.argpartition(correlations, -count)[-count:]
    return selected[np.argsort(correlations[selected])[::-1]]


def _fit_regression(
    target: np.ndarray,
    predictors: np.ndarray,
) -> tuple[np.ndarray, np.ndarray, np.ndarray, float, int, np.ndarray]:
    means = predictors.mean(axis=1)
    standard_deviations = predictors.std(axis=1, ddof=1)
    standard_deviations[
        ~np.isfinite(standard_deviations) | (standard_deviations <= 0)
    ] = 1.0
    standardized = ((predictors.T - means) / standard_deviations)
    design = np.column_stack((np.ones(target.shape[0]), standardized))

    # NumPy's LAPACK-backed least-squares implementation avoids the unstable,
    # allocation-heavy Gauss-Jordan normal-equation path used by the TS engine.
    beta, *_ = np.linalg.lstsq(design, target, rcond=None)
    residuals = target - design @ beta
    degrees_of_freedom = max(0, target.shape[0] - design.shape[1])
    residual_sum_squares = float(residuals @ residuals)
    residual_std = (
        math.sqrt(residual_sum_squares / degrees_of_freedom)
        if degrees_of_freedom > 0
        else 0.0
    )
    return beta, means, standard_deviations, residual_std, degrees_of_freedom, design


def _pmm_draws(
    rng: np.random.Generator,
    observed_predictions: np.ndarray,
    observed_values: np.ndarray,
    missing_predictions: np.ndarray,
    donor_count: int = 5,
) -> np.ndarray:
    order = np.argsort(observed_predictions)
    sorted_predictions = observed_predictions[order]
    sorted_values = observed_values[order]
    k = min(donor_count, sorted_predictions.size)
    output = np.empty(missing_predictions.size, dtype=np.float64)

    # Search only around the insertion point in the sorted prediction vector.
    # This changes donor matching from O(missing * observed) to approximately
    # O(observed log observed + missing log observed).
    insertion_points = np.searchsorted(sorted_predictions, missing_predictions)
    for output_index, (prediction, insertion) in enumerate(
        zip(missing_predictions, insertion_points)
    ):
        lower = max(0, int(insertion) - k)
        upper = min(sorted_predictions.size, int(insertion) + k + 1)
        candidates = np.arange(lower, upper)
        distances = np.abs(sorted_predictions[candidates] - prediction)
        if candidates.size > k:
            candidates = candidates[np.argpartition(distances, k - 1)[:k]]
        output[output_index] = sorted_values[int(rng.choice(candidates))]
    return output


def _impute_chain(
    data: np.ndarray,
    missing_mask: np.ndarray,
    initialized: np.ndarray,
    predictors_by_target: dict[int, np.ndarray],
    method: str,
    iterations: int,
    seed_sequence: np.random.SeedSequence,
    report_column_complete: Callable[[], None],
) -> tuple[np.ndarray, np.ndarray, np.ndarray]:
    rng = np.random.default_rng(seed_sequence)
    work = initialized.copy()
    target_indices = np.array(list(predictors_by_target), dtype=np.intp)

    for _ in range(iterations):
        for target_index in rng.permutation(target_indices):
            missing_rows = np.flatnonzero(missing_mask[target_index])
            if missing_rows.size == 0:
                report_column_complete()
                continue

            predictor_indices = predictors_by_target[int(target_index)]
            if predictor_indices.size == 0:
                report_column_complete()
                continue

            observed_rows = np.flatnonzero(~missing_mask[target_index])
            if observed_rows.size < 2:
                report_column_complete()
                continue

            observed_predictors = work[predictor_indices][:, observed_rows]
            observed_target = data[target_index, observed_rows]
            (
                beta,
                means,
                standard_deviations,
                residual_std,
                degrees_of_freedom,
                design,
            ) = _fit_regression(observed_target, observed_predictors)

            missing_predictors = work[predictor_indices][:, missing_rows]
            missing_design = np.column_stack(
                (
                    np.ones(missing_rows.size),
                    (missing_predictors.T - means) / standard_deviations,
                )
            )

            if method == "regression":
                posterior_beta = beta
                posterior_sigma = residual_std
                if degrees_of_freedom > 0 and residual_std > 0:
                    chi_squared = rng.chisquare(degrees_of_freedom)
                    if chi_squared > 0:
                        posterior_sigma = residual_std * math.sqrt(
                            degrees_of_freedom / chi_squared
                        )
                    gram = design.T @ design
                    gram[1:, 1:] += np.eye(gram.shape[0] - 1) * 1e-4
                    covariance = np.linalg.pinv(gram) * (posterior_sigma**2)
                    posterior_beta = rng.multivariate_normal(
                        beta, covariance, check_valid="ignore"
                    )
                draws = missing_design @ posterior_beta
                if posterior_sigma > 0:
                    draws += rng.normal(0.0, posterior_sigma, missing_rows.size)
                work[target_index, missing_rows] = draws
            else:
                observed_predictions = design @ beta
                missing_predictions = missing_design @ beta
                work[target_index, missing_rows] = _pmm_draws(
                    rng,
                    observed_predictions,
                    observed_target,
                    missing_predictions,
                )

            report_column_complete()

    estimates = np.nanmean(work, axis=1)
    finite_counts = np.sum(np.isfinite(work), axis=1)
    variances = np.nanvar(work, axis=1, ddof=1)
    within_variances = np.divide(
        variances,
        finite_counts,
        out=np.zeros_like(variances),
        where=finite_counts > 0,
    )
    return work, estimates, within_variances


def run_mice(payload: dict, emit_progress: ProgressCallback) -> dict:
    input_path = _validate_path(payload.get("inputPath"), "input")
    output_path = _validate_path(payload.get("outputPath"), "output")
    if not input_path.is_file():
        raise ValueError("MICE input file does not exist")

    column_names = payload.get("columnNames")
    if not isinstance(column_names, list) or len(column_names) < 2:
        raise ValueError("MICE requires at least two numeric columns")
    column_names = [str(name) for name in column_names]
    column_count = len(column_names)
    row_count = _bounded_int(payload.get("rowCount"), 0, 1, 2_000_000_000)
    expected_bytes = column_count * row_count * np.dtype("<f8").itemsize
    if input_path.stat().st_size != expected_bytes:
        raise ValueError("MICE input buffer size does not match its matrix shape")

    method = "regression" if payload.get("method") == "regression" else "pmm"
    imputations = _bounded_int(payload.get("imputations"), 5, 2, 50)
    iterations = _bounded_int(payload.get("maxIterations"), 10, 1, 100)
    maximum_predictors = _bounded_int(
        payload.get("maxPredictors"), 30, 1, max(1, column_count - 1)
    )
    seed = _bounded_int(payload.get("seed"), 42, 0, 2**32 - 1)
    requested_workers = _bounded_int(payload.get("workers"), 0, 0, 64)
    available_workers = max(1, (os.cpu_count() or 2) - 1)
    worker_count = min(
        imputations,
        requested_workers or available_workers,
        4,
    )

    mapped = np.memmap(
        input_path,
        dtype="<f8",
        mode="r",
        shape=(column_count, row_count),
        order="C",
    )
    data = np.asarray(mapped)
    missing_mask = ~np.isfinite(data)
    missing_count = int(missing_mask.sum())

    finite_counts = np.sum(~missing_mask, axis=1)
    finite_sums = np.nansum(np.where(np.isfinite(data), data, np.nan), axis=1)
    initial_values = np.divide(
        finite_sums,
        finite_counts,
        out=np.zeros(column_count, dtype=np.float64),
        where=finite_counts > 0,
    )
    initialized = np.where(missing_mask, initial_values[:, None], data)

    target_indices = np.flatnonzero(np.any(missing_mask, axis=1))
    predictors_by_target = {
        int(target): _predictor_indices(
            initialized, int(target), maximum_predictors
        )
        for target in target_indices
    }

    if missing_count == 0:
        pooled = np.array(data, dtype="<f8", copy=True)
        pooled.tofile(output_path)
        summaries = []
        for column_index, name in enumerate(column_names):
            column = data[column_index]
            variance = float(np.var(column, ddof=1)) if row_count > 1 else 0.0
            summaries.append(
                {
                    "columnName": name,
                    "observedCount": row_count,
                    "missingCount": 0,
                    "missingRatio": 0.0,
                    "qbar": float(np.mean(column)),
                    "withinVariance": variance / row_count,
                    "betweenVariance": 0.0,
                    "totalVariance": variance / row_count,
                    "relativeIncreaseVariance": 0.0,
                    "fractionMissingInfo": 0.0,
                    "nu": row_count - 1,
                }
            )
        return {
            "method": method,
            "imputations": imputations,
            "maxIterations": iterations,
            "iterationsPerformed": 0,
            "missingCount": 0,
            "imputedCount": 0,
            "columnSummaries": summaries,
            "workers": worker_count,
            "numpyVersion": np.__version__,
        }

    total_column_work = max(1, imputations * iterations * len(target_indices))
    completed_column_work = 0
    progress_lock = threading.Lock()

    def report_column_complete():
        nonlocal completed_column_work
        with progress_lock:
            completed_column_work += 1
            completed = completed_column_work
        emit_progress(
            completed / total_column_work,
            f"MICE column fit {completed}/{total_column_work}",
        )

    pooled_sum = np.zeros((column_count, row_count), dtype=np.float64)
    pooled_count = np.zeros((column_count, row_count), dtype=np.uint16)
    estimates = np.full((imputations, column_count), np.nan, dtype=np.float64)
    within_variances = np.zeros((imputations, column_count), dtype=np.float64)
    seed_sequences = np.random.SeedSequence(seed).spawn(imputations)

    with ThreadPoolExecutor(
        max_workers=worker_count,
        thread_name_prefix="icarus-mice",
    ) as executor:
        # Submit bounded batches so at most `worker_count` complete matrices
        # exist at once. Results are pooled in stable chain-index order, making
        # fixed-seed runs bit-for-bit reproducible despite parallel execution.
        for batch_start in range(0, imputations, worker_count):
            batch = []
            for chain_index in range(
                batch_start, min(imputations, batch_start + worker_count)
            ):
                batch.append(
                    (
                        chain_index,
                        executor.submit(
                            _impute_chain,
                            data,
                            missing_mask,
                            initialized,
                            predictors_by_target,
                            method,
                            iterations,
                            seed_sequences[chain_index],
                            report_column_complete,
                        ),
                    )
                )
            for chain_index, future in batch:
                complete, chain_estimates, chain_within = future.result()
                finite = np.isfinite(complete)
                pooled_sum[finite] += complete[finite]
                pooled_count[finite] += 1
                estimates[chain_index] = chain_estimates
                within_variances[chain_index] = chain_within

    pooled = np.divide(
        pooled_sum,
        pooled_count,
        out=np.full_like(pooled_sum, np.nan),
        where=pooled_count > 0,
    )
    pooled[~missing_mask] = data[~missing_mask]
    pooled.astype("<f8", copy=False).tofile(output_path)

    summaries = []
    for column_index, name in enumerate(column_names):
        finite_estimates = estimates[:, column_index]
        finite_estimates = finite_estimates[np.isfinite(finite_estimates)]
        qbar = float(np.mean(finite_estimates)) if finite_estimates.size else 0.0
        u_bar = float(np.mean(within_variances[:, column_index]))
        between = (
            float(np.var(finite_estimates, ddof=1))
            if finite_estimates.size > 1
            else 0.0
        )
        total_variance = u_bar + (1.0 + 1.0 / imputations) * between
        relative_increase = (
            ((1.0 + 1.0 / imputations) * between / u_bar)
            if u_bar > 0
            else 0.0
        )
        fraction_missing = (
            (relative_increase + 2.0 / (max(1, finite_counts[column_index]) + 3.0))
            / (relative_increase + 1.0)
            if relative_increase > 0
            else 0.0
        )
        degrees_of_freedom = (
            (imputations - 1) * (1.0 + 1.0 / relative_increase) ** 2
            if relative_increase > 0
            else max(0, int(finite_counts[column_index]) - 1)
        )
        column_missing_count = int(missing_mask[column_index].sum())
        summaries.append(
            {
                "columnName": name,
                "observedCount": int(finite_counts[column_index]),
                "missingCount": column_missing_count,
                "missingRatio": column_missing_count / row_count,
                "qbar": qbar,
                "withinVariance": u_bar,
                "betweenVariance": between,
                "totalVariance": total_variance,
                "relativeIncreaseVariance": relative_increase,
                "fractionMissingInfo": min(1.0, max(0.0, fraction_missing)),
                "nu": degrees_of_freedom,
            }
        )

    imputed_count = int(np.sum(missing_mask & np.isfinite(pooled)))
    emit_progress(1.0, "MICE pooling complete")
    return {
        "method": method,
        "imputations": imputations,
        "maxIterations": iterations,
        "iterationsPerformed": iterations,
        "missingCount": missing_count,
        "imputedCount": imputed_count,
        "columnSummaries": summaries,
        "workers": worker_count,
        "maximumPredictors": maximum_predictors,
        "numpyVersion": np.__version__,
    }
