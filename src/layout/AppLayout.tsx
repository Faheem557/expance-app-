/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Outlet, NavLink, useLocation } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import LinkBankModal from '../components/LinkBankModal';
import SyncNotification from '../components/SyncNotification';
import {
  LayoutDashboard,
  CreditCard,
  ArrowLeftRight,
  PieChart,
  Target,
  Landmark,
  BellOff,
  Bell,
  Database,
  Activity,
  Menu,
  X,
  TrendingUp,
  TrendingDown,
  Wallet,
} from 'lucide-react';

const NAV_ITEMS = [
  { to: '/',             label: 'Dashboard',    icon: LayoutDashboard },
  { to: '/accounts',     label: 'Accounts',     icon: CreditCard },
  { to: '/transactions', label: 'Transactions', icon: ArrowLeftRight },
  { to: '/budget',       label: 'Budget',       icon: PieChart },
  { to: '/goals',        label: 'Goals',        icon: Target },
  { to: '/loans',        label: 'Loans',        icon: Landmark },
];

export default function AppLayout() {
  const {
    accounts,
    notifications,
    isLinkModalOpen,
    editingAccount,
    isNotificationsMuted,
    netWorth,
    totalAssets,
    totalLiabilities,
    handleDismissNotification,
    handleConnectAccounts,
    handleUpdateAccount,
    handleResetToDefaults,
    setIsLinkModalOpen,
    setEditingAccount,
    setIsNotificationsMuted,
  } = useAppContext();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  const currentPage = NAV_ITEMS.find(item =>
    item.to === '/' ? location.pathname === '/' : location.pathname.startsWith(item.to)
  );

  const fmt = (n: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);

  return (
    <div className="flex min-h-screen bg-gray-50 font-sans antialiased">

      {/* ── Sidebar Overlay (mobile) ─────────────────────────── */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ── Sidebar ──────────────────────────────────────────── */}
      <aside className={`
        fixed top-0 left-0 h-full z-40 w-60 flex flex-col
        bg-white border-r border-gray-100 shadow-lg
        transform transition-transform duration-300 ease-in-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0 lg:static lg:shadow-none
      `}>

        {/* Logo */}
        <div className="flex items-center gap-3 px-5 py-5 border-b border-gray-100">
          <div className="w-9 h-9 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-600/25">
            <Activity className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="text-sm font-extrabold text-gray-900 leading-tight">Budget Sync</p>
            <p className="text-[10px] font-mono uppercase tracking-widest text-emerald-600 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Live Feed
            </p>
          </div>
          <button
            className="ml-auto lg:hidden text-gray-400 hover:text-gray-600"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Nav links */}
        <nav className="flex-1 px-3 py-4 space-y-0.5">
          {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) => `
                flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium
                transition-all duration-150 group
                ${isActive
                  ? 'bg-indigo-50 text-indigo-700'
                  : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
                }
              `}
            >
              {({ isActive }) => (
                <>
                  <Icon className={`w-4 h-4 flex-shrink-0 transition-colors ${isActive ? 'text-indigo-600' : 'text-gray-400 group-hover:text-gray-600'}`} />
                  {label}
                  {isActive && (
                    <span className="ml-auto w-1.5 h-1.5 rounded-full bg-indigo-500" />
                  )}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Net Worth box */}
        <div className="mx-3 mb-4 p-4 bg-gradient-to-br from-indigo-600 to-violet-600 rounded-2xl text-white shadow-lg shadow-indigo-500/30">
          <div className="flex items-center gap-2 mb-3">
            <Wallet className="w-3.5 h-3.5 opacity-80" />
            <p className="text-[10px] font-semibold uppercase tracking-widest opacity-80">Net Worth</p>
          </div>
          <p className="text-xl font-black tracking-tight mb-3">{fmt(netWorth)}</p>
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="flex items-center gap-1 opacity-70">
                <TrendingUp className="w-3 h-3" /> Assets
              </span>
              <span className="font-semibold">{fmt(totalAssets)}</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="flex items-center gap-1 opacity-70">
                <TrendingDown className="w-3 h-3" /> Liabilities
              </span>
              <span className="font-semibold">{fmt(totalLiabilities)}</span>
            </div>
          </div>
        </div>

        {/* Bottom actions */}
        <div className="px-3 pb-4 space-y-1 border-t border-gray-100 pt-3">
          <button
            onClick={() => setIsNotificationsMuted(!isNotificationsMuted)}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium transition-all ${
              isNotificationsMuted
                ? 'bg-rose-50 text-rose-600 hover:bg-rose-100'
                : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700'
            }`}
          >
            {isNotificationsMuted ? <BellOff className="w-4 h-4" /> : <Bell className="w-4 h-4" />}
            {isNotificationsMuted ? 'Alerts Muted' : 'Alerts Active'}
          </button>
          <button
            onClick={handleResetToDefaults}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-gray-400 hover:bg-red-50 hover:text-red-600 transition-all"
          >
            <Database className="w-4 h-4" />
            Clear Dashboard
          </button>
        </div>
      </aside>

      {/* ── Main content area ─────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0">

        {/* Top header */}
        <header className="sticky top-0 z-20 bg-white/80 backdrop-blur border-b border-gray-100 px-4 lg:px-6 py-3.5 flex items-center gap-3">
          {/* Mobile hamburger */}
          <button
            className="lg:hidden p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 transition"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Breadcrumb / page title */}
          <div className="flex items-center gap-2">
            {currentPage && <currentPage.icon className="w-4 h-4 text-indigo-500" />}
            <h1 className="text-sm font-bold text-gray-900">
              {currentPage?.label ?? 'Real-Time Budget Sync'}
            </h1>
          </div>

          <span className="text-gray-200 select-none">|</span>
          <span className="text-xs text-gray-400 hidden sm:block">
            {accounts.length} account{accounts.length !== 1 ? 's' : ''} connected
          </span>

          <div className="ml-auto flex items-center gap-2">
            <span className="hidden sm:flex items-center gap-1.5 text-xs text-emerald-600 font-medium bg-emerald-50 px-2.5 py-1 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Secure & Local
            </span>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-4 lg:p-6">
          <Outlet />
        </main>

        {/* Footer */}
        <footer className="bg-white border-t border-gray-100 py-3 px-6 text-xs text-gray-400 flex justify-between items-center">
          <span>Real-Time Budget Sync © 2026. All data is stored locally.</span>
          <span className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Secure Gateway Connected
          </span>
        </footer>
      </div>

      {/* Modals & Toasts — always mounted */}
      <LinkBankModal
        isOpen={isLinkModalOpen}
        onClose={() => { setIsLinkModalOpen(false); setEditingAccount(null); }}
        onConnectAccounts={handleConnectAccounts}
        onUpdateAccount={handleUpdateAccount}
        editingAccount={editingAccount}
        existingAccountIds={accounts.map(a => a.id)}
      />
      <SyncNotification
        notifications={notifications}
        onDismiss={handleDismissNotification}
      />
    </div>
  );
}
