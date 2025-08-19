import { ReactNode } from 'react';
import { X } from 'lucide-react';
import { modalStyleVariants } from './variants/modal.variants';

export interface ModalState {
  isOpen: boolean;
  content: ReactNode | null;
  title: string;
}

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}



interface MatrixModalContentProps {
  data: (string | null)[][];
}


export const Modal = ({ isOpen, onClose, title, children }: ModalProps) => {
  const styles = modalStyleVariants();

  if (!isOpen) {
    return null; 
  }

  return (
    <div className={styles.modalOverlay()} onClick={onClose}>
      <div className={styles.modalContent()} onClick={e => e.stopPropagation()}>
        <div className={styles.modalHeader()}>
          <h3 className={styles.modalTitle()}>{title}</h3>
          <button onClick={onClose} className={styles.modalCloseBtn()}>
            <X className={styles.iconClose()} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
};




export const MatrixModalContent = ({ data }: MatrixModalContentProps) => {
  const styles = modalStyleVariants(); 

  if (!Array.isArray(data)) {
    console.error("MatrixModalContent expected 'data' to be an array, but received:", data);
    return <p className="text-red-500">Error: Invalid matrix data provided.</p>;
  }

  return (
    <div className={styles.modalDataContainer()}>
      {data.map((row, i) => (
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
  );
};

