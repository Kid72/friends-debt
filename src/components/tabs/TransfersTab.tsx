import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  ArrowRight,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Share2,
  Sparkles,
  Zap,
  ExternalLink,
} from 'lucide-react';
import { Expense, Participant, Settlement, SimplifiedTransfer } from '../../types';
import { Card } from '../common/Card';
import { Button } from '../common/Button';
import { Avatar } from '../common/Avatar';
import { Badge } from '../common/Badge';
import { SettleDialog } from '../dialogs/SettleDialog';
import { useI18n } from '../../i18n/I18nContext';
import { simplifyDebts } from '../../utils/debtCalculator';
import { generateSummaryWhatsAppUrl } from '../../utils/whatsapp';
import { triggerAllSettledCelebration } from '../../utils/confetti';
import { cn } from '../../utils/cn';

export interface TransfersTabProps {
  expenses: Expense[];
  settlements?: Settlement[];
  participants: Participant[];
  currency?: string;
  roomName?: string;
  appUrl?: string;
  activeParticipant?: Participant | null;
  onSettleDebt?: (settlement: {
    fromParticipantId: string;
    toParticipantId: string;
    amount: number;
    date: string;
  }) => Promise<boolean | void> | void;
  className?: string;
}

export const TransfersTab: React.FC<TransfersTabProps> = ({
  expenses,
  settlements = [],
  participants,
  currency = '₼',
  roomName = '',
  appUrl = '',
  activeParticipant,
  onSettleDebt,
  className,
}) => {
  const { t, lang, formatMoney } = useI18n();

  // State for active settle dialog
  const [selectedTransfer, setSelectedTransfer] = useState<SimplifiedTransfer | null>(null);

  // State for tracking open explanation accordions: key = `${fromId}-${toId}`
  const [expandedExplanations, setExpandedExplanations] = useState<Record<string, boolean>>({});

  // Fast participant map lookup
  const participantMap = useMemo(() => {
    const map = new Map<string, Participant>();
    for (const p of participants) {
      map.set(p.id, p);
    }
    return map;
  }, [participants]);

  // Compute optimized transfers via Greedy Cash Flow algorithm
  const transfers: SimplifiedTransfer[] = useMemo(() => {
    return simplifyDebts(participants, expenses, settlements, currency, lang);
  }, [participants, expenses, settlements, currency, lang]);

  // Effective app URL for WhatsApp sharing
  const effectiveAppUrl =
    appUrl || (typeof window !== 'undefined' ? window.location.href : '');

  // Track if all settled celebration has fired for current non-empty state
  const prevTransfersLengthRef = useRef<number | null>(null);

  useEffect(() => {
    const prevLen = prevTransfersLengthRef.current;
    prevTransfersLengthRef.current = transfers.length;

    // Trigger celebration when transitions to zero debts from an active state,
    // or when room has completed expenses and is already fully settled.
    if (transfers.length === 0 && (expenses.length > 0 || settlements.length > 0)) {
      if (prevLen !== null && prevLen > 0) {
        triggerAllSettledCelebration();
      }
    }
  }, [transfers.length, expenses.length, settlements.length]);

  // Toggle explanation accordion for a transfer card
  const toggleExplanation = (transferKey: string) => {
    setExpandedExplanations((prev) => ({
      ...prev,
      [transferKey]: !prev[transferKey],
    }));
  };

  // WhatsApp summary link handler
  const handleShareSummary = () => {
    const summaryUrl = generateSummaryWhatsAppUrl(
      roomName,
      expenses,
      transfers,
      participants,
      currency,
      effectiveAppUrl,
      lang
    );
    if (typeof window !== 'undefined') {
      window.open(summaryUrl, '_blank', 'noopener,noreferrer');
    }
  };

  // Handle settlement confirmation
  const handleConfirmSettle = async (settlement: {
    fromParticipantId: string;
    toParticipantId: string;
    amount: number;
    date: string;
  }) => {
    if (onSettleDebt) {
      await onSettleDebt(settlement);
    }
  };

  return (
    <div className={cn('space-y-4 max-w-4xl mx-auto w-full px-2 sm:px-4 pb-12', className)}>
      {/* Top Header & Share Summary Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-md-on-surface flex items-center gap-2">
            <span>{t('settle.optimized_transfers')}</span>
            {transfers.length > 0 && (
              <Badge variant="primary" size="sm">
                {transfers.length}
              </Badge>
            )}
          </h2>
          <p className="text-xs text-md-on-surface-variant mt-0.5">
            {transfers.length > 0
              ? 'Minimum tranzaksiya ilə bütün borcların bağlanması'
              : t('balance.settled')}
          </p>
        </div>

        {/* WhatsApp Share Group Summary Button */}
        {transfers.length > 0 && (
          <Button
            variant="tonal"
            size="sm"
            onClick={handleShareSummary}
            leftIcon={<Share2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />}
            rightIcon={<ExternalLink className="w-3 h-3 text-md-on-surface-variant" />}
            className="w-full sm:w-auto font-medium"
          >
            {t('settle.share_summary')}
          </Button>
        )}
      </div>

      {/* Empty State: All Debts Settled 🎉 */}
      {transfers.length === 0 ? (
        <Card
          variant="tonal"
          className="py-12 px-6 text-center rounded-3xl mt-2 bg-gradient-to-b from-emerald-500/10 to-transparent border border-emerald-500/20 shadow-xs"
        >
          <div className="relative inline-block mx-auto mb-4">
            <div className="w-20 h-20 rounded-full bg-emerald-500/15 flex items-center justify-center text-emerald-600 dark:text-emerald-400 mx-auto shadow-inner">
              <CheckCircle2 className="w-12 h-12" />
            </div>
            <Sparkles className="w-6 h-6 text-amber-500 absolute -top-1 -right-1 animate-bounce" />
          </div>

          <h3 className="text-lg sm:text-xl font-extrabold text-md-on-surface mb-2">
            {t('settle.all_settled')}
          </h3>

          <p className="text-xs sm:text-sm text-md-on-surface-variant max-w-md mx-auto leading-relaxed mb-6">
            {expenses.length === 0
              ? t('balance.no_expenses')
              : 'Qrupdakı bütün xərclər tam hesablanıb və qarşılıqlı ödənilib. Yeni xərc əlavə edildikdə balans avtomatik yenilənəcək.'}
          </p>

          <div className="flex items-center justify-center gap-3 flex-wrap">
            <Button
              variant="filled"
              size="md"
              onClick={handleShareSummary}
              leftIcon={<Share2 className="w-4 h-4" />}
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              {t('settle.share_summary')}
            </Button>
          </div>
        </Card>
      ) : (
        /* Transfers List */
        <div className="space-y-3 pt-1">
          {transfers.map((transfer, index) => {
            const debtor = participantMap.get(transfer.fromParticipantId);
            const receiver = participantMap.get(transfer.toParticipantId);

            const debtorName = debtor?.name || transfer.fromParticipantId;
            const receiverName = receiver?.name || transfer.toParticipantId;

            const isDebtorMe = activeParticipant && activeParticipant.id === transfer.fromParticipantId;
            const isReceiverMe = activeParticipant && activeParticipant.id === transfer.toParticipantId;

            const transferKey = `${transfer.fromParticipantId}-${transfer.toParticipantId}-${index}`;
            const isExpanded = Boolean(expandedExplanations[transferKey]);

            return (
              <Card
                key={transferKey}
                variant="tonal"
                className={cn(
                  'p-4 sm:p-5 rounded-3xl border transition-all duration-200 shadow-2xs',
                  isDebtorMe
                    ? 'border-rose-500/30 bg-rose-500/5'
                    : isReceiverMe
                    ? 'border-emerald-500/30 bg-emerald-500/5'
                    : 'border-md-outline/15 hover:border-md-outline/30'
                )}
              >
                <div className="flex flex-col gap-4">
                  {/* Top: Debtor -> Arrow -> Receiver & Amount & Settle Button */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    {/* Left: Avatars and flow */}
                    <div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1">
                      {/* Debtor Info */}
                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        <Avatar
                          name={debtorName}
                          color={debtor?.avatarColor}
                          size="md"
                          className="shrink-0"
                        />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1 flex-wrap">
                            <span className="text-sm font-bold text-md-on-surface truncate">
                              {debtorName}
                            </span>
                            {isDebtorMe && (
                              <Badge variant="error" size="sm">
                                {t('header.my_profile')}
                              </Badge>
                            )}
                          </div>
                          <span className="text-[11px] text-md-on-surface-variant font-medium block truncate">
                            {t('expense.payer')}
                          </span>
                        </div>
                      </div>

                      {/* Arrow Icon */}
                      <div className="w-8 h-8 rounded-full bg-md-surface-container-high flex items-center justify-center text-md-on-surface-variant shrink-0">
                        <ArrowRight className="w-4 h-4" />
                      </div>

                      {/* Receiver Info */}
                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        <Avatar
                          name={receiverName}
                          color={receiver?.avatarColor}
                          size="md"
                          className="shrink-0"
                        />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1 flex-wrap">
                            <span className="text-sm font-bold text-md-on-surface truncate">
                              {receiverName}
                            </span>
                            {isReceiverMe && (
                              <Badge variant="success" size="sm">
                                {t('header.my_profile')}
                              </Badge>
                            )}
                          </div>
                          <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium block truncate">
                            {t('balance.you_are_owed')}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Right: Amount & Settle Button */}
                    <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-md-outline/10">
                      <span className="text-lg sm:text-xl font-extrabold text-md-on-surface font-mono">
                        {formatMoney(transfer.amount, currency)}
                      </span>

                      <Button
                        variant="filled"
                        size="sm"
                        onClick={() => setSelectedTransfer(transfer)}
                        leftIcon={<CheckCircle2 className="w-3.5 h-3.5" />}
                        className={cn(
                          'rounded-full',
                          isDebtorMe
                            ? 'bg-rose-600 hover:bg-rose-700 text-white'
                            : 'bg-md-primary text-md-on-primary'
                        )}
                      >
                        {t('settle.title')}
                      </Button>
                    </div>
                  </div>

                  {/* Explanation Accordion Toggle & Content */}
                  {transfer.explanation && (
                    <div className="pt-2 border-t border-md-outline/10">
                      <button
                        type="button"
                        onClick={() => toggleExplanation(transferKey)}
                        aria-expanded={isExpanded}
                        className="flex items-center justify-between w-full text-xs font-semibold text-md-on-surface-variant hover:text-md-on-surface transition-colors py-1 cursor-pointer"
                      >
                        <span className="flex items-center gap-1.5">
                          <Zap className="w-3.5 h-3.5 text-amber-500" />
                          <span>{t('settle.how_it_simplified')}</span>
                        </span>
                        {isExpanded ? (
                          <ChevronUp className="w-4 h-4 text-md-on-surface-variant" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-md-on-surface-variant" />
                        )}
                      </button>

                      {isExpanded && (
                        <div className="mt-2 p-3 rounded-2xl bg-md-surface-container-high/60 border border-md-outline/10 text-xs text-md-on-surface-variant leading-relaxed animate-fade-in">
                          <p>
                            {transfer.explanation[lang] || transfer.explanation.az}
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Settle Up Confirmation and WhatsApp Share Dialog */}
      {selectedTransfer && (
        <SettleDialog
          isOpen={Boolean(selectedTransfer)}
          onClose={() => setSelectedTransfer(null)}
          transfer={selectedTransfer}
          participants={participants}
          currency={currency}
          roomName={roomName}
          appUrl={effectiveAppUrl}
          onConfirmSettle={handleConfirmSettle}
        />
      )}
    </div>
  );
};

TransfersTab.displayName = 'TransfersTab';
