from __future__ import annotations

from abc import ABC, abstractmethod

from analysis.scientific_actions.contracts import ScientificExecutionContext


class ScientificActionHandler(ABC):
    actions: frozenset[str] = frozenset()

    def supports(self, action: str) -> bool:
        return action in self.actions

    @abstractmethod
    def run(self, context: ScientificExecutionContext) -> dict:
        raise NotImplementedError
