import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import App from './App';
import * as storage from './api/storage';
import { RoomState } from './types';

describe('App Integration', () => {
  const mockInitialRoom: RoomState = {
    id: 'room-test-101',
    groupName: 'Dostlar Səfəri',
    currency: '₼',
    participants: [
      { id: 'p1', name: 'Elvin', avatarColor: '#006A60' },
      { id: 'p2', name: 'Rauf', avatarColor: '#456179' },
      { id: 'p3', name: 'Çingiz', avatarColor: '#705D00' },
    ],
    expenses: [
      {
        id: 'e1',
        title: 'Kofe və şirniyyat',
        amount: 30,
        payerId: 'p1',
        date: '2026-09-17',
        splitMode: 'equal',
        involvedParticipantIds: ['p1', 'p2', 'p3'],
        createdAt: 1000,
      },
    ],
    settlements: [],
    updatedAt: 1000,
  };

  beforeEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
    // Default window url with room
    window.history.replaceState({}, '', '/?room=room-test-101');
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('loads room from URL and renders header with group title and hero balance', async () => {
    vi.spyOn(storage, 'fetchRoomState').mockResolvedValue(mockInitialRoom);

    render(<App />);

    // Shows loading initially or immediately loads
    await waitFor(() => {
      expect(screen.getByText('Dostlar Səfəri')).toBeInTheDocument();
    });

    // Room ID is visible in the header copy button
    expect(screen.getByText('room-test-101')).toBeInTheDocument();

    // Check HeroBalance card is rendered
    expect(screen.getByRole('region', { name: /Xalis balans/i })).toBeInTheDocument();
  });

  it('auto-provisions a new room when no ?room query parameter is present in URL', async () => {
    window.history.replaceState({}, '', '/');

    const createdRoomId = 'new-auto-room-888';
    const createRoomSpy = vi.spyOn(storage, 'createRoom').mockResolvedValue(createdRoomId);
    vi.spyOn(storage, 'fetchRoomState').mockResolvedValue({
      ...mockInitialRoom,
      id: createdRoomId,
      groupName: 'Dostlar',
    });

    render(<App />);

    await waitFor(() => {
      expect(createRoomSpy).toHaveBeenCalledTimes(1);
    });

    await waitFor(() => {
      expect(window.location.search).toContain(`room=${createdRoomId}`);
    });
  });

  it('switches between Transfers, History, and Hall of Fame tabs', async () => {
    vi.spyOn(storage, 'fetchRoomState').mockResolvedValue(mockInitialRoom);

    render(<App />);

    await waitFor(() => {
      expect(screen.getByText('Dostlar Səfəri')).toBeInTheDocument();
    });

    // Default tab: Transfers ("Köçürmələr")
    expect(screen.getByText(/Optimallaşdırılmış köçürmələr/i)).toBeInTheDocument();

    // Switch to History ("Tarixçə")
    const historyTabBtn = screen.getByRole('radio', { name: /Tarixçə/i });
    fireEvent.click(historyTabBtn);

    await waitFor(() => {
      expect(screen.getByRole('searchbox')).toBeInTheDocument();
      expect(screen.getByText('Kofe və şirniyyat')).toBeInTheDocument();
    });

    // Switch to Hall of Fame ("Şərəf Lövhəsi")
    const hallOfFameTabBtn = screen.getByRole('radio', { name: /Şərəf Lövhəsi/i });
    fireEvent.click(hallOfFameTabBtn);

    await waitFor(() => {
      expect(screen.getByText(/Dostlar qrupunun əyləncəli statistika və titulları/i)).toBeInTheDocument();
    });
  });

  it('opens ExpenseDialog when clicking the Floating Action Button (FAB)', async () => {
    vi.spyOn(storage, 'fetchRoomState').mockResolvedValue(mockInitialRoom);

    render(<App />);

    await waitFor(() => {
      expect(screen.getByText('Dostlar Səfəri')).toBeInTheDocument();
    });

    const fabButton = screen.getByTestId('fab-add-expense');
    expect(fabButton).toBeInTheDocument();
    expect(fabButton).toHaveTextContent(/Çek əlavə et/i);

    fireEvent.click(fabButton);

    // ExpenseDialog opens
    await waitFor(() => {
      expect(screen.getByRole('dialog', { name: /Yeni xərc əlavə et/i })).toBeInTheDocument();
    });
  });

  it('opens ParticipantDialog when clicking Add Friend in Header or Hero Card', async () => {
    vi.spyOn(storage, 'fetchRoomState').mockResolvedValue(mockInitialRoom);

    render(<App />);

    await waitFor(() => {
      expect(screen.getByText('Dostlar Səfəri')).toBeInTheDocument();
    });

    const addFriendBtns = screen.getAllByRole('button', { name: /Dost əlavə et/i });
    expect(addFriendBtns.length).toBeGreaterThan(0);

    fireEvent.click(addFriendBtns[0]);

    // ParticipantDialog opens
    await waitFor(() => {
      expect(screen.getByRole('dialog', { name: /Yeni dost əlavə et/i })).toBeInTheDocument();
    });
  });

  it('allows user profile switching from the Header menu', async () => {
    vi.spyOn(storage, 'fetchRoomState').mockResolvedValue(mockInitialRoom);

    render(<App />);

    await waitFor(() => {
      expect(screen.getByText('Dostlar Səfəri')).toBeInTheDocument();
    });

    // Find profile switcher button: "Mən — Hamı" initially
    const profileBtn = screen.getByRole('button', { name: /Mən — Hamı/i });
    fireEvent.click(profileBtn);

    // Dropdown shows Elvin, Rauf, Çingiz
    const elvinItem = screen.getByRole('menuitem', { name: /Elvin/i });
    fireEvent.click(elvinItem);

    // Header updates to show "Mən — Elvin"
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Mən — Elvin/i })).toBeInTheDocument();
    });

    // Hero Balance Card updates to show Elvin's active net status
    expect(screen.getByText('Aktiv şəxs')).toBeInTheDocument();
  });

  it('displays offline indicator when browser goes offline', async () => {
    vi.spyOn(storage, 'fetchRoomState').mockResolvedValue(mockInitialRoom);

    render(<App />);

    await waitFor(() => {
      expect(screen.getByText('Dostlar Səfəri')).toBeInTheDocument();
    });

    // Simulate offline event
    fireEvent(window, new Event('offline'));

    await waitFor(() => {
      expect(screen.getByRole('status')).toHaveTextContent(/Oflayn rejim/i);
    });

    // Simulate online event
    fireEvent(window, new Event('online'));

    await waitFor(() => {
      expect(screen.queryByRole('status')).not.toBeInTheDocument();
    });
  });

  it('displays error banner with retry button on save/fetch error', async () => {
    vi.spyOn(storage, 'fetchRoomState').mockRejectedValueOnce(new Error('Network outage'));

    render(<App />);

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent(/Network outage/i);
      expect(screen.getByText(/Yenidən cəhd et/i)).toBeInTheDocument();
    });
  });
});
