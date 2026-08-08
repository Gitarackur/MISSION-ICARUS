import IcarusApp from "@/ui/views/main"
import { ModalProvider } from "@/ui/design-system/Modal/provider"
import { ThemeProvider } from "@/ui/theme/theme-provider"
import { AppSettingsProvider } from "@/ui/settings/settings-provider"


const AppRouter = () => {
  return (
    <ThemeProvider>
      <AppSettingsProvider>
        <ModalProvider>
          <IcarusApp />
        </ModalProvider>
      </AppSettingsProvider>
    </ThemeProvider>
  )
}

export default AppRouter
