// import { MatrixData } from "@/domain/shared/index.types";
import { X } from "lucide-react";
import { activityStyleVariants } from "../variants/activity.style.variant";
import { ActivityMatrixModal } from "../types/activity-node.types";



const MatrixModal = ({ title, tableMatrices, onClose }: ActivityMatrixModal) => {
  if (!tableMatrices) return null;

  const styles = activityStyleVariants();

  return (
    <div className={styles.modalOverlay()} onClick={onClose}>
      <div className={styles.modalContent()} onClick={e => e.stopPropagation()}>
        <div className={styles.modalHeader()}>
          <h3 className={styles.modalTitle()}>{title}</h3>
          <button onClick={onClose} className={styles.modalCloseBtn()}>
            <X className={styles.iconClose()} />
          </button>
        </div>

        <div className={styles.modalDataContainer()}>
          {tableMatrices.map((row, i) => (
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