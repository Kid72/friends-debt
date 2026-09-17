import React, { useState, useEffect, useMemo } from 'react';
import {
  Calendar,
  User,
  Users,
  Check,
  AlertCircle,
  CheckCircle2,
  Trash2,
  Divide,
} from 'lucide-react';
import { Expense, Participant, SplitItem, SplitMode } from '../../types';
import { Dialog } from '../common/Dialog';
import { Button } from '../common/Button';
import { Avatar } from '../common/Avatar';
import { SegmentedButton } from '../common/SegmentedButton';
import { useI18n } from '../../i18n/I18nContext';
import { cn } from '../../utils/cn';

export interface ExpenseDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (expenseData: {
    id?: string;
    title: string;
    amount: number;
    payerId: string;
    date: string;
    splitMode: SplitMode;
    involvedParticipantIds: string[];
    customSplits?: SplitItem[];
  }) => void | Promise<any>;
  onDelete?: (expenseId: string) => void | Promise<any>;
  initialExpense?: Expense | null;
  participants: Participant[];
  activeParticipant?: Participant | null;
  currency?: string;
}

export const ExpenseDialog: React.FC<ExpenseDialogProps> = ({
  isOpen,
  onClose,
  onSave,
  onDelete,
  initialExpense,
  participants,
  activeParticipant,
  currency = '₼',
}) => {
  const { t, formatMoney } = useI18n();

  const isEditMode = Boolean(initialExpense);

  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [payerId, setPayerId] = useState('');
  const [splitMode, setSplitMode] = useState<SplitMode>('equal');
  const [involvedParticipantIds, setInvolvedParticipantIds] = useState<string[]>([]);
  const [customSplitsMap, setCustomSplitsMap] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initialize or reset form values when dialog opens or initialExpense changes
  useEffect(() => {
    if (!isOpen) return;

    if (initialExpense) {
      setTitle(initialExpense.title);
      setAmount(initialExpense.amount.toString());
      setDate(initialExpense.date || new Date().toISOString().slice(0, 10));
      setPayerId(initialExpense.payerId);
      setSplitMode(initialExpense.splitMode || 'equal');
      setInvolvedParticipantIds(
        initialExpense.involvedParticipantIds && initialExpense.involvedParticipantIds.length > 0
          ? initialExpense.involvedParticipantIds
          : participants.map((p) => p.id)
      );

      const splitMap: Record<string, string> = {};
      if (initialExpense.customSplits && initialExpense.customSplits.length > 0) {
        for (const item of initialExpense.customSplits) {
          splitMap[item.participantId] = item.amount.toString();
        }
      }
      setCustomSplitsMap(splitMap);
    } else {
      // Add mode defaults
      setTitle('');
      setAmount('');
      setDate(new Date().toISOString().slice(0, 10));
      const defaultPayer =
        activeParticipant && participants.some((p) => p.id === activeParticipant.id)
          ? activeParticipant.id
          : participants[0]?.id || '';
      setPayerId(defaultPayer);
      setSplitMode('equal');
      setInvolvedParticipantIds(participants.map((p) => p.id));
      setCustomSplitsMap({});
    }

    setError(null);
    setIsSubmitting(false);
  }, [isOpen, initialExpense, participants, activeParticipant]);

  const numericAmount = parseFloat(amount) || 0;

  // Equal split calculation
  const involvedCount = involvedParticipantIds.length;
  const equalSplitPerPerson = involvedCount > 0 ? numericAmount / involvedCount : 0;

  // Custom split sum calculation
  const customSplitSum = useMemo(() => {
    let sum = 0;
    for (const p of participants) {
      const val = parseFloat(customSplitsMap[p.id] || '0');
      if (!isNaN(val) && val > 0) {
        sum += val;
      }
    }
    return Math.round(sum * 100) / 100;
  }, [participants, customSplitsMap]);

  const customSplitDiff = Math.round((numericAmount - customSplitSum) * 100) / 100;
  const isCustomSplitExactMatch = Math.abs(customSplitDiff) < 0.01 && numericAmount > 0;

  // Quick action: Select / Deselect all for equal split
  const handleSelectAll = () => {
    setInvolvedParticipantIds(participants.map((p) => p.id));
    if (error) setError(null);
  };

  const handleDeselectAll = () => {
    setInvolvedParticipantIds([]);
  };

  // Toggle single participant for equal split
  const toggleParticipant = (id: string) => {
    setInvolvedParticipantIds((prev) =>
      prev.includes(id) ? prev.filter((pId) => pId !== id) : [...prev, id]
    );
    if (error) setError(null);
  };

  // Quick action: Evenly distribute amount across all participants in custom split
  const handleDistributeEvenly = () => {
    if (numericAmount <= 0 || participants.length === 0) return;

    const totalCents = Math.round(numericAmount * 100);
    const baseCents = Math.floor(totalCents / participants.length);
    const remainder = totalCents % participants.length;

    const newMap: Record<string, string> = {};
    for (let i = 0; i < participants.length; i++) {
      const shareCents = baseCents + (i < remainder ? 1 : 0);
      newMap[participants[i].id] = (shareCents / 100).toFixed(2);
    }
    setCustomSplitsMap(newMap);
    if (error) setError(null);
  };

  // Form submit handler with validation
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      setError(t('expense.empty_title_error'));
      return;
    }

    if (isNaN(numericAmount) || numericAmount <= 0) {
      setError(t('expense.invalid_amount_error'));
      return;
    }

    if (!payerId) {
      setError(t('expense.payer_label'));
      return;
    }

    if (splitMode === 'equal') {
      if (involvedParticipantIds.length === 0) {
        setError(t('expense.no_participants_selected'));
        return;
      }
    } else {
      // Custom split validation
      if (!isCustomSplitExactMatch) {
        setError(
          t('expense.custom_split_error', {
            sum: formatMoney(customSplitSum, currency),
            total: formatMoney(numericAmount, currency),
          })
        );
        return;
      }
    }

    try {
      setIsSubmitting(true);
      setError(null);

      const customSplits: SplitItem[] | undefined =
        splitMode === 'custom'
          ? participants
              .map((p) => ({
                participantId: p.id,
                amount: Math.round((parseFloat(customSplitsMap[p.id] || '0') || 0) * 100) / 100,
              }))
              .filter((item) => item.amount > 0)
          : undefined;

      const finalInvolvedIds =
        splitMode === 'custom' && customSplits
          ? customSplits.map((item) => item.participantId)
          : involvedParticipantIds;

      await onSave({
        id: initialExpense?.id,
        title: trimmedTitle,
        amount: Math.round(numericAmount * 100) / 100,
        payerId,
        date: date || new Date().toISOString().slice(0, 10),
        splitMode,
        involvedParticipantIds: finalInvolvedIds,
        customSplits,
      });

      onClose();
    } catch (err: any) {
      setError(err?.message || t('error.generic'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title={isEditMode ? t('expense.edit_title') : t('expense.add_title')}
      maxWidth="md"
      footer={
        <div className="flex items-center justify-between gap-2 w-full">
          <div>
            {isEditMode && onDelete && initialExpense && (
              <Button
                type="button"
                variant="outlined"
                size="md"
                onClick={() => onDelete(initialExpense.id)}
                disabled={isSubmitting}
                leftIcon={<Trash2 className="w-4 h-4 text-rose-500" />}
                className="border-rose-500/30 text-rose-600 hover:bg-rose-500/10 focus-visible:ring-rose-500"
              >
                {t('common.delete')}
              </Button>
            )}
          </div>

          <div className="flex items-center gap-2">
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
              onClick={handleSubmit}
              loading={isSubmitting}
            >
              {t('expense.save')}
            </Button>
          </div>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-5 py-2">
        {/* Error banner */}
        {error && (
          <div
            role="alert"
            className="px-4 py-3 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-700 dark:text-rose-300 text-xs sm:text-sm font-medium flex items-center gap-2.5 animate-fadeIn"
          >
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
            <span>{error}</span>
          </div>
        )}

        {/* Description / Place & Amount Inputs */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="sm:col-span-2">
            <label
              htmlFor="expense-title-input"
              className="block text-xs font-semibold text-md-on-surface-variant mb-1.5 uppercase tracking-wider"
            >
              {t('expense.title_label')} *
            </label>
            <div className="relative">
              <input
                id="expense-title-input"
                type="text"
                required
                autoFocus={!isEditMode}
                placeholder={t('expense.title_placeholder')}
                value={title}
                onChange={(e) => {
                  setTitle(e.target.value);
                  if (error) setError(null);
                }}
                className="w-full px-4 py-2.5 bg-md-surface-container-highest border border-md-outline/20 rounded-2xl text-md-on-surface text-sm placeholder:text-md-on-surface-variant/50 focus:outline-none focus:ring-2 focus:ring-md-primary transition-all"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="expense-amount-input"
              className="block text-xs font-semibold text-md-on-surface-variant mb-1.5 uppercase tracking-wider"
            >
              {t('expense.amount_label')} ({currency}) *
            </label>
            <div className="relative">
              <input
                id="expense-amount-input"
                type="number"
                step="any"
                min="0.01"
                required
                placeholder={t('expense.amount_placeholder')}
                value={amount}
                onChange={(e) => {
                  setAmount(e.target.value);
                  if (error) setError(null);
                }}
                className="w-full px-4 py-2.5 bg-md-surface-container-highest border border-md-outline/20 rounded-2xl text-md-on-surface text-sm font-bold placeholder:text-md-on-surface-variant/50 focus:outline-none focus:ring-2 focus:ring-md-primary transition-all"
              />
              <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-md-on-surface-variant pointer-events-none">
                {currency}
              </span>
            </div>
          </div>
        </div>

        {/* Date & Payer Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label
              htmlFor="expense-payer-select"
              className="block text-xs font-semibold text-md-on-surface-variant mb-1.5 uppercase tracking-wider"
            >
              {t('expense.payer_label')} *
            </label>
            <div className="relative">
              <select
                id="expense-payer-select"
                value={payerId}
                onChange={(e) => {
                  setPayerId(e.target.value);
                  if (error) setError(null);
                }}
                className="w-full px-4 py-2.5 bg-md-surface-container-highest border border-md-outline/20 rounded-2xl text-md-on-surface text-sm font-medium appearance-none focus:outline-none focus:ring-2 focus:ring-md-primary transition-all cursor-pointer"
              >
                {participants.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
              <User className="w-4 h-4 text-md-on-surface-variant absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          <div>
            <label
              htmlFor="expense-date-input"
              className="block text-xs font-semibold text-md-on-surface-variant mb-1.5 uppercase tracking-wider"
            >
              {t('expense.date_label')}
            </label>
            <div className="relative">
              <input
                id="expense-date-input"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-4 py-2.5 bg-md-surface-container-highest border border-md-outline/20 rounded-2xl text-md-on-surface text-sm font-medium focus:outline-none focus:ring-2 focus:ring-md-primary transition-all"
              />
              <Calendar className="w-4 h-4 text-md-on-surface-variant absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Split Mode Selector (Segmented Button Pill) */}
        <div>
          <label className="block text-xs font-semibold text-md-on-surface-variant mb-2 uppercase tracking-wider">
            {t('expense.split_mode')}
          </label>
          <SegmentedButton<SplitMode>
            options={[
              {
                value: 'equal',
                label: t('expense.split_equal'),
                icon: <Users className="w-3.5 h-3.5" />,
              },
              {
                value: 'custom',
                label: t('expense.split_custom'),
                icon: <Divide className="w-3.5 h-3.5" />,
              },
            ]}
            value={splitMode}
            onChange={(mode) => {
              setSplitMode(mode);
              if (error) setError(null);
            }}
            fullWidth
          />
        </div>

        {/* Equal Split Section */}
        {splitMode === 'equal' && (
          <div className="space-y-3 pt-1">
            {/* Live split indicator banner */}
            <div className="flex items-center justify-between px-4 py-3 rounded-2xl bg-md-primary/10 border border-md-primary/20 text-md-primary">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 shrink-0" />
                <span className="text-xs sm:text-sm font-semibold">
                  {involvedCount > 0 && numericAmount > 0
                    ? t('expense.per_person', {
                        amount: formatMoney(equalSplitPerPerson, currency),
                      })
                    : t('expense.involved_label')}
                </span>
              </div>
              <span className="text-xs font-bold font-mono">
                {involvedCount} / {participants.length}
              </span>
            </div>

            {/* Quick Action links: Select All / Deselect All */}
            <div className="flex items-center justify-between px-1 text-xs">
              <span className="text-md-on-surface-variant font-medium">
                {t('expense.involved_label')}
              </span>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleSelectAll}
                  className="text-md-primary hover:underline font-semibold cursor-pointer"
                >
                  {t('expense.select_all')}
                </button>
                <span className="text-md-outline/30">•</span>
                <button
                  type="button"
                  onClick={handleDeselectAll}
                  className="text-md-on-surface-variant hover:underline cursor-pointer"
                >
                  {t('expense.deselect_all')}
                </button>
              </div>
            </div>

            {/* Participant Checkboxes List */}
            <div
              className="space-y-1.5 max-h-56 overflow-y-auto pr-1"
              role="group"
              aria-label={t('expense.involved_label')}
            >
              {participants.map((p) => {
                const isSelected = involvedParticipantIds.includes(p.id);
                return (
                  <button
                    key={p.id}
                    type="button"
                    role="checkbox"
                    aria-checked={isSelected}
                    onClick={() => toggleParticipant(p.id)}
                    className={cn(
                      'w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl border transition-all duration-150 text-left cursor-pointer',
                      isSelected
                        ? 'bg-md-primary/8 border-md-primary/30 text-md-on-surface'
                        : 'bg-md-surface-container-high/40 border-transparent hover:bg-md-surface-container-high/80 text-md-on-surface-variant'
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <Avatar
                        name={p.name}
                        color={p.avatarColor}
                        size="sm"
                        className="w-8 h-8 text-xs"
                      />
                      <span className="text-sm font-semibold">{p.name}</span>
                    </div>

                    <div
                      className={cn(
                        'w-5 h-5 rounded-lg flex items-center justify-center transition-all duration-150 border',
                        isSelected
                          ? 'bg-md-primary border-md-primary text-md-on-primary shadow-xs'
                          : 'border-md-outline/40 bg-transparent'
                      )}
                    >
                      {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Flexible / Custom Split Section */}
        {splitMode === 'custom' && (
          <div className="space-y-3 pt-1">
            {/* Live custom split sum & difference indicator banner */}
            <div
              className={cn(
                'flex items-center justify-between px-4 py-3 rounded-2xl border text-xs sm:text-sm font-medium transition-colors',
                isCustomSplitExactMatch
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-800 dark:text-emerald-200'
                  : customSplitDiff > 0
                  ? 'bg-amber-500/10 border-amber-500/30 text-amber-800 dark:text-amber-200'
                  : 'bg-rose-500/10 border-rose-500/30 text-rose-800 dark:text-rose-200'
              )}
            >
              <div className="flex items-center gap-2">
                {isCustomSplitExactMatch ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 shrink-0" />
                )}
                <span>
                  {isCustomSplitExactMatch
                    ? `${t('expense.exact_split_match')} (${formatMoney(customSplitSum, currency)})`
                    : customSplitDiff > 0
                    ? t('expense.remaining_amount', {
                        amount: formatMoney(customSplitDiff, currency),
                      })
                    : `${t('expense.over_amount')}${formatMoney(Math.abs(customSplitDiff), currency)}`}
                </span>
              </div>

              <span className="font-mono font-bold">
                {formatMoney(customSplitSum, currency)} / {formatMoney(numericAmount, currency)}
              </span>
            </div>

            {/* Quick helper: Distribute evenly button */}
            <div className="flex items-center justify-end px-1">
              <button
                type="button"
                onClick={handleDistributeEvenly}
                disabled={numericAmount <= 0}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-md-primary hover:underline cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Divide className="w-3.5 h-3.5" />
                <span>{t('expense.distribute_evenly')}</span>
              </button>
            </div>

            {/* Individual Amount Inputs per Participant */}
            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
              {participants.map((p) => {
                const currentVal = customSplitsMap[p.id] || '';
                return (
                  <div
                    key={p.id}
                    className="flex items-center justify-between gap-3 px-3.5 py-2.5 rounded-2xl bg-md-surface-container-high/40 border border-md-outline/10"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <Avatar
                        name={p.name}
                        color={p.avatarColor}
                        size="sm"
                        className="w-8 h-8 text-xs shrink-0"
                      />
                      <span className="text-sm font-semibold truncate text-md-on-surface">
                        {p.name}
                      </span>
                    </div>

                    <div className="relative w-32 shrink-0">
                      <input
                        type="number"
                        step="any"
                        min="0"
                        placeholder="0.00"
                        data-testid={`custom-split-input-${p.id}`}
                        aria-label={`${p.name} ${t('expense.amount_label')}`}
                        value={currentVal}
                        onChange={(e) => {
                          const val = e.target.value;
                          setCustomSplitsMap((prev) => ({
                            ...prev,
                            [p.id]: val,
                          }));
                          if (error) setError(null);
                        }}
                        className="w-full pl-3 pr-8 py-1.5 bg-md-surface-container-highest border border-md-outline/20 rounded-xl text-md-on-surface text-sm font-bold placeholder:text-md-on-surface-variant/40 text-right focus:outline-none focus:ring-2 focus:ring-md-primary"
                      />
                      <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-md-on-surface-variant pointer-events-none">
                        {currency}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </form>
    </Dialog>
  );
};

ExpenseDialog.displayName = 'ExpenseDialog';
