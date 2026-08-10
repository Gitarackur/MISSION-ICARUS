import { useState } from "react";
import { AlertTriangle, LoaderCircle, Trash2 } from "lucide-react";
import type { IcarusSession } from "@/domain/session";
import deleteSessionModalStyles from "./variants/delete-session-modal.variants";

export function SessionDeletionConfirmation({
  session,
  onCancel,
  onConfirm,
}: {
  session: IcarusSession;
  onCancel: () => void;
  onConfirm: () => Promise<void>;
}) {
  const styles = deleteSessionModalStyles();
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState("");
  const recordCount =
    session.matrixIds.length +
    session.activityIds.length +
    session.visualizationIds.length;

  const confirm = async () => {
    setIsDeleting(true);
    setError("");
    try {
      await onConfirm();
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "The deletion could not be completed. No changes were committed."
      );
      setIsDeleting(false);
    }
  };

  return (
    <div className={styles.container()}>
      <div className={styles.warningBlock()}>
        <div className={styles.warningContent()}>
          <AlertTriangle className={styles.warningIcon()} />
          <div className={styles.warningBody()}>
            <p className={styles.warningTitle()}>
              Delete this session and all of its data?
            </p>
            <p className={styles.warningText()}>
              Deleting a session permanently removes its matrices, activities,
              and saved visualizations in one atomic operation. This cannot be
              undone.
            </p>
          </div>
        </div>
      </div>

      <div>
        <div className={styles.label()}>Session</div>
        <code className={styles.sessionName()}>
          {session.name || session.id}
        </code>
      </div>

      <div className={styles.statsGrid()}>
        <div className={styles.statCard()}>
          <div className={styles.statValue()}>{session.matrixIds.length}</div>
          <div className={styles.statLabel()}>Matrices</div>
        </div>
        <div className={styles.statCard()}>
          <div className={styles.statValue()}>{session.activityIds.length}</div>
          <div className={styles.statLabel()}>Activities</div>
        </div>
        <div className={styles.statCard()}>
          <div className={styles.statValue()}>
            {session.visualizationIds.length}
          </div>
          <div className={styles.statLabel()}>Visualizations</div>
        </div>
      </div>

      <p className={styles.recordCount()}>
        {recordCount} {recordCount === 1 ? "record" : "records"} will be
        removed in one atomic operation. This cannot be undone.
      </p>

      {error && (
        <div role="alert" className={styles.errorAlert()}>
          {error}
        </div>
      )}

      <div className={styles.actions()}>
        <button
          type="button"
          onClick={onCancel}
          disabled={isDeleting}
          className={styles.cancelButton()}
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={confirm}
          disabled={isDeleting}
          className={styles.deleteButton()}
        >
          {isDeleting ? (
            <LoaderCircle className={styles.buttonIcon()} />
          ) : (
            <Trash2 className={styles.buttonIcon()} />
          )}
          {isDeleting ? "Deleting…" : "Delete session"}
        </button>
      </div>
    </div>
  );
}