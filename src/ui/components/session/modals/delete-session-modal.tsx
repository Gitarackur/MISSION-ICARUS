import { useState } from "react";
import { AlertTriangle, LoaderCircle, Trash2 } from "lucide-react";
import type { IcarusSession } from "@/domain/session";

export function SessionDeletionConfirmation({
  session,
  onCancel,
  onConfirm,
}: {
  session: IcarusSession;
  onCancel: () => void;
  onConfirm: () => Promise<void>;
}) {
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
    <div className="space-y-5">
      <div className="rounded-lg border border-red-300 bg-red-50 p-4 text-red-950 dark:border-red-900 dark:bg-red-950/40 dark:text-red-100">
        <div className="flex items-start gap-3">
          <AlertTriangle className="mt-0.5 h-5 w-5 flex-shrink-0 text-red-600 dark:text-red-400" />
          <div className="space-y-2">
            <p className="font-semibold">
              Delete this session and all of its data?
            </p>
            <p className="text-sm leading-6">
              Deleting a session permanently removes its matrices, activities,
              and saved visualizations in one atomic operation. This cannot be
              undone.
            </p>
          </div>
        </div>
      </div>

      <div>
        <div className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
          Session
        </div>
        <code className="mt-1 block break-all rounded bg-gray-100 px-3 py-2 text-xs dark:bg-gray-800">
          {session.name || session.id}
        </code>
      </div>

      <div className="grid grid-cols-3 gap-2 text-center text-sm">
        <div className="rounded-md border border-gray-200 p-3 dark:border-gray-700">
          <div className="text-lg font-semibold">{session.matrixIds.length}</div>
          <div className="text-xs text-gray-500 dark:text-gray-400">
            Matrices
          </div>
        </div>
        <div className="rounded-md border border-gray-200 p-3 dark:border-gray-700">
          <div className="text-lg font-semibold">
            {session.activityIds.length}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400">
            Activities
          </div>
        </div>
        <div className="rounded-md border border-gray-200 p-3 dark:border-gray-700">
          <div className="text-lg font-semibold">
            {session.visualizationIds.length}
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
          {isDeleting ? "Deleting…" : "Delete session"}
        </button>
      </div>
    </div>
  );
}