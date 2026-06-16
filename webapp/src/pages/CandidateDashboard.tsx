import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ApiError, apiRequest } from '../lib/api';

type ApplicationStatus = 'Interview Phase' | 'Under Review' | 'Offer Extended' | 'Not Selected';
type Step = 'Applied' | 'CV Review' | 'Interview' | 'Final Decision';

type Application = {
  id: string;
  requestId: string;
  title: string;
  department: string;
  appliedDate: string;
  status: ApplicationStatus;
  currentStep: Step;
  completedSteps: Step[];
  event?: string;
  interviewId?: string;
  action: string;
  disabled?: boolean;
};

type JobPosting = {
  id: string;
  requestId: string;
  title: string;
  description: string;
  expireDate?: string | null;
  request?: {
    department?: { name: string } | null;
    urgency?: string;
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
    request: {
      id: string;
      position: string;
      department?: { name: string };
    };
  }>;
  interviews: Interview[];
};

const steps: Step[] = ['Applied', 'CV Review', 'Interview', 'Final Decision'];

const statusClass: Record<ApplicationStatus, string> = {
  'Interview Phase': 'bg-pending/10 text-pending',
  'Under Review': 'bg-secondary/10 text-secondary',
  'Offer Extended': 'bg-approved/10 text-approved',
  'Not Selected': 'bg-rejected/10 text-rejected',
};

const iconPaths: Record<string, React.ReactNode> = {
  check: <path d="M20 6 9 17l-5-5" />,
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

const StepMarker = ({ step, application }: { step: Step; application: Application }) => {
  const completed = application.completedSteps.includes(step);
  const active = application.currentStep === step && !completed && !application.disabled;

  if (completed) {
    return (
      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-approved text-white">
        <Icon className="h-3.5 w-3.5" name="check" />
      </div>
    );
  }

  if (active) {
    return (
      <div className="h-6 w-6 animate-pulse rounded-full bg-teal-command shadow-[0_0_0_6px_rgba(13,148,136,0.12)]" />
    );
  }

  return <div className="h-6 w-6 rounded-full border-2 border-surface-variant bg-workflow-ivory" />;
};

export const CandidateDashboard: React.FC = () => {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [applications, setApplications] = useState<Application[]>([]);
  const [openJobs, setOpenJobs] = useState<JobPosting[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionMessage, setActionMessage] = useState('');
  const [applyingRequestId, setApplyingRequestId] = useState('');

  useEffect(() => {
    const loadDashboard = async () => {
      setLoading(true);
      setError('');
      try {
        const [profile, jobs] = await Promise.all([
          apiRequest<ProfileResponse>('/candidate-profiles/me', token),
          apiRequest<JobPosting[]>('/job-postings', token).catch(() => []),
        ]);
        const mapped = profile.applications.map((application): Application => {
          const status = application.status.toUpperCase();
          const interview = profile.interviews.find(
            (item) => item.requestId === application.request.id && item.status === 'SCHEDULED',
          );
          const isRejected = ['REJECTED', 'OFFER_DECLINED', 'CANCELLED'].includes(status);
          const isOffer = ['OFFER_EXTENDED', 'OFFER_ACCEPTED'].includes(status);
          const isInterview = ['INTERVIEWING', 'INTERVIEW_COMPLETED'].includes(status);

          return {
            id: application.id,
            requestId: application.request.id,
            title: application.request.position,
            department: application.request.department?.name ?? 'Department not available',
            appliedDate: new Date(application.createdAt).toLocaleDateString(),
            status: isRejected
              ? 'Not Selected'
              : isOffer
                ? 'Offer Extended'
                : isInterview
                  ? 'Interview Phase'
                  : 'Under Review',
            currentStep:
              isOffer || status === 'INTERVIEW_COMPLETED'
                ? 'Final Decision'
                : isInterview
                  ? 'Interview'
                  : 'CV Review',
            completedSteps: isOffer
              ? ['Applied', 'CV Review', 'Interview']
              : isInterview
                ? ['Applied', 'CV Review']
                : isRejected
                  ? ['Applied']
                  : ['Applied'],
            event: interview
              ? `Interview scheduled - ${new Date(interview.scheduledAt).toLocaleString()}`
              : undefined,
            interviewId: interview?.id,
            action: interview ? 'View Interview' : isOffer ? 'Review Offer' : 'View Details',
            disabled: isRejected || !interview,
          };
        });
        setApplications(mapped);
        setOpenJobs(jobs);
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

  const handleApplicationAction = (application: Application) => {
    if (application.interviewId) {
      navigate(`/candidate/interviews?id=${application.interviewId}`);
    }
  };

  const applyToJob = async (job: JobPosting) => {
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
      setApplications(
        profile.applications.map((application): Application => {
          const status = application.status.toUpperCase();
          const interview = profile.interviews.find(
            (item) => item.requestId === application.request.id && item.status === 'SCHEDULED',
          );
          const isRejected = ['REJECTED', 'OFFER_DECLINED', 'CANCELLED'].includes(status);
          const isOffer = ['OFFER_EXTENDED', 'OFFER_ACCEPTED'].includes(status);
          const isInterview = ['INTERVIEWING', 'INTERVIEW_COMPLETED'].includes(status);

          return {
            id: application.id,
            requestId: application.request.id,
            title: application.request.position,
            department: application.request.department?.name ?? 'Department not available',
            appliedDate: new Date(application.createdAt).toLocaleDateString(),
            status: isRejected
              ? 'Not Selected'
              : isOffer
                ? 'Offer Extended'
                : isInterview
                  ? 'Interview Phase'
                  : 'Under Review',
            currentStep:
              isOffer || status === 'INTERVIEW_COMPLETED'
                ? 'Final Decision'
                : isInterview
                  ? 'Interview'
                  : 'CV Review',
            completedSteps: isOffer
              ? ['Applied', 'CV Review', 'Interview']
              : isInterview
                ? ['Applied', 'CV Review']
                : isRejected
                  ? ['Applied']
                  : ['Applied'],
            event: interview
              ? `Interview scheduled - ${new Date(interview.scheduledAt).toLocaleString()}`
              : undefined,
            interviewId: interview?.id,
            action: interview ? 'View Interview' : isOffer ? 'Review Offer' : 'View Details',
            disabled: isRejected || !interview,
          };
        }),
      );
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
    <div className="mx-auto max-w-[1440px]">
      <header className="mb-10">
        <h1 className="mb-2 text-3xl font-semibold tracking-tight text-deep-charcoal">
          Candidate Application Tracking Dashboard
        </h1>
        <p className="text-base text-secondary">
          Track your application progress and view upcoming interviews.
        </p>
      </header>

      {loading ? <p className="mb-6 text-sm text-secondary">Loading applications...</p> : null}
      {error ? (
        <p className="mb-6 rounded-lg border border-error/20 bg-error-container p-4 text-sm text-on-error-container">
          {error}
        </p>
      ) : null}
      {actionMessage ? (
        <p className="mb-6 rounded-lg border border-teal-command/20 bg-teal-command/10 p-4 text-sm font-semibold text-teal-command">
          {actionMessage}
        </p>
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
          <div className="rounded-lg border border-border-warm bg-clean-surface p-6 text-sm text-secondary">
            No published jobs are available right now.
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {availableJobs.map((job) => (
              <article
                className="flex min-h-60 flex-col rounded-lg border border-border-warm bg-clean-surface p-5 shadow-sm"
                key={job.id}
              >
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
                  <button
                    className="inline-flex h-9 items-center rounded-lg bg-teal-command px-4 text-sm font-semibold text-white transition hover:bg-primary active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
                    disabled={applyingRequestId === job.requestId}
                    onClick={() => void applyToJob(job)}
                    type="button"
                  >
                    {applyingRequestId === job.requestId ? 'Applying...' : 'Apply'}
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      {!loading && !error && applications.length === 0 ? (
        <p className="mb-6 rounded-lg border border-border-warm bg-clean-surface p-6 text-sm text-secondary">
          You have not submitted any applications yet.
        </p>
      ) : null}

      <section className="mb-12 flex flex-col gap-6" id="applications-container">
        {applications.map((application) => (
          <article
            className={`rounded-lg border border-border-warm bg-clean-surface p-6 transition-all hover:shadow-sm ${
              application.status === 'Offer Extended' ? 'border-l-4 border-l-approved' : ''
            } ${application.disabled ? 'opacity-60 grayscale-[0.5]' : ''}`}
            key={application.id}
          >
            <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-center">
              <div className="min-w-0 flex-1">
                <div className="mb-2 flex flex-wrap items-center gap-4">
                  <h2 className="text-xl font-semibold text-deep-charcoal">{application.title}</h2>
                  <span
                    className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${statusClass[application.status]}`}
                  >
                    <span className="h-1.5 w-1.5 rounded-full bg-current" />
                    {application.status}
                  </span>
                </div>
                <div className="mb-6 flex flex-wrap gap-4 text-sm font-medium text-secondary">
                  <span>{application.department}</span>
                  <span className="text-outline-variant">|</span>
                  <span className="font-mono">Applied: {application.appliedDate}</span>
                </div>

                <div className="flex max-w-3xl items-start overflow-x-auto pb-1">
                  {steps.map((step, index) => {
                    const lineActive =
                      index < steps.length - 1 && application.completedSteps.includes(step);
                    const labelActive =
                      application.currentStep === step || application.completedSteps.includes(step);
                    return (
                      <React.Fragment key={step}>
                        <div className="flex min-w-[76px] flex-col items-center text-center">
                          <StepMarker application={application} step={step} />
                          <span
                            className={`mt-2 text-xs font-semibold ${labelActive ? 'text-teal-command' : 'text-secondary'}`}
                          >
                            {step}
                          </span>
                        </div>
                        {index < steps.length - 1 ? (
                          <div
                            className={`mx-2 mt-3 h-0.5 min-w-10 flex-1 rounded-full ${lineActive ? 'bg-approved' : 'bg-surface-variant'}`}
                          />
                        ) : null}
                      </React.Fragment>
                    );
                  })}
                </div>
              </div>

              <div className="flex w-full flex-col items-end gap-4 lg:w-72">
                {application.event ? (
                  <section className="w-full rounded-lg border border-teal-command/20 bg-surface-container-low p-4">
                    <p className="mb-1 text-xs font-semibold uppercase tracking-[0.12em] text-teal-command">
                      UPCOMING EVENT
                    </p>
                    <p className="flex items-start gap-2 text-sm leading-6 text-deep-charcoal">
                      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-teal-command" name="calendar" />
                      {application.event}
                    </p>
                  </section>
                ) : null}
                <button
                  className={`w-full rounded-lg px-6 py-2 text-sm font-semibold transition active:scale-[0.98] lg:w-auto ${
                    application.status === 'Offer Extended'
                      ? 'bg-teal-command text-white hover:bg-primary'
                      : application.disabled
                        ? 'cursor-not-allowed border border-outline-variant text-secondary'
                        : 'border border-teal-command text-teal-command hover:bg-teal-command hover:text-white'
                  }`}
                  disabled={application.disabled}
                  onClick={() => handleApplicationAction(application)}
                  type="button"
                >
                  {application.action}
                </button>
              </div>
            </div>
          </article>
        ))}
      </section>

      <div className="flex justify-center border-t border-border-warm pt-8">
        <button
          className="inline-flex items-center gap-2 text-sm font-semibold text-teal-command transition hover:underline active:scale-[0.98]"
          onClick={() => document.getElementById('open-jobs')?.scrollIntoView({ behavior: 'smooth' })}
          type="button"
        >
          Browse Open Positions
          <Icon className="h-4 w-4" name="arrow" />
        </button>
      </div>
    </div>
  );
};
