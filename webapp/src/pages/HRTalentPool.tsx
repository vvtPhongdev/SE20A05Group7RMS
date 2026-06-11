import React, { useMemo, useState } from 'react';

type ParseStatus = 'Parsed' | 'Pending';
type CandidateStage = 'Talent Pool' | 'Screening' | 'Interview' | 'Offer';

type Candidate = {
  id: string;
  name: string;
  initials: string;
  title: string;
  role: string;
  skills: string[];
  stage: CandidateStage;
  lastActivity: string;
  parseStatus: ParseStatus;
  availability: 'Immediate' | '1 Month Notice';
  email: string;
  phone: string;
  location: string;
  photo?: string;
};

const candidates: Candidate[] = [
  {
    id: 'CAN-2480',
    name: 'Nguyen Van A',
    initials: 'NA',
    title: 'Senior Backend Developer',
    role: 'Software Engineer',
    skills: ['Node.js', 'AWS', 'PostgreSQL'],
    stage: 'Talent Pool',
    lastActivity: '2 days ago',
    parseStatus: 'Parsed',
    availability: 'Immediate',
    email: 'nguyen.a@example.com',
    phone: '+84 90 118 2048',
    location: 'Da Nang, VN',
  },
  {
    id: 'CAN-2481',
    name: 'Tran Ngoc Mai',
    initials: 'TM',
    title: 'Senior Frontend Developer',
    role: 'Software Engineer',
    skills: ['React', 'TypeScript', 'GraphQL', 'Tailwind CSS', 'Next.js'],
    stage: 'Screening',
    lastActivity: 'Just now',
    parseStatus: 'Parsed',
    availability: 'Immediate',
    email: 'mai.tran@example.com',
    phone: '+84 90 123 4567',
    location: 'Ho Chi Minh City, VN',
    photo:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuDL0yGeRhM3zoQmc3O9eQ6MvtFSMsU_aZAJs_SdbJzi0etd3ZksvHV1kmSuRONopoiIdfqjFoQE8BB-4CFQbFoLOtIkMhCo21unr_XInylgmcCd4f5ma3MH1BFoWnDor90oEJNeEvixBOdpf2Al_CnAJ8Dk6vbyFQzOhEpvrcNclJFwWNWNI6aEHEOmpdByYBlppvlwesxxwBPItdQSdgYdUSpPUcbhy7iI7Mp8o43JaGGksxXMGhs9OOvEaSF80kKCQ4pCF1I1NjQ',
  },
  {
    id: 'CAN-2482',
    name: 'Le Phuoc',
    initials: 'LP',
    title: 'DevOps Engineer',
    role: 'Software Engineer',
    skills: ['Docker', 'Kubernetes', 'Jenkins'],
    stage: 'Talent Pool',
    lastActivity: '5 days ago',
    parseStatus: 'Pending',
    availability: '1 Month Notice',
    email: 'phuoc.le@example.com',
    phone: '+84 91 845 1022',
    location: 'Hanoi, VN',
  },
  {
    id: 'CAN-2483',
    name: 'Tran Hung',
    initials: 'TH',
    title: 'UX/UI Designer',
    role: 'Product Manager',
    skills: ['Figma', 'Prototyping'],
    stage: 'Screening',
    lastActivity: '1 week ago',
    parseStatus: 'Parsed',
    availability: 'Immediate',
    email: 'hung.tran@example.com',
    phone: '+84 93 450 7712',
    location: 'Ho Chi Minh City, VN',
  },
  {
    id: 'CAN-2484',
    name: 'Pham Bao Linh',
    initials: 'PL',
    title: 'Product Manager',
    role: 'Product Manager',
    skills: ['Roadmapping', 'Scrum', 'Analytics'],
    stage: 'Interview',
    lastActivity: 'Yesterday',
    parseStatus: 'Parsed',
    availability: '1 Month Notice',
    email: 'linh.pham@example.com',
    phone: '+84 88 321 9044',
    location: 'Hanoi, VN',
  },
];

const kpis = [
  {
    label: 'Total Candidates',
    value: '2,480',
    helper: '+12% vs last month',
    tone: 'text-approved',
  },
  { label: 'Parsed CVs', value: '2,315', helper: '93% accuracy', tone: 'text-teal-command' },
  { label: 'New This Week', value: '142', helper: '65% target pace', tone: 'text-deep-charcoal' },
  {
    label: 'In Active Campaigns',
    value: '856',
    helper: 'Across 14 open roles',
    tone: 'text-deep-charcoal',
  },
];

const iconPaths: Record<string, React.ReactNode> = {
  search: <path d="m21 21-4.3-4.3M10.8 18a7.2 7.2 0 1 1 0-14.4 7.2 7.2 0 0 1 0 14.4Z" />,
  reset: <path d="M4 4v6h6M20 20v-6h-6M5 15a7 7 0 0 0 11 3M19 9A7 7 0 0 0 8 6" />,
  close: <path d="m6 6 12 12M18 6 6 18" />,
  mail: <path d="M4 6h16v12H4zM4 7l8 6 8-6" />,
  phone: (
    <path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.3 1.7.6 2.5a2 2 0 0 1-.5 2.1L8 9.5a16 16 0 0 0 6.5 6.5l1.2-1.2a2 2 0 0 1 2.1-.5c.8.3 1.6.5 2.5.6a2 2 0 0 1 1.7 2Z" />
  ),
  location: <path d="M20 10c0 5-8 12-8 12S4 15 4 10a8 8 0 1 1 16 0Z" />,
  lock: <path d="M7 11V8a5 5 0 0 1 10 0v3M6 11h12v9H6z" />,
  shield: <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" />,
  send: <path d="m22 2-7 20-4-9-9-4 20-7Z" />,
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

const statusClass: Record<ParseStatus, string> = {
  Parsed: 'bg-teal-command/10 text-teal-command',
  Pending: 'bg-surface-container text-on-surface-variant',
};

export const HRTalentPool: React.FC = () => {
  const [query, setQuery] = useState('');
  const [role, setRole] = useState('All Roles');
  const [availability, setAvailability] = useState('All Availability');
  const [parseStatus, setParseStatus] = useState('All Status');
  const [eligibleOnly, setEligibleOnly] = useState(true);
  const [selectedId, setSelectedId] = useState('CAN-2481');

  const visibleCandidates = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return candidates.filter((candidate) => {
      const matchesQuery =
        !normalizedQuery ||
        [
          candidate.name,
          candidate.title,
          candidate.role,
          candidate.stage,
          candidate.email,
          ...candidate.skills,
        ].some((value) => value.toLowerCase().includes(normalizedQuery));
      const matchesRole = role === 'All Roles' || candidate.role === role;
      const matchesAvailability =
        availability === 'All Availability' || candidate.availability === availability;
      const matchesParse = parseStatus === 'All Status' || candidate.parseStatus === parseStatus;
      const matchesEligibility = !eligibleOnly || candidate.parseStatus === 'Parsed';
      return (
        matchesQuery && matchesRole && matchesAvailability && matchesParse && matchesEligibility
      );
    });
  }, [availability, eligibleOnly, parseStatus, query, role]);

  const selected =
    candidates.find((candidate) => candidate.id === selectedId) ??
    visibleCandidates[0] ??
    candidates[0];

  const resetFilters = () => {
    setQuery('');
    setRole('All Roles');
    setAvailability('All Availability');
    setParseStatus('All Status');
    setEligibleOnly(true);
  };

  return (
    <div className="mx-auto grid max-w-[1440px] gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
      <main className="min-w-0 space-y-6">
        <header className="grid gap-4 xl:grid-cols-[1fr_minmax(260px,420px)] xl:items-end">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-teal-command">
              HR Manager Workspace
            </p>
            <h1 className="mt-2 text-2xl font-semibold tracking-tight text-deep-charcoal">
              Talent Pool
            </h1>
            <p className="mt-1 max-w-[70ch] text-sm leading-6 text-slate-ink">
              Browse parsed CVs, inspect structured candidate data, and prepare eligible profiles
              for active campaigns.
            </p>
          </div>
          <label className="relative block">
            <span className="sr-only">Search candidates</span>
            <Icon
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-outline"
              name="search"
            />
            <input
              className="h-10 w-full rounded-lg border border-border-warm bg-clean-surface pl-10 pr-3 text-sm text-deep-charcoal outline-none transition placeholder:text-on-surface-variant focus:border-teal-command focus:ring-2 focus:ring-teal-command/20"
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search candidates, skills, jobs..."
              type="search"
              value={query}
            />
          </label>
        </header>

        <section
          className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4"
          aria-label="Talent pool metrics"
        >
          {kpis.map((kpi) => (
            <section
              className="rounded-lg border border-border-warm bg-clean-surface p-5 shadow-sm"
              key={kpi.label}
            >
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-on-surface-variant">
                {kpi.label}
              </p>
              <div className="mt-3 flex items-baseline gap-2">
                <span className={`font-mono text-[32px] font-semibold leading-none ${kpi.tone}`}>
                  {kpi.value}
                </span>
              </div>
              <p className="mt-2 text-sm text-slate-ink">{kpi.helper}</p>
            </section>
          ))}
        </section>

        <section className="rounded-lg border border-border-warm bg-clean-surface p-4 shadow-sm">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-[1fr_1fr_1fr_1fr_auto] xl:items-end">
            <label className="flex flex-col gap-1">
              <span className="text-xs font-semibold text-on-surface-variant">Role</span>
              <select
                className="h-10 rounded-lg border border-border-warm bg-clean-surface px-3 text-sm outline-none focus:border-teal-command focus:ring-2 focus:ring-teal-command/20"
                onChange={(event) => setRole(event.target.value)}
                value={role}
              >
                <option>All Roles</option>
                <option>Software Engineer</option>
                <option>Product Manager</option>
              </select>
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-xs font-semibold text-on-surface-variant">Skills</span>
              <div className="flex h-10 items-center justify-between rounded-lg border border-border-warm bg-workflow-ivory px-3 text-sm font-semibold text-on-surface-variant">
                Multi-select...
                <span className="text-xs">Open</span>
              </div>
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-xs font-semibold text-on-surface-variant">Availability</span>
              <select
                className="h-10 rounded-lg border border-border-warm bg-clean-surface px-3 text-sm outline-none focus:border-teal-command focus:ring-2 focus:ring-teal-command/20"
                onChange={(event) => setAvailability(event.target.value)}
                value={availability}
              >
                <option>All Availability</option>
                <option>Immediate</option>
                <option>1 Month Notice</option>
              </select>
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-xs font-semibold text-on-surface-variant">Parsing Status</span>
              <select
                className="h-10 rounded-lg border border-border-warm bg-clean-surface px-3 text-sm outline-none focus:border-teal-command focus:ring-2 focus:ring-teal-command/20"
                onChange={(event) => setParseStatus(event.target.value)}
                value={parseStatus}
              >
                <option>All Status</option>
                <option>Parsed</option>
                <option>Pending</option>
              </select>
            </label>
            <div className="flex items-center gap-3">
              <button
                aria-pressed={eligibleOnly}
                className={`relative h-6 w-11 rounded-full transition ${eligibleOnly ? 'bg-teal-command' : 'bg-surface-container'}`}
                onClick={() => setEligibleOnly((value) => !value)}
                type="button"
              >
                <span
                  className={`absolute top-1 h-4 w-4 rounded-full bg-white transition ${eligibleOnly ? 'right-1' : 'left-1'}`}
                />
              </button>
              <span className="text-sm font-semibold text-on-surface-variant">Eligible</span>
              <button
                className="rounded-lg p-2 text-teal-command transition hover:bg-surface-container active:scale-[0.98]"
                onClick={resetFilters}
                type="button"
              >
                <span className="sr-only">Reset filters</span>
                <Icon className="h-4 w-4" name="reset" />
              </button>
            </div>
          </div>
        </section>

        <section className="grid grid-cols-1 gap-6 md:grid-cols-2 2xl:grid-cols-3">
          {visibleCandidates.map((candidate) => {
            const active = selected.id === candidate.id;
            return (
              <article
                className={`flex cursor-pointer flex-col rounded-lg bg-clean-surface p-5 transition hover:-translate-y-[2px] hover:shadow-md ${
                  active
                    ? 'border-2 border-teal-command/30 ring-2 ring-teal-command/5'
                    : 'border border-border-warm'
                }`}
                key={candidate.id}
                onClick={() => setSelectedId(candidate.id)}
              >
                <div className="mb-4 flex items-start justify-between gap-3">
                  <div className="flex min-w-0 gap-3">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-surface-container text-xl font-bold text-teal-command">
                      {candidate.photo ? (
                        <img
                          alt={candidate.name}
                          className="h-full w-full object-cover"
                          src={candidate.photo}
                        />
                      ) : (
                        candidate.initials
                      )}
                    </div>
                    <div className="min-w-0">
                      <h2 className="truncate text-xl font-bold text-deep-charcoal">
                        {candidate.name}
                      </h2>
                      <p className="text-sm text-on-surface-variant">{candidate.title}</p>
                    </div>
                  </div>
                  <span
                    className={`rounded px-2 py-1 text-[10px] font-bold uppercase tracking-[0.08em] ${statusClass[candidate.parseStatus]}`}
                  >
                    {candidate.parseStatus}
                  </span>
                </div>

                <div className="mb-4 flex flex-wrap gap-2">
                  {candidate.skills.slice(0, 4).map((skill) => (
                    <span
                      className="rounded-full border border-border-warm bg-workflow-ivory px-2 py-1 text-xs text-slate-ink"
                      key={skill}
                    >
                      {skill}
                    </span>
                  ))}
                </div>

                <div className="mb-5 grid grid-cols-2 gap-4 text-xs font-semibold">
                  <div>
                    <p className="text-on-surface-variant/70">Stage</p>
                    <p className="mt-1 text-deep-charcoal">{candidate.stage}</p>
                  </div>
                  <div>
                    <p className="text-on-surface-variant/70">Last Activity</p>
                    <p className="mt-1 text-deep-charcoal">{candidate.lastActivity}</p>
                  </div>
                </div>

                <div className="mt-auto grid grid-cols-2 gap-3">
                  <button
                    className={`h-10 rounded-lg border border-teal-command text-sm font-semibold text-teal-command transition hover:bg-teal-command/5 ${active ? 'bg-teal-command/5' : ''}`}
                    type="button"
                  >
                    View Profile
                  </button>
                  <button
                    className="h-10 rounded-lg bg-teal-command text-sm font-semibold text-white transition hover:bg-primary active:scale-[0.98]"
                    type="button"
                  >
                    Add to Campaign
                  </button>
                </div>
              </article>
            );
          })}
        </section>

        {visibleCandidates.length === 0 ? (
          <section className="rounded-lg border border-border-warm bg-clean-surface px-6 py-12 text-center">
            <p className="text-sm font-semibold text-deep-charcoal">
              No candidates match the current filters.
            </p>
            <p className="mt-1 text-sm text-slate-ink">
              Clear filters or broaden the search query.
            </p>
          </section>
        ) : null}
      </main>

      <aside className="min-w-0 rounded-lg border border-border-warm bg-parchment-lift shadow-lg xl:sticky xl:top-6 xl:self-start">
        <div className="flex items-center justify-between p-5">
          <h2 className="text-xl font-bold text-deep-charcoal">Profile Summary</h2>
          <button
            className="rounded-full p-1.5 text-on-surface-variant transition hover:bg-surface-container hover:text-deep-charcoal"
            onClick={() => setSelectedId('')}
            type="button"
          >
            <span className="sr-only">Close profile summary</span>
            <Icon className="h-4 w-4" name="close" />
          </button>
        </div>

        {selected ? (
          <>
            <div className="px-6 pb-6">
              <div className="mb-8 flex flex-col items-center text-center">
                <div className="mb-4 flex h-24 w-24 items-center justify-center overflow-hidden rounded-full border-4 border-white bg-clean-surface text-2xl font-bold text-teal-command shadow-md">
                  {selected.photo ? (
                    <img
                      alt={`${selected.name} profile`}
                      className="h-full w-full object-cover"
                      src={selected.photo}
                    />
                  ) : (
                    selected.initials
                  )}
                </div>
                <h3 className="text-2xl font-bold text-deep-charcoal">{selected.name}</h3>
                <p className="mb-2 font-semibold text-teal-command">{selected.title}</p>
                <span className="rounded-full bg-teal-command px-3 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-white">
                  CV {selected.parseStatus}
                </span>
              </div>

              <div className="space-y-6">
                <section className="space-y-3 rounded-lg border border-border-warm bg-clean-surface p-4 shadow-sm">
                  {[
                    { icon: 'mail', value: selected.email },
                    { icon: 'phone', value: selected.phone },
                    { icon: 'location', value: selected.location },
                  ].map((item) => (
                    <div className="flex items-center gap-3" key={item.icon}>
                      <Icon className="h-4 w-4 text-teal-command/70" name={item.icon} />
                      <span className="text-sm font-semibold text-deep-charcoal">{item.value}</span>
                    </div>
                  ))}
                </section>

                <section>
                  <h4 className="mb-3 text-xs font-bold uppercase tracking-[0.14em] text-on-surface-variant">
                    Structured Skills
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {selected.skills.map((skill) => (
                      <span
                        className="rounded-lg border border-border-warm bg-white px-3 py-1.5 text-sm font-semibold text-deep-charcoal"
                        key={skill}
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </section>

                <section>
                  <h4 className="mb-3 text-xs font-bold uppercase tracking-[0.14em] text-on-surface-variant">
                    Recent Applications
                  </h4>
                  <div className="overflow-hidden rounded-lg border border-border-warm bg-white shadow-sm">
                    <div className="flex items-center justify-between gap-3 p-3">
                      <div>
                        <p className="text-sm font-bold text-deep-charcoal">{selected.title}</p>
                        <p className="text-xs text-on-surface-variant">TechCorp Inc.</p>
                      </div>
                      <span className="rounded bg-pending/5 px-2 py-1 text-[11px] font-bold text-pending">
                        Ongoing
                      </span>
                    </div>
                  </div>
                </section>

                <section className="flex gap-3 rounded-lg border border-border-warm bg-surface-container-high p-4">
                  <Icon className="h-5 w-5 text-revision" name="lock" />
                  <p className="text-xs leading-5 text-on-surface-variant">
                    Candidate assignment requires approved request and approved overall plan.
                  </p>
                </section>
              </div>
            </div>

            <footer className="space-y-4 border-t border-border-warm bg-workflow-ivory p-6">
              <div className="flex items-start gap-2">
                <Icon className="mt-0.5 h-4 w-4 text-on-surface-variant" name="shield" />
                <p className="text-[11px] leading-5 text-on-surface-variant">
                  Privacy Note: Data encrypted and stored according to GDPR/local compliance.
                </p>
              </div>
              <button
                className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-teal-command font-bold text-white transition hover:bg-primary active:scale-[0.98]"
                type="button"
              >
                <Icon className="h-4 w-4" name="send" />
                Add to Campaign
              </button>
            </footer>
          </>
        ) : (
          <div className="px-6 pb-8 text-center">
            <p className="text-sm font-semibold text-deep-charcoal">Select a candidate</p>
            <p className="mt-1 text-sm text-slate-ink">
              Choose a card to inspect parsed profile data.
            </p>
          </div>
        )}
      </aside>
    </div>
  );
};
