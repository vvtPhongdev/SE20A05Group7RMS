import React, { useMemo, useState } from 'react';

type ViewMode = 'This Week' | 'This Month';
type SortKey = 'earliest' | 'position';
type InterviewStatus = 'Confirmed' | 'Pending Confirmation';
type InterviewTone = 'teal' | 'cyan' | 'amber' | 'slate';

interface CalendarEvent {
  id: string;
  day: string;
  date: string;
  time: string;
  round: string;
  position: string;
  location: string;
  locationType: 'room' | 'video';
  candidates: string[];
  panel: string[];
  status: InterviewStatus;
  tone: InterviewTone;
}

const calendarDays = [
  { day: 'Mon', date: 'May 26' },
  { day: 'Tue', date: 'May 27' },
  { day: 'Wed', date: 'May 28' },
  { day: 'Thu', date: 'May 29' },
  { day: 'Fri', date: 'May 30' },
];

const events: CalendarEvent[] = [
  {
    id: 'INT-DH-001',
    day: 'Mon',
    date: 'May 26',
    time: '10:00',
    round: 'Round 1',
    position: 'Senior Developer',
    location: 'Room 301',
    locationType: 'room',
    candidates: ['Nguyen Van A', 'Tran Ngoc Mai', 'Le Hoang Quan'],
    panel: ['Vo Minh Tu', 'Le Thi Hang'],
    status: 'Confirmed',
    tone: 'teal',
  },
  {
    id: 'INT-DH-002',
    day: 'Mon',
    date: 'May 26',
    time: '14:00',
    round: 'Technical',
    position: 'Marketing Specialist',
    location: 'Zoom Meeting Link',
    locationType: 'video',
    candidates: ['Phan Bao Ngoc', 'Le Quoc Huy'],
    panel: ['Tran Van C'],
    status: 'Pending Confirmation',
    tone: 'cyan',
  },
  {
    id: 'INT-DH-003',
    day: 'Tue',
    date: 'May 27',
    time: '09:00',
    round: 'Final Round',
    position: 'DevOps Engineer',
    location: 'Room 502',
    locationType: 'room',
    candidates: ['Hoang Thanh Tung'],
    panel: ['Admin', 'HR'],
    status: 'Confirmed',
    tone: 'amber',
  },
  {
    id: 'INT-DH-004',
    day: 'Thu',
    date: 'May 29',
    time: '11:30',
    round: 'Portfolio Review',
    position: 'Junior Designer',
    location: 'Room 201',
    locationType: 'room',
    candidates: ['Mai Anh', 'Doan Nhat Linh', 'Pham Thuy Vy', 'Nguyen Bao Chau'],
    panel: ['Creative Lead', 'Dept Head'],
    status: 'Confirmed',
    tone: 'slate',
  },
];

const toneStyles: Record<InterviewTone, string> = {
  teal: 'border-teal-command bg-primary-container/10 text-teal-command',
  cyan: 'border-pending bg-pending/5 text-pending',
  amber: 'border-revision bg-revision/10 text-revision',
  slate: 'border-slate-ink bg-slate-ink/10 text-slate-ink',
};

const statusStyles: Record<InterviewStatus, string> = {
  Confirmed: 'bg-approved/10 text-approved',
  'Pending Confirmation': 'bg-revision/10 text-revision',
};

const Icon = ({ name, className = 'h-5 w-5' }: { name: string; className?: string }) => {
  const paths: Record<string, React.ReactNode> = {
    calendar: (
      <path d="M7 3v4m10-4v4M4 9h16M6 5h12a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2Z" />
    ),
    candidates: <path d="M16 19a4 4 0 0 0-8 0M12 13a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm6 6a3 3 0 0 0-2-2.83M18 7.5a3 3 0 0 1 0 5" />,
    room: <path d="M4 21V5a2 2 0 0 1 2-2h9v18M15 7h5v14M10 12h.01" />,
    video: <path d="M4 7h10a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2H4V7Zm12 3 4-2v8l-4-2" />,
    notification: <path d="M18 8a6 6 0 1 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4" />,
    help: <path d="M9.5 9a2.5 2.5 0 1 1 4.45 1.55c-.7.64-1.45 1.12-1.45 2.45M12 17h.01M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0" />,
    empty: <path d="M7 3v4m10-4v4M4 9h16M6 5h12a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2Zm5 8h6" />,
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

export const DeptHeadInterviews: React.FC = () => {
  const [viewMode, setViewMode] = useState<ViewMode>('This Week');
  const [sortKey, setSortKey] = useState<SortKey>('earliest');

  const sortedEvents = useMemo(() => {
    return [...events].sort((left, right) => {
      if (sortKey === 'position') {
        return left.position.localeCompare(right.position);
      }

      const leftDate = `${left.date} ${left.time}`;
      const rightDate = `${right.date} ${right.time}`;
      return leftDate.localeCompare(rightDate);
    });
  }, [sortKey]);

  return (
    <div className="mx-auto flex max-w-[1440px] flex-col gap-7">
      <header className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-center">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-on-surface">
            Interview Schedule
          </h1>
          <p className="mt-1 text-sm text-on-surface-variant">
            Your upcoming interviews as panel member
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
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
          <div className="hidden h-8 w-px bg-border-warm sm:block" />
          <button
            aria-label="Notifications"
            className="inline-flex h-10 w-10 items-center justify-center rounded-full text-on-surface-variant transition hover:bg-secondary-container active:scale-[0.98]"
            type="button"
          >
            <Icon name="notification" />
          </button>
          <button
            aria-label="Help"
            className="inline-flex h-10 w-10 items-center justify-center rounded-full text-on-surface-variant transition hover:bg-secondary-container active:scale-[0.98]"
            type="button"
          >
            <Icon name="help" />
          </button>
        </div>
      </header>

      <section aria-label={`${viewMode} calendar`}>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
          {calendarDays.map((day) => {
            const dayEvents = events.filter((event) => event.day === day.day);

            return (
              <div className="flex min-h-[220px] flex-col gap-3" key={`${day.day}-${day.date}`}>
                <div
                  className={`flex h-full flex-col rounded-xl border p-4 shadow-sm ${
                    day.day === 'Mon'
                      ? 'border-teal-command/20 border-b-2 bg-clean-surface'
                      : dayEvents.length
                        ? 'border-border-warm bg-clean-surface'
                        : 'border-dashed border-border-warm bg-parchment-lift/50'
                  } ${day.day === 'Fri' ? 'opacity-70' : ''}`}
                >
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-on-surface-variant">
                    {day.day} {day.date}
                  </p>

                  {dayEvents.length > 0 ? (
                    <div className="mt-4 flex flex-col gap-3">
                      {dayEvents.map((event) => (
                        <button
                          className={`rounded border-l-4 p-3 text-left transition hover:-translate-y-0.5 hover:shadow-sm active:scale-[0.98] ${toneStyles[event.tone]}`}
                          key={event.id}
                          type="button"
                        >
                          <p className="text-sm font-bold">{event.round}</p>
                          <p className="mt-1 text-sm leading-tight text-on-surface">
                            {event.position}
                          </p>
                          <div className="mt-2 flex items-center gap-1 text-[11px] text-on-surface-variant">
                            <Icon
                              className="h-3.5 w-3.5"
                              name={event.locationType === 'video' ? 'video' : 'room'}
                            />
                            {event.location}
                          </div>
                          <div className="mt-1 flex items-center gap-1 text-[11px] text-on-surface-variant">
                            <Icon className="h-3.5 w-3.5" name="candidates" />
                            {event.candidates.length}{' '}
                            {event.candidates.length === 1 ? 'Candidate' : 'Candidates'}
                          </div>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-1 flex-col items-center justify-center text-center">
                      <Icon className="mb-2 h-8 w-8 text-outline-variant" name="empty" />
                      <p className="text-sm text-on-surface-variant/70">
                        {day.day === 'Fri' ? 'No items' : 'No interviews scheduled'}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section>
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-xl font-semibold text-on-surface">Upcoming Interviews</h2>
          <label className="flex items-center gap-2 text-sm text-on-surface-variant">
            <span>Sort by:</span>
            <select
              className="rounded-lg border border-border-warm bg-clean-surface px-3 py-2 text-sm font-semibold text-teal-command outline-none transition focus:border-teal-command focus:ring-2 focus:ring-teal-command/20"
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
            <article
              className="group flex flex-col gap-5 rounded-xl border border-border-warm bg-clean-surface p-5 transition hover:-translate-y-0.5 hover:shadow-md md:flex-row md:items-center"
              key={event.id}
            >
              <div className="flex min-w-[100px] flex-row items-center gap-3 rounded-lg bg-parchment-lift px-4 py-3 md:flex-col md:justify-center md:gap-0">
                <p className="font-mono text-sm font-bold text-on-surface">{event.time}</p>
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-on-surface-variant">
                  {event.date}
                </p>
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-3">
                  <h3 className="text-lg font-semibold text-on-surface transition group-hover:text-teal-command">
                    {event.position} - {event.round}
                  </h3>
                  <span
                    className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider ${statusStyles[event.status]}`}
                  >
                    <span className="h-1.5 w-1.5 rounded-full bg-current" />
                    {event.status}
                  </span>
                </div>

                <p className="mt-2 text-sm text-on-surface-variant">
                  Panel:{' '}
                  <span className="font-medium text-on-surface">{event.panel.join(', ')}</span>
                  <span className="px-2 text-outline">-</span>
                  Location:{' '}
                  <span
                    className={
                      event.locationType === 'video'
                        ? 'rounded bg-teal-command/10 px-1.5 py-0.5 text-teal-command'
                        : 'font-medium text-on-surface'
                    }
                  >
                    {event.location}
                  </span>
                </p>

                <div className="mt-4 flex flex-wrap items-center gap-3">
                  <AvatarStack names={event.candidates} />
                  <p className="text-sm text-on-surface-variant">
                    Candidates:{' '}
                    <span className="font-medium text-on-surface">
                      {event.candidates.length > 2
                        ? `${event.candidates.slice(0, 2).join(', ')}, +${event.candidates.length - 2} more`
                        : event.candidates.join(', ')}
                    </span>
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3 md:justify-end">
                <button
                  className="rounded-lg bg-teal-command/10 px-4 py-2 text-sm font-semibold text-teal-command transition hover:bg-teal-command/15 active:scale-[0.98]"
                  type="button"
                >
                  Evaluation Form
                </button>
                <button
                  className="rounded-lg border border-teal-command px-4 py-2 text-sm font-semibold text-teal-command transition hover:bg-teal-command/5 active:scale-[0.98]"
                  type="button"
                >
                  View CV
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
};

const AvatarStack = ({ names }: { names: string[] }) => {
  const visibleNames = names.slice(0, 2);
  const hiddenCount = Math.max(names.length - visibleNames.length, 0);

  return (
    <div className="flex -space-x-2">
      {visibleNames.map((name, index) => (
        <div
          className={`grid h-8 w-8 place-items-center rounded-full border-2 border-clean-surface text-[10px] font-bold ${
            index === 0 ? 'bg-teal-command/15 text-teal-command' : 'bg-secondary-container text-on-secondary-container'
          }`}
          key={name}
          title={name}
        >
          {name
            .split(' ')
            .map((part) => part[0])
            .slice(-2)
            .join('')}
        </div>
      ))}
      {hiddenCount > 0 && (
        <div className="grid h-8 w-8 place-items-center rounded-full border-2 border-clean-surface bg-secondary-container text-[10px] font-bold text-on-secondary-container">
          +{hiddenCount}
        </div>
      )}
    </div>
  );
};
