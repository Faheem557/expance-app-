/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, useContext, useState, useEffect } from 'react';
import { BankAccount, Transaction, Budget, SavingsGoal, Loan } from '../types';
import {
  INITIAL_ACCOUNTS,
  INITIAL_TRANSACTIONS,
  INITIAL_BUDGETS,
  CATEGORIES,
} from '../initialData';

// ─── Context Shape ────────────────────────────────────────────────────────────

interface AppContextValue {
  // State
  accounts: BankAccount[];
  transactions: Transaction[];
  budgets: Budget[];
  goals: SavingsGoal[];
  categories: string[];
  loans: Loan[];
  notifications: Transaction[];
  isLinkModalOpen: boolean;
  activeSyncingId: string | null;
  isNotificationsMuted: boolean;
  editingAccount: BankAccount | null;

  // Computed
  totalAssets: number;
  totalLiabilities: number;
  netWorth: number;

  // Handlers
  addTransactionPayload: (tx: Transaction) => void;
  handleSyncAccount: (id: string) => void;
  handleUnlinkAccount: (id: string) => void;
  handleConnectAccounts: (newAccounts: BankAccount[]) => void;
  handleUpdateAccount: (acc: BankAccount) => void;
  handleAccountTransfer: (fromId: string, toId: string, amount: number, note?: string) => { success: boolean; message?: string };
  handleUpdateBudgetLimit: (category: string, limit: number) => void;
  handleAddGoal: (data: Omit<SavingsGoal, 'id'>) => void;
  handleDeleteGoal: (id: string) => void;
  handleDeleteTransaction: (id: string) => void;
  handleClearAllTransactions: () => void;
  handleCreateCategory: (name: string, limit?: number, color?: string) => { success: boolean; message?: string };
  handleAddLoan: (data: Omit<Loan, 'id'>) => void;
  handleUpdateLoanStatus: (id: string, status: 'active' | 'settled') => void;
  handleAddLoanPayment: (loanId: string, amount: number, accountId?: string, notes?: string) => void;
  handleDeleteLoan: (id: string) => void;
  handleResetBudgets: () => void;
  handleResetToDefaults: () => void;
  handleDismissNotification: (id: string) => void;
  setIsLinkModalOpen: (open: boolean) => void;
  setEditingAccount: (acc: BankAccount | null) => void;
  setIsNotificationsMuted: (muted: boolean) => void;
}

const AppContext = createContext<AppContextValue | null>(null);

export function useAppContext(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useAppContext must be used within AppProvider');
  return ctx;
}

// ─── Provider ─────────────────────────────────────────────────────────────────

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [accounts, setAccounts] = useState<BankAccount[]>(() => {
    const saved = localStorage.getItem('budget_sync_accounts');
    const list = saved ? JSON.parse(saved) : INITIAL_ACCOUNTS;
    return list.filter((a: BankAccount) =>
      !['acct-chase-checking', 'acct-chase-savings', 'acct-summit-card'].includes(a.id)
    );
  });

  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    const saved = localStorage.getItem('budget_sync_transactions');
    const list = saved ? JSON.parse(saved) : INITIAL_TRANSACTIONS;
    return list.filter((t: Transaction) =>
      !['tx-1','tx-2','tx-3','tx-4','tx-5','tx-6','tx-7','tx-8'].includes(t.id)
    );
  });

  const [budgets, setBudgets] = useState<Budget[]>(() => {
    const saved = localStorage.getItem('budget_sync_budgets');
    if (saved) {
      const parsed = JSON.parse(saved) as Budget[];
      const hasMockTx = localStorage.getItem('budget_sync_transactions')
        ? JSON.parse(localStorage.getItem('budget_sync_transactions')!).some((t: any) =>
            ['tx-1', 'tx-2', 'tx-3'].includes(t.id)
          )
        : false;
      if (hasMockTx) return INITIAL_BUDGETS;
      return parsed;
    }
    return [...INITIAL_BUDGETS];
  });

  const [goals, setGoals] = useState<SavingsGoal[]>(() => {
    const saved = localStorage.getItem('budget_sync_goals');
    const list = saved ? JSON.parse(saved) : [];
    return list.filter((g: SavingsGoal) =>
      !['goal-emergency', 'goal-vacation'].includes(g.id)
    );
  });

  const [categories, setCategories] = useState<string[]>(() => {
    const saved = localStorage.getItem('budget_sync_categories');
    return saved ? JSON.parse(saved) : CATEGORIES;
  });

  const [loans, setLoans] = useState<Loan[]>(() => {
    const saved = localStorage.getItem('budget_sync_loans');
    return saved ? JSON.parse(saved) : [];
  });

  const [notifications, setNotifications] = useState<Transaction[]>([]);
  const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);
  const [activeSyncingId, setActiveSyncingId] = useState<string | null>(null);
  const [isNotificationsMuted, setIsNotificationsMuted] = useState(false);
  const [editingAccount, setEditingAccount] = useState<BankAccount | null>(null);

  // Persist to localStorage
  useEffect(() => { localStorage.setItem('budget_sync_accounts', JSON.stringify(accounts)); }, [accounts]);
  useEffect(() => { localStorage.setItem('budget_sync_transactions', JSON.stringify(transactions)); }, [transactions]);
  useEffect(() => { localStorage.setItem('budget_sync_budgets', JSON.stringify(budgets)); }, [budgets]);
  useEffect(() => { localStorage.setItem('budget_sync_goals', JSON.stringify(goals)); }, [goals]);
  useEffect(() => { localStorage.setItem('budget_sync_categories', JSON.stringify(categories)); }, [categories]);
  useEffect(() => { localStorage.setItem('budget_sync_loans', JSON.stringify(loans)); }, [loans]);

  // ─── Helpers ────────────────────────────────────────────────────────────────

  const recalcBudgetSpend = (updatedTxs: Transaction[]) => {
    setBudgets(prev =>
      prev.map(b => ({
        ...b,
        spent: updatedTxs
          .filter(t => t.category === b.category && t.type === 'expense')
          .reduce((sum, t) => sum + t.amount, 0),
      }))
    );
  };

  const addTransactionPayload = (newTx: Transaction) => {
    setTransactions(prev => {
      const updated = [newTx, ...prev];
      recalcBudgetSpend(updated);
      return updated;
    });

    setAccounts(prev =>
      prev.map(acc => {
        if (acc.id !== newTx.accountId) return acc;
        let updatedBalance = acc.balance;
        const isCredit = acc.accountType === 'Credit Card';
        if (newTx.type === 'expense') {
          updatedBalance = isCredit ? updatedBalance + newTx.amount : updatedBalance - newTx.amount;
        } else {
          updatedBalance = isCredit ? updatedBalance - newTx.amount : updatedBalance + newTx.amount;
        }
        return { ...acc, balance: Math.max(0, updatedBalance), lastSynced: new Date().toISOString() };
      })
    );

    if (!isNotificationsMuted) {
      setNotifications(prev => [...prev.filter(n => n.id !== newTx.id), newTx]);
    }
  };

  const handleSyncAccount = (accountId: string) => {
    setActiveSyncingId(accountId);
    setTimeout(() => {
      setAccounts(prev =>
        prev.map(acc =>
          acc.id === accountId ? { ...acc, lastSynced: new Date().toISOString() } : acc
        )
      );
      setActiveSyncingId(null);
    }, 1000);
  };

  const handleUnlinkAccount = (accountId: string) => {
    if (confirm('Are you sure you want to unlink this account? Your current budget balances will adjust accordingly.')) {
      const remainingAccs = accounts.filter(a => a.id !== accountId);
      const remainingTxs = transactions.filter(t => t.accountId !== accountId);
      setAccounts(remainingAccs);
      setTransactions(remainingTxs);
      recalcBudgetSpend(remainingTxs);
    }
  };

  const handleConnectAccounts = (newAccounts: BankAccount[]) => {
    const filtered = newAccounts.filter(na => !accounts.some(ea => ea.id === na.id));
    setAccounts(prev => [...prev, ...filtered]);
  };

  const handleUpdateAccount = (updatedAccount: BankAccount) => {
    setAccounts(prev => prev.map(a => a.id === updatedAccount.id ? updatedAccount : a));
    setTransactions(prev =>
      prev.map(t =>
        t.accountId === updatedAccount.id
          ? { ...t, bankName: updatedAccount.bankName, accountName: updatedAccount.accountName }
          : t
      )
    );
  };

  const handleAccountTransfer = (fromAccountId: string, toAccountId: string, amount: number, note?: string) => {
    const fromAcc = accounts.find(a => a.id === fromAccountId);
    const toAcc = accounts.find(a => a.id === toAccountId);
    if (!fromAcc || !toAcc) return { success: false, message: 'Source or destination account was not found.' };

    const timestamp = new Date().toISOString();

    const fromTx: Transaction = {
      id: `tx-tf-out-${Math.random().toString(36).substr(2, 9)}`,
      accountId: fromAccountId,
      bankName: fromAcc.bankName,
      accountName: fromAcc.accountName,
      amount,
      description: `Transfer to ${toAcc.bankName} (${toAcc.accountName})${note ? ` - ${note}` : ''}`,
      category: 'Other',
      date: timestamp,
      type: 'expense',
    };

    const toTx: Transaction = {
      id: `tx-tf-in-${Math.random().toString(36).substr(2, 9)}`,
      accountId: toAccountId,
      bankName: toAcc.bankName,
      accountName: toAcc.accountName,
      amount,
      description: `Transfer from ${fromAcc.bankName} (${fromAcc.accountName})${note ? ` - ${note}` : ''}`,
      category: 'Other',
      date: timestamp,
      type: 'income',
    };

    setAccounts(prev =>
      prev.map(acc => {
        let updatedBalance = acc.balance;
        const isCredit = acc.accountType === 'Credit Card';
        if (acc.id === fromAccountId) {
          updatedBalance = isCredit ? updatedBalance + amount : updatedBalance - amount;
          return { ...acc, balance: Math.max(0, updatedBalance), lastSynced: timestamp };
        }
        if (acc.id === toAccountId) {
          updatedBalance = isCredit ? updatedBalance - amount : updatedBalance + amount;
          return { ...acc, balance: Math.max(0, updatedBalance), lastSynced: timestamp };
        }
        return acc;
      })
    );

    setTransactions(prev => {
      const updated = [fromTx, toTx, ...prev];
      recalcBudgetSpend(updated);
      return updated;
    });

    return { success: true };
  };

  const handleUpdateBudgetLimit = (category: string, limit: number) => {
    setBudgets(prev => prev.map(b => b.category === category ? { ...b, limit } : b));
  };

  const handleAddGoal = (goalData: Omit<SavingsGoal, 'id'>) => {
    const newGoal: SavingsGoal = { ...goalData, id: `goal-${Math.random().toString(36).substr(2, 9)}` };
    setGoals(prev => [...prev, newGoal]);
  };

  const handleDeleteGoal = (goalId: string) => {
    setGoals(prev => prev.filter(g => g.id !== goalId));
  };

  const handleDeleteTransaction = (id: string) => {
    const txToDelete = transactions.find(t => t.id === id);
    if (!txToDelete) return;
    if (confirm(`Remove this transaction ("${txToDelete.description}")? Related budget metrics and account balances will be reversed.`)) {
      const remainingTxs = transactions.filter(t => t.id !== id);
      setTransactions(remainingTxs);
      recalcBudgetSpend(remainingTxs);
      setAccounts(prev =>
        prev.map(acc => {
          if (acc.id !== txToDelete.accountId) return acc;
          let updatedBalance = acc.balance;
          const isCredit = acc.accountType === 'Credit Card';
          if (txToDelete.type === 'expense') {
            updatedBalance = isCredit ? updatedBalance - txToDelete.amount : updatedBalance + txToDelete.amount;
          } else {
            updatedBalance = isCredit ? updatedBalance + txToDelete.amount : updatedBalance - txToDelete.amount;
          }
          return { ...acc, balance: Math.max(0, updatedBalance), lastSynced: new Date().toISOString() };
        })
      );
    }
  };

  const handleClearAllTransactions = () => {
    if (confirm('Clear entire transaction history? Connected financial accounts and savings goals will be preserved.')) {
      setTransactions([]);
      recalcBudgetSpend([]);
    }
  };

  const handleCreateCategory = (categoryName: string, initialLimit: number = 0, color: string = '#8b5cf6') => {
    const trimmed = categoryName.trim();
    if (categories.some(c => c.toLowerCase() === trimmed.toLowerCase())) {
      return { success: false, message: 'This category already exists.' };
    }
    setCategories(prev => [...prev, trimmed]);
    setBudgets(prev => [...prev, { category: trimmed, limit: initialLimit, spent: 0, color }]);
    return { success: true };
  };

  const handleAddLoan = (loanData: Omit<Loan, 'id'>) => {
    const newLoan: Loan = { ...loanData, id: `loan-${Math.random().toString(36).substr(2, 9)}` };
    if (newLoan.accountId) {
      setAccounts(prev =>
        prev.map(acc => {
          if (acc.id !== newLoan.accountId) return acc;
          const isCredit = acc.accountType === 'Credit Card';
          let updated = acc.balance;
          updated = newLoan.type === 'lent'
            ? (isCredit ? updated + newLoan.amount : updated - newLoan.amount)
            : (isCredit ? updated - newLoan.amount : updated + newLoan.amount);
          return { ...acc, balance: Math.max(0, updated) };
        })
      );
    }
    setLoans(prev => [...prev, newLoan]);
  };

  const handleUpdateLoanStatus = (id: string, status: 'active' | 'settled') => {
    setLoans(prev => prev.map(l => l.id === id ? { ...l, status } : l));
  };

  const handleAddLoanPayment = (loanId: string, paymentAmount: number, accountId?: string, notes?: string) => {
    const newPayment = {
      id: `pay-${Math.random().toString(36).substr(2, 9)}`,
      amount: paymentAmount,
      date: new Date().toISOString(),
      notes,
      accountId,
    };
    const targetLoan = loans.find(l => l.id === loanId);
    if (!targetLoan) return;

    if (accountId) {
      setAccounts(prev =>
        prev.map(acc => {
          if (acc.id !== accountId) return acc;
          const isCredit = acc.accountType === 'Credit Card';
          let updated = acc.balance;
          updated = targetLoan.type === 'lent'
            ? (isCredit ? updated - paymentAmount : updated + paymentAmount)
            : (isCredit ? updated + paymentAmount : updated - paymentAmount);
          return { ...acc, balance: Math.max(0, updated) };
        })
      );
    }

    setLoans(prev =>
      prev.map(l => {
        if (l.id !== loanId) return l;
        const newPayments = [...(l.payments || []), newPayment];
        const totalPaid = newPayments.reduce((sum, p) => sum + p.amount, 0);
        return { ...l, payments: newPayments, status: totalPaid >= l.amount ? 'settled' : l.status };
      })
    );
  };

  const handleDeleteLoan = (id: string) => {
    setLoans(prev => prev.filter(l => l.id !== id));
  };

  const handleResetBudgets = () => {
    setBudgets(INITIAL_BUDGETS.map(b => ({ ...b, spent: 0 })));
    setCategories(CATEGORIES);
  };

  const handleResetToDefaults = () => {
    if (confirm('Clear all accounts, transactions lists, and savings goals?')) {
      localStorage.removeItem('budget_sync_accounts');
      localStorage.removeItem('budget_sync_transactions');
      localStorage.removeItem('budget_sync_budgets');
      localStorage.removeItem('budget_sync_goals');
      localStorage.removeItem('budget_sync_categories');
      localStorage.removeItem('budget_sync_loans');
      setAccounts([]);
      setTransactions([]);
      setCategories(CATEGORIES);
      setLoans([]);
      setBudgets(INITIAL_BUDGETS.map(b => ({ ...b, spent: 0 })));
      setGoals([]);
      setNotifications([]);
    }
  };

  const handleDismissNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  // ─── Computed ───────────────────────────────────────────────────────────────
  const totalAssets = accounts
    .filter(a => a.accountType !== 'Credit Card')
    .reduce((sum, a) => sum + a.balance, 0);

  const totalLiabilities = accounts
    .filter(a => a.accountType === 'Credit Card')
    .reduce((sum, a) => sum + a.balance, 0);

  const netWorth = totalAssets - totalLiabilities;

  return (
    <AppContext.Provider value={{
      accounts, transactions, budgets, goals, categories, loans,
      notifications, isLinkModalOpen, activeSyncingId, isNotificationsMuted, editingAccount,
      totalAssets, totalLiabilities, netWorth,
      addTransactionPayload, handleSyncAccount, handleUnlinkAccount,
      handleConnectAccounts, handleUpdateAccount, handleAccountTransfer,
      handleUpdateBudgetLimit, handleAddGoal, handleDeleteGoal,
      handleDeleteTransaction, handleClearAllTransactions, handleCreateCategory,
      handleAddLoan, handleUpdateLoanStatus, handleAddLoanPayment, handleDeleteLoan,
      handleResetBudgets, handleResetToDefaults, handleDismissNotification,
      setIsLinkModalOpen, setEditingAccount, setIsNotificationsMuted,
    }}>
      {children}
    </AppContext.Provider>
  );
}
