/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { BankAccount, Transaction, Budget } from '../types';
import { 
  BellRing, 
  ArrowDownLeft, 
  ArrowUpRight, 
  Check, 
  Sparkles, 
  Sliders, 
  Settings, 
  DollarSign, 
  AlertCircle, 
  Info, 
  ArrowRight,
  Clipboard,
  CornerDownRight,
  Database
} from 'lucide-react';

interface NotificationReaderProps {
  accounts: BankAccount[];
  budgets: Budget[];
  onAddTransaction: (tx: Omit<Transaction, 'id'>) => void;
  onShowSuccessToast?: (msg: string) => void;
}

const TEMPLATE_NOTIFICATIONS = [
  {
    id: 't-1',
    label: 'Citi Spent',
    text: 'Citi Alert: Spent $82.40 at WHOLE FOODS with card *8841.',
    type: 'sent'
  },
  {
    id: 't-2',
    label: 'Venmo Received',
    text: 'Venmo: Sarah sent you $35.00 for Friday lunch!',
    type: 'received'
  },
  {
    id: 't-3',
    label: 'Netflix Sub',
    text: 'Chase Alert: You paid $15.49 to NETFLIX. Thank you for your payment.',
    type: 'sent'
  },
  {
    id: 't-4',
    label: 'Direct Deposit',
    text: 'Chase: Account *3421 received a Direct Deposit of $2,450.00 from ALPHABET INC.',
    type: 'received'
  },
  {
    id: 't-5',
    label: 'Uber Ride',
    text: 'ApplePay: Paid $18.40 to UBER TRANSIT today.',
    type: 'sent'
  },
  {
    id: 't-6',
    label: 'Amazon Refund',
    text: 'Citi Notice: Refund of $85.00 from AMAZON deposited successfully.',
    type: 'received'
  }
];

export default function NotificationReader({ 
  accounts, 
  budgets, 
  onAddTransaction,
  onShowSuccessToast
}: NotificationReaderProps) {
  const [rawText, setRawText] = useState('');
  const [parsedTx, setParsedTx] = useState<{
    amount: number;
    description: string;
    type: 'income' | 'expense';
    category: string;
    accountId: string;
  } | null>(null);

  const [formAmount, setFormAmount] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formType, setFormType] = useState<'income' | 'expense'>('expense');
  const [formCategory, setFormCategory] = useState('Other');
  const [formAccountId, setFormAccountId] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Initial account selection
  useEffect(() => {
    if (accounts.length > 0 && !formAccountId) {
      setFormAccountId(accounts[0].id);
    }
  }, [accounts, formAccountId]);

  // Handle parsing algorithm when rawText changes
  useEffect(() => {
    if (!rawText.trim()) {
      setParsedTx(null);
      return;
    }

    const text = rawText;

    // 1. Detect if Received (Income) or Sent (Expense)
    // "Sarah sent you $35" is income (received). "You sent $35 to Starbucks" is expense (sent).
    // Let's check for received words or "sent you" / "sent to you" / "received" / "deposit" / "refund" / "added" / "credited"
    const isSentToYou = /sent\s+you/i.test(text) || /sent\s+to\s+you/i.test(text);
    const hasReceiveKeywords = /received/i.test(text) || 
                               /recieced/i.test(text) || 
                               /deposit/i.test(text) || 
                               /refund/i.test(text) || 
                               /credited/i.test(text) || 
                               /added/i.test(text) || 
                               /inbound/i.test(text) || 
                               /credited/i.test(text);
    
    const isReceived = isSentToYou || (hasReceiveKeywords && !/you\s+sent/i.test(text));
    const detectedType: 'income' | 'expense' = isReceived ? 'income' : 'expense';

    // 2. Extract Amount
    // Matches $12.34, USD 20, 50.00 etc.
    let amount = 0;
    const amountRegexes = [
      /(?:\$|USD)\s*([\d,]+(?:\.\d{2})?)/i, // $1,234.56 or USD 42
      /\b([\d,]+\.\d{2})\b/ // Standalone numbers with decimal place 12.30
    ];

    for (const regex of amountRegexes) {
      const match = text.match(regex);
      if (match) {
        const cleaned = match[1].replace(/,/g, '');
        const val = parseFloat(cleaned);
        if (!isNaN(val) && val > 0) {
          amount = val;
          break;
        }
      }
    }

    // Fallback amount check (first number in sequence)
    if (amount === 0) {
      const fallbackMatch = text.match(/\b\d+(?:\.\d{2})?\b/);
      if (fallbackMatch) {
        const val = parseFloat(fallbackMatch[0]);
        if (!isNaN(val)) amount = val;
      }
    }

    // 3. Extract Description / Merchant Name
    let description = '';
    // Look for patterns like "at MERCHANT", "to MERCHANT", "from MERCHANT", "payment to MERCHANT", "purchase at MERCHANT"
    const merchantRegexes = [
      /at\s+([A-Z0-9\s&.-]{3,30}?)(?:\s+with|\s+using|\s+card|\s+on|\s*with\b|\s*\.)/i,
      /to\s+([A-Z0-9\s&.-]{3,30}?)(?:\s+using|\s+card|\s+on|\s*with\b|\s*\.)/i,
      /at\s+([A-Z0-9\s&.-]{2,25})\b/i,
      /to\s+([A-Z0-9\s&.-]{2,25})\b/i,
      /from\s+([A-Z0-9\s&.-]{2,25})\b/i,
      /purchase\s+([A-Z0-9\s&.-]{2,25})\b/i,
      /alert:\s+([A-Z0-9\s&.-]{2,20}?)\s/i
    ];

    for (const regex of merchantRegexes) {
      const match = text.match(regex);
      if (match && match[1]) {
        const candidate = match[1].trim();
        // Skip common words
        if (!['spent', 'card', 'you', 'account', 'directly', 'with', 'successfully', 'the', 'direct'].includes(candidate.toLowerCase())) {
          description = candidate;
          break;
        }
      }
    }

    // If description could not be detected cleanly, parse capitalized groups
    if (!description) {
      const words = text.split(/\s+/);
      const capWords = words.filter(w => /^[A-Z]{3,15}$/.test(w) && !/^[A-Z0-9]*\*\d*[A-Z0-9]*$/.test(w) && !['USD', 'SMS', 'ALERT', 'BANK', 'CHASE', 'CITI', 'APPLEPAY', 'VENMO'].includes(w.toUpperCase()));
      if (capWords.length > 0) {
        description = capWords.join(' ');
      } else {
        description = 'Simulated Transaction Feed';
      }
    }

    // Clean up description trailing dots/commas
    description = description.replace(/^[^\w]+|[^\w]+$/g, '').trim();
    if (!description) {
      description = 'Notification Payment Received';
    }

    // 4. Predict Category
    let category = 'Other';
    const normText = text.toLowerCase();
    
    if (normText.includes('whole foods') || normText.includes('walmart') || normText.includes('grocery') || normText.includes('supermarket') || normText.includes('market') || normText.includes('trader jo')) {
      category = 'Food & Groceries';
    } else if (normText.includes('netflix') || normText.includes('spotify') || normText.includes('entertainment') || normText.includes('steam') || normText.includes('disney') || normText.includes('hulu') || normText.includes('hbo')) {
      category = 'Entertainment';
    } else if (normText.includes('uber') || normText.includes('lyft') || normText.includes('cab') || normText.includes('transit') || normText.includes('gas') || normText.includes('exxon') || normText.includes('shell')) {
      category = 'Transportation';
    } else if (normText.includes('starbucks') || normText.includes('coffee') || normText.includes('restaurant') || normText.includes('cafe') || normText.includes('dinner') || normText.includes('lunch') || normText.includes('bites') || normText.includes('eats')) {
      category = 'Dining Out';
    } else if (normText.includes('rent') || normText.includes('mortgage') || normText.includes('utility') || normText.includes('bill') || normText.includes('electricity') || normText.includes('internet') || normText.includes('telephone') || normText.includes('power')) {
      category = 'Utilities & Bills';
    } else if (normText.includes('salary') || normText.includes('payroll') || normText.includes('direct deposit') || normText.includes('paycheck') || normText.includes('reimbursement')) {
      category = 'Income';
    } else if (detectedType === 'income') {
      category = 'Income';
    }

    // 5. Look for matching account inside text
    let matchedAccountId = '';
    const foundAcc = accounts.find(a => {
      const bankName = a.bankName.toLowerCase();
      const accName = a.accountName.toLowerCase();
      return normText.includes(bankName) || normText.includes(accName);
    });

    if (foundAcc) {
      matchedAccountId = foundAcc.id;
    } else if (accounts.length > 0) {
      // fallback
      matchedAccountId = accounts[0].id;
    }

    // Sync state values
    setFormAmount(amount.toFixed(2));
    setFormDescription(description);
    setFormType(detectedType);
    setFormCategory(category);
    if (matchedAccountId) {
      setFormAccountId(matchedAccountId);
    }

    setParsedTx({
      amount,
      description,
      type: detectedType,
      category,
      accountId: matchedAccountId || (accounts[0]?.id || '')
    });

  }, [rawText, accounts]);

  const handlePostTransaction = (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMsg('');

    const parsedAmount = parseFloat(formAmount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      alert('Please provide a valid transaction amount.');
      return;
    }

    if (!formDescription.trim()) {
      alert('Please provide a transaction description.');
      return;
    }

    const selectedAcc = accounts.find(a => a.id === formAccountId);
    if (!selectedAcc) {
      alert('Please select a valid account.');
      return;
    }

    // Trigger parent transaction handler
    onAddTransaction({
      accountId: formAccountId,
      bankName: selectedAcc.bankName,
      accountName: selectedAcc.accountName,
      amount: parsedAmount,
      description: formDescription.trim(),
      category: formCategory,
      date: new Date().toISOString(),
      type: formType,
      isNew: true
    });

    const formattedAmount = `${formType === 'expense' ? '-' : '+'}$${parsedAmount.toFixed(2)}`;
    setSuccessMsg(`Logged transaction: "${formDescription.trim()}" (${formattedAmount}) recorded successfully!`);
    
    if (onShowSuccessToast) {
      onShowSuccessToast(`Synced: Detected ${formType === 'income' ? 'Income' : 'Expense'} of $${parsedAmount.toFixed(2)}`);
    }

    // Clear textarea
    setRawText('');
    setParsedTx(null);

    // Auto clear feedback after 4 seconds
    setTimeout(() => {
      setSuccessMsg('');
    }, 4000);
  };

  const handleTemplateSelect = (text: string) => {
    setSuccessMsg('');
    setRawText(text);
  };

  return (
    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-6">
      
      {/* Header Panel */}
      <div className="flex items-center justify-between pb-3.5 border-b border-rose-50 border-slate-100/90">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-blue-50 text-blue-600 rounded">
              <BellRing className="w-4.5 h-4.5 shrink-0" />
            </div>
            <h3 className="text-sm font-extrabold text-slate-900 tracking-tight">Notification & SMS Reader</h3>
          </div>
          <p className="text-xs text-slate-500">
            Paste bank push alerts or SMS logs. The agent automatically parses quantities and registers them.
          </p>
        </div>
        <div className="hidden sm:flex items-center gap-1 bg-blue-50/60 border border-blue-100 rounded px-2 py-0.5 text-[9px] font-mono font-bold text-blue-700 uppercase">
          <Sparkles className="w-2.5 h-2.5" />
          <span>Real-Time Parser</span>
        </div>
      </div>

      {/* Selector templates to try alert configurations instantly */}
      <div className="space-y-1.5">
        <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider font-semibold">
          Click sample alert notification to parse:
        </span>
        <div className="flex flex-wrap gap-1.5 pt-0.5">
          {TEMPLATE_NOTIFICATIONS.map(temp => (
            <button
              key={temp.id}
              onClick={() => handleTemplateSelect(temp.text)}
              className={`px-2.5 py-1 text-[10px] font-bold rounded-md border transition-all ${
                temp.type === 'received' 
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-150 hover:bg-emerald-100 hover:border-emerald-250'
                  : 'bg-rose-50 text-rose-800 border-rose-150 hover:bg-rose-100 hover:border-rose-250'
              }`}
              id={`btn-sample-alert-${temp.id}`}
              type="button"
            >
              {temp.label}
              <span className="text-[8px] font-black uppercase font-mono ml-1 block leading-none">
                {temp.type === 'received' ? 'Received (Income)' : 'Sent (Expense)'}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Clipboard textarea entry box */}
      <div className="space-y-1.5">
        <label htmlFor="notif-paste-textarea" className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide">
          Paste Push Notification or Message Here:
        </label>
        <div className="relative">
          <textarea
            id="notif-paste-textarea"
            rows={2}
            value={rawText}
            onChange={e => setRawText(e.target.value)}
            placeholder="e.g. Citi Alert: You sent $45.00 to Starbucks at 5:30 on card *1234."
            className="w-full text-xs p-3.5 pr-10 border border-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-600 focus:border-blue-600 pr-4 rounded-lg bg-slate-50/50 hover:bg-slate-50 placeholder-slate-400 font-sans leading-relaxed text-slate-800"
          />
          <div className="absolute right-3.5 top-3.5 text-slate-300">
            <Clipboard className="w-4 h-4 shrink-0" />
          </div>
        </div>
      </div>

      {/* Success notification logger */}
      {successMsg && (
        <div className="p-3 bg-emerald-50 border border-emerald-150 text-xs text-emerald-800 rounded-lg flex items-center gap-2 animate-fadeIn font-medium">
          <Check className="text-emerald-600 w-4 h-4 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Live parsing diagnostics controller preview values */}
      {parsedTx ? (
        <form onSubmit={handlePostTransaction} className="p-4 bg-slate-50 border border-blue-200 rounded-lg space-y-4 animate-fadeIn font-sans">
          
          <div className="flex items-center justify-between border-b border-blue-100 pb-2">
            <span className="text-[10px] font-bold uppercase text-blue-600 tracking-wider flex items-center gap-1 font-mono">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Parsed Diagnostics Preview</span>
            </span>
            <span className="text-[9px] font-bold bg-white text-slate-400 px-2 py-0.5 border border-slate-200/80 rounded font-mono">
              Adjustable values
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pb-1">
            
            {/* Decided Transact Direction Type */}
            <div className="space-y-1">
              <label htmlFor="diag-type-select" className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block font-mono">
                Detected Flow Channel
              </label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setFormType('income')}
                  className={`flex-1 py-1 px-3 rounded-md text-[11px] font-extrabold border flex items-center justify-center gap-1 transition ${
                    formType === 'income'
                      ? 'bg-emerald-55 bg-emerald-600 text-white border-emerald-600'
                      : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-100'
                  }`}
                  id="diag-type-receipt"
                >
                  <ArrowDownLeft className="w-3.5 h-3.5 shrink-0" />
                  <span>Received (Income)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setFormType('expense')}
                  className={`flex-1 py-1 px-3 rounded-md text-[11px] font-extrabold border flex items-center justify-center gap-1 transition ${
                    formType === 'expense'
                      ? 'bg-rose-55 bg-rose-600 text-white border-rose-600'
                      : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-100'
                  }`}
                  id="diag-type-expense"
                >
                  <ArrowUpRight className="w-3.5 h-3.5 shrink-0" />
                  <span>Sent (Expense)</span>
                </button>
              </div>
            </div>

            {/* Extracted Amount */}
            <div className="space-y-1">
              <label htmlFor="diag-amount-field" className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block font-mono">
                Extracted Amount ($)
              </label>
              <div className="relative">
                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400">$</span>
                <input
                  id="diag-amount-field"
                  type="text"
                  value={formAmount}
                  onChange={e => setFormAmount(e.target.value)}
                  className="w-full pl-6 pr-3 py-1.5 border border-slate-200 rounded text-xs bg-white text-slate-800 font-mono font-bold focus:outline-none focus:ring-1 focus:ring-blue-600 focus:border-blue-600"
                />
              </div>
            </div>

          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            
            {/* Extracted Description */}
            <div className="space-y-1">
              <label htmlFor="diag-descr-field" className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block font-mono">
                Extracted Payee/Payor Merchant
              </label>
              <input
                id="diag-descr-field"
                type="text"
                value={formDescription}
                onChange={e => setFormDescription(e.target.value)}
                className="w-full px-2.5 py-1.5 border border-slate-200 rounded text-xs bg-white text-slate-800 font-bold focus:outline-none focus:ring-1 focus:ring-blue-600 focus:border-blue-600"
              />
            </div>

            {/* Inferred Category */}
            <div className="space-y-1">
              <label htmlFor="diag-category-select" className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block font-mono">
                Assigned Envelope Limit Category
              </label>
              <select
                id="diag-category-select"
                value={formCategory}
                onChange={e => setFormCategory(e.target.value)}
                className="w-full px-2 py-1.5 border border-slate-200 rounded text-xs bg-white text-slate-800 font-semibold focus:outline-none focus:ring-1 focus:ring-blue-600 focus:border-blue-600"
              >
                {budgets.map(b => (
                  <option key={b.category} value={b.category}>{b.category}</option>
                ))}
                <option value="Income">Income Flow-in</option>
                <option value="Other">Other</option>
              </select>
            </div>

          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {/* Targeted BankAccount dropdown */}
            <div className="space-y-1">
              <label htmlFor="diag-account-select" className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block font-mono">
                Target Bank Pipeline
              </label>
              <select
                id="diag-account-select"
                value={formAccountId}
                onChange={e => setFormAccountId(e.target.value)}
                className="w-full px-2 py-1.5 border border-slate-200 rounded text-xs bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-600 focus:border-blue-600"
              >
                {accounts.map(a => (
                  <option key={a.id} value={a.id}>
                    {a.bankName} • {a.accountName.split(' ')[0]} (${a.balance.toLocaleString('en-US', { maximumFractionDigits: 0 })})
                  </option>
                ))}
              </select>
            </div>

            {/* Ledger Authorization Execution Button */}
            <div className="flex items-end">
              <button
                type="submit"
                className="w-full py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-xs rounded-md shadow-sm hover:shadow hover:scale-[1.01] active:scale-[0.99] transition"
                id="submit-pasted-alert-btn"
              >
                Register & Ledger Handshake
              </button>
            </div>
          </div>

        </form>
      ) : (
        rawText.trim() && (
          <div className="p-4 border border-rose-100 bg-rose-50/50 rounded-lg flex items-center gap-3 text-xs text-rose-800">
            <AlertCircle className="w-5 h-5 text-rose-500 shrink-0" />
            <div className="space-y-0.5">
              <span className="font-bold block text-rose-900">Waiting for diagnostic lock...</span>
              <span>Provide clean dollar amount details in notification to lock parsing state tracker.</span>
            </div>
          </div>
        )
      )}

      {/* Guide explanation notice */}
      <div className="p-3 bg-slate-50 border border-slate-100 rounded-lg flex gap-2 text-[11px] text-slate-400 leading-relaxed">
        <Info className="w-4 h-4 text-slate-350 shrink-0 mt-0.5" />
        <span>
          <strong>How it works:</strong> If text contains <code className="bg-slate-100 px-1 py-0.5 rounded font-mono text-slate-600">received</code>, <code className="bg-slate-100 px-1 py-0.5 rounded font-mono text-slate-600">deposit</code>, or <code className="bg-slate-100 px-1 py-0.5 rounded font-mono text-slate-600">sent you</code>, the app is smart enough to flag it as **Income (Received)**. Otherwise, keywords like <code className="bg-slate-100 px-1 py-0.5 rounded font-mono text-slate-600">spent</code>, <code className="bg-slate-100 px-1 py-0.5 rounded font-mono text-slate-600">paid</code>, or <code className="bg-slate-100 px-1 py-0.5 rounded font-mono text-slate-600">spent at</code> flag it is as **Expense (Sent)**, routing immediately to corresponding budgets.
        </span>
      </div>

    </div>
  );
}
