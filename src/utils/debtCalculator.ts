import {
  Expense,
  Language,
  Participant,
  Settlement,
  SimplifiedTransfer,
  TransferExplanation
} from '../types';

/**
 * Formats monetary amounts cleanly with currency symbol.
 * e.g. 15 -> "15 ₼", 12.5 -> "12.50 ₼"
 */
export function formatAmount(amount: number, currency: string = '₼'): string {
  const rounded = Math.round((amount + Number.EPSILON) * 100) / 100;
  const formatted = Number.isInteger(rounded) ? rounded.toString() : rounded.toFixed(2);
  return `${formatted} ${currency}`;
}

/**
 * Calculates net balance for every participant in the room.
 * Balance = (Paid - Consumed) + (SettledBy - SettledTo)
 * Positive balance: participant is a creditor (is owed money).
 * Negative balance: participant is a debtor (owes money).
 */
export function calculateBalances(
  participants: Participant[],
  expenses: Expense[],
  settlements: Settlement[] = []
): Record<string, number> {
  const balances: Record<string, number> = {};

  // Initialize all participants to 0
  for (const p of participants) {
    balances[p.id] = 0;
  }

  // Process expenses
  for (const expense of expenses) {
    if (!expense || expense.amount <= 0) continue;

    const payerId = expense.payerId;
    balances[payerId] = (balances[payerId] || 0) + expense.amount;

    if (expense.splitMode === 'custom' && expense.customSplits && expense.customSplits.length > 0) {
      for (const split of expense.customSplits) {
        balances[split.participantId] = (balances[split.participantId] || 0) - split.amount;
      }
    } else {
      const involved =
        expense.involvedParticipantIds && expense.involvedParticipantIds.length > 0
          ? Array.from(new Set(expense.involvedParticipantIds))
          : participants.map((p) => p.id);

      if (involved.length > 0) {
        // Distribute in exact integer cents to eliminate floating-point drift
        const totalCents = Math.round(expense.amount * 100);
        const baseCents = Math.floor(totalCents / involved.length);
        const remainder = totalCents % involved.length;

        for (let i = 0; i < involved.length; i++) {
          const pId = involved[i];
          const shareCents = baseCents + (i < remainder ? 1 : 0);
          balances[pId] = (balances[pId] || 0) - shareCents / 100;
        }
      }
    }
  }

  // Process settlements
  for (const settlement of settlements) {
    if (!settlement || settlement.amount <= 0) continue;
    // Debtor paid settlement -> increases their balance towards 0
    balances[settlement.fromParticipantId] =
      (balances[settlement.fromParticipantId] || 0) + settlement.amount;
    // Creditor received settlement -> decreases their credit towards 0
    balances[settlement.toParticipantId] =
      (balances[settlement.toParticipantId] || 0) - settlement.amount;
  }

  // Round balances to 2 decimal places and clean -0
  for (const id of Object.keys(balances)) {
    const val = Math.round((balances[id] + Number.EPSILON) * 100) / 100;
    balances[id] = Object.is(val, -0) ? 0 : val;
  }

  return balances;
}

/**
 * Builds pairwise direct net debt matrix:
 * directDebts.get(u)?.get(v) is the amount u directly owes v.
 */
function buildPairwiseDebts(
  participants: Participant[],
  expenses: Expense[],
  settlements: Settlement[]
): Map<string, Map<string, number>> {
  const debts = new Map<string, Map<string, number>>();

  const getSubMap = (u: string): Map<string, number> => {
    let map = debts.get(u);
    if (!map) {
      map = new Map<string, number>();
      debts.set(u, map);
    }
    return map;
  };

  const addDebt = (from: string, to: string, amount: number) => {
    if (from === to || Math.abs(amount) < 0.0001) return;
    const map = getSubMap(from);
    map.set(to, (map.get(to) || 0) + amount);
  };

  // Add debts from expenses
  for (const expense of expenses) {
    if (!expense || expense.amount <= 0) continue;
    const payerId = expense.payerId;

    if (expense.splitMode === 'custom' && expense.customSplits && expense.customSplits.length > 0) {
      for (const split of expense.customSplits) {
        if (split.participantId !== payerId) {
          addDebt(split.participantId, payerId, split.amount);
        }
      }
    } else {
      const involved =
        expense.involvedParticipantIds && expense.involvedParticipantIds.length > 0
          ? Array.from(new Set(expense.involvedParticipantIds))
          : participants.map((p) => p.id);

      if (involved.length > 0) {
        const totalCents = Math.round(expense.amount * 100);
        const baseCents = Math.floor(totalCents / involved.length);
        const remainder = totalCents % involved.length;

        for (let i = 0; i < involved.length; i++) {
          const pId = involved[i];
          if (pId !== payerId) {
            const share = (baseCents + (i < remainder ? 1 : 0)) / 100;
            addDebt(pId, payerId, share);
          }
        }
      }
    }
  }

  // Offsets from settlements
  for (const settlement of settlements) {
    if (!settlement || settlement.amount <= 0) continue;
    addDebt(settlement.fromParticipantId, settlement.toParticipantId, -settlement.amount);
  }

  // Net pairwise bilateral debts
  const netDebts = new Map<string, Map<string, number>>();
  const allIds = new Set<string>();
  debts.forEach((subMap, u) => {
    allIds.add(u);
    subMap.forEach((_, v) => allIds.add(v));
  });

  const ids = Array.from(allIds);
  for (let i = 0; i < ids.length; i++) {
    for (let j = i + 1; j < ids.length; j++) {
      const u = ids[i];
      const v = ids[j];
      const uToV = debts.get(u)?.get(v) || 0;
      const vToU = debts.get(v)?.get(u) || 0;
      const diff = uToV - vToU;

      if (diff > 0.005) {
        let uMap = netDebts.get(u);
        if (!uMap) {
          uMap = new Map();
          netDebts.set(u, uMap);
        }
        uMap.set(v, Math.round((diff + Number.EPSILON) * 100) / 100);
      } else if (diff < -0.005) {
        let vMap = netDebts.get(v);
        if (!vMap) {
          vMap = new Map();
          netDebts.set(v, vMap);
        }
        vMap.set(u, Math.round((-diff + Number.EPSILON) * 100) / 100);
      }
    }
  }

  return netDebts;
}

/**
 * Generates clear, multi-language explanation strings (AZ, RU, EN)
 * for a simplified transfer, explaining direct payments or collapsed/redirected routes.
 */
function generateExplanation(
  fromId: string,
  toId: string,
  amount: number,
  currency: string,
  participants: Participant[],
  remainingPairwise: Map<string, Map<string, number>>
): TransferExplanation {
  const nameMap = new Map(participants.map((p) => [p.id, p.name]));
  const fromName = nameMap.get(fromId) || fromId;
  const toName = nameMap.get(toId) || toId;
  const formattedAmount = formatAmount(amount, currency);

  const directOwed = remainingPairwise.get(fromId)?.get(toId) || 0;

  if (directOwed >= amount - 0.01) {
    // Pure direct payment
    remainingPairwise.get(fromId)?.set(toId, Math.max(0, directOwed - amount));
    return {
      az: `${fromName} ${toName} şəxsinə ${formattedAmount} ödəməlidir.`,
      ru: `${fromName} переводит ${toName} ${formattedAmount}.`,
      en: `${fromName} pays ${toName} ${formattedAmount}.`
    };
  }

  // Search for an intermediate participant M where from owes M and M owes to
  let intermediateId: string | null = null;
  const fromDebts = remainingPairwise.get(fromId);

  if (fromDebts) {
    for (const [midId, debtToMid] of fromDebts.entries()) {
      if (debtToMid > 0.01 && midId !== toId) {
        const midDebts = remainingPairwise.get(midId);
        if (midDebts && (midDebts.get(toId) || 0) > 0.01) {
          intermediateId = midId;
          break;
        }
      }
    }
  }

  if (intermediateId) {
    const midName = nameMap.get(intermediateId) || intermediateId;
    const debtFromToMid = fromDebts?.get(intermediateId) || 0;
    const debtMidToTo = remainingPairwise.get(intermediateId)?.get(toId) || 0;
    const deduct = Math.min(amount, debtFromToMid, debtMidToTo);

    fromDebts?.set(intermediateId, Math.max(0, debtFromToMid - deduct));
    remainingPairwise.get(intermediateId)?.set(toId, Math.max(0, debtMidToTo - deduct));

    return {
      az: `Əməliyyatların sayını azaltmaq üçün ${fromName} tərəfindən ${midName} şəxsinə olan ${formattedAmount} borcu ${toName} şəxsinə yönləndirildi.`,
      ru: `Для сокращения количества переводов долг ${fromName} перед ${midName} (${formattedAmount}) перенаправлен ${toName}.`,
      en: `To simplify transactions, ${fromName}'s debt to ${midName} of ${formattedAmount} was redirected to ${toName}.`
    };
  }

  // If no exact intermediate link with M->to, check if from owed any M
  if (fromDebts) {
    for (const [midId, debtToMid] of fromDebts.entries()) {
      if (debtToMid > 0.01 && midId !== toId) {
        const midName = nameMap.get(midId) || midId;
        fromDebts.set(midId, Math.max(0, debtToMid - amount));
        return {
          az: `Əməliyyatların sayını azaltmaq üçün ${fromName} tərəfindən ${midName} şəxsinə olan ${formattedAmount} borcu ${toName} şəxsinə yönləndirildi.`,
          ru: `Для сокращения количества переводов долг ${fromName} перед ${midName} (${formattedAmount}) перенаправлен ${toName}.` ,
          en: `To simplify transactions, ${fromName}'s debt to ${midName} of ${formattedAmount} was redirected to ${toName}.`
        };
      }
    }
  }

  // General collapsed multi-party settlement
  return {
    az: `Əməliyyatların sayını azaltmaq üçün ${fromName} birbaşa ${toName} şəxsinə ${formattedAmount} ödəyir.`,
    ru: `Для оптимизации расчетов ${fromName} переводит ${formattedAmount} напрямую ${toName}.`,
    en: `To optimize settlements, ${fromName} pays ${formattedAmount} directly to ${toName}.`
  };
}

/**
 * Simplifies debts across participants using Greedy Cash Flow minimization.
 * Minimizes the total number of transactions required to settle all debts.
 * Generates human-friendly explanations in AZ, RU, and EN for each transfer.
 */
export function simplifyDebts(
  participants: Participant[],
  expenses: Expense[],
  settlements: Settlement[] = [],
  currency: string = '₼',
  _lang: Language = 'az'
): SimplifiedTransfer[] {
  const balances = calculateBalances(participants, expenses, settlements);

  // Debtor queue: balance < 0 (owes money)
  const debtors: { id: string; amount: number }[] = [];
  // Creditor queue: balance > 0 (is owed money)
  const creditors: { id: string; amount: number }[] = [];

  for (const [id, balance] of Object.entries(balances)) {
    if (balance < -0.005) {
      debtors.push({ id, amount: Math.round(Math.abs(balance) * 100) / 100 });
    } else if (balance > 0.005) {
      creditors.push({ id, amount: Math.round(balance * 100) / 100 });
    }
  }

  // Sort descending by amount
  debtors.sort((a, b) => b.amount - a.amount);
  creditors.sort((a, b) => b.amount - a.amount);

  const remainingPairwise = buildPairwiseDebts(participants, expenses, settlements);
  const transfers: SimplifiedTransfer[] = [];

  while (debtors.length > 0 && creditors.length > 0) {
    const debtor = debtors[0];
    const creditor = creditors[0];

    const settleAmount = Math.round(Math.min(debtor.amount, creditor.amount) * 100) / 100;

    if (settleAmount < 0.01) {
      break;
    }

    const explanation = generateExplanation(
      debtor.id,
      creditor.id,
      settleAmount,
      currency,
      participants,
      remainingPairwise
    );

    transfers.push({
      fromParticipantId: debtor.id,
      toParticipantId: creditor.id,
      amount: settleAmount,
      explanation
    });

    debtor.amount = Math.round((debtor.amount - settleAmount) * 100) / 100;
    creditor.amount = Math.round((creditor.amount - settleAmount) * 100) / 100;

    if (debtor.amount < 0.01) {
      debtors.shift();
    }
    if (creditor.amount < 0.01) {
      creditors.shift();
    }

    debtors.sort((a, b) => b.amount - a.amount);
    creditors.sort((a, b) => b.amount - a.amount);
  }

  return transfers;
}
