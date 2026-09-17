import React from 'react';
import { cn } from '../../utils/cn';

export interface SegmentedOption<T extends string = string> {
  value: T;
  label: React.ReactNode;
  icon?: React.ReactNode;
  badge?: React.ReactNode;
  disabled?: boolean;
  ariaLabel?: string;
}

export interface SegmentedButtonProps<T extends string = string> {
  options: SegmentedOption<T>[];
  value: T;
  onChange: (value: T) => void;
  size?: 'sm' | 'md';
  fullWidth?: boolean;
  className?: string;
  name?: string;
}

export function SegmentedButton<T extends string = string>({
  options,
  value,
  onChange,
  size = 'md',
  fullWidth = false,
  className,
  name,
}: SegmentedButtonProps<T>) {
  const sizeClasses = {
    sm: 'text-xs py-1 px-3 min-h-[32px] gap-1.5',
    md: 'text-sm py-1.5 px-4 min-h-[38px] gap-2',
  }[size];

  return (
    <div
      role="radiogroup"
      aria-label={name}
      className={cn(
        'inline-flex items-center p-1 bg-md-surface-container rounded-full border border-md-outline/15 select-none transition-colors duration-200',
        fullWidth ? 'w-full flex' : '',
        className
      )}
    >
      {options.map((option) => {
        const isSelected = option.value === value;

        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={isSelected}
            aria-label={option.ariaLabel}
            disabled={option.disabled}
            onClick={() => {
              if (!option.disabled && option.value !== value) {
                onChange(option.value);
              }
            }}
            className={cn(
              'relative rounded-full font-medium transition-all duration-200 flex items-center justify-center text-center cursor-pointer select-none focus:outline-none focus-visible:ring-2 focus-visible:ring-md-primary',
              sizeClasses,
              fullWidth ? 'flex-1' : '',
              isSelected
                ? 'bg-md-surface-container-lowest text-md-primary font-semibold shadow-xs'
                : 'text-md-on-surface-variant hover:text-md-on-surface hover:bg-md-surface-container-high/60 active:scale-[0.98]',
              option.disabled && 'opacity-40 cursor-not-allowed pointer-events-none'
            )}
          >
            {option.icon && (
              <span className="inline-flex shrink-0 items-center justify-center">
                {option.icon}
              </span>
            )}
            <span>{option.label}</span>
            {option.badge && (
              <span className="inline-flex shrink-0 items-center justify-center ml-1">
                {option.badge}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

SegmentedButton.displayName = 'SegmentedButton';
