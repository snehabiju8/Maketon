import React from 'react';
import { AlertTriangle, CreditCard, FileText, Repeat, Wallet } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/Card';
import { formatCurrency } from '@/lib/format';
import type { DashboardSummary } from '../types';

interface SummaryCardsProps {
  summary: DashboardSummary | null;
  loading: boolean;
}

interface Metric {
  label: string;
  value: (s: DashboardSummary) => string;
  hint: (s: DashboardSummary) => string;
  icon: React.ComponentType<{ className?: string }>;
  tone: string;
}

const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? '' : 's'}`;

const METRICS: Metric[] = [
  {
    label: 'Active Subscriptions',
    value: (s) => String(s.activeSubscriptions),
    hint: () => 'Currently billable',
    icon: Repeat,
    tone: 'bg-indigo-50 text-indigo-600',
  },
  {
    label: 'Invoiced',
    value: (s) => formatCurrency(s.invoiced.amount),
    hint: (s) => `${plural(s.invoiced.count, 'invoice')} issued`,
    icon: FileText,
    tone: 'bg-blue-50 text-blue-600',
  },
  {
    label: 'Payments Received',
    value: (s) => formatCurrency(s.paymentsReceived.amount),
    hint: (s) => plural(s.paymentsReceived.count, 'payment'),
    icon: Wallet,
    tone: 'bg-emerald-50 text-emerald-600',
  },
  {
    label: 'Outstanding',
    value: (s) => formatCurrency(s.outstanding.amount),
    hint: (s) => `${plural(s.outstanding.count, 'confirmed invoice')} unpaid`,
    icon: CreditCard,
    tone: 'bg-amber-50 text-amber-600',
  },
  {
    label: 'Overdue',
    value: (s) => formatCurrency(s.overdue.amount),
    hint: (s) => `${plural(s.overdue.count, 'invoice')} past due`,
    icon: AlertTriangle,
    tone: 'bg-rose-50 text-rose-600',
  },
];

export const SummaryCards: React.FC<SummaryCardsProps> = ({ summary, loading }) => (
  <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4">
    {METRICS.map((metric) => {
      const Icon = metric.icon;
      return (
        <Card key={metric.label}>
          <CardContent className="p-5 flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-xs font-medium text-slate-500">{metric.label}</p>
              {summary ? (
                <>
                  <p className="mt-2 text-xl font-bold text-slate-900 tabular-nums truncate">{metric.value(summary)}</p>
                  <p className="mt-1 text-xs text-slate-400">{metric.hint(summary)}</p>
                </>
              ) : (
                <div className={`mt-2 h-7 w-24 bg-slate-100 rounded ${loading ? 'animate-pulse' : ''}`} />
              )}
            </div>
            <div className={`p-2.5 rounded-lg shrink-0 ${metric.tone}`}>
              <Icon className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>
      );
    })}
  </div>
);
