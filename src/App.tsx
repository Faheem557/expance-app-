/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { BankAccount, Transaction, Budget, SavingsGoal } from './types';
import { 
  INITIAL_ACCOUNTS, 
  INITIAL_TRANSACTIONS, 
  INITIAL_BUDGETS, 
  CATEGORIES,
  getRandomTransaction 
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

// Lucide Icons
import { 
  Activity, 
  Sparkles, 
  Cpu, 
  RefreshCw, 
  BellOff, 
  Sliders, 
  Database,
  ArrowRight,
  TrendingDown,
  Lock,
  Compass
} from 'lucide-react';

export default function App() {
  // Central application states
  const [accounts, setAccounts] = useState<BankAccount[]>(() => {
    const saved = localStorage.getItem('budget_sync_accounts');
    return saved ? JSON.parse(saved) : INITIAL_ACCOUNTS;
  });

  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    const saved = localStorage.getItem('budget_sync_transactions');
    return saved ? JSON.parse(saved) : INITIAL_TRANSACTIONS;
  });

  const [budgets, setBudgets] = useState<Budget[]>(() => {
    const saved = localStorage.getItem('budget_sync_budgets');
    if (saved) return JSON.parse(saved);
    
    // Calculate initial budgets based on default transactions list
    const defaults = [...INITIAL_BUDGETS];
    defaults.forEach(b => {
      const matchSum = INITIAL_TRANSACTIONS
        .filter(t => t.category === b.category && t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0);
      b.spent = matchSum;
    });
    return defaults;
  });

  const [goals, setGoals] = useState<SavingsGoal[]>(() => {
    const saved = localStorage.getItem('budget_sync_goals');
    if (saved) return JSON.parse(saved);
    return [
      {
        id: 'goal-emergency',
        name: 'Emergency Fund',
        targetAmount: 30000,
        linkedAccountIds: ['acct-chase-savings'],
        color: 'emerald',
        category: 'Emergency Fund',
        deadline: '2026-12-31'
      },
      {
        id: 'goal-vacation',
        name: 'Tokyo Dream Holiday',
        targetAmount: 8000,
        linkedAccountIds: ['acct-chase-checking'],
        color: 'sky',
        category: 'Travel & Holiday',
        deadline: '2026-10-15'
      }
    ];
  });

  const [notifications, setNotifications] = useState<Transaction[]>([]);
  const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);
  const [activeSyncingId, setActiveSyncingId] = useState<string | null>(null);
  
  // Real-time synchronization parameters
  const [syncSpeed, setSyncSpeed] = useState<'off' | 'fast' | 'normal'>('normal'); // Off, 10s, 25s
  const [isNotificationsMuted, setIsNotificationsMuted] = useState(false);

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

  // Dynamic automatic background sync generator
  useEffect(() => {
    if (syncSpeed === 'off') return;

    const intervalTime = syncSpeed === 'fast' ? 10_000 : 22_000;
    
    const triggerBgSync = () => {
      // Pick random linked account
      const connected = accounts.filter(a => a.isConnected);
      if (connected.length === 0) return;

      const randomAcc = connected[Math.floor(Math.random() * connected.length)];
      const freshTx = getRandomTransaction(randomAcc.id, randomAcc.bankName, randomAcc.accountName);
      
      addTransactionPayload(freshTx);
    };

    const timer = setInterval(triggerBgSync, intervalTime);
    return () => clearInterval(timer);
  }, [syncSpeed, accounts, isNotificationsMuted]);

  // Manual Account Refresh triggered inside target account card
  const handleSyncAccount = (accountId: string) => {
    setActiveSyncingId(accountId);

    setTimeout(() => {
      // Build dummy synced transaction to display manual verification
      const targetAcc = accounts.find(a => a.id === accountId);
      if (targetAcc) {
        const freshTx = getRandomTransaction(targetAcc.id, targetAcc.bankName, targetAcc.accountName);
        addTransactionPayload(freshTx);
      }
      setActiveSyncingId(null);
    }, 1200);
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
    // Prevent duplicate ID insertion
    const filteredNews = newAccounts.filter(na => !accounts.some(ea => ea.id === na.id));
    setAccounts(prev => [...prev, ...filteredNews]);

    // Feed introductory simulated greeting transactions
    setTimeout(() => {
      newAccounts.forEach(na => {
        const greetTx: Transaction = {
          id: `greet-${Math.random().toString(36).substr(2, 9)}`,
          accountId: na.id,
          bankName: na.bankName,
          accountName: na.accountName,
          amount: 25.00,
          description: `Authorized Pipeline Handshake`,
          category: 'Other',
          date: new Date().toISOString(),
          type: 'income',
          isNew: true
        };
        addTransactionPayload(greetTx);
      });
    }, 1800);
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

  // Wipe application back to default initial parameters
  const handleResetToDefaults = () => {
    if (confirm('Reset bank accounts, transactions lists, and budget envelopes back to default initial state?')) {
      localStorage.removeItem('budget_sync_accounts');
      localStorage.removeItem('budget_sync_transactions');
      localStorage.removeItem('budget_sync_budgets');
      localStorage.removeItem('budget_sync_goals');
      
      setAccounts(INITIAL_ACCOUNTS);
      setTransactions(INITIAL_TRANSACTIONS);
      
      const defaults = [...INITIAL_BUDGETS];
      defaults.forEach(b => {
        const matchSum = INITIAL_TRANSACTIONS
          .filter(t => t.category === b.category && t.type === 'expense')
          .reduce((sum, t) => sum + t.amount, 0);
        b.spent = matchSum;
      });
      setBudgets(defaults);
      setGoals([
        {
          id: 'goal-emergency',
          name: 'Emergency Fund',
          targetAmount: 30000,
          linkedAccountIds: ['acct-chase-savings'],
          color: 'emerald',
          category: 'Emergency Fund',
          deadline: '2026-12-31'
        },
        {
          id: 'goal-vacation',
          name: 'Tokyo Dream Holiday',
          targetAmount: 8000,
          linkedAccountIds: ['acct-chase-checking'],
          color: 'sky',
          category: 'Travel & Holiday',
          deadline: '2026-10-15'
        }
      ]);
      setNotifications([]);
    }
  };

  // Triggers background simulation immediately for demo purposes
  const handleTriggerSimulateNow = () => {
    const connected = accounts.filter(a => a.isConnected);
    if (connected.length === 0) {
      alert('Please connect at least one mock bank account from the grid to stream transaction packets!');
      return;
    }
    const randomAcc = connected[Math.floor(Math.random() * connected.length)];
    const freshTx = getRandomTransaction(randomAcc.id, randomAcc.bankName, randomAcc.accountName);
    addTransactionPayload(freshTx);
  };

  const handleDismissNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800 antialiased font-sans flex flex-col justify-between">
      
      {/* Top Banner Control Frame */}
      <header className="bg-white border-b border-gray-150 py-4 px-6 sticky top-0 z-40 shadow-xs">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          
          {/* Logo Identity Title */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-md shadow-blue-600/20">
              <Activity className="w-5 h-5" id="app-logo" />
            </div>
            <div>
              <h1 className="text-md font-extrabold tracking-tight text-gray-900 leading-tight">
                Real-Time Budget Sync
              </h1>
              <p className="text-[10px] uppercase font-mono tracking-widest text-emerald-600 font-bold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Live Bank Feed Active
              </p>
            </div>
          </div>

          {/* Simulated API Core Settings Rail */}
          <div className="flex flex-wrap items-center gap-3 bg-gray-50 border border-gray-150 p-2 rounded-2xl">
            
            {/* Simulation Speed Control */}
            <div className="flex items-center gap-1.5 text-xs px-2.5">
              <Sliders className="w-3.5 h-3.5 text-gray-400" />
              <span className="text-gray-500 font-semibold truncate">Feed intervals:</span>
              <select
                className="bg-transparent font-bold border-none text-blue-600 focus:outline-none focus:ring-0 cursor-pointer text-xs"
                value={syncSpeed}
                onChange={e => setSyncSpeed(e.target.value as any)}
                id="sync-interval-select"
              >
                <option value="normal">Normal (22s)</option>
                <option value="fast">Rapid (10s)</option>
                <option value="off">Off (Manual)</option>
              </select>
            </div>

            <div className="border-l border-gray-200 h-4" />

            {/* Force instant simulation trigger button */}
            <button
              onClick={handleTriggerSimulateNow}
              className="bg-white border border-gray-200 hover:bg-gray-100 text-gray-700 hover:text-blue-600 px-3 py-1.5 rounded-xl text-[10px] font-bold flex items-center gap-1.5 transition whitespace-nowrap"
              id="simulate-sync-instant-btn"
              title="Inject random mock transaction straight from your connected sandbox account"
            >
              <RefreshCw className="w-3 h-3 text-emerald-500 animate-spin" />
              Inject Handshake
            </button>

            {/* Notifications sound / alert toggle */}
            <button
              onClick={() => setIsNotificationsMuted(!isNotificationsMuted)}
              className={`p-1.5 rounded-lg border transition ${
                isNotificationsMuted 
                  ? 'bg-red-50 text-red-650 border-red-100' 
                  : 'bg-white hover:bg-gray-100 border-gray-200 text-gray-500'
              }`}
              id="mute-notif-btn"
              title={isNotificationsMuted ? 'Mute active' : 'Notifications on'}
            >
              <BellOff className="w-3.5 h-3.5" />
            </button>

            {/* Clear Database resets */}
            <button
              onClick={handleResetToDefaults}
              className="p-1.5 rounded-lg bg-white border border-gray-200 text-gray-400 hover:text-red-700 hover:bg-red-50 transition"
              id="wipe-db-btn"
              title="Wipe sandbox storage memory back to factory settings"
            >
              <Database className="w-3.5 h-3.5" />
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
            onOpenLinkModal={() => setIsLinkModalOpen(true)}
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
              onResetBudgets={() => setBudgets(INITIAL_BUDGETS)}
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
          />
        </section>

      </main>

      {/* Integrated Connection wizard modal */}
      <LinkBankModal
        isOpen={isLinkModalOpen}
        onClose={() => setIsLinkModalOpen(false)}
        onConnectAccounts={handleConnectAccounts}
        existingAccountIds={accounts.map(a => a.id)}
      />

      {/* Dynamically popping overlays notifications */}
      <SyncNotification
        notifications={notifications}
        onDismiss={handleDismissNotification}
      />

      {/* Humble Footer */}
      <footer className="bg-white border-t border-gray-150 py-4 px-6 mt-8">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center text-xs text-gray-400 gap-2">
          <span>Real-Time Budget Sync Corp © 2026. AES-256 secure storage engine.</span>
          <div className="flex gap-4">
            <span>Server Sync Latency: <strong className="text-emerald-500">12ms (Nominal)</strong></span>
            <span>API Handshake Protocol: <strong className="text-blue-600">v3.54</strong></span>
          </div>
        </div>
      </footer>

    </div>
  );
}
