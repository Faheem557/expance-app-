# 📁 Project Memory — Real-Time Budget Sync (Expense App)

## Overview
**Project Name:** Real-Time Budget Sync  
**Type:** Personal Finance / Expense Tracker  
**Stack:** React 19 + TypeScript + Vite + Tailwind CSS v4  
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
| Lucide React | ^0.546.0 | Icon library |
| @google/genai | ^2.4.0 | Gemini AI API integration |
| motion | ^12.23.24 | Animations (Framer Motion) |
| express | ^4.21.2 | Backend server (for API proxy?) |
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
├── assets/
│   └── .aistudio/          # AI Studio config
├── dist/                   # Build output
└── src/
    ├── main.tsx            # React entry point
    ├── App.tsx             # Root component (712 lines) — central state manager
    ├── index.css           # Global styles (minimal, 24 bytes)
    ├── types.ts            # TypeScript interfaces & types
    ├── initialData.ts      # Seed data, budget defaults, merchant generators
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
  color: string; // e.g., 'blue', 'emerald', 'amber'
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

### `BankSyncLog`
```ts
{ id: string; bankName: string; timestamp: string; status: 'success' | 'failed' | 'connecting'; transactionsCount: number; amount: number; }
```

---

## Central State — `App.tsx`

All state lives in `App.tsx`. Persisted to **localStorage**.

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

### Key Handler Functions

| Function | Description |
|----------|-------------|
| `addTransactionPayload(tx)` | Adds a tx, updates account balance, triggers toast notification |
| `handleSyncAccount(id)` | Simulates account refresh (updates `lastSynced` after 1s) |
| `handleUnlinkAccount(id)` | Removes account + its transactions, recalculates budgets |
| `handleConnectAccounts(newAccs)` | Adds new accounts from the Link modal |
| `handleUpdateAccount(acc)` | Updates account + propagates name changes to transactions |
| `handleAccountTransfer(from, to, amt)` | Creates paired expense/income transactions for transfers |
| `handleUpdateBudgetLimit(cat, limit)` | Updates spending limit for a category |
| `handleAddGoal / handleDeleteGoal` | CRUD for savings goals |
| `handleDeleteTransaction(id)` | Deletes tx + reverses balance impact on account |
| `handleClearAllTransactions()` | Wipes all transactions, resets budget spend |
| `handleCreateCategory(name, limit, color)` | Adds new category to both `categories` and `budgets` |
| `handleAddLoan / handleDeleteLoan` | CRUD for loans, reflects balance in account |
| `handleAddLoanPayment(loanId, amt)` | Adds payment, auto-settles if fully paid |
| `handleUpdateLoanStatus(id, status)` | Manually toggles loan status |
| `handleResetToDefaults()` | Full localStorage wipe + state reset |
| `recalcBudgetSpend(txs)` | Recalculates all budget `spent` values from transaction list |

### Financial Computations
```ts
totalAssets     = sum of non-CreditCard account balances
totalLiabilities = sum of CreditCard account balances
netWorth        = totalAssets - totalLiabilities
```

### Credit Card Balance Logic
- **Expenses** on Credit Card → **increase** balance (statement debt grows)
- **Income** on Credit Card → **decrease** balance (payment reduces debt)
- Transfer/Delete logic reverses these rules accordingly

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

| Component | Purpose | Key Props |
|-----------|---------|-----------|
| `AccountsGrid` | Shows bank account cards, sync/unlink/edit/transfer | `accounts`, `onSyncAccount`, `onUnlinkAccount`, `onOpenLinkModal`, `onEditAccount`, `onTransfer`, `activeSyncingId` |
| `VisualGraphs` | Charts/graphs of spending by category | `budgets`, `transactions` |
| `BudgetSummary` | Budget envelope limits sidebar | `budgets`, `onUpdateBudgetLimit`, `onResetBudgets`, `onCreateCategory` |
| `TransactionsList` | Ledger list, manual add & delete | `transactions`, `accounts`, `onAddTransaction`, `onDeleteTransaction`, `onClearAllTransactions`, `categories` |
| `IntelligenceCenter` | AI-powered spending insights | `budgets`, `transactions` |
| `LinkBankModal` | Multi-step modal to add/edit bank accounts | `isOpen`, `onClose`, `onConnectAccounts`, `onUpdateAccount`, `editingAccount`, `existingAccountIds` |
| `SyncNotification` | Toast popups for incoming transactions | `notifications`, `onDismiss` |
| `RecurringPredictor` | Detects & simulates recurring transactions | `transactions`, `onTriggerReceipt` |
| `GoalsTracker` | Savings goals with linked accounts | `accounts`, `goals`, `onAddGoal`, `onDeleteGoal` |
| `NotificationReader` | Parses bank SMS/notifications to extract transactions | `accounts`, `budgets`, `onAddTransaction` |
| `LoanTracker` | Lent/borrowed loan management with payments | `loans`, `accounts`, `onAddLoan`, `onUpdateLoanStatus`, `onDeleteLoan`, `onAddPayment` |

---

## Environment Variables

```env
GEMINI_API_KEY="..."   # For Gemini AI API calls (AI insights)
APP_URL="..."          # Hosted app URL (for callbacks/links)
```

---

## UI Layout (App.tsx JSX Structure)

```
<div> (min-h-screen, gray-50 bg)
  <header>  (sticky top bar)
    - Logo: "Real-Time Budget Sync" + live pulse indicator
    - Actions: Mute Alerts toggle | Clear Dashboard button
  <main> (max-w-7xl, 4 sections)
    Section 1 — AccountsGrid
    Section 2 — Charts (8/12) + Budget sidebar (4/12)
                └── VisualGraphs, NotificationReader, IntelligenceCenter
                └── BudgetSummary, RecurringPredictor
    Section 3 — GoalsTracker
    Section 3.5 — LoanTracker
    Section 4 — TransactionsList
  <footer>  (copyright + "Secure Gateway Connected" indicator)
  <LinkBankModal>  (portal modal, always rendered)
  <SyncNotification>  (overlay toast stack)
```

---

## Notes & Gotchas

- **No router**: Single-page, no React Router — all views on one page via sections.
- **HMR disabled** via `DISABLE_HMR=true` env (AI Studio compatibility).
- **Path alias**: `@` maps to project root (`d:\react js\expance-app-`).
- **Filtered mock data**: On load, old mock IDs (`acct-chase-*`, `tx-1` through `tx-8`, `goal-emergency`, `goal-vacation`) are stripped from loaded state to prevent demo data pollution.
- **AI Integration**: `@google/genai` is installed — used inside `IntelligenceCenter` for spending insights.
- **License**: Apache-2.0 (per file headers).
- **No global CSS framework config** — Tailwind v4 is used purely via the Vite plugin with no `tailwind.config.js` needed.
