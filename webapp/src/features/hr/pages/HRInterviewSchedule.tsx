import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { ApiError, apiRequest } from '../../../lib/api';
import { HRActionButton, HRCard, HRInlineAlert, HRLoadingState, HRPageHeader } from '../components';
import {
  Combobox,
  ComboboxChip,
  ComboboxChips,
  ComboboxChipsInput,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
  ComboboxTrigger,
  ComboboxValue,
  useComboboxAnchor,
} from '@/components/ui/combobox';

type InterviewStatus = 'Scheduled' | 'Rescheduled' | 'Completed';
type InterviewMode = 'ONLINE' | 'OFFLINE';

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
    email?: string;
    structuredData?: Record<string, unknown> | null;
  };
}

interface UserOption {
  id: string;
  displayName: string;
  email?: string;
}

type SelectOption = {
  value: string;
  label: string;
};

interface GoogleCalendarAuthUrlResponse {
  authorizationUrl: string;
}

interface GoogleMeetResponse {
  meetLink: string;
  eventId?: string;
  htmlLink?: string;
  attendees?: string[];
  reminderMinutesBefore?: number;
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
  video: (
    <path d="M4 7.5A2.5 2.5 0 0 1 6.5 5h7A2.5 2.5 0 0 1 16 7.5v9a2.5 2.5 0 0 1-2.5 2.5h-7A2.5 2.5 0 0 1 4 16.5v-9Zm12 3.25 4-2.25v7l-4-2.25" />
  ),
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

const isGoogleMeetUrl = (value: string) => /^https:\/\/meet\.google\.com\/.+/i.test(value.trim());

const toDateInputValue = (value: string) => {
  const date = new Date(value);
  const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return localDate.toISOString().slice(0, 10);
};

const toTimeInputValue = (value: string) => {
  const date = new Date(value);
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
};

const normalizeEmailList = (emails: Array<string | undefined>) =>
  Array.from(
    new Set(
      emails
        .map((email) => email?.trim().toLowerCase())
        .filter((email): email is string =>
          Boolean(email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)),
        ),
    ),
  );

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

const InterviewScheduleCombobox = ({
  disabled = false,
  label,
  onChange,
  options,
  placeholder,
  value,
}: {
  disabled?: boolean;
  label: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  placeholder: string;
  value: string;
}) => {
  const [inputValue, setInputValue] = useState('');
  const [open, setOpen] = useState(false);
  const selectedLabel = options.find((option) => option.value === value)?.label ?? placeholder;

  return (
    <label className="block min-w-0 space-y-1.5">
      <span className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-ink">
        {label}
      </span>
      <Combobox
        disabled={disabled}
        inputValue={inputValue}
        items={options}
        itemToStringLabel={(option) => option.label}
        itemToStringValue={(option) => option.value}
        onInputValueChange={setInputValue}
        onOpenChange={(nextOpen) => {
          setOpen(nextOpen);
          if (nextOpen) setInputValue('');
        }}
        onValueChange={(nextValue) => {
          onChange(nextValue?.value ?? '');
          setOpen(false);
        }}
        open={open}
        value={options.find((option) => option.value === value) ?? null}
      >
        <ComboboxTrigger className="flex min-h-10 w-full min-w-0 items-center justify-between rounded-lg border border-border-warm bg-workflow-ivory px-3 py-2 text-left text-sm text-deep-charcoal outline-none transition hover:bg-surface-container-low focus:border-teal-command focus:ring-2 focus:ring-teal-command/20 disabled:cursor-not-allowed disabled:opacity-50">
          <span className="min-w-0 break-words text-left">{selectedLabel}</span>
        </ComboboxTrigger>
        <ComboboxContent className="max-h-64 min-w-0">
          <ComboboxInput
            className="w-full"
            placeholder={`Search ${label.toLowerCase()}...`}
            showClear
            showTrigger={false}
          />
          <ComboboxEmpty>No matching options.</ComboboxEmpty>
          <ComboboxList>
            {(option: SelectOption) => (
              <ComboboxItem key={option.value} value={option}>
                {option.label}
              </ComboboxItem>
            )}
          </ComboboxList>
        </ComboboxContent>
      </Combobox>
    </label>
  );
};

const InterviewScheduleMultiCombobox = ({
  label,
  onChange,
  options,
  placeholder,
  values,
}: {
  label: string;
  onChange: (values: string[]) => void;
  options: SelectOption[];
  placeholder: string;
  values: string[];
}) => {
  const [inputValue, setInputValue] = useState('');
  const [open, setOpen] = useState(false);
  const anchor = useComboboxAnchor();
  const selectedOptions = options.filter((option) => values.includes(option.value));

  return (
    <label className="block min-w-0 space-y-1.5">
      <span className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-ink">
        {label}
      </span>
      <Combobox
        inputValue={inputValue}
        items={options}
        itemToStringLabel={(option) => option.label}
        itemToStringValue={(option) => option.value}
        multiple
        onInputValueChange={setInputValue}
        onOpenChange={setOpen}
        onValueChange={(nextValues) => onChange(nextValues.map((option) => option.value))}
        open={open}
        value={selectedOptions}
      >
        <div
          className="min-h-10 rounded-lg border border-border-warm bg-workflow-ivory px-2 transition focus-within:border-teal-command focus-within:ring-2 focus-within:ring-teal-command/20"
          ref={anchor}
        >
          <ComboboxChips className="max-h-28 min-h-9 overflow-y-auto border-0 bg-transparent px-0 py-1 shadow-none focus-within:ring-0">
            <ComboboxValue>
              {(selected: SelectOption[]) => (
                <>
                  {selected.map((option) => (
                    <ComboboxChip
                      className="rounded-full bg-teal-command/10 px-2 text-xs font-semibold text-teal-command"
                      key={option.value}
                    >
                      {option.label}
                    </ComboboxChip>
                  ))}
                  <ComboboxChipsInput
                    className="min-h-7 min-w-28 px-1 text-sm text-deep-charcoal placeholder:text-on-surface-variant"
                    onFocus={() => setOpen(true)}
                    placeholder={selected.length ? 'Add more...' : placeholder}
                  />
                </>
              )}
            </ComboboxValue>
          </ComboboxChips>
        </div>
        <ComboboxContent anchor={anchor}>
          <ComboboxEmpty>No matching options.</ComboboxEmpty>
          <ComboboxList>
            {(option: SelectOption) => (
              <ComboboxItem key={option.value} value={option}>
                {option.label}
              </ComboboxItem>
            )}
          </ComboboxList>
        </ComboboxContent>
      </Combobox>
    </label>
  );
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
  const [selectedCandidateIds, setSelectedCandidateIds] = useState<string[]>([]);
  const [selectedInterviewerIds, setSelectedInterviewerIds] = useState<string[]>([]);
  const [selectedQueueScheduleId, setSelectedQueueScheduleId] = useState('');
  const [rescheduleReason, setRescheduleReason] = useState('');
  const [scheduleDate, setScheduleDate] = useState('');
  const [scheduleTime, setScheduleTime] = useState('');
  const [scheduleDuration, setScheduleDuration] = useState('60');
  const [scheduleLocation, setScheduleLocation] = useState('');
  const [interviewMode, setInterviewMode] = useState<InterviewMode>('ONLINE');
  const [submitting, setSubmitting] = useState(false);
  const [creatingMeet, setCreatingMeet] = useState(false);
  const [connectingGoogle, setConnectingGoogle] = useState(false);
  const [needsGoogleConnection, setNeedsGoogleConnection] = useState(false);
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

  const selectedApplications = useMemo(
    () =>
      selectedCandidateIds
        .map((candidateId) =>
          applications.find((application) => application.candidateId === candidateId),
        )
        .filter((application): application is ApplicationApiItem => Boolean(application)),
    [applications, selectedCandidateIds],
  );

  const selectedQueueSchedule = useMemo(
    () => schedules.find((schedule) => schedule.id === selectedQueueScheduleId) ?? null,
    [schedules, selectedQueueScheduleId],
  );
  // Existing schedules are created/rescheduled only after their invitation has been dispatched.
  // A selected existing schedule must not create a duplicate invitation.
  const hasSentInvitation = Boolean(selectedQueueSchedule);

  const selectedQueueApplication = useMemo(
    () =>
      selectedQueueSchedule
        ? (applications.find(
            (application) => application.candidateId === selectedQueueSchedule.candidateId,
          ) ?? null)
        : null,
    [applications, selectedQueueSchedule],
  );

  const selectQueueSchedule = (schedule: ScheduleWithPosition) => {
    setSelectedQueueScheduleId(schedule.id);
    setSelectedRequestId(schedule.requestId);
    setSelectedCandidateIds([schedule.candidateId]);
    setSelectedInterviewerIds(schedule.interviewers);
    setScheduleDate(toDateInputValue(schedule.scheduledAt));
    setScheduleTime(toTimeInputValue(schedule.scheduledAt));
    setScheduleDuration(String(schedule.duration));
    setScheduleLocation(schedule.location);
    setInterviewMode(isGoogleMeetUrl(schedule.location) ? 'ONLINE' : 'OFFLINE');
    setRescheduleReason(
      schedule.status === 'RESCHEDULED' ? 'Rescheduling requested for this interview.' : '',
    );
    setApiError('');
    setActionMessage('');
  };

  useEffect(() => {
    const scheduleId = searchParams.get('scheduleId');
    const schedule = scheduleId ? schedules.find((item) => item.id === scheduleId) : null;
    if (schedule && schedule.id !== selectedQueueScheduleId) selectQueueSchedule(schedule);
  }, [schedules, searchParams, selectedQueueScheduleId]);

  const candidateOptions = useMemo(() => {
    const scheduledCandidateIds = new Set(
      schedules
        .filter(
          (schedule) =>
            schedule.requestId === selectedRequestId &&
            ['SCHEDULED', 'COMPLETED'].includes(schedule.status),
        )
        .map((schedule) => schedule.candidateId),
    );

    return applications
      .filter((application) => application.requestId === selectedRequestId)
      .filter((application) => !scheduledCandidateIds.has(application.candidateId));
  }, [applications, schedules, selectedRequestId]);

  const campaignSelectOptions = useMemo(
    () => requests.map((request) => ({ value: request.id, label: request.position })),
    [requests],
  );

  const candidateSelectOptions = useMemo(
    () =>
      candidateOptions.map((application) => ({
        value: application.candidateId,
        label: `${application.candidate.fullName} (${application.status})`,
      })),
    [candidateOptions],
  );

  const interviewerSelectOptions = useMemo(
    () =>
      interviewerOptions.map((interviewer) => ({
        value: interviewer.id,
        label: interviewer.email
          ? `${interviewer.displayName} (${interviewer.email})`
          : interviewer.displayName,
      })),
    [interviewerOptions],
  );

  useEffect(() => {
    setSelectedCandidateIds((current) => {
      const requestedId = searchParams.get('candidateId');
      if (requestedId && candidateOptions.some((item) => item.candidateId === requestedId)) {
        return [requestedId];
      }
      const requestedIds = searchParams
        .get('candidateIds')
        ?.split(',')
        .filter((candidateId) => candidateOptions.some((item) => item.candidateId === candidateId));
      if (requestedIds?.length) {
        return [...new Set(requestedIds)];
      }
      const availableCandidateIds = new Set(
        candidateOptions.map((application) => application.candidateId),
      );
      const retained = current.filter((candidateId) => availableCandidateIds.has(candidateId));
      return retained.length
        ? retained
        : candidateOptions[0]
          ? [candidateOptions[0].candidateId]
          : [];
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
          selectedCandidateIds.includes(schedule.candidateId) ||
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

  const connectGoogleCalendar = async () => {
    setConnectingGoogle(true);
    setApiError('');
    setActionMessage('');
    const consentWindow = window.open('', '_blank', 'noopener,noreferrer');
    try {
      const response = await apiRequest<GoogleCalendarAuthUrlResponse>(
        '/google-calendar/auth-url',
        token,
      );
      if (consentWindow) {
        consentWindow.location.href = response.authorizationUrl;
      } else {
        window.location.href = response.authorizationUrl;
      }
      setActionMessage('Complete Google consent in the new tab, then return and create the Meet.');
    } catch (connectError) {
      consentWindow?.close();
      setApiError(
        connectError instanceof Error ? connectError.message : 'Unable to start Google connection',
      );
    } finally {
      setConnectingGoogle(false);
    }
  };

  const createGoogleMeet = async () => {
    if (!selectedRequest || selectedApplications.length === 0 || !scheduleDate || !scheduleTime) {
      setApiError(
        'Select campaign, at least one candidate, date, and time before creating Google Meet.',
      );
      return;
    }

    const start = new Date(`${scheduleDate}T${scheduleTime}`);
    const duration = Number(scheduleDuration);
    const end = new Date(start.getTime() + duration * 60_000);

    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      setApiError('Date or time is not valid.');
      return;
    }

    setCreatingMeet(true);
    setApiError('');
    setActionMessage('');
    setNeedsGoogleConnection(false);
    try {
      const selectedInterviewerEmails = selectedInterviewerIds.map(
        (interviewerId) =>
          interviewerOptions.find((interviewer) => interviewer.id === interviewerId)?.email,
      );
      const attendees = normalizeEmailList([
        ...selectedApplications.map((application) => application.candidate.email),
        ...selectedInterviewerEmails,
      ]);
      const candidateNames = selectedApplications.map(
        (application) => application.candidate.fullName,
      );

      const response = await apiRequest<GoogleMeetResponse>('/google-calendar/meet', token, {
        method: 'POST',
        body: JSON.stringify({
          title: `Interview - ${selectedRequest.position}`,
          description: [
            `Candidate${candidateNames.length > 1 ? 's' : ''}: ${candidateNames.join(', ')}`,
            `Position: ${selectedRequest.position}`,
            `Duration: ${duration} minutes`,
          ].join('\n'),
          startIso: start.toISOString(),
          endIso: end.toISOString(),
          attendees,
          reminderMinutesBefore: 30,
        }),
      });

      setInterviewMode('ONLINE');
      setScheduleLocation(response.meetLink);
      setActionMessage(
        attendees.length > 0
          ? 'Google Meet created. Calendar invite emails include the Meet link and a 30-minute reminder.'
          : 'Google Meet created and added to the interview location.',
      );
    } catch (meetError) {
      if (
        meetError instanceof ApiError &&
        meetError.status === 400 &&
        /Google Calendar is not connected|reconnect Google Calendar|authorization expired|lacks Calendar permission/i.test(
          meetError.message,
        )
      ) {
        setNeedsGoogleConnection(true);
        setApiError('Connect or reconnect Google Calendar before creating a Meet automatically.');
        return;
      }
      setApiError(meetError instanceof Error ? meetError.message : 'Unable to create Google Meet');
    } finally {
      setCreatingMeet(false);
    }
  };

  const createSchedule = async () => {
    if (hasSentInvitation) {
      setActionMessage('The invitation for this schedule has already been sent.');
      return;
    }

    if (
      !selectedRequestId ||
      selectedCandidateIds.length === 0 ||
      !scheduleDate ||
      !scheduleTime ||
      !scheduleLocation.trim() ||
      selectedInterviewerIds.length < 2
    ) {
      setApiError('Please complete campaign, candidate, interviewers, date, time, and location.');
      return;
    }

    if (interviewMode === 'ONLINE' && !isGoogleMeetUrl(scheduleLocation)) {
      setApiError(
        'Online interviews require a valid Google Meet link, for example https://meet.google.com/abc-defg-hij.',
      );
      return;
    }

    if (selectedQueueSchedule?.status === 'RESCHEDULED' && !rescheduleReason.trim()) {
      setApiError('Provide a reason before rescheduling this interview.');
      return;
    }

    setSubmitting(true);
    setApiError('');
    setActionMessage('');
    try {
      const scheduledAt = new Date(`${scheduleDate}T${scheduleTime}`).toISOString();
      if (selectedQueueSchedule?.status === 'RESCHEDULED') {
        await apiRequest<InterviewSchedule>(
          `/interviews/schedules/${selectedQueueSchedule.id}/reschedule`,
          token,
          {
            method: 'PATCH',
            body: JSON.stringify({
              scheduledAt,
              duration: Number(scheduleDuration),
              location: scheduleLocation.trim(),
              interviewers: selectedInterviewerIds,
              reason: rescheduleReason.trim(),
            }),
          },
        );
      } else {
        await Promise.all(
          selectedCandidateIds.map((candidateId) =>
            apiRequest<InterviewSchedule>('/interviews/schedules', token, {
              method: 'POST',
              body: JSON.stringify({
                requestId: selectedRequestId,
                candidateId,
                scheduledAt,
                duration: Number(scheduleDuration),
                location: scheduleLocation.trim(),
                interviewers: selectedInterviewerIds,
              }),
            }),
          ),
        );
      }
      setActionMessage(
        selectedQueueSchedule?.status === 'RESCHEDULED'
          ? 'Rescheduled invitation sent successfully.'
          : selectedCandidateIds.length > 1
            ? `Interview invitations sent to ${selectedCandidateIds.length} candidates.`
            : 'Interview invitation sent successfully.',
      );
      setScheduleDate('');
      setScheduleTime('');
      setScheduleLocation('');
      setSelectedQueueScheduleId('');
      setRescheduleReason('');
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
                      aria-selected={selectedQueueScheduleId === interview.id}
                      className={`cursor-pointer transition hover:bg-surface-container-low ${
                        interview.status === 'Rescheduled'
                          ? 'border-l-4 border-revision bg-revision/10 hover:bg-revision/15'
                          : index % 2 === 1
                            ? 'bg-workflow-ivory/30'
                            : ''
                      } ${selectedQueueScheduleId === interview.id ? 'bg-teal-command/10' : ''}`}
                      key={interview.id}
                      onClick={() => {
                        const schedule = schedules.find((item) => item.id === interview.id);
                        if (schedule) selectQueueSchedule(schedule);
                      }}
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
                        <button
                          className={`text-sm font-semibold transition hover:underline ${
                            interview.status === 'Rescheduled'
                              ? 'text-revision'
                              : 'text-teal-command'
                          }`}
                          onClick={(event) => {
                            event.stopPropagation();
                            const schedule = schedules.find((item) => item.id === interview.id);
                            if (schedule) {
                              selectQueueSchedule(schedule);
                              scheduleFormRef.current?.scrollIntoView({ behavior: 'smooth' });
                            }
                          }}
                          type="button"
                        >
                          {interview.status === 'Rescheduled' ? 'Reschedule now' : 'View schedule'}
                        </button>
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
            {selectedQueueSchedule ? (
              <section
                className={`min-w-0 overflow-hidden rounded-lg border p-3 ${
                  selectedQueueSchedule.status === 'RESCHEDULED'
                    ? 'border-revision/40 bg-revision/10'
                    : 'border-teal-command/20 bg-teal-command/5'
                }`}
              >
                <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-ink">
                      Selected interview
                    </p>
                    <p className="mt-1 break-words text-sm font-bold text-deep-charcoal">
                      {selectedQueueApplication?.candidate.fullName ??
                        candidateNameById.get(selectedQueueSchedule.candidateId) ??
                        'Candidate'}
                    </p>
                    <p className="break-words text-xs text-slate-ink">
                      <span className="break-all">
                        {selectedQueueApplication?.candidate.email ?? 'Email unavailable'}
                      </span>{' '}
                      · {selectedQueueSchedule.position}
                    </p>
                  </div>
                  <span
                    className={`w-fit shrink-0 self-start rounded-full px-2 py-1 text-[10px] font-bold uppercase tracking-[0.08em] ${
                      statusClass[STATUS_MAP[selectedQueueSchedule.status] ?? 'Scheduled']
                    }`}
                  >
                    {STATUS_MAP[selectedQueueSchedule.status] ?? selectedQueueSchedule.status}
                  </span>
                </div>
                <p className="mt-2 text-xs font-semibold text-slate-ink">
                  Current slot: {new Date(selectedQueueSchedule.scheduledAt).toLocaleString()} ·{' '}
                  {selectedQueueSchedule.duration} mins
                </p>
                {selectedQueueSchedule.status === 'RESCHEDULED' ? (
                  <p className="mt-2 text-xs font-bold text-revision">
                    Action required: choose a new slot and resend the invitation.
                  </p>
                ) : null}
              </section>
            ) : null}
            <InterviewScheduleCombobox
              label="Campaign"
              onChange={(nextRequestId) => {
                setSelectedRequestId(nextRequestId);
                setActionMessage('');
              }}
              options={campaignSelectOptions}
              placeholder={requests.length ? 'Select campaign' : 'No campaigns available'}
              value={selectedRequestId}
            />
            <InterviewScheduleMultiCombobox
              label="Candidates"
              onChange={setSelectedCandidateIds}
              options={candidateSelectOptions}
              placeholder={
                selectedRequestId ? 'Select candidates...' : 'Select a campaign first...'
              }
              values={selectedCandidateIds}
            />
            <InterviewScheduleMultiCombobox
              label="Interviewers"
              onChange={setSelectedInterviewerIds}
              options={interviewerSelectOptions}
              placeholder="Select panel members..."
              values={selectedInterviewerIds}
            />
            <span className="block -mt-2 text-xs text-slate-ink">
              Select at least 2 panel members.
            </span>
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
            <InterviewScheduleCombobox
              label="Duration"
              onChange={setScheduleDuration}
              options={[
                { value: '30', label: '30 Minutes' },
                { value: '60', label: '60 Minutes' },
                { value: '90', label: '90 Minutes' },
                { value: '120', label: '2 Hours' },
              ]}
              placeholder="Select duration"
              value={scheduleDuration}
            />
            <section className="space-y-2">
              <span className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-ink">
                Interview Format
              </span>
              <div className="grid grid-cols-2 gap-2 rounded-lg bg-surface-container-high p-1">
                {(['ONLINE', 'OFFLINE'] as const).map((mode) => (
                  <button
                    aria-pressed={interviewMode === mode}
                    className={`rounded-md border px-3 py-2 text-xs font-bold transition active:scale-[0.98] ${
                      interviewMode === mode
                        ? 'border-teal-command bg-white text-teal-command shadow-sm'
                        : 'border-transparent text-slate-ink hover:bg-white/60'
                    }`}
                    key={mode}
                    onClick={() => {
                      setInterviewMode(mode);
                      setScheduleLocation('');
                      setApiError('');
                      setNeedsGoogleConnection(false);
                    }}
                    type="button"
                  >
                    {mode === 'ONLINE' ? 'Online' : 'Offline'}
                  </button>
                ))}
              </div>
            </section>
            {selectedQueueSchedule?.status === 'RESCHEDULED' ? (
              <label className="block space-y-1.5">
                <span className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-ink">
                  Reschedule reason
                </span>
                <input
                  className="w-full rounded-lg border border-revision/40 bg-revision/5 p-2.5 text-sm outline-none focus:border-revision focus:ring-2 focus:ring-revision/20"
                  onChange={(event) => setRescheduleReason(event.target.value)}
                  value={rescheduleReason}
                />
              </label>
            ) : null}
            <label className="block space-y-1.5">
              <span className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-ink">
                {interviewMode === 'ONLINE' ? 'Google Meet Link' : 'Room / Address'}
              </span>
              <input
                className="w-full rounded-lg border border-border-warm bg-workflow-ivory p-2.5 text-sm outline-none focus:border-teal-command focus:ring-2 focus:ring-teal-command/20"
                placeholder={
                  interviewMode === 'ONLINE'
                    ? 'https://meet.google.com/abc-defg-hij'
                    : 'Room 3A, Building B or full interview address'
                }
                onChange={(event) => setScheduleLocation(event.target.value)}
                type="text"
                value={scheduleLocation}
              />
              <span className="text-xs text-slate-ink">
                {interviewMode === 'ONLINE'
                  ? 'Use the Google Meet URL that candidate and panel members will join.'
                  : 'Enter the physical room number or address for the offline interview.'}
              </span>
            </label>
            {interviewMode === 'ONLINE' ? (
              <div className="flex flex-col gap-2 sm:flex-row">
                <button
                  className="inline-flex min-h-10 flex-1 items-center justify-center gap-2 rounded-lg border border-teal-command bg-white px-3 py-2 text-sm font-semibold text-teal-command transition hover:bg-teal-command/5 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-70"
                  disabled={
                    creatingMeet ||
                    !selectedRequest ||
                    selectedCandidateIds.length === 0 ||
                    !scheduleDate ||
                    !scheduleTime
                  }
                  onClick={() => void createGoogleMeet()}
                  type="button"
                >
                  <Icon className="h-4 w-4" name="video" />
                  {creatingMeet ? 'Creating...' : 'Create Google Meet'}
                </button>
                {needsGoogleConnection ? (
                  <button
                    className="inline-flex min-h-10 flex-1 items-center justify-center rounded-lg bg-teal-command px-3 py-2 text-sm font-semibold text-white transition hover:bg-primary active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-70"
                    disabled={connectingGoogle}
                    onClick={() => void connectGoogleCalendar()}
                    type="button"
                  >
                    {connectingGoogle ? 'Opening...' : 'Connect Google Calendar'}
                  </button>
                ) : null}
              </div>
            ) : null}

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
                  selectedCandidateIds.length === 0 ||
                  !scheduleDate ||
                  !scheduleTime ||
                  !scheduleLocation.trim() ||
                  selectedInterviewerIds.length < 2 ||
                  hasSentInvitation ||
                  (selectedQueueSchedule?.status === 'RESCHEDULED' && !rescheduleReason.trim())
                }
                title={
                  hasSentInvitation
                    ? 'Invitation has already been sent for this schedule.'
                    : undefined
                }
                onClick={() => void createSchedule()}
                type="submit"
              >
                {submitting
                  ? 'Sending...'
                  : hasSentInvitation
                    ? 'Invitation Sent'
                    : selectedQueueSchedule?.status === 'RESCHEDULED'
                      ? 'Resend Rescheduled Invitation'
                      : 'Send Invitation'}
              </button>
            </div>
          </form>
        </aside>
      </div>
    </div>
  );
};
