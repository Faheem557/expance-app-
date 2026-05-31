/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BankAccount, Transaction, Budget } from './types';

export const INITIAL_ACCOUNTS: BankAccount[] = [
  {
    id: 'acct-chase-checking',
    bankName: 'Chase Bank',
    accountName: 'Premier Checking',
    accountType: 'Checking',
    accountNumber: '•••• 4820',
    balance: 5420.50,
    lastSynced: new Date(Date.now() - 5 * 60 * 1000).toISOString(), // 5 minutes ago
    isConnected: true,
    color: 'bg-blue-600 border-blue-700',
  },
  {
    id: 'acct-chase-savings',
    bankName: 'Chase Bank',
    accountName: 'Sapphire Savings',
    accountType: 'Savings',
    accountNumber: '•••• 9152',
    balance: 24350.75,
    lastSynced: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
    isConnected: true,
    color: 'bg-indigo-600 border-indigo-700',
  },
  {
    id: 'acct-summit-card',
    bankName: 'Summit Visa',
    accountName: 'Elite Cash Visa',
    accountType: 'Credit Card',
    accountNumber: '•••• 8831',
    balance: 840.20, // Negative for credit cards (or positive statement)
    lastSynced: new Date(Date.now() - 15 * 60 * 1000).toISOString(), // 15 mins ago
    isConnected: true,
    color: 'bg-zinc-800 border-zinc-950',
  },
];

export const AVAILABLE_SIMULATED_BANKS = [
  {
    id: 'bank-chase',
    name: 'Chase Bank',
    logoColor: 'text-blue-600',
    borderColor: 'border-blue-100 hover:border-blue-300 hover:bg-blue-50/20',
    accounts: [
      { name: 'Premier Checking', type: 'Checking', num: '•••• 4820', bal: 5420.50 },
      { name: 'Sapphire Savings', type: 'Savings', num: '•••• 9152', bal: 24350.75 },
    ]
  },
  {
    id: 'bank-fidelity',
    name: 'Fidelity Investments',
    logoColor: 'text-green-600',
    borderColor: 'border-green-100 hover:border-green-300 hover:bg-green-50/20',
    accounts: [
      { name: 'Active Brokerage Account', type: 'Brokerage', num: '•••• 2109', bal: 125900.55 },
      { name: 'Fidelity Cash Reserve', type: 'Savings', num: '•••• 0014', bal: 15410.22 }
    ]
  },
  {
    id: 'bank-summit',
    name: 'Summit Visa',
    logoColor: 'text-red-600',
    borderColor: 'border-red-100 hover:border-red-300 hover:bg-red-50/20',
    accounts: [
      { name: 'Elite Cash Visa', type: 'Credit Card', num: '•••• 8831', bal: 840.20 }
    ]
  },
  {
    id: 'bank-navy',
    name: 'Navy Federal',
    logoColor: 'text-teal-600',
    borderColor: 'border-teal-100 hover:border-teal-300 hover:bg-teal-50/20',
    accounts: [
      { name: 'Flagship Checking', type: 'Checking', num: '•••• 3099', bal: 2150.40 },
      { name: 'NFCU Share Savings', type: 'Savings', num: '•••• 7741', bal: 8900.00 }
    ]
  }
];

export const INITIAL_TRANSACTIONS: Transaction[] = [
  {
    id: 'tx-1',
    accountId: 'acct-chase-checking',
    bankName: 'Chase Bank',
    accountName: 'Premier Checking',
    amount: 154.20,
    description: 'Whole Foods Market',
    category: 'Food & Groceries',
    date: new Date(Date.now() - 3 * 3600 * 1000).toISOString(), // 3 hours ago
    type: 'expense',
  },
  {
    id: 'tx-2',
    accountId: 'acct-summit-card',
    bankName: 'Summit Visa',
    accountName: 'Elite Cash Visa',
    amount: 12.50,
    description: 'Starbucks Coffee',
    category: 'Dining Out',
    date: new Date(Date.now() - 6 * 3600 * 1000).toISOString(), // 6 hours ago
    type: 'expense',
  },
  {
    id: 'tx-3',
    accountId: 'acct-chase-checking',
    bankName: 'Chase Bank',
    accountName: 'Premier Checking',
    amount: 2200.00,
    description: 'Employer Payroll / Direct Deposit',
    category: 'Income',
    date: new Date(Date.now() - 1 * 24 * 3600 * 1000).toISOString(), // 1 day ago
    type: 'income',
  },
  {
    id: 'tx-4',
    accountId: 'acct-summit-card',
    bankName: 'Summit Visa',
    accountName: 'Elite Cash Visa',
    amount: 84.50,
    description: 'Exxon Mobil Fuel',
    category: 'Transportation',
    date: new Date(Date.now() - 1.5 * 24 * 3600 * 1000).toISOString(),
    type: 'expense',
  },
  {
    id: 'tx-5',
    accountId: 'acct-summit-card',
    bankName: 'Summit Visa',
    accountName: 'Elite Cash Visa',
    amount: 15.99,
    description: 'Netflix Subscription',
    category: 'Entertainment',
    date: new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString(),
    type: 'expense',
    isRecurring: true,
    recurringInterval: 'monthly',
  },
  {
    id: 'tx-6',
    accountId: 'acct-chase-checking',
    bankName: 'Chase Bank',
    accountName: 'Premier Checking',
    amount: 120.00,
    description: 'Comcast Internet',
    category: 'Utilities & Bills',
    date: new Date(Date.now() - 3 * 24 * 3600 * 1000).toISOString(),
    type: 'expense',
    isRecurring: true,
    recurringInterval: 'monthly',
  },
  {
    id: 'tx-7',
    accountId: 'acct-summit-card',
    bankName: 'Summit Visa',
    accountName: 'Elite Cash Visa',
    amount: 110.45,
    description: 'Target Superstore',
    category: 'Shopping',
    date: new Date(Date.now() - 4 * 24 * 3600 * 1000).toISOString(),
    type: 'expense',
  },
  {
    id: 'tx-8',
    accountId: 'acct-chase-checking',
    bankName: 'Chase Bank',
    accountName: 'Premier Checking',
    amount: 45.00,
    description: 'Uber Ride',
    category: 'Transportation',
    date: new Date(Date.now() - 5 * 24 * 3600 * 1000).toISOString(),
    type: 'expense',
  },
];

export const INITIAL_BUDGETS: Budget[] = [
  { category: 'Food & Groceries', limit: 600, spent: 154.20, color: '#3b82f6' }, // Blue
  { category: 'Dining Out', limit: 300, spent: 12.50, color: '#10b981' }, // Emerald
  { category: 'Utilities & Bills', limit: 400, spent: 120.00, color: '#f59e0b' }, // Amber
  { category: 'Transportation', limit: 250, spent: 129.50, color: '#84cc16' }, // Lime
  { category: 'Entertainment', limit: 150, spent: 15.99, color: '#ec4899' }, // Pink
  { category: 'Shopping', limit: 350, spent: 110.45, color: '#8b5cf6' }, // Purple
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
