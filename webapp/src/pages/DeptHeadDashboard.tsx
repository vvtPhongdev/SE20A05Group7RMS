import React from 'react';
import { useNavigate } from 'react-router-dom';

type IconName =
  | 'assignment'
  | 'pending'
  | 'event'
  | 'personAdd'
  | 'download'
  | 'refresh'
  | 'search'
  | 'clock'
  | 'arrow'
  | 'check'
  | 'person'
  | 'calendar'
  | 'more'
  | 'plus';

const Icon = ({ name, className = 'h-5 w-5' }: { name: IconName; className?: string }) => {
  const paths: Record<IconName, React.ReactNode> = {
    assignment: (
      <path d="M9 4h6l1 2h3a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h3l1-2Zm0 7h6m-6 4h4" />
    ),
    pending: (
      <path d="M9 12h6m-3-3v6m9-3a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
    ),
    event: (
      <path d="M7 3v4m10-4v4M4 9h16M6 5h12a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2Z" />
    ),
    personAdd: (
      <path d="M15 19a6 6 0 0 0-12 0m6-8a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm10 1v6m-3-3h6" />
    ),
    download: <path d="M12 3v12m0 0 4-4m-4 4-4-4M4 21h16" />,
    refresh: <path d="M20 11a8 8 0 0 0-14.8-3M4 5v4h4m-4 4a8 8 0 0 0 14.8 3M20 19v-4h-4" />,
    search: <path d="m21 21-4.35-4.35M10.5 18a7.5 7.5 0 1 1 0-15 7.5 7.5 0 0 1 0 15Z" />,
    clock: <path d="M12 6v6l4 2m5-2a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />,
    arrow: <path d="M9 18l6-6-6-6" />,
    check: <path d="m5 12 4 4L19 6" />,
    person: <path d="M20 21a8 8 0 0 0-16 0m8-10a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z" />,
    calendar: <path d="M8 2v4m8-4v4M3 10h18M5 5h14a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2Z" />,
    more: <path d="M5 12h.01M12 12h.01M19 12h.01" />,
    plus: <path d="M12 5v14M5 12h14" />,
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

const metrics = [
  {
    label: 'Active Requests',
    value: '24',
    helper: '8 reaching deadline soon',
    icon: 'assignment' as IconName,
    iconClass: 'bg-surface-container-high text-teal-command',
    trend: '+12%',
    trendClass: 'text-approved',
  },
  {
    label: 'Pending Approval',
    value: '06',
    helper: 'Avg. wait time: 2.4 days',
    icon: 'pending' as IconName,
    iconClass: 'bg-error-container text-error',
    trend: 'Action req.',
    trendClass: 'text-revision',
  },
  {
    label: 'Interviews Today',
    value: '08',
    helper: 'Next at 11:30 AM',
    icon: 'event' as IconName,
    iconClass: 'bg-surface-container-high text-pending',
    trend: 'Today',
    trendClass: 'rounded-full bg-pending/10 px-2 py-0.5 text-[10px] font-bold uppercase text-pending',
  },
  {
    label: 'Quarterly Hires',
    value: '32',
    helper: '71% reached',
    icon: 'personAdd' as IconName,
    iconClass: 'bg-surface-container-high text-approved',
    trend: 'Goal: 45',
    trendClass: 'text-on-surface-variant',
  },
];

const pipelineStages = [
  { label: 'Sourcing', value: '45', ring: 'border-teal-command/20', text: 'text-teal-command' },
  { label: 'Screening', value: '28', ring: 'border-pending/20', text: 'text-pending' },
  { label: 'Interviewing', value: '14', ring: 'border-revision/20', text: 'text-revision' },
  { label: 'Offer Stage', value: '05', ring: 'border-approved/20', text: 'text-approved' },
];

const roles = [
  {
    id: 'REQ-2026-042',
    role: 'Senior Frontend Engineer',
    applicants: '12',
    delta: '+2 today',
    status: 'Interviewing',
    statusClass: 'bg-pending/10 text-pending',
    dotClass: 'bg-pending',
    manager: 'Sarah Chen',
    initials: 'SC',
  },
  {
    id: 'REQ-2026-038',
    role: 'Staff Product Designer',
    applicants: '08',
    delta: '',
    status: 'Offer Stage',
    statusClass: 'bg-approved/10 text-approved',
    dotClass: 'bg-approved',
    manager: 'Mike Ross',
    initials: 'MR',
  },
];

const interviews = [
  {
    day: '11',
    month: 'JUN',
    name: 'David Miller',
    role: 'Senior DevOps Lead',
    time: '11:30 AM - 12:30 PM',
    border: 'border-teal-command',
  },
  {
    day: '11',
    month: 'JUN',
    name: 'Elena Rodriguez',
    role: 'Frontend Developer',
    time: '02:00 PM - 03:00 PM',
    border: 'border-pending',
  },
  {
    day: '12',
    month: 'JUN',
    name: 'Jordan Smith',
    role: 'QA Engineer',
    time: '09:00 AM - 10:00 AM',
    border: 'border-revision',
  },
];

const activity = [
  {
    icon: 'check' as IconName,
    iconClass: 'bg-approved',
    text: (
      <>
        <span className="font-bold">Request #REQ-2026-001</span> has been{' '}
        <span className="font-medium text-approved">approved</span> by VP Operations.
      </>
    ),
    time: '2 hours ago',
  },
  {
    icon: 'person' as IconName,
    iconClass: 'bg-pending',
    text: (
      <>
        <span className="font-bold">New application</span> received for{' '}
        <span className="italic">Senior Developer</span> from Marc Jacobs.
      </>
    ),
    time: '4 hours ago',
  },
  {
    icon: 'calendar' as IconName,
    iconClass: 'bg-revision',
    text: (
      <>
        Interview for <span className="font-bold">Candidate: Anna Lee</span> rescheduled to
        tomorrow at 10 AM.
      </>
    ),
    time: 'Yesterday, 4:15 PM',
  },
];

const Card = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
  <section
    className={`rounded-xl border border-border-warm bg-clean-surface shadow-[0_18px_50px_-44px_rgba(28,25,23,0.55)] transition duration-200 hover:border-teal-command/40 ${className}`}
  >
    {children}
  </section>
);

export const DeptHeadDashboard: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="mx-auto flex max-w-[1440px] flex-col gap-6">
      <section className="flex flex-col gap-4 border-b border-border-warm pb-5 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-teal-command">
            Department Head Portal
          </p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-on-surface">
            Department Dashboard
          </h1>
        </div>
        <div className="relative w-full lg:w-80">
          <Icon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-outline" name="search" />
          <input
            aria-label="Search requests, candidates"
            className="h-10 w-full rounded-lg border border-border-warm bg-clean-surface pl-10 pr-4 text-sm outline-none transition focus:border-teal-command focus:ring-2 focus:ring-teal-command/20"
            placeholder="Search requests, candidates..."
            type="search"
          />
        </div>
      </section>

      <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h2 className="text-[32px] font-semibold leading-tight tracking-tight text-on-surface">
            Good morning, Sarah
          </h2>
          <p className="mt-1 text-sm text-on-surface-variant">Thursday, June 11, 2026</p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          <button
            className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-border-warm bg-clean-surface px-4 text-sm font-semibold text-teal-command transition hover:bg-parchment-lift active:scale-[0.98]"
            type="button"
          >
            <Icon className="h-4 w-4" name="download" />
            Export Report
          </button>
          <button
            className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-teal-command px-4 text-sm font-semibold text-white transition hover:bg-primary active:scale-[0.98]"
            type="button"
          >
            <Icon className="h-4 w-4" name="refresh" />
            Refresh Data
          </button>
        </div>
      </header>

      <section className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric) => (
          <Card className="flex min-h-[178px] flex-col p-6" key={metric.label}>
            <div className="mb-4 flex items-start justify-between">
              <span className={`rounded-lg p-2 ${metric.iconClass}`}>
                <Icon name={metric.icon} />
              </span>
              <span className={`text-xs font-semibold ${metric.trendClass}`}>{metric.trend}</span>
            </div>
            <p className="mb-1 text-sm font-medium text-on-surface-variant">{metric.label}</p>
            <h3 className="text-[32px] font-semibold leading-none text-on-surface">{metric.value}</h3>
            {metric.label === 'Quarterly Hires' ? (
              <>
                <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-surface-container-high">
                  <div className="h-full w-[71%] rounded-full bg-teal-command" />
                </div>
                <p className="mt-2 text-right text-xs font-semibold text-outline">{metric.helper}</p>
              </>
            ) : (
              <p className="mt-auto text-xs font-semibold text-outline">{metric.helper}</p>
            )}
          </Card>
        ))}
      </section>

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-12">
        <Card className="p-6 xl:col-span-8">
          <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-xl font-semibold text-on-surface">My Recruitment Pipeline</h2>
            <select className="w-fit rounded-lg border border-border-warm bg-workflow-ivory py-1.5 pl-3 pr-8 text-sm outline-none focus:border-teal-command focus:ring-2 focus:ring-teal-command/20">
              <option>All Departments</option>
              <option>Engineering</option>
              <option>Product</option>
            </select>
          </div>

          <div className="grid grid-cols-1 gap-4 py-4 sm:grid-cols-4">
            {pipelineStages.map((stage) => (
              <div className="flex flex-col items-center gap-2 text-center" key={stage.label}>
                <div
                  className={`flex h-16 w-16 items-center justify-center rounded-full border-2 bg-surface-container-low ${stage.ring}`}
                >
                  <span className={`text-xl font-semibold ${stage.text}`}>{stage.value}</span>
                </div>
                <span className="text-xs font-semibold text-on-surface-variant">{stage.label}</span>
              </div>
            ))}
          </div>

          <div className="mt-6 overflow-x-auto">
            <table role="table" className="w-full min-w-[680px] text-left">
              <thead role="rowgroup" className="border-b border-border-warm">
                <tr role="row">
                  <th role="columnheader" scope="col" className="px-2 py-3 text-xs font-semibold uppercase tracking-wider text-outline">
                    Role Name
                  </th>
                  <th role="columnheader" scope="col" className="px-2 py-3 text-xs font-semibold uppercase tracking-wider text-outline">
                    Applicants
                  </th>
                  <th role="columnheader" scope="col" className="px-2 py-3 text-xs font-semibold uppercase tracking-wider text-outline">
                    Status
                  </th>
                  <th role="columnheader" scope="col" className="px-2 py-3 text-xs font-semibold uppercase tracking-wider text-outline">
                    Hiring Manager
                  </th>
                </tr>
              </thead>
              <tbody role="rowgroup" className="divide-y divide-border-warm/30">
                {roles.map((role) => (
                  <tr
                    role="row"
                    tabIndex={0}
                    aria-label={`Role ${role.role}, ID ${role.id}, status is ${role.status}`}
                    className="cursor-pointer transition-colors hover:bg-workflow-ivory"
                    key={role.id}
                    onClick={() => navigate('/dept-head/requests')}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault();
                        navigate('/dept-head/requests');
                      }
                    }}
                  >
                    <td role="cell" className="px-2 py-4">
                      <p className="text-sm font-semibold text-on-surface">{role.role}</p>
                      <p className="text-sm text-outline">{role.id}</p>
                    </td>
                    <td role="cell" className="px-2 py-4">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-on-surface">{role.applicants}</span>
                        {role.delta && (
                          <span className="rounded bg-approved/10 px-1.5 text-[10px] text-approved">
                            {role.delta}
                          </span>
                        )}
                      </div>
                    </td>
                    <td role="cell" className="px-2 py-4">
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${role.statusClass}`}
                      >
                        <span className={`h-1.5 w-1.5 rounded-full ${role.dotClass}`} />
                        {role.status}
                      </span>
                    </td>
                    <td role="cell" className="px-2 py-4">
                      <div className="flex items-center gap-2">
                        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-surface-container-high text-[10px] font-bold text-teal-command">
                          {role.initials}
                        </span>
                        <span className="text-sm text-on-surface">{role.manager}</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        <Card className="p-6 xl:col-span-4">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-xl font-semibold text-on-surface">Upcoming Interviews</h2>
            <button
              className="text-xs font-semibold text-teal-command hover:underline active:scale-[0.98]"
              onClick={() => navigate('/dept-head/interviews')}
              type="button"
            >
              View Calendar
            </button>
          </div>
          <div className="space-y-4">
            {interviews.map((interview) => (
              <div
                className={`group flex items-center justify-between rounded-lg border-l-4 bg-workflow-ivory p-4 transition-all hover:shadow-sm ${interview.border}`}
                key={`${interview.name}-${interview.time}`}
              >
                <div className="flex items-center gap-3">
                  <div className="min-w-[40px] text-center">
                    <p className="text-[10px] font-bold uppercase text-outline">{interview.month}</p>
                    <p className="text-xl font-bold leading-tight text-on-surface">{interview.day}</p>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-on-surface">{interview.name}</p>
                    <p className="text-sm text-on-surface-variant">{interview.role}</p>
                    <p className="mt-1 flex items-center gap-1 text-sm text-outline">
                      <Icon className="h-3.5 w-3.5" name="clock" />
                      {interview.time}
                    </p>
                  </div>
                </div>
                <button
                  className="rounded-full p-2 text-teal-command opacity-0 transition-all hover:bg-teal-command/10 group-hover:opacity-100"
                  type="button"
                >
                  <Icon className="h-4 w-4" name="arrow" />
                </button>
              </div>
            ))}
          </div>

          <div className="mt-6 border-t border-border-warm pt-6">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-on-surface">Quick Stats</h3>
              <span className="text-xs font-semibold text-outline">This Week</span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-lg bg-surface-container-low p-3 text-center">
                <p className="text-xl font-bold text-teal-command">18</p>
                <p className="text-[10px] font-bold uppercase text-outline">Conducted</p>
              </div>
              <div className="rounded-lg bg-surface-container-low p-3 text-center">
                <p className="text-xl font-bold text-revision">04</p>
                <p className="text-[10px] font-bold uppercase text-outline">Rescheduled</p>
              </div>
            </div>
          </div>
        </Card>
      </section>

      <Card className="p-6">
        <h2 className="mb-6 text-xl font-semibold text-on-surface">Recent Activity</h2>
        <div className="relative space-y-6 before:absolute before:bottom-2 before:left-[11px] before:top-2 before:w-0.5 before:bg-border-warm">
          {activity.map((item) => (
            <div className="relative pl-8" key={item.time}>
              <div
                className={`absolute left-0 top-1 flex h-6 w-6 items-center justify-center rounded-full border-4 border-clean-surface ${item.iconClass}`}
              >
                <Icon className="h-3 w-3 text-white" name={item.icon} />
              </div>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-sm leading-6 text-on-surface">{item.text}</p>
                  <p className="mt-0.5 text-sm text-outline">{item.time}</p>
                </div>
                <button
                  className="w-fit rounded-lg p-1 text-outline transition hover:bg-surface-container hover:text-teal-command"
                  type="button"
                >
                  <Icon className="h-4 w-4" name="more" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <button
        className="fixed bottom-8 right-8 z-20 flex h-14 w-14 items-center justify-center rounded-full bg-teal-command text-white shadow-lg transition hover:scale-105 hover:bg-primary active:scale-95"
        onClick={() => navigate('/dept-head/create-request')}
        title="New Requisition"
        type="button"
      >
        <Icon className="h-7 w-7" name="plus" />
      </button>
    </div>
  );
};
