/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { X, Lock, Landmark, Check, Loader2, CreditCard, Sparkles } from 'lucide-react';
import { BankAccount, AccountType } from '../types';

interface LinkBankModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConnectAccounts: (accounts: BankAccount[]) => void;
  existingAccountIds: string[];
}

const COLOR_ACCENTS = [
  { id: 'bg-blue-600 border-blue-700', label: 'Blue', bgClass: 'bg-blue-600' },
  { id: 'bg-indigo-600 border-indigo-700', label: 'Indigo', bgClass: 'bg-indigo-600' },
  { id: 'bg-emerald-600 border-emerald-700', label: 'Emerald', bgClass: 'bg-emerald-600' },
  { id: 'bg-teal-600 border-teal-700', label: 'Teal', bgClass: 'bg-teal-600' },
  { id: 'bg-rose-600 border-rose-700', label: 'Rose', bgClass: 'bg-rose-600' },
  { id: 'bg-zinc-800 border-zinc-950', label: 'Charcoal', bgClass: 'bg-zinc-800' },
];

export default function LinkBankModal({ isOpen, onClose, onConnectAccounts }: LinkBankModalProps) {
  const [bankName, setBankName] = useState('');
  const [accountName, setAccountName] = useState('');
  const [accountType, setAccountType] = useState<AccountType>('Checking');
  const [balance, setBalance] = useState('');
  const [accountNum, setAccountNum] = useState('');
  const [selectedColor, setSelectedColor] = useState(COLOR_ACCENTS[0].id);
  
  const [isLinking, setIsLinking] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!bankName.trim() || !accountName.trim() || !balance.trim()) {
      alert('Please fill in all required fields.');
      return;
    }

    const numericBalance = parseFloat(balance.replace(/,/g, ''));
    if (isNaN(numericBalance)) {
      alert('Please enter a valid balance representation.');
      return;
    }

    setIsLinking(true);

    // Simulate clean database sync authorize delay
    setTimeout(() => {
      setIsLinking(false);
      setIsSuccess(true);

      const formattedNum = accountNum.trim() 
        ? `•••• ${accountNum.slice(-4)}` 
        : `•••• ${Math.floor(1000 + Math.random() * 9000)}`;

      const newAccount: BankAccount = {
        id: `acct-user-${Math.random().toString(36).substr(2, 9)}`,
        bankName: bankName.trim(),
        accountName: accountName.trim(),
        accountType,
        accountNumber: formattedNum,
        balance: numericBalance,
        lastSynced: new Date().toISOString(),
        isConnected: true,
        color: selectedColor
      };

      onConnectAccounts([newAccount]);
    }, 1000);
  };

  const handleResetClose = () => {
    setBankName('');
    setAccountName('');
    setAccountType('Checking');
    setBalance('');
    setAccountNum('');
    setSelectedColor(COLOR_ACCENTS[0].id);
    setIsSuccess(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden text-gray-800 flex flex-col max-h-[90vh] animate-scaleUp">
        
        {/* Header Title */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg">
              <Landmark className="w-4 h-4 shrink-0" />
            </div>
            <div>
              <span className="text-xs font-mono text-slate-500 uppercase tracking-widest block font-bold">
                Connect Pipeline
              </span>
              <h3 className="text-sm font-extrabold text-slate-900 tracking-tight leading-none mt-0.5">
                Link New Bank Account
              </h3>
            </div>
          </div>
          <button 
            onClick={handleResetClose}
            className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-605 transition"
            id="close-modal-btn"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content Form */}
        <div className="p-6 overflow-y-auto flex-1">
          {isSuccess ? (
            <div className="text-center space-y-5 py-6">
              <div className="w-14 h-14 bg-emerald-50 text-emerald-600 flex items-center justify-center rounded-full mx-auto border border-emerald-100 shadow-sm animate-bounce">
                <Check className="w-7 h-7" />
              </div>
              <div className="space-y-1">
                <h4 className="text-md font-bold text-slate-900">Bank Account Linked Successfully</h4>
                <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
                  The {bankName} "{accountName}" pipeline has been fully integrated into your secure ledger.
                </p>
              </div>

              <div className="p-4 bg-slate-50 border border-slate-200/60 rounded-2xl max-w-sm mx-auto text-left text-xs space-y-1.5 font-sans">
                <div className="flex justify-between">
                  <span className="text-slate-505 font-medium text-slate-400 uppercase tracking-wider text-[9px] font-mono">Linked Bank:</span>
                  <span className="font-bold text-slate-800">{bankName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-505 font-medium text-slate-400 uppercase tracking-wider text-[9px] font-mono">Account Nickname:</span>
                  <span className="font-bold text-slate-800">{accountName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-505 font-medium text-slate-400 uppercase tracking-wider text-[9px] font-mono">Initial Balance:</span>
                  <span className="font-mono font-bold text-emerald-600">
                    ${parseFloat(balance).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleResetClose}
                  className="w-full max-w-sm py-2.5 bg-slate-900 hover:bg-black text-white font-bold rounded-xl text-xs transition"
                  id="success-close-btn"
                >
                  Return to Dashboard
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              
              <div className="p-3 bg-blue-50/70 border border-blue-100 rounded-2xl flex items-center gap-2.5 text-xs text-blue-800 font-medium">
                <Lock className="w-4 h-4 text-blue-600 shrink-0" />
                <span>Establish an active connection utilizing manual self-declared balances.</span>
              </div>

              {/* Form Input Variables */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* Bank Name */}
                <div className="space-y-1">
                  <label htmlFor="bank-form-name" className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    Institution / Bank Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    id="bank-form-name"
                    type="text"
                    required
                    placeholder="e.g. Bank of America"
                    value={bankName}
                    onChange={e => setBankName(e.target.value)}
                    disabled={isLinking}
                    className="w-full px-3.5 py-2.5 border border-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-600 focus:border-blue-600 rounded-xl bg-slate-50 text-xs text-slate-800 placeholder-slate-400 font-semibold"
                  />
                </div>

                {/* Account Name */}
                <div className="space-y-1">
                  <label htmlFor="acct-form-name" className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    Account Nickname <span className="text-rose-500">*</span>
                  </label>
                  <input
                    id="acct-form-name"
                    type="text"
                    required
                    placeholder="e.g. Travel Card or Checking"
                    value={accountName}
                    onChange={e => setAccountName(e.target.value)}
                    disabled={isLinking}
                    className="w-full px-3.5 py-2.5 border border-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-600 focus:border-blue-600 rounded-xl bg-slate-50 text-xs text-slate-800 placeholder-slate-400 font-semibold"
                  />
                </div>

              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* Account Type */}
                <div className="space-y-1">
                  <label htmlFor="acct-form-type" className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    Account Type <span className="text-rose-500">*</span>
                  </label>
                  <select
                    id="acct-form-type"
                    value={accountType}
                    onChange={e => setAccountType(e.target.value as AccountType)}
                    disabled={isLinking}
                    className="w-full px-3.5 py-2.5 border border-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-600 focus:border-blue-600 rounded-xl bg-slate-50 text-xs text-slate-800 font-semibold"
                  >
                    <option value="Checking">Checking</option>
                    <option value="Savings">Savings</option>
                    <option value="Credit Card">Credit Card</option>
                    <option value="Brokerage">Brokerage</option>
                  </select>
                </div>

                {/* Account Number Last 4 */}
                <div className="space-y-1">
                  <label htmlFor="acct-form-num" className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    Last 4 Digits <span className="text-slate-400 font-normal">(Optional)</span>
                  </label>
                  <input
                    id="acct-form-num"
                    type="text"
                    maxLength={4}
                    placeholder="e.g. 7482"
                    value={accountNum}
                    onChange={e => setAccountNum(e.target.value.replace(/\D/g, ''))}
                    disabled={isLinking}
                    className="w-full px-3.5 py-2.5 border border-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-600 focus:border-blue-600 rounded-xl bg-slate-50 text-xs text-slate-800 placeholder-slate-400 font-mono tracking-widest font-semibold"
                  />
                </div>

              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* Starting Balance */}
                <div className="space-y-1">
                  <label htmlFor="acct-form-bal" className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    Starting Balance ($) <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">$</span>
                    <input
                      id="acct-form-bal"
                      type="number"
                      step="0.01"
                      required
                      placeholder="0.00"
                      value={balance}
                      onChange={e => setBalance(e.target.value)}
                      disabled={isLinking}
                      className="w-full pl-8 pr-3.5 py-2.5 border border-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-600 focus:border-blue-600 rounded-xl bg-slate-50 text-xs text-slate-800 placeholder-slate-400 font-mono font-bold"
                    />
                  </div>
                </div>

                {/* Color Accents Theme Selection */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                    Account Panel Color
                  </label>
                  <div className="flex flex-wrap gap-2 pt-1">
                    {COLOR_ACCENTS.map(color => (
                      <button
                        key={color.id}
                        type="button"
                        onClick={() => setSelectedColor(color.id)}
                        disabled={isLinking}
                        className={`w-6 h-6 rounded-full ${color.bgClass} flex items-center justify-center text-white border transition focus:outline-none ${
                          selectedColor === color.id 
                            ? 'ring-2 ring-blue-500 scale-110 border-white' 
                            : 'border-transparent'
                        }`}
                        title={color.label}
                      >
                        {selectedColor === color.id && <Check className="w-3.5 h-3.5" />}
                      </button>
                    ))}
                  </div>
                </div>

              </div>

              {/* Submit Buttons */}
              <div className="flex gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={handleResetClose}
                  disabled={isLinking}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 rounded-xl font-bold text-slate-655 text-slate-600 transition disabled:opacity-50 text-xs text-center"
                  id="link-acct-cancel"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLinking}
                  className="flex-1 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold rounded-xl shadow-md cursor-pointer transition disabled:opacity-50 flex items-center justify-center gap-1.5 text-xs text-center"
                  id="link-acct-submit"
                >
                  {isLinking ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Syncing Connection...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4.5 h-4.5" />
                      <span>Establish Pipeline</span>
                    </>
                  )}
                </button>
              </div>

            </form>
          )}
        </div>

      </div>
    </div>
  );
}
