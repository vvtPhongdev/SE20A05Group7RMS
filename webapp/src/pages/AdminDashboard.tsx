import React from 'react';

const kpis = [
  {
    label: 'Active Requests',
    value: '18',
    meta: '+3 this week',
    valueClass: 'text-teal-command',
    metaClass: 'text-approved',
    icon: 'briefcase',
  },
  {
    label: 'Pending Your Approval',
    value: '5',
    meta: 'Requiring urgent review',
    valueClass: 'text-revision',
    metaClass: 'text-slate-ink',
    icon: 'alert',
  },
  {
    label: 'Interviews This Week',
    value: '12',
    meta: 'Across 4 departments',
    valueClass: 'text-on-surface',
    metaClass: 'text-slate-ink',
    icon: 'calendar',
  },
];

const approvalQueue = [
  { id: '#RMS-9421', position: 'Senior Developer', department: 'IT', priority: 'High', submitted: 'May 28', tone: 'bg-rejected/10 text-rejected' },
  { id: '#RMS-9419', position: 'Marketing Lead', department: 'Marketing', priority: 'Med', submitted: 'May 28', tone: 'bg-pending/10 text-pending' },
  { id: '#RMS-9418', position: 'UX Designer', department: 'Design', priority: 'Med', submitted: 'May 27', tone: 'bg-pending/10 text-pending' },
  { id: '#RMS-9415', position: 'HR Coordinator', department: 'HR', priority: 'Low', submitted: 'May 27', tone: 'bg-draft/10 text-draft' },
  { id: '#RMS-9410', position: 'Cloud Architect', department: 'IT', priority: 'High', submitted: 'May 26', tone: 'bg-rejected/10 text-rejected' },
];

const pipelineStages = [
  { label: 'Applied', value: 145, width: '100%', tone: 'bg-teal-command/20' },
  { label: 'Screening', value: 67, width: '46%', tone: 'bg-teal-command/40' },
  { label: 'Interview', value: 28, width: '19%', tone: 'bg-teal-command/60' },
  { label: 'Offer', value: 8, width: '6%', tone: 'bg-teal-command/80' },
  { label: 'Hired', value: 34, width: '23%', tone: 'bg-teal-command' },
];

const departmentActivity = [
  { label: 'IT', value: 8, width: '80%', tone: 'bg-teal-command' },
  { label: 'Marketing', value: 4, width: '40%', tone: 'bg-teal-command/70' },
  { label: 'HR', value: 2, width: '20%', tone: 'bg-teal-command/50' },
  { label: 'Finance', value: 3, width: '30%', tone: 'bg-teal-command/60' },
  { label: 'Design', value: 1, width: '10%', tone: 'bg-teal-command/40' },
];

const activityFeed = [
  { text: 'New request from IT department', subject: '#RMS-9428', time: 'May 29 09:15', tone: 'border-teal-command' },
  { text: 'Interview completed: Nguyen Van A', subject: '', time: 'May 29 08:45', tone: 'border-pending' },
  { text: 'Plan approved: Marketing Specialist', subject: '', time: 'May 28 16:30', tone: 'border-approved' },
  { text: 'Offer sent to Tran Ngoc Mai', subject: '', time: 'May 28 14:20', tone: 'border-teal-command' },
  { text: 'Request rejected: Junior Intern', subject: '', time: 'May 28 11:05', tone: 'border-rejected' },
];

const Icon = ({ name, className = 'h-5 w-5' }: { name: string; className?: string }) => {
  const paths: Record<string, React.ReactNode> = {
    briefcase: <path d="M10 6V5a2 2 0 0 1 2-2h0a2 2 0 0 1 2 2v1m-9 0h14a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2Zm-2 6h18" />,
    alert: <path d="M12 9v4m0 4h.01M10.3 3.9 2.8 17a2 2 0 0 0 1.7 3h15a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" />,
    calendar: <path d="M7 3v4m10-4v4M4 9h16M6 5h12a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2Z" />,
    trend: <path d="m3 17 6-6 4 4 7-8m0 0h-5m5 0v5" />,
    review: <path d="M9 12l2 2 4-4M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />,
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

const DashboardCard = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
  <section className={`rounded-xl border border-border-warm bg-clean-surface p-6 shadow-[0_18px_50px_-44px_rgba(28,25,23,0.55)] ${className}`}>
    {children}
  </section>
);

export const AdminDashboard: React.FC = () => {
  return (
    <div className="mx-auto flex max-w-[1440px] flex-col gap-6">
      <header className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-deep-charcoal">Dashboard</h1>
          <p className="mt-1 text-sm text-slate-ink">Good morning, Mr. Tu</p>
        </div>
        <div className="w-fit rounded-lg bg-surface-container px-3 py-1.5 font-mono text-sm text-slate-ink">
          May 29, 2026
        </div>
      </header>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
        {kpis.map((kpi, index) => (
          <DashboardCard className="transition duration-200 hover:-translate-y-[2px]" key={kpi.label}>
            <div className="flex items-start justify-between gap-4">
              <span className="text-sm font-medium text-on-surface-variant">{kpi.label}</span>
              <Icon className={`h-5 w-5 ${index === 1 ? 'text-rejected' : 'text-outline'}`} name={kpi.icon} />
            </div>
            <div className="mt-5">
              <span className={`text-[32px] font-bold leading-none ${kpi.valueClass}`}>{kpi.value}</span>
              <p className={`mt-2 text-xs font-medium ${kpi.metaClass}`}>{kpi.meta}</p>
            </div>
          </DashboardCard>
        ))}

        <DashboardCard className="flex items-center justify-between gap-4 transition duration-200 hover:-translate-y-[2px]">
          <div>
            <span className="text-sm font-medium text-on-surface-variant">Positions Filled (YTD)</span>
            <div className="mt-5 flex items-baseline gap-1">
              <span className="text-[30px] font-bold leading-none text-on-surface">34</span>
              <span className="text-sm text-outline">/ 52</span>
            </div>
          </div>
          <div className="relative h-16 w-16">
            <svg className="h-full w-full -rotate-90" viewBox="0 0 64 64">
              <circle className="text-surface-container-high" cx="32" cy="32" fill="transparent" r="25" stroke="currentColor" strokeWidth="7" />
              <circle
                className="text-teal-command"
                cx="32"
                cy="32"
                fill="transparent"
                r="25"
                stroke="currentColor"
                strokeDasharray="157"
                strokeDashoffset="55"
                strokeLinecap="round"
                strokeWidth="7"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center text-xs font-semibold text-on-surface">65%</div>
          </div>
        </DashboardCard>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-10">
        <DashboardCard className="xl:col-span-6">
          <div className="mb-5 flex items-center justify-between gap-4">
            <h2 className="text-xl font-semibold text-on-surface">Recent Approval Queue</h2>
            <button className="text-sm font-semibold text-teal-command transition hover:underline active:scale-[0.98]" type="button">
              View All Queue
            </button>
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
                      <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${request.tone}`}>{request.priority}</span>
                    </td>
                    <td className="py-4 text-slate-ink">{request.submitted}</td>
                    <td className="py-4 text-right">
                      <button className="font-semibold text-teal-command transition hover:underline active:scale-[0.98]" type="button">
                        Review
                      </button>
                    </td>
                  </tr>
                ))}
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
            <span className="text-sm font-semibold">3 decisions pending your review</span>
          </div>
        </DashboardCard>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <DashboardCard>
          <h2 className="mb-5 text-xl font-semibold text-on-surface">Department Activity</h2>
          <div className="space-y-4">
            {departmentActivity.map((department) => (
              <div className="grid grid-cols-[92px_1fr_32px] items-center gap-4" key={department.label}>
                <span className="text-sm font-medium text-on-surface-variant">{department.label}</span>
                <div className="h-4 overflow-hidden rounded-full bg-surface-container">
                  <div className={`h-full rounded-full ${department.tone}`} style={{ width: department.width }} />
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
                <div className={`absolute left-0 top-1.5 h-4 w-4 rounded-full border-2 bg-clean-surface ${event.tone}`} />
                <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
                  <p className="text-sm leading-6 text-deep-charcoal">
                    {event.subject && <span className="font-bold text-teal-command">{event.subject} </span>}
                    {event.text}
                  </p>
                  <span className="shrink-0 font-mono text-xs text-slate-ink">{event.time}</span>
                </div>
              </div>
            ))}
          </div>
        </DashboardCard>
      </div>
    </div>
  );
};
