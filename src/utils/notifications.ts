import { Language } from '../types';

export function isNotificationSupported(): boolean {
  if (typeof window !== 'undefined' && 'Notification' in window) return true;
  if (typeof globalThis !== 'undefined' && 'Notification' in globalThis) return true;
  return false;
}

export function getNotificationPermission(): NotificationPermission {
  if (!isNotificationSupported()) return 'denied';
  return Notification.permission;
}

export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!isNotificationSupported()) return 'denied';
  try {
    return await Notification.requestPermission();
  } catch {
    return 'denied';
  }
}

export function sendNotification(
  title: string,
  options?: NotificationOptions
): Notification | null {
  if (!isNotificationSupported()) return null;
  if (Notification.permission !== 'granted') return null;

  try {
    return new Notification(title, {
      icon: '/pwa-192x192.png',
      badge: '/pwa-192x192.png',
      ...options,
    });
  } catch {
    return null;
  }
}

function formatAmountVal(amount: number): string {
  const rounded = Math.round((amount + Number.EPSILON) * 100) / 100;
  return Number.isInteger(rounded) ? rounded.toString() : rounded.toFixed(2);
}

/**
 * Fires local push notification on debt settlement:
 * `Borc bağlandı: [Borclu] [Məbləğ] [Valyuta] məbləğini [Alan]-a qaytardı! 🎉`
 */
export function sendDebtSettledNotification(
  debtorName: string,
  receiverName: string,
  amount: number,
  currency: string = '₼',
  lang: Language = 'az'
): Notification | null {
  const formattedAmt = formatAmountVal(amount);

  let title = 'Borc bağlandı! 🎉';
  let body = `Borc bağlandı: ${debtorName} ${formattedAmt} ${currency} məbləğini ${receiverName}-a qaytardı! 🎉`;

  if (lang === 'ru') {
    title = 'Долг закрыт! 🎉';
    body = `Долг закрыт: ${debtorName} перевел(а) ${receiverName} ${formattedAmt} ${currency}! 🎉`;
  } else if (lang === 'en') {
    title = 'Debt settled! 🎉';
    body = `Debt settled: ${debtorName} paid ${formattedAmt} ${currency} to ${receiverName}! 🎉`;
  }

  return sendNotification(title, {
    body,
    tag: `debt-settled-${Date.now()}`,
  });
}
