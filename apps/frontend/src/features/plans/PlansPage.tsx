import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { PageHeader } from '@/components/common/PageHeader';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Plan } from './types';
import { plansApi, getErrorMessage, formatBillingCycle } from './plans.api';
import { PlanModal } from './components/PlanModal';
import {
  Layers,
  Plus,
  Search,
  RefreshCw,
  Edit2,
  Calendar,
  AlertCircle,
  Hash,
  CheckCircle2,
  XCircle,
  Clock,
} from 'lucide-react';

export const PlansPage: React.FC = () => {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [planToEdit, setPlanToEdit] = useState<Plan | null>(null);

  // Fetch plans
  const fetchPlans = useCallback(async () => {
    try {
      setIsLoading(true);
      setErrorMessage(null);
      const data = await plansApi.listPlans(
        statusFilter !== 'ALL' ? statusFilter : undefined,
      );
      setPlans(data);
    } catch (err) {
      setErrorMessage(getErrorMessage(err, 'Failed to retrieve subscription plans.'));
    } finally {
      setIsLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    fetchPlans();
  }, [fetchPlans]);

  // Client-side search filtering
  const filteredPlans = useMemo(() => {
    return plans.filter((plan) => {
      const matchesSearch = plan.name
        .toLowerCase()
        .includes(searchQuery.toLowerCase());

      const matchesStatus =
        statusFilter === 'ALL' || plan.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [plans, searchQuery, statusFilter]);

  // Modal Handlers
  const handleOpenCreatePlan = () => {
    setPlanToEdit(null);
    setIsModalOpen(true);
  };

  const handleOpenEditPlan = (plan: Plan) => {
    setPlanToEdit(plan);
    setIsModalOpen(true);
  };

  const handlePlanSaved = (savedPlan: Plan, isNew: boolean) => {
    if (isNew) {
      setPlans((prev) => [savedPlan, ...prev]);
    } else {
      setPlans((prev) =>
        prev.map((p) => (p.id === savedPlan.id ? savedPlan : p)),
      );
    }
  };

  const handleTogglePlanStatus = async (plan: Plan) => {
    const nextStatus = plan.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    try {
      const updated = await plansApi.updatePlan(plan.id, {
        status: nextStatus,
      });
      setPlans((prev) =>
        prev.map((p) => (p.id === updated.id ? updated : p)),
      );
    } catch (err) {
      setErrorMessage(
        getErrorMessage(err, `Failed to update status for plan "${plan.name}".`),
      );
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        title="Subscription Plans"
        description="Define and organize recurring billing tiers, intervals (monthly/yearly), and minimum subscription quantities."
        action={
          <Button variant="primary" size="md" onClick={handleOpenCreatePlan}>
            <Plus className="w-4 h-4 mr-2" />
            Add Plan
          </Button>
        }
      />

      {/* Global Error Banner */}
      {errorMessage && (
        <div className="flex items-center justify-between p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-sm">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 shrink-0 text-rose-600" />
            <span>{errorMessage}</span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={fetchPlans}
            className="text-rose-700 hover:bg-rose-100"
          >
            Retry
          </Button>
        </div>
      )}

      {/* Filter and Search Bar */}
      <Card>
        <CardContent className="p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          {/* Search Input */}
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search plans by name..."
              className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>

          {/* Status Tabs and Refresh */}
          <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
            <div className="inline-flex p-1 bg-slate-100 rounded-lg text-xs font-medium text-slate-600">
              {(['ALL', 'ACTIVE', 'INACTIVE'] as const).map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setStatusFilter(tab)}
                  className={`px-3 py-1.5 rounded-md transition-colors ${
                    statusFilter === tab
                      ? 'bg-white text-slate-900 shadow-sm font-semibold'
                      : 'hover:text-slate-900'
                  }`}
                >
                  {tab === 'ALL' ? 'All' : tab === 'ACTIVE' ? 'Active' : 'Inactive'}
                </button>
              ))}
            </div>

            <Button
              variant="outline"
              size="md"
              onClick={fetchPlans}
              disabled={isLoading}
              title="Refresh plan list"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Content Area */}
      {isLoading ? (
        /* Loading Skeleton */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6 space-y-4">
                <div className="h-5 bg-slate-200 rounded w-1/2" />
                <div className="h-10 bg-slate-100 rounded w-full" />
                <div className="h-4 bg-slate-100 rounded w-3/4" />
                <div className="pt-4 border-t border-slate-100 flex justify-between">
                  <div className="h-8 bg-slate-200 rounded w-20" />
                  <div className="h-8 bg-slate-200 rounded w-20" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filteredPlans.length === 0 ? (
        /* Empty State */
        <Card className="border-dashed">
          <CardContent className="p-12 text-center">
            <Layers className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-base font-semibold text-slate-800">No plans found</h3>
            <p className="text-sm text-slate-500 max-w-sm mx-auto mt-1 mb-6">
              {searchQuery || statusFilter !== 'ALL'
                ? 'No subscription plans match your search and filter criteria. Try adjusting your filters.'
                : 'Get started by creating your first recurring billing tier with configured intervals and seat requirements.'}
            </p>
            {searchQuery || statusFilter !== 'ALL' ? (
              <Button
                variant="outline"
                size="md"
                onClick={() => {
                  setSearchQuery('');
                  setStatusFilter('ALL');
                }}
              >
                Clear Filters
              </Button>
            ) : (
              <Button variant="primary" size="md" onClick={handleOpenCreatePlan}>
                <Plus className="w-4 h-4 mr-2" />
                Add First Plan
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        /* Plans Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPlans.map((plan) => {
            const isActive = plan.status === 'ACTIVE';

            return (
              <Card
                key={plan.id}
                className="flex flex-col justify-between hover:border-slate-300 transition-all hover:shadow-md"
              >
                <CardContent className="p-6 space-y-5">
                  {/* Top Header */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <h3 className="text-base font-semibold text-slate-900 group-hover:text-indigo-600 transition-colors">
                        {plan.name}
                      </h3>
                      <div className="flex items-center gap-1.5 text-xs text-slate-400">
                        <Clock className="w-3.5 h-3.5" />
                        <span>Created {new Date(plan.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <Badge variant={isActive ? 'success' : 'default'}>
                      {isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>

                  {/* Cadence Highlight Box */}
                  <div className="p-3.5 bg-slate-50 border border-slate-100 rounded-xl space-y-2">
                    <div className="flex items-center gap-2 text-indigo-700">
                      <Calendar className="w-4 h-4 shrink-0 text-indigo-500" />
                      <span className="text-sm font-semibold">
                        {formatBillingCycle(plan.billingInterval, plan.intervalCount)}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500">
                      Recurring billing cadence ({plan.intervalCount} &times; {plan.billingInterval.toLowerCase()})
                    </p>
                  </div>

                  {/* Plan Specs Breakdown */}
                  <div className="space-y-2 text-xs">
                    <div className="flex items-center justify-between text-slate-600">
                      <span className="flex items-center gap-1.5 text-slate-500">
                        <Hash className="w-3.5 h-3.5" />
                        Min. Quantity Required
                      </span>
                      <span className="font-semibold text-slate-900 bg-slate-100 px-2 py-0.5 rounded">
                        {plan.minimumQuantity} {plan.minimumQuantity === 1 ? 'unit' : 'units'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-slate-600">
                      <span className="text-slate-500">Interval Unit</span>
                      <span className="font-medium text-slate-800 uppercase">
                        {plan.billingInterval}
                      </span>
                    </div>
                  </div>

                  {/* Actions Footer */}
                  <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleOpenEditPlan(plan)}
                    >
                      <Edit2 className="w-3.5 h-3.5 mr-1.5" />
                      Edit
                    </Button>

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleTogglePlanStatus(plan)}
                      className={
                        isActive
                          ? 'text-rose-600 hover:text-rose-700 hover:bg-rose-50'
                          : 'text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50'
                      }
                    >
                      {isActive ? (
                        <>
                          <XCircle className="w-3.5 h-3.5 mr-1 text-rose-500" />
                          Deactivate
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5 mr-1 text-emerald-500" />
                          Activate
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Plan Create/Edit Modal */}
      <PlanModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        planToEdit={planToEdit}
        onSuccess={handlePlanSaved}
      />
    </div>
  );
};
