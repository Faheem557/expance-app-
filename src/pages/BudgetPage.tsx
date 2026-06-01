/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { useAppContext } from '../context/AppContext';
import BudgetSummary from '../components/BudgetSummary';

export default function BudgetPage() {
  const {
    budgets,
    handleUpdateBudgetLimit,
    handleCreateCategory,
    handleResetBudgets,
  } = useAppContext();

  return (
    <div className="max-w-2xl mx-auto">
      <BudgetSummary
        budgets={budgets}
        onUpdateBudgetLimit={handleUpdateBudgetLimit}
        onResetBudgets={handleResetBudgets}
        onCreateCategory={handleCreateCategory}
      />
    </div>
  );
}
