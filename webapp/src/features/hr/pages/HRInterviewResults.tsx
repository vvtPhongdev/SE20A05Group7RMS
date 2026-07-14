import React, { useEffect, useMemo, useState } from 'react';
import { isHrRole, UserRole } from '@wr/contracts';
import { useAuth } from '../../../context/AuthContext';
import { apiRequest } from '../../../lib/api';
import {
  HREmptyState,
  HRInlineAlert,
  HRLoadingState,
  HRPageHeader,
  HRSearchInput,
} from '../components';

type RecordingStatus = 'Pending Recording' | 'Interviewing' | 'Interview Complete' | 'Recorded';
type Recommendation = 'Recommend Hire' | 'Recommend Reject' | 'Hold for Further';

type CompletedInterview = {
  id: string;
  candidate: string;
  role: string;
  department: string;
  time: string;
  status: RecordingStatus;
  location: string;
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
  isRecorded?: boolean;
  attendanceStatus?: 'ACCEPTED' | 'ABSENT' | 'PENDING';
};

interface InterviewDetailsResponse {
  id: string;
  candidate: string;
  role: string;
  department: string;
  time: string;
  status: RecordingStatus;
  feedbacks: PanelFeedback[];
  myFeedback?: PanelFeedback | null;
  canSubmitMyFeedback?: boolean;
  canSubmitFinalRecommendation?: boolean;
  hasBeenSentToAdmin?: boolean;
  adminDecision?: 'HIRED' | 'NOT_HIRED' | null;
  salaryRange?: SalaryRange;
  finalRecommendation: string;
  summaryNotes: string;
  location: string;
}

type MyFeedbackResponse = {
  success: boolean;
  feedback: PanelFeedback;
};

type OfflineEvidence = {
  location: string;
  report: string;
  photoName?: string;
  photoDataUrl?: string;
  recordedAt: string;
};

type SalaryDeal = {
  expectedSalary: string;
  proposedSalary: string;
  status: 'NEGOTIATING' | 'AGREED' | 'DECLINED' | 'PENDING';
  notes: string;
};

type SalaryRange = {
  min: string;
  max: string;
};

const RECOMMENDATION_OPTIONS_VALUES: Recommendation[] = [
  'Recommend Hire',
  'Recommend Reject',
  'Hold for Further',
];

const emptySalaryDeal = (): SalaryDeal => ({
  expectedSalary: '',
  proposedSalary: '',
  status: 'NEGOTIATING',
  notes: '',
});

const formatSalaryRange = (range: SalaryRange) => {
  const minimum = range.min.trim();
  const maximum = range.max.trim();
  if (minimum && maximum) return `${minimum} – ${maximum}`;
  if (minimum) return `From ${minimum}`;
  if (maximum) return `Up to ${maximum}`;
  return 'Not specified in the recruitment request';
};

const SALARY_DEAL_START = '[INTERVIEW_SALARY_DEAL]';
const SALARY_DEAL_END = '[/INTERVIEW_SALARY_DEAL]';
const salaryDealPattern = new RegExp(
  `${SALARY_DEAL_START.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}([\\s\\S]*?)${SALARY_DEAL_END.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`,
);

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

const hasSalaryDeal = (deal: SalaryDeal) =>
  Boolean(deal.expectedSalary.trim() || deal.proposedSalary.trim() || deal.notes.trim());

const composeSalaryDeal = (summary: string, deal: SalaryDeal) => {
  const cleanSummary = summary.trim();
  if (!hasSalaryDeal(deal)) return cleanSummary;

  return [
    cleanSummary,
    `${SALARY_DEAL_START}${JSON.stringify({
      ...deal,
      expectedSalary: deal.expectedSalary.trim(),
      proposedSalary: deal.proposedSalary.trim(),
      notes: deal.notes.trim(),
    })}${SALARY_DEAL_END}`,
  ]
    .filter(Boolean)
    .join('\n\n');
};

const MEETING_PHOTO_START = '[INTERVIEW_MEETING_PHOTO]';
const MEETING_PHOTO_END = '[/INTERVIEW_MEETING_PHOTO]';

const meetingPhotoPattern = new RegExp(
  `${MEETING_PHOTO_START.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}([\\s\\S]*?)${MEETING_PHOTO_END.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`,
);

const parseMeetingPhotoEvidence = (notes: string) => {
  const match = notes.match(meetingPhotoPattern);
  return { cleanNotes: match ? notes.replace(meetingPhotoPattern, '').trim() : notes };
};

// Keep legacy photo metadata out of the written assessment. New evaluations contain text only.
const stripMeetingPhotoFromFeedback = (feedback: PanelFeedback): PanelFeedback => {
  const parsed = parseMeetingPhotoEvidence(feedback.notes);
  return {
    ...feedback,
    notes: parsed.cleanNotes,
  };
};

const hrInterviewResultsApi = {
  list: '/hr/interview-results',
  details: (id: string) => `/hr/interview-results/${id}`,
  myFeedback: (id: string) => `/hr/interview-results/${id}/my-feedback`,
  evaluationDraft: (id: string) => `/hr/interview-results/${id}/evaluation-draft`,
  finalRecommendation: (id: string) => `/hr/interview-results/${id}/final-recommendation`,
};

const OFFLINE_EVIDENCE_START = '[OFFLINE_INTERVIEW_EVIDENCE]';
const OFFLINE_EVIDENCE_END = '[/OFFLINE_INTERVIEW_EVIDENCE]';
const EVALUATION_DRAFT_START = '[HR_EVALUATION_DRAFT]';
const EVALUATION_DRAFT_END = '[/HR_EVALUATION_DRAFT]';
const MAX_EVIDENCE_IMAGE_BYTES = 2 * 1024 * 1024;

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

const composeOfflineEvidence = (summary: string, evidence: OfflineEvidence) =>
  [summary.trim(), `${OFFLINE_EVIDENCE_START}${JSON.stringify(evidence)}${OFFLINE_EVIDENCE_END}`]
    .filter(Boolean)
    .join('\n\n');

const parseEvaluationDraft = (value: string) => {
  const pattern = new RegExp(
    `${EVALUATION_DRAFT_START.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}([\\s\\S]*?)${EVALUATION_DRAFT_END.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`,
  );
  const match = value.match(pattern);
  if (!match) return { cleanSummary: value, recommendation: null as Recommendation | null };

  try {
    const parsed = JSON.parse(match[1].trim()) as { recommendation?: unknown };
    return {
      cleanSummary: value.replace(pattern, '').trim(),
      recommendation: RECOMMENDATION_OPTIONS_VALUES.includes(parsed.recommendation as Recommendation)
        ? (parsed.recommendation as Recommendation)
        : null,
    };
  } catch {
    return { cleanSummary: value.replace(pattern, '').trim(), recommendation: null };
  }
};

const composeEvaluationDraft = (summary: string, draftRecommendation: Recommendation) =>
  [
    summary.trim(),
    `${EVALUATION_DRAFT_START}${JSON.stringify({ recommendation: draftRecommendation })}${EVALUATION_DRAFT_END}`,
  ]
    .filter(Boolean)
    .join('\n\n');

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
  Interviewing: 'border-teal-command/20 bg-teal-command/10 text-teal-command',
  'Interview Complete': 'border-slate-ink/20 bg-slate-ink/10 text-slate-ink',
  Recorded: 'border-approved/20 bg-approved/10 text-approved',
};

const recommendationOptions: Array<{
  label: Recommendation;
  icon: string;
  color: {
    border: string;
    background: string;
    text: string;
    inactiveBorder: string;
    inactiveBackground: string;
  };
}> = [
  {
    label: 'Recommend Hire',
    icon: 'check',
    color: {
      border: '#16a34a',
      background: '#dcfce7',
      text: '#15803d',
      inactiveBorder: '#bbf7d0',
      inactiveBackground: '#f0fdf4',
    },
  },
  {
    label: 'Recommend Reject',
    icon: 'x',
    color: {
      border: '#dc2626',
      background: '#fee2e2',
      text: '#b91c1c',
      inactiveBorder: '#fecaca',
      inactiveBackground: '#fef2f2',
    },
  },
  {
    label: 'Hold for Further',
    icon: 'hold',
    color: {
      border: '#d97706',
      background: '#fef3c7',
      text: '#b45309',
      inactiveBorder: '#fde68a',
      inactiveBackground: '#fffbeb',
    },
  },
];

const getInitials = (name: string) =>
  name
    .split(' ')
    .filter(Boolean)
    .map((part) => part[0])
    .join('')
    .slice(0, 3)
    .toUpperCase() || 'U';

const emptyOwnFeedback = (
  user: { id: string; displayName: string; role: UserRole } | null,
): PanelFeedback => ({
  id: user?.id ?? 'me',
  member: user?.displayName ?? 'Me',
  role: user?.role ?? UserRole.HR_LEADER,
  initials: getInitials(user?.displayName ?? 'Me'),
  decision: 'PASS',
  technical: 0,
  communication: 0,
  culture: 0,
  notes: '',
  isRecorded: false,
});

export const HRInterviewResults: React.FC = () => {
  const { token, user } = useAuth();
  const [completedInterviews, setCompletedInterviews] = useState<CompletedInterview[]>([]);
  const [selectedId, setSelectedId] = useState('');
  const [query, setQuery] = useState('');
  const [recommendation, setRecommendation] = useState<Recommendation>('Hold for Further');
  const [feedback, setFeedback] = useState<PanelFeedback[]>([]);
  const [summaryNotes, setSummaryNotes] = useState('');
  const [offlineEvidenceReport, setOfflineEvidenceReport] = useState('');
  const [offlineEvidencePhotoName, setOfflineEvidencePhotoName] = useState('');
  const [offlineEvidencePhotoDataUrl, setOfflineEvidencePhotoDataUrl] = useState('');
  const [salaryDeal, setSalaryDeal] = useState<SalaryDeal>(() => emptySalaryDeal());
  const [salaryRange, setSalaryRange] = useState<SalaryRange>({ min: '', max: '' });
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState('');
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState('');
  const [submitError, setSubmitError] = useState('');
  const [canSubmitMyFeedback, setCanSubmitMyFeedback] = useState(false);
  const [canSubmitFinalRecommendation, setCanSubmitFinalRecommendation] = useState(false);
  const [hasBeenSentToAdmin, setHasBeenSentToAdmin] = useState(false);
  const [adminDecision, setAdminDecision] = useState<'HIRED' | 'NOT_HIRED' | null>(null);

  const canEditOwnFeedback = canSubmitMyFeedback;
  const canSubmitDecision = isHrRole(user?.role) && canSubmitFinalRecommendation;

  useEffect(() => {
    const loadCompleted = async () => {
      setLoading(true);
      setApiError('');
      try {
        const data = await apiRequest<CompletedInterview[]>(hrInterviewResultsApi.list, token);
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
          hrInterviewResultsApi.details(selectedId),
          token,
        );
        const nextFeedback = details.feedbacks.map(stripMeetingPhotoFromFeedback);
        setCanSubmitMyFeedback(Boolean(details.canSubmitMyFeedback));
        setCanSubmitFinalRecommendation(Boolean(details.canSubmitFinalRecommendation));
        setHasBeenSentToAdmin(Boolean(details.hasBeenSentToAdmin));
        setAdminDecision(details.adminDecision ?? null);
        if (
          details.canSubmitMyFeedback &&
          user &&
          !nextFeedback.some((item) => item.id === user.id)
        ) {
          nextFeedback.push(
            details.myFeedback
              ? stripMeetingPhotoFromFeedback(details.myFeedback)
              : emptyOwnFeedback(user),
          );
        }
        setFeedback(nextFeedback);
        const parsedDraft = parseEvaluationDraft(details.summaryNotes ?? '');
        setRecommendation(
          parsedDraft.recommendation ??
            (RECOMMENDATION_OPTIONS_VALUES.includes(details.finalRecommendation as Recommendation)
              ? (details.finalRecommendation as Recommendation)
              : 'Hold for Further'),
        );
        const parsedDeal = parseSalaryDeal(parsedDraft.cleanSummary);
        const parsedSummary = parseOfflineEvidence(parsedDeal.cleanSummary);
        setSummaryNotes(parsedSummary.cleanSummary);
        setSalaryDeal(parsedDeal.deal ?? emptySalaryDeal());
        setSalaryRange(details.salaryRange ?? { min: '', max: '' });
        setOfflineEvidenceReport(parsedSummary.evidence?.report ?? '');
        setOfflineEvidencePhotoName(parsedSummary.evidence?.photoName ?? '');
        setOfflineEvidencePhotoDataUrl(parsedSummary.evidence?.photoDataUrl ?? '');
      } catch {
        setFeedback([]);
        setCanSubmitMyFeedback(false);
        setCanSubmitFinalRecommendation(false);
        setHasBeenSentToAdmin(false);
        setAdminDecision(null);
        setSummaryNotes('');
        setSalaryDeal(emptySalaryDeal());
        setSalaryRange({ min: '', max: '' });
        setOfflineEvidenceReport('');
        setOfflineEvidencePhotoName('');
        setOfflineEvidencePhotoDataUrl('');
      } finally {
        setDetailsLoading(false);
      }
    };
    void loadDetails();
  }, [selectedId, token, user]);

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

  const feedbackStats = useMemo(() => {
    const evaluated = feedback.filter((item) => item.isRecorded === true).length;
    const participants = feedback.length;
    return {
      evaluated,
      notEvaluated: Math.max(participants - evaluated, 0),
      participants,
    };
  }, [feedback]);

  const isOfflineInterview = Boolean(
    selectedInterview?.location && !isOnlineInterviewLocation(selectedInterview.location),
  );

  const handleEvidencePhotoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    setSubmitError('');

    if (!file) {
      setOfflineEvidencePhotoName('');
      setOfflineEvidencePhotoDataUrl('');
      return;
    }

    if (!file.type.startsWith('image/')) {
      setSubmitError('Offline evidence must be an image file.');
      event.target.value = '';
      return;
    }

    if (file.size > MAX_EVIDENCE_IMAGE_BYTES) {
      setSubmitError('Offline evidence image must be 2MB or smaller.');
      event.target.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setOfflineEvidencePhotoName(file.name);
      setOfflineEvidencePhotoDataUrl(typeof reader.result === 'string' ? reader.result : '');
    };
    reader.onerror = () => setSubmitError('Unable to read the selected evidence image.');
    reader.readAsDataURL(file);
  };

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

  const submitResults = async (submitFinalRecommendation = true) => {
    if (!selectedInterview) return;
    setSubmitting(true);
    setSubmitMessage('');
    setSubmitError('');
    try {
      if (canEditOwnFeedback) {
        const ownFeedback = feedback.find((item) => item.id === user?.id);
        if (!ownFeedback) {
          throw new Error('Unable to find your feedback entry.');
        }

        const response = await apiRequest<MyFeedbackResponse>(
          hrInterviewResultsApi.myFeedback(selectedInterview.id),
          token,
          {
            method: 'POST',
            body: JSON.stringify({
              decision: ownFeedback.decision,
              technical: ownFeedback.technical,
              communication: ownFeedback.communication,
              culture: ownFeedback.culture,
              notes: ownFeedback.notes.trim(),
            }),
          },
        );

        const savedFeedback = stripMeetingPhotoFromFeedback({
          ...response.feedback,
          isRecorded: true,
        });

        setFeedback((items) =>
          items.some((item) => item.id === response.feedback.id)
            ? items.map((item) => (item.id === response.feedback.id ? savedFeedback : item))
            : [...items, savedFeedback],
        );
      }

      const summaryWithSalaryDeal = composeSalaryDeal(summaryNotes, salaryDeal);
      const submittedSummaryNotes =
        isOfflineInterview || offlineEvidenceReport.trim() || offlineEvidencePhotoDataUrl
          ? composeOfflineEvidence(summaryWithSalaryDeal, {
              location: selectedInterview.location,
              report: offlineEvidenceReport.trim(),
              photoName: offlineEvidencePhotoName || undefined,
              photoDataUrl: offlineEvidencePhotoDataUrl || undefined,
              recordedAt: new Date().toISOString(),
            })
          : summaryWithSalaryDeal;

      if (!submitFinalRecommendation || !canSubmitDecision) {
        if (canSubmitDecision) {
          await apiRequest(hrInterviewResultsApi.evaluationDraft(selectedInterview.id), token, {
            method: 'POST',
            body: JSON.stringify({
              finalRecommendation: recommendation,
              summaryNotes: composeEvaluationDraft(submittedSummaryNotes, recommendation),
            }),
          });
        }
        setSubmitMessage('Your evaluation was saved successfully.');
        return;
      }

      if (isOfflineInterview && !offlineEvidenceReport.trim() && !offlineEvidencePhotoDataUrl) {
        throw new Error(
          'Offline interviews require a meeting photo or a written interview report.',
        );
      }

      await apiRequest(hrInterviewResultsApi.finalRecommendation(selectedInterview.id), token, {
        method: 'POST',
        body: JSON.stringify({
          finalRecommendation: recommendation,
          summaryNotes: submittedSummaryNotes,
        }),
      });
      setCompletedInterviews((items) =>
        items.map((item) =>
          item.id === selectedInterview.id ? { ...item, status: 'Recorded' } : item,
        ),
      );
      setHasBeenSentToAdmin(true);
      setSubmitMessage('Final recommendation sent to Admin for Hire/Not Hire decision.');
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Unable to submit results');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-[1440px] space-y-6">
      <HRPageHeader
        eyebrow="HR Manager Portal"
        title="Interview Results"
        description="HR records candidate evaluations, reviews panel feedback, and sends the final recommendation to Admin."
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
      {!canSubmitDecision && selectedInterview ? (
        <HRInlineAlert tone="teal">Interview evaluation saved successfully.</HRInlineAlert>
      ) : null}
      {adminDecision && selectedInterview ? (
        <HRInlineAlert tone={adminDecision === 'HIRED' ? 'teal' : undefined}>
          Admin has finalized this candidate as {adminDecision === 'HIRED' ? 'Hire' : 'Not Hire'}.
          No further recommendation can be sent.
        </HRInlineAlert>
      ) : null}

      {loading && <HRLoadingState label="Loading completed interviews..." />}

      {!loading && !selectedInterview && <HREmptyState title="No completed interviews found." />}

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
                      <h3 className="text-sm font-bold text-deep-charcoal">
                        {interview.candidate}
                      </h3>
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
              <div className="px-6 pt-6 text-sm text-on-surface-variant">
                Loading panel feedback...
              </div>
            )}

            <div className="space-y-8 p-6">
              <section>
                <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                  <h3 className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] text-slate-ink">
                    <Icon className="h-4 w-4" name="groups" />
                    Panel Members Feedback
                  </h3>
                  <div className="flex flex-wrap gap-2 text-xs font-bold">
                    <span className="rounded-full border border-border-warm bg-surface-container-low px-3 py-1 text-slate-ink">
                      {feedbackStats.participants} Interview Participants
                    </span>
                    <span className="rounded-full border border-approved/30 bg-approved/10 px-3 py-1 text-approved">
                      {feedbackStats.evaluated} Evaluated
                    </span>
                    <span className="rounded-full border border-revision/30 bg-revision/10 px-3 py-1 text-revision">
                      {feedbackStats.notEvaluated} Not Evaluated
                    </span>
                  </div>
                </div>
                <div className="space-y-5">
                  {feedback.map((item) => {
                    const editable = canEditOwnFeedback && item.id === user?.id;
                    return (
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
                              <div className="flex flex-wrap items-center gap-2">
                                {editable && (
                                  <span className="rounded-full border border-teal-command/20 bg-teal-command/10 px-2.5 py-1 text-[11px] font-bold text-teal-command">
                                    Your feedback
                                  </span>
                                )}
                                <span
                                  className={`rounded-full border px-2.5 py-1 text-[11px] font-bold ${
                                    item.attendanceStatus === 'ABSENT'
                                      ? 'border-rejected/30 bg-rejected/10 text-rejected'
                                      : item.isRecorded
                                        ? 'border-approved/30 bg-approved/10 text-approved'
                                        : 'border-revision/30 bg-revision/10 text-revision'
                                  }`}
                                >
                                  {item.attendanceStatus === 'ABSENT'
                                    ? 'Absent'
                                    : item.isRecorded
                                      ? 'Evaluated'
                                      : 'Not Evaluated'}
                                </span>
                              </div>
                              <div className="flex w-fit rounded-lg bg-surface-container-high p-1">
                                {(['PASS', 'FAIL'] as const).map((decision) => (
                                  <button
                                    className={`rounded-md border px-3 py-1 text-[11px] font-bold transition active:scale-[0.98] ${
                                      item.decision === decision
                                        ? decision === 'PASS'
                                          ? 'border-emerald-600 bg-emerald-600 text-white shadow-sm ring-2 ring-emerald-200'
                                          : 'border-rose-600 bg-rose-600 text-white shadow-sm ring-2 ring-rose-200'
                                        : decision === 'PASS'
                                          ? 'border border-emerald-600 bg-white text-emerald-700 hover:bg-emerald-50'
                                          : 'border border-rose-600 bg-white text-rose-700 hover:bg-rose-50'
                                    }`}
                                    disabled={!editable || submitting}
                                    key={decision}
                                    onClick={() => updateDecision(item.id, decision)}
                                    type="button"
                                  >
                                    {decision === 'PASS' ? 'Pass' : 'Fail'}
                                  </button>
                                ))}
                              </div>
                            </div>

                            {item.attendanceStatus === 'ABSENT' ? (
                              <p className="rounded-lg border border-rejected/20 bg-rejected/5 px-3 py-2 text-sm text-rejected">
                                This panel member marked absent and is not required to evaluate the
                                candidate.
                              </p>
                            ) : null}

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
                                    className="h-1 w-full cursor-pointer accent-teal-command disabled:cursor-not-allowed disabled:opacity-60"
                                    disabled={!editable || submitting}
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
                              className="min-h-[88px] w-full rounded-lg border border-border-warm bg-clean-surface p-3 text-sm leading-6 outline-none focus:border-teal-command focus:ring-2 focus:ring-teal-command/20 disabled:cursor-not-allowed disabled:opacity-70"
                              disabled={!editable || submitting}
                              onChange={(event) => updateNotes(item.id, event.target.value)}
                              placeholder="Panel member observations..."
                              value={item.notes}
                            />
                          </div>
                        </div>
                      </article>
                    );
                  })}
                  {feedback.length === 0 && !detailsLoading && (
                    <p className="text-sm text-on-surface-variant">
                      No panel feedback recorded yet.
                    </p>
                  )}
                </div>
              </section>

              <section className="space-y-6 border-t border-border-warm pt-8">
                <h3 className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] text-slate-ink">
                  <Icon className="h-4 w-4" name="verified" />
                  Final Recommendation
                </h3>
                {canSubmitDecision ? (
                  <>
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                      {recommendationOptions.map((option) => {
                        const selected = recommendation === option.label;
                        return (
                          <button
                            aria-pressed={selected}
                            className="w-full rounded-lg border-2 p-4 text-center shadow-sm transition active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-70"
                            disabled={submitting}
                            key={option.label}
                            onClick={() => setRecommendation(option.label)}
                            style={{
                              backgroundColor: selected
                                ? option.color.background
                                : option.color.inactiveBackground,
                              borderColor: selected
                                ? option.color.border
                                : option.color.inactiveBorder,
                              boxShadow: selected
                                ? `0 0 0 3px ${option.color.border}33`
                                : '0 1px 2px rgba(15, 23, 42, 0.08)',
                              color: option.color.text,
                            }}
                            type="button"
                          >
                            <Icon
                              className="mx-auto mb-2 h-6 w-6 text-current"
                              name={option.icon}
                            />
                            <p className="text-sm font-bold text-current">{option.label}</p>
                          </button>
                        );
                      })}
                    </div>

                    <section className="space-y-4 rounded-lg border border-border-warm bg-workflow-ivory/50 p-4">
                      <div>
                        <h4 className="text-xs font-bold uppercase tracking-[0.12em] text-slate-ink">
                          Salary Deal
                        </h4>
                        <p className="mt-1 text-sm leading-6 text-slate-ink">
                          Record the candidate compensation discussion so Admin can prepare the
                          offer with the right framework.
                        </p>
                      </div>
                      <div className="rounded-lg border border-teal-command/20 bg-teal-command/5 p-3">
                        <p className="text-xs font-bold uppercase tracking-[0.12em] text-teal-command">
                          Salary Range from Recruitment Request
                        </p>
                        <p className="mt-1 text-base font-bold text-deep-charcoal">
                          {formatSalaryRange(salaryRange)}
                        </p>
                        <p className="mt-1 text-xs leading-5 text-slate-ink">
                          Compare this approved range with the candidate expectation and HR proposed
                          salary below.
                        </p>
                      </div>
                      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                        <label className="block space-y-2">
                          <span className="text-sm font-bold text-slate-ink">
                            Candidate Expected Salary
                          </span>
                          <input
                            className="h-10 w-full rounded-lg border border-border-warm bg-clean-surface px-3 text-sm outline-none focus:border-teal-command focus:ring-2 focus:ring-teal-command/20 disabled:cursor-not-allowed disabled:opacity-70"
                            disabled={submitting}
                            onChange={(event) =>
                              setSalaryDeal((current) => ({
                                ...current,
                                expectedSalary: event.target.value,
                              }))
                            }
                            placeholder="e.g. 45,000,000 VND gross/month"
                            value={salaryDeal.expectedSalary}
                          />
                        </label>
                        <label className="block space-y-2">
                          <span className="text-sm font-bold text-slate-ink">
                            HR Proposed Salary
                          </span>
                          <input
                            className="h-10 w-full rounded-lg border border-border-warm bg-clean-surface px-3 text-sm outline-none focus:border-teal-command focus:ring-2 focus:ring-teal-command/20 disabled:cursor-not-allowed disabled:opacity-70"
                            disabled={submitting}
                            onChange={(event) =>
                              setSalaryDeal((current) => ({
                                ...current,
                                proposedSalary: event.target.value,
                              }))
                            }
                            placeholder="e.g. Negotiable"
                            value={salaryDeal.proposedSalary}
                          />
                        </label>
                        <label className="block space-y-2">
                          <span className="text-sm font-bold text-slate-ink">Deal Status</span>
                          <select
                            className="h-10 w-full rounded-lg border border-border-warm bg-clean-surface px-3 text-sm outline-none focus:border-teal-command focus:ring-2 focus:ring-teal-command/20 disabled:cursor-not-allowed disabled:opacity-70"
                            disabled={submitting}
                            onChange={(event) =>
                              setSalaryDeal((current) => ({
                                ...current,
                                status: event.target.value as SalaryDeal['status'],
                              }))
                            }
                            value={salaryDeal.status}
                          >
                            <option value="NEGOTIATING">Negotiating</option>
                            <option value="AGREED">Agreed</option>
                            <option value="PENDING">Pending Candidate Response</option>
                            <option value="DECLINED">Declined</option>
                          </select>
                        </label>
                      </div>
                      <label className="block space-y-2">
                        <span className="text-sm font-bold text-slate-ink">
                          Salary Discussion Notes
                        </span>
                        <textarea
                          className="min-h-[88px] w-full rounded-lg border border-border-warm bg-clean-surface p-3 text-sm leading-6 outline-none focus:border-teal-command focus:ring-2 focus:ring-teal-command/20 disabled:cursor-not-allowed disabled:opacity-70"
                          disabled={submitting}
                          onChange={(event) =>
                            setSalaryDeal((current) => ({
                              ...current,
                              notes: event.target.value,
                            }))
                          }
                          placeholder="Capture candidate expectation, HR proposed range, benefits discussion, or follow-up terms..."
                          value={salaryDeal.notes}
                        />
                      </label>
                    </section>

                    <label className="block space-y-2">
                      <span className="text-sm font-bold text-slate-ink">
                        Executive Summary Notes
                      </span>
                      <textarea
                        className="min-h-[120px] w-full rounded-lg border border-border-warm bg-clean-surface p-4 text-sm leading-6 outline-none focus:border-teal-command focus:ring-2 focus:ring-teal-command/20 disabled:cursor-not-allowed disabled:opacity-70"
                        disabled={submitting}
                        onChange={(event) => setSummaryNotes(event.target.value)}
                        placeholder="Provide a high-level justification for the recommendation..."
                        value={summaryNotes}
                      />
                    </label>

                    <section className="space-y-4 rounded-lg border-2 border-dashed border-teal-command/30 bg-teal-command/5 p-5">
                      <div className="flex items-start gap-3">
                        <Icon className="mt-0.5 h-5 w-5 shrink-0 text-revision" name="upload" />
                        <div>
                          <p className="text-sm font-bold text-deep-charcoal">Meeting evidence</p>
                          <p className="mt-1 text-sm leading-6 text-slate-ink">
                            Location: {selectedInterview.location}. Attach a meeting photo as
                            evidence for this final recommendation. A short report is optional.
                          </p>
                        </div>
                      </div>
                      <label className="block space-y-2">
                        <span className="text-sm font-bold text-slate-ink">
                          Interview Report (optional)
                        </span>
                        <textarea
                          className="min-h-[96px] w-full rounded-lg border border-border-warm bg-clean-surface p-3 text-sm leading-6 outline-none focus:border-teal-command focus:ring-2 focus:ring-teal-command/20 disabled:cursor-not-allowed disabled:opacity-70"
                          disabled={submitting}
                          onChange={(event) => setOfflineEvidenceReport(event.target.value)}
                          placeholder="Summarize attendance, room, interview flow, and any notable observations..."
                          value={offlineEvidenceReport}
                        />
                      </label>
                      <label className="block space-y-2">
                        <span className="text-sm font-bold text-slate-ink">Meeting Photo</span>
                        <input
                          accept="image/*"
                          className="block w-full rounded-lg border border-border-warm bg-clean-surface p-2 text-sm file:mr-4 file:rounded-md file:border-0 file:bg-teal-command file:px-3 file:py-2 file:text-sm file:font-semibold file:text-white disabled:cursor-not-allowed disabled:opacity-70"
                          disabled={submitting}
                          onChange={handleEvidencePhotoChange}
                          type="file"
                        />
                        <span className="text-xs text-slate-ink">
                          JPG or PNG up to 2MB. A written report can be used when no photo is
                          available.
                        </span>
                      </label>
                      {offlineEvidencePhotoDataUrl && (
                        <div className="rounded-lg border border-border-warm bg-clean-surface p-3">
                          <p className="mb-2 text-xs font-bold uppercase tracking-[0.1em] text-slate-ink">
                            {offlineEvidencePhotoName}
                          </p>
                          <img
                            alt="Meeting evidence"
                            className="max-h-56 w-full rounded-md object-contain"
                            src={offlineEvidencePhotoDataUrl}
                          />
                        </div>
                      )}
                    </section>
                  </>
                ) : (
                  <div className="rounded-lg border border-border-warm bg-workflow-ivory p-4 text-sm leading-6 text-slate-ink">
                    Final Recommendation and Admin submission are available to HR. Your role can
                    save personal candidate evaluation when you are invited to this interview.
                  </div>
                )}
              </section>
            </div>

            <footer className="flex flex-col gap-3 border-t border-border-warm bg-clean-surface p-5 sm:flex-row sm:items-center sm:justify-between">
              <div className="text-sm">
                {submitMessage && (
                  <span className="font-semibold text-approved">{submitMessage}</span>
                )}
                {submitError && <span className="font-semibold text-rejected">{submitError}</span>}
              </div>
              <div className="flex flex-col gap-3 sm:flex-row">
                {(canEditOwnFeedback || canSubmitDecision) && (
                  <button
                    className="rounded-lg border border-teal-command px-6 py-2.5 text-sm font-semibold text-teal-command transition hover:bg-teal-command/5 disabled:opacity-70"
                    disabled={submitting}
                    onClick={() => void submitResults(false)}
                    type="button"
                  >
                    {submitting ? 'Saving...' : 'Save Evaluation'}
                  </button>
                )}
                <button
                  className="rounded-lg bg-teal-command px-8 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-primary active:scale-[0.98] disabled:opacity-70"
                  disabled={submitting || !canSubmitDecision || Boolean(adminDecision)}
                  onClick={() => void submitResults(true)}
                  type="button"
                >
                  {submitting
                    ? 'Submitting...'
                    : adminDecision === 'HIRED'
                      ? 'Admin chose Hire'
                      : adminDecision === 'NOT_HIRED'
                        ? 'Admin chose Not Hire'
                        : hasBeenSentToAdmin
                          ? 'Resend for Admin'
                          : 'Send Recommendation to Admin'}
                </button>
              </div>
            </footer>
          </main>
        </div>
      )}
    </div>
  );
};
