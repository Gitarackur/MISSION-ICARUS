import { tv } from "tailwind-variants";

export const visualizationStyles = tv({
  slots: {
    container: "space-y-6",
    card: "bg-white rounded-lg shadow p-6",
    heading: "text-lg font-semibold mb-4",
    plotContainer: "",
    placeholderBox:
      "bg-gray-100 h-64 rounded-lg flex items-center justify-center",
    placeholderText: "text-gray-500",
  },
});

