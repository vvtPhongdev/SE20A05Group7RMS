import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { CheckCircle2, MessageSquareText, Star, Users } from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import { apiRequest, ApiError } from '../../../lib/api';
import {
  DeptHeadActionButton,
  DeptHeadCard,
  DeptHeadDashboardPage,
  DeptHeadEmptyState,
  DeptHeadInlineAlert,
  DeptHeadLoadingState,
  DeptHeadPageHeader,
  DeptHeadSearchInput,
  DeptHeadStatusBadge,
} from '../components/layout';

type RecordingStatus = 'Pending Recording' | 'Recorded';
type Decision = 'PASS' | 'FAIL';

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
  decision: Decision;
  technical: number;
  communication: number;
  culture: number;
  notes: string;
  isRecorded?: boolean;
};

type InterviewDetailsResponse = {
  id: string;
  candidate: string;
  role: string;
  department: string;
  time: string;
  status: RecordingStatus;
  feedbacks: PanelFeedback[];
  myFeedback?: PanelFeedback | null;
  canSubmitMyFeedback?: boolean;
};

type MyFeedbackResponse = {
  success: boolean;
  feedback: PanelFeedback;
};

const emptyFeedback = (user: { id: string; displayName: string; role: string } | null): PanelFeedback => ({
  id: user?.id ?? 'me',
  member: user?.displayName ?? 'Me',
  role: user?.role ?? 'Department Head',
  initials: getInitials(user?.displayName ?? 'Me'),
  decision: 'PASS',
  technical: 0,
  communication: 0,
  culture: 0,
  notes: '',
  isRecorded: false,
});

function getInitials(name: string) {
  return (
    name
      .split(' ')
      .filter(Boolean)
      .map((part) => part[0])
      .join('')
      .slice(0, 3)
      .toUpperCase() || 'U'
  );
}

const statusTone: Record<RecordingStatus, 'approved' | 'revision'> = {
  Recorded: 'approved',
  'Pending Recording': 'revision',
};

const scoreFields = [
  ['technical', 'Technical'],
  ['communication', 'Communication'],
  ['culture', 'Culture Fit'],
] as const;

const deptHeadFeedbackApi = {
  list: '/dept-head/interview-feedback',
  details: (id: string) => `/dept-head/interview-feedback/${id}`,
  myFeedback: (id: string) => `/dept-head/interview-feedback/${id}/my-feedback`,
};

const asRecord = (value: unknown): Record<string, unknown> =>
  value && typeof value === 'object' && !Array.isArray(value) ? (value as Record<string, unknown>) : {};

const asString = (value: unknown, fallback = '') => (typeof value === 'string' ? value : fallback);

const asNumber = (value: unknown) =>
  typeof value === 'number' && Number.isFinite(value) ? value : 0;

const asDecision = (value: unknown): Decision => (value === 'FAIL' ? 'FAIL' : 'PASS');

const asRecordingStatus = (value: unknown): RecordingStatus =>
  value === 'Recorded' ? 'Recorded' : 'Pending Recording';

const normalizeCompletedInterview = (value: unknown): CompletedInterview => {
  const item = asRecord(value);
  return {
    id: asString(item.id),
    candidate: asString(item.candidate, 'Unknown candidate'),
    role: asString(item.role, 'Unknown role'),
    department: asString(item.department, 'Unknown department'),
    time: asString(item.time, 'Not scheduled'),
    status: asRecordingStatus(item.status),
  };
};

const normalizePanelFeedback = (
  value: unknown,
  fallbackUser?: { id: string; displayName: string; role: string } | null,
): PanelFeedback => {
  const item = asRecord(value);
  const member = asString(item.member, fallbackUser?.displayName ?? 'Panel member');
  return {
    id: asString(item.id, fallbackUser?.id ?? 'unknown'),
    member,
    role: asString(item.role, fallbackUser?.role ?? 'Interviewer'),
    initials: asString(item.initials, getInitials(member)),
    decision: asDecision(item.decision),
    technical: asNumber(item.technical),
    communication: asNumber(item.communication),
    culture: asNumber(item.culture),
    notes: asString(item.notes),
    isRecorded: Boolean(item.isRecorded),
  };
};

const normalizeInterviewDetails = (
  value: unknown,
  fallbackUser?: { id: string; displayName: string; role: string } | null,
): InterviewDetailsResponse => {
  const item = asRecord(value);
  const feedbacks = Array.isArray(item.feedbacks)
    ? item.feedbacks.map((feedback) => normalizePanelFeedback(feedback))
    : [];
  const myFeedback = item.myFeedback
    ? normalizePanelFeedback(item.myFeedback, fallbackUser)
    : null;

  return {
    id: asString(item.id),
    candidate: asString(item.candidate, 'Unknown candidate'),
    role: asString(item.role, 'Unknown role'),
    department: asString(item.department, 'Unknown department'),
    time: asString(item.time, 'Not scheduled'),
    status: asRecordingStatus(item.status),
    feedbacks,
    myFeedback,
    canSubmitMyFeedback: item.canSubmitMyFeedback !== false,
  };
};

export const DeptHeadInterviewFeedback: React.FC = () => {
  const { token, user } = useAuth();
  const [interviews, setInterviews] = useState<CompletedInterview[]>([]);
  const [selectedId, setSelectedId] = useState('');
  const [query, setQuery] = useState('');
  const [panelFeedback, setPanelFeedback] = useState<PanelFeedback[]>([]);
  const [myFeedback, setMyFeedback] = useState<PanelFeedback>(() => emptyFeedback(user));
  const [canSubmitMyFeedback, setCanSubmitMyFeedback] = useState(true);
  const [loading, setLoading] = useState(true);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [apiError, setApiError] = useState('');
  const [submitMessage, setSubmitMessage] = useState('');
  const [submitError, setSubmitError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const loadInterviews = useCallback(
    async (preserveSelection = false) => {
      setLoading(true);
      setApiError('');
      try {
        const data = await apiRequest<unknown[]>(deptHeadFeedbackApi.list, token);
        const normalized = data.map(normalizeCompletedInterview).filter((item) => item.id);
        setInterviews(normalized);
        setSelectedId((current) =>
          preserveSelection && normalized.some((item) => item.id === current)
            ? current
            : current || normalized[0]?.id || '',
        );
      } catch (error) {
        setApiError(error instanceof Error ? error.message : 'Unable to load interview feedback');
      } finally {
        setLoading(false);
      }
    },
    [token],
  );

  useEffect(() => {
    void loadInterviews();
  }, [loadInterviews]);

  useEffect(() => {
    if (!selectedId) return;

    const loadDetails = async () => {
      setDetailsLoading(true);
      setSubmitMessage('');
      setSubmitError('');
      try {
        const detailsResponse = await apiRequest<unknown>(
          deptHeadFeedbackApi.details(selectedId),
          token,
        );
        const details = normalizeInterviewDetails(detailsResponse, user);
        const ownFeedback =
          details.myFeedback ||
          details.feedbacks.find((feedback) => feedback.id === user?.id) ||
          emptyFeedback(user);

        setPanelFeedback(details.feedbacks);
        setMyFeedback(ownFeedback);
        setCanSubmitMyFeedback(details.canSubmitMyFeedback ?? true);
      } catch (error) {
        setPanelFeedback([]);
        setMyFeedback(emptyFeedback(user));
        setSubmitError(error instanceof Error ? error.message : 'Unable to load interview details');
      } finally {
        setDetailsLoading(false);
      }
    };

    void loadDetails();
  }, [selectedId, token, user]);

  const selectedInterview = useMemo(
    () => interviews.find((interview) => interview.id === selectedId) ?? interviews[0],
    [interviews, selectedId],
  );

  const filteredInterviews = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return interviews;
    return interviews.filter((interview) =>
      [interview.candidate, interview.role, interview.department, interview.status].some((value) =>
        value.toLowerCase().includes(normalized),
      ),
    );
  }, [interviews, query]);

  const updateMyScore = (
    key: 'technical' | 'communication' | 'culture',
    value: number,
  ) => {
    setMyFeedback((current) => ({ ...current, [key]: value }));
  };

  const submitMyFeedback = async () => {
    if (!selectedInterview) return;

    setSubmitting(true);
    setSubmitMessage('');
    setSubmitError('');
    try {
      const response = await apiRequest<MyFeedbackResponse>(
        deptHeadFeedbackApi.myFeedback(selectedInterview.id),
        token,
        {
          method: 'POST',
          body: JSON.stringify({
            decision: myFeedback.decision,
            technical: myFeedback.technical,
            communication: myFeedback.communication,
            culture: myFeedback.culture,
            notes: myFeedback.notes,
          }),
        },
      );

      const savedFeedback = normalizePanelFeedback(response.feedback, user);
      setMyFeedback(savedFeedback);
      setPanelFeedback((items) => {
        const exists = items.some((item) => item.id === savedFeedback.id);
        return exists
          ? items.map((item) => (item.id === savedFeedback.id ? savedFeedback : item))
          : [...items, savedFeedback];
      });
      setSubmitMessage('Your interview evaluation has been saved.');
      await loadInterviews(true);
    } catch (error) {
      setSubmitError(error instanceof ApiError ? error.message : 'Unable to save evaluation');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <DeptHeadDashboardPage>
      <DeptHeadPageHeader
        title="Interview Evaluations"
        description="Review panel feedback for candidates and submit your own score and comments after the interview time."
        actions={
          <DeptHeadSearchInput
            className="w-full min-w-[280px]"
            label="Search interview evaluations"
            onChange={setQuery}
            placeholder="Search candidates, roles, departments..."
            value={query}
          />
        }
      />

      {apiError && <DeptHeadInlineAlert>{apiError}</DeptHeadInlineAlert>}
      {loading && <DeptHeadLoadingState label="Loading interview evaluations..." />}

      {!loading && !selectedInterview && (
        <DeptHeadEmptyState
          title="No interview evaluations available."
          description="Completed or past interviews assigned to your department will appear here."
        />
      )}

      {selectedInterview && (
        <div className="grid gap-6 xl:grid-cols-[360px_minmax(0,1fr)]">
          <aside className="overflow-hidden rounded-lg border border-border-warm bg-clean-surface shadow-sm xl:sticky xl:top-24">
            <div className="flex items-center justify-between border-b border-border-warm bg-workflow-ivory/60 p-4">
              <h2 className="text-xs font-bold uppercase tracking-[0.14em] text-slate-ink">
                Interviews
              </h2>
              <span className="text-sm font-semibold text-teal-command">
                {filteredInterviews.length} total
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
                    <div className="mb-2 flex items-start justify-between gap-3">
                      <h3 className="text-sm font-bold text-deep-charcoal">
                        {interview.candidate}
                      </h3>
                      <DeptHeadStatusBadge tone={statusTone[interview.status]}>
                        {interview.status}
                      </DeptHeadStatusBadge>
                    </div>
                    <p className="text-sm text-slate-ink">{interview.role}</p>
                    <div className="mt-3 flex items-center justify-between gap-3">
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

          <main className="space-y-6">
            <DeptHeadCard className="p-0">
              <div className="border-b border-border-warm bg-workflow-ivory/40 p-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-ink">
                      Candidate
                    </p>
                    <h2 className="mt-1 text-xl font-semibold text-deep-charcoal">
                      {selectedInterview.candidate}
                    </h2>
                    <p className="mt-1 text-sm font-semibold text-teal-command">
                      {selectedInterview.role}
                    </p>
                  </div>
                  <div className="sm:text-right">
                    <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-ink">
                      Interview
                    </p>
                    <p className="mt-1 font-mono text-sm text-deep-charcoal">
                      {selectedInterview.time}
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-5 p-6">
                <h3 className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] text-slate-ink">
                  <Users className="h-4 w-4" />
                  Panel Feedback
                </h3>

                {detailsLoading && (
                  <p className="text-sm text-on-surface-variant">Loading feedback details...</p>
                )}

                {!detailsLoading && panelFeedback.length === 0 && (
                  <p className="text-sm text-on-surface-variant">No panel feedback recorded yet.</p>
                )}

                <div className="grid gap-4 lg:grid-cols-2">
                  {panelFeedback.map((feedback) => (
                    <article
                      className="rounded-lg border border-border-warm bg-workflow-ivory/20 p-4"
                      key={feedback.id}
                    >
                      <div className="mb-4 flex items-start justify-between gap-3">
                        <div className="flex min-w-0 items-center gap-3">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-surface-container font-mono text-xs font-bold text-teal-command">
                            {feedback.initials}
                          </div>
                          <div className="min-w-0">
                            <p className="truncate text-sm font-bold text-deep-charcoal">
                              {feedback.member}
                            </p>
                            <p className="text-xs text-slate-ink">{feedback.role}</p>
                          </div>
                        </div>
                        <span
                          className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.08em] ${
                            feedback.decision === 'PASS'
                              ? 'border-approved/20 bg-approved/10 text-approved'
                              : 'border-rejected/20 bg-rejected/10 text-rejected'
                          }`}
                        >
                          {feedback.decision === 'PASS' ? 'Pass' : 'Fail'}
                        </span>
                      </div>

                      <div className="grid grid-cols-3 gap-2">
                        {scoreFields.map(([key, label]) => (
                          <div
                            className="rounded-lg border border-border-warm bg-clean-surface p-3 text-center"
                            key={key}
                          >
                            <p className="text-lg font-semibold text-deep-charcoal">
                              {feedback[key]}/10
                            </p>
                            <p className="mt-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-ink">
                              {label}
                            </p>
                          </div>
                        ))}
                      </div>

                      <p className="mt-4 min-h-[48px] text-sm leading-6 text-slate-ink">
                        {feedback.notes || 'No comment recorded.'}
                      </p>
                    </article>
                  ))}
                </div>
              </div>
            </DeptHeadCard>

            <DeptHeadCard>
              <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h3 className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] text-slate-ink">
                    <MessageSquareText className="h-4 w-4" />
                    My Evaluation
                  </h3>
                  <p className="mt-2 text-sm text-slate-ink">
                    This score and comment will be visible to HR for the hiring decision.
                  </p>
                </div>
                <div className="flex w-fit rounded-lg bg-surface-container-high p-1">
                  {(['PASS', 'FAIL'] as const).map((decision) => {
                    const decisionLabel = decision === 'PASS' ? 'Pass' : 'Fail';

                    return (
                      <button
                        className={`rounded-md border px-4 py-1.5 text-xs font-bold transition active:scale-[0.98] ${
                          myFeedback.decision === decision
                            ? decision === 'PASS'
                              ? 'border-approved/30 bg-approved/10 text-approved shadow-sm'
                              : 'border-rejected/30 bg-rejected/10 text-rejected shadow-sm'
                            : decision === 'PASS'
                              ? 'border-transparent text-approved hover:bg-approved/10'
                              : 'border-transparent text-rejected hover:bg-rejected/10'
                        }`}
                        disabled={!canSubmitMyFeedback || submitting}
                        key={decision}
                        onClick={() => setMyFeedback((current) => ({ ...current, decision }))}
                        type="button"
                      >
                        {decisionLabel}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="grid gap-5 md:grid-cols-3">
                {scoreFields.map(([key, label]) => (
                  <label className="space-y-2" key={key}>
                    <span className="flex items-center justify-between text-xs font-bold uppercase tracking-[0.08em] text-slate-ink">
                      {label}
                      <span className="inline-flex items-center gap-1 text-teal-command">
                        <Star className="h-3.5 w-3.5" />
                        {myFeedback[key]}/10
                      </span>
                    </span>
                    <input
                      className="h-1 w-full cursor-pointer accent-teal-command disabled:cursor-not-allowed disabled:opacity-60"
                      disabled={!canSubmitMyFeedback || submitting}
                      max="10"
                      min="0"
                      onChange={(event) => updateMyScore(key, Number(event.target.value))}
                      type="range"
                      value={myFeedback[key]}
                    />
                  </label>
                ))}
              </div>

              <label className="mt-5 block space-y-2">
                <span className="text-sm font-bold text-slate-ink">Comments</span>
                <textarea
                  className="min-h-[120px] w-full rounded-lg border border-border-warm bg-clean-surface p-4 text-sm leading-6 outline-none focus:border-teal-command focus:ring-2 focus:ring-teal-command/20 disabled:cursor-not-allowed disabled:opacity-60"
                  disabled={!canSubmitMyFeedback || submitting}
                  onChange={(event) =>
                    setMyFeedback((current) => ({ ...current, notes: event.target.value }))
                  }
                  placeholder="Add strengths, risks, and recommendation context for HR..."
                  value={myFeedback.notes}
                />
              </label>

              {!canSubmitMyFeedback && (
                <DeptHeadInlineAlert tone="revision">
                  You do not have permission to submit feedback for this interview.
                </DeptHeadInlineAlert>
              )}

              <div className="mt-5 flex flex-col gap-3 border-t border-border-warm pt-5 sm:flex-row sm:items-center sm:justify-between">
                <div className="text-sm">
                  {submitMessage && (
                    <span className="inline-flex items-center gap-2 font-semibold text-approved">
                      <CheckCircle2 className="h-4 w-4" />
                      {submitMessage}
                    </span>
                  )}
                  {submitError && <span className="font-semibold text-rejected">{submitError}</span>}
                </div>
                <DeptHeadActionButton
                  disabled={!canSubmitMyFeedback || submitting}
                  onClick={submitMyFeedback}
                >
                  {submitting ? 'Saving...' : 'Save Evaluation'}
                </DeptHeadActionButton>
              </div>
            </DeptHeadCard>
          </main>
        </div>
      )}
    </DeptHeadDashboardPage>
  );
};
