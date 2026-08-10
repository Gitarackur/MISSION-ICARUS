import { useState } from "react";
import { AlertTriangle, LoaderCircle, Trash2 } from "lucide-react";
import type { DeletionPlan } from "@/app-layer/database/deletion";
import deletionConfirmationStyles from "./variants/deletion-confirmation.variants";

const entityLabels: Record<DeletionPlan["targetType"], string> = {
  matrix: "matrix",
  activity: "activity",
  visualization: "visualization",
};

const getWarningText = (plan: DeletionPlan) => {
  if (plan.targetType === "matrix" && plan.isSourceMatrix) {
    return "This is a source matrix. Dependent activities, generated matrices, and saved visualizations must be removed with it so no surviving record points to missing data.";
  }

  if (plan.targetType === "matrix") {
    return "No downstream matrix or visualization depends on this matrix. Its producing activity metadata will also be cleaned up when applicable.";
  }

  if (plan.targetType === "activity") {
    return "The activity's output matrix and every downstream result that relies on it will be removed together.";
  }

  return "The saved visualization will be removed. Its dedicated creation activity will also be cleaned up when nothing else uses it.";
};

export function DeletionConfirmation({
  plan,
  onCancel,
  onConfirm,
}: {
  plan: DeletionPlan;
  onCancel: () => void;
  onConfirm: () => Promise<void>;
}) {
  const styles = deletionConfirmationStyles();
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState("");
  const entityLabel = entityLabels[plan.targetType];
  const recordCount =
    plan.matrixIds.length +
    plan.activityIds.length +
    plan.visualizationIds.length;

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
      <div
        className={styles.warningBlock({
          tone: plan.isSourceMatrix ? "source" : "default",
        })}
      >
        <div className={styles.warningContent()}>
          <AlertTriangle className={styles.warningIcon()} />
          <div className={styles.warningBody()}>
            <p className={styles.warningTitle()}>
              {plan.isSourceMatrix
                ? "Deleting this source matrix will cascade"
                : `Delete this ${entityLabel}?`}
            </p>
            <p className={styles.warningText()}>{getWarningText(plan)}</p>
          </div>
        </div>
      </div>

      <div>
        <div className={styles.label()}>Selected {entityLabel}</div>
        <code className={styles.targetId()}>{plan.targetId}</code>
      </div>

      <div className={styles.statsGrid()}>
        <div className={styles.statCard()}>
          <div className={styles.statValue()}>{plan.matrixIds.length}</div>
          <div className={styles.statLabel()}>Matrices</div>
        </div>
        <div className={styles.statCard()}>
          <div className={styles.statValue()}>{plan.activityIds.length}</div>
          <div className={styles.statLabel()}>Activities</div>
        </div>
        <div className={styles.statCard()}>
          <div className={styles.statValue()}>
            {plan.visualizationIds.length}
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
          {isDeleting ? "Deleting…" : `Delete ${entityLabel}`}
        </button>
      </div>
    </div>
  );
}
