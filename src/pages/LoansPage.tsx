/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { useAppContext } from '../context/AppContext';
import LoanTracker from '../components/LoanTracker';

export default function LoansPage() {
  const {
    loans,
    accounts,
    handleAddLoan,
    handleUpdateLoanStatus,
    handleDeleteLoan,
    handleAddLoanPayment,
  } = useAppContext();

  return (
    <div>
      <LoanTracker
        loans={loans}
        accounts={accounts}
        onAddLoan={handleAddLoan}
        onUpdateLoanStatus={handleUpdateLoanStatus}
        onDeleteLoan={handleDeleteLoan}
        onAddPayment={handleAddLoanPayment}
      />
    </div>
  );
}
