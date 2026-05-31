/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { BankAccount } from '../types';
import { 
  RefreshCw, 
  Plus, 
  Link, 
  Trash2, 
  CheckCircle2, 
  Edit2, 
  ArrowRightLeft, 
  AlertCircle 
} from 'lucide-react';

interface AccountsGridProps {
  accounts: BankAccount[];
  onSyncAccount: (id: string) => void;
  onUnlinkAccount: (id: string) => void;
  onOpenLinkModal: () => void;
  onEditAccount: (account: BankAccount) => void;
  onTransfer: (fromId: string, toId: string, amount: number, note?: string) => { success: boolean; message?: string };
  activeSyncingId: string | null;
}

export default function AccountsGrid({
  accounts,
  onSyncAccount,
  onUnlinkAccount,
  onOpenLinkModal,
  onEditAccount,
  onTransfer,
  activeSyncingId
}: AccountsGridProps) {
  const [isTransferOpen, setIsTransferOpen] = useState(false);
  const [fromAccountId, setFromAccountId] = useState('');
  const [toAccountId, setToAccountId] = useState('');
  const [transferAmount, setTransferAmount] = useState('');
  const [transferNote, setTransferNote] = useState('');
  const [transferError, setTransferError] = useState('');
  const [transferSuccess, setTransferSuccess] = useState('');
  
  const totalBalance = accounts.reduce((sum, acc) => {
    // Treat Credit Card accounts as subtracting from asset balance
    if (acc.accountType === 'Credit Card') {
      return sum - acc.balance;
    }
    return sum + acc.balance;
  }, 0);

  const handleTransferSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setTransferError('');
    setTransferSuccess('');

    if (!fromAccountId || !toAccountId) {
      setTransferError('Please select both a source and a destination account.');
      return;
    }
    if (fromAccountId === toAccountId) {
      setTransferError('Source and destination accounts must be different.');
      return;
    }

    const amountNum = parseFloat(transferAmount);
    if (isNaN(amountNum) || amountNum <= 0) {
      setTransferError('Please enter a valid amount to transfer.');
      return;
    }

    // Optional balance verification for standard checking/savings accounts
    const sourceAcc = accounts.find(a => a.id === fromAccountId);
    if (sourceAcc && sourceAcc.accountType !== 'Credit Card' && sourceAcc.balance < amountNum) {
      setTransferError(`Insufficient funds in ${sourceAcc.bankName} (${sourceAcc.accountName}). Available balance is $${sourceAcc.balance.toFixed(2)}.`);
      return;
    }

    const result = onTransfer(fromAccountId, toAccountId, amountNum, transferNote.trim() || undefined);
    
    if (result.success) {
      setTransferSuccess(`Successfully transferred $${amountNum.toFixed(2)} from ${sourceAcc?.accountName} to the destination account!`);
      setTransferAmount('');
      setTransferNote('');
      setTimeout(() => {
        setTransferSuccess('');
        setIsTransferOpen(false);
      }, 3000);
    } else {
      setTransferError(result.message || 'An error occurred during transfer.');
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Dynamic Summary Panel */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-6 bg-slate-900 text-white rounded-xl border border-slate-800 shadow-lg gap-4 animate-fadeIn">
        <div>
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Aggregate Net Worth</span>
          <h3 className="text-3xl font-bold tracking-tight text-white mt-1">
            ${totalBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </h3>
          <p className="text-sm text-slate-300 flex items-center gap-1.5 mt-1 font-medium">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Encrypted connection active across {accounts.length} linked sources</span>
          </p>
        </div>

        <div className="flex gap-2.5 flex-wrap w-full sm:w-auto">
          {accounts.length >= 2 && (
            <button
              onClick={() => {
                setIsTransferOpen(!isTransferOpen);
                setTransferError('');
                setTransferSuccess('');
              }}
              className="bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-semibold text-sm px-4 py-2.5 rounded-lg flex items-center justify-center gap-2 shadow-md transition-all flex-1 sm:flex-initial"
              id="transfer-money-toggle-btn"
            >
              <ArrowRightLeft className="w-4 h-4" />
              Transfer Money
            </button>
          )}

          <button
            onClick={onOpenLinkModal}
            className="bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold text-sm px-4 py-2.5 rounded-lg flex items-center justify-center gap-2 shadow-md transition-all flex-1 sm:flex-initial"
            id="link-inst-btn-main"
          >
            <Plus className="w-4 h-4" />
            Link New Service
          </button>
        </div>
      </div>

      {/* Account-to-Account Collapsible Transfer Pane */}
      {isTransferOpen && accounts.length >= 2 && (
        <form onSubmit={handleTransferSubmit} className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-4 animate-scaleUp">
          <div className="flex justify-between items-center pb-2 border-b border-slate-200">
            <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <ArrowRightLeft className="w-4 h-4 text-indigo-600 animate-pulse" />
              Transfer Money Between Linked Accounts
            </h4>
            <button
              type="button"
              onClick={() => setIsTransferOpen(false)}
              className="text-xs text-slate-400 hover:text-slate-650 hover:text-slate-600 font-bold"
            >
              Close Form
            </button>
          </div>

          {transferError && (
            <div className="p-3 bg-rose-50 border border-rose-100 rounded-xl text-rose-700 text-xs flex items-center gap-2 animate-fadeIn">
              <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
              <span>{transferError}</span>
            </div>
          )}

          {transferSuccess && (
            <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-xl text-emerald-700 text-xs flex items-center gap-2 animate-fadeIn">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
              <span>{transferSuccess}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
            
            {/* From Account */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                From Account
              </label>
              <select
                required
                className="w-full px-3 py-2 border border-slate-250 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 bg-white rounded-xl text-xs font-semibold text-slate-700 shadow-sm"
                value={fromAccountId}
                onChange={e => {
                  setFromAccountId(e.target.value);
                  if (toAccountId === e.target.value) {
                    setToAccountId('');
                  }
                }}
              >
                <option value="">Select source account...</option>
                {accounts.map(acc => (
                  <option key={acc.id} value={acc.id}>
                    {acc.bankName} - {acc.accountName} (${acc.balance.toFixed(2)})
                  </option>
                ))}
              </select>
            </div>

            {/* To Account */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                To Account
              </label>
              <select
                required
                className="w-full px-3 py-2 border border-slate-250 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 bg-white rounded-xl text-xs font-semibold text-slate-700 shadow-sm"
                value={toAccountId}
                onChange={e => setToAccountId(e.target.value)}
              >
                <option value="">Select destination account...</option>
                {accounts.filter(acc => acc.id !== fromAccountId).map(acc => (
                  <option key={acc.id} value={acc.id}>
                    {acc.bankName} - {acc.accountName} (${acc.balance.toFixed(2)})
                  </option>
                ))}
              </select>
            </div>

            {/* Transfer Amount */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                Transfer Amount ($)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">$</span>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  required
                  placeholder="0.00"
                  className="w-full pl-7 pr-3 py-2 border border-slate-250 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 rounded-xl text-xs font-semibold font-mono text-slate-800 shadow-sm"
                  value={transferAmount}
                  onChange={e => setTransferAmount(e.target.value)}
                />
              </div>
            </div>

            {/* Transfer Note */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                Reference / Note (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. Mutual fund deposit"
                className="w-full px-3 py-2 border border-slate-250 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 rounded-xl text-xs font-semibold text-slate-700 shadow-sm"
                value={transferNote}
                onChange={e => setTransferNote(e.target.value)}
              />
            </div>

          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              className="bg-indigo-600 hover:bg-indigo-700 font-bold text-white text-xs px-5 py-2.5 rounded-xl shadow transition duration-150"
            >
              Execute Money Transfer
            </button>
          </div>
        </form>
      )}

      {/* Grid of connected cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {accounts.map(acc => {
          const isSyncing = activeSyncingId === acc.id;
          const formattedLastSynced = new Date(acc.lastSynced).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
          });

          // Generate professional bank identifier shorthand
          const shorthand = acc.bankName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();

          return (
            <div
              key={acc.id}
              className="relative bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between overflow-hidden group hover:border-slate-350 transition-all cursor-default"
              id={`acct-card-${acc.id}`}
            >
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center font-bold text-sm text-slate-700 uppercase border border-slate-200 shrink-0">
                    {shorthand}
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-widest block">
                        {acc.bankName}
                      </span>
                      {/* Institution Type Badge */}
                      {acc.institutionType && (
                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wider ${
                          acc.institutionType === 'Cash'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                            : acc.institutionType === 'Bank Card'
                              ? 'bg-blue-50 text-blue-700 border border-blue-100'
                              : acc.institutionType === 'BRT Card'
                                ? 'bg-purple-50 text-purple-700 border border-purple-100'
                                : 'bg-slate-50 text-slate-600 border border-slate-150'
                        }`}>
                          {acc.institutionType}
                        </span>
                      )}
                    </div>
                    <h4 className="font-bold text-slate-950 text-base mt-0.5">{acc.accountName}</h4>
                    <div className="text-xs text-slate-500 font-mono font-medium block mt-0.5 space-y-0.5">
                      <div>
                        {acc.accountType}
                        {acc.institutionType !== 'Cash' && ` • ${acc.accountNumber}`}
                      </div>
                      {acc.institutionType === 'Bank Card' && acc.cardPhysicality && (
                        <div className="text-[10px] text-slate-400 font-sans font-bold">
                          Form Factor: <span className="text-indigo-600 uppercase">{acc.cardPhysicality}</span>
                        </div>
                      )}
                    </div>
                    {acc.iban && (
                      <span className="text-[10px] text-indigo-600 font-mono font-semibold block mt-1 bg-indigo-50 border border-indigo-100 px-1.5 py-0.5 rounded w-fit uppercase" title="International Bank Account Number">
                        IBAN: {acc.iban}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex gap-1.5 shrink-0">
                  <button
                    onClick={() => onSyncAccount(acc.id)}
                    disabled={isSyncing}
                    className={`p-2 rounded-md hover:bg-slate-50 border border-slate-200 text-slate-500 hover:text-slate-800 transition-colors ${
                      isSyncing ? 'animate-spin text-blue-600 border-blue-200 bg-blue-50/50' : ''
                    }`}
                    title="Manual Account Sync"
                    id={`sync-acct-btn-${acc.id}`}
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => onEditAccount(acc)}
                    className="p-2 rounded-md hover:bg-slate-50 border border-slate-200 text-slate-500 hover:text-slate-800 transition-colors"
                    title="Edit Bank Details"
                    id={`edit-acct-btn-${acc.id}`}
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => onUnlinkAccount(acc.id)}
                    className="p-2 rounded-md hover:bg-rose-50 border border-slate-200 hover:border-rose-200 text-slate-500 hover:text-rose-700 transition"
                    title="Unlink Account"
                    id={`unlink-acct-btn-${acc.id}`}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <div className="space-y-1 mt-3">
                <span className="text-xs font-bold text-slate-400 tracking-wider uppercase block">Available Balance</span>
                <span className="text-3xl font-bold tracking-tight text-slate-900 block font-mono">
                  ${acc.balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </span>
              </div>

              {/* Status footer inside card */}
              <div className="flex justify-between items-center text-xs text-slate-400 border-t border-slate-100 pt-3 mt-4">
                <span className="flex items-center gap-1.5 text-emerald-600 font-bold uppercase tracking-tight text-[10px]">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block animate-ping" />
                  Live Sync Active
                </span>
                <span className="font-semibold text-[10px] text-slate-400 uppercase">Synced {formattedLastSynced}</span>
              </div>
            </div>
          );
        })}

        {/* Link institution placeholder card */}
        <button
          onClick={onOpenLinkModal}
          className="border-2 border-dashed border-slate-200 hover:border-blue-400 rounded-xl p-6 flex flex-col items-center justify-center text-center gap-3 text-slate-400 hover:text-blue-600 transition-colors hover:bg-blue-50/5 min-h-[190px]"
          id="link-acct-placeholder-btn"
        >
          <div className="p-3.5 bg-slate-100 rounded-lg group-hover:bg-blue-50 text-slate-500 hover:text-blue-600 border border-slate-200">
            <Link className="w-6 h-6" />
          </div>
          <div>
            <p className="font-bold text-sm text-slate-700 group-hover:text-blue-600">+ Link New Institution</p>
            <p className="text-xs text-slate-400 max-w-[200px] mx-auto mt-1 leading-relaxed">Secure integration using multi-factor client authorization mechanisms.</p>
          </div>
        </button>
      </div>

    </div>
  );
}
