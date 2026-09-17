import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { TransfersTab } from './TransfersTab';
import { SettleDialog } from '../dialogs/SettleDialog';
import { I18nProvider } from '../../i18n/I18nContext';
import { Expense, Participant, Settlement, SimplifiedTransfer } from '../../types';
import confetti from 'canvas-confetti';

// Mock canvas-confetti
vi.mock('canvas-confetti', () => {
  const mockConfetti = vi.fn();
  return {
    default: mockConfetti,
    __esModule: true,
  };
});

const renderWithI18n = (ui: React.ReactElement, initialLang: 'az' | 'ru' | 'en' = 'az') => {
  return render(<I18nProvider initialLang={initialLang}>{ui}</I18nProvider>);
};

describe('Task 8: Transfers Tab, One-Click Settle-Up, WhatsApp Sharing & Confetti', () => {
  const mockParticipants: Participant[] = [
    { id: 'p1', name: 'Elvin Məmmədov', avatarColor: '#006A60' },
    { id: 'p2', name: 'Rauf Əliyev', avatarColor: '#984061' },
    { id: 'p3', name: 'Leyla Qasımova', avatarColor: '#7C5800' },
  ];

  const mockExpenses: Expense[] = [
    {
      id: 'e1',
      title: 'Restoranda Axşam Yeməyi',
      amount: 90,
      payerId: 'p1', // Elvin paid 90 for all 3 -> 30 each. Rauf owes 30, Leyla owes 30 to Elvin.
      date: '2026-09-17',
      splitMode: 'equal',
      involvedParticipantIds: ['p1', 'p2', 'p3'],
      createdAt: 1000,
    },
  ];

  const mockTransfers: SimplifiedTransfer[] = [
    {
      fromParticipantId: 'p2',
      toParticipantId: 'p1',
      amount: 30,
      explanation: {
        az: 'Rauf Əliyev Elvin Məmmədov şəxsinə 30 ₼ ödəməlidir.',
        ru: 'Рауф Алиев переводит Эльвин Мамедов 30 ₼.',
        en: 'Rauf Əliyev pays Elvin Məmmədov 30 ₼.',
      },
    },
    {
      fromParticipantId: 'p3',
      toParticipantId: 'p1',
      amount: 30,
      explanation: {
        az: 'Leyla Qasımova Elvin Məmmədov şəxsinə 30 ₼ ödəməlidir.',
        ru: 'Лейла Касымова переводит Эльвин Мамедов 30 ₼.',
        en: 'Leyla Qasımova pays Elvin Məmmədov 30 ₼.',
      },
    },
  ];

  let originalWindowOpen: any;

  beforeEach(() => {
    vi.clearAllMocks();
    originalWindowOpen = window.open;
    window.open = vi.fn();
  });

  afterEach(() => {
    window.open = originalWindowOpen;
  });

  // ============================================================
  // 1. SettleDialog Tests
  // ============================================================
  describe('SettleDialog Component', () => {
    it('renders confirmation modal with debtor, receiver avatars, and transfer amount', () => {
      renderWithI18n(
        <SettleDialog
          isOpen={true}
          onClose={vi.fn()}
          transfer={mockTransfers[0]}
          participants={mockParticipants}
          currency="₼"
          onConfirmSettle={vi.fn()}
        />
      );

      // Title
      expect(screen.getByRole('heading', { name: 'Borcu bağla' })).toBeInTheDocument();

      // Debtor and Receiver names
      expect(screen.getAllByText('Rauf Əliyev').length).toBeGreaterThan(0);
      expect(screen.getAllByText('Elvin Məmmədov').length).toBeGreaterThan(0);

      // Amount formatted
      expect(screen.getByText('30 ₼')).toBeInTheDocument();

      // Confirm and cancel buttons
      expect(screen.getByRole('button', { name: 'Ləğv et' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Ödənişi təsdiqlə' })).toBeInTheDocument();
    });

    it('executes settle flow: calls onConfirmSettle, triggers confetti and push notification, and shows success state with WhatsApp share button', async () => {
      const onConfirmSettle = vi.fn().mockResolvedValue(true);
      const onClose = vi.fn();

      // Mock Notification
      const mockNotification = vi.fn();
      (mockNotification as any).permission = 'granted';
      (window as any).Notification = mockNotification;
      globalThis.Notification = mockNotification as any;

      renderWithI18n(
        <SettleDialog
          isOpen={true}
          onClose={onClose}
          transfer={mockTransfers[0]}
          participants={mockParticipants}
          currency="₼"
          roomName="Tarqovı Qrupu"
          appUrl="https://friends-debt.vercel.app?room=test123"
          onConfirmSettle={onConfirmSettle}
        />
      );

      const confirmBtn = screen.getByRole('button', { name: 'Ödənişi təsdiqlə' });
      fireEvent.click(confirmBtn);

      await waitFor(() => {
        expect(onConfirmSettle).toHaveBeenCalledWith({
          fromParticipantId: 'p2',
          toParticipantId: 'p1',
          amount: 30,
          date: expect.any(String),
        });
        expect(screen.getByRole('heading', { name: 'Borc uğurla bağlandı!' })).toBeInTheDocument();
      });

      // Confetti triggered
      expect(confetti).toHaveBeenCalled();

      // Notification triggered
      expect(mockNotification).toHaveBeenCalledWith(
        'Borc bağlandı! 🎉',
        expect.objectContaining({
          body: expect.stringContaining('Rauf Əliyev 30 ₼ məbləğini Elvin Məmmədov-a qaytardı! 🎉'),
        })
      );

      // Success text
      expect(
        screen.getByText(/Rauf Əliyev tərəfindən Elvin Məmmədov şəxsinə 30 ₼ ödənildi və borc bağlandı./i)
      ).toBeInTheDocument();

      // WhatsApp Share button rendered
      const shareBtn = screen.getByRole('button', { name: 'WhatsApp ilə paylaş' });
      expect(shareBtn).toBeInTheDocument();

      // Clicking WhatsApp share button opens wa.me link
      fireEvent.click(shareBtn);
      expect(window.open).toHaveBeenCalledWith(
        expect.stringContaining('https://wa.me/?text='),
        '_blank',
        'noopener,noreferrer'
      );

      const callUrl = (window.open as any).mock.calls[0][0];
      const decoded = decodeURIComponent(callUrl);
      expect(decoded).toContain('Borc bağlandı');
      expect(decoded).toContain('Rauf Əliyev ➡️ 30 ₼ ➡️ Elvin Məmmədov');
    });
  });

  // ============================================================
  // 2. TransfersTab Component Tests
  // ============================================================
  describe('TransfersTab Component', () => {
    it('renders minimal optimized transfers calculated from expenses', () => {
      renderWithI18n(
        <TransfersTab
          expenses={mockExpenses}
          settlements={[]}
          participants={mockParticipants}
          currency="₼"
          roomName="Dostlar Yığıncağı"
        />
      );

      // Section title & count badge
      expect(screen.getByText('Optimallaşdırılmış köçürmələr')).toBeInTheDocument();
      expect(screen.getByText('2')).toBeInTheDocument(); // 2 transfers: Rauf->Elvin (30), Leyla->Elvin (30)

      // Both transfers visible
      const amounts = screen.getAllByText('30 ₼');
      expect(amounts.length).toBe(2);

      expect(screen.getByText('Rauf Əliyev')).toBeInTheDocument();
      expect(screen.getByText('Leyla Qasımova')).toBeInTheDocument();
      expect(screen.getAllByText('Elvin Məmmədov').length).toBeGreaterThan(0);

      // Settle Up buttons
      const settleButtons = screen.getAllByRole('button', { name: 'Borcu bağla' });
      expect(settleButtons.length).toBe(2);
    });

    it('toggles explanation accordion showing triangular debt collapse logic', () => {
      renderWithI18n(
        <TransfersTab
          expenses={mockExpenses}
          settlements={[]}
          participants={mockParticipants}
          currency="₼"
        />
      );

      const accordionToggles = screen.getAllByRole('button', {
        name: /Borclar necə optimallaşdırıldı\?/i,
      });
      expect(accordionToggles.length).toBe(2);

      // Initially explanations are not visible
      expect(screen.queryByText(/Rauf Əliyev Elvin Məmmədov şəxsinə 30 ₼ ödəməlidir/i)).not.toBeInTheDocument();

      // Click first toggle
      fireEvent.click(accordionToggles[0]);

      // Now explanation should be visible
      expect(screen.getByText(/Rauf Əliyev Elvin Məmmədov şəxsinə 30 ₼ ödəməlidir/i)).toBeInTheDocument();

      // Click again to collapse
      fireEvent.click(accordionToggles[0]);
      expect(screen.queryByText(/Rauf Əliyev Elvin Məmmədov şəxsinə 30 ₼ ödəməlidir/i)).not.toBeInTheDocument();
    });

    it('shares full gathering summary via WhatsApp button', () => {
      renderWithI18n(
        <TransfersTab
          expenses={mockExpenses}
          settlements={[]}
          participants={mockParticipants}
          currency="₼"
          roomName="Cümə Axşamı"
          appUrl="https://friends-debt.vercel.app?room=xyz"
        />
      );

      const shareSummaryBtn = screen.getByRole('button', { name: /Ümumi hesabatı paylaş/i });
      expect(shareSummaryBtn).toBeInTheDocument();

      fireEvent.click(shareSummaryBtn);

      expect(window.open).toHaveBeenCalledWith(
        expect.stringContaining('https://wa.me/?text='),
        '_blank',
        'noopener,noreferrer'
      );

      const openUrl = (window.open as any).mock.calls[0][0];
      const decoded = decodeURIComponent(openUrl);
      expect(decoded).toContain('🍻 Yığıncaq nəticələri: Cümə Axşamı');
      expect(decoded).toContain('💰 Ümumi hesab: 90 ₼ (ödədi: Elvin Məmmədov)');
      expect(decoded).toContain('📋 Kim kimə köçürür (optimallaşdırılmış):');
      expect(decoded).toContain('• Rauf Əliyev ➡️ 30 ₼ ➡️ Elvin Məmmədov');
      expect(decoded).toContain('• Leyla Qasımova ➡️ 30 ₼ ➡️ Elvin Məmmədov');
      expect(decoded).toContain('🔗 Balansı yoxlamaq və borcları bağlamaq: https://friends-debt.vercel.app?room=xyz');
    });

    it('highlights active participant in transfer card', () => {
      renderWithI18n(
        <TransfersTab
          expenses={mockExpenses}
          settlements={[]}
          participants={mockParticipants}
          currency="₼"
          activeParticipant={mockParticipants[1]} // Rauf (debtor in first transfer)
        />
      );

      // Should show 'Mən' profile badge
      expect(screen.getByText('Mən')).toBeInTheDocument();
    });

    it('opens SettleDialog when Settle button is clicked and delegates to onSettleDebt', async () => {
      const onSettleDebt = vi.fn().mockResolvedValue(true);

      renderWithI18n(
        <TransfersTab
          expenses={mockExpenses}
          settlements={[]}
          participants={mockParticipants}
          currency="₼"
          onSettleDebt={onSettleDebt}
        />
      );

      const settleButtons = screen.getAllByRole('button', { name: 'Borcu bağla' });
      fireEvent.click(settleButtons[0]);

      // Modal opens
      expect(screen.getByRole('heading', { name: 'Borcu bağla' })).toBeInTheDocument();

      // Click confirm
      const confirmBtn = screen.getByRole('button', { name: 'Ödənişi təsdiqlə' });
      fireEvent.click(confirmBtn);

      await waitFor(() => {
        expect(onSettleDebt).toHaveBeenCalledWith({
          fromParticipantId: 'p2',
          toParticipantId: 'p1',
          amount: 30,
          date: expect.any(String),
        });
      });
    });

    it('renders celebratory empty state when all debts are settled', () => {
      // Settlements completely offsetting the 90 ₼ expense
      const offsetSettlements: Settlement[] = [
        {
          id: 's1',
          fromParticipantId: 'p2',
          toParticipantId: 'p1',
          amount: 30,
          date: '2026-09-17',
          createdAt: 2000,
        },
        {
          id: 's2',
          fromParticipantId: 'p3',
          toParticipantId: 'p1',
          amount: 30,
          date: '2026-09-17',
          createdAt: 3000,
        },
      ];

      renderWithI18n(
        <TransfersTab
          expenses={mockExpenses}
          settlements={offsetSettlements}
          participants={mockParticipants}
          currency="₼"
        />
      );

      // Celebratory zero-debt state
      expect(
        screen.getByText('Bütün borclar bağlanıb! Heç kimin heç kimə borcu yoxdur 🎉')
      ).toBeInTheDocument();

      // No transfer cards
      expect(screen.queryByRole('button', { name: 'Borcu bağla' })).not.toBeInTheDocument();

      // Still provides summary share button
      expect(screen.getByRole('button', { name: /Ümumi hesabatı paylaş/i })).toBeInTheDocument();
    });

    it('triggers celebratory multi-stage confetti when all debts become settled', async () => {
      const { rerender } = renderWithI18n(
        <TransfersTab
          expenses={mockExpenses}
          settlements={[]}
          participants={mockParticipants}
          currency="₼"
        />
      );

      // Now all debts get settled via rerender with settlements
      const fullSettlements: Settlement[] = [
        {
          id: 's1',
          fromParticipantId: 'p2',
          toParticipantId: 'p1',
          amount: 30,
          date: '2026-09-17',
          createdAt: 2000,
        },
        {
          id: 's2',
          fromParticipantId: 'p3',
          toParticipantId: 'p1',
          amount: 30,
          date: '2026-09-17',
          createdAt: 3000,
        },
      ];

      rerender(
        <I18nProvider initialLang="az">
          <TransfersTab
            expenses={mockExpenses}
            settlements={fullSettlements}
            participants={mockParticipants}
            currency="₼"
          />
        </I18nProvider>
      );

      await waitFor(() => {
        expect(confetti).toHaveBeenCalled();
      });
    });
  });
});
