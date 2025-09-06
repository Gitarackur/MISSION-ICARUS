import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check, X, Search } from 'lucide-react';

// Types
export interface Option {
  value: string;
  label: string;
  disabled?: boolean;
  description?: string;
}

export type Size = 'sm' | 'md' | 'lg';
export type Variant = 'default' | 'secondary' | 'success' | 'error';

export interface SingleSelectVariants {
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

export interface SingleSelectProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'onChange'> {
  /** Array of options to display */
  options: Option[];
  /** Currently selected value */
  value: string | null;
  /** Callback when selection changes */
  onChange: (value: string | null) => void;
  /** Placeholder text when no option is selected */
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
  /** Whether to show clear button */
  clearable?: boolean;
  /** Error message to display */
  error?: string;
  /** Helper text to display below input */
  helperText?: string;
  /** Whether the field is required */
  required?: boolean;
  /** Custom class name */
  className?: string;
  /** Show option descriptions */
  showDescriptions?: boolean;
}

interface VariantClassesProps {
  size: Size;
  variant: Variant;
  disabled: boolean;
}

// Design system variants using tailwind-variants pattern
const singleSelectVariants: SingleSelectVariants = {
  base: {
    container: "relative w-full",
    label: "block text-sm font-medium mb-2 transition-colors",
    trigger: "min-h-[42px] w-full px-3 py-2 border rounded-lg shadow-sm bg-white cursor-pointer transition-all duration-200 flex items-center justify-between",
    content: "flex-1 flex items-center gap-2",
    placeholder: "text-gray-500 select-none",
    selectedText: "text-gray-900 select-none",
    selectedDescription: "text-sm text-gray-500 select-none",
    dropdown: "absolute z-50 w-full mt-1 bg-white border rounded-lg shadow-lg overflow-hidden",
    searchContainer: "p-3 border-b border-gray-100",
    searchInput: "w-full px-3 py-2 text-sm border rounded-md transition-colors focus:outline-none focus:ring-2",
    optionsList: "max-h-48 overflow-y-auto",
    option: "flex items-center px-3 py-2.5 cursor-pointer transition-colors",
    optionContent: "flex-1",
    optionText: "text-sm select-none",
    optionDescription: "text-xs text-gray-500 select-none mt-1",
    checkIcon: "w-4 h-4 ml-2 text-current",
    footer: "px-3 py-2 border-t text-xs",
    clearButton: "text-gray-400 hover:text-gray-600 transition-colors p-0.5",
    chevron: "text-gray-400 transition-transform duration-200",
    srOnly: "sr-only",
  },
  variants: {
    size: {
      sm: {
        trigger: "min-h-[36px] px-2.5 py-1.5 text-sm",
        selectedText: "text-sm",
        searchInput: "px-2.5 py-1.5 text-xs",
        option: "px-2.5 py-2",
        optionText: "text-xs",
        optionDescription: "text-xs",
      },
      md: {
        trigger: "min-h-[42px] px-3 py-2",
        selectedText: "text-sm",
        searchInput: "px-3 py-2 text-sm",
        option: "px-3 py-2.5",
        optionText: "text-sm",
        optionDescription: "text-xs",
      },
      lg: {
        trigger: "min-h-[48px] px-4 py-3",
        selectedText: "text-base",
        searchInput: "px-4 py-2.5 text-base",
        option: "px-4 py-3",
        optionText: "text-base",
        optionDescription: "text-sm",
      },
    },
    variant: {
      default: {
        label: "text-gray-700",
        trigger: "border-gray-300 hover:border-gray-400 focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500",
        dropdown: "border-gray-200",
        searchInput: "border-gray-200 focus:ring-blue-500 focus:border-blue-500",
        option: "hover:bg-gray-50 data-[selected=true]:bg-blue-50 data-[selected=true]:text-blue-700",
        checkIcon: "text-blue-600",
        footer: "bg-gray-50 text-gray-600 border-gray-100",
      },
      secondary: {
        label: "text-gray-700",
        trigger: "border-gray-300 hover:border-gray-400 focus-within:ring-2 focus-within:ring-gray-500 focus-within:border-gray-500",
        dropdown: "border-gray-200",
        searchInput: "border-gray-200 focus:ring-gray-500 focus:border-gray-500",
        option: "hover:bg-gray-50 data-[selected=true]:bg-gray-100 data-[selected=true]:text-gray-800",
        checkIcon: "text-gray-600",
        footer: "bg-gray-50 text-gray-600 border-gray-100",
      },
      success: {
        label: "text-gray-700",
        trigger: "border-green-300 hover:border-green-400 focus-within:ring-2 focus-within:ring-green-500 focus-within:border-green-500",
        dropdown: "border-green-200",
        searchInput: "border-green-200 focus:ring-green-500 focus:border-green-500",
        option: "hover:bg-green-50 data-[selected=true]:bg-green-50 data-[selected=true]:text-green-700",
        checkIcon: "text-green-600",
        footer: "bg-green-50 text-green-600 border-green-100",
      },
      error: {
        label: "text-red-700",
        trigger: "border-red-300 hover:border-red-400 focus-within:ring-2 focus-within:ring-red-500 focus-within:border-red-500",
        dropdown: "border-red-200",
        searchInput: "border-red-200 focus:ring-red-500 focus:border-red-500",
        option: "hover:bg-red-50 data-[selected=true]:bg-red-50 data-[selected=true]:text-red-700",
        checkIcon: "text-red-600",
        footer: "bg-red-50 text-red-600 border-red-100",
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
  variants: SingleSelectVariants, 
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

const SingleSelect = React.forwardRef<HTMLDivElement, SingleSelectProps>(({
  options = [],
  value = null,
  onChange,
  placeholder = "Select an option...",
  label,
  id,
  size = "md",
  variant = "default",
  disabled = false,
  searchable = true,
  clearable = true,
  className = "",
  error,
  helperText,
  required = false,
  showDescriptions = false,
  ...props
}, ref) => {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  const classes = createVariantClasses(singleSelectVariants, { 
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

  const handleSelect = (option: Option): void => {
    if (disabled || option.disabled) return;
    
    onChange(option.value);
    setIsOpen(false);
    setSearchTerm('');
  };

  const clearSelection = (): void => {
    if (disabled) return;
    onChange(null);
  };

  const filteredOptions = searchable
    ? options.filter(option =>
        option.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (option.description && option.description.toLowerCase().includes(searchTerm.toLowerCase()))
      )
    : options;

  const selectedOption = options.find(option => option.value === value);

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

  const handleKeyDown = (e: React.KeyboardEvent): void => {
    if (disabled) return;
    
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      setIsOpen(!isOpen);
    } else if (e.key === 'Escape' && isOpen) {
      e.preventDefault();
      setIsOpen(false);
      setSearchTerm('');
    } else if (e.key === 'ArrowDown' && !isOpen) {
      e.preventDefault();
      setIsOpen(true);
    } else if (e.key === 'ArrowUp' && isOpen) {
      e.preventDefault();
      // Focus on last option or implement arrow key navigation
    }
  };

  return (
    <div ref={ref} className={`${classes.container} ${className}`} {...props}>
      {label && (
        <label htmlFor={id} id={`${id}-label`} className={classes.label}>
          {label}
          {required && <span className="text-red-500 ml-1" aria-label="required">*</span>}
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
          aria-label={!label ? placeholder : undefined}
          aria-describedby={[
            helperText ? `${id}-helper` : null,
            error ? `${id}-error` : null
          ].filter(Boolean).join(' ') || undefined}
          tabIndex={disabled ? -1 : 0}
          onKeyDown={handleKeyDown}
        >
          <div className={classes.content}>
            {selectedOption ? (
              <div className="flex-1">
                <div className={classes.selectedText}>
                  {selectedOption.label}
                </div>
                {showDescriptions && selectedOption.description && (
                  <div className={classes.selectedDescription}>
                    {selectedOption.description}
                  </div>
                )}
              </div>
            ) : (
              <span className={classes.placeholder}>{placeholder}</span>
            )}
          </div>
          
          <div className="flex items-center gap-2 ml-2">
            {clearable && selectedOption && !disabled && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  clearSelection();
                }}
                className={classes.clearButton}
                aria-label="Clear selection"
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
          // role="listbox" aria-multiselectable="false"
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
                    aria-label="Search options"
                    role="searchbox"
                    aria-describedby={`${id}-search-description`}
                  />
                  <span 
                    id={`${id}-search-description`} 
                    className={classes.srOnly}
                  >
                    Type to filter the available options
                  </span>
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
                  const isSelected = value === option.value;
                  const isOptionDisabled = option.disabled || false;
                  
                  return (
                    <div
                      key={option.value}
                      onClick={() => !isOptionDisabled && handleSelect(option)}
                      className={`${classes.option} ${
                        isOptionDisabled ? 'opacity-50 cursor-not-allowed' : ''
                      }`}
                      role="option"
                      aria-selected={isSelected}
                      aria-disabled={isOptionDisabled}
                      data-selected={isSelected}
                    >
                      <div className={classes.optionContent}>
                        <div className={classes.optionText}>
                          {option.label}
                        </div>
                        {showDescriptions && option.description && (
                          <div className={classes.optionDescription}>
                            {option.description}
                          </div>
                        )}
                      </div>
                      {isSelected && (
                        <Check size={getIconSize(size)} className={classes.checkIcon} />
                      )}
                    </div>
                  );
                })
              )}
            </div>
            
            {filteredOptions.length > 0 && (
              <div className={classes.footer}>
                {filteredOptions.length} option{filteredOptions.length !== 1 ? 's' : ''} available
              </div>
            )}
          </div>
        )}
      </div>

      {(error || helperText) && (
        <div className="mt-1 text-sm">
          {error && (
            <div 
              className="text-red-600" 
              id={`${id}-error`} 
              role="alert" 
              aria-live="polite"
            >
              {error}
            </div>
          )}
          {helperText && !error && (
            <div 
              className="text-gray-500" 
              id={`${id}-helper`}
            >
              {helperText}
            </div>
          )}
        </div>
      )}
    </div>
  );
});

SingleSelect.displayName = 'SingleSelect';

export default SingleSelect;