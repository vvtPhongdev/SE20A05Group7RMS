import React, { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { apiRequest } from '../../../lib/api';
import {
  AdminActionButton,
  AdminCard,
  AdminDashboardPage,
  AdminInlineAlert,
  AdminLoadingState,
  AdminPageHeader,
  AdminSelectControl,
  AdminStatusBadge,
  type AdminTone,
} from '../components';

interface ManagerPerformance {
  name: string;
  requests: number;
  avgProcessingDays: number;
  fillRate: number;
}
interface AnnualReport {
  year: number;
  summary: {
    totalRequests: number;
    totalPositionsOpened: number;
    completedHires: number;
    monthlyRequests: number[];
    monthlyFilled: number[];
    averageTimeToHireDays: number;
    offerAcceptanceRate: number;
    costPerHire: number;
  };
  yoyComparison: {
    previousYear: number;
    requests: { growthPercentage: number };
  };
  departmentBreakdown: Array<{
    departmentId: string;
    departmentName: string;
    totalRequests: number;
    targetHeadcount: number;
    totalFilled: number;
    fillRate: number;
  }>;
  managerPerformance: Array<{
    id: string;
    name: string;
    requests: number;
    averageProcessingDays: number;
    fillRate: number;
  }>;
  timeToHireByStage: Array<{ stage: string; days: number }>;
  campaignTracking: Array<{
    requestId: string;
    planId: string;
    position: string;
    department: string;
    requestStatus: string;
    planStatus: string;
    startDate: string;
    endDate: string;
    completedTasks: number;
    totalTasks: number;
    progress: number;
    currentTask: {
      id: string;
      taskType: string;
      status: string;
      startDate: string | null;
      endDate: string | null;
      assignee: string;
    } | null;
  }>;
}

const departmentPalette = [
  '#0F766E', // teal
  '#2563EB', // blue
  '#D97706', // amber
  '#7C3AED', // violet
  '#DC2626', // red
  '#16A34A', // green
  '#DB2777', // pink
  '#4F46E5', // indigo
];

const getDepartmentColor = (index: number) =>
  departmentPalette[index] ?? `hsl(${(index * 137.508) % 360} 65% 42%)`;

const stagePalette = ['#2563EB', '#7C3AED', '#D97706', '#DC2626', '#0F766E', '#DB2777'];

const toPiePoint = (angle: number, radius = 50) => {
  const radians = ((angle - 90) * Math.PI) / 180;
  return {
    x: 50 + radius * Math.cos(radians),
    y: 50 + radius * Math.sin(radians),
  };
};

const createPieSlicePath = (startAngle: number, endAngle: number) => {
  const start = toPiePoint(startAngle);
  const end = toPiePoint(endAngle);
  const largeArc = endAngle - startAngle > 180 ? 1 : 0;
  return `M 50 50 L ${start.x} ${start.y} A 50 50 0 ${largeArc} 1 ${end.x} ${end.y} Z`;
};

const formatTaskType = (taskType: string) =>
  taskType
    .toLowerCase()
    .split('_')
    .map((part) => `${part.charAt(0).toUpperCase()}${part.slice(1)}`)
    .join(' ');

const formatTrackingDate = (value: string | null) =>
  value
    ? new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric', year: 'numeric' }).format(
        new Date(value),
      )
    : 'Not scheduled';

const getTrackingTone = (status: string): AdminTone => {
  if (['COMPLETED', 'APPROVED'].includes(status)) return 'approved';
  if (status === 'IN_PROGRESS') return 'teal';
  if (['PENDING_APPROVAL', 'PENDING'].includes(status)) return 'pending';
  if (['REJECTED', 'CANCELLED', 'OVERDUE'].includes(status)) return 'rejected';
  return 'slate';
};

export const AdminAnnualReport: React.FC = () => {
  const { token } = useAuth();
  const [selectedYear, setSelectedYear] = useState<'2026' | '2025' | '2024'>('2026');
  const [report, setReport] = useState<AnnualReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState('');

  useEffect(() => {
    let cancelled = false;
    const loadReport = async () => {
      setLoading(true);
      setApiError('');
      try {
        const response = await apiRequest<AnnualReport>(
          `/reports/annual?year=${selectedYear}`,
          token,
        );
        if (!cancelled) setReport(response);
      } catch (error) {
        if (!cancelled) {
          setApiError(error instanceof Error ? error.message : 'Unable to load annual report');
          setReport(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    void loadReport();
    return () => {
      cancelled = true;
    };
  }, [selectedYear, token]);

  const stats = useMemo(() => {
    if (!report) return [];
    const summary = report.summary;
    return [
      {
        label: 'Total Positions Opened',
        value: String(summary.totalPositionsOpened),
        helper: `${report.yoyComparison.requests.growthPercentage}%`,
        sub: `vs ${report.yoyComparison.previousYear} FY`,
        positive: report.yoyComparison.requests.growthPercentage >= 0,
      },
      {
        label: 'Positions Filled',
        value: String(summary.completedHires),
        helper: `${summary.totalPositionsOpened > 0 ? ((summary.completedHires / summary.totalPositionsOpened) * 100).toFixed(1) : 0}%`,
        sub: 'Accepted offers',
        positive: true,
      },
      {
        label: 'Avg. Time-to-Hire',
        value: String(Math.round(summary.averageTimeToHireDays)),
        helper: 'actual',
        sub: 'Completed requests',
        positive: true,
      },
      {
        label: 'Offer Acceptance',
        value: `${summary.offerAcceptanceRate}%`,
        helper: 'actual',
        sub: 'Responded offers',
        positive: true,
      },
      {
        label: 'Cost per Hire',
        value: new Intl.NumberFormat('vi-VN', {
          style: 'currency',
          currency: 'VND',
          maximumFractionDigits: 0,
        }).format(summary.costPerHire),
        helper: 'actual',
        sub: 'Estimated hiring cost',
        positive: true,
      },
    ];
  }, [report]);

  const managers: ManagerPerformance[] = (report?.managerPerformance || []).map((manager) => ({
    name: manager.name,
    requests: manager.requests,
    avgProcessingDays: manager.averageProcessingDays,
    fillRate: manager.fillRate,
  }));
  const maxManagerRequests = Math.max(1, ...managers.map((manager) => manager.requests));
  const maxManagerProcessingDays = Math.max(1, ...managers.map((manager) => manager.avgProcessingDays));
  const bestManagerFillRate = Math.max(0, ...managers.map((manager) => manager.fillRate));
  const stages = report?.timeToHireByStage || [];
  const stageTotal = stages.reduce((sum, stage) => sum + stage.days, 0);
  const longestStage = stages.reduce<{ stage: string; days: number } | null>(
    (longest, stage) => (!longest || stage.days > longest.days ? stage : longest),
    null,
  );
  const campaignTracking = (report?.campaignTracking ?? []).filter(
    (campaign) => campaign.planStatus !== 'REJECTED',
  );

  const chartPaths = useMemo(() => {
    const opened = report?.summary.monthlyRequests || [];
    const filled = report?.summary.monthlyFilled || [];
    const max = Math.max(1, ...opened, ...filled);
    const path = (values: number[]) =>
      values
        .map((value, index) => {
          const x = values.length <= 1 ? 0 : (index / (values.length - 1)) * 100;
          const y = 95 - (value / max) * 85;
          return `${index === 0 ? 'M' : 'L'} ${x} ${y}`;
        })
        .join(' ');
    return { opened: path(opened), filled: path(filled) };
  }, [report]);

  const departmentSlices = useMemo(() => {
    const departments = report?.departmentBreakdown || [];
    const total = departments.reduce((sum, department) => sum + department.totalRequests, 0);
    let angle = 0;

    return departments.map((department, index) => {
      const portion = total > 0 ? department.totalRequests / total : 0;
      const startAngle = angle;
      const endAngle = angle + portion * 360;
      angle = endAngle;
      return {
        ...department,
        color: getDepartmentColor(index),
        percentage: Math.round(portion * 100),
        path: createPieSlicePath(startAngle, endAngle),
      };
    });
  }, [report]);

  const handleExportPDF = async () => {
    setApiError('');
    try {
      const response = await fetch(
        `/api/v1/reports/annual/export?year=${selectedYear}&format=pdf`,
        {
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        },
      );
      if (!response.ok) throw new Error(`Export failed (${response.status})`);
      const url = URL.createObjectURL(await response.blob());
      const link = document.createElement('a');
      link.href = url;
      link.download = `annual-report-${selectedYear}.pdf`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      setApiError(error instanceof Error ? error.message : 'Unable to export the report');
    }
  };

  return (
    <AdminDashboardPage className="space-y-0">
      <AdminPageHeader
        eyebrow="Director Portal / Reports"
        title={`Annual Recruitment Report ${selectedYear}`}
        description="Comprehensive hiring performance overview"
        actions={
          <>
            <AdminSelectControl
              label="Year"
              onChange={(value) => setSelectedYear(value as '2026' | '2025' | '2024')}
              options={['2026', '2025', '2024']}
              value={selectedYear}
            />
            <AdminActionButton onClick={handleExportPDF} variant="secondary">
              <span className="material-symbols-outlined">download</span>
              Export PDF
            </AdminActionButton>
          </>
        }
      />
      {apiError && <AdminInlineAlert>{apiError}</AdminInlineAlert>}
      {loading && <AdminLoadingState label="Loading annual report..." />}

      {/* Top Row: Summary Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        {stats.map((stat, idx) => (
          <AdminCard
            key={stat.label}
            className="p-5 transition-shadow hover:shadow-md"
          >
            <p className="font-label-sm text-label-sm text-secondary uppercase tracking-wider mb-2">
              {stat.label}
            </p>
            <div className="flex items-baseline gap-2">
              <span className="font-headline-xl text-headline-xl text-deep-charcoal font-semibold">
                {stat.value}
                {idx === 2 && <span className="text-headline-md font-normal ml-1">days</span>}
              </span>
              <span
                className={`font-label-sm text-label-sm flex items-center ${
                  stat.helper === 'steady'
                    ? 'text-outline'
                    : stat.positive
                      ? 'text-approved'
                      : 'text-rejected'
                }`}
              >
                {stat.helper !== 'steady' && !stat.helper.includes('%') && (
                  <span className="material-symbols-outlined text-[14px]">
                    {stat.positive ? 'arrow_downward' : 'arrow_upward'}
                  </span>
                )}
                {stat.helper !== 'steady' && stat.helper.includes('%') && (
                  <span className="material-symbols-outlined text-[14px]">arrow_upward</span>
                )}
                {stat.helper}
              </span>
            </div>
            <p className="font-body-sm text-body-sm text-outline mt-1">{stat.sub}</p>
          </AdminCard>
        ))}
      </div>

      {/* Middle Section: Trends & Department Splits */}
      <div className="grid grid-cols-1 lg:grid-cols-10 gap-6">
        {/* Monthly Hiring Trend Line Chart */}
        <div className="lg:col-span-6 bg-clean-surface p-6 rounded-lg border border-border-warm shadow-sm flex flex-col">
          <div className="flex justify-between items-start mb-8">
            <div>
              <h3 className="font-headline-md text-headline-md text-deep-charcoal font-semibold">
                Monthly Hiring Trend
              </h3>
              <p className="font-body-sm text-body-sm text-secondary">
                Recruitment activity flow (Jan - Dec {selectedYear})
              </p>
            </div>
            <div className="flex gap-4">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 bg-teal-command rounded-full"></span>
                <span className="font-label-sm text-label-sm text-secondary">Opened</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 border-2 border-teal-command border-dashed rounded-full"></span>
                <span className="font-label-sm text-label-sm text-secondary">Filled</span>
              </div>
            </div>
          </div>
          <div className="flex-1 min-h-[300px] w-full relative border-l border-b border-outline-variant/30 flex items-end">
            {/* Grid overlay */}
            <div
              className="absolute inset-0 opacity-[0.05] pointer-events-none"
              style={{
                backgroundImage:
                  'linear-gradient(to right, #6d7a77 1px, transparent 1px), linear-gradient(to bottom, #6d7a77 1px, transparent 1px)',
                backgroundSize: '40px 40px',
              }}
            ></div>
            <svg
              className="w-full h-full absolute top-0 left-0"
              preserveAspectRatio="none"
              viewBox="0 0 100 100"
            >
              {/* Opened Line (Solid) */}
              <path
                d={chartPaths.opened}
                fill="none"
                stroke="#0D9488"
                strokeWidth="2"
                vectorEffect="non-scaling-stroke"
              />
              {/* Filled Line (Dashed) */}
              <path
                d={chartPaths.filled}
                fill="none"
                stroke="#0D9488"
                strokeDasharray="6,4"
                strokeWidth="2"
                vectorEffect="non-scaling-stroke"
              />
            </svg>
            <div className="absolute -bottom-7 w-full flex justify-between px-2 font-data-mono text-label-sm text-outline">
              <span>JAN</span>
              <span>MAR</span>
              <span>MAY</span>
              <span>JUL</span>
              <span>SEP</span>
              <span>NOV</span>
              <span>DEC</span>
            </div>
          </div>
        </div>

        {/* Hiring by Department Pie Chart */}
        <div className="lg:col-span-4 bg-clean-surface p-6 rounded-lg border border-border-warm shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="font-headline-md text-headline-md text-deep-charcoal font-semibold mb-1">
              Hiring by Department
            </h3>
            <p className="font-body-sm text-body-sm text-secondary mb-6">
              Distribution of total {report?.summary.totalRequests || 0} requests
            </p>
            <div className="flex items-center justify-center mb-6 relative h-52">
              <div className="relative h-44 w-44">
                <svg
                  aria-label="Hiring requests distributed by department"
                  className="h-full w-full drop-shadow-sm"
                  role="img"
                  viewBox="0 0 100 100"
                >
                  {departmentSlices.length === 1 ? (
                    <circle cx="50" cy="50" fill={departmentSlices[0].color} r="50" stroke="white" strokeWidth="1" />
                  ) : (
                    departmentSlices.map((department) => (
                      <path
                        d={department.path}
                        fill={department.color}
                        key={department.departmentId}
                        stroke="white"
                        strokeWidth="1"
                      >
                        <title>{`${department.departmentName}: ${department.totalRequests} requests (${department.percentage}%)`}</title>
                      </path>
                    ))
                  )}
                  {departmentSlices.length === 0 && <circle cx="50" cy="50" fill="#E7E5E4" r="50" />}
                </svg>
                <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                  <span className="rounded-full bg-clean-surface/90 px-3 py-2 text-center shadow-sm">
                    <span className="block font-headline-md text-headline-md text-deep-charcoal font-semibold">
                      {report?.summary.totalRequests || 0}
                    </span>
                    <span className="block font-label-sm text-[10px] text-outline uppercase">Total</span>
                  </span>
                </div>
              </div>
            </div>
          </div>
          <div className="space-y-2.5">
            {departmentSlices.map((department) => (
                <div className="flex items-center justify-between" key={department.departmentId}>
                  <div className="flex items-center gap-2">
                    <span
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: department.color }}
                    ></span>
                    <span className="font-body-sm text-body-sm text-deep-charcoal">
                      {department.departmentName}
                    </span>
                  </div>
                  <span className="font-data-mono text-label-md text-slate-ink">
                    {department.totalRequests} ({department.percentage}%)
                  </span>
                </div>
              ))}
          </div>
        </div>
      </div>

      {/* Recruitment campaign plan tracking */}
      <AdminCard className="overflow-hidden p-0">
        <div className="flex flex-col gap-3 border-b border-border-warm p-6 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h3 className="font-headline-md text-headline-md font-semibold text-deep-charcoal">
              Recruitment Campaign Plan Tracking
            </h3>
            <p className="mt-1 font-body-sm text-body-sm text-secondary">
              Follow each campaign plan and the task currently being implemented.
            </p>
          </div>
          <div className="rounded-lg bg-teal-command/10 px-3 py-2 text-right">
            <p className="font-data-mono text-lg font-semibold text-teal-command">
              {campaignTracking.length}
            </p>
            <p className="font-label-sm text-[10px] uppercase text-outline">Campaign plans</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[1120px] text-left">
            <thead>
              <tr className="bg-workflow-ivory font-label-sm text-label-sm uppercase tracking-wider text-secondary">
                <th className="px-6 py-4">Campaign</th>
                <th className="px-6 py-4">Plan Status</th>
                <th className="px-6 py-4">Current Task</th>
                <th className="px-6 py-4">Assignee</th>
                <th className="px-6 py-4">Task Schedule</th>
                <th className="px-6 py-4">Progress</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-warm text-on-surface">
              {campaignTracking.map((campaign, index) => {
                const task = campaign.currentTask;
                const allTasksCompleted =
                  campaign.totalTasks > 0 && campaign.completedTasks === campaign.totalTasks;

                return (
                  <tr
                    className={`transition-colors hover:bg-teal-command/5 ${
                      index % 2 === 1 ? 'bg-workflow-ivory/50' : ''
                    }`}
                    key={campaign.planId}
                  >
                    <td className="px-6 py-4">
                      <p className="font-body-md font-semibold text-deep-charcoal">
                        {campaign.position}
                      </p>
                      <p className="mt-1 text-xs text-outline">
                        {campaign.department} · #{campaign.requestId.slice(0, 8)}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <AdminStatusBadge tone={getTrackingTone(campaign.planStatus)}>
                        {formatTaskType(campaign.planStatus)}
                      </AdminStatusBadge>
                    </td>
                    <td className="px-6 py-4">
                      {task ? (
                        <div>
                          <p className="font-body-sm font-semibold text-deep-charcoal">
                            {formatTaskType(task.taskType)}
                          </p>
                          <AdminStatusBadge
                            className="mt-1.5"
                            tone={getTrackingTone(task.status)}
                          >
                            {formatTaskType(task.status)}
                          </AdminStatusBadge>
                        </div>
                      ) : (
                        <span className="font-body-sm text-outline">
                          {allTasksCompleted ? 'All tasks completed' : 'No task configured'}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 font-body-sm text-slate-ink">
                      {task?.assignee ?? '—'}
                    </td>
                    <td className="px-6 py-4 font-body-sm text-slate-ink">
                      {task ? (
                        <>
                          <p>{formatTrackingDate(task.startDate)}</p>
                          <p className="mt-1 text-xs text-outline">
                            to {formatTrackingDate(task.endDate)}
                          </p>
                        </>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="mb-1.5 flex items-center justify-between gap-4 font-data-mono text-xs text-slate-ink">
                        <span>
                          {campaign.completedTasks}/{campaign.totalTasks} tasks
                        </span>
                        <span>{campaign.progress}%</span>
                      </div>
                      <div className="h-2 w-full min-w-32 overflow-hidden rounded-full bg-surface-container">
                        <div
                          className="h-full rounded-full bg-teal-command"
                          style={{ width: `${Math.min(100, campaign.progress)}%` }}
                        ></div>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {campaignTracking.length === 0 && (
                <tr>
                  <td className="px-6 py-10 text-center font-body-sm text-outline" colSpan={6}>
                    No campaign plan tracking data is available for {selectedYear}.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </AdminCard>

      {/* Bottom Section: Performance Table & Stacked Bar */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* HR Manager Performance Comparison */}
        <div className="bg-clean-surface rounded-lg border border-border-warm shadow-sm overflow-hidden flex flex-col justify-between">
          <div>
            <div className="p-6 border-b border-border-warm flex items-start justify-between gap-4">
              <div>
              <h3 className="font-headline-md text-headline-md text-deep-charcoal font-semibold">
                HR Manager Performance
              </h3>
                <p className="mt-1 font-body-sm text-body-sm text-secondary">
                  Compare workload, processing speed, and completed hiring rate.
                </p>
              </div>
              <div className="rounded-lg bg-approved/10 px-3 py-2 text-right">
                <p className="font-data-mono text-lg font-semibold text-approved">{bestManagerFillRate}%</p>
                <p className="font-label-sm text-[10px] text-outline uppercase">Best fill rate</p>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] text-left">
                <thead>
                  <tr className="bg-workflow-ivory font-label-sm text-label-sm text-secondary uppercase tracking-wider">
                    <th className="px-6 py-4">Manager Name</th>
                    <th className="px-6 py-4">Workload</th>
                    <th className="px-6 py-4">Avg. Processing</th>
                    <th className="px-6 py-4">Fill Rate</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-warm text-on-surface">
                  {managers.map((m, idx) => (
                    <tr
                      key={m.name}
                      className={`transition-colors hover:bg-teal-command/5 ${
                        idx % 2 === 1 ? 'bg-workflow-ivory/50' : ''
                      }`}
                    >
                      <td className="px-6 py-4 font-body-md text-deep-charcoal">{m.name}</td>
                      <td className="px-6 py-4">
                        <div className="mb-1.5 flex items-center justify-between font-data-mono text-xs text-slate-ink">
                          <span>{m.requests} requests</span>
                          <span>{Math.round((m.requests / maxManagerRequests) * 100)}%</span>
                        </div>
                        <div className="h-2 w-full overflow-hidden rounded-full bg-surface-container">
                          <div
                            className="h-full rounded-full bg-[#2563EB]"
                            style={{ width: `${(m.requests / maxManagerRequests) * 100}%` }}
                          ></div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="mb-1.5 flex items-center justify-between font-data-mono text-xs text-slate-ink">
                          <span>{m.avgProcessingDays} days</span>
                          <span>lower is better</span>
                        </div>
                        <div className="h-2 w-full overflow-hidden rounded-full bg-surface-container">
                          <div
                            className="h-full rounded-full bg-[#D97706]"
                            style={{ width: `${(m.avgProcessingDays / maxManagerProcessingDays) * 100}%` }}
                          ></div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="mb-1.5 flex items-center justify-between font-data-mono text-xs text-slate-ink">
                          <span>{m.fillRate}% filled</span>
                          <span>{m.fillRate >= 70 ? 'On track' : 'Needs focus'}</span>
                        </div>
                        <div className="h-2 w-full overflow-hidden rounded-full bg-surface-container">
                          <div
                            className={`h-full rounded-full ${m.fillRate >= 70 ? 'bg-approved' : 'bg-revision'}`}
                            style={{ width: `${Math.min(100, m.fillRate)}%` }}
                          ></div>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {managers.length === 0 && (
                    <tr>
                      <td className="px-6 py-8 text-center font-body-sm text-outline" colSpan={4}>
                        No HR manager performance data is available for this period.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Time-to-Hire by Stage */}
        <div className="bg-clean-surface p-6 rounded-lg border border-border-warm shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-start mb-6">
              <div>
                <h3 className="font-headline-md text-headline-md text-deep-charcoal font-semibold">
                  Time-to-Hire by Stage
                </h3>
                <p className="font-body-sm text-body-sm text-secondary">
                  Breakdown of the {Math.round(stageTotal)}-day average
                </p>
              </div>
              <div className="text-right">
                <p className="font-headline-lg text-headline-lg text-teal-command font-semibold">
                  {Math.round(stageTotal)}
                </p>
                <p className="font-label-sm text-label-sm text-outline uppercase">Total Days</p>
              </div>
            </div>
            <div className="space-y-6 mt-4">
              <div className="flex w-full h-11 rounded-lg overflow-hidden shadow-sm bg-surface-container">
                {stages.map((stage, index) => (
                  <div
                    className="flex min-w-0 items-center justify-center border-r border-white/50 font-label-sm text-label-sm text-white last:border-r-0"
                    key={stage.stage}
                    style={{
                      width: `${stageTotal > 0 ? (stage.days / stageTotal) * 100 : 20}%`,
                      backgroundColor: stagePalette[index % stagePalette.length],
                    }}
                    title={`${stage.stage}: ${stage.days} days`}
                  >
                    <span className="truncate px-1">{Math.round(stage.days)}d</span>
                  </div>
                ))}
              </div>
              <div className="space-y-3">
                {stages.map((stage, index) => (
                  <div className="rounded-lg border border-border-warm bg-workflow-ivory/45 p-3" key={stage.stage}>
                    <div className="mb-2 flex items-center justify-between gap-4">
                      <div className="flex min-w-0 items-center gap-2">
                        <span
                          className="h-3 w-3 shrink-0 rounded-sm"
                          style={{ backgroundColor: stagePalette[index % stagePalette.length] }}
                        ></span>
                        <p className="truncate font-label-md text-label-md text-deep-charcoal">{stage.stage}</p>
                      </div>
                      <p className="shrink-0 font-data-mono text-sm font-semibold text-slate-ink">
                        {stage.days}d{' '}
                        <span className="text-xs font-normal text-outline">
                          ({stageTotal > 0 ? Math.round((stage.days / stageTotal) * 100) : 0}%)
                        </span>
                      </p>
                    </div>
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-container">
                      <div
                        className="h-full rounded-full"
                        style={{
                          backgroundColor: stagePalette[index % stagePalette.length],
                          width: `${stageTotal > 0 ? (stage.days / stageTotal) * 100 : 0}%`,
                        }}
                      ></div>
                    </div>
                  </div>
                ))}
                {stages.length === 0 && (
                  <p className="py-8 text-center font-body-sm text-outline">
                    No completed hiring-stage data is available for this period.
                  </p>
                )}
              </div>
            </div>
          </div>
          <div className="mt-6 pt-6 border-t border-border-warm/50">
            <div className="bg-surface-container p-4 rounded-lg flex items-center gap-3">
              <span className="material-symbols-outlined text-teal-command select-none">info</span>
              <p className="font-body-sm text-body-sm text-slate-ink">
                {longestStage
                  ? `${longestStage.stage} is currently the longest stage at ${longestStage.days} days on average.`
                  : 'No completed hiring timeline is available for this year.'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </AdminDashboardPage>
  );
};
