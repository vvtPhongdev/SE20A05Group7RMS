import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { apiRequest } from '../lib/api';

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

/*
 * Mock department statistics retained for UI reference only.
const mockData: Record<
  'Last 30 days' | 'Quarter' | 'Year',
  {
    cards: DepartmentCardData[];
    chart: PerformanceBar[];
    pending: PendingApproval[];
    activity: HeadActivity[];
  }
> = {
  'Last 30 days': {
    cards: [
      {
        name: 'IT & Engineering',
        head: 'Nguyen Van A',
        fillRate: 88,
        timeToHire: 22,
        activeRequests: 5,
        pendingApprovalsText: '2 Pending Approvals',
        pendingApproved: false,
      },
      {
        name: 'Marketing',
        head: 'Tran Thi B',
        fillRate: 72,
        timeToHire: 28,
        activeRequests: 3,
        pendingApprovalsText: '1 Pending Approval',
        pendingApproved: false,
      },
      {
        name: 'Human Resources',
        head: 'Le Van C',
        fillRate: 95,
        timeToHire: 15,
        activeRequests: 1,
        pendingApprovalsText: '0 Pending Approvals',
        pendingApproved: true,
      },
      {
        name: 'Finance',
        head: 'Pham Van D',
        fillRate: 65,
        timeToHire: 32,
        activeRequests: 2,
        pendingApprovalsText: '1 Pending Approval',
        pendingApproved: false,
      },
    ],
    chart: [
      { label: 'IT', requested: 17, inProgress: 12, filled: 15 },
      { label: 'Marketing', requested: 12, inProgress: 8, filled: 9 },
      { label: 'HR', requested: 10, inProgress: 9, filled: 9.6 },
      { label: 'Finance', requested: 14, inProgress: 11, filled: 7 },
      { label: 'Design', requested: 15, inProgress: 13, filled: 12 },
    ],
    pending: [
      { department: 'IT & Engineering', requests: 5, plans: 2, oldest: '6 Days Old', badge: true },
      { department: 'Marketing', requests: 3, plans: 1, oldest: '2 days', badge: false },
      { department: 'Finance', requests: 2, plans: 1, oldest: '3 days', badge: false },
      { department: 'Design & UX', requests: 4, plans: 0, oldest: '1 day', badge: false },
    ],
    activity: [
      {
        name: 'Nguyen Van A',
        initials: 'NA',
        dept: 'Engineering',
        reqs: 42,
        score: 4.8,
        lastActive: '2h ago',
        avatarBg: 'bg-primary-container',
      },
      {
        name: 'Hoang Thi E',
        initials: 'HE',
        dept: 'Design',
        reqs: 38,
        score: 4.9,
        lastActive: 'Active',
        avatarBg: 'bg-secondary',
      },
      {
        name: 'Tran Thi B',
        initials: 'TB',
        dept: 'Marketing',
        reqs: 24,
        score: 4.2,
        lastActive: '1d ago',
        avatarBg: 'bg-teal-command',
      },
      {
        name: 'Pham Van D',
        initials: 'PD',
        dept: 'Finance',
        reqs: 19,
        score: 4.5,
        lastActive: '3h ago',
        avatarBg: 'bg-slate-ink',
      },
    ],
  },
  Quarter: {
    cards: [
      {
        name: 'IT & Engineering',
        head: 'Nguyen Van A',
        fillRate: 85,
        timeToHire: 24,
        activeRequests: 12,
        pendingApprovalsText: '4 Pending Approvals',
        pendingApproved: false,
      },
      {
        name: 'Marketing',
        head: 'Tran Thi B',
        fillRate: 75,
        timeToHire: 26,
        activeRequests: 6,
        pendingApprovalsText: '2 Pending Approvals',
        pendingApproved: false,
      },
      {
        name: 'Human Resources',
        head: 'Le Van C',
        fillRate: 92,
        timeToHire: 17,
        activeRequests: 2,
        pendingApprovalsText: '0 Pending Approvals',
        pendingApproved: true,
      },
      {
        name: 'Finance',
        head: 'Pham Van D',
        fillRate: 70,
        timeToHire: 30,
        activeRequests: 5,
        pendingApprovalsText: '1 Pending Approval',
        pendingApproved: false,
      },
    ],
    chart: [
      { label: 'IT', requested: 32, inProgress: 24, filled: 28 },
      { label: 'Marketing', requested: 20, inProgress: 15, filled: 16 },
      { label: 'HR', requested: 15, inProgress: 13, filled: 14 },
      { label: 'Finance', requested: 24, inProgress: 18, filled: 15 },
      { label: 'Design', requested: 25, inProgress: 20, filled: 21 },
    ],
    pending: [
      {
        department: 'IT & Engineering',
        requests: 12,
        plans: 5,
        oldest: '12 Days Old',
        badge: true,
      },
      { department: 'Marketing', requests: 6, plans: 2, oldest: '4 days', badge: false },
      { department: 'Finance', requests: 5, plans: 2, oldest: '5 days', badge: false },
      { department: 'Design & UX', requests: 7, plans: 1, oldest: '2 days', badge: false },
    ],
    activity: [
      {
        name: 'Nguyen Van A',
        initials: 'NA',
        dept: 'Engineering',
        reqs: 110,
        score: 4.8,
        lastActive: '1h ago',
        avatarBg: 'bg-primary-container',
      },
      {
        name: 'Hoang Thi E',
        initials: 'HE',
        dept: 'Design',
        reqs: 95,
        score: 4.9,
        lastActive: 'Active',
        avatarBg: 'bg-secondary',
      },
      {
        name: 'Tran Thi B',
        initials: 'TB',
        dept: 'Marketing',
        reqs: 74,
        score: 4.3,
        lastActive: '2d ago',
        avatarBg: 'bg-teal-command',
      },
      {
        name: 'Pham Van D',
        initials: 'PD',
        dept: 'Finance',
        reqs: 60,
        score: 4.6,
        lastActive: '1h ago',
        avatarBg: 'bg-slate-ink',
      },
    ],
  },
  Year: {
    cards: [
      {
        name: 'IT & Engineering',
        head: 'Nguyen Van A',
        fillRate: 82,
        timeToHire: 26,
        activeRequests: 35,
        pendingApprovalsText: '6 Pending Approvals',
        pendingApproved: false,
      },
      {
        name: 'Marketing',
        head: 'Tran Thi B',
        fillRate: 70,
        timeToHire: 30,
        activeRequests: 18,
        pendingApprovalsText: '3 Pending Approvals',
        pendingApproved: false,
      },
      {
        name: 'Human Resources',
        head: 'Le Van C',
        fillRate: 89,
        timeToHire: 19,
        activeRequests: 8,
        pendingApprovalsText: '0 Pending Approvals',
        pendingApproved: true,
      },
      {
        name: 'Finance',
        head: 'Pham Van D',
        fillRate: 68,
        timeToHire: 34,
        activeRequests: 12,
        pendingApprovalsText: '2 Pending Approvals',
        pendingApproved: false,
      },
    ],
    chart: [
      { label: 'IT', requested: 120, inProgress: 95, filled: 102 },
      { label: 'Marketing', requested: 75, inProgress: 60, filled: 58 },
      { label: 'HR', requested: 45, inProgress: 40, filled: 41 },
      { label: 'Finance', requested: 68, inProgress: 52, filled: 48 },
      { label: 'Design', requested: 82, inProgress: 70, filled: 74 },
    ],
    pending: [
      {
        department: 'IT & Engineering',
        requests: 35,
        plans: 15,
        oldest: '18 Days Old',
        badge: true,
      },
      { department: 'Marketing', requests: 18, plans: 8, oldest: '8 days', badge: false },
      { department: 'Finance', requests: 12, plans: 5, oldest: '10 days', badge: false },
      { department: 'Design & UX', requests: 14, plans: 3, oldest: '5 days', badge: false },
    ],
    activity: [
      {
        name: 'Nguyen Van A',
        initials: 'NA',
        dept: 'Engineering',
        reqs: 380,
        score: 4.8,
        lastActive: '5h ago',
        avatarBg: 'bg-primary-container',
      },
      {
        name: 'Hoang Thi E',
        initials: 'HE',
        dept: 'Design',
        reqs: 320,
        score: 4.9,
        lastActive: 'Active',
        avatarBg: 'bg-secondary',
      },
      {
        name: 'Tran Thi B',
        initials: 'TB',
        dept: 'Marketing',
        reqs: 210,
        score: 4.4,
        lastActive: '1w ago',
        avatarBg: 'bg-teal-command',
      },
      {
        name: 'Pham Van D',
        initials: 'PD',
        dept: 'Finance',
        reqs: 180,
        score: 4.7,
        lastActive: '4h ago',
        avatarBg: 'bg-slate-ink',
      },
    ],
  },
};
*/

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
    <div className="p-0 max-w-[1440px] mx-auto space-y-6">
      {/* Sub Header & Actions */}
      <div className="flex justify-between items-start mb-6">
        <div>
          <div className="flex items-center text-secondary font-label-md text-label-md">
            <span>Director Portal</span>
            <span className="material-symbols-outlined text-[16px] mx-2">chevron_right</span>
            <span className="text-on-surface font-semibold">Department Statistics</span>
          </div>
          <h2 className="font-headline-lg text-headline-lg font-semibold text-deep-charcoal mt-2">
            Department Statistics
          </h2>
          <p className="text-body-md text-secondary mt-1">Department-wise recruitment analytics</p>
        </div>
        <div className="flex bg-parchment-lift p-1 rounded-lg border border-border-warm text-on-surface">
          {(['Last 30 days', 'Quarter', 'Year'] as const).map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={`px-4 py-2 text-label-md rounded-lg transition-all ${
                range === r
                  ? 'bg-clean-surface shadow-sm text-teal-command font-semibold'
                  : 'text-secondary hover:text-deep-charcoal'
              }`}
            >
              {r}
            </button>
          ))}
        </div>
      </div>
      {apiError && (
        <div className="rounded-lg border border-rejected/30 bg-error-container px-4 py-3 text-sm text-rejected">
          {apiError}
        </div>
      )}
      {loading && (
        <div className="rounded-lg border border-border-warm bg-clean-surface px-4 py-3 text-sm text-secondary">
          Loading department statistics...
        </div>
      )}

      {/* Department Metrics Cards Row */}
      <div className="flex gap-margin-md overflow-x-auto no-scrollbar pb-4 text-on-surface">
        {cards.map((card) => (
          <div
            className="min-w-[320px] bg-clean-surface p-6 rounded-lg card-border-teal shadow-sm border border-border-warm flex-shrink-0 flex flex-col justify-between"
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
          </div>
        ))}
      </div>

      {/* Comparison Performance Chart */}
      <div className="bg-clean-surface p-6 rounded-lg border border-border-warm shadow-sm mb-8 text-on-surface">
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
      </div>

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
    </div>
  );
};
