import React, { useState, useRef, useEffect } from "react";
import { ChevronDown, Check, X, Search } from "lucide-react";
import { useControllableState } from "@/ui/hooks/useControllableState";
import { singleSelect } from "./style-variants/main";
export interface Option {
  value: string;
  label: string;
  disabled?: boolean;
  description?: string;
}

export type Size = "sm" | "md" | "lg";
export type Variant = "default" | "secondary" | "success" | "error";

export interface SingleSelectProps
  extends Omit<
    React.HTMLAttributes<HTMLDivElement>,
    "onChange" | "defaultValue"
  > {
  options: Option[];
  value?: string | null;
  defaultValue?: string | null;
  onChange?: (value: string | null) => void;
  placeholder?: string;
  label?: string;
  id?: string;
  size?: Size;
  variant?: Variant;
  disabled?: boolean;
  searchable?: boolean;
  clearable?: boolean;
  error?: string;
  helperText?: string;
  required?: boolean;
  className?: string;
  showDescriptions?: boolean;
}



// --- Component ---
const SingleSelect = React.forwardRef<HTMLDivElement, SingleSelectProps>(
  (
    {
      options = [],
      value,
      defaultValue = null,
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
    },
    ref
  ) => {
    const [selectedValue, setSelectedValue] = useControllableState<
      string | null
    >({
      value,
      defaultValue,
      onChange,
    });

    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Generate classes using tailwind-variants
    const {
      container,
      label: labelClass,
      trigger: triggerClass,
      content,
      placeholder: placeholderClass,
      selectedText,
      selectedDescription,
      dropdown,
      searchContainer,
      searchInput,
      optionsList,
      option: optionClass,
      optionContent,
      optionText,
      optionDescription,
      checkIcon,
      footer,
      clearButton,
      chevron,
      errorText,
      helperText: helperTextClass,
    } = singleSelect({
      size,
      variant: error ? "error" : variant,
      disabled,
    });

    // close on outside click
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
      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleSelect = (option: Option): void => {
      if (disabled || option.disabled) return;
      setSelectedValue(option.value);
      setIsOpen(false);
      setSearchTerm("");
    };

    const clearSelection = (): void => {
      if (disabled) return;
      setSelectedValue(null);
    };

    const filteredOptions = searchable
      ? options.filter(
          (option) =>
            option.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (option.description &&
              option.description
                .toLowerCase()
                .includes(searchTerm.toLowerCase()))
        )
      : options;

    const selectedOption = options.find(
      (option) => option.value === selectedValue
    );

    const getIconSize = (size: Size): number =>
      size === "sm" ? 12 : size === "lg" ? 16 : 14;

    const getChevronSize = (size: Size): number =>
      size === "sm" ? 14 : size === "lg" ? 18 : 16;

    const handleKeyDown = (e: React.KeyboardEvent): void => {
      if (disabled) return;

      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        setIsOpen(!isOpen);
      } else if (e.key === "Escape" && isOpen) {
        e.preventDefault();
        setIsOpen(false);
        setSearchTerm("");
      } else if (e.key === "ArrowDown" && !isOpen) {
        e.preventDefault();
        setIsOpen(true);
      }
    };

    return (
      <div ref={ref} className={container({ class: className })} {...props}>
        {label && (
          <label htmlFor={id} id={`${id}-label`} className={labelClass()}>
            {label}
            {required && (
              <span className="text-red-500 ml-1" aria-label="required">
                *
              </span>
            )}
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
            aria-label={!label ? placeholder : undefined}
            aria-describedby={
              [helperText ? `${id}-helper` : null, error ? `${id}-error` : null]
                .filter(Boolean)
                .join(" ") || undefined
            }
            tabIndex={disabled ? -1 : 0}
            onKeyDown={handleKeyDown}
          >
            <div className={content()}>
              {selectedOption ? (
                <div className="flex-1">
                  <div className={selectedText()}>{selectedOption.label}</div>
                  {showDescriptions && selectedOption.description && (
                    <div className={selectedDescription()}>
                      {selectedOption.description}
                    </div>
                  )}
                </div>
              ) : (
                <span className={placeholderClass()}>{placeholder}</span>
              )}
            </div>

            <div className="flex items-center gap-2 ml-2">
              {clearable && selectedOption && !disabled && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    clearSelection();
                  }}
                  className={clearButton()}
                  aria-label="Clear selection"
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
                      aria-label="Search options"
                      role="searchbox"
                      aria-describedby={`${id}-search-description`}
                    />
                    <span id={`${id}-search-description`} className="sr-only">
                      Type to filter the available options
                    </span>
                  </div>
                </div>
              )}

              <div className={optionsList()}>
                {filteredOptions.length === 0 ? (
                  <div className="px-3 py-2 text-sm text-gray-500">
                    {searchTerm ? "No options found" : "No options available"}
                  </div>
                ) : (
                  filteredOptions.map((option) => {
                    const isSelected = selectedValue === option.value;
                    const isOptionDisabled = option.disabled || false;

                    return (
                      <div
                        key={option.value}
                        onClick={() =>
                          !isOptionDisabled && handleSelect(option)
                        }
                        className={`${optionClass()} ${
                          isOptionDisabled
                            ? "opacity-50 cursor-not-allowed"
                            : ""
                        }`}
                        role="option"
                        aria-selected={isSelected}
                        aria-disabled={isOptionDisabled}
                        data-selected={isSelected}
                      >
                        <div className={optionContent()}>
                          <div className={optionText()}>{option.label}</div>
                          {showDescriptions && option.description && (
                            <div className={optionDescription()}>
                              {option.description}
                            </div>
                          )}
                        </div>
                        {isSelected && (
                          <Check
                            size={getIconSize(size)}
                            className={checkIcon()}
                          />
                        )}
                      </div>
                    );
                  })
                )}
              </div>

              {filteredOptions.length > 0 && (
                <div className={footer()}>
                  {filteredOptions.length} option
                  {filteredOptions.length !== 1 ? "s" : ""} available
                </div>
              )}
            </div>
          )}
        </div>

        {(error || helperText) && (
          <div className="mt-1 text-sm">
            {error && (
              <div
                className={errorText()}
                id={`${id}-error`}
                role="alert"
                aria-live="polite"
              >
                {error}
              </div>
            )}
            {helperText && !error && (
              <div className={helperTextClass()} id={`${id}-helper`}>
                {helperText}
              </div>
            )}
          </div>
        )}
      </div>
    );
  }
);

SingleSelect.displayName = "SingleSelect";

export default SingleSelect;
