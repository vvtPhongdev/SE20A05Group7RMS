import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

type RequestUrgency = 'Critical' | 'High' | 'Normal' | 'Low';
type QueueStatus = 'PENDING' | 'UNDER_REVIEW' | 'FORWARDED' | 'RETURNED';

type RecruitmentRequest = {
  id: string;
  position: string;
  department: string;
  requestedBy: string;
  submittedDate: string;
  headcount: number;
  type: 'Full-time' | 'Internship';
  budget: string;
  budgetLabel: string;
  urgency: RequestUrgency;
  status: QueueStatus;
  justification: string;
  skillsRequired: string[];
};

const initialRequests: RecruitmentRequest[] = [
  {
    id: 'REQ-2024-041',
    position: 'Senior Backend Engineer',
    department: 'IT Dept',
    requestedBy: 'Dr. Nguyen Van B.',
    submittedDate: 'May 27',
    headcount: 2,
    type: 'Full-time',
    budget: 'VND 25M/person',
    budgetLabel: 'Monthly Budget',
    urgency: 'Critical',
    status: 'PENDING',
    justification:
      'Critical backfill needed to support the upcoming microservice migration phase. The candidate will own database optimization and API gateway security compliance.',
    skillsRequired: ['Go', 'Rust', 'Kubernetes', 'gRPC'],
  },
  {
    id: 'REQ-2024-045',
    position: 'Product Designer',
    department: 'Design & UX Dept',
    requestedBy: 'Ms. Tran Thi C.',
    submittedDate: 'May 27',
    headcount: 1,
    type: 'Full-time',
    budget: 'VND 22M/person',
    budgetLabel: 'Monthly Budget',
    urgency: 'High',
    status: 'PENDING',
    justification:
      'Required for applicant portal redesign. The designer will collaborate with engineering teams to conduct usability testing and build reusable design components.',
    skillsRequired: ['Figma', 'Design Systems', 'Usability Testing', 'Prototyping'],
  },
  {
    id: 'REQ-2024-049',
    position: 'Marketing Specialist',
    department: 'Marketing Dept',
    requestedBy: 'Mr. Vu Huy D.',
    submittedDate: 'May 26',
    headcount: 1,
    type: 'Full-time',
    budget: 'VND 18M/person',
    budgetLabel: 'Monthly Budget',
    urgency: 'Normal',
    status: 'PENDING',
    justification:
      'Drive growth campaigns and manage social branding across local and regional channels.',
    skillsRequired: ['SEO', 'Content Writing', 'Google Ads', 'Analytics'],
  },
  {
    id: 'REQ-2024-052',
    position: 'HR Coordinator',
    department: 'Human Resources',
    requestedBy: 'Ms. Ly Minh E.',
    submittedDate: 'May 25',
    headcount: 1,
    type: 'Full-time',
    budget: 'VND 15M/person',
    budgetLabel: 'Monthly Budget',
    urgency: 'Normal',
    status: 'PENDING',
    justification:
      'Manage onboarding documentation, interview scheduling coordination, and employee records maintenance.',
    skillsRequired: ['HR Administration', 'Onboarding', 'Communication', 'Scheduling'],
  },
  {
    id: 'REQ-2024-055',
    position: 'Data Analyst Intern',
    department: 'Data Intelligence',
    requestedBy: 'Mr. Pham Minh F.',
    submittedDate: 'May 24',
    headcount: 3,
    type: 'Internship',
    budget: 'VND 6M/person',
    budgetLabel: 'Monthly Stipend',
    urgency: 'Low',
    status: 'PENDING',
    justification:
      'Support data cleaning and dashboard building for department performance reporting.',
    skillsRequired: ['SQL', 'Excel', 'Tableau', 'Data Cleaning'],
  },
  {
    id: 'REQ-2024-039',
    position: 'Fullstack Developer',
    department: 'IT Dept',
    requestedBy: 'Dr. Nguyen Van B.',
    submittedDate: 'May 20',
    headcount: 1,
    type: 'Full-time',
    budget: 'VND 24M/person',
    budgetLabel: 'Monthly Budget',
    urgency: 'High',
    status: 'UNDER_REVIEW',
    justification: 'Build frontend dashboards and connect backend services for the RMS project.',
    skillsRequired: ['React', 'TypeScript', 'Node.js', 'PostgreSQL'],
  },
  {
    id: 'REQ-2024-042',
    position: 'Solutions Architect',
    department: 'Infrastructure',
    requestedBy: 'Mr. Hoang Van G.',
    submittedDate: 'May 21',
    headcount: 1,
    type: 'Full-time',
    budget: 'VND 35M/person',
    budgetLabel: 'Monthly Budget',
    urgency: 'Critical',
    status: 'UNDER_REVIEW',
    justification: 'Design highly available cloud architecture matching security frameworks.',
    skillsRequired: ['AWS Certified', 'Enterprise Architecture', 'Terraform', 'Kubernetes'],
  },
  {
    id: 'REQ-2024-030',
    position: 'Security Auditor',
    department: 'Compliance',
    requestedBy: 'Mr. Tran Van X.',
    submittedDate: 'May 15',
    headcount: 1,
    type: 'Full-time',
    budget: 'VND 30M/person',
    budgetLabel: 'Monthly Budget',
    urgency: 'High',
    status: 'FORWARDED',
    justification:
      'Verify regulatory compliance frameworks and run internal vulnerability auditing.',
    skillsRequired: ['CISSP', 'Network Security', 'ISO 27001', 'Penetration Testing'],
  },
  {
    id: 'REQ-2024-031',
    position: 'Product Owner',
    department: 'Product Strategy',
    requestedBy: 'Ms. Le Thi Y.',
    submittedDate: 'May 16',
    headcount: 1,
    type: 'Full-time',
    budget: 'VND 26M/person',
    budgetLabel: 'Monthly Budget',
    urgency: 'Normal',
    status: 'FORWARDED',
    justification: 'Define feature backlog and coordinate sprint planning across engineering pods.',
    skillsRequired: ['Agile', 'Scrum', 'Jira', 'Product Roadmap'],
  },
  {
    id: 'REQ-2024-025',
    position: 'Graphic Designer',
    department: 'Design & UX Dept',
    requestedBy: 'Ms. Tran Thi C.',
    submittedDate: 'May 10',
    headcount: 2,
    type: 'Full-time',
    budget: 'VND 15M/person',
    budgetLabel: 'Monthly Budget',
    urgency: 'Normal',
    status: 'RETURNED',
    justification: 'Returned because the salary budget range was outside design benchmarks.',
    skillsRequired: ['Illustrator', 'Photoshop', 'Typography'],
  },
  {
    id: 'REQ-2024-026',
    position: 'Technical Writer',
    department: 'IT Dept',
    requestedBy: 'Dr. Nguyen Van B.',
    submittedDate: 'May 11',
    headcount: 1,
    type: 'Full-time',
    budget: 'VND 14M/person',
    budgetLabel: 'Monthly Budget',
    urgency: 'Low',
    status: 'RETURNED',
    justification: 'Returned because justification needs more detail on workload alignment.',
    skillsRequired: ['Markdown', 'Git', 'API Documentation'],
  },
];

const statusTabs: Array<{ key: QueueStatus; label: string }> = [
  { key: 'PENDING', label: 'Pending Review' },
  { key: 'UNDER_REVIEW', label: 'Under Review' },
  { key: 'FORWARDED', label: 'Forwarded to Admin' },
  { key: 'RETURNED', label: 'Returned' },
];

const urgencyConfig: Record<RequestUrgency, { label: string; badge: string; rail: string }> = {
  Critical: {
    label: 'Critical Priority',
    badge: 'border-rejected/20 bg-rejected/10 text-rejected',
    rail: 'bg-rejected',
  },
  High: {
    label: 'High Priority',
    badge: 'border-revision/20 bg-revision/10 text-revision',
    rail: 'bg-revision',
  },
  Normal: {
    label: 'Normal Priority',
    badge: 'border-teal-command/20 bg-teal-command/10 text-teal-command',
    rail: 'bg-teal-command',
  },
  Low: {
    label: 'Low Priority',
    badge: 'border-slate-ink/20 bg-slate-ink/10 text-slate-ink',
    rail: 'bg-slate-ink',
  },
};

const iconPaths: Record<string, React.ReactNode> = {
  add: <path d="M12 5v14M5 12h14" />,
  search: <path d="m21 21-4.3-4.3M10.8 18a7.2 7.2 0 1 1 0-14.4 7.2 7.2 0 0 1 0 14.4Z" />,
  bell: <path d="M18 8a6 6 0 1 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4" />,
  wallet: <path d="M4 7h16v11H4zM16 11h4M7 7V5h10v2" />,
  dashboard: <path d="M4 13h6V4H4zm10 7h6V4h-6zM4 20h6v-3H4z" />,
  alert: (
    <path d="M12 9v4m0 4h.01M10.3 3.9 2.8 17a2 2 0 0 0 1.7 3h15a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" />
  ),
  monitor: <path d="M4 5h16v11H4zM9 21h6m-3-5v5" />,
  palette: (
    <path d="M12 3a9 9 0 0 0 0 18h1.5a2 2 0 0 0 .5-3.94 1 1 0 0 1-.24-1.9H16a5 5 0 0 0 0-10h-4Zm-4 8h.01M9 7h.01M13 7h.01" />
  ),
  close: <path d="m6 6 12 12M18 6 6 18" />,
  send: <path d="m22 2-7 20-4-9-9-4 20-7Z" />,
  campaign: <path d="M4 12h3l9-5v10l-9-5H4Zm3 0v6a2 2 0 0 0 2 2h1" />,
  inbox: <path d="M4 4h16l-2 10h-4a2 2 0 0 1-4 0H6L4 4Zm0 10v6h16v-6" />,
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

export const HRRequestQueue: React.FC = () => {
  const navigate = useNavigate();
  const [requests, setRequests] = useState<RecruitmentRequest[]>(initialRequests);
  const [activeTab, setActiveTab] = useState<QueueStatus>('PENDING');
  const [query, setQuery] = useState('');
  const [selectedRequest, setSelectedRequest] = useState<RecruitmentRequest | null>(null);
  const [revisionTarget, setRevisionTarget] = useState<RecruitmentRequest | null>(null);
  const [revisionFeedback, setRevisionFeedback] = useState('');

  const counts = useMemo(
    () =>
      statusTabs.reduce(
        (acc, tab) => {
          acc[tab.key] = requests.filter((request) => request.status === tab.key).length;
          return acc;
        },
        {} as Record<QueueStatus, number>,
      ),
    [requests],
  );

  const filteredRequests = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return requests.filter((request) => {
      const matchesStatus = request.status === activeTab;
      const matchesQuery =
        !normalizedQuery ||
        [
          request.id,
          request.position,
          request.department,
          request.requestedBy,
          request.urgency,
        ].some((value) => value.toLowerCase().includes(normalizedQuery));

      return matchesStatus && matchesQuery;
    });
  }, [activeTab, query, requests]);

  const openReview = (request: RecruitmentRequest) => {
    setSelectedRequest(request);
    if (request.status === 'PENDING') {
      setRequests((current) =>
        current.map((item) =>
          item.id === request.id ? { ...item, status: 'UNDER_REVIEW' } : item,
        ),
      );
    }
  };

  const forwardToAdmin = (id: string) => {
    setRequests((current) =>
      current.map((item) => (item.id === id ? { ...item, status: 'FORWARDED' } : item)),
    );
    setSelectedRequest(null);
    setActiveTab('FORWARDED');
  };

  const returnForRevision = () => {
    if (!revisionTarget || !revisionFeedback.trim()) return;

    setRequests((current) =>
      current.map((item) =>
        item.id === revisionTarget.id
          ? {
              ...item,
              status: 'RETURNED',
              justification: `${item.justification} HR feedback: ${revisionFeedback.trim()}`,
            }
          : item,
      ),
    );
    setRevisionTarget(null);
    setSelectedRequest(null);
    setRevisionFeedback('');
    setActiveTab('RETURNED');
  };

  return (
    <div className="mx-auto grid max-w-[1440px] gap-6 xl:grid-cols-[minmax(0,1fr)_300px]">
      <main className="min-w-0 space-y-6">
        <header className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-end">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-teal-command">
              HR Manager Portal
            </p>
            <h1 className="mt-2 text-2xl font-semibold tracking-tight text-deep-charcoal">
              Request Review Queue
            </h1>
            <p className="mt-1 max-w-[70ch] text-sm leading-6 text-slate-ink">
              Review incoming recruitment requests, return incomplete requisitions, or forward
              validated requests to Admin.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-[minmax(240px,1fr)_auto_auto]">
            <label className="relative block">
              <span className="sr-only">Search requests</span>
              <Icon
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-outline"
                name="search"
              />
              <input
                className="h-10 w-full rounded-lg border border-border-warm bg-clean-surface pl-10 pr-3 text-sm text-deep-charcoal outline-none transition placeholder:text-on-surface-variant focus:border-teal-command focus:ring-2 focus:ring-teal-command/20"
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search requests..."
                type="search"
                value={query}
              />
            </label>
            <button
              className="relative inline-flex h-10 w-10 items-center justify-center rounded-full border border-border-warm bg-clean-surface text-on-surface-variant transition hover:border-teal-command hover:text-teal-command"
              type="button"
            >
              <span className="sr-only">Notifications</span>
              <Icon className="h-4 w-4" name="bell" />
              {counts.PENDING > 0 ? (
                <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-error" />
              ) : null}
            </button>
            <button
              className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-teal-command px-4 text-sm font-semibold text-white transition hover:bg-primary active:scale-[0.98]"
              onClick={() => navigate('/hr/campaigns')}
              type="button"
            >
              <Icon className="h-4 w-4" name="add" />
              New Requisition
            </button>
          </div>
        </header>

        <section className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="overflow-x-auto">
            <nav className="flex min-w-max gap-8 border-b border-border-warm">
              {statusTabs.map((tab) => (
                <button
                  className={`border-b-2 px-1 pb-3 text-sm font-semibold transition active:scale-[0.98] ${
                    activeTab === tab.key
                      ? 'border-teal-command text-teal-command'
                      : 'border-transparent text-secondary hover:text-teal-command'
                  }`}
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  type="button"
                >
                  {tab.label} ({counts[tab.key]})
                </button>
              ))}
            </nav>
          </div>

          {activeTab === 'PENDING' && counts.PENDING > 0 ? (
            <div className="inline-flex w-fit items-center gap-2 rounded-full border border-revision/20 bg-revision/10 px-3 py-1 text-revision">
              <span className="h-2 w-2 animate-pulse rounded-full bg-revision" />
              <span className="text-xs font-bold">{counts.PENDING} pending review</span>
            </div>
          ) : null}
        </section>

        <section className="space-y-4">
          {filteredRequests.map((request) => {
            const urgency = urgencyConfig[request.urgency];

            return (
              <article
                className="group relative cursor-pointer overflow-hidden rounded-lg border border-border-warm bg-clean-surface p-6 shadow-sm transition duration-200 hover:-translate-y-[2px] hover:border-teal-command/40"
                key={request.id}
                onClick={() => openReview(request)}
              >
                <div className={`absolute bottom-0 left-0 top-0 w-1.5 ${urgency.rail}`} />
                <div className="grid gap-4 lg:grid-cols-[1fr_auto]">
                  <div>
                    <div className="mb-1 flex flex-wrap items-center gap-2">
                      <span
                        className={`rounded border px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.14em] ${urgency.badge}`}
                      >
                        {urgency.label}
                      </span>
                      <span className="text-xs text-secondary">ID: #{request.id}</span>
                    </div>
                    <h2 className="text-xl font-semibold text-deep-charcoal transition group-hover:text-teal-command">
                      {request.position}
                    </h2>
                    <p className="mt-1 text-sm text-secondary">
                      {request.department} / Requested by:{' '}
                      <span className="font-semibold text-on-surface">{request.requestedBy}</span>
                    </p>
                  </div>
                  <div className="text-left lg:text-right">
                    <p className="mb-2 font-mono text-sm text-secondary">
                      Submitted: {request.submittedDate}
                    </p>
                    <div className="flex flex-wrap gap-2 lg:justify-end">
                      <span className="rounded border border-border-warm bg-workflow-ivory px-3 py-1 text-xs font-semibold">
                        Headcount: {request.headcount}
                      </span>
                      <span className="rounded border border-border-warm bg-workflow-ivory px-3 py-1 text-xs font-semibold">
                        {request.type}
                      </span>
                    </div>
                  </div>
                </div>

                <div
                  className="mt-4 flex flex-col gap-4 border-t border-border-warm/60 pt-4 lg:flex-row lg:items-center lg:justify-between"
                  onClick={(event) => event.stopPropagation()}
                >
                  <div className="flex items-center gap-2">
                    <Icon className="h-4 w-4 text-outline" name="wallet" />
                    <span className="text-sm font-bold text-on-surface">{request.budget}</span>
                    <span className="text-xs text-secondary">{request.budgetLabel}</span>
                  </div>
                  <div className="flex flex-col gap-3 sm:flex-row">
                    <button
                      className="h-10 rounded-lg border border-teal-command px-4 text-sm font-semibold text-teal-command transition hover:bg-teal-command hover:text-white active:scale-[0.98]"
                      onClick={() => setRevisionTarget(request)}
                      type="button"
                    >
                      Return for Revision
                    </button>
                    <button
                      className="h-10 rounded-lg bg-teal-command px-6 text-sm font-semibold text-white shadow-sm transition hover:bg-primary active:scale-[0.98]"
                      onClick={() => openReview(request)}
                      type="button"
                    >
                      Review
                    </button>
                  </div>
                </div>
              </article>
            );
          })}

          {filteredRequests.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-xl border border-border-warm bg-clean-surface px-6 py-12 text-center">
              <div className="rounded-xl bg-surface-container p-3 text-teal-command">
                <Icon className="h-6 w-6" name="inbox" />
              </div>
              <h2 className="mt-3 text-sm font-semibold text-deep-charcoal">No requests found</h2>
              <p className="mt-1 max-w-[42ch] text-sm text-on-surface-variant">
                Try clearing search or switch to another review queue tab.
              </p>
            </div>
          ) : null}
        </section>

        <footer className="flex flex-col items-center gap-4 py-4">
          <p className="text-sm text-secondary">
            Showing <span className="font-bold text-on-surface">{filteredRequests.length}</span> of{' '}
            <span className="font-bold text-on-surface">{counts[activeTab]}</span> requests
          </p>
          <button
            className="inline-flex h-11 items-center justify-center rounded-lg border border-border-warm bg-clean-surface px-6 text-sm font-semibold text-on-surface shadow-sm transition hover:bg-surface-container active:scale-[0.98]"
            type="button"
          >
            Load More Requests
          </button>
        </footer>
      </main>

      <aside className="space-y-6">
        <section className="rounded-lg border border-border-warm bg-clean-surface p-6 shadow-sm">
          <div className="mb-6 flex items-center gap-2">
            <Icon className="h-5 w-5 text-teal-command" name="dashboard" />
            <h2 className="text-lg font-semibold text-deep-charcoal">Queue Summary</h2>
          </div>
          <div className="space-y-6">
            <div>
              <p className="text-xs font-semibold text-secondary">Average Review Time</p>
              <div className="mt-1 flex items-baseline gap-1">
                <span className="font-mono text-3xl font-bold text-on-surface">2.3</span>
                <span className="text-sm text-secondary">days</span>
              </div>
              <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-workflow-ivory">
                <div className="h-full w-[65%] bg-teal-command" />
              </div>
            </div>

            <div className="rounded-lg border border-revision/10 bg-revision/5 p-4">
              <p className="text-xs font-semibold text-secondary">Oldest Pending Request</p>
              <div className="mt-1 flex items-center justify-between">
                <span className="text-xl font-bold text-revision">5 days</span>
                <Icon className="h-5 w-5 text-revision" name="alert" />
              </div>
              <p className="mt-1 text-[11px] font-medium text-revision/80">
                Action recommended for SLAs
              </p>
            </div>

            <div className="space-y-3 border-t border-border-warm/60 pt-4">
              <h3 className="text-[11px] font-bold uppercase tracking-[0.14em] text-on-surface">
                This Week Performance
              </h3>
              {[
                ['Reviewed', 3, 'bg-approved'],
                ['Forwarded', 2, 'bg-pending'],
              ].map(([label, value, dot]) => (
                <div className="flex items-center justify-between text-sm" key={label as string}>
                  <div className="flex items-center gap-2">
                    <span className={`h-2 w-2 rounded-full ${dot}`} />
                    <span className="text-secondary">{label}</span>
                  </div>
                  <span className="font-bold text-on-surface">{value}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="rounded-lg border border-border-warm bg-clean-surface p-6 shadow-sm">
          <h2 className="mb-4 text-sm font-bold text-deep-charcoal">Request Distribution</h2>
          <div className="space-y-4">
            {[
              { label: 'IT & Eng', value: 42, icon: 'monitor' },
              { label: 'Design', value: 28, icon: 'palette' },
            ].map((item) => (
              <div className="flex items-center gap-3" key={item.label}>
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-workflow-ivory text-teal-command">
                  <Icon className="h-5 w-5" name={item.icon} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="mb-1 flex justify-between">
                    <span className="text-xs font-semibold text-deep-charcoal">{item.label}</span>
                    <span className="text-xs font-semibold text-secondary">{item.value}%</span>
                  </div>
                  <div className="h-1 overflow-hidden rounded-full bg-surface-container">
                    <div className="h-full bg-teal-command" style={{ width: `${item.value}%` }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="relative h-32 overflow-hidden rounded-lg bg-teal-command p-5 text-white shadow-sm">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.24),transparent_28%),linear-gradient(135deg,rgba(0,104,95,0.1),rgba(28,25,23,0.38))]" />
          <div className="relative flex h-full flex-col justify-end">
            <p className="text-sm font-bold">Need assistance?</p>
            <p className="mt-1 text-xs text-teal-50">
              Schedule a sync with the recruitment admin team.
            </p>
          </div>
        </section>
      </aside>

      {selectedRequest ? (
        <div className="fixed inset-0 z-50 flex justify-end bg-deep-charcoal/40 backdrop-blur-sm">
          <section className="flex h-full w-full max-w-[520px] flex-col bg-clean-surface shadow-2xl">
            <header className="flex items-center justify-between border-b border-border-warm bg-workflow-ivory/60 px-6 py-4">
              <div>
                <p className="font-mono text-xs font-semibold text-teal-command">
                  #{selectedRequest.id}
                </p>
                <h2 className="mt-0.5 text-base font-semibold text-deep-charcoal">
                  Recruitment Requisition
                </h2>
              </div>
              <button
                className="rounded-full p-1.5 text-on-surface-variant transition hover:bg-surface-variant hover:text-deep-charcoal"
                onClick={() => setSelectedRequest(null)}
                type="button"
              >
                <span className="sr-only">Close review drawer</span>
                <Icon className="h-4 w-4" name="close" />
              </button>
            </header>

            <div className="flex-1 space-y-6 overflow-y-auto p-6">
              <div>
                <span
                  className={`rounded border px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.14em] ${urgencyConfig[selectedRequest.urgency].badge}`}
                >
                  {selectedRequest.urgency} Priority
                </span>
                <h3 className="mt-2 text-xl font-bold text-deep-charcoal">
                  {selectedRequest.position}
                </h3>
                <p className="mt-1 text-xs text-secondary">
                  Department:{' '}
                  <span className="font-semibold text-on-surface">
                    {selectedRequest.department}
                  </span>
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4 rounded-lg border border-border-warm bg-workflow-ivory p-4">
                {[
                  ['Requested By', selectedRequest.requestedBy],
                  ['Headcount Plan', `${selectedRequest.headcount} candidates`],
                  ['Job Category', selectedRequest.type],
                  ['Monthly Allocation', selectedRequest.budget],
                ].map(([label, value]) => (
                  <div key={label}>
                    <p className="text-[11px] font-semibold text-secondary">{label}</p>
                    <p className="mt-1 text-sm font-semibold text-deep-charcoal">{value}</p>
                  </div>
                ))}
              </div>

              <div>
                <h4 className="mb-2 text-xs font-bold uppercase tracking-[0.14em] text-deep-charcoal">
                  Justification & Sourcing Brief
                </h4>
                <p className="rounded-lg border border-border-warm/60 bg-workflow-ivory/50 p-4 text-sm leading-6 text-slate-ink">
                  {selectedRequest.justification}
                </p>
              </div>

              <div>
                <h4 className="mb-3 text-xs font-bold uppercase tracking-[0.14em] text-deep-charcoal">
                  Key Technical Competencies
                </h4>
                <div className="flex flex-wrap gap-2">
                  {selectedRequest.skillsRequired.map((skill) => (
                    <span
                      className="rounded-full border border-teal-command/20 bg-teal-command/5 px-3 py-1 text-xs font-semibold text-teal-command"
                      key={skill}
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <footer className="space-y-3 border-t border-border-warm bg-workflow-ivory/60 p-6">
              <button
                className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-teal-command text-sm font-semibold text-white shadow-sm transition hover:bg-primary active:scale-[0.98]"
                onClick={() => navigate('/hr/campaigns')}
                type="button"
              >
                <Icon className="h-4 w-4" name="campaign" />
                Approve & Create Campaign Plan
              </button>
              <div className="grid grid-cols-2 gap-3">
                <button
                  className="h-10 rounded-lg border border-border-warm bg-clean-surface text-sm font-semibold text-slate-ink transition hover:border-teal-command hover:text-teal-command active:scale-[0.98]"
                  onClick={() => setRevisionTarget(selectedRequest)}
                  type="button"
                >
                  Return for Revision
                </button>
                <button
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-deep-charcoal text-sm font-semibold text-white transition hover:bg-slate-ink active:scale-[0.98]"
                  onClick={() => forwardToAdmin(selectedRequest.id)}
                  type="button"
                >
                  <Icon className="h-4 w-4" name="send" />
                  Forward to Admin
                </button>
              </div>
            </footer>
          </section>
        </div>
      ) : null}

      {revisionTarget ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-deep-charcoal/40 p-4 backdrop-blur-sm">
          <section className="w-full max-w-[480px] overflow-hidden rounded-xl border border-border-warm bg-clean-surface shadow-2xl">
            <header className="flex items-center justify-between border-b border-border-warm bg-workflow-ivory/60 px-6 py-4">
              <h2 className="font-semibold text-deep-charcoal">Return Requisition for Revision</h2>
              <button
                className="rounded-full p-1.5 text-on-surface-variant transition hover:bg-surface-variant hover:text-deep-charcoal"
                onClick={() => {
                  setRevisionTarget(null);
                  setRevisionFeedback('');
                }}
                type="button"
              >
                <span className="sr-only">Close revision modal</span>
                <Icon className="h-4 w-4" name="close" />
              </button>
            </header>
            <div className="space-y-4 p-6">
              <p className="text-sm leading-6 text-secondary">
                Provide clear instructions for the Department Head before HR planning continues for
                #{revisionTarget.id}.
              </p>
              <label className="block">
                <span className="mb-2 block text-xs font-bold uppercase tracking-[0.14em] text-deep-charcoal">
                  Revision Feedback Notes
                </span>
                <textarea
                  className="w-full resize-none rounded-lg border border-border-warm bg-clean-surface p-3 text-sm outline-none transition placeholder:text-on-surface-variant focus:border-teal-command focus:ring-2 focus:ring-teal-command/20"
                  onChange={(event) => setRevisionFeedback(event.target.value)}
                  placeholder="Budget range is higher than the department benchmark. Please realign..."
                  rows={4}
                  value={revisionFeedback}
                />
              </label>
            </div>
            <footer className="flex justify-end gap-3 border-t border-border-warm bg-workflow-ivory/60 px-6 py-4">
              <button
                className="h-10 rounded-lg border border-border-warm px-4 text-sm font-semibold text-secondary transition hover:bg-surface-variant/40 active:scale-[0.98]"
                onClick={() => {
                  setRevisionTarget(null);
                  setRevisionFeedback('');
                }}
                type="button"
              >
                Cancel
              </button>
              <button
                className="h-10 rounded-lg bg-rejected px-5 text-sm font-bold text-white transition hover:bg-red-700 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
                disabled={!revisionFeedback.trim()}
                onClick={returnForRevision}
                type="button"
              >
                Return to Dept Head
              </button>
            </footer>
          </section>
        </div>
      ) : null}
    </div>
  );
};
