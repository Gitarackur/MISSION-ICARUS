// components/ui/Input.tsx
import * as React from "react";
import { tv, type VariantProps } from "tailwind-variants";
import { cn } from "@/ui/utils";

const input = tv({
  base: "mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md bg-white text-gray-900 shadow-sm transition-colors placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100 dark:placeholder:text-gray-500",
  variants: {
    scale: {
      sm: "px-2 py-1 text-sm",
      md: "px-3 py-2 text-base",
      lg: "px-4 py-3 text-lg",
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
