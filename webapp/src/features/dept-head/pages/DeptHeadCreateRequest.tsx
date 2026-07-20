import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { ApiError, apiRequest } from '../../../lib/api';
import {
  Combobox,
  ComboboxChip,
  ComboboxChips,
  ComboboxChipsInput,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxItem,
  ComboboxList,
  ComboboxValue,
  useComboboxAnchor,
} from '@/components/ui/combobox';
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
  departmentId: string;
  department: string;
  headcount: number;
  skillInput: string;
  description: string;
  notes: string;
  priority: Priority;
}

interface ApiDepartment {
  id?: string;
  name?: string;
  code?: string | null;
  organizationId?: string;
  skills?: unknown;
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

const initialForm: FormState = {
  positionTitle: '',
  departmentId: '',
  department: 'Your Department',
  headcount: 1,
  skillInput: '',
  description: '',
  notes: '',
  priority: 'Medium',
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

const parseSkillInput = (value: string) =>
  value
    .split(/[;,]/)
    .map((skill) => skill.trim())
    .filter(Boolean);

const departmentSkills = (value: unknown) =>
  Array.isArray(value) ? value.filter((skill): skill is string => typeof skill === 'string') : [];

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
  const skillComboboxAnchor = useComboboxAnchor();
  const requestId = searchParams.get('requestId');
  const [form, setForm] = useState<FormState>(initialForm);
  const [skills, setSkills] = useState<string[]>([]);
  const [departmentSkillOptions, setDepartmentSkillOptions] = useState<string[]>([]);
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
  const [skillListOpen, setSkillListOpen] = useState(false);
  const skillOptions = useMemo(
    () => [...new Set([...departmentSkillOptions, ...skills])],
    [departmentSkillOptions, skills],
  );

  const hasMatchingSkillOption = (value: string) => {
    const query = value.trim().toLowerCase();
    return Boolean(query) && skillOptions.some((skill) => skill.toLowerCase().includes(query));
  };

  useEffect(() => {
    if (requestId || !token) return;

    let cancelled = false;
    const applyDepartment = (department: ApiDepartment | null) => {
      setForm((current) => ({
        ...current,
        departmentId: department?.id ?? '',
        department: department?.name ?? current.department,
      }));
      setSkills([]);
    };

    const storedDepartment = primaryDepartment(user);
    if (storedDepartment) {
      applyDepartment(storedDepartment);
    }

    const loadProfile = async () => {
      try {
        const profile = await apiRequest<ApiUserProfile>('/me/profile', token);
        if (cancelled) return;

        const profileDepartment = primaryDepartment(profile);
        if (profileDepartment) {
          applyDepartment(profileDepartment);
        }
      } catch {
        // Keep the current department if profile details are not available in mock/dev mode.
      }
    };

    void loadProfile();
    return () => {
      cancelled = true;
    };
  }, [requestId, token, user]);

  useEffect(() => {
    if (!token || !form.departmentId) {
      setDepartmentSkillOptions([]);
      return;
    }

    let cancelled = false;
    const loadDepartmentSkills = async () => {
      try {
        const departments = await apiRequest<ApiDepartment[]>('/departments', token);
        const department = departments.find((item) => item.id === form.departmentId);
        if (!cancelled) setDepartmentSkillOptions(departmentSkills(department?.skills));
      } catch {
        if (!cancelled) setDepartmentSkillOptions([]);
      }
    };

    void loadDepartmentSkills();
    return () => {
      cancelled = true;
    };
  }, [form.departmentId, token]);

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
        const loadedSkills = Array.isArray(requirements.skills)
          ? requirements.skills.map(String)
          : [];
        const priorityValue = request.urgency.toLowerCase();
        const priority =
          priorityValue === 'low' || priorityValue === 'high' || priorityValue === 'critical'
            ? ((priorityValue[0]?.toUpperCase() + priorityValue.slice(1)) as Priority)
            : 'Medium';
        setForm({
          positionTitle: request.position,
          departmentId: request.department?.id ?? '',
          department: request.department?.name ?? initialForm.department,
          headcount: request.headcount,
          skillInput: '',
          description: request.jobDescription,
          notes: request.justification,
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
    const checks = [
      Boolean(form.positionTitle.trim()),
      skills.length > 0,
      Boolean(form.description.trim()),
      form.headcount > 0,
    ];
    const complete = checks.filter(Boolean).length;

    return Math.round((complete / checks.length) * 100);
  }, [form.description, form.headcount, form.positionTitle, skills.length]);

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

  const updateSkills = (nextSkills: string[]) => {
    setSkills(nextSkills);
    update('skillInput', '');
    setErrors((current) => {
      const next = { ...current };
      delete next.skills;
      return next;
    });
  };

  const handleSkillAdd = () => {
    if (form.skillInput.trim() && !hasMatchingSkillOption(form.skillInput)) {
      addSkill();
    }
    setSkillListOpen(true);
  };

  const applySuggestedRequest = (suggestion: SuggestedRequest) => {
    const requirements = suggestion.skillRequirements ?? {};
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
      priority,
    }));
    if (suggestedSkills.length > 0) setSkills(suggestedSkills);
    setAcceptedHrSuggestion(true);
    setRevisionResponse('');
    setNotice(null);
    setNoticeIsError(false);
  };

  const validate = () => {
    const nextErrors: Record<string, string> = {};
    if (!form.departmentId) nextErrors.departmentId = 'Select a department.';
    if (!form.positionTitle.trim()) nextErrors.positionTitle = 'Position title is required.';
    if (!form.description.trim()) nextErrors.description = 'Job description is required.';
    if (skills.length === 0) nextErrors.skills = 'Add at least one required skill.';
    if (form.headcount < 1) nextErrors.headcount = 'Number of positions must be at least 1.';
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const buildPayload = (submitForReview?: boolean) => ({
    departmentId: form.departmentId,
    positionTitle: form.positionTitle,
    headcount: form.headcount,
    jobDescription: form.description,
    justification: form.notes || form.description,
    urgency: form.priority.toUpperCase(),
    skillRequirements: {
      skills,
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

  const suggestedRequest = hrRevisionSuggestion?.proposedRequest;
  const suggestedSkills = Array.isArray(suggestedRequest?.skillRequirements?.skills)
    ? suggestedRequest.skillRequirements.skills.map(String)
    : [];
  const hasSuggestedSkillsChange =
    suggestedSkills.join('|').toLowerCase() !== skills.join('|').toLowerCase();

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

      <div className="mb-6 rounded-xl border border-border-warm bg-clean-surface p-4 shadow-sm">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-on-surface-variant">
            Department
          </p>
          <p className="mt-1 text-sm font-semibold text-deep-charcoal">{form.department}</p>
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

      {requestStatus === 'REVISION_NEEDED' && suggestedRequest && (
        <div className="mb-6 rounded-lg border border-amber-300 bg-amber-50 p-5 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-amber-900">
                HR Suggested Changes
              </p>
              <h2 className="mt-1 text-lg font-semibold text-deep-charcoal">
                {suggestedRequest.positionTitle || 'Suggested request update'}
              </h2>
              {hrRevisionSuggestion.feedback ? (
                <p className="mt-2 text-sm font-medium leading-6 text-slate-ink">
                  {hrRevisionSuggestion.feedback}
                </p>
              ) : null}
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-teal-command px-4 text-sm font-semibold text-white transition hover:bg-primary active:scale-[0.98]"
                onClick={() => applySuggestedRequest(suggestedRequest)}
                type="button"
              >
                <Icon className="h-4 w-4" name="check" />
                Approve & Apply
              </button>
              <button
                className="h-10 rounded-lg border border-rejected/30 bg-clean-surface px-4 text-sm font-semibold text-rejected transition hover:bg-rejected/5 active:scale-[0.98]"
                onClick={() => setAcceptedHrSuggestion(false)}
                type="button"
              >
                Reject Suggestion
              </button>
            </div>
          </div>

          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <div
              className={`rounded-lg border p-3 ${
                suggestedRequest.headcount !== undefined && suggestedRequest.headcount !== form.headcount
                  ? 'border-amber-400 bg-amber-100/70'
                  : 'border-border-warm bg-clean-surface'
              }`}
            >
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-on-surface-variant">
                Headcount
              </p>
              <p className="mt-1 text-xs text-on-surface-variant">Current: {form.headcount}</p>
              <p className="mt-1 text-sm font-semibold text-deep-charcoal">
                Suggested: {suggestedRequest.headcount ?? 'No change'}
              </p>
            </div>
            <div
              className={`rounded-lg border p-3 ${
                suggestedRequest.urgency && suggestedRequest.urgency.toLowerCase() !== form.priority.toLowerCase()
                  ? 'border-amber-400 bg-amber-100/70'
                  : 'border-border-warm bg-clean-surface'
              }`}
            >
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-on-surface-variant">
                Priority
              </p>
              <p className="mt-1 text-xs text-on-surface-variant">Current: {form.priority}</p>
              <p className="mt-1 text-sm font-semibold text-deep-charcoal">
                Suggested: {suggestedRequest.urgency ?? 'No change'}
              </p>
            </div>
            <div
              className={`rounded-lg border p-3 ${
                hasSuggestedSkillsChange ? 'border-amber-400 bg-amber-100/70' : 'border-border-warm bg-clean-surface'
              }`}
            >
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-on-surface-variant">
                Skills
              </p>
              <p className="mt-1 text-xs text-on-surface-variant">
                Current: {skills.join(', ') || 'None'}
              </p>
              <p className="mt-1 text-sm font-semibold text-deep-charcoal">
                Suggested: {suggestedSkills.join(', ') || 'No change'}
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
                  placeholder="e.g. Senior Frontend Engineer"
                  type="text"
                  value={form.positionTitle}
                />
                {errors.positionTitle && (
                  <p className="mt-2 text-xs font-semibold text-rejected">{errors.positionTitle}</p>
                )}
              </Field>
            </div>

            <Field label="Department" required>
              <input
                className="w-full cursor-not-allowed rounded-lg border border-border-warm bg-surface-container-low px-4 py-2.5 text-sm text-on-surface-variant outline-none"
                readOnly
                type="text"
                value={form.department}
              />
              {errors.departmentId && (
                <p className="mt-2 text-xs font-semibold text-rejected">{errors.departmentId}</p>
              )}
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
                <Combobox
                  inputValue={form.skillInput}
                  items={skillOptions}
                  multiple
                  open={skillListOpen}
                  value={skills}
                  onOpenChange={setSkillListOpen}
                  onInputValueChange={(value) => update('skillInput', value)}
                  onValueChange={(value) => updateSkills(value)}
                >
                  <div
                    ref={skillComboboxAnchor}
                    className="flex min-h-[46px] items-stretch overflow-hidden rounded-lg border border-border-warm bg-workflow-ivory transition focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20"
                  >
                    <ComboboxChips className="min-h-[44px] flex-1 rounded-none border-0 bg-transparent px-2 py-2 shadow-none focus-within:ring-0">
                      <ComboboxValue>
                        {(selectedSkills: string[]) => (
                          <>
                            {selectedSkills.map((skill) => (
                              <ComboboxChip
                                aria-label={skill}
                                className="rounded-full bg-secondary-container px-3 py-1 text-xs font-semibold text-on-secondary-container"
                                key={skill}
                              >
                                {skill}
                              </ComboboxChip>
                            ))}
                            <ComboboxChipsInput
                              className="min-h-7 min-w-[180px] px-2 text-sm placeholder:text-on-surface-variant"
                              placeholder={
                                selectedSkills.length > 0
                                  ? 'Type or pick another skill'
                                  : 'Type or pick required skills'
                              }
                              onFocus={() => setSkillListOpen(true)}
                              onKeyDown={(event) => {
                                if (
                                  event.key === 'Enter' &&
                                  form.skillInput.trim() &&
                                  !hasMatchingSkillOption(form.skillInput)
                                ) {
                                  event.preventDefault();
                                  addSkill();
                                  setSkillListOpen(true);
                                }
                              }}
                            />
                          </>
                        )}
                      </ComboboxValue>
                    </ComboboxChips>
                    <button
                      className="inline-flex min-w-20 items-center justify-center gap-1 border-l border-border-warm bg-clean-surface px-3 text-sm font-semibold text-teal-command transition hover:bg-teal-command/10 active:scale-[0.98]"
                      onClick={handleSkillAdd}
                      type="button"
                    >
                      <Icon className="h-4 w-4" name="plus" />
                      Add
                    </button>
                  </div>
                  <ComboboxContent
                    anchor={skillComboboxAnchor}
                    className="max-h-64 rounded-lg border-border-warm bg-clean-surface p-1 shadow-[0_20px_50px_-32px_rgba(28,25,23,0.65)]"
                  >
                    <ComboboxEmpty className="rounded-md bg-clean-surface px-3 py-2 text-sm text-on-surface-variant">
                      No skills found. Type a new skill and click Add.
                    </ComboboxEmpty>
                    <ComboboxList className="max-h-56 p-1">
                      {(skill: string) => (
                        <ComboboxItem
                          className="rounded-md px-3 py-2 text-sm font-medium text-on-surface data-highlighted:bg-teal-command/10 data-highlighted:text-deep-charcoal data-[selected]:bg-secondary-container data-[selected]:text-on-secondary-container"
                          key={skill}
                          value={skill}
                        >
                          {skill}
                        </ComboboxItem>
                      )}
                    </ComboboxList>
                  </ComboboxContent>
                </Combobox>
                {errors.skills && (
                  <p className="mt-2 text-xs font-semibold text-rejected">{errors.skills}</p>
                )}
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

        <Section title="Priority">
          <div className="block">
            <p className="mb-2 text-sm font-semibold text-on-surface">Priority</p>
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
