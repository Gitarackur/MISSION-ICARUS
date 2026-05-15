import { useEffect } from "react";
import { useModal } from "@/ui/design-system/Modal/context";
import RendererErrorContent from "@/ui/components/visualization/components/error-modal-content";

export const useVisualizationFeedback = ({
  clearDisplayWarning,
  displayWarning,
  error,
  warning,
}: {
  clearDisplayWarning: () => void;
  displayWarning: { title: string; message: string } | null;
  error: string | null;
  warning: string | null;
}) => {
  const { openModal } = useModal();

  useEffect(() => {
    if (!displayWarning) return;

    openModal(
      <RendererErrorContent message={displayWarning.message} />,
      displayWarning.title
    );
    clearDisplayWarning();
  }, [clearDisplayWarning, displayWarning, openModal]);

  useEffect(() => {
    if (!warning) return;

    openModal(
      <RendererErrorContent
        message={warning}
        fallbackNote="The requested renderer could not complete successfully, so the visualization was saved with a fallback renderer."
      />,
      "Renderer fallback"
    );
  }, [openModal, warning]);

  useEffect(() => {
    if (!error) return;

    openModal(
      <RendererErrorContent message={error} />,
      "Visualization rendering failed"
    );
  }, [error, openModal]);
};
