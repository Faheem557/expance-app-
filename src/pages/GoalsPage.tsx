/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { useAppContext } from '../context/AppContext';
import GoalsTracker from '../components/GoalsTracker';

export default function GoalsPage() {
  const {
    accounts,
    goals,
    handleAddGoal,
    handleDeleteGoal,
  } = useAppContext();

  return (
    <div>
      <GoalsTracker
        accounts={accounts}
        goals={goals}
        onAddGoal={handleAddGoal}
        onDeleteGoal={handleDeleteGoal}
      />
    </div>
  );
}
