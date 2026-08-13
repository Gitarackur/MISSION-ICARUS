import { tv } from "tailwind-variants";

export const matrixDataLoaderStyles = tv({
  slots: {
    container:
      "flex h-full min-h-80 w-full flex-col items-center justify-center gap-6 px-6 py-10 animate-[workspace-enter_0.3s_ease-out_both]",
    logo:
      "h-20 w-20 select-none drop-shadow-[0_4px_16px_rgba(59,130,246,0.35)]",
    label:
      "text-xl font-semibold tracking-tight text-gray-700 animate-[workspace-enter_0.4s_ease-out_0.15s_both] dark:text-gray-300",
    detail:
      "text-sm text-gray-500 animate-[workspace-enter_0.4s_ease-out_0.25s_both] dark:text-gray-400",
  },
});

export type MatrixDataLoaderStyleSlots = typeof matrixDataLoaderStyles.slots;
