from __future__ import annotations

from analysis.payloads import ScientificPayload
from analysis.scientific_actions.contracts import ProgressCallback
from analysis.scientific_actions.registry import ScientificActionRegistry


_SCIENTIFIC_ACTIONS = ScientificActionRegistry.create_default()


def run_scientific(
    payload: ScientificPayload, emit_progress: ProgressCallback
) -> dict:
    """Stable worker entry point backed by class-based action handlers."""
    return _SCIENTIFIC_ACTIONS.run(payload, emit_progress)
