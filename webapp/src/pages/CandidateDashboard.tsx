import React from 'react';

type ApplicationStatus = 'Interview Phase' | 'Under Review' | 'Offer Extended' | 'Not Selected';
type Step = 'Applied' | 'CV Review' | 'Interview' | 'Final Decision';

type Application = {
  id: string;
  title: string;
  department: string;
  appliedDate: string;
  status: ApplicationStatus;
  currentStep: Step;
  completedSteps: Step[];
  event?: string;
  action: string;
  disabled?: boolean;
};

const steps: Step[] = ['Applied', 'CV Review', 'Interview', 'Final Decision'];

const applications: Application[] = [
  {
    id: 'APP-2401',
    title: 'Senior Frontend Developer',
    department: 'Phong Ky Thuat',
    appliedDate: '15/05/2026',
    status: 'Interview Phase',
    currentStep: 'Interview',
    completedSteps: ['Applied', 'CV Review'],
    event: 'Interview Scheduled - 30/05/2026, 14:00',
    action: 'View Details',
  },
  {
    id: 'APP-2402',
    title: 'Marketing Specialist',
    department: 'Marketing Department',
    appliedDate: '20/05/2026',
    status: 'Under Review',
    currentStep: 'CV Review',
    completedSteps: ['Applied'],
    action: 'View Details',
  },
  {
    id: 'APP-2398',
    title: 'Junior Developer',
    department: 'Phong Ky Thuat',
    appliedDate: '10/04/2026',
    status: 'Offer Extended',
    currentStep: 'Final Decision',
    completedSteps: ['Applied', 'CV Review', 'Interview', 'Final Decision'],
    action: 'Accept Offer',
  },
  {
    id: 'APP-2388',
    title: 'Data Analyst',
    department: 'Data Intelligence',
    appliedDate: '01/04/2026',
    status: 'Not Selected',
    currentStep: 'Applied',
    completedSteps: [],
    action: 'View Feedback',
    disabled: true,
  },
];

const statusClass: Record<ApplicationStatus, string> = {
  'Interview Phase': 'bg-pending/10 text-pending',
  'Under Review': 'bg-secondary/10 text-secondary',
  'Offer Extended': 'bg-approved/10 text-approved',
  'Not Selected': 'bg-rejected/10 text-rejected',
};

const iconPaths: Record<string, React.ReactNode> = {
  check: <path d="M20 6 9 17l-5-5" />,
  arrow: <path d="M5 12h14m-6-6 6 6-6 6" />,
  calendar: <path d="M8 2v4m8-4v4M4 10h16M6 5h12a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2Z" />,
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
    return <div className="h-6 w-6 animate-pulse rounded-full bg-teal-command shadow-[0_0_0_6px_rgba(13,148,136,0.12)]" />;
  }

  return <div className="h-6 w-6 rounded-full border-2 border-surface-variant bg-workflow-ivory" />;
};

export const CandidateDashboard: React.FC = () => {
  return (
    <div className="mx-auto max-w-[1440px]">
      <header className="mb-10">
        <h1 className="mb-2 text-3xl font-semibold tracking-tight text-deep-charcoal">Candidate Application Tracking Dashboard</h1>
        <p className="text-base text-secondary">Track your application progress and view upcoming interviews.</p>
      </header>

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
                  <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${statusClass[application.status]}`}>
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
                    const lineActive = index < steps.length - 1 && application.completedSteps.includes(step);
                    const labelActive = application.currentStep === step || application.completedSteps.includes(step);
                    return (
                      <React.Fragment key={step}>
                        <div className="flex min-w-[76px] flex-col items-center text-center">
                          <StepMarker application={application} step={step} />
                          <span className={`mt-2 text-xs font-semibold ${labelActive ? 'text-teal-command' : 'text-secondary'}`}>{step}</span>
                        </div>
                        {index < steps.length - 1 ? (
                          <div className={`mx-2 mt-3 h-0.5 min-w-10 flex-1 rounded-full ${lineActive ? 'bg-approved' : 'bg-surface-variant'}`} />
                        ) : null}
                      </React.Fragment>
                    );
                  })}
                </div>
              </div>

              <div className="flex w-full flex-col items-end gap-4 lg:w-72">
                {application.event ? (
                  <section className="w-full rounded-lg border border-teal-command/20 bg-surface-container-low p-4">
                    <p className="mb-1 text-xs font-semibold uppercase tracking-[0.12em] text-teal-command">UPCOMING EVENT</p>
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
        <button className="inline-flex items-center gap-2 text-sm font-semibold text-teal-command transition hover:underline active:scale-[0.98]" type="button">
          Browse Open Positions
          <Icon className="h-4 w-4" name="arrow" />
        </button>
      </div>
    </div>
  );
};
