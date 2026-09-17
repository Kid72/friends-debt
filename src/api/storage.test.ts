import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  fetchRoomState,
  saveRoomState,
  createRoom,
  getActiveUserId,
  setActiveUserId,
  getStoredLanguage,
  setStoredLanguage,
  getCachedRoomState,
  setCachedRoomState,
} from './storage';
import { RoomState } from '../types';

describe('Storage API', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
  });

  describe('fetchRoomState', () => {
    it('fetches room state successfully', async () => {
      const mockState: RoomState = {
        id: 'test-room',
        groupName: 'Dostlar',
        currency: '₼',
        participants: [],
        expenses: [],
        settlements: [],
        updatedAt: Date.now()
      };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockState
      } as Response);

      const result = await fetchRoomState('test-room');
      expect(result.groupName).toBe('Dostlar');
      expect(result.id).toBe('test-room');
    });

    it('unwraps wrapped JSONBin record format', async () => {
      const mockState: RoomState = {
        id: 'wrapped-room',
        groupName: 'Yay Tətili',
        currency: '$',
        participants: [],
        expenses: [],
        settlements: [],
        updatedAt: 123456789
      };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ record: mockState })
      } as Response);

      const result = await fetchRoomState('wrapped-room');
      expect(result.groupName).toBe('Yay Tətili');
      expect(result.currency).toBe('$');
    });

    it('throws when room is not found or request fails', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 404,
        statusText: 'Not Found'
      } as Response);

      await expect(fetchRoomState('non-existent')).rejects.toThrow();
    });

    it('retries on network error and succeeds on subsequent try', async () => {
      const mockState: RoomState = {
        id: 'retry-room',
        groupName: 'Dostlar',
        currency: '₼',
        participants: [],
        expenses: [],
        settlements: [],
        updatedAt: Date.now()
      };

      let attempts = 0;
      global.fetch = vi.fn().mockImplementation(async () => {
        attempts++;
        if (attempts === 1) {
          throw new Error('Network timeout');
        }
        return {
          ok: true,
          json: async () => mockState
        } as Response;
      });

      const result = await fetchRoomState('retry-room');
      expect(result.groupName).toBe('Dostlar');
      expect(attempts).toBe(2);
    });
  });

  describe('saveRoomState', () => {
    it('saves room state successfully and returns true', async () => {
      const mockState: RoomState = {
        id: 'test-room',
        groupName: 'Dostlar',
        currency: '₼',
        participants: [],
        expenses: [],
        settlements: [],
        updatedAt: Date.now()
      };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ ok: true })
      } as Response);

      const success = await saveRoomState('test-room', mockState);
      expect(success).toBe(true);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('test-room'),
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json'
          }),
          body: expect.any(String)
        })
      );
    });

    it('returns false when save fails after retries', async () => {
      const mockState: RoomState = {
        id: 'fail-room',
        groupName: 'Fail Group',
        currency: '₼',
        participants: [],
        expenses: [],
        settlements: [],
        updatedAt: Date.now()
      };

      global.fetch = vi.fn().mockImplementation(async () => {
        throw new Error('Permanent network outage');
      });

      const success = await saveRoomState('fail-room', mockState);
      expect(success).toBe(false);
    });
  });

  describe('createRoom', () => {
    it('creates a new room and returns generated room id', async () => {
      const initialState: RoomState = {
        id: '',
        groupName: 'Yeni Qrup',
        currency: '₼',
        participants: [
          { id: 'p1', name: 'Elvin', avatarColor: '#006A60' }
        ],
        expenses: [],
        settlements: [],
        updatedAt: Date.now()
      };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ id: 'new-bin-123' })
      } as Response);

      const roomId = await createRoom(initialState);
      expect(roomId).toBe('new-bin-123');
      expect(global.fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json'
          })
        })
      );
    });

    it('throws when room creation fails', async () => {
      const initialState: RoomState = {
        id: '',
        groupName: 'Yeni Qrup',
        currency: '₼',
        participants: [],
        expenses: [],
        settlements: [],
        updatedAt: Date.now()
      };

      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error'
      } as Response);

      await expect(createRoom(initialState)).rejects.toThrow();
    });
  });

  describe('localStorage preferences (Profile & Language)', () => {
    it('saves and retrieves active user id per room', () => {
      expect(getActiveUserId('room-1')).toBeNull();

      setActiveUserId('room-1', 'user-abc');
      expect(getActiveUserId('room-1')).toBe('user-abc');

      // Does not bleed into other rooms
      expect(getActiveUserId('room-2')).toBeNull();
    });

    it('saves and retrieves user language preference', () => {
      expect(getStoredLanguage()).toBe('az'); // Default is 'az'

      setStoredLanguage('en');
      expect(getStoredLanguage()).toBe('en');

      setStoredLanguage('ru');
      expect(getStoredLanguage()).toBe('ru');
    });

    it('saves and retrieves cached room state in localStorage', () => {
      const mockRoom: RoomState = {
        id: 'cached-room-1',
        groupName: 'Offline Group',
        currency: '₼',
        participants: [{ id: 'p1', name: 'Elvin', avatarColor: '#006A60' }],
        expenses: [],
        settlements: [],
        updatedAt: 12345,
      };

      expect(getCachedRoomState('cached-room-1')).toBeNull();

      setCachedRoomState('cached-room-1', mockRoom);
      const cached = getCachedRoomState('cached-room-1');
      expect(cached).toEqual(mockRoom);
    });

    it('returns null if cached room state is invalid JSON', () => {
      localStorage.setItem('friends_debt_room_corrupt', '{invalid json');
      expect(getCachedRoomState('corrupt')).toBeNull();
    });
  });
});
