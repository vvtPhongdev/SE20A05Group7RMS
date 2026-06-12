import React, { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { apiRequest } from '../lib/api';

interface ManagerPerformance {
  name: string;
  requests: number;
  avgProcessing: string;
  fillRate: number;
  efficiencyPath: string;
}

/*
 * Mock annual report data retained for UI reference only.
const managerPerformanceData: Record<string, ManagerPerformance[]> = {
  '2026': [
    {
      name: 'Sarah Jenkins',
      requests: 14,
      avgProcessing: '22d',
      fillRate: 85,
      efficiencyPath: 'M0 15 L20 10 L40 18 L60 5 L80 12',
    },
    {
      name: 'Marcus Chen',
      requests: 12,
      avgProcessing: '29d',
      fillRate: 62,
      efficiencyPath: 'M0 10 L20 15 L40 5 L60 12 L80 8',
    },
    {
      name: 'Elena Rodriguez',
      requests: 18,
      avgProcessing: '31d',
      fillRate: 78,
      efficiencyPath: 'M0 18 L20 12 L40 15 L60 8 L80 5',
    },
    {
      name: 'David Okafor',
      requests: 8,
      avgProcessing: '26d',
      fillRate: 90,
      efficiencyPath: 'M0 12 L20 8 L40 10 L60 5 L80 2',
    },
  ],
  '2025': [
    {
      name: 'Sarah Jenkins',
      requests: 11,
      avgProcessing: '25d',
      fillRate: 80,
      efficiencyPath: 'M0 18 L20 15 L40 12 L60 10 L80 8',
    },
    {
      name: 'Marcus Chen',
      requests: 15,
      avgProcessing: '28d',
      fillRate: 70,
      efficiencyPath: 'M0 12 L20 10 L40 15 L60 12 L80 14',
    },
    {
      name: 'Elena Rodriguez',
      requests: 12,
      avgProcessing: '35d',
      fillRate: 75,
      efficiencyPath: 'M0 15 L20 18 L40 10 L60 8 L80 5',
    },
    {
      name: 'David Okafor',
      requests: 10,
      avgProcessing: '24d',
      fillRate: 88,
      efficiencyPath: 'M0 10 L20 8 L40 6 L60 4 L80 2',
    },
  ],
  '2024': [
    {
      name: 'Sarah Jenkins',
      requests: 9,
      avgProcessing: '28d',
      fillRate: 75,
      efficiencyPath: 'M0 20 L20 15 L40 18 L60 12 L80 15',
    },
    {
      name: 'Marcus Chen',
      requests: 10,
      avgProcessing: '32d',
      fillRate: 58,
      efficiencyPath: 'M0 15 L20 18 L40 12 L60 14 L80 10',
    },
    {
      name: 'Elena Rodriguez',
      requests: 14,
      avgProcessing: '30d',
      fillRate: 82,
      efficiencyPath: 'M0 12 L20 10 L40 8 L60 6 L80 4',
    },
    {
      name: 'David Okafor',
      requests: 7,
      avgProcessing: '30d',
      fillRate: 85,
      efficiencyPath: 'M0 15 L20 12 L40 10 L60 8 L80 5',
    },
  ],
};

const statsData: Record<
  string,
  { label: string; value: string; helper: string; sub: string; positive: boolean }[]
> = {
  '2026': [
    {
      label: 'Total Positions Opened',
      value: '52',
      helper: '15%',
      sub: 'vs 2025 FY',
      positive: true,
    },
    {
      label: 'Positions Filled',
      value: '34',
      helper: '65.4%',
      sub: 'Active pipelines',
      positive: true,
    },
    {
      label: 'Avg. Time-to-Hire',
      value: '28',
      helper: '5d',
      sub: 'Optimized workflow',
      positive: true,
    },
    {
      label: 'Offer Acceptance',
      value: '87%',
      helper: 'steady',
      sub: 'Market competitive',
      positive: true,
    },
    {
      label: 'Cost per Hire',
      value: 'VND 15.2M',
      helper: '8%',
      sub: 'Internal sourcing',
      positive: true,
    },
  ],
  '2025': [
    {
      label: 'Total Positions Opened',
      value: '45',
      helper: '8%',
      sub: 'vs 2024 FY',
      positive: true,
    },
    {
      label: 'Positions Filled',
      value: '30',
      helper: '66.7%',
      sub: 'Completed pipelines',
      positive: true,
    },
    {
      label: 'Avg. Time-to-Hire',
      value: '33',
      helper: '2d',
      sub: 'Standard workflow',
      positive: true,
    },
    {
      label: 'Offer Acceptance',
      value: '85%',
      helper: '2% increase',
      sub: 'Market average',
      positive: true,
    },
    {
      label: 'Cost per Hire',
      value: 'VND 16.5M',
      helper: '5%',
      sub: 'External sourcing',
      positive: false,
    },
  ],
  '2024': [
    {
      label: 'Total Positions Opened',
      value: '42',
      helper: '10%',
      sub: 'vs 2023 FY',
      positive: true,
    },
    {
      label: 'Positions Filled',
      value: '28',
      helper: '66.7%',
      sub: 'Completed pipelines',
      positive: true,
    },
    {
      label: 'Avg. Time-to-Hire',
      value: '35',
      helper: '3d',
      sub: 'Legacy workflow',
      positive: true,
    },
    {
      label: 'Offer Acceptance',
      value: '83%',
      helper: 'steady',
      sub: 'Market average',
      positive: true,
    },
    {
      label: 'Cost per Hire',
      value: 'VND 17.3M',
      helper: '12%',
      sub: 'Agency sourcing',
      positive: false,
    },
  ],
};
*/

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
}

export const AdminAnnualReport: React.FC = () => {
  const { token } = useAuth();
  const [selectedYear, setSelectedYear] = useState<'2026' | '2025' | '2024'>('2026');
  const [hoveredRow, setHoveredRow] = useState<number | null>(null);
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
    avgProcessing: `${manager.averageProcessingDays}d`,
    fillRate: manager.fillRate,
    efficiencyPath: `M0 18 L20 ${Math.max(2, 18 - manager.fillRate / 8)} L40 ${Math.max(2, 17 - manager.fillRate / 9)} L60 ${Math.max(2, 15 - manager.fillRate / 10)} L80 ${Math.max(2, 20 - manager.fillRate / 5)}`,
  }));
  const stages = report?.timeToHireByStage || [];
  const stageTotal = stages.reduce((sum, stage) => sum + stage.days, 0);
  const longestStage = stages.reduce<{ stage: string; days: number } | null>(
    (longest, stage) => (!longest || stage.days > longest.days ? stage : longest),
    null,
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
    <div className="p-0 max-w-[1440px] mx-auto space-y-6">
      {/* Sub Header & Actions */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center text-secondary font-label-md text-label-md">
            <span>Director Portal</span>
            <span className="material-symbols-outlined text-[16px] mx-2">chevron_right</span>
            <span className="text-on-surface font-semibold">Reports</span>
          </div>
          <h2 className="font-headline-lg text-headline-lg font-semibold text-deep-charcoal mt-2">
            Annual Recruitment Report {selectedYear}
          </h2>
          <p className="font-body-sm text-body-sm text-slate-ink mt-1">
            Comprehensive hiring performance overview
          </p>
        </div>
        <div className="flex items-center gap-margin-sm">
          <div className="relative">
            <select
              className="appearance-none bg-clean-surface border border-border-warm rounded-lg pl-4 pr-10 py-2 font-body-sm text-body-sm focus:outline-none focus:ring-2 focus:ring-teal-command cursor-pointer text-on-surface"
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value as '2026' | '2025' | '2024')}
            >
              <option value="2026">2026</option>
              <option value="2025">2025</option>
              <option value="2024">2024</option>
            </select>
            <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-outline select-none">
              expand_more
            </span>
          </div>
          <button
            onClick={handleExportPDF}
            className="flex items-center gap-2 px-4 py-2 border border-teal-command text-teal-command font-label-md text-label-md rounded-lg hover:bg-teal-command hover:text-white transition-all active:scale-[0.98]"
          >
            <span className="material-symbols-outlined">download</span>
            Export PDF
          </button>
        </div>
      </div>
      {apiError && (
        <div className="rounded-lg border border-rejected/30 bg-error-container px-4 py-3 text-sm text-rejected">
          {apiError}
        </div>
      )}
      {loading && (
        <div className="rounded-lg border border-border-warm bg-clean-surface px-4 py-3 text-sm text-secondary">
          Loading annual report...
        </div>
      )}

      {/* Top Row: Summary Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        {stats.map((stat, idx) => (
          <div
            key={stat.label}
            className="bg-clean-surface p-5 rounded-lg border border-border-warm shadow-sm hover:shadow-md transition-shadow"
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
          </div>
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

        {/* Hiring by Department Donut Chart */}
        <div className="lg:col-span-4 bg-clean-surface p-6 rounded-lg border border-border-warm shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="font-headline-md text-headline-md text-deep-charcoal font-semibold mb-1">
              Hiring by Department
            </h3>
            <p className="font-body-sm text-body-sm text-secondary mb-6">
              Distribution of total {report?.summary.totalRequests || 0} requests
            </p>
            <div className="flex items-center justify-center mb-6 relative h-48">
              <div className="w-40 h-40 rounded-full border-[12px] border-teal-command/20 flex items-center justify-center relative">
                <div
                  className="absolute inset-[-12px] rounded-full border-[12px] border-teal-command"
                  style={{ clipPath: 'polygon(50% 50%, 50% 0, 100% 0, 100% 35%, 50% 50%)' }}
                />
                <div
                  className="absolute inset-[-12px] rounded-full border-[12px] border-teal-command/70"
                  style={{ clipPath: 'polygon(50% 50%, 100% 35%, 100% 65%, 50% 50%)' }}
                />
                <div
                  className="absolute inset-[-12px] rounded-full border-[12px] border-teal-command/50"
                  style={{ clipPath: 'polygon(50% 50%, 100% 65%, 70% 100%, 50% 50%)' }}
                />
                <div className="text-center">
                  <p className="font-headline-lg text-headline-lg text-teal-command font-semibold">
                    {report?.summary.totalRequests || 0}
                  </p>
                  <p className="font-label-sm text-label-sm text-outline uppercase">Total</p>
                </div>
              </div>
            </div>
          </div>
          <div className="space-y-2.5">
            {(report?.departmentBreakdown || []).map((department, index) => {
              const total = report?.summary.totalRequests || 0;
              const percentage =
                total > 0 ? Math.round((department.totalRequests / total) * 100) : 0;
              return (
                <div className="flex items-center justify-between" key={department.departmentId}>
                  <div className="flex items-center gap-2">
                    <span
                      className="w-2 h-2 rounded-full bg-teal-command"
                      style={{ opacity: Math.max(0.25, 1 - index * 0.15) }}
                    ></span>
                    <span className="font-body-sm text-body-sm text-deep-charcoal">
                      {department.departmentName}
                    </span>
                  </div>
                  <span className="font-data-mono text-label-md text-slate-ink">
                    {department.totalRequests} ({percentage}%)
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Bottom Section: Performance Table & Stacked Bar */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* HR Manager Performance Table */}
        <div className="bg-clean-surface rounded-lg border border-border-warm shadow-sm overflow-hidden flex flex-col justify-between">
          <div>
            <div className="p-6 border-b border-border-warm">
              <h3 className="font-headline-md text-headline-md text-deep-charcoal font-semibold">
                HR Manager Performance
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-workflow-ivory font-label-sm text-label-sm text-secondary uppercase tracking-wider">
                    <th className="px-6 py-4">Manager Name</th>
                    <th className="px-6 py-4">Requests</th>
                    <th className="px-6 py-4">Avg Processing</th>
                    <th className="px-6 py-4">Fill Rate</th>
                    <th className="px-6 py-4">Efficiency</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-warm text-on-surface">
                  {managers.map((m, idx) => (
                    <tr
                      key={m.name}
                      onMouseEnter={() => setHoveredRow(idx)}
                      onMouseLeave={() => setHoveredRow(null)}
                      className={`transition-colors hover:bg-teal-command/5 ${
                        idx % 2 === 1 ? 'bg-workflow-ivory/50' : ''
                      }`}
                    >
                      <td className="px-6 py-4 font-body-md text-deep-charcoal">{m.name}</td>
                      <td className="px-6 py-4 font-data-mono text-slate-ink">{m.requests}</td>
                      <td className="px-6 py-4 font-data-mono text-slate-ink">{m.avgProcessing}</td>
                      <td className="px-6 py-4">
                        <div className="w-full bg-surface-container rounded-full h-1.5 overflow-hidden">
                          <div
                            className={`h-full ${m.fillRate >= 70 ? 'bg-approved' : 'bg-revision'}`}
                            style={{ width: `${m.fillRate}%` }}
                          ></div>
                        </div>
                        <span className="text-[11px] font-label-sm text-outline mt-1 block">
                          {m.fillRate}%
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <svg className="h-6 w-20" viewBox="0 0 80 20">
                          <path
                            d={m.efficiencyPath}
                            fill="none"
                            stroke={m.fillRate >= 70 ? '#059669' : '#0D9488'}
                            strokeWidth={hoveredRow === idx ? '3' : '2'}
                            className="transition-all duration-200"
                          />
                        </svg>
                      </td>
                    </tr>
                  ))}
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
            <div className="space-y-8 mt-4">
              <div className="flex w-full h-10 rounded-lg overflow-hidden shadow-sm">
                {stages.map((stage, index) => (
                  <div
                    className="bg-teal-command flex items-center justify-center font-label-sm text-label-sm text-white"
                    key={stage.stage}
                    style={{
                      width: `${stageTotal > 0 ? (stage.days / stageTotal) * 100 : 20}%`,
                      opacity: Math.max(0.25, 1 - index * 0.15),
                    }}
                    title={`${stage.stage}: ${stage.days} days`}
                  >
                    {Math.round(stage.days)}d
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-2 gap-4">
                {stages.map((stage, index) => (
                  <div className="flex items-center gap-3" key={stage.stage}>
                    <span
                      className="w-3 h-3 bg-teal-command rounded-sm"
                      style={{ opacity: Math.max(0.25, 1 - index * 0.15) }}
                    ></span>
                    <div>
                      <p className="font-label-md text-label-md text-deep-charcoal">
                        {stage.stage}
                      </p>
                      <p className="font-body-sm text-body-sm text-outline">
                        {stage.days} days average
                      </p>
                    </div>
                  </div>
                ))}
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
    </div>
  );
};
