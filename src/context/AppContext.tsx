/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { BankAccount, Transaction, Budget, SavingsGoal, Loan } from '../types';
import { INITIAL_BUDGETS, CATEGORIES } from '../initialData';
import { useAuthContext } from './AuthContext';
import {
  accountsApi, transactionsApi, budgetsApi,
  categoriesApi, goalsApi, loansApi, miscApi,
} from '../lib/api';
import {
  mapAccount, mapTransaction, mapBudget, mapGoal, mapLoan,
  accountToApi, transactionToApi, mapLoanPayment,
} from '../lib/mappers';

// ─── Context Shape ─────────────────────────────────────────────────────────────

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
  isLoading: boolean;
  apiError: string | null;

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
  dismissApiError: () => void;
}

const AppContext = createContext<AppContextValue | null>(null);

export function useAppContext(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useAppContext must be used within AppProvider');
  return ctx;
}

// ─── Provider ─────────────────────────────────────────────────────────────────

export function AppProvider({ children }: { children: React.ReactNode }) {
  const { token } = useAuthContext();

  // ── Data state (loaded from API) ──────────────────────────────────────────
  const [accounts, setAccounts] = useState<BankAccount[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [goals, setGoals] = useState<SavingsGoal[]>([]);
  const [categories, setCategories] = useState<string[]>(CATEGORIES);
  const [loans, setLoans] = useState<Loan[]>([]);

  // ── UI state ──────────────────────────────────────────────────────────────
  const [notifications, setNotifications] = useState<Transaction[]>([]);
  const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);
  const [activeSyncingId, setActiveSyncingId] = useState<string | null>(null);
  const [isNotificationsMuted, setIsNotificationsMuted] = useState(false);
  const [editingAccount, setEditingAccount] = useState<BankAccount | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  // ── Load all data when authenticated ─────────────────────────────────────
  useEffect(() => {
    if (!token) {
      setAccounts([]);
      setTransactions([]);
      setBudgets([]);
      setGoals([]);
      setCategories(CATEGORIES);
      setLoans([]);
      return;
    }

    const loadAll = async () => {
      setIsLoading(true);
      setApiError(null);
      try {
        const [accs, txs, buds, cats, gls, lns] = await Promise.all([
          accountsApi.list(),
          transactionsApi.list(),
          budgetsApi.list(),
          categoriesApi.list(),
          goalsApi.list(),
          loansApi.list(),
        ]);
        setAccounts(accs.map(mapAccount));
        setTransactions(txs.map(mapTransaction));
        setBudgets(buds.map(mapBudget));
        setCategories(cats.length > 0 ? cats.map((c: any) => c.name) : CATEGORIES);
        setGoals(gls.map(mapGoal));
        setLoans(lns.map(mapLoan));
      } catch (e: any) {
        setApiError(e.message ?? 'Failed to load data from server.');
      } finally {
        setIsLoading(false);
      }
    };

    loadAll();
  }, [token]);

  // ─── Helpers ───────────────────────────────────────────────────────────────

  const showError = (msg: string) => setApiError(msg);

  const recalcBudgetSpend = useCallback((updatedTxs: Transaction[]) => {
    setBudgets(prev =>
      prev.map(b => ({
        ...b,
        spent: updatedTxs
          .filter(t => t.category === b.category && t.type === 'expense')
          .reduce((sum, t) => sum + t.amount, 0),
      }))
    );
  }, []);

  // ─── Transaction Handlers ──────────────────────────────────────────────────

  const addTransactionPayload = useCallback((newTx: Transaction) => {
    // Optimistic update
    setTransactions(prev => {
      const updated = [newTx, ...prev];
      recalcBudgetSpend(updated);
      return updated;
    });
    setAccounts(prev =>
      prev.map(acc => {
        if (acc.id !== newTx.accountId) return acc;
        const isCredit = acc.accountType === 'Credit Card';
        let bal = acc.balance;
        bal = newTx.type === 'expense'
          ? (isCredit ? bal + newTx.amount : bal - newTx.amount)
          : (isCredit ? bal - newTx.amount : bal + newTx.amount);
        return { ...acc, balance: Math.max(0, bal), lastSynced: new Date().toISOString() };
      })
    );
    if (!isNotificationsMuted) {
      setNotifications(prev => [...prev.filter(n => n.id !== newTx.id), newTx]);
    }

    // API fire-and-forget: replace temp tx with API response
    transactionsApi.create(transactionToApi(newTx))
      .then(raw => {
        const created = mapTransaction(raw);
        setTransactions(prev => prev.map(t => t.id === newTx.id ? created : t));
      })
      .catch((e: any) => {
        // Rollback
        setTransactions(prev => prev.filter(t => t.id !== newTx.id));
        setAccounts(prev =>
          prev.map(acc => {
            if (acc.id !== newTx.accountId) return acc;
            const isCredit = acc.accountType === 'Credit Card';
            let bal = acc.balance;
            bal = newTx.type === 'expense'
              ? (isCredit ? bal - newTx.amount : bal + newTx.amount)
              : (isCredit ? bal + newTx.amount : bal - newTx.amount);
            return { ...acc, balance: bal };
          })
        );
        showError(e.message ?? 'Failed to save transaction.');
      });
  }, [isNotificationsMuted, recalcBudgetSpend]);

  const handleDeleteTransaction = useCallback((id: string) => {
    const txToDelete = transactions.find(t => t.id === id);
    if (!txToDelete) return;
    if (!confirm(`Remove "${txToDelete.description}"? Balance and budget metrics will be reversed.`)) return;

    // Optimistic
    const remaining = transactions.filter(t => t.id !== id);
    setTransactions(remaining);
    recalcBudgetSpend(remaining);
    setAccounts(prev =>
      prev.map(acc => {
        if (acc.id !== txToDelete.accountId) return acc;
        const isCredit = acc.accountType === 'Credit Card';
        let bal = acc.balance;
        bal = txToDelete.type === 'expense'
          ? (isCredit ? bal - txToDelete.amount : bal + txToDelete.amount)
          : (isCredit ? bal + txToDelete.amount : bal - txToDelete.amount);
        return { ...acc, balance: Math.max(0, bal), lastSynced: new Date().toISOString() };
      })
    );

    transactionsApi.remove(parseInt(id)).catch((e: any) => {
      // Rollback
      setTransactions(prev => [txToDelete, ...prev]);
      recalcBudgetSpend([txToDelete, ...transactions]);
      showError(e.message ?? 'Failed to delete transaction.');
    });
  }, [transactions, recalcBudgetSpend]);

  const handleClearAllTransactions = useCallback(() => {
    if (!confirm('Clear entire transaction history? Accounts and goals are preserved.')) return;

    const prevTxs = [...transactions];
    setTransactions([]);
    recalcBudgetSpend([]);

    transactionsApi.clearAll().catch((e: any) => {
      setTransactions(prevTxs);
      recalcBudgetSpend(prevTxs);
      showError(e.message ?? 'Failed to clear transactions.');
    });
  }, [transactions, recalcBudgetSpend]);

  // ─── Account Handlers ──────────────────────────────────────────────────────

  const handleConnectAccounts = useCallback((newAccounts: BankAccount[]) => {
    const filtered = newAccounts.filter(na => !accounts.some(ea => ea.id === na.id));
    if (filtered.length === 0) return;

    // Optimistic add
    setAccounts(prev => [...prev, ...filtered]);

    // Create each via API, replace temp with real
    filtered.forEach(acc => {
      accountsApi.create(accountToApi(acc))
        .then(raw => {
          const created = mapAccount(raw);
          setAccounts(prev => prev.map(a => a.id === acc.id ? created : a));
        })
        .catch((e: any) => {
          setAccounts(prev => prev.filter(a => a.id !== acc.id));
          showError(e.message ?? 'Failed to create account.');
        });
    });
  }, [accounts]);

  const handleUpdateAccount = useCallback((updatedAccount: BankAccount) => {
    // Optimistic
    setAccounts(prev => prev.map(a => a.id === updatedAccount.id ? updatedAccount : a));
    setTransactions(prev =>
      prev.map(t =>
        t.accountId === updatedAccount.id
          ? { ...t, bankName: updatedAccount.bankName, accountName: updatedAccount.accountName }
          : t
      )
    );

    accountsApi.update(parseInt(updatedAccount.id), accountToApi(updatedAccount))
      .catch((e: any) => showError(e.message ?? 'Failed to update account.'));
  }, []);

  const handleUnlinkAccount = useCallback((accountId: string) => {
    if (!confirm('Unlink this account? Its transactions will also be removed.')) return;

    const prevAccounts = [...accounts];
    const prevTxs = [...transactions];
    const remaining = transactions.filter(t => t.accountId !== accountId);

    setAccounts(prev => prev.filter(a => a.id !== accountId));
    setTransactions(remaining);
    recalcBudgetSpend(remaining);

    accountsApi.remove(parseInt(accountId)).catch((e: any) => {
      setAccounts(prevAccounts);
      setTransactions(prevTxs);
      recalcBudgetSpend(prevTxs);
      showError(e.message ?? 'Failed to unlink account.');
    });
  }, [accounts, transactions, recalcBudgetSpend]);

  const handleSyncAccount = useCallback((accountId: string) => {
    setActiveSyncingId(accountId);
    accountsApi.sync(parseInt(accountId))
      .then(raw => {
        setAccounts(prev => prev.map(a => a.id === accountId ? mapAccount(raw) : a));
      })
      .catch(() => {
        setAccounts(prev =>
          prev.map(a => a.id === accountId ? { ...a, lastSynced: new Date().toISOString() } : a)
        );
      })
      .finally(() => setActiveSyncingId(null));
  }, []);

  const handleAccountTransfer = useCallback((fromAccountId: string, toAccountId: string, amount: number, note?: string) => {
    const fromAcc = accounts.find(a => a.id === fromAccountId);
    const toAcc = accounts.find(a => a.id === toAccountId);
    if (!fromAcc || !toAcc) return { success: false, message: 'Account not found.' };

    const timestamp = new Date().toISOString();
    const fromTx: Transaction = {
      id: `temp-tf-out-${Date.now()}`,
      accountId: fromAccountId, bankName: fromAcc.bankName, accountName: fromAcc.accountName,
      amount, description: `Transfer to ${toAcc.accountName}${note ? ` - ${note}` : ''}`,
      category: 'Other', date: timestamp, type: 'expense',
    };
    const toTx: Transaction = {
      id: `temp-tf-in-${Date.now()}`,
      accountId: toAccountId, bankName: toAcc.bankName, accountName: toAcc.accountName,
      amount, description: `Transfer from ${fromAcc.accountName}${note ? ` - ${note}` : ''}`,
      category: 'Other', date: timestamp, type: 'income',
    };

    // Optimistic
    setAccounts(prev => prev.map(acc => {
      if (acc.id === fromAccountId) return { ...acc, balance: Math.max(0, acc.balance - amount) };
      if (acc.id === toAccountId) return { ...acc, balance: acc.balance + amount };
      return acc;
    }));
    setTransactions(prev => [fromTx, toTx, ...prev]);

    accountsApi.transfer({
      from_account_id: parseInt(fromAccountId),
      to_account_id: parseInt(toAccountId),
      amount, description: note,
    }).then(async () => {
      const [accs, txs] = await Promise.all([accountsApi.list(), transactionsApi.list()]);
      setAccounts(accs.map(mapAccount));
      setTransactions(txs.map(mapTransaction));
    }).catch((e: any) => {
      // Rollback
      setAccounts(prev => prev.map(acc => {
        if (acc.id === fromAccountId) return { ...acc, balance: acc.balance + amount };
        if (acc.id === toAccountId) return { ...acc, balance: acc.balance - amount };
        return acc;
      }));
      setTransactions(prev => prev.filter(t => t.id !== fromTx.id && t.id !== toTx.id));
      showError(e.message ?? 'Transfer failed.');
    });

    return { success: true };
  }, [accounts]);

  // ─── Budget Handlers ───────────────────────────────────────────────────────

  const handleUpdateBudgetLimit = useCallback((category: string, limit: number) => {
    setBudgets(prev => prev.map(b => b.category === category ? { ...b, limit } : b));
    const budget = budgets.find(b => b.category === category);
    if (budget?.id) {
      budgetsApi.updateLimit(budget.id, limit)
        .catch((e: any) => showError(e.message ?? 'Failed to update budget limit.'));
    }
  }, [budgets]);

  const handleResetBudgets = useCallback(() => {
    setBudgets(INITIAL_BUDGETS.map(b => ({ ...b, spent: 0 })));
    setCategories(CATEGORIES);
    budgetsApi.reset().catch((e: any) => showError(e.message ?? 'Failed to reset budgets.'));
  }, []);

  const handleCreateCategory = useCallback((categoryName: string, initialLimit = 0, color = '#8b5cf6') => {
    const trimmed = categoryName.trim();
    if (categories.some(c => c.toLowerCase() === trimmed.toLowerCase())) {
      return { success: false, message: 'This category already exists.' };
    }
    // Optimistic
    setCategories(prev => [...prev, trimmed]);
    setBudgets(prev => [...prev, { category: trimmed, limit: initialLimit, spent: 0, color }]);

    categoriesApi.create(trimmed, color, initialLimit)
      .then(async () => {
        const buds = await budgetsApi.list();
        setBudgets(buds.map(mapBudget));
      })
      .catch((e: any) => {
        setCategories(prev => prev.filter(c => c !== trimmed));
        setBudgets(prev => prev.filter(b => b.category !== trimmed));
        showError(e.message ?? 'Failed to create category.');
      });

    return { success: true };
  }, [categories]);

  // ─── Goal Handlers ─────────────────────────────────────────────────────────

  const handleAddGoal = useCallback((goalData: Omit<SavingsGoal, 'id'>) => {
    const tempId = `temp-goal-${Date.now()}`;
    const tempGoal: SavingsGoal = { ...goalData, id: tempId };
    setGoals(prev => [...prev, tempGoal]);

    goalsApi.create({
      name: goalData.name,
      target_amount: goalData.targetAmount,
      color: goalData.color,
      category: goalData.category,
      deadline: goalData.deadline,
      account_ids: goalData.linkedAccountIds.map(Number),
    }).then(raw => {
      setGoals(prev => prev.map(g => g.id === tempId ? mapGoal(raw) : g));
    }).catch((e: any) => {
      setGoals(prev => prev.filter(g => g.id !== tempId));
      showError(e.message ?? 'Failed to create goal.');
    });
  }, []);

  const handleDeleteGoal = useCallback((goalId: string) => {
    const prev = goals.find(g => g.id === goalId);
    setGoals(gs => gs.filter(g => g.id !== goalId));
    goalsApi.remove(parseInt(goalId)).catch((e: any) => {
      if (prev) setGoals(gs => [...gs, prev]);
      showError(e.message ?? 'Failed to delete goal.');
    });
  }, [goals]);

  // ─── Loan Handlers ─────────────────────────────────────────────────────────

  const handleAddLoan = useCallback((loanData: Omit<Loan, 'id'>) => {
    const tempId = `temp-loan-${Date.now()}`;
    const tempLoan: Loan = { ...loanData, id: tempId };

    // Optimistic balance adjust
    if (tempLoan.accountId) {
      setAccounts(prev => prev.map(acc => {
        if (acc.id !== tempLoan.accountId) return acc;
        const isCredit = acc.accountType === 'Credit Card';
        let bal = acc.balance;
        bal = tempLoan.type === 'lent'
          ? (isCredit ? bal + tempLoan.amount : bal - tempLoan.amount)
          : (isCredit ? bal - tempLoan.amount : bal + tempLoan.amount);
        return { ...acc, balance: Math.max(0, bal) };
      }));
    }
    setLoans(prev => [...prev, tempLoan]);

    loansApi.create({
      account_id: loanData.accountId ? parseInt(loanData.accountId) : null,
      type: loanData.type,
      person_name: loanData.personName,
      amount: loanData.amount,
      date_issued: loanData.dateIssued,
      due_date: loanData.dueDate || null,
      notes: loanData.notes,
    }).then(raw => {
      setLoans(prev => prev.map(l => l.id === tempId ? mapLoan(raw) : l));
    }).catch((e: any) => {
      setLoans(prev => prev.filter(l => l.id !== tempId));
      // Revert balance
      if (tempLoan.accountId) {
        setAccounts(prev => prev.map(acc => {
          if (acc.id !== tempLoan.accountId) return acc;
          const isCredit = acc.accountType === 'Credit Card';
          let bal = acc.balance;
          bal = tempLoan.type === 'lent'
            ? (isCredit ? bal - tempLoan.amount : bal + tempLoan.amount)
            : (isCredit ? bal + tempLoan.amount : bal - tempLoan.amount);
          return { ...acc, balance: bal };
        }));
      }
      showError(e.message ?? 'Failed to create loan.');
    });
  }, []);

  const handleUpdateLoanStatus = useCallback((id: string, status: 'active' | 'settled') => {
    setLoans(prev => prev.map(l => l.id === id ? { ...l, status } : l));
    loansApi.updateStatus(parseInt(id), status)
      .catch((e: any) => showError(e.message ?? 'Failed to update loan status.'));
  }, []);

  const handleDeleteLoan = useCallback((id: string) => {
    const prev = loans.find(l => l.id === id);
    setLoans(ls => ls.filter(l => l.id !== id));
    loansApi.remove(parseInt(id)).catch((e: any) => {
      if (prev) setLoans(ls => [...ls, prev]);
      showError(e.message ?? 'Failed to delete loan.');
    });
  }, [loans]);

  const handleAddLoanPayment = useCallback((loanId: string, paymentAmount: number, accountId?: string, notes?: string) => {
    const targetLoan = loans.find(l => l.id === loanId);
    if (!targetLoan) return;

    const newPayment = {
      id: `temp-pay-${Date.now()}`,
      amount: paymentAmount,
      date: new Date().toISOString(),
      notes,
      accountId,
    };

    // Optimistic balance
    if (accountId) {
      setAccounts(prev => prev.map(acc => {
        if (acc.id !== accountId) return acc;
        const isCredit = acc.accountType === 'Credit Card';
        let bal = acc.balance;
        bal = targetLoan.type === 'lent'
          ? (isCredit ? bal - paymentAmount : bal + paymentAmount)
          : (isCredit ? bal + paymentAmount : bal - paymentAmount);
        return { ...acc, balance: Math.max(0, bal) };
      }));
    }

    setLoans(prev => prev.map(l => {
      if (l.id !== loanId) return l;
      const payments = [...(l.payments ?? []), newPayment];
      const totalPaid = payments.reduce((s, p) => s + p.amount, 0);
      return { ...l, payments, status: totalPaid >= l.amount ? 'settled' : l.status };
    }));

    loansApi.addPayment(parseInt(loanId), {
      account_id: accountId ? parseInt(accountId) : null,
      amount: paymentAmount,
      date: newPayment.date,
      notes,
    }).then(raw => {
      setLoans(prev => prev.map(l => l.id === loanId ? mapLoan(raw) : l));
    }).catch((e: any) => {
      // Rollback payment
      setLoans(prev => prev.map(l => {
        if (l.id !== loanId) return l;
        return { ...l, payments: (l.payments ?? []).filter(p => p.id !== newPayment.id) };
      }));
      if (accountId) {
        setAccounts(prev => prev.map(acc => {
          if (acc.id !== accountId) return acc;
          const isCredit = acc.accountType === 'Credit Card';
          let bal = acc.balance;
          bal = targetLoan.type === 'lent'
            ? (isCredit ? bal + paymentAmount : bal - paymentAmount)
            : (isCredit ? bal - paymentAmount : bal + paymentAmount);
          return { ...acc, balance: bal };
        }));
      }
      showError(e.message ?? 'Failed to add payment.');
    });
  }, [loans]);

  // ─── Global Reset ──────────────────────────────────────────────────────────

  const handleResetToDefaults = useCallback(() => {
    if (!confirm('Clear all accounts, transactions, goals, loans, budgets and categories?')) return;

    miscApi.resetAll()
      .then(() => {
        setAccounts([]);
        setTransactions([]);
        setCategories(CATEGORIES);
        setLoans([]);
        setBudgets(INITIAL_BUDGETS.map(b => ({ ...b, spent: 0 })));
        setGoals([]);
        setNotifications([]);
      })
      .catch((e: any) => showError(e.message ?? 'Failed to reset data.'));
  }, []);

  const handleDismissNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  const dismissApiError = useCallback(() => setApiError(null), []);

  // ─── Computed ──────────────────────────────────────────────────────────────

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
      isLoading, apiError,
      totalAssets, totalLiabilities, netWorth,
      addTransactionPayload, handleSyncAccount, handleUnlinkAccount,
      handleConnectAccounts, handleUpdateAccount, handleAccountTransfer,
      handleUpdateBudgetLimit, handleAddGoal, handleDeleteGoal,
      handleDeleteTransaction, handleClearAllTransactions, handleCreateCategory,
      handleAddLoan, handleUpdateLoanStatus, handleAddLoanPayment, handleDeleteLoan,
      handleResetBudgets, handleResetToDefaults, handleDismissNotification,
      setIsLinkModalOpen, setEditingAccount, setIsNotificationsMuted,
      dismissApiError,
    }}>
      {children}
    </AppContext.Provider>
  );
}
