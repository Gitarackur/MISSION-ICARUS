import IcarusApp from "@/ui/views/main"
import { ModalProvider } from "@/ui/design-system/Modal/provider"
import { ThemeProvider } from "@/ui/theme/theme-provider"


const AppRouter = () => {
  return (
    <ThemeProvider>
      <ModalProvider>
        <IcarusApp />
      </ModalProvider>
    </ThemeProvider>
  )
}

export default AppRouter
