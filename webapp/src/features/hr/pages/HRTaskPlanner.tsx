import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { apiRequest, ApiError } from '../../../lib/api';
import { HRActionButton, HRCard, HRInlineAlert, HRLoadingState, HRPageHeader } from '../components';

type TaskStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED';
type TaskType =
  | 'JOB_POSTING'
  | 'CV_COLLECTION'
  | 'CV_SCREENING'
  | 'INTERVIEW_COORDINATION'
  | 'HIRING';

type TaskPlanApiItem = {
  id: string;
  overallPlanId: string;
  taskType: TaskType;
  assignedToId: string;
  startDate: string;
  endDate: string;
  status: TaskStatus;
  reminders?: Array<{
    reminderKey: string;
    scheduledFor: string;
    status: 'PENDING' | 'PROCESSING' | 'SENT' | 'FAILED' | 'SKIPPED';
  }>;
  updatedAt: string;
  assignedTo: { id: string; displayName: string; email?: string } | null;
  overallPlan: {
    id: string;
    requestId: string;
    startDate: string;
    endDate: string;
    status: string;
    request: {
      id: string;
      position: string;
      headcount: number;
      department: { id: string; name: string; code: string } | null;
    };
  };
};

type CvCollectionStats = {
  total: number;
  byCollector: Record<string, number>;
};

type ApplicationApiItem = {
  id: string;
  requestId: string;
  collectedBy: { id: string; displayName: string; email?: string } | null;
};

const TASK_TYPE_LABELS: Record<TaskType, string> = {
  JOB_POSTING: 'Job Posting',
  CV_COLLECTION: 'Sourcing',
  CV_SCREENING: 'CV Screening',
  INTERVIEW_COORDINATION: 'Interview Coordination',
  HIRING: 'Hiring',
};

const STATUS_LABELS: Record<TaskStatus, string> = {
  PENDING: 'Pending',
  IN_PROGRESS: 'In Progress',
  COMPLETED: 'Completed',
};

const statusStyles: Record<TaskStatus, string> = {
  COMPLETED: 'border-approved/20 bg-approved/10 text-approved',
  IN_PROGRESS: 'border-pending/20 bg-pending/10 text-pending',
  PENDING: 'border-revision/20 bg-revision/10 text-revision',
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
  check: <path d="m5 12 4 4L19 6" />,
  close: <path d="m6 6 12 12M18 6 6 18" />,
  info: <path d="M12 16v-4m0-4h.01M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />,
  arrow: <path d="M5 12h14m-6-6 6 6-6 6" />,
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
  new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric' }).format(new Date(value));

const getInitials = (name: string) =>
  name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase() ?? '')
    .join('') || '??';

const startOfWeek = (date: Date) => {
  const result = new Date(date);
  const day = result.getDay();
  result.setHours(0, 0, 0, 0);
  result.setDate(result.getDate() - (day === 0 ? 6 : day - 1));
  return result;
};

export const TaskPlanner: React.FC = () => {
  const navigate = useNavigate();
  const { token } = useAuth();
  const [tasks, setTasks] = useState<TaskPlanApiItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState('');
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [campaign, setCampaign] = useState('All Campaigns');
  const [type, setType] = useState<TaskType | 'All Types'>('All Types');
  const [assignee, setAssignee] = useState('All Personnel');
  const [status, setStatus] = useState<TaskStatus | 'Any Status'>('Any Status');
  const [selectedTask, setSelectedTask] = useState<TaskPlanApiItem | null>(null);
  const [cvCollectionStats, setCvCollectionStats] = useState<Record<string, CvCollectionStats>>({});

  const loadTasks = async () => {
    setLoading(true);
    setApiError('');
    try {
      const response = await apiRequest<TaskPlanApiItem[]>('/task-plan', token);
      setTasks(response);
      const sourcingRequestIds = [
        ...new Set(
          response
            .filter((task) => task.taskType === 'CV_COLLECTION')
            .map((task) => task.overallPlan.requestId),
        ),
      ];
      const statsEntries = await Promise.all(
        sourcingRequestIds.map(async (requestId) => {
          const applications = await apiRequest<ApplicationApiItem[]>(
            `/applications?requestId=${requestId}`,
            token,
          ).catch(() => []);
          const byCollector = applications.reduce<Record<string, number>>((acc, application) => {
            const collectorId = application.collectedBy?.id;
            if (collectorId) acc[collectorId] = (acc[collectorId] ?? 0) + 1;
            return acc;
          }, {});
          return [requestId, { total: applications.length, byCollector }] as const;
        }),
      );
      setCvCollectionStats(Object.fromEntries(statsEntries));
      setSelectedTask((current) =>
        current
          ? (response.find((task) => task.id === current.id) ?? response[0] ?? null)
          : (response[0] ?? null),
      );
    } catch (loadError) {
      setApiError(loadError instanceof Error ? loadError.message : 'Unable to load task plans');
      setTasks([]);
      setCvCollectionStats({});
      setSelectedTask(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadTasks();
  }, [token]);

  const campaignOptions = useMemo(
    () => Array.from(new Set(tasks.map((task) => task.overallPlan.request.position))).sort(),
    [tasks],
  );

  const assigneeOptions = useMemo(
    () =>
      Array.from(new Set(tasks.map((task) => task.assignedTo?.displayName ?? 'Unassigned'))).sort(),
    [tasks],
  );

  const visibleTasks = useMemo(
    () =>
      tasks.filter((task) => {
        const taskCampaign = task.overallPlan.request.position;
        const taskAssignee = task.assignedTo?.displayName ?? 'Unassigned';
        const matchesCampaign = campaign === 'All Campaigns' || taskCampaign === campaign;
        const matchesType = type === 'All Types' || task.taskType === type;
        const matchesAssignee = assignee === 'All Personnel' || taskAssignee === assignee;
        const matchesStatus = status === 'Any Status' || task.status === status;
        return matchesCampaign && matchesType && matchesAssignee && matchesStatus;
      }),
    [assignee, campaign, status, tasks, type],
  );

  const now = new Date();
  const weekStart = startOfWeek(now);
  const kpis = [
    {
      label: 'Overdue Tasks',
      value: tasks.filter((task) => task.status !== 'COMPLETED' && new Date(task.endDate) < now)
        .length,
      helper: 'Need attention',
      tone: 'text-rejected',
    },
    {
      label: 'In Progress',
      value: tasks.filter((task) => task.status === 'IN_PROGRESS').length,
      helper: 'Tasks',
      tone: 'text-primary',
    },
    {
      label: 'Pending',
      value: tasks.filter((task) => task.status === 'PENDING').length,
      helper: 'Tasks',
      tone: 'text-revision',
    },
    {
      label: 'Completed This Week',
      value: tasks.filter(
        (task) =>
          task.status === 'COMPLETED' && new Date(task.updatedAt ?? task.endDate) >= weekStart,
      ).length,
      helper: 'Tasks',
      tone: 'text-approved',
    },
  ];

  const resetFilters = () => {
    setCampaign('All Campaigns');
    setType('All Types');
    setAssignee('All Personnel');
    setStatus('Any Status');
  };

  const getSourcingStats = (task: TaskPlanApiItem) => {
    if (task.taskType !== 'CV_COLLECTION') return null;
    const stats = cvCollectionStats[task.overallPlan.requestId] ?? { total: 0, byCollector: {} };
    const assigneeCollected = task.assignedToId
      ? (stats.byCollector[task.assignedToId] ?? 0)
      : 0;
    return {
      total: stats.total,
      assigneeCollected,
    };
  };

  const updateTaskStatus = async (taskId: string, nextStatus: TaskStatus) => {
    setUpdatingId(taskId);
    setApiError('');
    try {
      const updated = await apiRequest<TaskPlanApiItem>(`/task-plan/${taskId}/status`, token, {
        method: 'PATCH',
        body: JSON.stringify({ status: nextStatus }),
      });
      setTasks((current) =>
        current.map((task) => (task.id === taskId ? { ...task, ...updated } : task)),
      );
      setSelectedTask((current) => (current?.id === taskId ? { ...current, ...updated } : current));
      return true;
    } catch (updateError) {
      setApiError(updateError instanceof ApiError ? updateError.message : 'Unable to update task');
      return false;
    } finally {
      setUpdatingId(null);
    }
  };

  const getTaskWorkUrl = (task: TaskPlanApiItem) => {
    const requestId = encodeURIComponent(task.overallPlan.requestId);
    switch (task.taskType) {
      case 'JOB_POSTING':
        return `/hr/job-postings/${requestId}`;
      case 'CV_COLLECTION':
        return `/hr/candidates?requestId=${requestId}&task=CV_COLLECTION`;
      case 'CV_SCREENING':
        return `/hr/search?requestId=${requestId}&task=CV_SCREENING`;
      case 'INTERVIEW_COORDINATION':
        return `/hr/interviews?requestId=${requestId}&task=INTERVIEW_COORDINATION`;
      case 'HIRING':
        return `/hr/campaigns/${requestId}`;
      default:
        return `/hr/campaigns/${requestId}`;
    }
  };

  const startTask = async (task: TaskPlanApiItem) => {
    const canNavigate =
      task.status === 'PENDING'
        ? await updateTaskStatus(task.id, 'IN_PROGRESS')
        : task.status === 'IN_PROGRESS';
    if (canNavigate) {
      navigate(getTaskWorkUrl(task));
    }
  };

  return (
    <div className="mx-auto grid max-w-[1440px] gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
      <main className="min-w-0 space-y-6">
        <HRPageHeader
          eyebrow="HR Manager Portal"
          title="Task Planner"
          description="Track task plans assigned from approved recruitment campaigns."
          actions={
            <HRActionButton onClick={() => navigate('/hr/campaigns')} variant="secondary">
              Open Campaigns
              <Icon className="h-4 w-4" name="arrow" />
            </HRActionButton>
          }
        />

        {apiError ? <HRInlineAlert>{apiError}</HRInlineAlert> : null}

        {loading ? <HRLoadingState label="Loading task plans..." /> : null}

        <section
          className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4"
          aria-label="Task planner metrics"
        >
          {kpis.map((kpi) => (
            <HRCard as="section" className="rounded-lg p-5 shadow-sm" key={kpi.label}>
              <p className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-secondary">
                {kpi.label}
              </p>
              <div className="flex items-baseline gap-2">
                <span className={`font-mono text-[32px] font-semibold leading-none ${kpi.tone}`}>
                  {String(kpi.value).padStart(2, '0')}
                </span>
                <span className="text-sm font-semibold text-on-surface-variant">{kpi.helper}</span>
              </div>
            </HRCard>
          ))}
        </section>

        <section className="rounded-lg border border-border-warm bg-clean-surface p-5 shadow-sm">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-[1fr_1fr_1fr_1fr_auto] xl:items-end">
            <label className="flex flex-col gap-1">
              <span className="text-xs font-semibold text-on-surface-variant">Campaign</span>
              <select
                className="h-10 rounded-lg border border-border-warm bg-workflow-ivory px-3 text-sm outline-none focus:border-teal-command focus:ring-2 focus:ring-teal-command/20"
                onChange={(event) => setCampaign(event.target.value)}
                value={campaign}
              >
                <option>All Campaigns</option>
                {campaignOptions.map((option) => (
                  <option key={option}>{option}</option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-xs font-semibold text-on-surface-variant">Task Type</span>
              <select
                className="h-10 rounded-lg border border-border-warm bg-workflow-ivory px-3 text-sm outline-none focus:border-teal-command focus:ring-2 focus:ring-teal-command/20"
                onChange={(event) => setType(event.target.value as TaskType | 'All Types')}
                value={type}
              >
                <option>All Types</option>
                {Object.entries(TASK_TYPE_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-xs font-semibold text-on-surface-variant">Assignee</span>
              <select
                className="h-10 rounded-lg border border-border-warm bg-workflow-ivory px-3 text-sm outline-none focus:border-teal-command focus:ring-2 focus:ring-teal-command/20"
                onChange={(event) => setAssignee(event.target.value)}
                value={assignee}
              >
                <option>All Personnel</option>
                {assigneeOptions.map((option) => (
                  <option key={option}>{option}</option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-xs font-semibold text-on-surface-variant">Status</span>
              <select
                className="h-10 rounded-lg border border-border-warm bg-workflow-ivory px-3 text-sm outline-none focus:border-teal-command focus:ring-2 focus:ring-teal-command/20"
                onChange={(event) => setStatus(event.target.value as TaskStatus | 'Any Status')}
                value={status}
              >
                <option>Any Status</option>
                {Object.entries(STATUS_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
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
            <table className="w-full min-w-[980px] border-collapse text-left">
              <thead className="bg-parchment-lift text-xs uppercase tracking-[0.14em] text-secondary">
                <tr>
                  {[
                    'Task Type',
                    'Campaign',
                    'Assignee',
                    'Start Date',
                    'Due Date',
                    'Status',
                    'Actions',
                  ].map((column) => (
                    <th
                      className={`px-5 py-4 font-semibold ${column === 'Actions' ? 'text-right' : ''}`}
                      key={column}
                    >
                      {column}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border-warm">
                {visibleTasks.map((task, index) => {
                  const assigneeName = task.assignedTo?.displayName ?? 'Unassigned';
                  const isOverdue = task.status !== 'COMPLETED' && new Date(task.endDate) < now;
                  const sourcingStats = getSourcingStats(task);

                  return (
                    <tr
                      className={`cursor-pointer transition hover:bg-teal-command/5 ${
                        index % 2 === 1 ? 'bg-workflow-ivory/50' : 'bg-clean-surface'
                      } ${isOverdue ? 'border-l-4 border-rejected' : ''}`}
                      key={task.id}
                      onClick={() => setSelectedTask(task)}
                    >
                      <td className="px-5 py-4 font-mono text-sm font-semibold text-deep-charcoal">
                        <div>{TASK_TYPE_LABELS[task.taskType]}</div>
                        {sourcingStats ? (
                          <span className="mt-1 inline-flex rounded-full border border-teal-command/20 bg-teal-command/10 px-2 py-0.5 text-[11px] font-bold text-teal-command">
                            {sourcingStats.assigneeCollected}/{sourcingStats.total} CVs collected
                          </span>
                        ) : null}
                      </td>
                      <td className="px-5 py-4 text-sm text-deep-charcoal">
                        {task.overallPlan.request.position}
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          <span
                            className={`flex h-7 w-7 items-center justify-center rounded-full text-[10px] font-bold ${avatarStyles[index % avatarStyles.length]}`}
                          >
                            {getInitials(assigneeName)}
                          </span>
                          <span className="text-sm text-deep-charcoal">{assigneeName}</span>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-sm text-slate-ink">
                        <div>{formatDate(task.startDate)}</div>
                        {task.reminders?.some((reminder) => reminder.status === 'SENT') ? (
                          <span className="text-[10px] font-semibold uppercase text-teal-command">
                            Reminder sent
                          </span>
                        ) : task.reminders?.some((reminder) => reminder.status === 'PENDING') ? (
                          <span className="text-[10px] font-semibold uppercase text-slate-ink">
                            Reminder scheduled
                          </span>
                        ) : null}
                      </td>
                      <td
                        className={`px-5 py-4 text-sm ${
                          isOverdue ? 'font-semibold text-rejected' : 'text-slate-ink'
                        }`}
                      >
                        {formatDate(task.endDate)}
                      </td>
                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-bold uppercase ${statusStyles[task.status]}`}
                        >
                          <span className="h-1.5 w-1.5 rounded-full bg-current" />
                          {STATUS_LABELS[task.status]}
                        </span>
                      </td>
                      <td
                        className="px-5 py-4 text-right"
                        onClick={(event) => event.stopPropagation()}
                      >
                        {task.status === 'PENDING' ? (
                          <button
                            className="text-xs font-semibold text-teal-command transition hover:underline disabled:cursor-not-allowed disabled:opacity-50"
                            disabled={updatingId === task.id}
                            onClick={() => void startTask(task)}
                            type="button"
                          >
                            Start Plan
                          </button>
                        ) : null}
                        {task.status === 'IN_PROGRESS' ? (
                          <button
                            className="text-xs font-semibold text-teal-command transition hover:underline disabled:cursor-not-allowed disabled:opacity-50"
                            disabled={updatingId === task.id}
                            onClick={() => void startTask(task)}
                            type="button"
                          >
                            Open Work
                          </button>
                        ) : null}
                        {task.status !== 'COMPLETED' ? (
                          <button
                            className="ml-3 text-xs font-semibold text-approved transition hover:underline disabled:cursor-not-allowed disabled:opacity-50"
                            disabled={updatingId === task.id}
                            onClick={() => void updateTaskStatus(task.id, 'COMPLETED')}
                            type="button"
                          >
                            Complete
                          </button>
                        ) : null}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {!loading && visibleTasks.length === 0 ? (
            <div className="border-t border-border-warm px-6 py-10 text-center text-sm text-on-surface-variant">
              No task plans match this view.
            </div>
          ) : null}
          <div className="border-t border-border-warm bg-parchment-lift/40 px-5 py-3">
            <p className="text-xs font-semibold text-on-surface-variant">
              Showing {visibleTasks.length} of {tasks.length} task plans
            </p>
          </div>
        </section>
      </main>

      <aside
        className={`min-w-0 rounded-lg border border-border-warm bg-clean-surface shadow-xl xl:sticky xl:top-6 xl:self-start ${
          selectedTask ? '' : 'hidden xl:block'
        }`}
      >
        {selectedTask ? (
          <>
            <header className="flex items-start justify-between border-b border-border-warm bg-workflow-ivory p-5">
              <div>
                <h2 className="text-lg font-semibold text-primary">Task Details</h2>
                <p className="mt-1 font-mono text-xs text-secondary">
                  {TASK_TYPE_LABELS[selectedTask.taskType]}
                </p>
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
                  Campaign
                </p>
                <button
                  className="w-full rounded border border-border-warm bg-workflow-ivory p-3 text-left transition hover:border-teal-command"
                  onClick={() => navigate(`/hr/campaigns/${selectedTask.overallPlan.requestId}`)}
                  type="button"
                >
                  <p className="text-sm font-semibold text-deep-charcoal">
                    {selectedTask.overallPlan.request.position}
                  </p>
                  <p className="mt-1 text-xs text-on-surface-variant">
                    {selectedTask.overallPlan.request.department?.name ?? 'Unassigned'} / HC{' '}
                    {selectedTask.overallPlan.request.headcount}
                  </p>
                </button>
              </section>

              <section>
                <p className="mb-2 text-xs font-bold uppercase tracking-[0.14em] text-secondary">
                  Plan Window
                </p>
                <div className="flex items-center gap-3 rounded border border-border-warm bg-workflow-ivory p-3">
                  <Icon className="h-5 w-5 text-primary" name="calendar" />
                  <span className="text-sm font-semibold text-deep-charcoal">
                    {formatDate(selectedTask.startDate)} - {formatDate(selectedTask.endDate)}
                  </span>
                </div>
              </section>

              <section>
                <p className="mb-2 text-xs font-bold uppercase tracking-[0.14em] text-secondary">
                  Assignee
                </p>
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-teal-command/10 font-bold text-teal-command">
                    {getInitials(selectedTask.assignedTo?.displayName ?? 'Unassigned')}
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-deep-charcoal">
                      {selectedTask.assignedTo?.displayName ?? 'Unassigned'}
                    </p>
                    <p className="text-sm text-on-surface-variant">
                      {selectedTask.assignedTo?.email ?? 'No email available'}
                    </p>
                  </div>
                </div>
              </section>

              {selectedTask.taskType === 'CV_COLLECTION' ? (
                <section>
                  <p className="mb-2 text-xs font-bold uppercase tracking-[0.14em] text-secondary">
                    Sourcing Output
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded border border-teal-command/20 bg-teal-command/10 p-3">
                      <p className="font-mono text-2xl font-bold text-teal-command">
                        {getSourcingStats(selectedTask)?.total ?? 0}
                      </p>
                      <p className="text-xs font-semibold text-slate-ink">Campaign CVs</p>
                    </div>
                    <div className="rounded border border-approved/20 bg-approved/10 p-3">
                      <p className="font-mono text-2xl font-bold text-approved">
                        {getSourcingStats(selectedTask)?.assigneeCollected ?? 0}
                      </p>
                      <p className="text-xs font-semibold text-slate-ink">Assignee CVs</p>
                    </div>
                  </div>
                </section>
              ) : null}

              <section>
                <p className="mb-2 text-xs font-bold uppercase tracking-[0.14em] text-secondary">
                  Status
                </p>
                <span
                  className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-bold uppercase ${statusStyles[selectedTask.status]}`}
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-current" />
                  {STATUS_LABELS[selectedTask.status]}
                </span>
              </section>
            </div>
            <footer className="space-y-4 border-t border-border-warm bg-workflow-ivory/60 p-5">
              <div className="flex items-center gap-3 rounded border border-error/20 bg-error/5 p-3">
                <Icon className="h-5 w-5 text-error" name="info" />
                <p className="text-xs font-semibold text-error">
                  Task dates are controlled by the campaign overall plan.
                </p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <button
                  className="h-10 rounded-lg border border-teal-command bg-clean-surface text-sm font-semibold text-teal-command transition hover:bg-teal-command/5 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
                  disabled={selectedTask.status !== 'PENDING' || updatingId === selectedTask.id}
                  onClick={() => void startTask(selectedTask)}
                  type="button"
                >
                  Start Plan
                </button>
                <button
                  className="h-10 rounded-lg bg-teal-command text-sm font-semibold text-white transition hover:bg-primary active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
                  disabled={selectedTask.status === 'COMPLETED' || updatingId === selectedTask.id}
                  onClick={() => void updateTaskStatus(selectedTask.id, 'COMPLETED')}
                  type="button"
                >
                  Mark Complete
                </button>
              </div>
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
