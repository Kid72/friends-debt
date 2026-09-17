import React from 'react';
import { cn } from '../../utils/cn';

export type ButtonVariant = 'filled' | 'tonal' | 'outlined' | 'text' | 'fab';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  children?: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'filled',
      size = 'md',
      fullWidth = false,
      loading = false,
      disabled = false,
      leftIcon,
      rightIcon,
      className,
      children,
      type = 'button',
      ...rest
    },
    ref
  ) => {
    const isFab = variant === 'fab';
    const isDisabled = disabled || loading;

    // Base styling
    const baseClasses =
      'relative inline-flex items-center justify-center font-medium transition-all duration-200 select-none focus:outline-none focus-visible:ring-2 focus-visible:ring-md-primary focus-visible:ring-offset-2 active:scale-[0.98] disabled:opacity-45 disabled:cursor-not-allowed disabled:pointer-events-none disabled:active:scale-100';

    // Variant-specific styling
    const variantClasses = {
      filled:
        'bg-md-primary text-md-on-primary shadow-xs hover:bg-opacity-90 hover:shadow-sm active:shadow-none',
      tonal:
        'bg-md-secondary-container text-md-on-secondary-container hover:brightness-95 active:shadow-none',
      outlined:
        'border border-md-outline/40 text-md-primary bg-transparent hover:bg-md-primary/8 active:bg-md-primary/12',
      text:
        'text-md-primary bg-transparent hover:bg-md-primary/8 active:bg-md-primary/12',
      fab:
        'rounded-2xl bg-md-primary-container text-md-on-primary-container shadow-md hover:shadow-lg hover:brightness-95 active:scale-95 active:shadow-sm',
    }[variant];

    // Size styling
    const sizeClasses = isFab
      ? {
          sm: 'min-w-10 min-h-10 p-2.5 rounded-xl text-sm gap-2',
          md: 'min-w-14 min-h-14 p-4 rounded-2xl text-base gap-2.5',
          lg: 'min-w-16 min-h-16 p-4.5 rounded-3xl text-lg gap-3',
        }[size]
      : {
          sm: 'h-8 px-3.5 py-1 text-xs gap-1.5 rounded-full',
          md: 'h-10 px-5 py-2 text-sm gap-2 rounded-full',
          lg: 'h-12 px-6 py-2.5 text-base gap-2.5 rounded-full',
        }[size];

    const spinnerSizes = {
      sm: 'h-3.5 w-3.5',
      md: 'h-4 w-4',
      lg: 'h-5 w-5',
    }[size];

    return (
      <button
        ref={ref}
        type={type}
        disabled={isDisabled}
        aria-busy={loading}
        className={cn(
          baseClasses,
          variantClasses,
          sizeClasses,
          fullWidth && 'w-full',
          className
        )}
        {...rest}
      >
        {loading && (
          <svg
            className={cn('animate-spin', spinnerSizes, children ? 'mr-1.5' : '')}
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        )}
        {!loading && leftIcon && (
          <span className="inline-flex shrink-0 items-center justify-center">
            {leftIcon}
          </span>
        )}
        {children && <span>{children}</span>}
        {!loading && rightIcon && (
          <span className="inline-flex shrink-0 items-center justify-center">
            {rightIcon}
          </span>
        )}
      </button>
    );
  }
);

Button.displayName = 'Button';
