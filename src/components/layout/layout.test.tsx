import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Header } from './Header';
import { HeroBalance } from './HeroBalance';
import { ParticipantDialog } from '../dialogs/ParticipantDialog';
import { CurrencyDialog } from '../dialogs/CurrencyDialog';
import { I18nProvider } from '../../i18n/I18nContext';
import { Participant, Expense, Settlement } from '../../types';

// Wrapper helper
const renderWithI18n = (ui: React.ReactElement, initialLang: 'az' | 'ru' | 'en' = 'az') => {
  return render(<I18nProvider initialLang={initialLang}>{ui}</I18nProvider>);
};

describe('App Header & Profile Switcher', () => {
  const mockParticipants: Participant[] = [
    { id: 'p1', name: 'Elvin Məmmədov', avatarColor: '#006A60' },
    { id: 'p2', name: 'Rauf Əliyev', avatarColor: '#984061' },
    { id: 'p3', name: 'Çingiz Həsənov', avatarColor: '#7C5800' },
  ];

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('renders room name, room code badge and profile switcher with active user', () => {
    const onSelectParticipant = vi.fn();

    renderWithI18n(
      <Header
        roomName="Şamaxı Səfəri"
        roomId="room-abc-123"
        currency="₼"
        participants={mockParticipants}
        activeParticipant={mockParticipants[0]}
        onSelectParticipant={onSelectParticipant}
      />
    );

    // Group name and room code badge
    expect(screen.getByText('Şamaxı Səfəri')).toBeInTheDocument();
    expect(screen.getByText('room-abc-123')).toBeInTheDocument();

    // Profile button shows "Mən — Elvin Məmmədov"
    expect(screen.getByText('Mən — Elvin Məmmədov')).toBeInTheDocument();
  });

  it('renders "Mən — Hamı" when active participant is null', () => {
    renderWithI18n(
      <Header
        participants={mockParticipants}
        activeParticipant={null}
        onSelectParticipant={vi.fn()}
      />
    );

    expect(screen.getByText('Mən — Hamı')).toBeInTheDocument();
  });

  it('switches identity instantly without password when a profile is selected from dropdown', async () => {
    const onSelectParticipant = vi.fn();
    const onAddParticipant = vi.fn();

    renderWithI18n(
      <Header
        participants={mockParticipants}
        activeParticipant={mockParticipants[0]}
        onSelectParticipant={onSelectParticipant}
        onAddParticipant={onAddParticipant}
      />
    );

    // Open dropdown
    const profileBtn = screen.getByText('Mən — Elvin Məmmədov');
    fireEvent.click(profileBtn);

    // Dropdown options should be visible
    expect(screen.getByRole('menu')).toBeInTheDocument();
    expect(screen.getByText('Profil seçin')).toBeInTheDocument();
    expect(screen.getByText('Rauf Əliyev')).toBeInTheDocument();
    expect(screen.getByText('Çingiz Həsənov')).toBeInTheDocument();

    // Click on Rauf Əliyev
    fireEvent.click(screen.getByText('Rauf Əliyev'));

    expect(onSelectParticipant).toHaveBeenCalledWith(mockParticipants[1]);
  });

  it('allows selecting "Hamı" (All / Overview) from profile dropdown', () => {
    const onSelectParticipant = vi.fn();

    renderWithI18n(
      <Header
        participants={mockParticipants}
        activeParticipant={mockParticipants[0]}
        onSelectParticipant={onSelectParticipant}
      />
    );

    fireEvent.click(screen.getByText('Mən — Elvin Məmmədov'));
    const allOption = screen.getByRole('menuitem', { name: /Hamı/i });
    fireEvent.click(allOption);

    expect(onSelectParticipant).toHaveBeenCalledWith(null);
  });

  it('copies room link on badge click and shows visual confirmation', async () => {
    const writeTextMock = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText: writeTextMock },
      configurable: true,
      writable: true,
    });

    renderWithI18n(
      <Header
        roomId="shamaxi-2026"
        participants={mockParticipants}
        activeParticipant={mockParticipants[0]}
        onSelectParticipant={vi.fn()}
      />
    );

    const copyBtn = screen.getByRole('button', { name: /Qrupu paylaş/i });
    fireEvent.click(copyBtn);

    expect(writeTextMock).toHaveBeenCalledWith(expect.stringContaining('room=shamaxi-2026'));

    // Should show visual confirmation "Kopyalandı!"
    await waitFor(() => {
      expect(screen.getByText('Kopyalandı!')).toBeInTheDocument();
    });
  });

  it('toggles notifications on button click', async () => {
    renderWithI18n(
      <Header
        participants={mockParticipants}
        activeParticipant={null}
        onSelectParticipant={vi.fn()}
      />
    );

    const notifBtn = screen.getByRole('button', { name: /Bildirişlər/i });
    expect(notifBtn).toBeInTheDocument();

    fireEvent.click(notifBtn);
    // Button exists and handles click without throwing
    expect(notifBtn).toBeInTheDocument();
  });

  it('opens help dialog when help button is clicked', () => {
    const onOpenHelp = vi.fn();

    renderWithI18n(
      <Header
        participants={mockParticipants}
        activeParticipant={null}
        onSelectParticipant={vi.fn()}
        onOpenHelp={onOpenHelp}
      />
    );

    const helpBtn = screen.getByRole('button', { name: /Kömək/i });
    fireEvent.click(helpBtn);

    expect(onOpenHelp).toHaveBeenCalledTimes(1);
  });

  it('opens built-in help modal if onOpenHelp prop is not provided', () => {
    renderWithI18n(
      <Header
        participants={mockParticipants}
        activeParticipant={null}
        onSelectParticipant={vi.fn()}
      />
    );

    const helpBtn = screen.getByRole('button', { name: /Kömək/i });
    fireEvent.click(helpBtn);

    // Modal opens with help content
    expect(screen.getByText('Məlumat və Təlimat')).toBeInTheDocument();
    expect(screen.getByText('Necə işləyir?')).toBeInTheDocument();
  });

  it('opens currency dialog when currency button is clicked', () => {
    renderWithI18n(
      <Header
        currency="$"
        participants={mockParticipants}
        activeParticipant={null}
        onSelectParticipant={vi.fn()}
      />
    );

    const currencyBtn = screen.getByRole('button', { name: /Valyutanı dəyiş/i });
    expect(currencyBtn).toBeInTheDocument();
    fireEvent.click(currencyBtn);

    expect(screen.getByText('Valyuta seçimi')).toBeInTheDocument();
  });
});

describe('HeroBalance Card', () => {
  const participants: Participant[] = [
    { id: '1', name: 'Elvin', avatarColor: '#006A60' },
    { id: '2', name: 'Rauf', avatarColor: '#984061' },
    { id: '3', name: 'Çingiz', avatarColor: '#7C5800' },
  ];

  it('renders positive balance in emerald green surface with "+amount" and "Sizə borcludurlar"', () => {
    // Elvin paid 90 AZN equally for 3 people. Each owes 30 AZN.
    // Elvin is owed 60 AZN (+60)
    const expenses: Expense[] = [
      {
        id: 'e1',
        title: 'Restoran',
        amount: 90,
        payerId: '1',
        date: '2026-09-17',
        splitMode: 'equal',
        involvedParticipantIds: ['1', '2', '3'],
        createdAt: 100,
      },
    ];

    renderWithI18n(
      <HeroBalance
        activeParticipant={participants[0]} // Elvin
        participants={participants}
        expenses={expenses}
        currency="₼"
      />
    );

    // Positive status
    expect(screen.getAllByText('Sizə borcludurlar').length).toBeGreaterThan(0);
    expect(screen.getByTestId('hero-amount')).toHaveTextContent('+60 ₼');
  });

  it('renders negative balance in amber/red surface with "-amount" and "Sizin borcunuz var"', () => {
    // Elvin paid 90 AZN equally for 3 people. Rauf owes 30 AZN (-30)
    const expenses: Expense[] = [
      {
        id: 'e1',
        title: 'Restoran',
        amount: 90,
        payerId: '1',
        date: '2026-09-17',
        splitMode: 'equal',
        involvedParticipantIds: ['1', '2', '3'],
        createdAt: 100,
      },
    ];

    const onSettleDebt = vi.fn();

    renderWithI18n(
      <HeroBalance
        activeParticipant={participants[1]} // Rauf
        participants={participants}
        expenses={expenses}
        currency="₼"
        onSettleDebt={onSettleDebt}
      />
    );

    // Negative status
    expect(screen.getAllByText('Sizin borcunuz var').length).toBeGreaterThan(0);
    expect(screen.getByTestId('hero-amount')).toHaveTextContent('-30 ₼');

    // Settle debt button is available for debtors
    const settleBtn = screen.getByRole('button', { name: /Borcu bağla/i });
    expect(settleBtn).toBeInTheDocument();
    fireEvent.click(settleBtn);
    expect(onSettleDebt).toHaveBeenCalledTimes(1);
  });

  it('renders zero balance in teal surface with "Balans təmizdir 🎉"', () => {
    // Elvin paid 60 AZN for Elvin and Rauf (30 each). Rauf settled 30 AZN to Elvin.
    const expenses: Expense[] = [
      {
        id: 'e1',
        title: 'Lunch',
        amount: 60,
        payerId: '1',
        date: '2026-09-17',
        splitMode: 'equal',
        involvedParticipantIds: ['1', '2'],
        createdAt: 100,
      },
    ];
    const settlements: Settlement[] = [
      {
        id: 's1',
        fromParticipantId: '2',
        toParticipantId: '1',
        amount: 30,
        date: '2026-09-17',
        createdAt: 200,
      },
    ];

    renderWithI18n(
      <HeroBalance
        activeParticipant={participants[1]} // Rauf: 0
        participants={participants}
        expenses={expenses}
        settlements={settlements}
        currency="₼"
      />
    );

    expect(screen.getAllByText('Balans təmizdir 🎉').length).toBeGreaterThan(0);
    expect(screen.getByTestId('hero-amount')).toHaveTextContent('0 ₼');
  });

  it('renders group overview when active participant is null', () => {
    const expenses: Expense[] = [
      {
        id: 'e1',
        title: 'Taxi',
        amount: 45,
        payerId: '1',
        date: '2026-09-17',
        splitMode: 'equal',
        involvedParticipantIds: ['1', '2', '3'],
        createdAt: 100,
      },
    ];

    renderWithI18n(
      <HeroBalance
        activeParticipant={null}
        participants={participants}
        expenses={expenses}
        currency="₼"
      />
    );

    expect(screen.getByText('Ümumi baxış (Bütün qrup)')).toBeInTheDocument();
    expect(screen.getByText('Ümumi xərc')).toBeInTheDocument();
    expect(screen.getByTestId('hero-amount')).toHaveTextContent('45 ₼');
  });

  it('triggers onAddExpense and onAddParticipant quick actions', () => {
    const onAddExpense = vi.fn();
    const onAddParticipant = vi.fn();

    renderWithI18n(
      <HeroBalance
        activeParticipant={participants[0]}
        participants={participants}
        expenses={[]}
        onAddExpense={onAddExpense}
        onAddParticipant={onAddParticipant}
      />
    );

    const addExpenseBtn = screen.getByRole('button', { name: /Yeni xərc əlavə et/i });
    const addFriendBtn = screen.getByRole('button', { name: /Dost əlavə et/i });

    fireEvent.click(addExpenseBtn);
    expect(onAddExpense).toHaveBeenCalledTimes(1);

    fireEvent.click(addFriendBtn);
    expect(onAddParticipant).toHaveBeenCalledTimes(1);
  });
});

describe('CurrencyDialog Component', () => {
  it('renders supported currencies and allows selecting a new currency', () => {
    const onSelectCurrency = vi.fn();
    const onClose = vi.fn();

    renderWithI18n(
      <CurrencyDialog
        isOpen={true}
        onClose={onClose}
        currentCurrency="₼"
        onSelectCurrency={onSelectCurrency}
      />
    );

    expect(screen.getByText('Valyuta seçimi')).toBeInTheDocument();
    expect(screen.getByText('Azərbaycan manatı')).toBeInTheDocument();
    expect(screen.getByText('ABŞ dolları')).toBeInTheDocument();
    expect(screen.getByText('Avro')).toBeInTheDocument();
    expect(screen.getByText('Rusiya rublu')).toBeInTheDocument();
    expect(screen.getByText('Türk lirəsi')).toBeInTheDocument();

    // Select USD ($)
    const usdButton = screen.getByRole('radio', { name: /ABŞ dolları/i });
    fireEvent.click(usdButton);

    expect(onSelectCurrency).toHaveBeenCalledWith('$');
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('closes on cancel button click', () => {
    const onClose = vi.fn();

    renderWithI18n(
      <CurrencyDialog
        isOpen={true}
        onClose={onClose}
        currentCurrency="₼"
        onSelectCurrency={vi.fn()}
      />
    );

    const cancelBtn = screen.getByRole('button', { name: /Ləğv et/i });
    fireEvent.click(cancelBtn);

    expect(onClose).toHaveBeenCalledTimes(1);
  });
});

describe('ParticipantDialog Component', () => {
  const existingParticipants: Participant[] = [
    { id: '1', name: 'Elvin Məmmədov', avatarColor: '#006A60' },
  ];

  it('validates empty first name', async () => {
    const onAddParticipant = vi.fn();

    renderWithI18n(
      <ParticipantDialog
        isOpen={true}
        onClose={vi.fn()}
        onAddParticipant={onAddParticipant}
        existingParticipants={existingParticipants}
      />
    );

    const addBtn = screen.getByRole('button', { name: /Əlavə et/i });
    fireEvent.click(addBtn);

    // Validation error shown
    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(onAddParticipant).not.toHaveBeenCalled();
  });

  it('detects duplicate participant name case-insensitively', async () => {
    const onAddParticipant = vi.fn();

    renderWithI18n(
      <ParticipantDialog
        isOpen={true}
        onClose={vi.fn()}
        onAddParticipant={onAddParticipant}
        existingParticipants={existingParticipants}
      />
    );

    const nameInput = screen.getByLabelText(/Adı/i);
    fireEvent.change(nameInput, { target: { value: 'elvin məmmədov' } });

    const addBtn = screen.getByRole('button', { name: /Əlavə et/i });
    fireEvent.click(addBtn);

    expect(screen.getByText('Bu adda iştirakçı artıq var')).toBeInTheDocument();
    expect(onAddParticipant).not.toHaveBeenCalled();
  });

  it('successfully creates participant with combined name and selected color', async () => {
    const onAddParticipant = vi.fn().mockResolvedValue(true);
    const onClose = vi.fn();

    renderWithI18n(
      <ParticipantDialog
        isOpen={true}
        onClose={onClose}
        onAddParticipant={onAddParticipant}
        existingParticipants={existingParticipants}
      />
    );

    const nameInput = screen.getByLabelText(/Adı \*/i);
    const surnameInput = screen.getByLabelText(/Soyad/i);

    fireEvent.change(nameInput, { target: { value: 'Rauf' } });
    fireEvent.change(surnameInput, { target: { value: 'Əliyev' } });

    const addBtn = screen.getByRole('button', { name: /Əlavə et/i });
    fireEvent.click(addBtn);

    await waitFor(() => {
      expect(onAddParticipant).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Rauf Əliyev',
          avatarColor: expect.any(String),
        })
      );
      expect(onClose).toHaveBeenCalled();
    });
  });
});
