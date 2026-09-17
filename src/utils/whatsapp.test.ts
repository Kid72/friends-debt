import { describe, it, expect } from 'vitest';
import { generateSettleWhatsAppUrl, generateSummaryWhatsAppUrl } from './whatsapp';
import { Expense, Participant, SimplifiedTransfer } from '../types';

describe('WhatsApp Deep Link Generator', () => {
  describe('generateSettleWhatsAppUrl', () => {
    it('generates valid settle message URL with emoji and room link in AZ', () => {
      const url = generateSettleWhatsAppUrl(
        'Elvin',
        'Rauf',
        25,
        '₼',
        'https://friends-debt.vercel.app?room=123',
        'az'
      );
      expect(url).toContain('https://wa.me/?text=');
      const decoded = decodeURIComponent(url);
      expect(decoded).toContain('Borc bağlandı');
      expect(decoded).toContain('Elvin ➡️ 25 ₼ ➡️ Rauf');
      expect(decoded).toContain('Yığıncaq balansı yeniləndi.');
      expect(decoded).toContain('🔗 https://friends-debt.vercel.app?room=123');
    });

    it('generates valid settle message URL in Russian (ru)', () => {
      const url = generateSettleWhatsAppUrl(
        'Али',
        'Вели',
        50.5,
        '₽',
        'https://friends-debt.vercel.app?room=456',
        'ru'
      );
      const decoded = decodeURIComponent(url);
      expect(decoded).toContain('Долг закрыт');
      expect(decoded).toContain('Али ➡️ 50.50 ₽ ➡️ Вели');
      expect(decoded).toContain('Баланс группы обновлен.');
      expect(decoded).toContain('🔗 https://friends-debt.vercel.app?room=456');
    });

    it('generates valid settle message URL in English (en)', () => {
      const url = generateSettleWhatsAppUrl(
        'Alice',
        'Bob',
        10,
        '$',
        'https://friends-debt.vercel.app?room=789',
        'en'
      );
      const decoded = decodeURIComponent(url);
      expect(decoded).toContain('Debt settled');
      expect(decoded).toContain('Alice ➡️ 10 $ ➡️ Bob');
      expect(decoded).toContain('Group balance updated.');
      expect(decoded).toContain('🔗 https://friends-debt.vercel.app?room=789');
    });

    it('supports calling with settlement object as first argument', () => {
      const settlement = {
        id: 's1',
        fromParticipantId: 'p1',
        toParticipantId: 'p2',
        amount: 30,
        date: '2026-09-17',
        createdAt: 100,
      };
      const url = generateSettleWhatsAppUrl(
        settlement,
        'Elvin',
        'Rauf',
        '₼',
        'https://friends-debt.vercel.app?room=123',
        'az'
      );
      const decoded = decodeURIComponent(url);
      expect(decoded).toContain('Elvin ➡️ 30 ₼ ➡️ Rauf');
    });
  });

  describe('generateSummaryWhatsAppUrl', () => {
    const participants: Participant[] = [
      { id: 'p1', name: 'Elvin', avatarColor: '#006A60' },
      { id: 'p2', name: 'Rauf', avatarColor: '#984061' },
      { id: 'p3', name: 'Leyla', avatarColor: '#7C5800' },
    ];

    const expenses: Expense[] = [
      {
        id: 'e1',
        title: 'Dinner',
        amount: 60,
        payerId: 'p1',
        date: '2026-09-17',
        splitMode: 'equal',
        involvedParticipantIds: ['p1', 'p2', 'p3'],
        createdAt: 1,
      },
      {
        id: 'e2',
        title: 'Taxi',
        amount: 30,
        payerId: 'p2',
        date: '2026-09-17',
        splitMode: 'equal',
        involvedParticipantIds: ['p1', 'p2'],
        createdAt: 2,
      },
    ];

    const transfers: SimplifiedTransfer[] = [
      {
        fromParticipantId: 'p3',
        toParticipantId: 'p1',
        amount: 20,
        explanation: {
          az: 'Leyla Elvin şəxsinə 20 ₼ ödəməlidir.',
          ru: 'Лейла переводит Эльвину 20 ₼.',
          en: 'Leyla pays Elvin 20 ₼.',
        },
      },
    ];

    it('generates full gathering summary WhatsApp link with transfers in AZ', () => {
      const url = generateSummaryWhatsAppUrl(
        'Şamaxı Səfəri',
        expenses,
        transfers,
        participants,
        '₼',
        'https://friends-debt.vercel.app?room=123',
        'az'
      );
      expect(url).toContain('https://wa.me/?text=');
      const decoded = decodeURIComponent(url);

      expect(decoded).toContain('🍻 Yığıncaq nəticələri: Şamaxı Səfəri');
      expect(decoded).toContain('💰 Ümumi hesab: 90 ₼ (ödədi: Elvin, Rauf)');
      expect(decoded).toContain('📋 Kim kimə köçürür (optimallaşdırılmış):');
      expect(decoded).toContain('• Leyla ➡️ 20 ₼ ➡️ Elvin');
      expect(decoded).toContain(
        '🔗 Balansı yoxlamaq və borcları bağlamaq: https://friends-debt.vercel.app?room=123'
      );
    });

    it('generates summary in Russian with single payer', () => {
      const singlePayerExpenses = [expenses[0]]; // Only Elvin paid 60
      const url = generateSummaryWhatsAppUrl(
        'Ужин',
        singlePayerExpenses,
        transfers,
        participants,
        '₽',
        'https://friends-debt.vercel.app?room=456',
        'ru'
      );
      const decoded = decodeURIComponent(url);

      expect(decoded).toContain('🍻 Итоги встречи: Ужин');
      expect(decoded).toContain('💰 Общий счет: 60 ₽ (оплатил: Elvin)');
      expect(decoded).toContain('📋 Кто кому переводит (оптимизировано):');
      expect(decoded).toContain('• Leyla ➡️ 20 ₽ ➡️ Elvin');
    });

    it('handles empty transfers when all debts are settled', () => {
      const url = generateSummaryWhatsAppUrl(
        'Şamaxı Səfəri',
        expenses,
        [],
        participants,
        '₼',
        'https://friends-debt.vercel.app?room=123',
        'az'
      );
      const decoded = decodeURIComponent(url);

      expect(decoded).toContain('Bütün borclar bağlanıb');
      expect(decoded).not.toContain('• ');
    });
  });
});
