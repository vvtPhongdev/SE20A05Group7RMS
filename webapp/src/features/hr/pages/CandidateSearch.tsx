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
    vectorSimilarityPenalty?: number;
    feedbackScore?: number;
    directFeedbackScore?: number;
    semanticFeedbackScore?: number;
    rerankerScore?: number;
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
  latestCvId?: string;
  screeningStatus: 'PENDING' | 'SHORTLISTED' | 'REJECTED';
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

const algorithmScore = (scores: SearchResult['scores']) =>
  (scores.graphScore * 0.35 + scores.coverageScore * 0.25) / 0.6;

const extractRequiredSkills = (requirements: unknown): string[] => {
  if (!requirements || typeof requirements !== 'object' || Array.isArray(requirements)) return [];
  const value = requirements as { skills?: unknown; required?: unknown };
  const skills = Array.isArray(value.skills) ? value.skills : value.required;
  return Array.isArray(skills)
    ? [
        ...new Set(
          skills
            .filter((skill): skill is string => typeof skill === 'string' && Boolean(skill.trim()))
            .map((skill) => skill.trim()),
        ),
      ]
    : [];
};

export const CandidateSearch: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const requestedCampaignId = searchParams.get('requestId') ?? '';
  const { token } = useAuth();
  const [campaign, setCampaign] = useState('');
  const [query, setQuery] = useState('');
  const [workMode, setWorkMode] = useState('ANY');
  const [minYearsExperience, setMinYearsExperience] = useState('');
  const [maxYearsExperience, setMaxYearsExperience] = useState('');
  const [profileVisibility, setProfileVisibility] = useState<
    'PUBLIC' | 'INCLUDE_PRIVATE' | 'PRIVATE'
  >('PUBLIC');
  const [locked, setLocked] = useState(true);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [campaigns, setCampaigns] = useState<
    Array<{ requestId: string; label: string; requiredSkills: string[] }>
  >([]);
  const [expandedTerms, setExpandedTerms] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState('');
  const [viewingCvId, setViewingCvId] = useState('');
  const [actionMessage, setActionMessage] = useState('');
  const [searchRunId, setSearchRunId] = useState('');
  const [page, setPage] = useState(1);
  const [totalResults, setTotalResults] = useState(0);
  const [sortBy, setSortBy] = useState<'RELEVANCE' | 'VECTOR' | 'COVERAGE'>('RELEVANCE');
  const [decisionFilter, setDecisionFilter] = useState<'ALL' | 'STRONG_MATCH' | 'CRITICAL_GAP'>(
    'ALL',
  );
  const [shortlistOnly, setShortlistOnly] = useState(false);
  const [shortlistModalOpen, setShortlistModalOpen] = useState(false);
  const [detailCandidate, setDetailCandidate] = useState<SearchResult | null>(null);
  const [selectedCandidateIds, setSelectedCandidateIds] = useState<string[]>([]);
  const [decisionSubmitting, setDecisionSubmitting] = useState(false);
  const [feedbackReason, setFeedbackReason] = useState('');
  const [qualityMetrics, setQualityMetrics] = useState<{
    impressions: number;
    decisionCoverage: number;
    shortlistRate: number;
    highScorePrecision: number;
  } | null>(null);

  useEffect(() => {
    type JobPosting = {
      requestId: string;
      title: string;
      status: string;
      request?: { position: string; skillRequirements?: unknown } | null;
    };
    const loadCampaigns = async () => {
      try {
        const response = await apiRequest<JobPosting[]>('/job-postings', token);
        const mapped = response.map((posting) => ({
          requestId: posting.requestId,
          label: `${posting.title || posting.request?.position || 'Recruitment campaign'} (${posting.status})`,
          requiredSkills: extractRequiredSkills(posting.request?.skillRequirements),
        }));
        setCampaigns(mapped);
        setCampaign(
          requestedCampaignId &&
            mapped.some((campaign) => campaign.requestId === requestedCampaignId)
            ? requestedCampaignId
            : (mapped[0]?.requestId ?? ''),
        );
        setLocked(mapped.length === 0);
      } catch (loadError) {
        setApiError(loadError instanceof Error ? loadError.message : 'Unable to load campaigns');
      }
    };
    void loadCampaigns();
  }, [requestedCampaignId, token]);

  useEffect(() => {
    if (!campaign) {
      setQualityMetrics(null);
      return;
    }
    void apiRequest<{
      impressions: number;
      decisionCoverage: number;
      shortlistRate: number;
      highScorePrecision: number;
    }>(`/talent/feedback/metrics?requestId=${encodeURIComponent(campaign)}`, token)
      .then(setQualityMetrics)
      .catch(() => setQualityMetrics(null));
  }, [campaign, token]);

  const handleSearch = async (
    requestedPage = 1,
    options: { shortlistOnly?: boolean; query?: string; pageSize?: number } = {},
  ) => {
    if (!campaign) return;
    const queryToRun = options.query ?? query;
    const shouldShowShortlist = options.shortlistOnly ?? shortlistOnly;
    const pageSize = options.pageSize ?? 20;
    const minYears = Number(minYearsExperience);
    const maxYears = Number(maxYearsExperience);
    if (minYearsExperience && maxYearsExperience && maxYears < minYears) {
      setApiError('Maximum experience must be greater than or equal to minimum experience.');
      return;
    }
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
          vectorSimilarityPenalty?: number;
          feedbackScore?: number;
          directFeedbackScore?: number;
          semanticFeedbackScore?: number;
          rerankerScore?: number;
          baseOverallScore?: number;
          displayName: string;
          headline?: string | null;
          readinessLabel: string;
          matchExplanation?: SearchResult['matchExplanation'];
          skills: string[];
          latestCv?: {
            id: string;
            parsedAt?: string | null;
            screeningStatus?: string | null;
          } | null;
          hasInterviewInvite?: boolean;
          latestInterview?: { status?: string | null; scheduledAt?: string | null } | null;
        }>;
        meta: {
          searchRunId: string | null;
          expandedQuery: { expandedSkills: string[] };
          pagination: { page: number; pageSize: number; total: number };
        };
      }>('/talent/search', token, {
        method: 'POST',
        body: JSON.stringify({
          query: queryToRun,
          filters: {
            requestId: campaign,
            campaignMembersOnly: true,
            ...(workMode !== 'ANY' ? { workMode } : {}),
            ...(minYearsExperience ? { minYearsExperience: minYears } : {}),
            ...(maxYearsExperience ? { maxYearsExperience: maxYears } : {}),
            visibility: profileVisibility,
            ...(shouldShowShortlist ? { screeningStatus: 'SHORTLISTED' } : {}),
          },
          pagination: { page: requestedPage, pageSize },
        }),
      });
      setResults(
        response.data.map((result, index) => ({
          id: result.candidateProfileId,
          name: result.displayName,
          title: result.headline || 'Candidate',
          similarity: Math.round(result.overallScore * 100),
          // Rank is global across the search result, not reset on each page.
          rank: (response.meta.pagination.page - 1) * response.meta.pagination.pageSize + index + 1,
          scores: {
            overallScore: result.overallScore,
            vectorScore: result.vectorScore,
            graphScore: result.graphScore,
            coverageScore: result.coverageScore,
            vectorSimilarityPenalty: result.vectorSimilarityPenalty,
            feedbackScore: result.feedbackScore,
            directFeedbackScore: result.directFeedbackScore,
            semanticFeedbackScore: result.semanticFeedbackScore,
            rerankerScore: result.rerankerScore,
          },
          parsed: result.latestCv?.parsedAt
            ? `Parsed ${new Date(result.latestCv.parsedAt).toLocaleString()}`
            : 'CV parsing date unavailable',
          evidence:
            result.matchExplanation?.assessment ?? result.readinessLabel.replaceAll('_', ' '),
          matchExplanation: result.matchExplanation,
          skills: result.skills,
          latestCvId: result.latestCv?.id,
          screeningStatus:
            result.latestCv?.screeningStatus === 'SHORTLISTED' ||
            result.latestCv?.screeningStatus === 'REJECTED'
              ? result.latestCv.screeningStatus
              : 'PENDING',
          hasInterviewInvite: Boolean(result.hasInterviewInvite || result.latestInterview),
        })),
      );
      setPage(response.meta.pagination.page);
      setTotalResults(response.meta.pagination.total);
      setSelectedCandidateIds([]);
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
    action: 'VIEW_CV' | 'MARK_REVIEW' | 'SCHEDULE_INTERVIEW' | 'SHORTLIST' | 'REJECT',
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

  const openScheduleForSelectedShortlist = () => {
    const candidateIds = selectedCandidateIds.filter(
      (candidateId) =>
        results.find((result) => result.id === candidateId)?.screeningStatus === 'SHORTLISTED',
    );
    if (!candidateIds.length) {
      setActionMessage('Select at least one shortlisted candidate to schedule interviews.');
      return;
    }
    navigate(
      `/hr/interviews?requestId=${encodeURIComponent(campaign)}&candidateIds=${encodeURIComponent(candidateIds.join(','))}`,
    );
  };

  const updateScreeningDecision = async (
    candidateIds: string[],
    status: 'SHORTLISTED' | 'REJECTED' | 'PENDING',
  ) => {
    if (!campaign || candidateIds.length === 0) return;
    setDecisionSubmitting(true);
    setApiError('');
    try {
      await apiRequest('/talent/screening-decision', token, {
        method: 'POST',
        body: JSON.stringify({
          requestId: campaign,
          candidateIds,
          status,
          ...(feedbackReason ? { feedbackReason } : {}),
        }),
      });
      setResults((current) =>
        current.map((result) =>
          candidateIds.includes(result.id) ? { ...result, screeningStatus: status } : result,
        ),
      );
      setSelectedCandidateIds((current) => current.filter((id) => !candidateIds.includes(id)));
      setActionMessage(
        `${candidateIds.length} candidate${candidateIds.length === 1 ? '' : 's'} ${status.toLowerCase()}.`,
      );
    } catch (error) {
      setApiError(error instanceof Error ? error.message : 'Unable to update screening decision');
    } finally {
      setDecisionSubmitting(false);
    }
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
      helper: 'hybrid match',
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

  const visibleResults = results
    .filter((result) => {
      if (decisionFilter === 'STRONG_MATCH') {
        return (
          result.similarity >= 70 &&
          !result.matchExplanation?.gaps.some((gap) => gap.severity === 'CRITICAL')
        );
      }
      if (decisionFilter === 'CRITICAL_GAP') {
        return Boolean(result.matchExplanation?.gaps.some((gap) => gap.severity === 'CRITICAL'));
      }
      return true;
    })
    .sort((a, b) => {
      if (sortBy === 'VECTOR') return b.scores.vectorScore - a.scores.vectorScore;
      if (sortBy === 'COVERAGE') return b.scores.coverageScore - a.scores.coverageScore;
      return a.rank - b.rank;
    });
  const activeFilterLabels = [
    workMode !== 'ANY' ? workMode : '',
    minYearsExperience ? `Min. ${minYearsExperience} years` : '',
    maxYearsExperience ? `Max. ${maxYearsExperience} years` : '',
    profileVisibility === 'INCLUDE_PRIVATE' ? 'Including private profiles' : '',
    profileVisibility === 'PRIVATE' ? 'Private profiles only' : '',
  ].filter(Boolean);
  const relatedSearchTags =
    campaigns.find((item) => item.requestId === campaign)?.requiredSkills ?? [];

  const resetAdvancedFilters = () => {
    setWorkMode('ANY');
    setMinYearsExperience('');
    setMaxYearsExperience('');
    setProfileVisibility('PUBLIC');
  };

  const showShortlistedCandidates = () => {
    setShortlistOnly(true);
    setDecisionFilter('ALL');
    setShortlistModalOpen(true);
    void handleSearch(1, { shortlistOnly: true, query: '', pageSize: 500 });
  };

  const showAllCandidates = () => {
    setShortlistOnly(false);
    setShortlistModalOpen(false);
    void handleSearch(1, { shortlistOnly: false });
  };

  return (
    <div className="mx-auto grid max-w-[1440px] gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
      <main className="min-w-0 space-y-6">
        <HRPageHeader
          eyebrow="HR Manager Portal"
          title="CV Screening"
          description="Use AI Hybrid Search to screen only candidates already collected for or applied to the selected campaign."
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
              <span className="text-sm font-semibold text-deep-charcoal">AI Hybrid Search</span>
              <p className="text-xs leading-5 text-on-surface-variant">
                AI Vector similarity and Skill Graph/Coverage matching run together. Their weighted
                scores are combined to rank only candidates already in this campaign through CV
                Collection or candidate self-application.
              </p>
              <p className="text-xs font-semibold leading-5 text-teal-command">
                Your typed criteria are evaluated separately and contribute 65% of the Vector
                component; campaign JD contributes the remaining 35%.
              </p>
              <div className="relative">
                <textarea
                  className="w-full resize-none rounded-lg border border-border-warm bg-workflow-ivory p-4 pr-40 text-sm outline-none transition placeholder:text-slate-ink/40 focus:border-teal-command focus:ring-2 focus:ring-teal-command/20"
                  disabled={locked}
                  onChange={(event) => setQuery(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' && (event.ctrlKey || event.metaKey)) {
                      event.preventDefault();
                      void handleSearch();
                    }
                  }}
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

            <div className="grid gap-3 border-t border-border-warm pt-4 sm:grid-cols-2 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_auto] lg:items-end">
              <label className="flex min-w-0 flex-col gap-1.5">
                <span className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-ink">
                  Work mode
                </span>
                <select
                  className="h-10 rounded-lg border border-border-warm bg-workflow-ivory px-3 text-sm outline-none focus:border-teal-command focus:ring-2 focus:ring-teal-command/20"
                  disabled={locked}
                  onChange={(event) => setWorkMode(event.target.value)}
                  value={workMode}
                >
                  <option value="ANY">Any work mode</option>
                  <option value="ONSITE">On-site</option>
                  <option value="HYBRID">Hybrid</option>
                  <option value="REMOTE">Remote</option>
                </select>
              </label>
              <label className="flex min-w-0 flex-col gap-1.5">
                <span className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-ink">
                  Experience range
                </span>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    className="h-10 min-w-0 rounded-lg border border-border-warm bg-workflow-ivory px-3 text-sm outline-none focus:border-teal-command focus:ring-2 focus:ring-teal-command/20"
                    disabled={locked}
                    min="0"
                    onChange={(event) => setMinYearsExperience(event.target.value)}
                    placeholder="Min years"
                    type="number"
                    value={minYearsExperience}
                  />
                  <input
                    className="h-10 min-w-0 rounded-lg border border-border-warm bg-workflow-ivory px-3 text-sm outline-none focus:border-teal-command focus:ring-2 focus:ring-teal-command/20"
                    disabled={locked}
                    min="0"
                    onChange={(event) => setMaxYearsExperience(event.target.value)}
                    placeholder="Max years"
                    type="number"
                    value={maxYearsExperience}
                  />
                </div>
              </label>
              <label className="flex min-w-0 flex-col gap-1.5">
                <span className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-ink">
                  Profile visibility
                </span>
                <select
                  className="h-10 rounded-lg border border-border-warm bg-workflow-ivory px-3 text-sm outline-none focus:border-teal-command focus:ring-2 focus:ring-teal-command/20"
                  disabled={locked}
                  onChange={(event) =>
                    setProfileVisibility(
                      event.target.value as 'PUBLIC' | 'INCLUDE_PRIVATE' | 'PRIVATE',
                    )
                  }
                  value={profileVisibility}
                >
                  <option value="PUBLIC">Public profiles</option>
                  <option value="INCLUDE_PRIVATE">Include private profiles</option>
                  <option value="PRIVATE">Private profiles only</option>
                </select>
              </label>
              <button
                className="h-10 rounded-lg border border-border-warm px-3 text-sm font-semibold text-slate-ink transition hover:bg-workflow-ivory disabled:cursor-not-allowed disabled:opacity-50"
                disabled={locked || activeFilterLabels.length === 0}
                onClick={resetAdvancedFilters}
                type="button"
              >
                Clear filters
              </button>
            </div>
          </div>
        </HRCard>

        {apiError ? <HRInlineAlert>{apiError}</HRInlineAlert> : null}

        {actionMessage ? <HRInlineAlert tone="teal">{actionMessage}</HRInlineAlert> : null}

        {shortlistModalOpen ? (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-deep-charcoal/50 p-4"
            role="dialog"
            aria-modal="true"
            aria-label="Shortlisted candidates"
          >
            <section className="max-h-[85vh] w-full max-w-3xl overflow-hidden rounded-xl bg-clean-surface shadow-2xl">
              <div className="flex items-start justify-between border-b border-border-warm p-5">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-ink">
                    Selected campaign
                  </p>
                  <h2 className="mt-1 text-xl font-semibold text-deep-charcoal">
                    Shortlisted candidates ({totalResults})
                  </h2>
                </div>
                <button
                  className="rounded-lg border border-border-warm px-3 py-1.5 text-sm font-semibold"
                  onClick={showAllCandidates}
                  type="button"
                >
                  Close
                </button>
              </div>
              <div className="max-h-[68vh] space-y-3 overflow-y-auto p-5">
                {loading ? (
                  <p className="text-sm text-on-surface-variant">
                    Loading shortlisted candidates...
                  </p>
                ) : null}
                {!loading &&
                  visibleResults.map((result) => (
                    <article
                      className="flex flex-col gap-3 rounded-lg border border-border-warm p-4 sm:flex-row sm:items-center sm:justify-between"
                      key={result.id}
                    >
                      <div className="min-w-0">
                        <p className="truncate font-semibold text-deep-charcoal">{result.name}</p>
                        <p className="truncate text-sm text-slate-ink">{result.title}</p>
                        <p className="mt-1 text-sm font-bold text-teal-command">
                          {result.similarity}% compatibility · Rank #{result.rank}
                        </p>
                      </div>
                      <div className="flex shrink-0 flex-wrap gap-2">
                        <button
                          className="rounded-lg border border-border-warm px-3 py-2 text-sm font-semibold"
                          onClick={() => setDetailCandidate(result)}
                          type="button"
                        >
                          View details
                        </button>
                        <button
                          className={`rounded-lg px-3 py-2 text-sm font-semibold ${result.hasInterviewInvite ? 'cursor-not-allowed bg-surface-container-high text-slate-ink' : 'bg-teal-command text-white'}`}
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
                    </article>
                  ))}
                {!loading && !visibleResults.length ? (
                  <p className="text-sm text-on-surface-variant">
                    No shortlisted candidates in this campaign.
                  </p>
                ) : null}
              </div>
            </section>
          </div>
        ) : null}

        {detailCandidate ? (
          <div
            className="fixed inset-0 z-[60] flex items-center justify-center bg-deep-charcoal/50 p-4"
            role="dialog"
            aria-modal="true"
            aria-label="Candidate search details"
          >
            <section className="max-h-[85vh] w-full max-w-3xl overflow-y-auto rounded-xl bg-clean-surface p-6 shadow-2xl">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-xl font-semibold text-deep-charcoal">
                    {detailCandidate.name}
                  </h2>
                  <p className="text-sm text-slate-ink">
                    {detailCandidate.title} · Rank #{detailCandidate.rank}
                  </p>
                </div>
                <button
                  className="rounded-lg border border-border-warm px-3 py-1.5 text-sm font-semibold"
                  onClick={() => setDetailCandidate(null)}
                  type="button"
                >
                  Close
                </button>
              </div>
              <div className="mt-5 grid gap-3 rounded-lg bg-workflow-ivory p-4 sm:grid-cols-4">
                <p>
                  <span className="block text-xs text-slate-ink">Final score</span>
                  <strong>{detailCandidate.similarity}%</strong>
                </p>
                <p>
                  <span className="block text-xs text-slate-ink">Vector</span>
                  <strong>{Math.round(detailCandidate.scores.vectorScore * 100)}%</strong>
                </p>
                <p>
                  <span className="block text-xs text-slate-ink">Skill graph</span>
                  <strong>{Math.round(detailCandidate.scores.graphScore * 100)}%</strong>
                </p>
                <p>
                  <span className="block text-xs text-slate-ink">Required skills</span>
                  <strong>{Math.round(detailCandidate.scores.coverageScore * 100)}%</strong>
                </p>
              </div>
              <div className="mt-5 space-y-4 text-sm">
                <div>
                  <p className="font-semibold text-deep-charcoal">AI assessment</p>
                  <p className="mt-1 text-on-surface-variant">{detailCandidate.evidence}</p>
                </div>
                <div>
                  <p className="font-semibold text-deep-charcoal">Candidate skills</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {detailCandidate.skills.map((skill) => (
                      <span
                        className="rounded bg-surface-container-high px-2 py-1 text-xs font-semibold"
                        key={skill}
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="font-semibold text-deep-charcoal">Matched requirements</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {detailCandidate.matchExplanation?.matchedSkills.length ? (
                      detailCandidate.matchExplanation.matchedSkills.map((match) => (
                        <span
                          className="rounded bg-teal-command/10 px-2 py-1 text-xs font-semibold text-teal-command"
                          key={`${match.skill}-${match.source}`}
                        >
                          {match.skill} {Math.round(match.confidence * 100)}%
                        </span>
                      ))
                    ) : (
                      <span className="text-on-surface-variant">No strong evidence recorded.</span>
                    )}
                  </div>
                </div>
                <div>
                  <p className="font-semibold text-deep-charcoal">Remaining gaps</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {detailCandidate.matchExplanation?.gaps.length ? (
                      detailCandidate.matchExplanation.gaps.map((gap) => (
                        <span
                          className="rounded bg-revision/10 px-2 py-1 text-xs font-semibold text-revision"
                          key={`${gap.skill}-${gap.severity}`}
                        >
                          {gap.skill} · {gap.severity.toLowerCase()}
                        </span>
                      ))
                    ) : (
                      <span className="text-on-surface-variant">
                        No required-skill gaps detected.
                      </span>
                    )}
                  </div>
                </div>
                <div>
                  <p className="font-semibold text-deep-charcoal">Score drivers</p>
                  <ul className="mt-1 list-disc space-y-1 pl-5 text-on-surface-variant">
                    {detailCandidate.matchExplanation?.scoreDrivers.map((driver) => (
                      <li key={driver}>{driver}</li>
                    ))}
                  </ul>
                </div>
              </div>
              <div className="mt-6 flex justify-end">
                <button
                  className={`rounded-lg px-4 py-2 text-sm font-semibold ${detailCandidate.hasInterviewInvite ? 'cursor-not-allowed bg-surface-container-high text-slate-ink' : 'bg-teal-command text-white'}`}
                  disabled={detailCandidate.hasInterviewInvite}
                  onClick={() => openScheduleForm(detailCandidate)}
                  type="button"
                >
                  {detailCandidate.hasInterviewInvite ? 'Invite Sent' : 'Schedule Interview'}
                </button>
              </div>
            </section>
          </div>
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
              {shortlistOnly ? 'Shortlisted Candidates' : 'Ranked Match Results'} (
              {totalResults || visibleResults.length})
            </h2>
            <div className="flex flex-wrap items-center gap-2">
              <button
                className={`h-9 rounded-lg px-3 text-xs font-semibold ${shortlistOnly ? 'bg-teal-command text-white' : 'border border-teal-command text-teal-command'}`}
                onClick={() => (shortlistOnly ? showAllCandidates() : showShortlistedCandidates())}
                type="button"
              >
                {shortlistOnly ? 'Back to candidates' : 'View shortlist'}
              </button>
              <select
                aria-label="Sort candidates"
                className="h-9 rounded-lg border border-border-warm bg-workflow-ivory px-3 text-sm font-semibold text-slate-ink"
                onChange={(event) =>
                  setSortBy(event.target.value as 'RELEVANCE' | 'VECTOR' | 'COVERAGE')
                }
                value={sortBy}
              >
                <option value="RELEVANCE">Best match</option>
                <option value="VECTOR">CV similarity</option>
                <option value="COVERAGE">Required skills</option>
              </select>
              {(['ALL', 'STRONG_MATCH', 'CRITICAL_GAP'] as const).map((filter) => (
                <button
                  className={`h-9 rounded-lg px-3 text-xs font-semibold ${decisionFilter === filter ? 'bg-teal-command text-white' : 'border border-border-warm text-slate-ink'}`}
                  key={filter}
                  onClick={() => setDecisionFilter(filter)}
                  type="button"
                >
                  {filter === 'ALL'
                    ? 'All'
                    : filter === 'STRONG_MATCH'
                      ? 'Strong match'
                      : 'Critical gaps'}
                </button>
              ))}
            </div>
          </div>

          {selectedCandidateIds.length ? (
            <div className="flex flex-wrap items-center gap-3 rounded-lg border border-teal-command/20 bg-teal-command/5 p-3 text-sm">
              <span className="font-semibold text-teal-command">
                {selectedCandidateIds.length} selected
              </span>
              <button
                className="rounded-lg bg-teal-command px-3 py-2 font-semibold text-white disabled:opacity-50"
                disabled={decisionSubmitting}
                onClick={() => void updateScreeningDecision(selectedCandidateIds, 'SHORTLISTED')}
                type="button"
              >
                Shortlist selected
              </button>
              <button
                className="rounded-lg border border-rejected px-3 py-2 font-semibold text-rejected disabled:opacity-50"
                disabled={decisionSubmitting}
                onClick={() => void updateScreeningDecision(selectedCandidateIds, 'REJECTED')}
                type="button"
              >
                Reject selected
              </button>
              <button
                className="rounded-lg border border-teal-command px-3 py-2 font-semibold text-teal-command disabled:opacity-50"
                disabled={
                  !selectedCandidateIds.some(
                    (candidateId) =>
                      results.find((result) => result.id === candidateId)?.screeningStatus ===
                      'SHORTLISTED',
                  )
                }
                onClick={openScheduleForSelectedShortlist}
                type="button"
              >
                Schedule shortlisted
              </button>
            </div>
          ) : null}

          {visibleResults.map((result) => (
            <article
              className="rounded-lg border border-border-warm bg-clean-surface p-6 transition hover:border-teal-command/30 hover:shadow-sm"
              key={result.id}
            >
              <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex gap-4">
                  <input
                    aria-label={`Select ${result.name}`}
                    checked={selectedCandidateIds.includes(result.id)}
                    className="mt-1 h-4 w-4 accent-teal-command"
                    onChange={(event) =>
                      setSelectedCandidateIds((current) =>
                        event.target.checked
                          ? [...current, result.id]
                          : current.filter((id) => id !== result.id),
                      )
                    }
                    type="checkbox"
                  />
                  <div className="flex h-14 w-14 items-center justify-center rounded-lg border border-border-warm bg-parchment-lift text-teal-command">
                    <Icon className="h-8 w-8" name="user" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-deep-charcoal">{result.name}</h3>
                    <p className="text-sm text-slate-ink">
                      {result.title} / <span className="font-mono text-xs">{result.id}</span>
                    </p>
                    <span
                      className={`mt-1 inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${result.screeningStatus === 'SHORTLISTED' ? 'bg-approved/10 text-approved' : result.screeningStatus === 'REJECTED' ? 'bg-rejected/10 text-rejected' : 'bg-surface-container-high text-slate-ink'}`}
                    >
                      {result.screeningStatus.toLowerCase()}
                    </span>
                  </div>
                </div>
                <div className="sm:text-right">
                  <div className="mb-1 flex items-center gap-2 font-bold text-teal-command sm:justify-end">
                    <span className="text-sm font-semibold text-slate-ink">Hybrid Score</span>
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

              <div className="mb-6 grid grid-cols-3 gap-2 rounded-lg border border-border-warm bg-workflow-ivory p-3 text-center">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-on-surface-variant">
                    AI Vector · 40%
                  </p>
                  <p className="mt-1 font-mono text-sm font-bold text-teal-command">
                    {Math.round(result.scores.vectorScore * 100)}%
                  </p>
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-on-surface-variant">
                    Algorithm · 60%
                  </p>
                  <p className="mt-1 font-mono text-sm font-bold text-deep-charcoal">
                    {Math.round(algorithmScore(result.scores) * 100)}%
                  </p>
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-on-surface-variant">
                    Final rank · #{result.rank}
                  </p>
                  <p className="mt-1 font-mono text-sm font-bold text-approved">
                    {Math.round(result.scores.overallScore * 100)}%
                  </p>
                </div>
              </div>

              <div className="mb-6 grid gap-2 rounded-lg border border-border-warm bg-clean-surface p-3 text-xs sm:grid-cols-2">
                <div>
                  <p className="font-semibold text-on-surface-variant">Required skill coverage</p>
                  <p className="mt-1 font-mono text-sm font-bold text-deep-charcoal">
                    {Math.round(result.scores.coverageScore * 100)}% ·{' '}
                    {Math.round(result.scores.coverageScore * 25)}/25 points
                  </p>
                </div>
                <div>
                  <p className="font-semibold text-on-surface-variant">Score safeguards</p>
                  <p
                    className={`mt-1 font-semibold ${
                      (result.scores.vectorSimilarityPenalty ?? 1) < 1
                        ? 'text-revision'
                        : 'text-approved'
                    }`}
                  >
                    {(result.scores.vectorSimilarityPenalty ?? 1) < 1
                      ? `Low similarity: score retained ${Math.round((result.scores.vectorSimilarityPenalty ?? 1) * 100)}%`
                      : 'No score safeguard applied'}
                  </p>
                </div>
              </div>

              <div className="mb-6 rounded-lg border border-border-warm bg-workflow-ivory p-3">
                <p className="mb-3 text-xs font-bold uppercase tracking-[0.12em] text-on-surface-variant">
                  Score contribution / 100
                </p>
                <div className="space-y-2 text-xs">
                  {[
                    {
                      label: 'AI Vector similarity',
                      score: result.scores.vectorScore,
                      weight: 40,
                      tone: 'bg-teal-command',
                    },
                    {
                      label: 'Skill graph relevance',
                      score: result.scores.graphScore,
                      weight: 35,
                      tone: 'bg-pending',
                    },
                    {
                      label: 'Required skills (direct CV evidence)',
                      score: result.scores.coverageScore,
                      weight: 25,
                      tone: 'bg-approved',
                    },
                  ].map((component) => {
                    const contribution = component.score * component.weight;
                    return (
                      <div
                        className="grid grid-cols-[minmax(0,1fr)_48px] items-center gap-3"
                        key={component.label}
                      >
                        <div className="min-w-0">
                          <div className="mb-1 flex justify-between gap-2 text-on-surface-variant">
                            <span className="truncate">{component.label}</span>
                            <span className="shrink-0">
                              {Math.round(contribution)}/{component.weight}
                            </span>
                          </div>
                          <div className="h-1.5 overflow-hidden rounded-full bg-surface-container">
                            <div
                              className={`h-full rounded-full ${component.tone}`}
                              style={{ width: `${Math.round(component.score * 100)}%` }}
                            />
                          </div>
                        </div>
                        <span className="text-right font-mono font-bold text-deep-charcoal">
                          {Math.round(component.score * 100)}%
                        </span>
                      </div>
                    );
                  })}
                </div>
                <p className="mt-3 border-t border-border-warm pt-2 text-xs text-on-surface-variant">
                  Base score{' '}
                  {Math.round(
                    (result.scores.vectorScore * 0.4 +
                      result.scores.graphScore * 0.35 +
                      result.scores.coverageScore * 0.25) *
                      100,
                  )}
                  %{' · '}safeguard {Math.round((result.scores.vectorSimilarityPenalty ?? 1) * 100)}
                  %{' · '}HR feedback{' '}
                  {result.scores.feedbackScore
                    ? `${result.scores.feedbackScore > 0 ? '+' : ''}${Math.round(result.scores.feedbackScore * 100)} points`
                    : 'none'}
                  {' · '}final {Math.round(result.scores.overallScore * 100)}%
                </p>
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
                        <span className="text-xs text-on-surface-variant">
                          No strong skill evidence.
                        </span>
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
                        <span className="text-xs text-on-surface-variant">
                          No required-skill gaps detected.
                        </span>
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
                    className="h-9 rounded-lg border border-teal-command px-4 text-sm font-semibold text-teal-command transition hover:bg-teal-command/5 disabled:opacity-50"
                    disabled={decisionSubmitting || result.screeningStatus === 'SHORTLISTED'}
                    onClick={() => void updateScreeningDecision([result.id], 'SHORTLISTED')}
                    type="button"
                  >
                    {result.screeningStatus === 'SHORTLISTED' ? 'Shortlisted' : 'Shortlist'}
                  </button>
                  <button
                    className="h-9 rounded-lg border border-rejected px-4 text-sm font-semibold text-rejected transition hover:bg-rejected/5 disabled:opacity-50"
                    disabled={decisionSubmitting || result.screeningStatus === 'REJECTED'}
                    onClick={() => void updateScreeningDecision([result.id], 'REJECTED')}
                    type="button"
                  >
                    {result.screeningStatus === 'REJECTED' ? 'Rejected' : 'Reject'}
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
          {!loading && campaign && visibleResults.length === 0 ? (
            <div className="rounded-lg border border-dashed border-border-warm bg-clean-surface px-6 py-10 text-center text-sm text-on-surface-variant">
              No candidates have been added to this campaign with a matching CV yet. Add candidates
              from Talent Pool or wait for candidate applications before screening.
            </div>
          ) : null}
          {!shortlistOnly && totalResults > 20 ? (
            <div className="flex items-center justify-between rounded-lg border border-border-warm bg-clean-surface p-3 text-sm">
              <span>
                Page {page} of {Math.max(1, Math.ceil(totalResults / 20))}
              </span>
              <div className="flex gap-2">
                <button
                  className="rounded-lg border border-border-warm px-3 py-1.5 font-semibold disabled:opacity-50"
                  disabled={loading || page <= 1}
                  onClick={() => void handleSearch(page - 1)}
                  type="button"
                >
                  Previous
                </button>
                <button
                  className="rounded-lg border border-border-warm px-3 py-1.5 font-semibold disabled:opacity-50"
                  disabled={loading || page >= Math.ceil(totalResults / 20)}
                  onClick={() => void handleSearch(page + 1)}
                  type="button"
                >
                  Next
                </button>
              </div>
            </div>
          ) : null}
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
                Search scope: only collected CVs and applicants already linked to this campaign.
                Candidates outside this campaign are excluded before hybrid ranking.
              </p>
              {activeFilterLabels.length ? (
                <div className="mt-3 flex flex-wrap gap-2">
                  {activeFilterLabels.map((filter) => (
                    <span
                      className="rounded-full bg-teal-command/10 px-2.5 py-1 text-xs font-semibold text-teal-command"
                      key={filter}
                    >
                      {filter}
                    </span>
                  ))}
                </div>
              ) : null}
              <label className="mt-4 flex flex-col gap-1 text-xs font-semibold text-slate-ink">
                Decision reason (optional, used to evaluate search quality)
                <select
                  className="h-9 rounded-lg border border-border-warm bg-workflow-ivory px-2 text-sm font-normal"
                  onChange={(event) => setFeedbackReason(event.target.value)}
                  value={feedbackReason}
                >
                  <option value="">No reason selected</option>
                  <option value="STRONG_SKILL_MATCH">Strong skill match</option>
                  <option value="RELEVANT_EXPERIENCE">Relevant experience</option>
                  <option value="ROLE_ALIGNMENT">Role alignment</option>
                  <option value="MISSING_REQUIRED_SKILLS">Missing required skills</option>
                  <option value="INSUFFICIENT_EXPERIENCE">Insufficient experience</option>
                  <option value="ROLE_MISMATCH">Role mismatch</option>
                  <option value="OTHER">Other</option>
                </select>
              </label>
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
          </div>
        </section>

        {qualityMetrics ? (
          <section className="rounded-lg border border-teal-command/20 bg-teal-command/5 p-4">
            <h3 className="mb-3 text-sm font-semibold text-teal-command">Search quality</h3>
            <div className="grid grid-cols-2 gap-3 text-xs text-slate-ink">
              <span>Impressions <strong>{qualityMetrics.impressions}</strong></span>
              <span>Decision coverage <strong>{Math.round(qualityMetrics.decisionCoverage * 100)}%</strong></span>
              <span>Shortlist rate <strong>{Math.round(qualityMetrics.shortlistRate * 100)}%</strong></span>
              <span>High-score precision <strong>{Math.round(qualityMetrics.highScorePrecision * 100)}%</strong></span>
            </div>
          </section>
        ) : null}

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
          <h3 className="mb-1 text-sm font-semibold text-deep-charcoal">Required Skills</h3>
          <p className="mb-4 text-xs leading-5 text-on-surface-variant">
            From the selected recruitment request. Click a skill to add it to the HR query.
          </p>
          <div className="flex flex-wrap gap-2">
            {relatedSearchTags.map((tag) => (
              <button
                className="rounded-lg bg-surface-container px-3 py-1.5 text-xs font-semibold transition hover:bg-surface-container-high active:scale-[0.98]"
                key={tag}
                onClick={() => setQuery((current) => (current ? `${current}, ${tag}` : tag))}
                type="button"
              >
                {tag}
              </button>
            ))}
            {!relatedSearchTags.length ? (
              <span className="text-xs text-on-surface-variant">
                No required skills have been configured for this request.
              </span>
            ) : null}
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
