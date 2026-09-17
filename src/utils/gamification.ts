import { Expense, Language, Participant, Settlement } from '../types';
import { calculateBalances } from './debtCalculator';

export type BadgeId = 'sponsor' | 'lightning' | 'tomorrow' | 'party';

export interface BadgeDefinition {
  id: BadgeId;
  icon: string;
  titleKey: string;
  descKey: string;
  titles: Record<Language, string>;
  descriptions: Record<Language, string>;
}

export const BADGE_DEFINITIONS: Record<BadgeId, BadgeDefinition> = {
  sponsor: {
    id: 'sponsor',
    icon: '⚡',
    titleKey: 'badge.sponsor.title',
    descKey: 'badge.sponsor.desc',
    titles: {
      az: 'Gecənin sponsoru',
      ru: 'Спонсор вечера',
      en: 'Sponsor of the Night',
    },
    descriptions: {
      az: 'Yığıncaqda ən çox xərc çəkən iştirakçı',
      ru: 'Участник с наибольшей суммой оплат',
      en: 'Participant who paid the highest total amount',
    },
  },
  lightning: {
    id: 'lightning',
    icon: '⚡',
    titleKey: 'badge.lightning.title',
    descKey: 'badge.lightning.desc',
    titles: {
      az: 'İldırım ödəyici',
      ru: 'Молниеносный плательщик',
      en: 'Lightning Settler',
    },
    descriptions: {
      az: 'Borclarını ən tez və ən çox bağlayan iştirakçı',
      ru: 'Быстрее и чаще всех закрывает свои долги',
      en: 'Participant who settles debts fastest and most frequently',
    },
  },
  tomorrow: {
    id: 'tomorrow',
    icon: '🐢',
    titleKey: 'badge.tomorrow.title',
    descKey: 'badge.tomorrow.desc',
    titles: {
      az: '"Sabah ataram" bəy',
      ru: 'Мистер "Завтра скину"',
      en: '"I\'ll pay tomorrow" Sir',
    },
    descriptions: {
      az: 'Ən köhnə ödənməmiş borcu olan iştirakçı',
      ru: 'Участник с самым старым непогашенным долгом',
      en: 'Participant with the oldest outstanding debt',
    },
  },
  party: {
    id: 'party',
    icon: '🍕',
    titleKey: 'badge.party.title',
    descKey: 'badge.party.desc',
    titles: {
      az: 'Məclisin canı',
      ru: 'Душа компании',
      en: 'Life of the Party',
    },
    descriptions: {
      az: 'Ən çox sayda xərcdə iştirak edən şəxs',
      ru: 'Участвовал(а) в наибольшем числе общих чеков',
      en: 'Participant involved in the most gathering expenses',
    },
  },
};

export interface BadgeItem {
  id: BadgeId;
  icon: string;
  name: string;
  title: string;
  description: string;
  titleKey: string;
  descKey: string;
}

export interface ParticipantStats {
  participant: Participant;
  totalSpent: number;
  totalSettledAmount: number;
  settlementsCount: number;
  gatheringsAttended: number;
  netBalance: number;
  badges: BadgeItem[];
}

export interface GroupGamificationStats {
  totalExpensesCount: number;
  totalExpensesAmount: number;
  totalSettlementsCount: number;
  totalSettlementsAmount: number;
  activeBadgesCount: number;
}

function createBadgeItem(id: BadgeId, lang: Language = 'az'): BadgeItem {
  const def = BADGE_DEFINITIONS[id];
  const name = def.titles[lang] || def.titles.az;
  const description = def.descriptions[lang] || def.descriptions.az;

  return {
    id,
    icon: def.icon,
    name,
    title: name,
    description,
    titleKey: def.titleKey,
    descKey: def.descKey,
  };
}

/**
 * Computes dynamic badges awarded to participants based on real-time room metrics:
 * 1. ⚡ "Gecənin sponsoru": Paid the highest total amount of expenses (sum > 0).
 * 2. ⚡ "İldırım ödəyici": Settled debts most frequently / highest count of settlements initiated.
 * 3. 🐢 ""Sabah ataram" bəy": Participant with outstanding negative balance and oldest pending debt.
 * 4. 🍕 "Məclisin canı": Involved in the highest number of gatherings/expenses.
 */
export function computeBadges(
  participants: Participant[],
  expenses: Expense[],
  settlements: Settlement[] = [],
  lang: Language = 'az'
): Record<string, BadgeItem[]> {
  const badgeMap: Record<string, BadgeItem[]> = {};

  for (const p of participants) {
    badgeMap[p.id] = [];
  }

  if (participants.length === 0) {
    return badgeMap;
  }

  // Calculate current net balances
  const balances = calculateBalances(participants, expenses, settlements);

  // 1. "Gecənin sponsoru" (Highest total spent > 0)
  const spentByParticipant: Record<string, number> = {};
  for (const p of participants) {
    spentByParticipant[p.id] = 0;
  }
  for (const expense of expenses) {
    if (expense && expense.amount > 0 && expense.payerId) {
      spentByParticipant[expense.payerId] =
        (spentByParticipant[expense.payerId] || 0) + expense.amount;
    }
  }

  const maxSpent = Math.max(0, ...Object.values(spentByParticipant));
  if (maxSpent > 0) {
    for (const p of participants) {
      if (spentByParticipant[p.id] === maxSpent) {
        badgeMap[p.id].push(createBadgeItem('sponsor', lang));
      }
    }
  }

  // 2. "İldırım ödəyici" (Most settlements initiated > 0)
  const settlementCounts: Record<string, number> = {};
  for (const p of participants) {
    settlementCounts[p.id] = 0;
  }
  for (const settlement of settlements) {
    if (settlement && settlement.amount > 0 && settlement.fromParticipantId) {
      settlementCounts[settlement.fromParticipantId] =
        (settlementCounts[settlement.fromParticipantId] || 0) + 1;
    }
  }

  const maxSettlements = Math.max(0, ...Object.values(settlementCounts));
  if (maxSettlements > 0) {
    for (const p of participants) {
      if (settlementCounts[p.id] === maxSettlements) {
        badgeMap[p.id].push(createBadgeItem('lightning', lang));
      }
    }
  }

  // 3. ""Sabah ataram" bəy" (Outstanding negative balance + oldest pending debt)
  // Only participants with net balance < -0.001 are eligible
  const debtorsWithOldestDebt: Array<{
    participantId: string;
    oldestTimestamp: number;
    debtAmount: number;
  }> = [];

  for (const p of participants) {
    const net = balances[p.id] || 0;
    if (net < -0.001) {
      // Find the participant's earliest expense that contributed to their debt
      let earliestTime: number | null = null;

      for (const expense of expenses) {
        if (!expense || expense.amount <= 0) continue;

        let wasDebtorInExpense = false;
        if (expense.splitMode === 'custom' && expense.customSplits) {
          const split = expense.customSplits.find(
            (s) => s.participantId === p.id && s.amount > 0
          );
          if (split && expense.payerId !== p.id) {
            wasDebtorInExpense = true;
          }
        } else {
          const involved =
            expense.involvedParticipantIds && expense.involvedParticipantIds.length > 0
              ? expense.involvedParticipantIds
              : participants.map((pt) => pt.id);

          if (involved.includes(p.id) && expense.payerId !== p.id) {
            wasDebtorInExpense = true;
          }
        }

        if (wasDebtorInExpense) {
          const expenseTimestamp =
            expense.createdAt ||
            (expense.date ? new Date(expense.date).getTime() : 0);

          if (earliestTime === null || expenseTimestamp < earliestTime) {
            earliestTime = expenseTimestamp;
          }
        }
      }

      // If no specific debtor expense found (e.g. from complex settlement order), use any expense they attended
      if (earliestTime === null) {
        for (const expense of expenses) {
          const expenseTimestamp =
            expense.createdAt ||
            (expense.date ? new Date(expense.date).getTime() : 0);
          if (earliestTime === null || expenseTimestamp < earliestTime) {
            earliestTime = expenseTimestamp;
          }
        }
      }

      if (earliestTime !== null) {
        debtorsWithOldestDebt.push({
          participantId: p.id,
          oldestTimestamp: earliestTime,
          debtAmount: Math.abs(net),
        });
      }
    }
  }

  if (debtorsWithOldestDebt.length > 0) {
    // Sort by oldest timestamp ascending (earliest first).
    // In case of exact timestamp tie, person with larger debt comes first.
    debtorsWithOldestDebt.sort((a, b) => {
      if (a.oldestTimestamp !== b.oldestTimestamp) {
        return a.oldestTimestamp - b.oldestTimestamp;
      }
      return b.debtAmount - a.debtAmount;
    });

    const oldestTime = debtorsWithOldestDebt[0].oldestTimestamp;
    // Award to all who tie for the oldest pending debt timestamp
    for (const debtor of debtorsWithOldestDebt) {
      if (debtor.oldestTimestamp === oldestTime) {
        badgeMap[debtor.participantId].push(createBadgeItem('tomorrow', lang));
      }
    }
  }

  // 4. "Məclisin canı" (Involved in the highest number of expenses > 0)
  const gatheringsCount: Record<string, number> = {};
  for (const p of participants) {
    gatheringsCount[p.id] = 0;
  }

  for (const expense of expenses) {
    if (!expense) continue;

    for (const p of participants) {
      const isPayer = expense.payerId === p.id;
      const isInvolved =
        expense.involvedParticipantIds && expense.involvedParticipantIds.length > 0
          ? expense.involvedParticipantIds.includes(p.id)
          : true;
      const isCustomInvolved =
        expense.customSplits?.some((s) => s.participantId === p.id && s.amount > 0) || false;

      if (isPayer || isInvolved || isCustomInvolved) {
        gatheringsCount[p.id] = (gatheringsCount[p.id] || 0) + 1;
      }
    }
  }

  const maxGatherings = Math.max(0, ...Object.values(gatheringsCount));
  if (maxGatherings > 0) {
    for (const p of participants) {
      if (gatheringsCount[p.id] === maxGatherings) {
        badgeMap[p.id].push(createBadgeItem('party', lang));
      }
    }
  }

  return badgeMap;
}

/**
 * Computes individual statistics for all participants.
 */
export function computeParticipantStats(
  participants: Participant[],
  expenses: Expense[],
  settlements: Settlement[] = [],
  lang: Language = 'az'
): ParticipantStats[] {
  const badges = computeBadges(participants, expenses, settlements, lang);
  const balances = calculateBalances(participants, expenses, settlements);

  return participants.map((p) => {
    // Total spent
    const totalSpent = expenses
      .filter((e) => e && e.payerId === p.id)
      .reduce((sum, e) => sum + (e.amount || 0), 0);

    // Total settlements initiated by this participant
    const userSettlements = settlements.filter(
      (s) => s && s.fromParticipantId === p.id
    );
    const totalSettledAmount = userSettlements.reduce(
      (sum, s) => sum + (s.amount || 0),
      0
    );
    const settlementsCount = userSettlements.length;

    // Gatherings attended
    const gatheringsAttended = expenses.filter((e) => {
      if (!e) return false;
      const isPayer = e.payerId === p.id;
      const isInvolved =
        e.involvedParticipantIds && e.involvedParticipantIds.length > 0
          ? e.involvedParticipantIds.includes(p.id)
          : true;
      const isCustomInvolved =
        e.customSplits?.some((s) => s.participantId === p.id && s.amount > 0) || false;
      return isPayer || isInvolved || isCustomInvolved;
    }).length;

    const netBalance = balances[p.id] || 0;

    return {
      participant: p,
      totalSpent: Math.round(totalSpent * 100) / 100,
      totalSettledAmount: Math.round(totalSettledAmount * 100) / 100,
      settlementsCount,
      gatheringsAttended,
      netBalance,
      badges: badges[p.id] || [],
    };
  });
}

/**
 * Computes aggregate room-level gamification statistics.
 */
export function computeGroupStats(
  expenses: Expense[],
  settlements: Settlement[] = [],
  badges: Record<string, BadgeItem[]> = {}
): GroupGamificationStats {
  const totalExpensesCount = expenses.length;
  const totalExpensesAmount = expenses.reduce(
    (sum, e) => sum + (e.amount || 0),
    0
  );

  const totalSettlementsCount = settlements.length;
  const totalSettlementsAmount = settlements.reduce(
    (sum, s) => sum + (s.amount || 0),
    0
  );

  let activeBadgesCount = 0;
  for (const bList of Object.values(badges)) {
    activeBadgesCount += bList.length;
  }

  return {
    totalExpensesCount,
    totalExpensesAmount: Math.round(totalExpensesAmount * 100) / 100,
    totalSettlementsCount,
    totalSettlementsAmount: Math.round(totalSettlementsAmount * 100) / 100,
    activeBadgesCount,
  };
}
