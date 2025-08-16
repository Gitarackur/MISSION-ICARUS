import { UploadCloud } from 'lucide-react'
import { dataOutputStyles } from './variants/data-output.variant';
import { DataPreviewEmptyState } from './types';


const PreviewEmptyState = ({
  onSelectButtonForUpload
}: DataPreviewEmptyState) => {
  const s = dataOutputStyles();

  return (
    <div className={s.emptyState()}>
      <UploadCloud className={s.emptyIcon()} />
      <h3 className={s.emptyTitle()}>No data imported</h3>
      <p className={s.emptyDescription()}>
        Import your proteomics CSV file to preview data here.
      </p>
      <button
        onClick={() => onSelectButtonForUpload?.()}
        className={s.button({ buttonDisabled: false })}
      >
        Import Data
      </button>
    </div>
  )
}

export default PreviewEmptyState;