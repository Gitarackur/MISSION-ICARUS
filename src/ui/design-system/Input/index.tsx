// components/ui/Input.tsx
import * as React from "react";
import { tv, type VariantProps } from "tailwind-variants";
import { cn } from "@/ui/utils";

const input = tv({
  base: "mt-1 block min-h-9 w-full rounded-sm border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-900 shadow-sm transition-colors placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100 dark:placeholder:text-gray-500",
  variants: {
    scale: {
      sm: "min-h-8 px-2 py-1 text-sm",
      md: "min-h-9 px-3 py-1.5 text-sm",
      lg: "min-h-10 px-3.5 py-2 text-sm",
    },
    intent: {
      default: "",
      error:
        "border-red-500 focus:ring-red-500 focus:border-red-500 placeholder:text-red-400",
      success:
        "border-green-500 focus:ring-green-500 focus:border-green-500 placeholder:text-green-400",
    },
    disabled: {
      true: "bg-gray-100 text-gray-400 cursor-not-allowed opacity-70 dark:bg-gray-800 dark:text-gray-500",
    },
  },
  defaultVariants: {
    scale: "md",
    intent: "default",
    disabled: false,
  },
});

type InputVariants = VariantProps<typeof input>;

export interface InputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "size">,
  InputVariants { }

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, scale, intent, disabled, ...props }, ref) => {
    return (
      <input
        ref={ref}
        className={cn(input({ scale, intent, disabled, className }))}
        disabled={disabled}
        {...props}
      />
    );
  }
);

Input.displayName = "Input";
