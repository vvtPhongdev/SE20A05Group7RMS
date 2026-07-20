import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { JobDetailsModal } from '../../../components/JobDetailsModal';
import { useAuth } from '../../../context/AuthContext';
import { ApiError, apiRequest } from '../../../lib/api';
import {
  CandidateActionButton,
  CandidateCard,
  CandidateDashboardPage,
  CandidateEmptyState,
  CandidateInlineAlert,
  CandidateLoadingState,
  CandidatePageHeader,
} from '../components';

type ApplicationTone = 'neutral' | 'active' | 'warning' | 'success' | 'danger';
type ApplicationOutcome = 'success' | 'failure' | null;
type StepState = 'completed' | 'current' | 'failed' | 'upcoming';

type Application = {
  id: string;
  requestId: string;
  title: string;
  department: string;
  appliedDate: string;
  updatedDate?: string;
  statusLabel: string;
  statusTone: ApplicationTone;
  currentStepIndex: number;
  description: string;
  outcome: ApplicationOutcome;
  event?: string;
  action?: {
    label: string;
    target: string;
  };
};

type JobPosting = {
  id: string;
  requestId: string;
  title: string;
  description: string;
  requirements?: Record<string, unknown> | null;
  startDate?: string | null;
  expireDate?: string | null;
  request?: {
    urgency?: string;
    position?: string;
    headcount?: number;
    jobDescription?: string;
    skillRequirements?: unknown;
    justification?: string;
    department?: {
      name: string;
      bachelorRequirements?: unknown;
    } | null;
  } | null;
};

type Interview = {
  id: string;
  requestId: string;
  scheduledAt: string;
  status: string;
};

type ProfileResponse = {
  applications: Array<{
    id: string;
    status: string;
    createdAt: string;
    updatedAt?: string;
    request: {
      id: string;
      position: string;
      department?: { name: string };
    };
  }>;
  interviews: Interview[];
};

type CvDocumentSummary = {
  id: string;
};

const asRecord = (value: unknown): Record<string, unknown> =>
  value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};

const getJobBannerUrl = (job: JobPosting) => {
  const media = asRecord(job.requirements).recruitmentMedia;
  if (!Array.isArray(media)) return '';

  const banner = media.find((item) => {
    const record = asRecord(item);
    return record.kind === 'BANNER' && typeof record.url === 'string';
  });

  return typeof asRecord(banner).url === 'string' ? (asRecord(banner).url as string) : '';
};

const steps = [
  { label: 'Applied', detail: 'Application received' },
  { label: 'CV screening', detail: 'Recruiter review' },
  { label: 'Interview', detail: 'Interview rounds' },
  { label: 'Decision', detail: 'Hiring review' },
  { label: 'Offer', detail: 'Offer response' },
] as const;

const statusClass: Record<ApplicationTone, string> = {
  neutral: 'bg-secondary/10 text-secondary',
  active: 'bg-teal-command/10 text-teal-command',
  warning: 'bg-pending/10 text-pending',
  success: 'bg-approved/10 text-approved',
  danger: 'bg-rejected/10 text-rejected',
};

const progressByStatus: Record<
  string,
  {
    label: string;
    tone: ApplicationTone;
    step: number;
    description: string;
    outcome?: Exclude<ApplicationOutcome, null>;
  }
> = {
  SUBMITTED: {
    label: 'Application submitted',
    tone: 'neutral',
    step: 0,
    description: 'Your application has been received and is waiting for recruiter review.',
  },
  SCREENING: {
    label: 'CV screening',
    tone: 'active',
    step: 1,
    description: 'The recruitment team is reviewing your CV and qualifications.',
  },
  SHORTLISTED: {
    label: 'Shortlisted',
    tone: 'active',
    step: 2,
    description: 'You have passed CV screening and are moving to the interview stage.',
  },
  INTERVIEWING: {
    label: 'Interview stage',
    tone: 'warning',
    step: 2,
    description: 'Your interview process is in progress. Check the schedule for details.',
  },
  INTERVIEW_COMPLETED: {
    label: 'Interview completed',
    tone: 'active',
    step: 3,
    description: 'Your interview is complete and the team is preparing a final decision.',
  },
  DECISION_PENDING: {
    label: 'Decision pending',
    tone: 'warning',
    step: 3,
    description: 'Your application is in final review with the hiring team.',
  },
  OFFER_EXTENDED: {
    label: 'Offer ready',
    tone: 'warning',
    step: 4,
    description: 'An offer is ready for your review and response.',
  },
  OFFER_ACCEPTED: {
    label: 'Offer accepted',
    tone: 'success',
    step: 4,
    description: 'You accepted the offer. The recruitment team will share the next steps.',
    outcome: 'success',
  },
  HIRED: {
    label: 'Hired',
    tone: 'success',
    step: 4,
    description: 'Congratulations! Your application process has been completed successfully.',
    outcome: 'success',
  },
  COMPLETED: {
    label: 'Completed',
    tone: 'success',
    step: 4,
    description: 'Your application process has been completed successfully.',
    outcome: 'success',
  },
  REJECTED: {
    label: 'Not selected',
    tone: 'danger',
    step: 1,
    description: 'Your application was not selected after CV screening.',
    outcome: 'failure',
  },
  NOT_HIRED: {
    label: 'Not selected',
    tone: 'danger',
    step: 3,
    description: 'The hiring team completed its review and selected another candidate.',
    outcome: 'failure',
  },
  OFFER_DECLINED: {
    label: 'Offer declined',
    tone: 'danger',
    step: 4,
    description: 'The offer was declined and this application is now closed.',
    outcome: 'failure',
  },
  CANCELLED: {
    label: 'Application closed',
    tone: 'danger',
    step: 0,
    description: 'This application process has been cancelled.',
    outcome: 'failure',
  },
  CLOSED: {
    label: 'Process closed',
    tone: 'danger',
    step: 3,
    description: 'The recruitment process for this position has been closed.',
    outcome: 'failure',
  },
};

const iconPaths: Record<string, React.ReactNode> = {
  check: <path d="M20 6 9 17l-5-5" />,
  close: <path d="m6 6 12 12M18 6 6 18" />,
  arrow: <path d="M5 12h14m-6-6 6 6-6 6" />,
  calendar: (
    <path d="M8 2v4m8-4v4M4 10h16M6 5h12a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2Z" />
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

const getStepState = (application: Application, index: number): StepState => {
  if (application.outcome === 'success' || index < application.currentStepIndex) return 'completed';
  if (application.outcome === 'failure' && index === application.currentStepIndex) return 'failed';
  if (index === application.currentStepIndex) return 'current';
  return 'upcoming';
};

const StepMarker = ({ state, index }: { state: StepState; index: number }) => {
  if (state === 'completed') {
    return (
      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-approved text-white shadow-sm">
        <Icon className="h-3.5 w-3.5" name="check" />
      </div>
    );
  }

  if (state === 'failed') {
    return (
      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-rejected text-white shadow-sm">
        <Icon className="h-4 w-4" name="close" />
      </div>
    );
  }

  if (state === 'current') {
    return (
      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-teal-command text-sm font-bold text-white shadow-[0_0_0_5px_rgba(13,148,136,0.12)]">
        {index + 1}
      </div>
    );
  }

  return (
    <div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-surface-variant bg-clean-surface text-sm font-semibold text-secondary">
      {index + 1}
    </div>
  );
};

const mapApplications = (profile: ProfileResponse): Application[] =>
  profile.applications.map((application) => {
    const rawStatus = application.status.toUpperCase();
    const progress = progressByStatus[rawStatus] ?? {
      label: rawStatus
        .toLowerCase()
        .replaceAll('_', ' ')
        .replace(/^./, (value) => value.toUpperCase()),
      tone: 'neutral' as const,
      step: 0,
      description: 'Your application is being processed by the recruitment team.',
    };
    const requestInterviews = profile.interviews.filter(
      (item) => item.requestId === application.request.id,
    );
    const scheduledInterview =
      progress.step <= 2 && !progress.outcome
        ? requestInterviews.find((item) =>
            ['SCHEDULED', 'CONFIRMED', 'RESCHEDULE_REQUESTED'].includes(item.status.toUpperCase()),
          )
        : undefined;
    const interview = scheduledInterview ?? requestInterviews[0];
    const hasOffer = ['OFFER_EXTENDED', 'OFFER_ACCEPTED', 'OFFER_DECLINED', 'HIRED'].includes(
      rawStatus,
    );

    return {
      id: application.id,
      requestId: application.request.id,
      title: application.request.position,
      department: application.request.department?.name ?? 'Department not available',
      appliedDate: new Date(application.createdAt).toLocaleDateString(),
      updatedDate: application.updatedAt
        ? new Date(application.updatedAt).toLocaleDateString()
        : undefined,
      statusLabel: progress.label,
      statusTone: progress.tone,
      currentStepIndex: progress.step,
      description: scheduledInterview
        ? `Interview scheduled for ${new Date(scheduledInterview.scheduledAt).toLocaleString()}.`
        : progress.description,
      outcome: progress.outcome ?? null,
      event: scheduledInterview
        ? `Interview scheduled - ${new Date(scheduledInterview.scheduledAt).toLocaleString()}`
        : undefined,
      action: hasOffer
        ? {
            label: rawStatus === 'OFFER_EXTENDED' ? 'Review offer' : 'View offer',
            target: '/candidate/offers',
          }
        : interview
          ? { label: 'View interview', target: `/candidate/interviews?id=${interview.id}` }
          : undefined,
    };
  });

export const CandidateDashboard: React.FC = () => {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [applications, setApplications] = useState<Application[]>([]);
  const [openJobs, setOpenJobs] = useState<JobPosting[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionMessage, setActionMessage] = useState('');
  const [applyingRequestId, setApplyingRequestId] = useState('');
  const [selectedJob, setSelectedJob] = useState<JobPosting | null>(null);
  const [hasUploadedCv, setHasUploadedCv] = useState(false);
  const [showMissingCvNotice, setShowMissingCvNotice] = useState(false);

  useEffect(() => {
    const loadDashboard = async () => {
      setLoading(true);
      setError('');
      try {
        const [profile, jobs, cvs] = await Promise.all([
          apiRequest<ProfileResponse>('/candidate-profiles/me', token),
          apiRequest<JobPosting[]>(
            '/public/job-postings?status=PUBLISHED&visibility=PUBLIC',
            null,
          ).catch(() => []),
          apiRequest<CvDocumentSummary[]>('/candidate/cvs', token),
        ]);
        setApplications(mapApplications(profile));
        setOpenJobs(jobs);
        setHasUploadedCv(cvs.length > 0);
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : 'Unable to load applications');
      } finally {
        setLoading(false);
      }
    };

    void loadDashboard();
  }, [token]);

  const availableJobs = useMemo(
    () => openJobs.filter((job) => !applications.some((app) => app.requestId === job.requestId)),
    [applications, openJobs],
  );
  const openJobsEmptyTitle =
    openJobs.length === 0
      ? 'No published jobs are available right now.'
      : 'You have already applied to every published job.';

  const handleApplicationAction = (application: Application) => {
    if (application.action) {
      navigate(application.action.target);
    }
  };

  const applyToJob = async (job: JobPosting) => {
    if (!hasUploadedCv) {
      setSelectedJob(null);
      setShowMissingCvNotice(true);
      return;
    }

    setApplyingRequestId(job.requestId);
    setActionMessage('');
    setError('');
    try {
      await apiRequest('/applications', token, {
        method: 'POST',
        body: JSON.stringify({ requestId: job.requestId }),
      });
      setActionMessage('Application submitted successfully.');
      const profile = await apiRequest<{
        applications: ProfileResponse['applications'];
        interviews: ProfileResponse['interviews'];
      }>('/candidate-profiles/me', token);
      setApplications(mapApplications(profile));
    } catch (applyError) {
      setError(
        applyError instanceof ApiError && applyError.status === 409
          ? 'You have already applied to this job.'
          : applyError instanceof Error
            ? applyError.message
            : 'Unable to submit application',
      );
    } finally {
      setApplyingRequestId('');
    }
  };

  return (
    <CandidateDashboardPage>
      <CandidatePageHeader
        className="mb-10"
        title="Candidate Application Tracking Dashboard"
        description="Track your application progress and view upcoming interviews."
      />

      {loading ? <CandidateLoadingState label="Loading applications..." /> : null}
      {error ? <CandidateInlineAlert>{error}</CandidateInlineAlert> : null}
      {actionMessage ? (
        <CandidateInlineAlert tone="teal">{actionMessage}</CandidateInlineAlert>
      ) : null}

      <section className="mb-12" id="open-jobs">
        <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-teal-command">
              Open positions
            </p>
            <h2 className="mt-1 text-2xl font-semibold text-deep-charcoal">
              Jobs you can apply to
            </h2>
          </div>
          <span className="text-sm font-semibold text-secondary">
            {availableJobs.length} available
          </span>
        </div>

        {availableJobs.length === 0 ? (
          <CandidateEmptyState title={openJobsEmptyTitle} />
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {availableJobs.map((job) => {
              const bannerUrl = getJobBannerUrl(job);

              return (
                <CandidateCard
                  as="article"
                  className="flex min-h-60 flex-col overflow-hidden !p-0"
                  key={job.id}
                >
                  {bannerUrl ? (
                    <div className="aspect-[16/7] w-full border-b border-border-warm bg-surface-container-low">
                      <img
                        alt={`${job.title} recruitment banner`}
                        className="h-full w-full object-contain"
                        loading="lazy"
                        src={bannerUrl}
                      />
                    </div>
                  ) : null}

                  <div className="flex flex-1 flex-col p-5">
                    <div className="mb-3">
                      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-teal-command">
                        {job.request?.department?.name ?? 'Hiring team'}
                      </p>
                      <h3 className="mt-2 text-lg font-semibold text-deep-charcoal">{job.title}</h3>
                    </div>
                    <p className="line-clamp-4 flex-1 text-sm leading-6 text-secondary">
                      {job.description}
                    </p>
                    <div className="mt-5 flex items-center justify-between gap-3">
                      <span className="text-xs font-semibold text-secondary">
                        {job.expireDate
                          ? `Closes ${new Date(job.expireDate).toLocaleDateString()}`
                          : 'Open until filled'}
                      </span>
                      <div className="flex items-center gap-2">
                        <button
                          className="inline-flex h-10 items-center rounded-lg border border-teal-command px-3 text-sm font-semibold text-teal-command transition hover:bg-teal-command hover:text-white"
                          onClick={() => setSelectedJob(job)}
                          type="button"
                        >
                          Details
                        </button>
                        <CandidateActionButton
                          disabled={applyingRequestId === job.requestId}
                          onClick={() => void applyToJob(job)}
                        >
                          {applyingRequestId === job.requestId ? 'Applying...' : 'Apply'}
                        </CandidateActionButton>
                      </div>
                    </div>
                  </div>
                </CandidateCard>
              );
            })}
          </div>
        )}
      </section>

      {!loading && !error && applications.length === 0 ? (
        <CandidateEmptyState title="You have not submitted any applications yet." />
      ) : null}

      {!loading && !error && applications.length > 0 ? (
        <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-teal-command">
              Your applications
            </p>
            <h2 className="mt-1 text-2xl font-semibold text-deep-charcoal">Application progress</h2>
          </div>
          <span className="text-sm font-semibold text-secondary">
            {applications.length} {applications.length === 1 ? 'application' : 'applications'}
          </span>
        </div>
      ) : null}

      <section className="mb-12 flex flex-col gap-6" id="applications-container">
        {applications.map((application) => {
          const progressPercentage = ((application.currentStepIndex + 1) / steps.length) * 100;
          const progressBarClass =
            application.outcome === 'success'
              ? 'bg-approved'
              : application.outcome === 'failure'
                ? 'bg-rejected'
                : 'bg-teal-command';

          return (
            <CandidateCard
              as="article"
              className={`rounded-xl border border-border-warm bg-clean-surface p-5 transition-all hover:shadow-sm sm:p-6 ${
                application.outcome === 'success'
                  ? 'border-l-4 border-l-approved'
                  : application.outcome === 'failure'
                    ? 'border-l-4 border-l-rejected'
                    : ''
              }`}
              key={application.id}
            >
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <h3 className="text-xl font-semibold text-deep-charcoal">{application.title}</h3>
                  <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm font-medium text-secondary">
                    <span>{application.department}</span>
                    <span aria-hidden="true" className="text-outline-variant">
                      •
                    </span>
                    <span>Applied {application.appliedDate}</span>
                    {application.updatedDate &&
                    application.updatedDate !== application.appliedDate ? (
                      <>
                        <span aria-hidden="true" className="text-outline-variant">
                          •
                        </span>
                        <span>Updated {application.updatedDate}</span>
                      </>
                    ) : null}
                  </div>
                </div>
                <span
                  className={`inline-flex w-fit shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold ${statusClass[application.statusTone]}`}
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-current" />
                  {application.statusLabel}
                </span>
              </div>

              <div className="mt-6 rounded-xl border border-border-warm bg-surface-container-low/60 p-4 sm:p-5">
                <div className="flex items-center justify-between gap-4">
                  <p className="text-sm font-semibold text-deep-charcoal">Recruitment journey</p>
                  <span className="text-xs font-semibold text-secondary">
                    {application.outcome === 'success'
                      ? 'Completed'
                      : application.outcome === 'failure'
                        ? `Closed at step ${application.currentStepIndex + 1}`
                        : `Step ${application.currentStepIndex + 1} of ${steps.length}`}
                  </span>
                </div>
                <div
                  aria-label={`${Math.round(progressPercentage)}% of application journey reached`}
                  aria-valuemax={100}
                  aria-valuemin={0}
                  aria-valuenow={Math.round(progressPercentage)}
                  className="mt-3 h-2 overflow-hidden rounded-full bg-surface-variant"
                  role="progressbar"
                >
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${progressBarClass}`}
                    style={{ width: `${progressPercentage}%` }}
                  />
                </div>
                <p className="mt-3 text-sm leading-6 text-secondary">{application.description}</p>

                <ol
                  aria-label={`Application steps for ${application.title}`}
                  className="mt-5 grid gap-2 sm:grid-cols-5"
                >
                  {steps.map((step, index) => {
                    const state = getStepState(application, index);
                    const stateLabel =
                      state === 'completed'
                        ? 'Complete'
                        : state === 'current'
                          ? 'In progress'
                          : state === 'failed'
                            ? 'Closed here'
                            : 'Upcoming';
                    const stepClass =
                      state === 'completed'
                        ? 'border-approved/25 bg-approved/5'
                        : state === 'current'
                          ? 'border-teal-command/40 bg-clean-surface shadow-sm'
                          : state === 'failed'
                            ? 'border-rejected/30 bg-rejected/5'
                            : 'border-border-warm bg-clean-surface/60';

                    return (
                      <li
                        className={`flex items-center gap-3 rounded-lg border p-3 sm:flex-col sm:items-start ${stepClass}`}
                        key={step.label}
                      >
                        <StepMarker index={index} state={state} />
                        <div className="min-w-0 sm:mt-1">
                          <p className="text-xs font-semibold text-deep-charcoal">{step.label}</p>
                          <p className="mt-0.5 text-[11px] leading-4 text-secondary sm:hidden lg:block">
                            {step.detail}
                          </p>
                          <p
                            className={`mt-1 text-[10px] font-semibold uppercase tracking-[0.08em] ${
                              state === 'completed'
                                ? 'text-approved'
                                : state === 'current'
                                  ? 'text-teal-command'
                                  : state === 'failed'
                                    ? 'text-rejected'
                                    : 'text-secondary'
                            }`}
                          >
                            {stateLabel}
                          </p>
                        </div>
                      </li>
                    );
                  })}
                </ol>
              </div>

              {application.event || application.action ? (
                <div className="mt-5 flex flex-col gap-4 border-t border-border-warm pt-5 sm:flex-row sm:items-center sm:justify-between">
                  {application.event ? (
                    <p className="flex items-start gap-2 text-sm leading-6 text-deep-charcoal">
                      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-teal-command" name="calendar" />
                      <span>
                        <span className="font-semibold text-teal-command">Upcoming: </span>
                        {application.event}
                      </span>
                    </p>
                  ) : (
                    <span />
                  )}
                  {application.action ? (
                    <button
                      className={`w-full shrink-0 rounded-lg px-5 py-2.5 text-sm font-semibold transition active:scale-[0.98] sm:w-auto ${
                        application.action.target === '/candidate/offers'
                          ? 'bg-teal-command text-white hover:bg-primary'
                          : 'border border-teal-command text-teal-command hover:bg-teal-command hover:text-white'
                      }`}
                      onClick={() => handleApplicationAction(application)}
                      type="button"
                    >
                      {application.action.label}
                    </button>
                  ) : null}
                </div>
              ) : null}
            </CandidateCard>
          );
        })}
      </section>

      <div className="flex justify-center border-t border-border-warm pt-8">
        <button
          className="inline-flex items-center gap-2 text-sm font-semibold text-teal-command transition hover:underline active:scale-[0.98]"
          onClick={() =>
            document.getElementById('open-jobs')?.scrollIntoView({ behavior: 'smooth' })
          }
          type="button"
        >
          Browse Open Positions
          <Icon className="h-4 w-4" name="arrow" />
        </button>
      </div>

      <JobDetailsModal
        action={
          selectedJob ? (
            <CandidateActionButton
              disabled={applyingRequestId === selectedJob.requestId}
              onClick={() => void applyToJob(selectedJob)}
            >
              {applyingRequestId === selectedJob.requestId ? 'Applying...' : 'Apply Now'}
            </CandidateActionButton>
          ) : null
        }
        job={selectedJob}
        onClose={() => setSelectedJob(null)}
      />

      {showMissingCvNotice ? (
        <div
          aria-labelledby="missing-cv-title"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-deep-charcoal/45 p-4"
          role="dialog"
        >
          <CandidateCard className="w-full max-w-md p-6 shadow-xl">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-pending">
              CV required
            </p>
            <h2 className="mt-2 text-xl font-semibold text-deep-charcoal" id="missing-cv-title">
              Upload your CV before applying
            </h2>
            <p className="mt-3 text-sm leading-6 text-secondary">
              You have not uploaded a CV yet. Upload one to submit an application.
            </p>
            <div className="mt-6 flex flex-wrap justify-end gap-3">
              <button
                className="rounded-lg border border-outline-variant px-4 py-2 text-sm font-semibold text-secondary transition hover:bg-surface-container-low"
                onClick={() => setShowMissingCvNotice(false)}
                type="button"
              >
                Cancel
              </button>
              <CandidateActionButton onClick={() => navigate('/candidate/upload-cv')}>
                Upload CV
              </CandidateActionButton>
            </div>
          </CandidateCard>
        </div>
      ) : null}
    </CandidateDashboardPage>
  );
};
