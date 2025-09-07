import React, { useState, useRef, useEffect } from "react";
import { ChevronDown, Check, X, Search } from "lucide-react";
import { useDragSelect } from "@/ui/hooks/useDragSelect";
import { useControllableState } from "@/ui/hooks/useControllableState";
import { tv } from "tailwind-variants";

// Types (updated to support uncontrolled state)
export interface Option {
  value: string;
  label: string;
  disabled?: boolean;
}

export type Size = "sm" | "md" | "lg";
export type Variant = "default" | "secondary" | "success" | "error";

export interface MultiSelectProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "onChange"> {
  options: Option[];
  /** Controlled selected values */
  value?: string[];
  /** Default values for uncontrolled mode */
  defaultValue?: string[];
  /** Callback when selection changes */
  onChange?: (values: string[]) => void;
  placeholder?: string;
  label?: string;
  id?: string;
  size?: Size;
  variant?: Variant;
  disabled?: boolean;
  searchable?: boolean;
  clearable?: boolean;
  maxDisplayed?: number;
  error?: string;
  helperText?: string;
  required?: boolean;
  className?: string;
  enableDragSelect?: boolean;
}

// Create tailwind-variants (unchanged)
const multiSelect = tv({
  slots: {
    container: "relative w-full",
    label: "block text-sm font-medium mb-2 transition-colors text-gray-700",
    trigger:
      "min-h-[42px] w-full px-3 py-2 border rounded-lg shadow-sm bg-white cursor-pointer transition-all duration-200 flex items-center justify-between border-gray-300 hover:border-gray-400 focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500",
    content: "flex-1 flex flex-wrap gap-1",
    placeholder: "text-gray-500 py-1 select-none",
    dropdown:
      "absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden",
    searchContainer: "p-3 border-b border-gray-100",
    searchInput:
      "w-full px-3 py-2 text-sm border border-gray-200 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500",
    optionsList: "max-h-48 overflow-y-auto",
    option:
      "flex items-center px-3 py-2.5 cursor-pointer transition-colors hover:bg-gray-50",
    checkbox:
      "flex items-center justify-center w-4 h-4 mr-3 border border-gray-300 rounded transition-all duration-200 data-[selected=true]:bg-blue-500 data-[selected=true]:border-blue-500 data-[selected=true]:text-white",
    optionText: "text-sm select-none text-gray-700",
    footer:
      "px-3 py-2 border-t border-gray-100 text-xs bg-gray-50 text-gray-600",
    tag: "inline-flex items-center gap-1.5 px-2.5 py-1 text-sm rounded-md transition-all duration-200 bg-blue-100 text-blue-800 hover:bg-blue-200",
    tagRemove: "hover:bg-opacity-20 rounded-full p-0.5 transition-colors",
    clearButton: "text-gray-400 hover:text-gray-600 transition-colors p-0.5",
    chevron: "text-gray-400 transition-transform duration-200",
    errorText: "text-red-600",
    helperText: "text-gray-500",
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
      default: {},
      secondary: {
        label: "text-gray-700",
        trigger:
          "border-gray-300 hover:border-gray-400 focus-within:ring-2 focus-within:ring-gray-500 focus-within:border-gray-500",
        dropdown: "border-gray-200",
        searchInput:
          "border-gray-200 focus:ring-gray-500 focus:border-gray-500",
        checkbox:
          "border-gray-300 data-[selected=true]:bg-gray-600 data-[selected=true]:border-gray-600 data-[selected=true]:text-white",
        tag: "bg-gray-100 text-gray-800 hover:bg-gray-200",
        footer: "bg-gray-50 text-gray-600 border-gray-100",
      },
      success: {
        label: "text-gray-700",
        trigger:
          "border-green-300 hover:border-green-400 focus-within:ring-2 focus-within:ring-green-500 focus-within:border-green-500",
        dropdown: "border-green-200",
        searchInput:
          "border-green-200 focus:ring-green-500 focus:border-green-500",
        option: "hover:bg-green-50",
        checkbox:
          "border-green-300 data-[selected=true]:bg-green-500 data-[selected=true]:border-green-500 data-[selected=true]:text-white",
        footer: "bg-green-50 text-green-600 border-green-100",
        tag: "bg-green-100 text-green-800 hover:bg-green-200",
      },
      error: {
        label: "text-red-700",
        trigger:
          "border-red-300 hover:border-red-400 focus-within:ring-2 focus-within:ring-red-500 focus-within:border-red-500",
        dropdown: "border-red-200",
        searchInput: "border-red-200 focus:ring-red-500 focus:border-red-500",
        option: "hover:bg-red-50",
        checkbox:
          "border-red-300 data-[selected=true]:bg-red-500 data-[selected=true]:border-red-500 data-[selected=true]:text-white",
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
});

const MultiSelect = React.forwardRef<HTMLDivElement, MultiSelectProps>(
  (
    {
      options = [],
      value,
      defaultValue = [],
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
      enableDragSelect = true,
      ...props
    },
    ref
  ) => {
    const [isOpen, setIsOpen] = useState<boolean>(false);
    const [searchTerm, setSearchTerm] = useState<string>("");
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Use controllable state for value with proper typing
    const [selectedValues, setSelectedValues] = useControllableState<string[]>({
      value,
      defaultValue,
      onChange,
    });

    // Generate classes using tailwind-variants
    const {
      container,
      label: labelClass,
      trigger: triggerClass,
      content,
      placeholder: placeholderClass,
      dropdown,
      searchContainer,
      searchInput,
      optionsList,
      option: optionClass,
      checkbox: checkboxClass,
      optionText,
      footer,
      tag: tagClass,
      tagRemove,
      clearButton,
      chevron,
      errorText,
      helperText: helperTextClass,
    } = multiSelect({
      size,
      variant: error ? "error" : variant,
      disabled,
    });

    const { handleMouseDown, handleMouseEnter, handleMouseUp } =
      useDragSelect<Option>({
        items: options,
        selectedIds: selectedValues || [],
        onChange: setSelectedValues,
        getId: (opt) => opt.value,
      });

    useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        if (
          dropdownRef.current &&
          !dropdownRef.current.contains(event.target as Node)
        ) {
          setIsOpen(false);
          setSearchTerm("");
        }
      };
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("mouseup", handleMouseUp);
      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
        document.removeEventListener("mouseup", handleMouseUp);
      };
    }, [handleMouseUp]);

    const handleToggle = (option: Option): void => {
      if (disabled || option.disabled) return;

      const currentValues = selectedValues || [];
      const newValue = currentValues.includes(option.value)
        ? currentValues.filter((v) => v !== option.value)
        : [...currentValues, option.value];

      setSelectedValues(newValue);
    };

    const removeItem = (valueToRemove: string): void => {
      if (disabled) return;
      const currentValues = selectedValues || [];
      setSelectedValues(currentValues.filter((v) => v !== valueToRemove));
    };

    const clearAll = (): void => {
      if (disabled) return;
      setSelectedValues([]);
    };

    const filteredOptions = searchable
      ? options.filter((option) =>
          option.label.toLowerCase().includes(searchTerm.toLowerCase())
        )
      : options;

    const currentValues = selectedValues || [];
    const selectedOptions = options.filter((option) =>
      currentValues.includes(option.value)
    );
    const displayedTags = selectedOptions.slice(0, maxDisplayed);
    const remainingCount = selectedOptions.length - maxDisplayed;

    const getIconSize = (size: Size): number => {
      switch (size) {
        case "sm":
          return 12;
        case "lg":
          return 16;
        default:
          return 14;
      }
    };

    const getChevronSize = (size: Size): number => {
      switch (size) {
        case "sm":
          return 14;
        case "lg":
          return 18;
        default:
          return 16;
      }
    };

    return (
      <div ref={ref} className={container({ class: className })} {...props}>
        {label && (
          <label htmlFor={id} className={labelClass()}>
            {label}
            {required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}

        <div className={container()} ref={dropdownRef}>
          <div
            className={triggerClass()}
            onClick={() => !disabled && setIsOpen(!isOpen)}
            role="combobox"
            aria-expanded={isOpen}
            aria-haspopup="listbox"
            aria-labelledby={label ? `${id}-label` : undefined}
          >
            <div className={content()}>
              {selectedOptions.length === 0 ? (
                <span className={placeholderClass()}>{placeholder}</span>
              ) : (
                <>
                  {displayedTags.map((option) => (
                    <span key={option.value} className={tagClass()}>
                      {option.label}
                      {!disabled && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            removeItem(option.value);
                          }}
                          className={tagRemove()}
                          aria-label={`Remove ${option.label}`}
                          type="button"
                        >
                          <X size={getIconSize(size)} />
                        </button>
                      )}
                    </span>
                  ))}
                  {remainingCount > 0 && (
                    <span className={tagClass()}>+{remainingCount} more</span>
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
                  className={clearButton()}
                  aria-label="Clear all selections"
                  type="button"
                >
                  <X size={getChevronSize(size)} />
                </button>
              )}
              <ChevronDown
                size={getChevronSize(size)}
                className={`${chevron()} ${isOpen ? "rotate-180" : ""}`}
              />
            </div>
          </div>

          {isOpen && !disabled && (
            <div className={dropdown()}>
              {searchable && (
                <div className={searchContainer()}>
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
                      className={`${searchInput()} pl-10`}
                      autoFocus
                    />
                  </div>
                </div>
              )}

              <div className={optionsList()}>
                {filteredOptions.length === 0 ? (
                  <div className="px-3 py-2 text-sm text-gray-500">
                    {searchTerm ? "No options found" : "No options available"}
                  </div>
                ) : (
                  filteredOptions.map((option, index) => {
                    const isSelected = (selectedValues || []).includes(
                      option.value
                    );
                    const isOptionDisabled = option.disabled || false;

                    return (
                      <div
                        key={option.value}
                        onClick={() =>
                          !isOptionDisabled && handleToggle(option)
                        }
                        onMouseDown={
                          enableDragSelect && !isOptionDisabled
                            ? () => handleMouseDown(index)
                            : undefined
                        }
                        onMouseEnter={
                          enableDragSelect && !isOptionDisabled
                            ? () => handleMouseEnter(index)
                            : undefined
                        }
                        className={`${optionClass()} ${
                          isOptionDisabled
                            ? "opacity-50 cursor-not-allowed"
                            : ""
                        }`}
                        role="option"
                        aria-selected={isSelected}
                        aria-disabled={isOptionDisabled}
                      >
                        <div
                          className={checkboxClass()}
                          data-selected={isSelected}
                        >
                          {isSelected && <Check size={getIconSize(size)} />}
                        </div>
                        <span className={optionText()}>{option.label}</span>
                      </div>
                    );
                  })
                )}
              </div>

              {selectedOptions.length > 0 && (
                <div className={footer()}>
                  {selectedOptions.length} option
                  {selectedOptions.length !== 1 ? "s" : ""} selected
                </div>
              )}
            </div>
          )}
        </div>

        {(error || helperText) && (
          <div className="mt-1 text-sm">
            {error && <div className={errorText()}>{error}</div>}
            {helperText && !error && (
              <div className={helperTextClass()}>{helperText}</div>
            )}
          </div>
        )}
      </div>
    );
  }
);

MultiSelect.displayName = "MultiSelect";

export default MultiSelect;
