import React from 'react';
import { tv } from 'tailwind-variants';

type CheckboxProps = React.InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
};

const checkboxWrapper = tv({
  base: 'flex items-center gap-2 cursor-pointer',
});

const checkboxInput = tv({
  base: 'w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 focus:ring-2',
});

export const Checkbox: React.FC<CheckboxProps> = ({ label, className, ...props }) => {
  return (
    <label className={checkboxWrapper()}>
      <input type="checkbox" className={checkboxInput({ className })} {...props} />
      {label && <span>{label}</span>}
    </label>
  );
};
