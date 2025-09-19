import { tv } from "tailwind-variants";



// Define button variants with tailwind-variants
export const tabButtonStyles = tv({
  base: `
    flex items-center space-x-2
    px-4 py-1.5
    border-b-4 font-semibold text-sm 
    flex-grow sm:flex-grow-0 min-w-0
    transition-colors duration-200 ease-in-out
    focus:outline-none  focus:ring-offset-2
  `,
  variants: {
    active: {
      true: 'border-blue-600 text-blue-600 bg-blue-50',
      false: 'border-transparent text-gray-600 hover:text-blue-600 hover:border-blue-300',
    },
  },
});
