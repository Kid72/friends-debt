import React, { useState, useEffect } from 'react';
import {
  ArrowRight,
  CheckCircle2,
  Share2,
  ExternalLink,
  Sparkles,
} from 'lucide-react';
import { Participant, SimplifiedTransfer } from '../../types';
import { Dialog } from '../common/Dialog';
import { Button } from '../common/Button';
import { Avatar } from '../common/Avatar';
import { useI18n } from '../../i18n/I18nContext';
import { generateSettleWhatsAppUrl } from '../../utils/whatsapp';
import { triggerSettlementConfetti } from '../../utils/confetti';
import { sendDebtSettledNotification } from '../../utils/notifications';

export interface SettleDialogProps {
  isOpen: boolean;
  onClose: () => void;
  transfer: SimplifiedTransfer | null;
  participants: Participant[];
  currency?: string;
  roomName?: string;
  appUrl?: string;
  onConfirmSettle: (settlement: {
    fromParticipantId: string;
    toParticipantId: string;
    amount: number;
    date: string;
  }) => Promise<boolean | void> | void;
}

export const SettleDialog: React.FC<SettleDialogProps> = ({
  isOpen,
  onClose,
  transfer,
  participants,
  currency = '₼',
  appUrl = '',
  onConfirmSettle,
}) => {
  const { t, lang, formatMoney } = useI18n();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  // Reset state when dialog opens or transfer changes
  useEffect(() => {
    if (isOpen) {
      setIsSubmitting(false);
      setIsSuccess(false);
    }
  }, [isOpen, transfer]);

  if (!transfer) return null;

  const debtor = participants.find((p) => p.id === transfer.fromParticipantId);
  const receiver = participants.find((p) => p.id === transfer.toParticipantId);

  const debtorName = debtor?.name || transfer.fromParticipantId;
  const receiverName = receiver?.name || transfer.toParticipantId;
  const formattedAmount = formatMoney(transfer.amount, currency);

  // Effective app url
  const effectiveAppUrl =
    appUrl || (typeof window !== 'undefined' ? window.location.href : '');

  // WhatsApp link for settlement
  const whatsAppUrl = generateSettleWhatsAppUrl(
    debtorName,
    receiverName,
    transfer.amount,
    currency,
    effectiveAppUrl,
    lang
  );

  const handleConfirm = async () => {
    setIsSubmitting(true);
    try {
      const todayStr = new Date().toISOString().slice(0, 10);
      await onConfirmSettle({
        fromParticipantId: transfer.fromParticipantId,
        toParticipantId: transfer.toParticipantId,
        amount: transfer.amount,
        date: todayStr,
      });

      // Trigger celebration confetti
      triggerSettlementConfetti();

      // Trigger Web Notification
      sendDebtSettledNotification(
        debtorName,
        receiverName,
        transfer.amount,
        currency,
        lang
      );

      setIsSuccess(true);
    } catch {
      // In case of error, allow retry
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenWhatsApp = () => {
    if (typeof window !== 'undefined') {
      window.open(whatsAppUrl, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title={isSuccess ? t('settle.settled_success') : t('settle.title')}
      maxWidth="md"
    >
      {!isSuccess ? (
        <div className="space-y-5 pt-1">
          {/* Transfer Visual Card */}
          <div className="bg-md-surface-container rounded-3xl p-5 border border-md-outline/15 shadow-2xs">
            <div className="flex items-center justify-between gap-4">
              {/* Debtor */}
              <div className="flex flex-col items-center text-center flex-1 min-w-0">
                <Avatar
                  name={debtorName}
                  color={debtor?.avatarColor}
                  size="lg"
                  className="mb-1.5 shadow-xs"
                />
                <span className="text-sm font-bold text-md-on-surface truncate max-w-full">
                  {debtorName}
                </span>
                <span className="text-[11px] text-md-on-surface-variant font-medium">
                  {t('expense.payer')}
                </span>
              </div>

              {/* Arrow and Amount */}
              <div className="flex flex-col items-center justify-center shrink-0 px-2">
                <span className="text-lg sm:text-xl font-extrabold text-md-primary font-mono mb-1">
                  {formattedAmount}
                </span>
                <div className="w-10 h-10 rounded-full bg-md-primary/10 flex items-center justify-center text-md-primary">
                  <ArrowRight className="w-5 h-5" />
                </div>
              </div>

              {/* Receiver */}
              <div className="flex flex-col items-center text-center flex-1 min-w-0">
                <Avatar
                  name={receiverName}
                  color={receiver?.avatarColor}
                  size="lg"
                  className="mb-1.5 shadow-xs"
                />
                <span className="text-sm font-bold text-md-on-surface truncate max-w-full">
                  {receiverName}
                </span>
                <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
                  {t('balance.you_are_owed')}
                </span>
              </div>
            </div>

            {/* Explanation snippet */}
            {transfer.explanation && (
              <div className="mt-4 pt-3 border-t border-md-outline/10 text-xs text-md-on-surface-variant leading-relaxed">
                <p>{transfer.explanation[lang] || transfer.explanation.az}</p>
              </div>
            )}
          </div>

          {/* Question Text */}
          <p className="text-sm text-md-on-surface-variant leading-normal">
            {t('settle.confirm_question', {
              debtor: debtorName,
              receiver: receiverName,
              amount: formattedAmount,
            })}
          </p>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <Button
              variant="outlined"
              onClick={onClose}
              disabled={isSubmitting}
            >
              {t('common.cancel')}
            </Button>
            <Button
              variant="filled"
              onClick={handleConfirm}
              loading={isSubmitting}
              leftIcon={<CheckCircle2 className="w-4 h-4" />}
            >
              {t('settle.confirm_button')}
            </Button>
          </div>
        </div>
      ) : (
        /* Success State */
        <div className="py-4 text-center space-y-5">
          {/* Celebratory Icon */}
          <div className="relative inline-block mx-auto">
            <div className="w-16 h-16 rounded-full bg-emerald-500/15 flex items-center justify-center text-emerald-600 dark:text-emerald-400 mx-auto">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <Sparkles className="w-5 h-5 text-amber-500 absolute -top-1 -right-1 animate-pulse" />
          </div>

          <div className="space-y-1.5">
            <p className="text-sm text-md-on-surface-variant max-w-sm mx-auto">
              {t('settle.success_msg', {
                debtor: debtorName,
                receiver: receiverName,
                amount: formattedAmount,
              })}
            </p>
          </div>

          {/* WhatsApp Share Card */}
          <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-left">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                <Share2 className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-md-on-surface">
                  {t('settle.share_whatsapp')}
                </h4>
                <p className="text-[11px] text-md-on-surface-variant">
                  {debtorName} ➡️ {formattedAmount} ➡️ {receiverName}
                </p>
              </div>
            </div>

            <Button
              variant="filled"
              size="sm"
              onClick={handleOpenWhatsApp}
              className="bg-emerald-600 hover:bg-emerald-700 text-white w-full sm:w-auto"
              rightIcon={<ExternalLink className="w-3.5 h-3.5" />}
            >
              {t('settle.share_whatsapp')}
            </Button>
          </div>

          {/* Close Action */}
          <div className="pt-2 flex justify-end">
            <Button variant="tonal" onClick={onClose}>
              {t('common.close')}
            </Button>
          </div>
        </div>
      )}
    </Dialog>
  );
};

SettleDialog.displayName = 'SettleDialog';
