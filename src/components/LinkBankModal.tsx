/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { X, Lock, Landmark, Check, Loader2, Sparkles, AlertCircle } from 'lucide-react';
import { BankAccount, AccountType, InstitutionType } from '../types';

interface LinkBankModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConnectAccounts: (accounts: BankAccount[]) => void;
  onUpdateAccount?: (account: BankAccount) => void;
  editingAccount?: BankAccount | null;
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

export default function LinkBankModal({
  isOpen,
  onClose,
  onConnectAccounts,
  onUpdateAccount,
  editingAccount
}: LinkBankModalProps) {
  const [bankName, setBankName] = useState('');
  const [accountName, setAccountName] = useState('');
  const [accountType, setAccountType] = useState<AccountType>('Checking');
  const [balance, setBalance] = useState('');
  const [accountNum, setAccountNum] = useState('');
  const [iban, setIban] = useState('');
  const [selectedColor, setSelectedColor] = useState(COLOR_ACCENTS[0].id);
  
  // Custom states of multi-institutions types
  const [institutionType, setInstitutionType] = useState<InstitutionType>('Bank Account');
  const [cardPhysicality, setCardPhysicality] = useState<'Physical' | 'Virtual'>('Physical');
  const [cardNumber, setCardNumber] = useState('');

  const [isLinking, setIsLinking] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    if (editingAccount) {
      setBankName(editingAccount.bankName);
      setAccountName(editingAccount.accountName);
      setAccountType(editingAccount.accountType);
      setBalance(editingAccount.balance.toString());
      setAccountNum(editingAccount.accountNumber || '');
      setIban(editingAccount.iban || '');
      setSelectedColor(editingAccount.color);
      setInstitutionType(editingAccount.institutionType || 'Bank Account');
      setCardPhysicality(editingAccount.cardPhysicality || 'Physical');
      setCardNumber(editingAccount.cardNumber || '');
    } else {
      setBankName('');
      setAccountName('');
      setAccountType('Checking');
      setBalance('');
      setAccountNum('');
      setIban('');
      setSelectedColor(COLOR_ACCENTS[0].id);
      setInstitutionType('Bank Account');
      setCardPhysicality('Physical');
      setCardNumber('');
    }
  }, [editingAccount, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!bankName.trim() || !accountName.trim() || !balance.trim()) {
      alert('Please fill in all required fields.');
      return;
    }

    if (institutionType === 'Bank Card' && !cardNumber.trim()) {
      alert('Card Number is required for Bank Cards.');
      return;
    }
    if (institutionType === 'BRT Card' && !cardNumber.trim()) {
      alert('Card Number is required for BRT Transit Cards.');
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
      
      const isEdit = !!editingAccount;

      // Assign appropriate defaults based on selected Institution type
      const actType: AccountType = institutionType === 'Cash' 
        ? 'Cash Wallet' 
        : institutionType === 'BRT Card' 
          ? 'Transit Pass' 
          : accountType;

      const actNum = institutionType === 'Cash'
        ? 'Cash'
        : institutionType === 'Bank Card' || institutionType === 'BRT Card'
          ? (cardNumber.trim() ? `•••• ${cardNumber.trim().slice(-4)}` : `•••• ${Math.floor(1000 + Math.random() * 9000)}`)
          : (accountNum.trim() || `•••• ${Math.floor(1000 + Math.random() * 9000)}`);

      const updatedAccount: BankAccount = {
        id: isEdit ? editingAccount!.id : `acct-user-${Math.random().toString(36).substr(2, 9)}`,
        bankName: bankName.trim(),
        accountName: accountName.trim(),
        accountType: actType,
        accountNumber: actNum,
        iban: (institutionType === 'Bank Account' && iban.trim()) ? iban.trim() : undefined,
        balance: numericBalance,
        lastSynced: new Date().toISOString(),
        isConnected: true,
        color: selectedColor,
        institutionType,
        cardPhysicality: institutionType === 'Bank Card' ? cardPhysicality : undefined,
        cardNumber: (institutionType === 'Bank Card' || institutionType === 'BRT Card') ? cardNumber.trim() : undefined
      };

      if (isEdit && onUpdateAccount) {
        onUpdateAccount(updatedAccount);
        onClose();
      } else {
        setIsSuccess(true);
        onConnectAccounts([updatedAccount]);
      }
    }, 1000);
  };

  const handleResetClose = () => {
    setBankName('');
    setAccountName('');
    setAccountType('Checking');
    setBalance('');
    setAccountNum('');
    setIban('');
    setSelectedColor(COLOR_ACCENTS[0].id);
    setInstitutionType('Bank Account');
    setCardPhysicality('Physical');
    setCardNumber('');
    setIsSuccess(false);
    onClose();
  };

  const isEditMode = !!editingAccount;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden text-gray-800 flex flex-col max-h-[95vh] animate-scaleUp">
        
        {/* Header Title */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg">
              <Landmark className="w-4 h-4 shrink-0" />
            </div>
            <div>
              <span className="text-xs font-mono text-slate-500 uppercase tracking-widest block font-bold">
                {isEditMode ? 'Modify Connection' : 'Connect Pipeline'}
              </span>
              <h3 className="text-sm font-extrabold text-slate-900 tracking-tight leading-none mt-0.5">
                {isEditMode ? 'Edit Bank Account details' : 'Link New Bank Account'}
              </h3>
            </div>
          </div>
          <button 
            onClick={handleResetClose}
            className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition"
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
                <h4 className="text-md font-bold text-slate-900">
                  {institutionType === 'Cash' 
                    ? 'Cash Asset Registered' 
                    : institutionType === 'Bank Card' 
                      ? 'Bank Card Connected' 
                      : institutionType === 'BRT Card' 
                        ? 'Transit Card Linked' 
                        : 'Bank Account Linked'}
                </h4>
                <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
                  The {bankName} "{accountName}" pipeline has been fully integrated into your secure ledger.
                </p>
              </div>

              <div className="p-4 bg-slate-50 border border-slate-200/60 rounded-2xl max-w-sm mx-auto text-left text-xs space-y-1.5 font-sans">
                <div className="flex justify-between">
                  <span className="font-semibold text-slate-400 uppercase tracking-wider text-[9px] font-mono">Type:</span>
                  <span className="font-bold text-slate-800 uppercase text-[10px] tracking-wide">{institutionType}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-semibold text-slate-400 uppercase tracking-wider text-[9px] font-mono">
                    {institutionType === 'Cash' ? 'Wallet Name:' : institutionType === 'BRT Card' ? 'Transit System:' : 'Bank/Institution:'}
                  </span>
                  <span className="font-bold text-slate-800">{bankName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-semibold text-slate-400 uppercase tracking-wider text-[9px] font-mono">Account Nickname:</span>
                  <span className="font-bold text-slate-800">{accountName}</span>
                </div>
                {institutionType === 'Bank Card' && (
                  <div className="flex justify-between">
                    <span className="font-semibold text-slate-400 uppercase tracking-wider text-[9px] font-mono">Card Physicality:</span>
                    <span className="font-bold text-indigo-600 font-mono">{cardPhysicality}</span>
                  </div>
                )}
                {institutionType === 'Bank Account' && accountNum.trim() && (
                  <div className="flex justify-between">
                    <span className="font-semibold text-slate-400 uppercase tracking-wider text-[9px] font-mono">Account Number:</span>
                    <span className="font-bold text-slate-800 font-mono text-[11px]">{accountNum}</span>
                  </div>
                )}
                {(institutionType === 'Bank Card' || institutionType === 'BRT Card') && cardNumber.trim() && (
                  <div className="flex justify-between">
                    <span className="font-semibold text-slate-400 uppercase tracking-wider text-[9px] font-mono">Card/Account:</span>
                    <span className="font-bold text-slate-800 font-mono text-[11px]">
                      {cardNumber.length > 4 ? `•••• ${cardNumber.slice(-4)}` : cardNumber}
                    </span>
                  </div>
                )}
                {institutionType === 'Bank Account' && iban.trim() && (
                  <div className="flex justify-between">
                    <span className="font-semibold text-slate-400 uppercase tracking-wider text-[9px] font-mono">IBAN Code:</span>
                    <span className="font-bold text-slate-800 font-mono text-[11px]">{iban}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="font-semibold text-slate-400 uppercase tracking-wider text-[9px] font-mono">Initial Balance:</span>
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

              {/* Institution Type Selector */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                  Institution/Link Type <span className="text-rose-500">*</span>
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {(['Bank Account', 'Bank Card', 'BRT Card', 'Cash'] as const).map(type => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => {
                        setInstitutionType(type);
                        if (type === 'Cash') {
                          setBankName('Cash Wallet');
                          setAccountName('Personal Cash');
                          setAccountType('Cash Wallet');
                        } else if (type === 'BRT Card') {
                          setBankName('Transit Authority');
                          setAccountName('My BRT Transit Card');
                          setAccountType('Transit Pass');
                        } else if (type === 'Bank Card') {
                          setBankName('');
                          setAccountName('');
                          setAccountType('Credit Card');
                        } else {
                          setBankName('');
                          setAccountName('');
                          setAccountType('Checking');
                        }
                      }}
                      className={`py-2 px-1 text-center font-bold text-[11px] rounded-xl border transition-all ${
                        institutionType === type
                          ? 'bg-blue-600 border-blue-600 text-white shadow-sm'
                          : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              {institutionType === 'Bank Account' && (
                <div className="p-3 bg-amber-50 border border-amber-100 rounded-2xl flex items-start gap-2.5 text-[11px] text-amber-800">
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold block">Safe Bank Details Mode</span>
                    <span>Please provide Bank Name, IBAN and Account Number for transfers only. Do NOT provide card details like 16-digit card number, CVV or expiry dates.</span>
                  </div>
                </div>
              )}

              {/* Form Input Variables */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* Bank Name / Issuer / Source Name */}
                <div className="space-y-1">
                  <label htmlFor="bank-form-name" className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    {institutionType === 'Cash' 
                      ? 'Wallet Source / Location' 
                      : institutionType === 'BRT Card' 
                        ? 'Transit Network / Provider' 
                        : institutionType === 'Bank Card'
                          ? 'Card Issuer / Bank Name'
                          : 'Institution / Bank Name'}{' '}
                    <span className="text-rose-500">*</span>
                  </label>
                  <input
                    id="bank-form-name"
                    type="text"
                    required
                    placeholder={
                      institutionType === 'Cash' 
                        ? 'e.g. Cash Drawer, Safe box' 
                        : institutionType === 'BRT Card' 
                          ? 'e.g. BRT Transit, Metro Transit' 
                          : 'e.g. Chase Bank'
                    }
                    value={bankName}
                    onChange={e => setBankName(e.target.value)}
                    disabled={isLinking}
                    className="w-full px-3.5 py-2.5 border border-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-600 focus:border-blue-600 rounded-xl bg-slate-50 text-xs text-slate-800 placeholder-slate-400 font-semibold"
                  />
                </div>

                {/* Account Name / Nickname */}
                <div className="space-y-1">
                  <label htmlFor="acct-form-name" className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    {institutionType === 'Cash' 
                      ? 'Wallet Nickname' 
                      : institutionType === 'BRT Card' 
                        ? 'Card Nickname' 
                        : 'Account Nickname'}{' '}
                    <span className="text-rose-500">*</span>
                  </label>
                  <input
                    id="acct-form-name"
                    type="text"
                    required
                    placeholder={
                      institutionType === 'Cash' 
                        ? 'e.g. Pocket Cash' 
                        : institutionType === 'BRT Card' 
                          ? 'e.g. Transit Card' 
                          : 'e.g. Primary Checking'
                    }
                    value={accountName}
                    onChange={e => setAccountName(e.target.value)}
                    disabled={isLinking}
                    className="w-full px-3.5 py-2.5 border border-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-600 focus:border-blue-600 rounded-xl bg-slate-50 text-xs text-slate-800 placeholder-slate-400 font-semibold"
                  />
                </div>

              </div>

              {/* Conditional parameters based on Link Type */}
              {institutionType === 'Bank Account' && (
                <>
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

                    {/* Account Number */}
                    <div className="space-y-1">
                      <label htmlFor="acct-form-num" className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                        Account Number <span className="text-slate-400 font-normal">(Optional)</span>
                      </label>
                      <input
                        id="acct-form-num"
                        type="text"
                        placeholder="e.g. 1024849204"
                        value={accountNum}
                        onChange={e => setAccountNum(e.target.value)}
                        disabled={isLinking}
                        className="w-full px-3.5 py-2.5 border border-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-600 focus:border-blue-600 rounded-xl bg-slate-50 text-xs text-slate-800 placeholder-slate-400 font-mono tracking-wide font-semibold"
                      />
                    </div>
                  </div>

                  {/* IBAN */}
                  <div className="space-y-1">
                    <label htmlFor="acct-form-iban" className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                      IBAN (International Bank Account Number) <span className="text-slate-400 font-normal">(Optional)</span>
                    </label>
                    <input
                      id="acct-form-iban"
                      type="text"
                      placeholder="e.g. GB29 WXYZ 6016 1331 9268 19"
                      value={iban}
                      onChange={e => setIban(e.target.value.toUpperCase())}
                      disabled={isLinking}
                      className="w-full px-3.5 py-2.5 border border-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-600 focus:border-blue-600 rounded-xl bg-slate-50 text-xs text-slate-800 placeholder-slate-400 font-mono tracking-wide font-semibold"
                    />
                  </div>
                </>
              )}

              {institutionType === 'Bank Card' && (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Card Account Type selection */}
                    <div className="space-y-1">
                      <label htmlFor="card-form-type" className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                        Associated Account Type <span className="text-rose-500">*</span>
                      </label>
                      <select
                        id="card-form-type"
                        value={accountType}
                        onChange={e => setAccountType(e.target.value as AccountType)}
                        disabled={isLinking}
                        className="w-full px-3.5 py-2.5 border border-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-600 focus:border-blue-600 rounded-xl bg-slate-50 text-xs text-slate-800 font-semibold"
                      >
                        <option value="Checking">Checking (Debit Card)</option>
                        <option value="Savings">Savings</option>
                        <option value="Credit Card">Credit Card</option>
                      </select>
                    </div>

                    {/* Card Number */}
                    <div className="space-y-1">
                      <label htmlFor="card-form-num" className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                        Card Number <span className="text-rose-500">*</span>
                      </label>
                      <input
                        id="card-form-num"
                        type="text"
                        required
                        placeholder="e.g. 4111 2222 3333 4444"
                        value={cardNumber}
                        onChange={e => setCardNumber(e.target.value)}
                        disabled={isLinking}
                        className="w-full px-3.5 py-2.5 border border-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-600 focus:border-blue-600 rounded-xl bg-slate-50 text-xs text-slate-850 font-mono tracking-wide font-bold placeholder-slate-400"
                      />
                    </div>
                  </div>

                  {/* Physical vs Virtual selector */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                      Card Form Factor <span className="text-rose-500">*</span>
                    </label>
                    <div className="flex gap-4">
                      {['Physical', 'Virtual'].map(factor => (
                        <label key={factor} className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
                          <input
                            type="radio"
                            name="cardPhysicality"
                            checked={cardPhysicality === factor}
                            onChange={() => setCardPhysicality(factor as 'Physical' | 'Virtual')}
                            className="text-blue-600 focus:ring-blue-500 w-4 h-4"
                          />
                          <span>{factor} Card</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {institutionType === 'BRT Card' && (
                <>
                  {/* BRT Card Layout: Name, Number and Account Link in it */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Transit System Card/Account Number */}
                    <div className="space-y-1">
                      <label htmlFor="brt-form-num" className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                        Transit Cards/Account # <span className="text-rose-500">*</span>
                      </label>
                      <input
                        id="brt-form-num"
                        type="text"
                        required
                        placeholder="e.g. Transit ID/Account Num"
                        value={cardNumber}
                        onChange={e => setCardNumber(e.target.value)}
                        disabled={isLinking}
                        className="w-full px-3.5 py-2.5 border border-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-600 focus:border-blue-600 rounded-xl bg-slate-50 text-xs text-slate-800 placeholder-slate-400 font-mono font-semibold"
                      />
                    </div>

                    {/* Associated Account metadata */}
                    <div className="space-y-1">
                      <label htmlFor="brt-linked-acct" className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                        Prepaid Account Type
                      </label>
                      <select
                        id="brt-linked-acct"
                        value={accountType}
                        onChange={e => setAccountType(e.target.value as AccountType)}
                        disabled={isLinking}
                        className="w-full px-3.5 py-2.5 border border-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-600 focus:border-blue-600 rounded-xl bg-slate-50 text-xs text-slate-850 font-semibold"
                      >
                        <option value="Transit Pass">Prepaid Smart Card</option>
                        <option value="Checking">Linked Bank Checking Account</option>
                        <option value="Credit Card">Linked Credit Card</option>
                      </select>
                    </div>
                  </div>
                  
                  <div className="p-3 bg-indigo-50 border border-indigo-150 rounded-2xl text-[11px] text-indigo-800 leading-normal">
                    <span className="font-bold block">Smart Transit Mode</span>
                    <span>This logs your Transit Network Pass with its corresponding RFID Card/Account details and balance records.</span>
                  </div>
                </>
              )}

              {institutionType === 'Cash' && (
                <div className="p-3 bg-emerald-50 border border-emerald-150 rounded-2xl text-[11px] text-emerald-800 leading-normal">
                  <span className="font-bold block">Cash Ledger Mode</span>
                  <span>No card, IBAN, bank connections or card details required for standard local cash wallets. Your wallet will keep track of self-funded offline assets.</span>
                </div>
              )}

              {/* Shared standard attributes: Starting Balance & Color */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* Starting Balance */}
                <div className="space-y-1">
                  <label htmlFor="acct-form-bal" className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    {isEditMode ? 'Current Balance ($)' : 'Starting Balance ($)'} <span className="text-rose-500">*</span>
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
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 rounded-xl font-bold text-slate-600 transition disabled:opacity-50 text-xs text-center"
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
                      <span>{isEditMode ? 'Updating...' : 'Syncing Connection...'}</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4.5 h-4.5 animate-pulse" />
                      <span>{isEditMode ? 'Save Changes' : 'Establish Connection'}</span>
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
