const RendererErrorContent = ({
  message,
  fallbackNote,
}: {
  message: string;
  fallbackNote?: string;
}) => (
  <div className="space-y-4 text-sm text-slate-700 dark:text-slate-200">
    {fallbackNote ? <p>{fallbackNote}</p> : null}
    <div className="rounded-md border border-slate-200 bg-slate-950/95 p-4 text-xs text-slate-100 shadow-sm dark:border-slate-700 dark:bg-black">
      <div className="mb-2 font-semibold uppercase tracking-wide text-rose-300">
        Renderer Error
      </div>
      <pre className="max-h-[48vh] overflow-auto whitespace-pre-wrap break-words font-mono leading-6 text-slate-100">
        <code>{message}</code>
      </pre>
    </div>
  </div>
);

export default RendererErrorContent;