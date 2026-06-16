import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { apiRequest } from '../../../lib/api';
import {
  AdminCard,
  AdminDashboardPage,
  AdminInlineAlert,
  AdminLoadingState,
  AdminPageHeader,
} from '../components';

interface DepartmentCardData {
  name: string;
  head: string;
  fillRate: number;
  timeToHire: number;
  activeRequests: number;
  pendingApprovalsText: string;
  pendingApproved: boolean;
}

interface PerformanceBar {
  label: string;
  requested: number;
  inProgress: number;
  filled: number;
}

interface PendingApproval {
  department: string;
  requests: number;
  plans: number;
  oldest: string;
  badge: boolean;
}

interface HeadActivity {
  name: string;
  initials: string;
  dept: string;
  reqs: number;
  score: number;
  lastActive: string;
  avatarBg: string;
}



export const AdminDeptStats: React.FC = () => {
  const { token } = useAuth();
  const [range, setRange] = useState<'Last 30 days' | 'Quarter' | 'Year'>('Last 30 days');
  const [data, setData] = useState<{
    cards: DepartmentCardData[];
    chart: PerformanceBar[];
    pending: PendingApproval[];
    activity: HeadActivity[];
  }>({ cards: [], chart: [], pending: [], activity: [] });
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState('');
  const { cards, chart, pending, activity } = data;

  useEffect(() => {
    let cancelled = false;
    const loadStats = async () => {
      setLoading(true);
      setApiError('');
      const rangeParam = range === 'Quarter' ? 'quarter' : range === 'Year' ? 'year' : '30d';
      try {
        const response = await apiRequest<typeof data>(
          `/reports/departments?range=${rangeParam}`,
          token,
        );
        if (!cancelled) setData(response);
      } catch (error) {
        if (!cancelled) {
          setApiError(
            error instanceof Error ? error.message : 'Unable to load department statistics',
          );
          setData({ cards: [], chart: [], pending: [], activity: [] });
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    void loadStats();
    return () => {
      cancelled = true;
    };
  }, [range, token]);

  // We find max value dynamically to compute relative percentage heights for chart bars
  const maxVal = Math.max(...chart.flatMap((c) => [c.requested, c.inProgress, c.filled]), 20);

  return (
    <AdminDashboardPage>
      <AdminPageHeader
        eyebrow="Director Portal / Department Statistics"
        title="Department Statistics"
        description="Department-wise recruitment analytics"
        actions={
          <div className="flex rounded-lg border border-border-warm bg-parchment-lift p-1 text-on-surface">
            {(['Last 30 days', 'Quarter', 'Year'] as const).map((r) => (
              <button
                key={r}
                onClick={() => setRange(r)}
                className={`rounded-lg px-4 py-2 text-label-md transition-all ${
                  range === r
                    ? 'bg-clean-surface font-semibold text-teal-command shadow-sm'
                    : 'text-secondary hover:text-deep-charcoal'
                }`}
              >
                {r}
              </button>
            ))}
          </div>
        }
      />
      {apiError && <AdminInlineAlert>{apiError}</AdminInlineAlert>}
      {loading && <AdminLoadingState label="Loading department statistics..." />}

      {/* Department Metrics Cards Row */}
      <div className="flex gap-margin-md overflow-x-auto no-scrollbar pb-4 text-on-surface">
        {cards.map((card) => (
          <AdminCard
            className="min-w-[320px] flex-shrink-0 card-border-teal flex flex-col justify-between"
            key={card.name}
          >
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="font-headline-md text-headline-md text-deep-charcoal font-semibold">
                  {card.name}
                </h3>
                <p className="text-label-sm text-secondary mt-1">{card.head}</p>
              </div>
              <div
                className={`flex items-center text-label-sm font-semibold ${
                  card.fillRate >= 85
                    ? 'text-approved'
                    : card.fillRate >= 70
                      ? 'text-pending'
                      : 'text-rejected'
                }`}
              >
                <span className="material-symbols-outlined text-[16px] mr-1">
                  {card.fillRate >= 85
                    ? 'trending_up'
                    : card.fillRate >= 70
                      ? 'horizontal_rule'
                      : 'trending_down'}
                </span>
                {card.fillRate}%
              </div>
            </div>
            <div className="w-full bg-surface-container rounded-full h-2 mb-6">
              <div
                className="bg-teal-command h-2 rounded-full transition-all duration-300"
                style={{ width: `${card.fillRate}%` }}
              ></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-label-sm text-secondary mb-1">Time-to-Hire</p>
                <p className="font-data-mono text-deep-charcoal font-semibold">
                  {card.timeToHire} days
                </p>
              </div>
              <div>
                <p className="text-label-sm text-secondary mb-1">Active Requests</p>
                <p className="font-data-mono text-deep-charcoal font-semibold">
                  {card.activeRequests}
                </p>
              </div>
              <div className="col-span-2 flex items-center gap-2">
                <div
                  className={`w-2 h-2 rounded-full ${
                    card.pendingApproved ? 'bg-approved' : 'bg-revision'
                  }`}
                ></div>
                <p className="text-label-sm text-secondary">{card.pendingApprovalsText}</p>
              </div>
            </div>
          </AdminCard>
        ))}
      </div>

      {/* Comparison Performance Chart */}
      <AdminCard className="mb-8 text-on-surface">
        <div className="flex justify-between items-center mb-8 flex-wrap gap-4">
          <h3 className="font-headline-md text-headline-md text-deep-charcoal font-semibold">
            Department Performance Comparison
          </h3>
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-[#99f6e4]"></div>
              <span className="text-label-sm text-secondary font-medium">Requested</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-[#2dd4bf]"></div>
              <span className="text-label-sm text-secondary font-medium">In Progress</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-[#0d9488]"></div>
              <span className="text-label-sm text-secondary font-medium">Filled</span>
            </div>
          </div>
        </div>
        <div className="h-80 w-full relative flex items-end justify-around border-l border-b border-border-warm px-8 pb-1">
          {/* Y Axis Labels */}
          <div className="absolute left-[-40px] top-0 bottom-0 flex flex-col justify-between text-label-sm text-secondary py-1 select-none">
            <span>{Math.round(maxVal)}</span>
            <span>{Math.round(maxVal * 0.75)}</span>
            <span>{Math.round(maxVal * 0.5)}</span>
            <span>{Math.round(maxVal * 0.25)}</span>
            <span>0</span>
          </div>
          {/* Chart Bars */}
          {chart.map((group) => (
            <div
              className="flex flex-col items-center group/group w-1/5 max-w-[120px]"
              key={group.label}
            >
              <div className="flex items-end gap-1.5 h-64 w-full justify-center">
                <div
                  className="w-1/3 min-w-[8px] bg-[#99f6e4] rounded-t-sm hover:opacity-80 transition-all duration-300"
                  style={{ height: `${(group.requested / maxVal) * 100}%` }}
                  title={`Requested: ${group.requested}`}
                ></div>
                <div
                  className="w-1/3 min-w-[8px] bg-[#2dd4bf] rounded-t-sm hover:opacity-80 transition-all duration-300"
                  style={{ height: `${(group.inProgress / maxVal) * 100}%` }}
                  title={`In Progress: ${group.inProgress}`}
                ></div>
                <div
                  className="w-1/3 min-w-[8px] bg-[#0d9488] rounded-t-sm hover:opacity-80 transition-all duration-300"
                  style={{ height: `${(group.filled / maxVal) * 100}%` }}
                  title={`Filled: ${group.filled}`}
                ></div>
              </div>
              <span className="mt-4 text-label-sm text-deep-charcoal font-semibold select-none">
                {group.label}
              </span>
            </div>
          ))}
        </div>
      </AdminCard>

      {/* Bottom Layout Tables */}
      <div className="grid grid-cols-12 gap-6">
        {/* Left: Pending Approvals Table */}
        <div className="col-span-12 lg:col-span-7 bg-clean-surface rounded-lg border border-border-warm shadow-sm overflow-hidden flex flex-col justify-between">
          <div>
            <div className="px-6 py-4 border-b border-border-warm flex justify-between items-center">
              <h3 className="font-headline-md text-headline-md text-deep-charcoal font-semibold">
                Pending Approvals by Department
              </h3>
              <Link
                to="/admin/approval-queue"
                className="text-teal-command text-label-md font-semibold hover:underline transition-all active:scale-[0.98]"
              >
                View All
              </Link>
            </div>
            <table className="w-full text-left">
              <thead className="bg-surface-container-low text-label-sm text-secondary">
                <tr>
                  <th className="px-6 py-3 font-semibold uppercase tracking-wider">Department</th>
                  <th className="px-6 py-3 font-semibold uppercase tracking-wider text-center">
                    Requests
                  </th>
                  <th className="px-6 py-3 font-semibold uppercase tracking-wider text-center">
                    Plans
                  </th>
                  <th className="px-6 py-3 font-semibold uppercase tracking-wider">
                    Oldest Pending
                  </th>
                  <th className="px-6 py-3 font-semibold uppercase tracking-wider">Action</th>
                </tr>
              </thead>
              <tbody className="text-body-sm text-on-surface">
                {pending.map((p) => (
                  <tr
                    className={`border-b border-border-warm transition-colors ${
                      p.badge ? 'bg-[#fffbeb]' : 'hover:bg-workflow-ivory'
                    }`}
                    key={p.department}
                  >
                    <td className="px-6 py-4 font-semibold text-deep-charcoal">{p.department}</td>
                    <td className="px-6 py-4 text-center font-data-mono">{p.requests}</td>
                    <td className="px-6 py-4 text-center font-data-mono">{p.plans}</td>
                    <td className="px-6 py-4">
                      {p.badge ? (
                        <span className="px-2 py-1 rounded bg-error-container text-on-error-container text-[11px] font-bold uppercase select-none">
                          {p.oldest}
                        </span>
                      ) : (
                        <span className="text-secondary">{p.oldest}</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <Link
                        className="text-teal-command font-semibold hover:underline"
                        to="/admin/approval-queue"
                      >
                        Review
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right: Department Head Activity */}
        <div className="col-span-12 lg:col-span-5 bg-clean-surface rounded-lg border border-border-warm shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-border-warm flex justify-between items-center">
            <h3 className="font-headline-md text-headline-md text-deep-charcoal font-semibold">
              Department Head Activity
            </h3>
          </div>
          <table className="w-full text-left">
            <thead className="bg-surface-container-low text-label-sm text-secondary">
              <tr>
                <th className="px-6 py-3 font-semibold uppercase tracking-wider">Name / Dept</th>
                <th className="px-6 py-3 font-semibold uppercase tracking-wider text-center">
                  Reqs
                </th>
                <th className="px-6 py-3 font-semibold uppercase tracking-wider text-center">
                  Score
                </th>
                <th className="px-6 py-3 font-semibold uppercase tracking-wider">Last Active</th>
              </tr>
            </thead>
            <tbody className="text-body-sm text-on-surface">
              {activity.map((act) => (
                <tr
                  className="border-b border-border-warm hover:bg-workflow-ivory transition-colors"
                  key={act.name}
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-8 h-8 rounded-full ${act.avatarBg} text-white flex items-center justify-center text-[10px] font-bold`}
                      >
                        {act.initials}
                      </div>
                      <div>
                        <p className="font-semibold text-deep-charcoal">{act.name}</p>
                        <p className="text-[11px] text-secondary">{act.dept}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center font-data-mono">{act.reqs}</td>
                  <td className="px-6 py-4 text-center">
                    <div className="flex items-center justify-center text-amber-500">
                      <span
                        className="material-symbols-outlined text-[16px] select-none"
                        style={{ fontVariationSettings: "'FILL' 1" }}
                      >
                        star
                      </span>
                      <span className="text-label-sm ml-1 text-deep-charcoal font-semibold">
                        {act.score.toFixed(1)}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-secondary text-[12px]">{act.lastActive}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AdminDashboardPage>
  );
};
