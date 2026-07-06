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
import {
  buildTemplateFieldValues,
  getRequestTemplateByKey,
  resolveDepartmentRequestTemplate,
  type EmploymentType,
} from '../requestTemplates';

type Priority = 'Low' | 'Medium' | 'High' | 'Critical';

interface FormState {
  positionTitle: string;
  department: string;
  jobLevel: string;
  employmentType: EmploymentType;
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
  templateKey: string;
  templateName: string;
  templateFields: Record<string, string>;
}

interface ApiDepartment {
  id?: string;
  name?: string;
  code?: string | null;
}

interface ApiUserProfile {
  departmentId?: string | null;
  department?: ApiDepartment | null;
  departmentsHeaded?: ApiDepartment[];
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
  department?: ApiDepartment | null;
  skillRequirements?: Record<string, unknown> | null;
  hrRevisionSuggestion?: {
    feedback?: string;
    rootRequest?: SuggestedRequest | null;
    proposedRequest?: SuggestedRequest | null;
  } | null;
}

interface SuggestedRequest {
  positionTitle?: string;
  headcount?: number;
  jobDescription?: string;
  justification?: string;
  urgency?: string;
  skillRequirements?: Record<string, unknown> | null;
}

type IconName = 'close' | 'send' | 'search' | 'help' | 'x' | 'check' | 'plus';

const defaultTemplate = getRequestTemplateByKey('general');

const initialForm: FormState = {
  positionTitle: '',
  department: 'Your Department',
  jobLevel: defaultTemplate.defaultJobLevel,
  employmentType: defaultTemplate.defaultEmploymentType,
  headcount: 1,
  skillInput: '',
  experience: defaultTemplate.defaultExperience,
  education: defaultTemplate.defaultEducation,
  description: '',
  notes: '',
  salaryMin: '',
  salaryMax: '',
  startDate: '',
  priority: 'Medium',
  templateKey: defaultTemplate.key,
  templateName: defaultTemplate.name,
  templateFields: buildTemplateFieldValues(defaultTemplate),
};

const Icon = ({ name, className = 'h-5 w-5' }: { name: IconName; className?: string }) => {
  const paths: Record<IconName, React.ReactNode> = {
    close: <path d="M18 6 6 18M6 6l12 12" />,
    send: <path d="m22 2-7 20-4-9-9-4 20-7Z" />,
    search: <path d="m21 21-4.35-4.35M10.5 18a7.5 7.5 0 1 1 0-15 7.5 7.5 0 0 1 0 15Z" />,
    help: (
      <path d="M9.1 9a3 3 0 1 1 5.8 1c-.7 1.5-2.4 1.7-2.8 3m-.1 4h.01M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
    ),
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

const priorityButtonStyles: Record<Priority, { idle: string; selected: string }> = {
  Low: {
    idle: 'border-slate-ink/25 bg-slate-ink/10 text-slate-ink hover:border-slate-ink/40 hover:bg-slate-ink/15',
    selected: 'border-slate-ink bg-slate-ink text-white shadow-sm ring-2 ring-slate-ink/20',
  },
  Medium: {
    idle: 'border-teal-command/25 bg-teal-command/10 text-teal-command hover:border-teal-command/40 hover:bg-teal-command/15',
    selected:
      'border-teal-command bg-teal-command text-white shadow-sm ring-2 ring-teal-command/20',
  },
  High: {
    idle: 'border-[#d97706]/30 bg-[#d97706]/10 text-[#b45309] hover:border-[#d97706]/50 hover:bg-[#d97706]/15',
    selected: 'border-[#d97706] bg-[#d97706] text-white shadow-sm ring-2 ring-[#d97706]/25',
  },
  Critical: {
    idle: 'border-[#dc2626]/30 bg-[#dc2626]/10 text-[#b91c1c] hover:border-[#dc2626]/50 hover:bg-[#dc2626]/15',
    selected: 'border-[#dc2626] bg-[#dc2626] text-white shadow-sm ring-2 ring-[#dc2626]/25',
  },
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const parseSkillInput = (value: string) =>
  value
    .split(/[;,]/)
    .map((skill) => skill.trim())
    .filter(Boolean);

const primaryDepartment = (profile: ApiUserProfile | null | undefined): ApiDepartment | null =>
  profile?.department ?? profile?.departmentsHeaded?.[0] ?? null;

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

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
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
  const { token, user } = useAuth();
  const requestId = searchParams.get('requestId');
  const [form, setForm] = useState<FormState>(initialForm);
  const [skills, setSkills] = useState(defaultTemplate.defaultSkills);
  const [notice, setNotice] = useState<string | null>(null);
  const [noticeIsError, setNoticeIsError] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [loadingRequest, setLoadingRequest] = useState(false);
  const [rejectionReason, setRejectionReason] = useState<string | null>(null);
  const [requestStatus, setRequestStatus] = useState<string | null>(null);
  const [hrRevisionSuggestion, setHrRevisionSuggestion] =
    useState<RecruitmentRequestApi['hrRevisionSuggestion']>(null);
  const [acceptedHrSuggestion, setAcceptedHrSuggestion] = useState<boolean | null>(null);
  const [revisionResponse, setRevisionResponse] = useState('');

  const currentTemplate = useMemo(
    () => getRequestTemplateByKey(form.templateKey),
    [form.templateKey],
  );

  useEffect(() => {
    if (requestId || !token) return;

    let cancelled = false;
    const applyDepartmentTemplate = (department: ApiDepartment | null) => {
      const template = resolveDepartmentRequestTemplate(department?.name, department?.code);
      setForm((current) => ({
        ...current,
        department: department?.name ?? current.department,
        jobLevel: template.defaultJobLevel,
        employmentType: template.defaultEmploymentType,
        experience: template.defaultExperience,
        education: template.defaultEducation,
        templateKey: template.key,
        templateName: template.name,
        templateFields: buildTemplateFieldValues(template),
      }));
      setSkills(template.defaultSkills);
    };

    const storedDepartment = primaryDepartment(user);
    if (storedDepartment) {
      applyDepartmentTemplate(storedDepartment);
    }

    const loadProfileTemplate = async () => {
      try {
        const profile = await apiRequest<ApiUserProfile>('/me/profile', token);
        if (cancelled) return;

        const profileDepartment = primaryDepartment(profile);
        if (profileDepartment) {
          applyDepartmentTemplate(profileDepartment);
        }
      } catch {
        // Keep the general template if profile details are not available in mock/dev mode.
      }
    };

    void loadProfileTemplate();
    return () => {
      cancelled = true;
    };
  }, [requestId, token, user]);

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
        setHrRevisionSuggestion(request.hrRevisionSuggestion ?? null);
        setAcceptedHrSuggestion(null);
        setRevisionResponse('');

        const requirements = request.skillRequirements ?? {};
        const template =
          typeof requirements.templateKey === 'string'
            ? getRequestTemplateByKey(requirements.templateKey)
            : resolveDepartmentRequestTemplate(request.department?.name, request.department?.code);
        const templateFieldSource = isRecord(requirements.templateFields)
          ? requirements.templateFields
          : requirements;
        const loadedSkills = Array.isArray(requirements.skills)
          ? requirements.skills.map(String)
          : template.defaultSkills;
        const priorityValue = request.urgency.toLowerCase();
        const priority =
          priorityValue === 'low' || priorityValue === 'high' || priorityValue === 'critical'
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
          templateKey: template.key,
          templateName: template.name,
          templateFields: buildTemplateFieldValues(template, templateFieldSource),
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
    const checks = [
      Boolean(form.positionTitle.trim()),
      skills.length > 0,
      Boolean(form.description.trim()),
      Boolean(form.startDate),
      form.headcount > 0,
      ...currentTemplate.fields
        .filter((field) => field.required)
        .map((field) => Boolean(form.templateFields[field.key]?.trim())),
    ];
    const complete = checks.filter(Boolean).length;

    return Math.round((complete / checks.length) * 100);
  }, [
    currentTemplate.fields,
    form.description,
    form.headcount,
    form.positionTitle,
    form.startDate,
    form.templateFields,
    skills.length,
  ]);

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

  const updateTemplateField = (field: string, value: string) => {
    setForm((current) => ({
      ...current,
      templateFields: { ...current.templateFields, [field]: value },
    }));
    setErrors((current) => {
      const next = { ...current };
      delete next[`templateFields.${field}`];
      return next;
    });
    setNotice(null);
    setNoticeIsError(false);
  };

  const addSkill = () => {
    const parsedSkills = parseSkillInput(form.skillInput);
    if (parsedSkills.length === 0) return;

    setSkills((current) => {
      const existing = new Set(current.map((skill) => skill.toLowerCase()));
      const next = [...current];

      parsedSkills.forEach((skill) => {
        const key = skill.toLowerCase();
        if (!existing.has(key)) {
          existing.add(key);
          next.push(skill);
        }
      });

      return next;
    });
    setErrors((current) => {
      const next = { ...current };
      delete next.skills;
      return next;
    });
    update('skillInput', '');
  };

  const removeSkill = (skill: string) => {
    setSkills((current) => current.filter((item) => item !== skill));
  };

  const applySuggestedRequest = (suggestion: SuggestedRequest) => {
    const requirements = suggestion.skillRequirements ?? {};
    const template =
      typeof requirements.templateKey === 'string'
        ? getRequestTemplateByKey(requirements.templateKey)
        : currentTemplate;
    const templateFieldSource = isRecord(requirements.templateFields)
      ? requirements.templateFields
      : requirements;
    const suggestionUrgency = String(suggestion.urgency ?? 'MEDIUM').toLowerCase();
    const priority =
      suggestionUrgency === 'low' ||
      suggestionUrgency === 'high' ||
      suggestionUrgency === 'critical'
        ? ((suggestionUrgency[0]?.toUpperCase() + suggestionUrgency.slice(1)) as Priority)
        : 'Medium';
    const suggestedSkills = Array.isArray(requirements.skills)
      ? requirements.skills.map(String)
      : [];

    setForm((current) => ({
      ...current,
      positionTitle: suggestion.positionTitle ?? current.positionTitle,
      headcount: suggestion.headcount ?? current.headcount,
      description: suggestion.jobDescription ?? current.description,
      notes: suggestion.justification ?? current.notes,
      jobLevel: String(requirements.jobLevel ?? current.jobLevel),
      employmentType: requirements.employmentType === 'Contract' ? 'Contract' : 'Full-time',
      experience: String(requirements.experience ?? current.experience),
      education: String(requirements.education ?? current.education),
      salaryMin: String(requirements.salaryMin ?? current.salaryMin),
      salaryMax: String(requirements.salaryMax ?? current.salaryMax),
      startDate: String(requirements.startDate ?? current.startDate),
      priority,
      templateKey: template.key,
      templateName: template.name,
      templateFields: buildTemplateFieldValues(template, templateFieldSource),
    }));
    if (suggestedSkills.length > 0) setSkills(suggestedSkills);
    setAcceptedHrSuggestion(true);
    setRevisionResponse('');
    setNotice(null);
    setNoticeIsError(false);
  };

  const validate = () => {
    const nextErrors: Record<string, string> = {};
    if (!form.positionTitle.trim()) nextErrors.positionTitle = 'Position title is required.';
    if (!form.description.trim()) nextErrors.description = 'Job description is required.';
    if (skills.length === 0) nextErrors.skills = 'Add at least one required skill.';
    if (!form.startDate) nextErrors.startDate = 'Expected start date is required.';
    if (form.headcount < 1) nextErrors.headcount = 'Number of positions must be at least 1.';
    currentTemplate.fields.forEach((field) => {
      if (field.required && !form.templateFields[field.key]?.trim()) {
        nextErrors[`templateFields.${field.key}`] = `${field.label} is required.`;
      }
    });
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const buildPayload = (submitForReview?: boolean) => ({
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
      templateKey: currentTemplate.key,
      templateName: currentTemplate.name,
      templateFields: form.templateFields,
    },
    ...(submitForReview === undefined ? {} : { submit: submitForReview }),
  });

  const updateExistingRequest = async () => {
    if (!requestId) return;
    const revisionMetadata =
      requestStatus === 'REVISION_NEEDED' && hrRevisionSuggestion?.proposedRequest
        ? {
            acceptedHrSuggestion: acceptedHrSuggestion === true,
            revisionResponse:
              acceptedHrSuggestion === true ? undefined : revisionResponse.trim() || undefined,
          }
        : {};
    await apiRequest(`/recruitment-requests/${requestId}`, token, {
      method: 'PATCH',
      body: JSON.stringify({ ...buildPayload(), ...revisionMetadata }),
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
    if (
      requestStatus === 'REVISION_NEEDED' &&
      hrRevisionSuggestion?.proposedRequest &&
      acceptedHrSuggestion !== true &&
      !revisionResponse.trim()
    ) {
      setNoticeIsError(true);
      setNotice('Please write a reason if you do not approve the HR suggested changes.');
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
      setNotice(
        submitError instanceof ApiError ? submitError.message : 'Unable to submit request.',
      );
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
        <DeptHeadInlineAlert tone={noticeIsError ? 'rejected' : 'teal'}>
          {notice}
        </DeptHeadInlineAlert>
      )}

      {loadingRequest && <DeptHeadLoadingState label="Loading recruitment request..." />}

      <div className="mb-6 grid gap-3 rounded-xl border border-border-warm bg-clean-surface p-4 shadow-sm md:grid-cols-2">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-on-surface-variant">
            Department
          </p>
          <p className="mt-1 text-sm font-semibold text-deep-charcoal">{form.department}</p>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-on-surface-variant">
            Request Template
          </p>
          <p className="mt-1 text-sm font-semibold text-teal-command">{currentTemplate.name}</p>
        </div>
      </div>

      {requestStatus === 'REVISION_NEEDED' && rejectionReason && (
        <div className="mb-6 rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm text-amber-800 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-amber-900 mb-1">
            Reviewer Instructions / Feedback
          </p>
          <p className="font-semibold leading-relaxed">{rejectionReason}</p>
        </div>
      )}

      {requestStatus === 'REVISION_NEEDED' && hrRevisionSuggestion?.proposedRequest && (
        <div className="mb-6 rounded-lg border border-teal-command/20 bg-teal-command/5 p-5 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-teal-command">
                HR Suggested Copy
              </p>
              <h2 className="mt-1 text-lg font-semibold text-deep-charcoal">
                {hrRevisionSuggestion.proposedRequest.positionTitle || 'Suggested request update'}
              </h2>
              {hrRevisionSuggestion.feedback ? (
                <p className="mt-2 text-sm font-medium leading-6 text-slate-ink">
                  {hrRevisionSuggestion.feedback}
                </p>
              ) : null}
            </div>
            <button
              className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-teal-command px-4 text-sm font-semibold text-white transition hover:bg-primary active:scale-[0.98]"
              onClick={() => applySuggestedRequest(hrRevisionSuggestion.proposedRequest!)}
              type="button"
            >
              <Icon className="h-4 w-4" name="check" />
              Apply HR Suggestion
            </button>
          </div>

          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <div className="rounded-lg border border-border-warm bg-clean-surface p-3">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-on-surface-variant">
                Headcount
              </p>
              <p className="mt-1 text-sm font-semibold text-deep-charcoal">
                {hrRevisionSuggestion.proposedRequest.headcount ?? 'No change'}
              </p>
            </div>
            <div className="rounded-lg border border-border-warm bg-clean-surface p-3">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-on-surface-variant">
                Priority
              </p>
              <p className="mt-1 text-sm font-semibold text-deep-charcoal">
                {hrRevisionSuggestion.proposedRequest.urgency ?? 'No change'}
              </p>
            </div>
            <div className="rounded-lg border border-border-warm bg-clean-surface p-3">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-on-surface-variant">
                Skills
              </p>
              <p className="mt-1 text-sm font-semibold text-deep-charcoal">
                {Array.isArray(hrRevisionSuggestion.proposedRequest.skillRequirements?.skills)
                  ? hrRevisionSuggestion.proposedRequest.skillRequirements.skills.join(', ')
                  : 'No change'}
              </p>
            </div>
          </div>

          {acceptedHrSuggestion === true ? (
            <p className="mt-4 rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-sm font-semibold text-approved">
              HR suggestion applied. Submit the request to send this version back to HR.
            </p>
          ) : (
            <label className="mt-4 block">
              <span className="mb-2 block text-sm font-semibold text-on-surface">
                Reason if you do not approve HR suggestion <span className="text-rejected">*</span>
              </span>
              <textarea
                className={textareaClass}
                onChange={(event) => {
                  setAcceptedHrSuggestion(false);
                  setRevisionResponse(event.target.value);
                }}
                placeholder="Explain why you keep your own version or reject the suggested changes..."
                rows={3}
                value={revisionResponse}
              />
            </label>
          )}
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
                  placeholder={currentTemplate.defaultPositionTitle || 'e.g. Senior Frontend Engineer'}
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
                {currentTemplate.jobLevelOptions.map((level) => (
                  <option key={level}>{level}</option>
                ))}
              </select>
            </Field>

            <Field label="Employment Type">
              <div className="flex h-11 items-center gap-4">
                {currentTemplate.employmentTypeOptions.map((type) => (
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
                    placeholder="Add skills, separated by , or ;"
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
                  {currentTemplate.experienceOptions.map((experience) => (
                    <option key={experience}>{experience}</option>
                  ))}
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

            <div className="rounded-lg border border-border-warm bg-workflow-ivory/45 p-4">
              <div className="mb-4">
                <p className="text-sm font-semibold text-deep-charcoal">{currentTemplate.name}</p>
              </div>
              <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                {currentTemplate.fields.map((field) => {
                  const error = errors[`templateFields.${field.key}`];
                  const value = form.templateFields[field.key] ?? '';
                  const className = field.type === 'textarea' ? textareaClass : fieldClass;

                  return (
                    <div
                      className={field.type === 'textarea' ? 'md:col-span-2' : undefined}
                      key={field.key}
                    >
                      <Field label={field.label} required={field.required}>
                        {field.type === 'select' ? (
                          <select
                            className={fieldClass}
                            onChange={(event) => updateTemplateField(field.key, event.target.value)}
                            value={value}
                          >
                            {field.options?.map((option) => (
                              <option key={option}>{option}</option>
                            ))}
                          </select>
                        ) : field.type === 'textarea' ? (
                          <textarea
                            className={className}
                            onChange={(event) => updateTemplateField(field.key, event.target.value)}
                            placeholder={field.placeholder}
                            rows={3}
                            value={value}
                          />
                        ) : (
                          <input
                            className={className}
                            onChange={(event) => updateTemplateField(field.key, event.target.value)}
                            placeholder={field.placeholder}
                            type="text"
                            value={value}
                          />
                        )}
                        {error && (
                          <p className="mt-2 text-xs font-semibold text-rejected">{error}</p>
                        )}
                      </Field>
                    </div>
                  );
                })}
              </div>
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
                  const styles = priorityButtonStyles[priority];

                  return (
                    <button
                      aria-pressed={checked}
                      className={`min-w-[88px] rounded-lg border px-4 py-2 text-xs font-semibold transition active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${
                        checked ? styles.selected : styles.idle
                      }`}
                      key={priority}
                      onClick={() => update('priority', priority)}
                      type="button"
                    >
                      <span
                        className={`flex h-4 w-4 items-center justify-center rounded-full border ${
                          checked
                            ? 'border-white/75 bg-white/20'
                            : 'border-current bg-clean-surface'
                        }`}
                      >
                        {checked && <Icon className="h-3 w-3" name="check" />}
                      </span>
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
              <div
                className="h-full rounded-full bg-teal-command"
                style={{ width: `${readiness}%` }}
              />
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
