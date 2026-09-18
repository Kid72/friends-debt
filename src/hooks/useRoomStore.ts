import { useState, useEffect, useRef, useCallback } from 'react';
import { RoomState, Expense, Settlement, Participant } from '../types';
import {
  fetchRoomState,
  saveRoomState,
  getCachedRoomState,
  setCachedRoomState,
} from '../api/storage';

export const DEFAULT_AVATAR_COLORS = [
  '#006A60', // Deep Teal Primary
  '#984061', // Rose
  '#7C5800', // Amber
  '#006783', // Cyan
  '#565E71', // Slate
  '#4F6600', // Olive
  '#6750A4', // Purple
  '#B3261E', // Terracotta Red
  '#006874', // Ocean
  '#855318', // Warm Brown
  '#34663B', // Forest
  '#8C4F27', // Burnt Orange
];

export function generateId(prefix: string = ''): string {
  const randomPart = Math.random().toString(36).substring(2, 9);
  const timePart = Date.now().toString(36);
  return prefix ? `${prefix}_${timePart}_${randomPart}` : `${timePart}_${randomPart}`;
}

export interface UseRoomStoreReturn {
  room: RoomState | null;
  isLoading: boolean;
  isSyncing: boolean;
  isOffline?: boolean;
  error: string | null;
  addExpense: (expense: Omit<Expense, 'id' | 'createdAt'> | Expense) => Promise<boolean>;
  editExpense: (expense: Expense) => Promise<boolean>;
  deleteExpense: (expenseId: string) => Promise<boolean>;
  settleDebt: (settlement: Omit<Settlement, 'id' | 'createdAt'> | Settlement) => Promise<boolean>;
  deleteSettlement: (settlementId: string) => Promise<boolean>;
  addParticipant: (participant: Omit<Participant, 'id'> | Participant) => Promise<boolean>;
  updateGroupName: (name: string) => Promise<boolean>;
  updateCurrency: (currency: string) => Promise<boolean>;
  refetch: () => Promise<void>;
}

export function useRoomStore(roomId: string | null | undefined): UseRoomStoreReturn {
  const [room, setRoom] = useState<RoomState | null>(() => {
    return roomId ? getCachedRoomState(roomId) : null;
  });
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [isOffline, setIsOffline] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const roomRef = useRef<RoomState | null>(room);
  roomRef.current = room;

  const activeRoomIdRef = useRef<string | null | undefined>(roomId);
  activeRoomIdRef.current = roomId;

  const isMutatingRef = useRef<boolean>(false);

  // Initial fetch when roomId is provided or changes
  useEffect(() => {
    if (!roomId) {
      setRoom(null);
      setIsLoading(false);
      setIsSyncing(false);
      setIsOffline(false);
      setError(null);
      return;
    }

    const cached = getCachedRoomState(roomId);
    if (cached) {
      setRoom(cached);
      roomRef.current = cached;
    }

    let isMounted = true;
    setIsLoading(true);
    setError(null);

    fetchRoomState(roomId)
      .then((data) => {
        if (isMounted && activeRoomIdRef.current === roomId) {
          setRoom(data);
          roomRef.current = data;
          setCachedRoomState(roomId, data);
          setError(null);
          setIsOffline(false);
        }
      })
      .catch((err) => {
        if (isMounted && activeRoomIdRef.current === roomId) {
          const currentCached = roomRef.current || getCachedRoomState(roomId);
          if (currentCached) {
            // Keep displaying cached room state with offline status, do not show fatal error
            setError(null);
            setIsOffline(true);
          } else {
            setError(err?.message || 'Otaq məlumatları yüklənə bilmədi');
          }
        }
      })
      .finally(() => {
        if (isMounted && activeRoomIdRef.current === roomId) {
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [roomId]);

  // Background polling (every 10 seconds) & window focus/online revalidation
  useEffect(() => {
    if (!roomId) return;

    const poll = async () => {
      if (typeof document !== 'undefined' && document.hidden) return;
      if (isMutatingRef.current) return;
      try {
        setIsSyncing(true);
        const remote = await fetchRoomState(roomId);
        if (activeRoomIdRef.current === roomId && !isMutatingRef.current) {
          const currentUpdatedAt = roomRef.current?.updatedAt ?? 0;
          if (remote.updatedAt > currentUpdatedAt || !roomRef.current) {
            setRoom(remote);
            roomRef.current = remote;
            setCachedRoomState(roomId, remote);
          }
          setIsOffline(false);
        }
      } catch {
        // Silent polling failure to avoid interrupting user interactions
      } finally {
        if (activeRoomIdRef.current === roomId) {
          setIsSyncing(false);
        }
      }
    };

    const intervalId = setInterval(poll, 10000);

    let lastRevalidate = 0;
    const handleRevalidate = () => {
      const now = Date.now();
      // Throttle window focus/online refetches to at most once per 4 seconds
      if (now - lastRevalidate < 4000) return;
      lastRevalidate = now;
      poll();
    };

    window.addEventListener('focus', handleRevalidate);
    window.addEventListener('online', handleRevalidate);

    return () => {
      clearInterval(intervalId);
      window.removeEventListener('focus', handleRevalidate);
      window.removeEventListener('online', handleRevalidate);
    };
  }, [roomId]);

  // Force refetch on demand
  const refetch = useCallback(async (): Promise<void> => {
    if (!roomId) return;
    setIsSyncing(true);
    try {
      const remote = await fetchRoomState(roomId);
      if (activeRoomIdRef.current === roomId) {
        setRoom(remote);
        roomRef.current = remote;
        setCachedRoomState(roomId, remote);
        setError(null);
        setIsOffline(false);
      }
    } catch (err: any) {
      if (activeRoomIdRef.current === roomId) {
        const currentCached = roomRef.current || getCachedRoomState(roomId);
        if (currentCached) {
          setError(null);
          setIsOffline(true);
        } else {
          setError(err?.message || 'Yenilənmə zamanı xəta baş verdi');
        }
      }
    } finally {
      if (activeRoomIdRef.current === roomId) {
        setIsSyncing(false);
      }
    }
  }, [roomId]);

  // Helper for optimistic mutation with rollback on failure
  const performOptimisticMutation = useCallback(
    async (computeNewState: (current: RoomState) => RoomState): Promise<boolean> => {
      const current = roomRef.current;
      if (!current || !roomId) return false;

      let updatedState: RoomState;
      try {
        updatedState = computeNewState(current);
      } catch (err: any) {
        console.error('Failed to compute new state for mutation:', err);
        setError('Əməliyyat zamanı xəta baş verdi');
        return false;
      }

      updatedState.updatedAt = Date.now();

      // Optimistic update
      isMutatingRef.current = true;
      roomRef.current = updatedState;
      setRoom(updatedState);
      setCachedRoomState(roomId, updatedState);
      setIsSyncing(true);
      setError(null);

      try {
        const success = await saveRoomState(roomId, updatedState);
        if (!success) {
          throw new Error('Dəyişiklikləri yadda saxlamaq mümkün olmadı');
        }
        setIsSyncing(false);
        return true;
      } catch (err: any) {
        // Rollback
        roomRef.current = current;
        setRoom(current);
        setCachedRoomState(roomId, current);
        setError(err?.message || 'Xəta baş verdi, dəyişiklik geri qaytarıldı');
        setIsSyncing(false);
        return false;
      } finally {
        isMutatingRef.current = false;
      }
    },
    [roomId]
  );

  const addExpense = useCallback(
    async (expenseData: Omit<Expense, 'id' | 'createdAt'> | Expense): Promise<boolean> => {
      const newExpense: Expense = {
        ...expenseData,
        id: 'id' in expenseData && expenseData.id ? expenseData.id : generateId('exp'),
        createdAt:
          'createdAt' in expenseData && expenseData.createdAt
            ? expenseData.createdAt
            : Date.now(),
      };

      return performOptimisticMutation((current) => ({
        ...current,
        expenses: [newExpense, ...(current.expenses || [])],
      }));
    },
    [performOptimisticMutation]
  );

  const editExpense = useCallback(
    async (updatedExpense: Expense): Promise<boolean> => {
      return performOptimisticMutation((current) => ({
        ...current,
        expenses: (current.expenses || []).map((e) => (e.id === updatedExpense.id ? updatedExpense : e)),
      }));
    },
    [performOptimisticMutation]
  );

  const deleteExpense = useCallback(
    async (expenseId: string): Promise<boolean> => {
      return performOptimisticMutation((current) => ({
        ...current,
        expenses: (current.expenses || []).filter((e) => e.id !== expenseId),
      }));
    },
    [performOptimisticMutation]
  );

  const settleDebt = useCallback(
    async (settlementData: Omit<Settlement, 'id' | 'createdAt'> | Settlement): Promise<boolean> => {
      const newSettlement: Settlement = {
        ...settlementData,
        id:
          'id' in settlementData && settlementData.id
            ? settlementData.id
            : generateId('set'),
        createdAt:
          'createdAt' in settlementData && settlementData.createdAt
            ? settlementData.createdAt
            : Date.now(),
      };

      return performOptimisticMutation((current) => ({
        ...current,
        settlements: [newSettlement, ...(current.settlements || [])],
      }));
    },
    [performOptimisticMutation]
  );

  const addParticipant = useCallback(
    async (participantData: Omit<Participant, 'id'> | Participant): Promise<boolean> => {
      return performOptimisticMutation((current) => {
        const participants = current.participants || [];
        const colorIndex = participants.length % DEFAULT_AVATAR_COLORS.length;
        const newParticipant: Participant = {
          ...participantData,
          id:
            'id' in participantData && participantData.id
              ? participantData.id
              : generateId('p'),
          avatarColor:
            participantData.avatarColor || DEFAULT_AVATAR_COLORS[colorIndex],
        };
        return {
          ...current,
          participants: [...participants, newParticipant],
        };
      });
    },
    [performOptimisticMutation]
  );

  const updateGroupName = useCallback(
    async (name: string): Promise<boolean> => {
      return performOptimisticMutation((current) => ({
        ...current,
        groupName: name.trim(),
      }));
    },
    [performOptimisticMutation]
  );

  const updateCurrency = useCallback(
    async (currency: string): Promise<boolean> => {
      return performOptimisticMutation((current) => ({
        ...current,
        currency,
      }));
    },
    [performOptimisticMutation]
  );

  const deleteSettlement = useCallback(
    async (settlementId: string): Promise<boolean> => {
      return performOptimisticMutation((current) => ({
        ...current,
        settlements: (current.settlements || []).filter((s) => s.id !== settlementId),
      }));
    },
    [performOptimisticMutation]
  );

  return {
    room,
    isLoading,
    isSyncing,
    isOffline,
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
  };
}
