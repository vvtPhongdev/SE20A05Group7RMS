import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { apiRequest, ApiError } from '../../../lib/api';
import { mapPlanStatus, type PlanStatus } from '../../../lib/planStatus';

type KanbanStage = 'applied' | 'cv_screening' | 'interview' | 'final_review' | 'offer';
type DetailTab = 'kanban' | 'calendar' | 'tasks';

type Candidate = {
  id: string;
  name: string;
  initials: string;
  stage: KanbanStage;
  color: string;
  appliedDate: string;
  tags: string[];
};

type Interview = {
  id: string;
  candidateName: string;
  initials: string;
  color: string;
  status: string;
  date: string;
  time: string;
  location: string;
  interviewer: string;
};

type TaskItem = {
  id: string;
  taskType: string;
  title: string;
  done: boolean;
  startDate: string;
  startDateInput: string;
  dueDate: string;
  dueDateInput: string;
  assigneeId?: string;
  assigneeName?: string;
  assigneeRole?: string;
};

type CampaignData = {
  id: string;
  position: string;
  department: string;
  headcount: number;
  status: PlanStatus;
  window: string;
  owner: string;
  budget: string;
  progress: number;
  description: string;
};

interface RecruitmentRequestApiItem {
  id: string;
  position: string;
  department: { id: string; name: string; code: string } | null;
  reviewedBy: { id: string; displayName: string } | null;
  status: string;
  headcount: number;
  jobDescription: string;
  skillRequirements: Record<string, unknown> | null;
}

interface TaskPlanApiItem {
  id: string;
  overallPlanId: string;
  taskType: string;
  status: string;
  startDate: string;
  endDate: string;
  assignedTo: { id: string; displayName: string; role?: string; email?: string } | null;
}

interface OverallPlanFull {
  id: string;
  status: string;
  startDate: string;
  endDate: string;
  revisionNotes: string | null;
  createdBy: { id: string; displayName: string } | null;
  approvedBy: { id: string; displayName: string } | null;
  tasks: TaskPlanApiItem[];
}

interface ApplicationApiItem {
  id: string;
  requestId: string;
  candidateId: string;
  status: string;
  createdAt: string;
  collectedBy: { id: string; displayName: string; email?: string } | null;
  candidate: {
    id: string;
    fullName: string;
    structuredData: Record<string, unknown> | null;
    cvDocuments: Array<{ screeningStatus: string }>;
  };
}

interface InterviewScheduleApiItem {
  id: string;
  requestId: string;
  candidateId: string;
  scheduledAt: string;
  duration: number;
  location: string;
  interviewers: string[];
  status: string;
}

interface JobPostingApiItem {
  id: string;
  requestId: string;
  title: string;
  status: string;
  visibility: string;
}

type HrMemberOption = {
  id: string;
  name: string;
  email?: string;
};

const TASK_TYPE_LABELS: Record<string, string> = {
  JOB_POSTING: 'Publish job posting',
  CV_COLLECTION: 'Collect candidate CVs',
  CV_SCREENING: 'Screen incoming CVs',
  INTERVIEW_COORDINATION: 'Coordinate interviews',
};

const CANDIDATE_COLOR_PALETTE = [
  'bg-teal-command',
  'bg-revision',
  'bg-pending',
  'bg-approved',
  'bg-slate-ink',
  'bg-draft',
  'bg-teal-command/70',
];

const formatDate = (value: string) =>
  new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric' }).format(new Date(value));

const toDateInputValue = (value: string) => new Date(value).toISOString().slice(0, 10);

const getInitials = (name: string) =>
  name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase() ?? '')
    .join('') || '??';

const getCurrentWeekDays = () => {
  const today = new Date();
  const dayOfWeek = today.getDay();
  const monday = new Date(today);
  monday.setDate(today.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));

  return Array.from({ length: 5 }, (_, index) => {
    const date = new Date(monday);
    date.setDate(monday.getDate() + index);
    return {
      label: `${date.toLocaleDateString('en-US', { weekday: 'short' })} ${date.getDate()}`,
      date,
    };
  });
};

const kanbanColumns: Array<{ key: KanbanStage; label: string; accent: string; bg: string }> = [
  { key: 'applied', label: 'Applied', accent: 'border-slate-400', bg: 'bg-slate-50' },
  {
    key: 'cv_screening',
    label: 'CV Screening',
    accent: 'border-teal-command',
    bg: 'bg-teal-command/5',
  },
  { key: 'interview', label: 'Interview', accent: 'border-revision', bg: 'bg-amber-50' },
  { key: 'final_review', label: 'Final Review', accent: 'border-pending', bg: 'bg-cyan-50' },
  { key: 'offer', label: 'Offer', accent: 'border-approved', bg: 'bg-green-50' },
];

const timeSlots = [
  '09:00 AM',
  '10:00 AM',
  '11:00 AM',
  '12:00 PM',
  '01:00 PM',
  '02:00 PM',
  '03:00 PM',
  '04:00 PM',
];

const statusConfig: Record<PlanStatus, { label: string; dot: string; badge: string }> = {
  PENDING_APPROVAL: {
    label: 'PENDING_APPROVAL',
    dot: 'bg-pending',
    badge: 'border-pending/20 bg-pending/10 text-pending',
  },
  APPROVED: {
    label: 'APPROVED',
    dot: 'bg-approved',
    badge: 'border-approved/20 bg-approved/10 text-approved',
  },
  DRAFT: { label: 'DRAFT', dot: 'bg-draft', badge: 'border-draft/20 bg-draft/10 text-draft' },
  REVISION_REQUIRED: {
    label: 'REVISION_REQUIRED',
    dot: 'bg-revision',
    badge: 'border-revision/20 bg-revision/10 text-revision',
  },
};

const iconPaths: Record<string, React.ReactNode> = {
  back: <path d="M19 12H5m6-6-6 6 6 6" />,
  edit: <path d="m4 20 4.5-1 10-10a2.1 2.1 0 0 0-3-3l-10 10L4 20Zm12-14 3 3" />,
  send: <path d="m22 2-7 20-4-9-9-4 20-7Z" />,
  kanban: <path d="M4 5h5v14H4zM10 5h5v8h-5zM16 5h4v11h-4z" />,
  calendar: (
    <path d="M7 3v4m10-4v4M4 9h16M6 5h12a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2Z" />
  ),
  checklist: <path d="m4 7 1.5 1.5L8 6m4 1h8M4 13l1.5 1.5L8 12m4 1h8M4 19l1.5 1.5L8 18m4 1h8" />,
  plus: <path d="M12 5v14M5 12h14" />,
  userPlus: <path d="M16 21a6 6 0 0 0-12 0m8-13a4 4 0 1 1-8 0 4 4 0 0 1 8 0Zm5 3v6m-3-3h6" />,
  report: <path d="M7 3h7l5 5v13H7zM14 3v5h5M10 13h6m-6 4h4" />,
  check: <path d="m5 12 4 4L19 6" />,
  close: <path d="m6 6 12 12M18 6 6 18" />,
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

const StatusBadge = ({ status }: { status: PlanStatus }) => {
  const config = statusConfig[status];

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-bold ${config.badge}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${config.dot}`} />
      {config.label}
    </span>
  );
};

const CandidateCard = ({ candidate }: { candidate: Candidate }) => (
  <article className="cursor-grab select-none rounded-lg border border-border-warm bg-clean-surface p-3 shadow-sm transition hover:-translate-y-[1px] hover:shadow-md active:scale-[0.98]">
    <div className="mb-2 flex items-start gap-2.5">
      <div
        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[11px] font-bold text-white ${candidate.color}`}
      >
        {candidate.initials}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold leading-tight text-deep-charcoal">
          {candidate.name}
        </p>
      </div>
    </div>
    <div className="flex flex-wrap gap-1">
      {candidate.tags.map((tag) => (
        <span
          className="rounded bg-surface-variant px-1.5 py-0.5 text-[10px] font-medium text-on-surface-variant"
          key={tag}
        >
          {tag}
        </span>
      ))}
    </div>
    <p className="mt-2 text-[10px] text-on-surface-variant">Applied {candidate.appliedDate}</p>
  </article>
);

export const HRCampaignDetail: React.FC = () => {
  const navigate = useNavigate();
  const { token, user } = useAuth();
  const { id } = useParams<{ id: string }>();
  const campaignId = id?.replace(/^#/, '') ?? '';
  const isHrLeader = user?.role === 'HR_LEADER';
  const isHrRecruiter = user?.role === 'HR_RECRUITER';

  const [activeTab, setActiveTab] = useState<DetailTab>('kanban');
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState('');
  const [request, setRequest] = useState<RecruitmentRequestApiItem | null>(null);
  const [plan, setPlan] = useState<OverallPlanFull | null>(null);
  const [applications, setApplications] = useState<ApplicationApiItem[]>([]);
  const [schedules, setSchedules] = useState<InterviewScheduleApiItem[]>([]);
  const [jobPosting, setJobPosting] = useState<JobPostingApiItem | null>(null);

  const [actionError, setActionError] = useState('');
  const [actionSubmitting, setActionSubmitting] = useState(false);
  const [quickActionError, setQuickActionError] = useState('');
  const [quickActionSubmitting, setQuickActionSubmitting] = useState<string | null>(null);

  const [taskActionError, setTaskActionError] = useState('');
  const [taskBusyId, setTaskBusyId] = useState<string | null>(null);
  const [showAddTask, setShowAddTask] = useState(false);
  const [newTaskType, setNewTaskType] = useState('JOB_POSTING');
  const [newTaskStart, setNewTaskStart] = useState('');
  const [newTaskDue, setNewTaskDue] = useState('');
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [editTaskType, setEditTaskType] = useState('JOB_POSTING');
  const [editTaskStart, setEditTaskStart] = useState('');
  const [editTaskDue, setEditTaskDue] = useState('');
  const [hrMembers, setHrMembers] = useState<HrMemberOption[]>([]);
  const [membersLoading, setMembersLoading] = useState(false);
  const [addTaskSubmitting, setAddTaskSubmitting] = useState(false);

  const [showScheduleForm, setShowScheduleForm] = useState(false);
  const [scheduleCandidateId, setScheduleCandidateId] = useState('');
  const [scheduleAt, setScheduleAt] = useState('');
  const [scheduleDuration, setScheduleDuration] = useState('60');
  const [scheduleLocation, setScheduleLocation] = useState('');

  const loadCampaign = async () => {
    setLoading(true);
    setApiError('');
    try {
      const [
        requestResponse,
        planResponse,
        applicationsResponse,
        schedulesResponse,
        jobPostingsResponse,
      ] =
        await Promise.all([
          apiRequest<RecruitmentRequestApiItem>(`/recruitment-requests/${campaignId}`, token),
          apiRequest<OverallPlanFull>(`/overall-plan/by-request/${campaignId}`, token).catch(
            (planError) => {
              if (planError instanceof ApiError && planError.status === 404) return null;
              throw planError;
            },
          ),
          apiRequest<ApplicationApiItem[]>(`/applications?requestId=${campaignId}`, token),
          apiRequest<InterviewScheduleApiItem[]>(
            `/interviews/requests/${campaignId}/schedules`,
            token,
          ).catch(() => []),
          apiRequest<JobPostingApiItem[]>('/job-postings', token).catch(() => []),
        ]);
      if (
        user?.role === 'HR_RECRUITER' &&
        !planResponse?.tasks.some((task) => task.assignedTo?.id === user.id)
      ) {
        setApiError('You can only view campaigns with tasks assigned to you by an HR Leader.');
        setRequest(null);
        setPlan(null);
        setApplications([]);
        setSchedules([]);
        setJobPosting(null);
        return;
      }
      setRequest(requestResponse);
      setPlan(planResponse);
      setApplications(applicationsResponse);
      setSchedules(schedulesResponse);
      setJobPosting(jobPostingsResponse.find((posting) => posting.requestId === campaignId) ?? null);
    } catch (loadError) {
      setApiError(loadError instanceof Error ? loadError.message : 'Unable to load campaign');
      setRequest(null);
      setPlan(null);
      setApplications([]);
      setSchedules([]);
      setJobPosting(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadCampaign();
  }, [token, campaignId, user?.id, user?.role]);

  useEffect(() => {
    if (!isHrLeader) return;

    const loadHrMembers = async () => {
      setMembersLoading(true);
      try {
        const response = await apiRequest<{
          data: Array<{ id: string; displayName: string; email?: string }>;
        }>('/users?role=HR_RECRUITER&limit=100', token);
        setHrMembers(
          response.data.map((member) => ({
            id: member.id,
            name: member.displayName,
            email: member.email,
          })),
        );
      } catch (memberError) {
        setTaskActionError(
          memberError instanceof Error ? memberError.message : 'Unable to load HR recruiters',
        );
      } finally {
        setMembersLoading(false);
      }
    };

    void loadHrMembers();
  }, [isHrLeader, token]);

  const tasks: TaskItem[] = useMemo(
    () =>
      (plan?.tasks ?? []).map((task) => ({
        id: task.id,
        taskType: task.taskType,
        title: TASK_TYPE_LABELS[task.taskType] ?? task.taskType,
        done: task.status === 'COMPLETED',
        startDate: formatDate(task.startDate),
        startDateInput: toDateInputValue(task.startDate),
        dueDate: formatDate(task.endDate),
        dueDateInput: toDateInputValue(task.endDate),
        assigneeId: task.assignedTo?.role === 'HR_RECRUITER' ? task.assignedTo.id : undefined,
        assigneeName:
          task.assignedTo?.role === 'HR_RECRUITER' ? task.assignedTo.displayName : undefined,
        assigneeRole: task.assignedTo?.role,
      })),
    [plan],
  );

  const completedTasks = tasks.filter((task) => task.done).length;
  const taskProgress = tasks.length > 0 ? Math.round((completedTasks / tasks.length) * 100) : 0;
  const visibleTasks = useMemo(
    () => (isHrRecruiter ? tasks.filter((task) => task.assigneeId === user?.id) : tasks),
    [isHrRecruiter, tasks, user?.id],
  );
  const visibleCompletedTasks = visibleTasks.filter((task) => task.done).length;
  const visibleTaskProgress =
    visibleTasks.length > 0 ? Math.round((visibleCompletedTasks / visibleTasks.length) * 100) : 0;
  const recruiterAssignedTaskTypes = useMemo(
    () =>
      new Set(
        tasks
          .filter((task) => task.assigneeId === user?.id)
          .map((task) => task.taskType),
      ),
    [tasks, user?.id],
  );
  const canUseTaskPermission = (taskType: string) =>
    isHrLeader || (isHrRecruiter && recruiterAssignedTaskTypes.has(taskType));
  const collectionCountsByRecruiter = useMemo(() => {
    const counts = new Map<string, number>();
    for (const application of applications) {
      if (!application.collectedBy?.id) continue;
      counts.set(application.collectedBy.id, (counts.get(application.collectedBy.id) ?? 0) + 1);
    }
    return counts;
  }, [applications]);

  const collectionStats = useMemo(() => {
    const byId = new Map<string, { id: string; name: string; email?: string; count: number }>();
    for (const application of applications) {
      if (!application.collectedBy?.id) continue;
      const current = byId.get(application.collectedBy.id);
      byId.set(application.collectedBy.id, {
        id: application.collectedBy.id,
        name: application.collectedBy.displayName,
        email: application.collectedBy.email,
        count: (current?.count ?? 0) + 1,
      });
    }
    return Array.from(byId.values()).sort((a, b) => b.count - a.count);
  }, [applications]);

  const collectedCvTotal = collectionStats.reduce((sum, item) => sum + item.count, 0);
  const campaignMembers = useMemo(() => {
    const byId = new Map<string, { id: string; name: string; taskCount: number; collectedCount: number }>();

    for (const task of tasks) {
      if (!task.assigneeId || !task.assigneeName) continue;
      const current = byId.get(task.assigneeId);
      byId.set(task.assigneeId, {
        id: task.assigneeId,
        name: task.assigneeName,
        taskCount: (current?.taskCount ?? 0) + 1,
        collectedCount: collectionCountsByRecruiter.get(task.assigneeId) ?? current?.collectedCount ?? 0,
      });
    }

    return Array.from(byId.values());
  }, [collectionCountsByRecruiter, tasks]);

  const campaign: CampaignData | null = useMemo(() => {
    if (!request) return null;

    const skills = (request.skillRequirements ?? {}) as Record<string, unknown>;
    const salaryMin = skills.salaryMin as string | number | undefined;
    const salaryMax = skills.salaryMax as string | number | undefined;
    let budget = 'N/A';
    if (salaryMin || salaryMax) {
      budget = salaryMax ? `${salaryMin ?? ''}-${salaryMax}`.replace(/^-/, '') : `${salaryMin}`;
    }

    return {
      id: request.id,
      position: request.position,
      department: request.department?.name ?? 'Unassigned',
      headcount: request.headcount,
      status: mapPlanStatus(plan),
      window: plan ? `${formatDate(plan.startDate)} - ${formatDate(plan.endDate)}` : 'TBD',
      owner: plan?.createdBy?.displayName ?? request.reviewedBy?.displayName ?? 'Unassigned',
      budget,
      progress: taskProgress,
      description: request.jobDescription,
    };
  }, [request, plan, taskProgress]);

  const candidates: Candidate[] = useMemo(
    () =>
      applications
        .filter((application) => application.status !== 'REJECTED')
        .map((application, index) => {
          const hasCompletedInterview = schedules.some(
            (schedule) =>
              schedule.candidateId === application.candidateId &&
              schedule.status === 'COMPLETED',
          );

          let stage: KanbanStage;
          switch (application.status) {
            case 'SUBMITTED':
              stage = 'applied';
              break;
            case 'SCREENING':
              stage = 'cv_screening';
              break;
            case 'INTERVIEWING':
              stage = hasCompletedInterview ? 'final_review' : 'interview';
              break;
            case 'OFFER_EXTENDED':
            case 'OFFER_ACCEPTED':
              stage = 'offer';
              break;
            default:
              stage = 'applied';
          }

          const structuredSkills = (
            application.candidate.structuredData as { skills?: string[] } | null
          )?.skills;

          return {
            id: application.id,
            name: application.candidate.fullName,
            initials: getInitials(application.candidate.fullName),
            stage,
            color: CANDIDATE_COLOR_PALETTE[index % CANDIDATE_COLOR_PALETTE.length],
            appliedDate: formatDate(application.createdAt),
            tags: (structuredSkills ?? []).slice(0, 3),
          };
        }),
    [applications, schedules],
  );

  const candidatesByStage = useMemo(
    () =>
      kanbanColumns.reduce(
        (acc, column) => {
          acc[column.key] = candidates.filter((candidate) => candidate.stage === column.key);
          return acc;
        },
        {} as Record<KanbanStage, Candidate[]>,
      ),
    [candidates],
  );

  const schedulableApplications = useMemo(
    () =>
      applications.filter((application) =>
        ['SUBMITTED', 'SCREENING', 'INTERVIEWING'].includes(application.status),
      ),
    [applications],
  );

  const weekDays = useMemo(() => getCurrentWeekDays(), []);

  const interviews: Interview[] = useMemo(() => {
    const sorted = [...schedules].sort(
      (a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime(),
    );

    return sorted.map((schedule, index) => {
      const application = applications.find((item) => item.candidateId === schedule.candidateId);
      const candidateName =
        application?.candidate.fullName ?? 'Unknown candidate';

      const scheduledDate = new Date(schedule.scheduledAt);
      const weekDay = weekDays.find(
        (day) => day.date.toDateString() === scheduledDate.toDateString(),
      );

      return {
        id: schedule.id,
        candidateName,
        initials: getInitials(candidateName),
        color: CANDIDATE_COLOR_PALETTE[index % CANDIDATE_COLOR_PALETTE.length],
        status: schedule.status,
        date: weekDay?.label ?? '',
        time: scheduledDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
        location: schedule.location,
        interviewer: `Panel (${schedule.interviewers.length})`,
      };
    });
  }, [schedules, applications, weekDays]);

  const canManagePlan = isHrLeader;
  const canEditDraftTasks =
    canManagePlan &&
    Boolean(plan) &&
    ['DRAFT', 'REJECTED', 'PENDING_APPROVAL'].includes(plan?.status ?? '');
  const canSubmitPlan =
    canManagePlan && Boolean(plan) && ['DRAFT', 'REJECTED'].includes(plan?.status ?? '') && tasks.length > 0;
  const canAssignRecruiters = canManagePlan && plan?.status === 'APPROVED';
  const canStartCampaign =
    canAssignRecruiters &&
    request?.status !== 'ACTIVE' &&
    tasks.length > 0 &&
    tasks.every((task) => task.assigneeId);
  const hasJobPostingTask = tasks.some((task) => task.taskType === 'JOB_POSTING');
  const hasInterviewTask = tasks.some((task) => task.taskType === 'INTERVIEW_COORDINATION');
  const hasCandidateSearchTask =
    tasks.some((task) => task.taskType === 'CV_COLLECTION') ||
    tasks.some((task) => task.taskType === 'CV_SCREENING');
  const canCreateJobPosting =
    canManagePlan && request?.status === 'ACTIVE' && hasJobPostingTask;
  const canScheduleInterview =
    request?.status === 'ACTIVE' &&
    hasInterviewTask &&
    canUseTaskPermission('INTERVIEW_COORDINATION');
  const canFindCandidates =
    request?.status === 'ACTIVE' &&
    hasCandidateSearchTask &&
    (canUseTaskPermission('CV_COLLECTION') || canUseTaskPermission('CV_SCREENING'));

  const submitPlan = async () => {
    if (!plan) return;

    setActionSubmitting(true);
    setActionError('');
    try {
      await apiRequest(`/overall-plan/${plan.id}/submit`, token, { method: 'PATCH' });
      await loadCampaign();
    } catch (submitErr) {
      setActionError(
        submitErr instanceof ApiError ? submitErr.message : 'Unable to submit plan for approval',
      );
    } finally {
      setActionSubmitting(false);
    }
  };

  const assignRecruiter = async (taskId: string, assignedToId: string) => {
    if (!assignedToId) return;

    setTaskBusyId(taskId);
    setTaskActionError('');
    try {
      await apiRequest(`/task-plan/${taskId}/assign-recruiter`, token, {
        method: 'PATCH',
        body: JSON.stringify({ assignedToId }),
      });
      await loadCampaign();
    } catch (assignErr) {
      setTaskActionError(
        assignErr instanceof ApiError ? assignErr.message : 'Unable to assign recruiter',
      );
    } finally {
      setTaskBusyId(null);
    }
  };

  const startCampaign = async () => {
    if (!plan) return;

    setActionSubmitting(true);
    setActionError('');
    try {
      await apiRequest(`/overall-plan/${plan.id}/start-campaign`, token, { method: 'PATCH' });
      await loadCampaign();
    } catch (startErr) {
      setActionError(startErr instanceof ApiError ? startErr.message : 'Unable to start campaign');
    } finally {
      setActionSubmitting(false);
    }
  };

  const markTaskDone = async (taskId: string) => {
    setTaskBusyId(taskId);
    setTaskActionError('');
    try {
      const task = tasks.find((item) => item.id === taskId);
      if (!task || (!canManagePlan && task.assigneeId !== user?.id)) {
        setTaskActionError('You can only update tasks assigned to you.');
        return;
      }

      await apiRequest(`/task-plan/${taskId}/status`, token, {
        method: 'PATCH',
        body: JSON.stringify({ status: 'COMPLETED' }),
      });
      setPlan((current) =>
        current
          ? {
              ...current,
              tasks: current.tasks.map((task) =>
                task.id === taskId ? { ...task, status: 'COMPLETED' } : task,
              ),
            }
          : current,
      );
    } catch (taskErr) {
      setTaskActionError(taskErr instanceof ApiError ? taskErr.message : 'Unable to update task');
    } finally {
      setTaskBusyId(null);
    }
  };

  const openEditTask = (task: TaskItem) => {
    setEditingTaskId(task.id);
    setEditTaskType(task.taskType);
    setEditTaskStart(task.startDateInput);
    setEditTaskDue(task.dueDateInput);
    setTaskActionError('');
  };

  const updateTask = async () => {
    if (!editingTaskId || !editTaskStart || !editTaskDue) return;

    setTaskBusyId(editingTaskId);
    setTaskActionError('');
    try {
      const taskStart = new Date(`${editTaskStart}T00:00:00`);
      const taskEnd = new Date(`${editTaskDue}T23:59:59`);

      if (taskEnd <= taskStart) {
        setTaskActionError('Task due date must be after the task start date');
        return;
      }

      await apiRequest(`/task-plan/${editingTaskId}`, token, {
        method: 'PATCH',
        body: JSON.stringify({
          taskType: editTaskType,
          startDate: taskStart.toISOString(),
          endDate: taskEnd.toISOString(),
        }),
      });
      setEditingTaskId(null);
      await loadCampaign();
    } catch (taskErr) {
      setTaskActionError(taskErr instanceof ApiError ? taskErr.message : 'Unable to update task');
    } finally {
      setTaskBusyId(null);
    }
  };

  const addTask = async () => {
    if (!plan || !newTaskStart || !newTaskDue) return;

    setAddTaskSubmitting(true);
    setTaskActionError('');
    try {
      const taskStart = new Date(`${newTaskStart}T00:00:00`);
      const taskEnd = new Date(`${newTaskDue}T23:59:59`);

      if (taskEnd <= taskStart) {
        setTaskActionError('Task due date must be after the task start date');
        return;
      }

      await apiRequest('/task-plan', token, {
        method: 'POST',
        body: JSON.stringify({
          overallPlanId: plan.id,
          taskType: newTaskType,
          startDate: taskStart.toISOString(),
          endDate: taskEnd.toISOString(),
        }),
      });
      setShowAddTask(false);
      setNewTaskStart('');
      setNewTaskDue('');
      await loadCampaign();
    } catch (taskErr) {
      setTaskActionError(taskErr instanceof ApiError ? taskErr.message : 'Unable to add task');
    } finally {
      setAddTaskSubmitting(false);
    }
  };

  const createJobPosting = async () => {
    if (!request || !canCreateJobPosting) return;

    setQuickActionSubmitting('job-posting');
    setQuickActionError('');
    try {
      const created = await apiRequest<JobPostingApiItem>('/job-postings', token, {
        method: 'POST',
        body: JSON.stringify({
          requestId: request.id,
          title: request.position,
          description: request.jobDescription,
          requirements: request.skillRequirements ?? {},
          visibility: 'PUBLIC',
        }),
      });
      setJobPosting(created);
    } catch (jobErr) {
      if (jobErr instanceof ApiError && jobErr.status === 409) {
        await loadCampaign();
      } else {
        setQuickActionError(
          jobErr instanceof ApiError ? jobErr.message : 'Unable to create job posting',
        );
      }
    } finally {
      setQuickActionSubmitting(null);
    }
  };

  const publishJobPosting = async () => {
    if (!jobPosting || !canCreateJobPosting) return;

    setQuickActionSubmitting('publish-job');
    setQuickActionError('');
    try {
      const published = await apiRequest<JobPostingApiItem>(
        `/job-postings/${jobPosting.id}/publish`,
        token,
        { method: 'POST', body: JSON.stringify({}) },
      );
      setJobPosting(published);
    } catch (publishErr) {
      setQuickActionError(
        publishErr instanceof ApiError ? publishErr.message : 'Unable to publish job posting',
      );
    } finally {
      setQuickActionSubmitting(null);
    }
  };

  const openScheduleForm = () => {
    setScheduleCandidateId((current) => current || schedulableApplications[0]?.candidateId || '');
    setQuickActionError('');
    setShowScheduleForm(true);
  };

  const createInterviewSchedule = async () => {
    if (
      !user?.id ||
      !canScheduleInterview ||
      !scheduleCandidateId ||
      !scheduleAt ||
      !scheduleLocation.trim()
    )
      return;

    setQuickActionSubmitting('schedule-interview');
    setQuickActionError('');
    try {
      await apiRequest<InterviewScheduleApiItem>('/interviews/schedules', token, {
        method: 'POST',
        body: JSON.stringify({
          requestId: campaignId,
          candidateId: scheduleCandidateId,
          scheduledAt: new Date(scheduleAt).toISOString(),
          duration: Number(scheduleDuration),
          location: scheduleLocation.trim(),
          interviewers: [user.id],
        }),
      });
      setShowScheduleForm(false);
      setScheduleAt('');
      setScheduleLocation('');
      await loadCampaign();
    } catch (scheduleErr) {
      setQuickActionError(
        scheduleErr instanceof ApiError ? scheduleErr.message : 'Unable to schedule interview',
      );
    } finally {
      setQuickActionSubmitting(null);
    }
  };

  if (!campaign) {
    return (
      <div className="mx-auto flex max-w-[1440px] flex-col gap-6">
        {apiError && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-rejected">
            {apiError}
          </div>
        )}

        <section className="rounded-lg border border-border-warm bg-clean-surface p-8 text-center">
          {loading ? (
            <p className="text-sm text-on-surface-variant">Loading campaign...</p>
          ) : (
            <>
              <h1 className="text-xl font-semibold text-deep-charcoal">Campaign not found</h1>
              <p className="mt-2 text-sm text-on-surface-variant">
                This campaign does not exist or is not available for your account.
              </p>
              <button
                className="mt-5 inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-border-warm bg-clean-surface px-4 text-sm font-semibold text-slate-ink transition hover:border-teal-command hover:text-teal-command active:scale-[0.98]"
                onClick={() => navigate('/hr/campaigns')}
                type="button"
              >
                <Icon className="h-4 w-4" name="back" />
                Back to campaigns
              </button>
            </>
          )}
        </section>
      </div>
    );
  }

  return (
    <div className="mx-auto flex max-w-[1440px] flex-col gap-6">
      {apiError && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-rejected">
          {apiError}
        </div>
      )}

      {loading && (
        <div className="rounded-lg border border-border-warm bg-clean-surface px-4 py-3 text-sm text-on-surface-variant">
          Loading campaign...
        </div>
      )}

      <header className="rounded-xl border border-border-warm bg-clean-surface p-5 shadow-[0_18px_50px_-44px_rgba(28,25,23,0.55)]">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div className="min-w-0">
            <button
              className="mb-3 inline-flex items-center gap-2 text-sm font-semibold text-on-surface-variant transition hover:text-teal-command active:scale-[0.98]"
              onClick={() => navigate('/hr/campaigns')}
              type="button"
            >
              <Icon className="h-4 w-4" name="back" />
              Campaigns
            </button>
            <div className="flex flex-wrap items-center gap-3">
              <span className="font-mono text-sm font-semibold text-teal-command">
                #{campaign.id.slice(0, 8)}
              </span>
              <h1 className="text-2xl font-semibold tracking-tight text-deep-charcoal">
                {campaign.position}
              </h1>
              <StatusBadge status={campaign.status} />
            </div>
            <p className="mt-2 text-sm text-on-surface-variant">
              {campaign.department} / {campaign.headcount} HC / {campaign.window}
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            {actionError && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-rejected">
                {actionError}
              </div>
            )}
            <button
              className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-border-warm bg-clean-surface px-4 text-sm font-semibold text-slate-ink transition hover:border-teal-command hover:text-teal-command active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
              disabled
              title="Editing an existing plan is not yet supported"
              type="button"
            >
              <Icon className="h-4 w-4" name="edit" />
              Edit Plan
            </button>
            {campaign.status === 'REVISION_REQUIRED' ? (
              <button
                className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-teal-command px-4 text-sm font-semibold text-white transition hover:bg-primary active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
                disabled={actionSubmitting || !canSubmitPlan}
                onClick={() => void submitPlan()}
                type="button"
              >
                <Icon className="h-4 w-4" name="send" />
                {actionSubmitting ? 'Submitting...' : 'Submit Plan to Admin'}
              </button>
            ) : campaign.status === 'PENDING_APPROVAL' ? (
              <div className="inline-flex h-10 items-center justify-center rounded-lg border border-border-warm bg-workflow-ivory px-4 text-sm font-semibold text-on-surface-variant">
                Awaiting Admin Approval
              </div>
            ) : campaign.status === 'DRAFT' ? (
              plan ? (
                <button
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-teal-command px-4 text-sm font-semibold text-white transition hover:bg-primary active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
                  disabled={actionSubmitting || !canSubmitPlan}
                  onClick={() => void submitPlan()}
                  title={!canSubmitPlan ? 'Add at least one task before submitting the plan.' : undefined}
                  type="button"
                >
                  <Icon className="h-4 w-4" name="send" />
                  {actionSubmitting ? 'Submitting...' : 'Submit Plan to Admin'}
                </button>
              ) : (
                <div className="inline-flex h-10 items-center justify-center rounded-lg border border-border-warm bg-workflow-ivory px-4 text-sm text-on-surface-variant">
                  No overall plan yet
                </div>
              )
            ) : campaign.status === 'APPROVED' && request?.status !== 'ACTIVE' ? (
              <button
                className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-teal-command px-4 text-sm font-semibold text-white transition hover:bg-primary active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
                disabled={actionSubmitting || !canStartCampaign}
                onClick={() => void startCampaign()}
                title={
                  !canStartCampaign
                    ? 'Assign every task to an HR recruiter before starting the campaign.'
                    : undefined
                }
                type="button"
              >
                <Icon className="h-4 w-4" name="send" />
                {actionSubmitting ? 'Starting...' : 'Start Campaign'}
              </button>
            ) : request?.status === 'ACTIVE' ? (
              <div className="inline-flex h-10 items-center justify-center rounded-lg border border-approved/20 bg-approved/10 px-4 text-sm font-semibold text-approved">
                Campaign Active
              </div>
            ) : null}
          </div>
        </div>
      </header>

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
        <main className="min-w-0 space-y-6">
          <div className="flex w-fit rounded-lg border border-border-warm bg-clean-surface p-1">
            {[
              { key: 'kanban', label: 'Pipeline Kanban', icon: 'kanban' },
              { key: 'calendar', label: 'Interview Calendar', icon: 'calendar' },
              { key: 'tasks', label: 'Tasks', icon: 'checklist' },
            ].map((tab) => (
              <button
                className={`inline-flex h-10 items-center gap-2 rounded-md px-4 text-sm font-semibold transition active:scale-[0.98] ${
                  activeTab === tab.key
                    ? 'bg-teal-command text-white shadow-sm'
                    : 'text-on-surface-variant hover:bg-workflow-ivory hover:text-deep-charcoal'
                }`}
                key={tab.key}
                onClick={() => setActiveTab(tab.key as DetailTab)}
                type="button"
              >
                <Icon className="h-4 w-4" name={tab.icon} />
                {tab.label}
              </button>
            ))}
          </div>

          {activeTab === 'kanban' ? (
            <div className="overflow-x-auto pb-2">
              <div className="grid min-w-[980px] grid-cols-5 gap-4">
                {kanbanColumns.map((column) => {
                  const cards = candidatesByStage[column.key];

                  return (
                    <section className="min-w-0" key={column.key}>
                      <div
                        className={`mb-3 flex items-center justify-between rounded-lg border-l-4 px-3 py-2 ${column.accent} ${column.bg}`}
                      >
                        <span className="text-xs font-bold uppercase tracking-[0.14em] text-deep-charcoal">
                          {column.label}
                        </span>
                        <span className="rounded-full border border-border-warm bg-clean-surface px-2 py-0.5 font-mono text-xs font-bold text-on-surface-variant">
                          {cards.length}
                        </span>
                      </div>
                      <div className="space-y-3">
                        {cards.map((candidate) => (
                          <CandidateCard candidate={candidate} key={candidate.id} />
                        ))}
                        {cards.length === 0 ? (
                          <div className="flex h-24 items-center justify-center rounded-lg border-2 border-dashed border-border-warm text-xs text-on-surface-variant">
                            No candidates
                          </div>
                        ) : null}
                      </div>
                    </section>
                  );
                })}
              </div>
            </div>
          ) : null}

          {activeTab === 'calendar' ? (
            <section className="overflow-hidden rounded-lg border border-border-warm bg-clean-surface">
              <div
                className="grid border-b border-border-warm"
                style={{ gridTemplateColumns: '72px repeat(5, minmax(120px, 1fr))' }}
              >
                <div className="bg-workflow-ivory/50 p-3" />
                {weekDays.map((day) => (
                  <div
                    className="border-l border-border-warm bg-workflow-ivory/50 p-3 text-center"
                    key={day.label}
                  >
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-on-surface-variant">
                      {day.label.split(' ')[0]}
                    </p>
                    <p
                      className={`mt-0.5 text-lg font-bold ${day.date.toDateString() === new Date().toDateString() ? 'text-teal-command' : 'text-deep-charcoal'}`}
                    >
                      {day.label.split(' ')[1]}
                    </p>
                  </div>
                ))}
              </div>
              <div className="overflow-x-auto">
                {timeSlots.map((slot) => (
                  <div
                    className="grid border-b border-border-warm last:border-b-0"
                    key={slot}
                    style={{ gridTemplateColumns: '72px repeat(5, minmax(120px, 1fr))' }}
                  >
                    <div className="flex justify-center border-r border-border-warm p-2 pt-3 font-mono text-[11px] text-on-surface-variant">
                      {slot}
                    </div>
                    {weekDays.map((day) => {
                      const items = interviews.filter(
                        (interview) =>
                          interview.date === day.label &&
                          interview.time.startsWith(slot.split(':')[0]),
                      );

                      return (
                        <div className="min-h-[74px] border-l border-border-warm p-1.5" key={day.label}>
                          {items.map((interview) => (
                            <div
                              className={`mb-1 rounded-md border-l-2 p-2 transition hover:shadow-sm ${
                                interview.status === 'COMPLETED'
                                  ? 'border-approved bg-green-50'
                                  : interview.status === 'CANCELLED'
                                    ? 'border-red-400 bg-red-50'
                                    : 'border-teal-command bg-teal-command/5'
                              }`}
                              key={interview.id}
                            >
                              <div className="mb-1 flex items-center gap-1.5">
                                <span
                                  className={`flex h-5 w-5 items-center justify-center rounded-full text-[9px] font-bold text-white ${interview.color}`}
                                >
                                  {interview.initials}
                                </span>
                                <p className="truncate text-[11px] font-semibold text-deep-charcoal">
                                  {interview.candidateName}
                                </p>
                              </div>
                              <p className="text-[10px] text-on-surface-variant">
                                {interview.status} / {interview.time}
                              </p>
                              <p className="text-[10px] text-on-surface-variant">
                                {interview.location}
                              </p>
                            </div>
                          ))}
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            </section>
          ) : null}

          {activeTab === 'tasks' ? (
            <section className="overflow-hidden rounded-lg border border-border-warm bg-clean-surface">
              <div className="flex flex-col gap-3 border-b border-border-warm bg-workflow-ivory/50 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-deep-charcoal">Campaign Tasks</h2>
                  <p className="mt-1 text-xs text-on-surface-variant">
                    {isHrRecruiter
                      ? `${visibleCompletedTasks} of ${visibleTasks.length} assigned tasks completed`
                      : `${completedTasks} of ${tasks.length} completed`}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="h-1.5 w-32 overflow-hidden rounded-full bg-surface-variant">
                    <div
                      className="h-full rounded-full bg-teal-command"
                      style={{ width: `${isHrRecruiter ? visibleTaskProgress : taskProgress}%` }}
                    />
                  </div>
                  <span className="font-mono text-xs text-on-surface-variant">
                    {isHrRecruiter ? visibleTaskProgress : taskProgress}%
                  </span>
                </div>
              </div>
              {taskActionError && (
                <div className="border-b border-border-warm bg-red-50 px-6 py-2 text-xs font-semibold text-rejected">
                  {taskActionError}
                </div>
              )}
              <div className="border-b border-border-warm px-6 py-4">
                <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-on-surface-variant">
                      {isHrRecruiter ? 'My Assignment' : 'Campaign HR Members'}
                    </p>
                    <p className="mt-1 text-xs text-slate-ink">
                      {isHrRecruiter
                        ? 'You can act only on tasks assigned to you by the HR Leader.'
                        : 'Members are added to this campaign when they are assigned a task.'}
                    </p>
                  </div>
                  {canAssignRecruiters && request?.status !== 'ACTIVE' ? (
                    <span className="rounded-lg border border-teal-command/20 bg-teal-command/5 px-3 py-2 text-xs font-semibold text-teal-command">
                      Assign recruiters before starting
                    </span>
                  ) : null}
                </div>
                {campaignMembers.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {campaignMembers.map((member) => (
                      <span
                        className="inline-flex items-center gap-2 rounded-full border border-border-warm bg-workflow-ivory px-3 py-1 text-xs font-semibold text-deep-charcoal"
                        key={member.id}
                      >
                        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-teal-command/10 text-[10px] font-bold text-teal-command">
                          {getInitials(member.name)}
                        </span>
                        {member.name}
                        <span className="font-mono text-on-surface-variant">
                          {member.taskCount} tasks
                        </span>
                        <span className="font-mono text-teal-command">
                          {member.collectedCount} CVs
                        </span>
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-on-surface-variant">
                    No HR recruiter has been assigned to this campaign yet.
                  </p>
                )}
              </div>
              <ul className="divide-y divide-border-warm">
                {visibleTasks.map((task) => (
                  <li
                    className={`flex items-center gap-4 px-6 py-4 transition ${task.done ? 'bg-workflow-ivory/30' : 'hover:bg-workflow-ivory/50'}`}
                    key={task.id}
                  >
                    <span
                      className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 ${task.done ? 'border-approved bg-approved text-white' : 'border-border-warm'}`}
                    >
                      {task.done ? <Icon className="h-3 w-3" name="check" /> : null}
                    </span>
                    {editingTaskId === task.id ? (
                      <div className="grid flex-1 gap-3 md:grid-cols-[minmax(180px,1fr)_150px_150px_auto] md:items-end">
                        <label className="block">
                          <span className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.14em] text-on-surface-variant">
                            Task Type
                          </span>
                          <select
                            className="h-9 w-full rounded-lg border border-border-warm bg-clean-surface px-3 text-xs font-semibold text-deep-charcoal outline-none transition focus:border-teal-command focus:ring-2 focus:ring-teal-command/20"
                            onChange={(event) => setEditTaskType(event.target.value)}
                            value={editTaskType}
                          >
                            {Object.entries(TASK_TYPE_LABELS).map(([value, label]) => (
                              <option key={value} value={value}>
                                {label}
                              </option>
                            ))}
                          </select>
                        </label>
                        <label className="block">
                          <span className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.14em] text-on-surface-variant">
                            Start Date
                          </span>
                          <input
                            className="h-9 w-full rounded-lg border border-border-warm bg-clean-surface px-3 text-xs text-deep-charcoal outline-none transition focus:border-teal-command focus:ring-2 focus:ring-teal-command/20"
                            max={plan?.endDate.slice(0, 10)}
                            min={plan?.startDate.slice(0, 10)}
                            onChange={(event) => setEditTaskStart(event.target.value)}
                            type="date"
                            value={editTaskStart}
                          />
                        </label>
                        <label className="block">
                          <span className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.14em] text-on-surface-variant">
                            Due Date
                          </span>
                          <input
                            className="h-9 w-full rounded-lg border border-border-warm bg-clean-surface px-3 text-xs text-deep-charcoal outline-none transition focus:border-teal-command focus:ring-2 focus:ring-teal-command/20"
                            max={plan?.endDate.slice(0, 10)}
                            min={plan?.startDate.slice(0, 10)}
                            onChange={(event) => setEditTaskDue(event.target.value)}
                            type="date"
                            value={editTaskDue}
                          />
                        </label>
                        <div className="flex gap-2">
                          <button
                            className="h-9 rounded-lg bg-teal-command px-3 text-xs font-bold text-white transition hover:bg-primary disabled:cursor-not-allowed disabled:opacity-50"
                            disabled={!editTaskStart || !editTaskDue || taskBusyId === task.id}
                            onClick={() => void updateTask()}
                            type="button"
                          >
                            Save
                          </button>
                          <button
                            className="h-9 rounded-lg border border-border-warm px-3 text-xs font-semibold text-secondary transition hover:bg-surface-variant/40"
                            onClick={() => setEditingTaskId(null)}
                            type="button"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <p
                        className={`flex-1 text-sm ${task.done ? 'text-on-surface-variant line-through' : 'font-medium text-deep-charcoal'}`}
                      >
                        {task.title}
                        {task.assigneeName && (
                          <span className="ml-2 text-xs font-normal text-slate-ink/80 bg-workflow-ivory px-2 py-0.5 rounded-full border border-border-warm">
                            {task.assigneeName}
                          </span>
                        )}
                        {task.taskType === 'CV_COLLECTION' && task.assigneeId ? (
                          <span className="ml-2 text-xs font-normal text-teal-command bg-teal-command/5 px-2 py-0.5 rounded-full border border-teal-command/20">
                            {collectionCountsByRecruiter.get(task.assigneeId) ?? 0} CVs collected
                          </span>
                        ) : null}
                      </p>
                    )}
                    {editingTaskId !== task.id && canAssignRecruiters && request?.status !== 'ACTIVE' ? (
                      <select
                        className="h-9 min-w-[200px] rounded-lg border border-border-warm bg-clean-surface px-3 text-xs font-semibold text-deep-charcoal outline-none transition focus:border-teal-command focus:ring-2 focus:ring-teal-command/20"
                        disabled={membersLoading || taskBusyId === task.id}
                        onChange={(event) => void assignRecruiter(task.id, event.target.value)}
                        value={task.assigneeId ?? ''}
                      >
                        <option value="">
                          {membersLoading ? 'Loading recruiters...' : 'Assign HR recruiter'}
                        </option>
                        {hrMembers.map((member) => (
                          <option key={member.id} value={member.id}>
                            {member.name}
                          </option>
                        ))}
                      </select>
                    ) : null}
                    {editingTaskId !== task.id ? (
                      <span
                        className={`font-mono text-xs ${task.done ? 'text-on-surface-variant' : 'text-slate-ink'}`}
                      >
                        {task.startDate} - {task.dueDate}
                      </span>
                    ) : null}
                    {editingTaskId !== task.id && canEditDraftTasks ? (
                      <button
                        className="text-xs font-semibold text-teal-command transition hover:underline disabled:cursor-not-allowed disabled:opacity-50"
                        disabled={taskBusyId === task.id}
                        onClick={() => openEditTask(task)}
                        type="button"
                      >
                        Edit
                      </button>
                    ) : null}
                    {editingTaskId !== task.id &&
                    !task.done &&
                    request?.status === 'ACTIVE' &&
                    (canManagePlan || task.assigneeId === user?.id) ? (
                      <button
                        className="text-xs font-semibold text-teal-command transition hover:underline disabled:cursor-not-allowed disabled:opacity-50"
                        disabled={taskBusyId === task.id}
                        onClick={() => void markTaskDone(task.id)}
                        type="button"
                      >
                        {taskBusyId === task.id ? 'Updating...' : 'Mark done'}
                      </button>
                    ) : null}
                  </li>
                ))}
                {visibleTasks.length === 0 ? (
                  <li className="px-6 py-8 text-center text-sm text-on-surface-variant">
                    {isHrRecruiter
                      ? 'No tasks have been assigned to you for this campaign.'
                      : 'No tasks have been added to this plan yet.'}
                  </li>
                ) : null}
              </ul>
              <div className="border-t border-border-warm bg-workflow-ivory/50 px-6 py-3">
                {showAddTask ? (
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
                    <label className="block">
                      <span className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.14em] text-on-surface-variant">
                        Task Type
                      </span>
                      <select
                        className="h-10 w-full min-w-[200px] rounded-lg border border-border-warm bg-clean-surface px-3 text-sm text-deep-charcoal outline-none transition focus:border-teal-command focus:ring-2 focus:ring-teal-command/20"
                        onChange={(event) => setNewTaskType(event.target.value)}
                        value={newTaskType}
                      >
                        {Object.entries(TASK_TYPE_LABELS).map(([value, label]) => (
                          <option key={value} value={value}>
                            {label}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="block">
                      <span className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.14em] text-on-surface-variant">
                        Start Date
                      </span>
                      <input
                        className="h-10 rounded-lg border border-border-warm bg-clean-surface px-3 text-sm text-deep-charcoal outline-none transition focus:border-teal-command focus:ring-2 focus:ring-teal-command/20"
                        max={plan?.endDate.slice(0, 10)}
                        min={plan?.startDate.slice(0, 10)}
                        onChange={(event) => setNewTaskStart(event.target.value)}
                        type="date"
                        value={newTaskStart}
                      />
                    </label>
                    <label className="block">
                      <span className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.14em] text-on-surface-variant">
                        Due Date
                      </span>
                      <input
                        className="h-10 rounded-lg border border-border-warm bg-clean-surface px-3 text-sm text-deep-charcoal outline-none transition focus:border-teal-command focus:ring-2 focus:ring-teal-command/20"
                        max={plan?.endDate.slice(0, 10)}
                        min={plan?.startDate.slice(0, 10)}
                        onChange={(event) => setNewTaskDue(event.target.value)}
                        type="date"
                        value={newTaskDue}
                      />
                    </label>
                    <div className="flex gap-2">
                      <button
                        className="h-10 rounded-lg bg-teal-command px-4 text-sm font-bold text-white transition hover:bg-primary active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
                        disabled={!newTaskStart || !newTaskDue || addTaskSubmitting}
                        onClick={() => void addTask()}
                        type="button"
                      >
                        {addTaskSubmitting ? 'Adding...' : 'Save'}
                      </button>
                      <button
                        className="h-10 rounded-lg border border-border-warm px-4 text-sm font-semibold text-secondary transition hover:bg-surface-variant/40 active:scale-[0.98]"
                        onClick={() => {
                          setShowAddTask(false);
                          setNewTaskStart('');
                          setNewTaskDue('');
                        }}
                        type="button"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    className="inline-flex items-center gap-2 text-sm font-semibold text-teal-command transition hover:underline disabled:cursor-not-allowed disabled:opacity-50"
                    disabled={!canEditDraftTasks}
                    onClick={() => setShowAddTask(true)}
                    title={
                      !plan
                        ? 'Create an Overall Plan first.'
                        : !canManagePlan
                          ? 'Only HR Leader can add campaign tasks.'
                          : !canEditDraftTasks
                            ? 'Tasks can only be added before Admin approves the plan.'
                            : undefined
                    }
                    type="button"
                  >
                    <Icon className="h-4 w-4" name="plus" />
                    Add task
                  </button>
                )}
              </div>
            </section>
          ) : null}
        </main>

        <aside className="space-y-4">
          <section className="rounded-lg border border-border-warm bg-clean-surface p-5">
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.14em] text-on-surface-variant">
              Overall Progress
            </p>
            <div className="mb-3 flex items-baseline gap-2">
              <span className="font-mono text-3xl font-bold text-deep-charcoal">
                {campaign.progress}%
              </span>
              <span className="text-xs text-on-surface-variant">complete</span>
            </div>
            <div className="mb-4 h-2 overflow-hidden rounded-full bg-surface-variant">
              <div
                className="h-full rounded-full bg-teal-command"
                style={{ width: `${campaign.progress}%` }}
              />
            </div>
            <div className="mb-4 grid grid-cols-2 gap-3">
              <div className="rounded-lg border border-border-warm bg-workflow-ivory px-3 py-2">
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-on-surface-variant">
                  Applied
                </p>
                <p className="mt-1 font-mono text-xl font-bold text-deep-charcoal">
                  {applications.length}
                </p>
              </div>
              <div className="rounded-lg border border-teal-command/20 bg-teal-command/5 px-3 py-2">
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-teal-command">
                  Collected CVs
                </p>
                <p className="mt-1 font-mono text-xl font-bold text-teal-command">
                  {collectedCvTotal}
                </p>
              </div>
            </div>
            <div className="space-y-2">
              {kanbanColumns.map((column) => (
                <div className="flex items-center justify-between" key={column.key}>
                  <span className="text-xs text-on-surface-variant">{column.label}</span>
                  <span className="font-mono text-xs font-semibold text-deep-charcoal">
                    {candidatesByStage[column.key].length}
                  </span>
                </div>
              ))}
            </div>
            <div className="mt-4 border-t border-border-warm pt-4">
              <p className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-on-surface-variant">
                Recruiter Collection
              </p>
              {collectionStats.length > 0 ? (
                <div className="space-y-2">
                  {collectionStats.map((item) => (
                    <div className="flex items-center justify-between gap-3" key={item.id}>
                      <span className="truncate text-xs font-semibold text-deep-charcoal">
                        {item.name}
                      </span>
                      <span className="shrink-0 font-mono text-xs font-semibold text-teal-command">
                        {item.count} CVs
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-on-surface-variant">No CVs collected yet.</p>
              )}
            </div>
          </section>

          <section className="space-y-4 rounded-lg border border-border-warm bg-clean-surface p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-on-surface-variant">
              Plan Summary
            </p>
            {[
              ['Campaign ID', `#${campaign.id.slice(0, 8)}`, true],
              ['Owner', campaign.owner, false],
              ['Department', campaign.department, false],
              ['Headcount', String(campaign.headcount), true],
              ['Budget', campaign.budget, true],
              ['Window', campaign.window, false],
            ].map(([label, value, mono]) => (
              <div key={label as string}>
                <p className="text-[11px] text-on-surface-variant">{label}</p>
                <p
                  className={`mt-0.5 text-sm font-semibold text-deep-charcoal ${mono ? 'font-mono' : ''}`}
                >
                  {value}
                </p>
              </div>
            ))}
          </section>

          <section className="rounded-lg border border-border-warm bg-clean-surface p-5">
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-on-surface-variant">
              Position Brief
            </p>
            <p className="text-sm leading-6 text-slate-ink">{campaign.description}</p>
          </section>

          <section className="space-y-4 rounded-lg border border-border-warm bg-clean-surface p-5">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-on-surface-variant">
                Job Posting
              </p>
              <p className="mt-1 text-sm font-semibold text-deep-charcoal">
                {jobPosting ? jobPosting.title : 'No job posting created'}
              </p>
              {jobPosting ? (
                <p className="mt-1 text-xs text-on-surface-variant">
                  {jobPosting.status} / {jobPosting.visibility}
                </p>
              ) : null}
            </div>
            {quickActionError ? (
              <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-rejected">
                {quickActionError}
              </div>
            ) : null}
            {!jobPosting ? (
              <button
                className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-teal-command px-4 text-sm font-semibold text-white transition hover:bg-primary active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
                disabled={quickActionSubmitting === 'job-posting' || !canCreateJobPosting}
                onClick={() => void createJobPosting()}
                title={
                  !canCreateJobPosting
                    ? 'Admin-approved plan and JOB_POSTING task are required.'
                    : undefined
                }
                type="button"
              >
                <Icon className="h-4 w-4" name="plus" />
                {quickActionSubmitting === 'job-posting' ? 'Creating...' : 'Create Job Posting'}
              </button>
            ) : jobPosting.status === 'DRAFT' ? (
              <button
                className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-teal-command px-4 text-sm font-semibold text-white transition hover:bg-primary active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
                disabled={quickActionSubmitting === 'publish-job' || !canCreateJobPosting}
                onClick={() => void publishJobPosting()}
                title={
                  !canCreateJobPosting
                    ? 'Admin-approved plan and JOB_POSTING task are required.'
                    : undefined
                }
                type="button"
              >
                <Icon className="h-4 w-4" name="send" />
                {quickActionSubmitting === 'publish-job' ? 'Publishing...' : 'Publish Job Posting'}
              </button>
            ) : null}
          </section>

          <section className="space-y-4 rounded-lg border border-border-warm bg-clean-surface p-5">
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-on-surface-variant">
                Campaign Actions
              </p>
              <button
                className="text-[11px] font-semibold text-teal-command transition hover:underline disabled:cursor-not-allowed disabled:text-on-surface-variant disabled:no-underline"
                disabled={!canFindCandidates}
                onClick={() => {
                  if (!canFindCandidates) return;
                  navigate('/hr/search');
                }}
                title={
                  !canFindCandidates
                    ? 'HR Leader must assign you CV collection or CV screening work for this campaign.'
                    : undefined
                }
                type="button"
              >
                Find candidates
              </button>
            </div>

            {showScheduleForm ? (
              <div className="space-y-3">
                <label className="block">
                  <span className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.14em] text-on-surface-variant">
                    Candidate
                  </span>
                  <select
                    className="h-10 w-full rounded-lg border border-border-warm bg-clean-surface px-3 text-sm text-deep-charcoal outline-none transition focus:border-teal-command focus:ring-2 focus:ring-teal-command/20"
                    onChange={(event) => setScheduleCandidateId(event.target.value)}
                    value={scheduleCandidateId}
                  >
                    {schedulableApplications.map((application) => (
                      <option key={application.id} value={application.candidateId}>
                        {application.candidate.fullName}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="block">
                  <span className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.14em] text-on-surface-variant">
                    Time
                  </span>
                  <input
                    className="h-10 w-full rounded-lg border border-border-warm bg-clean-surface px-3 text-sm text-deep-charcoal outline-none transition focus:border-teal-command focus:ring-2 focus:ring-teal-command/20"
                    onChange={(event) => setScheduleAt(event.target.value)}
                    type="datetime-local"
                    value={scheduleAt}
                  />
                </label>
                <div className="grid grid-cols-[100px_minmax(0,1fr)] gap-3">
                  <label className="block">
                    <span className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.14em] text-on-surface-variant">
                      Minutes
                    </span>
                    <input
                      className="h-10 w-full rounded-lg border border-border-warm bg-clean-surface px-3 text-sm text-deep-charcoal outline-none transition focus:border-teal-command focus:ring-2 focus:ring-teal-command/20"
                      min="15"
                      onChange={(event) => setScheduleDuration(event.target.value)}
                      type="number"
                      value={scheduleDuration}
                    />
                  </label>
                  <label className="block">
                    <span className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.14em] text-on-surface-variant">
                      Location
                    </span>
                    <input
                      className="h-10 w-full rounded-lg border border-border-warm bg-clean-surface px-3 text-sm text-deep-charcoal outline-none transition focus:border-teal-command focus:ring-2 focus:ring-teal-command/20"
                      onChange={(event) => setScheduleLocation(event.target.value)}
                      placeholder="Meeting room or online link"
                      value={scheduleLocation}
                    />
                  </label>
                </div>
                <div className="flex gap-2">
                  <button
                    className="h-10 flex-1 rounded-lg bg-teal-command px-4 text-sm font-bold text-white transition hover:bg-primary active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
                    disabled={
                      !scheduleCandidateId ||
                      !scheduleAt ||
                      !scheduleLocation.trim() ||
                      quickActionSubmitting === 'schedule-interview'
                    }
                    onClick={() => void createInterviewSchedule()}
                    type="button"
                  >
                    {quickActionSubmitting === 'schedule-interview' ? 'Scheduling...' : 'Schedule'}
                  </button>
                  <button
                    className="h-10 rounded-lg border border-border-warm px-4 text-sm font-semibold text-secondary transition hover:bg-surface-variant/40 active:scale-[0.98]"
                    onClick={() => setShowScheduleForm(false)}
                    type="button"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <button
                className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg border border-border-warm px-4 text-sm font-semibold text-slate-ink transition hover:border-teal-command hover:text-teal-command active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
                disabled={schedulableApplications.length === 0 || !canScheduleInterview}
                onClick={openScheduleForm}
                title={
                  !canScheduleInterview
                    ? 'Admin-approved plan and INTERVIEW_COORDINATION task are required.'
                    : schedulableApplications.length === 0
                      ? 'No active candidates are available for scheduling.'
                      : undefined
                }
                type="button"
              >
                <Icon className="h-4 w-4" name="calendar" />
                Schedule Interview
              </button>
            )}

            <button
              className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg border border-border-warm px-4 text-sm font-semibold text-slate-ink transition hover:border-teal-command hover:text-teal-command active:scale-[0.98]"
              onClick={() => navigate('/hr/reports')}
              type="button"
            >
              <Icon className="h-4 w-4" name="report" />
              View Reports
            </button>
          </section>

          <section className="rounded-lg border border-border-warm bg-clean-surface p-5">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-on-surface-variant">
                Upcoming Interviews
              </p>
              <button
                className="text-[11px] font-semibold text-teal-command transition hover:underline"
                onClick={() => setActiveTab('calendar')}
                type="button"
              >
                View all
              </button>
            </div>
            <div className="space-y-3">
              {interviews.slice(0, 3).map((interview) => (
                <div className="flex items-start gap-2.5" key={interview.id}>
                  <span
                    className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white ${interview.color}`}
                  >
                    {interview.initials}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-xs font-semibold leading-tight text-deep-charcoal">
                      {interview.candidateName}
                    </p>
                    <p className="text-[11px] text-on-surface-variant">
                      {interview.status} / {interview.date || 'Outside current week'}{' '}
                      {interview.time}
                    </p>
                    <p className="text-[10px] text-on-surface-variant">{interview.location}</p>
                  </div>
                </div>
              ))}
              {interviews.length === 0 ? (
                <p className="text-xs text-on-surface-variant">No interviews scheduled yet.</p>
              ) : null}
            </div>
          </section>

        </aside>
      </section>
    </div>
  );
};
