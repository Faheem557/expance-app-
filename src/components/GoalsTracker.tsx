/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { BankAccount, SavingsGoal } from '../types';
import { 
  Target, 
  Plus, 
  Trash2, 
  PiggyBank, 
  Calendar, 
  Link2, 
  Trophy, 
  Sparkles, 
  AlertCircle, 
  ChevronRight, 
  BadgeCheck, 
  DollarSign,
  TrendingUp,
  X
} from 'lucide-react';

interface GoalsTrackerProps {
  accounts: BankAccount[];
  goals: SavingsGoal[];
  onAddGoal: (goal: Omit<SavingsGoal, 'id'>) => void;
  onDeleteGoal: (id: string) => void;
}

export default function GoalsTracker({ accounts, goals, onAddGoal, onDeleteGoal }: GoalsTrackerProps) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [newGoalName, setNewGoalName] = useState('');
  const [newTargetAmount, setNewTargetAmount] = useState('');
  const [newLinkedAccounts, setNewLinkedAccounts] = useState<string[]>([]);
  const [newCategory, setNewCategory] = useState('Emergency Fund');
  const [newColor, setNewColor] = useState('indigo');
  const [newDeadline, setNewDeadline] = useState('');
  const [formError, setFormError] = useState('');

  const PRESET_COLORS = [
    { name: 'indigo', bg: 'bg-indigo-600', text: 'text-indigo-600', border: 'border-indigo-200' },
    { name: 'emerald', bg: 'bg-emerald-600', text: 'text-emerald-600', border: 'border-emerald-200' },
    { name: 'amber', bg: 'bg-amber-600', text: 'text-amber-600', border: 'border-amber-200' },
    { name: 'rose', bg: 'bg-rose-600', text: 'text-rose-600', border: 'border-rose-200' },
    { name: 'sky', bg: 'bg-sky-600', text: 'text-sky-600', border: 'border-sky-200' },
    { name: 'violet', bg: 'bg-violet-600', text: 'text-violet-600', border: 'border-violet-200' },
  ];

  const PRESET_CATEGORIES = [
    'Emergency Fund',
    'Rainy Day',
    'Travel & Holiday',
    'House Purchase',
    'Technology & Rig',
    'Retirement Savings',
    'Custom Asset'
  ];

  const handleAccountToggle = (accountId: string) => {
    if (newLinkedAccounts.includes(accountId)) {
      setNewLinkedAccounts(prev => prev.filter(id => id !== accountId));
    } else {
      setNewLinkedAccounts(prev => [...prev, accountId]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!newGoalName.trim()) {
      setFormError('Goal name is required');
      return;
    }

    const parsedAmount = parseFloat(newTargetAmount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setFormError('Please enter a valid target balance greater than zero');
      return;
    }

    if (newLinkedAccounts.length === 0) {
      setFormError('Please link at least one account to track progress');
      return;
    }

    onAddGoal({
      name: newGoalName.trim(),
      targetAmount: parsedAmount,
      linkedAccountIds: newLinkedAccounts,
      category: newCategory,
      color: newColor,
      deadline: newDeadline || undefined
    });

    // Reset Form
    setNewGoalName('');
    setNewTargetAmount('');
    setNewLinkedAccounts([]);
    setNewCategory('Emergency Fund');
    setNewColor('indigo');
    setNewDeadline('');
    setShowAddForm(false);
  };

  // Compute stats
  const totalTarget = goals.reduce((sum, g) => sum + g.targetAmount, 0);
  
  // Calculate total funded balance across all goals (counting each linked account's balance)
  const getGoalBalance = (goal: SavingsGoal) => {
    return accounts
      .filter(a => goal.linkedAccountIds.includes(a.id))
      .reduce((sum, a) => sum + a.balance, 0);
  };

  const totalFundedAmount = goals.reduce((sum, g) => {
    const bal = getGoalBalance(g);
    return sum + Math.min(bal, g.targetAmount); // Cap current progress at 100% for overall allocation stats
  }, 0);

  const overallProgressPercentage = totalTarget > 0 
    ? Math.round((totalFundedAmount / totalTarget) * 100) 
    : 0;

  return (
    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-6">
      
      {/* Container Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-blue-50 text-blue-600 rounded">
              <Target className="w-5 h-5 shrink-0" />
            </div>
            <h3 className="text-base font-extrabold text-slate-900 tracking-tight">Active Savings Goals</h3>
          </div>
          <p className="text-xs text-slate-500">
            Define savings targets and track real-time pacing using your linked bank accounts.
          </p>
        </div>
        
        <button
          onClick={() => {
            setShowAddForm(!showAddForm);
            setFormError('');
          }}
          className="flex items-center justify-center gap-1.5 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg shadow-sm hover:shadow transition-all font-sans"
          id="btn-add-savings-goal"
        >
          {showAddForm ? (
            <>
              <X className="w-3.5 h-3.5" />
              <span>Cancel</span>
            </>
          ) : (
            <>
              <Plus className="w-3.5 h-3.5" />
              <span>New Target</span>
            </>
          )}
        </button>
      </div>

      {/* Adding Goal Accordion Form */}
      {showAddForm && (
        <form onSubmit={handleSubmit} className="p-4 bg-slate-50 border border-slate-200 rounded-lg space-y-4 animate-fadeIn font-sans">
          <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Configure Savings Goal</h4>
          
          {formError && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-xs text-rose-700 rounded-lg flex items-center gap-2 font-medium">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Goal Name */}
            <div className="space-y-1">
              <label htmlFor="goal-name-input" className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide">Goal Name</label>
              <input
                id="goal-name-input"
                type="text"
                placeholder="e.g. Flight to Tokyo, Emergency Fund"
                value={newGoalName}
                onChange={e => setNewGoalName(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-md text-sm bg-white focus:outline-none focus:ring-1 focus:ring-blue-600 focus:border-blue-600 text-slate-800"
              />
            </div>

            {/* Target Amount */}
            <div className="space-y-1">
              <label htmlFor="goal-target-input" className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide">Target Amount ($)</label>
              <div className="relative">
                <DollarSign className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  id="goal-target-input"
                  type="number"
                  placeholder="5000"
                  step="0.01"
                  min="1"
                  value={newTargetAmount}
                  onChange={e => setNewTargetAmount(e.target.value)}
                  className="w-full pl-8 pr-3 py-2 border border-slate-200 rounded-md text-sm bg-white focus:outline-none focus:ring-1 focus:ring-blue-600 focus:border-blue-600 text-slate-800 font-mono font-medium"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Category Option */}
            <div className="space-y-1">
              <label htmlFor="goal-category-select" className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide">Category</label>
              <select
                id="goal-category-select"
                value={newCategory}
                onChange={e => setNewCategory(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-md text-sm bg-white focus:outline-none focus:ring-1 focus:ring-blue-600 focus:border-blue-600 text-slate-800"
              >
                {PRESET_CATEGORIES.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            {/* Target Deadline */}
            <div className="space-y-1">
              <label htmlFor="goal-deadline-input" className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide">Target Deadline (Optional)</label>
              <input
                id="goal-deadline-input"
                type="date"
                value={newDeadline}
                onChange={e => setNewDeadline(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-md text-sm bg-white focus:outline-none focus:ring-1 focus:ring-blue-600 focus:border-blue-600 text-slate-800 font-mono"
              />
            </div>
          </div>

          {/* Connected Account Linker (Multiple Select checkboxes) */}
          <div className="space-y-1.5">
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide">
              Track using Connected Bank Balances
            </label>
            <p className="text-[10px] text-slate-400 mb-2">
              Select one or multiple synced accounts. Their aggregated balance tracks target progress.
            </p>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {accounts.map(acct => {
                const isLinked = newLinkedAccounts.includes(acct.id);
                return (
                  <button
                    type="button"
                    key={acct.id}
                    onClick={() => handleAccountToggle(acct.id)}
                    className={`p-2.5 rounded-lg border text-left flex items-center justify-between gap-3 transition-all ${
                      isLinked 
                        ? 'bg-blue-50/50 border-blue-300 ring-1 ring-blue-500/20' 
                        : 'bg-white border-slate-200 hover:border-slate-350 hover:bg-slate-50'
                    }`}
                  >
                    <div className="min-w-0">
                      <span className="block text-xs font-bold text-slate-700 truncate">{acct.accountName}</span>
                      <span className="block text-[10px] text-slate-400 font-mono">{acct.bankName} • {acct.accountNumber}</span>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="block text-xs font-semibold text-slate-900 font-mono">${acct.balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                      <span className={`inline-block px-1.5 py-0.5 rounded text-[8px] font-extrabold uppercase font-mono ${
                        isLinked ? 'bg-blue-100 text-blue-800' : 'bg-slate-100 text-slate-500'
                      }`}>
                        {isLinked ? 'Linked' : 'Add'}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Color Selection Theme */}
          <div className="space-y-1.5">
            <span className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide">Visual Display Banner Theme</span>
            <div className="flex flex-wrap gap-2 pt-1">
              {PRESET_COLORS.map(color => {
                const isActive = newColor === color.name;
                return (
                  <button
                    key={color.name}
                    type="button"
                    onClick={() => setNewColor(color.name)}
                    className={`w-6 h-6 rounded-full ${color.bg} flex items-center justify-center border-2 ${
                      isActive ? 'border-indigo-600 scale-110 ring-2 ring-indigo-300' : 'border-white hover:scale-105'
                    } transition-transform shadow-sm`}
                    title={`Theme ${color.name}`}
                  />
                );
              })}
            </div>
          </div>

          {/* Action Submission */}
          <div className="pt-2">
            <button
              type="submit"
              className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-md shadow-sm transition"
              id="submit-new-goal-btn"
            >
              Add Savings Target Goal
            </button>
          </div>
        </form>
      )}

      {/* Aggregate Cumulative Goal Progress Banner */}
      {goals.length > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 bg-slate-50 rounded-lg border border-slate-100 font-sans">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-50 text-blue-600 rounded-lg">
              <PiggyBank className="w-5 h-5 shrink-0" />
            </div>
            <div className="space-y-0.5">
              <span className="text-[10px] font-bold uppercase text-slate-500 tracking-wide font-mono block">Aggregate Savings Targets Pacing</span>
              <div className="flex items-baseline gap-1.5">
                <span className="text-base font-black text-slate-800 font-mono tracking-tight">
                  ${totalFundedAmount.toLocaleString('en-US', { maximumFractionDigits: 0 })}
                </span>
                <span className="text-[10px] text-slate-400 font-semibold font-mono">
                  of ${totalTarget.toLocaleString('en-US', { maximumFractionDigits: 0 })} target
                </span>
              </div>
            </div>
          </div>

          <div className="w-full sm:w-auto shrink-0 flex items-center gap-4">
            {/* Minimal aggregate circular visual */}
            <div className="hidden xs:flex flex-col items-center">
              <span className="text-xl font-bold font-mono text-blue-600">{overallProgressPercentage}%</span>
              <span className="text-[8px] font-semibold text-slate-400 uppercase tracking-wider font-mono">Aggressed</span>
            </div>
            <div className="flex-1 sm:flex-initial sm:w-36 h-2 w-full bg-slate-200 rounded-full overflow-hidden">
              <div 
                className="h-full bg-blue-600 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, overallProgressPercentage)}%` }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Goals Display Stack */}
      <div className="space-y-4">
        {goals.length === 0 ? (
          <div className="p-8 text-center border border-dashed border-slate-200 rounded-lg bg-slate-50/50">
            <Target className="w-8 h-8 text-slate-400 mx-auto mb-2" />
            <span className="text-xs text-slate-700 font-bold block">No active savings targets</span>
            <span className="text-[10px] text-slate-400 block mt-1 max-w-sm mx-auto leading-relaxed">
              Create a custom saving goal such as an Emergency Fund or Tech Purchase and link your checking or savings accounts to audit performance.
            </span>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {goals.map(goal => {
              const currentBalance = getGoalBalance(goal);
              const isGoalCompleted = currentBalance >= goal.targetAmount;
              const percent = goal.targetAmount > 0 
                ? Math.min(100, Math.round((currentBalance / goal.targetAmount) * 100)) 
                : 0;

              // Color Theme Class Maps
              const getThemeClasses = (colName: string) => {
                switch(colName) {
                  case 'emerald': return { bg: 'bg-emerald-600', text: 'text-emerald-600', bar: 'bg-emerald-500', tint: 'bg-emerald-50/50 border-emerald-100 hover:border-emerald-300' };
                  case 'amber': return { bg: 'bg-amber-600', text: 'text-amber-600', bar: 'bg-amber-500', tint: 'bg-amber-50/50 border-amber-100 hover:border-amber-300' };
                  case 'rose': return { bg: 'bg-rose-600', text: 'text-rose-600', bar: 'bg-rose-500', tint: 'bg-rose-50/50 border-rose-100 hover:border-rose-300' };
                  case 'sky': return { bg: 'bg-sky-600', text: 'text-sky-600', bar: 'bg-sky-500', tint: 'bg-sky-50/50 border-sky-100 hover:border-sky-300' };
                  case 'violet': return { bg: 'bg-violet-600', text: 'text-violet-600', bar: 'bg-violet-500', tint: 'bg-violet-50/50 border-violet-100 hover:border-violet-300' };
                  default: return { bg: 'bg-indigo-600', text: 'text-indigo-600', bar: 'bg-indigo-500', tint: 'bg-indigo-50/50 border-indigo-100 hover:border-indigo-300' };
                }
              };

              const theme = getThemeClasses(goal.color);

              return (
                <div 
                  key={goal.id} 
                  className={`p-4 rounded-lg border transition-all hover:shadow-sm flex flex-col justify-between gap-4 font-sans ${theme.tint}`}
                  id={`goal-card-${goal.id}`}
                >
                  <div className="space-y-2">
                    {/* Goal Card Header */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className={`inline-block w-2.5 h-2.5 rounded-full shrink-0 ${theme.bg}`} />
                          <h4 className="font-extrabold text-slate-900 text-sm truncate leading-tight uppercase tracking-tight">
                            {goal.name}
                          </h4>
                        </div>
                        <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block mt-0.5">
                          {goal.category}
                        </span>
                      </div>

                      <button
                        onClick={() => onDeleteGoal(goal.id)}
                        className="p-1 px-1.5 rounded-md hover:bg-slate-100 text-slate-400 hover:text-rose-600 transition"
                        title="Delete this target goal"
                        id={`delete-goal-${goal.id}`}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Funding Values */}
                    <div className="flex items-baseline justify-between pt-1">
                      <div className="space-y-0.5">
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block leading-none">Funding Link</span>
                        <div className="flex items-baseline gap-1 font-mono">
                          <span className="text-base font-black text-slate-900">
                            ${currentBalance.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                          </span>
                          <span className="text-xs text-slate-400 font-bold">
                            / ${goal.targetAmount.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                          </span>
                        </div>
                      </div>

                      {/* Percent Tag with Badge */}
                      <div className="text-right">
                        {isGoalCompleted ? (
                          <div className="flex items-center gap-1 text-emerald-600 font-extrabold text-[10px] uppercase font-mono bg-emerald-100/60 px-2 py-0.5 rounded border border-emerald-200">
                            <Sparkles className="w-3 h-3" />
                            <span>100% Funded</span>
                          </div>
                        ) : (
                          <div className={`font-mono text-xs font-black ${theme.text}`}>
                            {percent}%
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Progress Line */}
                  <div className="space-y-2">
                    <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden shadow-inner">
                      <div 
                        className={`h-full rounded-full transition-all duration-500 ${isGoalCompleted ? 'bg-emerald-500' : theme.bar}`}
                        style={{ width: `${percent}%` }}
                      />
                    </div>

                    {/* Linked accounts badges */}
                    <div className="flex flex-wrap items-center justify-between gap-2 pt-1.5 border-t border-slate-100">
                      <div className="flex items-center gap-1 text-[9.5px] font-bold text-slate-400">
                        <Link2 className="w-3.5 h-3.5 text-slate-350" />
                        <span>Sources:</span>
                        <div className="flex flex-wrap gap-1 leading-none ml-1">
                          {accounts
                            .filter(a => goal.linkedAccountIds.includes(a.id))
                            .map(a => (
                              <span 
                                key={a.id} 
                                className="px-1.5 py-0.5 bg-slate-100 text-slate-600 border border-slate-200 text-[8px] font-mono rounded font-bold"
                              >
                                {a.accountName.split(' ')[0]}
                              </span>
                            ))}
                        </div>
                      </div>

                      {goal.deadline && (
                        <div className="flex items-center gap-0.5 text-[9px] font-mono text-slate-400 font-bold">
                          <Calendar className="w-3 h-3 text-slate-350 shrink-0" />
                          <span>By {new Date(goal.deadline).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}</span>
                        </div>
                      )}
                    </div>
                  </div>

                </div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
}
