/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Sparkles, ArrowRight, CheckCircle2, AlertTriangle, Lightbulb, Compass, Send } from 'lucide-react';
import { Budget, Transaction } from '../types';

interface IntelligenceCenterProps {
  budgets: Budget[];
  transactions: Transaction[];
}

export default function IntelligenceCenter({ budgets, transactions }: IntelligenceCenterProps) {
  const [query, setQuery] = useState('');
  const [copilotResponses, setCopilotResponses] = useState<Array<{ sender: 'user' | 'ai'; text: string; timestamp: string }>>([
    {
      sender: 'ai',
      text: 'Hi, I am your Royal Budget Copilot. Ask me questions about your budgets, recent transactions, or checking whether you can afford an upcoming expense.',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [isAnswering, setIsAnswering] = useState(false);

  // Derive simple rule matched hints
  const rules = [
    { pattern: 'Whole Foods / Trader Joe\'s', action: 'Auto-match → Food & Groceries' },
    { pattern: 'Starbucks / Coffee / UberEats', action: 'Auto-match → Dining Out' },
    { pattern: 'Netflix / Disney+ / Hulu', action: 'Auto-match → Entertainment' },
    { pattern: 'Uber / Exxon / Chevron', action: 'Auto-match → Transportation' }
  ];

  // Derive dynamic smart alerts
  const alerts: string[] = [];
  const foodBudget = budgets.find(b => b.category === 'Food & Groceries');
  const diningBudget = budgets.find(b => b.category === 'Dining Out');
  const utilitiesBudget = budgets.find(b => b.category === 'Utilities & Bills');

  if (foodBudget && foodBudget.spent > foodBudget.limit * 0.8) {
    alerts.push(`Food & Groceries is at ${Math.round((foodBudget.spent / foodBudget.limit) * 100)}% of limit. Slow down items purchase.`);
  }
  if (diningBudget && diningBudget.spent > diningBudget.limit * 0.7) {
    alerts.push(`Elevated dining-out frequency detected. Try reducing UberEats delivery.`);
  }
  if (transactions.filter(t => t.description.toLowerCase().includes('starbucks')).length > 4) {
    alerts.push(`Coffee pattern flag: Multiple minor payments at Starbucks are eroding your daily dining budget.`);
  }

  const handleCopilotSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    const userMessage = query;
    setCopilotResponses(prev => [...prev, {
      sender: 'user',
      text: userMessage,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }]);
    setQuery('');
    setIsAnswering(true);

    // Dynamic responses tailored to the active user budget
    setTimeout(() => {
      let aiResponse = "I have reviewed your ledger. Your savings account looks healthy, but remember to set goals for your core categories.";
      const cleanMsg = userMessage.toLowerCase();

      if (cleanMsg.includes('afford') || cleanMsg.includes('dinner') || cleanMsg.includes('buy')) {
        // Extract numbers if any
        const numMatches = cleanMsg.match(/\d+/);
        const amount = numMatches ? parseInt(numMatches[0]) : 100;
        
        const remainingFood = foodBudget ? (foodBudget.limit - foodBudget.spent) : 100;
        const remainingDining = diningBudget ? (diningBudget.limit - diningBudget.spent) : 100;

        if (amount > remainingDining && amount > remainingFood) {
          aiResponse = `According to your budgets, a payment of $${amount} will exceed your current Dining Out buffer (remaining: $${Math.max(0, Math.round(remainingDining))}). I suggest holding off or transferring envelope margins from other categories.`;
        } else {
          aiResponse = `Yes, you currently have a $${Math.round(remainingDining)} buffer in your Dining Out budget and a $${Math.round(remainingFood)} buffer in Groceries. A payment of $${amount} is safely affordable!`;
        }
      } else if (cleanMsg.includes('budget') || cleanMsg.includes('limit')) {
        const overBudgets = budgets.filter(b => b.spent >= b.limit);
        if (overBudgets.length > 0) {
          aiResponse = `You currently have exceeded budgets in: ${overBudgets.map(b => b.category).join(', ')}. Keep an eye on transaction logs to map corrections.`;
        } else {
          aiResponse = `Excellent budget health! You are within your target limits across all 6 core categories. Average progress is ${Math.round((budgets.reduce((s, b) => s + (b.spent / b.limit), 0) / budgets.length) * 100)}% of limits.`;
        }
      } else if (cleanMsg.includes('income') || cleanMsg.includes('spend')) {
        const totalSpend = budgets.reduce((s, b) => s + b.spent, 0);
        const totalIncome = transactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
        aiResponse = `Your absolute monthly spend is $${totalSpend.toLocaleString('en-US', { minimumFractionDigits: 2 })} versus direct deposits totalling $${totalIncome.toLocaleString('en-US', { minimumFractionDigits: 2 })}. This translates to an active cashflow index of +$${Math.round(totalIncome - totalSpend)}.`;
      } else {
        aiResponse = `I analyzed your real-time accounts ledger. You have linked checking / savings, logging ${transactions.length} active items. Your top category is '${budgets.reduce((max, b) => b.spent > max.spent ? b : max, budgets[0]).category}' which amounts to $${Math.round(budgets.reduce((max, b) => b.spent > max.spent ? b : max, budgets[0]).spent)}. Let me know if you would like automated envelope strategies!`;
      }

      setCopilotResponses(prev => [...prev, {
        sender: 'ai',
        text: aiResponse,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }]);
      setIsAnswering(false);
    }, 1200);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      
      {/* Smart Sandbox Alerts & Custom Matchers */}
      <div className="space-y-6">
        
        {/* Dynamic Alerts */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <div className="p-2 bg-slate-50 text-slate-700 rounded-lg border border-slate-100">
              <Lightbulb className="w-4 h-4" />
            </div>
            <h4 className="font-bold text-slate-950 text-sm">Intelligence Insights</h4>
          </div>

          {alerts.length === 0 ? (
            <div className="flex items-center gap-3 p-4 bg-emerald-50 rounded-lg border border-emerald-100 text-xs text-emerald-800">
              <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block animate-pulse" />
              <div>
                <p className="font-bold">Threshold parameters normal</p>
                <p className="opacity-85 text-[11px] mt-0.5">Active monitoring detects healthy outflows inline with targets.</p>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {alerts.map((alert, i) => (
                <div key={i} className="flex items-start gap-3 p-4 bg-amber-50 rounded-lg border border-amber-100 text-xs text-amber-900">
                  <AlertTriangle className="w-4.5 h-4.5 text-amber-600 shrink-0 mt-0.5" />
                  <p className="leading-relaxed"><strong className="font-bold">Alert:</strong> {alert}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Real-Time Rule Processor */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-slate-50 text-slate-700 rounded-lg border border-slate-100">
                <Compass className="w-4 h-4" />
              </div>
              <h4 className="font-bold text-slate-950 text-sm">Real-time Payee Classification</h4>
            </div>
            <span className="text-[10px] font-mono text-slate-500 bg-slate-50 px-2 py-0.5 rounded border border-slate-200">
              CRON Pipeline Active
            </span>
          </div>
          <p className="text-xs text-slate-500 mb-4 leading-relaxed">
            These patterns govern classification rules. Newly synced transactions are categorized immediately.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pb-1">
            {rules.map((rule, i) => (
              <div key={i} className="p-3.5 bg-slate-50 rounded-lg border border-slate-200 text-xs space-y-1">
                <p className="font-bold text-slate-700 font-mono truncate">{rule.pattern}</p>
                <p className="text-[10px] font-bold text-blue-700">{rule.action}</p>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* AI Budget Copilot Portal */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between h-[360px] lg:h-[400px]">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-slate-50 text-slate-700 rounded-lg border border-slate-100">
              <Sparkles className="w-4 h-4" />
            </div>
            <h4 className="font-bold text-slate-950 text-sm">Budget Assistant</h4>
          </div>
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse inline-block" />
        </div>

        {/* Messaging Logs */}
        <div className="flex-1 overflow-y-auto my-3 space-y-3 pr-1 text-xs">
          {copilotResponses.map((msg, i) => {
            const isUser = msg.sender === 'user';
            return (
              <div key={i} className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}>
                <div className={`p-3 rounded-lg max-w-[85%] leading-relaxed border shadow-sm ${
                  isUser 
                    ? 'bg-blue-600 border-blue-700 text-white rounded-tr-none' 
                    : 'bg-slate-50 border-slate-200 text-slate-800 rounded-tl-none'
                }`}>
                  <p>{msg.text}</p>
                </div>
                <span className="text-[9px] text-slate-400 px-1.5 mt-1 font-mono uppercase tracking-tight">{msg.timestamp}</span>
              </div>
            );
          })}
          {isAnswering && (
            <div className="flex items-center gap-2 text-slate-400 pl-2">
              <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce [animation-delay:-0.3s]" />
              <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce [animation-delay:-0.15s]" />
              <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce" />
            </div>
          )}
        </div>

        {/* Standard query shortcuts */}
        <div className="flex gap-2 pb-2 overflow-x-auto text-[10px]">
          <button 
            onClick={() => setQuery("Can I afford a $120 dinner tonight?")}
            className="px-2.5 py-1.5 bg-slate-50 hover:bg-slate-100 rounded-full font-bold border border-slate-200 text-slate-600 shrink-0 transition"
          >
            "Can I afford dinner?"
          </button>
          <button 
            onClick={() => setQuery("Am I close to exceeding my monthly spending buffer?")}
            className="px-2.5 py-1.5 bg-slate-50 hover:bg-slate-100 rounded-full font-bold border border-slate-200 text-slate-600 shrink-0 transition"
          >
            "Assess my budgets"
          </button>
        </div>

        {/* Search input bar */}
        <form onSubmit={handleCopilotSend} className="relative flex gap-2">
          <input
            type="text"
            className="w-full pl-4 pr-12 py-3 bg-slate-50 border border-slate-200 focus:bg-white rounded-lg text-xs focus:ring-1 focus:ring-blue-600 focus:outline-none placeholder-slate-400"
            placeholder="Type your budget queries here..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            disabled={isAnswering}
            id="copilot-input"
          />
          <button
            type="submit"
            disabled={isAnswering || !query.trim()}
            className="absolute right-1.5 top-1/2 -translate-y-1/2 p-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-40 transition-colors"
            id="copilot-submit-btn"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </form>
      </div>

    </div>
  );
}
