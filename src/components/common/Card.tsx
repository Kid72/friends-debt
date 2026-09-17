import React from 'react';
import { cn } from '../../utils/cn';

export type CardVariant = 'elevated' | 'filled' | 'tonal' | 'outlined';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: CardVariant;
  interactive?: boolean;
  children: React.ReactNode;
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  (
    {
      variant = 'tonal',
      interactive = false,
      className,
      children,
      onClick,
      onKeyDown,
      tabIndex,
      ...rest
    },
    ref
  ) => {
    const variantClasses = {
      tonal: 'bg-md-surface-container text-md-on-surface',
      elevated: 'bg-md-surface-container-low text-md-on-surface shadow-sm hover:shadow-md border-0',
      filled: 'bg-md-surface-container-highest text-md-on-surface',
      outlined: 'bg-md-surface text-md-on-surface border border-md-outline/20',
    }[variant];

    const interactiveClasses = interactive
      ? 'cursor-pointer transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md active:translate-y-0 active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-md-primary focus-visible:ring-offset-2'
      : 'transition-colors duration-200';

    const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
      if (interactive && onClick && (e.key === 'Enter' || e.key === ' ')) {
        e.preventDefault();
        onClick(e as unknown as React.MouseEvent<HTMLDivElement>);
      }
      onKeyDown?.(e);
    };

    return (
      <div
        ref={ref}
        role={interactive ? 'button' : undefined}
        tabIndex={interactive && tabIndex === undefined ? 0 : tabIndex}
        onClick={onClick}
        onKeyDown={handleKeyDown}
        className={cn(
          'rounded-3xl p-5',
          variantClasses,
          interactiveClasses,
          className
        )}
        {...rest}
      >
        {children}
      </div>
    );
  }
);

Card.displayName = 'Card';
