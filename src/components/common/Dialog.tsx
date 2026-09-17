import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import { cn } from '../../utils/cn';

export interface DialogProps {
  isOpen: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  description?: React.ReactNode;
  children?: React.ReactNode;
  footer?: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'full';
  closeOnBackdropClick?: boolean;
  className?: string;
  showCloseButton?: boolean;
  ariaLabel?: string;
}

export const Dialog: React.FC<DialogProps> = ({
  isOpen,
  onClose,
  title,
  description,
  children,
  footer,
  maxWidth = 'md',
  closeOnBackdropClick = true,
  className,
  showCloseButton = true,
  ariaLabel,
}) => {
  // Handle ESC key press
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  // Lock body scroll when open
  useEffect(() => {
    if (isOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isOpen]);

  if (!isOpen) {
    return null;
  }

  const maxWidthClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    full: 'max-w-2xl',
  }[maxWidth];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto"
      role="presentation"
    >
      {/* Backdrop */}
      <div
        data-testid="dialog-backdrop"
        className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity"
        onClick={() => {
          if (closeOnBackdropClick) {
            onClose();
          }
        }}
        aria-hidden="true"
      />

      {/* Dialog Surface */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label={typeof title === 'string' ? title : ariaLabel}
        className={cn(
          'relative z-10 w-full bg-md-surface-container-low rounded-3xl p-6 shadow-xl border border-md-outline/15 animate-modal-enter flex flex-col max-h-[90vh] text-md-on-surface overflow-hidden',
          maxWidthClasses,
          className
        )}
      >
        {/* Header */}
        {(title || showCloseButton) && (
          <div className="flex items-start justify-between gap-4 pb-3">
            <div className="flex-1 min-w-0">
              {title && (
                <h2 className="text-xl font-bold tracking-tight text-md-on-surface">
                  {title}
                </h2>
              )}
              {description && (
                <p className="mt-1 text-sm text-md-on-surface-variant">
                  {description}
                </p>
              )}
            </div>

            {showCloseButton && (
              <button
                type="button"
                onClick={onClose}
                aria-label="Close"
                className="rounded-full p-2 -mr-1 -mt-1 text-md-on-surface-variant hover:text-md-on-surface hover:bg-md-surface-container-high transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-md-primary"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        )}

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto pr-1">
          {children}
        </div>

        {/* Footer Actions */}
        {footer && (
          <div className="mt-6 pt-3 flex items-center justify-end gap-3 flex-wrap border-t border-md-outline/10">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};

Dialog.displayName = 'Dialog';
