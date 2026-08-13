from __future__ import annotations

import numpy as np

from analysis.scientific_actions.base import ScientificActionHandler
from analysis.scientific_actions.contracts import (
    ScientificExecutionContext,
    bounded_int,
    sample_matrix,
)


class KMeansHandler(ScientificActionHandler):
    actions = frozenset({"k-means-clustering", "k-means-clustering-run"})

    def run(self, context: ScientificExecutionContext) -> dict:
        from sklearn import __version__ as sklearn_version
        from sklearn.cluster import KMeans, MiniBatchKMeans

        samples = sample_matrix(context.matrix.columns)
        clusters = bounded_int(
            context.payload.get("clusters"), 3, 1, samples.shape[0]
        )
        iterations = bounded_int(
            context.payload.get("maxIterations"), 100, 1, 10_000
        )
        seed = bounded_int(context.payload.get("seed"), 42, 0, 2**32 - 1)
        use_minibatch = samples.shape[0] >= 50_000
        estimator = (
            MiniBatchKMeans(
                n_clusters=clusters,
                max_iter=iterations,
                n_init=10,
                random_state=seed,
                batch_size=min(4096, samples.shape[0]),
            )
            if use_minibatch
            else KMeans(
                n_clusters=clusters,
                max_iter=iterations,
                n_init=10,
                random_state=seed,
            )
        )
        context.emit_progress(0.1, "Fitting K-means clusters")
        assignments = estimator.fit_predict(samples)
        shape = context.write(assignments.astype(np.float64)[None, :])
        return context.manifest(
            ["Cluster_Assignment"],
            shape,
            "python-scikit-learn",
            {
                "sklearnVersion": sklearn_version,
                "clusters": clusters,
                "iterations": int(estimator.n_iter_),
                "inertia": float(estimator.inertia_),
                "algorithm": "mini-batch-k-means" if use_minibatch else "k-means",
            },
        )


class HierarchicalClusteringHandler(ScientificActionHandler):
    actions = frozenset(
        {"hierarchical-clustering", "hierarchical-clustering-run"}
    )

    def run(self, context: ScientificExecutionContext) -> dict:
        from sklearn import __version__ as sklearn_version
        from sklearn.cluster import AgglomerativeClustering
        from sklearn.neighbors import kneighbors_graph

        samples = sample_matrix(context.matrix.columns)
        clusters = bounded_int(
            context.payload.get("clusters"), 3, 1, samples.shape[0]
        )
        linkage = str(context.payload.get("linkage", "average"))
        if linkage not in {"single", "complete", "average"}:
            linkage = "average"
        context.emit_progress(0.05, "Building hierarchical clusters")
        connectivity_neighbors = 0
        connectivity = None
        if samples.shape[0] >= 5_000:
            connectivity_neighbors = min(20, samples.shape[0] - 1)
            connectivity = kneighbors_graph(
                samples,
                n_neighbors=connectivity_neighbors,
                include_self=False,
                n_jobs=-1,
            )
            context.emit_progress(0.25, "Built sparse neighbor graph for clustering")
        assignments = AgglomerativeClustering(
            n_clusters=clusters,
            linkage=linkage,
            connectivity=connectivity,
        ).fit_predict(samples)
        shape = context.write(assignments.astype(np.float64)[None, :])
        return context.manifest(
            ["Cluster_Assignment"],
            shape,
            "python-scikit-learn",
            {
                "sklearnVersion": sklearn_version,
                "clusters": clusters,
                "linkage": linkage,
                "observations": int(samples.shape[0]),
                "connectivityNeighbors": connectivity_neighbors,
            },
        )
