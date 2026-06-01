/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { useAppContext } from '../context/AppContext';
import AccountsGrid from '../components/AccountsGrid';

export default function AccountsPage() {
  const {
    accounts,
    activeSyncingId,
    handleSyncAccount,
    handleUnlinkAccount,
    handleConnectAccounts,
    handleUpdateAccount,
    handleAccountTransfer,
    setIsLinkModalOpen,
    setEditingAccount,
  } = useAppContext();

  return (
    <div className="space-y-4">
      <AccountsGrid
        accounts={accounts}
        onSyncAccount={handleSyncAccount}
        onUnlinkAccount={handleUnlinkAccount}
        onOpenLinkModal={() => {
          setEditingAccount(null);
          setIsLinkModalOpen(true);
        }}
        onEditAccount={(acc) => {
          setEditingAccount(acc);
          setIsLinkModalOpen(true);
        }}
        onTransfer={handleAccountTransfer}
        activeSyncingId={activeSyncingId}
      />
    </div>
  );
}
