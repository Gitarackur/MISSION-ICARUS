import { ReactNode, useEffect, useState } from 'react';
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

export const Modal = ({ isOpen, onClose, title, children }: ModalProps) => {
  const [isVisible, setIsVisible] = useState(false);
  const styles = modalStyleVariants();

  useEffect(() => {
    if (isOpen) {
      requestAnimationFrame(() => setIsVisible(true));
    } else {
      setIsVisible(false);
    }
  }, [isOpen]);

  if (!isOpen) {
    return null;
  }

  return (
    <div
      className={styles.modalOverlay()}
      data-open={isVisible}
      onClick={onClose}
    >
      <div
        className={styles.modalContent()}
        data-open={isVisible}
        onClick={e => e.stopPropagation()}
      >
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