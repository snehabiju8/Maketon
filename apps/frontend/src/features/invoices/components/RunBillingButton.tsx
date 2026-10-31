import React, { useState } from 'react';
import { PlayCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { getApiErrorMessage } from '@/lib/apiError';
import { runBilling } from '../api/invoices.api';
import type { BillingRunSummary } from '../types';

interface RunBillingButtonProps {
  onCompleted: (summary: BillingRunSummary) => void;
  onError: (message: string) => void;
}

/** Admin-only action; the backend rejects other roles with 403. */
export const RunBillingButton: React.FC<RunBillingButtonProps> = ({ onCompleted, onError }) => {
  const [running, setRunning] = useState(false);

  const handleClick = async () => {
    setRunning(true);
    try {
      onCompleted(await runBilling());
    } catch (err) {
      onError(getApiErrorMessage(err));
    } finally {
      setRunning(false);
    }
  };

  return (
    <Button onClick={handleClick} disabled={running}>
      <PlayCircle className="w-4 h-4 mr-2" />
      {running ? 'Running billing…' : 'Run Billing'}
    </Button>
  );
};

export const describeBillingRun = (summary: BillingRunSummary): string => {
  if (summary.totalProcessed === 0) return 'Billing run complete. No subscriptions were due.';
  const parts = [`${summary.created} invoice${summary.created === 1 ? '' : 's'} created`];
  if (summary.skipped) parts.push(`${summary.skipped} already invoiced`);
  if (summary.failed) parts.push(`${summary.failed} failed`);
  return `Billing run complete: ${parts.join(', ')} across ${summary.subscriptionsProcessed} subscription${
    summary.subscriptionsProcessed === 1 ? '' : 's'
  }.`;
};
