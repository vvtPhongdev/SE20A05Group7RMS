import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

// ─── Types ────────────────────────────────────────────────────────────────────

type PlanStatus = 'PENDING_APPROVAL' | 'APPROVED' | 'DRAFT' | 'REVISION_REQUIRED';
type KanbanStage = 'applied' | 'cv_screening' | 'interview' | 'final_review' | 'offer';
type InterviewType = 'Technical' | 'HR Fit' | 'Final' | 'Culture';

interface Candidate {
  id: string;
  name: string;
  initials: string;
  role: string;
  source: string;
  score: number;
  stage: KanbanStage;
  color: string; // avatar bg
  appliedDate: string;
  tags: string[];
}

interface Interview {
  id: string;
  candidateName: string;
  initials: string;
  color: string;
  type: InterviewType;
  role: string;
  date: string; // e.g. "Mon 16"
  time: string;
  location: string;
  interviewer: string;
}

interface TaskItem {
  id: string;
  title: string;
  done: boolean;
  dueDate: string;
}

interface CampaignData {
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
  tasks: TaskItem[];
  candidates: Candidate[];
  interviews: Interview[];
}

// ─── Static mock data ─────────────────────────────────────────────────────────

const campaignData: Record<string, CampaignData> = {
  'REQ-2024-041': {
    id: 'REQ-2024-041',
    position: 'Senior Backend Engineer',
    department: 'Engineering',
    headcount: 2,
    status: 'APPROVED',
    window: 'Oct 15 – Nov 30, 2024',
    owner: 'Sarah Jenkins',
    budget: '$15,000',
    progress: 55,
    description:
      'Seeking two senior backend engineers with deep Go/Rust experience to join the core infrastructure team. Must have strong distributed-systems fundamentals and cloud-native deployment experience.',
    tasks: [
      { id: 't1', title: 'Publish job posting on LinkedIn & Indeed', done: true, dueDate: 'Oct 16' },
      { id: 't2', title: 'Screen 50 incoming CVs', done: true, dueDate: 'Oct 22' },
      { id: 't3', title: 'Schedule technical phone screens', done: true, dueDate: 'Oct 25' },
      { id: 't4', title: 'Conduct take-home coding challenge', done: false, dueDate: 'Oct 30' },
      { id: 't5', title: 'Panel interviews (3 candidates)', done: false, dueDate: 'Nov 06' },
      { id: 't6', title: 'Reference checks', done: false, dueDate: 'Nov 18' },
      { id: 't7', title: 'Extend offer letters', done: false, dueDate: 'Nov 25' },
    ],
    candidates: [
      {
        id: 'c1', name: 'Nguyen Van Anh', initials: 'NA', role: 'Backend Eng.', source: 'LinkedIn',
        score: 88, stage: 'final_review', color: 'bg-teal-command', appliedDate: 'Oct 16', tags: ['Go', 'Kubernetes'],
      },
      {
        id: 'c2', name: 'Tran Minh Tam', initials: 'TM', role: 'Backend Eng.', source: 'Referral',
        score: 82, stage: 'interview', color: 'bg-revision', appliedDate: 'Oct 17', tags: ['Rust', 'AWS'],
      },
      {
        id: 'c3', name: 'Le Quoc Bao', initials: 'LB', role: 'Backend Eng.', source: 'Indeed',
        score: 75, stage: 'interview', color: 'bg-pending', appliedDate: 'Oct 18', tags: ['Java', 'GCP'],
      },
      {
        id: 'c4', name: 'Pham Thi Thu', initials: 'PT', role: 'Backend Eng.', source: 'Direct',
        score: 70, stage: 'cv_screening', color: 'bg-approved', appliedDate: 'Oct 19', tags: ['Node.js'],
      },
      {
        id: 'c5', name: 'Hoang Duc Manh', initials: 'HM', role: 'Backend Eng.', source: 'LinkedIn',
        score: 65, stage: 'cv_screening', color: 'bg-slate-ink', appliedDate: 'Oct 20', tags: ['Python', 'Docker'],
      },
      {
        id: 'c6', name: 'Vo Thi Lan', initials: 'VL', role: 'Backend Eng.', source: 'Indeed',
        score: 60, stage: 'applied', color: 'bg-draft', appliedDate: 'Oct 21', tags: ['Go'],
      },
      {
        id: 'c7', name: 'Bui Van Son', initials: 'BS', role: 'Backend Eng.', source: 'Referral',
        score: 58, stage: 'applied', color: 'bg-teal-command/70', appliedDate: 'Oct 22', tags: ['C++'],
      },
      {
        id: 'c8', name: 'Dinh Thi Hoa', initials: 'DH', role: 'Backend Eng.', source: 'LinkedIn',
        score: 92, stage: 'offer', color: 'bg-approved', appliedDate: 'Oct 15', tags: ['Go', 'Rust', 'k8s'],
      },
    ],
    interviews: [
      {
        id: 'i1', candidateName: 'Nguyen Van Anh', initials: 'NA', color: 'bg-teal-command',
        type: 'Final', role: 'Senior Backend Engineer', date: 'Mon 16', time: '10:00 AM', location: 'Room 402', interviewer: 'David Chen',
      },
      {
        id: 'i2', candidateName: 'Tran Minh Tam', initials: 'TM', color: 'bg-revision',
        type: 'Technical', role: 'Senior Backend Engineer', date: 'Mon 16', time: '02:00 PM', location: 'Virtual', interviewer: 'Sarah Jenkins',
      },
      {
        id: 'i3', candidateName: 'Le Quoc Bao', initials: 'LB', color: 'bg-pending',
        type: 'HR Fit', role: 'Senior Backend Engineer', date: 'Tue 17', time: '09:30 AM', location: 'Room 201', interviewer: 'Sarah Jenkins',
      },
      {
        id: 'i4', candidateName: 'Dinh Thi Hoa', initials: 'DH', color: 'bg-approved',
        type: 'Culture', role: 'Senior Backend Engineer', date: 'Wed 18', time: '11:00 AM', location: 'Office 101', interviewer: 'Lin Park',
      },
    ],
  },
};

// Fallback for any campaign ID we don't have detailed data for
const getFallback = (id: string): CampaignData => ({
  id,
  position: 'Recruitment Campaign',
  department: 'General',
  headcount: 1,
  status: 'DRAFT',
  window: 'TBD',
  owner: 'Sarah Jenkins',
  budget: '$0',
  progress: 0,
  description: 'No description available for this campaign.',
  tasks: [],
  candidates: [],
  interviews: [],
});

// ─── Config maps ──────────────────────────────────────────────────────────────

const statusConfig: Record<PlanStatus, { label: string; dot: string; badge: string }> = {
  PENDING_APPROVAL: { label: 'PENDING_APPROVAL', dot: 'bg-pending', badge: 'bg-pending/10 text-pending border border-pending/20' },
  APPROVED:         { label: 'APPROVED',         dot: 'bg-approved', badge: 'bg-approved/10 text-approved border border-approved/20' },
  DRAFT:            { label: 'DRAFT',            dot: 'bg-draft',    badge: 'bg-draft/10 text-draft border border-draft/20' },
  REVISION_REQUIRED:{ label: 'REVISION_REQUIRED',dot: 'bg-revision', badge: 'bg-revision/10 text-revision border border-revision/20' },
};

const kanbanColumns: { key: KanbanStage; label: string; accent: string; bg: string }[] = [
  { key: 'applied',     label: 'Applied',       accent: 'border-slate-400',       bg: 'bg-slate-50' },
  { key: 'cv_screening',label: 'CV Screening',  accent: 'border-teal-command',    bg: 'bg-teal-command/5' },
  { key: 'interview',   label: 'Interview',     accent: 'border-revision',        bg: 'bg-amber-50' },
  { key: 'final_review',label: 'Final Review',  accent: 'border-pending',         bg: 'bg-cyan-50' },
  { key: 'offer',       label: 'Offer',         accent: 'border-approved',        bg: 'bg-green-50' },
];

const interviewTypeBadge: Record<InterviewType, string> = {
  Technical: 'bg-revision/10 text-revision border-revision/20',
  'HR Fit':  'bg-teal-command/10 text-teal-command border-teal-command/20',
  Final:     'bg-approved/10 text-approved border-approved/20',
  Culture:   'bg-pending/10 text-pending border-pending/20',
};

const weekDays = ['Mon 16', 'Tue 17', 'Wed 18', 'Thu 19', 'Fri 20'];

// ─── Sub-components ───────────────────────────────────────────────────────────

const StatusBadge: React.FC<{ status: PlanStatus }> = ({ status }) => {
  const cfg = statusConfig[status];
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold tracking-wide ${cfg.badge}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
};

const CandidateCard: React.FC<{ candidate: Candidate }> = ({ candidate }) => (
  <div className="bg-clean-surface border border-border-warm rounded-lg p-3 shadow-sm hover:shadow-md transition-shadow cursor-grab active:cursor-grabbing select-none">
    <div className="flex items-start gap-2.5 mb-2">
      <div className={`w-8 h-8 rounded-full ${candidate.color} flex items-center justify-center text-white text-[11px] font-bold flex-shrink-0`}>
        {candidate.initials}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-deep-charcoal leading-tight truncate">{candidate.name}</p>
        <p className="text-[11px] text-on-surface-variant mt-0.5">{candidate.source}</p>
      </div>
      <span className="font-mono text-[11px] font-semibold text-teal-command ml-auto flex-shrink-0">{candidate.score}</span>
    </div>
    <div className="flex flex-wrap gap-1">
      {candidate.tags.map((tag) => (
        <span key={tag} className="px-1.5 py-0.5 rounded bg-surface-variant text-[10px] text-on-surface-variant font-medium">{tag}</span>
      ))}
    </div>
    <p className="text-[10px] text-on-surface-variant mt-2 opacity-70">Applied {candidate.appliedDate}</p>
  </div>
);

// ─── Main Component ───────────────────────────────────────────────────────────

export const HRCampaignDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'kanban' | 'calendar' | 'tasks'>('kanban');

  const rawId = id?.replace('#', '') ?? '';
  const campaign = campaignData[rawId] ?? getFallback(rawId);

  const candidatesByStage = (stage: KanbanStage) =>
    campaign.candidates.filter((c) => c.stage === stage);

  const interviewsByDay = (day: string) =>
    campaign.interviews.filter((i) => i.date === day);

  const completedTasks = campaign.tasks.filter((t) => t.done).length;

  return (
    <div className="-m-8 min-h-full bg-workflow-ivory">
      {/* ── Top Bar ──────────────────────────────────────────────────────── */}
      <div className="sticky top-0 z-20 bg-workflow-ivory border-b border-border-warm px-8 py-4 flex items-center gap-4">
        {/* Back */}
        <button
          onClick={() => navigate('/hr/campaigns')}
          className="flex items-center gap-1.5 text-on-surface-variant hover:text-teal-command text-sm font-medium transition-colors"
        >
          <span className="material-symbols-outlined text-[18px]">arrow_back</span>
          Campaigns
        </button>
        <span className="text-border-warm text-lg">›</span>

        {/* Breadcrumb + title */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 flex-wrap">
            <span className="font-mono text-sm text-teal-command font-semibold">#{campaign.id}</span>
            <h1 className="font-semibold text-deep-charcoal text-lg leading-tight truncate">{campaign.position}</h1>
            <StatusBadge status={campaign.status} />
          </div>
          <p className="text-xs text-on-surface-variant mt-0.5">
            {campaign.department} · {campaign.headcount} HC · {campaign.window}
          </p>
        </div>

        {/* Actions */}
        <div className="flex gap-2 flex-shrink-0">
          <button className="flex items-center gap-1.5 px-3 py-1.5 border border-border-warm rounded-lg text-sm text-slate-ink hover:border-teal-command hover:text-teal-command transition-colors font-medium">
            <span className="material-symbols-outlined text-[16px]">edit</span>
            Edit Plan
          </button>
          <button className="flex items-center gap-1.5 px-3 py-1.5 bg-teal-command text-white rounded-lg text-sm font-semibold hover:bg-teal-700 transition-colors shadow-sm">
            <span className="material-symbols-outlined text-[16px]">send</span>
            Submit for Approval
          </button>
        </div>
      </div>

      <div className="px-8 py-6 flex gap-6">
        {/* ── Left: Main Content ──────────────────────────────────────── */}
        <div className="flex-1 min-w-0 space-y-6">

          {/* Tab Bar */}
          <div className="flex gap-1 bg-clean-surface border border-border-warm rounded-lg p-1 w-fit">
            {([
              { key: 'kanban', label: 'Pipeline Kanban', icon: 'view_kanban' },
              { key: 'calendar', label: 'Interview Calendar', icon: 'calendar_month' },
              { key: 'tasks', label: 'Tasks', icon: 'checklist' },
            ] as const).map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-md text-sm font-medium transition-all ${
                  activeTab === tab.key
                    ? 'bg-teal-command text-white shadow-sm'
                    : 'text-on-surface-variant hover:text-deep-charcoal hover:bg-workflow-ivory'
                }`}
              >
                <span className="material-symbols-outlined text-[16px]">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </div>

          {/* ── KANBAN BOARD ─────────────────────────────────────────── */}
          {activeTab === 'kanban' && (
            <div className="overflow-x-auto pb-2">
              <div className="flex gap-4 min-w-[900px]">
                {kanbanColumns.map((col) => {
                  const cards = candidatesByStage(col.key);
                  return (
                    <div key={col.key} className="flex-1 min-w-[180px] max-w-[240px]">
                      {/* Column Header */}
                      <div className={`flex items-center justify-between mb-3 px-3 py-2 rounded-lg border-l-4 ${col.accent} ${col.bg}`}>
                        <span className="text-xs font-semibold text-deep-charcoal uppercase tracking-wide">{col.label}</span>
                        <span className="ml-2 text-xs font-mono font-bold text-on-surface-variant bg-clean-surface rounded-full px-2 py-0.5 border border-border-warm">
                          {cards.length}
                        </span>
                      </div>
                      {/* Cards */}
                      <div className="space-y-3 min-h-[120px]">
                        {cards.map((c) => <CandidateCard key={c.id} candidate={c} />)}
                        {cards.length === 0 && (
                          <div className="border-2 border-dashed border-border-warm rounded-lg h-20 flex items-center justify-center">
                            <span className="text-xs text-on-surface-variant">No candidates</span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ── INTERVIEW CALENDAR ───────────────────────────────────── */}
          {activeTab === 'calendar' && (
            <div className="bg-clean-surface border border-border-warm rounded-lg overflow-hidden">
              {/* Week header */}
              <div className="grid border-b border-border-warm" style={{ gridTemplateColumns: '72px repeat(5, 1fr)' }}>
                <div className="p-3 bg-workflow-ivory/50" />
                {weekDays.map((day) => (
                  <div key={day} className="p-3 text-center bg-workflow-ivory/50 border-l border-border-warm">
                    <p className="text-xs font-semibold text-on-surface-variant uppercase tracking-wide">{day.split(' ')[0]}</p>
                    <p className={`text-lg font-bold mt-0.5 ${day === 'Mon 16' ? 'text-teal-command' : 'text-deep-charcoal'}`}>
                      {day.split(' ')[1]}
                    </p>
                  </div>
                ))}
              </div>

              {/* Time slots */}
              {['09:00 AM', '10:00 AM', '11:00 AM', '12:00 PM', '01:00 PM', '02:00 PM', '03:00 PM', '04:00 PM'].map((slot) => (
                <div key={slot} className="grid border-b border-border-warm last:border-b-0" style={{ gridTemplateColumns: '72px repeat(5, 1fr)' }}>
                  <div className="p-2 text-[11px] text-on-surface-variant font-mono border-r border-border-warm flex items-start pt-3 justify-center">
                    {slot}
                  </div>
                  {weekDays.map((day) => {
                    const dayInterviews = interviewsByDay(day).filter(
                      (i) => i.time.startsWith(slot.split(':')[0])
                    );
                    return (
                      <div key={day} className="border-l border-border-warm p-1.5 min-h-[72px]">
                        {dayInterviews.map((interview) => (
                          <div
                            key={interview.id}
                            className={`rounded-md p-2 mb-1 border-l-2 ${
                              interview.type === 'Technical' ? 'bg-amber-50 border-revision' :
                              interview.type === 'Final'     ? 'bg-green-50 border-approved' :
                              interview.type === 'Culture'   ? 'bg-cyan-50 border-pending' :
                                                               'bg-teal-command/5 border-teal-command'
                            } cursor-pointer hover:shadow-sm transition-shadow`}
                          >
                            <div className="flex items-center gap-1.5 mb-1">
                              <div className={`w-5 h-5 rounded-full ${interview.color} flex items-center justify-center text-white text-[9px] font-bold flex-shrink-0`}>
                                {interview.initials}
                              </div>
                              <p className="text-[11px] font-semibold text-deep-charcoal leading-tight truncate">
                                {interview.candidateName}
                              </p>
                            </div>
                            <p className="text-[10px] text-on-surface-variant">{interview.type} · {interview.time}</p>
                            <p className="text-[10px] text-on-surface-variant">{interview.location}</p>
                          </div>
                        ))}
                      </div>
                    );
                  })}
                </div>
              ))}

              {/* Legend */}
              <div className="px-4 py-3 bg-workflow-ivory/50 border-t border-border-warm flex gap-4 flex-wrap">
                {(['Technical', 'HR Fit', 'Final', 'Culture'] as InterviewType[]).map((type) => (
                  <span key={type} className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[11px] font-semibold ${interviewTypeBadge[type]}`}>
                    {type}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* ── TASKS ────────────────────────────────────────────────── */}
          {activeTab === 'tasks' && (
            <div className="bg-clean-surface border border-border-warm rounded-lg overflow-hidden">
              <div className="px-6 py-4 border-b border-border-warm bg-workflow-ivory/50 flex justify-between items-center">
                <div>
                  <h3 className="font-semibold text-deep-charcoal">Campaign Tasks</h3>
                  <p className="text-xs text-on-surface-variant mt-0.5">{completedTasks} of {campaign.tasks.length} completed</p>
                </div>
                {/* Progress bar */}
                <div className="flex items-center gap-3">
                  <div className="w-32 h-1.5 bg-surface-variant rounded-full overflow-hidden">
                    <div
                      className="h-full bg-teal-command rounded-full transition-all"
                      style={{ width: campaign.tasks.length > 0 ? `${(completedTasks / campaign.tasks.length) * 100}%` : '0%' }}
                    />
                  </div>
                  <span className="font-mono text-xs text-on-surface-variant">
                    {campaign.tasks.length > 0 ? Math.round((completedTasks / campaign.tasks.length) * 100) : 0}%
                  </span>
                </div>
              </div>

              <ul className="divide-y divide-border-warm">
                {campaign.tasks.map((task) => (
                  <li key={task.id} className={`flex items-center gap-4 px-6 py-4 transition-colors ${task.done ? 'bg-workflow-ivory/30' : 'hover:bg-workflow-ivory/50'}`}>
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${task.done ? 'bg-approved border-approved' : 'border-border-warm'}`}>
                      {task.done && <span className="material-symbols-outlined text-white text-[13px]" style={{ fontVariationSettings: "'FILL' 1" }}>check</span>}
                    </div>
                    <p className={`flex-1 text-sm ${task.done ? 'line-through text-on-surface-variant' : 'text-deep-charcoal font-medium'}`}>
                      {task.title}
                    </p>
                    <span className={`text-xs font-mono ${task.done ? 'text-on-surface-variant' : 'text-slate-ink'}`}>
                      Due {task.dueDate}
                    </span>
                    {!task.done && (
                      <button className="text-teal-command hover:underline text-xs font-semibold flex-shrink-0">
                        Mark done
                      </button>
                    )}
                  </li>
                ))}
                {campaign.tasks.length === 0 && (
                  <li className="py-12 text-center text-sm text-on-surface-variant">No tasks configured yet.</li>
                )}
              </ul>

              <div className="px-6 py-3 bg-workflow-ivory/50 border-t border-border-warm">
                <button className="flex items-center gap-2 text-sm text-teal-command hover:underline font-semibold">
                  <span className="material-symbols-outlined text-[16px]">add</span>
                  Add task
                </button>
              </div>
            </div>
          )}
        </div>

        {/* ── Right: Plan Summary Panel ───────────────────────────────── */}
        <aside className="w-[300px] flex-shrink-0 space-y-4">

          {/* Progress Card */}
          <div className="bg-clean-surface border border-border-warm rounded-lg p-5">
            <p className="text-xs font-semibold text-on-surface-variant uppercase tracking-wide mb-3">Overall Progress</p>
            <div className="flex items-baseline gap-2 mb-3">
              <span className="font-mono text-3xl font-bold text-deep-charcoal">{campaign.progress}%</span>
              <span className="text-xs text-on-surface-variant">complete</span>
            </div>
            <div className="h-2 bg-surface-variant rounded-full overflow-hidden mb-4">
              <div className="h-full bg-teal-command rounded-full transition-all" style={{ width: `${campaign.progress}%` }} />
            </div>
            {/* Stage counts */}
            <div className="space-y-2">
              {kanbanColumns.map((col) => {
                const count = candidatesByStage(col.key).length;
                return (
                  <div key={col.key} className="flex justify-between items-center">
                    <span className="text-xs text-on-surface-variant">{col.label}</span>
                    <span className="font-mono text-xs font-semibold text-deep-charcoal">{count}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Plan Meta */}
          <div className="bg-clean-surface border border-border-warm rounded-lg p-5 space-y-4">
            <p className="text-xs font-semibold text-on-surface-variant uppercase tracking-wide">Plan Summary</p>
            {[
              { label: 'Campaign ID', value: `#${campaign.id}`, mono: true },
              { label: 'Owner', value: campaign.owner, mono: false },
              { label: 'Department', value: campaign.department, mono: false },
              { label: 'Headcount', value: String(campaign.headcount), mono: true },
              { label: 'Budget', value: campaign.budget, mono: true },
              { label: 'Window', value: campaign.window, mono: false },
            ].map((row) => (
              <div key={row.label}>
                <span className="block text-[11px] text-on-surface-variant mb-0.5">{row.label}</span>
                <span className={`text-sm font-semibold text-deep-charcoal ${row.mono ? 'font-mono' : ''}`}>{row.value}</span>
              </div>
            ))}
          </div>

          {/* Description */}
          <div className="bg-clean-surface border border-border-warm rounded-lg p-5">
            <p className="text-xs font-semibold text-on-surface-variant uppercase tracking-wide mb-2">Position Brief</p>
            <p className="text-sm text-slate-ink leading-relaxed">{campaign.description}</p>
          </div>

          {/* Upcoming Interviews summary */}
          <div className="bg-clean-surface border border-border-warm rounded-lg p-5">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-semibold text-on-surface-variant uppercase tracking-wide">Upcoming Interviews</p>
              <button
                onClick={() => setActiveTab('calendar')}
                className="text-[11px] text-teal-command hover:underline font-semibold"
              >
                View all
              </button>
            </div>
            <div className="space-y-3">
              {campaign.interviews.slice(0, 3).map((interview) => (
                <div key={interview.id} className="flex items-start gap-2.5">
                  <div className={`w-7 h-7 rounded-full ${interview.color} flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0 mt-0.5`}>
                    {interview.initials}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-deep-charcoal leading-tight truncate">{interview.candidateName}</p>
                    <p className="text-[11px] text-on-surface-variant">{interview.type} · {interview.date} {interview.time}</p>
                    <p className="text-[10px] text-on-surface-variant">{interview.location}</p>
                  </div>
                </div>
              ))}
              {campaign.interviews.length === 0 && (
                <p className="text-xs text-on-surface-variant">No interviews scheduled.</p>
              )}
            </div>
          </div>

          {/* Quick actions */}
          <div className="bg-clean-surface border border-border-warm rounded-lg p-5 space-y-2">
            <p className="text-xs font-semibold text-on-surface-variant uppercase tracking-wide mb-3">Quick Actions</p>
            {[
              { icon: 'person_add', label: 'Add Candidate', color: 'text-teal-command' },
              { icon: 'event', label: 'Schedule Interview', color: 'text-pending' },
              { icon: 'description', label: 'Export Report', color: 'text-slate-ink' },
            ].map((action) => (
              <button
                key={action.label}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-lg border border-border-warm hover:border-teal-command hover:bg-teal-command/5 transition-colors text-sm font-medium text-slate-ink hover:text-teal-command"
              >
                <span className={`material-symbols-outlined text-[16px] ${action.color}`}>{action.icon}</span>
                {action.label}
              </button>
            ))}
          </div>
        </aside>
      </div>
    </div>
  );
};
