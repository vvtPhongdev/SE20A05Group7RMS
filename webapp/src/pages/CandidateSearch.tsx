import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { ApiError, apiRequest } from '../lib/api';

type SearchResult = {
  id: string;
  name: string;
  title: string;
  similarity: number;
  parsed: string;
  evidence: React.ReactNode;
  skills: string[];
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
  const { token } = useAuth();
  const [campaign, setCampaign] = useState('');
  /*
   * Mock search query retained for UI reference only:
   * backend developer with Go, PostgreSQL, Redis, and distributed systems experience in fintech
   */
  const [query, setQuery] = useState('');
  const [locked, setLocked] = useState(true);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [campaigns, setCampaigns] = useState<Array<{ requestId: string; label: string }>>([]);
  const [expandedTerms, setExpandedTerms] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState('');
  const [shortlistingId, setShortlistingId] = useState('');
  const [actionMessage, setActionMessage] = useState('');

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
        setCampaign(mapped[0]?.requestId ?? '');
        setLocked(mapped.length === 0);
      } catch (loadError) {
        setApiError(loadError instanceof Error ? loadError.message : 'Unable to load campaigns');
      }
    };
    void loadCampaigns();
  }, [token]);

  const handleShortlist = async (candidateId: string) => {
    if (!campaign) {
      setApiError('Select a campaign before shortlisting.');
      return;
    }
    setShortlistingId(candidateId);
    setActionMessage('');
    setApiError('');
    try {
      await apiRequest('/applications', token, {
        method: 'POST',
        body: JSON.stringify({ requestId: campaign, candidateId }),
      });
      setActionMessage('Candidate successfully shortlisted for this campaign.');
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) {
        setActionMessage('Candidate is already in this campaign.');
      } else {
        setApiError(err instanceof Error ? err.message : 'Failed to shortlist candidate');
      }
    } finally {
      setShortlistingId('');
    }
  };

  const handleSearch = async () => {
    if (!campaign || !query.trim()) return;
    setLoading(true);
    setApiError('');
    try {
      const response = await apiRequest<{
        data: Array<{
          candidateProfileId: string;
          overallScore: number;
          displayName: string;
          headline?: string | null;
          readinessLabel: string;
          skills: string[];
          latestCv?: { parsedAt?: string | null } | null;
        }>;
        meta: { expandedQuery: { expandedSkills: string[] } };
      }>('/talent/search', token, {
        method: 'POST',
        body: JSON.stringify({
          query,
          filters: { requestId: campaign },
          pagination: { page: 1, pageSize: 20 },
        }),
      });
      setResults(
        response.data.map((result) => ({
          id: result.candidateProfileId,
          name: result.displayName,
          title: result.headline || 'Candidate',
          similarity: Math.round(result.overallScore * 100),
          parsed: result.latestCv?.parsedAt
            ? `Parsed ${new Date(result.latestCv.parsedAt).toLocaleString()}`
            : 'CV parsing date unavailable',
          evidence: result.readinessLabel.replaceAll('_', ' '),
          skills: result.skills,
        })),
      );
      setExpandedTerms(response.meta.expandedQuery.expandedSkills);
    } catch (searchError) {
      setApiError(searchError instanceof Error ? searchError.message : 'Candidate search failed');
    } finally {
      setLoading(false);
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
        <header>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-teal-command">
            HR Manager Portal
          </p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-deep-charcoal">
            Candidate Search
          </h1>
          <p className="mt-1 max-w-[72ch] text-sm leading-6 text-slate-ink">
            Use semantic search evidence to find matching CVs for approved recruitment campaigns.
          </p>
        </header>

        {locked ? (
          <section className="flex items-center gap-3 rounded-lg border border-error/20 bg-error-container px-4 py-3 text-on-error-container">
            <Icon className="h-5 w-5" name="lock" />
            <span className="text-sm font-semibold">
              Search disabled until request and overall plan are approved.
            </span>
            <span className="ml-auto text-xs font-bold">Select an available campaign</span>
          </section>
        ) : null}

        <section className="relative overflow-hidden rounded-lg border border-border-warm bg-clean-surface p-6 shadow-sm">
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
        </section>

        {apiError ? (
          <p className="rounded-lg border border-error/20 bg-error-container p-4 text-sm text-on-error-container">
            {apiError}
          </p>
        ) : null}

        {actionMessage ? (
          <p className="rounded-lg border border-teal-200 bg-teal-50 p-4 text-sm text-teal-command font-semibold">
            {actionMessage}
          </p>
        ) : null}

        <section
          className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4"
          aria-label="Candidate search metrics"
        >
          {kpis.map((kpi) => (
            <section
              className="rounded-lg border border-border-warm bg-clean-surface p-4 shadow-sm"
              key={kpi.label}
            >
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-ink">
                {kpi.label}
              </p>
              <div className="mt-2 flex items-baseline gap-2">
                <span className={`font-mono text-2xl font-bold ${kpi.tone}`}>{kpi.value}</span>
                <span className="text-xs font-semibold text-approved">{kpi.helper}</span>
              </div>
            </section>
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
                    Extracted Evidence
                  </p>
                  <p className="text-sm leading-6 text-on-surface-variant">{result.evidence}</p>
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

              <div className="flex flex-col gap-4 border-t border-border-warm pt-4 lg:flex-row lg:items-center lg:justify-between">
                <span className="inline-flex items-center gap-1 text-xs font-semibold text-slate-ink">
                  <Icon className="h-4 w-4" name="history" />
                  {result.parsed}
                </span>
                <div className="flex flex-col gap-3 sm:flex-row">
                  <button
                    className="h-9 rounded-lg border border-border-warm px-4 text-sm font-semibold transition hover:bg-workflow-ivory"
                    onClick={() => setApiError('Candidate CV download API is not available')}
                    type="button"
                  >
                    View CV
                  </button>
                  <button
                    className={`h-9 rounded-lg border border-teal-command px-4 text-sm font-semibold text-teal-command transition hover:bg-teal-command/5 ${
                      shortlistingId ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                    disabled={shortlistingId !== ''}
                    onClick={() => void handleShortlist(result.id)}
                    type="button"
                  >
                    {shortlistingId === result.id ? 'Shortlisting...' : 'Shortlist'}
                  </button>
                  <button
                    className="h-9 rounded-lg bg-teal-command px-4 text-sm font-semibold text-white transition hover:bg-primary active:scale-[0.98]"
                    onClick={() =>
                      setApiError(
                        'Scheduling requires an interview form and is not connected on this page',
                      )
                    }
                    type="button"
                  >
                    Schedule Interview
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
