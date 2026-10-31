import React from 'react';
import { PageHeader } from '@/components/common/PageHeader';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import {
  TrendingUp,
  Users,
  Repeat,
  CreditCard,
  FileText,
  AlertCircle,
  Activity,
  Layers,
} from 'lucide-react';

export const DashboardPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard Overview"
        description="Welcome to Brightloop — centralized subscription management and recurring billing platform."
        action={
          <Badge variant="info" className="px-3 py-1 text-xs">
            Admin View
          </Badge>
        }
      />

      {/* Summary Metrics Placeholders */}
      <div>
        <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">
          Key Performance Metrics
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-5 flex items-start justify-between">
              <div>
                <p className="text-xs font-medium text-slate-500">Active Subscriptions</p>
                <div className="mt-2 h-7 w-20 bg-slate-100 rounded animate-pulse" />
                <p className="mt-2 text-xs text-slate-400">Awaiting backend integration</p>
              </div>
              <div className="p-2.5 rounded-lg bg-indigo-50 text-indigo-600">
                <Repeat className="w-5 h-5" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-5 flex items-start justify-between">
              <div>
                <p className="text-xs font-medium text-slate-500">Monthly Recurring Revenue</p>
                <div className="mt-2 h-7 w-24 bg-slate-100 rounded animate-pulse" />
                <p className="mt-2 text-xs text-slate-400">Calculated on backend</p>
              </div>
              <div className="p-2.5 rounded-lg bg-emerald-50 text-emerald-600">
                <TrendingUp className="w-5 h-5" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-5 flex items-start justify-between">
              <div>
                <p className="text-xs font-medium text-slate-500">Total Invoiced Amount</p>
                <div className="mt-2 h-7 w-24 bg-slate-100 rounded animate-pulse" />
                <p className="mt-2 text-xs text-slate-400">Aggregated from invoices</p>
              </div>
              <div className="p-2.5 rounded-lg bg-blue-50 text-blue-600">
                <FileText className="w-5 h-5" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-5 flex items-start justify-between">
              <div>
                <p className="text-xs font-medium text-slate-500">Outstanding Balance</p>
                <div className="mt-2 h-7 w-20 bg-slate-100 rounded animate-pulse" />
                <p className="mt-2 text-xs text-slate-400">Pending collections</p>
              </div>
              <div className="p-2.5 rounded-lg bg-amber-50 text-amber-600">
                <CreditCard className="w-5 h-5" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Main Sections Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Invoices Section */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Recent Billing & Invoices</CardTitle>
                <CardDescription>
                  Invoices generated during the current billing period
                </CardDescription>
              </div>
              <Badge variant="default">Module 4</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="py-12 text-center">
              <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
                <FileText className="w-6 h-6" />
              </div>
              <p className="text-sm font-medium text-slate-700">No invoice records loaded</p>
              <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                Invoice data will be populated from the backend billing run and invoice endpoints.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* System Activity / Health */}
        <Card>
          <CardHeader>
            <CardTitle>System Modules</CardTitle>
            <CardDescription>MVP workflow components</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              { name: 'Auth & Authorization', status: 'Ready for integration', icon: Users },
              { name: 'Products & Plans', status: 'Catalog ready', icon: Layers },
              { name: 'Subscriptions', status: 'Lifecycle ready', icon: Repeat },
              { name: 'Invoicing & Payments', status: 'Billing ready', icon: CreditCard },
            ].map((mod) => {
              const Icon = mod.icon;
              return (
                <div
                  key={mod.name}
                  className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-100"
                >
                  <div className="flex items-center gap-3">
                    <Icon className="w-4 h-4 text-indigo-600" />
                    <div>
                      <p className="text-xs font-semibold text-slate-800">{mod.name}</p>
                      <p className="text-[11px] text-slate-400">{mod.status}</p>
                    </div>
                  </div>
                  <Activity className="w-3.5 h-3.5 text-slate-300" />
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>

      {/* Workflow notice */}
      <div className="p-4 rounded-xl bg-indigo-50/60 border border-indigo-100 flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
        <div className="text-xs text-indigo-950">
          <span className="font-semibold">Core Hackathon Workflow: </span>
          Customer &rarr; Subscription &rarr; Billing Run &rarr; Invoice Generation &rarr; Payment Recording &rarr; Outstanding Balance Update.
        </div>
      </div>
    </div>
  );
};

