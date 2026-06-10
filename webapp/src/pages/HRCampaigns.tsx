import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

type PlanStatus = 'PENDING_APPROVAL' | 'APPROVED' | 'DRAFT' | 'REVISION_REQUIRED';

type Campaign = {
  id: string;
  position: string;
  department: string;
  headcount: number;
  status: PlanStatus;
  window: string;
  progress: number;
  owner: string;
  budget: string;
  taskCount: number;
  adminNote: string;
};

const campaigns: Campaign[] = [
  {
    id: 'REQ-2024-041',
    position: 'Senior Backend Engineer',
    department: 'Engineering',
    headcount: 2,
    status: 'PENDING_APPROVAL',
    window: 'Oct 15 - Nov 30',
    progress: 30,
    owner: 'Sarah Jenkins',
    budget: '$15,000',
    taskCount: 14,
    adminNote: 'Please ensure the technical screening phase includes the new security compliance module before submitting for final approval.',
  },
  {
    id: 'REQ-2024-038',
    position: 'Product Marketing Manager',
    department: 'Marketing',
    headcount: 1,
    status: 'APPROVED',
    window: 'Oct 01 - Nov 15',
    progress: 65,
    owner: 'Minh Tran',
    budget: '$8,500',
    taskCount: 10,
    adminNote: 'Campaign approved. Proceed with job posting and CV collection phases immediately.',
  },
  {
    id: 'REQ-2024-045',
    position: 'UX Researcher',
    department: 'Design',
    headcount: 1,
    status: 'DRAFT',
    window: 'TBD',
    progress: 10,
    owner: 'Lan Pham',
    budget: '$6,000',
    taskCount: 6,
    adminNote: 'Draft plan not yet submitted for review.',
  },
  {
    id: 'REQ-2024-032',
    position: 'Sales Director - EMEA',
    department: 'Sales',
    headcount: 1,
    status: 'REVISION_REQUIRED',
    window: 'Sep 15 - Oct 31',
    progress: 45,
    owner: 'Bao Nguyen',
    budget: '$22,000',
    taskCount: 18,
    adminNote: 'The salary range listed does not align with the approved headcount budget. Please revise and resubmit.',
  },
  {
    id: 'REQ-2024-050',
    position: 'Cloud Security Specialist',
    department: 'Infrastructure',
    headcount: 2,
    status: 'APPROVED',
    window: 'Nov 01 - Dec 20',
    progress: 52,
    owner: 'Hoang Bui',
    budget: '$18,400',
    taskCount: 12,
    adminNote: 'Security clearance checklist has been approved for the campaign.',
  },
];

const metricCards = [
  { label: 'Plans Draft', value: 12, tone: 'draft' },
  { label: 'Pending Approval', value: 4, tone: 'pending' },
  { label: 'Approved Active', value: 8, tone: 'approved' },
  { label: 'Revision Required', value: 2, tone: 'revision' },
] as const;

const statusConfig: Record<PlanStatus, { label: string; dot: string; badge: string; progress: string }> = {
  PENDING_APPROVAL: {
    label: 'PENDING_APPROVAL',
    dot: 'bg-pending',
    badge: 'border-pending/20 bg-pending/10 text-pending',
    progress: 'bg-pending',
  },
  APPROVED: {
    label: 'APPROVED',
    dot: 'bg-approved',
    badge: 'border-approved/20 bg-approved/10 text-approved',
    progress: 'bg-approved',
  },
  DRAFT: {
    label: 'DRAFT',
    dot: 'bg-draft',
    badge: 'border-draft/20 bg-draft/10 text-draft',
    progress: 'bg-draft',
  },
  REVISION_REQUIRED: {
    label: 'REVISION_REQUIRED',
    dot: 'bg-revision',
    badge: 'border-revision/20 bg-revision/10 text-revision',
    progress: 'bg-revision',
  },
};

const metricToneClasses: Record<string, { label: string; dot: string }> = {
  draft: { label: 'text-draft', dot: 'bg-draft' },
  pending: { label: 'text-pending', dot: 'bg-pending' },
  approved: { label: 'text-approved', dot: 'bg-approved' },
  revision: { label: 'text-revision', dot: 'bg-revision' },
};

const iconPaths: Record<string, React.ReactNode> = {
  add: <path d="M12 5v14M5 12h14" />,
  search: <path d="m21 21-4.3-4.3M10.8 18a7.2 7.2 0 1 1 0-14.4 7.2 7.2 0 0 1 0 14.4Z" />,
  filter: <path d="M4 6h16M7 12h10M10 18h4" />,
  close: <path d="m6 6 12 12M18 6 6 18" />,
  lock: <path d="M7 11V8a5 5 0 0 1 10 0v3M6 11h12v9H6z" />,
  person: <path d="M20 21a8 8 0 0 0-16 0m12-13a4 4 0 1 1-8 0 4 4 0 0 1 8 0Z" />,
  checklist: <path d="m4 7 1.5 1.5L8 6m4 1h8M4 13l1.5 1.5L8 12m4 1h8M4 19l1.5 1.5L8 18m4 1h8" />,
  send: <path d="m22 2-7 20-4-9-9-4 20-7Z" />,
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

const StatusBadge = ({ status }: { status: PlanStatus }) => {
  const config = statusConfig[status];

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-bold ${config.badge}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${config.dot}`} />
      {config.label}
    </span>
  );
};

export const HRCampaigns: React.FC = () => {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState<PlanStatus | 'All'>('All');
  const [selectedId, setSelectedId] = useState('REQ-2024-041');

  const visibleCampaigns = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return campaigns.filter((campaign) => {
      const matchesStatus = status === 'All' || campaign.status === status;
      const matchesQuery =
        !normalizedQuery ||
        [campaign.id, campaign.position, campaign.department, campaign.owner, campaign.status].some((value) =>
          value.toLowerCase().includes(normalizedQuery),
        );

      return matchesStatus && matchesQuery;
    });
  }, [query, status]);

  const selected = campaigns.find((campaign) => campaign.id === selectedId) ?? visibleCampaigns[0] ?? null;

  return (
    <div className="mx-auto grid max-w-[1440px] gap-6 xl:grid-cols-[minmax(0,1fr)_400px]">
      <main className="min-w-0 space-y-6">
        <header className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-end">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-teal-command">HR Manager</p>
            <h1 className="mt-2 text-2xl font-semibold tracking-tight text-deep-charcoal">Recruitment Campaigns</h1>
            <p className="mt-1 max-w-[70ch] text-sm leading-6 text-slate-ink">
              Build and maintain overall plans for Admin-approved recruitment requests.
            </p>
          </div>
          <button
            className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-teal-command px-4 text-sm font-semibold text-white transition hover:bg-primary active:scale-[0.98]"
            type="button"
          >
            <Icon className="h-4 w-4" name="add" />
            Create Overall Plan
          </button>
        </header>

        <section className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4" aria-label="Campaign metrics">
          {metricCards.map((card) => {
            const tone = metricToneClasses[card.tone];

            return (
              <section className="rounded-lg border border-border-warm bg-clean-surface p-5 shadow-[0_18px_50px_-44px_rgba(28,25,23,0.55)]" key={card.label}>
                <p className={`flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] ${tone.label}`}>
                  <span className={`h-2 w-2 rounded-full ${tone.dot}`} />
                  {card.label}
                </p>
                <p className="mt-4 font-mono text-[32px] font-semibold leading-none text-deep-charcoal">{card.value}</p>
              </section>
            );
          })}
        </section>

        <section className="overflow-hidden rounded-lg border border-border-warm bg-clean-surface shadow-[0_18px_50px_-44px_rgba(28,25,23,0.55)]">
          <div className="flex flex-col gap-4 border-b border-border-warm bg-workflow-ivory/60 p-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-xl font-semibold text-deep-charcoal">Active Campaigns</h2>
              <p className="mt-1 text-sm text-slate-ink">Showing {visibleCampaigns.length} of {campaigns.length} entries.</p>
            </div>

            <div className="grid gap-3 sm:grid-cols-[minmax(220px,1fr)_180px]">
              <label className="relative block">
                <span className="sr-only">Search campaigns</span>
                <Icon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-outline" name="search" />
                <input
                  className="h-10 w-full rounded-lg border border-border-warm bg-clean-surface pl-10 pr-3 text-sm text-deep-charcoal outline-none transition placeholder:text-on-surface-variant focus:border-teal-command focus:ring-2 focus:ring-teal-command/20"
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search campaigns..."
                  type="search"
                  value={query}
                />
              </label>
              <label className="inline-flex h-10 items-center gap-2 rounded-lg border border-border-warm bg-clean-surface px-3 text-sm text-on-surface-variant">
                <Icon className="h-4 w-4" name="filter" />
                <span className="sr-only">Filter campaign status</span>
                <select
                  className="w-full border-none bg-transparent p-0 text-sm font-semibold text-on-surface-variant outline-none focus:ring-0"
                  onChange={(event) => setStatus(event.target.value as PlanStatus | 'All')}
                  value={status}
                >
                  <option value="All">All status</option>
                  <option value="DRAFT">Draft</option>
                  <option value="PENDING_APPROVAL">Pending</option>
                  <option value="APPROVED">Approved</option>
                  <option value="REVISION_REQUIRED">Revision</option>
                </select>
              </label>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[920px] border-collapse text-left">
              <thead className="bg-workflow-ivory text-xs uppercase tracking-[0.14em] text-on-surface-variant">
                <tr>
                  {['Request ID', 'Position', 'Department', 'HC', 'Plan Status', 'Campaign Window', 'Progress'].map((column) => (
                    <th className="px-5 py-4 font-semibold" key={column}>
                      {column}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border-warm">
                {visibleCampaigns.map((campaign) => {
                  const selectedRow = selected?.id === campaign.id;

                  return (
                    <tr
                      className={`cursor-pointer transition ${selectedRow ? 'bg-teal-command/5 hover:bg-teal-command/10' : 'hover:bg-workflow-ivory/70'}`}
                      key={campaign.id}
                      onClick={() => setSelectedId(campaign.id)}
                    >
                      <td className={`px-5 py-4 font-mono text-sm ${selectedRow ? 'text-teal-command' : 'text-slate-ink'}`}>#{campaign.id}</td>
                      <td className="px-5 py-4 text-sm font-semibold text-deep-charcoal">{campaign.position}</td>
                      <td className="px-5 py-4 text-sm text-on-surface-variant">{campaign.department}</td>
                      <td className="px-5 py-4 font-mono text-sm text-on-surface-variant">{campaign.headcount}</td>
                      <td className="px-5 py-4">
                        <StatusBadge status={campaign.status} />
                      </td>
                      <td className="px-5 py-4 text-sm text-on-surface-variant">{campaign.window}</td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          <div className="h-1.5 w-24 overflow-hidden rounded-full bg-surface-variant">
                            <div className={`h-full rounded-full ${statusConfig[campaign.status].progress}`} style={{ width: `${campaign.progress}%` }} />
                          </div>
                          <span className="font-mono text-xs text-on-surface-variant">{campaign.progress}%</span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {visibleCampaigns.length === 0 ? (
            <div className="border-t border-border-warm px-6 py-12 text-center">
              <p className="text-sm font-semibold text-deep-charcoal">No campaigns match this view.</p>
              <p className="mt-1 text-sm text-slate-ink">Adjust the search term or status filter.</p>
            </div>
          ) : null}
        </section>
      </main>

      <aside className="min-w-0 rounded-lg border border-border-warm bg-clean-surface shadow-[0_18px_50px_-44px_rgba(28,25,23,0.55)] xl:sticky xl:top-6 xl:self-start">
        {selected ? (
          <>
            <div className="flex items-start justify-between gap-4 border-b border-border-warm bg-workflow-ivory/50 p-5">
              <div>
                <p className="font-mono text-sm font-semibold text-teal-command">#{selected.id}</p>
                <h2 className="mt-1 text-xl font-semibold text-deep-charcoal">Campaign Details</h2>
              </div>
              <button
                className="rounded-full p-1.5 text-on-surface-variant transition hover:bg-surface-variant hover:text-deep-charcoal active:scale-[0.98]"
                onClick={() => setSelectedId('')}
                type="button"
              >
                <span className="sr-only">Close campaign detail</span>
                <Icon className="h-4 w-4" name="close" />
              </button>
            </div>

            <div className="space-y-6 p-5">
              <div>
                <h3 className="text-xl font-semibold text-deep-charcoal">{selected.position}</h3>
                <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-on-surface-variant">
                  <span>{selected.department} Dept.</span>
                  <span className="text-border-warm">/</span>
                  <span className="inline-flex items-center gap-1">
                    <Icon className="h-4 w-4" name="person" />
                    Headcount: {selected.headcount}
                  </span>
                </div>
                <div className="mt-3">
                  <StatusBadge status={selected.status} />
                </div>
              </div>

              {selected.status === 'PENDING_APPROVAL' ? (
                <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 p-3">
                  <Icon className="mt-0.5 h-4 w-4 text-revision" name="lock" />
                  <div>
                    <p className="text-sm font-semibold text-amber-800">Plan locked</p>
                    <p className="mt-1 text-xs leading-5 text-amber-700">Execution stays locked until Admin approves the plan. Tasks cannot be activated.</p>
                  </div>
                </div>
              ) : null}

              <div className="grid grid-cols-2 gap-4">
                {[
                  ['Campaign Window', selected.window],
                  ['Owner', selected.owner],
                  ['Budget Allocation', selected.budget],
                  ['Task Count', `${selected.taskCount} tasks configured`],
                ].map(([label, value]) => (
                  <div key={label}>
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-on-surface-variant">{label}</p>
                    <p className="mt-1 text-sm font-semibold text-deep-charcoal">{value}</p>
                  </div>
                ))}
              </div>

              <div className="border-t border-border-warm pt-5">
                <h4 className="text-sm font-semibold text-deep-charcoal">Admin Notes (Latest)</h4>
                <div className="mt-3 rounded-lg border border-border-warm bg-workflow-ivory p-3">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-xs font-semibold text-deep-charcoal">David Chen (Admin)</span>
                    <span className="text-[11px] text-on-surface-variant">Yesterday, 2:30 PM</span>
                  </div>
                  <p className="mt-2 text-sm leading-6 text-on-surface-variant">{selected.adminNote}</p>
                </div>
              </div>
            </div>

            <div className="space-y-3 border-t border-border-warm bg-workflow-ivory/50 p-5">
              {selected.status !== 'APPROVED' ? (
                <button className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-teal-command px-4 text-sm font-semibold text-white transition hover:bg-primary active:scale-[0.98]" type="button">
                  <Icon className="h-4 w-4" name="send" />
                  {selected.status === 'REVISION_REQUIRED' ? 'Resubmit for Approval' : 'Submit for Approval'}
                </button>
              ) : null}
              <div className="grid grid-cols-2 gap-3">
                <button className="h-10 rounded-lg border border-teal-command text-sm font-semibold text-teal-command transition hover:bg-teal-command/5 active:scale-[0.98]" type="button">
                  Edit Plan
                </button>
                <button
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-lg text-sm font-semibold text-teal-command transition hover:underline active:scale-[0.98]"
                  onClick={() => navigate(`/hr/campaigns/${selected.id}`)}
                  type="button"
                >
                  Open Detail
                  <Icon className="h-4 w-4" name="arrow" />
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="p-8 text-center">
            <p className="text-sm font-semibold text-deep-charcoal">Select a campaign</p>
            <p className="mt-1 text-sm text-slate-ink">Choose a row to inspect plan details.</p>
          </div>
        )}
      </aside>
    </div>
  );
};
