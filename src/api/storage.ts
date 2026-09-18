import { RoomState, Language } from '../types';

export const EXTENDSCLASS_BASE_URL = 'https://extendsclass.com/api/json-storage/bin';
/** @deprecated kept for backward-compat reading of old npoint rooms */
export const NPOINT_BASE_URL = 'https://api.npoint.io';

const STORAGE_PREFIX = 'friends_debt_';

/**
 * Fetch wrapper with configurable retries and exponential backoff.
 */
export async function fetchWithRetry(
  url: string,
  options: RequestInit = {},
  retries: number = 2,
  backoffMs: number = 50
): Promise<Response> {
  let lastError: any;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await fetch(url, options);
      if (res.ok || (res.status >= 400 && res.status < 500 && res.status !== 429)) {
        return res;
      }
      lastError = new Error(`HTTP ${res.status}: ${res.statusText}`);
      if (attempt < retries) {
        // If throttled by 429 Too Many Requests, back off with a larger delay
        const delay = res.status === 429
          ? Math.max(backoffMs, 400) * Math.pow(2, attempt)
          : backoffMs * Math.pow(2, attempt);
        await new Promise((resolve) => setTimeout(resolve, delay));
        continue;
      }
    } catch (err: any) {
      lastError = err;
      if (attempt < retries) {
        await new Promise((resolve) => setTimeout(resolve, backoffMs * Math.pow(2, attempt)));
      }
    }
  }
  throw lastError;
}

/**
 * Auto-provisions a new room on the cloud REST JSON provider.
 * Returns the unique roomId / binId.
 */
export async function createRoom(initialState: RoomState): Promise<string> {
  const payload = JSON.stringify({
    ...initialState,
    updatedAt: initialState.updatedAt || Date.now(),
  });

  const res = await fetchWithRetry(EXTENDSCLASS_BASE_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: payload,
  });

  if (!res.ok) {
    throw new Error(`Storage provider returned status ${res.status}: ${res.statusText}`);
  }

  const data = await res.json();
  // extendsclass returns { status: 0, uri: "...", id: "abc123" }
  const generatedId: string | null = data?.id || null;

  if (!generatedId) {
    throw new Error('No room ID returned by cloud storage provider');
  }

  // Seed localStorage cache immediately so the room loads instantly
  const newState: RoomState = { ...initialState, id: generatedId, updatedAt: Date.now() };
  setCachedRoomState(generatedId, newState);

  return generatedId;
}

/**
 * Fetches the current room state from the cloud REST JSON provider.
 */
export async function fetchRoomState(roomId: string): Promise<RoomState> {
  // If this is a local offline-first room, retrieve directly from local cache
  if (roomId.startsWith('local_')) {
    const cached = getCachedRoomState(roomId);
    if (cached) {
      return cached;
    }
    throw new Error('Local room not found in device storage');
  }

  // extendsclass IDs are short alphanumeric strings (e.g. "adbffda", 7 chars)
  // npoint IDs are longer hex strings — keep backward compat for old rooms
  const url = roomId.startsWith('http')
    ? roomId
    : `${EXTENDSCLASS_BASE_URL}/${roomId}`;

  const res = await fetchWithRetry(url, {
    method: 'GET',
    headers: { 'Accept': 'application/json' },
  });

  if (!res.ok) {
    throw new Error(`Room not found or failed to fetch (${res.status}): ${res.statusText}`);
  }

  const rawData = await res.json();
  const state: Partial<RoomState> =
    rawData && typeof rawData === 'object' && 'record' in rawData
      ? rawData.record
      : rawData;

  if (!state || typeof state !== 'object') {
    throw new Error('Invalid room data received from storage provider');
  }

  return {
    id: state.id || roomId,
    groupName: state.groupName || 'Dostlar',
    currency: state.currency || '₼',
    participants: Array.isArray(state.participants) ? state.participants : [],
    expenses: Array.isArray(state.expenses) ? state.expenses : [],
    settlements: Array.isArray(state.settlements) ? state.settlements : [],
    updatedAt: typeof state.updatedAt === 'number' ? state.updatedAt : Date.now(),
  };
}

/**
 * Saves room state to the cloud REST JSON provider.
 * Returns true if successful, false otherwise.
 */
export async function saveRoomState(roomId: string, state: RoomState): Promise<boolean> {
  // Always update localStorage cache first for instant offline reads
  setCachedRoomState(roomId, state);

  // local_ rooms only live in localStorage
  if (roomId.startsWith('local_')) {
    return true;
  }

  const url = roomId.startsWith('http') ? roomId : `${EXTENDSCLASS_BASE_URL}/${roomId}`;
  const payload = JSON.stringify({
    ...state,
    updatedAt: state.updatedAt || Date.now(),
  });

  try {
    // extendsclass uses PUT to update an existing bin
    const res = await fetchWithRetry(url, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: payload,
    });
    return res.ok;
  } catch (err) {
    console.error('Failed to save room state:', err);
    return false;
  }
}

/**
 * Cached room state in localStorage for offline PWA instant loading.
 */
export function getCachedRoomState(roomId: string): RoomState | null {
  try {
    const raw = localStorage.getItem(`${STORAGE_PREFIX}room_${roomId}`);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return null;
    return {
      id: parsed.id || roomId,
      groupName: parsed.groupName || 'Dostlar',
      currency: parsed.currency || '₼',
      participants: Array.isArray(parsed.participants) ? parsed.participants : [],
      expenses: Array.isArray(parsed.expenses) ? parsed.expenses : [],
      settlements: Array.isArray(parsed.settlements) ? parsed.settlements : [],
      updatedAt: typeof parsed.updatedAt === 'number' ? parsed.updatedAt : Date.now(),
    };
  } catch {
    return null;
  }
}

/**
 * Saves cached room state to localStorage for offline PWA instant loading.
 */
export function setCachedRoomState(roomId: string, state: RoomState): void {
  try {
    localStorage.setItem(`${STORAGE_PREFIX}room_${roomId}`, JSON.stringify(state));
  } catch (err) {
    console.warn('Failed to cache room state in localStorage:', err);
  }
}

/**
 * Local device preference: Get active user ID for this room from localStorage.
 */
export function getActiveUserId(roomId: string): string | null {
  try {
    return localStorage.getItem(`${STORAGE_PREFIX}active_user_${roomId}`) || null;
  } catch {
    return null;
  }
}

/**
 * Local device preference: Set active user ID for this room in localStorage.
 */
export function setActiveUserId(roomId: string, userId: string): void {
  try {
    localStorage.setItem(`${STORAGE_PREFIX}active_user_${roomId}`, userId);
  } catch (err) {
    console.warn('Failed to save active user to localStorage:', err);
  }
}

/**
 * Local device preference: Get stored language preference (defaults to 'az').
 */
export function getStoredLanguage(): Language {
  try {
    const lang = localStorage.getItem(`${STORAGE_PREFIX}lang`);
    if (lang === 'az' || lang === 'ru' || lang === 'en') {
      return lang;
    }
  } catch {
    // Ignore localStorage errors
  }
  return 'az';
}

/**
 * Local device preference: Set language preference in localStorage.
 */
export function setStoredLanguage(lang: Language): void {
  try {
    localStorage.setItem(`${STORAGE_PREFIX}lang`, lang);
  } catch (err) {
    console.warn('Failed to save language to localStorage:', err);
  }
}

/**
 * PWA persistence: Returns the last room ID the user was in, so the PWA
 * can restore it when launched from the home screen (no ?room= in URL).
 */
export function getLastRoomId(): string | null {
  try {
    return localStorage.getItem(`${STORAGE_PREFIX}last_room`) || null;
  } catch {
    return null;
  }
}

/**
 * PWA persistence: Saves the current room ID so the PWA can restore it
 * on the next home-screen launch.
 */
export function setLastRoomId(roomId: string): void {
  try {
    localStorage.setItem(`${STORAGE_PREFIX}last_room`, roomId);
  } catch (err) {
    console.warn('Failed to save last room ID to localStorage:', err);
  }
}

export interface RecentRoom {
  id: string;
  name: string;
  visitedAt: number;
}

/**
 * Returns a list of recently visited rooms from localStorage.
 */
export function getRecentRooms(): RecentRoom[] {
  try {
    const raw = localStorage.getItem(`${STORAGE_PREFIX}recent_rooms`);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/**
 * Saves or updates a room in the list of recently visited rooms.
 */
export function saveRecentRoom(roomId: string, name: string = 'Dostlar'): void {
  if (!roomId) return;
  try {
    const recents = getRecentRooms().filter((r) => r.id !== roomId);
    recents.unshift({
      id: roomId,
      name: name || 'Dostlar',
      visitedAt: Date.now(),
    });
    // Keep at most 10 recent rooms
    localStorage.setItem(`${STORAGE_PREFIX}recent_rooms`, JSON.stringify(recents.slice(0, 10)));
  } catch (err) {
    console.warn('Failed to save recent room:', err);
  }
}

