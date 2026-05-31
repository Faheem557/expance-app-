import React, { useState } from 'react';
import { Loan, BankAccount } from '../types';
import { HandCoins, Plus, CalendarIcon, Users, CheckCircle2, Trash2, ChevronDown, ChevronUp, History, Banknote, Landmark, ArrowUpDown } from 'lucide-react';

interface LoanTrackerProps {
  loans: Loan[];
  accounts: BankAccount[];
  onAddLoan: (loanData: Omit<Loan, 'id'>) => void;
  onUpdateLoanStatus: (id: string, status: 'active' | 'settled') => void;
  onDeleteLoan: (id: string) => void;
  onAddPayment: (loanId: string, amount: number, accountId?: string, notes?: string) => void;
}

export default function LoanTracker({ loans, accounts, onAddLoan, onUpdateLoanStatus, onDeleteLoan, onAddPayment }: LoanTrackerProps) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [expandedLoanId, setExpandedLoanId] = useState<string | null>(null);
  const [paymentFormFor, setPaymentFormFor] = useState<string | null>(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentNotes, setPaymentNotes] = useState('');
  const [paymentAccountId, setPaymentAccountId] = useState('');
  
  const [type, setType] = useState<'lent' | 'borrowed'>('lent');
  const [personName, setPersonName] = useState('');
  const [amount, setAmount] = useState('');
  const [dateIssued, setDateIssued] = useState(new Date().toISOString().split('T')[0]);
  const [dueDate, setDueDate] = useState('');
  const [notes, setNotes] = useState('');
  const [accountId, setAccountId] = useState('');
  const [sortBy, setSortBy] = useState<'amount' | 'date' | 'name'>('date');

  const accountNumberTruncated = (num: string) => `••••${num.slice(-4)}`;

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!personName.trim() || !amount) return;

    onAddLoan({
      type,
      personName: personName.trim(),
      amount: parseFloat(amount),
      dateIssued,
      dueDate,
      status: 'active',
      notes: notes.trim(),
      accountId: accountId || undefined
    });

    setPersonName('');
    setAmount('');
    setDueDate('');
    setNotes('');
    setAccountId('');
    setShowAddForm(false);
  };

  const getRemainingAmount = (loan: Loan) => {
    return Math.max(0, loan.amount - (loan.payments || []).reduce((sum, p) => sum + p.amount, 0));
  };

  const sortLoans = (loansToSort: Loan[]) => {
    return [...loansToSort].sort((a, b) => {
      if (sortBy === 'amount') {
        return getRemainingAmount(b) - getRemainingAmount(a);
      }
      if (sortBy === 'name') {
        return a.personName.localeCompare(b.personName);
      }
      return new Date(b.dateIssued).getTime() - new Date(a.dateIssued).getTime();
    });
  };

  const lentLoans = sortLoans(loans.filter(l => l.type === 'lent'));
  const borrowedLoans = sortLoans(loans.filter(l => l.type === 'borrowed'));

  const totalLent = lentLoans.reduce((sum, loan) => sum + loan.amount, 0);
  const totalLentPaid = lentLoans.reduce((sum, loan) => sum + (loan.payments || []).reduce((s, p) => s + p.amount, 0), 0);
  const totalLentPending = Math.max(0, totalLent - totalLentPaid);

  const totalBorrowed = borrowedLoans.reduce((sum, loan) => sum + loan.amount, 0);
  const totalBorrowedPaid = borrowedLoans.reduce((sum, loan) => sum + (loan.payments || []).reduce((s, p) => s + p.amount, 0), 0);
  const totalBorrowedPending = Math.max(0, totalBorrowed - totalBorrowedPaid);

  const handleAddPaymentSubmit = (e: React.FormEvent, loanId: string) => {
    e.preventDefault();
    if (!paymentAmount) return;
    onAddPayment(loanId, parseFloat(paymentAmount), paymentAccountId || undefined, paymentNotes);
    setPaymentAmount('');
    setPaymentNotes('');
    setPaymentAccountId('');
    setPaymentFormFor(null);
  };

  const renderLoanCard = (loan: Loan) => {
    const totalPaid = (loan.payments || []).reduce((sum, p) => sum + p.amount, 0);
    const remaining = Math.max(0, loan.amount - totalPaid);
    const isExpanded = expandedLoanId === loan.id;
    const isAddingPayment = paymentFormFor === loan.id;

    return (
    <div key={loan.id} className="bg-white p-4 border border-slate-200 rounded-xl shadow-sm flex flex-col gap-3">
      <div className="flex justify-between items-start">
        <div>
          <h4 className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5 text-slate-400" />
            {loan.personName}
          </h4>
          <span className="text-[10px] uppercase font-bold text-slate-400 font-mono tracking-wider">
            {loan.type === 'lent' ? 'I Lent' : 'I Borrowed'} - {loan.status === 'active' ? 'Active' : 'Settled'}
          </span>
        </div>
        <div className="text-right">
          <span className={`font-bold text-sm ${loan.type === 'lent' ? 'text-emerald-600' : 'text-amber-600'}`}>
            ${loan.amount.toFixed(2)} total
          </span>
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-2 text-xs text-slate-600">
        <div className="flex items-center gap-1.5">
          <CalendarIcon className="w-3.5 h-3.5 text-slate-400" />
          <span><span className="font-medium">Issued:</span> {new Date(loan.dateIssued).toLocaleDateString()}</span>
        </div>
        {loan.dueDate && (
          <div className="flex items-center gap-1.5 text-rose-600">
            <CalendarIcon className="w-3.5 h-3.5" />
            <span><span className="font-medium">Due:</span> {new Date(loan.dueDate).toLocaleDateString()}</span>
          </div>
        )}
      </div>

      {loan.accountId && (() => {
        const acc = accounts.find(a => a.id === loan.accountId);
        if (!acc) return null;
        return (
          <div className="flex items-center gap-1.5 text-xs text-indigo-600 bg-indigo-50/50 w-fit px-2 py-0.5 rounded border border-indigo-100">
            <Landmark className="w-3 h-3" />
            <span>Issued via {acc.bankName} {accountNumberTruncated(acc.accountNumber)}</span>
          </div>
        );
      })()}

      <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100 flex justify-between items-center text-xs">
        <div>
          <div className="text-slate-500 font-bold uppercase tracking-wider text-[9px]">Received/Paid</div>
          <div className="font-medium text-slate-700">${totalPaid.toFixed(2)}</div>
        </div>
        <div className="text-right">
          <div className="text-slate-500 font-bold uppercase tracking-wider text-[9px]">Remaining</div>
          <div className="font-bold text-slate-900">${remaining.toFixed(2)}</div>
        </div>
      </div>

      {loan.notes && (
        <p className="text-xs text-slate-500 italic border-l-2 border-slate-200 pl-2">
          {loan.notes}
        </p>
      )}

      {(loan.payments || []).length > 0 && (
        <div className="mt-1">
          <button 
            onClick={() => setExpandedLoanId(isExpanded ? null : loan.id)}
            className="text-[11px] font-bold text-indigo-600 flex items-center gap-1 hover:text-indigo-700"
          >
            <History className="w-3.5 h-3.5" />
            Payment History ({loan.payments!.length}) {isExpanded ? <ChevronUp className="w-3 h-3"/> : <ChevronDown className="w-3 h-3"/>}
          </button>
          
          {isExpanded && (
            <div className="mt-2 space-y-2 border-t border-slate-100 pt-2 animate-fadeIn">
              {loan.payments!.map(p => {
                const payAcc = accounts.find(a => a.id === p.accountId);
                return (
                  <div key={p.id} className="flex justify-between items-center bg-slate-50 p-2 rounded border border-slate-100 text-xs">
                    <div className="flex flex-col">
                      <span className="font-medium text-slate-700">{new Date(p.date).toLocaleDateString()}</span>
                      {p.notes && <span className="text-[10px] text-slate-500">{p.notes}</span>}
                      {payAcc && <span className="text-[10px] text-indigo-600 font-medium">via {payAcc.bankName} {accountNumberTruncated(payAcc.accountNumber)}</span>}
                    </div>
                    <span className="font-bold text-slate-800">${p.amount.toFixed(2)}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {isAddingPayment && (
        <form onSubmit={(e) => handleAddPaymentSubmit(e, loan.id)} className="bg-indigo-50/50 p-3 rounded-lg border border-indigo-100 mt-2 space-y-3">
          <div>
            <label className="text-[10px] font-bold uppercase text-slate-500 mb-1 block">Payment Amount ($)</label>
            <input 
              type="number" 
              required min="0.01" step="0.01" max={remaining || undefined}
              className="w-full text-xs px-2.5 py-1.5 border border-slate-250 rounded focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
              value={paymentAmount} onChange={e => setPaymentAmount(e.target.value)}
            />
          </div>
          <div>
            <label className="text-[10px] font-bold uppercase text-slate-500 mb-1 block">Account (Optional)</label>
            <select
              className="w-full text-xs px-2.5 py-1.5 border border-slate-250 rounded focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 bg-white"
              value={paymentAccountId}
              onChange={e => setPaymentAccountId(e.target.value)}
            >
              <option value="">N/A (Cash / External)</option>
              {accounts.map(acc => (
                <option key={acc.id} value={acc.id}>{acc.bankName} {accountNumberTruncated(acc.accountNumber)}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-[10px] font-bold uppercase text-slate-500 mb-1 block">Note (Optional)</label>
            <input 
              type="text" 
              className="w-full text-xs px-2.5 py-1.5 border border-slate-250 rounded focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
              value={paymentNotes} onChange={e => setPaymentNotes(e.target.value)}
              placeholder="e.g. Venmo transfer"
            />
          </div>
          <div className="flex justify-end gap-2 pt-1">
            <button type="button" onClick={() => setPaymentFormFor(null)} className="text-[11px] font-bold text-slate-500 hover:text-slate-700">Cancel</button>
            <button type="submit" className="text-[11px] font-bold bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded shadow-sm">Save</button>
          </div>
        </form>
      )}

      <div className="pt-3 mt-1 border-t border-slate-100 flex justify-between gap-2 overflow-x-auto">
        <div className="flex gap-1.5 shrink-0">
          {loan.status === 'active' && !isAddingPayment && remaining > 0 && (
            <button
              onClick={() => setPaymentFormFor(loan.id)}
              className="px-2.5 py-1.5 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 text-[11px] font-bold rounded-lg transition-colors flex items-center gap-1.5"
            >
              <Banknote className="w-3.5 h-3.5" />
              Add Pay
            </button>
          )}
          {loan.status === 'active' ? (
            <button
              onClick={() => onUpdateLoanStatus(loan.id, 'settled')}
              className="px-2.5 py-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 text-[11px] font-bold rounded-lg transition-colors flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              Settle
            </button>
          ) : (
            <button
              onClick={() => onUpdateLoanStatus(loan.id, 'active')}
              className="px-2.5 py-1.5 bg-slate-50 text-slate-600 hover:bg-slate-100 text-[11px] font-bold rounded-lg transition-colors flex items-center gap-1.5"
            >
              Set Active
            </button>
          )}
        </div>
        <button
          onClick={() => {
            if (confirm(`Are you sure you want to delete this loan record for ${loan.personName}?`)) {
              onDeleteLoan(loan.id);
            }
          }}
          className="px-2 py-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600 rounded-lg transition-colors shrink-0"
          title="Delete loan"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  )};

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <span className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
              <HandCoins className="w-5 h-5" />
            </span>
            Loan & Debt Tracker
          </h2>
          <p className="text-xs text-slate-500 mt-1">Manage money lent to friends and money owed below.</p>
        </div>
        <div className="flex gap-2">
          <div className="relative">
            <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-slate-400">
              <ArrowUpDown className="w-3.5 h-3.5" />
            </div>
            <select
              className="pl-8 pr-8 py-2.5 bg-slate-50 border border-slate-200 text-slate-700 text-xs font-bold rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 appearance-none"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'amount' | 'date' | 'name')}
            >
              <option value="date">Sort by Date Issued</option>
              <option value="amount">Sort by Amount Due</option>
              <option value="name">Sort by Person Name</option>
            </select>
            <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none text-slate-400">
              <ChevronDown className="w-3.5 h-3.5" />
            </div>
          </div>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-3.5 py-2.5 rounded-lg transition-colors flex items-center gap-1.5 shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Add Loan Record
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-100 relative overflow-hidden flex flex-col justify-between min-h-[120px]">
          <div>
            <p className="text-xs uppercase font-bold text-emerald-650 text-emerald-700 tracking-wider mb-1 flex justify-between items-center shadow-sm drop-shadow-sm/20">
              <span>Money Lent (Receivable)</span>
              <span className="text-[10px] bg-emerald-200/50 px-2 py-0.5 rounded text-emerald-800">TOTAL</span>
            </p>
            <p className="text-2xl font-black text-emerald-800">${totalLent.toFixed(2)}</p>
          </div>
          <div className="flex justify-between items-end mt-4 pt-3 border-t border-emerald-200/60 font-medium">
            <div>
              <p className="text-[10px] uppercase font-bold text-emerald-700 opacity-80">Recovered</p>
              <p className="text-emerald-700 text-sm font-bold">${totalLentPaid.toFixed(2)}</p>
            </div>
            <div className="text-right">
              <p className="text-[10px] uppercase font-bold text-emerald-700 opacity-80">Pending</p>
              <p className="text-emerald-700 text-sm font-bold">${totalLentPending.toFixed(2)}</p>
            </div>
          </div>
        </div>
        <div className="p-4 bg-amber-50 rounded-xl border border-amber-100 relative overflow-hidden flex flex-col justify-between min-h-[120px]">
          <div>
            <p className="text-xs uppercase font-bold text-amber-700 tracking-wider mb-1 flex justify-between items-center shadow-sm drop-shadow-sm/20">
              <span>Money Borrowed (Payable)</span>
              <span className="text-[10px] bg-amber-200/50 px-2 py-0.5 rounded text-amber-800">TOTAL</span>
            </p>
            <p className="text-2xl font-black text-amber-800">${totalBorrowed.toFixed(2)}</p>
          </div>
          <div className="flex justify-between items-end mt-4 pt-3 border-t border-amber-200/60 font-medium">
            <div>
              <p className="text-[10px] uppercase font-bold text-amber-700 opacity-80">Paid Back</p>
              <p className="text-amber-700 text-sm font-bold">${totalBorrowedPaid.toFixed(2)}</p>
            </div>
            <div className="text-right">
              <p className="text-[10px] uppercase font-bold text-amber-700 opacity-80">Pending</p>
              <p className="text-amber-700 text-sm font-bold">${totalBorrowedPending.toFixed(2)}</p>
            </div>
          </div>
        </div>
      </div>

      {showAddForm && (
        <form onSubmit={handleAddSubmit} className="mb-6 p-4 bg-slate-50 border border-slate-200 rounded-xl animate-fadeIn space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-200">
            <h3 className="font-bold text-sm text-slate-700">New Loan Record</h3>
            <button type="button" onClick={() => setShowAddForm(false)} className="text-xs font-bold text-slate-400 hover:text-slate-600">Close</button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1.5">Record Type</label>
              <div className="flex rounded-lg overflow-hidden border border-slate-300">
                <button
                  type="button"
                  className={`flex-1 py-2 text-xs font-bold ${type === 'lent' ? 'bg-emerald-600 text-white' : 'bg-white text-slate-600 hover:bg-slate-50'}`}
                  onClick={() => setType('lent')}
                >
                  I Lent Money
                </button>
                <button
                  type="button"
                  className={`flex-1 py-2 text-xs font-bold ${type === 'borrowed' ? 'bg-amber-600 text-white' : 'bg-white text-slate-600 hover:bg-slate-50'}`}
                  onClick={() => setType('borrowed')}
                >
                  I Borrowed Money
                </button>
              </div>
            </div>

            <div>
              <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1.5">Account Connected (Optional)</label>
              <select
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 bg-white"
                value={accountId}
                onChange={e => setAccountId(e.target.value)}
              >
                <option value="">Cash / External</option>
                {accounts.map(acc => (
                  <option key={acc.id} value={acc.id}>{acc.bankName} {accountNumberTruncated(acc.accountNumber)} - {acc.accountType}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1.5">Person Name</label>
              <input
                type="text"
                required
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                placeholder="e.g. John Doe"
                value={personName}
                onChange={e => setPersonName(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1.5">Amount ($)</label>
              <input
                type="number"
                required
                min="0.01"
                step="0.01"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                placeholder="0.00"
                value={amount}
                onChange={e => setAmount(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1.5">Issued Date</label>
                <input
                  type="date"
                  required
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-700 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  value={dateIssued}
                  onChange={e => setDateIssued(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1.5">Due Date (Optional)</label>
                <input
                  type="date"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-700 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  value={dueDate}
                  onChange={e => setDueDate(e.target.value)}
                />
              </div>
            </div>

            <div className="md:col-span-2">
              <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1.5">Notes (Optional)</label>
              <input
                type="text"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-700 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                placeholder="Reason or context for the loan"
                value={notes}
                onChange={e => setNotes(e.target.value)}
              />
            </div>
          </div>
          <div className="flex justify-end pt-2">
            <button type="submit" className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm rounded-lg shadow-sm transition-colors">
              Save Record
            </button>
          </div>
        </form>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            Receivables (Who owes me)
          </h3>
          <div className="space-y-3">
            {lentLoans.length === 0 ? (
              <p className="text-sm text-slate-400 italic bg-slate-50 p-4 rounded-xl text-center border border-slate-100">No receivable loans recorded.</p>
            ) : (
              lentLoans.map(renderLoanCard)
            )}
          </div>
        </div>
        <div>
          <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-500"></span>
            Payables (Who I owe)
          </h3>
          <div className="space-y-3">
            {borrowedLoans.length === 0 ? (
              <p className="text-sm text-slate-400 italic bg-slate-50 p-4 rounded-xl text-center border border-slate-100">No payable loans recorded.</p>
            ) : (
              borrowedLoans.map(renderLoanCard)
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
