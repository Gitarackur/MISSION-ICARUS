// import { MatrixData } from "@/domain/shared/index.types";
import { X } from "lucide-react";
import { activityStyleVariants } from "../variants/activity.style.variant";
import { MatrixModalData } from "../types/activity-node.types";



const MatrixModal = ({ modal, onClose }: { 
  modal: MatrixModalData | null; onClose: () => void 
}) => {
  if (!modal) return null;

  const styles = activityStyleVariants();

  return (
    <div className={styles.modalOverlay()} onClick={onClose}>
      <div className={styles.modalContent()} onClick={e => e.stopPropagation()}>
        <div className={styles.modalHeader()}>
          <h3 className={styles.modalTitle()}>{modal.title}</h3>
          <button onClick={onClose} className={styles.modalCloseBtn()}>
            <X className={styles.iconClose()} />
          </button>
        </div>
        <div className={styles.modalDataContainer()}>
          {modal.data.map((row, i) => (
            <div key={i} className={styles.modalRow()}>
              <span className={styles.modalRowLabel()}>Row {i + 1}:</span>
              <div className={styles.modalRowItems()}>
                {row.map((item, j) => (
                  <span key={j} className={styles.modalItem()}>
                    {item ?? 'undefined'}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};


export default MatrixModal;