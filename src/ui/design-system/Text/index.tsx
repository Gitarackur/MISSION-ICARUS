import React from 'react';
import { tv } from 'tailwind-variants';

type TextProps = React.HTMLAttributes<HTMLParagraphElement> & {
  size?: 'sm' | 'md' | 'lg';
  weight?: 'normal' | 'medium' | 'bold';
};

const text = tv({
  base: '',
  variants: {
    size: {
      sm: 'text-sm',
      md: 'text-base',
      lg: 'text-lg',
    },
    weight: {
      normal: 'font-normal',
      medium: 'font-medium',
      bold: 'font-bold',
    },
  },
  defaultVariants: {
    size: 'md',
    weight: 'normal',
  },
});

export const Text: React.FC<TextProps> = ({ size, weight, className, ...props }) => {
  return <p className={text({ size, weight, className })} {...props} />;
};
