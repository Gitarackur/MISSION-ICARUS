/**
 * Proteomics feature roadmap.
 *
 * Every proteomics activity that is not yet implemented ships through the
 * placeholder dialog. This file assigns each of those activities to the
 * nearest upcoming Icarus release so users can see when a feature is planned
 * to become available, and so the next implementation pass knows exactly which
 * activities to promote out of the placeholder set.
 *
 * To add an activity for real:
 *   1. Move its entry from PROTEOMICS_ROADMAP (status "planned") into
 *      PROTEOMICS_ACTIVITY_CONFIGS and mark it "available" here (or delete it).
 *   2. Keep the actionId stable – the menu wiring only depends on the id.
 */

export type ProteomicsActivityStatus =
  | "planned"
  | "in-progress"
  | "available";

export type ProteomicsRoadmapEntry = {
  actionId: string;
  title: string;
  status: ProteomicsActivityStatus;
};

export type ProteomicsRoadmapRelease = {
  version: string;
  /** Short description of the release theme shown in the placeholder dialog. */
  summary: string;
  entries: ProteomicsRoadmapEntry[];
};

/** The version Icarus is currently shipping (kept in sync with package.json). */
export const CURRENT_ICARUS_VERSION = "0.0.150";

export const PROTEOMICS_ROADMAP: ProteomicsRoadmapRelease[] = [
  {
    version: "0.0.151",
    summary: "Data import and annotation basics",
    entries: [
      { actionId: "generic-matrix-upload", title: "Generic matrix upload", status: "planned" },
      { actionId: "binary-upload", title: "Binary upload", status: "planned" },
      { actionId: "create-gene-list", title: "Create gene list", status: "planned" },
      { actionId: "create-random-matrix", title: "Create random matrix", status: "planned" },
      { actionId: "ngs-data-upload", title: "Next generation sequencing data upload", status: "planned" },
      { actionId: "raw-upload", title: "Raw upload", status: "planned" },
      { actionId: "matrix-export", title: "Generic matrix export", status: "planned" },
      { actionId: "add-annotation", title: "Add annotation", status: "planned" },
      { actionId: "annotation-matrix", title: "Annotation matrix", status: "planned" },
      { actionId: "to-base-identifiers", title: "To base identifiers", status: "planned" },
    ],
  },
  {
    version: "0.0.152",
    summary: "Annotation enrichment and category statistics",
    entries: [
      { actionId: "1d-annotation-enrichment", title: "1D annotation enrichment", status: "planned" },
      { actionId: "2d-annotation-enrichment", title: "2D annotation enrichment", status: "planned" },
      { actionId: "average-categories", title: "Average categories", status: "planned" },
      { actionId: "category-counting", title: "Category counting", status: "planned" },
      { actionId: "fisher-exact-test", title: "Fisher exact test", status: "planned" },
      { actionId: "average-groups", title: "Average groups", status: "planned" },
      { actionId: "categorical-annotation-rows", title: "Categorical annotation rows", status: "planned" },
      { actionId: "join-terms-in-categorical-row", title: "Join terms in categorical row", status: "planned" },
      { actionId: "numerical-annotation-rows", title: "Numerical annotation rows", status: "planned" },
      { actionId: "performance-curves", title: "Performance curves", status: "planned" },
      { actionId: "filter-columns-categorical-row", title: "Filter columns based on categorical row", status: "planned" },
    ],
  },
  {
    version: "0.0.153",
    summary: "Classification, modifications and sequence features",
    entries: [
      { actionId: "classification-cross-validation", title: "Classification (cross-validation and prediction)", status: "planned" },
      { actionId: "classification-feature-optimization", title: "Classification feature optimization", status: "planned" },
      { actionId: "classification-parameter-optimization", title: "Classification parameter optimization", status: "planned" },
      { actionId: "add-known-sites", title: "Add known sites", status: "planned" },
      { actionId: "add-linear-motifs", title: "Add linear motifs", status: "planned" },
      { actionId: "add-modification-counts", title: "Add modification counts", status: "planned" },
      { actionId: "add-regulatory-sites", title: "Add regulatory sites", status: "planned" },
      { actionId: "add-sequence-features", title: "Add sequence features", status: "planned" },
      { actionId: "expand-site-table", title: "Expand site table", status: "planned" },
      { actionId: "kinase-substrate-relations", title: "Kinase-substrate relations", status: "planned" },
      { actionId: "shorten-motif-length", title: "Shorten motif length", status: "planned" },
    ],
  },
  {
    version: "0.0.154",
    summary: "Column and text processing",
    entries: [
      { actionId: "change-column-type", title: "Change column type", status: "planned" },
      { actionId: "combine-annotations", title: "Combine annotations", status: "planned" },
      { actionId: "combine-categorical-columns", title: "Combine categorical columns", status: "planned" },
      { actionId: "convert-multi-numeric-column", title: "Convert multi-numeric column", status: "planned" },
      { actionId: "de-hyphenate-ids", title: "De-hyphenate ids", status: "planned" },
      { actionId: "expand-multi-numeric-text-columns", title: "Expand multi-numeric and text columns", status: "planned" },
      { actionId: "fill-categorical-columns", title: "Fill categorical columns", status: "planned" },
      { actionId: "process-text-column", title: "Process text column", status: "planned" },
      { actionId: "search-text-column", title: "Search text column", status: "planned" },
      { actionId: "reorder-columns-numerical-annotation", title: "Reorder columns by numerical annotation row", status: "planned" },
      { actionId: "reorder-remove-annotation-rows", title: "Reorder/remove annotation rows", status: "planned" },
    ],
  },
  {
    version: "0.0.155",
    summary: "Multi-sample statistics and matrix matching",
    entries: [
      { actionId: "two-way-anova", title: "Two-way ANOVA", status: "planned" },
      { actionId: "three-way-anova", title: "Three-way ANOVA", status: "planned" },
      { actionId: "post-hoc-tests", title: "Post hoc tests", status: "planned" },
      { actionId: "multiple-sample-tests", title: "Multiple-sample tests", status: "planned" },
      { actionId: "cyclic-annotation-enrichment", title: "Cyclic annotation enrichment", status: "planned" },
      { actionId: "matching-rows-by-name", title: "Matching rows by name", status: "planned" },
      { actionId: "matching-columns-by-name", title: "Matching columns by name", status: "planned" },
      { actionId: "replace-strings", title: "Replace strings", status: "planned" },
      { actionId: "change-column-names", title: "Change column names", status: "planned" },
      { actionId: "assert-matrix-equals", title: "Assert matrix equals", status: "planned" },
      { actionId: "co-expression-clustering", title: "Co-expression clustering", status: "planned" },
    ],
  },
  {
    version: "0.0.156",
    summary: "Visualization and manual selection",
    entries: [
      { actionId: "numeric-venn-diagram", title: "Numeric venn diagram", status: "planned" },
      { actionId: "select-rows-manually", title: "Select rows manually", status: "planned" },
      { actionId: "sequence-logos", title: "Sequence logos", status: "planned" },
      { actionId: "hawaii-plot", title: "Hawaii plot", status: "planned" },
      { actionId: "3d-plot", title: "3D plot", status: "planned" },
      { actionId: "histogram", title: "Histogram", status: "planned" },
      { actionId: "multi-scatter-plot", title: "Multi scatter plot", status: "planned" },
      { actionId: "profile-plot", title: "Profile plot", status: "planned" },
    ],
  },
];

const PLANNED_RELEASE_BY_ACTION: Map<string, ProteomicsRoadmapRelease> =
  new Map();
PROTEOMICS_ROADMAP.forEach((release) =>
  release.entries.forEach((entry) => {
    if (entry.status !== "available") {
      PLANNED_RELEASE_BY_ACTION.set(entry.actionId, release);
    }
  })
);

/**
 * The release that plans to ship the given activity, or null when the
 * activity is not part of the roadmap (already implemented elsewhere).
 */
export const getPlannedRelease = (
  actionId: string
): ProteomicsRoadmapRelease | null =>
  PLANNED_RELEASE_BY_ACTION.get(actionId) ?? null;

/**
 * The nearest upcoming version that plans to ship the given activity.
 * Falls back to the release after the current one when the id is unknown.
 */
export const getPlannedVersion = (actionId: string): string | null => {
  const release = getPlannedRelease(actionId);
  if (release) return release.version;
  return null;
};

export const NEXT_RELEASE_VERSION = "0.0.151";

/**
 * Dev-time check that keeps the roadmap aligned with the placeholder catalog.
 * Every planned roadmap entry must exist in PLACEHOLDER_ACTIVITIES and every
 * placeholder must be planned on the roadmap, so no activity is forgotten or
 * double-scheduled. Logs (rather than throws) so a stale roadmap never blocks
 * a production build.
 */
export const validateProteomicsRoadmap = (
  placeholderActivities: Record<string, { title: string; notes?: string }>
): void => {
  if (process.env.NODE_ENV === "production") return;

  const placeholderIds = new Set(Object.keys(placeholderActivities));
  const plannedEntries = PROTEOMICS_ROADMAP.flatMap((release) =>
    release.entries
      .filter((entry) => entry.status !== "available")
      .map((entry) => ({ entry, release }))
  );

  plannedEntries.forEach(({ entry, release }) => {
    if (!placeholderIds.has(entry.actionId)) {
      console.warn(
        `[Proteomics roadmap] "${entry.actionId}" is planned for v${release.version} but has no placeholder entry. ` +
          "Promote it to PROTEOMICS_ACTIVITY_CONFIGS or remove it from the roadmap."
      );
    }
  });

  placeholderIds.forEach((actionId) => {
    const planned = plannedEntries.some(
      ({ entry }) => entry.actionId === actionId
    );
    if (!planned) {
      console.warn(
        `[Proteomics roadmap] "${actionId}" is a placeholder but has no roadmap entry. ` +
          "Assign it a nearest release so users know when it will be available."
      );
    }
  });
};
