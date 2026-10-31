import React from 'react';
import { AlertCircle, CheckCircle2 } from 'lucide-react';

interface AlertProps {
  variant?: 'error' | 'success';
  children: React.ReactNode;
}

export const Alert: React.FC<AlertProps> = ({ variant = 'error', children }) => {
  const Icon = variant === 'error' ? AlertCircle : CheckCircle2;
  const styles =
    variant === 'error'
      ? 'bg-rose-50 border-rose-200 text-rose-800'
      : 'bg-emerald-50 border-emerald-200 text-emerald-800';
  return (
    <div role={variant === 'error' ? 'alert' : 'status'} className={`flex items-start gap-2 p-3 rounded-lg border text-sm ${styles}`}>
      <Icon className="w-4 h-4 shrink-0 mt-0.5" />
      <div>{children}</div>
    </div>
  );
};
