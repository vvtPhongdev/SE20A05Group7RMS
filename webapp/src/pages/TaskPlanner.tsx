import React, { useMemo, useState } from 'react';

type TaskStatus = 'Completed' | 'In Progress' | 'Pending' | 'Blocked';
type TaskType =
  | 'JOB_POSTING'
  | 'CV_COLLECTION'
  | 'CV_SCREENING'
  | 'INTERVIEW_COORDINATION'
  | 'REFERENCE_CHECK';

type PlannerTask = {
  id: string;
  type: TaskType;
  campaign: string;
  assignee: string;
  initials: string;
  startDate: string;
  dueDate: string;
  status: TaskStatus;
  blocker: string;
  planWindow: string;
  role: string;
  comments: Array<{ author: string; time: string; body: string }>;
};

const tasks: PlannerTask[] = [
  {
    id: 'TSK-2041',
    type: 'JOB_POSTING',
    campaign: 'Q2 Marketing Specialist',
    assignee: 'Sarah Miller',
    initials: 'SM',
    startDate: 'May 01',
    dueDate: 'May 05',
    status: 'Completed',
    blocker: '',
    planWindow: 'May 01 - May 05',
    role: 'Recruitment Coordinator',
    comments: [
      {
        author: 'Sarah Miller',
        time: 'Yesterday',
        body: 'Posting package is live across the approved channels.',
      },
    ],
  },
  {
    id: 'TSK-2042',
    type: 'CV_COLLECTION',
    campaign: 'Senior Developer',
    assignee: 'Elena Rodriguez',
    initials: 'ER',
    startDate: 'May 10',
    dueDate: 'May 25',
    status: 'In Progress',
    blocker: '',
    planWindow: 'May 10 - May 25',
    role: 'Talent Sourcer',
    comments: [
      {
        author: 'Elena Rodriguez',
        time: '3h ago',
        body: 'Referral batch added. External job board is generating stronger senior profiles.',
      },
    ],
  },
  {
    id: 'TSK-2043',
    type: 'CV_SCREENING',
    campaign: 'Product Designer',
    assignee: 'David Park',
    initials: 'DP',
    startDate: 'May 26',
    dueDate: 'May 30',
    status: 'Pending',
    blocker: 'Missing screening rubric',
    planWindow: 'May 26 - May 30',
    role: 'Technical Recruiter',
    comments: [
      {
        author: 'Marcus Chen',
        time: '2h ago',
        body: 'The rubric is with the Hiring Manager for final sign-off. Expected by EOD.',
      },
    ],
  },
  {
    id: 'TSK-2044',
    type: 'INTERVIEW_COORDINATION',
    campaign: 'UX Researcher',
    assignee: 'Marcus Chen',
    initials: 'MC',
    startDate: 'Jun 01',
    dueDate: 'Jun 10',
    status: 'Pending',
    blocker: '',
    planWindow: 'Jun 01 - Jun 10',
    role: 'Interview Coordinator',
    comments: [
      {
        author: 'Marcus Chen',
        time: 'Today',
        body: 'Waiting for panel availability from Design and Product.',
      },
    ],
  },
  {
    id: 'TSK-2045',
    type: 'REFERENCE_CHECK',
    campaign: 'Cloud Security Specialist',
    assignee: 'Nina Patel',
    initials: 'NP',
    startDate: 'Jun 04',
    dueDate: 'Jun 08',
    status: 'Blocked',
    blocker: 'Candidate contact unavailable',
    planWindow: 'Jun 04 - Jun 08',
    role: 'HR Specialist',
    comments: [
      {
        author: 'Nina Patel',
        time: '1h ago',
        body: 'Second reference has not confirmed contact details yet.',
      },
    ],
  },
];

const kpis = [
  { label: 'Overdue Tasks', value: 12, helper: 'Critical', tone: 'text-rejected' },
  { label: 'In Progress', value: 34, helper: 'Tasks', tone: 'text-primary' },
  { label: 'Pending Assignment', value: 8, helper: 'Drafts', tone: 'text-revision' },
  { label: 'Completed This Week', value: 42, helper: 'Plans', tone: 'text-approved' },
];

const statusStyles: Record<TaskStatus, string> = {
  Completed: 'border-approved/20 bg-approved/10 text-approved',
  'In Progress': 'border-pending/20 bg-pending/10 text-pending',
  Pending: 'border-revision/20 bg-revision/10 text-revision',
  Blocked: 'border-rejected/20 bg-rejected/10 text-rejected',
};

const avatarStyles = [
  'bg-primary/20 text-primary',
  'bg-pending/20 text-pending',
  'bg-revision/20 text-revision',
  'bg-slate-ink/20 text-slate-ink',
];

const iconPaths: Record<string, React.ReactNode> = {
  filter: <path d="M4 6h16M7 12h10M10 18h4" />,
  calendar: (
    <path d="M7 3v4m10-4v4M4 9h16M6 5h12a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2Z" />
  ),
  edit: <path d="m4 20 4.5-1 10-10a2.1 2.1 0 0 0-3-3l-10 10L4 20Zm12-14 3 3" />,
  trash: <path d="M4 7h16m-2 0-.8 13H6.8L6 7m3 0V4h6v3m-4 4v5m4-5v5" />,
  close: <path d="m6 6 12 12M18 6 6 18" />,
  warning: (
    <path d="M12 9v4m0 4h.01M10.3 3.9 2.8 17a2 2 0 0 0 1.7 3h15a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" />
  ),
  info: <path d="M12 16v-4m0-4h.01M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />,
  bolt: <path d="m13 2-8 12h7l-1 8 8-12h-7z" />,
  chevronLeft: <path d="m15 18-6-6 6-6" />,
  chevronRight: <path d="m9 18 6-6-6-6" />,
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

export const TaskPlanner: React.FC = () => {
  const [campaign, setCampaign] = useState('All Campaigns');
  const [type, setType] = useState<TaskType | 'All Types'>('All Types');
  const [assignee, setAssignee] = useState('All Personnel');
  const [status, setStatus] = useState<TaskStatus | 'Any Status'>('Any Status');
  const [selectedTask, setSelectedTask] = useState<PlannerTask | null>(tasks[2]);

  const visibleTasks = useMemo(
    () =>
      tasks.filter((task) => {
        const matchesCampaign = campaign === 'All Campaigns' || task.campaign === campaign;
        const matchesType = type === 'All Types' || task.type === type;
        const matchesAssignee = assignee === 'All Personnel' || task.assignee === assignee;
        const matchesStatus = status === 'Any Status' || task.status === status;
        return matchesCampaign && matchesType && matchesAssignee && matchesStatus;
      }),
    [assignee, campaign, status, type],
  );

  const resetFilters = () => {
    setCampaign('All Campaigns');
    setType('All Types');
    setAssignee('All Personnel');
    setStatus('Any Status');
  };

  return (
    <div className="mx-auto grid max-w-[1440px] gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
      <main className="min-w-0 space-y-6">
        <header className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-end">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-teal-command">
              HR Manager Portal
            </p>
            <h1 className="mt-2 text-2xl font-semibold tracking-tight text-deep-charcoal">
              Task Planner
            </h1>
            <p className="mt-1 max-w-[70ch] text-sm leading-6 text-slate-ink">
              Assign, track, and resolve recruitment tasks across active campaign plans.
            </p>
          </div>
        </header>

        <section
          className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4"
          aria-label="Task planner metrics"
        >
          {kpis.map((kpi) => (
            <section
              className="rounded-lg border border-border-warm bg-clean-surface p-5 shadow-sm"
              key={kpi.label}
            >
              <p className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-secondary">
                {kpi.label}
              </p>
              <div className="flex items-baseline gap-2">
                <span className={`font-mono text-[32px] font-semibold leading-none ${kpi.tone}`}>
                  {String(kpi.value).padStart(2, '0')}
                </span>
                <span className="text-sm font-semibold text-on-surface-variant">{kpi.helper}</span>
              </div>
            </section>
          ))}
        </section>

        <section className="rounded-lg border border-border-warm bg-clean-surface p-5 shadow-sm">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-[1fr_1fr_1fr_1fr_auto] xl:items-end">
             <label className="flex flex-col gap-1">
              <span className="text-xs font-semibold text-on-surface-variant">Campaign</span>
              <select
                aria-label="Filter by campaign"
                className="h-10 rounded-lg border border-border-warm bg-workflow-ivory px-3 text-sm outline-none focus:border-teal-command focus:ring-2 focus:ring-teal-command/20"
                onChange={(event) => setCampaign(event.target.value)}
                value={campaign}
              >
                <option>All Campaigns</option>
                <option>Q2 Marketing Specialist</option>
                <option>Senior Developer</option>
                <option>Product Designer</option>
                <option>UX Researcher</option>
                <option>Cloud Security Specialist</option>
              </select>
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-xs font-semibold text-on-surface-variant">Task Type</span>
              <select
                aria-label="Filter by task type"
                className="h-10 rounded-lg border border-border-warm bg-workflow-ivory px-3 text-sm outline-none focus:border-teal-command focus:ring-2 focus:ring-teal-command/20"
                onChange={(event) => setType(event.target.value as TaskType | 'All Types')}
                value={type}
              >
                <option>All Types</option>
                <option value="JOB_POSTING">Job Posting</option>
                <option value="CV_COLLECTION">CV Collection</option>
                <option value="CV_SCREENING">CV Screening</option>
                <option value="INTERVIEW_COORDINATION">Interview</option>
                <option value="REFERENCE_CHECK">Reference Check</option>
              </select>
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-xs font-semibold text-on-surface-variant">Assignee</span>
              <select
                aria-label="Filter by assignee"
                className="h-10 rounded-lg border border-border-warm bg-workflow-ivory px-3 text-sm outline-none focus:border-teal-command focus:ring-2 focus:ring-teal-command/20"
                onChange={(event) => setAssignee(event.target.value)}
                value={assignee}
              >
                <option>All Personnel</option>
                {tasks.map((task) => (
                  <option key={task.id}>{task.assignee}</option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-xs font-semibold text-on-surface-variant">Status</span>
              <select
                aria-label="Filter by status"
                className="h-10 rounded-lg border border-border-warm bg-workflow-ivory px-3 text-sm outline-none focus:border-teal-command focus:ring-2 focus:ring-teal-command/20"
                onChange={(event) => setStatus(event.target.value as TaskStatus | 'Any Status')}
                value={status}
              >
                <option>Any Status</option>
                <option>Completed</option>
                <option>In Progress</option>
                <option>Pending</option>
                <option>Blocked</option>
              </select>
            </label>
            <button
              className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-border-warm bg-workflow-ivory px-4 text-sm font-semibold text-slate-ink transition hover:bg-surface-variant active:scale-[0.98]"
              onClick={resetFilters}
              type="button"
            >
              <Icon className="h-4 w-4" name="filter" />
              Reset Filters
            </button>
          </div>
        </section>

        <section className="overflow-hidden rounded-lg border border-border-warm bg-clean-surface shadow-sm">
          <div className="overflow-x-auto">
            <table role="table" className="w-full min-w-[980px] border-collapse text-left">
              <thead role="rowgroup" className="bg-parchment-lift text-xs uppercase tracking-[0.14em] text-secondary">
                <tr role="row">
                  {[
                    'Task Type',
                    'Campaign',
                    'Assignee',
                    'Start Date',
                    'Due Date',
                    'Status',
                    'Blocker',
                    'Actions',
                  ].map((column) => (
                    <th
                      role="columnheader"
                      scope="col"
                      className={`px-5 py-4 font-semibold ${column === 'Actions' ? 'text-right' : ''}`}
                      key={column}
                    >
                      {column}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody role="rowgroup" className="divide-y divide-border-warm">
                {visibleTasks.map((task, index) => (
                  <tr
                    role="row"
                    tabIndex={0}
                    aria-label={`Task ${task.id}: ${task.type} for ${task.campaign}, status is ${task.status}`}
                    className={`cursor-pointer transition hover:bg-teal-command/5 ${index % 2 === 1 ? 'bg-workflow-ivory/50' : 'bg-clean-surface'} ${task.blocker ? 'border-l-4 border-revision' : ''}`}
                    key={task.id}
                    onClick={() => setSelectedTask(task)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault();
                        setSelectedTask(task);
                      }
                    }}
                  >
                    <td role="cell" className="px-5 py-4 font-mono text-sm font-semibold text-deep-charcoal">
                      {task.type}
                    </td>
                    <td role="cell" className="px-5 py-4 text-sm text-deep-charcoal">{task.campaign}</td>
                    <td role="cell" className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <span
                          className={`flex h-7 w-7 items-center justify-center rounded-full text-[10px] font-bold ${avatarStyles[index % avatarStyles.length]}`}
                        >
                          {task.initials}
                        </span>
                        <span className="text-sm text-deep-charcoal">{task.assignee}</span>
                      </div>
                    </td>
                    <td role="cell" className="px-5 py-4 text-sm text-slate-ink">{task.startDate}</td>
                    <td role="cell" className="px-5 py-4 text-sm text-slate-ink">{task.dueDate}</td>
                    <td role="cell" className="px-5 py-4">
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-bold uppercase ${statusStyles[task.status]}`}
                      >
                        <span className="h-1.5 w-1.5 rounded-full bg-current" />
                        {task.status}
                      </span>
                    </td>
                    <td
                      role="cell"
                      className={`px-5 py-4 text-sm ${task.blocker ? 'font-semibold text-rejected' : 'text-on-surface-variant/50'}`}
                    >
                      {task.blocker || '-'}
                    </td>
                    <td
                      role="cell"
                      className="px-5 py-4 text-right"
                      onClick={(event) => event.stopPropagation()}
                    >
                      <button
                        className="rounded p-1.5 text-on-surface-variant transition hover:text-teal-command"
                        type="button"
                      >
                        <Icon className="h-4 w-4" name="edit" />
                      </button>
                      <button
                        className="rounded p-1.5 text-on-surface-variant transition hover:text-rejected"
                        type="button"
                      >
                        <Icon className="h-4 w-4" name="trash" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex items-center justify-between border-t border-border-warm bg-parchment-lift/40 px-5 py-3">
            <p className="text-xs font-semibold text-on-surface-variant">
              Showing {visibleTasks.length} of {tasks.length} tasks in active cycle
            </p>
            <div className="flex items-center gap-2">
              <button
                className="rounded p-1 text-on-surface-variant opacity-40"
                disabled
                type="button"
              >
                <Icon className="h-4 w-4" name="chevronLeft" />
              </button>
              <span className="rounded border border-border-warm bg-clean-surface px-3 py-1 text-sm font-semibold">
                1
              </span>
              <button
                className="rounded p-1 text-on-surface-variant transition hover:bg-surface-variant"
                type="button"
              >
                <Icon className="h-4 w-4" name="chevronRight" />
              </button>
            </div>
          </div>
        </section>
      </main>

      <aside
        className={`min-w-0 rounded-lg border border-border-warm bg-clean-surface shadow-xl xl:sticky xl:top-6 xl:self-start ${selectedTask ? '' : 'hidden xl:block'}`}
      >
        {selectedTask ? (
          <>
            <header className="flex items-start justify-between border-b border-border-warm bg-workflow-ivory p-5">
              <div>
                <h2 className="text-lg font-semibold text-primary">Task Details</h2>
                <p className="mt-1 font-mono text-xs text-secondary">{selectedTask.type}</p>
              </div>
              <button
                className="rounded-full bg-teal-command p-2 text-white transition active:scale-[0.98]"
                onClick={() => setSelectedTask(null)}
                type="button"
              >
                <span className="sr-only">Close task detail</span>
                <Icon className="h-4 w-4" name="close" />
              </button>
            </header>
            <div className="space-y-6 p-5">
              <section>
                <p className="mb-2 text-xs font-bold uppercase tracking-[0.14em] text-secondary">
                  Plan Window
                </p>
                <div className="flex items-center gap-3 rounded border border-border-warm bg-workflow-ivory p-3">
                  <Icon className="h-5 w-5 text-primary" name="calendar" />
                  <span className="text-sm font-semibold text-deep-charcoal">
                    {selectedTask.planWindow}
                  </span>
                </div>
              </section>

              <section>
                <p className="mb-2 text-xs font-bold uppercase tracking-[0.14em] text-secondary">
                  Assignee
                </p>
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-teal-command/10 font-bold text-teal-command">
                    {selectedTask.initials}
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-deep-charcoal">
                      {selectedTask.assignee}
                    </p>
                    <p className="text-sm text-on-surface-variant">{selectedTask.role}</p>
                  </div>
                </div>
              </section>

              <section>
                <p className="mb-2 text-xs font-bold uppercase tracking-[0.14em] text-secondary">
                  Dependency
                </p>
                <div className="flex items-start gap-3 rounded border border-revision/30 bg-revision/5 p-3">
                  <Icon className="h-5 w-5 text-revision" name="warning" />
                  <p className="text-sm leading-6 text-deep-charcoal">
                    {selectedTask.blocker || 'No active dependency is blocking this task.'}
                  </p>
                </div>
              </section>

              <section>
                <p className="mb-2 text-xs font-bold uppercase tracking-[0.14em] text-secondary">
                  Comments
                </p>
                <div className="space-y-3">
                  {selectedTask.comments.map((comment) => (
                    <div
                      className="rounded border border-border-warm bg-workflow-ivory p-3 text-sm"
                      key={`${comment.author}-${comment.time}`}
                    >
                      <p className="mb-1 font-semibold text-primary">
                        {comment.author}{' '}
                        <span className="ml-2 text-[11px] font-normal text-on-surface-variant">
                          {comment.time}
                        </span>
                      </p>
                      <p className="leading-6 text-deep-charcoal">{comment.body}</p>
                    </div>
                  ))}
                  <textarea
                    aria-label="Add a comment"
                    className="h-24 w-full resize-none rounded border border-border-warm bg-clean-surface p-3 text-sm outline-none transition placeholder:text-on-surface-variant focus:border-teal-command focus:ring-2 focus:ring-teal-command/20"
                    placeholder="Add a comment..."
                  />
                </div>
              </section>
            </div>
            <footer className="space-y-4 border-t border-border-warm bg-workflow-ivory/60 p-5">
              <div className="flex items-center gap-3 rounded border border-error/20 bg-error/5 p-3">
                <Icon className="h-5 w-5 text-error" name="info" />
                <p className="text-xs font-semibold text-error">
                  Task dates must stay within the overall plan date range.
                </p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <button
                  className="h-10 rounded-lg border border-teal-command bg-clean-surface text-sm font-semibold text-teal-command transition hover:bg-teal-command/5 active:scale-[0.98]"
                  type="button"
                >
                  Reassign
                </button>
                <button
                  className="h-10 rounded-lg bg-teal-command text-sm font-semibold text-white transition hover:bg-primary active:scale-[0.98]"
                  type="button"
                >
                  Mark Complete
                </button>
              </div>
              <button
                className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg border border-border-warm bg-workflow-ivory text-sm font-semibold text-rejected transition hover:bg-rejected/5 active:scale-[0.98]"
                type="button"
              >
                <Icon className="h-4 w-4" name="bolt" />
                Escalate
              </button>
            </footer>
          </>
        ) : (
          <div className="p-8 text-center">
            <p className="text-sm font-semibold text-deep-charcoal">Select a task</p>
            <p className="mt-1 text-sm text-on-surface-variant">
              Choose a row to inspect task details.
            </p>
          </div>
        )}
      </aside>
    </div>
  );
};
