/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { BankAccount } from '../types';
import { RefreshCw, Plus, Link, Trash2, ShieldCheck, CheckCircle2 } from 'lucide-react';

interface AccountsGridProps {
  accounts: BankAccount[];
  onSyncAccount: (id: string) => void;
  onUnlinkAccount: (id: string) => void;
  onOpenLinkModal: () => void;
  activeSyncingId: string | null;
}

export default function AccountsGrid({
  accounts,
  onSyncAccount,
  onUnlinkAccount,
  onOpenLinkModal,
  activeSyncingId
}: AccountsGridProps) {
  
  const totalBalance = accounts.reduce((sum, acc) => {
    // Treat Credit Card accounts as subtracting from asset balance
    if (acc.accountType === 'Credit Card') {
      return sum - acc.balance;
    }
    return sum + acc.balance;
  }, 0);

  return (
    <div className="space-y-6">
      
      {/* Dynamic Summary Panel */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-6 bg-slate-900 text-white rounded-xl border border-slate-800 shadow-lg gap-4">
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

        <button
          onClick={onOpenLinkModal}
          className="bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold text-sm px-4 py-2.5 rounded-lg flex items-center gap-2 shadow-md transition-colors"
          id="link-inst-btn-main"
        >
          <Plus className="w-4 h-4" />
          Link New Service
        </button>
      </div>

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
                  <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center font-bold text-sm text-slate-700 uppercase border border-slate-200">
                    {shorthand}
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-widest block">
                      {acc.bankName}
                    </span>
                    <h4 className="font-bold text-slate-950 text-base mt-0.5">{acc.accountName}</h4>
                    <span className="text-xs text-slate-500 font-mono font-medium block mt-0.5">{acc.accountType} • {acc.accountNumber}</span>
                  </div>
                </div>

                <div className="flex gap-1.5">
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
