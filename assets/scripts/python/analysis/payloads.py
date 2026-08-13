from __future__ import annotations

from typing import Dict, List, Literal, Optional, TypedDict, Union


class MatrixPayload(TypedDict):
    """Wire envelope appended by PythonStatisticsManager for every action.

    electron/src/statistics/BinaryScientificWorkerManager injects the input
    matrix (a column-major Float64 file), the output target and the matrix
    shape, while PythonStatisticsManager adds the ``action`` discriminator.
    """

    action: str
    inputPath: str
    outputPath: str
    columnNames: List[str]
    rowCount: int


class MicePayload(MatrixPayload):
    """Options for ``impute-multiple`` built by ScientificOptionsBuilder."""

    method: Literal["pmm", "regression"]
    imputations: int
    maxIterations: int
    seed: int
    reportedSeed: Optional[int]
    maxPredictors: int
    workers: Optional[int]


class KnnImputationPayload(MatrixPayload):
    """Options for ``impute-knn`` built by ScientificOptionsBuilder."""

    neighbors: int
    weighted: bool


class PcaPayload(MatrixPayload):
    """Options for ``pca-learning``, ``pca-plot`` and ``2d`` actions."""

    numComponents: int
    seed: int


class PcaAnalysisPayload(PcaPayload):
    """Options for the ``pca-analysis`` action (adds optional clustering)."""

    performClustering: bool
    clusters: int


class PlsDaPayload(MatrixPayload):
    """Options for ``plsda-learning`` built by ScientificOptionsBuilder."""

    numComponents: int
    labels: List[Union[int, str]]


class TsnePayload(MatrixPayload):
    """Options for ``tsne-learning`` built by ScientificOptionsBuilder."""

    numDimensions: int
    perplexity: Union[int, float]
    iterations: int
    seed: int


class KMeansPayload(MatrixPayload):
    """Options for ``k-means-clustering`` and ``k-means-clustering-run``."""

    clusters: int
    maxIterations: int
    seed: int


class HierarchicalClusteringPayload(MatrixPayload):
    """Options for ``hierarchical-clustering`` and ``-run`` actions."""

    clusters: int
    linkage: str


class HeatmapPayload(MatrixPayload):
    """Zero-option ``heatmap`` action; only the matrix envelope is sent."""


class QuantileNormalizationPayload(MatrixPayload):
    """Zero-option ``quantile-normalization`` action."""


ScientificPayload = Union[
    MicePayload,
    KnnImputationPayload,
    PcaPayload,
    PcaAnalysisPayload,
    PlsDaPayload,
    TsnePayload,
    KMeansPayload,
    HierarchicalClusteringPayload,
    HeatmapPayload,
    QuantileNormalizationPayload,
]

MiceMethodValue = Literal["pmm", "regression"]
LinkageMethodValue = Literal["single", "complete", "average"]