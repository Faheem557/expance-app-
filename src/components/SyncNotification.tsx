/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect } from 'react';
import { Sparkles, BellRing, X, Activity, DollarSign, ArrowDownLeft } from 'lucide-react';
import { Transaction } from '../types';

interface SyncNotificationProps {
  notifications: Transaction[];
  onDismiss: (id: string) => void;
}

export default function SyncNotification({ notifications, onDismiss }: SyncNotificationProps) {
  
  // Auto dismiss individual toasts after 6 seconds to prevent screen bloat
  useEffect(() => {
    if (notifications.length > 0) {
      const newest = notifications[notifications.length - 1];
      const timer = setTimeout(() => {
        onDismiss(newest.id);
      }, 6000);
      return () => clearTimeout(timer);
    }
  }, [notifications, onDismiss]);

  if (notifications.length === 0) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3.5 max-w-sm w-full pointer-events-none">
      {notifications.map(tx => {
        const isExpense = tx.type === 'expense';
        return (
          <div
            key={tx.id}
            className="pointer-events-auto bg-gray-900 border border-zinc-800 text-white p-4 rounded-2xl shadow-2xl flex items-start gap-3.5 animate-slide-in relative"
            style={{
              animation: 'slideIn 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards'
            }}
            id={`notif-${tx.id}`}
          >
            {/* Header sparkle signal animation */}
            <div className="w-9 h-9 bg-indigo-600/30 rounded-xl flex items-center justify-center text-indigo-400 shrink-0">
              <Sparkles className="w-4.5 h-4.5 animate-pulse" />
            </div>

            <div className="flex-1 min-w-0 pr-2">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-indigo-400">
                  Real-Time Sync Handshake
                </span>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping shrink-0" />
              </div>

              <h5 className="font-bold text-sm truncate text-white mt-1 leading-normal">
                {tx.description}
              </h5>

              <p className="text-xs text-gray-400 mt-0.5">
                {tx.bankName} • {tx.accountName.split(' ')[0]}
              </p>

              <div className="flex items-center gap-2 mt-2">
                <span className="text-[10px] bg-zinc-800 px-2 py-0.5 rounded font-mono text-gray-300 font-semibold">
                  {tx.category}
                </span>
                <span className={`text-xs font-bold font-mono ${isExpense ? 'text-amber-400' : 'text-emerald-400'}`}>
                  {isExpense ? '-' : '+'}${tx.amount.toFixed(2)}
                </span>
              </div>
            </div>

            {/* Custom exit action clicks */}
            <button
              onClick={() => onDismiss(tx.id)}
              className="p-1 rounded-lg text-gray-400 hover:text-white hover:bg-zinc-800 transition shrink-0"
              id={`dismiss-notif-${tx.id}`}
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}

      {/* Embedded CSS slide in animation inside component to keep code entirely self-contained */}
      <style>{`
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateY(2rem) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
      `}</style>
    </div>
  );
}
