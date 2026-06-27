import React, { useEffect, useState, useMemo } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { apiRequest } from '../../../lib/api';
import { AdminDashboardPage, AdminInlineAlert, AdminPageHeader } from '../components';

type DecisionStatus =
  | 'Awaiting Decision'
  | 'Approved'
  | 'Rejected'
  | 'Request Info'
  | 'Decision Made';

interface PanelistFeedback {
  name: string;
  role: string;
  status: 'PASS' | 'FAIL' | 'PENDING';
  ratings?: {
    tech: number;
    comm: number;
    fit: number;
  };
  comment: string;
}

interface CandidateResult {
  id: string;
  candidateId: string;
  name: string;
  role: string;
  department: string;
  interviewDate: string;
  requestId: string;
  status: DecisionStatus;
  photoUrl: string;
  passCount: number;
  failCount: number;
  pendingCount: number;
  feedbacks: PanelistFeedback[];
  scores: {
    tech: number;
    comm: number;
    fit: number;
  };
  recommendation: 'Hire' | 'Reject' | 'More Info';
  assessmentSummary: string;
}
type FilterType = 'All Pending Decisions' | 'All Decisions' | 'Decision Made';

interface InterviewResultApi {
  id: string;
  candidate: string;
  candidateId: string;
  role: string;
  department: string;
  interviewDate: string;
  requestId: string;
  decisionStatus: DecisionStatus;
  feedbacks: PanelistFeedback[];
  passCount: number;
  failCount: number;
  pendingCount: number;
  scores: CandidateResult['scores'];
  finalRecommendation: string;
  summaryNotes: string;
}

interface CandidateProfileDetail {
  id: string;
  fullName?: string;
  email?: string;
  phone?: string;
  summary?: string;
  structuredData?: Record<string, unknown>;
}

type DecisionFormMode = 'offer' | 'reject' | null;

interface OfferEmailForm {
  compensation: string;
  startDate: string;
  notes: string;
}

interface RejectEmailForm {
  notes: string;
}

const adminInterviewResultsApi = {
  list: '/admin/interview-results',
  decision: (requestId: string) => `/admin/interview-results/${requestId}/decision`,
  requestInfo: (requestId: string) => `/admin/interview-results/${requestId}/request-info`,
};

const emptyCandidate: CandidateResult = {
  id: '',
  candidateId: '',
  name: 'No interview selected',
  role: '',
  department: '',
  interviewDate: '',
  requestId: '',
  status: 'Awaiting Decision',
  photoUrl: '',
  passCount: 0,
  failCount: 0,
  pendingCount: 0,
  feedbacks: [],
  scores: { tech: 0, comm: 0, fit: 0 },
  recommendation: 'More Info',
  assessmentSummary: 'No completed interview results are available.',
};

const defaultOfferStartDate = () =>
  new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

export const AdminInterviewResults: React.FC = () => {
  const { token } = useAuth();
  const [candidates, setCandidates] = useState<CandidateResult[]>([]);
  const [selectedId, setSelectedId] = useState<string>('');
  const [filterType, setFilterType] = useState<FilterType>('All Pending Decisions');
  const [isFilterDropdownOpen, setIsFilterDropdownOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState('');
  const [actionMessage, setActionMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [profileDetail, setProfileDetail] = useState<CandidateProfileDetail | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [decisionFormMode, setDecisionFormMode] = useState<DecisionFormMode>(null);
  const [offerForm, setOfferForm] = useState<OfferEmailForm>({
    compensation: 'Negotiable',
    startDate: defaultOfferStartDate(),
    notes: '',
  });
  const [rejectForm, setRejectForm] = useState<RejectEmailForm>({ notes: '' });

  useEffect(() => {
    let cancelled = false;
    const loadResults = async () => {
      setLoading(true);
      setApiError('');
      setActionMessage('');
      try {
        const response = await apiRequest<InterviewResultApi[]>(
          adminInterviewResultsApi.list,
          token,
        );
        if (cancelled) return;
        const mapped = response.map((result) => ({
          id: result.id,
          candidateId: result.candidateId,
          name: result.candidate,
          role: result.role,
          department: result.department,
          interviewDate: new Date(result.interviewDate).toLocaleDateString(),
          requestId: result.requestId,
          status: result.decisionStatus,
          photoUrl: '',
          passCount: result.passCount,
          failCount: result.failCount,
          pendingCount: result.pendingCount,
          feedbacks: result.feedbacks,
          scores: result.scores,
          recommendation: result.finalRecommendation.toLowerCase().includes('hire')
            ? ('Hire' as const)
            : result.finalRecommendation.toLowerCase().includes('reject')
              ? ('Reject' as const)
              : ('More Info' as const),
          assessmentSummary:
            result.summaryNotes || 'The interview panel has not provided an overall summary.',
        }));
        setCandidates(mapped);
        setSelectedId((current) =>
          mapped.some((candidate) => candidate.id === current) ? current : mapped[0]?.id || '',
        );
      } catch (error) {
        if (!cancelled) {
          setApiError(error instanceof Error ? error.message : 'Unable to load interview results');
          setCandidates([]);
          setSelectedId('');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    void loadResults();
    return () => {
      cancelled = true;
    };
  }, [token]);

  // Active candidate object
  const activeCandidate = useMemo(() => {
    return candidates.find((c) => c.id === selectedId) || candidates[0] || emptyCandidate;
  }, [candidates, selectedId]);

  // Filter queue items
  const filteredCandidates = useMemo(() => {
    return candidates.filter((c) => {
      if (filterType === 'All Pending Decisions') {
        return c.status === 'Awaiting Decision';
      }
      if (filterType === 'Decision Made') {
        return (
          c.status === 'Decision Made' ||
          c.status === 'Approved' ||
          c.status === 'Rejected' ||
          c.status === 'Request Info'
        );
      }
      return true; // 'All Decisions'
    });
  }, [candidates, filterType]);

  const pendingCount = useMemo(() => {
    return candidates.filter((c) => c.status === 'Awaiting Decision').length;
  }, [candidates]);

  const recordedFeedbackCount = activeCandidate.passCount + activeCandidate.failCount;
  const canApproveHire =
    Boolean(activeCandidate.id) && recordedFeedbackCount >= 2 && activeCandidate.passCount > 0;

  const markDecisionState = (
    candidate: CandidateResult,
    action: 'Approved' | 'Rejected' | 'Request Info',
  ) => {
    setCandidates((prev) =>
      prev.map((item) =>
        action === 'Request Info'
          ? item.id === candidate.id
            ? { ...item, status: 'Request Info' }
            : item
          : item.requestId === candidate.requestId
            ? { ...item, status: action }
            : item,
      ),
    );
  };

  const submitOfferEmail = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const candidate = activeCandidate;
    if (!candidate.id) return;
    const compensation = offerForm.compensation.trim();
    const notes = offerForm.notes.trim();
    const startDateValue = offerForm.startDate;

    if (!compensation || !notes) {
      setApiError('Offer compensation and email notes are required.');
      return;
    }
    if (!startDateValue || Number.isNaN(new Date(startDateValue).getTime())) {
      setApiError('A valid offer start date is required.');
      return;
    }

    setSubmitting(true);
    setApiError('');
    setActionMessage('');
    try {
      await apiRequest(adminInterviewResultsApi.decision(candidate.requestId), token, {
        method: 'POST',
        body: JSON.stringify({
          decision: 'HIRE',
          candidateId: candidate.candidateId,
          compensation,
          startDate: new Date(`${startDateValue}T00:00:00.000Z`).toISOString(),
          notes,
        }),
      });
      markDecisionState(candidate, 'Approved');
      setDecisionFormMode(null);
      setActionMessage(`Offer email has been queued for ${candidate.name}.`);
    } catch (error) {
      setApiError(error instanceof Error ? error.message : 'Unable to save the hiring decision');
    } finally {
      setSubmitting(false);
    }
  };

  const submitRejectEmail = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const candidate = activeCandidate;
    if (!candidate.id) return;
    const notes = rejectForm.notes.trim();
    if (!notes) {
      setApiError('Rejection email reason is required.');
      return;
    }

    setSubmitting(true);
    setApiError('');
    setActionMessage('');
    try {
      await apiRequest(adminInterviewResultsApi.decision(candidate.requestId), token, {
        method: 'POST',
        body: JSON.stringify({
          decision: 'REJECT',
          notes,
        }),
      });
      markDecisionState(candidate, 'Rejected');
      setDecisionFormMode(null);
      setActionMessage(`Rejection email has been queued for ${candidate.name}.`);
    } catch (error) {
      setApiError(error instanceof Error ? error.message : 'Unable to save the hiring decision');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRequestInfo = async (id: string) => {
    const candidate = candidates.find((item) => item.id === id);
    if (!candidate) return;
    const notes = window.prompt('Describe the additional information required:');
    if (!notes?.trim()) return;

    setSubmitting(true);
    setApiError('');
    setActionMessage('');
    try {
      await apiRequest(adminInterviewResultsApi.requestInfo(candidate.requestId), token, {
        method: 'POST',
        body: JSON.stringify({
          candidateId: candidate.candidateId,
          notes: notes.trim(),
        }),
      });
      markDecisionState(candidate, 'Request Info');
      setActionMessage(`Information request has been saved for ${candidate.name}.`);
    } catch (error) {
      setApiError(error instanceof Error ? error.message : 'Unable to save the hiring decision');
    } finally {
      setSubmitting(false);
    }
  };

  const openOfferEmailForm = () => {
    if (!activeCandidate.id) return;
    setOfferForm({
      compensation: 'Negotiable',
      startDate: defaultOfferStartDate(),
      notes: `We are pleased to offer ${activeCandidate.name} the ${activeCandidate.role} position in ${activeCandidate.department}.`,
    });
    setApiError('');
    setDecisionFormMode('offer');
  };

  const openRejectEmailForm = () => {
    if (!activeCandidate.id) return;
    setRejectForm({
      notes: `Thank you for interviewing for the ${activeCandidate.role} position. After careful consideration, we will not move forward with your application at this time.`,
    });
    setApiError('');
    setDecisionFormMode('reject');
  };

  const openCandidateProfile = async () => {
    if (!activeCandidate.candidateId) return;
    setProfileLoading(true);
    setApiError('');
    try {
      setProfileDetail(
        await apiRequest<CandidateProfileDetail>(
          `/candidate-profiles/${activeCandidate.candidateId}`,
          token,
        ),
      );
    } catch (profileError) {
      setApiError(profileError instanceof Error ? profileError.message : 'Unable to load profile');
    } finally {
      setProfileLoading(false);
    }
  };

  return (
    <AdminDashboardPage className="h-[calc(100vh-140px)] overflow-hidden bg-workflow-ivory select-none">
      <AdminPageHeader
        title="Interview Results Review"
        description="Review panel feedback and make hiring decisions"
        actions={
          <div className="relative">
            <button
              className="flex items-center gap-2 rounded-lg border border-border-warm bg-clean-surface px-4 py-2 text-sm font-semibold shadow-sm outline-none transition-colors hover:bg-parchment-lift"
              onClick={() => setIsFilterDropdownOpen((prev) => !prev)}
              type="button"
            >
              <span className="material-symbols-outlined text-[20px]">filter_list</span>
              <span>
                {filterType === 'All Pending Decisions'
                  ? `All Pending Decisions (${pendingCount})`
                  : filterType === 'Decision Made'
                    ? `Decision Made (${candidates.length - pendingCount})`
                    : `All Decisions (${candidates.length})`}
              </span>
              <span className="material-symbols-outlined text-[18px]">expand_more</span>
            </button>
            {isFilterDropdownOpen && (
              <div className="absolute right-0 z-50 mt-2 w-64 rounded-lg border border-border-warm bg-clean-surface py-1 text-sm font-semibold shadow-lg">
                {(['All Pending Decisions', 'Decision Made', 'All Decisions'] as const).map((opt) => (
                  <button
                    key={opt}
                    className="w-full px-4 py-2 text-left text-sm font-semibold outline-none transition-colors hover:bg-surface-container-high"
                    type="button"
                    onClick={() => {
                      setFilterType(opt);
                      setIsFilterDropdownOpen(false);
                    }}
                  >
                    {opt === 'All Pending Decisions'
                      ? `All Pending Decisions (${pendingCount})`
                      : opt === 'Decision Made'
                        ? `Decision Made (${candidates.length - pendingCount})`
                        : `All Decisions (${candidates.length})`}
                  </button>
                ))}
              </div>
            )}
          </div>
        }
      />
      {apiError && <AdminInlineAlert>{apiError}</AdminInlineAlert>}
      {actionMessage && <AdminInlineAlert tone="approved">{actionMessage}</AdminInlineAlert>}

      {/* Split Pane Layout */}
      <div className="flex flex-grow overflow-hidden gap-6 min-h-0 select-none pb-2">
        {/* LEFT PANE: Candidate Queue (40% width) */}
        <section className="w-[40%] flex flex-col overflow-hidden min-w-[280px]">
          <div className="flex justify-between items-center mb-4 shrink-0">
            <h3 className="font-label-md text-label-md uppercase tracking-wider text-slate-ink opacity-70 font-semibold text-xs">
              Interview Results Queue
            </h3>
            <span className="text-label-sm font-data-mono text-slate-ink font-semibold text-xs">
              {filteredCandidates.length} ITEMS
            </span>
          </div>

          {/* Scrollable list */}
          <div className="flex-grow overflow-y-auto custom-scrollbar space-y-3 pr-2 pb-6">
            {filteredCandidates.map((candidate) => {
              const isSelected = candidate.id === selectedId;
              const isAwaiting = candidate.status === 'Awaiting Decision';
              return (
                <div
                  key={candidate.id}
                  className={`bg-clean-surface p-4 border border-border-warm shadow-sm cursor-pointer hover:border-teal-command transition-all group rounded-lg ${
                    isSelected ? 'border-l-4 border-l-teal-command' : ''
                  }`}
                  onClick={() => setSelectedId(candidate.id)}
                >
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h4 className="font-headline-md text-headline-md text-deep-charcoal group-hover:text-teal-command font-semibold text-lg leading-tight transition-colors">
                        {candidate.name}
                      </h4>
                      <p className="text-body-sm text-slate-ink font-medium mt-0.5">
                        {candidate.role}
                      </p>
                    </div>
                    <span
                      className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-tighter ${
                        isAwaiting
                          ? 'bg-secondary-fixed text-revision'
                          : 'bg-teal-command/10 text-teal-command border border-teal-command/20'
                      }`}
                    >
                      {candidate.status === 'Awaiting Decision'
                        ? 'Awaiting Decision'
                        : candidate.status}
                    </span>
                  </div>

                  <div className="flex justify-between items-end mt-4">
                    <div className="flex gap-2">
                      {candidate.passCount > 0 && (
                        <span className="bg-[#e8f5ef] text-approved text-[10px] font-bold px-2 py-0.5 rounded border border-approved/20">
                          {candidate.passCount} PASS
                        </span>
                      )}
                      {candidate.failCount > 0 && (
                        <span className="bg-[#fde8e8] text-rejected text-[10px] font-bold px-2 py-0.5 rounded border border-rejected/20">
                          {candidate.failCount} FAIL
                        </span>
                      )}
                      {candidate.pendingCount > 0 && (
                        <span className="bg-pending/10 text-pending text-[10px] font-bold px-2 py-0.5 rounded border border-pending/20">
                          {candidate.pendingCount} PENDING
                        </span>
                      )}
                    </div>
                    <p className="font-data-mono text-label-sm text-slate-ink opacity-65 font-semibold text-xs">
                      {candidate.interviewDate.toUpperCase()}
                    </p>
                  </div>
                </div>
              );
            })}

            {filteredCandidates.length === 0 && (
              <div className="text-center py-12 bg-clean-surface border border-border-warm rounded-lg text-slate-ink font-medium">
                {loading ? 'Loading interview results...' : 'No interview results found.'}
              </div>
            )}
          </div>
        </section>

        {/* RIGHT PANE: Details panel (60% width) */}
        <section className="w-[60%] flex flex-col overflow-hidden min-w-[360px]">
          <div className="flex justify-between items-center mb-4 shrink-0">
            <h3 className="font-label-md text-label-md uppercase tracking-wider text-slate-ink opacity-70 font-semibold text-xs">
              Interview Detail
            </h3>
            <button
              className="text-teal-command hover:underline text-label-sm flex items-center gap-1 font-semibold text-xs"
              disabled={!activeCandidate.candidateId || profileLoading}
              onClick={() => void openCandidateProfile()}
              type="button"
            >
              <span className="material-symbols-outlined text-[16px]">open_in_new</span>
              <span>View Full Profile</span>
            </button>
          </div>

          {/* Detail container card */}
          <div className="flex-grow bg-clean-surface border border-border-warm shadow-md overflow-hidden flex flex-col relative rounded-lg h-full">
            <div className="flex-grow overflow-y-auto custom-scrollbar p-6 space-y-6 pb-28">
              {/* Candidate Profile Details */}
              <div className="border-b border-border-warm pb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  {activeCandidate.photoUrl ? (
                    <img
                      alt={`${activeCandidate.name} Portrait`}
                      className="w-16 h-16 rounded-lg border-2 border-parchment-lift object-cover shadow-sm"
                      src={activeCandidate.photoUrl}
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-lg border-2 border-parchment-lift bg-teal-command text-white flex items-center justify-center font-bold text-xl shadow-sm">
                      {activeCandidate.name
                        .split(' ')
                        .map((part) => part[0])
                        .join('')
                        .slice(0, 2)
                        .toUpperCase()}
                    </div>
                  )}
                  <div>
                    <h2 className="font-headline-xl text-headline-xl text-deep-charcoal font-semibold">
                      {activeCandidate.name}
                    </h2>
                    <p className="text-body-lg text-slate-ink font-medium">
                      {activeCandidate.role}
                    </p>
                  </div>
                </div>

                {/* Tags */}
                <div className="flex flex-wrap gap-2">
                  <span className="px-3 py-1 bg-parchment-lift text-deep-charcoal text-xs font-semibold rounded-lg flex items-center gap-1.5 border border-border-warm">
                    <span className="material-symbols-outlined text-[16px]">corporate_fare</span>
                    {activeCandidate.department}
                  </span>
                  <span className="px-3 py-1 bg-parchment-lift text-deep-charcoal text-xs font-semibold rounded-lg flex items-center gap-1.5 border border-border-warm">
                    <span className="material-symbols-outlined text-[16px]">event</span>
                    Interviewed: {activeCandidate.interviewDate}
                  </span>
                  <span className="px-3 py-1 bg-parchment-lift text-slate-ink font-data-mono text-xs font-semibold rounded-lg border border-border-warm">
                    {activeCandidate.requestId}
                  </span>
                </div>
              </div>

              {/* Panelist Feedback */}
              <div className="space-y-4">
                <h4 className="font-label-md text-label-md text-slate-ink uppercase tracking-wider font-semibold text-xs">
                  Panel Feedback ({activeCandidate.feedbacks.length} Members)
                </h4>

                {activeCandidate.feedbacks.map((fb, idx) => (
                  <div
                    key={idx}
                    className="grid grid-cols-[1fr_2fr] gap-6 p-4 border border-border-warm bg-workflow-ivory/40 rounded-lg shadow-sm"
                  >
                    <div>
                      <p className="font-bold text-deep-charcoal text-sm">{fb.name}</p>
                      <p className="text-label-sm text-slate-ink text-xs mt-0.5 font-medium">
                        {fb.role}
                      </p>
                      <div
                        className={`mt-4 inline-flex items-center gap-1.5 px-2.5 py-0.5 border rounded font-bold text-[10px] uppercase tracking-wider ${
                          fb.status === 'PASS'
                            ? 'bg-approved/10 text-approved border-approved/20'
                            : fb.status === 'FAIL'
                              ? 'bg-rejected/10 text-rejected border-rejected/20'
                              : 'bg-pending/10 text-pending border-pending/20'
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            fb.status === 'PASS'
                              ? 'bg-approved'
                              : fb.status === 'FAIL'
                                ? 'bg-rejected'
                                : 'bg-pending'
                          }`}
                        />
                        {fb.status}
                      </div>
                    </div>
                    <div>
                      {fb.ratings && (
                        <div className="flex gap-4 mb-3 text-xs font-semibold text-slate-ink">
                          <span>
                            Tech: <b className="text-teal-command">{fb.ratings.tech}/10</b>
                          </span>
                          <span>
                            Comm: <b className="text-teal-command">{fb.ratings.comm}/10</b>
                          </span>
                          <span>
                            Fit: <b className="text-teal-command">{fb.ratings.fit}/10</b>
                          </span>
                        </div>
                      )}
                      <p className="text-body-sm text-slate-ink italic text-sm font-medium leading-relaxed">
                        "{fb.comment}"
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Overall Assessment */}
              <div className="space-y-6">
                <h4 className="font-label-md text-label-md text-slate-ink uppercase tracking-wider font-semibold text-xs">
                  Overall Assessment
                </h4>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-xs font-semibold text-slate-ink mb-1.5">
                      <span>Technical Proficiency</span>
                      <span className="font-bold">{activeCandidate.scores.tech} / 10</span>
                    </div>
                    <div className="w-full h-2 bg-parchment-lift rounded-full overflow-hidden border border-border-warm">
                      <div
                        className="h-full bg-teal-command"
                        style={{ width: `${activeCandidate.scores.tech * 10}%` }}
                      />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-xs font-semibold text-slate-ink mb-1.5">
                      <span>Communication & Collaboration</span>
                      <span className="font-bold">{activeCandidate.scores.comm} / 10</span>
                    </div>
                    <div className="w-full h-2 bg-parchment-lift rounded-full overflow-hidden border border-border-warm">
                      <div
                        className="h-full bg-teal-command"
                        style={{ width: `${activeCandidate.scores.comm * 10}%` }}
                      />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-xs font-semibold text-slate-ink mb-1.5">
                      <span>Team Fit</span>
                      <span className="font-bold">{activeCandidate.scores.fit} / 10</span>
                    </div>
                    <div className="w-full h-2 bg-parchment-lift rounded-full overflow-hidden border border-border-warm">
                      <div
                        className="h-full bg-teal-command"
                        style={{ width: `${activeCandidate.scores.fit * 10}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Recommendation details */}
                <div className="p-4 bg-teal-command/5 border border-teal-command/20 rounded-lg shadow-sm">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="material-symbols-outlined text-teal-command text-[24px]">
                      recommend
                    </span>
                    <span className="font-headline-md text-headline-md text-teal-command font-bold">
                      Recommendation: {activeCandidate.recommendation}
                    </span>
                  </div>
                  <p className="text-sm text-slate-ink font-semibold leading-relaxed">
                    {activeCandidate.assessmentSummary}
                  </p>
                </div>
              </div>
            </div>

            {/* Sticky Action Panel */}
            <div className="absolute bottom-0 left-0 right-0 p-4 bg-clean-surface border-t border-border-warm flex justify-between items-center shadow-lg z-10">
              <div className="flex gap-3">
                <button
                  className="px-6 py-2.5 border border-rejected hover:bg-[#fde8e8] text-rejected rounded-lg font-bold text-sm transition-all"
                  type="button"
                  disabled={submitting || !activeCandidate.id}
                  onClick={openRejectEmailForm}
                >
                  Reject
                </button>
                <button
                  className="px-6 py-2.5 border border-teal-command hover:bg-teal-command/5 text-teal-command rounded-lg font-bold text-sm transition-all"
                  type="button"
                  disabled={submitting || !activeCandidate.id}
                  onClick={() => void handleRequestInfo(activeCandidate.id)}
                >
                  Request More Info
                </button>
              </div>
              <button
                className="px-8 py-2.5 bg-teal-command hover:bg-[#09776d] text-white rounded-lg font-bold text-sm transition-all shadow-md flex items-center gap-2 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
                type="button"
                disabled={submitting || !canApproveHire}
                onClick={openOfferEmailForm}
                title={
                  recordedFeedbackCount < 2
                    ? 'Need at least 2 recorded interview feedbacks before Hire'
                    : activeCandidate.passCount === 0
                      ? 'Candidate needs at least one PASS feedback before Hire'
                      : undefined
                }
              >
                Approve Hire → Send Offer
              </button>
            </div>
            {activeCandidate.id && recordedFeedbackCount < 2 && (
              <p className="absolute bottom-[4.75rem] right-4 max-w-sm rounded-lg border border-revision/30 bg-revision/10 px-3 py-2 text-xs font-semibold text-revision shadow-sm">
                Need at least 2 recorded interview feedbacks to approve hire. Current:{' '}
                {recordedFeedbackCount}/2.
              </p>
            )}
          </div>
        </section>
      </div>

      {decisionFormMode === 'offer' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/35 p-4">
          <form
            className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-lg border border-border-warm bg-clean-surface shadow-xl"
            onSubmit={submitOfferEmail}
          >
            <div className="border-b border-border-warm px-6 py-4">
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-teal-command">
                Offer Email
              </p>
              <h2 className="mt-1 text-lg font-semibold text-deep-charcoal">
                Send offer to {activeCandidate.name}
              </h2>
              <p className="mt-1 text-sm text-slate-ink">
                This will approve the hire, create an offer letter, and queue an email to the candidate.
              </p>
            </div>

            <div className="grid gap-5 p-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
              <div className="space-y-4">
                <label className="block space-y-2">
                  <span className="text-sm font-bold text-slate-ink">Candidate</span>
                  <input
                    className="h-10 w-full rounded-lg border border-border-warm bg-surface-container px-3 text-sm text-on-surface-variant"
                    disabled
                    value={activeCandidate.name}
                  />
                </label>

                <label className="block space-y-2">
                  <span className="text-sm font-bold text-slate-ink">Offer position</span>
                  <input
                    className="h-10 w-full rounded-lg border border-border-warm bg-surface-container px-3 text-sm text-on-surface-variant"
                    disabled
                    value={`${activeCandidate.role} - ${activeCandidate.department}`}
                  />
                </label>

                <label className="block space-y-2">
                  <span className="text-sm font-bold text-slate-ink">Compensation</span>
                  <input
                    className="h-10 w-full rounded-lg border border-border-warm bg-workflow-ivory px-3 text-sm outline-none focus:border-teal-command focus:ring-2 focus:ring-teal-command/20"
                    disabled={submitting}
                    onChange={(event) =>
                      setOfferForm((current) => ({ ...current, compensation: event.target.value }))
                    }
                    placeholder="45,000,000 VND gross per month"
                    value={offerForm.compensation}
                  />
                </label>

                <label className="block space-y-2">
                  <span className="text-sm font-bold text-slate-ink">Proposed start date</span>
                  <input
                    className="h-10 w-full rounded-lg border border-border-warm bg-workflow-ivory px-3 text-sm outline-none focus:border-teal-command focus:ring-2 focus:ring-teal-command/20"
                    disabled={submitting}
                    onChange={(event) =>
                      setOfferForm((current) => ({ ...current, startDate: event.target.value }))
                    }
                    type="date"
                    value={offerForm.startDate}
                  />
                </label>

                <label className="block space-y-2">
                  <span className="text-sm font-bold text-slate-ink">Offer notes</span>
                  <textarea
                    className="min-h-[120px] w-full rounded-lg border border-border-warm bg-workflow-ivory p-3 text-sm leading-6 outline-none focus:border-teal-command focus:ring-2 focus:ring-teal-command/20"
                    disabled={submitting}
                    onChange={(event) =>
                      setOfferForm((current) => ({ ...current, notes: event.target.value }))
                    }
                    value={offerForm.notes}
                  />
                </label>
              </div>

              <section className="rounded-lg border border-border-warm bg-workflow-ivory/60 p-4">
                <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-ink">
                  Email Preview
                </p>
                <p className="mt-3 text-sm font-bold text-deep-charcoal">
                  Subject: Offer Letter: {activeCandidate.role}
                </p>
                <pre className="mt-3 whitespace-pre-wrap rounded-lg bg-clean-surface p-4 text-sm leading-6 text-slate-ink">
{`Dear ${activeCandidate.name},

We are pleased to extend you an offer for the position of ${activeCandidate.role}.

Offer Framework
Candidate: ${activeCandidate.name}
Position: ${activeCandidate.role}
Department: ${activeCandidate.department}
Compensation: ${offerForm.compensation || '-'}
Proposed start date: ${offerForm.startDate || '-'}

${offerForm.notes || '-'}

Please review and accept or decline this offer in the candidate portal.`}
                </pre>
              </section>
            </div>

            <div className="flex justify-end gap-3 border-t border-border-warm px-6 py-4">
              <button
                className="h-10 rounded-lg border border-border-warm px-4 text-sm font-semibold text-slate-ink transition hover:bg-workflow-ivory"
                disabled={submitting}
                onClick={() => setDecisionFormMode(null)}
                type="button"
              >
                Cancel
              </button>
              <button
                className="h-10 rounded-lg bg-teal-command px-5 text-sm font-semibold text-white transition hover:bg-primary disabled:opacity-70"
                disabled={submitting}
                type="submit"
              >
                {submitting ? 'Sending...' : 'Approve and Send Offer'}
              </button>
            </div>
          </form>
        </div>
      )}

      {decisionFormMode === 'reject' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/35 p-4">
          <form
            className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-lg border border-border-warm bg-clean-surface shadow-xl"
            onSubmit={submitRejectEmail}
          >
            <div className="border-b border-border-warm px-6 py-4">
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-rejected">
                Rejection Email
              </p>
              <h2 className="mt-1 text-lg font-semibold text-deep-charcoal">
                Send rejection to {activeCandidate.name}
              </h2>
              <p className="mt-1 text-sm text-slate-ink">
                This will mark the request as Not Hired and queue a rejection email to the candidate.
              </p>
            </div>

            <div className="grid gap-5 p-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
              <div className="space-y-4">
                <label className="block space-y-2">
                  <span className="text-sm font-bold text-slate-ink">Candidate</span>
                  <input
                    className="h-10 w-full rounded-lg border border-border-warm bg-surface-container px-3 text-sm text-on-surface-variant"
                    disabled
                    value={activeCandidate.name}
                  />
                </label>

                <label className="block space-y-2">
                  <span className="text-sm font-bold text-slate-ink">Position</span>
                  <input
                    className="h-10 w-full rounded-lg border border-border-warm bg-surface-container px-3 text-sm text-on-surface-variant"
                    disabled
                    value={activeCandidate.role}
                  />
                </label>

                <label className="block space-y-2">
                  <span className="text-sm font-bold text-slate-ink">Rejection reason / feedback</span>
                  <textarea
                    className="min-h-[180px] w-full rounded-lg border border-border-warm bg-workflow-ivory p-3 text-sm leading-6 outline-none focus:border-rejected focus:ring-2 focus:ring-rejected/20"
                    disabled={submitting}
                    onChange={(event) =>
                      setRejectForm((current) => ({ ...current, notes: event.target.value }))
                    }
                    value={rejectForm.notes}
                  />
                </label>
              </div>

              <section className="rounded-lg border border-border-warm bg-workflow-ivory/60 p-4">
                <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-ink">
                  Email Preview
                </p>
                <p className="mt-3 text-sm font-bold text-deep-charcoal">
                  Subject: Application Update: {activeCandidate.role}
                </p>
                <pre className="mt-3 whitespace-pre-wrap rounded-lg bg-clean-surface p-4 text-sm leading-6 text-slate-ink">
{`Dear ${activeCandidate.name},

Thank you for your interest in the position of ${activeCandidate.role} and for taking the time to speak with us.

After careful consideration, we regret to inform you that we will not be moving forward with your application at this time.

Feedback:
${rejectForm.notes || '-'}

We wish you the best of luck in your job search and future professional endeavors.`}
                </pre>
              </section>
            </div>

            <div className="flex justify-end gap-3 border-t border-border-warm px-6 py-4">
              <button
                className="h-10 rounded-lg border border-border-warm px-4 text-sm font-semibold text-slate-ink transition hover:bg-workflow-ivory"
                disabled={submitting}
                onClick={() => setDecisionFormMode(null)}
                type="button"
              >
                Cancel
              </button>
              <button
                className="h-10 rounded-lg bg-rejected px-5 text-sm font-semibold text-white transition hover:bg-red-700 disabled:opacity-70"
                disabled={submitting}
                type="submit"
              >
                {submitting ? 'Sending...' : 'Reject and Send Email'}
              </button>
            </div>
          </form>
        </div>
      )}

      {(profileDetail || profileLoading) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/35 p-4">
          <section className="w-full max-w-2xl rounded-lg border border-border-warm bg-clean-surface shadow-xl">
            <div className="flex items-start justify-between border-b border-border-warm px-6 py-4">
              <div>
                <h2 className="text-lg font-semibold text-deep-charcoal">Candidate Profile</h2>
                <p className="text-sm text-slate-ink">
                  {profileLoading ? 'Loading profile...' : profileDetail?.fullName ?? activeCandidate.name}
                </p>
              </div>
              <button
                className="rounded-lg p-2 text-slate-ink hover:bg-surface-container-low"
                onClick={() => setProfileDetail(null)}
                type="button"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="space-y-4 p-6">
              {profileLoading ? (
                <p className="text-sm text-slate-ink">Loading...</p>
              ) : (
                <>
                  <ProfileLine label="Email" value={profileDetail?.email ?? '-'} />
                  <ProfileLine label="Phone" value={profileDetail?.phone ?? '-'} />
                  <ProfileLine label="Summary" value={profileDetail?.summary ?? '-'} />
                </>
              )}
            </div>
          </section>
        </div>
      )}
    </AdminDashboardPage>
  );
};

const ProfileLine = ({ label, value }: { label: string; value: string }) => (
  <div className="rounded-lg border border-border-warm bg-workflow-ivory/60 p-3">
    <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-ink">{label}</p>
    <p className="mt-1 text-sm font-semibold text-deep-charcoal">{value}</p>
  </div>
);
