import React from 'react';
import {
  ArrowDownLeft,
  ArrowUpRight,
  Sparkles,
  Receipt,
  UserPlus,
  Users,
} from 'lucide-react';
import { Participant, Expense, Settlement } from '../../types';
import { calculateBalances } from '../../utils/debtCalculator';
import { useI18n } from '../../i18n/I18nContext';
import { Button } from '../common/Button';
import { Avatar } from '../common/Avatar';
import { Badge } from '../common/Badge';
import { cn } from '../../utils/cn';

export interface HeroBalanceProps {
  activeParticipant?: Participant | null;
  participants: Participant[];
  expenses: Expense[];
  settlements?: Settlement[];
  currency?: string;
  onAddExpense?: () => void;
  onAddParticipant?: () => void;
  onSettleDebt?: () => void;
  className?: string;
}

export const HeroBalance: React.FC<HeroBalanceProps> = ({
  activeParticipant,
  participants,
  expenses,
  settlements = [],
  currency = '₼',
  onAddExpense,
  onAddParticipant,
  onSettleDebt,
  className,
}) => {
  const { t, formatMoney } = useI18n();

  // Compute all balances
  const balances = calculateBalances(participants, expenses, settlements);

  // Determine active balance
  const activeBalance = activeParticipant ? (balances[activeParticipant.id] ?? 0) : 0;
  const isPositive = activeBalance > 0.005;
  const isNegative = activeBalance < -0.005;
  const isSettled = !isPositive && !isNegative;

  // Calculate total group spent for overview
  const totalGroupSpent = expenses.reduce((sum, e) => sum + (e.amount || 0), 0);

  // Surface tonal color palettes based on active state
  // Positive: emerald/green tonal surface
  // Negative: amber/red tonal surface
  // Zero: teal tonal surface
  // Overview (no active user): neutral primary container surface
  const surfaceTheme = (() => {
    if (!activeParticipant) {
      return {
        bg: 'bg-md-surface-container border-md-outline/15 text-md-on-surface',
        badgeVariant: 'primary' as const,
        amountColor: 'text-md-on-surface',
        accentBg: 'bg-md-primary-container text-md-on-primary-container',
      };
    }
    if (isPositive) {
      return {
        bg: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-950 dark:text-emerald-50',
        badgeVariant: 'success' as const,
        amountColor: 'text-emerald-700 dark:text-emerald-300',
        accentBg: 'bg-emerald-500/20 text-emerald-800 dark:text-emerald-200',
      };
    }
    if (isNegative) {
      return {
        bg: 'bg-rose-500/10 border-rose-500/30 text-rose-950 dark:text-rose-50',
        badgeVariant: 'error' as const,
        amountColor: 'text-rose-700 dark:text-rose-300',
        accentBg: 'bg-rose-500/20 text-rose-800 dark:text-rose-200',
      };
    }
    return {
      bg: 'bg-teal-500/10 border-teal-500/30 text-teal-950 dark:text-teal-50',
      badgeVariant: 'info' as const,
      amountColor: 'text-teal-700 dark:text-teal-300',
      accentBg: 'bg-teal-500/20 text-teal-800 dark:text-teal-200',
    };
  })();

  return (
    <div
      role="region"
      aria-label={t('balance.net_balance')}
      className={cn(
        'relative overflow-hidden rounded-3xl p-5 sm:p-6 border shadow-xs transition-all duration-300',
        surfaceTheme.bg,
        className
      )}
    >
      {/* Top row: Active Participant or Overview Badge */}
      <div className="flex items-center justify-between gap-3 mb-4">
        {activeParticipant ? (
          <div className="flex items-center gap-2.5">
            <Avatar
              name={activeParticipant.name}
              color={activeParticipant.avatarColor}
              size="sm"
            />
            <div>
              <span className="text-xs font-medium text-md-on-surface-variant block leading-none">
                {t('balance.active_user')}
              </span>
              <span className="text-sm font-bold text-md-on-surface leading-tight">
                {activeParticipant.name}
              </span>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-xs font-semibold text-md-on-surface-variant uppercase tracking-wider">
            <Users className="w-4 h-4" />
            <span>{t('balance.all_participants_view')}</span>
          </div>
        )}

        {/* Status chip pill */}
        {activeParticipant ? (
          <Badge
            variant={surfaceTheme.badgeVariant}
            size="md"
            icon={
              isPositive ? (
                <ArrowDownLeft className="w-3.5 h-3.5" />
              ) : isNegative ? (
                <ArrowUpRight className="w-3.5 h-3.5" />
              ) : (
                <Sparkles className="w-3.5 h-3.5" />
              )
            }
          >
            {isPositive && t('balance.you_are_owed')}
            {isNegative && t('balance.you_owe')}
            {isSettled && `${t('balance.settled')} 🎉`}
          </Badge>
        ) : (
          <Badge variant="neutral" size="sm">
            {participants.length} {t('participant.list_title').toLowerCase()}
          </Badge>
        )}
      </div>

      {/* Main Balance Display */}
      <div className="my-3">
        <div className="text-xs font-medium text-md-on-surface-variant uppercase tracking-wider mb-1">
          {activeParticipant ? t('balance.net_balance') : t('balance.total_spent')}
        </div>

        <div
          data-testid="hero-amount"
          className={cn(
            'text-3xl sm:text-4xl font-extrabold tracking-tight',
            surfaceTheme.amountColor
          )}
        >
          {activeParticipant ? (
            <>
              {isPositive && `+${formatMoney(activeBalance, currency)}`}
              {isNegative && `-${formatMoney(Math.abs(activeBalance), currency)}`}
              {isSettled && formatMoney(0, currency)}
            </>
          ) : (
            formatMoney(totalGroupSpent, currency)
          )}
        </div>

        <p className="mt-1 text-xs sm:text-sm text-md-on-surface-variant">
          {activeParticipant ? (
            isPositive
              ? t('balance.you_are_owed')
              : isNegative
              ? t('balance.you_owe')
              : `${t('balance.settled')} 🎉`
          ) : (
            `${expenses.length} ${t('history.expenses_filter').toLowerCase()} • ${settlements.length} ${t('history.settlements_filter').toLowerCase()}`
          )}
        </p>
      </div>

      {/* Quick Actions Row */}
      <div className="mt-5 pt-4 border-t border-current/10 flex items-center gap-2.5 flex-wrap">
        {onAddExpense && (
          <Button
            type="button"
            variant="filled"
            size="sm"
            onClick={onAddExpense}
            leftIcon={<Receipt className="w-4 h-4" />}
            className="grow sm:grow-0"
          >
            {t('expense.add_title')}
          </Button>
        )}

        {onAddParticipant && (
          <Button
            type="button"
            variant="tonal"
            size="sm"
            onClick={onAddParticipant}
            leftIcon={<UserPlus className="w-4 h-4" />}
            className="grow sm:grow-0"
          >
            {t('header.add_friend')}
          </Button>
        )}

        {activeParticipant && isNegative && onSettleDebt && (
          <Button
            type="button"
            variant="outlined"
            size="sm"
            onClick={onSettleDebt}
            className="grow sm:grow-0"
          >
            {t('settle.title')}
          </Button>
        )}
      </div>
    </div>
  );
};
