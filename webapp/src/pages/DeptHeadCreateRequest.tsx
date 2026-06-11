import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

type StepId = 'position' | 'justification' | 'staffing' | 'review';
type Urgency = 'Low' | 'Medium' | 'High' | 'Critical';

interface RequestForm {
  positionTitle: string;
  department: string;
  employmentType: string;
  workLocation: string;
  skills: string;
  justification: string;
  impact: string;
  headcount: number;
  urgency: Urgency;
  targetDate: string;
}

const steps: Array<{ id: StepId; label: string }> = [
  { id: 'position', label: 'Position Details' },
  { id: 'justification', label: 'Justification' },
  { id: 'staffing', label: 'Headcount & Urgency' },
  { id: 'review', label: 'Review' },
];

const initialForm: RequestForm = {
  positionTitle: '',
  department: 'Information Technology',
  employmentType: 'Full-time',
  workLocation: 'Ho Chi Minh City',
  skills: '',
  justification: '',
  impact: '',
  headcount: 1,
  urgency: 'Medium',
  targetDate: '',
};

const Icon = ({ name, className = 'h-5 w-5' }: { name: string; className?: string }) => {
  const paths: Record<string, React.ReactNode> = {
    arrowLeft: <path d="M19 12H5m6-6-6 6 6 6" />,
    arrowRight: <path d="M5 12h14m-6-6 6 6-6 6" />,
    check: <path d="m8 12 3 3 5-6M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />,
    save: (
      <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2ZM7 3v6h8M7 21v-8h10v8" />
    ),
    send: <path d="m22 2-7 20-4-9-9-4 20-7Z" />,
  };

  return (
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
      {paths[name]}
    </svg>
  );
};

const inputClass =
  'h-11 rounded-lg border border-border-warm bg-clean-surface px-3 text-sm text-deep-charcoal outline-none transition focus:border-teal-command focus:ring-2 focus:ring-teal-command/20';
const textareaClass =
  'min-h-32 rounded-lg border border-border-warm bg-clean-surface px-3 py-3 text-sm leading-6 text-deep-charcoal outline-none transition focus:border-teal-command focus:ring-2 focus:ring-teal-command/20';

const Field = ({
  label,
  error,
  helper,
  children,
}: {
  label: string;
  error?: string;
  helper?: string;
  children: React.ReactNode;
}) => (
  <label className="flex flex-col gap-2">
    <span className="text-sm font-semibold text-deep-charcoal">{label}</span>
    {children}
    {error ? (
      <span className="text-xs font-semibold text-rejected">{error}</span>
    ) : helper ? (
      <span className="text-xs text-slate-ink">{helper}</span>
    ) : null}
  </label>
);

export const DeptHeadCreateRequest: React.FC = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState<RequestForm>(initialForm);
  const [step, setStep] = useState<StepId>('position');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [result, setResult] = useState<'idle' | 'draft' | 'submitted'>('idle');

  const stepIndex = steps.findIndex((item) => item.id === step);
  const progress = useMemo(() => Math.round(((stepIndex + 1) / steps.length) * 100), [stepIndex]);

  const update = <K extends keyof RequestForm>(field: K, value: RequestForm[K]) => {
    setForm((current) => ({ ...current, [field]: value }));
    setErrors((current) => {
      const next = { ...current };
      delete next[field];
      return next;
    });
    setResult('idle');
  };

  const validate = (targetStep: StepId) => {
    const nextErrors: Record<string, string> = {};

    if (targetStep === 'position') {
      if (!form.positionTitle.trim()) nextErrors.positionTitle = 'Position title is required.';
      if (!form.skills.trim()) nextErrors.skills = 'Add core skills or requirements.';
    }

    if (targetStep === 'justification') {
      if (form.justification.trim().length < 30)
        nextErrors.justification = 'Add a clearer hiring reason.';
      if (form.impact.trim().length < 25) nextErrors.impact = 'Describe the business impact.';
    }

    if (targetStep === 'staffing') {
      if (form.headcount < 1) nextErrors.headcount = 'Headcount must be at least 1.';
      if (!form.targetDate) nextErrors.targetDate = 'Target start date is required.';
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const nextStep = () => {
    if (!validate(step)) return;
    setStep(steps[Math.min(stepIndex + 1, steps.length - 1)].id);
  };

  const previousStep = () => {
    setErrors({});
    setStep(steps[Math.max(stepIndex - 1, 0)].id);
  };

  const saveDraft = () => {
    if (!form.positionTitle.trim()) {
      setStep('position');
      setErrors({ positionTitle: 'Position title is required before saving a draft.' });
      return;
    }

    setResult('draft');
  };

  const submit = () => {
    for (const item of steps) {
      if (item.id !== 'review' && !validate(item.id)) {
        setStep(item.id);
        return;
      }
    }

    setErrors({});
    setResult('submitted');
  };

  return (
    <div className="mx-auto flex max-w-[1440px] flex-col gap-6">
      <header className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-end">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-teal-command">
            Department Head Workspace
          </p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-deep-charcoal">
            Create Recruitment Request
          </h1>
          <p className="mt-1 max-w-[66ch] text-sm leading-6 text-slate-ink">
            Build a staffing request with role details, justification, headcount, and urgency before
            saving or submitting.
          </p>
        </div>
        <button
          className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-border-warm bg-clean-surface px-4 text-sm font-semibold text-slate-ink transition hover:border-teal-command hover:text-teal-command active:scale-[0.98]"
          onClick={() => navigate('/dept-head')}
          type="button"
        >
          <Icon className="h-4 w-4" name="arrowLeft" />
          Back to Dashboard
        </button>
      </header>

      <section className="grid gap-6 xl:grid-cols-[280px_1fr_320px]">
        <aside className="rounded-xl border border-border-warm bg-clean-surface p-5 shadow-[0_18px_50px_-44px_rgba(28,25,23,0.55)]">
          <div className="mb-5">
            <div className="mb-2 flex items-center justify-between text-xs font-semibold text-slate-ink">
              <span>Progress</span>
              <span className="font-mono">{progress}%</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-surface-container">
              <div
                className="h-full rounded-full bg-teal-command transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          <nav className="space-y-2" aria-label="Create request steps">
            {steps.map((item, index) => {
              const active = item.id === step;
              const done = index < stepIndex;
              return (
                <button
                  className={`flex w-full items-center gap-3 rounded-lg border px-3 py-3 text-left transition active:scale-[0.98] ${
                    active
                      ? 'border-teal-command bg-teal-command text-white'
                      : done
                        ? 'border-green-200 bg-green-50 text-approved'
                        : 'border-border-warm bg-clean-surface text-slate-ink hover:border-teal-command hover:text-teal-command'
                  }`}
                  key={item.id}
                  onClick={() => {
                    if (index <= stepIndex || validate(step)) setStep(item.id);
                  }}
                  type="button"
                >
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-current/30 font-mono text-xs">
                    {done ? <Icon className="h-4 w-4" name="check" /> : index + 1}
                  </span>
                  <span className="text-sm font-semibold">{item.label}</span>
                </button>
              );
            })}
          </nav>
        </aside>

        <main className="rounded-xl border border-border-warm bg-clean-surface p-6 shadow-[0_18px_50px_-44px_rgba(28,25,23,0.55)]">
          {result !== 'idle' && (
            <div
              className={`mb-5 rounded-lg border p-4 text-sm font-semibold ${result === 'submitted' ? 'border-green-200 bg-green-50 text-approved' : 'border-cyan-200 bg-cyan-50 text-pending'}`}
            >
              {result === 'submitted'
                ? 'Request submitted for approval.'
                : 'Draft saved for this session.'}
            </div>
          )}

          {step === 'position' && (
            <div className="space-y-5">
              <div>
                <h2 className="text-xl font-semibold text-deep-charcoal">Position Details</h2>
                <p className="mt-1 text-sm text-slate-ink">Define the role HR will recruit for.</p>
              </div>
              <div className="grid gap-5 md:grid-cols-2">
                <Field error={errors.positionTitle} label="Position title">
                  <input
                    className={inputClass}
                    onChange={(event) => update('positionTitle', event.target.value)}
                    placeholder="Senior Backend Engineer"
                    value={form.positionTitle}
                  />
                </Field>
                <Field label="Department">
                  <input
                    className={inputClass}
                    onChange={(event) => update('department', event.target.value)}
                    value={form.department}
                  />
                </Field>
                <Field label="Employment type">
                  <select
                    className={inputClass}
                    onChange={(event) => update('employmentType', event.target.value)}
                    value={form.employmentType}
                  >
                    <option>Full-time</option>
                    <option>Part-time</option>
                    <option>Contract</option>
                    <option>Internship</option>
                  </select>
                </Field>
                <Field label="Work location">
                  <input
                    className={inputClass}
                    onChange={(event) => update('workLocation', event.target.value)}
                    value={form.workLocation}
                  />
                </Field>
              </div>
              <Field
                error={errors.skills}
                helper="Example: Java, Spring Boot, PostgreSQL, system design."
                label="Core skills"
              >
                <textarea
                  className={textareaClass}
                  onChange={(event) => update('skills', event.target.value)}
                  placeholder="List required skills, tools, and seniority expectations."
                  value={form.skills}
                />
              </Field>
            </div>
          )}

          {step === 'justification' && (
            <div className="space-y-5">
              <div>
                <h2 className="text-xl font-semibold text-deep-charcoal">Justification</h2>
                <p className="mt-1 text-sm text-slate-ink">
                  Explain why this request should be approved.
                </p>
              </div>
              <Field error={errors.justification} label="Hiring justification">
                <textarea
                  className={textareaClass}
                  onChange={(event) => update('justification', event.target.value)}
                  placeholder="Explain workload, replacement, project need, or capability gap."
                  value={form.justification}
                />
              </Field>
              <Field error={errors.impact} label="Business impact">
                <textarea
                  className={textareaClass}
                  onChange={(event) => update('impact', event.target.value)}
                  placeholder="Describe what is delayed or at risk without this hire."
                  value={form.impact}
                />
              </Field>
            </div>
          )}

          {step === 'staffing' && (
            <div className="space-y-5">
              <div>
                <h2 className="text-xl font-semibold text-deep-charcoal">Headcount and Urgency</h2>
                <p className="mt-1 text-sm text-slate-ink">
                  Set how many hires are needed and how fast the workflow should move.
                </p>
              </div>
              <div className="grid gap-5 md:grid-cols-2">
                <Field error={errors.headcount} label="Headcount">
                  <input
                    className={inputClass}
                    min={1}
                    onChange={(event) => update('headcount', Number(event.target.value))}
                    type="number"
                    value={form.headcount}
                  />
                </Field>
                <Field label="Urgency">
                  <select
                    className={inputClass}
                    onChange={(event) => update('urgency', event.target.value as Urgency)}
                    value={form.urgency}
                  >
                    <option>Low</option>
                    <option>Medium</option>
                    <option>High</option>
                    <option>Critical</option>
                  </select>
                </Field>
                <Field error={errors.targetDate} label="Target start date">
                  <input
                    className={inputClass}
                    onChange={(event) => update('targetDate', event.target.value)}
                    type="date"
                    value={form.targetDate}
                  />
                </Field>
              </div>
            </div>
          )}

          {step === 'review' && (
            <div className="space-y-5">
              <div>
                <h2 className="text-xl font-semibold text-deep-charcoal">Review Request</h2>
                <p className="mt-1 text-sm text-slate-ink">
                  Confirm the draft before saving or submitting.
                </p>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                {[
                  ['Position', form.positionTitle || 'Not set'],
                  ['Department', form.department],
                  ['Employment', form.employmentType],
                  ['Location', form.workLocation],
                  ['Headcount', String(form.headcount)],
                  ['Urgency', form.urgency],
                  ['Target date', form.targetDate || 'Not set'],
                ].map(([label, value]) => (
                  <div
                    className="rounded-lg border border-border-warm bg-workflow-ivory/60 p-4"
                    key={label}
                  >
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-on-surface-variant">
                      {label}
                    </p>
                    <p className="mt-2 text-sm font-semibold text-deep-charcoal">{value}</p>
                  </div>
                ))}
              </div>
              <div className="rounded-lg border border-border-warm bg-workflow-ivory/60 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-on-surface-variant">
                  Justification
                </p>
                <p className="mt-2 text-sm leading-6 text-deep-charcoal">
                  {form.justification || 'Not set'}
                </p>
              </div>
            </div>
          )}

          <div className="mt-8 flex flex-col gap-3 border-t border-border-warm pt-5 sm:flex-row sm:items-center sm:justify-between">
            <button
              className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-border-warm bg-clean-surface px-4 text-sm font-semibold text-slate-ink transition hover:border-teal-command hover:text-teal-command active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40"
              disabled={stepIndex === 0}
              onClick={previousStep}
              type="button"
            >
              <Icon className="h-4 w-4" name="arrowLeft" />
              Back
            </button>
            <div className="flex flex-col gap-3 sm:flex-row">
              <button
                className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-border-warm bg-clean-surface px-4 text-sm font-semibold text-slate-ink transition hover:border-pending hover:text-pending active:scale-[0.98]"
                onClick={saveDraft}
                type="button"
              >
                <Icon className="h-4 w-4" name="save" />
                Save Draft
              </button>
              {step === 'review' ? (
                <button
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-teal-command px-4 text-sm font-semibold text-white transition hover:bg-primary active:scale-[0.98]"
                  onClick={submit}
                  type="button"
                >
                  <Icon className="h-4 w-4" name="send" />
                  Submit
                </button>
              ) : (
                <button
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-teal-command px-4 text-sm font-semibold text-white transition hover:bg-primary active:scale-[0.98]"
                  onClick={nextStep}
                  type="button"
                >
                  Continue
                  <Icon className="h-4 w-4" name="arrowRight" />
                </button>
              )}
            </div>
          </div>
        </main>

        <aside className="rounded-xl border border-border-warm bg-clean-surface p-6 shadow-[0_18px_50px_-44px_rgba(28,25,23,0.55)]">
          <h2 className="text-lg font-semibold text-deep-charcoal">Draft Readiness</h2>
          <div className="mt-5 space-y-4">
            {[
              { label: 'Position details', ready: Boolean(form.positionTitle && form.skills) },
              { label: 'Justification', ready: Boolean(form.justification && form.impact) },
              { label: 'Staffing plan', ready: Boolean(form.headcount && form.targetDate) },
            ].map((item) => (
              <div className="flex items-center justify-between gap-3" key={item.label}>
                <span className="text-sm text-slate-ink">{item.label}</span>
                <span
                  className={`rounded-full px-2.5 py-1 text-xs font-semibold ${item.ready ? 'bg-green-50 text-approved' : 'bg-stone-100 text-draft'}`}
                >
                  {item.ready ? 'Ready' : 'Missing'}
                </span>
              </div>
            ))}
          </div>
        </aside>
      </section>
    </div>
  );
};
