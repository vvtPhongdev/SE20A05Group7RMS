import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { ApiError, apiRequest } from '../../../lib/api';
import {
  DeptHeadDashboardPage,
  DeptHeadInlineAlert,
  DeptHeadLoadingState,
  DeptHeadPageHeader,
  DeptHeadSearchInput,
} from '../components';

type Priority = 'Low' | 'Medium' | 'High' | 'Critical';

interface FormState {
  positionTitle: string;
  department: string;
  jobLevel: string;
  employmentType: 'Full-time' | 'Contract';
  headcount: number;
  skillInput: string;
  experience: string;
  education: string;
  description: string;
  notes: string;
  salaryMin: string;
  salaryMax: string;
  startDate: string;
  priority: Priority;
}

interface RecruitmentRequestApi {
  id: string;
  position: string;
  headcount: number;
  jobDescription: string;
  justification: string;
  urgency: string;
  status: string;
  rejectionReason?: string | null;
  department?: { name: string } | null;
  skillRequirements?: Record<string, unknown> | null;
}

type IconName = 'close' | 'send' | 'search' | 'help' | 'x' | 'check' | 'plus';

const initialForm: FormState = {
  positionTitle: '',
  department: 'Engineering Department',
  jobLevel: 'Senior',
  employmentType: 'Full-time',
  headcount: 1,
  skillInput: '',
  experience: '3-5 years',
  education: '',
  description: '',
  notes: '',
  salaryMin: '',
  salaryMax: '',
  startDate: '',
  priority: 'Medium',
};

const Icon = ({ name, className = 'h-5 w-5' }: { name: IconName; className?: string }) => {
  const paths: Record<IconName, React.ReactNode> = {
    close: <path d="M18 6 6 18M6 6l12 12" />,
    send: <path d="m22 2-7 20-4-9-9-4 20-7Z" />,
    search: <path d="m21 21-4.35-4.35M10.5 18a7.5 7.5 0 1 1 0-15 7.5 7.5 0 0 1 0 15Z" />,
    help: <path d="M9.1 9a3 3 0 1 1 5.8 1c-.7 1.5-2.4 1.7-2.8 3m-.1 4h.01M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />,
    x: <path d="M18 6 6 18M6 6l12 12" />,
    check: <path d="m5 12 4 4L19 6" />,
    plus: <path d="M12 5v14M5 12h14" />,
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

const fieldClass =
  'w-full rounded-lg border border-border-warm bg-workflow-ivory px-4 py-2.5 text-sm text-on-surface outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20';
const readonlyClass =
  'w-full cursor-not-allowed rounded-lg border border-border-warm bg-surface-container-low px-4 py-2.5 text-sm text-on-surface-variant outline-none';
const textareaClass =
  'w-full resize-none rounded-lg border border-border-warm bg-workflow-ivory px-4 py-3 text-sm leading-6 text-on-surface outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20';

const Field = ({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) => (
  <label className="block">
    <span className="mb-2 block text-sm font-semibold text-on-surface">
      {label}
      {required && <span className="text-rejected"> *</span>}
    </span>
    {children}
  </label>
);

const Section = ({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) => (
  <section className="rounded-xl border border-border-warm bg-clean-surface p-6 shadow-sm md:p-8">
    <div className="mb-6 flex items-center gap-2">
      <div className="h-6 w-1 rounded-full bg-teal-command" />
      <h2 className="text-xl font-semibold text-deep-charcoal">{title}</h2>
    </div>
    {children}
  </section>
);

export const DeptHeadCreateRequest: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { token } = useAuth();
  const requestId = searchParams.get('requestId');
  const [form, setForm] = useState<FormState>(initialForm);
  const [skills, setSkills] = useState(['React', 'TypeScript', 'Node.js']);
  const [notice, setNotice] = useState<string | null>(null);
  const [noticeIsError, setNoticeIsError] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [loadingRequest, setLoadingRequest] = useState(false);
  const [rejectionReason, setRejectionReason] = useState<string | null>(null);
  const [requestStatus, setRequestStatus] = useState<string | null>(null);

  useEffect(() => {
    if (!requestId) return;

    let cancelled = false;
    const loadRequest = async () => {
      setLoadingRequest(true);
      setNotice(null);
      try {
        const request = await apiRequest<RecruitmentRequestApi>(
          `/recruitment-requests/${requestId}`,
          token,
        );
        if (cancelled) return;

        setRequestStatus(request.status);
        setRejectionReason(request.rejectionReason ?? null);

        const requirements = request.skillRequirements ?? {};
        const loadedSkills = Array.isArray(requirements.skills)
          ? requirements.skills.map(String)
          : [];
        const priorityValue = request.urgency.toLowerCase();
        const priority =
          priorityValue === 'low' ||
          priorityValue === 'high' ||
          priorityValue === 'critical'
            ? ((priorityValue[0]?.toUpperCase() + priorityValue.slice(1)) as Priority)
            : 'Medium';
        const employmentType =
          requirements.employmentType === 'Contract' ? 'Contract' : 'Full-time';

        setForm({
          positionTitle: request.position,
          department: request.department?.name ?? initialForm.department,
          jobLevel: String(requirements.jobLevel ?? initialForm.jobLevel),
          employmentType,
          headcount: request.headcount,
          skillInput: '',
          experience: String(requirements.experience ?? initialForm.experience),
          education: String(requirements.education ?? ''),
          description: request.jobDescription,
          notes: request.justification,
          salaryMin: String(requirements.salaryMin ?? ''),
          salaryMax: String(requirements.salaryMax ?? ''),
          startDate: String(requirements.startDate ?? ''),
          priority,
        });
        setSkills(loadedSkills);
      } catch (loadError) {
        if (cancelled) return;
        setNoticeIsError(true);
        setNotice(
          loadError instanceof ApiError ? loadError.message : 'Unable to load recruitment request.',
        );
      } finally {
        if (!cancelled) setLoadingRequest(false);
      }
    };

    void loadRequest();
    return () => {
      cancelled = true;
    };
  }, [requestId, token]);

  const readiness = useMemo(() => {
    const complete = [
      Boolean(form.positionTitle.trim()),
      skills.length > 0,
      Boolean(form.description.trim()),
      Boolean(form.startDate),
      form.headcount > 0,
    ].filter(Boolean).length;

    return Math.round((complete / 5) * 100);
  }, [form.description, form.headcount, form.positionTitle, form.startDate, skills.length]);

  const update = <K extends keyof FormState>(field: K, value: FormState[K]) => {
    setForm((current) => ({ ...current, [field]: value }));
    setErrors((current) => {
      const next = { ...current };
      delete next[field];
      return next;
    });
    setNotice(null);
    setNoticeIsError(false);
  };

  const addSkill = () => {
    const value = form.skillInput.trim();
    if (!value || skills.includes(value)) return;
    setSkills((current) => [...current, value]);
    update('skillInput', '');
  };

  const removeSkill = (skill: string) => {
    setSkills((current) => current.filter((item) => item !== skill));
  };

  const validate = () => {
    const nextErrors: Record<string, string> = {};
    if (!form.positionTitle.trim()) nextErrors.positionTitle = 'Position title is required.';
    if (!form.description.trim()) nextErrors.description = 'Job description is required.';
    if (skills.length === 0) nextErrors.skills = 'Add at least one required skill.';
    if (!form.startDate) nextErrors.startDate = 'Expected start date is required.';
    if (form.headcount < 1) nextErrors.headcount = 'Number of positions must be at least 1.';
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const buildPayload = (submitForReview: boolean) => ({
    positionTitle: form.positionTitle,
    headcount: form.headcount,
    jobDescription: form.description,
    justification: form.notes || form.description,
    urgency: form.priority.toUpperCase(),
    skillRequirements: {
      skills,
      jobLevel: form.jobLevel,
      employmentType: form.employmentType,
      experience: form.experience,
      education: form.education,
      salaryMin: form.salaryMin,
      salaryMax: form.salaryMax,
      startDate: form.startDate,
    },
    submit: submitForReview,
  });

  const updateExistingRequest = async () => {
    if (!requestId) return;
    const { submit: _submit, ...payload } = buildPayload(false);
    await apiRequest(`/recruitment-requests/${requestId}`, token, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
  };

  const saveDraft = async () => {
    if (!form.positionTitle.trim()) {
      setErrors({ positionTitle: 'Position title is required before saving a draft.' });
      setNotice(null);
      setNoticeIsError(false);
      return;
    }

    setErrors({});
    setSubmitting(true);
    try {
      if (requestId) {
        await updateExistingRequest();
      } else {
        const created = await apiRequest<RecruitmentRequestApi>('/recruitment-requests', token, {
          method: 'POST',
          body: JSON.stringify(buildPayload(false)),
        });
        navigate(`/dept-head/create-request?requestId=${created.id}`, { replace: true });
      }
      setNoticeIsError(false);
      setNotice('Draft saved for this recruitment request.');
    } catch (saveError) {
      setNoticeIsError(true);
      setNotice(saveError instanceof ApiError ? saveError.message : 'Unable to save draft.');
    } finally {
      setSubmitting(false);
    }
  };

  const submit = async () => {
    if (!validate()) {
      setNotice(null);
      setNoticeIsError(false);
      return;
    }

    setSubmitting(true);
    try {
      if (requestId) {
        await updateExistingRequest();
        await apiRequest(`/recruitment-requests/${requestId}/submit`, token, {
          method: 'PATCH',
        });
      } else {
        await apiRequest('/recruitment-requests', token, {
          method: 'POST',
          body: JSON.stringify(buildPayload(true)),
        });
      }
      setNoticeIsError(false);
      setNotice('Recruitment request submitted for approval.');
      navigate('/dept-head/requests');
    } catch (submitError) {
      setNoticeIsError(true);
      setNotice(submitError instanceof ApiError ? submitError.message : 'Unable to submit request.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <DeptHeadDashboardPage className="max-w-[1000px] pb-28">
      <DeptHeadPageHeader
        title={requestId ? 'Edit Recruitment Request' : 'Create Recruitment Request'}
        actions={
          <>
          <DeptHeadSearchInput
            className="hidden sm:block sm:w-64"
            label="Search resources"
            onChange={() => undefined}
            placeholder="Search resources..."
            value=""
          />
          <button
            aria-label="Help"
            className="rounded-lg p-2 text-on-surface-variant transition hover:bg-surface-container hover:text-teal-command"
            type="button"
          >
            <Icon name="help" />
          </button>
          </>
        }
      />

      {notice && (
        <DeptHeadInlineAlert tone={noticeIsError ? 'rejected' : 'teal'}>{notice}</DeptHeadInlineAlert>
      )}

      {loadingRequest && <DeptHeadLoadingState label="Loading recruitment request..." />}

      {requestStatus === 'REVISION_NEEDED' && rejectionReason && (
        <div className="mb-6 rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm text-amber-800 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-amber-900 mb-1">
            Reviewer Instructions / Feedback
          </p>
          <p className="font-semibold leading-relaxed">{rejectionReason}</p>
        </div>
      )}

      <div className="space-y-8">
        <Section title="Position Details">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div className="md:col-span-2">
              <Field label="Position Title" required>
                <input
                  className={fieldClass}
                  onChange={(event) => update('positionTitle', event.target.value)}
                  placeholder="e.g. Senior Frontend Engineer"
                  type="text"
                  value={form.positionTitle}
                />
                {errors.positionTitle && (
                  <p className="mt-2 text-xs font-semibold text-rejected">{errors.positionTitle}</p>
                )}
              </Field>
            </div>

            <Field label="Department">
              <input className={readonlyClass} readOnly type="text" value={form.department} />
            </Field>

            <Field label="Job Level">
              <select
                className={fieldClass}
                onChange={(event) => update('jobLevel', event.target.value)}
                value={form.jobLevel}
              >
                <option>Junior</option>
                <option>Mid</option>
                <option>Senior</option>
                <option>Lead</option>
              </select>
            </Field>

            <Field label="Employment Type">
              <div className="flex h-11 items-center gap-4">
                {(['Full-time', 'Contract'] as const).map((type) => (
                  <label className="flex cursor-pointer items-center gap-2 text-sm" key={type}>
                    <input
                      checked={form.employmentType === type}
                      className="h-4 w-4 border-border-warm text-primary focus:ring-primary"
                      name="employment_type"
                      onChange={() => update('employmentType', type)}
                      type="radio"
                    />
                    <span>{type}</span>
                  </label>
                ))}
              </div>
            </Field>

            <Field label="Number of Positions">
              <input
                className={fieldClass}
                min={1}
                onChange={(event) => update('headcount', Number(event.target.value))}
                type="number"
                value={form.headcount}
              />
              {errors.headcount && (
                <p className="mt-2 text-xs font-semibold text-rejected">{errors.headcount}</p>
              )}
            </Field>
          </div>
        </Section>

        <Section title="Requirements">
          <div className="space-y-6">
            <div>
              <Field label="Required Skills">
                <div className="flex min-h-[46px] flex-wrap gap-2 rounded-lg border border-border-warm bg-workflow-ivory p-2">
                  {skills.map((skill) => (
                    <span
                      className="inline-flex items-center rounded-full bg-secondary-container px-3 py-1 text-xs font-semibold text-on-secondary-container"
                      key={skill}
                    >
                      {skill}
                      <button
                        aria-label={`Remove ${skill}`}
                        className="ml-2 rounded-full p-0.5 transition hover:text-rejected"
                        onClick={() => removeSkill(skill)}
                        type="button"
                      >
                        <Icon className="h-3.5 w-3.5" name="x" />
                      </button>
                    </span>
                  ))}
                  <input
                    className="min-w-[120px] flex-1 border-none bg-transparent px-2 text-sm outline-none focus:ring-0"
                    onChange={(event) => update('skillInput', event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter') {
                        event.preventDefault();
                        addSkill();
                      }
                    }}
                    placeholder="Add more..."
                    type="text"
                    value={form.skillInput}
                  />
                  <button
                    className="inline-flex items-center gap-1 rounded-lg border border-border-warm bg-clean-surface px-2.5 text-xs font-semibold text-teal-command transition hover:border-teal-command"
                    onClick={addSkill}
                    type="button"
                  >
                    <Icon className="h-3.5 w-3.5" name="plus" />
                    Add
                  </button>
                </div>
                {errors.skills && (
                  <p className="mt-2 text-xs font-semibold text-rejected">{errors.skills}</p>
                )}
              </Field>
            </div>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <Field label="Experience (Years)">
                <select
                  className={fieldClass}
                  onChange={(event) => update('experience', event.target.value)}
                  value={form.experience}
                >
                  <option>1-3 years</option>
                  <option>3-5 years</option>
                  <option>5+ years</option>
                </select>
              </Field>

              <Field label="Education">
                <input
                  className={fieldClass}
                  onChange={(event) => update('education', event.target.value)}
                  placeholder="e.g. Bachelor's in CS"
                  type="text"
                  value={form.education}
                />
              </Field>
            </div>

            <Field label="Job Description">
              <textarea
                className={textareaClass}
                onChange={(event) => update('description', event.target.value)}
                placeholder="Outline primary responsibilities and daily tasks..."
                rows={4}
                value={form.description}
              />
              {errors.description && (
                <p className="mt-2 text-xs font-semibold text-rejected">{errors.description}</p>
              )}
            </Field>

            <Field label="Additional Notes">
              <textarea
                className={textareaClass}
                onChange={(event) => update('notes', event.target.value)}
                placeholder="Any specific requirements or preferences..."
                rows={2}
                value={form.notes}
              />
            </Field>
          </div>
        </Section>

        <Section title="Budget & Timeline">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div className="md:col-span-2">
              <Field label="Salary Range (VND)">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                  <div className="relative flex-1">
                    <input
                      className={`${fieldClass} pr-12`}
                      onChange={(event) => update('salaryMin', event.target.value)}
                      placeholder="Min"
                      type="text"
                      value={form.salaryMin}
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-outline-variant">
                      Min
                    </span>
                  </div>
                  <span className="hidden text-outline-variant sm:inline">-</span>
                  <div className="relative flex-1">
                    <input
                      className={`${fieldClass} pr-12`}
                      onChange={(event) => update('salaryMax', event.target.value)}
                      placeholder="Max"
                      type="text"
                      value={form.salaryMax}
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-outline-variant">
                      Max
                    </span>
                  </div>
                </div>
              </Field>
            </div>

            <Field label="Expected Start Date">
              <input
                className={fieldClass}
                onChange={(event) => update('startDate', event.target.value)}
                type="date"
                value={form.startDate}
              />
              {errors.startDate && (
                <p className="mt-2 text-xs font-semibold text-rejected">{errors.startDate}</p>
              )}
            </Field>

            <Field label="Priority">
              <div className="flex flex-wrap gap-3">
                {(['Low', 'Medium', 'High', 'Critical'] as Priority[]).map((priority) => {
                  const checked = form.priority === priority;
                  const checkedClass =
                    priority === 'Critical'
                      ? 'bg-rejected text-white border-rejected'
                      : priority === 'High'
                        ? 'bg-revision text-white border-revision'
                        : priority === 'Medium'
                          ? 'bg-primary-container text-white border-primary-container'
                          : 'bg-secondary-container text-on-secondary-container border-secondary';

                  return (
                    <button
                      className={`rounded-lg border px-4 py-2 text-xs font-semibold transition hover:bg-surface-container-low ${
                        checked ? checkedClass : 'border-border-warm bg-clean-surface text-on-surface'
                      }`}
                      key={priority}
                      onClick={() => update('priority', priority)}
                      type="button"
                    >
                      {priority}
                    </button>
                  );
                })}
              </div>
            </Field>
          </div>
        </Section>
      </div>

      <footer className="fixed bottom-0 left-[260px] right-0 z-30 flex min-h-20 flex-col gap-3 border-t border-border-warm bg-clean-surface px-6 py-4 shadow-[0_-4px_12px_rgba(0,0,0,0.03)] md:flex-row md:items-center md:justify-between">
        <button
          className="inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold text-on-surface-variant transition hover:text-rejected active:scale-[0.98]"
          onClick={() => navigate('/dept-head')}
          type="button"
        >
          <Icon className="h-4 w-4" name="close" />
          Cancel
        </button>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="mr-0 flex items-center gap-3 text-xs text-slate-ink sm:mr-2">
            <span className="font-semibold">Readiness</span>
            <div className="h-1.5 w-24 overflow-hidden rounded-full bg-surface-container">
              <div className="h-full rounded-full bg-teal-command" style={{ width: `${readiness}%` }} />
            </div>
            <span className="font-mono">{readiness}%</span>
          </div>
          <button
            className="rounded-lg border border-teal-command px-6 py-2.5 text-sm font-semibold text-teal-command transition hover:bg-surface-container-low active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
            disabled={submitting}
            onClick={saveDraft}
            type="button"
          >
            Save as Draft
          </button>
          <button
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-teal-command px-8 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-primary active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
            disabled={submitting}
            onClick={submit}
            type="button"
          >
            Submit for Approval
            <Icon className="h-4 w-4" name="send" />
          </button>
        </div>
      </footer>
    </DeptHeadDashboardPage>
  );
};
