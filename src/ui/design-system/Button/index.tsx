import React from 'react';
import { twMerge } from 'tailwind-merge';

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'outline';
};

export const Button: React.FC<ButtonProps> = ({ variant = 'primary', className, ...props }) => {
  const baseStyles = 'px-4 py-2 rounded-md font-medium focus:outline-none';
  const variantStyles = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700',
    secondary: 'bg-gray-200 text-gray-800 hover:bg-gray-300',
    outline: 'border border-gray-400 text-gray-800 hover:bg-gray-100'
  };

  return (
    <button
      className={twMerge(baseStyles, variantStyles[variant], className)}
      {...props}
    />
  );
};