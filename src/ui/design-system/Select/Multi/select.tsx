import React, { useState, useRef, useEffect } from "react";
import { ChevronDown, Check, X, Search } from "lucide-react";
import { useDragSelect } from "@/ui/hooks/useDragSelect";
import { useControllableState } from "@/ui/hooks/useControllableState";
import { multiSelect } from "../style-variants/main";

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
