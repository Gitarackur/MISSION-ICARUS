import { tv } from "tailwind-variants";

// Button layout helpers for the settings panel
export const settingsButtonStyles = tv({
  slots: {
    fullWidth: "flex w-full items-center justify-center gap-2",
    flexOne: "flex flex-1 items-center justify-center gap-2",
    icon: "h-4 w-4",
  },
});