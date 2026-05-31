/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Budget } from '../types';
import { Settings, Pencil, Check, AlertCircle, RefreshCw, Undo2, HelpCircle } from 'lucide-react';

interface BudgetSummaryProps {
  budgets: Budget[];
  onUpdateBudgetLimit: (category: string, limit: number) => void;
  onResetBudgets: () => void;
}

export default function BudgetSummary({ budgets, onUpdateBudgetLimit, onResetBudgets }: BudgetSummaryProps) {
  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [editLimitValue, setEditLimitValue] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState('');

  const totalLimit = budgets.reduce((sum, b) => sum + b.limit, 0);
  const totalSpent = budgets.reduce((sum, b) => sum + b.spent, 0);
  const remainingBudget = totalLimit - totalSpent;

  const handleStartEdit = (category: string, currentLimit: number) => {
    setEditingCategory(category);
    setEditLimitValue(currentLimit.toString());
    setErrorMessage('');
  };

  const handleSaveEdit = (category: string) => {
    const parsed = parseFloat(editLimitValue);
    if (isNaN(parsed) || parsed < 0) {
      setErrorMessage('Please enter a valid positive number');
      return;
    }
    onUpdateBudgetLimit(category, parsed);
    setEditingCategory(null);
    setErrorMessage('');
  };

  return (
    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-6 flex flex-col justify-between">
      
      <div>
        {/* Dynamic Summary Cards */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="space-y-1">
            <h3 className="text-base font-bold text-slate-900">Envelopes</h3>
            <p className="text-xs text-slate-500">Configure parameters to monitor active transaction thresholds.</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={onResetBudgets}
              className="px-2.5 py-1.5 rounded-md border border-slate-200 hover:bg-slate-50 text-slate-600 hover:text-slate-900 transition-colors flex items-center gap-1 text-xs font-semibold"
              title="Reset to Template Defaults"
              id="reset-budgets-btn"
            >
              <Undo2 className="w-3 h-3" />
              <span>Reset</span>
            </button>
          </div>
        </div>

        {/* Aggregate metrics strips */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 my-4">
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200/60">
            <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider">Allocated Cap</span>
            <span className="text-base font-bold text-slate-800 font-mono mt-0.5 block">
              ${totalLimit.toLocaleString('en-US', { minimumFractionDigits: 0 })}
            </span>
          </div>
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200/60">
            <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider">Total Spent</span>
            <span className="text-base font-bold text-slate-800 font-mono mt-0.5 block">
              ${totalSpent.toLocaleString('en-US', { minimumFractionDigits: 0 })}
            </span>
          </div>
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200/60">
            <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider">Buffer</span>
            <span className={`text-base font-bold font-mono mt-0.5 block ${remainingBudget < 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
              {remainingBudget < 0 ? '-' : ''}${Math.abs(remainingBudget).toLocaleString('en-US', { minimumFractionDigits: 0 })}
            </span>
          </div>
        </div>

        {errorMessage && (
          <div className="p-2.5 bg-rose-50 text-rose-850 text-xs rounded-lg border border-rose-100 my-2">
            {errorMessage}
          </div>
        )}

        {/* Categories Row Stack */}
        <div className="space-y-4">
          {budgets.map(b => {
            const ratio = b.limit > 0 ? b.spent / b.limit : 0;
            const percentage = Math.round(ratio * 100);
            
            // Determine styling based on exhaustion
            let barColor = 'bg-blue-600';
            let textColor = 'text-blue-700';
            let bgColor = 'bg-blue-50 border border-blue-105';

            if (ratio >= 1.0) {
              barColor = 'bg-rose-600';
              textColor = 'text-rose-700 font-bold';
              bgColor = 'bg-rose-50 border border-rose-100';
            } else if (ratio >= 0.8) {
              barColor = 'bg-amber-500';
              textColor = 'text-amber-700 font-bold';
              bgColor = 'bg-amber-50 border border-amber-100';
            } else if (ratio >= 0.5) {
              barColor = 'bg-slate-700';
              textColor = 'text-slate-705 font-bold';
              bgColor = 'bg-slate-100 border border-slate-150';
            } else {
              barColor = 'bg-emerald-600';
              textColor = 'text-emerald-705 font-bold';
              bgColor = 'bg-emerald-50 border border-emerald-100';
            }

            const isEditing = editingCategory === b.category;

            return (
              <div key={b.category} className="space-y-2 p-3 hover:bg-slate-50/50 rounded-lg border border-transparent hover:border-slate-100 transition duration-150">
                
                <div className="flex justify-between items-center text-xs">
                  
                  {/* Category Identity and Badge */}
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: b.color }} />
                    <span className="font-bold text-slate-800 text-sm whitespace-nowrap">{b.category}</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-mono tracking-wider font-semibold ${bgColor}`}>
                      {percentage}%
                    </span>
                  </div>

                  {/* Spent & Limit Adjustment Inputs */}
                  <div className="flex items-center gap-2">
                    <div className="text-right">
                      <span className="font-mono text-slate-500 font-semibold text-xs">
                        ${b.spent.toLocaleString('en-US', { minimumFractionDigits: 0 })}
                      </span>
                      <span className="text-slate-400 text-[10px] mx-1">of</span>
                      
                      {isEditing ? (
                        <input
                          type="number"
                          className="w-20 px-1.5 py-0.5 border border-blue-500 rounded font-mono text-xs focus:ring-1 focus:ring-blue-600 focus:outline-none text-right bg-white"
                          value={editLimitValue}
                          onChange={e => setEditLimitValue(e.target.value)}
                          onBlur={() => handleSaveEdit(b.category)}
                          onKeyDown={e => {
                            if (e.key === 'Enter') handleSaveEdit(b.category);
                            if (e.key === 'Escape') setEditingCategory(null);
                          }}
                          autoFocus
                          id={`edit-limit-input-${b.category}`}
                        />
                      ) : (
                        <span className="font-mono text-slate-800 font-bold text-xs">
                          ${b.limit.toLocaleString('en-US', { minimumFractionDigits: 0 })}
                        </span>
                      )}
                    </div>

                    {!isEditing && (
                      <button
                        onClick={() => handleStartEdit(b.category, b.limit)}
                        className="p-1 rounded hover:bg-slate-150 text-slate-400 hover:text-slate-800 transition-colors"
                        title="Adjust Cap Target"
                        id={`edit-budget-btn-${b.category}`}
                      >
                        <Pencil className="w-3 h-3" />
                      </button>
                    )}
                  </div>

                </div>

                {/* Progress Bar Container */}
                <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${barColor} rounded-full transition-all duration-300`}
                    style={{ width: `${Math.min(100, percentage)}%` }}
                  />
                </div>

                {/* Overdraft Warning Banner */}
                {ratio >= 1.0 && (
                  <div className="flex items-center gap-1.5 text-[10px] text-rose-700 font-bold bg-rose-50 p-2 rounded-md border border-rose-100">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>Overdraft by ${Math.round(b.spent - b.limit)}. Limit adjusting advised.</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
