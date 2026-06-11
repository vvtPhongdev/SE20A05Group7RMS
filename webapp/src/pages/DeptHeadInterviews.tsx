import React, { useMemo, useState } from 'react';

type InterviewStage = 'Scheduled' | 'Needs Feedback' | 'Completed' | 'Reschedule';
type InterviewMode = 'Technical' | 'Culture Fit' | 'Final Panel';

type Interview = {
  id: string;
  candidate: string;
  role: string;
  requestId: string;
  mode: InterviewMode;
  stage: InterviewStage;
  date: string;
  time: string;
  panel: string[];
  score?: number;
  notes: string;
};

const interviews: Interview[] = [
  {
    id: 'INT-2026-041',
    candidate: 'Le Minh Khang',
    role: 'Systems Analyst',
    requestId: 'REQ-2026-009',
    mode: 'Technical',
    stage: 'Scheduled',
    date: '2026-06-12',
    time: '09:30',
    panel: ['Nhi Bui', 'Hanh Vo'],
    notes: 'Prepare API design case and reporting scenario.',
  },
  {
    id: 'INT-2026-042',
    candidate: 'Pham Thuy An',
    role: 'QA Automation Engineer',
    requestId: 'REQ-2026-010',
    mode: 'Final Panel',
    stage: 'Needs Feedback',
    date: '2026-06-10',
    time: '14:00',
    panel: ['Quyen Lam', 'Tuan Le'],
    score: 82,
    notes: 'Feedback due today. Candidate was strong on test architecture.',
  },
  {
    id: 'INT-2026-043',
    candidate: 'Dao Gia Huy',
    role: 'Technical Lead',
    requestId: 'REQ-2026-011',
    mode: 'Culture Fit',
    stage: 'Completed',
    date: '2026-06-09',
    time: '10:15',
    panel: ['Duc Truong', 'Mai Phan'],
    score: 88,
    notes: 'Recommended for offer review with architecture follow-up.',
  },
  {
    id: 'INT-2026-044',
    candidate: 'Nguyen Hoai Linh',
    role: 'Integration Engineer',
    requestId: 'REQ-2026-008',
    mode: 'Technical',
    stage: 'Reschedule',
    date: '2026-06-13',
    time: '16:30',
    panel: ['Hanh Vo', 'Khoa Pham'],
    notes: 'Panel conflict. HR requested new slots from department reviewers.',
  },
  {
    id: 'INT-2026-045',
    candidate: 'Tran Bao Chau',
    role: 'Data Analyst',
    requestId: 'REQ-2026-005',
    mode: 'Technical',
    stage: 'Scheduled',
    date: '2026-06-14',
    time: '11:00',
    panel: ['Bao Nguyen', 'Nhi Bui'],
    notes: 'Use dashboard interpretation exercise and SQL review.',
  },
];

const stageStyles: Record<InterviewStage, string> = {
  Scheduled: 'border-cyan-200 bg-cyan-50 text-pending',
  'Needs Feedback': 'border-amber-200 bg-amber-50 text-revision',
  Completed: 'border-green-200 bg-green-50 text-approved',
  Reschedule: 'border-red-200 bg-red-50 text-rejected',
};

const iconPaths: Record<string, React.ReactNode> = {
  calendar: (
    <path d="M7 3v4m10-4v4M4 9h16M6 5h12a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2Z" />
  ),
  feedback: (
    <path d="M8 10h8M8 14h5M5 4h14a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2h-5l-4 3v-3H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z" />
  ),
  check: <path d="m8 12 2.6 2.6L16.5 8.8M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />,
  search: <path d="m21 21-4.3-4.3M10.8 18a7.2 7.2 0 1 1 0-14.4 7.2 7.2 0 0 1 0 14.4Z" />,
  clock: <path d="M12 6v6l4 2m5-2a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />,
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

const formatDate = (value: string) =>
  new Intl.DateTimeFormat('en', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(`${value}T00:00:00`));

export const DeptHeadInterviews: React.FC = () => {
  const [query, setQuery] = useState('');
  const [stage, setStage] = useState<InterviewStage | 'All'>('All');

  const visibleInterviews = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return interviews.filter((interview) => {
      const matchesStage = stage === 'All' || interview.stage === stage;
      const matchesQuery =
        !normalizedQuery ||
        [
          interview.id,
          interview.candidate,
          interview.role,
          interview.requestId,
          interview.mode,
          interview.notes,
        ].some((value) => value.toLowerCase().includes(normalizedQuery));

      return matchesStage && matchesQuery;
    });
  }, [query, stage]);

  const feedbackDue = interviews.filter((interview) => interview.stage === 'Needs Feedback').length;
  const scheduled = interviews.filter((interview) => interview.stage === 'Scheduled').length;
  const completed = interviews.filter((interview) => interview.stage === 'Completed').length;

  return (
    <div className="mx-auto flex max-w-[1440px] flex-col gap-6">
      <header className="grid gap-4 xl:grid-cols-[1fr_auto] xl:items-end">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-teal-command">
            Department Head Workspace
          </p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-deep-charcoal">
            Interviews & Assessment
          </h1>
          <p className="mt-1 max-w-[70ch] text-sm leading-6 text-slate-ink">
            Review interview schedules, panel assignments, and pending feedback for department
            candidates.
          </p>
        </div>

        <label className="relative block xl:min-w-[360px]">
          <span className="sr-only">Search interviews</span>
          <Icon
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-outline"
            name="search"
          />
          <input
            className="h-10 w-full rounded-lg border border-border-warm bg-clean-surface pl-10 pr-3 text-sm text-deep-charcoal outline-none transition placeholder:text-on-surface-variant focus:border-teal-command focus:ring-2 focus:ring-teal-command/20"
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search candidate, role, request..."
            type="search"
            value={query}
          />
        </label>
      </header>

      <section className="grid grid-cols-1 gap-5 md:grid-cols-3" aria-label="Interview summary">
        {[
          {
            label: 'Scheduled',
            value: scheduled,
            icon: 'calendar',
            tone: 'bg-cyan-50 text-pending',
          },
          {
            label: 'Feedback Due',
            value: feedbackDue,
            icon: 'feedback',
            tone: 'bg-amber-50 text-revision',
          },
          {
            label: 'Completed',
            value: completed,
            icon: 'check',
            tone: 'bg-green-50 text-approved',
          },
        ].map((item) => (
          <section
            className="rounded-xl border border-border-warm bg-clean-surface p-5 shadow-[0_18px_50px_-44px_rgba(28,25,23,0.55)]"
            key={item.label}
          >
            <div className="mb-4 flex items-center justify-between">
              <span className={`rounded-lg p-2 ${item.tone}`}>
                <Icon name={item.icon} />
              </span>
            </div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-on-surface-variant">
              {item.label}
            </p>
            <p className="mt-3 font-mono text-[32px] font-semibold leading-none text-deep-charcoal">
              {item.value}
            </p>
          </section>
        ))}
      </section>

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-[0.72fr_1.28fr]">
        <aside className="rounded-xl border border-border-warm bg-clean-surface p-5 shadow-[0_18px_50px_-44px_rgba(28,25,23,0.55)]">
          <h2 className="text-lg font-semibold text-deep-charcoal">Quick Filters</h2>
          <div className="mt-4 flex flex-wrap gap-2 xl:flex-col">
            {(
              ['All', 'Scheduled', 'Needs Feedback', 'Completed', 'Reschedule'] as Array<
                InterviewStage | 'All'
              >
            ).map((item) => (
              <button
                className={`h-10 rounded-lg px-4 text-left text-sm font-semibold transition active:scale-[0.98] ${
                  stage === item
                    ? 'bg-teal-command text-white'
                    : 'border border-border-warm bg-clean-surface text-on-surface-variant hover:border-teal-command hover:text-teal-command'
                }`}
                key={item}
                onClick={() => setStage(item)}
                type="button"
              >
                {item}
              </button>
            ))}
          </div>

          <div className="mt-6 rounded-lg border border-border-warm bg-workflow-ivory/70 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-on-surface-variant">
              Today
            </p>
            <p className="mt-2 text-sm font-semibold text-deep-charcoal">1 feedback decision due</p>
            <p className="mt-1 text-sm leading-6 text-slate-ink">
              Finalize interview notes for Pham Thuy An before HR moves the candidate forward.
            </p>
          </div>
        </aside>

        <section className="rounded-xl border border-border-warm bg-clean-surface shadow-[0_18px_50px_-44px_rgba(28,25,23,0.55)]">
          <div className="border-b border-border-warm px-5 py-4">
            <h2 className="text-lg font-semibold text-deep-charcoal">Panel Schedule</h2>
            <p className="mt-1 text-sm text-slate-ink">
              Showing {visibleInterviews.length} of {interviews.length} interview sessions.
            </p>
          </div>

          <div className="divide-y divide-border-warm">
            {visibleInterviews.map((interview) => (
              <article
                className="grid gap-4 p-5 transition hover:bg-workflow-ivory/60 lg:grid-cols-[1fr_auto]"
                key={interview.id}
              >
                <div>
                  <div className="flex flex-wrap items-center gap-3">
                    <h3 className="text-base font-semibold text-deep-charcoal">
                      {interview.candidate}
                    </h3>
                    <span
                      className={`rounded-full border px-2.5 py-1 text-xs font-bold ${stageStyles[interview.stage]}`}
                    >
                      {interview.stage}
                    </span>
                    <span className="rounded-full bg-surface-container px-2.5 py-1 text-xs font-semibold text-on-surface-variant">
                      {interview.mode}
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-slate-ink">
                    {interview.role} ·{' '}
                    <span className="font-mono text-teal-command">{interview.requestId}</span>
                  </p>
                  <p className="mt-3 max-w-[70ch] text-sm leading-6 text-deep-charcoal">
                    {interview.notes}
                  </p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {interview.panel.map((member) => (
                      <span
                        className="rounded-lg border border-border-warm bg-clean-surface px-3 py-1.5 text-xs font-semibold text-on-surface-variant"
                        key={member}
                      >
                        {member}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="flex flex-row gap-4 lg:min-w-[190px] lg:flex-col lg:items-end">
                  <div className="rounded-lg border border-border-warm bg-parchment-lift/70 px-4 py-3 text-left lg:text-right">
                    <div className="flex items-center gap-2 text-sm font-semibold text-deep-charcoal lg:justify-end">
                      <Icon className="h-4 w-4 text-teal-command" name="clock" />
                      {interview.time}
                    </div>
                    <p className="mt-1 text-sm text-slate-ink">{formatDate(interview.date)}</p>
                  </div>
                  <button
                    className="h-10 rounded-lg bg-teal-command px-4 text-sm font-semibold text-white transition hover:bg-primary active:scale-[0.98]"
                    type="button"
                  >
                    {interview.stage === 'Needs Feedback' ? 'Add Feedback' : 'View Detail'}
                  </button>
                </div>
              </article>
            ))}
          </div>

          {visibleInterviews.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <p className="text-sm font-semibold text-deep-charcoal">
                No interviews match this view.
              </p>
              <p className="mt-1 text-sm text-slate-ink">
                Try another status filter or search term.
              </p>
            </div>
          ) : null}
        </section>
      </section>
    </div>
  );
};
