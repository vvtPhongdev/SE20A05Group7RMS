import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { apiRequest } from '../../../lib/api';
import {
  DeptHeadActionButton,
  DeptHeadCard,
  DeptHeadDashboardPage,
  DeptHeadInlineAlert,
  DeptHeadLoadingState,
  DeptHeadPageHeader,
  DeptHeadSearchInput,
} from '../components';

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

interface RealtimeTrackingItem {
  id: string;
  position: string;
  targetHeadcount: number;
  filledHeadcount: number;
  status: string;
  createdBy: string;
  handler: string;
  createdAt: string;
  updatedAt: string;
}

interface InterviewSchedule {
  id: string;
  requestId: string;
  candidateId: string;
  scheduledAt: string;
  duration: number;
  location: string;
  interviewers: string[];
  status: string;
}

interface UpcomingInterview extends InterviewSchedule {
  position: string;
}

const TERMINAL_STATUSES = ['DRAFT', 'REJECTED', 'CANCELLED', 'CLOSED'];

const STATUS_DISPLAY: Record<string, { label: string; statusClass: string; dotClass: string }> = {
  DRAFT: { label: 'Draft', statusClass: 'bg-surface-container-high text-on-surface-variant', dotClass: 'bg-on-surface-variant' },
  PENDING_REVIEW: { label: 'Pending Review', statusClass: 'bg-pending/10 text-pending', dotClass: 'bg-pending' },
  APPROVED: { label: 'Approved', statusClass: 'bg-approved/10 text-approved', dotClass: 'bg-approved' },
  REJECTED: { label: 'Rejected', statusClass: 'bg-rejected/10 text-rejected', dotClass: 'bg-rejected' },
  REVISION_NEEDED: { label: 'Revision Needed', statusClass: 'bg-revision/10 text-revision', dotClass: 'bg-revision' },
  PLANNING: { label: 'Planning', statusClass: 'bg-teal-command/10 text-teal-command', dotClass: 'bg-teal-command' },
  PLAN_APPROVED: { label: 'Plan Approved', statusClass: 'bg-teal-command/10 text-teal-command', dotClass: 'bg-teal-command' },
  SCREENING: { label: 'Screening', statusClass: 'bg-pending/10 text-pending', dotClass: 'bg-pending' },
  INTERVIEWING: { label: 'Interviewing', statusClass: 'bg-pending/10 text-pending', dotClass: 'bg-pending' },
  INTERVIEW_COMPLETED: { label: 'Interview Completed', statusClass: 'bg-approved/10 text-approved', dotClass: 'bg-approved' },
  OFFER_EXTENDED: { label: 'Offer Extended', statusClass: 'bg-approved/10 text-approved', dotClass: 'bg-approved' },
  OFFER_ACCEPTED: { label: 'Offer Accepted', statusClass: 'bg-approved/10 text-approved', dotClass: 'bg-approved' },
  OFFER_DECLINED: { label: 'Offer Declined', statusClass: 'bg-rejected/10 text-rejected', dotClass: 'bg-rejected' },
  CLOSED: { label: 'Closed', statusClass: 'bg-approved/10 text-approved', dotClass: 'bg-approved' },
  CANCELLED: { label: 'Cancelled', statusClass: 'bg-rejected/10 text-rejected', dotClass: 'bg-rejected' },
};

const PIPELINE_BUCKETS: { label: string; statuses: string[]; ring: string; text: string }[] = [
  { label: 'Sourcing', statuses: ['PENDING_REVIEW', 'APPROVED', 'PLANNING', 'PLAN_APPROVED'], ring: 'border-teal-command/20', text: 'text-teal-command' },
  { label: 'Screening', statuses: ['SCREENING'], ring: 'border-pending/20', text: 'text-pending' },
  { label: 'Interviewing', statuses: ['INTERVIEWING', 'INTERVIEW_COMPLETED'], ring: 'border-revision/20', text: 'text-revision' },
  { label: 'Offer Stage', statuses: ['OFFER_EXTENDED', 'OFFER_ACCEPTED', 'OFFER_DECLINED'], ring: 'border-approved/20', text: 'text-approved' },
];

const getInitials = (name: string) =>
  name
    .split(' ')
    .filter(Boolean)
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

const formatRelativeTime = (iso: string) => {
  const diffMs = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes} minute${minutes === 1 ? '' : 's'} ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`;
  const days = Math.floor(hours / 24);
  return `${days} day${days === 1 ? '' : 's'} ago`;
};

const Card = DeptHeadCard;

export const DeptHeadDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { token, user } = useAuth();
  const [requests, setRequests] = useState<RealtimeTrackingItem[]>([]);
  const [schedules, setSchedules] = useState<UpcomingInterview[]>([]);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState('');

  useEffect(() => {
    const loadDashboard = async () => {
      setLoading(true);
      setApiError('');
      try {
        const data = await apiRequest<RealtimeTrackingItem[]>('/reports/realtime-tracking', token);
        setRequests(data);

        const activeRequests = data.filter((item) => !TERMINAL_STATUSES.includes(item.status));
        const scheduleLists = await Promise.all(
          activeRequests.map((item) =>
            apiRequest<InterviewSchedule[]>(`/interviews/requests/${item.id}/schedules`, token)
              .then((list) => list.map((schedule) => ({ ...schedule, position: item.position })))
              .catch(() => [] as UpcomingInterview[]),
          ),
        );
        setSchedules(scheduleLists.flat());
      } catch (loadError) {
        setApiError(loadError instanceof Error ? loadError.message : 'Unable to load dashboard');
      } finally {
        setLoading(false);
      }
    };
    void loadDashboard();
  }, [token]);

  const activeRequests = useMemo(
    () => requests.filter((item) => !TERMINAL_STATUSES.includes(item.status)),
    [requests],
  );

  const pendingCount = useMemo(
    () => requests.filter((item) => item.status === 'PENDING_REVIEW').length,
    [requests],
  );

  const quarterlyHires = useMemo(
    () => requests.reduce((sum, item) => sum + item.filledHeadcount, 0),
    [requests],
  );

  const targetHeadcount = useMemo(
    () => requests.reduce((sum, item) => sum + item.targetHeadcount, 0),
    [requests],
  );

  const hiresPercent = targetHeadcount > 0 ? Math.round((quarterlyHires / targetHeadcount) * 100) : 0;

  const interviewsToday = useMemo(() => {
    const today = new Date().toDateString();
    return schedules.filter((schedule) => new Date(schedule.scheduledAt).toDateString() === today)
      .length;
  }, [schedules]);

  const metrics = [
    {
      label: 'Active Requests',
      value: String(activeRequests.length).padStart(2, '0'),
      helper: `${pendingCount} pending approval`,
      icon: 'assignment' as IconName,
      iconClass: 'bg-surface-container-high text-teal-command',
      trend: '',
      trendClass: 'text-approved',
    },
    {
      label: 'Pending Approval',
      value: String(pendingCount).padStart(2, '0'),
      helper: 'Awaiting review',
      icon: 'pending' as IconName,
      iconClass: 'bg-error-container text-error',
      trend: pendingCount > 0 ? 'Action req.' : '',
      trendClass: 'text-revision',
    },
    {
      label: 'Interviews Today',
      value: String(interviewsToday).padStart(2, '0'),
      helper: interviewsToday > 0 ? 'Check your calendar' : 'No interviews scheduled',
      icon: 'event' as IconName,
      iconClass: 'bg-surface-container-high text-pending',
      trend: interviewsToday > 0 ? 'Today' : '',
      trendClass: 'rounded-full bg-pending/10 px-2 py-0.5 text-[10px] font-bold uppercase text-pending',
    },
    {
      label: 'Quarterly Hires',
      value: String(quarterlyHires).padStart(2, '0'),
      helper: `${hiresPercent}% of target reached`,
      icon: 'personAdd' as IconName,
      iconClass: 'bg-surface-container-high text-approved',
      trend: `Goal: ${targetHeadcount}`,
      trendClass: 'text-on-surface-variant',
    },
  ];

  const pipelineStages = PIPELINE_BUCKETS.map((bucket) => ({
    label: bucket.label,
    value: String(requests.filter((item) => bucket.statuses.includes(item.status)).length).padStart(2, '0'),
    ring: bucket.ring,
    text: bucket.text,
  }));

  const roles = activeRequests.slice(0, 5).map((item) => {
    const display = STATUS_DISPLAY[item.status] ?? STATUS_DISPLAY.APPROVED;
    return {
      id: item.id,
      role: item.position,
      applicants: `${item.filledHeadcount}/${item.targetHeadcount}`,
      status: display!.label,
      statusClass: display!.statusClass,
      dotClass: display!.dotClass,
      manager: item.handler,
      initials: getInitials(item.handler),
    };
  });

  const upcomingInterviews = useMemo(() => {
    const now = new Date();
    const borders = ['border-teal-command', 'border-pending', 'border-revision'];
    return schedules
      .filter((schedule) => schedule.status !== 'CANCELLED' && new Date(schedule.scheduledAt) >= now)
      .sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime())
      .slice(0, 3)
      .map((schedule, index) => {
        const start = new Date(schedule.scheduledAt);
        const end = new Date(start.getTime() + schedule.duration * 60000);
        return {
          id: schedule.id,
          day: String(start.getDate()).padStart(2, '0'),
          month: start.toLocaleDateString(undefined, { month: 'short' }).toUpperCase(),
          name: `Candidate ${schedule.candidateId.slice(0, 8)}`,
          role: schedule.position,
          time: `${start.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })} - ${end.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}`,
          border: borders[index % borders.length],
        };
      });
  }, [schedules]);

  const recentActivity = useMemo(
    () =>
      [...requests]
        .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
        .slice(0, 3)
        .map((item) => {
          const display = STATUS_DISPLAY[item.status] ?? STATUS_DISPLAY.APPROVED;
          const icon: IconName =
            item.status === 'OFFER_ACCEPTED' || item.status === 'CLOSED'
              ? 'check'
              : item.status === 'INTERVIEWING' || item.status === 'INTERVIEW_COMPLETED'
                ? 'calendar'
                : 'person';
          const iconClass =
            item.status === 'OFFER_ACCEPTED' || item.status === 'CLOSED'
              ? 'bg-approved'
              : item.status === 'REVISION_NEEDED' || item.status === 'REJECTED'
                ? 'bg-revision'
                : 'bg-pending';
          return {
            id: item.id,
            icon,
            iconClass,
            text: (
              <>
                <span className="font-bold">{item.position}</span> request is now{' '}
                <span className="font-medium">{display!.label}</span>.
              </>
            ),
            time: formatRelativeTime(item.updatedAt),
          };
        }),
    [requests],
  );

  return (
    <DeptHeadDashboardPage>
      <DeptHeadPageHeader
        title="Department Dashboard"
        actions={
          <DeptHeadSearchInput
            className="w-full lg:w-80"
            label="Search requests and candidates"
            onChange={() => undefined}
            placeholder="Search requests, candidates..."
            value=""
          />
        }
      />

      {apiError && <DeptHeadInlineAlert>{apiError}</DeptHeadInlineAlert>}

      {loading && <DeptHeadLoadingState label="Loading dashboard..." />}

      <DeptHeadPageHeader
        eyebrow="Today"
        title={`Good morning, ${user?.displayName ?? 'there'}`}
        description={new Date().toLocaleDateString(undefined, {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        })}
        actions={
          <>
            <DeptHeadActionButton variant="secondary">
              <Icon className="h-4 w-4" name="download" />
              Export Report
            </DeptHeadActionButton>
            <DeptHeadActionButton>
              <Icon className="h-4 w-4" name="refresh" />
              Refresh Data
            </DeptHeadActionButton>
          </>
        }
      />

      <section className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric) => (
          <Card className="flex min-h-[178px] flex-col p-6" key={metric.label}>
            <div className="mb-4 flex items-start justify-between">
              <span className={`rounded-lg p-2 ${metric.iconClass}`}>
                <Icon name={metric.icon} />
              </span>
              {metric.trend && (
                <span className={`text-xs font-semibold ${metric.trendClass}`}>{metric.trend}</span>
              )}
            </div>
            <p className="mb-1 text-sm font-medium text-on-surface-variant">{metric.label}</p>
            <h3 className="text-[32px] font-semibold leading-none text-on-surface">{metric.value}</h3>
            {metric.label === 'Quarterly Hires' ? (
              <>
                <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-surface-container-high">
                  <div
                    className="h-full rounded-full bg-teal-command"
                    style={{ width: `${Math.min(100, hiresPercent)}%` }}
                  />
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
            <table className="w-full min-w-[680px] text-left">
              <thead className="border-b border-border-warm">
                <tr>
                  <th className="px-2 py-3 text-xs font-semibold uppercase tracking-wider text-outline">
                    Role Name
                  </th>
                  <th className="px-2 py-3 text-xs font-semibold uppercase tracking-wider text-outline">
                    Applicants
                  </th>
                  <th className="px-2 py-3 text-xs font-semibold uppercase tracking-wider text-outline">
                    Status
                  </th>
                  <th className="px-2 py-3 text-xs font-semibold uppercase tracking-wider text-outline">
                    Hiring Manager
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-warm/30">
                {roles.map((role) => (
                  <tr
                    className="cursor-pointer transition-colors hover:bg-workflow-ivory"
                    key={role.id}
                    onClick={() => navigate('/dept-head/requests')}
                  >
                    <td className="px-2 py-4">
                      <p className="text-sm font-semibold text-on-surface">{role.role}</p>
                      <p className="text-sm text-outline">{role.id}</p>
                    </td>
                    <td className="px-2 py-4">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-on-surface">{role.applicants}</span>
                      </div>
                    </td>
                    <td className="px-2 py-4">
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${role.statusClass}`}
                      >
                        <span className={`h-1.5 w-1.5 rounded-full ${role.dotClass}`} />
                        {role.status}
                      </span>
                    </td>
                    <td className="px-2 py-4">
                      <div className="flex items-center gap-2">
                        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-surface-container-high text-[10px] font-bold text-teal-command">
                          {role.initials}
                        </span>
                        <span className="text-sm text-on-surface">{role.manager}</span>
                      </div>
                    </td>
                  </tr>
                ))}
                {roles.length === 0 && !loading && (
                  <tr>
                    <td className="px-2 py-6 text-sm text-on-surface-variant" colSpan={4}>
                      No active recruitment requests yet.
                    </td>
                  </tr>
                )}
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
            {upcomingInterviews.map((interview) => (
              <div
                className={`group flex items-center justify-between rounded-lg border-l-4 bg-workflow-ivory p-4 transition-all hover:shadow-sm ${interview.border}`}
                key={interview.id}
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
                  onClick={() => navigate('/dept-head/interviews')}
                  type="button"
                >
                  <Icon className="h-4 w-4" name="arrow" />
                </button>
              </div>
            ))}
            {upcomingInterviews.length === 0 && !loading && (
              <p className="text-sm text-on-surface-variant">No upcoming interviews scheduled.</p>
            )}
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
          {recentActivity.map((item) => (
            <div className="relative pl-8" key={item.id}>
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
          {recentActivity.length === 0 && !loading && (
            <p className="text-sm text-on-surface-variant">No recent activity yet.</p>
          )}
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
    </DeptHeadDashboardPage>
  );
};
