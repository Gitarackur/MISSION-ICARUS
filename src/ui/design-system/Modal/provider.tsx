import { ReactNode, useCallback, useMemo, useState } from "react";
import { Modal, ModalState } from ".";
import { ModalContext } from "./context";

export interface ModalContextType {
  openModal: (content: ReactNode, title?: string) => void;
  closeModal: (onClosed?: () => void) => void;
}

export interface ModalProviderProps {
  children: ReactNode;
}

export const ModalProvider = ({ children }: ModalProviderProps) => {
  const [modalState, setModalState] = useState<ModalState>({
    isOpen: false,
    content: null,
    title: ''
  });

  const openModal = useCallback((content: ReactNode, title: string = '') => {
    setModalState({ isOpen: true, content, title });
  }, []);

  const closeModal = useCallback((onClosed?: () => void) => {
    setModalState((prev) => ({ ...prev, isOpen: false }));

    setTimeout(() => {
      setModalState((prev) => ({ ...prev, content: null, title: "" }));
      if (onClosed && typeof onClosed === "function") onClosed();
    }, 300);
  }, []);

  const memoizedContextValue = useMemo<ModalContextType>(() => ({
    openModal,
    closeModal
  }), [openModal, closeModal]);

  return (
    <ModalContext.Provider value={memoizedContextValue}>
      {children}
      <Modal
        isOpen={modalState.isOpen}
        onClose={closeModal}
        title={modalState.title}
      >
        {modalState.content}
      </Modal>
    </ModalContext.Provider>
  );
};