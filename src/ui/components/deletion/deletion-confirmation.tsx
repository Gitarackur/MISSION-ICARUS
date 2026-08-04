import { useState } from "react";
import { AlertTriangle, LoaderCircle, Trash2 } from "lucide-react";
import type { DeletionPlan } from "@/app-layer/database/deletion";

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
    <div className="space-y-5">
      <div
        className={`rounded-lg border p-4 ${
          plan.isSourceMatrix
            ? "border-amber-300 bg-amber-50 text-amber-950 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-100"
            : "border-gray-200 bg-gray-50 text-gray-800 dark:border-gray-700 dark:bg-gray-800/60 dark:text-gray-100"
        }`}
      >
        <div className="flex items-start gap-3">
          <AlertTriangle className="mt-0.5 h-5 w-5 flex-shrink-0 text-amber-600 dark:text-amber-400" />
          <div className="space-y-2">
            <p className="font-semibold">
              {plan.isSourceMatrix
                ? "Deleting this source matrix will cascade"
                : `Delete this ${entityLabel}?`}
            </p>
            <p className="text-sm leading-6">{getWarningText(plan)}</p>
          </div>
        </div>
      </div>

      <div>
        <div className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
          Selected {entityLabel}
        </div>
        <code className="mt-1 block break-all rounded bg-gray-100 px-3 py-2 text-xs dark:bg-gray-800">
          {plan.targetId}
        </code>
      </div>

      <div className="grid grid-cols-3 gap-2 text-center text-sm">
        <div className="rounded-md border border-gray-200 p-3 dark:border-gray-700">
          <div className="text-lg font-semibold">{plan.matrixIds.length}</div>
          <div className="text-xs text-gray-500 dark:text-gray-400">
            Matrices
          </div>
        </div>
        <div className="rounded-md border border-gray-200 p-3 dark:border-gray-700">
          <div className="text-lg font-semibold">{plan.activityIds.length}</div>
          <div className="text-xs text-gray-500 dark:text-gray-400">
            Activities
          </div>
        </div>
        <div className="rounded-md border border-gray-200 p-3 dark:border-gray-700">
          <div className="text-lg font-semibold">
            {plan.visualizationIds.length}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400">
            Visualizations
          </div>
        </div>
      </div>

      <p className="text-sm text-gray-600 dark:text-gray-300">
        {recordCount} {recordCount === 1 ? "record" : "records"} will be
        removed in one atomic operation. This cannot be undone.
      </p>

      {error && (
        <div
          role="alert"
          className="rounded-md border border-red-300 bg-red-50 p-3 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/50 dark:text-red-200"
        >
          {error}
        </div>
      )}

      <div className="flex justify-end gap-3 border-t border-gray-200 pt-4 dark:border-gray-700">
        <button
          type="button"
          onClick={onCancel}
          disabled={isDeleting}
          className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-700 dark:hover:bg-gray-800"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={confirm}
          disabled={isDeleting}
          className="flex items-center gap-2 rounded-md bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isDeleting ? (
            <LoaderCircle className="h-4 w-4 animate-spin" />
          ) : (
            <Trash2 className="h-4 w-4" />
          )}
          {isDeleting ? "Deleting…" : `Delete ${entityLabel}`}
        </button>
      </div>
    </div>
  );
}
