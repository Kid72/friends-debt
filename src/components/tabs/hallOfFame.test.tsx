import React from 'react';
import { render, screen, fireEvent, within } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { HallOfFameTab } from './HallOfFameTab';
import { HelpDialog } from '../dialogs/HelpDialog';
import { I18nProvider } from '../../i18n/I18nContext';
import { Participant, Expense, Settlement } from '../../types';

// Helper wrapper for i18n
const renderWithI18n = (ui: React.ReactElement, initialLang: 'az' | 'ru' | 'en' = 'az') => {
  return render(<I18nProvider initialLang={initialLang}>{ui}</I18nProvider>);
};

describe('Hall of Fame Tab ("Şərəf Lövhəsi")', () => {
  const participants: Participant[] = [
    { id: '1', name: 'Elvin Məmmədov', avatarColor: '#14b8a6' },
    { id: '2', name: 'Rauf Əliyev', avatarColor: '#f59e0b' },
    { id: '3', name: 'Nigar Qasımova', avatarColor: '#ec4899' },
  ];

  const expenses: Expense[] = [
    {
      id: 'e1',
      payerId: '1',
      amount: 150,
      date: '2026-09-10',
      title: 'Restoran',
      splitMode: 'equal',
      involvedParticipantIds: ['1', '2', '3'],
      createdAt: 1000,
    },
    {
      id: 'e2',
      payerId: '2',
      amount: 60,
      date: '2026-09-12',
      title: 'Kofe & Şirniyyat',
      splitMode: 'equal',
      involvedParticipantIds: ['2', '3'],
      createdAt: 2000,
    },
  ];

  const settlements: Settlement[] = [
    {
      id: 's1',
      fromParticipantId: '2',
      toParticipantId: '1',
      amount: 30,
      date: '2026-09-13',
      createdAt: 3000,
    },
    {
      id: 's2',
      fromParticipantId: '2',
      toParticipantId: '1',
      amount: 20,
      date: '2026-09-14',
      createdAt: 4000,
    },
  ];

  it('renders hero title and aggregate group statistics', () => {
    renderWithI18n(
      <HallOfFameTab
        participants={participants}
        expenses={expenses}
        settlements={settlements}
        currency="₼"
      />
    );

    // Title & subtitle
    expect(screen.getAllByText('Şərəf Lövhəsi').length).toBeGreaterThan(0);
    expect(
      screen.getByText('Dostlar qrupunun əyləncəli statistika və titulları')
    ).toBeInTheDocument();

    // Group aggregate stats: 2 expenses, 2 settlements
    expect(screen.getByText('Ümumi xərc sayı')).toBeInTheDocument();
    expect(screen.getAllByText('2').length).toBeGreaterThanOrEqual(2);
    expect(screen.getByText('Bağlanmış borclar')).toBeInTheDocument();
  });

  it('displays badge spotlight cards with correct awardees and badges', () => {
    renderWithI18n(
      <HallOfFameTab
        participants={participants}
        expenses={expenses}
        settlements={settlements}
        currency="₼"
        activeParticipant={participants[0]}
      />
    );

    // 4 Badges should be in spotlight (and on awardee cards)
    expect(screen.getAllByText('Gecənin sponsoru').length).toBeGreaterThan(0);
    expect(screen.getAllByText('İldırım ödəyici').length).toBeGreaterThan(0);
    expect(screen.getAllByText('"Sabah ataram" bəy').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Məclisin canı').length).toBeGreaterThan(0);

    // Elvin (1) paid 150 -> sponsor
    // Rauf (2) made 2 settlements -> lightning
    // Nigar (3) has negative balance (-80) and oldest debt -> tomorrow
    // Nigar (3) involved in 2 expenses, Elvin in 1, Rauf in 2 -> Nigar and Rauf tie for party
    expect(screen.getAllByText(/Elvin Məmmədov/).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Rauf Əliyev/).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Nigar Qasımova/).length).toBeGreaterThan(0);
  });

  it('highlights the active participant profile ("Mən")', () => {
    renderWithI18n(
      <HallOfFameTab
        participants={participants}
        expenses={expenses}
        settlements={settlements}
        currency="₼"
        activeParticipant={participants[1]} // Rauf
      />
    );

    // Profile badge "Mən" rendered for Rauf
    const profileBadges = screen.getAllByText('Mən');
    expect(profileBadges.length).toBeGreaterThan(0);
  });

  it('opens and closes badge description modal when clicking a badge chip', () => {
    renderWithI18n(
      <HallOfFameTab
        participants={participants}
        expenses={expenses}
        settlements={settlements}
        currency="₼"
      />
    );

    // Modal is initially not present
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

    // Find a badge button on a participant card
    const sponsorBadges = screen.getAllByRole('button', { name: /Gecənin sponsoru/i });
    expect(sponsorBadges.length).toBeGreaterThan(0);

    // Click the badge button
    fireEvent.click(sponsorBadges[0]);

    // Dialog modal should open
    const dialog = screen.getByRole('dialog');
    expect(dialog).toBeInTheDocument();
    expect(within(dialog).getByText('Yığıncaqda ən çox xərc çəkən iştirakçı')).toBeInTheDocument();

    // Close button inside dialog
    const closeBtn = within(dialog).getByRole('button', { name: /Bağla/i });
    fireEvent.click(closeBtn);

    // Modal closes
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('renders unassigned placeholder when no badges can be awarded', () => {
    renderWithI18n(
      <HallOfFameTab
        participants={participants}
        expenses={[]}
        settlements={[]}
        currency="₼"
      />
    );

    // Shows "Hələ heç kim" for spotlight cards
    expect(screen.getAllByText('Hələ heç kim').length).toBe(4);
    // Shows no badges text
    expect(screen.getAllByText('Titullar üçün kifayət qədər məlumat yoxdur').length).toBeGreaterThan(0);
  });
});

describe('Help & Info Modal ("HelpDialog")', () => {
  it('does not render when isOpen is false', () => {
    renderWithI18n(<HelpDialog isOpen={false} onClose={vi.fn()} />);
    expect(screen.queryByText('Məlumat və Təlimat')).not.toBeInTheDocument();
  });

  it('renders all 4 required accordion sections when open', () => {
    const onClose = vi.fn();
    renderWithI18n(<HelpDialog isOpen={true} onClose={onClose} />);

    // Dialog title
    expect(screen.getByText('Məlumat və Təlimat')).toBeInTheDocument();

    // 1. "Necə işləyir?"
    expect(screen.getByText('Necə işləyir?')).toBeInTheDocument();
    expect(screen.getByText('1. Qrup və profil')).toBeInTheDocument();
    expect(screen.getByText('2. Xərcləri əlavə edin')).toBeInTheDocument();
    expect(screen.getByText('3. Borcları bağlayın')).toBeInTheDocument();

    // 2. "Borcların sadələşdirilməsi alqoritmi"
    expect(screen.getByText('Borcların sadələşdirilməsi alqoritmi')).toBeInTheDocument();
    expect(screen.getByText(/Borcların схлопывание-si ilə/i)).toBeInTheDocument();

    // 3. "Tətbiqi quraşdırın (PWA)"
    expect(screen.getByText('Tətbiqi quraşdırın (PWA)')).toBeInTheDocument();

    // 4. "Təhlükəsizlik və Məxfilik"
    expect(screen.getByText('Şifrəsiz etibar modeli və Məxfilik')).toBeInTheDocument();
  });

  it('expands and collapses accordion sections on click', () => {
    renderWithI18n(<HelpDialog isOpen={true} onClose={vi.fn()} />);

    // PWA section is initially collapsed
    expect(screen.queryByText('Apple iOS (Safari)')).not.toBeInTheDocument();

    // Click PWA header to expand
    const pwaBtn = screen.getByRole('button', { name: /Tətbiqi quraşdırın \(PWA\)/i });
    fireEvent.click(pwaBtn);

    // Now iOS & Android guides are visible
    expect(screen.getByText('Apple iOS (Safari)')).toBeInTheDocument();
    expect(screen.getByText('Android (Chrome)')).toBeInTheDocument();

    // Click again to collapse
    fireEvent.click(pwaBtn);
    expect(screen.queryByText('Apple iOS (Safari)')).not.toBeInTheDocument();
  });

  it('calls onClose when close button is clicked', () => {
    const onClose = vi.fn();
    renderWithI18n(<HelpDialog isOpen={true} onClose={onClose} />);

    const closeBtn = screen.getByRole('button', { name: 'Bağla' });
    fireEvent.click(closeBtn);

    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
