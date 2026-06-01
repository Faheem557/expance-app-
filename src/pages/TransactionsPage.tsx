/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { useAppContext } from '../context/AppContext';
import TransactionsList from '../components/TransactionsList';
import NotificationReader from '../components/NotificationReader';
import RecurringPredictor from '../components/RecurringPredictor';
import { Transaction } from '../types';

export default function TransactionsPage() {
  const {
    transactions,
    accounts,
    budgets,
    categories,
    addTransactionPayload,
    handleDeleteTransaction,
    handleClearAllTransactions,
  } = useAppContext();

  const makeId = (prefix: string) =>
    `${prefix}-${Math.random().toString(36).substr(2, 9)}`;

  return (
    <div className="space-y-6">
      {/* SMS / Notification Reader */}
      <NotificationReader
        accounts={accounts}
        budgets={budgets}
        onAddTransaction={(txData) => {
          addTransactionPayload({
            ...txData,
            id: makeId('tx-parsed'),
            isNew: true,
          } as Transaction);
        }}
      />

      {/* Recurring Predictor */}
      <RecurringPredictor
        transactions={transactions}
        onTriggerReceipt={(newTx) => {
          addTransactionPayload({
            ...newTx,
            id: makeId('tx-recur-sim'),
            isNew: true,
          } as Transaction);
        }}
      />

      {/* Full Ledger */}
      <TransactionsList
        transactions={transactions}
        accounts={accounts}
        onAddTransaction={(txData) => {
          addTransactionPayload({
            ...txData,
            id: makeId('tx-man'),
            isNew: true,
          } as Transaction);
        }}
        onDeleteTransaction={handleDeleteTransaction}
        onClearAllTransactions={handleClearAllTransactions}
        categories={categories}
      />
    </div>
  );
}
