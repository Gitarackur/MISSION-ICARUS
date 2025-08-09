import React from 'react';
import { tv } from 'tailwind-variants';

type CheckboxProps = React.InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
};

const styles = tv({
  slots: {
    wrapper: 'flex items-center gap-2 cursor-pointer',
    input: 'w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 focus:ring-2',
  },
});

export const Checkbox: React.FC<CheckboxProps> = ({ label, className, ...props }) => {
  const s = styles();

  return (
    <label className={s.wrapper()}>
      <input type="checkbox" className={s.input({ className })} {...props} />
      {label && <span>{label}</span>}
    </label>
  );
};
