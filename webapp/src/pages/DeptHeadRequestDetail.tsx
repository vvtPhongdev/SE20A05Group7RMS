import React, { useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { RecruitmentRequestStatus, Urgency } from '@wr/contracts';

// ─── Interfaces ──────────────────────────────────────────────────

interface ApprovalRecord {
  approver: string;
  role: string;
  decision: 'APPROVED' | 'REJECTED' | 'REVISION_NEEDED' | 'SUBMITTED';
  comments: string;
  decidedAt: string;
}

interface TaskPlanMock {
  taskType: string;
  assignee: string;
  startDate: string;
  endDate: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED';
}

interface OverallPlanMock {
  startDate: string;
  endDate: string;
  status: 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED';
  revisionNotes?: string;
  tasks: TaskPlanMock[];
}

interface CandidateMock {
  name: string;
  email: string;
  matchScore: number;
  status: string;
  cvFileName: string;
  sourcedDate: string;
}

interface RequestDetail {
  id: string;
  position: string;
  team: string;
  status: RecruitmentRequestStatus;
  urgency: Urgency;
  headcount: number;
  filled: number;
  submitted: string;
  updated: string;
  due: string;
  owner: string;
  reason: string;
  skills: string[];
  justification: string;
  impact: string;
  location: string;
  employmentType: string;
  approvalHistory: ApprovalRecord[];
  linkedPlan?: OverallPlanMock;
  candidates: CandidateMock[];
  activityLogs: {
    action: string;
    description: string;
    performedBy: string;
    date: string;
  }[];
}

// ─── Mock Data for Requests ──────────────────────────────────────

const mockRequestDetails: Record<string, RequestDetail> = {
  'REQ-2026-001': {
    id: 'REQ-2026-001',
    position: 'Senior Backend Engineer',
    team: 'Platform',
    status: RecruitmentRequestStatus.DRAFT,
    urgency: Urgency.MEDIUM,
    headcount: 2,
    filled: 0,
    submitted: 'Jun 01, 2026',
    updated: 'Jun 08, 2026',
    due: 'Jun 28, 2026',
    owner: 'Linh Tran',
    reason: 'Backfill for API ownership and service migration support.',
    justification: 'The API platform team has lost two backend engineers to other teams, causing a bottleneck in core service updates.',
    impact: 'Critical integration APIs for external vendors will be delayed by 2-3 months.',
    location: 'Ho Chi Minh City',
    employmentType: 'Full-time',
    skills: ['Node.js', 'NestJS', 'PostgreSQL', 'Docker', 'REST API design'],
    approvalHistory: [
      {
        approver: 'Linh Tran',
        role: 'Department Head',
        decision: 'SUBMITTED',
        comments: 'Draft created and saved locally.',
        decidedAt: 'Jun 01, 2026',
      },
    ],
    candidates: [],
    activityLogs: [
      {
        action: 'Draft Created',
        description: 'Recruitment request draft initialized.',
        performedBy: 'Linh Tran',
        date: 'Jun 01, 2026 · 10:15 AM',
      },
      {
        action: 'Draft Updated',
        description: 'Added technical competency requirements and impact statement.',
        performedBy: 'Linh Tran',
        date: 'Jun 08, 2026 · 02:30 PM',
      },
    ],
  },
  'REQ-2026-002': {
    id: 'REQ-2026-002',
    position: 'DevOps Engineer',
    team: 'Infrastructure',
    status: RecruitmentRequestStatus.PENDING_REVIEW,
    urgency: Urgency.CRITICAL,
    headcount: 2,
    filled: 0,
    submitted: 'Jun 02, 2026',
    updated: 'Jun 08, 2026',
    due: 'Jun 18, 2026',
    owner: 'Khoa Pham',
    reason: 'Coverage gap in release automation and on-call rotation.',
    justification: 'The system infrastructure scale has doubled in the last six months, and on-call shifts are currently overburdened.',
    impact: 'System reliability SLA might drop below 99.9% due to delayed incident responses.',
    location: 'Ho Chi Minh City',
    employmentType: 'Full-time',
    skills: ['AWS', 'Kubernetes', 'Terraform', 'CI/CD', 'Linux Administration'],
    approvalHistory: [
      {
        approver: 'Khoa Pham',
        role: 'Department Head',
        decision: 'SUBMITTED',
        comments: 'Submitted to HR review. Critical infrastructure gap requires urgent approval.',
        decidedAt: 'Jun 02, 2026',
      },
    ],
    candidates: [],
    activityLogs: [
      {
        action: 'Draft Created',
        description: 'Request drafted for Infrastructure team expansion.',
        performedBy: 'Khoa Pham',
        date: 'Jun 01, 2026 · 09:00 AM',
      },
      {
        action: 'Submitted to HR',
        description: 'Request forwarded to HR Manager for review.',
        performedBy: 'Khoa Pham',
        date: 'Jun 02, 2026 · 11:22 AM',
      },
    ],
  },
  'REQ-2026-005': {
    id: 'REQ-2026-005',
    position: 'Data Analyst',
    team: 'Business Intelligence',
    status: RecruitmentRequestStatus.REVISION_NEEDED,
    urgency: Urgency.HIGH,
    headcount: 3,
    filled: 0,
    submitted: 'May 24, 2026',
    updated: 'Jun 08, 2026',
    due: 'Jun 30, 2026',
    owner: 'Bao Nguyen',
    reason: 'Analytics backlog for reporting and forecast quality.',
    justification: 'Increasing BI dashboard requests from marketing and sales have created a three-week backlog.',
    impact: 'Marketing budget planning will rely on delayed conversion reports.',
    location: 'Hybrid',
    employmentType: 'Full-time',
    skills: ['SQL', 'Tableau', 'Python', 'Data Modeling', 'Business Analysis'],
    approvalHistory: [
      {
        approver: 'Bao Nguyen',
        role: 'Department Head',
        decision: 'SUBMITTED',
        comments: 'Forwarded for approval.',
        decidedAt: 'May 24, 2026',
      },
      {
        approver: 'Pham Quynh Nhu',
        role: 'HR Manager',
        decision: 'REVISION_NEEDED',
        comments: 'Needs stronger business impact and phased headcount rationale. Can we hire 1 senior analyst first instead of 3 mid-level analysts?',
        decidedAt: 'Jun 08, 2026',
      },
    ],
    candidates: [],
    activityLogs: [
      {
        action: 'Submitted to HR',
        description: 'Request submitted for review.',
        performedBy: 'Bao Nguyen',
        date: 'May 24, 2026 · 04:12 PM',
      },
      {
        action: 'Revision Requested',
        description: 'HR Manager returned the request to draft for justification updates.',
        performedBy: 'Pham Quynh Nhu',
        date: 'Jun 08, 2026 · 10:45 AM',
      },
    ],
  },
  'REQ-2026-008': {
    id: 'REQ-2026-008',
    position: 'Integration Engineer',
    team: 'Platform',
    status: RecruitmentRequestStatus.SCREENING,
    urgency: Urgency.HIGH,
    headcount: 2,
    filled: 0,
    submitted: 'May 15, 2026',
    updated: 'Jun 08, 2026',
    due: 'Jun 26, 2026',
    owner: 'Hanh Vo',
    reason: 'Reduce partner integration delivery bottlenecks.',
    justification: 'New client onboarding has scaled, requiring dedicated engineering to build custom payment and inventory sync adapters.',
    impact: 'Client onboarding timeline will increase from 14 days to 45 days.',
    location: 'Ho Chi Minh City',
    employmentType: 'Full-time',
    skills: ['Java', 'Spring Boot', 'REST APIs', 'SQL Server', 'Integration Testing'],
    approvalHistory: [
      {
        approver: 'Hanh Vo',
        role: 'Department Head',
        decision: 'SUBMITTED',
        comments: 'Urgent need for partner team.',
        decidedAt: 'May 15, 2026',
      },
      {
        approver: 'Pham Quynh Nhu',
        role: 'HR Manager',
        decision: 'APPROVED',
        comments: 'Request verified. Forwarding to Admin.',
        decidedAt: 'May 18, 2026',
      },
      {
        approver: 'Hoang Minh Tri',
        role: 'Admin',
        decision: 'APPROVED',
        comments: 'Strategic priority approved. Proceed with planning immediately.',
        decidedAt: 'May 20, 2026',
      },
    ],
    linkedPlan: {
      startDate: 'May 26, 2026',
      endDate: 'Jun 26, 2026',
      status: 'APPROVED',
      tasks: [
        {
          taskType: 'JOB_POSTING',
          assignee: 'Pham Quynh Nhu',
          startDate: 'May 26, 2026',
          endDate: 'May 30, 2026',
          status: 'COMPLETED',
        },
        {
          taskType: 'CV_COLLECTION',
          assignee: 'Pham Quynh Nhu',
          startDate: 'Jun 01, 2026',
          endDate: 'Jun 15, 2026',
          status: 'IN_PROGRESS',
        },
        {
          taskType: 'CV_SCREENING',
          assignee: 'Hanh Vo',
          startDate: 'Jun 08, 2026',
          endDate: 'Jun 18, 2026',
          status: 'IN_PROGRESS',
        },
        {
          taskType: 'INTERVIEW_COORDINATION',
          assignee: 'Pham Quynh Nhu',
          startDate: 'Jun 12, 2026',
          endDate: 'Jun 24, 2026',
          status: 'PENDING',
        },
      ],
    },
    candidates: [
      {
        name: 'Nguyen Thanh Son',
        email: 'son.nguyen@email.com',
        matchScore: 94,
        status: 'Screening - Shortlisted',
        cvFileName: 'Son_Nguyen_CV_Integration_Eng.pdf',
        sourcedDate: 'Jun 02, 2026',
      },
      {
        name: 'Tran Thi Bich Ngoc',
        email: 'ngoc.tranbich@email.com',
        matchScore: 88,
        status: 'Screening - Shortlisted',
        cvFileName: 'Bich_Ngoc_CV_Backend.pdf',
        sourcedDate: 'Jun 03, 2026',
      },
      {
        name: 'Le Huy Hoang',
        email: 'hoang.lehuy@email.com',
        matchScore: 82,
        status: 'Screened - Reviewing',
        cvFileName: 'Le_Huy_Hoang_Resume.pdf',
        sourcedDate: 'Jun 05, 2026',
      },
      {
        name: 'Pham Minh Tuan',
        email: 'tuan.phaminh@email.com',
        matchScore: 76,
        status: 'Screened - Reviewing',
        cvFileName: 'Tuan_Pham_CV_2026.docx',
        sourcedDate: 'Jun 06, 2026',
      },
      {
        name: 'Vu Quoc Anh',
        email: 'quocanh.vu@email.com',
        matchScore: 65,
        status: 'Screening - Rejected',
        cvFileName: 'Quoc_Anh_V_CV.pdf',
        sourcedDate: 'Jun 04, 2026',
      },
    ],
    activityLogs: [
      {
        action: 'Request Created',
        description: 'Initiated request for Integration Engineers.',
        performedBy: 'Hanh Vo',
        date: 'May 15, 2026 · 09:30 AM',
      },
      {
        action: 'HR Reviewed',
        description: 'HR Manager verified headcount budget and forwarded request.',
        performedBy: 'Pham Quynh Nhu',
        date: 'May 18, 2026 · 02:40 PM',
      },
      {
        action: 'Admin Approved',
        description: 'Admin approved the request and unlocked recruitment planning.',
        performedBy: 'Hoang Minh Tri',
        date: 'May 20, 2026 · 11:00 AM',
      },
      {
        action: 'Plan Approved',
        description: 'Overall Recruitment Plan approved. Job posting unlocked.',
        performedBy: 'Hoang Minh Tri',
        date: 'May 25, 2026 · 04:15 PM',
      },
      {
        action: 'Job Posting Published',
        description: 'Job posting published to public job portal.',
        performedBy: 'Pham Quynh Nhu',
        date: 'May 28, 2026 · 09:00 AM',
      },
      {
        action: 'CV Screening Initiated',
        description: '5 candidate CVs imported to campaign sourcing pool.',
        performedBy: 'System (Sourcing)',
        date: 'Jun 08, 2026 · 08:30 AM',
      },
    ],
  },
};

// ─── Component Helpers ───────────────────────────────────────────

const milestoneOrder = [
  { key: 'submission', label: 'Submission', statuses: [RecruitmentRequestStatus.DRAFT, RecruitmentRequestStatus.PENDING_REVIEW, RecruitmentRequestStatus.REVISION_NEEDED] },
  { key: 'approval', label: 'Approval', statuses: [RecruitmentRequestStatus.APPROVED, RecruitmentRequestStatus.REJECTED] },
  { key: 'planning', label: 'HR Planning', statuses: [RecruitmentRequestStatus.PLANNING, RecruitmentRequestStatus.PLAN_APPROVED] },
  { key: 'recruiting', label: 'Recruiting', statuses: [RecruitmentRequestStatus.SCREENING, RecruitmentRequestStatus.INTERVIEWING, RecruitmentRequestStatus.INTERVIEW_COMPLETED] },
  { key: 'closure', label: 'Closure', statuses: [RecruitmentRequestStatus.OFFER_EXTENDED, RecruitmentRequestStatus.OFFER_ACCEPTED, RecruitmentRequestStatus.OFFER_DECLINED, RecruitmentRequestStatus.CLOSED, RecruitmentRequestStatus.CANCELLED] },
];

const statusStyles: Record<RecruitmentRequestStatus, string> = {
  [RecruitmentRequestStatus.DRAFT]: 'border-stone-200 bg-stone-100 text-draft',
  [RecruitmentRequestStatus.PENDING_REVIEW]: 'border-cyan-200 bg-cyan-50 text-pending',
  [RecruitmentRequestStatus.APPROVED]: 'border-green-200 bg-green-50 text-approved',
  [RecruitmentRequestStatus.REJECTED]: 'border-red-200 bg-red-50 text-rejected',
  [RecruitmentRequestStatus.REVISION_NEEDED]: 'border-amber-200 bg-amber-50 text-revision',
  [RecruitmentRequestStatus.PLANNING]: 'border-teal-command/20 bg-teal-command/10 text-teal-command',
  [RecruitmentRequestStatus.PLAN_APPROVED]: 'border-green-200 bg-green-50 text-approved',
  [RecruitmentRequestStatus.SCREENING]: 'border-cyan-200 bg-cyan-50 text-pending',
  [RecruitmentRequestStatus.INTERVIEWING]: 'border-amber-200 bg-amber-50 text-revision',
  [RecruitmentRequestStatus.INTERVIEW_COMPLETED]: 'border-stone-300 bg-stone-100 text-slate-ink',
  [RecruitmentRequestStatus.OFFER_EXTENDED]: 'border-teal-command/20 bg-teal-command/10 text-teal-command',
  [RecruitmentRequestStatus.OFFER_ACCEPTED]: 'border-green-200 bg-green-50 text-approved',
  [RecruitmentRequestStatus.OFFER_DECLINED]: 'border-red-200 bg-red-50 text-rejected',
  [RecruitmentRequestStatus.CLOSED]: 'border-stone-300 bg-stone-100 text-slate-ink',
  [RecruitmentRequestStatus.CANCELLED]: 'border-red-200 bg-red-50 text-rejected',
};

const formatStatus = (status: string) =>
  status
    .toLowerCase()
    .split('_')
    .map((word) => word[0].toUpperCase() + word.slice(1))
    .join(' ');

const getUrgencyStyles = (urgency: Urgency) => {
  const styles: Record<Urgency, string> = {
    [Urgency.LOW]: 'bg-stone-50 border-stone-200 text-draft',
    [Urgency.MEDIUM]: 'bg-stone-100 border-stone-300 text-slate-ink',
    [Urgency.HIGH]: 'bg-amber-50 border-amber-200 text-revision',
    [Urgency.CRITICAL]: 'bg-red-50 border-red-200 text-rejected',
  };
  return styles[urgency] || styles[Urgency.MEDIUM];
};

const getTaskStatusBadge = (status: string) => {
  const styles: Record<string, string> = {
    PENDING: 'bg-stone-50 text-draft border-stone-200',
    IN_PROGRESS: 'bg-cyan-50 text-pending border-cyan-200',
    COMPLETED: 'bg-green-50 text-approved border-green-200',
  };
  return styles[status] || 'bg-stone-50 text-draft';
};

const Icon = ({ name, className = 'h-5 w-5' }: { name: string; className?: string }) => {
  const paths: Record<string, React.ReactNode> = {
    arrowLeft: <path d="M19 12H5m6-6-6 6 6 6" />,
    check: <path d="m5 12 5 5L20 7" />,
    calendar: <path d="M7 3v4m10-4v4M4 9h16M6 5h12a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2Z" />,
    clock: <path d="M12 6v6l4 2m5-2a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />,
    info: <path d="M12 16v-4m0-4h.01M22 12A10 10 0 1 1 2 12a10 10 0 0 1 20 0Z" />,
    user: <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2m18-10a4 4 0 1 1-8 0 4 4 0 0 1 8 0Z" />,
    briefcase: <path d="M20 7H4a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2Zm-4 0V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" />,
    fileText: <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z M14 2v6h6" />,
    alertCircle: <path d="M12 8v4m0 4h.01M22 12A10 10 0 1 1 2 12a10 10 0 0 1 20 0Z" />,
    doc: <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5.586a1 1 0 0 1 .707.293l5.414 5.414a1 1 0 0 1 .293.707V19a2 2 0 0 1-2 2Z" />,
    users: <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2m21-10a4 4 0 0 0-3-3.87m-4-1.2a4 4 0 0 1 0 7.75" />,
    checkCircle: <path d="m9 11 3 3L22 4M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />,
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

// ─── Main Component ──────────────────────────────────────────────

export const DeptHeadRequestDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  // Find request in mock database or generate default details
  const detail = useMemo(() => {
    if (id && mockRequestDetails[id]) {
      return mockRequestDetails[id];
    }

    // Default generator for missing mock data
    const basicReq: RequestDetail = {
      id: id || 'REQ-2026-000',
      position: 'Staff Engineer',
      team: 'Engineering',
      status: RecruitmentRequestStatus.PLANNING,
      urgency: Urgency.MEDIUM,
      headcount: 1,
      filled: 0,
      submitted: 'May 10, 2026',
      updated: 'Jun 05, 2026',
      due: 'Jun 30, 2026',
      owner: 'System Head',
      reason: 'General hiring for project expansion.',
      justification: 'Workload demands additional headcount to meet product release deadlines.',
      impact: 'Product release delayed.',
      location: 'Ho Chi Minh City',
      employmentType: 'Full-time',
      skills: ['TypeScript', 'React', 'Node.js'],
      approvalHistory: [
        {
          approver: 'System Head',
          role: 'Department Head',
          decision: 'SUBMITTED' as const,
          comments: 'Submitted.',
          decidedAt: 'May 10, 2026',
        },
        {
          approver: 'HR Manager',
          role: 'HR Manager',
          decision: 'APPROVED' as const,
          comments: 'Request verified.',
          decidedAt: 'May 15, 2026',
        },
      ],
      candidates: [],
      linkedPlan: undefined,
      activityLogs: [
        {
          action: 'Request Created',
          description: 'Request initialized.',
          performedBy: 'System Head',
          date: 'May 10, 2026',
        },
      ],
    };
    return basicReq;
  }, [id]);

  // Determine current active milestone index
  const activeMilestoneIndex = useMemo(() => {
    return milestoneOrder.findIndex((milestone) =>
      milestone.statuses.includes(detail.status),
    );
  }, [detail.status]);

  return (
    <div className="mx-auto flex max-w-[1440px] flex-col gap-6">
      {/* Navigation Header */}
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <button
            className="inline-flex h-9 items-center justify-center gap-2 rounded-lg border border-border-warm bg-clean-surface px-3 text-xs font-semibold text-slate-ink transition hover:border-teal-command hover:text-teal-command active:scale-[0.98]"
            onClick={() => navigate('/dept-head/requests')}
            type="button"
          >
            <Icon className="h-4 w-4" name="arrowLeft" />
            Back to Requests
          </button>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-semibold tracking-tight text-deep-charcoal">
              {detail.position}
            </h1>
            <span className="font-mono text-sm text-slate-ink">({detail.id})</span>
            <span className={`inline-flex rounded-full border px-2.5 py-0.5 text-xs font-bold ${statusStyles[detail.status]}`}>
              {formatStatus(detail.status)}
            </span>
          </div>
          <p className="mt-1 text-sm text-slate-ink">
            {detail.team} Department · Owned by {detail.owner}
          </p>
        </div>

        {detail.status === RecruitmentRequestStatus.REVISION_NEEDED && (
          <button
            className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-teal-command px-4 text-sm font-semibold text-white transition hover:bg-primary active:scale-[0.98]"
            onClick={() => navigate(`/dept-head/create-request` /* Simulating editing request */)}
            type="button"
          >
            Edit & Resubmit
          </button>
        )}
      </header>

      {/* 13-State High-Level Milestones Stepper */}
      <section className="rounded-xl border border-border-warm bg-clean-surface p-6 shadow-[0_18px_50px_-44px_rgba(28,25,23,0.55)]" aria-label="Workflow progress">
        <h2 className="text-sm font-semibold uppercase tracking-[0.12em] text-on-surface-variant mb-6">Workflow Progress</h2>
        <div className="relative flex flex-col justify-between gap-6 md:flex-row md:items-center">
          {/* Connector Line (Desktop Only) */}
          <div className="absolute left-4 top-4 hidden h-[2px] w-[calc(100%-32px)] bg-stone-200 md:block" style={{ zIndex: 0 }}>
            <div
              className="h-full bg-teal-command transition-all duration-300"
              style={{ width: `${(Math.max(0, activeMilestoneIndex) / (milestoneOrder.length - 1)) * 100}%` }}
            />
          </div>

          {milestoneOrder.map((milestone, index) => {
            const isCompleted = index < activeMilestoneIndex;
            const isActive = index === activeMilestoneIndex;
            const isRejectedOrCancelled =
              detail.status === RecruitmentRequestStatus.REJECTED ||
              detail.status === RecruitmentRequestStatus.CANCELLED;

            let circleClass = 'bg-white border-stone-200 text-draft';
            let textClass = 'text-slate-ink';

            if (isCompleted) {
              circleClass = 'bg-teal-command border-teal-command text-white';
              textClass = 'text-deep-charcoal font-semibold';
            } else if (isActive) {
              if (isRejectedOrCancelled && (milestone.key === 'approval' || milestone.key === 'closure')) {
                circleClass = 'bg-red-500 border-red-500 text-white';
                textClass = 'text-rejected font-semibold';
              } else {
                circleClass = 'border-teal-command text-teal-command ring-4 ring-teal-command/10 bg-white';
                textClass = 'text-teal-command font-bold';
              }
            }

            return (
              <div className="relative z-10 flex items-start gap-4 md:flex-col md:items-center md:gap-2 md:text-center md:flex-1" key={milestone.key}>
                <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 text-sm font-semibold transition duration-200 ${circleClass}`}>
                  {isCompleted ? (
                    <Icon className="h-4 w-4" name="check" />
                  ) : isRejectedOrCancelled && isActive && (milestone.key === 'approval' || milestone.key === 'closure') ? (
                    '×'
                  ) : (
                    index + 1
                  )}
                </span>
                <div>
                  <p className={`text-sm tracking-tight ${textClass}`}>{milestone.label}</p>
                  {isActive && (
                    <p className={`mt-0.5 text-xs font-semibold uppercase tracking-wider ${isRejectedOrCancelled ? 'text-rejected' : 'text-teal-command'}`}>
                      {formatStatus(detail.status)}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Main Grid Layout */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.35fr_0.85fr]">
        
        {/* Left Column (Details, Plans, Logs) */}
        <div className="flex flex-col gap-6">
          
          {/* Request Metadata Card */}
          <section className="rounded-xl border border-border-warm bg-clean-surface p-6 shadow-[0_18px_50px_-44px_rgba(28,25,23,0.55)]">
            <h2 className="text-lg font-semibold text-deep-charcoal mb-4">Request Details</h2>
            <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 mb-6">
              {[
                ['Employment Type', detail.employmentType],
                ['Location', detail.location],
                ['Urgency', formatStatus(detail.urgency), getUrgencyStyles(detail.urgency)],
                ['Required Headcount', `${detail.filled} / ${detail.headcount} filled`],
                ['Target Date', detail.due],
                ['Last Updated', detail.updated],
              ].map(([label, value, customClass]) => (
                <div className="rounded-lg border border-border-warm bg-workflow-ivory/50 p-3" key={label}>
                  <p className="text-xs font-semibold uppercase tracking-[0.12em] text-on-surface-variant">{label}</p>
                  <p className={`mt-1.5 text-sm font-semibold ${customClass || 'text-deep-charcoal'}`}>{value}</p>
                </div>
              ))}
            </div>

            <div className="space-y-4">
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-[0.14em] text-on-surface-variant">Technical Competencies & Skills</h3>
                <div className="mt-2 flex flex-wrap gap-2">
                  {detail.skills.map((skill) => (
                    <span className="rounded-full border border-border-warm bg-workflow-ivory px-3 py-1 text-xs font-semibold text-slate-ink" key={skill}>
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
              <hr className="border-border-warm" />
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-[0.14em] text-on-surface-variant">Hiring Reason</h3>
                <p className="mt-2 text-sm leading-6 text-slate-ink">{detail.reason}</p>
              </div>
              <hr className="border-border-warm" />
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-[0.14em] text-on-surface-variant">Detailed Justification</h3>
                <p className="mt-2 text-sm leading-6 text-slate-ink">{detail.justification}</p>
              </div>
              <hr className="border-border-warm" />
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-[0.14em] text-on-surface-variant">Business Impact</h3>
                <p className="mt-2 text-sm leading-6 text-slate-ink">{detail.impact}</p>
              </div>
            </div>
          </section>

          {/* Linked Plan Details Card */}
          <section className="rounded-xl border border-border-warm bg-clean-surface p-6 shadow-[0_18px_50px_-44px_rgba(28,25,23,0.55)]">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-deep-charcoal">Recruitment Plan</h2>
                <p className="mt-1 text-xs text-slate-ink">Sourcing campaign dates and task delegation.</p>
              </div>
              {detail.linkedPlan && (
                <span className="rounded-full border border-green-200 bg-green-50 px-2.5 py-1 text-xs font-bold text-approved">
                  {detail.linkedPlan.status}
                </span>
              )}
            </div>

            {detail.linkedPlan ? (
              <div className="space-y-5">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="flex items-center gap-3 rounded-lg border border-border-warm p-4 bg-workflow-ivory/40">
                    <span className="rounded-lg bg-teal-command/10 p-2 text-teal-command">
                      <Icon className="h-5 w-5" name="calendar" />
                    </span>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">Campaign Start</p>
                      <p className="mt-0.5 text-sm font-semibold text-deep-charcoal">{detail.linkedPlan.startDate}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 rounded-lg border border-border-warm p-4 bg-workflow-ivory/40">
                    <span className="rounded-lg bg-teal-command/10 p-2 text-teal-command">
                      <Icon className="h-5 w-5" name="calendar" />
                    </span>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">Campaign End</p>
                      <p className="mt-0.5 text-sm font-semibold text-deep-charcoal">{detail.linkedPlan.endDate}</p>
                    </div>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-b border-border-warm text-xs font-semibold uppercase tracking-wider text-on-surface-variant">
                        <th className="pb-3 pr-4">Task Type</th>
                        <th className="pb-3 px-4">Assignee</th>
                        <th className="pb-3 px-4">Deadline</th>
                        <th className="pb-3 pl-4 text-right">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border-warm text-sm">
                      {detail.linkedPlan.tasks.map((task) => (
                        <tr className="hover:bg-workflow-ivory/30" key={task.taskType}>
                          <td className="py-3 pr-4 font-semibold text-deep-charcoal">
                            {task.taskType.replace('_', ' ')}
                          </td>
                          <td className="py-3 px-4 text-slate-ink">{task.assignee}</td>
                          <td className="py-3 px-4 text-slate-ink">{task.endDate}</td>
                          <td className="py-3 pl-4 text-right">
                            <span className={`inline-flex rounded-full border px-2 py-0.5 text-xs font-semibold ${getTaskStatusBadge(task.status)}`}>
                              {task.status.replace('_', ' ')}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-border-warm p-8 text-center bg-workflow-ivory/30">
                <span className="rounded-full bg-stone-100 p-2.5 text-slate-ink">
                  <Icon className="h-5 w-5" name="info" />
                </span>
                <div>
                  <h3 className="text-sm font-semibold text-deep-charcoal">No campaign plan active</h3>
                  <p className="mt-1 max-w-[40ch] text-xs text-slate-ink leading-relaxed">
                    Once the request is approved, the HR Manager will draft an Overall Plan detailing dates and operational tasks.
                  </p>
                </div>
              </div>
            )}
          </section>

          {/* Activity Log (Workflow Timeline History) */}
          <section className="rounded-xl border border-border-warm bg-clean-surface p-6 shadow-[0_18px_50px_-44px_rgba(28,25,23,0.55)]">
            <h2 className="text-lg font-semibold text-deep-charcoal mb-5">Activity Log</h2>
            <div className="relative pl-6 border-l border-border-warm space-y-6">
              {detail.activityLogs.map((log, index) => (
                <div className="relative" key={index}>
                  {/* Point */}
                  <span className="absolute -left-[30px] top-1 flex h-4 w-4 items-center justify-center rounded-full bg-clean-surface border border-teal-command ring-4 ring-clean-surface">
                    <span className="h-1.5 w-1.5 rounded-full bg-teal-command" />
                  </span>
                  <div>
                    <h3 className="text-sm font-semibold text-deep-charcoal">{log.action}</h3>
                    <p className="mt-1 text-sm text-slate-ink leading-relaxed">{log.description}</p>
                    <p className="mt-1.5 font-mono text-[10px] text-on-surface-variant font-medium">
                      By {log.performedBy} · {log.date}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* Right Column (Sidebar metrics, Approvals, CV list) */}
        <div className="flex flex-col gap-6">

          {/* Key Metrics / Sourced Status Card */}
          <section className="rounded-xl border border-border-warm bg-clean-surface p-6 shadow-[0_18px_50px_-44px_rgba(28,25,23,0.55)]">
            <h2 className="text-sm font-semibold uppercase tracking-[0.12em] text-on-surface-variant mb-4">Sourcing Dashboard</h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-lg border border-border-warm bg-workflow-ivory/50 p-4 text-center">
                <p className="text-xs font-semibold text-slate-ink">Sourced CVs</p>
                <p className="mt-2 font-mono text-3xl font-semibold text-deep-charcoal">{detail.candidates.length}</p>
                <p className="mt-1 text-[10px] text-on-surface-variant font-medium">In talent pool</p>
              </div>
              <div className="rounded-lg border border-border-warm bg-workflow-ivory/50 p-4 text-center">
                <p className="text-xs font-semibold text-slate-ink">Panel Interviews</p>
                <p className="mt-2 font-mono text-3xl font-semibold text-deep-charcoal">
                  {detail.candidates.filter((c) => c.status.includes('Interview')).length}
                </p>
                <p className="mt-1 text-[10px] text-on-surface-variant font-medium">Scheduled</p>
              </div>
            </div>
          </section>

          {/* Approval History Card */}
          <section className="rounded-xl border border-border-warm bg-clean-surface p-6 shadow-[0_18px_50px_-44px_rgba(28,25,23,0.55)]">
            <h2 className="text-lg font-semibold text-deep-charcoal mb-4">Approval Chain</h2>
            <div className="space-y-4">
              {detail.approvalHistory.map((record, index) => {
                const isApproved = record.decision === 'APPROVED';
                const isRejected = record.decision === 'REJECTED';
                const isRevision = record.decision === 'REVISION_NEEDED';

                let bgClass = 'bg-stone-50 border-stone-200';
                let iconName = 'clock';
                let toneClass = 'text-slate-ink';

                if (isApproved) {
                  bgClass = 'bg-green-50/50 border-green-200';
                  iconName = 'checkCircle';
                  toneClass = 'text-approved';
                } else if (isRejected) {
                  bgClass = 'bg-red-50/50 border-red-200';
                  iconName = 'alertCircle';
                  toneClass = 'text-rejected';
                } else if (isRevision) {
                  bgClass = 'bg-amber-50/50 border-amber-200';
                  iconName = 'info';
                  toneClass = 'text-revision';
                }

                return (
                  <div className={`rounded-lg border p-4 ${bgClass}`} key={index}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className={`shrink-0 ${toneClass}`}>
                          <Icon className="h-4 w-4" name={iconName} />
                        </span>
                        <div>
                          <h3 className="text-sm font-semibold text-deep-charcoal">{record.approver}</h3>
                          <p className="text-[10px] text-slate-ink">{record.role}</p>
                        </div>
                      </div>
                      <span className="font-mono text-[10px] text-on-surface-variant font-medium">{record.decidedAt}</span>
                    </div>
                    {record.comments && (
                      <p className="mt-3 text-xs leading-5 text-slate-ink bg-white/70 p-2.5 rounded border border-border-warm/40">
                        {record.comments}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </section>

          {/* Sourced CVs Candidates list */}
          <section className="rounded-xl border border-border-warm bg-clean-surface p-6 shadow-[0_18px_50px_-44px_rgba(28,25,23,0.55)]">
            <h2 className="text-lg font-semibold text-deep-charcoal mb-4">Talent Pool / Candidates</h2>
            {detail.candidates.length > 0 ? (
              <div className="space-y-4">
                {detail.candidates.map((cand) => {
                  const scoreColor = cand.matchScore >= 90 ? 'text-approved' : cand.matchScore >= 80 ? 'text-teal-command' : 'text-revision';
                  return (
                    <div className="rounded-lg border border-border-warm p-4 hover:border-teal-command transition bg-workflow-ivory/20" key={cand.email}>
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h3 className="text-sm font-semibold text-deep-charcoal">{cand.name}</h3>
                          <p className="text-xs text-slate-ink mt-0.5">{cand.email}</p>
                        </div>
                        <div className="text-right">
                          <span className={`font-mono text-xs font-bold ${scoreColor}`}>
                            {cand.matchScore}% match
                          </span>
                        </div>
                      </div>

                      <div className="mt-3 flex items-center justify-between border-t border-border-warm/40 pt-2 text-[11px]">
                        <span className="font-semibold text-on-surface-variant uppercase tracking-wider">
                          {cand.status}
                        </span>
                        <div className="flex items-center gap-1 text-teal-command hover:underline cursor-pointer">
                          <Icon className="h-3.5 w-3.5" name="doc" />
                          <span className="truncate max-w-[120px] font-mono text-[9px] font-medium" title={cand.cvFileName}>
                            {cand.cvFileName}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border-warm p-8 text-center bg-workflow-ivory/30">
                <span className="rounded-full bg-stone-100 p-2 text-slate-ink">
                  <Icon className="h-4 w-4" name="users" />
                </span>
                <div>
                  <h3 className="text-xs font-semibold text-deep-charcoal">No candidates sourced</h3>
                  <p className="mt-1 text-[11px] text-slate-ink leading-relaxed">
                    Candidate pool and vector search indexing will unlock once campaign goes into screening state.
                  </p>
                </div>
              </div>
            )}
          </section>
        </div>

      </div>
    </div>
  );
};
