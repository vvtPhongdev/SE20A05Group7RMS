import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { apiRequest } from '../../../lib/api';
import { HRActionButton, HRCard, HRInlineAlert, HRLoadingState, HRPageHeader } from '../components';

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

interface ApplicationApiItem {
  id: string;
  requestId: string;
  candidateId: string;
  status: string;
  candidate: {
    id: string;
    fullName: string;
    structuredData?: Record<string, unknown> | null;
  };
}

interface UserOption {
  id: string;
  displayName: string;
  email?: string;
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

const getInitials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('') || 'CV';

const buildInterviewerOptions = (
  users: UserOption[],
  currentUser?: { id?: string; displayName?: string; email?: string } | null,
) => {
  const options = new Map<string, UserOption>();
  if (currentUser?.id) {
    options.set(currentUser.id, {
      id: currentUser.id,
      displayName: currentUser.displayName || 'Current user',
      email: currentUser.email,
    });
  }
  users.forEach((item) => options.set(item.id, item));
  return Array.from(options.values());
};

export const HRInterviewSchedule: React.FC = () => {
  const [searchParams] = useSearchParams();
  const { token, user } = useAuth();
  const [filter, setFilter] = useState<InterviewStatus | 'All'>('All');
  const [checking, setChecking] = useState(false);
  const [schedules, setSchedules] = useState<ScheduleWithPosition[]>([]);
  const [requests, setRequests] = useState<RecruitmentRequestApiItem[]>([]);
  const [applications, setApplications] = useState<ApplicationApiItem[]>([]);
  const [interviewerOptions, setInterviewerOptions] = useState<UserOption[]>([]);
  const [selectedRequestId, setSelectedRequestId] = useState('');
  const [selectedCandidateId, setSelectedCandidateId] = useState('');
  const [selectedInterviewerIds, setSelectedInterviewerIds] = useState<string[]>([]);
  const [scheduleDate, setScheduleDate] = useState('');
  const [scheduleTime, setScheduleTime] = useState('');
  const [scheduleDuration, setScheduleDuration] = useState('60');
  const [scheduleLocation, setScheduleLocation] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState('');
  const [actionMessage, setActionMessage] = useState('');
  const scheduleFormRef = useRef<HTMLFormElement>(null);

  const loadScheduleData = async () => {
    setLoading(true);
    setApiError('');
    try {
      const response = await apiRequest<RecruitmentRequestListResponse>(
        '/recruitment-requests?limit=100',
        token,
      );
      const requestList = response.data;
      const [scheduleLists, applicationLists, usersResponse] = await Promise.all([
        Promise.all(
          requestList.map((request) =>
            apiRequest<InterviewSchedule[]>(`/interviews/requests/${request.id}/schedules`, token)
              .then((list) => list.map((schedule) => ({ ...schedule, position: request.position })))
              .catch(() => [] as ScheduleWithPosition[]),
          ),
        ),
        Promise.all(
          requestList.map((request) =>
            apiRequest<ApplicationApiItem[]>(`/applications?requestId=${request.id}`, token).catch(
              () => [] as ApplicationApiItem[],
            ),
          ),
        ),
        apiRequest<{ data: UserOption[] }>('/users/interviewers', token).catch(() => ({
          data: [] as UserOption[],
        })),
      ]);

      setRequests(requestList);
      setApplications(applicationLists.flat());
      setSchedules(scheduleLists.flat().filter((schedule) => schedule.status !== 'CANCELLED'));
      setInterviewerOptions(buildInterviewerOptions(usersResponse.data, user));
      setSelectedRequestId((current) => {
        const requestedId = searchParams.get('requestId');
        if (requestedId && requestList.some((request) => request.id === requestedId)) {
          return requestedId;
        }
        return requestList.some((request) => request.id === current)
          ? current
          : requestList[0]?.id || '';
      });
      setSelectedInterviewerIds((current) =>
        current.length > 0 ? current : user?.id ? [user.id] : [],
      );
    } catch (loadError) {
      setApiError(loadError instanceof Error ? loadError.message : 'Unable to load interviews');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadScheduleData();
  }, [token]);

  const candidateNameById = useMemo(() => {
    const names = new Map<string, string>();
    applications.forEach((application) => {
      names.set(application.candidateId, application.candidate.fullName);
    });
    return names;
  }, [applications]);

  const selectedRequest = useMemo(
    () => requests.find((request) => request.id === selectedRequestId) ?? null,
    [requests, selectedRequestId],
  );

  const candidateOptions = useMemo(() => {
    const scheduledCandidateIds = new Set(
      schedules
        .filter(
          (schedule) =>
            schedule.requestId === selectedRequestId &&
            ['SCHEDULED', 'RESCHEDULED', 'COMPLETED'].includes(schedule.status),
        )
        .map((schedule) => schedule.candidateId),
    );

    return applications
      .filter((application) => application.requestId === selectedRequestId)
      .filter((application) => !scheduledCandidateIds.has(application.candidateId));
  }, [applications, schedules, selectedRequestId]);

  useEffect(() => {
    setSelectedCandidateId((current) => {
      const requestedId = searchParams.get('candidateId');
      if (requestedId && candidateOptions.some((item) => item.candidateId === requestedId)) {
        return requestedId;
      }
      return candidateOptions.some((application) => application.candidateId === current)
        ? current
        : candidateOptions[0]?.candidateId || '';
    });
  }, [candidateOptions, searchParams]);

  const panelAvailability = useMemo(() => {
    const selectedStart =
      scheduleDate && scheduleTime ? new Date(`${scheduleDate}T${scheduleTime}`) : null;
    const selectedEnd = selectedStart
      ? new Date(selectedStart.getTime() + Number(scheduleDuration) * 60_000)
      : null;

    return selectedInterviewerIds.map((interviewerId) => {
      const interviewer = interviewerOptions.find((item) => item.id === interviewerId);
      const conflict =
        selectedStart && selectedEnd
          ? schedules.find((schedule) => {
              if (!['SCHEDULED', 'RESCHEDULED'].includes(schedule.status)) return false;
              if (!schedule.interviewers.includes(interviewerId)) return false;
              const scheduleStart = new Date(schedule.scheduledAt);
              const scheduleEnd = new Date(scheduleStart.getTime() + schedule.duration * 60_000);
              return scheduleStart < selectedEnd && scheduleEnd > selectedStart;
            })
          : null;

      return {
        id: interviewerId,
        name: interviewer?.displayName || `Interviewer ${interviewerId.slice(0, 8)}`,
        status: !selectedStart
          ? 'Select slot'
          : conflict
            ? `Conflict: ${new Date(conflict.scheduledAt).toLocaleTimeString(undefined, {
                hour: '2-digit',
                minute: '2-digit',
              })}`
            : 'Available',
        tone: !selectedStart ? 'text-revision' : conflict ? 'text-error' : 'text-approved',
        surface: !selectedStart
          ? 'bg-revision/10'
          : conflict
            ? 'bg-error-container/20'
            : 'bg-surface-container-low',
      };
    });
  }, [
    interviewerOptions,
    scheduleDate,
    scheduleDuration,
    scheduleTime,
    schedules,
    selectedInterviewerIds,
  ]);

  const interviews: Interview[] = useMemo(
    () =>
      schedules.map((schedule) => {
        const status = STATUS_MAP[schedule.status] ?? 'Scheduled';
        const date = new Date(schedule.scheduledAt);
        const candidateName =
          candidateNameById.get(schedule.candidateId) ||
          `Candidate ${schedule.candidateId.slice(0, 8)}`;
        return {
          id: schedule.id,
          candidate: candidateName,
          initials: getInitials(candidateName),
          position: schedule.position,
          campaign: schedule.position,
          time: `${String(date.getMonth() + 1).padStart(2, '0')}/${String(date.getDate()).padStart(2, '0')} ${date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}`,
          duration: `${schedule.duration} mins`,
          status,
          action: ACTION_MAP[status],
        };
      }),
    [candidateNameById, schedules],
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

    const rescheduleRequests = schedules.filter(
      (schedule) => schedule.status === 'RESCHEDULED',
    ).length;

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
            candidate:
              candidateNameById.get(schedule.candidateId) ||
              `Candidate ${schedule.candidateId.slice(0, 8)}`,
            role: schedule.position,
            tone: STATUS_MAP[schedule.status] ?? 'Scheduled',
          };
        }),
    }));
  }, [candidateNameById, schedules]);

  const handleAvailability = () => {
    setChecking(true);
    setActionMessage('');
    window.setTimeout(() => {
      setChecking(false);
      if (!scheduleDate || !scheduleTime || selectedInterviewerIds.length < 2) {
        setApiError('Select date, time, and at least 2 interviewers before checking availability.');
        return;
      }

      const start = new Date(`${scheduleDate}T${scheduleTime}`);
      const end = new Date(start.getTime() + Number(scheduleDuration) * 60_000);
      const hasConflict = schedules.some((schedule) => {
        if (!['SCHEDULED', 'RESCHEDULED'].includes(schedule.status)) return false;
        const scheduleStart = new Date(schedule.scheduledAt);
        const scheduleEnd = new Date(scheduleStart.getTime() + schedule.duration * 60_000);
        const overlaps = scheduleStart < end && scheduleEnd > start;
        if (!overlaps) return false;
        return (
          schedule.candidateId === selectedCandidateId ||
          schedule.interviewers.some((id) => selectedInterviewerIds.includes(id))
        );
      });

      if (hasConflict) {
        setApiError('Potential conflict found for this candidate or panel member.');
        return;
      }

      setApiError('');
      setActionMessage('No local conflict found. Backend will verify again when sending.');
    }, 800);
  };

  const createSchedule = async () => {
    if (
      !selectedRequestId ||
      !selectedCandidateId ||
      !scheduleDate ||
      !scheduleTime ||
      !scheduleLocation.trim() ||
      selectedInterviewerIds.length < 2
    ) {
      setApiError('Please complete campaign, candidate, interviewers, date, time, and location.');
      return;
    }

    setSubmitting(true);
    setApiError('');
    setActionMessage('');
    try {
      const scheduledAt = new Date(`${scheduleDate}T${scheduleTime}`).toISOString();
      await apiRequest<InterviewSchedule>('/interviews/schedules', token, {
        method: 'POST',
        body: JSON.stringify({
          requestId: selectedRequestId,
          candidateId: selectedCandidateId,
          scheduledAt,
          duration: Number(scheduleDuration),
          location: scheduleLocation.trim(),
          interviewers: selectedInterviewerIds,
        }),
      });
      setActionMessage('Interview invitation sent successfully.');
      setScheduleDate('');
      setScheduleTime('');
      setScheduleLocation('');
      await loadScheduleData();
    } catch (createError) {
      setApiError(createError instanceof Error ? createError.message : 'Unable to send invitation');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-[1440px] space-y-6">
      <HRPageHeader
        eyebrow="HR Manager Portal"
        title="Interview Schedule"
        description="Coordinate interview slots, panel availability, and candidate invitations."
        actions={
          <HRActionButton
            onClick={() => scheduleFormRef.current?.scrollIntoView({ behavior: 'smooth' })}
          >
            <Icon className="h-4 w-4" name="plus" />
            Quick Schedule
          </HRActionButton>
        }
      />

      {apiError && <HRInlineAlert>{apiError}</HRInlineAlert>}
      {actionMessage && (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
          {actionMessage}
        </div>
      )}

      {loading && <HRLoadingState label="Loading interviews..." />}

      <section
        className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4"
        aria-label="Interview schedule metrics"
      >
        {kpis.map((kpi) => (
          <HRCard as="section" className="rounded-lg p-5 shadow-sm" key={kpi.label}>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-ink">
              {kpi.label}
            </p>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="font-mono text-3xl font-bold text-deep-charcoal">{kpi.value}</span>
              <span className={`text-xs font-semibold ${kpi.tone}`}>{kpi.helper}</span>
            </div>
          </HRCard>
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
          <form
            className="space-y-4 p-5"
            ref={scheduleFormRef}
            onSubmit={(event) => event.preventDefault()}
          >
            <label className="block space-y-1.5">
              <span className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-ink">
                Candidate
              </span>
              <select
                className="w-full rounded-lg border border-border-warm bg-workflow-ivory p-2.5 text-sm outline-none transition focus:border-teal-command focus:ring-2 focus:ring-teal-command/20"
                disabled={!selectedRequestId || candidateOptions.length === 0}
                onChange={(event) => setSelectedCandidateId(event.target.value)}
                value={selectedCandidateId}
              >
                {candidateOptions.length === 0 ? (
                  <option value="">No unscheduled candidates</option>
                ) : null}
                {candidateOptions.map((application) => (
                  <option key={application.id} value={application.candidateId}>
                    {application.candidate.fullName} ({application.status})
                  </option>
                ))}
              </select>
            </label>
            <label className="block space-y-1.5">
              <span className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-ink">
                Campaign
              </span>
              <select
                className="w-full rounded-lg border border-border-warm bg-workflow-ivory p-2.5 text-sm outline-none transition focus:border-teal-command focus:ring-2 focus:ring-teal-command/20"
                onChange={(event) => {
                  setSelectedRequestId(event.target.value);
                  setActionMessage('');
                }}
                value={selectedRequestId}
              >
                {requests.length === 0 ? <option value="">No campaigns available</option> : null}
                {requests.map((request) => (
                  <option key={request.id} value={request.id}>
                    {request.position}
                  </option>
                ))}
              </select>
            </label>
            <label className="block space-y-1.5">
              <span className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-ink">
                Interviewers
              </span>
              <select
                className="min-h-[100px] w-full rounded-lg border border-border-warm bg-workflow-ivory p-2.5 text-sm outline-none transition focus:border-teal-command focus:ring-2 focus:ring-teal-command/20"
                multiple
                onChange={(event) =>
                  setSelectedInterviewerIds(
                    Array.from(event.currentTarget.selectedOptions, (option) => option.value),
                  )
                }
                value={selectedInterviewerIds}
              >
                {interviewerOptions.map((interviewer) => (
                  <option key={interviewer.id} value={interviewer.id}>
                    {interviewer.displayName}
                    {interviewer.email ? ` (${interviewer.email})` : ''}
                  </option>
                ))}
              </select>
              <span className="text-xs text-slate-ink">
                Select at least 2 panel members. Hold Ctrl/Cmd to select multiple members.
              </span>
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label className="block space-y-1.5">
                <span className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-ink">
                  Date
                </span>
                <input
                  className="w-full rounded-lg border border-border-warm bg-workflow-ivory p-2 text-sm outline-none focus:border-teal-command focus:ring-2 focus:ring-teal-command/20"
                  onChange={(event) => setScheduleDate(event.target.value)}
                  type="date"
                  value={scheduleDate}
                />
              </label>
              <label className="block space-y-1.5">
                <span className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-ink">
                  Time
                </span>
                <input
                  className="w-full rounded-lg border border-border-warm bg-workflow-ivory p-2 text-sm outline-none focus:border-teal-command focus:ring-2 focus:ring-teal-command/20"
                  onChange={(event) => setScheduleTime(event.target.value)}
                  type="time"
                  value={scheduleTime}
                />
              </label>
            </div>
            <label className="block space-y-1.5">
              <span className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-ink">
                Duration
              </span>
              <select
                className="w-full rounded-lg border border-border-warm bg-workflow-ivory p-2.5 text-sm outline-none focus:border-teal-command focus:ring-2 focus:ring-teal-command/20"
                onChange={(event) => setScheduleDuration(event.target.value)}
                value={scheduleDuration}
              >
                <option value="30">30 Minutes</option>
                <option value="60">60 Minutes</option>
                <option value="90">90 Minutes</option>
                <option value="120">2 Hours</option>
              </select>
            </label>
            <label className="block space-y-1.5">
              <span className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-ink">
                Meeting URL / Location
              </span>
              <input
                className="w-full rounded-lg border border-border-warm bg-workflow-ivory p-2.5 text-sm outline-none focus:border-teal-command focus:ring-2 focus:ring-teal-command/20"
                placeholder="https://meet.recruitflow.com/..."
                onChange={(event) => setScheduleLocation(event.target.value)}
                type="text"
                value={scheduleLocation}
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
                {panelAvailability.map((member) => (
                  <div
                    className={`flex items-center justify-between gap-3 rounded-lg p-2 text-xs ${member.surface}`}
                    key={member.id}
                  >
                    <span className="font-semibold text-deep-charcoal">{member.name}</span>
                    <span className={`font-bold ${member.tone}`}>{member.status}</span>
                  </div>
                ))}
                {panelAvailability.length === 0 ? (
                  <p className="rounded-lg bg-surface-container-low p-2 text-xs font-semibold text-slate-ink">
                    Select at least 2 interviewers.
                  </p>
                ) : null}
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
                className="w-full rounded-lg bg-teal-command py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-primary active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-70"
                disabled={
                  submitting ||
                  !selectedRequest ||
                  !selectedCandidateId ||
                  !scheduleDate ||
                  !scheduleTime ||
                  !scheduleLocation.trim() ||
                  selectedInterviewerIds.length < 2
                }
                onClick={() => void createSchedule()}
                type="submit"
              >
                {submitting ? 'Sending...' : 'Send Invitation'}
              </button>
            </div>
          </form>
        </aside>
      </div>
    </div>
  );
};
