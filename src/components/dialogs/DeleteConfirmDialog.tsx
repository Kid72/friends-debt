import React, { useState } from 'react';
import { AlertTriangle, Trash2 } from 'lucide-react';
import { Dialog } from '../common/Dialog';
import { Button } from '../common/Button';
import { useI18n } from '../../i18n/I18nContext';

export interface DeleteConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<any>;
  title?: string;
  description?: string;
  itemName?: string;
  itemType?: 'expense' | 'settlement';
  isLoading?: boolean;
}

export const DeleteConfirmDialog: React.FC<DeleteConfirmDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  itemName,
  itemType = 'expense',
  isLoading = false,
}) => {
  const { t } = useI18n();
  const [internalLoading, setInternalLoading] = useState(false);

  const isSubmitting = isLoading || internalLoading;

  const handleConfirm = async () => {
    try {
      setInternalLoading(true);
      await onConfirm();
      onClose();
    } catch {
      // Error handled by caller or state
    } finally {
      setInternalLoading(false);
    }
  };

  const dialogTitle = title || t('delete.confirm_title');

  const defaultDescription =
    description ||
    (itemType === 'expense' && itemName
      ? t('expense.delete_confirm', { title: itemName })
      : itemName
      ? `${itemName}`
      : undefined);

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title={dialogTitle}
      maxWidth="sm"
      footer={
        <div className="flex items-center justify-end gap-2.5 w-full sm:w-auto">
          <Button
            type="button"
            variant="text"
            size="md"
            onClick={onClose}
            disabled={isSubmitting}
          >
            {t('common.cancel')}
          </Button>
          <Button
            type="button"
            variant="filled"
            size="md"
            onClick={handleConfirm}
            loading={isSubmitting}
            leftIcon={<Trash2 className="w-4 h-4" />}
            className="bg-rose-600 hover:bg-rose-700 text-white focus-visible:ring-rose-500"
          >
            {t('common.delete')}
          </Button>
        </div>
      }
    >
      <div className="space-y-4 py-2">
        {/* Warning Icon Badge */}
        <div className="flex items-center gap-3.5 p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-950 dark:text-rose-100">
          <div className="w-10 h-10 rounded-full bg-rose-500/20 text-rose-700 dark:text-rose-300 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            {defaultDescription && (
              <p className="text-sm font-semibold leading-snug break-words">
                {defaultDescription}
              </p>
            )}
            <p className="text-xs text-rose-800/80 dark:text-rose-200/80 mt-1">
              {t('delete.warning_recalc')}
            </p>
          </div>
        </div>
      </div>
    </Dialog>
  );
};

DeleteConfirmDialog.displayName = 'DeleteConfirmDialog';
