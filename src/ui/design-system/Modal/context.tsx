import { createContext, useContext } from "react";
import { ModalContextType } from "./provider";


export const ModalContext = createContext<ModalContextType | null>(null);

export function useModal(): ModalContextType {
  const context = useContext(ModalContext);
  if (!context) {
    throw new Error('`useModal` must be used within a `ModalProvider`');
  }
  return context;
}

