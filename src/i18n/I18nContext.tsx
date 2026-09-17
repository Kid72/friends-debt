import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { Language } from '../types';
import { getStoredLanguage, setStoredLanguage } from '../api/storage';
import { getTranslation, TranslationKey } from './translations';

export interface LanguageOption {
  code: Language;
  label: string;
  flag: string;
}

export const SUPPORTED_LANGUAGES: LanguageOption[] = [
  { code: 'az', label: 'Azərbaycan', flag: '🇦🇿' },
  { code: 'ru', label: 'Русский', flag: '🇷🇺' },
  { code: 'en', label: 'English', flag: '🇬🇧' },
];

/**
 * Formats a monetary amount into a clean localized currency string.
 * Integer values: 20 -> "20 ₼"
 * Fractional values: 15.5 -> "15.50 ₼"
 */
export function formatMoney(amount: number, currency: string = '₼'): string {
  const rounded = Math.round((amount + Number.EPSILON) * 100) / 100;
  const formatted = Number.isInteger(rounded) ? rounded.toString() : rounded.toFixed(2);
  return `${formatted} ${currency}`;
}

export interface I18nContextType {
  lang: Language;
  setLang: (lang: Language) => void;
  t: (key: TranslationKey | (string & {}), params?: Record<string, string | number>) => string;
  formatMoney: (amount: number, currency?: string) => string;
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

export interface I18nProviderProps {
  children: React.ReactNode;
  initialLang?: Language;
}

export const I18nProvider: React.FC<I18nProviderProps> = ({ children, initialLang }) => {
  const [lang, setLangState] = useState<Language>(() => {
    if (initialLang) return initialLang;
    return getStoredLanguage();
  });

  // Sync document html lang attribute
  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.lang = lang;
    }
  }, [lang]);

  const setLang = useCallback((newLang: Language) => {
    setLangState(newLang);
    setStoredLanguage(newLang);
    if (typeof document !== 'undefined') {
      document.documentElement.lang = newLang;
    }
  }, []);

  const t = useCallback(
    (key: TranslationKey | (string & {}), params?: Record<string, string | number>) => {
      return getTranslation(lang, key, params);
    },
    [lang]
  );

  const formatMoneyBound = useCallback((amount: number, currency: string = '₼') => {
    return formatMoney(amount, currency);
  }, []);

  const value = useMemo<I18nContextType>(
    () => ({
      lang,
      setLang,
      t,
      formatMoney: formatMoneyBound,
    }),
    [lang, setLang, t, formatMoneyBound]
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
};

/**
 * Hook to consume i18n translation context.
 * Returns { lang, setLang, t, formatMoney }
 */
export function useI18n(): I18nContextType {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useI18n must be used within an I18nProvider');
  }
  return context;
}

export interface LanguageSwitcherProps {
  className?: string;
}

/**
 * Accessible M3 Language Switcher Component
 */
export const LanguageSwitcher: React.FC<LanguageSwitcherProps> = ({ className = '' }) => {
  const { lang, setLang } = useI18n();

  return (
    <div className={`inline-flex items-center gap-1 bg-md-surface-container-high rounded-full p-1 ${className}`}>
      {SUPPORTED_LANGUAGES.map((option) => {
        const isActive = lang === option.code;
        return (
          <button
            key={option.code}
            type="button"
            onClick={() => setLang(option.code)}
            className={`px-2.5 py-1 text-xs font-medium rounded-full transition-all duration-200 flex items-center gap-1 ${
              isActive
                ? 'bg-md-primary text-md-on-primary shadow-sm'
                : 'text-md-on-surface-variant hover:text-md-on-surface hover:bg-md-surface-container-highest'
            }`}
            aria-pressed={isActive}
            aria-label={option.label}
          >
            <span>{option.flag}</span>
            <span className="uppercase">{option.code}</span>
          </button>
        );
      })}
    </div>
  );
};
