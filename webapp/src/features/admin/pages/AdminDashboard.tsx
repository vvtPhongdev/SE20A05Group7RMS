import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { apiRequest } from '../../../lib/api';
import {
  AdminCard,
  AdminDashboardPage,
  AdminInlineAlert,
  AdminLoadingState,
  AdminPageHeader,
  AdminSearchInput,
} from '../components';
const Icon = ({ name, className = 'h-5 w-5' }: { name: string; className?: string }) => {
  const paths: Record<string, React.ReactNode> = {
    briefcase: (
      <path d="M10 6V5a2 2 0 0 1 2-2h0a2 2 0 0 1 2 2v1m-9 0h14a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2Zm-2 6h18" />
    ),
    alert: (
      <path d="M12 9v4m0 4h.01M10.3 3.9 2.8 17a2 2 0 0 0 1.7 3h15a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" />
    ),
    calendar: (
      <path d="M7 3v4m10-4v4M4 9h16M6 5h12a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2Z" />
    ),
    trend: <path d="m3 17 6-6 4 4 7-8m0 0h-5m5 0v5" />,
    review: <path d="M9 12l2 2 4-4M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />,
    search: <path d="m21 21-4.35-4.35M10.5 18a7.5 7.5 0 1 1 0-15 7.5 7.5 0 0 1 0 15Z" />,
    bell: <path d="M18 8a6 6 0 0 0-12 0c0 7-3 8-3 8h18s-3-1-3-8Zm-4 11a2 2 0 0 1-4 0" />,
    help: (
      <path d="M9.1 9a3 3 0 1 1 5.8 1c-.7 1.5-2.4 1.7-2.8 3m-.1 4h.01M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
    ),
    clock: <path d="M12 7v5l3.5 2M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />,
  };

  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.8"
      viewBox="0 0 24 24"
    >
      {paths[name]}
    </svg>
  );
};

const DashboardCard = AdminCard;

export const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { token, user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState('');
  const [dashboard, setDashboard] = useState<{
    generatedAt: string;
    kpis: {
      activeRequests: number;
      pendingApproval: number;
      interviewsThisWeek: number;
      positionsFilled: number;
      targetHeadcount: number;
    };
    approvalQueue: Array<{
      id: string;
      position: string;
      department: string;
      priority: string;
      submittedAt: string;
    }>;
    pipeline: Array<{ label: string; value: number }>;
    departmentActivity: Array<{ id: string; label: string; value: number }>;
    recentActivity: Array<{
      id: string;
      requestId: string;
      position: string;
      action: string;
      actor: string;
      toStatus?: string | null;
      createdAt: string;
    }>;
  } | null>(null);

  useEffect(() => {
    const loadDashboard = async () => {
      setLoading(true);
      setApiError('');
      try {
        setDashboard(await apiRequest('/reports/admin-dashboard', token));
      } catch (loadError) {
        setApiError(loadError instanceof Error ? loadError.message : 'Unable to load dashboard');
      } finally {
        setLoading(false);
      }
    };

    void loadDashboard();
  }, [token]);

  const kpis = [
    {
      label: 'Active Requests',
      value: String(dashboard?.kpis.activeRequests ?? 0),
      meta: 'Currently in progress',
      valueClass: 'text-teal-command',
      metaClass: 'text-approved',
      icon: 'briefcase',
    },
    {
      label: 'Pending Your Approval',
      value: String(dashboard?.kpis.pendingApproval ?? 0),
      meta: 'Requiring review',
      valueClass: 'text-revision',
      metaClass: 'text-slate-ink',
      icon: 'alert',
    },
    {
      label: 'Interviews This Week',
      value: String(dashboard?.kpis.interviewsThisWeek ?? 0),
      meta: 'Scheduled this week',
      valueClass: 'text-on-surface',
      metaClass: 'text-slate-ink',
      icon: 'calendar',
    },
  ];

  const approvalQueue = (dashboard?.approvalQueue ?? []).map((request) => ({
    id: `RMS-${request.id.slice(0, 8).toUpperCase()}`,
    position: request.position,
    department: request.department,
    priority: request.priority,
    submitted: new Date(request.submittedAt).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
    }),
    tone:
      request.priority.toUpperCase() === 'HIGH' || request.priority.toUpperCase() === 'CRITICAL'
        ? 'bg-rejected/10 text-rejected'
        : 'bg-pending/10 text-pending',
  }));

  const urgentApprovalCount = approvalQueue.filter(
    (request) =>
      request.priority.toUpperCase() === 'HIGH' || request.priority.toUpperCase() === 'CRITICAL',
  ).length;
  const standardApprovalCount = approvalQueue.length - urgentApprovalCount;
  const pendingApprovalCount = dashboard?.kpis.pendingApproval ?? 0;
  const oldestApprovalDate = (dashboard?.approvalQueue ?? []).reduce<string | null>(
    (oldest, request) =>
      !oldest || new Date(request.submittedAt).getTime() < new Date(oldest).getTime()
        ? request.submittedAt
        : oldest,
    null,
  );
  const oldestApprovalAge = oldestApprovalDate
    ? Math.max(
        0,
        Math.floor((Date.now() - new Date(oldestApprovalDate).getTime()) / (1000 * 60 * 60 * 24)),
      )
    : 0;
  const recentQueueTotal = Math.max(1, approvalQueue.length);

  const maxPipeline = Math.max(1, ...(dashboard?.pipeline ?? []).map((item) => item.value));
  const pipelineStages = (dashboard?.pipeline ?? []).map((stage, index) => ({
    ...stage,
    width: `${Math.round((stage.value / maxPipeline) * 100)}%`,
    tone: `bg-teal-command/${Math.min(100, 20 + index * 20)}`,
  }));

  const maxDepartment = Math.max(
    1,
    ...(dashboard?.departmentActivity ?? []).map((item) => item.value),
  );
  const departmentActivity = (dashboard?.departmentActivity ?? []).map((department, index) => ({
    ...department,
    width: `${Math.round((department.value / maxDepartment) * 100)}%`,
    tone: index === 0 ? 'bg-teal-command' : 'bg-teal-command/60',
  }));

  const activityFeed = (dashboard?.recentActivity ?? []).map((event) => ({
    text: `${event.action.replace(/_/g, ' ').toLowerCase()} by ${event.actor}`,
    subject: `RMS-${event.requestId.slice(0, 8).toUpperCase()}`,
    time: new Date(event.createdAt).toLocaleString(),
    tone:
      event.toStatus === 'REJECTED'
        ? 'border-rejected'
        : event.toStatus === 'APPROVED'
          ? 'border-approved'
          : 'border-teal-command',
  }));

  const positionsFilled = dashboard?.kpis.positionsFilled ?? 0;
  const targetHeadcount = dashboard?.kpis.targetHeadcount ?? 0;
  const fillPercentage =
    targetHeadcount > 0 ? Math.min(100, Math.round((positionsFilled / targetHeadcount) * 100)) : 0;

  return (
    <AdminDashboardPage>
      <section className="flex flex-col gap-4 border-b border-border-warm pb-5 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-xs font-semibold uppercase tracking-[0.18em] text-on-surface-variant">
            Director Portal
          </span>
          <span className="hidden h-4 w-px bg-outline-variant sm:block" />
          <span className="text-lg font-semibold tracking-tight text-on-surface">
            Admin Dashboard - Overview Home
          </span>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <AdminSearchInput
            className="sm:w-[240px]"
            label="Quick Search"
            onChange={() => undefined}
            placeholder="Quick Search..."
            value=""
          />
          <div className="flex items-center gap-2">
            <button
              aria-label="Notifications"
              className="relative rounded-lg p-2 text-on-surface-variant transition hover:bg-surface-container hover:text-teal-command active:scale-[0.98]"
              type="button"
            >
              <Icon name="bell" />
              <span className="absolute right-2 top-2 h-2 w-2 rounded-full border-2 border-workflow-ivory bg-rejected" />
            </button>
            <button
              aria-label="Help"
              className="rounded-lg p-2 text-on-surface-variant transition hover:bg-surface-container hover:text-teal-command active:scale-[0.98]"
              type="button"
            >
              <Icon name="help" />
            </button>
          </div>
        </div>
      </section>

      {apiError ? <AdminInlineAlert>{apiError}</AdminInlineAlert> : null}
      {loading ? <AdminLoadingState label="Loading dashboard..." /> : null}

      <AdminPageHeader
        eyebrow="Director Portal"
        title="Director Dashboard - Director"
        description={`Welcome, ${user?.displayName ?? 'Admin'}`}
        actions={
          <div className="w-fit rounded-lg bg-surface-container px-3 py-1.5 font-mono text-sm text-slate-ink">
            {new Date(dashboard?.generatedAt ?? Date.now()).toLocaleDateString(undefined, {
              month: 'long',
              day: 'numeric',
              year: 'numeric',
            })}
          </div>
        }
      />

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
        {kpis.map((kpi, index) => (
          <DashboardCard
            className="transition duration-200 hover:-translate-y-[2px]"
            key={kpi.label}
          >
            <div className="flex items-start justify-between gap-4">
              <span className="text-sm font-medium text-on-surface-variant">{kpi.label}</span>
              <Icon
                className={`h-5 w-5 ${index === 1 ? 'text-rejected' : 'text-outline'}`}
                name={kpi.icon}
              />
            </div>
            <div className="mt-5">
              <span className={`text-[32px] font-bold leading-none ${kpi.valueClass}`}>
                {kpi.value}
              </span>
              <p className={`mt-2 text-xs font-medium ${kpi.metaClass}`}>{kpi.meta}</p>
            </div>
          </DashboardCard>
        ))}

        <DashboardCard className="flex items-center justify-between gap-4 transition duration-200 hover:-translate-y-[2px]">
          <div>
            <span className="text-sm font-medium text-on-surface-variant">
              Positions Filled (YTD)
            </span>
            <div className="mt-5 flex items-baseline gap-1">
              <span className="text-[30px] font-bold leading-none text-on-surface">
                {positionsFilled}
              </span>
              <span className="text-sm text-outline">/ {targetHeadcount}</span>
            </div>
          </div>
          <div className="relative h-16 w-16">
            <svg className="h-full w-full -rotate-90" viewBox="0 0 64 64">
              <circle
                className="text-surface-container-high"
                cx="32"
                cy="32"
                fill="transparent"
                r="25"
                stroke="currentColor"
                strokeWidth="7"
              />
              <circle
                className="text-teal-command"
                cx="32"
                cy="32"
                fill="transparent"
                r="25"
                stroke="currentColor"
                strokeDasharray="157"
                strokeDashoffset={157 - (157 * fillPercentage) / 100}
                strokeLinecap="round"
                strokeWidth="7"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center text-xs font-semibold text-on-surface">
              {fillPercentage}%
            </div>
          </div>
        </DashboardCard>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-10">
        <DashboardCard className="xl:col-span-6">
          <div className="mb-5 flex items-center justify-between gap-4">
            <h2 className="text-xl font-semibold text-on-surface">Recent Approval Queue</h2>
            <button
              className="text-sm font-semibold text-teal-command transition hover:underline active:scale-[0.98]"
              onClick={() => navigate('/admin/approval-queue')}
              type="button"
            >
              View All Queue
            </button>
          </div>
          <div className="mb-5 grid gap-3 sm:grid-cols-3">
            <div className="rounded-lg border border-revision/20 bg-revision/5 p-3">
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-on-surface-variant">
                Awaiting review
              </p>
              <p className="mt-1 font-mono text-2xl font-bold text-revision">
                {pendingApprovalCount}
              </p>
              <p className="mt-1 text-xs text-slate-ink">Total requests pending approval</p>
            </div>
            <div className="rounded-lg border border-rejected/20 bg-rejected/5 p-3">
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-on-surface-variant">
                Urgent in recent queue
              </p>
              <p className="mt-1 font-mono text-2xl font-bold text-rejected">
                {urgentApprovalCount}
              </p>
              <p className="mt-1 text-xs text-slate-ink">High or critical priority requests</p>
            </div>
            <div className="rounded-lg border border-border-warm bg-workflow-ivory p-3">
              <div className="flex items-center gap-1.5 text-on-surface-variant">
                <Icon className="h-3.5 w-3.5" name="clock" />
                <p className="text-xs font-semibold uppercase tracking-[0.12em]">Oldest waiting</p>
              </div>
              <p className="mt-1 font-mono text-2xl font-bold text-on-surface">
                {oldestApprovalDate ? `${oldestApprovalAge}d` : '—'}
              </p>
              <p className="mt-1 text-xs text-slate-ink">
                {oldestApprovalDate
                  ? 'Time since the oldest recent submission'
                  : 'No recent requests'}
              </p>
            </div>
          </div>
          <div className="mb-5 rounded-lg border border-border-warm bg-workflow-ivory px-3 py-2.5">
            <div className="mb-2 flex items-center justify-between gap-3 text-xs">
              <span className="font-semibold text-on-surface">Recent queue priority mix</span>
              <span className="font-mono text-on-surface-variant">
                {approvalQueue.length} shown
              </span>
            </div>
            <div className="flex h-2 overflow-hidden rounded-full bg-surface-container">
              <div
                className="bg-rejected transition-all"
                style={{ width: `${(urgentApprovalCount / recentQueueTotal) * 100}%` }}
              />
              <div
                className="bg-pending transition-all"
                style={{ width: `${(standardApprovalCount / recentQueueTotal) * 100}%` }}
              />
            </div>
            <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-ink">
              <span>
                <span className="mr-1 inline-block h-2 w-2 rounded-full bg-rejected" />
                Urgent: {urgentApprovalCount}
              </span>
              <span>
                <span className="mr-1 inline-block h-2 w-2 rounded-full bg-pending" />
                Standard: {standardApprovalCount}
              </span>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[680px] text-left">
              <thead>
                <tr className="border-b border-border-warm text-sm text-on-surface-variant">
                  <th className="py-3 font-medium">Request ID</th>
                  <th className="py-3 font-medium">Position</th>
                  <th className="py-3 font-medium">Department</th>
                  <th className="py-3 text-center font-medium">Priority</th>
                  <th className="py-3 font-medium">Submitted</th>
                  <th className="py-3 text-right font-medium">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-warm text-sm">
                {approvalQueue.map((request) => (
                  <tr className="transition-colors hover:bg-workflow-ivory/70" key={request.id}>
                    <td className="py-4 font-mono font-medium text-teal-command">{request.id}</td>
                    <td className="py-4 font-medium text-deep-charcoal">{request.position}</td>
                    <td className="py-4 text-slate-ink">{request.department}</td>
                    <td className="py-4 text-center">
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-semibold ${request.tone}`}
                      >
                        {request.priority}
                      </span>
                    </td>
                    <td className="py-4 text-slate-ink">{request.submitted}</td>
                    <td className="py-4 text-right">
                      <button
                        className="font-semibold text-teal-command transition hover:underline active:scale-[0.98]"
                        onClick={() => navigate('/admin/approval-queue')}
                        type="button"
                      >
                        Review
                      </button>
                    </td>
                  </tr>
                ))}
                {approvalQueue.length === 0 ? (
                  <tr>
                    <td className="py-10 text-center text-sm text-slate-ink" colSpan={6}>
                      No recent requests are waiting for approval.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </DashboardCard>

        <DashboardCard className="flex flex-col xl:col-span-4">
          <h2 className="mb-5 text-xl font-semibold text-on-surface">Hiring Pipeline Summary</h2>
          <div className="flex-1 space-y-3">
            {pipelineStages.map((stage) => (
              <div className="grid grid-cols-[84px_1fr_44px] items-center gap-3" key={stage.label}>
                <span className="text-xs font-medium text-on-surface-variant">{stage.label}</span>
                <div className="h-8 overflow-hidden rounded-r bg-teal-command/10">
                  <div className={`h-full ${stage.tone}`} style={{ width: stage.width }} />
                </div>
                <span className="font-mono text-sm text-on-surface">{stage.value}</span>
              </div>
            ))}
          </div>
          <div className="mt-6 flex items-center gap-2 border-t border-border-warm pt-4 text-revision">
            <Icon className="h-5 w-5" name="review" />
            <span className="text-sm font-semibold">
              {dashboard?.kpis.pendingApproval ?? 0} decisions pending your review
            </span>
          </div>
        </DashboardCard>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <DashboardCard>
          <h2 className="mb-5 text-xl font-semibold text-on-surface">Department Activity</h2>
          <div className="space-y-4">
            {departmentActivity.map((department) => (
              <div
                className="grid grid-cols-[92px_1fr_32px] items-center gap-4"
                key={department.label}
              >
                <span className="text-sm font-medium text-on-surface-variant">
                  {department.label}
                </span>
                <div className="h-4 overflow-hidden rounded-full bg-surface-container">
                  <div
                    className={`h-full rounded-full ${department.tone}`}
                    style={{ width: department.width }}
                  />
                </div>
                <span className="font-mono text-sm text-on-surface">{department.value}</span>
              </div>
            ))}
          </div>
        </DashboardCard>

        <DashboardCard>
          <h2 className="mb-5 text-xl font-semibold text-on-surface">Recent Activity</h2>
          <div className="relative space-y-6 before:absolute before:bottom-2 before:left-[7px] before:top-2 before:w-[2px] before:bg-surface-container-high">
            {activityFeed.map((event) => (
              <div className="relative pl-7" key={`${event.text}-${event.time}`}>
                <div
                  className={`absolute left-0 top-1.5 h-4 w-4 rounded-full border-2 bg-clean-surface ${event.tone}`}
                />
                <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
                  <p className="text-sm leading-6 text-deep-charcoal">
                    {event.subject && (
                      <span className="font-bold text-teal-command">{event.subject} </span>
                    )}
                    {event.text}
                  </p>
                  <span className="shrink-0 font-mono text-xs text-slate-ink">{event.time}</span>
                </div>
              </div>
            ))}
          </div>
        </DashboardCard>
      </div>
    </AdminDashboardPage>
  );
};
