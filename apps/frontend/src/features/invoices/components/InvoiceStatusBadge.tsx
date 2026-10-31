import React from 'react';
import { Badge } from '@/components/ui/Badge';
import type { InvoiceStatus } from '../types';

const VARIANTS = {
  DRAFT: 'default',
  CONFIRMED: 'info',
  PAID: 'success',
  CANCELLED: 'danger',
} as const;

const LABELS: Record<InvoiceStatus, string> = {
  DRAFT: 'Draft',
  CONFIRMED: 'Confirmed',
  PAID: 'Paid',
  CANCELLED: 'Cancelled',
};

export const InvoiceStatusBadge: React.FC<{ status: InvoiceStatus }> = ({ status }) => (
  <Badge variant={VARIANTS[status]}>{LABELS[status]}</Badge>
);

export const invoiceStatusLabel = (status: InvoiceStatus): string => LABELS[status];
