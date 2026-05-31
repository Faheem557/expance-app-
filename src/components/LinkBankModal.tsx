/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { X, ShieldAlert, CheckCircle2, Loader2, ArrowRight, Lock, KeyRound } from 'lucide-react';
import { AVAILABLE_SIMULATED_BANKS } from '../initialData';
import { BankAccount } from '../types';

interface LinkBankModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConnectAccounts: (accounts: BankAccount[]) => void;
  existingAccountIds: string[];
}

export default function LinkBankModal({ isOpen, onClose, onConnectAccounts, existingAccountIds }: LinkBankModalProps) {
  const [step, setStep] = useState<'select' | 'credentials' | 'otp' | 'accounts' | 'success'>('select');
  const [selectedBank, setSelectedBank] = useState<typeof AVAILABLE_SIMULATED_BANKS[0] | null>(null);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [selectedAccountSubIds, setSelectedAccountSubIds] = useState<number[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  if (!isOpen) return null;

  const handleBankSelect = (bank: typeof AVAILABLE_SIMULATED_BANKS[0]) => {
    setSelectedBank(bank);
    setStep('credentials');
    setErrorMessage('');
  };

  const handleCredentialsSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) {
      setErrorMessage('Please fill in both fields.');
      return;
    }
    setErrorMessage('');
    setIsSyncing(true);
    // Simulate API authorization handshake
    setTimeout(() => {
      setIsSyncing(false);
      setStep('otp');
    }, 1500);
  };

  const handleOtpSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (otpCode.length < 4) {
      setErrorMessage('Please enter a valid 6-digit security code.');
      return;
    }
    setErrorMessage('');
    setIsSyncing(true);
    // Simulate OTP lookup verification
    setTimeout(() => {
      setIsSyncing(false);
      setStep('accounts');
      // Auto select first account
      setSelectedAccountSubIds([0]);
    }, 1200);
  };

  const handleAccountsSubmit = () => {
    if (selectedAccountSubIds.length === 0) {
      setErrorMessage('Please select at least one account to link.');
      return;
    }

    if (!selectedBank) return;

    setIsSyncing(true);
    setTimeout(() => {
      setIsSyncing(false);

      const accountsToConnect: BankAccount[] = selectedAccountSubIds.map((idx, subIdx) => {
        const subAcc = selectedBank.accounts[idx];
        const randomId = `acct-${selectedBank.id}-${idx}-${Math.floor(Math.random() * 1000)}`;
        return {
          id: randomId,
          bankName: selectedBank.name,
          accountName: subAcc.name,
          accountType: subAcc.type as any,
          accountNumber: subAcc.num,
          balance: subAcc.bal,
          lastSynced: new Date().toISOString(),
          isConnected: true,
          color: selectedBank.logoColor.includes('blue') 
            ? 'bg-blue-600 border-blue-700' 
            : selectedBank.logoColor.includes('green')
            ? 'bg-emerald-600 border-emerald-700'
            : selectedBank.logoColor.includes('red')
            ? 'bg-red-600 border-red-700'
            : 'bg-teal-600 border-teal-700'
        };
      });

      onConnectAccounts(accountsToConnect);
      setStep('success');
    }, 1500);
  };

  const resetFlow = () => {
    setStep('select');
    setSelectedBank(null);
    setUsername('');
    setPassword('');
    setOtpCode('');
    setSelectedAccountSubIds([]);
    setErrorMessage('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm transition-opacity duration-300">
      <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden text-gray-800 flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 bg-gray-50/50">
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4 text-emerald-600" id="lock-icon" />
            <span className="text-xs font-mono text-gray-500 uppercase tracking-widest bg-emerald-50 px-2 py-1 rounded text-emerald-800">
              Plaid Sandbox Link
            </span>
          </div>
          <button 
            onClick={resetFlow}
            className="p-1.5 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition"
            id="close-modal-btn"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content Container */}
        <div className="p-6 overflow-y-auto flex-1">
          {step === 'select' && (
            <div className="space-y-4">
              <div className="text-center space-y-1">
                <h3 className="text-xl font-semibold tracking-tight text-gray-900">
                  Select Your Financial Institution
                </h3>
                <p className="text-sm text-gray-500">
                  Secure real-time syncing of transactions using encrypted sandbox protocols.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-3 pt-2">
                {AVAILABLE_SIMULATED_BANKS.map(bank => {
                  const isAlreadyLinked = existingAccountIds.some(id => id.includes(bank.id));
                  return (
                    <button
                      key={bank.id}
                      onClick={() => handleBankSelect(bank)}
                      disabled={isSyncing}
                      className={`flex items-center justify-between p-4 rounded-2xl border text-left transition ${bank.borderColor}`}
                      id={`bank-select-${bank.id}`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-3 h-3 rounded-full ${bank.logoColor.replace('text', 'bg')}`} />
                        <div>
                          <p className="font-medium text-gray-900">{bank.name}</p>
                          <p className="text-xs text-gray-400 capitalize">
                            {bank.accounts.length} account option(s) available
                          </p>
                        </div>
                      </div>
                      <ArrowRight className="w-4 h-4 text-gray-400" />
                    </button>
                  );
                })}
              </div>

              <div className="flex items-start gap-2.5 p-3.5 bg-sky-50 rounded-2xl border border-sky-100 text-xs text-sky-800 mt-2">
                <ShieldAlert className="w-4.5 h-4.5 text-sky-600 shrink-0 mt-0.5" />
                <p className="leading-relaxed">
                  <strong>Sandbox environment active:</strong> No real bank credentials are required. Try selecting any bank to witness the real-time syncing mechanism.
                </p>
              </div>
            </div>
          )}

          {step === 'credentials' && selectedBank && (
            <form onSubmit={handleCredentialsSubmit} className="space-y-4">
              <div className="text-center space-y-1 mb-2">
                <div className={`w-3 h-3 rounded-full mx-auto mb-2 ${selectedBank.logoColor.replace('text', 'bg')}`} />
                <h3 className="text-lg font-semibold text-gray-900">
                  Log in to {selectedBank.name}
                </h3>
                <p className="text-xs text-gray-500">
                  Enter your sandbox testing credentials to authenticate connections.
                </p>
              </div>

              {errorMessage && (
                <div className="p-3 bg-red-50 text-red-700 text-xs rounded-xl border border-red-100">
                  {errorMessage}
                </div>
              )}

              <div className="space-y-3.5">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Username / Client ID</label>
                  <div className="relative">
                    <input
                      type="text"
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white text-sm"
                      placeholder="e.g. sandbox_user"
                      value={username}
                      onChange={e => setUsername(e.target.value)}
                      disabled={isSyncing}
                      required
                      id="username-input"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Password</label>
                  <input
                    type="password"
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white text-sm"
                    placeholder="••••••••••••"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    disabled={isSyncing}
                    required
                    id="password-input"
                  />
                </div>
                
                <div className="text-[11px] text-gray-400 bg-gray-50 p-2.5 rounded-lg border border-gray-100 flex items-center gap-1.5 font-mono">
                  <Lock className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>Any characters are authenticated here to ease previewing.</span>
                </div>
              </div>

              <div className="flex gap-2.5 pt-4">
                <button
                  type="button"
                  onClick={() => setStep('select')}
                  disabled={isSyncing}
                  className="flex-1 py-2.5 px-4 bg-gray-100 hover:bg-gray-200 rounded-xl font-medium text-gray-600 transition disabled:opacity-50 text-sm"
                  id="credentials-back-btn"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={isSyncing}
                  className="flex-1 py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold transition disabled:opacity-50 flex items-center justify-center gap-1.5 text-sm"
                  id="credentials-next-btn"
                >
                  {isSyncing ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Connecting...
                    </>
                  ) : (
                    'Connect'
                  )}
                </button>
              </div>
            </form>
          )}

          {step === 'otp' && selectedBank && (
            <form onSubmit={handleOtpSubmit} className="space-y-4">
              <div className="text-center space-y-1 mb-2">
                <div className="w-12 h-12 bg-blue-50 text-blue-600 flex items-center justify-center rounded-2xl mx-auto mb-2">
                  <KeyRound className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">
                  Verify Identity
                </h3>
                <p className="text-xs text-gray-500">
                  An SMS containing a 2-factor code has been sent to your simulated device.
                </p>
              </div>

              {errorMessage && (
                <div className="p-3 bg-red-50 text-red-700 text-xs rounded-xl border border-red-100">
                  {errorMessage}
                </div>
              )}

              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1 text-center">Enter 6-Digit SMS Code</label>
                  <input
                    type="text"
                    maxLength={6}
                    className="w-full text-center px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl font-mono text-xl tracking-[0.4em] focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white"
                    placeholder="123456"
                    value={otpCode}
                    onChange={e => setOtpCode(e.target.value.replace(/\D/g, ''))}
                    disabled={isSyncing}
                    required
                    id="otp-input"
                  />
                </div>
                <p className="text-[11px] text-gray-400 text-center">
                  You can type any 6 digits (e.g. <strong>000000</strong>) in sandbox testing.
                </p>
              </div>

              <div className="flex gap-2.5 pt-4">
                <button
                  type="button"
                  onClick={() => setStep('credentials')}
                  disabled={isSyncing}
                  className="flex-1 py-2.5 px-4 bg-gray-100 hover:bg-gray-200 rounded-xl font-medium text-gray-600 transition disabled:opacity-50 text-sm"
                  id="otp-back-btn"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={isSyncing}
                  className="flex-1 py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold transition disabled:opacity-50 flex items-center justify-center gap-1.5 text-sm"
                  id="otp-verify-btn"
                >
                  {isSyncing ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Verifying...
                    </>
                  ) : (
                    'Verify Code'
                  )}
                </button>
              </div>
            </form>
          )}

          {step === 'accounts' && selectedBank && (
            <div className="space-y-4">
              <div className="text-center space-y-1 mb-2">
                <h3 className="text-lg font-semibold text-gray-900">
                  Choose Accounts to Sync
                </h3>
                <p className="text-xs text-gray-500">
                  Check which accounts from {selectedBank.name} you want to link.
                </p>
              </div>

              {errorMessage && (
                <div className="p-3 bg-red-50 text-red-700 text-xs rounded-xl border border-red-100">
                  {errorMessage}
                </div>
              )}

              <div className="space-y-2 pt-1">
                {selectedBank.accounts.map((acc, idx) => {
                  const isChecked = selectedAccountSubIds.includes(idx);
                  return (
                    <button
                      key={idx}
                      onClick={() => {
                        if (isChecked) {
                          setSelectedAccountSubIds(selectedAccountSubIds.filter(i => i !== idx));
                        } else {
                          setSelectedAccountSubIds([...selectedAccountSubIds, idx]);
                        }
                      }}
                      className={`w-full flex items-center justify-between p-3.5 rounded-xl border text-left transition ${
                        isChecked 
                          ? 'border-blue-600 bg-blue-50/20 ring-1 ring-blue-600' 
                          : 'border-gray-250 hover:border-gray-300'
                      }`}
                      id={`select-acct-${idx}`}
                    >
                      <div>
                        <p className="font-semibold text-sm text-gray-900">{acc.name}</p>
                        <p className="text-xs text-gray-400">{acc.type} • {acc.num}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-mono font-medium text-sm text-gray-700">
                          ${acc.bal.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </span>
                        <div className={`w-5 h-5 rounded-md border flex items-center justify-center transition-colors ${
                          isChecked ? 'bg-blue-600 border-blue-600 text-white' : 'border-gray-300'
                        }`}>
                          {isChecked && <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 20 20"><path d="M0 11l2-2 5 5L18 3l2 2L7 18z"/></svg>}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>

              <div className="flex gap-2.5 pt-4">
                <button
                  onClick={() => setStep('otp')}
                  disabled={isSyncing}
                  className="flex-1 py-2.5 px-4 bg-gray-100 hover:bg-gray-200 rounded-xl font-medium text-gray-600 transition disabled:opacity-50 text-sm"
                  id="accounts-back-btn"
                >
                  Back
                </button>
                <button
                  onClick={handleAccountsSubmit}
                  disabled={isSyncing}
                  className="flex-1 py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold transition disabled:opacity-50 flex items-center justify-center gap-1.5 text-sm"
                  id="accounts-submit-btn"
                >
                  {isSyncing ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Authorizing...
                    </>
                  ) : (
                    'Link Selected'
                  )}
                </button>
              </div>
            </div>
          )}

          {step === 'success' && selectedBank && (
            <div className="text-center space-y-4 py-4">
              <div className="w-16 h-16 bg-emerald-50 text-emerald-600 flex items-center justify-center rounded-full mx-auto animate-bounce">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <div className="space-y-1.5">
                <h3 className="text-xl font-bold text-gray-900">
                  Bank Account Connected!
                </h3>
                <p className="text-sm text-gray-500 max-w-sm mx-auto">
                  {selectedBank.name} has been securely authorized. Transactions are syncing in real time.
                </p>
              </div>

              <div className="p-3.5 bg-gray-50 rounded-2xl border border-gray-100 text-left text-xs text-gray-500 space-y-1 max-w-sm mx-auto">
                <div className="flex justify-between">
                  <span>Synced accounts:</span>
                  <span className="font-semibold text-gray-700">{selectedAccountSubIds.length} Linked</span>
                </div>
                <div className="flex justify-between">
                  <span>Frequency:</span>
                  <span className="font-semibold text-gray-700">Real-Time Webhooks</span>
                </div>
                <div className="flex justify-between">
                  <span>Security status:</span>
                  <span className="font-semibold text-emerald-600">Encrypted AES-256</span>
                </div>
              </div>

              <div className="pt-4">
                <button
                  onClick={resetFlow}
                  className="w-full max-w-sm py-2.5 bg-gray-900 hover:bg-black text-white font-semibold rounded-xl text-sm transition"
                  id="success-close-btn"
                >
                  Done
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
