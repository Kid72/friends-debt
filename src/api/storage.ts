import { RoomState, Language } from '../types';

export const NPOINT_BASE_URL = 'https://api.npoint.io';
export const JSONBIN_FALLBACK_URL = 'https://api.jsonbin.io/v3/b';

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
    } catch (err: any) {
      lastError = err;
    }
    if (attempt < retries) {
      await new Promise((resolve) => setTimeout(resolve, backoffMs * Math.pow(2, attempt)));
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

  try {
    const res = await fetchWithRetry(NPOINT_BASE_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: payload,
    });

    if (!res.ok) {
      throw new Error(`Storage provider returned status ${res.status}: ${res.statusText}`);
    }

    const data = await res.json();
    const generatedId =
      data?.id ||
      data?.binId ||
      data?.record?.id ||
      data?.metadata?.id ||
      (typeof data === 'string' ? data : null);

    if (generatedId) {
      return String(generatedId);
    }

    if (initialState.id) {
      return initialState.id;
    }

    throw new Error('No room ID returned by cloud storage provider');
  } catch (err: any) {
    console.error('Failed to create room:', err);
    throw new Error(`Failed to create room: ${err.message || 'Unknown network error'}`);
  }
}

/**
 * Fetches the current room state from the cloud REST JSON provider.
 */
export async function fetchRoomState(roomId: string): Promise<RoomState> {
  const url = roomId.startsWith('http') ? roomId : `${NPOINT_BASE_URL}/${roomId}`;

  const res = await fetchWithRetry(url, {
    method: 'GET',
    headers: {
      'Accept': 'application/json',
    },
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
  const url = roomId.startsWith('http') ? roomId : `${NPOINT_BASE_URL}/${roomId}`;
  const payload = JSON.stringify({
    ...state,
    updatedAt: state.updatedAt || Date.now(),
  });

  try {
    const res = await fetchWithRetry(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: payload,
    });

    if (res.ok) {
      return true;
    }

    // Fallback to PUT if POST is not allowed
    if (res.status === 405) {
      const putRes = await fetchWithRetry(url, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: payload,
      });
      return putRes.ok;
    }

    return false;
  } catch (err) {
    console.error('Failed to save room state:', err);
    return false;
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
