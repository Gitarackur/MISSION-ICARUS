from __future__ import annotations

import math

import numpy as np

from analysis.scientific_actions.base import ScientificActionHandler
from analysis.scientific_actions.contracts import ScientificExecutionContext


class CorrelationMatrixHandler(ScientificActionHandler):
    actions = frozenset({"heatmap"})

    def run(self, context: ScientificExecutionContext) -> dict:
        matrix = context.matrix
        columns = matrix.columns
        column_count = columns.shape[0]
        if np.all(np.isfinite(columns)):
            correlations = np.atleast_2d(np.corrcoef(columns))
            correlations[~np.isfinite(correlations)] = 0.0
            context.emit_progress(1.0, "Correlation matrix complete")
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
                context.emit_progress(
                    (left + 1) / column_count,
                    f"Correlation column {left + 1}/{column_count}",
                )
        shape = context.write(correlations)
        return context.manifest(
            [f"{name}_corr" for name in matrix.column_names],
            shape,
            "python-numpy",
            {"correlationMethod": "pairwise-pearson"},
            "visualization",
        )


class QuantileNormalizationHandler(ScientificActionHandler):
    actions = frozenset({"quantile-normalization"})

    def run(self, context: ScientificExecutionContext) -> dict:
        matrix = context.matrix
        columns = matrix.columns
        sorted_observed = [
            np.sort(column[np.isfinite(column)]) for column in columns
        ]
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
                while (
                    end + 1 < sorted_values.size
                    and sorted_values[end + 1] == sorted_values[position]
                ):
                    end += 1
                shared_rank = int(math.floor(((position + end) / 2.0) + 0.5))
                normalized[
                    column_index, sorted_indices[position : end + 1]
                ] = reference[shared_rank]
                position = end + 1
            context.emit_progress(
                (column_index + 1) / columns.shape[0],
                f"Quantile-normalizing column {column_index + 1}/{columns.shape[0]}",
            )
        shape = context.write(normalized)
        return context.manifest(
            [f"{name}_quantile" for name in matrix.column_names],
            shape,
            "python-numpy",
            {"normalizationMethod": "quantile"},
        )
