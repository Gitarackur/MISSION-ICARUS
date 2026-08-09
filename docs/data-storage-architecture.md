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
