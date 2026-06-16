import React, { useEffect, useState } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { apiRequest } from '../../../lib/api';
import {
  CandidateCard,
  CandidateDashboardPage,
  CandidateEmptyState,
  CandidateInlineAlert,
  CandidateLoadingState,
} from '../components';

type CandidateInterview = {
  id: string;
  scheduledAt: string;
  duration: number;
  location: string;
  interviewers: string[];
  panel?: Array<{ id: string; displayName: string; role: string }>;
  status: string;
  request: {
    position: string;
    department?: { name: string };
  };
};

const preparationItems: Array<{ label: string; done: boolean }> = [];

const iconPaths: Record<string, React.ReactNode> = {
  calendar: (
    <path d="M8 2v4m8-4v4M4 10h16M6 5h12a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2Z" />
  ),
  clock: <path d="M12 6v6l4 2m5-2a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />,
  video: (
    <path d="M15 10.5V7a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2v-3.5l6 4v-11l-6 4Z" />
  ),
  copy: <path d="M8 8h11v11H8zM5 16H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h11a1 1 0 0 1 1 1v1" />,
  check: <path d="M20 6 9 17l-5-5" />,
  circle: <circle cx="12" cy="12" r="8" />,
  warning: (
    <path d="M12 9v4m0 4h.01M10.3 3.9 2.8 17a2 2 0 0 0 1.7 3h15a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" />
  ),
  external: (
    <path d="M14 3h7v7M10 14 21 3M21 14v5a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5" />
  ),
  plus: <path d="M12 5v14m-7-7h14" />,
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

export const CandidateInterviewDetails: React.FC = () => {
  const { token } = useAuth();
  const [copied, setCopied] = useState(false);
  const [interview, setInterview] = useState<CandidateInterview | null>(null);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState('');
  const [actionError, setActionError] = useState('');

  useEffect(() => {
    const loadInterview = async () => {
      try {
        const profile = await apiRequest<{ interviews: CandidateInterview[] }>(
          '/candidate-profiles/me',
          token,
        );
        const requestedId = new URLSearchParams(window.location.search).get('id');
        const selected =
          profile.interviews.find((item) => item.id === requestedId) ??
          profile.interviews.find((item) => item.status === 'SCHEDULED') ??
          profile.interviews[0] ??
          null;
        setInterview(selected);
      } catch (loadError) {
        setApiError(loadError instanceof Error ? loadError.message : 'Unable to load interview');
      } finally {
        setLoading(false);
      }
    };

    void loadInterview();
  }, [token]);

  const handleCopy = async () => {
    if (!interview) return;
    await navigator.clipboard.writeText(interview.location).catch(() => undefined);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  };

  if (loading) {
    return (
      <CandidateDashboardPage className="max-w-[900px]">
        <CandidateLoadingState label="Loading interview..." />
      </CandidateDashboardPage>
    );
  }

  if (apiError) {
    return (
      <CandidateDashboardPage className="max-w-[900px]">
        <CandidateInlineAlert>{apiError}</CandidateInlineAlert>
      </CandidateDashboardPage>
    );
  }

  if (!interview) {
    return (
      <CandidateDashboardPage className="max-w-[900px]">
        <CandidateEmptyState title="No interview has been scheduled for your applications." />
      </CandidateDashboardPage>
    );
  }

  const startsAt = new Date(interview.scheduledAt);
  const endsAt = new Date(startsAt.getTime() + interview.duration * 60_000);
  const isMeetingLink = /^https?:\/\//i.test(interview.location);
  const panelMembers = (
    interview.panel?.length
      ? interview.panel
      : interview.interviewers.map((id) => ({
          id,
          displayName: 'Interviewer',
          role: 'Panel member',
        }))
  ).map((member, index) => ({
    name: member.displayName,
    role: member.role.replaceAll('_', ' '),
    initials:
      member.displayName
        .split(' ')
        .map((part) => part[0])
        .join('')
        .slice(0, 2)
        .toUpperCase() || `I${index + 1}`,
  }));

  return (
    <CandidateDashboardPage className="flex max-w-[900px] flex-col items-center">
      {actionError ? (
        <CandidateInlineAlert>{actionError}</CandidateInlineAlert>
      ) : null}
      <CandidateCard className="w-full overflow-hidden p-0 shadow-[0_4px_20px_-2px_rgba(0,0,0,0.05),0_2px_10px_-2px_rgba(0,0,0,0.03)]">
        <header className="bg-[linear-gradient(135deg,#0D9488_0%,#00685f_100%)] p-8 text-white">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div>
              <h1 className="mb-1 text-3xl font-semibold tracking-tight">
                {interview.request.position}
              </h1>
              <p className="text-lg text-white/90">
                {interview.request.department?.name ?? 'Department not available'}
              </p>
            </div>
            <span className="w-fit rounded-lg border border-white/30 bg-white/20 px-4 py-2 text-sm font-semibold shadow-[inset_0_1px_0_rgba(255,255,255,0.18)]">
              {interview.status}
            </span>
          </div>
        </header>

        <div className="space-y-8 p-8">
          <section className="grid grid-cols-1 gap-8 md:grid-cols-2">
            <div className="space-y-4">
              <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-ink">
                Date & Time
              </h2>
              <div className="flex items-start gap-3">
                <Icon className="mt-1 h-6 w-6 shrink-0 text-teal-command" name="calendar" />
                <div>
                  <p className="text-xl font-semibold text-deep-charcoal">
                    {startsAt.toLocaleDateString(undefined, {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </p>
                  <p className="mt-1 font-mono text-sm font-medium text-primary">
                    {startsAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} -{' '}
                    {endsAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                  <p className="mt-1 flex items-center gap-1 text-sm text-secondary">
                    <Icon className="h-4 w-4" name="clock" />
                    Duration: {interview.duration} minutes
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-ink">
                Location
              </h2>
              <div className="flex items-start gap-3">
                <Icon className="mt-1 h-6 w-6 shrink-0 text-teal-command" name="video" />
                <div className="w-full">
                  <a
                    className="flex items-center gap-1 text-sm font-semibold text-teal-command hover:underline"
                    href={isMeetingLink ? interview.location : undefined}
                    onClick={isMeetingLink ? undefined : (event) => event.preventDefault()}
                    rel="noreferrer"
                    target={isMeetingLink ? '_blank' : undefined}
                  >
                    {isMeetingLink ? 'Open Meeting Link' : 'Interview Location'}
                    <Icon className="h-4 w-4" name="external" />
                  </a>
                  <p className="mt-1 text-sm text-on-surface">{interview.location}</p>
                  <div className="mt-3 flex items-center justify-between gap-3 rounded-lg border border-border-warm bg-surface-container-low px-3 py-2">
                    <span className="font-mono text-xs text-slate-ink">{interview.location}</span>
                    <button
                      className={`inline-flex items-center gap-1 text-xs font-bold transition active:scale-[0.98] ${copied ? 'text-approved' : 'text-teal-command hover:text-primary'}`}
                      onClick={() => void handleCopy()}
                      type="button"
                    >
                      <Icon className="h-4 w-4" name={copied ? 'check' : 'copy'} />
                      {copied ? 'COPIED' : 'COPY'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-ink">
              Interview Panel
            </h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              {panelMembers.map((member) => (
                <article
                  className="flex flex-col items-center rounded-lg border border-border-warm bg-workflow-ivory p-4 text-center"
                  key={member.name}
                >
                  <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-white font-mono text-sm font-bold text-teal-command shadow-sm">
                    {member.initials}
                  </div>
                  <p className="text-sm font-semibold text-on-surface">{member.name}</p>
                  <p className="text-[11px] text-secondary">{member.role}</p>
                </article>
              ))}
            </div>
          </section>

          <section className="grid grid-cols-1 gap-8 border-t border-border-warm pt-4 md:grid-cols-2">
            <div className="space-y-4">
              <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-ink">
                Preparation
              </h2>
              <ul className="space-y-3">
                {preparationItems.map((item) => (
                  <li className="flex items-center gap-3 text-sm text-on-surface" key={item.label}>
                    <Icon
                      className={`h-5 w-5 ${item.done ? 'text-approved' : 'text-outline'}`}
                      name={item.done ? 'check' : 'circle'}
                    />
                    <span>{item.label}</span>
                  </li>
                ))}
              </ul>
              <div className="flex gap-3 rounded-lg border border-revision/20 bg-revision/10 p-4">
                <Icon className="h-5 w-5 shrink-0 text-revision" name="warning" />
                <p className="text-sm font-semibold leading-6 text-revision">
                  Important: Arrive 10 minutes early to ensure your technical setup is stable.
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-ink">
                Instructions
              </h2>
              <div className="space-y-3 text-sm leading-6 text-slate-ink">
                <p>
                  Review the job description and prepare examples that demonstrate your experience.
                  The interview panel may ask both role-specific and behavioral questions.
                </p>
                <p className="italic text-secondary">
                  Contact the recruitment team if you need to reschedule or have technical
                  difficulties before the session.
                </p>
              </div>
            </div>
          </section>

          <footer className="flex flex-col gap-4 border-t border-border-warm pt-8 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-col gap-3 sm:flex-row">
              <button
                className="rounded-lg bg-teal-command px-8 py-3 text-sm font-semibold text-white shadow-md transition hover:bg-primary active:scale-[0.98]"
                onClick={() =>
                  setActionError('Interview attendance confirmation API is not available')
                }
                type="button"
              >
                Confirm Attendance
              </button>
              <button
                className="rounded-lg border-2 border-teal-command px-6 py-3 text-sm font-semibold text-teal-command transition hover:bg-teal-command/5 active:scale-[0.98]"
                onClick={() => setActionError('Candidate reschedule request API is not available')}
                type="button"
              >
                Request Reschedule
              </button>
            </div>
            <div className="flex items-center gap-2">
              <span className="mr-2 text-xs text-secondary">Add to:</span>
              {['Google Calendar', 'Outlook Calendar'].map((label) => (
                <button
                  className="flex h-10 w-10 items-center justify-center rounded-lg border border-border-warm text-teal-command transition hover:bg-surface-container-low active:scale-[0.98]"
                  key={label}
                  title={label}
                  type="button"
                >
                  <Icon className="h-5 w-5" name="plus" />
                </button>
              ))}
            </div>
          </footer>
        </div>
      </CandidateCard>

      <p className="mt-6 text-center text-sm text-slate-ink/70">
        You will receive a confirmation email once you confirm your attendance.
      </p>
    </CandidateDashboardPage>
  );
};
