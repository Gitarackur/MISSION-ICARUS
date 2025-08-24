import { X } from "lucide-react";
import { ActivityMatrixModal } from "../types/activity-node.types";
import { modalStyleVariants } from "@/ui/design-system/Modal/variants/modal.variants";



const MatrixModal = ({ title, tableColumns, onClose }: ActivityMatrixModal) => {
  if (!tableColumns) return null;

  const styles = modalStyleVariants();

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
          {tableColumns.map((row, i) => (
            <div key={i} className={styles.modalRow()}>
              <span className={styles.modalRowLabel()}>
                Data :
                <div className={styles.modalRowItems()}>
                  <span className={styles.modalItem()}>
                    {row ?? 'undefined'}
                  </span>
                </div>
              </span>
              {/* <div className={styles.modalRowItems()}>
                {row.map((item, j) => (
                  <span key={j} className={styles.modalItem()}>
                    {item ?? 'undefined'}
                  </span>
                ))}
              </div> */}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};


export default MatrixModal;