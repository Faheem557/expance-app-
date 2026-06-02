/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Field mappers between Laravel snake_case API responses
 * and the frontend camelCase TypeScript types.
 */

import {
  BankAccount,
  Budget,
  Loan,
  LoanPayment,
  SavingsGoal,
  Transaction,
} from '../types';

// ─── API → Frontend ───────────────────────────────────────────────────────────

export function mapAccount(raw: any): BankAccount {
  return {
    id: String(raw.id),
    bankName: raw.bank_name,
    accountName: raw.account_name,
    accountType: raw.account_type,
    accountNumber: raw.account_number ?? '',
    balance: Number(raw.balance),
    lastSynced: raw.last_synced ?? new Date().toISOString(),
    isConnected: Boolean(raw.is_connected),
    color: raw.color ?? '#6366f1',
    iban: raw.iban ?? undefined,
    institutionType: raw.institution_type ?? undefined,
    cardPhysicality: raw.card_physicality ?? undefined,
    cardNumber: raw.card_number ?? undefined,
  };
}

export function mapTransaction(raw: any): Transaction {
  return {
    id: String(raw.id),
    accountId: String(raw.account_id),
    bankName: raw.bank_name,
    accountName: raw.account_name,
    amount: Number(raw.amount),
    description: raw.description ?? '',
    category: raw.category ?? 'Other',
    date: raw.date,
    type: raw.type as 'income' | 'expense',
    isNew: Boolean(raw.is_new),
    isRecurring: Boolean(raw.is_recurring),
    recurringInterval: raw.recurring_interval ?? undefined,
  };
}

export function mapBudget(raw: any): Budget {
  return {
    id: raw.id,
    category: raw.category,
    limit: Number(raw.limit_amount),
    spent: Number(raw.spent),
    color: raw.color ?? '#8b5cf6',
  };
}

export function mapGoal(raw: any): SavingsGoal {
  return {
    id: String(raw.id),
    name: raw.name,
    targetAmount: Number(raw.target_amount),
    linkedAccountIds: (raw.accounts ?? []).map((a: any) => String(a.id)),
    color: raw.color ?? 'blue',
    category: raw.category ?? 'General',
    deadline: raw.deadline ?? undefined,
  };
}

export function mapLoanPayment(raw: any): LoanPayment {
  return {
    id: String(raw.id),
    amount: Number(raw.amount),
    date: raw.date,
    notes: raw.notes ?? undefined,
    accountId: raw.account_id ? String(raw.account_id) : undefined,
  };
}

export function mapLoan(raw: any): Loan {
  return {
    id: String(raw.id),
    type: raw.type as 'lent' | 'borrowed',
    personName: raw.person_name,
    amount: Number(raw.amount),
    dateIssued: raw.date_issued,
    dueDate: raw.due_date ?? '',
    status: raw.status as 'active' | 'settled',
    notes: raw.notes ?? undefined,
    accountId: raw.account_id ? String(raw.account_id) : undefined,
    payments: (raw.payments ?? []).map(mapLoanPayment),
  };
}

// ─── Frontend → API ───────────────────────────────────────────────────────────

export function accountToApi(acc: Partial<BankAccount>): Record<string, any> {
  return {
    bank_name: acc.bankName,
    account_name: acc.accountName,
    account_type: acc.accountType,
    account_number: acc.accountNumber,
    balance: acc.balance,
    color: acc.color,
    iban: acc.iban,
    institution_type: acc.institutionType,
    card_physicality: acc.cardPhysicality,
    card_number: acc.cardNumber,
  };
}

export function transactionToApi(tx: Partial<Transaction>): Record<string, any> {
  return {
    account_id: Number(tx.accountId),
    amount: tx.amount,
    description: tx.description,
    category: tx.category,
    date: tx.date,
    type: tx.type,
    is_new: tx.isNew ?? false,
    is_recurring: tx.isRecurring ?? false,
    recurring_interval: tx.recurringInterval ?? null,
  };
}
