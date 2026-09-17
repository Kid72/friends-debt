import React from 'react';
import { cn } from '../../utils/cn';

export type BadgeVariant = 'neutral' | 'success' | 'warning' | 'error' | 'info' | 'primary';
export type BadgeSize = 'sm' | 'md';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  size?: BadgeSize;
  icon?: React.ReactNode;
  children: React.ReactNode;
}

export const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  (
    {
      variant = 'neutral',
      size = 'sm',
      icon,
      className,
      children,
      ...rest
    },
    ref
  ) => {
    const variantClasses = {
      neutral: 'bg-md-surface-container-high text-md-on-surface-variant',
      success: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300',
      warning: 'bg-amber-100 text-amber-900 dark:bg-amber-950/60 dark:text-amber-300',
      error: 'bg-md-error-container text-md-on-error-container',
      info: 'bg-md-tertiary-container text-md-on-tertiary-container',
      primary: 'bg-md-primary-container text-md-on-primary-container',
    }[variant];

    const sizeClasses = {
      sm: 'px-2.5 py-0.5 text-xs gap-1',
      md: 'px-3 py-1 text-xs sm:text-sm gap-1.5',
    }[size];

    return (
      <span
        ref={ref}
        className={cn(
          'inline-flex items-center font-medium rounded-full select-none transition-colors duration-200',
          variantClasses,
          sizeClasses,
          className
        )}
        {...rest}
      >
        {icon && <span className="inline-flex shrink-0 items-center justify-center">{icon}</span>}
        {children}
      </span>
    );
  }
);

Badge.displayName = 'Badge';
