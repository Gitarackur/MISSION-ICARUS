from __future__ import annotations

from collections.abc import Iterable

from analysis.scientific_actions.base import ScientificActionHandler
from analysis.scientific_actions.clustering import (
    HierarchicalClusteringHandler,
    KMeansHandler,
)
from analysis.scientific_actions.contracts import (
    BinaryMatrixStore,
    ProgressCallback,
    ScientificExecutionContext,
)
from analysis.scientific_actions.decomposition import PcaHandler, PlsDaHandler, TsneHandler
from analysis.scientific_actions.imputation import (
    KnnImputationHandler,
    MiceImputationHandler,
)
from analysis.scientific_actions.matrix_operations import (
    CorrelationMatrixHandler,
    QuantileNormalizationHandler,
)


class ScientificActionRegistry:
    def __init__(
        self,
        handlers: Iterable[ScientificActionHandler],
        store: BinaryMatrixStore | None = None,
    ) -> None:
        self._store = store or BinaryMatrixStore()
        self._handlers: dict[str, ScientificActionHandler] = {}
        for handler in handlers:
            for action in handler.actions:
                if action in self._handlers:
                    raise ValueError(f"Duplicate scientific action handler: {action}")
                self._handlers[action] = handler

    def run(self, payload: dict, emit_progress: ProgressCallback) -> dict:
        action = str(payload.get("action", ""))
        handler = self._handlers.get(action)
        if handler is None:
            raise ValueError(f"Unsupported Python scientific action: {action}")
        return handler.run(
            ScientificExecutionContext(payload, emit_progress, self._store)
        )

    @classmethod
    def create_default(cls) -> "ScientificActionRegistry":
        return cls(
            [
                MiceImputationHandler(),
                KnnImputationHandler(),
                PcaHandler(),
                PlsDaHandler(),
                TsneHandler(),
                KMeansHandler(),
                HierarchicalClusteringHandler(),
                CorrelationMatrixHandler(),
                QuantileNormalizationHandler(),
            ]
        )
