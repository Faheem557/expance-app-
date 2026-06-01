/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import VisualGraphs from '../components/VisualGraphs';
import IntelligenceCenter from '../components/IntelligenceCenter';
import {
  TrendingUp, TrendingDown, Wallet, ArrowLeftRight,
  RefreshCw, ChevronRight, Zap,
} from 'lucide-react';

export default function DashboardPage() {
  const {
    accounts, transactions, budgets,
    totalAssets, totalLiabilities, netWorth,
    handleAccountTransfer, handleSyncAccount, activeSyncingId,
    setIsLinkModalOpen, setEditingAccount,
  } = useAppContext();

  const [showTransferModal, setShowTransferModal] = useState(false);
  const [fromId, setFromId] = useState('');
  const [toId, setToId] = useState('');
  const [transferAmount, setTransferAmount] = useState('');
  const [transferNote, setTransferNote] = useState('');
  const [transferError, setTransferError] = useState('');
  const [transferSuccess, setTransferSuccess] = useState('');

  const fmt = (n: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n);

  const thisMonthTxs = transactions.filter(t => {
    const d = new Date(t.date);
    const now = new Date();
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  });

  const monthlyIncome = thisMonthTxs.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const monthlyExpense = thisMonthTxs.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);

  const handleTransfer = () => {
    setTransferError('');
    setTransferSuccess('');
    const amount = parseFloat(transferAmount);
    if (!fromId || !toId) return setTransferError('Please select both accounts.');
    if (fromId === toId) return setTransferError('Source and destination must differ.');
    if (isNaN(amount) || amount <= 0) return setTransferError('Enter a valid positive amount.');
    const result = handleAccountTransfer(fromId, toId, amount, transferNote || undefined);
    if (result.success) {
      setTransferSuccess(`Successfully transferred ${fmt(amount)}.`);
      setTransferAmount('');
      setTransferNote('');
      setTimeout(() => { setShowTransferModal(false); setTransferSuccess(''); }, 1800);
    } else {
      setTransferError(result.message ?? 'Transfer failed.');
    }
  };

  return (
    <div className="space-y-6">

      {/* ── KPI Summary Cards ──────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Net Worth */}
        <div className="col-span-2 lg:col-span-1 bg-gradient-to-br from-indigo-600 to-violet-600 text-white rounded-2xl p-5 shadow-lg shadow-indigo-500/25">
          <div className="flex items-center gap-2 mb-2">
            <Wallet className="w-4 h-4 opacity-70" />
            <p className="text-xs font-semibold uppercase tracking-wider opacity-70">Net Worth</p>
          </div>
          <p className="text-2xl font-black">{fmt(netWorth)}</p>
          <p className="text-xs opacity-60 mt-1">{accounts.length} accounts connected</p>
        </div>

        {/* Total Assets */}
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-4 h-4 text-emerald-500" />
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Assets</p>
          </div>
          <p className="text-xl font-bold text-gray-900">{fmt(totalAssets)}</p>
        </div>

        {/* Total Liabilities */}
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <TrendingDown className="w-4 h-4 text-rose-500" />
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Liabilities</p>
          </div>
          <p className="text-xl font-bold text-gray-900">{fmt(totalLiabilities)}</p>
        </div>

        {/* This month */}
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <Zap className="w-4 h-4 text-amber-500" />
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">This Month</p>
          </div>
          <p className="text-sm font-bold text-emerald-600">+{fmt(monthlyIncome)}</p>
          <p className="text-sm font-bold text-rose-500">-{fmt(monthlyExpense)}</p>
        </div>
      </div>

      {/* ── Account Balance Cards + Quick Transfer ─────────── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-bold text-gray-900">Account Balances</h2>
          <div className="flex gap-2">
            <button
              onClick={() => setShowTransferModal(true)}
              className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 bg-indigo-50 text-indigo-700 rounded-lg hover:bg-indigo-100 transition-all"
            >
              <ArrowLeftRight className="w-3.5 h-3.5" />
              Transfer
            </button>
            <button
              onClick={() => { setEditingAccount(null); setIsLinkModalOpen(true); }}
              className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 bg-gray-50 text-gray-600 rounded-lg hover:bg-gray-100 transition-all"
            >
              + Add Account
            </button>
          </div>
        </div>

        {accounts.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <Wallet className="w-8 h-8 mx-auto mb-2 opacity-30" />
            <p className="text-sm">No accounts linked yet.</p>
            <button
              onClick={() => setIsLinkModalOpen(true)}
              className="mt-3 text-xs text-indigo-600 font-semibold hover:underline"
            >
              Link your first account →
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {accounts.map(acc => (
              <div
                key={acc.id}
                className="flex items-center gap-3 p-3 rounded-xl border border-gray-100 hover:border-indigo-100 hover:bg-indigo-50/30 transition-all group cursor-pointer"
                onClick={() => { setEditingAccount(acc); setIsLinkModalOpen(true); }}
              >
                <div
                  className="w-9 h-9 rounded-lg flex items-center justify-center text-white text-xs font-black flex-shrink-0"
                  style={{ backgroundColor: acc.color }}
                >
                  {acc.bankName.charAt(0)}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold text-gray-800 truncate">{acc.bankName}</p>
                  <p className="text-[10px] text-gray-400 truncate">{acc.accountName}</p>
                  <p className={`text-sm font-black mt-0.5 ${acc.accountType === 'Credit Card' ? 'text-rose-600' : 'text-emerald-600'}`}>
                    {fmt(acc.balance)}
                  </p>
                </div>
                <div className="flex-shrink-0 flex flex-col items-end gap-1">
                  <button
                    onClick={e => { e.stopPropagation(); handleSyncAccount(acc.id); }}
                    className="p-1 rounded-md text-gray-300 hover:text-indigo-500 hover:bg-indigo-50 transition-all"
                    title="Sync"
                  >
                    <RefreshCw className={`w-3 h-3 ${activeSyncingId === acc.id ? 'animate-spin text-indigo-500' : ''}`} />
                  </button>
                  <ChevronRight className="w-3 h-3 text-gray-200 group-hover:text-indigo-400 transition-colors" />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Charts + AI ────────────────────────────────────── */}
      <VisualGraphs budgets={budgets} transactions={transactions} />
      <IntelligenceCenter budgets={budgets} transactions={transactions} />

      {/* ── Transfer Modal ──────────────────────────────────── */}
      {showTransferModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-9 h-9 bg-indigo-100 rounded-xl flex items-center justify-center">
                <ArrowLeftRight className="w-5 h-5 text-indigo-600" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-gray-900">Transfer Money</h3>
                <p className="text-xs text-gray-400">Move funds between your accounts</p>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-gray-500 mb-1 block">From Account</label>
                <select
                  value={fromId}
                  onChange={e => setFromId(e.target.value)}
                  className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-gray-50"
                >
                  <option value="">Select source account…</option>
                  {accounts.map(a => (
                    <option key={a.id} value={a.id}>{a.bankName} — {a.accountName} ({fmt(a.balance)})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 mb-1 block">To Account</label>
                <select
                  value={toId}
                  onChange={e => setToId(e.target.value)}
                  className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-gray-50"
                >
                  <option value="">Select destination account…</option>
                  {accounts.filter(a => a.id !== fromId).map(a => (
                    <option key={a.id} value={a.id}>{a.bankName} — {a.accountName} ({fmt(a.balance)})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 mb-1 block">Amount (USD)</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={transferAmount}
                  onChange={e => setTransferAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-gray-50"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 mb-1 block">Note (optional)</label>
                <input
                  type="text"
                  value={transferNote}
                  onChange={e => setTransferNote(e.target.value)}
                  placeholder="e.g. Rent payment"
                  className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-gray-50"
                />
              </div>

              {transferError && (
                <p className="text-xs text-rose-600 bg-rose-50 px-3 py-2 rounded-lg">{transferError}</p>
              )}
              {transferSuccess && (
                <p className="text-xs text-emerald-600 bg-emerald-50 px-3 py-2 rounded-lg">{transferSuccess}</p>
              )}
            </div>

            <div className="flex gap-3 mt-5">
              <button
                onClick={() => { setShowTransferModal(false); setTransferError(''); setTransferSuccess(''); }}
                className="flex-1 py-2.5 text-sm font-semibold text-gray-500 bg-gray-50 hover:bg-gray-100 rounded-xl transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleTransfer}
                className="flex-1 py-2.5 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-all"
              >
                Transfer Funds
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
