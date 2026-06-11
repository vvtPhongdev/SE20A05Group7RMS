import React, { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

type PlanStatus = 'PENDING_APPROVAL' | 'APPROVED' | 'DRAFT' | 'REVISION_REQUIRED';
type KanbanStage = 'applied' | 'cv_screening' | 'interview' | 'final_review' | 'offer';
type InterviewType = 'Technical' | 'HR Fit' | 'Final' | 'Culture';
type DetailTab = 'kanban' | 'calendar' | 'tasks';

type Candidate = {
  id: string;
  name: string;
  initials: string;
  source: string;
  score: number;
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
  type: InterviewType;
  date: string;
  time: string;
  location: string;
  interviewer: string;
};

type TaskItem = {
  id: string;
  title: string;
  done: boolean;
  dueDate: string;
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
  candidates: Candidate[];
  interviews: Interview[];
  tasks: TaskItem[];
};

const campaignData: Record<string, CampaignData> = {
  'REQ-2024-041': {
    id: 'REQ-2024-041',
    position: 'Senior Backend Engineer',
    department: 'Engineering',
    headcount: 2,
    status: 'APPROVED',
    window: 'Oct 15 - Nov 30, 2024',
    owner: 'Sarah Jenkins',
    budget: '$15,000',
    progress: 55,
    description:
      'Seeking two senior backend engineers with deep Go or Rust experience for the core infrastructure team. Strong distributed systems fundamentals and cloud-native deployment experience are required.',
    candidates: [
      { id: 'c1', name: 'Nguyen Van Anh', initials: 'NA', source: 'LinkedIn', score: 88, stage: 'final_review', color: 'bg-teal-command', appliedDate: 'Oct 16', tags: ['Go', 'Kubernetes'] },
      { id: 'c2', name: 'Tran Minh Tam', initials: 'TM', source: 'Referral', score: 82, stage: 'interview', color: 'bg-revision', appliedDate: 'Oct 17', tags: ['Rust', 'AWS'] },
      { id: 'c3', name: 'Le Quoc Bao', initials: 'LB', source: 'Indeed', score: 75, stage: 'interview', color: 'bg-pending', appliedDate: 'Oct 18', tags: ['Java', 'GCP'] },
      { id: 'c4', name: 'Pham Thi Thu', initials: 'PT', source: 'Direct', score: 70, stage: 'cv_screening', color: 'bg-approved', appliedDate: 'Oct 19', tags: ['Node.js'] },
      { id: 'c5', name: 'Hoang Duc Manh', initials: 'HM', source: 'LinkedIn', score: 65, stage: 'cv_screening', color: 'bg-slate-ink', appliedDate: 'Oct 20', tags: ['Python', 'Docker'] },
      { id: 'c6', name: 'Vo Thi Lan', initials: 'VL', source: 'Indeed', score: 60, stage: 'applied', color: 'bg-draft', appliedDate: 'Oct 21', tags: ['Go'] },
      { id: 'c7', name: 'Bui Van Son', initials: 'BS', source: 'Referral', score: 58, stage: 'applied', color: 'bg-teal-command/70', appliedDate: 'Oct 22', tags: ['C++'] },
      { id: 'c8', name: 'Dinh Thi Hoa', initials: 'DH', source: 'LinkedIn', score: 92, stage: 'offer', color: 'bg-approved', appliedDate: 'Oct 15', tags: ['Go', 'Rust', 'K8s'] },
    ],
    interviews: [
      { id: 'i1', candidateName: 'Nguyen Van Anh', initials: 'NA', color: 'bg-teal-command', type: 'Final', date: 'Mon 16', time: '10:00 AM', location: 'Room 402', interviewer: 'David Chen' },
      { id: 'i2', candidateName: 'Tran Minh Tam', initials: 'TM', color: 'bg-revision', type: 'Technical', date: 'Mon 16', time: '02:00 PM', location: 'Virtual', interviewer: 'Sarah Jenkins' },
      { id: 'i3', candidateName: 'Le Quoc Bao', initials: 'LB', color: 'bg-pending', type: 'HR Fit', date: 'Tue 17', time: '09:30 AM', location: 'Room 201', interviewer: 'Sarah Jenkins' },
      { id: 'i4', candidateName: 'Dinh Thi Hoa', initials: 'DH', color: 'bg-approved', type: 'Culture', date: 'Wed 18', time: '11:00 AM', location: 'Office 101', interviewer: 'Lin Park' },
    ],
    tasks: [
      { id: 't1', title: 'Publish job posting on LinkedIn and Indeed', done: true, dueDate: 'Oct 16' },
      { id: 't2', title: 'Screen 50 incoming CVs', done: true, dueDate: 'Oct 22' },
      { id: 't3', title: 'Schedule technical phone screens', done: true, dueDate: 'Oct 25' },
      { id: 't4', title: 'Conduct take-home coding challenge', done: false, dueDate: 'Oct 30' },
      { id: 't5', title: 'Panel interviews with shortlisted candidates', done: false, dueDate: 'Nov 06' },
      { id: 't6', title: 'Complete reference checks', done: false, dueDate: 'Nov 18' },
      { id: 't7', title: 'Extend offer letters', done: false, dueDate: 'Nov 25' },
    ],
  },
};

const kanbanColumns: Array<{ key: KanbanStage; label: string; accent: string; bg: string }> = [
  { key: 'applied', label: 'Applied', accent: 'border-slate-400', bg: 'bg-slate-50' },
  { key: 'cv_screening', label: 'CV Screening', accent: 'border-teal-command', bg: 'bg-teal-command/5' },
  { key: 'interview', label: 'Interview', accent: 'border-revision', bg: 'bg-amber-50' },
  { key: 'final_review', label: 'Final Review', accent: 'border-pending', bg: 'bg-cyan-50' },
  { key: 'offer', label: 'Offer', accent: 'border-approved', bg: 'bg-green-50' },
];

const weekDays = ['Mon 16', 'Tue 17', 'Wed 18', 'Thu 19', 'Fri 20'];
const timeSlots = ['09:00 AM', '10:00 AM', '11:00 AM', '12:00 PM', '01:00 PM', '02:00 PM', '03:00 PM', '04:00 PM'];

const statusConfig: Record<PlanStatus, { label: string; dot: string; badge: string }> = {
  PENDING_APPROVAL: { label: 'PENDING_APPROVAL', dot: 'bg-pending', badge: 'border-pending/20 bg-pending/10 text-pending' },
  APPROVED: { label: 'APPROVED', dot: 'bg-approved', badge: 'border-approved/20 bg-approved/10 text-approved' },
  DRAFT: { label: 'DRAFT', dot: 'bg-draft', badge: 'border-draft/20 bg-draft/10 text-draft' },
  REVISION_REQUIRED: { label: 'REVISION_REQUIRED', dot: 'bg-revision', badge: 'border-revision/20 bg-revision/10 text-revision' },
};

const interviewTypeBadge: Record<InterviewType, string> = {
  Technical: 'border-revision/20 bg-revision/10 text-revision',
  'HR Fit': 'border-teal-command/20 bg-teal-command/10 text-teal-command',
  Final: 'border-approved/20 bg-approved/10 text-approved',
  Culture: 'border-pending/20 bg-pending/10 text-pending',
};

const iconPaths: Record<string, React.ReactNode> = {
  back: <path d="M19 12H5m6-6-6 6 6 6" />,
  edit: <path d="m4 20 4.5-1 10-10a2.1 2.1 0 0 0-3-3l-10 10L4 20Zm12-14 3 3" />,
  send: <path d="m22 2-7 20-4-9-9-4 20-7Z" />,
  kanban: <path d="M4 5h5v14H4zM10 5h5v8h-5zM16 5h4v11h-4z" />,
  calendar: <path d="M7 3v4m10-4v4M4 9h16M6 5h12a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2Z" />,
  checklist: <path d="m4 7 1.5 1.5L8 6m4 1h8M4 13l1.5 1.5L8 12m4 1h8M4 19l1.5 1.5L8 18m4 1h8" />,
  plus: <path d="M12 5v14M5 12h14" />,
  userPlus: <path d="M16 21a6 6 0 0 0-12 0m8-13a4 4 0 1 1-8 0 4 4 0 0 1 8 0Zm5 3v6m-3-3h6" />,
  report: <path d="M7 3h7l5 5v13H7zM14 3v5h5M10 13h6m-6 4h4" />,
  check: <path d="m5 12 4 4L19 6" />,
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
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-bold ${config.badge}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${config.dot}`} />
      {config.label}
    </span>
  );
};

const CandidateCard = ({ candidate }: { candidate: Candidate }) => (
  <article className="cursor-grab select-none rounded-lg border border-border-warm bg-clean-surface p-3 shadow-sm transition hover:-translate-y-[1px] hover:shadow-md active:scale-[0.98]">
    <div className="mb-2 flex items-start gap-2.5">
      <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[11px] font-bold text-white ${candidate.color}`}>
        {candidate.initials}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold leading-tight text-deep-charcoal">{candidate.name}</p>
        <p className="mt-0.5 text-[11px] text-on-surface-variant">{candidate.source}</p>
      </div>
      <span className="shrink-0 font-mono text-[11px] font-semibold text-teal-command">{candidate.score}</span>
    </div>
    <div className="flex flex-wrap gap-1">
      {candidate.tags.map((tag) => (
        <span className="rounded bg-surface-variant px-1.5 py-0.5 text-[10px] font-medium text-on-surface-variant" key={tag}>
          {tag}
        </span>
      ))}
    </div>
    <p className="mt-2 text-[10px] text-on-surface-variant">Applied {candidate.appliedDate}</p>
  </article>
);

const fallbackCampaign = (id: string): CampaignData => ({
  id,
  position: 'Recruitment Campaign',
  department: 'General',
  headcount: 1,
  status: 'DRAFT',
  window: 'TBD',
  owner: 'Sarah Jenkins',
  budget: '$0',
  progress: 0,
  description: 'No detail data has been configured for this campaign yet.',
  candidates: [],
  interviews: [],
  tasks: [],
});

export const HRCampaignDetail: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [activeTab, setActiveTab] = useState<DetailTab>('kanban');

  const campaignId = id?.replace(/^#/, '') ?? 'REQ-2024-041';
  const campaign = campaignData[campaignId] ?? fallbackCampaign(campaignId);

  const completedTasks = campaign.tasks.filter((task) => task.done).length;
  const candidatesByStage = useMemo(
    () =>
      kanbanColumns.reduce(
        (acc, column) => {
          acc[column.key] = campaign.candidates.filter((candidate) => candidate.stage === column.key);
          return acc;
        },
        {} as Record<KanbanStage, Candidate[]>,
      ),
    [campaign.candidates],
  );

  const taskProgress = campaign.tasks.length > 0 ? Math.round((completedTasks / campaign.tasks.length) * 100) : 0;

  return (
    <div className="mx-auto flex max-w-[1440px] flex-col gap-6">
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
              <span className="font-mono text-sm font-semibold text-teal-command">#{campaign.id}</span>
              <h1 className="text-2xl font-semibold tracking-tight text-deep-charcoal">{campaign.position}</h1>
              <StatusBadge status={campaign.status} />
            </div>
            <p className="mt-2 text-sm text-on-surface-variant">
              {campaign.department} / {campaign.headcount} HC / {campaign.window}
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <button className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-border-warm bg-clean-surface px-4 text-sm font-semibold text-slate-ink transition hover:border-teal-command hover:text-teal-command active:scale-[0.98]" type="button">
              <Icon className="h-4 w-4" name="edit" />
              Edit Plan
            </button>
            <button className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-teal-command px-4 text-sm font-semibold text-white transition hover:bg-primary active:scale-[0.98]" type="button">
              <Icon className="h-4 w-4" name="send" />
              Submit for Approval
            </button>
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
                  activeTab === tab.key ? 'bg-teal-command text-white shadow-sm' : 'text-on-surface-variant hover:bg-workflow-ivory hover:text-deep-charcoal'
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
                      <div className={`mb-3 flex items-center justify-between rounded-lg border-l-4 px-3 py-2 ${column.accent} ${column.bg}`}>
                        <span className="text-xs font-bold uppercase tracking-[0.14em] text-deep-charcoal">{column.label}</span>
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
              <div className="grid border-b border-border-warm" style={{ gridTemplateColumns: '72px repeat(5, minmax(120px, 1fr))' }}>
                <div className="bg-workflow-ivory/50 p-3" />
                {weekDays.map((day) => (
                  <div className="border-l border-border-warm bg-workflow-ivory/50 p-3 text-center" key={day}>
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-on-surface-variant">{day.split(' ')[0]}</p>
                    <p className={`mt-0.5 text-lg font-bold ${day === 'Mon 16' ? 'text-teal-command' : 'text-deep-charcoal'}`}>{day.split(' ')[1]}</p>
                  </div>
                ))}
              </div>
              <div className="overflow-x-auto">
                {timeSlots.map((slot) => (
                  <div className="grid border-b border-border-warm last:border-b-0" key={slot} style={{ gridTemplateColumns: '72px repeat(5, minmax(120px, 1fr))' }}>
                    <div className="flex justify-center border-r border-border-warm p-2 pt-3 font-mono text-[11px] text-on-surface-variant">{slot}</div>
                    {weekDays.map((day) => {
                      const items = campaign.interviews.filter((interview) => interview.date === day && interview.time.startsWith(slot.split(':')[0]));

                      return (
                        <div className="min-h-[74px] border-l border-border-warm p-1.5" key={day}>
                          {items.map((interview) => (
                            <div
                              className={`mb-1 rounded-md border-l-2 p-2 transition hover:shadow-sm ${
                                interview.type === 'Technical'
                                  ? 'border-revision bg-amber-50'
                                  : interview.type === 'Final'
                                    ? 'border-approved bg-green-50'
                                    : interview.type === 'Culture'
                                      ? 'border-pending bg-cyan-50'
                                      : 'border-teal-command bg-teal-command/5'
                              }`}
                              key={interview.id}
                            >
                              <div className="mb-1 flex items-center gap-1.5">
                                <span className={`flex h-5 w-5 items-center justify-center rounded-full text-[9px] font-bold text-white ${interview.color}`}>{interview.initials}</span>
                                <p className="truncate text-[11px] font-semibold text-deep-charcoal">{interview.candidateName}</p>
                              </div>
                              <p className="text-[10px] text-on-surface-variant">
                                {interview.type} / {interview.time}
                              </p>
                              <p className="text-[10px] text-on-surface-variant">{interview.location}</p>
                            </div>
                          ))}
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
              <div className="flex flex-wrap gap-2 border-t border-border-warm bg-workflow-ivory/50 px-4 py-3">
                {(['Technical', 'HR Fit', 'Final', 'Culture'] as InterviewType[]).map((type) => (
                  <span className={`inline-flex rounded-full border px-2 py-0.5 text-[11px] font-semibold ${interviewTypeBadge[type]}`} key={type}>
                    {type}
                  </span>
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
                    {completedTasks} of {campaign.tasks.length} completed
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="h-1.5 w-32 overflow-hidden rounded-full bg-surface-variant">
                    <div className="h-full rounded-full bg-teal-command" style={{ width: `${taskProgress}%` }} />
                  </div>
                  <span className="font-mono text-xs text-on-surface-variant">{taskProgress}%</span>
                </div>
              </div>
              <ul className="divide-y divide-border-warm">
                {campaign.tasks.map((task) => (
                  <li className={`flex items-center gap-4 px-6 py-4 transition ${task.done ? 'bg-workflow-ivory/30' : 'hover:bg-workflow-ivory/50'}`} key={task.id}>
                    <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 ${task.done ? 'border-approved bg-approved text-white' : 'border-border-warm'}`}>
                      {task.done ? <Icon className="h-3 w-3" name="check" /> : null}
                    </span>
                    <p className={`flex-1 text-sm ${task.done ? 'text-on-surface-variant line-through' : 'font-medium text-deep-charcoal'}`}>{task.title}</p>
                    <span className={`font-mono text-xs ${task.done ? 'text-on-surface-variant' : 'text-slate-ink'}`}>Due {task.dueDate}</span>
                    {!task.done ? <button className="text-xs font-semibold text-teal-command transition hover:underline">Mark done</button> : null}
                  </li>
                ))}
              </ul>
              <div className="border-t border-border-warm bg-workflow-ivory/50 px-6 py-3">
                <button className="inline-flex items-center gap-2 text-sm font-semibold text-teal-command transition hover:underline" type="button">
                  <Icon className="h-4 w-4" name="plus" />
                  Add task
                </button>
              </div>
            </section>
          ) : null}
        </main>

        <aside className="space-y-4">
          <section className="rounded-lg border border-border-warm bg-clean-surface p-5">
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.14em] text-on-surface-variant">Overall Progress</p>
            <div className="mb-3 flex items-baseline gap-2">
              <span className="font-mono text-3xl font-bold text-deep-charcoal">{campaign.progress}%</span>
              <span className="text-xs text-on-surface-variant">complete</span>
            </div>
            <div className="mb-4 h-2 overflow-hidden rounded-full bg-surface-variant">
              <div className="h-full rounded-full bg-teal-command" style={{ width: `${campaign.progress}%` }} />
            </div>
            <div className="space-y-2">
              {kanbanColumns.map((column) => (
                <div className="flex items-center justify-between" key={column.key}>
                  <span className="text-xs text-on-surface-variant">{column.label}</span>
                  <span className="font-mono text-xs font-semibold text-deep-charcoal">{candidatesByStage[column.key].length}</span>
                </div>
              ))}
            </div>
          </section>

          <section className="space-y-4 rounded-lg border border-border-warm bg-clean-surface p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-on-surface-variant">Plan Summary</p>
            {[
              ['Campaign ID', `#${campaign.id}`, true],
              ['Owner', campaign.owner, false],
              ['Department', campaign.department, false],
              ['Headcount', String(campaign.headcount), true],
              ['Budget', campaign.budget, true],
              ['Window', campaign.window, false],
            ].map(([label, value, mono]) => (
              <div key={label as string}>
                <p className="text-[11px] text-on-surface-variant">{label}</p>
                <p className={`mt-0.5 text-sm font-semibold text-deep-charcoal ${mono ? 'font-mono' : ''}`}>{value}</p>
              </div>
            ))}
          </section>

          <section className="rounded-lg border border-border-warm bg-clean-surface p-5">
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-on-surface-variant">Position Brief</p>
            <p className="text-sm leading-6 text-slate-ink">{campaign.description}</p>
          </section>

          <section className="rounded-lg border border-border-warm bg-clean-surface p-5">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-on-surface-variant">Upcoming Interviews</p>
              <button className="text-[11px] font-semibold text-teal-command transition hover:underline" onClick={() => setActiveTab('calendar')} type="button">
                View all
              </button>
            </div>
            <div className="space-y-3">
              {campaign.interviews.slice(0, 3).map((interview) => (
                <div className="flex items-start gap-2.5" key={interview.id}>
                  <span className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white ${interview.color}`}>{interview.initials}</span>
                  <div className="min-w-0">
                    <p className="truncate text-xs font-semibold leading-tight text-deep-charcoal">{interview.candidateName}</p>
                    <p className="text-[11px] text-on-surface-variant">
                      {interview.type} / {interview.date} {interview.time}
                    </p>
                    <p className="text-[10px] text-on-surface-variant">{interview.location}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="space-y-2 rounded-lg border border-border-warm bg-clean-surface p-5">
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.14em] text-on-surface-variant">Quick Actions</p>
            {[
              { icon: 'userPlus', label: 'Add Candidate' },
              { icon: 'calendar', label: 'Schedule Interview' },
              { icon: 'report', label: 'Export Report' },
            ].map((action) => (
              <button
                className="flex w-full items-center gap-2 rounded-lg border border-border-warm px-3 py-2 text-sm font-semibold text-slate-ink transition hover:border-teal-command hover:bg-teal-command/5 hover:text-teal-command active:scale-[0.98]"
                key={action.label}
                type="button"
              >
                <Icon className="h-4 w-4" name={action.icon} />
                {action.label}
              </button>
            ))}
          </section>
        </aside>
      </section>
    </div>
  );
};
