import React, { useMemo, useState } from 'react';

type RecordingStatus = 'Pending Recording' | 'Recorded';
type Recommendation = 'Recommend Hire' | 'Recommend Reject' | 'Hold for Further';

type CompletedInterview = {
  id: string;
  candidate: string;
  role: string;
  department: string;
  time: string;
  status: RecordingStatus;
};

type PanelFeedback = {
  id: string;
  member: string;
  role: string;
  initials: string;
  decision: 'PASS' | 'FAIL';
  technical: number;
  communication: number;
  culture: number;
  notes: string;
};

const completedInterviews: CompletedInterview[] = [
  {
    id: 'RR-042',
    candidate: 'Nguyen Van A',
    role: 'Senior Backend Developer',
    department: 'IT Dept',
    time: 'May 28, 14:00',
    status: 'Pending Recording',
  },
  {
    id: 'RR-041',
    candidate: 'Sarah Jenkins',
    role: 'UI/UX Designer',
    department: 'Product',
    time: 'May 28, 11:30',
    status: 'Recorded',
  },
  {
    id: 'RR-040',
    candidate: 'David Miller',
    role: 'DevOps Engineer',
    department: 'IT Dept',
    time: 'May 28, 09:00',
    status: 'Pending Recording',
  },
  {
    id: 'RR-039',
    candidate: 'Marcus Vane',
    role: 'Senior Frontend Developer',
    department: 'Engineering',
    time: 'May 27, 16:30',
    status: 'Recorded',
  },
  {
    id: 'RR-038',
    candidate: 'Elena Fisher',
    role: 'UX Researcher',
    department: 'Product',
    time: 'May 27, 10:00',
    status: 'Pending Recording',
  },
  {
    id: 'RR-037',
    candidate: 'Hoang Bao Minh',
    role: 'Platform Engineer',
    department: 'IT Dept',
    time: 'May 26, 15:00',
    status: 'Recorded',
  },
];

const initialFeedback: PanelFeedback[] = [
  {
    id: 'james',
    member: 'James Wilson',
    role: 'Engineering Lead',
    initials: 'JW',
    decision: 'PASS',
    technical: 8,
    communication: 7,
    culture: 9,
    notes: 'Strong backend depth and system design clarity. Needs a short follow-up on ownership style in incident response.',
  },
  {
    id: 'sophia',
    member: 'Sophia Tan',
    role: 'Product Head',
    initials: 'ST',
    decision: 'FAIL',
    technical: 6,
    communication: 6,
    culture: 5,
    notes: 'Good technical vocabulary, but examples felt less aligned with cross-functional product tradeoffs.',
  },
];

const iconPaths: Record<string, React.ReactNode> = {
  groups: <path d="M17 21a5 5 0 0 0-10 0M21 21a4 4 0 0 0-5-3.9M3 21a4 4 0 0 1 5-3.9M12 13a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm5-1a3 3 0 1 0 0-6m-10 6a3 3 0 1 1 0-6" />,
  verified: <path d="m9 12 2 2 4-5m6 3a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />,
  upload: <path d="M12 16V4m0 0 4 4m-4-4-4 4M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" />,
  check: <path d="M20 6 9 17l-5-5" />,
  x: <path d="M18 6 6 18M6 6l12 12" />,
  hold: <path d="M12 6v6l4 2m5-2a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />,
  search: <path d="m21 21-4.3-4.3M10.8 18a7.2 7.2 0 1 1 0-14.4 7.2 7.2 0 0 1 0 14.4Z" />,
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

const statusClass: Record<RecordingStatus, string> = {
  'Pending Recording': 'border-revision/20 bg-revision/10 text-revision',
  Recorded: 'border-approved/20 bg-approved/10 text-approved',
};

const recommendationOptions: Array<{ label: Recommendation; icon: string; tone: string }> = [
  { label: 'Recommend Hire', icon: 'check', tone: 'peer-checked:border-approved peer-checked:bg-approved/5 peer-checked:ring-approved text-approved' },
  { label: 'Recommend Reject', icon: 'x', tone: 'peer-checked:border-rejected peer-checked:bg-rejected/5 peer-checked:ring-rejected text-rejected' },
  { label: 'Hold for Further', icon: 'hold', tone: 'peer-checked:border-teal-command peer-checked:bg-teal-command/5 peer-checked:ring-teal-command text-pending' },
];

export const HRInterviewResults: React.FC = () => {
  const [selectedId, setSelectedId] = useState('RR-042');
  const [query, setQuery] = useState('');
  const [recommendation, setRecommendation] = useState<Recommendation>('Hold for Further');
  const [feedback, setFeedback] = useState(initialFeedback);

  const selectedInterview = useMemo(
    () => completedInterviews.find((interview) => interview.id === selectedId) ?? completedInterviews[0],
    [selectedId],
  );

  const filteredInterviews = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return completedInterviews;
    return completedInterviews.filter((interview) =>
      [interview.candidate, interview.role, interview.department, interview.status].some((value) => value.toLowerCase().includes(normalized)),
    );
  }, [query]);

  const updateScore = (id: string, key: 'technical' | 'communication' | 'culture', value: number) => {
    setFeedback((items) => items.map((item) => (item.id === id ? { ...item, [key]: value } : item)));
  };

  const updateDecision = (id: string, decision: 'PASS' | 'FAIL') => {
    setFeedback((items) => items.map((item) => (item.id === id ? { ...item, decision } : item)));
  };

  return (
    <div className="mx-auto max-w-[1440px] space-y-6">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-teal-command">HR Manager Portal</p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-deep-charcoal">Interview Results</h1>
          <p className="mt-1 max-w-[72ch] text-sm leading-6 text-slate-ink">
            Record panel feedback, final recommendation, and supporting evidence after completed interviews.
          </p>
        </div>
        <div className="relative w-full max-w-md">
          <Icon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-ink" name="search" />
          <input
            className="h-10 w-full rounded-lg border border-border-warm bg-clean-surface pl-10 pr-4 text-sm outline-none focus:border-teal-command focus:ring-2 focus:ring-teal-command/20"
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search results, candidates, or panels..."
            type="text"
            value={query}
          />
        </div>
      </header>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[380px_minmax(0,1fr)]">
        <aside className="overflow-hidden rounded-lg border border-border-warm bg-clean-surface shadow-sm xl:sticky xl:top-24">
          <div className="flex items-center justify-between border-b border-border-warm bg-workflow-ivory/60 p-4">
            <h2 className="text-xs font-bold uppercase tracking-[0.14em] text-slate-ink">Completed Interviews</h2>
            <span className="text-sm font-semibold text-teal-command">{filteredInterviews.length} Total</span>
          </div>
          <div className="max-h-[720px] space-y-2 overflow-y-auto p-2">
            {filteredInterviews.map((interview) => {
              const selected = interview.id === selectedId;
              return (
                <button
                  className={`w-full rounded-lg p-4 text-left transition active:scale-[0.99] ${
                    selected
                      ? 'border-l-4 border-teal-command bg-teal-command/5'
                      : 'border border-transparent hover:border-border-warm hover:bg-workflow-ivory'
                  }`}
                  key={interview.id}
                  onClick={() => setSelectedId(interview.id)}
                  type="button"
                >
                  <div className="mb-1 flex items-start justify-between gap-3">
                    <h3 className="text-sm font-bold text-deep-charcoal">{interview.candidate}</h3>
                    <span className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2 py-1 text-[11px] font-semibold ${statusClass[interview.status]}`}>
                      <span className="h-1.5 w-1.5 rounded-full bg-current" />
                      {interview.status}
                    </span>
                  </div>
                  <p className="mb-2 text-sm text-slate-ink">{interview.role}</p>
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-mono text-xs text-slate-ink">{interview.time}</span>
                    <span className="text-[11px] font-bold uppercase tracking-[0.08em] text-draft">{interview.department}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </aside>

        <main className="overflow-hidden rounded-lg border border-border-warm bg-clean-surface shadow-sm">
          <div className="border-b border-border-warm bg-workflow-ivory/40 p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h2 className="text-xl font-semibold text-deep-charcoal">Record Results - {selectedInterview.candidate}</h2>
                <p className="mt-1 text-sm font-semibold text-teal-command">{selectedInterview.role}</p>
              </div>
              <div className="sm:text-right">
                <span className="mb-1 block text-xs font-bold uppercase tracking-[0.14em] text-slate-ink">Reference ID</span>
                <span className="rounded bg-surface-container-low px-2 py-1 font-mono text-sm text-deep-charcoal">#{selectedInterview.id}</span>
              </div>
            </div>
          </div>

          <div className="space-y-8 p-6">
            <section>
              <h3 className="mb-4 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] text-slate-ink">
                <Icon className="h-4 w-4" name="groups" />
                Panel Members Feedback
              </h3>
              <div className="space-y-5">
                {feedback.map((item) => (
                  <article className="rounded-lg border border-border-warm bg-workflow-ivory/20 p-4" key={item.id}>
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-surface-container font-mono text-xs font-bold text-teal-command">
                        {item.initials}
                      </div>
                      <div className="min-w-0 flex-1 space-y-4">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                          <select
                            className="w-full rounded-lg border border-transparent bg-transparent p-0 text-sm font-bold text-deep-charcoal outline-none focus:border-border-warm focus:bg-clean-surface sm:w-auto"
                            defaultValue={`${item.member} (${item.role})`}
                          >
                            <option>{item.member} ({item.role})</option>
                            <option>James Wilson (Engineering Lead)</option>
                            <option>Sophia Tan (Product Head)</option>
                            <option>Michael Scott (HR Generalist)</option>
                          </select>
                          <div className="flex w-fit rounded-lg bg-surface-container-high p-1">
                            {(['PASS', 'FAIL'] as const).map((decision) => (
                              <button
                                className={`rounded-md px-3 py-1 text-[11px] font-bold transition active:scale-[0.98] ${
                                  item.decision === decision
                                    ? decision === 'PASS'
                                      ? 'bg-approved text-white shadow-sm'
                                      : 'bg-rejected text-white shadow-sm'
                                    : 'text-slate-ink hover:bg-white'
                                }`}
                                key={decision}
                                onClick={() => updateDecision(item.id, decision)}
                                type="button"
                              >
                                {decision}
                              </button>
                            ))}
                          </div>
                        </div>

                        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                          {([
                            ['technical', 'Technical'],
                            ['communication', 'Communication'],
                            ['culture', 'Culture Fit'],
                          ] as const).map(([key, label]) => (
                            <label className="space-y-2" key={key}>
                              <span className="block text-[11px] font-bold uppercase tracking-[0.08em] text-slate-ink">
                                {label} ({item[key]}/10)
                              </span>
                              <input
                                className="h-1 w-full cursor-pointer accent-teal-command"
                                max="10"
                                min="0"
                                onChange={(event) => updateScore(item.id, key, Number(event.target.value))}
                                type="range"
                                value={item[key]}
                              />
                            </label>
                          ))}
                        </div>

                        <textarea
                          className="min-h-[88px] w-full rounded-lg border border-border-warm bg-clean-surface p-3 text-sm leading-6 outline-none focus:border-teal-command focus:ring-2 focus:ring-teal-command/20"
                          defaultValue={item.notes}
                          placeholder="Panel member observations..."
                        />
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </section>

            <section className="space-y-6 border-t border-border-warm pt-8">
              <h3 className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] text-slate-ink">
                <Icon className="h-4 w-4" name="verified" />
                Final Recommendation
              </h3>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                {recommendationOptions.map((option) => (
                  <label className="cursor-pointer" key={option.label}>
                    <input
                      checked={recommendation === option.label}
                      className="peer hidden"
                      name="recommendation"
                      onChange={() => setRecommendation(option.label)}
                      type="radio"
                    />
                    <div className={`rounded-lg border border-border-warm p-4 text-center ring-1 ring-transparent transition ${option.tone}`}>
                      <Icon className="mx-auto mb-2 h-6 w-6" name={option.icon} />
                      <p className="text-sm font-bold text-deep-charcoal">{option.label}</p>
                    </div>
                  </label>
                ))}
              </div>

              <label className="block space-y-2">
                <span className="text-sm font-bold text-slate-ink">Executive Summary Notes</span>
                <textarea
                  className="min-h-[120px] w-full rounded-lg border border-border-warm bg-clean-surface p-4 text-sm leading-6 outline-none focus:border-teal-command focus:ring-2 focus:ring-teal-command/20"
                  placeholder="Provide a high-level justification for the recommendation..."
                />
              </label>

              <section className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-border-warm bg-workflow-ivory/40 p-8 text-center">
                <Icon className="mb-2 h-8 w-8 text-outline" name="upload" />
                <p className="mb-1 text-sm font-bold text-deep-charcoal">Attach supporting documents</p>
                <p className="text-sm text-slate-ink">PDF, DOCX up to 10MB each</p>
                <button className="mt-4 rounded-lg border border-border-warm bg-white px-4 py-2 text-sm font-semibold shadow-sm transition hover:bg-surface active:scale-[0.98]" type="button">
                  Browse Files
                </button>
              </section>
            </section>
          </div>

          <footer className="flex flex-col gap-3 border-t border-border-warm bg-clean-surface p-5 sm:flex-row sm:items-center sm:justify-between">
            <button className="text-sm font-semibold text-slate-ink transition hover:text-deep-charcoal" type="button">
              Cancel
            </button>
            <div className="flex flex-col gap-3 sm:flex-row">
              <button className="rounded-lg border border-teal-command px-6 py-2.5 text-sm font-semibold text-teal-command transition hover:bg-teal-command/5 active:scale-[0.98]" type="button">
                Save as Draft
              </button>
              <button className="rounded-lg bg-teal-command px-8 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-primary active:scale-[0.98]" type="button">
                Submit to Admin for Decision
              </button>
            </div>
          </footer>
        </main>
      </div>
    </div>
  );
};
