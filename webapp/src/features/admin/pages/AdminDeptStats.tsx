import React, { useEffect, useMemo, useState } from 'react';
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

interface CampaignProgress {
  id: string;
  position: string;
  department: string;
  departmentCode: string;
  status: string;
  progress: number;
  completedTasks: number;
  inProgressTasks: number;
  totalTasks: number;
  collectedCVs: number;
  screeningCVs: number;
  hiredCount: number;
  notHiredCount: number;
  interviewedCount: number;
  stages: Array<{
    type: string;
    status: string;
  }>;
}

interface PendingApproval {
  department: string;
  hrReview: number;
  adminReview: number;
  plans: number;
  total: number;
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

const PLAN_STAGE_ORDER = [
  'JOB_POSTING',
  'CV_COLLECTION',
  'CV_SCREENING',
  'INTERVIEW_COORDINATION',
] as const;

export const AdminDeptStats: React.FC = () => {
  const { token } = useAuth();
  const [range, setRange] = useState<'Last 30 days' | 'Quarter' | 'Year'>('Last 30 days');
  const [data, setData] = useState<{
    cards: DepartmentCardData[];
    campaigns: CampaignProgress[];
    pending: PendingApproval[];
    activity: HeadActivity[];
  }>({ cards: [], campaigns: [], pending: [], activity: [] });
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('All Departments');
  const [selectedCampaignId, setSelectedCampaignId] = useState('');
  const { cards, campaigns, pending, activity } = data;

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
          setData({ cards: [], campaigns: [], pending: [], activity: [] });
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

  const maxPendingTotal = Math.max(1, ...pending.map((item) => item.total));
  const departmentOptions = useMemo(
    () => [
      'All Departments',
      ...Array.from(new Set(campaigns.map((campaign) => campaign.department))),
    ],
    [campaigns],
  );
  const visibleCampaigns = useMemo(
    () =>
      selectedDepartment === 'All Departments'
        ? campaigns
        : campaigns.filter((campaign) => campaign.department === selectedDepartment),
    [campaigns, selectedDepartment],
  );
  const selectedCampaign =
    visibleCampaigns.find((campaign) => campaign.id === selectedCampaignId) ?? visibleCampaigns[0];
  const stageLabels: Record<string, string> = {
    JOB_POSTING: 'Job posting',
    CV_COLLECTION: 'CV collection',
    CV_SCREENING: 'CV screening',
    INTERVIEW_COORDINATION: 'Interview',
  };

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

      {/* Campaign Progress Chart */}
      <AdminCard className="mb-8 text-on-surface">
        <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h3 className="font-headline-md text-headline-md text-deep-charcoal font-semibold">
              Recruitment Plan Stages
            </h3>
            <p className="mt-1 text-body-sm text-secondary">
              Select a department and campaign to review plan stages, collected CVs, and hires.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <select
              aria-label="Select department"
              className="rounded-lg border border-border-warm bg-clean-surface px-3 py-2 text-label-sm text-deep-charcoal outline-none focus:border-teal-command"
              onChange={(event) => {
                setSelectedDepartment(event.target.value);
                setSelectedCampaignId('');
              }}
              value={selectedDepartment}
            >
              {departmentOptions.map((department) => (
                <option key={department} value={department}>
                  {department}
                </option>
              ))}
            </select>
            <select
              aria-label="Select campaign"
              className="max-w-[280px] rounded-lg border border-border-warm bg-clean-surface px-3 py-2 text-label-sm text-deep-charcoal outline-none focus:border-teal-command"
              disabled={visibleCampaigns.length === 0}
              onChange={(event) => setSelectedCampaignId(event.target.value)}
              value={selectedCampaign?.id ?? ''}
            >
              {visibleCampaigns.map((campaign) => (
                <option key={campaign.id} value={campaign.id}>
                  {campaign.departmentCode} · {campaign.position}
                </option>
              ))}
            </select>
          </div>
        </div>
        {selectedCampaign ? (
          <>
            <div className="mb-7 grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div className="rounded-lg border border-border-warm bg-workflow-ivory/40 p-4">
                <p className="text-label-sm text-secondary">Plan completion</p>
                <p className="mt-1 font-data-mono text-2xl font-bold text-teal-command">
                  {selectedCampaign.progress}%
                </p>
              </div>
              <div className="rounded-lg border border-border-warm bg-workflow-ivory/40 p-4">
                <p className="text-label-sm text-secondary">CVs collected</p>
                <p className="mt-1 font-data-mono text-2xl font-bold text-deep-charcoal">
                  {selectedCampaign.collectedCVs}
                </p>
              </div>
              <div className="rounded-lg border border-border-warm bg-workflow-ivory/40 p-4">
                <p className="text-label-sm text-secondary">Candidates hired</p>
                <p className="mt-1 font-data-mono text-2xl font-bold text-approved">
                  {selectedCampaign.hiredCount}
                </p>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
              {PLAN_STAGE_ORDER.map((stageType) => {
                const stage = selectedCampaign.stages.find((item) => item.type === stageType) ?? {
                  type: stageType,
                  status: 'PENDING',
                };
                const isCollection = stage.type === 'CV_COLLECTION';
                const isScreening = stage.type === 'CV_SCREENING';
                const isInterview = stage.type === 'INTERVIEW_COORDINATION';
                const complete = stage.status === 'COMPLETED';
                return (
                  <div className="rounded-lg border border-border-warm p-4" key={stage.type}>
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-semibold text-deep-charcoal">
                        {stageLabels[stage.type] ?? stage.type}
                      </p>
                      <span
                        className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${complete ? 'bg-approved/10 text-approved' : stage.status === 'IN_PROGRESS' ? 'bg-pending/10 text-pending' : 'bg-surface-container text-secondary'}`}
                      >
                        {stage.status.replace('_', ' ')}
                      </span>
                    </div>
                    <div className="mt-5 h-2 overflow-hidden rounded-full bg-surface-container">
                      <div
                        className={`h-full rounded-full ${complete ? 'bg-approved' : stage.status === 'IN_PROGRESS' ? 'bg-pending' : 'bg-secondary/30'}`}
                        style={{
                          width: complete ? '100%' : stage.status === 'IN_PROGRESS' ? '50%' : '0%',
                        }}
                      />
                    </div>
                    {isInterview ? (
                      <div className="mt-4">
                        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.12em] text-secondary">
                          Interview candidates
                        </p>
                        <div className="grid grid-cols-3 gap-2 text-center font-data-mono">
                          <div className="rounded-md bg-teal-command/10 px-2 py-2">
                            <p className="text-2xl font-bold text-teal-command">
                              {selectedCampaign.interviewedCount}
                            </p>
                            <p className="mt-1 text-[10px] font-semibold uppercase text-teal-command">
                              Interviewed
                            </p>
                          </div>
                          <div className="rounded-md bg-approved/10 px-2 py-2">
                            <p className="text-2xl font-bold text-approved">
                              {selectedCampaign.hiredCount}
                            </p>
                            <p className="mt-1 text-[10px] font-semibold uppercase text-approved">
                              Hiring
                            </p>
                          </div>
                          <div className="rounded-md bg-rejected/10 px-2 py-2">
                            <p className="text-2xl font-bold text-rejected">
                              {selectedCampaign.notHiredCount}
                            </p>
                            <p className="mt-1 text-[10px] font-semibold uppercase text-rejected">
                              Not hiring
                            </p>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <>
                        <p className="mt-4 font-data-mono text-lg font-bold text-teal-command">
                          {isCollection
                            ? `${selectedCampaign.collectedCVs} CVs collected`
                            : isScreening
                              ? `${selectedCampaign.screeningCVs} CVs being screened`
                              : complete
                                ? 'Task completed'
                                : 'No output yet'}
                        </p>
                        {isScreening && (
                          <p className="mt-1 text-xs text-secondary">
                            Includes all CVs collected from Talent Pool, including candidates who
                            have progressed to later stages.
                          </p>
                        )}
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </>
        ) : !loading ? (
          <p className="py-10 text-center text-body-sm text-secondary">
            No campaign plans found for the selected department and period.
          </p>
        ) : null}
      </AdminCard>

      {/* Bottom Layout Tables */}
      <div className="grid grid-cols-12 gap-6">
        {/* Left: Pending Approvals Table */}
        <div className="col-span-12 lg:col-span-7 bg-clean-surface rounded-lg border border-border-warm shadow-sm overflow-hidden flex flex-col justify-between">
          <div>
            <div className="px-6 py-4 border-b border-border-warm flex justify-between items-center">
              <div>
                <h3 className="font-headline-md text-headline-md text-deep-charcoal font-semibold">
                  Pending Approvals by Department
                </h3>
                <p className="mt-1 text-body-sm text-secondary">
                  Requests waiting for HR, Admin, or plan approval.
                </p>
              </div>
              <Link
                to="/admin/approval-queue"
                className="text-teal-command text-label-md font-semibold hover:underline transition-all active:scale-[0.98]"
              >
                View All
              </Link>
            </div>
            <div className="border-b border-border-warm bg-workflow-ivory/35 px-6 py-5">
              <div className="mb-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-label-sm text-secondary">
                <span className="font-semibold text-deep-charcoal">Pending approval workload</span>
                <span className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-sm bg-[#2563EB]" /> HR Review
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-sm bg-[#D97706]" /> Admin Review
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-sm bg-[#7C3AED]" /> Plan Approval
                </span>
              </div>
              <div className="space-y-3">
                {pending.map((item) => (
                  <div
                    className="grid grid-cols-[minmax(100px,0.7fr)_minmax(180px,2fr)_auto] items-center gap-3"
                    key={item.department}
                  >
                    <span
                      className="truncate text-label-sm font-semibold text-deep-charcoal"
                      title={item.department}
                    >
                      {item.department}
                    </span>
                    <div className="flex h-4 overflow-hidden rounded-full bg-surface-container">
                      {item.hrReview > 0 && (
                        <span
                          className="h-full bg-[#2563EB]"
                          style={{ width: `${(item.hrReview / maxPendingTotal) * 100}%` }}
                          title={`HR Review: ${item.hrReview}`}
                        />
                      )}
                      {item.adminReview > 0 && (
                        <span
                          className="h-full bg-[#D97706]"
                          style={{ width: `${(item.adminReview / maxPendingTotal) * 100}%` }}
                          title={`Admin Review: ${item.adminReview}`}
                        />
                      )}
                      {item.plans > 0 && (
                        <span
                          className="h-full bg-[#7C3AED]"
                          style={{ width: `${(item.plans / maxPendingTotal) * 100}%` }}
                          title={`Plan Approval: ${item.plans}`}
                        />
                      )}
                    </div>
                    <span className="font-data-mono text-label-sm font-semibold text-slate-ink">
                      {item.total}
                    </span>
                  </div>
                ))}
                {pending.length === 0 && (
                  <p className="py-2 text-center text-body-sm text-secondary">
                    No pending approvals to chart for the selected period.
                  </p>
                )}
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] text-left">
                <thead className="bg-surface-container-low text-label-sm text-secondary">
                  <tr>
                    <th className="px-6 py-3 font-semibold uppercase tracking-wider">Department</th>
                    <th className="px-6 py-3 font-semibold uppercase tracking-wider text-center">
                      HR Review
                    </th>
                    <th className="px-6 py-3 font-semibold uppercase tracking-wider text-center">
                      Admin Review
                    </th>
                    <th className="px-6 py-3 font-semibold uppercase tracking-wider text-center">
                      Plan Approval
                    </th>
                    <th className="px-6 py-3 font-semibold uppercase tracking-wider text-center">
                      Total
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
                      <td className="px-6 py-4 text-center font-data-mono">{p.hrReview}</td>
                      <td className="px-6 py-4 text-center font-data-mono">{p.adminReview}</td>
                      <td className="px-6 py-4 text-center font-data-mono">{p.plans}</td>
                      <td className="px-6 py-4 text-center">
                        <span className="inline-flex min-w-7 items-center justify-center rounded-full bg-teal-command/10 px-2 py-1 font-data-mono font-semibold text-teal-command">
                          {p.total}
                        </span>
                      </td>
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
                  {pending.length === 0 && (
                    <tr>
                      <td className="px-6 py-8 text-center text-secondary" colSpan={7}>
                        No pending approvals for the selected period.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
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
