import React, { useState, useMemo } from 'react';
import {
  Search,
  Receipt,
  ArrowRight,
  Edit2,
  Trash2,
  Users,
  CheckCircle2,
  Calendar,
  X,
  Filter,
} from 'lucide-react';
import { Expense, Participant, Settlement } from '../../types';
import { Card } from '../common/Card';
import { Badge } from '../common/Badge';
import { Avatar } from '../common/Avatar';
import { SegmentedButton } from '../common/SegmentedButton';
import { ExpenseDialog } from '../dialogs/ExpenseDialog';
import { DeleteConfirmDialog } from '../dialogs/DeleteConfirmDialog';
import { useI18n } from '../../i18n/I18nContext';
import { cn } from '../../utils/cn';

export interface HistoryTabProps {
  expenses: Expense[];
  settlements?: Settlement[];
  participants: Participant[];
  currency?: string;
  activeParticipant?: Participant | null;
  onEditExpense?: (expense: Expense) => void | Promise<any>;
  onDeleteExpense?: (expenseId: string) => void | Promise<any>;
  onDeleteSettlement?: (settlementId: string) => void | Promise<any>;
  className?: string;
}

type FeedFilterType = 'all' | 'expenses' | 'settlements';

interface HistoryItemBase {
  id: string;
  date: string;
  createdAt: number;
}

interface ExpenseFeedItem extends HistoryItemBase {
  type: 'expense';
  expense: Expense;
}

interface SettlementFeedItem extends HistoryItemBase {
  type: 'settlement';
  settlement: Settlement;
}

type FeedItem = ExpenseFeedItem | SettlementFeedItem;

export const HistoryTab: React.FC<HistoryTabProps> = ({
  expenses,
  settlements = [],
  participants,
  currency = '₼',
  activeParticipant,
  onEditExpense,
  onDeleteExpense,
  onDeleteSettlement,
  className,
}) => {
  const { t, lang, formatMoney } = useI18n();

  // Filters state
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<FeedFilterType>('all');
  const [selectedParticipantId, setSelectedParticipantId] = useState<string>('all');

  // Dialog states
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [itemToDelete, setItemToDelete] = useState<{
    type: 'expense' | 'settlement';
    id: string;
    name: string;
    amount: number;
    debtor?: string;
    receiver?: string;
  } | null>(null);

  // Map for fast participant lookup
  const participantMap = useMemo(() => {
    const map = new Map<string, Participant>();
    for (const p of participants) {
      map.set(p.id, p);
    }
    return map;
  }, [participants]);

  // Combine and sort feed items chronologically (newest first)
  const combinedFeed: FeedItem[] = useMemo(() => {
    const items: FeedItem[] = [];

    for (const exp of expenses) {
      items.push({
        type: 'expense',
        id: exp.id,
        date: exp.date || new Date(exp.createdAt || Date.now()).toISOString().slice(0, 10),
        createdAt: exp.createdAt || 0,
        expense: exp,
      });
    }

    for (const set of settlements) {
      items.push({
        type: 'settlement',
        id: set.id,
        date: set.date || new Date(set.createdAt || Date.now()).toISOString().slice(0, 10),
        createdAt: set.createdAt || 0,
        settlement: set,
      });
    }

    return items.sort((a, b) => {
      // Primary: date string descending
      if (a.date !== b.date) {
        return b.date.localeCompare(a.date);
      }
      // Secondary: createdAt timestamp descending
      return b.createdAt - a.createdAt;
    });
  }, [expenses, settlements]);

  // Filtered feed based on search query, type filter, and participant filter
  const filteredFeed = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return combinedFeed.filter((item) => {
      // 1. Filter by item type
      if (filterType === 'expenses' && item.type !== 'expense') return false;
      if (filterType === 'settlements' && item.type !== 'settlement') return false;

      // 2. Filter by participant
      if (selectedParticipantId !== 'all') {
        if (item.type === 'expense') {
          const exp = item.expense;
          const isPayer = exp.payerId === selectedParticipantId;
          const isInvolved = exp.involvedParticipantIds?.includes(selectedParticipantId);
          if (!isPayer && !isInvolved) return false;
        } else {
          const set = item.settlement;
          const isFrom = set.fromParticipantId === selectedParticipantId;
          const isTo = set.toParticipantId === selectedParticipantId;
          if (!isFrom && !isTo) return false;
        }
      }

      // 3. Search query matching
      if (query) {
        if (item.type === 'expense') {
          const exp = item.expense;
          const titleMatch = exp.title.toLowerCase().includes(query);
          const payerName = participantMap.get(exp.payerId)?.name.toLowerCase() || '';
          const payerMatch = payerName.includes(query);
          const involvedMatch = (exp.involvedParticipantIds || []).some((id) =>
            (participantMap.get(id)?.name.toLowerCase() || '').includes(query)
          );
          if (!titleMatch && !payerMatch && !involvedMatch) return false;
        } else {
          const set = item.settlement;
          const fromName = participantMap.get(set.fromParticipantId)?.name.toLowerCase() || '';
          const toName = participantMap.get(set.toParticipantId)?.name.toLowerCase() || '';
          if (!fromName.includes(query) && !toName.includes(query)) return false;
        }
      }

      return true;
    });
  }, [combinedFeed, filterType, selectedParticipantId, searchQuery, participantMap]);

  // Date format helper for group headers
  const getGroupDateTitle = (dateStr: string): string => {
    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, '0')}-${String(yesterday.getDate()).padStart(2, '0')}`;

    if (dateStr === todayStr) {
      return t('history.today');
    }
    if (dateStr === yesterdayStr) {
      return t('history.yesterday');
    }

    try {
      const parts = dateStr.split('-');
      if (parts.length === 3) {
        const year = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10) - 1;
        const day = parseInt(parts[2], 10);
        const d = new Date(year, month, day);
        const locale = lang === 'az' ? 'az-AZ' : lang === 'ru' ? 'ru-RU' : 'en-US';
        return d.toLocaleDateString(locale, {
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        });
      }
    } catch {
      // fallback
    }

    return dateStr;
  };

  // Group items by date string
  const groupedFeed = useMemo(() => {
    const groups: { date: string; title: string; items: FeedItem[] }[] = [];
    let currentGroup: { date: string; title: string; items: FeedItem[] } | null = null;

    for (const item of filteredFeed) {
      if (!currentGroup || currentGroup.date !== item.date) {
        currentGroup = {
          date: item.date,
          title: getGroupDateTitle(item.date),
          items: [],
        };
        groups.push(currentGroup);
      }
      currentGroup.items.push(item);
    }

    return groups;
  }, [filteredFeed, lang, t]);

  // Delete confirmation action
  const handleConfirmDelete = async () => {
    if (!itemToDelete) return;

    if (itemToDelete.type === 'expense') {
      await onDeleteExpense?.(itemToDelete.id);
    } else {
      await onDeleteSettlement?.(itemToDelete.id);
    }
  };

  return (
    <div className={cn('space-y-4 max-w-4xl mx-auto w-full px-2 sm:px-4 pb-12', className)}>
      {/* Header & Controls bar */}
      <div className="space-y-3">
        {/* Search input */}
        <div className="relative">
          <Search className="w-4 h-4 text-md-on-surface-variant absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            role="searchbox"
            placeholder={t('history.search_placeholder')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-9 py-2.5 bg-md-surface-container border border-md-outline/20 rounded-2xl text-md-on-surface text-sm placeholder:text-md-on-surface-variant/50 focus:outline-none focus:ring-2 focus:ring-md-primary transition-all"
          />
          {searchQuery && (
            <button
              type="button"
              aria-label="Clear search"
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-md-on-surface-variant hover:text-md-on-surface rounded-full transition-colors cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Filter pills row: Filter Type & Participant Select */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
          <SegmentedButton<FeedFilterType>
            options={[
              { value: 'all', label: t('history.all_filter') },
              { value: 'expenses', label: t('history.expenses_filter') },
              { value: 'settlements', label: t('history.settlements_filter') },
            ]}
            value={filterType}
            onChange={setFilterType}
            size="sm"
          />

          {/* Participant Filter Dropdown */}
          <div className="relative flex items-center gap-2">
            <Filter className="w-3.5 h-3.5 text-md-on-surface-variant shrink-0" />
            <select
              aria-label="Filter by participant"
              value={selectedParticipantId}
              onChange={(e) => setSelectedParticipantId(e.target.value)}
              className="w-full sm:w-auto px-3 py-1.5 bg-md-surface-container border border-md-outline/20 rounded-full text-md-on-surface text-xs font-semibold appearance-none pr-8 cursor-pointer focus:outline-none focus:ring-2 focus:ring-md-primary"
            >
              <option value="all">{t('header.all_participants')}</option>
              {participants.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Feed List */}
      {groupedFeed.length === 0 ? (
        <Card variant="tonal" className="py-12 px-4 text-center rounded-3xl mt-4">
          <div className="w-14 h-14 rounded-full bg-md-surface-container-highest flex items-center justify-center mx-auto mb-3 text-md-on-surface-variant">
            <Receipt className="w-7 h-7" />
          </div>
          <h3 className="text-base font-bold text-md-on-surface mb-1">
            {t('history.empty')}
          </h3>
          <p className="text-xs sm:text-sm text-md-on-surface-variant max-w-sm mx-auto">
            {searchQuery || filterType !== 'all' || selectedParticipantId !== 'all'
              ? 'Axtarış və ya filter meyarlarına uyğun heç nə tapılmadı.'
              : t('app.short_desc')}
          </p>
        </Card>
      ) : (
        <div className="space-y-6 pt-2">
          {groupedFeed.map((group) => (
            <section key={group.date} className="space-y-2.5">
              {/* Date Header Sticky Pill */}
              <div className="sticky top-14 z-10 flex items-center gap-2 py-1">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-md-surface-container-high/90 backdrop-blur-md text-md-on-surface border border-md-outline/15 shadow-2xs">
                  <Calendar className="w-3.5 h-3.5 text-md-primary" />
                  <span>{group.title}</span>
                </span>
                <div className="flex-1 border-t border-md-outline/10" />
              </div>

              {/* Items in this date group */}
              <div className="space-y-2.5">
                {group.items.map((item) => {
                  if (item.type === 'expense') {
                    const exp = item.expense;
                    const payer = participantMap.get(exp.payerId);
                    const involvedList = (exp.involvedParticipantIds || [])
                      .map((id) => participantMap.get(id))
                      .filter(Boolean) as Participant[];

                    const isPayerMe = activeParticipant && activeParticipant.id === exp.payerId;

                    return (
                      <Card
                        key={exp.id}
                        variant="tonal"
                        className="p-4 rounded-3xl border border-md-outline/10 hover:border-md-outline/25 transition-all shadow-2xs"
                      >
                        <div className="flex items-start justify-between gap-3">
                          {/* Left: Payer Avatar & Title & Badges */}
                          <div className="flex items-start gap-3 min-w-0 flex-1">
                            <Avatar
                              name={payer?.name || '?'}
                              color={payer?.avatarColor}
                              size="md"
                              className="mt-0.5 shrink-0"
                            />

                            <div className="min-w-0 flex-1">
                              <h4 className="text-sm sm:text-base font-bold text-md-on-surface leading-tight truncate">
                                {exp.title}
                              </h4>

                              <div className="flex items-center gap-2 mt-1 flex-wrap text-xs text-md-on-surface-variant">
                                <span>
                                  {t('expense.payer')}:{' '}
                                  <strong className="text-md-on-surface font-semibold">
                                    {payer?.name || '?'}
                                  </strong>
                                  {isPayerMe && (
                                    <span className="text-xs text-md-primary ml-1 font-bold">
                                      ({t('header.my_profile')})
                                    </span>
                                  )}
                                </span>

                                <span className="text-md-outline/30">•</span>

                                <Badge
                                  variant={exp.splitMode === 'custom' ? 'warning' : 'neutral'}
                                  size="sm"
                                >
                                  {exp.splitMode === 'custom'
                                    ? t('expense.split_custom')
                                    : t('expense.split_equal')}
                                </Badge>
                              </div>

                              {/* Involved participants avatars & count */}
                              {involvedList.length > 0 && (
                                <div className="flex items-center gap-1.5 mt-2.5 text-xs text-md-on-surface-variant">
                                  <Users className="w-3.5 h-3.5 shrink-0" />
                                  <div className="flex items-center -space-x-1.5 overflow-hidden">
                                    {involvedList.slice(0, 5).map((inv) => (
                                      <Avatar
                                        key={inv.id}
                                        name={inv.name}
                                        color={inv.avatarColor}
                                        size="sm"
                                        className="w-5 h-5 text-[9px] ring-2 ring-md-surface-container"
                                      />
                                    ))}
                                  </div>
                                  <span className="font-medium text-[11px] truncate">
                                    {involvedList.length <= 3
                                      ? involvedList.map((p) => p.name).join(', ')
                                      : `${involvedList.length} nəfər`}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Right: Amount & Action Buttons */}
                          <div className="flex flex-col items-end gap-2 shrink-0">
                            <span className="text-base sm:text-lg font-extrabold text-md-on-surface font-mono">
                              {formatMoney(exp.amount, currency)}
                            </span>

                            {/* Action Buttons: Edit & Delete */}
                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                aria-label={`${t('common.edit')} ${exp.title}`}
                                onClick={() => setEditingExpense(exp)}
                                className="p-1.5 text-md-on-surface-variant hover:text-md-primary hover:bg-md-surface-container-high rounded-full transition-colors cursor-pointer"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>

                              <button
                                type="button"
                                aria-label={`${t('common.delete')} ${exp.title}`}
                                onClick={() =>
                                  setItemToDelete({
                                    type: 'expense',
                                    id: exp.id,
                                    name: exp.title,
                                    amount: exp.amount,
                                  })
                                }
                                className="p-1.5 text-md-on-surface-variant hover:text-rose-600 hover:bg-rose-500/10 rounded-full transition-colors cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </Card>
                    );
                  }

                  // Settlement card
                  const set = item.settlement;
                  const fromP = participantMap.get(set.fromParticipantId);
                  const toP = participantMap.get(set.toParticipantId);

                  return (
                    <Card
                      key={set.id}
                      variant="tonal"
                      className="p-4 rounded-3xl bg-emerald-500/5 border border-emerald-500/20 shadow-2xs"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          {/* Avatars with transfer arrow */}
                          <div className="flex items-center gap-1 shrink-0">
                            <Avatar
                              name={fromP?.name || '?'}
                              color={fromP?.avatarColor}
                              size="md"
                            />
                            <ArrowRight className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                            <Avatar
                              name={toP?.name || '?'}
                              color={toP?.avatarColor}
                              size="md"
                            />
                          </div>

                          {/* Settlement info */}
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <Badge variant="success" size="sm">
                                <CheckCircle2 className="w-3 h-3 mr-0.5 inline" />
                                {t('history.settled_badge')}
                              </Badge>
                            </div>

                            <p className="text-xs sm:text-sm font-semibold text-md-on-surface mt-1 leading-snug">
                              {t('history.settlement_paid', {
                                debtor: fromP?.name || '?',
                                receiver: toP?.name || '?',
                                amount: formatMoney(set.amount, currency),
                              })}
                            </p>
                          </div>
                        </div>

                        {/* Amount & Delete Action */}
                        <div className="flex flex-col items-end gap-2 shrink-0">
                          <span className="text-base sm:text-lg font-extrabold text-emerald-700 dark:text-emerald-400 font-mono">
                            {formatMoney(set.amount, currency)}
                          </span>

                          <button
                            type="button"
                            aria-label={`${t('common.delete')} settlement`}
                            onClick={() =>
                              setItemToDelete({
                                type: 'settlement',
                                id: set.id,
                                name: `${fromP?.name || '?'} ➡️ ${toP?.name || '?'}`,
                                amount: set.amount,
                                debtor: fromP?.name,
                                receiver: toP?.name,
                              })
                            }
                            className="p-1.5 text-md-on-surface-variant hover:text-rose-600 hover:bg-rose-500/10 rounded-full transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      )}

      {/* Expense Edit Dialog */}
      {editingExpense && (
        <ExpenseDialog
          isOpen={Boolean(editingExpense)}
          onClose={() => setEditingExpense(null)}
          initialExpense={editingExpense}
          participants={participants}
          activeParticipant={activeParticipant}
          currency={currency}
          onSave={async (savedExpense) => {
            if (onEditExpense) {
              await onEditExpense({
                ...editingExpense,
                ...savedExpense,
                id: editingExpense.id,
              });
            }
            setEditingExpense(null);
          }}
          onDelete={
            onDeleteExpense
              ? async (expenseId) => {
                  setEditingExpense(null);
                  setItemToDelete({
                    type: 'expense',
                    id: expenseId,
                    name: editingExpense.title,
                    amount: editingExpense.amount,
                  });
                }
              : undefined
          }
        />
      )}

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmDialog
        isOpen={Boolean(itemToDelete)}
        onClose={() => setItemToDelete(null)}
        onConfirm={handleConfirmDelete}
        itemType={itemToDelete?.type || 'expense'}
        itemName={itemToDelete?.name}
        description={
          itemToDelete?.type === 'settlement' && itemToDelete.debtor && itemToDelete.receiver
            ? t('delete.settlement_confirm', {
                debtor: itemToDelete.debtor,
                receiver: itemToDelete.receiver,
                amount: formatMoney(itemToDelete.amount, currency),
              })
            : undefined
        }
      />
    </div>
  );
};

HistoryTab.displayName = 'HistoryTab';
