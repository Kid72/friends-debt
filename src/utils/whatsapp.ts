import {
  Expense,
  Language,
  Participant,
  Settlement,
  SimplifiedTransfer,
} from '../types';
import { getTranslation } from '../i18n/translations';

function formatNumber(val: number): string {
  const rounded = Math.round((val + Number.EPSILON) * 100) / 100;
  return Number.isInteger(rounded) ? rounded.toString() : rounded.toFixed(2);
}

/**
 * Generates WhatsApp deep link URL for settlement confirmation.
 * Supports both signatures:
 * 1. (debtorName, receiverName, amount, currency, appUrl, lang)
 * 2. (settlement, debtorName, receiverName, currency, appUrl, lang)
 */
export function generateSettleWhatsAppUrl(
  debtorOrSettlement: string | Settlement | { amount: number; debtorName?: string; receiverName?: string },
  receiverOrDebtorName?: string,
  amountOrReceiverName?: number | string,
  currencyOrAmount?: string | number,
  appUrlOrCurrency?: string,
  langOrAppUrl?: Language | string,
  maybeLang?: Language
): string {
  let debtor = '';
  let receiver = '';
  let amount = 0;
  let currency = '₼';
  let appUrl = '';
  let lang: Language = 'az';

  if (typeof debtorOrSettlement === 'object' && debtorOrSettlement !== null) {
    // Signature: (settlement, debtorName, receiverName, currency, appUrl, lang)
    amount = debtorOrSettlement.amount || 0;
    debtor = receiverOrDebtorName || (debtorOrSettlement as any).debtorName || '';
    receiver = (typeof amountOrReceiverName === 'string' ? amountOrReceiverName : '') || (debtorOrSettlement as any).receiverName || '';
    currency = (typeof currencyOrAmount === 'string' ? currencyOrAmount : '₼') || '₼';
    appUrl = (typeof appUrlOrCurrency === 'string' ? appUrlOrCurrency : '') || '';
    lang = (typeof langOrAppUrl === 'string' && (langOrAppUrl === 'az' || langOrAppUrl === 'ru' || langOrAppUrl === 'en')
      ? langOrAppUrl
      : 'az') as Language;
  } else {
    // Signature: (debtorName, receiverName, amount, currency, appUrl, lang)
    debtor = String(debtorOrSettlement || '');
    receiver = String(receiverOrDebtorName || '');
    amount = typeof amountOrReceiverName === 'number' ? amountOrReceiverName : parseFloat(String(amountOrReceiverName || 0));
    currency = String(currencyOrAmount || '₼');
    appUrl = String(appUrlOrCurrency || '');
    lang = (maybeLang || (typeof langOrAppUrl === 'string' && (langOrAppUrl === 'az' || langOrAppUrl === 'ru' || langOrAppUrl === 'en') ? langOrAppUrl : 'az')) as Language;
  }

  const formattedAmount = formatNumber(amount);
  const title = getTranslation(lang, 'whatsapp.settle_title');
  const body = getTranslation(lang, 'whatsapp.settle_body', {
    debtor,
    amount: formattedAmount,
    currency,
    receiver,
    url: appUrl,
  });

  const fullText = `${title}\n${body}`;
  return `https://wa.me/?text=${encodeURIComponent(fullText)}`;
}

/**
 * Generates WhatsApp deep link URL for full gathering summary.
 * Follows PRD section 4.4 and includes total spend, payer(s), optimized transfers, and room link.
 */
export function generateSummaryWhatsAppUrl(
  roomName: string,
  expenses: Expense[],
  transfers: SimplifiedTransfer[],
  participants: Participant[],
  currency: string = '₼',
  appUrl: string = '',
  lang: Language = 'az'
): string {
  const participantMap = new Map(participants.map((p) => [p.id, p.name]));

  // Calculate total expense amount
  const totalAmount = expenses.reduce((sum, exp) => sum + (exp.amount || 0), 0);
  const formattedTotal = formatNumber(totalAmount);

  // Determine unique payers
  const uniquePayerIds = Array.from(new Set(expenses.map((e) => e.payerId).filter(Boolean)));
  const payerNames = uniquePayerIds
    .map((id) => participantMap.get(id) || id)
    .filter(Boolean);

  const lines: string[] = [];

  // Header: 🍻 Yığıncaq nəticələri: [Məkan/Təsvir və ya Qrup adı]
  lines.push(
    getTranslation(lang, 'whatsapp.summary_header', {
      groupName: roomName || 'Qrup',
    })
  );

  // Total: 💰 Ümumi hesab: [Məbləğ] [Valyuta] (ödədi: [Ad])
  let totalLine = getTranslation(lang, 'whatsapp.summary_total', {
    total: formattedTotal,
    currency,
  });

  if (payerNames.length > 0) {
    totalLine += getTranslation(lang, 'whatsapp.summary_paid_by', {
      payer: payerNames.join(', '),
    });
  }
  lines.push(totalLine);
  lines.push(''); // Empty line before transfers

  // Transfers: 📋 Kim kimə köçürür (optimallaşdırılmış):
  if (transfers.length > 0) {
    lines.push(getTranslation(lang, 'whatsapp.summary_transfers_title'));

    for (const transfer of transfers) {
      const fromName = participantMap.get(transfer.fromParticipantId) || transfer.fromParticipantId;
      const toName = participantMap.get(transfer.toParticipantId) || transfer.toParticipantId;
      const formattedTransferAmt = formatNumber(transfer.amount);

      lines.push(
        getTranslation(lang, 'whatsapp.summary_transfer_item', {
          from: fromName,
          amount: formattedTransferAmt,
          currency,
          to: toName,
        })
      );
    }
    lines.push('');
  } else {
    // All debts settled celebratory line
    lines.push(getTranslation(lang, 'settle.all_settled'));
    lines.push('');
  }

  // Room link: 🔗 Balansı yoxlamaq və borcları bağlamaq: [Link]
  if (appUrl) {
    lines.push(
      getTranslation(lang, 'whatsapp.summary_link', {
        url: appUrl,
      })
    );
  }

  const fullText = lines.join('\n');
  return `https://wa.me/?text=${encodeURIComponent(fullText)}`;
}
