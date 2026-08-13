from __future__ import annotations

from typing import Any, Callable, Dict, List, Literal, Optional, TypedDict, Union


# ===================================================================
# COMMAND NAMES
# The commander script routes on these strings. They are the worker
# side of the names built by electron/src/statistics/*-manager.ts.
# ===================================================================

RendererCommand = Literal["plot", "boxplot", "scatter", "heatmap", "volcano", "pca"]

CommandName = Union[RendererCommand, Literal["call_treasure"]]

StatisticsCommand = Literal["statistics:run"]

WorkerMode = Literal["--worker", "--statistics-worker"]

WORKER_FLAG: Literal["--worker"] = "--worker"
STATISTICS_WORKER_FLAG: Literal["--statistics-worker"] = "--statistics-worker"

STATISTICS_RUN: Literal["statistics:run"] = "statistics:run"

CapabilitiesCommand = Literal["capabilities"]


# ===================================================================
# RENDERER PAYLOAD
# Best-effort shape shared by the plotting commands (PlotCommand,
# BoxPlotCommand, ScatterPlotCommand, HeatmapCommand, VolcanoPlotCommand,
# PCAPlotCommand). Every field is optional because the renderer payloads
# are assembled loosely upstream and parsed with .get() defaults.
# ===================================================================

class RendererDisplaySettings(TypedDict, total=False):
    plotWidth: Union[int, float, None]
    plotHeight: Union[int, float, None]
    plotColors: List[str]
    maxXTicks: int
    maxYTicks: int
    xMaxLabelLength: int
    yMaxLabelLength: int
    autoRotateXLabels: bool
    xTickAngle: float
    yTickAngle: float
    tickFontSize: int
    axisLabelFontSize: int
    pointSize: int
    showGrid: bool
    xAxisLabel: Optional[str]
    yAxisLabel: Optional[str]


class RendererSeries(TypedDict, total=False):
    name: str
    values: List[Union[int, float, str]]


class RendererPayload(TypedDict, total=False):
    title: Optional[str]
    categories: List[str]
    series: List[RendererSeries]
    xAxisLabel: Optional[str]
    yAxisLabel: Optional[str]
    displaySettings: RendererDisplaySettings
    columns: List[str]
    groups: List[str]


# ===================================================================
# WORKER WIRE PROTOCOL
# JSON lines on stdin are WorkerRequest dicts; responses are emitted as
# one of the message shapes below. Mirrors the protocol in
# electron/src/core/PersistentJsonWorker.ts.
# ===================================================================

class WorkerRequest(TypedDict):
    id: int
    command: str
    payload: object


class WorkerReadyMessage(TypedDict):
    type: Literal["ready"]


class WorkerProgressMessage(TypedDict, total=False):
    id: int
    type: Literal["progress"]
    progress: float
    detail: str


class WorkerHeartbeatMessage(TypedDict):
    id: int
    type: Literal["heartbeat"]


class WorkerResultMessage(TypedDict):
    id: int
    ok: Literal[True]
    result: object


class WorkerErrorMessage(TypedDict):
    id: int
    ok: Literal[False]
    error: str


WorkerMessage = Union[
    WorkerReadyMessage,
    WorkerProgressMessage,
    WorkerHeartbeatMessage,
    WorkerResultMessage,
    WorkerErrorMessage,
]


ProgressCallback = Callable[[Optional[float], Optional[str]], None]

RequestHandler = Callable[[Any, ProgressCallback], Dict]