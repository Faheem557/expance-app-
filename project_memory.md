# 📁 Project Memory — Real-Time Budget Sync (Expense App)

## Overview
**Project Name:** Real-Time Budget Sync  
**Type:** Personal Finance / Expense Tracker  
**Stack:** React 19 + TypeScript + Vite + Tailwind CSS v4 + React Router v7  
**Location:** `d:\react js\expance-app-`  
**Dev Port:** `3000` (`npm run dev` → `vite --port=3000 --host=0.0.0.0`)

---

## Tech Stack

| Tool | Version | Role |
|------|---------|------|
| React | ^19.0.1 | UI framework |
| TypeScript | ~5.8.2 | Type safety |
| Vite | ^6.2.3 | Build tool + dev server |
| Tailwind CSS | ^4.1.14 | Styling (via `@tailwindcss/vite` plugin) |
| react-router-dom | ^7.16.0 | Client-side routing (BrowserRouter + nested routes) |
| Lucide React | ^0.546.0 | Icon library |
| @google/genai | ^2.4.0 | Gemini AI API integration |
| motion | ^12.23.24 | Animations (Framer Motion) |
| express | ^4.21.2 | Backend server (API proxy) |
| dotenv | ^17.2.3 | Environment variable loading |

### Scripts
```bash
npm run dev      # vite --port=3000 --host=0.0.0.0
npm run build    # vite build
npm run preview  # vite preview
npm run lint     # tsc --noEmit
npm run clean    # rm -rf dist server.js
```

---

## Project Structure

```
expance-app-/
├── index.html              # HTML entry point
├── vite.config.ts          # Vite config (React + Tailwind plugins, HMR control)
├── tsconfig.json           # TypeScript config
├── package.json            # Dependencies & scripts
├── .env.example            # GEMINI_API_KEY + APP_URL env vars
├── metadata.json           # App metadata (AI Studio)
├── project_memory.md       # This file — living project reference
├── dist/                   # Build output
└── src/
    ├── main.tsx            # React entry point — mounts BrowserRouter + AppProvider + App
    ├── App.tsx             # Root router — defines Route tree (30 lines)
    ├── index.css           # Global styles (minimal, 24 bytes)
    ├── types.ts            # TypeScript interfaces & types
    ├── initialData.ts      # Seed data, budget defaults, merchant generators
    ├── context/
    │   └── AppContext.tsx  # Global state + all handler functions (437 lines)
    ├── layout/
    │   └── AppLayout.tsx   # Sidebar nav + header + footer shell (248 lines)
    ├── pages/
    │   ├── DashboardPage.tsx     # KPI cards + account balances + transfer modal + charts (270 lines)
    │   ├── AccountsPage.tsx      # Full AccountsGrid page (43 lines)
    │   ├── TransactionsPage.tsx  # NotificationReader + RecurringPredictor + TransactionsList (72 lines)
    │   ├── BudgetPage.tsx        # BudgetSummary page (29 lines)
    │   ├── GoalsPage.tsx         # GoalsTracker page (29 lines)
    │   └── LoansPage.tsx         # LoanTracker page (33 lines)
    └── components/
        ├── AccountsGrid.tsx        # Bank accounts card mesh (18 KB)
        ├── BudgetSummary.tsx       # Budget categories + limits (16 KB)
        ├── GoalsTracker.tsx        # Savings goals tracker (23 KB)
        ├── IntelligenceCenter.tsx  # AI insights panel (13 KB)
        ├── LinkBankModal.tsx       # Bank connection wizard modal (33 KB)
        ├── LoanTracker.tsx         # Loan & debt tracker (24 KB)
        ├── NotificationReader.tsx  # Notification/SMS receipt parser (23 KB)
        ├── RecurringPredictor.tsx  # Recurring transactions predictor (9 KB)
        ├── SyncNotification.tsx    # Toast notification overlay (4 KB)
        ├── TransactionsList.tsx    # Transaction ledger spreadsheet (21 KB)
        └── VisualGraphs.tsx        # Charts & data visualization (28 KB)
```

---

## Architecture — Multi-Page with Context + Router

> **MAJOR REFACTOR from old single-file App.tsx**: The app is now fully split into a proper multi-page architecture. All state has been extracted to a React Context, and the UI is organized via React Router with a persistent layout shell.

### Entry Flow

```
main.tsx
  └── <BrowserRouter>
        └── <AppProvider>          ← all state + handlers here
              └── <App />
                    └── <Routes>
                          └── <Route path="/" element={<AppLayout />}>
                                ├── index → <DashboardPage />
                                ├── /accounts → <AccountsPage />
                                ├── /transactions → <TransactionsPage />
                                ├── /budget → <BudgetPage />
                                ├── /goals → <GoalsPage />
                                └── /loans → <LoansPage />
```

### Routes

| Path | Page Component | Description |
|------|---------------|-------------|
| `/` | `DashboardPage` | KPI cards, account balance grid, transfer modal, charts, AI insights |
| `/accounts` | `AccountsPage` | Full AccountsGrid with sync/edit/unlink/transfer |
| `/transactions` | `TransactionsPage` | SMS parser + recurring predictor + full ledger |
| `/budget` | `BudgetPage` | Budget envelope limits, category creation |
| `/goals` | `GoalsPage` | Savings goals with linked accounts |
| `/loans` | `LoansPage` | Loan & debt tracker |

### AppLayout (`src/layout/AppLayout.tsx`)

Persistent layout shell rendered for all routes via `<Outlet />`. Contains:
- **Sidebar** (fixed, 240px) with:
  - Logo + live pulse indicator
  - `NavLink` navigation (6 items)
  - Net Worth widget (gradient card showing assets/liabilities)
  - Alerts toggle + Clear Dashboard button
  - Mobile hamburger overlay
- **Top header** (sticky) with breadcrumb, account count, "Secure & Local" badge
- **`<main>`** wrapping `<Outlet />`
- **Footer** with copyright + "Secure Gateway Connected" indicator
- **`<LinkBankModal>`** and **`<SyncNotification>`** always mounted here (portal-level)

---

## Global State — `src/context/AppContext.tsx`

All state lives in `AppProvider`. Consumed anywhere via `useAppContext()` hook. Persisted to **localStorage**.

### State

| State | localStorage Key | Initial Value |
|-------|-----------------|---------------|
| `accounts` | `budget_sync_accounts` | `INITIAL_ACCOUNTS` (filtered) |
| `transactions` | `budget_sync_transactions` | `INITIAL_TRANSACTIONS` (filtered) |
| `budgets` | `budget_sync_budgets` | `INITIAL_BUDGETS` |
| `goals` | `budget_sync_goals` | `[]` |
| `categories` | `budget_sync_categories` | `CATEGORIES` |
| `loans` | `budget_sync_loans` | `[]` |
| `notifications` | _(in-memory)_ | `[]` |
| `isLinkModalOpen` | _(in-memory)_ | `false` |
| `activeSyncingId` | _(in-memory)_ | `null` |
| `isNotificationsMuted` | _(in-memory)_ | `false` |
| `editingAccount` | _(in-memory)_ | `null` |

### Computed Values (exposed via context)

```ts
totalAssets      = sum of non-CreditCard account balances
totalLiabilities = sum of CreditCard account balances
netWorth         = totalAssets - totalLiabilities
```

### Context Shape (`AppContextValue`)

```ts
interface AppContextValue {
  // State
  accounts, transactions, budgets, goals, categories, loans,
  notifications, isLinkModalOpen, activeSyncingId, isNotificationsMuted, editingAccount,
  // Computed
  totalAssets, totalLiabilities, netWorth,
  // Handlers (see table below)
  addTransactionPayload, handleSyncAccount, handleUnlinkAccount,
  handleConnectAccounts, handleUpdateAccount, handleAccountTransfer,
  handleUpdateBudgetLimit, handleAddGoal, handleDeleteGoal,
  handleDeleteTransaction, handleClearAllTransactions, handleCreateCategory,
  handleAddLoan, handleUpdateLoanStatus, handleAddLoanPayment, handleDeleteLoan,
  handleResetBudgets, handleResetToDefaults, handleDismissNotification,
  setIsLinkModalOpen, setEditingAccount, setIsNotificationsMuted,
}
```

### Handler Functions

| Function | Description |
|----------|-------------|
| `addTransactionPayload(tx)` | Adds tx, updates account balance, triggers toast notification |
| `handleSyncAccount(id)` | Simulates account refresh (updates `lastSynced` after 1s) |
| `handleUnlinkAccount(id)` | Removes account + its transactions, recalculates budgets |
| `handleConnectAccounts(newAccs)` | Adds new accounts from the Link modal (deduplicates by id) |
| `handleUpdateAccount(acc)` | Updates account + propagates name changes to transactions |
| `handleAccountTransfer(from, to, amt, note?)` | Creates paired expense/income transactions; returns `{success, message?}` |
| `handleUpdateBudgetLimit(cat, limit)` | Updates spending limit for a category |
| `handleAddGoal(data)` | Creates a new savings goal |
| `handleDeleteGoal(id)` | Deletes a savings goal |
| `handleDeleteTransaction(id)` | Deletes tx + reverses balance impact on account |
| `handleClearAllTransactions()` | Wipes all transactions, resets budget spend |
| `handleCreateCategory(name, limit?, color?)` | Adds new category to `categories` + `budgets`; returns `{success, message?}` |
| `handleAddLoan(data)` | CRUD add loan; adjusts account balance |
| `handleDeleteLoan(id)` | Removes loan |
| `handleAddLoanPayment(loanId, amt, accountId?, notes?)` | Adds payment, auto-settles if fully paid |
| `handleUpdateLoanStatus(id, status)` | Manually toggles loan status |
| `handleResetBudgets()` | Resets all budget limits to defaults, spent to 0 |
| `handleResetToDefaults()` | Full localStorage wipe + state reset |
| `handleDismissNotification(id)` | Removes a toast notification |
| `recalcBudgetSpend(txs)` | (internal) Recalculates all budget `spent` values from transaction list |

### Credit Card Balance Logic
- **Expenses** on Credit Card → **increase** balance (statement debt grows)
- **Income** on Credit Card → **decrease** balance (payment reduces debt)
- Transfer/Delete logic reverses these rules accordingly

---

## Data Models (`src/types.ts`)

### `BankAccount`
```ts
{
  id: string;
  bankName: string;
  accountName: string;
  accountType: 'Checking' | 'Savings' | 'Credit Card' | 'Brokerage' | 'Cash Wallet' | 'Transit Pass';
  accountNumber: string;
  balance: number;
  lastSynced: string; // ISO string
  isConnected: boolean;
  color: string;
  iban?: string;
  institutionType?: 'Cash' | 'Bank Card' | 'BRT Card' | 'Bank Account';
  cardPhysicality?: 'Physical' | 'Virtual';
  cardNumber?: string;
}
```

### `Transaction`
```ts
{
  id: string;
  accountId: string;
  bankName: string;
  accountName: string;
  amount: number;
  description: string;
  category: string;
  date: string; // ISO string
  type: 'income' | 'expense';
  isNew?: boolean;
  isRecurring?: boolean;
  recurringInterval?: 'weekly' | 'biweekly' | 'monthly';
}
```

### `Budget`
```ts
{ category: string; limit: number; spent: number; color: string; }
```

### `SavingsGoal`
```ts
{
  id: string;
  name: string;
  targetAmount: number;
  linkedAccountIds: string[];
  color: string; // Tailwind color name e.g. 'blue', 'emerald', 'amber', 'rose', 'indigo'
  category: string;
  deadline?: string;
}
```

### `Loan`
```ts
{
  id: string;
  type: 'lent' | 'borrowed';
  personName: string;
  amount: number;
  dateIssued: string;
  dueDate: string;
  status: 'active' | 'settled';
  notes?: string;
  payments?: LoanPayment[];
  accountId?: string;
}
```

### `LoanPayment`
```ts
{ id: string; amount: number; date: string; notes?: string; accountId?: string; }
```

### `BankSyncLog`
```ts
{ id: string; bankName: string; timestamp: string; status: 'success' | 'failed' | 'connecting'; transactionsCount: number; amount: number; }
```

---

## Default Budget Categories (`initialData.ts`)

| Category | Default Limit | Color |
|----------|--------------|-------|
| Food & Groceries | $600 | Blue `#3b82f6` |
| Dining Out | $300 | Emerald `#10b981` |
| Utilities & Bills | $400 | Amber `#f59e0b` |
| Transportation | $250 | Lime `#84cc16` |
| Entertainment | $150 | Pink `#ec4899` |
| Shopping | $350 | Purple `#8b5cf6` |

Extra non-budget categories: `Income`, `Other`

---

## Components Summary

| Component | Page Used In | Key Props |
|-----------|-------------|-----------|
| `AccountsGrid` | AccountsPage | `accounts`, `onSyncAccount`, `onUnlinkAccount`, `onOpenLinkModal`, `onEditAccount`, `onTransfer`, `activeSyncingId` |
| `VisualGraphs` | DashboardPage | `budgets`, `transactions` |
| `BudgetSummary` | BudgetPage | `budgets`, `onUpdateBudgetLimit`, `onResetBudgets`, `onCreateCategory` |
| `TransactionsList` | TransactionsPage | `transactions`, `accounts`, `onAddTransaction`, `onDeleteTransaction`, `onClearAllTransactions`, `categories` |
| `IntelligenceCenter` | DashboardPage | `budgets`, `transactions` |
| `LinkBankModal` | AppLayout (always mounted) | `isOpen`, `onClose`, `onConnectAccounts`, `onUpdateAccount`, `editingAccount`, `existingAccountIds` |
| `SyncNotification` | AppLayout (always mounted) | `notifications`, `onDismiss` |
| `RecurringPredictor` | TransactionsPage | `transactions`, `onTriggerReceipt` |
| `GoalsTracker` | GoalsPage | `accounts`, `goals`, `onAddGoal`, `onDeleteGoal` |
| `NotificationReader` | TransactionsPage | `accounts`, `budgets`, `onAddTransaction` |
| `LoanTracker` | LoansPage | `loans`, `accounts`, `onAddLoan`, `onUpdateLoanStatus`, `onDeleteLoan`, `onAddPayment` |

---

## Dashboard Page Detail (`DashboardPage.tsx`)

The dashboard is the richest page (270 lines). It contains:
- **KPI Summary Cards** (4-column grid): Net Worth (gradient), Assets, Liabilities, This Month (income/expense)
- **Account Balances panel** with inline sync button per account; click card opens edit modal
- **Quick Transfer button** → opens inline Transfer Modal (from/to account selects, amount, optional note)
- **`<VisualGraphs>`** — budget/spending charts
- **`<IntelligenceCenter>`** — Gemini AI spending insights

---

## Environment Variables

```env
GEMINI_API_KEY="..."   # For Gemini AI API calls (AI insights in IntelligenceCenter)
APP_URL="..."          # Hosted app URL (for callbacks/links)
```

---

## Notes & Gotchas

- **React Router v7**: Uses `BrowserRouter` + `Routes`/`Route` from `react-router-dom`. Navigation uses `NavLink` with `end` prop for the index route. `useLocation()` is used in AppLayout to derive the active page title.
- **State via Context**: All state and handlers live in `AppProvider` (`AppContext.tsx`). Pages and components consume via `useAppContext()` — no prop drilling.
- **No HMR**: HMR disabled via `DISABLE_HMR=true` env (AI Studio compatibility).
- **Path alias**: `@` maps to project root (`d:\react js\expance-app-`).
- **Filtered mock data**: On load, old mock IDs (`acct-chase-checking`, `acct-chase-savings`, `acct-summit-card`, `tx-1` through `tx-8`, `goal-emergency`, `goal-vacation`) are stripped from loaded state to prevent demo data pollution.
- **AI Integration**: `@google/genai` is installed — used inside `IntelligenceCenter` for spending insights.
- **Tailwind v4**: Used purely via the Vite plugin (`@tailwindcss/vite`) — no `tailwind.config.js` needed.
- **License**: Apache-2.0 (per file headers).
- **Footer note**: Footer says "All data is stored locally." — accurate, no backend persistence.
- **Modal/toast mounting**: `LinkBankModal` and `SyncNotification` are always rendered inside `AppLayout`, not in individual pages.
