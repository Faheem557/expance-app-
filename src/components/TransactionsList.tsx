/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Transaction, BankAccount } from '../types';
import { CATEGORIES } from '../initialData';
import { Search, Filter, ArrowUpRight, ArrowDownLeft, Plus, Calendar, CreditCard, Tag, Sparkles } from 'lucide-react';

interface TransactionsListProps {
  transactions: Transaction[];
  accounts: BankAccount[];
  onAddTransaction: (tx: Omit<Transaction, 'id'>) => void;
}

export default function TransactionsList({ transactions, accounts, onAddTransaction }: TransactionsListProps) {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedAccount, setSelectedAccount] = useState('All');
  const [showAddForm, setShowAddForm] = useState(false);

  // Manual transaction inputs
  const [manualDescription, setManualDescription] = useState('');
  const [manualCategory, setManualCategory] = useState(CATEGORIES[0]);
  const [manualAccountId, setManualAccountId] = useState(accounts[0]?.id || '');
  const [manualAmount, setManualAmount] = useState('');
  const [manualType, setManualType] = useState<'income' | 'expense'>('expense');
  const [manualIsRecurring, setManualIsRecurring] = useState(false);
  const [manualRecurringInterval, setManualRecurringInterval] = useState<'weekly' | 'biweekly' | 'monthly'>('monthly');
  const [formError, setFormError] = useState('');

  const handleManualAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    const amt = parseFloat(manualAmount);
    if (!manualDescription.trim()) {
      setFormError('Please fill in description/payee');
      return;
    }
    if (isNaN(amt) || amt <= 0) {
      setFormError('Please enter a valid positive amount');
      return;
    }

    const matchedAccount = accounts.find(a => a.id === manualAccountId);
    if (!matchedAccount) {
      setFormError('Please select a connected account');
      return;
    }

    onAddTransaction({
      accountId: manualAccountId,
      bankName: matchedAccount.bankName,
      accountName: matchedAccount.accountName,
      amount: amt,
      description: manualDescription,
      category: manualCategory,
      date: new Date().toISOString(),
      type: manualType,
      isRecurring: manualIsRecurring,
      recurringInterval: manualIsRecurring ? manualRecurringInterval : undefined
    });

    // Reset fields
    setManualDescription('');
    setManualAmount('');
    setManualIsRecurring(false);
    setManualRecurringInterval('monthly');
    setShowAddForm(false);
  };

  // Filter computation
  const filteredTxs = transactions.filter(t => {
    const matchesSearch = t.description.toLowerCase().includes(search.toLowerCase()) || 
                          t.category.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || t.category === selectedCategory;
    const matchesAccount = selectedAccount === 'All' || t.accountId === selectedAccount;
    return matchesSearch && matchesCategory && matchesAccount;
  });

  return (
    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
      
      {/* Header and Add Toggle */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-slate-100 pb-4 gap-3">
        <div>
          <h3 className="text-base font-bold text-slate-900">Ledger</h3>
          <p className="text-xs text-slate-500">Showing feed of live synced items and manual ledger logs.</p>
        </div>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="bg-slate-900 hover:bg-slate-800 active:bg-slate-950 text-white font-bold text-xs px-3.5 py-2.5 rounded transition-colors flex items-center gap-1.5 shadow-sm"
          id="toggle-add-tx-form"
        >
          <Plus className="w-4 h-4" />
          Log Expense
        </button>
      </div>

      {/* Manual Input Drawer */}
      {showAddForm && (
        <form onSubmit={handleManualAddSubmit} className="p-5 bg-slate-50 rounded bg-white border border-slate-200/80 space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <h4 className="text-xs uppercase font-mono tracking-wider font-bold text-slate-500">Log Feed Item</h4>
            <span className="text-[10px] text-slate-400 font-mono text-right">Updates active margins</span>
          </div>

          {formError && (
            <div className="p-2.5 bg-rose-50 text-rose-800 text-xs rounded border border-rose-100">
              {formError}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Payee / Description</label>
              <input
                type="text"
                className="w-full px-3 py-2 border border-slate-200 rounded text-xs text-slate-800 bg-white focus:outline-none focus:ring-1 focus:ring-blue-600 focus:border-blue-600"
                placeholder="Whole Foods Store"
                value={manualDescription}
                onChange={e => setManualDescription(e.target.value)}
                required
                id="manual-payee-field"
              />
            </div>

            <div>
              <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Category Allocation</label>
              <select
                className="w-full px-2.5 py-2 border border-slate-200 rounded text-xs text-slate-850 bg-white focus:outline-none focus:ring-1 focus:ring-blue-600 focus:border-blue-600"
                value={manualCategory}
                onChange={e => setManualCategory(e.target.value)}
                id="manual-category-field"
              >
                {CATEGORIES.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Source Account</label>
              <select
                className="w-full px-2.5 py-2 border border-slate-200 rounded text-xs text-slate-855 bg-white focus:outline-none focus:ring-1 focus:ring-blue-600 focus:border-blue-600"
                value={manualAccountId}
                onChange={e => setManualAccountId(e.target.value)}
                id="manual-acct-field"
              >
                {accounts.map(acc => (
                  <option key={acc.id} value={acc.id}>{acc.bankName} - {acc.accountName}</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Type</label>
                <select
                  className="w-full px-2.5 py-2 border border-slate-200 rounded text-xs text-slate-850 bg-white focus:outline-none focus:ring-1 focus:ring-blue-600 focus:border-blue-600"
                  value={manualType}
                  onChange={e => setManualType(e.target.value as any)}
                  id="manual-flow-field"
                >
                  <option value="expense">Expense (-)</option>
                  <option value="income">Income (+)</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Value ($)</label>
                <input
                  type="number"
                  step="0.01"
                  className="w-full px-3 py-2 border border-slate-200 rounded text-xs text-slate-850 font-mono text-right bg-white focus:outline-none focus:ring-1 focus:ring-blue-600 focus:border-blue-600"
                  placeholder="24.50"
                  value={manualAmount}
                  onChange={e => setManualAmount(e.target.value)}
                  required
                  id="manual-amount-field"
                />
              </div>
            </div>
          </div>

          {/* Recurring Options Subsection */}
          <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center gap-4 bg-slate-50/70 p-3.5 rounded border border-slate-200/60">
            <label className="flex items-center gap-2.5 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={manualIsRecurring}
                onChange={e => setManualIsRecurring(e.target.checked)}
                className="w-4.5 h-4.5 text-blue-600 rounded border-slate-300 focus:ring-blue-500 cursor-pointer"
                id="manual-recurring-checkbox"
              />
              <div>
                <span className="block text-xs font-bold text-slate-800">Set as Recurring Charge</span>
                <span className="block text-[10.5px] text-slate-500">Log as subscription or recurring bill in forecast trackers</span>
              </div>
            </label>

            {manualIsRecurring && (
              <div className="flex items-center gap-2 mt-2 sm:mt-0">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">Interval</span>
                <select
                  value={manualRecurringInterval}
                  onChange={e => setManualRecurringInterval(e.target.value as any)}
                  className="px-2.5 py-1.5 border border-slate-200 rounded text-xs text-slate-800 bg-white focus:outline-none focus:ring-1 focus:ring-blue-600 focus:border-blue-600"
                  id="manual-recurring-interval-field"
                >
                  <option value="weekly">Weekly</option>
                  <option value="biweekly">Bi-weekly</option>
                  <option value="monthly">Monthly</option>
                </select>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="py-1.5 px-3.5 border border-slate-200 hover:bg-slate-50 rounded text-slate-650 font-bold text-xs transition-colors"
              id="cancel-manual-add"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="py-1.5 px-3.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded transition-colors"
              id="submit-manual-add"
            >
              Add Item
            </button>
          </div>
        </form>
      )}

      {/* Sorter / Filter Options Bar */}
      <div className="flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-350 focus:bg-white"
            placeholder="Search details by merchant name, brand or ledger..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            id="search-txs-input"
          />
        </div>

        <div className="flex gap-2 flex-wrap">
          <div className="relative flex items-center">
            <Filter className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 pointer-events-none" />
            <select
              className="pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded text-xs text-slate-600 focus:outline-none focus:ring-1 focus:ring-slate-350"
              value={selectedCategory}
              onChange={e => setSelectedCategory(e.target.value)}
              id="filter-category"
            >
              <option value="All">All Categories</option>
              {CATEGORIES.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          <div className="relative flex items-center">
            <CreditCard className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 pointer-events-none" />
            <select
              className="pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded text-xs text-slate-600 focus:outline-none focus:ring-1 focus:ring-slate-350"
              value={selectedAccount}
              onChange={e => setSelectedAccount(e.target.value)}
              id="filter-pipeline"
            >
              <option value="All">All Linked Banks</option>
              {accounts.map(acc => (
                <option key={acc.id} value={acc.id}>{acc.bankName} ({acc.accountName.split(' ')[0]})</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Actual Transaction List Content */}
      <div className="overflow-x-auto rounded-lg border border-slate-200">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-slate-50 text-slate-500 font-bold uppercase border-b border-slate-200">
              <th className="p-4 font-bold">Details / Payee</th>
              <th className="p-4 font-bold">Category</th>
              <th className="p-4 font-bold">Linked Account</th>
              <th className="p-4 font-bold">Timestamp</th>
              <th className="p-4 text-right font-bold">Value</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredTxs.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-center p-8 text-slate-400 font-medium">
                  No matching transaction history matches criteria filters. Try syncing or logging a manual detail.
                </td>
              </tr>
            ) : (
              filteredTxs.map(tx => {
                const formattedDate = new Date(tx.date).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                });

                const isExpense = tx.type === 'expense';

                return (
                  <tr
                    key={tx.id}
                    className={`transition-colors duration-200 hover:bg-slate-50/50 ${
                      tx.isNew ? 'bg-emerald-50/15 animate-pulse border-l-2 border-emerald-500' : ''
                    }`}
                    id={`tx-row-${tx.id}`}
                  >
                    {/* Payee Details Column */}
                    <td className="p-4">
                      <div className="flex items-center gap-2.5">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border ${
                          isExpense ? 'bg-rose-50 border-rose-100 text-rose-600' : 'bg-emerald-50 border-emerald-100 text-emerald-600'
                        }`}>
                          {isExpense ? (
                            <ArrowDownLeft className="w-4 h-4" />
                          ) : (
                            <ArrowUpRight className="w-4 h-4" />
                          )}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 leading-normal">{tx.description}</p>
                          <div className="flex flex-wrap gap-1.5 mt-1">
                            {tx.isNew && (
                              <span className="inline-flex items-center gap-0.5 text-[9px] bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">
                                <Sparkles className="w-2.5 h-2.5" /> Synced
                              </span>
                            )}
                            {tx.isRecurring && (
                              <span className="inline-flex items-center gap-1 text-[9px] bg-indigo-50 text-indigo-700 border border-indigo-100 px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">
                                <span className="relative flex h-1.5 w-1.5 shrink-0 animate-pulse">
                                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-indigo-600"></span>
                                </span>
                                <span>{tx.recurringInterval}</span>
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Category Identifier Column */}
                    <td className="p-4 whitespace-nowrap">
                      <span className="inline-flex items-center gap-1 font-bold text-[10px] text-slate-600 bg-slate-100 px-2 py-1 rounded border border-slate-200/60">
                        <Tag className="w-3 h-3 text-slate-400" />
                        {tx.category}
                      </span>
                    </td>

                    {/* Financial Gateway Source Column */}
                    <td className="p-4 whitespace-nowrap text-slate-500">
                      <div className="flex flex-col">
                        <span className="font-bold text-slate-800 leading-tight">{tx.bankName}</span>
                        <span className="text-[10px] font-mono text-slate-400 mt-0.5">{tx.accountName.split(' ')[0]}</span>
                      </div>
                    </td>

                    {/* Numeric Calendar Date Column */}
                    <td className="p-4 whitespace-nowrap text-slate-400 font-mono">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-slate-400" />
                        <span>{formattedDate}</span>
                      </div>
                    </td>

                    {/* Amount Balance Column */}
                    <td className={`p-4 text-right font-bold text-sm font-mono whitespace-nowrap ${
                      isExpense ? 'text-slate-900' : 'text-emerald-600'
                    }`}>
                      {isExpense ? '-' : '+'}${tx.amount.toFixed(2)}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

    </div>
  );
}
