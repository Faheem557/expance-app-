/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BankAccount, Transaction, Budget } from './types';

export const INITIAL_ACCOUNTS: BankAccount[] = [];

export const AVAILABLE_SIMULATED_BANKS = [];

export const INITIAL_TRANSACTIONS: Transaction[] = [];

export const INITIAL_BUDGETS: Budget[] = [
  { category: 'Food & Groceries', limit: 600, spent: 0, color: '#3b82f6' }, // Blue
  { category: 'Dining Out', limit: 300, spent: 0, color: '#10b981' }, // Emerald
  { category: 'Utilities & Bills', limit: 400, spent: 0, color: '#f59e0b' }, // Amber
  { category: 'Transportation', limit: 250, spent: 0, color: '#84cc16' }, // Lime
  { category: 'Entertainment', limit: 150, spent: 0, color: '#ec4899' }, // Pink
  { category: 'Shopping', limit: 350, spent: 0, color: '#8b5cf6' }, // Purple
];

export const CATEGORIES = [
  'Food & Groceries',
  'Dining Out',
  'Utilities & Bills',
  'Transportation',
  'Entertainment',
  'Shopping',
  'Income',
  'Other'
];

interface RandomMerchant {
  name: string;
  category: string;
  amountMin: number;
  amountMax: number;
  type: 'expense' | 'income';
}

const MERCHANTS: RandomMerchant[] = [
  { name: 'Starbucks Coffee', category: 'Dining Out', amountMin: 4.50, amountMax: 18.20, type: 'expense' },
  { name: 'UberEats Delivery', category: 'Dining Out', amountMin: 22.00, amountMax: 65.00, type: 'expense' },
  { name: 'Whole Foods Market', category: 'Food & Groceries', amountMin: 45.00, amountMax: 180.00, type: 'expense' },
  { name: 'Trader Joe\'s', category: 'Food & Groceries', amountMin: 30.00, amountMax: 120.00, type: 'expense' },
  { name: 'Amazon Prime Shop', category: 'Shopping', amountMin: 8.99, amountMax: 145.00, type: 'expense' },
  { name: 'Nike Retail', category: 'Shopping', amountMin: 75.00, amountMax: 180.00, type: 'expense' },
  { name: 'Steam Game Purchase', category: 'Entertainment', amountMin: 9.99, amountMax: 59.99, type: 'expense' },
  { name: 'Regal Cinemas Cinema', category: 'Entertainment', amountMin: 14.00, amountMax: 35.00, type: 'expense' },
  { name: 'Chevron Gas Station', category: 'Transportation', amountMin: 35.00, amountMax: 70.00, type: 'expense' },
  { name: 'Uber Ride', category: 'Transportation', amountMin: 12.00, amountMax: 48.00, type: 'expense' },
  { name: 'Spotify Premium', category: 'Utilities & Bills', amountMin: 11.99, amountMax: 11.99, type: 'expense' },
  { name: 'Electric Utility Bill', category: 'Utilities & Bills', amountMin: 65.00, amountMax: 140.00, type: 'expense' },
  { name: 'Venmo P2P Transfer', category: 'Income', amountMin: 15.00, amountMax: 150.00, type: 'income' },
  { name: 'Employer Pay DirectDep', category: 'Income', amountMin: 1200.00, amountMax: 2800.00, type: 'income' },
  { name: 'Vanguard Dividend Payment', category: 'Income', amountMin: 18.50, amountMax: 140.00, type: 'income' },
  { name: 'Local Farmers Market', category: 'Food & Groceries', amountMin: 12.00, amountMax: 45.00, type: 'expense' },
  { name: 'Apple One Subscription', category: 'Utilities & Bills', amountMin: 19.95, amountMax: 37.95, type: 'expense' },
];

export function getRandomTransaction(accountId: string, bankName: string, accountName: string): Transaction {
  const isIncome = Math.random() < 0.15; // 15% chance of income
  const matchingMerchants = MERCHANTS.filter(m => isIncome ? m.type === 'income' : m.type === 'expense');
  const merchant = matchingMerchants[Math.floor(Math.random() * matchingMerchants.length)];

  const range = merchant.amountMax - merchant.amountMin;
  const amount = Math.round((merchant.amountMin + Math.random() * range) * 100) / 100;

  return {
    id: `tx-gen-${Math.random().toString(36).substr(2, 9)}`,
    accountId,
    bankName,
    accountName,
    amount,
    description: merchant.name,
    category: merchant.category,
    date: new Date().toISOString(),
    type: merchant.type,
    isNew: true,
  };
}
