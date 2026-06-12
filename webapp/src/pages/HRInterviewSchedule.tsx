import React, { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { apiRequest } from '../lib/api';

type InterviewStatus = 'Scheduled' | 'Rescheduled' | 'Completed';

type Interview = {
  id: string;
  candidate: string;
  initials: string;
  position: string;
  campaign: string;
  time: string;
  duration: string;
  status: InterviewStatus;
  action: string;
};

type WeekSlot = {
  day: string;
  date: string;
  items: Array<{ time: string; candidate: string; role: string; tone: InterviewStatus }>;
};

interface RecruitmentRequestApiItem {
  id: string;
  position: string;
}

interface RecruitmentRequestListResponse {
  data: RecruitmentRequestApiItem[];
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

interface ScheduleWithPosition extends InterviewSchedule {
  position: string;
}

const STATUS_MAP: Record<string, InterviewStatus> = {
  SCHEDULED: 'Scheduled',
  RESCHEDULED: 'Rescheduled',
  COMPLETED: 'Completed',
};

const ACTION_MAP: Record<InterviewStatus, string> = {
  Scheduled: 'Edit',
  Rescheduled: 'Details',
  Completed: 'Feedback',
};

const formatDateLabel = (date: Date) =>
  date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });

const getWeekDays = () => {
  const today = new Date();
  const dayOfWeek = today.getDay();
  const monday = new Date(today);
  monday.setDate(today.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));

  return Array.from({ length: 5 }, (_, index) => {
    const date = new Date(monday);
    date.setDate(monday.getDate() + index);
    return {
      day: date.toLocaleDateString(undefined, { weekday: 'short' }).toUpperCase(),
      date: formatDateLabel(date).toUpperCase(),
    };
  });
};

const getWeekRange = () => {
  const now = new Date();
  const startOfWeek = new Date(now);
  const day = startOfWeek.getDay();
  startOfWeek.setDate(startOfWeek.getDate() - (day === 0 ? 6 : day - 1));
  startOfWeek.setHours(0, 0, 0, 0);
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(endOfWeek.getDate() + 7);
  return { startOfWeek, endOfWeek };
};

const panel = [
  {
    name: 'David Miller',
    status: 'Conflict: 10:00 AM',
    tone: 'text-error',
    surface: 'bg-error-container/20',
  },
  {
    name: 'Aisha Khan',
    status: 'Available',
    tone: 'text-approved',
    surface: 'bg-surface-container-low',
  },
  {
    name: 'Kevin Smith',
    status: 'Available after 14:00',
    tone: 'text-revision',
    surface: 'bg-revision/10',
  },
];

const iconPaths: Record<string, React.ReactNode> = {
  calendar: (
    <path d="M8 2v4m8-4v4M4 10h16M6 5h12a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2Z" />
  ),
  chevronLeft: <path d="m15 18-6-6 6-6" />,
  chevronRight: <path d="m9 18 6-6-6-6" />,
  download: <path d="M12 3v12m0 0 4-4m-4 4-4-4M4 19h16" />,
  info: <path d="M12 16v-4m0-4h.01M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />,
  warning: (
    <path d="M12 9v4m0 4h.01M10.3 3.9 2.8 17a2 2 0 0 0 1.7 3h15a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" />
  ),
  plus: <path d="M12 5v14m-7-7h14" />,
};

const Icon = ({ name, className = 'h-5 w-5' }: { name: string; className?: string }) => (
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
    {iconPaths[name]}
  </svg>
);

const statusClass: Record<InterviewStatus, string> = {
  Scheduled: 'bg-teal-command/10 text-teal-command',
  Rescheduled: 'bg-revision/10 text-revision',
  Completed: 'bg-slate-ink/10 text-slate-ink',
};

const slotClass: Record<InterviewStatus, string> = {
  Scheduled: 'border-teal-command/20 bg-teal-command/5 text-teal-command',
  Rescheduled: 'border-revision/20 bg-revision/5 text-revision',
  Completed: 'border-slate-ink/20 bg-slate-ink/5 text-slate-ink',
};

export const HRInterviewSchedule: React.FC = () => {
  const { token } = useAuth();
  const [filter, setFilter] = useState<InterviewStatus | 'All'>('All');
  const [checking, setChecking] = useState(false);
  const [schedules, setSchedules] = useState<ScheduleWithPosition[]>([]);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState('');

  useEffect(() => {
    const loadSchedules = async () => {
      setLoading(true);
      setApiError('');
      try {
        const response = await apiRequest<RecruitmentRequestListResponse>(
          '/recruitment-requests?limit=100',
          token,
        );
        const scheduleLists = await Promise.all(
          response.data.map((request) =>
            apiRequest<InterviewSchedule[]>(`/interviews/requests/${request.id}/schedules`, token)
              .then((list) =>
                list.map((schedule) => ({ ...schedule, position: request.position })),
              )
              .catch(() => [] as ScheduleWithPosition[]),
          ),
        );
        setSchedules(scheduleLists.flat().filter((schedule) => schedule.status !== 'CANCELLED'));
      } catch (loadError) {
        setApiError(loadError instanceof Error ? loadError.message : 'Unable to load interviews');
      } finally {
        setLoading(false);
      }
    };
    void loadSchedules();
  }, [token]);

  const interviews: Interview[] = useMemo(
    () =>
      schedules.map((schedule) => {
        const status = STATUS_MAP[schedule.status] ?? 'Scheduled';
        const date = new Date(schedule.scheduledAt);
        return {
          id: schedule.id,
          candidate: `Candidate ${schedule.candidateId.slice(0, 8)}`,
          initials: schedule.id.slice(0, 2).toUpperCase(),
          position: schedule.position,
          campaign: schedule.position,
          time: `${String(date.getMonth() + 1).padStart(2, '0')}/${String(date.getDate()).padStart(2, '0')} ${date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}`,
          duration: `${schedule.duration} mins`,
          status,
          action: ACTION_MAP[status],
        };
      }),
    [schedules],
  );

  const visibleInterviews = useMemo(() => {
    if (filter === 'All') return interviews;
    return interviews.filter((interview) => interview.status === filter);
  }, [filter, interviews]);

  const kpis = useMemo(() => {
    const { startOfWeek, endOfWeek } = getWeekRange();
    const now = new Date();

    const scheduledThisWeek = schedules.filter((schedule) => {
      const date = new Date(schedule.scheduledAt);
      return (
        date >= startOfWeek &&
        date < endOfWeek &&
        (schedule.status === 'SCHEDULED' || schedule.status === 'RESCHEDULED')
      );
    }).length;

    const rescheduleRequests = schedules.filter((schedule) => schedule.status === 'RESCHEDULED')
      .length;

    const awaitingConfirmation = schedules.filter(
      (schedule) => schedule.status === 'SCHEDULED' && new Date(schedule.scheduledAt) > now,
    ).length;

    return [
      {
        label: 'Scheduled This Week',
        value: String(scheduledThisWeek).padStart(2, '0'),
        helper: 'Across all requests',
        tone: 'text-approved',
      },
      {
        label: 'Awaiting Confirmation',
        value: String(awaitingConfirmation).padStart(2, '0'),
        helper: 'Action needed',
        tone: 'text-revision',
      },
      {
        label: 'Reschedule Requests',
        value: String(rescheduleRequests).padStart(2, '0'),
        helper: 'Urgent',
        tone: 'text-error',
      },
      {
        label: 'Invitations Sent',
        value: String(schedules.length).padStart(2, '0'),
        helper: 'Total scheduled',
        tone: 'text-slate-ink/70',
      },
    ];
  }, [schedules]);

  const weekSlots: WeekSlot[] = useMemo(() => {
    const days = getWeekDays();
    return days.map((day) => ({
      day: day.day,
      date: day.date,
      items: schedules
        .filter((schedule) => {
          const date = new Date(schedule.scheduledAt);
          return formatDateLabel(date).toUpperCase() === day.date;
        })
        .map((schedule) => {
          const date = new Date(schedule.scheduledAt);
          const end = new Date(date.getTime() + schedule.duration * 60000);
          return {
            time: `${date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })} - ${end.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}`,
            candidate: `Candidate ${schedule.candidateId.slice(0, 8)}`,
            role: schedule.position,
            tone: STATUS_MAP[schedule.status] ?? 'Scheduled',
          };
        }),
    }));
  }, [schedules]);

  const handleAvailability = () => {
    setChecking(true);
    window.setTimeout(() => setChecking(false), 800);
  };

  return (
    <div className="mx-auto max-w-[1440px] space-y-6">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-teal-command">
            HR Manager Portal
          </p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-deep-charcoal">
            Interview Schedule
          </h1>
          <p className="mt-1 max-w-[72ch] text-sm leading-6 text-slate-ink">
            Coordinate interview slots, panel availability, and candidate invitations.
          </p>
        </div>
        <button
          className="inline-flex h-10 w-fit items-center gap-2 rounded-lg bg-teal-command px-4 text-sm font-semibold text-white transition hover:bg-primary active:scale-[0.98]"
          type="button"
        >
          <Icon className="h-4 w-4" name="plus" />
          Quick Schedule
        </button>
      </header>

      {apiError && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-rejected">
          {apiError}
        </div>
      )}

      {loading && (
        <div className="rounded-lg border border-border-warm bg-clean-surface px-4 py-3 text-sm text-on-surface-variant">
          Loading interviews...
        </div>
      )}

      <section
        className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4"
        aria-label="Interview schedule metrics"
      >
        {kpis.map((kpi) => (
          <section
            className="rounded-lg border border-border-warm bg-clean-surface p-5 shadow-sm"
            key={kpi.label}
          >
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-ink">
              {kpi.label}
            </p>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="font-mono text-3xl font-bold text-deep-charcoal">{kpi.value}</span>
              <span className={`text-xs font-semibold ${kpi.tone}`}>{kpi.helper}</span>
            </div>
          </section>
        ))}
      </section>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[280px_minmax(0,1fr)_340px]">
        <section className="overflow-hidden rounded-lg border border-border-warm bg-clean-surface shadow-sm xl:sticky xl:top-24">
          <div className="flex items-center justify-between border-b border-border-warm bg-parchment-lift/40 p-4">
            <h2 className="text-sm font-semibold text-deep-charcoal">Week at a Glance</h2>
            <div className="flex gap-2">
              <button
                className="rounded-lg p-1.5 transition hover:bg-surface-container active:scale-[0.98]"
                type="button"
                aria-label="Previous week"
              >
                <Icon className="h-4 w-4" name="chevronLeft" />
              </button>
              <button
                className="rounded-lg p-1.5 transition hover:bg-surface-container active:scale-[0.98]"
                type="button"
                aria-label="Next week"
              >
                <Icon className="h-4 w-4" name="chevronRight" />
              </button>
            </div>
          </div>
          <div className="max-h-[620px] space-y-4 overflow-y-auto p-3">
            {weekSlots.map((day, dayIndex) => (
              <div key={`${day.day}-${day.date}`}>
                <div
                  className={`mb-2 border-l-2 bg-surface-container-low px-2 py-1 text-xs font-semibold text-slate-ink ${
                    dayIndex === 0 ? 'border-teal-command' : 'border-transparent'
                  }`}
                >
                  {day.day}, {day.date}
                </div>
                <div className="space-y-2">
                  {day.items.map((item) => (
                    <article
                      className={`rounded-lg border p-3 ${slotClass[item.tone]}`}
                      key={`${day.day}-${item.time}-${item.candidate}`}
                    >
                      <p className="font-mono text-xs font-semibold">{item.time}</p>
                      <p className="mt-1 text-sm font-semibold text-deep-charcoal">
                        {item.candidate}
                      </p>
                      <p className="text-xs text-slate-ink">{item.role}</p>
                    </article>
                  ))}
                  {day.items.length === 0 && (
                    <p className="px-2 text-xs text-on-surface-variant">No interviews</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>

        <main className="min-w-0 space-y-4">
          <section className="overflow-hidden rounded-lg border border-border-warm bg-clean-surface shadow-sm">
            <div className="flex flex-col gap-3 border-b border-border-warm p-4 lg:flex-row lg:items-center lg:justify-between">
              <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-deep-charcoal">
                Active Interview Queue
              </h2>
              <div className="flex flex-wrap gap-2">
                {(['All', 'Scheduled', 'Rescheduled', 'Completed'] as const).map((status) => (
                  <button
                    className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition active:scale-[0.98] ${
                      filter === status
                        ? 'border-teal-command bg-teal-command text-white'
                        : 'border-border-warm bg-workflow-ivory text-slate-ink hover:border-teal-command/40'
                    }`}
                    key={status}
                    onClick={() => setFilter(status)}
                    type="button"
                  >
                    {status}
                  </button>
                ))}
                <button
                  className="inline-flex items-center gap-2 rounded-lg border border-border-warm px-3 py-1.5 text-xs font-semibold transition hover:bg-surface-container"
                  type="button"
                >
                  <Icon className="h-4 w-4" name="download" />
                  Export PDF
                </button>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] border-collapse">
                <thead>
                  <tr className="border-b border-border-warm bg-parchment-lift/50 text-left">
                    <th className="p-4 text-xs font-semibold text-slate-ink">Candidate</th>
                    <th className="p-4 text-xs font-semibold text-slate-ink">Position</th>
                    <th className="p-4 text-xs font-semibold text-slate-ink">Time</th>
                    <th className="p-4 text-xs font-semibold text-slate-ink">Status</th>
                    <th className="p-4 text-xs font-semibold text-slate-ink">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-warm/60">
                  {visibleInterviews.map((interview, index) => (
                    <tr
                      className={`${index % 2 === 1 ? 'bg-workflow-ivory/30' : ''} transition hover:bg-surface-container-low`}
                      key={interview.id}
                    >
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-surface-container font-mono text-xs font-bold text-teal-command">
                            {interview.initials}
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-deep-charcoal">
                              {interview.candidate}
                            </p>
                            <p className="font-mono text-xs text-slate-ink">
                              {interview.id.slice(0, 8)}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <p className="text-sm text-deep-charcoal">{interview.position}</p>
                        <p className="text-xs text-slate-ink">{interview.campaign}</p>
                      </td>
                      <td className="p-4">
                        <p className="font-mono text-sm text-deep-charcoal">{interview.time}</p>
                        <p className="font-mono text-xs text-slate-ink">{interview.duration}</p>
                      </td>
                      <td className="p-4">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full px-2 py-1 text-[11px] font-bold uppercase tracking-tight ${statusClass[interview.status]}`}
                        >
                          <span className="h-1.5 w-1.5 rounded-full bg-current" />
                          {interview.status}
                        </span>
                      </td>
                      <td className="p-4">
                        <span className="text-sm font-semibold text-on-surface-variant">
                          {interview.action}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {visibleInterviews.length === 0 && !loading && (
                    <tr>
                      <td className="p-4 text-sm text-on-surface-variant" colSpan={5}>
                        No interviews found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>

          <section className="flex items-start gap-3 rounded-lg border border-border-warm bg-parchment-lift/50 p-4">
            <Icon className="mt-0.5 h-5 w-5 shrink-0 text-teal-command" name="info" />
            <p className="text-sm italic leading-6 text-slate-ink">
              Scheduling requires an approved request and an approved overall campaign plan. Verify
              all panel member calendars before dispatching invites.
            </p>
          </section>
        </main>

        <aside className="overflow-hidden rounded-lg border border-border-warm bg-clean-surface shadow-sm xl:sticky xl:top-24">
          <div className="bg-teal-command p-5 text-white">
            <h2 className="text-sm font-bold uppercase tracking-[0.16em]">
              Schedule New Interview
            </h2>
          </div>
          <form className="space-y-4 p-5" onSubmit={(event) => event.preventDefault()}>
            <label className="block space-y-1.5">
              <span className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-ink">
                Candidate
              </span>
              <select className="w-full rounded-lg border border-border-warm bg-workflow-ivory p-2.5 text-sm outline-none transition focus:border-teal-command focus:ring-2 focus:ring-teal-command/20">
                <option>Select Candidate...</option>
                <option>Sarah Jenkins (Product Designer)</option>
                <option>Marcus Vane (Senior FE Dev)</option>
                <option>Elena Fisher (UX Researcher)</option>
              </select>
            </label>
            <label className="block space-y-1.5">
              <span className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-ink">
                Campaign
              </span>
              <input
                className="w-full cursor-not-allowed rounded-lg border border-border-warm bg-surface-container-low p-2.5 text-sm text-slate-ink"
                readOnly
                type="text"
                value="Growth Expansion 2024"
              />
            </label>
            <label className="block space-y-1.5">
              <span className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-ink">
                Interviewers
              </span>
              <select
                className="min-h-[100px] w-full rounded-lg border border-border-warm bg-workflow-ivory p-2.5 text-sm outline-none transition focus:border-teal-command focus:ring-2 focus:ring-teal-command/20"
                defaultValue={['David Miller (Head of Design)']}
                multiple
              >
                <option>David Miller (Head of Design)</option>
                <option>Aisha Khan (Tech Lead)</option>
                <option>Kevin Smith (Product Manager)</option>
              </select>
              <span className="text-xs text-slate-ink">
                Hold Ctrl/Cmd to select multiple members.
              </span>
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label className="block space-y-1.5">
                <span className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-ink">
                  Date
                </span>
                <input
                  className="w-full rounded-lg border border-border-warm bg-workflow-ivory p-2 text-sm outline-none focus:border-teal-command focus:ring-2 focus:ring-teal-command/20"
                  type="date"
                />
              </label>
              <label className="block space-y-1.5">
                <span className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-ink">
                  Time
                </span>
                <input
                  className="w-full rounded-lg border border-border-warm bg-workflow-ivory p-2 text-sm outline-none focus:border-teal-command focus:ring-2 focus:ring-teal-command/20"
                  type="time"
                />
              </label>
            </div>
            <label className="block space-y-1.5">
              <span className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-ink">
                Duration
              </span>
              <select
                className="w-full rounded-lg border border-border-warm bg-workflow-ivory p-2.5 text-sm outline-none focus:border-teal-command focus:ring-2 focus:ring-teal-command/20"
                defaultValue="60 Minutes"
              >
                <option>30 Minutes</option>
                <option>60 Minutes</option>
                <option>90 Minutes</option>
                <option>2 Hours</option>
              </select>
            </label>
            <label className="block space-y-1.5">
              <span className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-ink">
                Meeting URL / Location
              </span>
              <input
                className="w-full rounded-lg border border-border-warm bg-workflow-ivory p-2.5 text-sm outline-none focus:border-teal-command focus:ring-2 focus:ring-teal-command/20"
                placeholder="https://meet.recruitflow.com/..."
                type="text"
              />
            </label>

            <section className="border-t border-border-warm pt-4">
              <div className="mb-2 flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-[0.14em] text-slate-ink">
                  Panel Availability
                </h3>
                <Icon className="h-4 w-4 text-revision" name="warning" />
              </div>
              <div className="space-y-2">
                {panel.map((member) => (
                  <div
                    className={`flex items-center justify-between gap-3 rounded-lg p-2 text-xs ${member.surface}`}
                    key={member.name}
                  >
                    <span className="font-semibold text-deep-charcoal">{member.name}</span>
                    <span className={`font-bold ${member.tone}`}>{member.status}</span>
                  </div>
                ))}
              </div>
            </section>

            <div className="flex flex-col gap-3 pt-2">
              <button
                className="w-full rounded-lg border border-teal-command py-2.5 text-sm font-semibold text-teal-command transition hover:bg-teal-command/5 active:scale-[0.98] disabled:opacity-70"
                disabled={checking}
                onClick={handleAvailability}
                type="button"
              >
                {checking ? 'Checking...' : 'Check Availability'}
              </button>
              <button
                className="w-full rounded-lg bg-teal-command py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-primary active:scale-[0.98]"
                type="submit"
              >
                Send Invitation
              </button>
            </div>
          </form>
        </aside>
      </div>
    </div>
  );
};
