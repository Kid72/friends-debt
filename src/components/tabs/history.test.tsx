import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { HistoryTab } from './HistoryTab';
import { ExpenseDialog } from '../dialogs/ExpenseDialog';
import { DeleteConfirmDialog } from '../dialogs/DeleteConfirmDialog';
import { I18nProvider } from '../../i18n/I18nContext';
import { Participant, Expense, Settlement } from '../../types';

const renderWithI18n = (ui: React.ReactElement, initialLang: 'az' | 'ru' | 'en' = 'az') => {
  return render(<I18nProvider initialLang={initialLang}>{ui}</I18nProvider>);
};

describe('Task 7: Expense Management, Split Calculator & History Tab', () => {
  const mockParticipants: Participant[] = [
    { id: 'p1', name: 'Elvin Məmmədov', avatarColor: '#006A60' },
    { id: 'p2', name: 'Rauf Əliyev', avatarColor: '#984061' },
    { id: 'p3', name: 'Leyla Qasımova', avatarColor: '#7C5800' },
  ];

  const todayStr = new Date().toISOString().slice(0, 10);
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().slice(0, 10);

  const mockExpenses: Expense[] = [
    {
      id: 'e1',
      title: 'Tarqovıda Nahar',
      amount: 60,
      payerId: 'p1',
      date: todayStr,
      splitMode: 'equal',
      involvedParticipantIds: ['p1', 'p2', 'p3'],
      createdAt: 1000,
    },
    {
      id: 'e2',
      title: 'Aeroport Taksi',
      amount: 25,
      payerId: 'p2',
      date: yesterdayStr,
      splitMode: 'custom',
      involvedParticipantIds: ['p1', 'p2'],
      customSplits: [
        { participantId: 'p1', amount: 15 },
        { participantId: 'p2', amount: 10 },
      ],
      createdAt: 2000,
    },
  ];

  const mockSettlements: Settlement[] = [
    {
      id: 's1',
      fromParticipantId: 'p2',
      toParticipantId: 'p1',
      amount: 20,
      date: todayStr,
      createdAt: 3000,
    },
  ];

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  // ==========================================
  // 1. ExpenseDialog Tests
  // ==========================================
  describe('ExpenseDialog Component', () => {
    it('renders in Add mode with default fields and all participants checked', () => {
      renderWithI18n(
        <ExpenseDialog
          isOpen={true}
          onClose={vi.fn()}
          onSave={vi.fn()}
          participants={mockParticipants}
          activeParticipant={mockParticipants[1]} // Rauf
          currency="₼"
        />
      );

      // Dialog Title
      expect(screen.getByText('Yeni xərc əlavə et')).toBeInTheDocument();

      // Inputs present
      const titleInput = screen.getByLabelText(/Xərcin təsviri \/ adı/i);
      expect(titleInput).toBeInTheDocument();
      expect(titleInput).toHaveValue('');

      const amountInput = screen.getByLabelText(/Məbləğ \(₼\)/i);
      expect(amountInput).toBeInTheDocument();

      // Payer select defaults to active participant (Rauf)
      const payerSelect = screen.getByLabelText(/Kim ödədi\?/i) as HTMLSelectElement;
      expect(payerSelect.value).toBe('p2');

      // Date defaults to today
      const dateInput = screen.getByLabelText(/Tarix/i);
      expect(dateInput).toHaveValue(todayStr);

      // Equal split by default with all 3 participants selected
      const checkboxes = screen.getAllByRole('checkbox');
      expect(checkboxes.length).toBe(3);
      checkboxes.forEach((cb) => expect(cb).toHaveAttribute('aria-checked', 'true'));
    });

    it('calculates dynamic live split amount indicator in equal split mode', () => {
      renderWithI18n(
        <ExpenseDialog
          isOpen={true}
          onClose={vi.fn()}
          onSave={vi.fn()}
          participants={mockParticipants}
          currency="₼"
        />
      );

      const amountInput = screen.getByLabelText(/Məbləğ \(₼\)/i);
      fireEvent.change(amountInput, { target: { value: '60' } });

      // 60 / 3 = 20 ₼ per person
      expect(screen.getByText(/Hər kəsə 20 ₼/i)).toBeInTheDocument();

      // Uncheck one participant (e.g. Leyla)
      const leylaCheckbox = screen.getByRole('checkbox', { name: /Leyla Qasımova/i });
      fireEvent.click(leylaCheckbox);

      // Now 2 participants: 60 / 2 = 30 ₼ per person
      expect(screen.getByText(/Hər kəsə 30 ₼/i)).toBeInTheDocument();
    });

    it('supports select all and deselect all shortcuts in equal split mode', () => {
      renderWithI18n(
        <ExpenseDialog
          isOpen={true}
          onClose={vi.fn()}
          onSave={vi.fn()}
          participants={mockParticipants}
          currency="₼"
        />
      );

      const deselectAllBtn = screen.getByText('Seçimi ləğv et');
      fireEvent.click(deselectAllBtn);

      const checkboxes = screen.getAllByRole('checkbox');
      checkboxes.forEach((cb) => expect(cb).toHaveAttribute('aria-checked', 'false'));

      const selectAllBtn = screen.getByText('Hamısını seç');
      fireEvent.click(selectAllBtn);

      checkboxes.forEach((cb) => expect(cb).toHaveAttribute('aria-checked', 'true'));
    });

    it('validates required fields: empty title, zero/invalid amount, no participants', async () => {
      const onSave = vi.fn();
      renderWithI18n(
        <ExpenseDialog
          isOpen={true}
          onClose={vi.fn()}
          onSave={onSave}
          participants={mockParticipants}
          currency="₼"
        />
      );

      const saveBtn = screen.getByRole('button', { name: 'Yadda saxla' });

      // 1. Submit with empty title
      fireEvent.click(saveBtn);
      expect(screen.getByRole('alert')).toHaveTextContent('Xərcin adını daxil edin');
      expect(onSave).not.toHaveBeenCalled();

      // Fill title, but amount is empty
      const titleInput = screen.getByLabelText(/Xərcin təsviri \/ adı/i);
      fireEvent.change(titleInput, { target: { value: 'Qəhvə' } });
      fireEvent.click(saveBtn);
      expect(screen.getByRole('alert')).toHaveTextContent('Düzgün məbləğ daxil edin');
      expect(onSave).not.toHaveBeenCalled();

      // Fill amount with zero
      const amountInput = screen.getByLabelText(/Məbləğ \(₼\)/i);
      fireEvent.change(amountInput, { target: { value: '0' } });
      fireEvent.click(saveBtn);
      expect(screen.getByRole('alert')).toHaveTextContent('Düzgün məbləğ daxil edin');

      // Fill valid amount, but deselect all participants
      fireEvent.change(amountInput, { target: { value: '15' } });
      fireEvent.click(screen.getByText('Seçimi ləğv et'));
      fireEvent.click(saveBtn);
      expect(screen.getByRole('alert')).toHaveTextContent('Ən azı bir iştirakçı seçilməlidir');
      expect(onSave).not.toHaveBeenCalled();
    });

    it('successfully submits valid expense in equal split mode', async () => {
      const onSave = vi.fn().mockResolvedValue(true);
      const onClose = vi.fn();

      renderWithI18n(
        <ExpenseDialog
          isOpen={true}
          onClose={onClose}
          onSave={onSave}
          participants={mockParticipants}
          currency="₼"
        />
      );

      fireEvent.change(screen.getByLabelText(/Xərcin təsviri \/ adı/i), {
        target: { value: 'Dönər və Ayran' },
      });
      fireEvent.change(screen.getByLabelText(/Məbləğ \(₼\)/i), {
        target: { value: '45.50' },
      });
      fireEvent.change(screen.getByLabelText(/Kim ödədi\?/i), {
        target: { value: 'p2' },
      });

      const saveBtn = screen.getByRole('button', { name: 'Yadda saxla' });
      fireEvent.click(saveBtn);

      await waitFor(() => {
        expect(onSave).toHaveBeenCalledWith({
          id: undefined,
          title: 'Dönər və Ayran',
          amount: 45.5,
          payerId: 'p2',
          date: todayStr,
          splitMode: 'equal',
          involvedParticipantIds: ['p1', 'p2', 'p3'],
          customSplits: undefined,
        });
        expect(onClose).toHaveBeenCalled();
      });
    });

    it('handles flexible/custom split mode with live sum validation & distribute evenly', async () => {
      const onSave = vi.fn().mockResolvedValue(true);
      const onClose = vi.fn();

      renderWithI18n(
        <ExpenseDialog
          isOpen={true}
          onClose={onClose}
          onSave={onSave}
          participants={mockParticipants}
          currency="₼"
        />
      );

      fireEvent.change(screen.getByLabelText(/Xərcin təsviri \/ adı/i), {
        target: { value: 'Xüsusi Sifariş' },
      });
      fireEvent.change(screen.getByLabelText(/Məbləğ \(₼\)/i), {
        target: { value: '50' },
      });

      // Switch to Custom Split
      const customSplitPill = screen.getByRole('radio', { name: /Dəqiq məbləğlərlə böl/i });
      fireEvent.click(customSplitPill);

      // Remaining amount should indicate 50 ₼ unallocated
      expect(screen.getByText(/Qalıq: 50 ₼/i)).toBeInTheDocument();

      // Try saving when sum does not match
      const saveBtn = screen.getByRole('button', { name: 'Yadda saxla' });
      fireEvent.click(saveBtn);
      expect(screen.getByRole('alert')).toHaveTextContent('Daxil edilmiş məbləğlərin cəmi');
      expect(onSave).not.toHaveBeenCalled();

      // Test "Bərabər payla" (Distribute evenly) helper
      const distributeBtn = screen.getByRole('button', { name: /Bərabər payla/i });
      fireEvent.click(distributeBtn);

      // 50 / 3 = 16.67 + 16.67 + 16.66 = 50.00
      expect(screen.getByText(/Cəm dəqiq uyğun gəlir/i)).toBeInTheDocument();

      // Manual edit custom split amounts
      const p1Input = screen.getByTestId('custom-split-input-p1');
      const p2Input = screen.getByTestId('custom-split-input-p2');
      const p3Input = screen.getByTestId('custom-split-input-p3');

      fireEvent.change(p1Input, { target: { value: '20' } });
      fireEvent.change(p2Input, { target: { value: '20' } });
      fireEvent.change(p3Input, { target: { value: '10' } });

      // 20 + 20 + 10 = 50 -> exact match!
      expect(screen.getByText(/Cəm dəqiq uyğun gəlir/i)).toBeInTheDocument();

      fireEvent.click(saveBtn);

      await waitFor(() => {
        expect(onSave).toHaveBeenCalledWith({
          id: undefined,
          title: 'Xüsusi Sifariş',
          amount: 50,
          payerId: 'p1',
          date: todayStr,
          splitMode: 'custom',
          involvedParticipantIds: ['p1', 'p2', 'p3'],
          customSplits: [
            { participantId: 'p1', amount: 20 },
            { participantId: 'p2', amount: 20 },
            { participantId: 'p3', amount: 10 },
          ],
        });
        expect(onClose).toHaveBeenCalled();
      });
    });

    it('renders in Edit mode with pre-filled values and allows updating', async () => {
      const onSave = vi.fn().mockResolvedValue(true);
      const onDelete = vi.fn();
      const onClose = vi.fn();

      renderWithI18n(
        <ExpenseDialog
          isOpen={true}
          onClose={onClose}
          onSave={onSave}
          onDelete={onDelete}
          initialExpense={mockExpenses[0]}
          participants={mockParticipants}
          currency="₼"
        />
      );

      // Title shows Edit
      expect(screen.getByText('Xərci redaktə et')).toBeInTheDocument();

      // Form values are pre-filled
      const titleInput = screen.getByLabelText(/Xərcin təsviri \/ adı/i);
      expect(titleInput).toHaveValue('Tarqovıda Nahar');

      const amountInput = screen.getByLabelText(/Məbləğ \(₼\)/i);
      expect(amountInput).toHaveValue(60);

      // Delete button is present in Edit mode
      const deleteBtn = screen.getByRole('button', { name: 'Sil' });
      expect(deleteBtn).toBeInTheDocument();
      fireEvent.click(deleteBtn);
      expect(onDelete).toHaveBeenCalledWith('e1');

      // Update title and save
      fireEvent.change(titleInput, { target: { value: 'Tarqovıda Nahar & Şirniyyat' } });
      const saveBtn = screen.getByRole('button', { name: 'Yadda saxla' });
      fireEvent.click(saveBtn);

      await waitFor(() => {
        expect(onSave).toHaveBeenCalledWith(
          expect.objectContaining({
            id: 'e1',
            title: 'Tarqovıda Nahar & Şirniyyat',
            amount: 60,
          })
        );
      });
    });
  });

  // ==========================================
  // 2. DeleteConfirmDialog Tests
  // ==========================================
  describe('DeleteConfirmDialog Component', () => {
    it('renders confirmation message and balance recalculation warning', () => {
      renderWithI18n(
        <DeleteConfirmDialog
          isOpen={true}
          onClose={vi.fn()}
          onConfirm={vi.fn()}
          itemName="Tarqovıda Nahar"
          itemType="expense"
        />
      );

      expect(screen.getByText('Silinməni təsdiqləyin')).toBeInTheDocument();
      expect(
        screen.getByText(/"Tarqovıda Nahar" xərcini silmək istədiyinizə əminsiniz\?/i)
      ).toBeInTheDocument();
      expect(
        screen.getByText(/Bu əməliyyatı sildikdə bütün borclar və balanslar avtomatik yenidən hesablanacaq/i)
      ).toBeInTheDocument();
    });

    it('triggers onConfirm and onClose when confirmed', async () => {
      const onConfirm = vi.fn().mockResolvedValue(true);
      const onClose = vi.fn();

      renderWithI18n(
        <DeleteConfirmDialog
          isOpen={true}
          onClose={onClose}
          onConfirm={onConfirm}
          itemName="Tarqovıda Nahar"
        />
      );

      const deleteBtn = screen.getByRole('button', { name: 'Sil' });
      fireEvent.click(deleteBtn);

      await waitFor(() => {
        expect(onConfirm).toHaveBeenCalled();
        expect(onClose).toHaveBeenCalled();
      });
    });

    it('triggers onClose when canceled', () => {
      const onClose = vi.fn();
      renderWithI18n(
        <DeleteConfirmDialog
          isOpen={true}
          onClose={onClose}
          onConfirm={vi.fn()}
          itemName="Tarqovıda Nahar"
        />
      );

      const cancelBtn = screen.getByRole('button', { name: 'Ləğv et' });
      fireEvent.click(cancelBtn);

      expect(onClose).toHaveBeenCalled();
    });
  });

  // ==========================================
  // 3. HistoryTab Tests
  // ==========================================
  describe('HistoryTab Component', () => {
    it('renders chronological feed grouped by date with expense and settlement cards', () => {
      renderWithI18n(
        <HistoryTab
          expenses={mockExpenses}
          settlements={mockSettlements}
          participants={mockParticipants}
          currency="₼"
        />
      );

      // Date headers: Bugün and Dünən
      expect(screen.getByText('Bugün')).toBeInTheDocument();
      expect(screen.getByText('Dünən')).toBeInTheDocument();

      // Expense 1 details
      expect(screen.getByText('Tarqovıda Nahar')).toBeInTheDocument();
      expect(screen.getByText('60 ₼')).toBeInTheDocument();
      expect(screen.getByText('Bərabər böl')).toBeInTheDocument();

      // Expense 2 details
      expect(screen.getByText('Aeroport Taksi')).toBeInTheDocument();
      expect(screen.getByText('25 ₼')).toBeInTheDocument();
      expect(screen.getByText('Dəqiq məbləğlərlə böl')).toBeInTheDocument();

      // Settlement card details
      expect(screen.getByText('Borc ödənildi')).toBeInTheDocument();
      expect(
        screen.getByText(/Rauf Əliyev ödədi Elvin Məmmədov-ə: 20 ₼/i)
      ).toBeInTheDocument();
    });

    it('filters feed by search query matching title or participant name', () => {
      renderWithI18n(
        <HistoryTab
          expenses={mockExpenses}
          settlements={mockSettlements}
          participants={mockParticipants}
          currency="₼"
        />
      );

      const searchInput = screen.getByRole('searchbox');

      // Search by title "Taksi"
      fireEvent.change(searchInput, { target: { value: 'Taksi' } });
      expect(screen.getByText('Aeroport Taksi')).toBeInTheDocument();
      expect(screen.queryByText('Tarqovıda Nahar')).not.toBeInTheDocument();

      // Search by participant name "Leyla" (who only participated in Nahar)
      fireEvent.change(searchInput, { target: { value: 'Leyla' } });
      expect(screen.getByText('Tarqovıda Nahar')).toBeInTheDocument();
      expect(screen.queryByText('Aeroport Taksi')).not.toBeInTheDocument();

      // Search with non-matching query -> empty state
      fireEvent.change(searchInput, { target: { value: 'Nonexistent Transaction' } });
      expect(screen.getByText('Heç bir xərc və ya ödəniş tapılmadı')).toBeInTheDocument();

      // Clear search
      const clearBtn = screen.getByLabelText('Clear search');
      fireEvent.click(clearBtn);
      expect(screen.getByText('Tarqovıda Nahar')).toBeInTheDocument();
    });

    it('filters feed by item type: All, Expenses, Settlements', () => {
      renderWithI18n(
        <HistoryTab
          expenses={mockExpenses}
          settlements={mockSettlements}
          participants={mockParticipants}
          currency="₼"
        />
      );

      // Filter: Only Expenses
      const expensesFilter = screen.getByRole('radio', { name: 'Xərclər' });
      fireEvent.click(expensesFilter);

      expect(screen.getByText('Tarqovıda Nahar')).toBeInTheDocument();
      expect(screen.getByText('Aeroport Taksi')).toBeInTheDocument();
      expect(screen.queryByText('Borc ödənildi')).not.toBeInTheDocument();

      // Filter: Only Settlements
      const settlementsFilter = screen.getByRole('radio', { name: 'Borc bağlamaları' });
      fireEvent.click(settlementsFilter);

      expect(screen.getByText('Borc ödənildi')).toBeInTheDocument();
      expect(screen.queryByText('Tarqovıda Nahar')).not.toBeInTheDocument();
      expect(screen.queryByText('Aeroport Taksi')).not.toBeInTheDocument();

      // Filter: All
      const allFilter = screen.getByRole('radio', { name: 'Hamısı' });
      fireEvent.click(allFilter);

      expect(screen.getByText('Tarqovıda Nahar')).toBeInTheDocument();
      expect(screen.getByText('Borc ödənildi')).toBeInTheDocument();
    });

    it('filters feed by selected participant dropdown', () => {
      renderWithI18n(
        <HistoryTab
          expenses={mockExpenses}
          settlements={mockSettlements}
          participants={mockParticipants}
          currency="₼"
        />
      );

      const participantSelect = screen.getByLabelText('Filter by participant');

      // Filter by Leyla (p3) - only involved in e1, not e2 or s1
      fireEvent.change(participantSelect, { target: { value: 'p3' } });

      expect(screen.getByText('Tarqovıda Nahar')).toBeInTheDocument();
      expect(screen.queryByText('Aeroport Taksi')).not.toBeInTheDocument();
      expect(screen.queryByText('Borc ödənildi')).not.toBeInTheDocument();
    });

    it('displays empty state card when expenses and settlements are empty', () => {
      renderWithI18n(
        <HistoryTab
          expenses={[]}
          settlements={[]}
          participants={mockParticipants}
          currency="₼"
        />
      );

      expect(screen.getByText('Heç bir xərc və ya ödəniş tapılmadı')).toBeInTheDocument();
    });

    it('opens ExpenseDialog when Edit button is clicked on an expense card and calls onEditExpense on save', async () => {
      const onEditExpense = vi.fn().mockResolvedValue(true);

      renderWithI18n(
        <HistoryTab
          expenses={mockExpenses}
          settlements={mockSettlements}
          participants={mockParticipants}
          currency="₼"
          onEditExpense={onEditExpense}
        />
      );

      // Click edit button for "Tarqovıda Nahar"
      const editBtn = screen.getByLabelText('Düzəliş et Tarqovıda Nahar');
      fireEvent.click(editBtn);

      // Edit Dialog should open
      expect(screen.getByText('Xərci redaktə et')).toBeInTheDocument();
      const titleInput = screen.getByLabelText(/Xərcin təsviri \/ adı/i);
      expect(titleInput).toHaveValue('Tarqovıda Nahar');

      // Change title and save
      fireEvent.change(titleInput, { target: { value: 'Tarqovıda Nahar (Yenilənmiş)' } });
      fireEvent.click(screen.getByRole('button', { name: 'Yadda saxla' }));

      await waitFor(() => {
        expect(onEditExpense).toHaveBeenCalledWith(
          expect.objectContaining({
            id: 'e1',
            title: 'Tarqovıda Nahar (Yenilənmiş)',
          })
        );
      });
    });

    it('opens DeleteConfirmDialog when Delete button is clicked on an expense card and calls onDeleteExpense on confirm', async () => {
      const onDeleteExpense = vi.fn().mockResolvedValue(true);

      renderWithI18n(
        <HistoryTab
          expenses={mockExpenses}
          settlements={mockSettlements}
          participants={mockParticipants}
          currency="₼"
          onDeleteExpense={onDeleteExpense}
        />
      );

      const deleteBtn = screen.getByLabelText('Sil Tarqovıda Nahar');
      fireEvent.click(deleteBtn);

      // Confirmation dialog should open
      expect(screen.getByText('Silinməni təsdiqləyin')).toBeInTheDocument();
      expect(
        screen.getByText(/"Tarqovıda Nahar" xərcini silmək istədiyinizə əminsiniz\?/i)
      ).toBeInTheDocument();

      // Confirm deletion
      const confirmDeleteBtn = screen.getByRole('button', { name: 'Sil' });
      fireEvent.click(confirmDeleteBtn);

      await waitFor(() => {
        expect(onDeleteExpense).toHaveBeenCalledWith('e1');
      });
    });

    it('opens DeleteConfirmDialog when Delete button is clicked on a settlement card and calls onDeleteSettlement on confirm', async () => {
      const onDeleteSettlement = vi.fn().mockResolvedValue(true);

      renderWithI18n(
        <HistoryTab
          expenses={mockExpenses}
          settlements={mockSettlements}
          participants={mockParticipants}
          currency="₼"
          onDeleteSettlement={onDeleteSettlement}
        />
      );

      const deleteSettlementBtn = screen.getByLabelText('Sil settlement');
      fireEvent.click(deleteSettlementBtn);

      // Confirmation dialog should open
      expect(screen.getByText('Silinməni təsdiqləyin')).toBeInTheDocument();
      expect(
        screen.getByText(/ödənişi silmək istədiyinizə əminsiniz\?/i)
      ).toBeInTheDocument();

      // Confirm deletion
      const confirmDeleteBtn = screen.getByRole('button', { name: 'Sil' });
      fireEvent.click(confirmDeleteBtn);

      await waitFor(() => {
        expect(onDeleteSettlement).toHaveBeenCalledWith('s1');
      });
    });
  });
});
