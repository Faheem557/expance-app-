/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { BankAccount, Transaction, Budget, SavingsGoal, Loan } from './types';
import { 
  INITIAL_ACCOUNTS, 
  INITIAL_TRANSACTIONS, 
  INITIAL_BUDGETS, 
  CATEGORIES 
} from './initialData';

// Subcomponents import
import AccountsGrid from './components/AccountsGrid';
import VisualGraphs from './components/VisualGraphs';
import BudgetSummary from './components/BudgetSummary';
import TransactionsList from './components/TransactionsList';
import IntelligenceCenter from './components/IntelligenceCenter';
import LinkBankModal from './components/LinkBankModal';
import SyncNotification from './components/SyncNotification';
import RecurringPredictor from './components/RecurringPredictor';
import GoalsTracker from './components/GoalsTracker';
import NotificationReader from './components/NotificationReader';
import LoanTracker from './components/LoanTracker';

// Lucide Icons
import { 
  Activity, 
  BellOff, 
  Database
} from 'lucide-react';

export default function App() {
  // Central application states
  const [accounts, setAccounts] = useState<BankAccount[]>(() => {
    const saved = localStorage.getItem('budget_sync_accounts');
    const list = saved ? JSON.parse(saved) : INITIAL_ACCOUNTS;
    return list.filter((a: BankAccount) => !['acct-chase-checking', 'acct-chase-savings', 'acct-summit-card'].includes(a.id));
  });

  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    const saved = localStorage.getItem('budget_sync_transactions');
    const list = saved ? JSON.parse(saved) : INITIAL_TRANSACTIONS;
    return list.filter((t: Transaction) => !['tx-1', 'tx-2', 'tx-3', 'tx-4', 'tx-5', 'tx-6', 'tx-7', 'tx-8'].includes(t.id));
  });

  const [budgets, setBudgets] = useState<Budget[]>(() => {
    const saved = localStorage.getItem('budget_sync_budgets');
    if (saved) {
      // Re-initialize budgets spent to 0 if we cleaned standard transactions
      const parsed = JSON.parse(saved) as Budget[];
      const hasMockTx = localStorage.getItem('budget_sync_transactions') ? 
        JSON.parse(localStorage.getItem('budget_sync_transactions')!).some((t: any) => ['tx-1', 'tx-2', 'tx-3'].includes(t.id)) : false;
      if (hasMockTx) {
        return INITIAL_BUDGETS;
      }
      return parsed;
    }
    return [...INITIAL_BUDGETS];
  });

  const [goals, setGoals] = useState<SavingsGoal[]>(() => {
    const saved = localStorage.getItem('budget_sync_goals');
    const list = saved ? JSON.parse(saved) : [];
    return list.filter((g: SavingsGoal) => !['goal-emergency', 'goal-vacation'].includes(g.id));
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

  // Sync state variables to LocalStorage on updates
  useEffect(() => {
    localStorage.setItem('budget_sync_accounts', JSON.stringify(accounts));
  }, [accounts]);

  useEffect(() => {
    localStorage.setItem('budget_sync_transactions', JSON.stringify(transactions));
  }, [transactions]);

  useEffect(() => {
    localStorage.setItem('budget_sync_budgets', JSON.stringify(budgets));
  }, [budgets]);

  useEffect(() => {
    localStorage.setItem('budget_sync_goals', JSON.stringify(goals));
  }, [goals]);

  useEffect(() => {
    localStorage.setItem('budget_sync_categories', JSON.stringify(categories));
  }, [categories]);

  useEffect(() => {
    localStorage.setItem('budget_sync_loans', JSON.stringify(loans));
  }, [loans]);

  // Recalculates category spending limits dynamically if transaction lists are modified
  const recalcBudgetSpend = (updatedTxs: Transaction[]) => {
    setBudgets(prev => {
      return prev.map(b => {
        const spentVal = updatedTxs
          .filter(t => t.category === b.category && t.type === 'expense')
          .reduce((sum, t) => sum + t.amount, 0);
        return { ...b, spent: spentVal };
      });
    });
  };

  // Central trigger to process arriving Transaction and rebalance bank sheets
  const addTransactionPayload = (newTx: Transaction) => {
    // Append to central state list
    setTransactions(prev => {
      const updated = [newTx, ...prev];
      recalcBudgetSpend(updated);
      return updated;
    });

    // Update targeted BankAccount Available balance
    setAccounts(prev => {
      return prev.map(acc => {
        if (acc.id === newTx.accountId) {
          let updatedBalance = acc.balance;
          if (newTx.type === 'expense') {
            if (acc.accountType === 'Credit Card') {
              // Expenses INCREASE balance due to statement on credit accounts
              updatedBalance += newTx.amount;
            } else {
              // Expenses DECREASE assets on checking / savings
              updatedBalance -= newTx.amount;
            }
          } else {
            // Income
            if (acc.accountType === 'Credit Card') {
              updatedBalance -= newTx.amount;
            } else {
              updatedBalance += newTx.amount;
            }
          }

          return {
            ...acc,
            balance: Math.max(0, updatedBalance),
            lastSynced: new Date().toISOString()
          };
        }
        return acc;
      });
    });

    // Flash toast notification alert if enabled
    if (!isNotificationsMuted) {
      setNotifications(prev => [...prev.filter(n => n.id !== newTx.id), newTx]);
    }
  };

  // Manual Account Refresh triggered inside target account card
  const handleSyncAccount = (accountId: string) => {
    setActiveSyncingId(accountId);

    setTimeout(() => {
      // Just update last synced timestamp
      setAccounts(prev => prev.map(acc => {
        if (acc.id === accountId) {
          return { ...acc, lastSynced: new Date().toISOString() };
        }
        return acc;
      }));
      setActiveSyncingId(null);
    }, 1000);
  };

  // manual unlink target bank
  const handleUnlinkAccount = (accountId: string) => {
    if (confirm('Are you sure you want to unlink this account? Your current budget balances will adjust accordingly.')) {
      const remainingAccs = accounts.filter(a => a.id !== accountId);
      const remainingTxs = transactions.filter(t => t.accountId !== accountId);
      
      setAccounts(remainingAccs);
      setTransactions(remainingTxs);
      recalcBudgetSpend(remainingTxs);
    }
  };

  // Handshake connecting new bank channels from Connection wizard
  const handleConnectAccounts = (newAccounts: BankAccount[]) => {
    const filteredNews = newAccounts.filter(na => !accounts.some(ea => ea.id === na.id));
    setAccounts(prev => [...prev, ...filteredNews]);
  };

  // Update an existing connected account's details
  const handleUpdateAccount = (updatedAccount: BankAccount) => {
    setAccounts(prev => prev.map(a => a.id === updatedAccount.id ? updatedAccount : a));
    
    // Proactively update bankName and accountName for transactions attached to this account
    setTransactions(prev => prev.map(t => {
      if (t.accountId === updatedAccount.id) {
        return {
          ...t,
          bankName: updatedAccount.bankName,
          accountName: updatedAccount.accountName
        };
      }
      return t;
    }));
  };

  // Process manual money transfer between two connected bank accounts
  const handleAccountTransfer = (fromAccountId: string, toAccountId: string, amount: number, note?: string) => {
    const fromAcc = accounts.find(a => a.id === fromAccountId);
    const toAcc = accounts.find(a => a.id === toAccountId);
    if (!fromAcc || !toAcc) {
      return { success: false, message: 'Source or destination account was not found.' };
    }

    const timestamp = new Date().toISOString();

    // From account transaction (expense)
    const fromTx: Transaction = {
      id: `tx-tf-out-${Math.random().toString(36).substr(2, 9)}`,
      accountId: fromAccountId,
      bankName: fromAcc.bankName,
      accountName: fromAcc.accountName,
      amount,
      description: `Transfer to ${toAcc.bankName} (${toAcc.accountName})${note ? ` - ${note}` : ''}`,
      category: 'Other',
      date: timestamp,
      type: 'expense'
    };

    // To account transaction (income)
    const toTx: Transaction = {
      id: `tx-tf-in-${Math.random().toString(36).substr(2, 9)}`,
      accountId: toAccountId,
      bankName: toAcc.bankName,
      accountName: toAcc.accountName,
      amount,
      description: `Transfer from ${fromAcc.bankName} (${fromAcc.accountName})${note ? ` - ${note}` : ''}`,
      category: 'Other',
      date: timestamp,
      type: 'income'
    };

    // Adjust balances
    setAccounts(prev => prev.map(acc => {
      let updatedBalance = acc.balance;
      if (acc.id === fromAccountId) {
        if (acc.accountType === 'Credit Card') {
          updatedBalance += amount;
        } else {
          updatedBalance -= amount;
        }
        return {
          ...acc,
          balance: Math.max(0, updatedBalance),
          lastSynced: timestamp
        };
      }
      if (acc.id === toAccountId) {
        if (acc.accountType === 'Credit Card') {
          updatedBalance -= amount;
        } else {
          updatedBalance += amount;
        }
        return {
          ...acc,
          balance: Math.max(0, updatedBalance),
          lastSynced: timestamp
        };
      }
      return acc;
    }));

    // Record both legs of the transfer in the ledger
    setTransactions(prev => {
      const updated = [fromTx, toTx, ...prev];
      recalcBudgetSpend(updated);
      return updated;
    });

    return { success: true };
  };

  // Core modification for budget categories limits
  const handleUpdateBudgetLimit = (category: string, limit: number) => {
    setBudgets(prev => {
      return prev.map(b => b.category === category ? { ...b, limit } : b);
    });
  };

  const handleAddGoal = (goalData: Omit<SavingsGoal, 'id'>) => {
    const newGoal: SavingsGoal = {
      ...goalData,
      id: `goal-${Math.random().toString(36).substr(2, 9)}`
    };
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

      // Adjust the affected bank account balance in reverse
      setAccounts(prev => {
        return prev.map(acc => {
          if (acc.id === txToDelete.accountId) {
            let updatedBalance = acc.balance;
            if (txToDelete.type === 'expense') {
              if (acc.accountType === 'Credit Card') {
                updatedBalance -= txToDelete.amount;
              } else {
                updatedBalance += txToDelete.amount;
              }
            } else {
              // Income
              if (acc.accountType === 'Credit Card') {
                updatedBalance += txToDelete.amount;
              } else {
                updatedBalance -= txToDelete.amount;
              }
            }
            return {
              ...acc,
              balance: Math.max(0, updatedBalance),
              lastSynced: new Date().toISOString()
            };
          }
          return acc;
        });
      });
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
    setBudgets(prev => [
      ...prev,
      {
        category: trimmed,
        limit: initialLimit,
        spent: 0,
        color: color
      }
    ]);

    return { success: true };
  };

  const handleAddLoan = (loanData: Omit<Loan, 'id'>) => {
    const newLoan: Loan = {
      ...loanData,
      id: `loan-${Math.random().toString(36).substr(2, 9)}`
    };

    // Reflect the initial transaction in the bank account balance
    if (newLoan.accountId) {
      setAccounts(prev => prev.map(acc => {
        if (acc.id === newLoan.accountId) {
           const isCredit = acc.accountType === 'Credit Card';
           let updated = acc.balance;
           if (newLoan.type === 'lent') {
             // Lending money means balance decreases (or credit increases)
             updated = isCredit ? updated + newLoan.amount : updated - newLoan.amount;
           } else {
             // Borrowing money means balance increases (or credit decreases)
             updated = isCredit ? updated - newLoan.amount : updated + newLoan.amount;
           }
           return { ...acc, balance: Math.max(0, updated) };
        }
        return acc;
      }));
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
      accountId
    };
    
    // Find loan first
    const targetLoan = loans.find(l => l.id === loanId);
    if (!targetLoan) return;

    if (accountId) {
      setAccounts(prev => prev.map(acc => {
         if (acc.id === accountId) {
            const isCredit = acc.accountType === 'Credit Card';
            let updated = acc.balance;
            if (targetLoan.type === 'lent') {
               // Being paid back: balance increases (or credit decreases)
               updated = isCredit ? updated - paymentAmount : updated + paymentAmount;
            } else {
               // Paying back: balance decreases (or credit increases)
               updated = isCredit ? updated + paymentAmount : updated - paymentAmount;
            }
            return { ...acc, balance: Math.max(0, updated) };
         }
         return acc;
      }));
    }
    
    setLoans(prev => prev.map(l => {
      if (l.id === loanId) {
        const currentPayments = l.payments || [];
        const newPayments = [...currentPayments, newPayment];
        
        // Auto mark as settled if fully paid
        const totalPaid = newPayments.reduce((sum, p) => sum + p.amount, 0);
        const newStatus = totalPaid >= l.amount ? 'settled' : l.status;
        
        return { ...l, payments: newPayments, status: newStatus };
      }
      return l;
    }));
  };

  const handleDeleteLoan = (id: string) => {
    setLoans(prev => prev.filter(l => l.id !== id));
  };

  // Wipe application back to default initial parameters
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
      
      const defaults = INITIAL_BUDGETS.map(b => ({ ...b, spent: 0 }));
      setBudgets(defaults);
      setGoals([]);
      setNotifications([]);
    }
  };

  const handleDismissNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  // --- Dynamic Live Financial Calculations ---
  const totalAssets = accounts
    .filter(a => a.accountType !== 'Credit Card')
    .reduce((sum, a) => sum + a.balance, 0);

  const totalLiabilities = accounts
    .filter(a => a.accountType === 'Credit Card')
    .reduce((sum, a) => sum + a.balance, 0);

  const netWorth = totalAssets - totalLiabilities;

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800 antialiased font-sans flex flex-col justify-between">
      
      {/* Top Banner Control Frame */}
      <header className="bg-white border-b border-gray-150 py-4 px-6 sticky top-0 z-40 shadow-xs">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          
          {/* Logo Identity Title */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-600/20">
              <Activity className="w-5 h-5" id="app-logo" />
            </div>
            <div>
              <h1 className="text-md font-extrabold tracking-tight text-gray-900 leading-tight">
                Real-Time Budget Sync
              </h1>
              <p className="text-[10px] uppercase font-mono tracking-widest text-emerald-650 font-bold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Live Bank Feed Active
              </p>
            </div>
          </div>

          {/* Core App Actions */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Notifications sound / alert toggle */}
            <button
              onClick={() => setIsNotificationsMuted(!isNotificationsMuted)}
              className={`py-2 px-3 text-xs font-semibold rounded-xl border flex items-center gap-1.5 transition-all ${
                isNotificationsMuted 
                  ? 'bg-rose-50 text-rose-700 border-rose-100 hover:bg-rose-100' 
                  : 'bg-white hover:bg-gray-100 border-gray-250 text-gray-600'
              }`}
              id="mute-notif-btn"
              title={isNotificationsMuted ? 'Muted' : 'Sound Alerts Enabled'}
            >
              <BellOff className="w-3.5 h-3.5" />
              <span>{isNotificationsMuted ? 'Alerts Muted' : 'Alerts Active'}</span>
            </button>

            {/* Clear Database resets */}
            <button
              onClick={handleResetToDefaults}
              className="py-2 px-3 text-xs font-semibold rounded-xl bg-white border border-gray-250 text-gray-500 hover:text-red-700 hover:bg-red-50 transition-all flex items-center gap-1.5 focus:outline-none"
              id="wipe-db-btn"
              title="Clear all stored transactions and linked accounts"
            >
              <Database className="w-3.5 h-3.5" />
              <span>Clear Dashboard</span>
            </button>
          </div>

        </div>
      </header>

      {/* Main Container Dashboard */}
      <main className="max-w-7xl mx-auto w-full px-6 py-6 space-y-8 flex-1">
        
        {/* Module One: Connection card mesh */}
        <section id="accounts-grid-frame" className="space-y-2">
          <AccountsGrid
            accounts={accounts}
            onSyncAccount={handleSyncAccount}
            onUnlinkAccount={handleUnlinkAccount}
            onOpenLinkModal={() => {
              setEditingAccount(null);
              setIsLinkModalOpen(true);
            }}
            onEditAccount={(acc) => {
              setEditingAccount(acc);
              setIsLinkModalOpen(true);
            }}
            onTransfer={handleAccountTransfer}
            activeSyncingId={activeSyncingId}
          />
        </section>

        {/* Module Two: Graphics and Envelope limits */}
        <section id="charts-and-budgets" className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          <div className="lg:col-span-8 space-y-6">
            <VisualGraphs
              budgets={budgets}
              transactions={transactions}
            />
            <NotificationReader
              accounts={accounts}
              budgets={budgets}
              onAddTransaction={(txData) => {
                const fullTx: Transaction = {
                  ...txData,
                  id: `tx-parsed-${Math.random().toString(36).substr(2, 9)}`,
                  isNew: true
                };
                addTransactionPayload(fullTx);
              }}
            />
            {/* Rules and AI insights */}
            <IntelligenceCenter
              budgets={budgets}
              transactions={transactions}
            />
          </div>

          <div className="lg:col-span-4 space-y-6">
            <BudgetSummary
              budgets={budgets}
              onUpdateBudgetLimit={handleUpdateBudgetLimit}
              onResetBudgets={() => {
                setBudgets(INITIAL_BUDGETS.map(b => ({ ...b, spent: 0 })));
                setCategories(CATEGORIES);
              }}
              onCreateCategory={handleCreateCategory}
            />
            <RecurringPredictor
              transactions={transactions}
              onTriggerReceipt={(newTx) => {
                const fullTx: Transaction = {
                  ...newTx,
                  id: `tx-recur-sim-${Math.random().toString(36).substr(2, 9)}`,
                  isNew: true
                };
                addTransactionPayload(fullTx);
                if (!isNotificationsMuted) {
                  setNotifications(prev => [...prev.filter(n => n.id !== fullTx.id), fullTx]);
                }
              }}
            />
          </div>

        </section>

        {/* Module Three: Savings Goals targets */}
        <section id="savings-goals-panel">
          <GoalsTracker
            accounts={accounts}
            goals={goals}
            onAddGoal={handleAddGoal}
            onDeleteGoal={handleDeleteGoal}
          />
        </section>

        {/* Module 3.5: Loan & Debt Tracker */}
        <section id="loan-tracker-panel">
          <LoanTracker
            loans={loans}
            accounts={accounts}
            onAddLoan={handleAddLoan}
            onUpdateLoanStatus={handleUpdateLoanStatus}
            onDeleteLoan={handleDeleteLoan}
            onAddPayment={handleAddLoanPayment}
          />
        </section>

        {/* Module Four: Detailed Logging Spreadsheet list */}
        <section id="ledger-pane">
          <TransactionsList
            transactions={transactions}
            accounts={accounts}
            onAddTransaction={(txData) => {
              const fullTx: Transaction = {
                ...txData,
                id: `tx-man-${Math.random().toString(36).substr(2, 9)}`,
                isNew: true
              };
              addTransactionPayload(fullTx);
            }}
            onDeleteTransaction={handleDeleteTransaction}
            onClearAllTransactions={handleClearAllTransactions}
            categories={categories}
          />
        </section>

      </main>

      {/* Humble Footer */}
      <footer className="bg-white border-t border-gray-150 py-4 px-6 mt-8">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center text-xs text-gray-400 gap-2">
          <span>Real-Time Budget Sync © 2026. All data is securely stored locally.</span>
          <div className="flex gap-4 font-medium text-gray-400">
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Secure Gateway Connected
            </span>
          </div>
        </div>
      </footer>

      {/* Connection wizard modal */}
      <LinkBankModal
        isOpen={isLinkModalOpen}
        onClose={() => {
          setIsLinkModalOpen(false);
          setEditingAccount(null);
        }}
        onConnectAccounts={handleConnectAccounts}
        onUpdateAccount={handleUpdateAccount}
        editingAccount={editingAccount}
        existingAccountIds={accounts.map(a => a.id)}
      />

      {/* Dynamically popping overlays notifications */}
      <SyncNotification
        notifications={notifications}
        onDismiss={handleDismissNotification}
      />

    </div>
  );
}
