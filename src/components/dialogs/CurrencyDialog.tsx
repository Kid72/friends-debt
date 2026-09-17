import React from 'react';
import { Check } from 'lucide-react';
import { Dialog } from '../common/Dialog';
import { Button } from '../common/Button';
import { useI18n } from '../../i18n/I18nContext';
import { cn } from '../../utils/cn';

export interface CurrencyOption {
  symbol: string;
  code: string;
  name: {
    az: string;
    ru: string;
    en: string;
  };
}

export const SUPPORTED_CURRENCIES: CurrencyOption[] = [
  {
    symbol: '₼',
    code: 'AZN',
    name: {
      az: 'Azərbaycan manatı',
      ru: 'Азербайджанский манат',
      en: 'Azerbaijani Manat',
    },
  },
  {
    symbol: '$',
    code: 'USD',
    name: {
      az: 'ABŞ dolları',
      ru: 'Доллар США',
      en: 'US Dollar',
    },
  },
  {
    symbol: '€',
    code: 'EUR',
    name: {
      az: 'Avro',
      ru: 'Евро',
      en: 'Euro',
    },
  },
  {
    symbol: '₽',
    code: 'RUB',
    name: {
      az: 'Rusiya rublu',
      ru: 'Российский рубль',
      en: 'Russian Ruble',
    },
  },
  {
    symbol: '₺',
    code: 'TRY',
    name: {
      az: 'Türk lirəsi',
      ru: 'Турецкая лира',
      en: 'Turkish Lira',
    },
  },
];

export interface CurrencyDialogProps {
  isOpen: boolean;
  onClose: () => void;
  currentCurrency: string;
  onSelectCurrency: (currency: string) => void | Promise<any>;
}

export const CurrencyDialog: React.FC<CurrencyDialogProps> = ({
  isOpen,
  onClose,
  currentCurrency,
  onSelectCurrency,
}) => {
  const { t, lang } = useI18n();

  const handleSelect = (symbol: string) => {
    onSelectCurrency(symbol);
    onClose();
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title={t('room.currency_title')}
      description={t('room.currency_label')}
      maxWidth="sm"
      footer={
        <Button variant="text" size="sm" onClick={onClose}>
          {t('common.cancel')}
        </Button>
      }
    >
      <div className="space-y-2 py-1" role="radiogroup" aria-label={t('room.currency_title')}>
        {SUPPORTED_CURRENCIES.map((currency) => {
          const isSelected = currency.symbol === currentCurrency;
          const localizedName = currency.name[lang] || currency.name.az;

          return (
            <button
              key={currency.code}
              type="button"
              role="radio"
              aria-checked={isSelected}
              onClick={() => handleSelect(currency.symbol)}
              className={cn(
                'w-full flex items-center justify-between px-4 py-3 rounded-2xl transition-all duration-200 border text-left',
                isSelected
                  ? 'bg-md-primary/10 border-md-primary text-md-primary shadow-xs'
                  : 'bg-md-surface-container-high/40 border-transparent hover:bg-md-surface-container-highest text-md-on-surface'
              )}
            >
              <div className="flex items-center gap-3">
                <span
                  className={cn(
                    'w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold transition-colors',
                    isSelected
                      ? 'bg-md-primary text-md-on-primary'
                      : 'bg-md-surface-container-highest text-md-on-surface'
                  )}
                >
                  {currency.symbol}
                </span>
                <div>
                  <div className="font-semibold text-sm leading-tight text-md-on-surface">
                    {localizedName}
                  </div>
                  <div className="text-xs text-md-on-surface-variant font-mono">
                    {currency.code}
                  </div>
                </div>
              </div>

              {isSelected && (
                <div className="w-6 h-6 rounded-full bg-md-primary text-md-on-primary flex items-center justify-center shrink-0">
                  <Check className="w-4 h-4" />
                </div>
              )}
            </button>
          );
        })}
      </div>
    </Dialog>
  );
};
