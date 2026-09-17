import { describe, it, expect } from 'vitest';
import { calculateBalances, simplifyDebts } from './debtCalculator';
import { Participant, Expense, Settlement } from '../types';

describe('Debt Calculator & Simplification', () => {
  const participants: Participant[] = [
    { id: '1', name: 'Elvin', avatarColor: '#006A60' },
    { id: '2', name: 'Rauf', avatarColor: '#456179' },
    { id: '3', name: 'Çingiz', avatarColor: '#705D00' }
  ];

  it('calculates net balances for equal split expense correctly', () => {
    const expenses: Expense[] = [
      {
        id: 'e1',
        title: 'Tarqovıda kofe',
        amount: 30,
        payerId: '1', // Elvin paid 30
        date: '2026-09-17',
        splitMode: 'equal',
        involvedParticipantIds: ['1', '2', '3'], // 10 each
        createdAt: Date.now()
      }
    ];

    const balances = calculateBalances(participants, expenses, []);
    expect(balances['1']).toBe(20); // Elvin is +20
    expect(balances['2']).toBe(-10); // Rauf owes 10
    expect(balances['3']).toBe(-10); // Chingiz owes 10
  });

  it('calculates net balances with custom splits correctly', () => {
    const expenses: Expense[] = [
      {
        id: 'e1',
        title: 'Qəlyanaltı',
        amount: 50,
        payerId: '1', // Elvin paid 50
        date: '2026-09-17',
        splitMode: 'custom',
        involvedParticipantIds: ['1', '2', '3'],
        customSplits: [
          { participantId: '1', amount: 10 },
          { participantId: '2', amount: 25 },
          { participantId: '3', amount: 15 }
        ],
        createdAt: Date.now()
      }
    ];

    const balances = calculateBalances(participants, expenses, []);
    expect(balances['1']).toBe(40); // 50 - 10 = +40
    expect(balances['2']).toBe(-25); // owes 25
    expect(balances['3']).toBe(-15); // owes 15
  });

  it('correctly incorporates settlements into net balance calculations', () => {
    const expenses: Expense[] = [
      {
        id: 'e1',
        title: 'Nahar',
        amount: 30,
        payerId: '1', // Elvin paid 30 for Elvin and Rauf
        date: '2026-09-17',
        splitMode: 'equal',
        involvedParticipantIds: ['1', '2'], // 15 each
        createdAt: 1
      }
    ];

    // Rauf pays Elvin 10
    const settlements: Settlement[] = [
      {
        id: 's1',
        fromParticipantId: '2', // Rauf
        toParticipantId: '1',   // Elvin
        amount: 10,
        date: '2026-09-17',
        createdAt: 2
      }
    ];

    const balances = calculateBalances(participants, expenses, settlements);
    expect(balances['1']).toBe(5);  // Elvin is still owed 5
    expect(balances['2']).toBe(-5); // Rauf owes only 5
    expect(balances['3']).toBe(0);  // Chingiz not involved
  });

  it('simplifies triangular debt correctly (A->B and B->C => A->C)', () => {
    // Expense 1: Rauf paid 15 for Elvin (Elvin owes Rauf 15)
    // Expense 2: Chingiz paid 15 for Rauf (Rauf owes Chingiz 15)
    // Net: Elvin: -15, Rauf: 0, Chingiz: +15
    // Simplified: Elvin -> Chingiz 15
    const expenses: Expense[] = [
      {
        id: 'e1',
        title: 'Lunch',
        amount: 15,
        payerId: '2', // Rauf
        date: '2026-09-17',
        splitMode: 'custom',
        involvedParticipantIds: ['1'],
        customSplits: [{ participantId: '1', amount: 15 }],
        createdAt: 1
      },
      {
        id: 'e2',
        title: 'Coffee',
        amount: 15,
        payerId: '3', // Chingiz
        date: '2026-09-17',
        splitMode: 'custom',
        involvedParticipantIds: ['2'],
        customSplits: [{ participantId: '2', amount: 15 }],
        createdAt: 2
      }
    ];

    const transfers = simplifyDebts(participants, expenses, [], '₼', 'az');
    expect(transfers).toHaveLength(1);
    expect(transfers[0].fromParticipantId).toBe('1'); // Elvin
    expect(transfers[0].toParticipantId).toBe('3');   // Chingiz
    expect(transfers[0].amount).toBe(15);
    expect(transfers[0].explanation.az).toBeDefined();
    expect(transfers[0].explanation.ru).toBeDefined();
    expect(transfers[0].explanation.en).toBeDefined();
  });

  it('generates direct debt explanation when debts are directly bilateral', () => {
    const expenses: Expense[] = [
      {
        id: 'e1',
        title: 'Taksi',
        amount: 20,
        payerId: '1', // Elvin paid 20 for Elvin and Rauf
        date: '2026-09-17',
        splitMode: 'equal',
        involvedParticipantIds: ['1', '2'], // 10 each
        createdAt: 1
      }
    ];

    const transfers = simplifyDebts(participants, expenses, [], '₼', 'az');
    expect(transfers).toHaveLength(1);
    expect(transfers[0].fromParticipantId).toBe('2'); // Rauf
    expect(transfers[0].toParticipantId).toBe('1');   // Elvin
    expect(transfers[0].amount).toBe(10);
    expect(transfers[0].explanation.az).toContain('Rauf');
    expect(transfers[0].explanation.az).toContain('Elvin');
    expect(transfers[0].explanation.az).toContain('10 ₼');
  });

  it('returns empty transfers array when all debts are settled', () => {
    const expenses: Expense[] = [
      {
        id: 'e1',
        title: 'Kofe',
        amount: 20,
        payerId: '1',
        date: '2026-09-17',
        splitMode: 'equal',
        involvedParticipantIds: ['1', '2'],
        createdAt: 1
      }
    ];
    const settlements: Settlement[] = [
      {
        id: 's1',
        fromParticipantId: '2',
        toParticipantId: '1',
        amount: 10,
        date: '2026-09-17',
        createdAt: 2
      }
    ];

    const transfers = simplifyDebts(participants, expenses, settlements, '₼', 'az');
    expect(transfers).toHaveLength(0);
  });

  it('handles 4 participants with complex multi-way debts and simplifies accurately', () => {
    const team: Participant[] = [
      { id: '1', name: 'Elvin', avatarColor: '#006A60' },
      { id: '2', name: 'Rauf', avatarColor: '#456179' },
      { id: '3', name: 'Çingiz', avatarColor: '#705D00' },
      { id: '4', name: 'Leyla', avatarColor: '#8C4E00' }
    ];

    // Expense 1: Elvin pays 100 for all 4 (25 each)
    // Expense 2: Leyla pays 40 for Leyla and Rauf (20 each)
    const expenses: Expense[] = [
      {
        id: 'e1',
        title: 'Restoran',
        amount: 100,
        payerId: '1',
        date: '2026-09-17',
        splitMode: 'equal',
        involvedParticipantIds: ['1', '2', '3', '4'],
        createdAt: 1
      },
      {
        id: 'e2',
        title: 'Desert',
        amount: 40,
        payerId: '4',
        date: '2026-09-17',
        splitMode: 'equal',
        involvedParticipantIds: ['2', '4'],
        createdAt: 2
      }
    ];

    // Balances:
    // Elvin: +100 - 25 = +75
    // Rauf: -25 - 20 = -45
    // Chingiz: -25
    // Leyla: -25 + 40 - 20 = -5
    // Total debts = 45 + 25 + 5 = 75. Total credits = 75.
    const balances = calculateBalances(team, expenses, []);
    expect(balances['1']).toBe(75);
    expect(balances['2']).toBe(-45);
    expect(balances['3']).toBe(-25);
    expect(balances['4']).toBe(-5);

    const transfers = simplifyDebts(team, expenses, [], '₼', 'az');
    // All 3 debtors pay Elvin directly
    expect(transfers).toHaveLength(3);
    const totalTransferred = transfers.reduce((sum, t) => sum + t.amount, 0);
    expect(totalTransferred).toBe(75);
    transfers.forEach(t => {
      expect(t.toParticipantId).toBe('1');
    });
  });

  it('conserves cents on uneven splits (e.g. 10 split 3 ways)', () => {
    const expenses: Expense[] = [
      {
        id: 'e1',
        title: 'Çay',
        amount: 10,
        payerId: '1', // Elvin
        date: '2026-09-17',
        splitMode: 'equal',
        involvedParticipantIds: ['1', '2', '3'],
        createdAt: 1
      }
    ];

    const balances = calculateBalances(participants, expenses, []);
    // Sum of balances must equal 0
    const sum = Object.values(balances).reduce((acc, val) => acc + val, 0);
    expect(Math.abs(sum)).toBeLessThan(0.01);

    const transfers = simplifyDebts(participants, expenses, [], '₼', 'az');
    const totalTransfers = transfers.reduce((acc, t) => acc + t.amount, 0);
    expect(Math.round(totalTransfers * 100) / 100).toBeCloseTo(balances['1'], 2);
  });
});
