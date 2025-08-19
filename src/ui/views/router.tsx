import IcarusApp from "@/ui/views/main"
import { ModalProvider } from "@/ui/design-system/Modal/provider"


const AppRouter = () => {
  return (
    <ModalProvider>
      <IcarusApp />
    </ModalProvider>
  )
}

export default AppRouter