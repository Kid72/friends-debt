import React, { useState, useEffect, useCallback } from 'react';
import {
  ArrowLeftRight,
  History,
  Trophy,
  Receipt,
  WifiOff,
  AlertCircle,
  RefreshCw,
  Loader2,
  PlusCircle,
} from 'lucide-react';
import { RoomState, Participant, Expense, SplitMode, SplitItem } from './types';
import { createRoom, getActiveUserId, setActiveUserId } from './api/storage';
import { useRoomStore } from './hooks/useRoomStore';
import { I18nProvider, useI18n } from './i18n/I18nContext';
import { Header } from './components/layout/Header';
import { HeroBalance } from './components/layout/HeroBalance';
import { SegmentedButton } from './components/common/SegmentedButton';
import { Dialog } from './components/common/Dialog';
import { Button } from './components/common/Button';
import { TransfersTab } from './components/tabs/TransfersTab';
import { HistoryTab } from './components/tabs/HistoryTab';
import { HallOfFameTab } from './components/tabs/HallOfFameTab';
import { ExpenseDialog } from './components/dialogs/ExpenseDialog';
import { ParticipantDialog } from './components/dialogs/ParticipantDialog';
import { CurrencyDialog } from './components/dialogs/CurrencyDialog';
import { HelpDialog } from './components/dialogs/HelpDialog';

export type AppTab = 'transfers' | 'history' | 'hall_of_fame';

/**
 * Default starter room template for auto-provisioning
 */
const DEFAULT_INITIAL_ROOM: RoomState = {
  id: '',
  groupName: 'Dostlar',
  currency: '₼',
  participants: [],
  expenses: [],
  settlements: [],
  updatedAt: Date.now(),
};

/**
 * Main application content wrapped with store and i18n
 */
export function AppContent() {
  const { t } = useI18n();

  // 1. Room URL Reader & Room ID Management
  const [roomId, setRoomId] = useState<string | null>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      return params.get('room');
    }
    return null;
  });

  const [isProvisioning, setIsProvisioning] = useState(false);

  // Auto-provision room if no ?room in URL
  useEffect(() => {
    if (!roomId && !isProvisioning) {
      setIsProvisioning(true);

      createRoom(DEFAULT_INITIAL_ROOM)
        .then((newRoomId) => {
          setRoomId(newRoomId);
          if (typeof window !== 'undefined') {
            const url = new URL(window.location.href);
            url.searchParams.set('room', newRoomId);
            window.history.replaceState({ path: url.toString() }, '', url.toString());
          }
        })
        .catch(() => {
          // Offline / network outage fallback: local room id
          const fallbackId = `local_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
          const initialLocalRoom: RoomState = {
            ...DEFAULT_INITIAL_ROOM,
            id: fallbackId,
            updatedAt: Date.now(),
          };
          // Seed localStorage so initial render and offline usage load seamlessly
          try {
            localStorage.setItem(`friends_debt_room_${fallbackId}`, JSON.stringify(initialLocalRoom));
          } catch {
            // Ignore storage errors
          }
          setRoomId(fallbackId);
          if (typeof window !== 'undefined') {
            const url = new URL(window.location.href);
            url.searchParams.set('room', fallbackId);
            window.history.replaceState({ path: url.toString() }, '', url.toString());
          }
        })
        .finally(() => {
          setIsProvisioning(false);
        });
    }
  }, [roomId, isProvisioning]);

  // Sync with browser back/forward buttons
  useEffect(() => {
    const handlePopState = () => {
      const params = new URLSearchParams(window.location.search);
      const urlRoom = params.get('room');
      if (urlRoom !== roomId) {
        setRoomId(urlRoom);
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [roomId]);

  // 2. Reactive Cloud REST JSON Room Store
  const {
    room,
    isLoading,
    isSyncing,
    isOffline: isStoreOffline,
    error,
    addExpense,
    editExpense,
    deleteExpense,
    settleDebt,
    deleteSettlement,
    addParticipant,
    updateGroupName,
    updateCurrency,
    refetch,
  } = useRoomStore(roomId);

  // 3. Active User Profile Management
  const [activeParticipant, setActiveParticipant] = useState<Participant | null>(null);

  useEffect(() => {
    if (!room || !roomId) return;

    const savedUserId = getActiveUserId(roomId);
    if (savedUserId) {
      const match = room.participants.find((p) => p.id === savedUserId);
      if (match) {
        setActiveParticipant(match);
        return;
      }
    }

    if (activeParticipant) {
      const stillPresent = room.participants.find((p) => p.id === activeParticipant.id);
      setActiveParticipant(stillPresent || null);
    }
  }, [room, roomId]);

  const handleSelectParticipant = useCallback(
    (participant: Participant | null) => {
      setActiveParticipant(participant);
      if (roomId) {
        if (participant) {
          setActiveUserId(roomId, participant.id);
        } else {
          setActiveUserId(roomId, '');
        }
      }
    },
    [roomId]
  );

  // 4. Tab Navigation State
  const [activeTab, setActiveTab] = useState<AppTab>('transfers');

  // 5. Offline / Network State
  const [isOffline, setIsOffline] = useState<boolean>(() => {
    return typeof navigator !== 'undefined' ? !navigator.onLine : false;
  });

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // 6. Dialog States
  const [isExpenseDialogOpen, setIsExpenseDialogOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [isParticipantDialogOpen, setIsParticipantDialogOpen] = useState(false);
  const [isCurrencyDialogOpen, setIsCurrencyDialogOpen] = useState(false);
  const [isHelpDialogOpen, setIsHelpDialogOpen] = useState(false);
  const [isEditGroupNameOpen, setIsEditGroupNameOpen] = useState(false);
  const [newGroupNameInput, setNewGroupNameInput] = useState('');
  const [isConfirmNewRoomOpen, setIsConfirmNewRoomOpen] = useState(false);

  // Open Edit Group Name Dialog
  const handleOpenEditGroupName = () => {
    setNewGroupNameInput(room?.groupName || 'Dostlar');
    setIsEditGroupNameOpen(true);
  };

  const handleSaveGroupName = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newGroupNameInput.trim()) {
      await updateGroupName(newGroupNameInput.trim());
      setIsEditGroupNameOpen(false);
    }
  };

  // Open Add Expense Dialog
  const handleOpenAddExpense = () => {
    setEditingExpense(null);
    setIsExpenseDialogOpen(true);
  };

  // Handle Save Expense (Add or Edit)
  const handleSaveExpense = async (expenseData: {
    id?: string;
    title: string;
    amount: number;
    payerId: string;
    date: string;
    splitMode: SplitMode;
    involvedParticipantIds: string[];
    customSplits?: SplitItem[];
  }) => {
    if (editingExpense) {
      await editExpense({
        ...editingExpense,
        ...expenseData,
        id: editingExpense.id,
      });
    } else {
      await addExpense(expenseData);
    }
    setIsExpenseDialogOpen(false);
    setEditingExpense(null);
  };

  // Handle Delete Expense
  const handleDeleteExpense = async (expenseId: string) => {
    await deleteExpense(expenseId);
    setIsExpenseDialogOpen(false);
    setEditingExpense(null);
  };

  // Handle Settle Debt
  const handleSettleDebt = async (settlement: {
    fromParticipantId: string;
    toParticipantId: string;
    amount: number;
    date: string;
  }) => {
    await settleDebt(settlement);
  };

  // Handle Create / Reset to a fresh room
  const handleCreateNewRoom = () => {
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      url.searchParams.delete('room');
      window.history.pushState({}, '', url.pathname);
    }
    setRoomId(null);
  };

  // Safe Participants & Expenses lists
  const participants = room?.participants || [];
  const expenses = room?.expenses || [];
  const settlements = room?.settlements || [];
  const currency = room?.currency || '₼';
  const groupName = room?.groupName || t('app.title');

  return (
    <div className="min-h-screen bg-md-background text-md-on-background flex flex-col antialiased selection:bg-md-primary-container selection:text-md-on-primary-container">
      {/* 1. Header with Profile Switcher, Room Copy, Currency, Lang, Notifications, Help */}
      <Header
        roomName={groupName}
        roomId={room?.id || roomId || ''}
        currency={currency}
        participants={participants}
        activeParticipant={activeParticipant}
        onSelectParticipant={handleSelectParticipant}
        onAddParticipant={() => setIsParticipantDialogOpen(true)}
        onUpdateCurrency={updateCurrency}
        onOpenHelp={() => setIsHelpDialogOpen(true)}
        onEditGroupName={handleOpenEditGroupName}
        onCreateNewRoom={room ? () => setIsConfirmNewRoomOpen(true) : undefined}
        isSyncing={isSyncing}
      />

      {/* 2. Offline / Network Sync Indicator Banner */}
      {(isOffline || isStoreOffline) && (
        <div
          role="status"
          aria-live="polite"
          className="bg-amber-500 text-amber-950 px-4 py-2 text-xs font-bold flex items-center justify-center gap-2 shadow-xs transition-all z-20"
        >
          <WifiOff className="w-4 h-4 shrink-0" />
          <span>{t('sync.offline')}</span>
        </div>
      )}

      {error && !isOffline && !isStoreOffline && room && (
        <div
          role="alert"
          className="bg-rose-600 text-white px-4 py-2 text-xs font-semibold flex items-center justify-between gap-2 shadow-xs transition-all z-20"
        >
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
          <button
            type="button"
            onClick={() => refetch()}
            className="underline hover:no-underline font-bold text-xs cursor-pointer flex items-center gap-1"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>{t('sync.retry')}</span>
          </button>
        </div>
      )}

      {/* 3. Main Container */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 py-4 sm:px-6 space-y-6">
        {/* Loading Spinner during initial room provision or initial load */}
        {(isProvisioning || (isLoading && !room)) && (
          <div
            data-testid="app-loading-state"
            className="py-16 flex flex-col items-center justify-center gap-3 text-md-on-surface-variant"
          >
            <Loader2 className="w-8 h-8 text-md-primary animate-spin" />
            <p className="text-sm font-medium">{t('common.loading')}</p>
          </div>
        )}

        {/* Room Not Found / Fatal Error State */}
        {!room && !isLoading && !isProvisioning && error && (
          <div
            role="alert"
            className="py-12 px-6 flex flex-col items-center justify-center text-center max-w-md mx-auto bg-md-surface-container-low rounded-3xl border border-md-outline/20 shadow-sm space-y-4"
          >
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400 flex items-center justify-center">
              <AlertCircle className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h2 className="text-lg font-bold text-md-on-surface">{t('error.room_not_found')}</h2>
              <p className="text-xs text-md-on-surface-variant line-clamp-2">{error}</p>
            </div>
            <div className="flex flex-wrap gap-3 pt-2">
              <Button
                variant="outlined"
                size="sm"
                onClick={() => refetch()}
                leftIcon={<RefreshCw className="w-4 h-4" />}
              >
                {t('sync.retry')}
              </Button>
              <Button
                variant="filled"
                size="sm"
                onClick={handleCreateNewRoom}
                leftIcon={<PlusCircle className="w-4 h-4" />}
              >
                {t('room.create_button')}
              </Button>
            </div>
          </div>
        )}

        {/* Hero Balance Card */}
        {room && (
          <section>
            <HeroBalance
              activeParticipant={activeParticipant}
              participants={participants}
              expenses={expenses}
              settlements={settlements}
              currency={currency}
              onAddExpense={handleOpenAddExpense}
              onAddParticipant={() => setIsParticipantDialogOpen(true)}
              onSettleDebt={() => setActiveTab('transfers')}
            />
          </section>
        )}

        {/* M3 Segmented Navigation Tabs */}
        {room && (
          <nav aria-label="Main Tabs Navigation" className="w-full">
            <SegmentedButton<AppTab>
              name="main-tabs"
              fullWidth
              size="md"
              value={activeTab}
              onChange={setActiveTab}
              options={[
                {
                  value: 'transfers',
                  label: t('nav.transfers'),
                  icon: <ArrowLeftRight className="w-4 h-4 shrink-0" />,
                },
                {
                  value: 'history',
                  label: t('nav.history'),
                  icon: <History className="w-4 h-4 shrink-0" />,
                  badge: expenses.length > 0 ? (
                    <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-md-surface-container-highest text-md-on-surface">
                      {expenses.length}
                    </span>
                  ) : undefined,
                },
                {
                  value: 'hall_of_fame',
                  label: t('nav.hall_of_fame'),
                  icon: <Trophy className="w-4 h-4 shrink-0" />,
                },
              ]}
            />
          </nav>
        )}

        {/* Tab Views */}
        {room && (
          <div className="w-full">
            {activeTab === 'transfers' && (
              <TransfersTab
                expenses={expenses}
                settlements={settlements}
                participants={participants}
                currency={currency}
                roomName={groupName}
                activeParticipant={activeParticipant}
                onSettleDebt={handleSettleDebt}
              />
            )}

            {activeTab === 'history' && (
              <HistoryTab
                expenses={expenses}
                settlements={settlements}
                participants={participants}
                currency={currency}
                activeParticipant={activeParticipant}
                onEditExpense={editExpense}
                onDeleteExpense={deleteExpense}
                onDeleteSettlement={deleteSettlement}
              />
            )}

            {activeTab === 'hall_of_fame' && (
              <HallOfFameTab
                participants={participants}
                expenses={expenses}
                settlements={settlements}
                currency={currency}
                activeParticipant={activeParticipant}
              />
            )}
          </div>
        )}
      </main>

      {/* 4. Floating Action Button (FAB) Anchored Bottom-Right */}
      {room && (
        <button
          type="button"
          data-testid="fab-add-expense"
          aria-label={t('expense.add_receipt')}
          title={t('expense.add_receipt')}
          onClick={handleOpenAddExpense}
          className="fixed bottom-6 right-6 z-40 flex items-center gap-2 px-5 py-3.5 rounded-3xl bg-md-primary text-md-on-primary font-bold text-sm shadow-lg hover:shadow-xl hover:bg-opacity-95 active:scale-95 transition-all duration-200 cursor-pointer border border-white/20"
        >
          <Receipt className="w-5 h-5" />
          <span className="tracking-wide">{t('expense.add_receipt')}</span>
        </button>
      )}

      {/* 5. Modals & Dialogs */}
      {/* Expense Dialog (Add / Edit) */}
      <ExpenseDialog
        isOpen={isExpenseDialogOpen}
        onClose={() => {
          setIsExpenseDialogOpen(false);
          setEditingExpense(null);
        }}
        onSave={handleSaveExpense}
        onDelete={editingExpense ? handleDeleteExpense : undefined}
        initialExpense={editingExpense}
        participants={participants}
        activeParticipant={activeParticipant}
        currency={currency}
      />

      {/* Participant Dialog */}
      <ParticipantDialog
        isOpen={isParticipantDialogOpen}
        onClose={() => setIsParticipantDialogOpen(false)}
        onAddParticipant={async (participant) => {
          await addParticipant(participant);
          setIsParticipantDialogOpen(false);
        }}
        existingParticipants={participants}
      />

      {/* Currency Dialog */}
      <CurrencyDialog
        isOpen={isCurrencyDialogOpen}
        onClose={() => setIsCurrencyDialogOpen(false)}
        currentCurrency={currency}
        onSelectCurrency={(selected) => {
          updateCurrency(selected);
          setIsCurrencyDialogOpen(false);
        }}
      />

      {/* Help Dialog */}
      <HelpDialog
        isOpen={isHelpDialogOpen}
        onClose={() => setIsHelpDialogOpen(false)}
      />

      {/* Edit Group Name Dialog */}
      <Dialog
        isOpen={isEditGroupNameOpen}
        onClose={() => setIsEditGroupNameOpen(false)}
        title={t('header.edit_group')}
      >
        <form onSubmit={handleSaveGroupName} className="space-y-4 pt-2">
          <div>
            <label
              htmlFor="group-name-input"
              className="block text-xs font-semibold text-md-on-surface-variant uppercase tracking-wider mb-1.5"
            >
              {t('room.name_label')}
            </label>
            <input
              id="group-name-input"
              type="text"
              value={newGroupNameInput}
              onChange={(e) => setNewGroupNameInput(e.target.value)}
              placeholder={t('room.name_placeholder')}
              className="w-full px-3.5 py-2.5 rounded-2xl bg-md-surface-container border border-md-outline/20 text-md-on-surface text-sm focus:outline-none focus:ring-2 focus:ring-md-primary"
              autoFocus
              required
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-md-outline/10">
            <Button
              type="button"
              variant="text"
              size="sm"
              onClick={() => setIsEditGroupNameOpen(false)}
            >
              {t('common.cancel')}
            </Button>
            <Button type="submit" variant="filled" size="sm">
              {t('common.save')}
            </Button>
          </div>
        </form>
      </Dialog>

      {/* Confirm Create New Room Dialog */}
      <Dialog
        isOpen={isConfirmNewRoomOpen}
        onClose={() => setIsConfirmNewRoomOpen(false)}
        title={t('room.create_new')}
      >
        <div className="space-y-4 pt-2">
          <p className="text-sm text-md-on-surface-variant">
            {t('room.create_confirm')}
          </p>
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-md-outline/10">
            <Button
              type="button"
              variant="text"
              size="sm"
              onClick={() => setIsConfirmNewRoomOpen(false)}
            >
              {t('common.cancel')}
            </Button>
            <Button
              type="button"
              variant="filled"
              size="sm"
              onClick={() => {
                setIsConfirmNewRoomOpen(false);
                handleCreateNewRoom();
              }}
            >
              {t('room.create_button')}
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
}

/**
 * Root App component providing I18n localization context
 */
export function App() {
  return (
    <I18nProvider>
      <AppContent />
    </I18nProvider>
  );
}

export default App;
