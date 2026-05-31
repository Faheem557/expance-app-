/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Transaction } from '../types';
import { Calendar, Clock, CreditCard, Sparkles, AlertCircle, ChevronRight, Zap, RefreshCw } from 'lucide-react';

interface RecurringPredictorProps {
  transactions: Transaction[];
  onTriggerReceipt?: (tx: Omit<Transaction, 'id'>) => void;
}

interface PredictedItem {
  id: string;
  description: string;
  category: string;
  amount: number;
  interval: 'weekly' | 'biweekly' | 'monthly';
  lastDate: Date;
  nextDate: Date;
  daysRemaining: number;
  accountId: string;
  bankName: string;
  accountName: string;
}

export default function RecurringPredictor({ transactions, onTriggerReceipt }: RecurringPredictorProps) {
  const [justSimulated, setJustSimulated] = useState<string | null>(null);

  // Group transactions by description and find the most recent recurring transaction for each
  const recurringMap: Record<string, Transaction> = {};
  transactions.forEach(t => {
    if (t.isRecurring && t.type === 'expense') {
      const existing = recurringMap[t.description];
      if (!existing || new Date(t.date).getTime() > new Date(existing.date).getTime()) {
        recurringMap[t.description] = t;
      }
    }
  });

  const predictedItems: PredictedItem[] = Object.values(recurringMap).map(tx => {
    const lastDate = new Date(tx.date);
    const nextDate = new Date(lastDate);
    const interval = tx.recurringInterval || 'monthly';

    if (interval === 'weekly') {
      nextDate.setDate(lastDate.getDate() + 7);
    } else if (interval === 'biweekly') {
      nextDate.setDate(lastDate.getDate() + 14);
    } else {
      nextDate.setMonth(lastDate.getMonth() + 1);
    }

    // Days remaining from current system time (May 31, 2026)
    const currentTime = new Date('2026-05-31T08:20:35Z');
    const diffTime = nextDate.getTime() - currentTime.getTime();
    const daysRemaining = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));

    return {
      id: tx.id,
      description: tx.description,
      category: tx.category,
      amount: tx.amount,
      interval,
      lastDate,
      nextDate,
      daysRemaining,
      accountId: tx.accountId,
      bankName: tx.bankName,
      accountName: tx.accountName,
    };
  }).sort((a, b) => a.daysRemaining - b.daysRemaining);

  const total30DaysForecast = predictedItems
    .filter(item => item.daysRemaining <= 30)
    .reduce((sum, item) => sum + item.amount, 0);

  const handleSimulateCharge = (item: PredictedItem) => {
    if (!onTriggerReceipt) return;

    onTriggerReceipt({
      accountId: item.accountId,
      bankName: item.bankName,
      accountName: item.accountName,
      amount: item.amount,
      description: `${item.description} (Auto-Draft)`,
      category: item.category,
      date: new Date().toISOString(),
      type: 'expense',
      isRecurring: true,
      recurringInterval: item.interval,
    });

    setJustSimulated(item.id);
    setTimeout(() => {
      setJustSimulated(null);
    }, 2000);
  };

  return (
    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-5">
      
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <div className="space-y-0.5">
          <div className="flex items-center gap-1.5">
            <h3 className="text-sm font-bold text-slate-900">Subscription Forecast</h3>
            <span className="text-[9px] font-extrabold uppercase bg-indigo-50 border border-indigo-100 text-indigo-600 px-1.5 py-0.5 rounded font-mono leading-none flex items-center gap-0.5">
              <Sparkles className="w-2.5 h-2.5" /> Predicted
            </span>
          </div>
          <p className="text-xs text-slate-505 text-slate-500">Scheduled bills & subscriptions pending sync.</p>
        </div>
      </div>

      {/* Aggregate predicted summary runrate */}
      <div className="p-3.5 bg-indigo-50/40 border border-indigo-100/70 rounded-lg flex items-center justify-between">
        <div className="space-y-0.5">
          <span className="text-[10px] font-bold uppercase text-slate-500 tracking-wide font-mono block">30-Day Predicted Runrate</span>
          <span className="text-xl font-black text-slate-800 font-mono tracking-tight">
            ${total30DaysForecast.toFixed(2)}
          </span>
        </div>
        <div className="bg-indigo-100/50 p-2 rounded-lg">
          <Zap className="w-4 h-4 text-indigo-650" />
        </div>
      </div>

      {/* Checklist stack */}
      <div className="space-y-3">
        {predictedItems.length === 0 ? (
          <div className="p-6 text-center border border-dashed border-slate-200 rounded-lg bg-slate-50/50">
            <AlertCircle className="w-6 h-6 text-slate-400 mx-auto mb-2" />
            <span className="text-xs text-slate-500 font-bold block">No Pending Schedules</span>
            <span className="text-[10px] text-slate-400 block mt-0.5">
              Check "Set as Recurring" when creating active ledger expenses to prompt prediction streams here.
            </span>
          </div>
        ) : (
          predictedItems.map(item => {
            const isClosingIn = item.daysRemaining <= 5;
            
            return (
              <div 
                key={item.id} 
                className="p-3 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg transition-colors flex items-center justify-between gap-3 font-sans group"
                id={`predictor-item-${item.id}`}
              >
                <div className="min-w-0 flex-1 space-y-1">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <h4 className="font-bold text-slate-800 text-xs truncate leading-none uppercase tracking-tight">{item.description}</h4>
                    <span className="text-[8px] font-black uppercase font-mono px-1 py-0.5 bg-slate-100 text-slate-600 rounded">
                      {item.interval}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-[10px] text-slate-400 font-medium">
                    <span className="flex items-center gap-0.5 shrink-0 font-mono">
                      <CreditCard className="w-3 h-3 text-slate-300" />
                      {item.accountName.split(' ')[0]}
                    </span>
                    <span className="text-slate-300">•</span>
                    <span className="flex items-center gap-0.5 text-slate-550 truncate">
                      <Calendar className="w-3 h-3 text-slate-350 shrink-0" />
                      Est. {item.nextDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </span>
                  </div>
                </div>

                <div className="shrink-0 flex items-center gap-3">
                  <div className="text-right">
                    <span className="block text-xs font-black text-slate-900 font-mono">${item.amount.toFixed(2)}</span>
                    <span className={`text-[9px] font-bold block font-mono ${
                      isClosingIn 
                        ? 'text-amber-600 animate-pulse font-extrabold' 
                        : 'text-slate-400'
                    }`}>
                      {item.daysRemaining === 0 
                        ? 'Due Today' 
                        : item.daysRemaining === 1 
                          ? 'Due Tomorrow' 
                          : `In ${item.daysRemaining} days`}
                    </span>
                  </div>

                  {onTriggerReceipt && (
                    <button
                      onClick={() => handleSimulateCharge(item)}
                      disabled={justSimulated === item.id}
                      className={`p-1.5 rounded-lg border flex items-center justify-center transition disabled:opacity-50 ${
                        justSimulated === item.id 
                          ? 'bg-emerald-50 text-emerald-600 border-emerald-200'
                          : 'bg-slate-50 hover:bg-indigo-50 text-slate-500 hover:text-indigo-650 border-slate-200 group-hover:border-slate-300'
                      }`}
                      title="Post scheduled billing transaction manually now"
                      id={`simulate-charge-${item.id}`}
                    >
                      {justSimulated === item.id ? (
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <ChevronRight className="w-3.5 h-3.5" />
                      )}
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
