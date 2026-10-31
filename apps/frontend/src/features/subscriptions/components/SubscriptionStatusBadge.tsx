import React from 'react';
import { SubscriptionStatus } from '../types';

interface SubscriptionStatusBadgeProps {
  status: SubscriptionStatus;
  className?: string;
}

export const SubscriptionStatusBadge: React.FC<SubscriptionStatusBadgeProps> = ({
  status,
  className = '',
}) => {
  switch (status) {
    case 'ACTIVE':
      return (
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 ${className}`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          Active
        </span>
      );
    case 'CONFIRMED':
      return (
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200 ${className}`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
          Confirmed
        </span>
      );
    case 'DRAFT':
      return (
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200 ${className}`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
          Draft
        </span>
      );
    case 'CLOSED':
      return (
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-200 ${className}`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
          Closed
        </span>
      );
    default:
      return (
        <span
          className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 ${className}`}
        >
          {status}
        </span>
      );
  }
};

