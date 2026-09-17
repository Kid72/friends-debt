import { describe, it, expect } from 'vitest';
import {
  computeBadges,
  computeParticipantStats,
  computeGroupStats,
} from './gamification';
import { Participant, Expense, Settlement } from '../types';

describe('Gamification Engine', () => {
  const participants: Participant[] = [
    { id: '1', name: 'Elvin', avatarColor: '#14b8a6' },
    { id: '2', name: 'Rauf', avatarColor: '#f59e0b' },
    { id: '3', name: 'Nigar', avatarColor: '#ec4899' },
  ];

  it('awards "Gecənin sponsoru" to participant with highest spending', () => {
    const expenses: Expense[] = [
      {
        id: 'e1',
        payerId: '1',
        amount: 100,
        date: '2026-09-17',
        title: 'Dinner',
        splitMode: 'equal',
        involvedParticipantIds: ['1', '2'],
        createdAt: 1000,
      },
      {
        id: 'e2',
        payerId: '2',
        amount: 40,
        date: '2026-09-17',
        title: 'Drinks',
        splitMode: 'equal',
        involvedParticipantIds: ['1', '2', '3'],
        createdAt: 2000,
      },
    ];

    const badges = computeBadges(participants, expenses, []);
    expect(badges['1']).toContainEqual(expect.objectContaining({ id: 'sponsor' }));
    expect(badges['2']).not.toContainEqual(expect.objectContaining({ id: 'sponsor' }));
  });

  it('awards "İldırım ödəyici" to participant with most settlements', () => {
    const expenses: Expense[] = [
      {
        id: 'e1',
        payerId: '1',
        amount: 150,
        date: '2026-09-15',
        title: 'Dinner',
        splitMode: 'equal',
        involvedParticipantIds: ['1', '2', '3'],
        createdAt: 1000,
      },
    ];

    const settlements: Settlement[] = [
      {
        id: 's1',
        fromParticipantId: '2',
        toParticipantId: '1',
        amount: 25,
        date: '2026-09-16',
        createdAt: 2000,
      },
      {
        id: 's2',
        fromParticipantId: '2',
        toParticipantId: '1',
        amount: 25,
        date: '2026-09-17',
        createdAt: 3000,
      },
      {
        id: 's3',
        fromParticipantId: '3',
        toParticipantId: '1',
        amount: 50,
        date: '2026-09-17',
        createdAt: 4000,
      },
    ];

    const badges = computeBadges(participants, expenses, settlements);
    expect(badges['2']).toContainEqual(expect.objectContaining({ id: 'lightning' }));
    expect(badges['3']).not.toContainEqual(expect.objectContaining({ id: 'lightning' }));
  });

  it('awards "Sabah ataram" bəy to participant with negative balance and oldest pending debt', () => {
    // Expense e1 is older (createdAt: 1000). Rauf (2) owes for e1.
    // Expense e2 is newer (createdAt: 5000). Nigar (3) owes for e2.
    const expenses: Expense[] = [
      {
        id: 'e1',
        payerId: '1',
        amount: 100,
        date: '2026-09-10',
        title: 'Old Dinner',
        splitMode: 'equal',
        involvedParticipantIds: ['1', '2'], // Rauf owes 50 from Sept 10
        createdAt: 1000,
      },
      {
        id: 'e2',
        payerId: '1',
        amount: 60,
        date: '2026-09-15',
        title: 'New Lunch',
        splitMode: 'equal',
        involvedParticipantIds: ['1', '3'], // Nigar owes 30 from Sept 15
        createdAt: 5000,
      },
    ];

    const badges = computeBadges(participants, expenses, []);
    // Rauf has oldest pending debt and negative balance
    expect(badges['2']).toContainEqual(expect.objectContaining({ id: 'tomorrow' }));
    expect(badges['3']).not.toContainEqual(expect.objectContaining({ id: 'tomorrow' }));
    expect(badges['1']).not.toContainEqual(expect.objectContaining({ id: 'tomorrow' }));
  });

  it('does NOT award "Sabah ataram" bəy if debts are settled or balance is zero/positive', () => {
    const expenses: Expense[] = [
      {
        id: 'e1',
        payerId: '1',
        amount: 100,
        date: '2026-09-10',
        title: 'Dinner',
        splitMode: 'equal',
        involvedParticipantIds: ['1', '2'],
        createdAt: 1000,
      },
    ];

    const settlements: Settlement[] = [
      {
        id: 's1',
        fromParticipantId: '2',
        toParticipantId: '1',
        amount: 50,
        date: '2026-09-11',
        createdAt: 2000,
      },
    ];

    const badges = computeBadges(participants, expenses, settlements);
    expect(badges['2']).not.toContainEqual(expect.objectContaining({ id: 'tomorrow' }));
  });

  it('awards "Məclisin canı" to participant involved in the highest number of expenses', () => {
    const expenses: Expense[] = [
      {
        id: 'e1',
        payerId: '1',
        amount: 50,
        date: '2026-09-10',
        title: 'Dinner',
        splitMode: 'equal',
        involvedParticipantIds: ['1', '3'],
        createdAt: 1000,
      },
      {
        id: 'e2',
        payerId: '2',
        amount: 50,
        date: '2026-09-11',
        title: 'Cinema',
        splitMode: 'equal',
        involvedParticipantIds: ['2', '3'],
        createdAt: 2000,
      },
      {
        id: 'e3',
        payerId: '1',
        amount: 50,
        date: '2026-09-12',
        title: 'Cafe',
        splitMode: 'equal',
        involvedParticipantIds: ['1', '2', '3'],
        createdAt: 3000,
      },
    ];

    // Nigar (3) is involved in all 3 expenses
    // Elvin (1) in 2 expenses
    // Rauf (2) in 2 expenses
    const badges = computeBadges(participants, expenses, []);
    expect(badges['3']).toContainEqual(expect.objectContaining({ id: 'party' }));
    expect(badges['1']).not.toContainEqual(expect.objectContaining({ id: 'party' }));
    expect(badges['2']).not.toContainEqual(expect.objectContaining({ id: 'party' }));
  });

  it('handles ties by awarding badges to all tied top performers', () => {
    const expenses: Expense[] = [
      {
        id: 'e1',
        payerId: '1',
        amount: 100,
        date: '2026-09-10',
        title: 'Dinner',
        splitMode: 'equal',
        involvedParticipantIds: ['1', '2'],
        createdAt: 1000,
      },
      {
        id: 'e2',
        payerId: '2',
        amount: 100,
        date: '2026-09-11',
        title: 'Bar',
        splitMode: 'equal',
        involvedParticipantIds: ['1', '2'],
        createdAt: 2000,
      },
    ];

    const badges = computeBadges(participants, expenses, []);
    expect(badges['1']).toContainEqual(expect.objectContaining({ id: 'sponsor' }));
    expect(badges['2']).toContainEqual(expect.objectContaining({ id: 'sponsor' }));
  });

  it('computes accurate participant statistics', () => {
    const expenses: Expense[] = [
      {
        id: 'e1',
        payerId: '1',
        amount: 100,
        date: '2026-09-10',
        title: 'Dinner',
        splitMode: 'equal',
        involvedParticipantIds: ['1', '2'],
        createdAt: 1000,
      },
    ];

    const settlements: Settlement[] = [
      {
        id: 's1',
        fromParticipantId: '2',
        toParticipantId: '1',
        amount: 20,
        date: '2026-09-11',
        createdAt: 2000,
      },
    ];

    const stats = computeParticipantStats(participants, expenses, settlements);
    const elvinStats = stats.find((s) => s.participant.id === '1')!;
    const raufStats = stats.find((s) => s.participant.id === '2')!;

    expect(elvinStats.totalSpent).toBe(100);
    expect(elvinStats.gatheringsAttended).toBe(1);
    expect(elvinStats.netBalance).toBe(30); // 50 owed to him - 20 settled = 30

    expect(raufStats.totalSpent).toBe(0);
    expect(raufStats.totalSettledAmount).toBe(20);
    expect(raufStats.settlementsCount).toBe(1);
    expect(raufStats.netBalance).toBe(-30);
  });

  it('localizes badge names and descriptions across languages', () => {
    const expenses: Expense[] = [
      {
        id: 'e1',
        payerId: '1',
        amount: 100,
        date: '2026-09-10',
        title: 'Dinner',
        splitMode: 'equal',
        involvedParticipantIds: ['1', '2'],
        createdAt: 1000,
      },
    ];

    const azBadges = computeBadges(participants, expenses, [], 'az');
    expect(azBadges['1'][0].name).toBe('Gecənin sponsoru');

    const ruBadges = computeBadges(participants, expenses, [], 'ru');
    expect(ruBadges['1'][0].name).toBe('Спонсор вечера');

    const enBadges = computeBadges(participants, expenses, [], 'en');
    expect(enBadges['1'][0].name).toBe('Sponsor of the Night');
  });

  it('computes group aggregate stats', () => {
    const expenses: Expense[] = [
      {
        id: 'e1',
        payerId: '1',
        amount: 100,
        date: '2026-09-10',
        title: 'Dinner',
        splitMode: 'equal',
        involvedParticipantIds: ['1', '2'],
        createdAt: 1000,
      },
      {
        id: 'e2',
        payerId: '2',
        amount: 50,
        date: '2026-09-11',
        title: 'Lunch',
        splitMode: 'equal',
        involvedParticipantIds: ['1', '2'],
        createdAt: 2000,
      },
    ];

    const settlements: Settlement[] = [
      {
        id: 's1',
        fromParticipantId: '2',
        toParticipantId: '1',
        amount: 25,
        date: '2026-09-12',
        createdAt: 3000,
      },
    ];

    const badges = computeBadges(participants, expenses, settlements);
    const groupStats = computeGroupStats(expenses, settlements, badges);

    expect(groupStats.totalExpensesCount).toBe(2);
    expect(groupStats.totalExpensesAmount).toBe(150);
    expect(groupStats.totalSettlementsCount).toBe(1);
    expect(groupStats.totalSettlementsAmount).toBe(25);
    expect(groupStats.activeBadgesCount).toBeGreaterThan(0);
  });
});
