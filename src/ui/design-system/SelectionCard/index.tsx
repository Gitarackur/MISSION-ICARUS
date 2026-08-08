import type { ButtonHTMLAttributes, ReactNode } from "react";
import type { VariantProps } from "tailwind-variants";
import { selectionCardStyles } from "./style-variants";

type SelectionCardVariants = VariantProps<typeof selectionCardStyles>;

export interface SelectionCardProps
  extends Omit<
      ButtonHTMLAttributes<HTMLButtonElement>,
      "aria-pressed" | "children"
    >,
    SelectionCardVariants {
  icon?: ReactNode;
  label: ReactNode;
  description?: ReactNode;
}

export const SelectionCard = ({
  align,
  className,
  description,
  icon,
  label,
  selected,
  type = "button",
  ...props
}: SelectionCardProps) => {
  const styles = selectionCardStyles({ align, selected });

  return (
    <button
      {...props}
      type={type}
      className={styles.root({ className })}
      aria-pressed={selected ?? false}
      data-selected={selected ?? false}
    >
      {icon && (
        <span className={styles.icon()} aria-hidden="true">
          {icon}
        </span>
      )}
      <span className={styles.content()}>
        <span className={styles.label()}>{label}</span>
        {description && (
          <span className={styles.description()}>{description}</span>
        )}
      </span>
    </button>
  );
};
