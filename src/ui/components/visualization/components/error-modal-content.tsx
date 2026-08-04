import { visualizationStyles } from "../variants/visualization.variants";

const RendererErrorContent = ({
  message,
  fallbackNote,
}: {
  message: string;
  fallbackNote?: string;
}) => {
  const s = visualizationStyles();

  return (
    <div className={s.rendererErrorContent()}>
      {fallbackNote ? <p>{fallbackNote}</p> : null}
      <div className={s.rendererErrorBox()}>
        <div className={s.rendererErrorTitle()}>Renderer Error</div>
        <pre className={s.rendererErrorMessage()}>
          <code>{message}</code>
        </pre>
      </div>
    </div>
  );
};

export default RendererErrorContent;
