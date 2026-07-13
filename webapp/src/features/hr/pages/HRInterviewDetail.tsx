import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiRequest } from '../../../lib/api';
import { useAuth } from '../../../context/AuthContext';
import {
  HRActionButton,
  HRCard,
  HRDashboardPage,
  HREmptyState,
  HRInlineAlert,
  HRLoadingState,
  HRPageHeader,
} from '../components';

type ViewMode = 'This Week' | 'This Month';
type SortKey = 'earliest' | 'position';
type AttendanceStatus = 'Accepted' | 'Absent' | 'Pending Confirmation';
type InterviewTone = 'teal' | 'cyan' | 'amber' | 'slate';

type InterviewSchedule = {
  id: string;
  requestId: string;
  candidateId: string;
  scheduledAt: string;
  duration: number;
  location: string;
  interviewers: string[];
  interviewerAttendance?: Record<
    string,
    { response?: 'ACCEPTED' | 'ABSENT'; respondedAt?: string }
  > | null;
  status: string;
};

type RealtimeTrackingItem = { id: string; position: string; status: string };
type ApplicationApiItem = {
  requestId: string;
  candidateId: string;
  candidate: { fullName: string };
};
type UserOption = { id: string; displayName: string; email?: string };
type PanelMember = { id: string; name: string; email?: string; attendance: AttendanceStatus };
type InterviewEvent = {
  id: string;
  dateKey: string;
  date: string;
  day: string;
  time: string;
  scheduledAt: string;
  position: string;
  candidate: string;
  duration: number;
  location: string;
  locationType: 'room' | 'video';
  panel: PanelMember[];
  tone: InterviewTone;
};

const TERMINAL_STATUSES = ['DRAFT', 'REJECTED', 'CANCELLED', 'CLOSED'];
const TONES: InterviewTone[] = ['teal', 'cyan', 'amber', 'slate'];

const toneStyles: Record<InterviewTone, string> = {
  teal: 'border-teal-command bg-primary-container/10 text-teal-command',
  cyan: 'border-pending bg-pending/5 text-pending',
  amber: 'border-revision bg-revision/10 text-revision',
  slate: 'border-slate-ink bg-slate-ink/10 text-slate-ink',
};

const attendanceStyles: Record<AttendanceStatus, string> = {
  Accepted: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  Absent: 'border-rose-200 bg-rose-50 text-rose-700',
  'Pending Confirmation': 'border-amber-200 bg-amber-50 text-amber-800',
};

const getStartOfWeek = (date = new Date()) => {
  const start = new Date(date);
  const day = start.getDay();
  start.setDate(start.getDate() - (day === 0 ? 6 : day - 1));
  start.setHours(0, 0, 0, 0);
  return start;
};

const getPeriodRange = (viewMode: ViewMode) => {
  const today = new Date();
  if (viewMode === 'This Month') {
    return {
      start: new Date(today.getFullYear(), today.getMonth(), 1),
      end: new Date(today.getFullYear(), today.getMonth() + 1, 1),
    };
  }
  const start = getStartOfWeek(today);
  const end = new Date(start);
  end.setDate(start.getDate() + 7);
  return { start, end };
};

const getCalendarDays = (viewMode: ViewMode) => {
  const { start, end } = getPeriodRange(viewMode);
  const dayCount = Math.ceil((end.getTime() - start.getTime()) / 86_400_000);
  return Array.from({ length: dayCount }, (_, index) => {
    const date = new Date(start);
    date.setDate(start.getDate() + index);
    return {
      day: date.toLocaleDateString(undefined, { weekday: 'short' }),
      date: date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
      dateKey: date.toDateString(),
    };
  });
};

const getAttendance = (response?: 'ACCEPTED' | 'ABSENT'): AttendanceStatus =>
  response === 'ACCEPTED'
    ? 'Accepted'
    : response === 'ABSENT'
      ? 'Absent'
      : 'Pending Confirmation';

export const HRInterviewDetail: React.FC = () => {
  const { token, user } = useAuth();
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState<ViewMode>('This Week');
  const [sortKey, setSortKey] = useState<SortKey>('earliest');
  const [events, setEvents] = useState<InterviewEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState('');
  const [actionMessage, setActionMessage] = useState('');
  const [respondingEventId, setRespondingEventId] = useState('');

  useEffect(() => {
    const loadInterviews = async () => {
      setLoading(true);
      setApiError('');
      try {
        const requests = await apiRequest<RealtimeTrackingItem[]>('/reports/realtime-tracking', token);
        const activeRequests = requests.filter((request) => !TERMINAL_STATUSES.includes(request.status));
        const [scheduleLists, applicationLists, usersResponse] = await Promise.all([
          Promise.all(
            activeRequests.map((request) =>
              apiRequest<InterviewSchedule[]>(`/interviews/requests/${request.id}/schedules`, token)
                .then((schedules) => schedules.map((schedule) => ({ schedule, position: request.position })))
                .catch(() => [] as { schedule: InterviewSchedule; position: string }[]),
            ),
          ),
          Promise.all(
            activeRequests.map((request) =>
              apiRequest<ApplicationApiItem[]>(`/applications?requestId=${request.id}`, token).catch(
                () => [] as ApplicationApiItem[],
              ),
            ),
          ),
          apiRequest<{ data: UserOption[] }>('/users/interviewers', token).catch(() => ({
            data: [] as UserOption[],
          })),
        ]);

        const candidateNames = new Map(
          applicationLists.flat().map((application) => [application.candidateId, application.candidate.fullName]),
        );
        const usersById = new Map(usersResponse.data.map((user) => [user.id, user]));
        const mapped = scheduleLists
          .flat()
          .filter(({ schedule }) => schedule.status !== 'CANCELLED')
          .map(({ schedule, position }, index): InterviewEvent => {
            const date = new Date(schedule.scheduledAt);
            return {
              id: schedule.id,
              dateKey: date.toDateString(),
              date: date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
              day: date.toLocaleDateString(undefined, { weekday: 'short' }),
              time: date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' }),
              scheduledAt: schedule.scheduledAt,
              position,
              candidate:
                candidateNames.get(schedule.candidateId) || `Candidate ${schedule.candidateId.slice(0, 8)}`,
              duration: schedule.duration,
              location: schedule.location,
              locationType: /https?:\/\/|zoom|meet/i.test(schedule.location) ? 'video' : 'room',
              panel: schedule.interviewers.map((userId) => {
                const user = usersById.get(userId);
                return {
                  id: userId,
                  name: user?.displayName || `Interviewer ${userId.slice(0, 8)}`,
                  email: user?.email,
                  attendance: getAttendance(schedule.interviewerAttendance?.[userId]?.response),
                };
              }),
              tone: TONES[index % TONES.length] ?? 'teal',
            };
          });
        setEvents(mapped);
      } catch (error) {
        setApiError(error instanceof Error ? error.message : 'Unable to load interview details');
      } finally {
        setLoading(false);
      }
    };
    void loadInterviews();
  }, [token]);

  const calendarDays = useMemo(() => getCalendarDays(viewMode), [viewMode]);
  const visibleEvents = useMemo(() => {
    const { start, end } = getPeriodRange(viewMode);
    return events.filter((event) => {
      const date = new Date(event.scheduledAt);
      return date >= start && date < end;
    });
  }, [events, viewMode]);
  const sortedEvents = useMemo(
    () =>
      [...visibleEvents].sort((left, right) =>
        sortKey === 'position'
          ? left.position.localeCompare(right.position)
          : new Date(left.scheduledAt).getTime() - new Date(right.scheduledAt).getTime(),
      ),
    [sortKey, visibleEvents],
  );

  const respondToAttendance = async (event: InterviewEvent, response: 'ACCEPTED' | 'ABSENT') => {
    if (!user?.id) return;
    const nextAttendance = getAttendance(response);
    const previousAttendance = event.panel.find((member) => member.id === user.id)?.attendance;

    setRespondingEventId(event.id);
    setApiError('');
    setActionMessage('');
    setEvents((current) =>
      current.map((item) =>
        item.id === event.id
          ? {
              ...item,
              panel: item.panel.map((member) =>
                member.id === user.id ? { ...member, attendance: nextAttendance } : member,
              ),
            }
          : item,
      ),
    );
    try {
      await apiRequest(`/interviews/schedules/${event.id}/interviewer-attendance`, token, {
        method: 'PATCH',
        body: JSON.stringify({ response }),
      });
      setActionMessage(
        response === 'ACCEPTED'
          ? 'Your attendance has been confirmed.'
          : 'Your absence has been recorded for this interview.',
      );
    } catch (error) {
      setEvents((current) =>
        current.map((item) =>
          item.id === event.id
            ? {
                ...item,
                panel: item.panel.map((member) =>
                  member.id === user.id && previousAttendance
                    ? { ...member, attendance: previousAttendance }
                    : member,
                ),
              }
            : item,
        ),
      );
      setApiError(error instanceof Error ? error.message : 'Unable to update attendance');
    } finally {
      setRespondingEventId('');
    }
  };

  return (
    <HRDashboardPage className="gap-7">
      <HRPageHeader
        eyebrow="HR Manager Portal"
        title="Interview Detail"
        description="Review weekly or monthly interview schedules and each panel member's attendance response."
        actions={
          <div className="flex items-center gap-3">
            <div className="flex rounded-lg bg-secondary-container p-1">
              {(['This Week', 'This Month'] as ViewMode[]).map((item) => (
                <button
                  className={`rounded-md px-4 py-1.5 text-xs font-semibold transition active:scale-[0.98] ${
                    viewMode === item
                      ? 'bg-clean-surface text-teal-command shadow-sm'
                      : 'text-on-secondary-fixed-variant hover:text-on-surface'
                  }`}
                  key={item}
                  onClick={() => setViewMode(item)}
                  type="button"
                >
                  {item}
                </button>
              ))}
            </div>
            <HRActionButton onClick={() => navigate('/hr/interviews')}>
              Manage Schedule
            </HRActionButton>
          </div>
        }
      />

      {apiError && <HRInlineAlert>{apiError}</HRInlineAlert>}
      {actionMessage && <HRInlineAlert tone="teal">{actionMessage}</HRInlineAlert>}
      {loading && <HRLoadingState label="Loading interview details..." />}

      <section aria-label={`${viewMode} interview calendar`}>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-7">
          {calendarDays.map((day) => {
            const dayEvents = visibleEvents.filter((event) => event.dateKey === day.dateKey);
            const isToday = day.dateKey === new Date().toDateString();
            return (
              <div className="flex min-h-[220px] flex-col gap-3" key={day.dateKey}>
                <div
                  className={`flex h-full flex-col rounded-xl border p-4 shadow-sm ${
                    isToday
                      ? 'border-teal-command/20 border-b-2 bg-clean-surface'
                      : dayEvents.length
                        ? 'border-border-warm bg-clean-surface'
                        : 'border-dashed border-border-warm bg-parchment-lift/50'
                  }`}
                >
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-on-surface-variant">
                    {day.day} {day.date}
                  </p>
                  {dayEvents.length ? (
                    <div className="mt-4 flex flex-col gap-3">
                      {dayEvents.map((event) => (
                        <div className={`rounded border-l-4 p-3 ${toneStyles[event.tone]}`} key={event.id}>
                          <p className="text-sm font-bold">{event.time}</p>
                          <p className="mt-1 text-sm leading-tight text-on-surface">{event.position}</p>
                          <p className="mt-1 text-[11px] text-on-surface-variant">{event.candidate}</p>
                          <p className="mt-2 truncate text-[11px] text-on-surface-variant">{event.location}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="m-auto text-center text-sm text-on-surface-variant/70">No interviews scheduled</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section>
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-xl font-semibold text-on-surface">Interview Attendance</h2>
          <label className="flex items-center gap-2 text-sm text-on-surface-variant">
            <span>Sort by:</span>
            <select
              className="rounded-lg border border-border-warm bg-clean-surface px-3 py-2 text-sm font-semibold text-teal-command outline-none focus:border-teal-command focus:ring-2 focus:ring-teal-command/20"
              onChange={(event) => setSortKey(event.target.value as SortKey)}
              value={sortKey}
            >
              <option value="earliest">Earliest First</option>
              <option value="position">By Position</option>
            </select>
          </label>
        </div>

        <div className="space-y-4">
          {sortedEvents.map((event) => (
            <HRCard className="rounded-xl p-5" key={event.id}>
              {(() => {
                const myAttendance = event.panel.find((member) => member.id === user?.id)?.attendance;
                const isResponding = respondingEventId === event.id;
                return (
              <div className="flex flex-col gap-5 xl:flex-row xl:items-start">
                <div className="min-w-[112px] rounded-lg bg-parchment-lift px-4 py-3 text-center">
                  <p className="font-mono text-sm font-bold text-on-surface">{event.time}</p>
                  <p className="mt-1 text-xs font-semibold uppercase tracking-[0.12em] text-on-surface-variant">{event.date}</p>
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-3">
                    <h3 className="text-lg font-semibold text-on-surface">{event.position} - Interview</h3>
                    <span className={`rounded-full border px-2.5 py-1 text-[11px] font-bold ${toneStyles[event.tone]}`}>
                      {event.duration} minutes
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-slate-ink">
                    Candidate: <span className="font-semibold text-deep-charcoal">{event.candidate}</span>
                  </p>
                  <p className="mt-1 text-sm text-slate-ink">
                    {event.locationType === 'video' ? 'Online meeting' : 'Interview room'}: {event.location}
                  </p>
                </div>
                <div className="min-w-0 xl:w-[420px]">
                  <p className="mb-2 text-xs font-bold uppercase tracking-[0.12em] text-on-surface-variant">
                    Participants ({event.panel.length})
                  </p>
                  <div className="space-y-2">
                    {event.panel.map((member) => (
                      <div
                        className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border-warm bg-workflow-ivory/40 px-3 py-2"
                        key={member.id}
                      >
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-deep-charcoal">{member.name}</p>
                          {member.email && <p className="truncate text-xs text-slate-ink">{member.email}</p>}
                        </div>
                        <span className={`rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.08em] ${attendanceStyles[member.attendance]}`}>
                          {member.attendance}
                        </span>
                      </div>
                    ))}
                  </div>
                  {myAttendance ? (
                    <div className="mt-3 flex flex-wrap gap-2 border-t border-border-warm pt-3">
                      <button
                        aria-pressed={myAttendance === 'Accepted'}
                        className={`rounded-lg px-3 py-2 text-xs font-bold transition active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-70 ${
                          myAttendance === 'Accepted'
                            ? 'bg-emerald-600 text-white shadow-sm ring-2 ring-emerald-200'
                            : 'border border-emerald-600 bg-white text-emerald-700 hover:bg-emerald-50'
                        }`}
                        disabled={isResponding}
                        onClick={() => void respondToAttendance(event, 'ACCEPTED')}
                        type="button"
                      >
                        {isResponding ? 'Saving...' : myAttendance === 'Accepted' ? '✓ Accepted' : 'Accept'}
                      </button>
                      <button
                        aria-pressed={myAttendance === 'Absent'}
                        className={`rounded-lg px-3 py-2 text-xs font-bold transition active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-70 ${
                          myAttendance === 'Absent'
                            ? 'bg-rose-600 text-white shadow-sm ring-2 ring-rose-200'
                            : 'border border-rose-600 bg-white text-rose-700 hover:bg-rose-50'
                        }`}
                        disabled={isResponding}
                        onClick={() => void respondToAttendance(event, 'ABSENT')}
                        type="button"
                      >
                        {isResponding ? 'Saving...' : myAttendance === 'Absent' ? '✓ Absent' : 'Mark Absent'}
                      </button>
                    </div>
                  ) : null}
                </div>
              </div>
                );
              })()}
            </HRCard>
          ))}
        </div>

        {!loading && sortedEvents.length === 0 && (
          <HREmptyState
            title={`No interviews scheduled for ${viewMode.toLowerCase()}.`}
            description="Choose another period or create an interview schedule first."
          />
        )}
      </section>
    </HRDashboardPage>
  );
};
