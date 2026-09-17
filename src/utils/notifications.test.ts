import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  isNotificationSupported,
  requestNotificationPermission,
  sendDebtSettledNotification,
  sendNotification,
} from './notifications';

describe('Web Notifications Utility', () => {
  const originalNotification = globalThis.Notification;

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    globalThis.Notification = originalNotification;
  });

  it('detects when Notification API is available or unavailable', () => {
    // When Notification exists
    expect(typeof isNotificationSupported()).toBe('boolean');

    // When Notification does not exist
    delete (globalThis as any).Notification;
    delete (window as any).Notification;
    expect(isNotificationSupported()).toBe(false);
  });

  it('requests permission and returns result', async () => {
    const mockRequestPermission = vi.fn().mockResolvedValue('granted');
    globalThis.Notification = {
      requestPermission: mockRequestPermission,
      permission: 'default',
    } as any;

    const res = await requestNotificationPermission();
    expect(res).toBe('granted');
    expect(mockRequestPermission).toHaveBeenCalled();
  });

  it('sends push notification when permission is granted', () => {
    const MockNotificationConstructor = vi.fn();
    (MockNotificationConstructor as any).permission = 'granted';
    (MockNotificationConstructor as any).requestPermission = vi.fn();
    globalThis.Notification = MockNotificationConstructor as any;

    sendNotification('Test Title', { body: 'Test Body' });
    expect(MockNotificationConstructor).toHaveBeenCalledWith(
      'Test Title',
      expect.objectContaining({ body: 'Test Body' })
    );
  });

  it('does not send notification when permission is denied', () => {
    const MockNotificationConstructor = vi.fn();
    (MockNotificationConstructor as any).permission = 'denied';
    globalThis.Notification = MockNotificationConstructor as any;

    const result = sendNotification('Test Title');
    expect(result).toBeNull();
    expect(MockNotificationConstructor).not.toHaveBeenCalled();
  });

  it('formats debt settlement notification properly in AZ, RU, and EN', () => {
    const MockNotificationConstructor = vi.fn();
    (MockNotificationConstructor as any).permission = 'granted';
    globalThis.Notification = MockNotificationConstructor as any;

    // AZ
    sendDebtSettledNotification('Elvin', 'Rauf', 25, '₼', 'az');
    expect(MockNotificationConstructor).toHaveBeenLastCalledWith(
      'Borc bağlandı! 🎉',
      expect.objectContaining({
        body: 'Borc bağlandı: Elvin 25 ₼ məbləğini Rauf-a qaytardı! 🎉',
      })
    );

    // RU
    sendDebtSettledNotification('Эльвин', 'Рауф', 100, '₽', 'ru');
    expect(MockNotificationConstructor).toHaveBeenLastCalledWith(
      'Долг закрыт! 🎉',
      expect.objectContaining({
        body: 'Долг закрыт: Эльвин перевел(а) Рауф 100 ₽! 🎉',
      })
    );

    // EN
    sendDebtSettledNotification('Alice', 'Bob', 50.25, '$', 'en');
    expect(MockNotificationConstructor).toHaveBeenLastCalledWith(
      'Debt settled! 🎉',
      expect.objectContaining({
        body: 'Debt settled: Alice paid 50.25 $ to Bob! 🎉',
      })
    );
  });
});
