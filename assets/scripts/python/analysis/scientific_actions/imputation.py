from __future__ import annotations

import numpy as np

from analysis.mice import run_mice
from analysis.scientific_actions.base import ScientificActionHandler
from analysis.scientific_actions.contracts import (
    ScientificExecutionContext,
    bounded_int,
)


class MiceImputationHandler(ScientificActionHandler):
    actions = frozenset({"impute-multiple"})

    def run(self, context: ScientificExecutionContext) -> dict:
        metadata = run_mice(context.payload, context.emit_progress)
        column_names = [str(name) for name in context.payload.get("columnNames", [])]
        row_count = bounded_int(
            context.payload.get("rowCount"), 0, 1, 2_000_000_000
        )
        output_names = [f"{name}_mi" for name in column_names]
        return context.manifest(
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
                "deterministicSeed": context.payload.get("reportedSeed"),
            },
        )


class KnnImputationHandler(ScientificActionHandler):
    actions = frozenset({"impute-knn"})

    def run(self, context: ScientificExecutionContext) -> dict:
        from sklearn import __version__ as sklearn_version
        from sklearn.impute import KNNImputer

        matrix = context.matrix
        context.emit_progress(0.1, "Preparing KNN neighbor index")
        samples = np.asarray(matrix.columns.T, dtype=np.float64).copy()
        samples[~np.isfinite(samples)] = np.nan
        all_missing = np.all(~np.isfinite(samples), axis=0)
        if np.any(all_missing):
            samples[:, all_missing] = 0.0
        neighbors = bounded_int(
            context.payload.get("neighbors"), 5, 1, max(1, samples.shape[0])
        )
        weighted = bool(context.payload.get("weighted", True))
        result = KNNImputer(
            n_neighbors=neighbors,
            weights="distance" if weighted else "uniform",
        ).fit_transform(samples)
        context.emit_progress(0.95, "Writing KNN-imputed matrix")
        shape = context.write(result.T)
        return context.manifest(
            [f"{name}_imputed_knn" for name in matrix.column_names],
            shape,
            "python-scikit-learn",
            {
                "sklearnVersion": sklearn_version,
                "neighbors": neighbors,
                "weighted": weighted,
                "missingCount": int(np.sum(~np.isfinite(matrix.columns))),
            },
        )
