import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check, X, Search } from 'lucide-react';

// Types
export interface Option {
  value: string;
  label: string;
  disabled?: boolean;
}

export type Size = 'sm' | 'md' | 'lg';
export type Variant = 'default' | 'secondary' | 'success' | 'error';

export interface MultiSelectVariants {
  base: Record<string, string>;
  variants: {
    size: Record<Size, Partial<Record<string, string>>>;
    variant: Record<Variant, Partial<Record<string, string>>>;
    disabled: {
      true: Partial<Record<string, string>>;
    };
  };
  defaultVariants: {
    size: Size;
    variant: Variant;
    disabled: boolean;
  };
}

export interface MultiSelectProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'onChange'> {
  /** Array of options to display */
  options: Option[];
  /** Currently selected values */
  value: string[];
  /** Callback when selection changes */
  onChange: (values: string[]) => void;
  /** Placeholder text when no options are selected */
  placeholder?: string;
  /** Label for the input */
  label?: string;
  /** Unique identifier */
  id?: string;
  /** Size variant */
  size?: Size;
  /** Visual variant */
  variant?: Variant;
  /** Whether the input is disabled */
  disabled?: boolean;
  /** Whether to show search functionality */
  searchable?: boolean;
  /** Whether to show clear all button */
  clearable?: boolean;
  /** Maximum number of tags to display before showing "+X more" */
  maxDisplayed?: number;
  /** Error message to display */
  error?: string;
  /** Helper text to display below input */
  helperText?: string;
  /** Whether the field is required */
  required?: boolean;
  /** Custom class name */
  className?: string;
}

interface VariantClassesProps {
  size: Size;
  variant: Variant;
  disabled: boolean;
}

// Design system variants using tailwind-variants pattern
const multiSelectVariants: MultiSelectVariants = {
  // Add required base classes for screen reader support
  base: {
    container: "relative w-full",
    label: "block text-sm font-medium mb-2 transition-colors",
    trigger: "min-h-[42px] w-full px-3 py-2 border rounded-lg shadow-sm bg-white cursor-pointer transition-all duration-200 flex items-center justify-between",
    content: "flex-1 flex flex-wrap gap-1",
    placeholder: "text-gray-500 py-1 select-none",
    dropdown: "absolute z-50 w-full mt-1 bg-white border rounded-lg shadow-lg overflow-hidden",
    searchContainer: "p-3 border-b border-gray-100",
    searchInput: "w-full px-3 py-2 text-sm border rounded-md transition-colors focus:outline-none focus:ring-2",
    optionsList: "max-h-48 overflow-y-auto",
    option: "flex items-center px-3 py-2.5 cursor-pointer transition-colors",
    checkbox: "flex items-center justify-center w-4 h-4 mr-3 border rounded transition-all duration-200",
    optionText: "text-sm select-none",
    footer: "px-3 py-2 border-t text-xs",
    tag: "inline-flex items-center gap-1.5 px-2.5 py-1 text-sm rounded-md transition-all duration-200",
    tagRemove: "hover:bg-opacity-20 rounded-full p-0.5 transition-colors",
    clearButton: "text-gray-400 hover:text-gray-600 transition-colors p-0.5",
    chevron: "text-gray-400 transition-transform duration-200",
    // Screen reader only class for hidden content
    srOnly: "sr-only",
  },
  variants: {
    size: {
      sm: {
        trigger: "min-h-[36px] px-2.5 py-1.5 text-sm",
        tag: "px-2 py-0.5 text-xs",
        searchInput: "px-2.5 py-1.5 text-xs",
        option: "px-2.5 py-2",
        optionText: "text-xs",
      },
      md: {
        trigger: "min-h-[42px] px-3 py-2",
        tag: "px-2.5 py-1 text-sm",
        searchInput: "px-3 py-2 text-sm",
        option: "px-3 py-2.5",
        optionText: "text-sm",
      },
      lg: {
        trigger: "min-h-[48px] px-4 py-3",
        tag: "px-3 py-1.5 text-base",
        searchInput: "px-4 py-2.5 text-base",
        option: "px-4 py-3",
        optionText: "text-base",
      },
    },
    variant: {
      default: {
        label: "text-gray-700",
        trigger: "border-gray-300 hover:border-gray-400 focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500",
        dropdown: "border-gray-200",
        searchInput: "border-gray-200 focus:ring-blue-500 focus:border-blue-500",
        option: "hover:bg-gray-50",
        checkbox: "border-gray-300 data-[selected=true]:bg-blue-500 data-[selected=true]:border-blue-500 data-[selected=true]:text-white",
        optionText: "text-gray-700",
        footer: "bg-gray-50 text-gray-600 border-gray-100",
        tag: "bg-blue-100 text-blue-800 hover:bg-blue-200",
      },
      secondary: {
        label: "text-gray-700",
        trigger: "border-gray-300 hover:border-gray-400 focus-within:ring-2 focus-within:ring-gray-500 focus-within:border-gray-500",
        dropdown: "border-gray-200",
        searchInput: "border-gray-200 focus:ring-gray-500 focus:border-gray-500",
        option: "hover:bg-gray-50",
        checkbox: "border-gray-300 data-[selected=true]:bg-gray-600 data-[selected=true]:border-gray-600 data-[selected=true]:text-white",
        optionText: "text-gray-700",
        footer: "bg-gray-50 text-gray-600 border-gray-100",
        tag: "bg-gray-100 text-gray-800 hover:bg-gray-200",
      },
      success: {
        label: "text-gray-700",
        trigger: "border-green-300 hover:border-green-400 focus-within:ring-2 focus-within:ring-green-500 focus-within:border-green-500",
        dropdown: "border-green-200",
        searchInput: "border-green-200 focus:ring-green-500 focus:border-green-500",
        option: "hover:bg-green-50",
        checkbox: "border-green-300 data-[selected=true]:bg-green-500 data-[selected=true]:border-green-500 data-[selected=true]:text-white",
        optionText: "text-gray-700",
        footer: "bg-green-50 text-green-600 border-green-100",
        tag: "bg-green-100 text-green-800 hover:bg-green-200",
      },
      error: {
        label: "text-red-700",
        trigger: "border-red-300 hover:border-red-400 focus-within:ring-2 focus-within:ring-red-500 focus-within:border-red-500",
        dropdown: "border-red-200",
        searchInput: "border-red-200 focus:ring-red-500 focus:border-red-500",
        option: "hover:bg-red-50",
        checkbox: "border-red-300 data-[selected=true]:bg-red-500 data-[selected=true]:border-red-500 data-[selected=true]:text-white",
        optionText: "text-gray-700",
        footer: "bg-red-50 text-red-600 border-red-100",
        tag: "bg-red-100 text-red-800 hover:bg-red-200",
      },
    },
    disabled: {
      true: {
        trigger: "bg-gray-50 cursor-not-allowed opacity-60",
        label: "text-gray-400",
      },
    },
  },
  defaultVariants: {
    size: "md",
    variant: "default",
    disabled: false,
  },
};

const createVariantClasses = (
  variants: MultiSelectVariants, 
  props: VariantClassesProps
): Record<string, string> => {
  const { size, variant, disabled } = { ...variants.defaultVariants, ...props };
  const classes: Record<string, string> = {};
  
  Object.keys(variants.base).forEach(key => {
    classes[key] = [
      variants.base[key],
      variants.variants.size[size]?.[key],
      variants.variants.variant[variant]?.[key],
      disabled && variants.variants.disabled.true?.[key],
    ].filter(Boolean).join(' ');
  });
  
  return classes;
};

const MultiSelect = React.forwardRef<HTMLDivElement, MultiSelectProps>(({
  options = [],
  value = [],
  onChange,
  placeholder = "Select options...",
  label,
  id,
  size = "md",
  variant = "default",
  disabled = false,
  searchable = true,
  clearable = true,
  maxDisplayed = 3,
  className = "",
  error,
  helperText,
  required = false,
  ...props
}, ref) => {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  const classes = createVariantClasses(multiSelectVariants, { 
    size, 
    variant: error ? 'error' : variant, 
    disabled 
  });

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchTerm('');
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleToggle = (option: Option): void => {
    if (disabled || option.disabled) return;
    
    const newValue = value.includes(option.value)
      ? value.filter(v => v !== option.value)
      : [...value, option.value];
    
    onChange(newValue);
  };

  const removeItem = (valueToRemove: string): void => {
    if (disabled) return;
    onChange(value.filter(v => v !== valueToRemove));
  };

  const clearAll = (): void => {
    if (disabled) return;
    onChange([]);
  };

  const filteredOptions = searchable
    ? options.filter(option =>
        option.label.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : options;

  const selectedOptions = options.filter(option => value.includes(option.value));
  const displayedTags = selectedOptions.slice(0, maxDisplayed);
  const remainingCount = selectedOptions.length - maxDisplayed;

  const getIconSize = (size: Size): number => {
    switch (size) {
      case 'sm': return 12;
      case 'lg': return 16;
      default: return 14;
    }
  };

  const getChevronSize = (size: Size): number => {
    switch (size) {
      case 'sm': return 14;
      case 'lg': return 18;
      default: return 16;
    }
  };

  return (
    <div ref={ref} className={`${classes.container} ${className}`} {...props}>
      {label && (
        <label htmlFor={id} className={classes.label}>
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      
      <div className={classes.container} ref={dropdownRef}>
        <div
          className={classes.trigger}
          onClick={() => !disabled && setIsOpen(!isOpen)}
          role="combobox"
          aria-expanded={isOpen}
          aria-haspopup="listbox"
          aria-labelledby={label ? `${id}-label` : undefined}
        >
          <div className={classes.content}>
            {selectedOptions.length === 0 ? (
              <span className={classes.placeholder}>{placeholder}</span>
            ) : (
              <>
                {displayedTags.map((option) => (
                  <span key={option.value} className={classes.tag}>
                    {option.label}
                    {!disabled && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          removeItem(option.value);
                        }}
                        className={classes.tagRemove}
                        aria-label={`Remove ${option.label}`}
                        type="button"
                      >
                        <X size={getIconSize(size)} />
                      </button>
                    )}
                  </span>
                ))}
                {remainingCount > 0 && (
                  <span className={classes.tag}>
                    +{remainingCount} more
                  </span>
                )}
              </>
            )}
          </div>
          <div className="flex items-center gap-2 ml-2">
            {clearable && selectedOptions.length > 0 && !disabled && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  clearAll();
                }}
                className={classes.clearButton}
                aria-label="Clear all selections"
                type="button"
              >
                <X size={getChevronSize(size)} />
              </button>
            )}
            <ChevronDown
              size={getChevronSize(size)}
              className={`${classes.chevron} ${isOpen ? 'rotate-180' : ''}`}
            />
          </div>
        </div>

        {isOpen && !disabled && (
          <div className={classes.dropdown} 
          // role="listbox"
          >
            {searchable && (
              <div className={classes.searchContainer}>
                <div className="relative">
                  <Search 
                    size={16} 
                    className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" 
                  />
                  <input
                    type="text"
                    placeholder="Search options..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className={`${classes.searchInput} pl-10`}
                    autoFocus
                  />
                </div>
              </div>
            )}
            
            <div className={classes.optionsList}>
              {filteredOptions.length === 0 ? (
                <div className="px-3 py-2 text-sm text-gray-500">
                  {searchTerm ? 'No options found' : 'No options available'}
                </div>
              ) : (
                filteredOptions.map((option) => {
                  const isSelected = value.includes(option.value);
                  const isOptionDisabled = option.disabled || false;
                  
                  return (
                    <div
                      key={option.value}
                      onClick={() => !isOptionDisabled && handleToggle(option)}
                      className={`${classes.option} ${
                        isOptionDisabled ? 'opacity-50 cursor-not-allowed' : ''
                      }`}
                      role="option"
                      aria-selected={isSelected}
                      aria-disabled={isOptionDisabled}
                    >
                      <div
                        className={classes.checkbox}
                        data-selected={isSelected}
                      >
                        {isSelected && <Check size={getIconSize(size)} />}
                      </div>
                      <span className={classes.optionText}>
                        {option.label}
                      </span>
                    </div>
                  );
                })
              )}
            </div>
            
            {selectedOptions.length > 0 && (
              <div className={classes.footer}>
                {selectedOptions.length} option{selectedOptions.length !== 1 ? 's' : ''} selected
              </div>
            )}
          </div>
        )}
      </div>

      {(error || helperText) && (
        <div className="mt-1 text-sm">
          {error && <div className="text-red-600">{error}</div>}
          {helperText && !error && <div className="text-gray-500">{helperText}</div>}
        </div>
      )}
    </div>
  );
});

MultiSelect.displayName = 'MultiSelect';


export default MultiSelect;