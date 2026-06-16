import React, { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { apiRequest, ApiError } from '../../../lib/api';
import {
  HREmptyState,
  HRInlineAlert,
  HRLoadingState,
  HRPageHeader,
  HRSearchInput,
} from '../components';

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

interface InterviewDetailsResponse {
  id: string;
  candidate: string;
  role: string;
  department: string;
  time: string;
  status: RecordingStatus;
  feedbacks: PanelFeedback[];
  finalRecommendation: string;
  summaryNotes: string;
}

const RECOMMENDATION_OPTIONS_VALUES: Recommendation[] = [
  'Recommend Hire',
  'Recommend Reject',
  'Hold for Further',
];

const iconPaths: Record<string, React.ReactNode> = {
  groups: (
    <path d="M17 21a5 5 0 0 0-10 0M21 21a4 4 0 0 0-5-3.9M3 21a4 4 0 0 1 5-3.9M12 13a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm5-1a3 3 0 1 0 0-6m-10 6a3 3 0 1 1 0-6" />
  ),
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
  {
    label: 'Recommend Hire',
    icon: 'check',
    tone: 'peer-checked:border-approved peer-checked:bg-approved/5 peer-checked:ring-approved text-approved',
  },
  {
    label: 'Recommend Reject',
    icon: 'x',
    tone: 'peer-checked:border-rejected peer-checked:bg-rejected/5 peer-checked:ring-rejected text-rejected',
  },
  {
    label: 'Hold for Further',
    icon: 'hold',
    tone: 'peer-checked:border-teal-command peer-checked:bg-teal-command/5 peer-checked:ring-teal-command text-pending',
  },
];

export const HRInterviewResults: React.FC = () => {
  const { token } = useAuth();
  const [completedInterviews, setCompletedInterviews] = useState<CompletedInterview[]>([]);
  const [selectedId, setSelectedId] = useState('');
  const [query, setQuery] = useState('');
  const [recommendation, setRecommendation] = useState<Recommendation>('Hold for Further');
  const [feedback, setFeedback] = useState<PanelFeedback[]>([]);
  const [summaryNotes, setSummaryNotes] = useState('');
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState('');
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState('');
  const [submitError, setSubmitError] = useState('');

  useEffect(() => {
    const loadCompleted = async () => {
      setLoading(true);
      setApiError('');
      try {
        const data = await apiRequest<CompletedInterview[]>('/interviews/completed', token);
        setCompletedInterviews(data);
        if (data.length > 0) {
          setSelectedId(data[0].id);
        }
      } catch (loadError) {
        setApiError(
          loadError instanceof Error ? loadError.message : 'Unable to load completed interviews',
        );
      } finally {
        setLoading(false);
      }
    };
    void loadCompleted();
  }, [token]);

  useEffect(() => {
    if (!selectedId) return;
    const loadDetails = async () => {
      setDetailsLoading(true);
      setSubmitMessage('');
      setSubmitError('');
      try {
        const details = await apiRequest<InterviewDetailsResponse>(
          `/interviews/${selectedId}/details`,
          token,
        );
        setFeedback(details.feedbacks);
        setRecommendation(
          RECOMMENDATION_OPTIONS_VALUES.includes(details.finalRecommendation as Recommendation)
            ? (details.finalRecommendation as Recommendation)
            : 'Hold for Further',
        );
        setSummaryNotes(details.summaryNotes ?? '');
      } catch {
        setFeedback([]);
        setSummaryNotes('');
      } finally {
        setDetailsLoading(false);
      }
    };
    void loadDetails();
  }, [selectedId, token]);

  const selectedInterview = useMemo(
    () =>
      completedInterviews.find((interview) => interview.id === selectedId) ??
      completedInterviews[0],
    [completedInterviews, selectedId],
  );

  const filteredInterviews = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return completedInterviews;
    return completedInterviews.filter((interview) =>
      [interview.candidate, interview.role, interview.department, interview.status].some((value) =>
        value.toLowerCase().includes(normalized),
      ),
    );
  }, [completedInterviews, query]);

  const updateScore = (
    id: string,
    key: 'technical' | 'communication' | 'culture',
    value: number,
  ) => {
    setFeedback((items) =>
      items.map((item) => (item.id === id ? { ...item, [key]: value } : item)),
    );
  };

  const updateDecision = (id: string, decision: 'PASS' | 'FAIL') => {
    setFeedback((items) => items.map((item) => (item.id === id ? { ...item, decision } : item)));
  };

  const updateNotes = (id: string, notes: string) => {
    setFeedback((items) => items.map((item) => (item.id === id ? { ...item, notes } : item)));
  };

  const submitResults = async () => {
    if (!selectedInterview) return;
    setSubmitting(true);
    setSubmitMessage('');
    setSubmitError('');
    try {
      await apiRequest(`/interviews/${selectedInterview.id}/results`, token, {
        method: 'POST',
        body: JSON.stringify({
          feedbacks: feedback.map((item) => ({
            evaluatorId: item.id,
            decision: item.decision,
            technical: item.technical,
            communication: item.communication,
            culture: item.culture,
            notes: item.notes,
          })),
          finalRecommendation: recommendation,
          summaryNotes,
        }),
      });
      setCompletedInterviews((items) =>
        items.map((item) =>
          item.id === selectedInterview.id ? { ...item, status: 'Recorded' } : item,
        ),
      );
      setSubmitMessage('Results submitted successfully.');
    } catch (error) {
      setSubmitError(error instanceof ApiError ? error.message : 'Unable to submit results');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-[1440px] space-y-6">
      <HRPageHeader
        eyebrow="HR Manager Portal"
        title="Interview Results"
        description="Record panel feedback, final recommendation, and supporting evidence after completed interviews."
        actions={
          <HRSearchInput
            className="w-full max-w-md"
            label="Search interview results"
            onChange={setQuery}
            placeholder="Search results, candidates, or panels..."
            value={query}
          />
        }
      />

      {apiError && <HRInlineAlert>{apiError}</HRInlineAlert>}

      {loading && <HRLoadingState label="Loading completed interviews..." />}

      {!loading && !selectedInterview && (
        <HREmptyState title="No completed interviews found." />
      )}

      {selectedInterview && (
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[380px_minmax(0,1fr)]">
          <aside className="overflow-hidden rounded-lg border border-border-warm bg-clean-surface shadow-sm xl:sticky xl:top-24">
            <div className="flex items-center justify-between border-b border-border-warm bg-workflow-ivory/60 p-4">
              <h2 className="text-xs font-bold uppercase tracking-[0.14em] text-slate-ink">
                Completed Interviews
              </h2>
              <span className="text-sm font-semibold text-teal-command">
                {filteredInterviews.length} Total
              </span>
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
                      <span
                        className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2 py-1 text-[11px] font-semibold ${statusClass[interview.status]}`}
                      >
                        <span className="h-1.5 w-1.5 rounded-full bg-current" />
                        {interview.status}
                      </span>
                    </div>
                    <p className="mb-2 text-sm text-slate-ink">{interview.role}</p>
                    <div className="flex items-center justify-between gap-3">
                      <span className="font-mono text-xs text-slate-ink">{interview.time}</span>
                      <span className="text-[11px] font-bold uppercase tracking-[0.08em] text-draft">
                        {interview.department}
                      </span>
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
                  <h2 className="text-xl font-semibold text-deep-charcoal">
                    Record Results - {selectedInterview.candidate}
                  </h2>
                  <p className="mt-1 text-sm font-semibold text-teal-command">
                    {selectedInterview.role}
                  </p>
                </div>
                <div className="sm:text-right">
                  <span className="mb-1 block text-xs font-bold uppercase tracking-[0.14em] text-slate-ink">
                    Reference ID
                  </span>
                  <span className="rounded bg-surface-container-low px-2 py-1 font-mono text-sm text-deep-charcoal">
                    #{selectedInterview.id.slice(0, 8)}
                  </span>
                </div>
              </div>
            </div>

            {detailsLoading && (
              <div className="px-6 pt-6 text-sm text-on-surface-variant">Loading panel feedback...</div>
            )}

            <div className="space-y-8 p-6">
              <section>
                <h3 className="mb-4 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] text-slate-ink">
                  <Icon className="h-4 w-4" name="groups" />
                  Panel Members Feedback
                </h3>
                <div className="space-y-5">
                  {feedback.map((item) => (
                    <article
                      className="rounded-lg border border-border-warm bg-workflow-ivory/20 p-4"
                      key={item.id}
                    >
                      <div className="flex flex-col gap-4 lg:flex-row lg:items-start">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-surface-container font-mono text-xs font-bold text-teal-command">
                          {item.initials}
                        </div>
                        <div className="min-w-0 flex-1 space-y-4">
                          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <p className="text-sm font-bold text-deep-charcoal">
                              {item.member} ({item.role})
                            </p>
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
                            {(
                              [
                                ['technical', 'Technical'],
                                ['communication', 'Communication'],
                                ['culture', 'Culture Fit'],
                              ] as const
                            ).map(([key, label]) => (
                              <label className="space-y-2" key={key}>
                                <span className="block text-[11px] font-bold uppercase tracking-[0.08em] text-slate-ink">
                                  {label} ({item[key]}/10)
                                </span>
                                <input
                                  className="h-1 w-full cursor-pointer accent-teal-command"
                                  max="10"
                                  min="0"
                                  onChange={(event) =>
                                    updateScore(item.id, key, Number(event.target.value))
                                  }
                                  type="range"
                                  value={item[key]}
                                />
                              </label>
                            ))}
                          </div>

                          <textarea
                            className="min-h-[88px] w-full rounded-lg border border-border-warm bg-clean-surface p-3 text-sm leading-6 outline-none focus:border-teal-command focus:ring-2 focus:ring-teal-command/20"
                            onChange={(event) => updateNotes(item.id, event.target.value)}
                            placeholder="Panel member observations..."
                            value={item.notes}
                          />
                        </div>
                      </div>
                    </article>
                  ))}
                  {feedback.length === 0 && !detailsLoading && (
                    <p className="text-sm text-on-surface-variant">No panel feedback recorded yet.</p>
                  )}
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
                      <div
                        className={`rounded-lg border border-border-warm p-4 text-center ring-1 ring-transparent transition ${option.tone}`}
                      >
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
                    onChange={(event) => setSummaryNotes(event.target.value)}
                    placeholder="Provide a high-level justification for the recommendation..."
                    value={summaryNotes}
                  />
                </label>

                <section className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-border-warm bg-workflow-ivory/40 p-8 text-center">
                  <Icon className="mb-2 h-8 w-8 text-outline" name="upload" />
                  <p className="mb-1 text-sm font-bold text-deep-charcoal">
                    Attach supporting documents
                  </p>
                  <p className="text-sm text-slate-ink">PDF, DOCX up to 10MB each</p>
                  <button
                    className="mt-4 rounded-lg border border-border-warm bg-white px-4 py-2 text-sm font-semibold shadow-sm transition hover:bg-surface active:scale-[0.98]"
                    type="button"
                  >
                    Browse Files
                  </button>
                </section>
              </section>
            </div>

            <footer className="flex flex-col gap-3 border-t border-border-warm bg-clean-surface p-5 sm:flex-row sm:items-center sm:justify-between">
              <div className="text-sm">
                {submitMessage && <span className="font-semibold text-approved">{submitMessage}</span>}
                {submitError && <span className="font-semibold text-rejected">{submitError}</span>}
              </div>
              <div className="flex flex-col gap-3 sm:flex-row">
                <button
                  className="rounded-lg border border-teal-command px-6 py-2.5 text-sm font-semibold text-teal-command transition hover:bg-teal-command/5 active:scale-[0.98] disabled:opacity-70"
                  disabled={submitting}
                  onClick={submitResults}
                  type="button"
                >
                  Save as Draft
                </button>
                <button
                  className="rounded-lg bg-teal-command px-8 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-primary active:scale-[0.98] disabled:opacity-70"
                  disabled={submitting}
                  onClick={submitResults}
                  type="button"
                >
                  {submitting ? 'Submitting...' : 'Submit to Admin for Decision'}
                </button>
              </div>
            </footer>
          </main>
        </div>
      )}
    </div>
  );
};
