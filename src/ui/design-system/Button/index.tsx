import React from 'react';
import { tv } from 'tailwind-variants';

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'outline';
};

const button = tv({
  base: 'px-4 py-2 rounded-md font-medium focus:outline-none',
  variants: {
    variant: {
      primary: 'bg-blue-600 text-white hover:bg-blue-700',
      secondary: 'bg-gray-200 text-gray-800 hover:bg-gray-300',
      outline: 'border border-gray-400 text-gray-800 hover:bg-gray-100',
    },
  },
  defaultVariants: {
    variant: 'primary',
  },
});

export const Button: React.FC<ButtonProps> = ({ variant, className, ...props }) => {
  return (
    <button className={button({ variant, className })} {...props} />
  );
};
