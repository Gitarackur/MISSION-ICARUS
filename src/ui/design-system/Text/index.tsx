import React from 'react';
import { twMerge } from 'tailwind-merge';

type TextProps = React.HTMLAttributes<HTMLParagraphElement> & {
  size?: 'sm' | 'md' | 'lg';
  weight?: 'normal' | 'medium' | 'bold';
};

export const Text: React.FC<TextProps> = ({ size = 'md', weight = 'normal', className, ...props }) => {
  const sizeStyles = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg'
  };

  const weightStyles = {
    normal: 'font-normal',
    medium: 'font-medium',
    bold: 'font-bold'
  };

  return <p className={twMerge(sizeStyles[size], weightStyles[weight], className)} {...props} />;
};