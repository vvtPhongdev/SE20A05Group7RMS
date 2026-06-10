import React, { useState, useMemo } from 'react';

// ─── Types ────────────────────────────────────────────────────────────────────

type TaskPhase = 'job_posting' | 'cv_collection' | 'cv_screening' | 'interview' | 'offer';
type TaskPriority = 'Critical' | 'High' | 'Normal' | 'Low';
type TaskStatus = 'todo' | 'in_progress' | 'done' | 'blocked';

type Assignee = {
  name: string;
  initials: string;
  color: string;
};

type Task = {
  id: string;
  title: string;
  description: string;
  phase: TaskPhase;
  priority: TaskPriority;
  status: TaskStatus;
  campaignId: string;
  assignee: Assignee;
  dueDate: string;
  tags: string[];
  checklist: { label: string; done: boolean }[];
};

type Campaign = {
  id: string;
  position: string;
  department: string;
  color: string;
  totalTasks: number;
  doneTasks: number;
};

// ─── Mock Data ────────────────────────────────────────────────────────────────

const CAMPAIGNS: Campaign[] = [
  { id: 'all', position: 'All Campaigns', department: '', color: '#6B7280', totalTasks: 0, doneTasks: 0 },
  { id: 'camp-001', position: 'Senior Backend Engineer', department: 'IT Dept', color: '#0D9488', totalTasks: 8, doneTasks: 5 },
  { id: 'camp-002', position: 'Product Designer', department: 'Design & UX', color: '#7C3AED', totalTasks: 6, doneTasks: 2 },
  { id: 'camp-003', position: 'Marketing Specialist', department: 'Marketing', color: '#DC2626', totalTasks: 5, doneTasks: 4 },
  { id: 'camp-004', position: 'Data Analyst', department: 'Data & BI', color: '#D97706', totalTasks: 7, doneTasks: 1 },
];

const INITIAL_TASKS: Task[] = [
  // camp-001 – Senior Backend Engineer
  {
    id: 'T-001', title: 'Draft job description', description: 'Write a detailed JD covering responsibilities, skill requirements, and compensation range.',
    phase: 'job_posting', priority: 'High', status: 'done', campaignId: 'camp-001',
    assignee: { name: 'Linh Tran', initials: 'LT', color: '#0D9488' },
    dueDate: 'Jun 5', tags: ['Writing', 'JD'],
    checklist: [{ label: 'Technical requirements', done: true }, { label: 'Compensation range', done: true }, { label: 'Review with dept head', done: true }],
  },
  {
    id: 'T-002', title: 'Post on LinkedIn & TopCV', description: 'Publish the approved JD across LinkedIn Jobs, TopCV, and internal portal.',
    phase: 'job_posting', priority: 'High', status: 'done', campaignId: 'camp-001',
    assignee: { name: 'Minh Pham', initials: 'MP', color: '#7C3AED' },
    dueDate: 'Jun 7', tags: ['LinkedIn', 'TopCV'],
    checklist: [{ label: 'LinkedIn post', done: true }, { label: 'TopCV listing', done: true }, { label: 'Internal portal', done: false }],
  },
  {
    id: 'T-003', title: 'Collect CVs from all channels', description: 'Aggregate submitted CVs from email, job boards, and referrals into the shared drive.',
    phase: 'cv_collection', priority: 'Normal', status: 'done', campaignId: 'camp-001',
    assignee: { name: 'Linh Tran', initials: 'LT', color: '#0D9488' },
    dueDate: 'Jun 12', tags: ['Collection', 'CV'],
    checklist: [{ label: 'Email inbox sweep', done: true }, { label: 'Job board downloads', done: true }, { label: 'Referral CVs', done: true }],
  },
  {
    id: 'T-004', title: 'Initial CV screening (pass/fail)', description: 'Review each CV against minimum requirements; tag as Pass, Fail, or Potential.',
    phase: 'cv_screening', priority: 'Critical', status: 'in_progress', campaignId: 'camp-001',
    assignee: { name: 'Linh Tran', initials: 'LT', color: '#0D9488' },
    dueDate: 'Jun 16', tags: ['Screening', 'Review'],
    checklist: [{ label: 'Screen 28 CVs', done: false }, { label: 'Tag outcomes', done: false }, { label: 'Share shortlist', done: false }],
  },
  {
    id: 'T-005', title: 'Shortlist & rank candidates', description: 'Score shortlisted candidates on a rubric and rank for interview invitation.',
    phase: 'cv_screening', priority: 'High', status: 'todo', campaignId: 'camp-001',
    assignee: { name: 'Minh Pham', initials: 'MP', color: '#7C3AED' },
    dueDate: 'Jun 18', tags: ['Ranking', 'Shortlist'],
    checklist: [{ label: 'Apply scoring rubric', done: false }, { label: 'Rank top 10', done: false }],
  },
  {
    id: 'T-006', title: 'Schedule technical interviews', description: 'Coordinate calendars for 6 candidates across two technical interviewers.',
    phase: 'interview', priority: 'High', status: 'todo', campaignId: 'camp-001',
    assignee: { name: 'Minh Pham', initials: 'MP', color: '#7C3AED' },
    dueDate: 'Jun 22', tags: ['Calendar', 'Coordination'],
    checklist: [{ label: 'Book slots in calendar', done: false }, { label: 'Send candidate invites', done: false }, { label: 'Confirm interviewers', done: false }],
  },
  {
    id: 'T-007', title: 'Collect interview feedback', description: 'Gather structured feedback sheets from all technical interviewers post-session.',
    phase: 'interview', priority: 'Normal', status: 'todo', campaignId: 'camp-001',
    assignee: { name: 'Linh Tran', initials: 'LT', color: '#0D9488' },
    dueDate: 'Jun 26', tags: ['Feedback', 'Report'],
    checklist: [{ label: 'Distribute feedback form', done: false }, { label: 'Compile results', done: false }],
  },
  {
    id: 'T-008', title: 'Prepare & send offer letter', description: 'Draft offer package for top candidate and send for final approval before dispatch.',
    phase: 'offer', priority: 'Critical', status: 'todo', campaignId: 'camp-001',
    assignee: { name: 'Linh Tran', initials: 'LT', color: '#0D9488' },
    dueDate: 'Jul 2', tags: ['Offer', 'Legal'],
    checklist: [{ label: 'Draft offer letter', done: false }, { label: 'Get manager approval', done: false }, { label: 'Send to candidate', done: false }],
  },

  // camp-002 – Product Designer
  {
    id: 'T-009', title: 'Draft designer JD with portfolio requirements', description: 'Include Figma proficiency, design systems experience, and portfolio submission guidelines.',
    phase: 'job_posting', priority: 'High', status: 'done', campaignId: 'camp-002',
    assignee: { name: 'Hoa Nguyen', initials: 'HN', color: '#DC2626' },
    dueDate: 'Jun 4', tags: ['JD', 'Design'],
    checklist: [{ label: 'List required skills', done: true }, { label: 'Portfolio guidelines', done: true }],
  },
  {
    id: 'T-010', title: 'Post on Behance & Dribbble', description: 'Reach design community through Behance Jobs and Dribbble Hiring.',
    phase: 'job_posting', priority: 'Normal', status: 'in_progress', campaignId: 'camp-002',
    assignee: { name: 'Hoa Nguyen', initials: 'HN', color: '#DC2626' },
    dueDate: 'Jun 9', tags: ['Behance', 'Dribbble'],
    checklist: [{ label: 'Behance listing', done: true }, { label: 'Dribbble listing', done: false }],
  },
  {
    id: 'T-011', title: 'Collect and organize portfolio submissions', description: 'Review portfolio links and store in shared folder, checking for broken links.',
    phase: 'cv_collection', priority: 'Normal', status: 'todo', campaignId: 'camp-002',
    assignee: { name: 'Minh Pham', initials: 'MP', color: '#7C3AED' },
    dueDate: 'Jun 15', tags: ['Portfolio', 'Collection'],
    checklist: [{ label: 'Check all portfolio links', done: false }, { label: 'Organize by quality tier', done: false }],
  },
  {
    id: 'T-012', title: 'Evaluate portfolios with design lead', description: 'Joint review session with the Head of Design to score portfolio submissions.',
    phase: 'cv_screening', priority: 'High', status: 'todo', campaignId: 'camp-002',
    assignee: { name: 'Hoa Nguyen', initials: 'HN', color: '#DC2626' },
    dueDate: 'Jun 20', tags: ['Review', 'Design Lead'],
    checklist: [{ label: 'Schedule joint review', done: false }, { label: 'Score portfolios', done: false }, { label: 'Select top 5', done: false }],
  },
  {
    id: 'T-013', title: 'Send design take-home test', description: 'Dispatch a 3-hour design challenge to shortlisted candidates.',
    phase: 'interview', priority: 'High', status: 'blocked', campaignId: 'camp-002',
    assignee: { name: 'Hoa Nguyen', initials: 'HN', color: '#DC2626' },
    dueDate: 'Jun 25', tags: ['Test', 'Challenge'],
    checklist: [{ label: 'Finalize test brief', done: false }, { label: 'Send to candidates', done: false }],
  },
  {
    id: 'T-014', title: 'Negotiate compensation & benefits', description: 'Discuss package details and sign-on bonus with top candidate.',
    phase: 'offer', priority: 'Critical', status: 'todo', campaignId: 'camp-002',
    assignee: { name: 'Linh Tran', initials: 'LT', color: '#0D9488' },
    dueDate: 'Jul 5', tags: ['Negotiation', 'Offer'],
    checklist: [{ label: 'Prepare comp matrix', done: false }, { label: 'Conduct negotiation call', done: false }],
  },

  // camp-003 – Marketing Specialist
  {
    id: 'T-015', title: 'Draft marketing JD', description: 'Focus on digital marketing, SEO/SEM, and content strategy skills.',
    phase: 'job_posting', priority: 'Normal', status: 'done', campaignId: 'camp-003',
    assignee: { name: 'Minh Pham', initials: 'MP', color: '#7C3AED' },
    dueDate: 'May 30', tags: ['JD', 'Marketing'],
    checklist: [{ label: 'Skill list', done: true }, { label: 'Dept head review', done: true }],
  },
  {
    id: 'T-016', title: 'Post on job boards', description: 'Publish across VietnamWorks, Jobstreet, and LinkedIn.',
    phase: 'job_posting', priority: 'Normal', status: 'done', campaignId: 'camp-003',
    assignee: { name: 'Minh Pham', initials: 'MP', color: '#7C3AED' },
    dueDate: 'Jun 2', tags: ['VietnamWorks', 'Jobstreet'],
    checklist: [{ label: 'VietnamWorks', done: true }, { label: 'Jobstreet', done: true }, { label: 'LinkedIn', done: true }],
  },
  {
    id: 'T-017', title: 'CV collection & dedup', description: 'Gather all applications and remove duplicate submissions.',
    phase: 'cv_collection', priority: 'Low', status: 'done', campaignId: 'camp-003',
    assignee: { name: 'Hoa Nguyen', initials: 'HN', color: '#DC2626' },
    dueDate: 'Jun 8', tags: ['CV', 'Dedup'],
    checklist: [{ label: 'Collect from all channels', done: true }, { label: 'Remove duplicates', done: true }],
  },
  {
    id: 'T-018', title: 'Screen and shortlist', description: 'Review 14 applications, shortlist top 4.',
    phase: 'cv_screening', priority: 'Normal', status: 'done', campaignId: 'camp-003',
    assignee: { name: 'Linh Tran', initials: 'LT', color: '#0D9488' },
    dueDate: 'Jun 12', tags: ['Screening'],
    checklist: [{ label: 'Screen 14 CVs', done: true }, { label: 'Shortlist 4', done: true }],
  },
  {
    id: 'T-019', title: 'Conduct HR fit interviews', description: 'Run 30-minute HR cultural fit interviews for 4 shortlisted candidates.',
    phase: 'interview', priority: 'High', status: 'in_progress', campaignId: 'camp-003',
    assignee: { name: 'Linh Tran', initials: 'LT', color: '#0D9488' },
    dueDate: 'Jun 17', tags: ['HR Fit', 'Interview'],
    checklist: [{ label: '4 interviews scheduled', done: true }, { label: '2/4 completed', done: false }],
  },

  // camp-004 – Data Analyst
  {
    id: 'T-020', title: 'Draft Data Analyst JD', description: 'Cover SQL, Python, Power BI requirements and data governance context.',
    phase: 'job_posting', priority: 'High', status: 'in_progress', campaignId: 'camp-004',
    assignee: { name: 'Hoa Nguyen', initials: 'HN', color: '#DC2626' },
    dueDate: 'Jun 14', tags: ['JD', 'Data'],
    checklist: [{ label: 'Technical skills', done: true }, { label: 'Tool requirements', done: false }],
  },
  {
    id: 'T-021', title: 'Post on data-focused boards', description: 'Publish on Kaggle Jobs, Analytics Vidhya, and LinkedIn.',
    phase: 'job_posting', priority: 'Normal', status: 'todo', campaignId: 'camp-004',
    assignee: { name: 'Minh Pham', initials: 'MP', color: '#7C3AED' },
    dueDate: 'Jun 18', tags: ['Kaggle', 'LinkedIn'],
    checklist: [{ label: 'Kaggle Jobs', done: false }, { label: 'LinkedIn', done: false }],
  },
];

// ─── Constants ────────────────────────────────────────────────────────────────

const PHASES: { key: TaskPhase; label: string; shortLabel: string; icon: string }[] = [
  { key: 'job_posting', label: 'Job Posting', shortLabel: 'Posting', icon: '📋' },
  { key: 'cv_collection', label: 'CV Collection', shortLabel: 'Collection', icon: '📥' },
  { key: 'cv_screening', label: 'CV Screening', shortLabel: 'Screening', icon: '🔍' },
  { key: 'interview', label: 'Interview', shortLabel: 'Interview', icon: '🎙️' },
  { key: 'offer', label: 'Offer', shortLabel: 'Offer', icon: '✉️' },
];

const STATUS_CONFIG: Record<TaskStatus, { label: string; color: string; bg: string; dot: string }> = {
  todo: { label: 'To Do', color: '#6B7280', bg: '#F3F4F6', dot: '#6B7280' },
  in_progress: { label: 'In Progress', color: '#D97706', bg: '#FEF3C7', dot: '#D97706' },
  done: { label: 'Done', color: '#059669', bg: '#D1FAE5', dot: '#059669' },
  blocked: { label: 'Blocked', color: '#DC2626', bg: '#FEE2E2', dot: '#DC2626' },
};

const PRIORITY_CONFIG: Record<TaskPriority, { color: string; bg: string }> = {
  Critical: { color: '#DC2626', bg: '#FEF2F2' },
  High: { color: '#D97706', bg: '#FFFBEB' },
  Normal: { color: '#2563EB', bg: '#EFF6FF' },
  Low: { color: '#6B7280', bg: '#F9FAFB' },
};

// ─── Helper Components ────────────────────────────────────────────────────────

const AssigneeAvatar: React.FC<{ assignee: Assignee; size?: 'sm' | 'md' }> = ({ assignee, size = 'md' }) => {
  const dim = size === 'sm' ? 24 : 30;
  const font = size === 'sm' ? 10 : 11;
  return (
    <div
      title={assignee.name}
      style={{
        width: dim, height: dim, borderRadius: '50%',
        background: assignee.color + '22', color: assignee.color,
        fontSize: font, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center',
        border: `1.5px solid ${assignee.color}44`, flexShrink: 0,
      }}
    >
      {assignee.initials}
    </div>
  );
};

// ─── Task Card ────────────────────────────────────────────────────────────────

const TaskCard: React.FC<{
  task: Task;
  onStatusChange: (id: string, status: TaskStatus) => void;
  onToggleChecklist: (taskId: string, idx: number) => void;
  expanded: boolean;
  onToggleExpand: () => void;
}> = ({ task, onStatusChange, onToggleChecklist, expanded, onToggleExpand }) => {
  const statusCfg = STATUS_CONFIG[task.status];
  const priorityCfg = PRIORITY_CONFIG[task.priority];
  const done = task.checklist.filter(c => c.done).length;
  const total = task.checklist.length;
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;

  return (
    <div style={{
      background: 'var(--wr-bg-surface)',
      border: '1px solid var(--wr-border-default)',
      borderRadius: 10,
      padding: '14px 16px',
      display: 'flex',
      flexDirection: 'column',
      gap: 10,
      transition: 'box-shadow 0.15s',
      cursor: 'default',
    }}
      onMouseEnter={e => (e.currentTarget.style.boxShadow = '0 2px 10px rgba(0,0,0,0.08)')}
      onMouseLeave={e => (e.currentTarget.style.boxShadow = 'none')}
    >
      {/* Header row */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
        {/* Checkbox */}
        <button
          onClick={() => onStatusChange(task.id, task.status === 'done' ? 'todo' : 'done')}
          style={{
            width: 20, height: 20, borderRadius: 5, border: task.status === 'done' ? 'none' : '2px solid #CBD5E1',
            background: task.status === 'done' ? '#059669' : 'transparent',
            cursor: 'pointer', flexShrink: 0, marginTop: 1,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
          aria-label={task.status === 'done' ? 'Mark incomplete' : 'Mark complete'}
        >
          {task.status === 'done' && (
            <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
              <path d="M2 6l3 3 5-5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}
        </button>

        {/* Title + tags */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontSize: 13.5, fontWeight: 600, color: 'var(--wr-text-primary)',
            textDecoration: task.status === 'done' ? 'line-through' : 'none',
            opacity: task.status === 'done' ? 0.6 : 1,
            lineHeight: 1.4,
          }}>
            {task.title}
          </div>
          {task.description && (
            <div style={{ fontSize: 12, color: 'var(--wr-text-secondary)', marginTop: 3, lineHeight: 1.5 }}>
              {task.description}
            </div>
          )}
        </div>

        {/* Expand button */}
        <button
          onClick={onToggleExpand}
          style={{
            background: 'none', border: 'none', cursor: 'pointer', padding: 2,
            color: 'var(--wr-text-secondary)', flexShrink: 0,
            borderRadius: 4,
          }}
          aria-label="Toggle checklist"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
            style={{ transform: expanded ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </button>
      </div>

      {/* Meta row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        {/* Status badge */}
        <span style={{
          fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 99,
          color: statusCfg.color, background: statusCfg.bg,
          display: 'flex', alignItems: 'center', gap: 4,
        }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: statusCfg.dot, display: 'inline-block' }} />
          {statusCfg.label}
        </span>

        {/* Priority badge */}
        <span style={{
          fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 99,
          color: priorityCfg.color, background: priorityCfg.bg,
        }}>
          {task.priority}
        </span>

        {/* Tags */}
        {task.tags.slice(0, 2).map(tag => (
          <span key={tag} style={{
            fontSize: 11, padding: '2px 7px', borderRadius: 99,
            background: 'var(--wr-bg-elevated)', color: 'var(--wr-text-secondary)',
            fontWeight: 500,
          }}>{tag}</span>
        ))}

        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
          {/* Due date */}
          <span style={{ fontSize: 11.5, color: 'var(--wr-text-secondary)', display: 'flex', alignItems: 'center', gap: 3 }}>
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
            </svg>
            {task.dueDate}
          </span>

          {/* Assignee */}
          <AssigneeAvatar assignee={task.assignee} size="sm" />
        </div>
      </div>

      {/* Progress bar */}
      {total > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ flex: 1, height: 4, background: 'var(--wr-border-subtle)', borderRadius: 99, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${pct}%`, background: pct === 100 ? '#059669' : '#0D9488', borderRadius: 99, transition: 'width 0.3s' }} />
          </div>
          <span style={{ fontSize: 11, color: 'var(--wr-text-secondary)', fontWeight: 500, whiteSpace: 'nowrap' }}>
            {done}/{total}
          </span>
        </div>
      )}

      {/* Checklist (expanded) */}
      {expanded && total > 0 && (
        <div style={{ borderTop: '1px solid var(--wr-border-subtle)', paddingTop: 10, display: 'flex', flexDirection: 'column', gap: 6 }}>
          {task.checklist.map((item, idx) => (
            <label key={idx} style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={item.done}
                onChange={() => onToggleChecklist(task.id, idx)}
                style={{ accentColor: '#0D9488', width: 14, height: 14, cursor: 'pointer' }}
              />
              <span style={{
                fontSize: 12.5, color: item.done ? 'var(--wr-text-secondary)' : 'var(--wr-text-primary)',
                textDecoration: item.done ? 'line-through' : 'none',
                transition: 'color 0.15s',
              }}>
                {item.label}
              </span>
            </label>
          ))}
        </div>
      )}

      {/* Status quick-change */}
      {expanded && (
        <div style={{ display: 'flex', gap: 6, borderTop: '1px solid var(--wr-border-subtle)', paddingTop: 10 }}>
          {(['todo', 'in_progress', 'done', 'blocked'] as TaskStatus[]).map(s => (
            <button
              key={s}
              onClick={() => onStatusChange(task.id, s)}
              style={{
                fontSize: 11, padding: '3px 10px', borderRadius: 99, cursor: 'pointer',
                border: task.status === s ? `1.5px solid ${STATUS_CONFIG[s].color}` : '1.5px solid transparent',
                background: task.status === s ? STATUS_CONFIG[s].bg : 'var(--wr-bg-elevated)',
                color: task.status === s ? STATUS_CONFIG[s].color : 'var(--wr-text-secondary)',
                fontWeight: task.status === s ? 700 : 500,
                transition: 'all 0.15s',
              }}
            >
              {STATUS_CONFIG[s].label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

// ─── Phase Column ─────────────────────────────────────────────────────────────

const PhaseColumn: React.FC<{
  phase: typeof PHASES[number];
  tasks: Task[];
  onStatusChange: (id: string, status: TaskStatus) => void;
  onToggleChecklist: (taskId: string, idx: number) => void;
  expandedTasks: Set<string>;
  onToggleExpand: (id: string) => void;
}> = ({ phase, tasks, onStatusChange, onToggleChecklist, expandedTasks, onToggleExpand }) => {
  const done = tasks.filter(t => t.status === 'done').length;
  const total = tasks.length;

  return (
    <div style={{ minWidth: 300, flex: '1 1 300px', display: 'flex', flexDirection: 'column', gap: 10 }}>
      {/* Column header */}
      <div style={{
        background: 'var(--wr-bg-elevated)',
        border: '1px solid var(--wr-border-default)',
        borderRadius: 10,
        padding: '10px 14px',
        display: 'flex',
        alignItems: 'center',
        gap: 8,
      }}>
        <span style={{ fontSize: 16 }}>{phase.icon}</span>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--wr-text-primary)' }}>{phase.label}</div>
          <div style={{ fontSize: 11, color: 'var(--wr-text-secondary)', marginTop: 1 }}>{done}/{total} complete</div>
        </div>
        <div style={{
          width: 26, height: 26, borderRadius: 99, background: total === 0 ? 'var(--wr-border-subtle)' : '#0D944820',
          color: total === 0 ? 'var(--wr-text-secondary)' : '#0D9488',
          fontSize: 12, fontWeight: 700,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          {total}
        </div>
      </div>

      {/* Tasks */}
      {tasks.length === 0 ? (
        <div style={{
          border: '2px dashed var(--wr-border-subtle)', borderRadius: 10,
          padding: '24px 16px', textAlign: 'center',
          color: 'var(--wr-text-secondary)', fontSize: 12,
        }}>
          No tasks in this phase
        </div>
      ) : (
        tasks.map(task => (
          <TaskCard
            key={task.id}
            task={task}
            onStatusChange={onStatusChange}
            onToggleChecklist={onToggleChecklist}
            expanded={expandedTasks.has(task.id)}
            onToggleExpand={() => onToggleExpand(task.id)}
          />
        ))
      )}
    </div>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────

export const TaskPlanner: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>(INITIAL_TASKS);
  const [selectedCampaignId, setSelectedCampaignId] = useState<string>('all');
  const [activePhase, setActivePhase] = useState<TaskPhase | 'all'>('all');
  const [expandedTasks, setExpandedTasks] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<TaskStatus | 'all'>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskPhase, setNewTaskPhase] = useState<TaskPhase>('job_posting');
  const [newTaskCampaign, setNewTaskCampaign] = useState('camp-001');
  const [newTaskPriority, setNewTaskPriority] = useState<TaskPriority>('Normal');

  // Compute campaign stats dynamically
  const campaignsWithStats = useMemo(() => {
    return CAMPAIGNS.map(c => {
      if (c.id === 'all') {
        return { ...c, totalTasks: tasks.length, doneTasks: tasks.filter(t => t.status === 'done').length };
      }
      const ct = tasks.filter(t => t.campaignId === c.id);
      return { ...c, totalTasks: ct.length, doneTasks: ct.filter(t => t.status === 'done').length };
    });
  }, [tasks]);

  // Filter tasks
  const filteredTasks = useMemo(() => {
    return tasks.filter(t => {
      const matchCampaign = selectedCampaignId === 'all' || t.campaignId === selectedCampaignId;
      const matchPhase = activePhase === 'all' || t.phase === activePhase;
      const matchSearch = !searchQuery || t.title.toLowerCase().includes(searchQuery.toLowerCase()) || t.assignee.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchStatus = statusFilter === 'all' || t.status === statusFilter;
      return matchCampaign && matchPhase && matchSearch && matchStatus;
    });
  }, [tasks, selectedCampaignId, activePhase, searchQuery, statusFilter]);

  // Stats for header
  const totalDone = filteredTasks.filter(t => t.status === 'done').length;
  const totalInProgress = filteredTasks.filter(t => t.status === 'in_progress').length;
  const totalBlocked = filteredTasks.filter(t => t.status === 'blocked').length;

  const handleStatusChange = (id: string, status: TaskStatus) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, status } : t));
  };

  const handleToggleChecklist = (taskId: string, idx: number) => {
    setTasks(prev => prev.map(t => {
      if (t.id !== taskId) return t;
      const checklist = t.checklist.map((c, i) => i === idx ? { ...c, done: !c.done } : c);
      return { ...t, checklist };
    }));
  };

  const handleToggleExpand = (id: string) => {
    setExpandedTasks(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const handleAddTask = () => {
    if (!newTaskTitle.trim()) return;
    const newTask: Task = {
      id: `T-${Date.now()}`,
      title: newTaskTitle.trim(),
      description: '',
      phase: newTaskPhase,
      priority: newTaskPriority,
      status: 'todo',
      campaignId: newTaskCampaign,
      assignee: { name: 'Linh Tran', initials: 'LT', color: '#0D9488' },
      dueDate: 'TBD',
      tags: [],
      checklist: [],
    };
    setTasks(prev => [...prev, newTask]);
    setNewTaskTitle('');
    setShowAddModal(false);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0, height: '100%' }}>
      {/* Page Header */}
      <div style={{
        display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
        marginBottom: 24, flexWrap: 'wrap', gap: 12,
      }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--wr-text-primary)', margin: 0 }}>
            Task Planner
          </h1>
          <p style={{ fontSize: 13, color: 'var(--wr-text-secondary)', margin: '4px 0 0' }}>
            Assign and track recruitment tasks across campaigns and hiring phases.
          </p>
        </div>
        <button
          id="btn-add-task"
          onClick={() => setShowAddModal(true)}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            background: '#0D9488', color: 'white',
            border: 'none', borderRadius: 8, padding: '9px 16px',
            fontSize: 13, fontWeight: 600, cursor: 'pointer',
            transition: 'background 0.15s',
          }}
          onMouseEnter={e => (e.currentTarget.style.background = '#0F766E')}
          onMouseLeave={e => (e.currentTarget.style.background = '#0D9488')}
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Add Task
        </button>
      </div>

      {/* Stats Banner */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 20,
      }}>
        {[
          { label: 'Total Tasks', value: filteredTasks.length, color: '#0D9488', bg: '#F0FDFA' },
          { label: 'Completed', value: totalDone, color: '#059669', bg: '#F0FDF4' },
          { label: 'In Progress', value: totalInProgress, color: '#D97706', bg: '#FFFBEB' },
          { label: 'Blocked', value: totalBlocked, color: '#DC2626', bg: '#FEF2F2' },
        ].map(stat => (
          <div key={stat.label} style={{
            background: stat.bg,
            border: `1px solid ${stat.color}22`,
            borderRadius: 10, padding: '12px 16px',
            display: 'flex', flexDirection: 'column', gap: 2,
          }}>
            <div style={{ fontSize: 22, fontWeight: 800, color: stat.color }}>{stat.value}</div>
            <div style={{ fontSize: 12, color: stat.color, fontWeight: 500, opacity: 0.8 }}>{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Main layout: sidebar + content */}
      <div style={{ display: 'flex', gap: 20, flex: 1, minHeight: 0 }}>

        {/* Campaign Sidebar */}
        <div style={{
          width: 220, flexShrink: 0,
          display: 'flex', flexDirection: 'column', gap: 6,
        }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--wr-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>
            Campaigns
          </div>
          {campaignsWithStats.map(c => {
            const isActive = selectedCampaignId === c.id;
            const pct = c.totalTasks > 0 ? Math.round((c.doneTasks / c.totalTasks) * 100) : 0;
            return (
              <button
                key={c.id}
                id={`campaign-filter-${c.id}`}
                onClick={() => setSelectedCampaignId(c.id)}
                style={{
                  width: '100%', textAlign: 'left',
                  padding: '10px 12px', borderRadius: 8, cursor: 'pointer',
                  border: isActive ? `1.5px solid ${c.id === 'all' ? '#0D9488' : c.color}` : '1.5px solid transparent',
                  background: isActive ? (c.id === 'all' ? '#F0FDFA' : c.color + '12') : 'var(--wr-bg-surface)',
                  transition: 'all 0.15s',
                  display: 'flex', flexDirection: 'column', gap: 4,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  {c.id !== 'all' && (
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: c.color, flexShrink: 0 }} />
                  )}
                  <span style={{
                    fontSize: 12.5, fontWeight: isActive ? 700 : 500,
                    color: isActive ? (c.id === 'all' ? '#0D9488' : c.color) : 'var(--wr-text-primary)',
                    flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  }}>
                    {c.position}
                  </span>
                </div>
                {c.id !== 'all' && c.department && (
                  <div style={{ fontSize: 11, color: 'var(--wr-text-secondary)', paddingLeft: 14 }}>{c.department}</div>
                )}
                {c.id !== 'all' && c.totalTasks > 0 && (
                  <div style={{ paddingLeft: 14, display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <div style={{ height: 3, background: 'var(--wr-border-subtle)', borderRadius: 99, overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${pct}%`, background: c.color, borderRadius: 99 }} />
                    </div>
                    <span style={{ fontSize: 10.5, color: 'var(--wr-text-secondary)' }}>{c.doneTasks}/{c.totalTasks} done</span>
                  </div>
                )}
                {c.id === 'all' && (
                  <div style={{ fontSize: 11, color: 'var(--wr-text-secondary)' }}>{c.totalTasks} tasks total</div>
                )}
              </button>
            );
          })}
        </div>

        {/* Right panel */}
        <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* Filters row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            {/* Search */}
            <div style={{ position: 'relative', flex: '1 1 180px', minWidth: 160 }}>
              <svg style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--wr-text-secondary)' }}
                width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <input
                id="task-search"
                type="text"
                placeholder="Search tasks or assignees…"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                style={{
                  width: '100%', paddingLeft: 32, paddingRight: 12, paddingTop: 8, paddingBottom: 8,
                  fontSize: 13, borderRadius: 8, border: '1.5px solid var(--wr-border-default)',
                  background: 'var(--wr-bg-surface)', color: 'var(--wr-text-primary)',
                  outline: 'none', boxSizing: 'border-box',
                }}
              />
            </div>

            {/* Status filter */}
            <select
              id="status-filter"
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value as TaskStatus | 'all')}
              style={{
                fontSize: 13, padding: '8px 12px', borderRadius: 8,
                border: '1.5px solid var(--wr-border-default)',
                background: 'var(--wr-bg-surface)', color: 'var(--wr-text-primary)',
                cursor: 'pointer', outline: 'none',
              }}
            >
              <option value="all">All Statuses</option>
              <option value="todo">To Do</option>
              <option value="in_progress">In Progress</option>
              <option value="done">Done</option>
              <option value="blocked">Blocked</option>
            </select>

            {/* Phase tabs */}
            <div style={{ display: 'flex', gap: 4, background: 'var(--wr-bg-elevated)', padding: 4, borderRadius: 8 }}>
              {[{ key: 'all', label: 'All', icon: '⚡' }, ...PHASES].map(p => (
                <button
                  key={p.key}
                  id={`phase-tab-${p.key}`}
                  onClick={() => setActivePhase(p.key as TaskPhase | 'all')}
                  style={{
                    fontSize: 12, fontWeight: activePhase === p.key ? 700 : 500,
                    padding: '5px 10px', borderRadius: 6, cursor: 'pointer',
                    border: 'none',
                    background: activePhase === p.key ? 'var(--wr-bg-surface)' : 'transparent',
                    color: activePhase === p.key ? '#0D9488' : 'var(--wr-text-secondary)',
                    boxShadow: activePhase === p.key ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
                    transition: 'all 0.15s',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {p.icon} {'shortLabel' in p ? p.shortLabel : p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Task phase columns */}
          {activePhase === 'all' ? (
            <div style={{ display: 'flex', gap: 14, overflowX: 'auto', paddingBottom: 8, alignItems: 'flex-start' }}>
              {PHASES.map(phase => (
                <PhaseColumn
                  key={phase.key}
                  phase={phase}
                  tasks={filteredTasks.filter(t => t.phase === phase.key)}
                  onStatusChange={handleStatusChange}
                  onToggleChecklist={handleToggleChecklist}
                  expandedTasks={expandedTasks}
                  onToggleExpand={handleToggleExpand}
                />
              ))}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--wr-text-secondary)' }}>
                {PHASES.find(p => p.key === activePhase)?.icon}{' '}
                {PHASES.find(p => p.key === activePhase)?.label} — {filteredTasks.length} task{filteredTasks.length !== 1 ? 's' : ''}
              </div>
              {filteredTasks.length === 0 ? (
                <div style={{
                  border: '2px dashed var(--wr-border-subtle)', borderRadius: 10,
                  padding: '48px 16px', textAlign: 'center', color: 'var(--wr-text-secondary)', fontSize: 13,
                }}>
                  No tasks match your current filters.
                </div>
              ) : (
                filteredTasks.map(task => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    onStatusChange={handleStatusChange}
                    onToggleChecklist={handleToggleChecklist}
                    expanded={expandedTasks.has(task.id)}
                    onToggleExpand={() => handleToggleExpand(task.id)}
                  />
                ))
              )}
            </div>
          )}
        </div>
      </div>

      {/* Add Task Modal */}
      {showAddModal && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50,
        }} onClick={e => { if (e.target === e.currentTarget) setShowAddModal(false); }}>
          <div style={{
            background: 'var(--wr-bg-surface)', borderRadius: 14,
            padding: '28px 28px 24px', width: 460, maxWidth: '90vw',
            boxShadow: '0 8px 40px rgba(0,0,0,0.2)',
            display: 'flex', flexDirection: 'column', gap: 16,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h2 style={{ margin: 0, fontSize: 17, fontWeight: 800, color: 'var(--wr-text-primary)' }}>Add New Task</h2>
              <button onClick={() => setShowAddModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--wr-text-secondary)', fontSize: 18 }}>✕</button>
            </div>

            {/* Task title */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--wr-text-secondary)' }}>Task Title *</label>
              <input
                id="new-task-title"
                type="text"
                autoFocus
                placeholder="e.g. Screen CVs for Data Analyst role"
                value={newTaskTitle}
                onChange={e => setNewTaskTitle(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleAddTask()}
                style={{
                  padding: '10px 12px', fontSize: 13.5, borderRadius: 8,
                  border: '1.5px solid var(--wr-border-default)',
                  background: 'var(--wr-bg-elevated)', color: 'var(--wr-text-primary)', outline: 'none',
                }}
              />
            </div>

            {/* Campaign */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--wr-text-secondary)' }}>Campaign</label>
              <select
                id="new-task-campaign"
                value={newTaskCampaign}
                onChange={e => setNewTaskCampaign(e.target.value)}
                style={{
                  padding: '10px 12px', fontSize: 13, borderRadius: 8,
                  border: '1.5px solid var(--wr-border-default)',
                  background: 'var(--wr-bg-elevated)', color: 'var(--wr-text-primary)', outline: 'none', cursor: 'pointer',
                }}
              >
                {CAMPAIGNS.filter(c => c.id !== 'all').map(c => (
                  <option key={c.id} value={c.id}>{c.position} — {c.department}</option>
                ))}
              </select>
            </div>

            {/* Phase + Priority row */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--wr-text-secondary)' }}>Phase</label>
                <select
                  id="new-task-phase"
                  value={newTaskPhase}
                  onChange={e => setNewTaskPhase(e.target.value as TaskPhase)}
                  style={{
                    padding: '10px 12px', fontSize: 13, borderRadius: 8,
                    border: '1.5px solid var(--wr-border-default)',
                    background: 'var(--wr-bg-elevated)', color: 'var(--wr-text-primary)', outline: 'none', cursor: 'pointer',
                  }}
                >
                  {PHASES.map(p => <option key={p.key} value={p.key}>{p.icon} {p.label}</option>)}
                </select>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--wr-text-secondary)' }}>Priority</label>
                <select
                  id="new-task-priority"
                  value={newTaskPriority}
                  onChange={e => setNewTaskPriority(e.target.value as TaskPriority)}
                  style={{
                    padding: '10px 12px', fontSize: 13, borderRadius: 8,
                    border: '1.5px solid var(--wr-border-default)',
                    background: 'var(--wr-bg-elevated)', color: 'var(--wr-text-primary)', outline: 'none', cursor: 'pointer',
                  }}
                >
                  {(['Critical', 'High', 'Normal', 'Low'] as TaskPriority[]).map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 4 }}>
              <button
                onClick={() => setShowAddModal(false)}
                style={{
                  padding: '9px 18px', fontSize: 13, fontWeight: 600, borderRadius: 8,
                  border: '1.5px solid var(--wr-border-default)',
                  background: 'var(--wr-bg-elevated)', color: 'var(--wr-text-secondary)', cursor: 'pointer',
                }}
              >
                Cancel
              </button>
              <button
                id="btn-confirm-add-task"
                onClick={handleAddTask}
                disabled={!newTaskTitle.trim()}
                style={{
                  padding: '9px 22px', fontSize: 13, fontWeight: 600, borderRadius: 8,
                  border: 'none', background: newTaskTitle.trim() ? '#0D9488' : '#CBD5E1',
                  color: 'white', cursor: newTaskTitle.trim() ? 'pointer' : 'not-allowed',
                  transition: 'background 0.15s',
                }}
              >
                Add Task
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
