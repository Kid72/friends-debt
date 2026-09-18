import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useRoomStore } from './useRoomStore';
import * as storage from '../api/storage';
import { RoomState } from '../types';

describe('useRoomStore Hook', () => {
  const mockInitialRoom: RoomState = {
    id: 'room-123',
    groupName: 'Dostlar',
    currency: '₼',
    participants: [
      { id: 'p1', name: 'Elvin', avatarColor: '#006A60' },
      { id: 'p2', name: 'Rauf', avatarColor: '#984061' },
    ],
    expenses: [
      {
        id: 'e1',
        title: 'Qəhvə',
        amount: 10,
        payerId: 'p1',
        date: '2026-09-17',
        splitMode: 'equal',
        involvedParticipantIds: ['p1', 'p2'],
        createdAt: 1000,
      },
    ],
    settlements: [],
    updatedAt: 1000,
  };

  beforeEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns null room and not loading when roomId is not provided', () => {
    const { result } = renderHook(() => useRoomStore(null));

    expect(result.current.room).toBeNull();
    expect(result.current.isLoading).toBe(false);
    expect(result.current.isSyncing).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('fetches room state on mount when roomId is provided', async () => {
    vi.spyOn(storage, 'fetchRoomState').mockResolvedValue(mockInitialRoom);

    const { result } = renderHook(() => useRoomStore('room-123'));

    expect(result.current.isLoading).toBe(true);

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.room).toEqual(mockInitialRoom);
    expect(result.current.error).toBeNull();
    expect(storage.fetchRoomState).toHaveBeenCalledWith('room-123');
  });

  it('handles fetch failure on mount gracefully', async () => {
    vi.spyOn(storage, 'fetchRoomState').mockRejectedValue(new Error('Network error'));

    const { result } = renderHook(() => useRoomStore('room-error'));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.room).toBeNull();
    expect(result.current.error).toContain('Network error');
  });

  it('optimistically adds an expense and rolls back on save failure', async () => {
    vi.spyOn(storage, 'fetchRoomState').mockResolvedValue(mockInitialRoom);
    // Make saveRoomState reject
    vi.spyOn(storage, 'saveRoomState').mockResolvedValue(false);

    const { result } = renderHook(() => useRoomStore('room-123'));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    let success = true;
    await act(async () => {
      success = await result.current.addExpense({
        title: 'Nahar',
        amount: 30,
        payerId: 'p2',
        date: '2026-09-17',
        splitMode: 'equal',
        involvedParticipantIds: ['p1', 'p2'],
      });
    });

    expect(success).toBe(false);
    // Rolled back to original state with only 1 expense
    expect(result.current.room?.expenses.length).toBe(1);
    expect(result.current.room?.expenses[0].id).toBe('e1');
    expect(result.current.error).toBeTruthy();
  });

  it('optimistically adds an expense and persists when save succeeds', async () => {
    vi.spyOn(storage, 'fetchRoomState').mockResolvedValue(mockInitialRoom);
    vi.spyOn(storage, 'saveRoomState').mockResolvedValue(true);

    const { result } = renderHook(() => useRoomStore('room-123'));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    let success = false;
    await act(async () => {
      success = await result.current.addExpense({
        title: 'Axşam yeməyi',
        amount: 50,
        payerId: 'p1',
        date: '2026-09-17',
        splitMode: 'equal',
        involvedParticipantIds: ['p1', 'p2'],
      });
    });

    expect(success).toBe(true);
    expect(result.current.room?.expenses.length).toBe(2);
    expect(result.current.room?.expenses.some((e) => e.title === 'Axşam yeməyi')).toBe(true);
    expect(storage.saveRoomState).toHaveBeenCalledWith('room-123', expect.any(Object));
  });

  it('optimistically edits an expense and handles rollback', async () => {
    vi.spyOn(storage, 'fetchRoomState').mockResolvedValue(mockInitialRoom);
    const saveSpy = vi.spyOn(storage, 'saveRoomState').mockResolvedValue(true);

    const { result } = renderHook(() => useRoomStore('room-123'));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    const updatedExpense = {
      ...mockInitialRoom.expenses[0],
      amount: 15,
      title: 'Qəhvə və Şirniyyat',
    };

    let success = false;
    await act(async () => {
      success = await result.current.editExpense(updatedExpense);
    });

    expect(success).toBe(true);
    expect(result.current.room?.expenses[0].amount).toBe(15);
    expect(result.current.room?.expenses[0].title).toBe('Qəhvə və Şirniyyat');
    expect(saveSpy).toHaveBeenCalled();
  });

  it('optimistically deletes an expense', async () => {
    vi.spyOn(storage, 'fetchRoomState').mockResolvedValue(mockInitialRoom);
    vi.spyOn(storage, 'saveRoomState').mockResolvedValue(true);

    const { result } = renderHook(() => useRoomStore('room-123'));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    let success = false;
    await act(async () => {
      success = await result.current.deleteExpense('e1');
    });

    expect(success).toBe(true);
    expect(result.current.room?.expenses.length).toBe(0);
  });

  it('optimistically settles a debt', async () => {
    vi.spyOn(storage, 'fetchRoomState').mockResolvedValue(mockInitialRoom);
    vi.spyOn(storage, 'saveRoomState').mockResolvedValue(true);

    const { result } = renderHook(() => useRoomStore('room-123'));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    let success = false;
    await act(async () => {
      success = await result.current.settleDebt({
        fromParticipantId: 'p2',
        toParticipantId: 'p1',
        amount: 5,
        date: '2026-09-17',
      });
    });

    expect(success).toBe(true);
    expect(result.current.room?.settlements.length).toBe(1);
    expect(result.current.room?.settlements[0].amount).toBe(5);
  });

  it('safely settles debt when room state has undefined settlements property', async () => {
    const roomWithoutSettlements: any = {
      id: 'room-no-set',
      groupName: 'Dostlar',
      currency: '₼',
      participants: [
        { id: 'p1', name: 'Elvin', avatarColor: '#006A60' },
        { id: 'p2', name: 'Rauf', avatarColor: '#984061' },
      ],
      expenses: [],
      // settlements is intentionally undefined (e.g. legacy room or cache)
      settlements: undefined,
      updatedAt: 1000,
    };

    vi.spyOn(storage, 'fetchRoomState').mockResolvedValue(roomWithoutSettlements);
    vi.spyOn(storage, 'saveRoomState').mockResolvedValue(true);

    const { result } = renderHook(() => useRoomStore('room-no-set'));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    let success = false;
    let thrownError: any = null;
    try {
      await act(async () => {
        success = await result.current.settleDebt({
          fromParticipantId: 'p2',
          toParticipantId: 'p1',
          amount: 15,
          date: '2026-09-18',
        });
      });
    } catch (err) {
      thrownError = err;
    }

    expect(thrownError).toBeNull();
    expect(success).toBe(true);
    expect(result.current.room?.settlements).toBeDefined();
    expect(result.current.room?.settlements.length).toBe(1);
    expect(result.current.room?.settlements[0].amount).toBe(15);
  });

  it('optimistically deletes a settlement', async () => {
    const roomWithSettlement: RoomState = {
      ...mockInitialRoom,
      settlements: [
        {
          id: 's1',
          fromParticipantId: 'p2',
          toParticipantId: 'p1',
          amount: 5,
          date: '2026-09-17',
          createdAt: 1000,
        },
      ],
    };
    vi.spyOn(storage, 'fetchRoomState').mockResolvedValue(roomWithSettlement);
    vi.spyOn(storage, 'saveRoomState').mockResolvedValue(true);

    const { result } = renderHook(() => useRoomStore('room-123'));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    let success = false;
    await act(async () => {
      success = await result.current.deleteSettlement('s1');
    });

    expect(success).toBe(true);
    expect(result.current.room?.settlements.length).toBe(0);
  });

  it('adds a participant with assigned color', async () => {
    vi.spyOn(storage, 'fetchRoomState').mockResolvedValue(mockInitialRoom);
    vi.spyOn(storage, 'saveRoomState').mockResolvedValue(true);

    const { result } = renderHook(() => useRoomStore('room-123'));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    let success = false;
    await act(async () => {
      success = await result.current.addParticipant({ name: 'Leyla' } as any);
    });

    expect(success).toBe(true);
    expect(result.current.room?.participants.length).toBe(3);
    const added = result.current.room?.participants.find((p) => p.name === 'Leyla');
    expect(added).toBeDefined();
    expect(added?.avatarColor).toBeTruthy();
  });

  it('updates group name', async () => {
    vi.spyOn(storage, 'fetchRoomState').mockResolvedValue(mockInitialRoom);
    vi.spyOn(storage, 'saveRoomState').mockResolvedValue(true);

    const { result } = renderHook(() => useRoomStore('room-123'));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    let success = false;
    await act(async () => {
      success = await result.current.updateGroupName('Yeni Məclis');
    });

    expect(success).toBe(true);
    expect(result.current.room?.groupName).toBe('Yeni Məclis');
  });

  it('refetches room state on demand', async () => {
    vi.spyOn(storage, 'fetchRoomState').mockResolvedValue(mockInitialRoom);

    const { result } = renderHook(() => useRoomStore('room-123'));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    const updatedRemote: RoomState = {
      ...mockInitialRoom,
      groupName: 'Uzaqdan Yenilənmiş Ad',
      updatedAt: 2000,
    };

    vi.spyOn(storage, 'fetchRoomState').mockResolvedValue(updatedRemote);

    await act(async () => {
      await result.current.refetch();
    });

    expect(result.current.room?.groupName).toBe('Uzaqdan Yenilənmiş Ad');
  });

  describe('Offline Room State Caching', () => {
    it('initializes room state immediately from cached state in localStorage', async () => {
      storage.setCachedRoomState('room-cached', mockInitialRoom);

      // fetchRoomState will take some time
      let resolveFetch: (value: RoomState) => void = () => {};
      vi.spyOn(storage, 'fetchRoomState').mockImplementation(() => {
        return new Promise((resolve) => {
          resolveFetch = resolve;
        });
      });

      const { result } = renderHook(() => useRoomStore('room-cached'));

      // Initially, room state is already populated from cache even while loading
      expect(result.current.room).toEqual(mockInitialRoom);
      expect(result.current.isLoading).toBe(true);

      // Now resolve fetch
      await act(async () => {
        resolveFetch({
          ...mockInitialRoom,
          groupName: 'Updated After Fetch',
        });
      });

      expect(result.current.room?.groupName).toBe('Updated After Fetch');
      expect(storage.getCachedRoomState('room-cached')?.groupName).toBe('Updated After Fetch');
    });

    it('keeps displaying cached room state with gentle offline status when fetch fails', async () => {
      storage.setCachedRoomState('room-offline', mockInitialRoom);

      vi.spyOn(storage, 'fetchRoomState').mockRejectedValue(new Error('Failed to fetch (offline)'));

      const { result } = renderHook(() => useRoomStore('room-offline'));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Does not show fatal error, retains cached room state and sets isOffline
      expect(result.current.room).toEqual(mockInitialRoom);
      expect(result.current.error).toBeNull();
      expect(result.current.isOffline).toBe(true);
    });

    it('updates cache upon mutation and rollbacks cache on save failure', async () => {
      storage.setCachedRoomState('room-123', mockInitialRoom);
      vi.spyOn(storage, 'fetchRoomState').mockResolvedValue(mockInitialRoom);
      vi.spyOn(storage, 'saveRoomState').mockResolvedValue(false);

      const { result } = renderHook(() => useRoomStore('room-123'));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        await result.current.addExpense({
          title: 'Rollback Expense',
          amount: 25,
          payerId: 'p1',
          date: '2026-09-17',
          splitMode: 'equal',
          involvedParticipantIds: ['p1', 'p2'],
        });
      });

      // After rollback, cache should match original state (1 expense)
      const cached = storage.getCachedRoomState('room-123');
      expect(cached?.expenses.length).toBe(1);
      expect(cached?.expenses[0].id).toBe('e1');
    });
  });
});
