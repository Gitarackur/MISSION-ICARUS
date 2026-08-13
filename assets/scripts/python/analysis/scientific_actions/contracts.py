from __future__ import annotations

import math
from dataclasses import dataclass, field
from pathlib import Path
from typing import Callable, Optional

import numpy as np


ProgressCallback = Callable[[Optional[float], Optional[str]], None]


def bounded_int(value, fallback: int, minimum: int, maximum: int) -> int:
    try:
        parsed = int(value)
    except (TypeError, ValueError):
        parsed = fallback
    return max(minimum, min(maximum, parsed))


def bounded_float(value, fallback: float, minimum: float, maximum: float) -> float:
    try:
        parsed = float(value)
    except (TypeError, ValueError):
        parsed = fallback
    if not math.isfinite(parsed):
        parsed = fallback
    return max(minimum, min(maximum, parsed))


@dataclass(frozen=True)
class ScientificMatrix:
    columns: np.ndarray
    column_names: list[str]
    row_count: int


class BinaryMatrixStore:
    @staticmethod
    def _required_path(payload: dict, key: str) -> Path:
        value = payload.get(key)
        if not isinstance(value, str) or not value:
            raise ValueError(f"{key} is required")
        return Path(value).expanduser().resolve()

    def load(self, payload: dict) -> ScientificMatrix:
        input_path = self._required_path(payload, "inputPath")
        if not input_path.is_file():
            raise ValueError("Scientific input file does not exist")

        raw_column_names = payload.get("columnNames")
        if not isinstance(raw_column_names, list) or not raw_column_names:
            raise ValueError("At least one numeric input column is required")
        column_names = [str(name) for name in raw_column_names]
        row_count = bounded_int(payload.get("rowCount"), 0, 1, 2_000_000_000)
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
        return ScientificMatrix(np.asarray(mapped), column_names, row_count)

    def write(self, payload: dict, columns: np.ndarray) -> tuple[int, int]:
        output_path = self._required_path(payload, "outputPath")
        output = np.asarray(columns, dtype="<f8", order="C")
        if output.ndim != 2:
            raise ValueError("Scientific output must be a two-dimensional matrix")
        output.tofile(output_path)
        return int(output.shape[0]), int(output.shape[1])

    @staticmethod
    def manifest(
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


@dataclass
class ScientificExecutionContext:
    payload: dict
    emit_progress: ProgressCallback
    store: BinaryMatrixStore
    _matrix: Optional[ScientificMatrix] = field(default=None, init=False)

    @property
    def action(self) -> str:
        return str(self.payload.get("action", ""))

    @property
    def matrix(self) -> ScientificMatrix:
        if self._matrix is None:
            self._matrix = self.store.load(self.payload)
        return self._matrix

    def write(self, columns: np.ndarray) -> tuple[int, int]:
        return self.store.write(self.payload, columns)

    def manifest(
        self,
        output_column_names: list[str],
        output_shape: tuple[int, int],
        backend: str,
        metadata: Optional[dict] = None,
        granularity: str = "row-aligned",
    ) -> dict:
        return self.store.manifest(
            output_column_names,
            output_shape,
            backend,
            metadata,
            granularity,
        )


def sample_matrix(columns: np.ndarray) -> np.ndarray:
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
