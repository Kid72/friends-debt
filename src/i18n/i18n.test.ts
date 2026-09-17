import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import React from 'react';
import { translations, getTranslation } from './translations';
import { I18nProvider, useI18n, formatMoney, SUPPORTED_LANGUAGES } from './I18nContext';

describe('i18n Translations', () => {
  it('contains required keys for az, ru, en and defaults to az', () => {
    expect(getTranslation('az', 'app.title')).toBe('Dostlar Xərcləri');
    expect(getTranslation('ru', 'app.title')).toBe('Расходы друзей');
    expect(getTranslation('en', 'app.title')).toBe('Friends Expenses');
  });

  it('interpolates parameters correctly', () => {
    const text = getTranslation('az', 'settle.success_msg', { debtor: 'Elvin', receiver: 'Rauf', amount: '20 ₼' });
    expect(text).toContain('Elvin');
    expect(text).toContain('Rauf');
    expect(text).toContain('20 ₼');
  });

  it('interpolates numeric parameters cleanly', () => {
    const text = getTranslation('az', 'expense.delete_confirm', { title: 'Taksi' });
    expect(text).toContain('Taksi');
  });

  it('falls back to az when requested language is missing or invalid', () => {
    // @ts-expect-error test invalid language fallback
    expect(getTranslation('fr', 'app.title')).toBe('Dostlar Xərcləri');
  });

  it('falls back to key string when translation key is completely missing', () => {
    expect(getTranslation('az', 'nonexistent.key.xyz')).toBe('nonexistent.key.xyz');
  });

  it('maintains symmetrical keys across az, ru, and en dictionaries', () => {
    const azKeys = Object.keys(translations.az).sort();
    const ruKeys = Object.keys(translations.ru).sort();
    const enKeys = Object.keys(translations.en).sort();

    expect(azKeys.length).toBeGreaterThan(30);
    expect(ruKeys).toEqual(azKeys);
    expect(enKeys).toEqual(azKeys);
  });

  it('contains complete translations for navigation tabs', () => {
    expect(getTranslation('az', 'nav.transfers')).toBe('Köçürmələr');
    expect(getTranslation('ru', 'nav.transfers')).toBe('Переводы');
    expect(getTranslation('en', 'nav.transfers')).toBe('Transfers');

    expect(getTranslation('az', 'nav.history')).toBe('Tarixçə');
    expect(getTranslation('ru', 'nav.history')).toBe('История');
    expect(getTranslation('en', 'nav.history')).toBe('History');

    expect(getTranslation('az', 'nav.hall_of_fame')).toBe('Şərəf Lövhəsi');
    expect(getTranslation('ru', 'nav.hall_of_fame')).toBe('Доска почета');
    expect(getTranslation('en', 'nav.hall_of_fame')).toBe('Hall of Fame');
  });

  it('contains complete translations for balance states', () => {
    expect(getTranslation('az', 'balance.you_are_owed')).toBe('Sizə borcludurlar');
    expect(getTranslation('ru', 'balance.you_are_owed')).toBe('Вам должны');
    expect(getTranslation('en', 'balance.you_are_owed')).toBe('You are owed');

    expect(getTranslation('az', 'balance.you_owe')).toBe('Sizin borcunuz var');
    expect(getTranslation('ru', 'balance.you_owe')).toBe('Вы должны');
    expect(getTranslation('en', 'balance.you_owe')).toBe('You owe');

    expect(getTranslation('az', 'balance.settled')).toBe('Balans təmizdir');
    expect(getTranslation('ru', 'balance.settled')).toBe('Баланс чист');
    expect(getTranslation('en', 'balance.settled')).toBe('All settled up');
  });

  it('contains complete translations for expense split modes and actions', () => {
    expect(getTranslation('az', 'expense.split_equal')).toBe('Bərabər böl');
    expect(getTranslation('ru', 'expense.split_equal')).toBe('Поровну');
    expect(getTranslation('en', 'expense.split_equal')).toBe('Split equally');

    expect(getTranslation('az', 'expense.split_custom')).toBe('Dəqiq məbləğlərlə böl');
    expect(getTranslation('ru', 'expense.split_custom')).toBe('Точные суммы');
    expect(getTranslation('en', 'expense.split_custom')).toBe('Custom amounts');

    expect(getTranslation('az', 'expense.add_title')).toBe('Yeni xərc əlavə et');
    expect(getTranslation('ru', 'expense.add_title')).toBe('Добавить расход');
    expect(getTranslation('en', 'expense.add_title')).toBe('Add expense');
  });

  it('contains complete translations for Hall of Fame badges', () => {
    // 1. Gecənin sponsoru / Спонсор вечера / Sponsor of the Night
    expect(getTranslation('az', 'badge.sponsor.title')).toBe('Gecənin sponsoru');
    expect(getTranslation('ru', 'badge.sponsor.title')).toBe('Спонсор вечера');
    expect(getTranslation('en', 'badge.sponsor.title')).toBe('Sponsor of the Night');

    // 2. İldırım ödəyici / Молниеносный плательщик / Lightning Settler
    expect(getTranslation('az', 'badge.lightning.title')).toBe('İldırım ödəyici');
    expect(getTranslation('ru', 'badge.lightning.title')).toBe('Молниеносный плательщик');
    expect(getTranslation('en', 'badge.lightning.title')).toBe('Lightning Settler');

    // 3. Sabah ataram bəy / Мистер "Завтра скину" / "I'll pay tomorrow" Sir
    expect(getTranslation('az', 'badge.tomorrow.title')).toBe('"Sabah ataram" bəy');
    expect(getTranslation('ru', 'badge.tomorrow.title')).toBe('Мистер "Завтра скину"');
    expect(getTranslation('en', 'badge.tomorrow.title')).toBe('"I\'ll pay tomorrow" Sir');

    // 4. Məclisin canı / Душа компании / Life of the Party
    expect(getTranslation('az', 'badge.party.title')).toBe('Məclisin canı');
    expect(getTranslation('ru', 'badge.party.title')).toBe('Душа компании');
    expect(getTranslation('en', 'badge.party.title')).toBe('Life of the Party');
  });

  it('contains complete translations for Help & Info sections', () => {
    expect(getTranslation('az', 'help.how_it_works_title')).toBeTruthy();
    expect(getTranslation('az', 'help.debt_simplification_title')).toBeTruthy();
    expect(getTranslation('az', 'help.pwa_install_title')).toBeTruthy();
    expect(getTranslation('az', 'help.trust_privacy_title')).toBeTruthy();
  });

  it('contains complete translations for sync states and errors', () => {
    expect(getTranslation('az', 'sync.synced')).toBe('Sinxronlaşdırıldı');
    expect(getTranslation('ru', 'sync.syncing')).toBe('Синхронизация...');
    expect(getTranslation('en', 'sync.offline')).toBe('Offline mode');
  });

  it('contains complete translations for new review-flagged keys across AZ, RU, EN', () => {
    // Expense
    expect(getTranslation('az', 'expense.over_amount')).toBe('Artıq: ');
    expect(getTranslation('ru', 'expense.over_amount')).toBe('Излишек: ');
    expect(getTranslation('en', 'expense.over_amount')).toBe('Surplus: ');

    expect(getTranslation('az', 'expense.distribute_evenly')).toBe('Bərabər payla');
    expect(getTranslation('ru', 'expense.distribute_evenly')).toBe('Разделить поровну');
    expect(getTranslation('en', 'expense.distribute_evenly')).toBe('Split evenly');

    // History
    expect(getTranslation('az', 'history.people_count', { count: 5 })).toBe('5 nəfər');
    expect(getTranslation('ru', 'history.people_count', { count: 5 })).toBe('5 чел.');
    expect(getTranslation('en', 'history.people_count', { count: 5 })).toBe('5 people');

    expect(getTranslation('az', 'history.no_results')).toContain('Axtarış');
    expect(getTranslation('ru', 'history.no_results')).toContain('фильтрам');
    expect(getTranslation('en', 'history.no_results')).toContain('No matching');

    // Participant
    expect(getTranslation('az', 'participant.last_name_label')).toBe('Soyad (İxtiyari)');
    expect(getTranslation('ru', 'participant.last_name_label')).toBe('Фамилия (Необязательно)');
    expect(getTranslation('en', 'participant.last_name_label')).toBe('Last name (Optional)');

    // Transfers
    expect(getTranslation('az', 'transfers.min_transfers_desc')).toContain('Minimum tranzaksiya');
    expect(getTranslation('ru', 'transfers.min_transfers_desc')).toContain('минимальным числом');
    expect(getTranslation('en', 'transfers.min_transfers_desc')).toContain('minimal transactions');

    // Help visual example
    expect(getTranslation('az', 'help.visual_example_title')).toBe('Vizual Nümunə');
    expect(getTranslation('ru', 'help.visual_example_title')).toBe('Наглядный пример');
    expect(getTranslation('en', 'help.visual_example_title')).toBe('Visual Example');
  });
});

describe('I18nContext and useI18n hook', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.lang = 'az';
  });

  it('provides default language (az) when localStorage is empty', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      React.createElement(I18nProvider, null, children)
    );

    const { result } = renderHook(() => useI18n(), { wrapper });

    expect(result.current.lang).toBe('az');
    expect(result.current.t('app.title')).toBe('Dostlar Xərcləri');
  });

  it('initializes with stored language from localStorage', () => {
    localStorage.setItem('friends_debt_lang', 'ru');

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      React.createElement(I18nProvider, null, children)
    );

    const { result } = renderHook(() => useI18n(), { wrapper });

    expect(result.current.lang).toBe('ru');
    expect(result.current.t('app.title')).toBe('Расходы друзей');
    expect(document.documentElement.lang).toBe('ru');
  });

  it('updates language, document html lang, and persists to localStorage', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      React.createElement(I18nProvider, null, children)
    );

    const { result } = renderHook(() => useI18n(), { wrapper });

    act(() => {
      result.current.setLang('en');
    });

    expect(result.current.lang).toBe('en');
    expect(result.current.t('app.title')).toBe('Friends Expenses');
    expect(localStorage.getItem('friends_debt_lang')).toBe('en');
    expect(document.documentElement.lang).toBe('en');
  });

  it('formats money consistently with integer and decimal values', () => {
    expect(formatMoney(20, '₼')).toBe('20 ₼');
    expect(formatMoney(15.5, '₼')).toBe('15.50 ₼');
    expect(formatMoney(0, '$')).toBe('0 $');
    expect(formatMoney(100.999, '₼')).toBe('101 ₼');
  });

  it('provides formatMoney via useI18n hook', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      React.createElement(I18nProvider, null, children)
    );

    const { result } = renderHook(() => useI18n(), { wrapper });
    expect(result.current.formatMoney(42)).toBe('42 ₼');
  });

  it('throws error when useI18n is used outside I18nProvider', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => {
      renderHook(() => useI18n());
    }).toThrow('useI18n must be used within an I18nProvider');
    spy.mockRestore();
  });

  it('exports supported language options list', () => {
    expect(SUPPORTED_LANGUAGES).toEqual([
      { code: 'az', label: 'Azərbaycan', flag: '🇦🇿' },
      { code: 'ru', label: 'Русский', flag: '🇷🇺' },
      { code: 'en', label: 'English', flag: '🇬🇧' }
    ]);
  });
});
