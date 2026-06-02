/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type AccountType = 'Checking' | 'Savings' | 'Credit Card' | 'Brokerage' | 'Cash Wallet' | 'Transit Pass';

export type InstitutionType = 'Cash' | 'Bank Card' | 'BRT Card' | 'Bank Account';

export interface BankAccount {
  id: string;
  bankName: string;
  accountName: string;
  accountType: AccountType;
  accountNumber: string;
  balance: number;
  lastSynced: string; // ISO string
  isConnected: boolean;
  color: string; // Hex or tailwind class
  iban?: string;
  institutionType?: InstitutionType;
  cardPhysicality?: 'Physical' | 'Virtual';
  cardNumber?: string;
}

export interface Transaction {
  id: string;
  accountId: string;
  bankName: string;
  accountName: string;
  amount: number;
  description: string;
  category: string;
  date: string; // ISO string
  type: 'income' | 'expense';
  isNew?: boolean; // For flashing list feedback
  isRecurring?: boolean;
  recurringInterval?: 'weekly' | 'biweekly' | 'monthly';
}

export interface Budget {
  id?: number;
  category: string;
  limit: number;
  spent: number;
  color: string;
}


export interface BankSyncLog {
  id: string;
  bankName: string;
  timestamp: string;
  status: 'success' | 'failed' | 'connecting';
  transactionsCount: number;
  amount: number;
}

export interface SavingsGoal {
  id: string;
  name: string;
  targetAmount: number;
  linkedAccountIds: string[];
  color: string; // Tailwind color class e.g., 'blue', 'emerald', 'amber', 'rose', 'indigo'
  category: string; // category classification tag
  deadline?: string; // Target complete date (YYYY-MM-DD or ISO)
}

export interface LoanPayment {
  id: string;
  amount: number;
  date: string;
  notes?: string;
  accountId?: string;
}

export interface Loan {
  id: string;
  type: 'lent' | 'borrowed';
  personName: string;
  amount: number;
  dateIssued: string;
  dueDate: string;
  status: 'active' | 'settled';
  notes?: string;
  payments?: LoanPayment[]; // Array of payments made over time
  accountId?: string; // Account used for initial transaction
}

