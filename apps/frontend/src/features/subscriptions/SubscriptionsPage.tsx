import React, { useState, useEffect, useCallback } from 'react';
import { PageHeader } from '@/components/common/PageHeader';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Repeat, CheckCircle2, FileEdit, DollarSign } from 'lucide-react';
import { subscriptionsApi } from './api/subscriptions.api';
import {
  Subscription,
  CatalogPreview,
  CreateSubscriptionPayload,
} from './types';
import { SubscriptionFilterBar } from './components/SubscriptionFilterBar';
import { SubscriptionListTable } from './components/SubscriptionListTable';
import { CreateSubscriptionModal } from './components/CreateSubscriptionModal';
import { SubscriptionDetailsModal } from './components/SubscriptionDetailsModal';

export const SubscriptionsPage: React.FC = () => {
  // State
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Modals
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedSubscription, setSelectedSubscription] = useState<Subscription | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  // Catalog preview for creation
  const [catalog, setCatalog] = useState<CatalogPreview | null>(null);
  const [loadingCatalog, setLoadingCatalog] = useState(false);

  // Fetch subscriptions
  const loadSubscriptions = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await subscriptionsApi.list({
        search: search || undefined,
        status: statusFilter || undefined,
      });
      setSubscriptions(res.subscriptions);
    } catch (err: any) {
      setError(
        err.response?.data?.message || err.message || 'Failed to load subscriptions',
      );
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter]);

  // Load catalog preview
  const loadCatalog = async () => {
    try {
      setLoadingCatalog(true);
      const res = await subscriptionsApi.getCatalogPreview();
      setCatalog(res);
    } catch (err) {
      console.error('Failed to load catalog preview:', err);
    } finally {
      setLoadingCatalog(false);
    }
  };

  useEffect(() => {
    loadSubscriptions();
  }, [loadSubscriptions]);

  useEffect(() => {
    loadCatalog();
  }, []);

  // Creation Handler
  const handleCreateSubscription = async (payload: CreateSubscriptionPayload) => {
    const created = await subscriptionsApi.create(payload);
    await loadSubscriptions();
    setSelectedSubscription(created);
    setIsDetailsOpen(true);
  };

  // State Transition Handlers
  const handleConfirmSubscription = async (id: string) => {
    const updated = await subscriptionsApi.confirm(id);
    setSelectedSubscription(updated);
    await loadSubscriptions();
  };

  const handleActivateSubscription = async (id: string) => {
    const updated = await subscriptionsApi.activate(id);
    setSelectedSubscription(updated);
    await loadSubscriptions();
  };

  const handleCloseSubscription = async (id: string, reason?: string) => {
    const updated = await subscriptionsApi.close(id, reason);
    setSelectedSubscription(updated);
    await loadSubscriptions();
  };

  // Summary Metrics
  const totalCount = subscriptions.length;
  const activeCount = subscriptions.filter((s) => s.status === 'ACTIVE').length;
  const draftCount = subscriptions.filter((s) => s.status === 'DRAFT').length;
  const totalRecurring = subscriptions
    .filter((s) => s.status === 'ACTIVE')
    .reduce((acc, s) => acc + Number(s.pricing.recurringTotal), 0);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        title="Subscription Management & Pricing"
        description="Create recurring subscriptions, snapshot agreed pricing, and manage lifecycle transitions."
        action={
          <Badge variant="info" className="px-3 py-1 text-xs">
            Member 3 Module
          </Badge>
        }
      />

      {/* KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-white">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-400">Total Subscriptions</p>
              <p className="text-xl font-bold text-slate-900 mt-1">{totalCount}</p>
            </div>
            <div className="p-2.5 rounded-xl bg-indigo-50 text-indigo-600">
              <Repeat className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-400">Active (Billable)</p>
              <p className="text-xl font-bold text-emerald-600 mt-1">{activeCount}</p>
            </div>
            <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-400">Draft & Pending</p>
              <p className="text-xl font-bold text-amber-600 mt-1">{draftCount}</p>
            </div>
            <div className="p-2.5 rounded-xl bg-amber-50 text-amber-600">
              <FileEdit className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-400">Active Recurring Value</p>
              <p className="text-xl font-bold text-slate-900 mt-1">
                ₹{totalRecurring.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </p>
            </div>
            <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600">
              <DollarSign className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter and Search Bar */}
      <SubscriptionFilterBar
        search={search}
        onSearchChange={setSearch}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        onOpenCreate={() => setIsCreateOpen(true)}
      />

      {/* Subscription Table */}
      <SubscriptionListTable
        subscriptions={subscriptions}
        loading={loading}
        error={error}
        onRetry={loadSubscriptions}
        onSelectSubscription={(sub) => {
          setSelectedSubscription(sub);
          setIsDetailsOpen(true);
        }}
        onOpenCreate={() => setIsCreateOpen(true)}
      />

      {/* Create Subscription Modal */}
      <CreateSubscriptionModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSubmit={handleCreateSubscription}
        catalog={catalog}
        loadingCatalog={loadingCatalog}
      />

      {/* Subscription Details Modal */}
      <SubscriptionDetailsModal
        subscription={selectedSubscription}
        isOpen={isDetailsOpen}
        onClose={() => {
          setIsDetailsOpen(false);
          setSelectedSubscription(null);
        }}
        onConfirm={handleConfirmSubscription}
        onActivate={handleActivateSubscription}
        onCloseSubscription={handleCloseSubscription}
      />
    </div>
  );
};

export default SubscriptionsPage;
