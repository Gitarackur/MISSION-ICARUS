# Local data storage architecture

Icarus continues to use Dexie/IndexedDB as its renderer-side database. The
session model remains reference-based: sessions store IDs, while matrices,
activities, and visualizations are independent records. The logical workflow is
reconstructed from the references between those records rather than persisted
as a separate, duplicative workflow object.

## Matrix storage

Database version 2 stores new matrices as metadata plus row chunks. Within each
chunk, entirely numeric columns are stored as `Float64Array` buffers; mixed and
text columns remain lossless structured values. This reduces numeric storage
overhead and avoids one oversized IndexedDB value or transaction.

Version 1 matrices remain readable. After a legacy matrix is opened, Icarus
queues a background conversion. Chunk creation and metadata replacement happen
in one transaction, so an interrupted conversion leaves the original intact.

Inactive matrices are represented in the session graph by metadata only. Their
payload is loaded when the matrix is selected. Session export deliberately
hydrates every matrix because the existing JSON export format contains the full
session.

## Consistency and capacity

Writes that create a session, a statistical result, or a visualization update
the payload and all session references in one transaction. Quota failures are
reported to the UI without leaving orphaned graph records. The settings panel
shows the storage estimate supplied by the browser and Icarus warns at 80%
usage. Persistent browser storage is requested when supported.

IndexedDB capacity is not a fixed Dexie limit. It is assigned by the browser and
operating system and still depends on available disk space. A quota estimate is
therefore advisory, and an atomic write can still fail cleanly when the browser
cannot grant more space.

## Large-dataset execution

CSV parsing, matrix encoding/decoding, matrix-to-row reconstruction,
proteomics summaries, and user-triggered statistical analyses run in Web
Workers. The preview creates statistical column arrays only when an operation
requests them instead of retaining a second full column-oriented copy.

The selected matrix is still materialized in memory because the current
statistics and visualization engines operate on complete arrays. Chunking makes
storage and inactive-session navigation substantially safer, but a single
matrix larger than available process memory still requires a future streaming
or out-of-process analysis engine. Full-session JSON export has the same
in-memory boundary.

### Hybrid statistical execution

Lightweight statistics and transforms continue to run in the persistent
renderer Web Worker. CPU-intensive numerical and machine-learning actions are
routed to a separate persistent Python analysis process when the bundled
scientific runtime is available. These include MICE and KNN imputation, PCA,
PLS-DA, t-SNE, K-means, hierarchical clustering, and large correlation or
quantile-normalization workloads. Existing TypeScript implementations remain
compatibility fallbacks when the scientific runtime or an optional package is
unavailable.

The Python MICE path writes a column-major `Float64` input to a job-scoped
temporary file and memory-maps it in NumPy. This avoids JSON serialization of
large matrices. Its result uses the same binary layout and is converted to the
application's row-oriented result only once. Independent imputation chains are
parallelized in bounded batches, selected predictors are capped, PMM searches a
sorted donor vector, and pooled results are accumulated without retaining all
completed datasets in memory. Fixed seeds are pooled in stable chain order for
reproducible output.

Other Python actions use NumPy, SciPy, and scikit-learn implementations rather
than JavaScript matrix loops. Large correlation and quantile-normalization jobs
use size thresholds so small inputs do not pay native IPC and file-transport
overhead. PCA uses an appropriate SVD solver, large K-means jobs switch to
mini-batches, and t-SNE and hierarchical clustering use their production
library implementations.

Domain-specific bioinformatics uses a separate persistent R statistics worker.
LIMMA runs the canonical Bioconductor empirical-Bayes pipeline and falls back
to the TypeScript compatibility calculation if `limma` is unavailable. WGCNA
uses the R `WGCNA` package and reports module IDs and connectivity for each
source row; because there is no scientifically equivalent TypeScript fallback,
the UI reports a missing-package error when that package is unavailable. The
bundled R build vendors both packages and their runtime dependencies.

Python, R, and F# renderer/analysis processes use a shared persistent
newline-delimited JSON control protocol. Startup has a bounded readiness check,
but calculations do not have a wall-clock deadline. The Python analysis worker
emits progress and heartbeats, so its silence watchdog measures loss of worker
activity rather than total calculation duration. Process exit and stream errors
reject the active job, and the manager creates a fresh worker on the next
request. Native scientific jobs can also be cancelled explicitly; cancellation
terminates the active native process and the manager starts a clean worker on
the next request.
