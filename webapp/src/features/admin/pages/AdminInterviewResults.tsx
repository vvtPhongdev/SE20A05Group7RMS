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
  location: string;
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
  offlineEvidence?: OfflineEvidence | null;
  salaryDeal?: SalaryDeal | null;
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
  location: string;
}

interface OfflineEvidence {
  location: string;
  report: string;
  photoName?: string;
  photoDataUrl?: string;
  recordedAt?: string;
}

type SalaryDeal = {
  expectedSalary: string;
  proposedSalary: string;
  status: 'NEGOTIATING' | 'AGREED' | 'DECLINED' | 'PENDING';
  notes: string;
};

interface CandidateProfileDetail {
  id: string;
  fullName?: string;
  email?: string;
  phone?: string;
  summary?: string;
  structuredData?: Record<string, unknown>;
  cvDocuments?: Array<{
    fileName?: string;
    parsedAt?: string | null;
  }>;
}

type DecisionFormMode = 'offer' | 'reject' | 'request-info' | null;

interface OfferEmailForm {
  compensation: string;
  startDate: string;
  notes: string;
}

interface RejectEmailForm {
  notes: string;
}

interface RequestInfoForm {
  topics: string[];
  notes: string;
}

const REQUEST_INFO_TOPICS = [
  'Candidate strengths and weaknesses',
  'Technical or role-fit evidence',
  'Salary expectation and HR-candidate negotiation',
  'Availability, notice period, or start date',
] as const;

const adminInterviewResultsApi = {
  list: '/admin/interview-results',
  decision: (requestId: string) => `/admin/interview-results/${requestId}/decision`,
  requestInfo: (requestId: string) => `/admin/interview-results/${requestId}/request-info`,
};

const MEETING_PHOTO_START = '[INTERVIEW_MEETING_PHOTO]';
const MEETING_PHOTO_END = '[/INTERVIEW_MEETING_PHOTO]';
const meetingPhotoPattern = new RegExp(
  `${MEETING_PHOTO_START.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}([\\s\\S]*?)${MEETING_PHOTO_END.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`,
);

const parsePanelistComment = (comment: string) => {
  const match = comment.match(meetingPhotoPattern);
  return { comment: match ? comment.replace(meetingPhotoPattern, '').trim() : comment };
};

const emptyCandidate: CandidateResult = {
  id: '',
  candidateId: '',
  name: 'No interview selected',
  role: '',
  department: '',
  location: '',
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
  offlineEvidence: null,
  salaryDeal: null,
};

const defaultOfferStartDate = () =>
  new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

const OFFLINE_EVIDENCE_START = '[OFFLINE_INTERVIEW_EVIDENCE]';
const OFFLINE_EVIDENCE_END = '[/OFFLINE_INTERVIEW_EVIDENCE]';
const SALARY_DEAL_START = '[INTERVIEW_SALARY_DEAL]';
const SALARY_DEAL_END = '[/INTERVIEW_SALARY_DEAL]';
const salaryDealPattern = new RegExp(
  `${SALARY_DEAL_START.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}([\\s\\S]*?)${SALARY_DEAL_END.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`,
);

const isOnlineInterviewLocation = (value: string) =>
  /^https?:\/\//i.test(value.trim()) || /meet\.google\.com|zoom|teams\.microsoft/i.test(value);

const parseOfflineEvidence = (value: string) => {
  const pattern = new RegExp(
    `${OFFLINE_EVIDENCE_START.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}([\\s\\S]*?)${OFFLINE_EVIDENCE_END.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`,
  );
  const match = value.match(pattern);
  if (!match) return { cleanSummary: value, evidence: null as OfflineEvidence | null };

  try {
    return {
      cleanSummary: value.replace(pattern, '').trim(),
      evidence: JSON.parse(match[1].trim()) as OfflineEvidence,
    };
  } catch {
    return { cleanSummary: value.replace(pattern, '').trim(), evidence: null };
  }
};

const parseSalaryDeal = (value: string) => {
  const match = value.match(salaryDealPattern);
  if (!match) return { cleanSummary: value, deal: null as SalaryDeal | null };

  try {
    const deal = JSON.parse(match[1].trim()) as Partial<SalaryDeal>;
    return {
      cleanSummary: value.replace(salaryDealPattern, '').trim(),
      deal: {
        expectedSalary: deal.expectedSalary ?? '',
        proposedSalary: deal.proposedSalary ?? '',
        status: deal.status ?? 'NEGOTIATING',
        notes: deal.notes ?? '',
      },
    };
  } catch {
    return { cleanSummary: value.replace(salaryDealPattern, '').trim(), deal: null };
  }
};

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
  const [requestInfoForm, setRequestInfoForm] = useState<RequestInfoForm>({
    topics: [],
    notes: '',
  });

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
        const mapped = response.map((result) => {
          const parsedSalaryDeal = parseSalaryDeal(result.summaryNotes || '');
          const parsedSummary = parseOfflineEvidence(parsedSalaryDeal.cleanSummary);
          return {
            id: result.id,
            candidateId: result.candidateId,
            name: result.candidate,
            role: result.role,
            department: result.department,
            location: result.location || '',
            interviewDate: new Date(result.interviewDate).toLocaleDateString(),
            requestId: result.requestId,
            status: result.decisionStatus,
            photoUrl: '',
            passCount: result.passCount,
            failCount: result.failCount,
            pendingCount: result.pendingCount,
            feedbacks: result.feedbacks.map((feedback) => ({
              ...feedback,
              ...parsePanelistComment(feedback.comment),
            })),
            scores: result.scores,
            recommendation: result.finalRecommendation.toLowerCase().includes('hire')
              ? ('Hire' as const)
              : result.finalRecommendation.toLowerCase().includes('reject')
                ? ('Reject' as const)
                : ('More Info' as const),
            assessmentSummary:
              parsedSummary.cleanSummary ||
              'The interview panel has not provided an overall summary.',
            offlineEvidence: parsedSummary.evidence,
            salaryDeal: parsedSalaryDeal.deal,
          };
        });
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

  // Keep unfinished reviews at the top of the queue; final decisions follow below them.
  const filteredCandidates = useMemo(() => {
    const visible = candidates.filter((c) => {
      if (filterType === 'All Pending Decisions') {
        return c.status === 'Awaiting Decision' || c.status === 'Request Info';
      }
      if (filterType === 'Decision Made') {
        return c.status === 'Decision Made' || c.status === 'Approved' || c.status === 'Rejected';
      }
      return true;
    });

    return visible.sort((left, right) => {
      const leftFinal = ['Decision Made', 'Approved', 'Rejected'].includes(left.status);
      const rightFinal = ['Decision Made', 'Approved', 'Rejected'].includes(right.status);
      return Number(leftFinal) - Number(rightFinal);
    });
  }, [candidates, filterType]);

  const pendingCount = useMemo(() => {
    return candidates.filter((c) => c.status === 'Awaiting Decision' || c.status === 'Request Info')
      .length;
  }, [candidates]);

  const recordedFeedbackCount = activeCandidate.passCount + activeCandidate.failCount;
  const canApproveHire =
    Boolean(activeCandidate.id) && recordedFeedbackCount >= 2 && activeCandidate.passCount > 0;
  const isOfflineInterview = Boolean(
    activeCandidate.location && !isOnlineInterviewLocation(activeCandidate.location),
  );

  const markDecisionState = (
    candidate: CandidateResult,
    action: 'Decision Made' | 'Request Info',
  ) => {
    const nextCandidates = candidates.map((item) =>
      action === 'Request Info'
        ? item.id === candidate.id
          ? { ...item, status: 'Request Info' as DecisionStatus }
          : item
        : item.requestId === candidate.requestId
          ? { ...item, status: action as DecisionStatus }
          : item,
    );
    setCandidates(nextCandidates);
    if (action !== 'Request Info') {
      setSelectedId(
        nextCandidates.find(
          (item) => item.status === 'Awaiting Decision' || item.status === 'Request Info',
        )?.id ?? '',
      );
    }
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
      markDecisionState(candidate, 'Decision Made');
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
      markDecisionState(candidate, 'Decision Made');
      setDecisionFormMode(null);
      setActionMessage(`Rejection email has been queued for ${candidate.name}.`);
    } catch (error) {
      setApiError(error instanceof Error ? error.message : 'Unable to save the hiring decision');
    } finally {
      setSubmitting(false);
    }
  };

  const submitRequestInfo = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const candidate = activeCandidate;
    if (!candidate) return;
    const notes = requestInfoForm.notes.trim();
    if (requestInfoForm.topics.length === 0 && !notes) {
      setApiError('Select at least one information topic or describe the required information.');
      return;
    }

    const requestNotes = [
      requestInfoForm.topics.length
        ? `Requested information:\n- ${requestInfoForm.topics.join('\n- ')}`
        : '',
      notes ? `Additional context:\n${notes}` : '',
    ]
      .filter(Boolean)
      .join('\n\n');

    setSubmitting(true);
    setApiError('');
    setActionMessage('');
    try {
      await apiRequest(adminInterviewResultsApi.requestInfo(candidate.requestId), token, {
        method: 'POST',
        body: JSON.stringify({
          candidateId: candidate.candidateId,
          notes: requestNotes,
        }),
      });
      markDecisionState(candidate, 'Request Info');
      setDecisionFormMode(null);
      setActionMessage(`Information request has been saved for ${candidate.name}.`);
    } catch (error) {
      setApiError(error instanceof Error ? error.message : 'Unable to save the hiring decision');
    } finally {
      setSubmitting(false);
    }
  };

  const openRequestInfoForm = () => {
    if (!activeCandidate.id) return;
    setRequestInfoForm({ topics: [], notes: '' });
    setApiError('');
    setDecisionFormMode('request-info');
  };

  const openOfferEmailForm = () => {
    if (!activeCandidate.id) return;
    const salaryDealNote = activeCandidate.salaryDeal?.notes
      ? `\n\nSalary discussion notes: ${activeCandidate.salaryDeal.notes}`
      : '';
    setOfferForm({
      compensation: activeCandidate.salaryDeal?.proposedSalary || 'Negotiable',
      startDate: defaultOfferStartDate(),
      notes: `We are pleased to offer ${activeCandidate.name} the ${activeCandidate.role} position in ${activeCandidate.department}.${salaryDealNote}`,
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

  const isFinalDecision = ['Decision Made', 'Approved', 'Rejected'].includes(
    activeCandidate.status,
  );
  const profileStructuredData = profileDetail?.structuredData ?? {};
  const profileSkills = Array.isArray(profileStructuredData.skills)
    ? profileStructuredData.skills.map(String).filter(Boolean)
    : [];
  const profileRole = String(
    profileStructuredData.currentRole ??
      profileStructuredData.title ??
      profileStructuredData.role ??
      activeCandidate.role,
  );
  const profileLocation = String(profileStructuredData.location ?? 'Not provided');

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

  const openCandidateCv = async () => {
    if (!activeCandidate.candidateId) return;
    const previewWindow = window.open('', '_blank');
    if (!previewWindow) {
      setApiError('Please allow pop-ups to view the candidate CV.');
      return;
    }

    previewWindow.document.title = `${activeCandidate.name} - CV`;
    previewWindow.document.body.textContent = 'Loading CV...';
    try {
      const response = await fetch(
        `/api/v1/candidate/cvs/candidate/${activeCandidate.candidateId}/latest/file`,
        { headers: token ? { Authorization: `Bearer ${token}` } : undefined },
      );
      if (!response.ok) {
        const error = await response.json().catch(() => null);
        throw new Error(error?.message || 'Candidate CV is not available.');
      }

      const cvUrl = URL.createObjectURL(await response.blob());
      previewWindow.location.replace(cvUrl);
      window.setTimeout(() => URL.revokeObjectURL(cvUrl), 60_000);
    } catch (error) {
      previewWindow.close();
      setApiError(error instanceof Error ? error.message : 'Unable to open candidate CV.');
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
                {(['All Pending Decisions', 'Decision Made', 'All Decisions'] as const).map(
                  (opt) => (
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
                  ),
                )}
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
                  {activeCandidate.location && (
                    <span className="px-3 py-1 bg-parchment-lift text-deep-charcoal text-xs font-semibold rounded-lg flex items-center gap-1.5 border border-border-warm">
                      <span className="material-symbols-outlined text-[16px]">
                        {isOfflineInterview ? 'meeting_room' : 'videocam'}
                      </span>
                      {isOfflineInterview ? 'Offline' : 'Online'}: {activeCandidate.location}
                    </span>
                  )}
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
                        "{fb.comment || 'Feedback has not been recorded.'}"
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
                {activeCandidate.salaryDeal && (
                  <div className="rounded-lg border border-border-warm bg-workflow-ivory/70 p-4 shadow-sm">
                    <div className="mb-3 flex items-center gap-2">
                      <span className="material-symbols-outlined text-teal-command text-[22px]">
                        payments
                      </span>
                      <span className="text-sm font-bold text-deep-charcoal">Salary Deal</span>
                    </div>
                    <div className="grid gap-3 md:grid-cols-3">
                      <div>
                        <p className="text-xs font-bold uppercase tracking-[0.1em] text-slate-ink">
                          Candidate Expected
                        </p>
                        <p className="mt-1 text-sm font-semibold text-deep-charcoal">
                          {activeCandidate.salaryDeal.expectedSalary || 'Not provided'}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs font-bold uppercase tracking-[0.1em] text-slate-ink">
                          HR Proposed
                        </p>
                        <p className="mt-1 text-sm font-semibold text-deep-charcoal">
                          {activeCandidate.salaryDeal.proposedSalary || 'Negotiable'}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs font-bold uppercase tracking-[0.1em] text-slate-ink">
                          Status
                        </p>
                        <p className="mt-1 text-sm font-semibold text-deep-charcoal">
                          {activeCandidate.salaryDeal.status}
                        </p>
                      </div>
                    </div>
                    {activeCandidate.salaryDeal.notes && (
                      <div className="mt-3">
                        <p className="text-xs font-bold uppercase tracking-[0.1em] text-slate-ink">
                          Notes
                        </p>
                        <p className="mt-1 whitespace-pre-wrap text-sm font-semibold leading-6 text-slate-ink">
                          {activeCandidate.salaryDeal.notes}
                        </p>
                      </div>
                    )}
                  </div>
                )}
                {isOfflineInterview && (
                  <div className="rounded-lg border border-revision/30 bg-revision/5 p-4 shadow-sm">
                    <div className="mb-3 flex items-center gap-2">
                      <span className="material-symbols-outlined text-revision text-[22px]">
                        fact_check
                      </span>
                      <span className="text-sm font-bold text-deep-charcoal">
                        Offline Interview Evidence
                      </span>
                    </div>
                    <div className="space-y-3">
                      <div>
                        <p className="text-xs font-bold uppercase tracking-[0.1em] text-slate-ink">
                          Location
                        </p>
                        <p className="mt-1 text-sm font-semibold text-deep-charcoal">
                          {activeCandidate.offlineEvidence?.location || activeCandidate.location}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs font-bold uppercase tracking-[0.1em] text-slate-ink">
                          HR Report
                        </p>
                        <p className="mt-1 whitespace-pre-wrap text-sm font-semibold leading-6 text-slate-ink">
                          {activeCandidate.offlineEvidence?.report ||
                            'No written report was submitted.'}
                        </p>
                      </div>
                      {activeCandidate.offlineEvidence?.photoDataUrl && (
                        <div>
                          <p className="mb-2 text-xs font-bold uppercase tracking-[0.1em] text-slate-ink">
                            {activeCandidate.offlineEvidence.photoName || 'Meeting photo'}
                          </p>
                          <img
                            alt="Offline interview evidence"
                            className="max-h-80 w-full rounded-lg border border-border-warm bg-clean-surface object-contain"
                            src={activeCandidate.offlineEvidence.photoDataUrl}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Sticky Action Panel */}
            <div className="absolute bottom-0 left-0 right-0 p-4 bg-clean-surface border-t border-border-warm flex justify-between items-center shadow-lg z-10">
              <div className="flex gap-3">
                <button
                  className="px-6 py-2.5 border border-rejected hover:bg-[#fde8e8] text-rejected rounded-lg font-bold text-sm transition-all"
                  type="button"
                  disabled={submitting || !activeCandidate.id || isFinalDecision}
                  onClick={openRejectEmailForm}
                >
                  Reject
                </button>
                <button
                  className="px-6 py-2.5 border border-teal-command hover:bg-teal-command/5 text-teal-command rounded-lg font-bold text-sm transition-all"
                  type="button"
                  disabled={submitting || !activeCandidate.id || isFinalDecision}
                  onClick={openRequestInfoForm}
                >
                  Request More Info
                </button>
              </div>
              <button
                className="px-8 py-2.5 bg-teal-command hover:bg-[#09776d] text-white rounded-lg font-bold text-sm transition-all shadow-md flex items-center gap-2 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
                type="button"
                disabled={submitting || !canApproveHire || isFinalDecision}
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

      {decisionFormMode === 'request-info' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/35 p-4">
          <form
            className="w-full max-w-2xl rounded-lg border border-border-warm bg-clean-surface shadow-xl"
            onSubmit={submitRequestInfo}
          >
            <div className="border-b border-border-warm px-6 py-4">
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-teal-command">
                Request More Information
              </p>
              <h2 className="mt-1 text-lg font-semibold text-deep-charcoal">
                Information needed for {activeCandidate.name}
              </h2>
              <p className="mt-1 text-sm text-slate-ink">
                This request is saved for HR follow-up before the final hiring decision.
              </p>
            </div>

            <div className="space-y-5 p-6">
              <fieldset>
                <legend className="text-sm font-bold text-slate-ink">
                  Request information about
                </legend>
                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                  {REQUEST_INFO_TOPICS.map((topic) => {
                    const checked = requestInfoForm.topics.includes(topic);
                    return (
                      <label
                        className="flex cursor-pointer items-start gap-2 rounded-lg border border-border-warm bg-workflow-ivory/50 p-3 text-sm text-deep-charcoal transition hover:border-teal-command/50"
                        key={topic}
                      >
                        <input
                          checked={checked}
                          className="mt-0.5 h-4 w-4 accent-teal-command"
                          disabled={submitting}
                          onChange={() =>
                            setRequestInfoForm((current) => ({
                              ...current,
                              topics: checked
                                ? current.topics.filter((item) => item !== topic)
                                : [...current.topics, topic],
                            }))
                          }
                          type="checkbox"
                        />
                        <span>{topic}</span>
                      </label>
                    );
                  })}
                </div>
              </fieldset>

              <label className="block space-y-2">
                <span className="text-sm font-bold text-slate-ink">
                  Specific questions or context
                </span>
                <textarea
                  className="min-h-[150px] w-full rounded-lg border border-border-warm bg-workflow-ivory p-3 text-sm leading-6 outline-none focus:border-teal-command focus:ring-2 focus:ring-teal-command/20"
                  disabled={submitting}
                  onChange={(event) =>
                    setRequestInfoForm((current) => ({ ...current, notes: event.target.value }))
                  }
                  placeholder="Example: Please provide the panel's evidence for the candidate's strongest and weakest skills, and clarify the latest salary proposal discussed with the candidate."
                  value={requestInfoForm.notes}
                />
              </label>
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
                {submitting ? 'Saving...' : 'Send Information Request'}
              </button>
            </div>
          </form>
        </div>
      )}

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
                This will approve the hire, create an offer letter, and queue an email to the
                candidate.
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
                  Subject: Job Offer: {activeCandidate.role} - [Company Name]
                </p>
                <pre className="mt-3 whitespace-pre-wrap rounded-lg bg-clean-surface p-4 text-sm leading-6 text-slate-ink">
                  {`Dear ${activeCandidate.name.toUpperCase()},

We are pleased to extend you a formal offer of employment for the position of ${activeCandidate.role} at [Company Name]. We were incredibly impressed by your technical expertise and believe you will be a valuable asset to our ${activeCandidate.department} team.

Please find the summary of your offer framework below:

Candidate: ${activeCandidate.name}

Position: ${activeCandidate.role}

Department: ${activeCandidate.department}

Compensation: ${offerForm.compensation || '-'}

Proposed Start Date: ${offerForm.startDate || '-'}

To accept or decline this offer, please review the complete details and respond directly through our candidate portal.

${offerForm.notes || ''}

Warm regards,

[Your Name/Title]

[Company Name]`}
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
                This will mark the request as Not Hired and queue a rejection email to the
                candidate.
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
                  <span className="text-sm font-bold text-slate-ink">
                    Rejection reason / feedback
                  </span>
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
          <section className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-lg border border-border-warm bg-clean-surface shadow-xl">
            <div className="flex items-start justify-between border-b border-border-warm px-6 py-4">
              <div>
                <h2 className="text-lg font-semibold text-deep-charcoal">Candidate CV Summary</h2>
                <p className="text-sm text-slate-ink">
                  {profileLoading
                    ? 'Loading profile...'
                    : (profileDetail?.fullName ?? activeCandidate.name)}
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
            <div className="space-y-5 p-6">
              {profileLoading ? (
                <p className="text-sm text-slate-ink">Loading...</p>
              ) : (
                <>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <ProfileLine label="Email" value={profileDetail?.email ?? '-'} />
                    <ProfileLine label="Phone" value={profileDetail?.phone ?? '-'} />
                    <ProfileLine label="Current role" value={profileRole} />
                    <ProfileLine label="Location" value={profileLocation} />
                  </div>
                  <ProfileLine label="Professional summary" value={profileDetail?.summary ?? '-'} />
                  <section className="rounded-lg border border-border-warm bg-workflow-ivory/60 p-3">
                    <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-ink">
                      Parsed skills
                    </p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {profileSkills.length ? (
                        profileSkills.map((skill) => (
                          <span
                            className="rounded-full bg-teal-command/10 px-2.5 py-1 text-xs font-semibold text-teal-command"
                            key={skill}
                          >
                            {skill}
                          </span>
                        ))
                      ) : (
                        <span className="text-sm text-slate-ink">No parsed skills available.</span>
                      )}
                    </div>
                  </section>
                  <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-teal-command/20 bg-teal-command/5 p-4">
                    <div>
                      <p className="text-sm font-bold text-deep-charcoal">
                        {profileDetail?.cvDocuments?.[0]?.fileName ?? 'Latest candidate CV'}
                      </p>
                      <p className="mt-1 text-xs text-slate-ink">
                        {profileDetail?.cvDocuments?.[0]?.parsedAt
                          ? 'Parsed CV available for full review.'
                          : 'Open the original CV document for full details.'}
                      </p>
                    </div>
                    <button
                      className="inline-flex h-10 items-center gap-2 rounded-lg bg-teal-command px-4 text-sm font-semibold text-white transition hover:bg-primary"
                      onClick={() => void openCandidateCv()}
                      type="button"
                    >
                      <span className="material-symbols-outlined text-[18px]">description</span>
                      View CV
                    </button>
                  </div>
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
