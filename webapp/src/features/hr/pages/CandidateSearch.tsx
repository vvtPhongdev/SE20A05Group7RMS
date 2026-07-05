import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { apiRequest } from '../../../lib/api';
import { HRCard, HRInlineAlert, HRPageHeader } from '../components';

type SearchResult = {
  id: string;
  name: string;
  title: string;
  similarity: number;
  rank: number;
  scores: {
    overallScore: number;
    vectorScore: number;
    graphScore: number;
    coverageScore: number;
    feedbackScore?: number;
  };
  parsed: string;
  evidence: React.ReactNode;
  matchExplanation?: {
    assessment: string;
    scoreBand: string;
    scoreDrivers: string[];
    matchedSkills: Array<{ skill: string; confidence: number; source: string; distance?: number }>;
    gaps: Array<{ skill: string; gapType: string; severity: string }>;
    note: string;
  };
  skills: string[];
  hasInterviewInvite: boolean;
};

const iconPaths: Record<string, React.ReactNode> = {
  lock: <path d="M7 11V8a5 5 0 0 1 10 0v3M6 11h12v9H6z" />,
  search: <path d="m21 21-4.3-4.3M10.8 18a7.2 7.2 0 1 1 0-14.4 7.2 7.2 0 0 1 0 14.4Z" />,
  sort: <path d="M8 7h12M8 12h8M8 17h4M4 7h.01M4 12h.01M4 17h.01" />,
  filter: <path d="M4 6h16M7 12h10M10 18h4" />,
  user: <path d="M20 21a8 8 0 0 0-16 0m12-13a4 4 0 1 1-8 0 4 4 0 0 1 8 0Z" />,
  history: <path d="M3 12a9 9 0 1 0 3-6.7M3 4v5h5m4-2v6l4 2" />,
  database: (
    <path d="M4 6c0-1.7 3.6-3 8-3s8 1.3 8 3-3.6 3-8 3-8-1.3-8-3Zm0 0v6c0 1.7 3.6 3 8 3s8-1.3 8-3V6M4 12v6c0 1.7 3.6 3 8 3s8-1.3 8-3v-6" />
  ),
  warning: (
    <path d="M12 9v4m0 4h.01M10.3 3.9 2.8 17a2 2 0 0 0 1.7 3h15a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" />
  ),
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

export const CandidateSearch: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const requestedCampaignId = searchParams.get('requestId') ?? '';
  const { token } = useAuth();
  const [campaign, setCampaign] = useState('');
  const [query, setQuery] = useState('');
  const [locked, setLocked] = useState(true);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [campaigns, setCampaigns] = useState<Array<{ requestId: string; label: string }>>([]);
  const [expandedTerms, setExpandedTerms] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState('');
  const [viewingCvId, setViewingCvId] = useState('');
  const [actionMessage, setActionMessage] = useState('');
  const [searchRunId, setSearchRunId] = useState('');
  const [scheduleCandidate, setScheduleCandidate] = useState<SearchResult | null>(null);
  const [scheduleAt, setScheduleAt] = useState('');
  const [scheduleDuration, setScheduleDuration] = useState('60');
  const [scheduleLocation, setScheduleLocation] = useState('');
  const [scheduleSubmitting] = useState(false);

  useEffect(() => {
    type JobPosting = {
      requestId: string;
      title: string;
      status: string;
      request?: { position: string } | null;
    };
    const loadCampaigns = async () => {
      try {
        const response = await apiRequest<JobPosting[]>('/job-postings', token);
        const mapped = response.map((posting) => ({
          requestId: posting.requestId,
          label: `${posting.title || posting.request?.position || 'Recruitment campaign'} (${posting.status})`,
        }));
        setCampaigns(mapped);
        setCampaign(
          requestedCampaignId &&
            mapped.some((campaign) => campaign.requestId === requestedCampaignId)
            ? requestedCampaignId
            : mapped[0]?.requestId ?? '',
        );
        setLocked(mapped.length === 0);
      } catch (loadError) {
        setApiError(loadError instanceof Error ? loadError.message : 'Unable to load campaigns');
      }
    };
    void loadCampaigns();
  }, [requestedCampaignId, token]);

  const handleSearch = async () => {
    if (!campaign) return;
    setLoading(true);
    setApiError('');
    try {
      const response = await apiRequest<{
        data: Array<{
          candidateProfileId: string;
          overallScore: number;
          vectorScore: number;
          graphScore: number;
          coverageScore: number;
          feedbackScore?: number;
          baseOverallScore?: number;
          displayName: string;
          headline?: string | null;
          readinessLabel: string;
          matchExplanation?: SearchResult['matchExplanation'];
          skills: string[];
          latestCv?: { parsedAt?: string | null } | null;
          hasInterviewInvite?: boolean;
          latestInterview?: { status?: string | null; scheduledAt?: string | null } | null;
        }>;
        meta: {
          searchRunId: string | null;
          expandedQuery: { expandedSkills: string[] };
          query?: { source?: string };
        };
      }>('/talent/search', token, {
        method: 'POST',
        body: JSON.stringify({
          query,
          filters: { requestId: campaign },
          pagination: { page: 1, pageSize: 20 },
        }),
      });
      setResults(
        response.data.map((result, index) => ({
          id: result.candidateProfileId,
          name: result.displayName,
          title: result.headline || 'Candidate',
          similarity: Math.round(result.overallScore * 100),
          rank: index + 1,
          scores: {
            overallScore: result.overallScore,
            vectorScore: result.vectorScore,
            graphScore: result.graphScore,
            coverageScore: result.coverageScore,
            feedbackScore: result.feedbackScore,
          },
          parsed: result.latestCv?.parsedAt
            ? `Parsed ${new Date(result.latestCv.parsedAt).toLocaleString()}`
            : 'CV parsing date unavailable',
          evidence:
            result.matchExplanation?.assessment ?? result.readinessLabel.replaceAll('_', ' '),
          matchExplanation: result.matchExplanation,
          skills: result.skills,
          hasInterviewInvite: Boolean(result.hasInterviewInvite || result.latestInterview),
        })),
      );
      setSearchRunId(response.meta.searchRunId ?? '');
      setExpandedTerms(response.meta.expandedQuery.expandedSkills);
    } catch (searchError) {
      setApiError(searchError instanceof Error ? searchError.message : 'Candidate search failed');
    } finally {
      setLoading(false);
    }
  };

  const recordFeedback = async (
    result: SearchResult,
    action: 'VIEW_CV' | 'MARK_REVIEW' | 'SCHEDULE_INTERVIEW',
    metadata: Record<string, unknown> = {},
  ) => {
    if (!searchRunId) return;
    try {
      await apiRequest('/talent/feedback', token, {
        method: 'POST',
        body: JSON.stringify({
          searchRunId,
          candidateId: result.id,
          action,
          rank: result.rank,
          scores: result.scores,
          candidateSnapshot: {
            displayName: result.name,
            headline: result.title,
            skills: result.skills,
          },
          metadata,
        }),
      });
    } catch (feedbackError) {
      console.warn('Unable to record talent search feedback', feedbackError);
    }
  };

  const openScheduleForm = (result: SearchResult) => {
    if (result.hasInterviewInvite) {
      setActionMessage(`Interview invite has already been sent to ${result.name}.`);
      return;
    }

    navigate(
      `/hr/interviews?requestId=${encodeURIComponent(campaign)}&candidateId=${encodeURIComponent(result.id)}`,
    );
  };

  const createInterviewSchedule = async () => {
    if (!scheduleCandidate || !campaign) return;
    navigate(
      `/hr/interviews?requestId=${encodeURIComponent(campaign)}&candidateId=${encodeURIComponent(scheduleCandidate.id)}`,
    );
  };

  const handleViewCv = async (result: SearchResult) => {
    setViewingCvId(result.id);
    setApiError('');
    void recordFeedback(result, 'VIEW_CV', { source: 'candidate_search' });
    try {
      const headers = new Headers();
      if (token) {
        headers.set('Authorization', `Bearer ${token}`);
      }
      const response = await fetch(`/api/v1/candidate/cvs/candidate/${result.id}/latest/file`, {
        headers,
      });
      if (!response.ok) {
        const error = await response.json().catch(() => null);
        throw new Error(error?.message || `Unable to open CV (${response.status})`);
      }

      const blobUrl = URL.createObjectURL(await response.blob());
      const opened = window.open(blobUrl, '_blank');
      if (!opened) {
        const link = document.createElement('a');
        link.href = blobUrl;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        link.click();
      }
      window.setTimeout(() => URL.revokeObjectURL(blobUrl), 60_000);
    } catch (viewError) {
      setApiError(viewError instanceof Error ? viewError.message : 'Unable to open candidate CV');
    } finally {
      setViewingCvId('');
    }
  };

  const averageSimilarity = results.length
    ? Math.round(results.reduce((total, result) => total + result.similarity, 0) / results.length)
    : 0;
  const kpis = [
    {
      label: 'Matched Candidates',
      value: String(results.length),
      helper: 'current query',
      tone: 'text-deep-charcoal',
    },
    {
      label: 'Avg. Similarity',
      value: `${averageSimilarity}%`,
      helper: 'semantic match',
      tone: 'text-teal-command',
    },
    {
      label: 'Campaigns',
      value: String(campaigns.length),
      helper: 'available',
      tone: 'text-deep-charcoal',
    },
    {
      label: 'Expanded Skills',
      value: String(expandedTerms.length),
      helper: 'knowledge graph',
      tone: 'text-revision',
    },
  ];

  const visibleResults = results;

  return (
    <div className="mx-auto grid max-w-[1440px] gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
      <main className="min-w-0 space-y-6">
        <HRPageHeader
          eyebrow="HR Manager Portal"
          title="CV Screening"
          description="Use AI search evidence to screen only candidates already collected for or applied to the selected campaign."
        />

        {locked ? (
          <section className="flex items-center gap-3 rounded-lg border border-error/20 bg-error-container px-4 py-3 text-on-error-container">
            <Icon className="h-5 w-5" name="lock" />
            <span className="text-sm font-semibold">
              Search disabled until request and overall plan are approved.
            </span>
            <span className="ml-auto text-xs font-bold">Select an available campaign</span>
          </section>
        ) : null}

        <HRCard className="relative overflow-hidden rounded-lg p-6 shadow-sm">
          <div className="pointer-events-none absolute inset-0 opacity-[0.035] [background-image:radial-gradient(#0D9488_1px,transparent_1px)] [background-size:24px_24px]" />
          <div className="relative space-y-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <label className="flex flex-col gap-1">
                <span className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-ink">
                  Active Campaign
                </span>
                <select
                  className="h-10 min-w-[280px] rounded-lg border border-border-warm bg-workflow-ivory px-3 text-sm outline-none focus:border-teal-command focus:ring-2 focus:ring-teal-command/20"
                  onChange={(event) => setCampaign(event.target.value)}
                  value={campaign}
                >
                  {campaigns.map((item) => (
                    <option key={item.requestId} value={item.requestId}>
                      {item.label}
                    </option>
                  ))}
                </select>
              </label>
              <span className="inline-flex w-fit items-center gap-2 rounded-full border border-border-warm bg-surface-container-high px-3 py-1.5 text-xs font-semibold text-slate-ink">
                <span
                  className={`h-2 w-2 rounded-full ${locked ? 'bg-revision' : 'bg-approved'}`}
                />
                {locked ? 'No Campaign' : 'Campaign Selected'}
              </span>
            </div>

            <label className="block space-y-2">
              <span className="text-sm font-semibold text-deep-charcoal">
                Natural Language Semantic Search
              </span>
              <p className="text-xs leading-5 text-on-surface-variant">
                Results are limited to candidates already in this campaign through CV Collection or
                candidate self-application.
              </p>
              <div className="relative">
                <textarea
                  className="w-full resize-none rounded-lg border border-border-warm bg-workflow-ivory p-4 pr-40 text-sm outline-none transition placeholder:text-slate-ink/40 focus:border-teal-command focus:ring-2 focus:ring-teal-command/20"
                  disabled={locked}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="backend developer with Go, PostgreSQL, Redis, and distributed systems experience in fintech"
                  rows={3}
                  value={query}
                />
                <div className="absolute bottom-4 right-4 flex items-center gap-3">
                  <span className="hidden text-xs italic text-slate-ink sm:inline">
                    Ctrl + Enter
                  </span>
                  <button
                    className={`inline-flex h-10 items-center gap-2 rounded-lg px-5 text-sm font-semibold text-white transition active:scale-[0.98] ${
                      locked
                        ? 'cursor-not-allowed bg-teal-command/50'
                        : 'bg-teal-command hover:bg-primary'
                    }`}
                    disabled={locked}
                    onClick={() => void handleSearch()}
                    type="button"
                  >
                    <Icon className="h-4 w-4" name="search" />
                    {loading ? 'Searching...' : 'Search'}
                  </button>
                </div>
              </div>
            </label>
          </div>
        </HRCard>

        {apiError ? <HRInlineAlert>{apiError}</HRInlineAlert> : null}

        {actionMessage ? <HRInlineAlert tone="teal">{actionMessage}</HRInlineAlert> : null}

        {scheduleCandidate ? (
          <section className="rounded-lg border border-border-warm bg-clean-surface p-5 shadow-sm">
            <div className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-ink">
                  Schedule Interview
                </p>
                <h2 className="text-lg font-semibold text-deep-charcoal">
                  {scheduleCandidate.name}
                </h2>
                <p className="text-sm text-on-surface-variant">{scheduleCandidate.title}</p>
              </div>
              <button
                className="h-9 rounded-lg border border-border-warm px-4 text-sm font-semibold transition hover:bg-workflow-ivory"
                onClick={() => setScheduleCandidate(null)}
                type="button"
              >
                Cancel
              </button>
            </div>
            <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_120px]">
              <label className="block">
                <span className="mb-1 block text-xs font-semibold uppercase tracking-[0.14em] text-slate-ink">
                  Time
                </span>
                <input
                  className="h-10 w-full rounded-lg border border-border-warm bg-workflow-ivory px-3 text-sm outline-none focus:border-teal-command focus:ring-2 focus:ring-teal-command/20"
                  min={new Date().toISOString().slice(0, 16)}
                  onChange={(event) => setScheduleAt(event.target.value)}
                  type="datetime-local"
                  value={scheduleAt}
                />
              </label>
              <label className="block">
                <span className="mb-1 block text-xs font-semibold uppercase tracking-[0.14em] text-slate-ink">
                  Minutes
                </span>
                <input
                  className="h-10 w-full rounded-lg border border-border-warm bg-workflow-ivory px-3 text-sm outline-none focus:border-teal-command focus:ring-2 focus:ring-teal-command/20"
                  min="15"
                  onChange={(event) => setScheduleDuration(event.target.value)}
                  type="number"
                  value={scheduleDuration}
                />
              </label>
              <label className="block md:col-span-2">
                <span className="mb-1 block text-xs font-semibold uppercase tracking-[0.14em] text-slate-ink">
                  Location
                </span>
                <input
                  className="h-10 w-full rounded-lg border border-border-warm bg-workflow-ivory px-3 text-sm outline-none focus:border-teal-command focus:ring-2 focus:ring-teal-command/20"
                  onChange={(event) => setScheduleLocation(event.target.value)}
                  placeholder="Meeting room or online interview link"
                  value={scheduleLocation}
                />
              </label>
            </div>
            <div className="mt-4 flex justify-end">
              <button
                className="h-10 rounded-lg bg-teal-command px-5 text-sm font-semibold text-white transition hover:bg-primary active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
                disabled={
                  !scheduleAt ||
                  !scheduleLocation.trim() ||
                  Number(scheduleDuration) < 15 ||
                  scheduleSubmitting
                }
                onClick={() => void createInterviewSchedule()}
                type="button"
              >
                {scheduleSubmitting ? 'Scheduling...' : 'Schedule Interview'}
              </button>
            </div>
          </section>
        ) : null}

        <section
          className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4"
          aria-label="Candidate search metrics"
        >
          {kpis.map((kpi) => (
            <HRCard as="section" className="rounded-lg p-4 shadow-sm" key={kpi.label}>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-ink">
                {kpi.label}
              </p>
              <div className="mt-2 flex items-baseline gap-2">
                <span className={`font-mono text-2xl font-bold ${kpi.tone}`}>{kpi.value}</span>
                <span className="text-xs font-semibold text-approved">{kpi.helper}</span>
              </div>
            </HRCard>
          ))}
        </section>

        <section className="space-y-4">
          <div className="flex flex-col gap-3 px-2 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-xl font-semibold text-deep-charcoal">
              Ranked Match Results ({visibleResults.length})
            </h2>
            <div className="flex items-center gap-4">
              <button
                className="inline-flex items-center gap-2 text-sm font-semibold text-slate-ink transition hover:text-teal-command"
                type="button"
              >
                <Icon className="h-4 w-4" name="sort" />
                Relevance
              </button>
              <button
                className="inline-flex items-center gap-2 text-sm font-semibold text-slate-ink transition hover:text-teal-command"
                type="button"
              >
                <Icon className="h-4 w-4" name="filter" />
                Filters
              </button>
            </div>
          </div>

          {visibleResults.map((result) => (
            <article
              className="rounded-lg border border-border-warm bg-clean-surface p-6 transition hover:border-teal-command/30 hover:shadow-sm"
              key={result.id}
            >
              <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex gap-4">
                  <div className="flex h-14 w-14 items-center justify-center rounded-lg border border-border-warm bg-parchment-lift text-teal-command">
                    <Icon className="h-8 w-8" name="user" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-deep-charcoal">{result.name}</h3>
                    <p className="text-sm text-slate-ink">
                      {result.title} / <span className="font-mono text-xs">{result.id}</span>
                    </p>
                  </div>
                </div>
                <div className="sm:text-right">
                  <div className="mb-1 flex items-center gap-2 font-bold text-teal-command sm:justify-end">
                    <span className="text-sm font-semibold text-slate-ink">Similarity</span>
                    <span className="text-xl">{result.similarity}%</span>
                  </div>
                  <div className="h-1.5 w-32 overflow-hidden rounded-full bg-surface-container">
                    <div
                      className="h-full rounded-full bg-teal-command"
                      style={{ width: `${result.similarity}%` }}
                    />
                  </div>
                </div>
              </div>

              <div className="mb-6 grid grid-cols-1 gap-6 md:grid-cols-3">
                <div className="space-y-2 md:col-span-2">
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-ink">
                    AI Assessment
                  </p>
                  <p className="text-sm leading-6 text-on-surface-variant">{result.evidence}</p>
                  {result.matchExplanation ? (
                    <p className="text-xs leading-5 text-on-surface-variant">
                      Comparable score band: {result.matchExplanation.scoreBand}.{' '}
                      {result.matchExplanation.note}
                    </p>
                  ) : null}
                </div>
                <div className="space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-ink">
                    Skill Matching
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {result.skills.slice(0, 4).map((skill) => (
                      <span
                        className="rounded bg-surface-container-high px-2 py-1 font-mono text-xs font-semibold text-slate-ink"
                        key={skill}
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {result.matchExplanation ? (
                <div className="mb-6 grid gap-4 rounded-lg border border-border-warm bg-workflow-ivory p-4 lg:grid-cols-3">
                  <div>
                    <p className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-slate-ink">
                      Score Drivers
                    </p>
                    <ul className="space-y-1 text-xs leading-5 text-on-surface-variant">
                      {result.matchExplanation.scoreDrivers.map((driver) => (
                        <li key={driver}>{driver}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <p className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-slate-ink">
                      Matched Requirements
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {result.matchExplanation.matchedSkills.length ? (
                        result.matchExplanation.matchedSkills.slice(0, 6).map((match) => (
                          <span
                            className="rounded bg-teal-command/10 px-2 py-1 text-xs font-semibold text-teal-command"
                            key={`${match.skill}-${match.source}`}
                          >
                            {match.skill} {Math.round(match.confidence * 100)}%
                          </span>
                        ))
                      ) : (
                        <span className="text-xs text-on-surface-variant">No strong skill evidence.</span>
                      )}
                    </div>
                  </div>
                  <div>
                    <p className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-slate-ink">
                      Remaining Gaps
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {result.matchExplanation.gaps.length ? (
                        result.matchExplanation.gaps.slice(0, 6).map((gap) => (
                          <span
                            className={`rounded px-2 py-1 text-xs font-semibold ${
                              gap.severity === 'CRITICAL'
                                ? 'bg-rejected/10 text-rejected'
                                : gap.severity === 'MODERATE'
                                  ? 'bg-revision/10 text-revision'
                                  : 'bg-surface-container-high text-slate-ink'
                            }`}
                            key={`${gap.skill}-${gap.severity}`}
                          >
                            {gap.skill} / {gap.severity.toLowerCase()}
                          </span>
                        ))
                      ) : (
                        <span className="text-xs text-on-surface-variant">No required-skill gaps detected.</span>
                      )}
                    </div>
                  </div>
                </div>
              ) : null}

              <div className="flex flex-col gap-4 border-t border-border-warm pt-4 lg:flex-row lg:items-center lg:justify-between">
                <span className="inline-flex items-center gap-1 text-xs font-semibold text-slate-ink">
                  <Icon className="h-4 w-4" name="history" />
                  {result.parsed}
                </span>
                <div className="flex flex-col gap-3 sm:flex-row">
                  <button
                    className="h-9 rounded-lg border border-border-warm px-4 text-sm font-semibold transition hover:bg-workflow-ivory"
                    disabled={viewingCvId === result.id}
                    onClick={() => void handleViewCv(result)}
                    type="button"
                  >
                    {viewingCvId === result.id ? 'Opening...' : 'View CV'}
                  </button>
                  <button
                    className="h-9 rounded-lg border border-teal-command px-4 text-sm font-semibold text-teal-command transition hover:bg-teal-command/5"
                    onClick={() => {
                      void recordFeedback(result, 'MARK_REVIEW', { source: 'candidate_search' });
                      setActionMessage(
                        'Screening decision actions should update CV status; collection is handled in Talent Pool.',
                      );
                    }}
                    type="button"
                  >
                    Mark for Review
                  </button>
                  <button
                    className={`h-9 rounded-lg px-4 text-sm font-semibold transition ${
                      result.hasInterviewInvite
                        ? 'cursor-not-allowed bg-surface-container-high text-slate-ink'
                        : 'bg-teal-command text-white hover:bg-primary active:scale-[0.98]'
                    }`}
                    disabled={result.hasInterviewInvite}
                    onClick={() => openScheduleForm(result)}
                    title={
                      result.hasInterviewInvite
                        ? 'Interview invite has already been sent'
                        : 'Schedule interview'
                    }
                    type="button"
                  >
                    {result.hasInterviewInvite ? 'Invite Sent' : 'Schedule Interview'}
                  </button>
                </div>
              </div>
            </article>
          ))}
        </section>
      </main>

      <aside className="space-y-6">
        <section className="rounded-lg border border-border-warm bg-clean-surface p-6 shadow-sm">
          <h2 className="mb-4 text-xl font-semibold text-deep-charcoal">Search Explanation</h2>
          <div className="space-y-5">
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-slate-ink">
                Target Campaign
              </p>
              <p className="rounded-lg border border-border-warm bg-workflow-ivory p-3 text-sm">
                {campaigns.find((item) => item.requestId === campaign)?.label ??
                  'No campaign selected'}
              </p>
              <p className="mt-2 text-xs leading-5 text-on-surface-variant">
                Search scope: collected CVs and applicants already linked to this campaign.
              </p>
            </div>
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-slate-ink">
                Query Terms Matched
              </p>
              <div className="flex flex-wrap gap-2">
                {expandedTerms.map((term) => (
                  <span
                    className="rounded-lg border border-teal-command/20 bg-teal-command/10 px-2 py-1 text-xs font-semibold text-teal-command"
                    key={term}
                  >
                    {term}
                  </span>
                ))}
              </div>
            </div>
            <div className="border-t border-border-warm pt-4">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-ink">
                  Embedding Index
                </span>
                <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-approved">
                  Active
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Icon className="h-4 w-4 text-teal-command" name="database" />
                <span className="font-mono text-sm">v4.2-STABLE</span>
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-lg border border-border-warm bg-workflow-ivory p-4">
          <div className="mb-2 flex items-center gap-2 text-revision">
            <Icon className="h-5 w-5" name="warning" />
            <span className="text-xs font-bold uppercase tracking-[0.14em]">Disclaimer</span>
          </div>
          <p className="text-sm italic leading-6 text-slate-ink">
            Similarity is search evidence only, not an automated hiring decision. All candidates
            must be vetted manually.
          </p>
        </section>

        <section className="rounded-lg border border-border-warm bg-clean-surface p-6 shadow-sm">
          <h3 className="mb-4 text-sm font-semibold text-deep-charcoal">Related Search Tags</h3>
          <div className="flex flex-wrap gap-2">
            {['Microservices', 'Cloud Infra', 'Docker/K8s', 'Performance'].map((tag) => (
              <button
                className="rounded-lg bg-surface-container px-3 py-1.5 text-xs font-semibold transition hover:bg-surface-container-high active:scale-[0.98]"
                key={tag}
                type="button"
              >
                {tag}
              </button>
            ))}
          </div>
        </section>

        <section className="rounded-lg border border-teal-command/20 bg-teal-command/5 p-6">
          <h3 className="mb-2 text-sm font-semibold text-teal-command">AI Search Tip</h3>
          <p className="text-sm leading-6 text-teal-command/80">
            Try adding soft skills or environmental context like "fast-paced startup" or
            "mentorship" to refine results.
          </p>
        </section>
      </aside>
    </div>
  );
};
