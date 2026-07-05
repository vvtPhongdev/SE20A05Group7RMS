import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { isHrRole, UserRole } from '@wr/contracts';
import { useAuth } from '../../../context/AuthContext';
import { ApiError, apiRequest } from '../../../lib/api';
import {
  HRActionButton,
  HRCard,
  HREmptyState,
  HRInlineAlert,
  HRLoadingState,
  HRPageHeader,
} from '../components';

type MediaKind = 'BANNER' | 'NOTICE';

type RecruitmentMediaAsset = {
  kind: MediaKind;
  url: string;
  bucket?: string;
  path?: string;
  fileName?: string;
  mimeType?: string;
  size?: number;
  uploadedAt?: string;
};

type RecruitmentNotice = {
  id: string;
  title: string;
  body: string;
};

type RecruitmentRequestApiItem = {
  id: string;
  position: string;
  headcount: number;
  status: string;
  jobDescription: string;
  skillRequirements: Record<string, unknown> | null;
  department: { id: string; name: string; code: string } | null;
};

type TaskPlanApiItem = {
  id: string;
  taskType: string;
  startDate: string | null;
  endDate: string | null;
  assignedTo: { id: string; displayName: string; role?: string } | null;
};

type OverallPlanApiItem = {
  id: string;
  status: string;
  startDate: string;
  endDate: string;
  tasks: TaskPlanApiItem[];
};

type JobPostingApiItem = {
  id: string;
  requestId: string;
  title: string;
  description: string;
  requirements: Record<string, unknown> | null;
  visibility: 'PUBLIC' | 'PRIVATE';
  status: 'DRAFT' | 'PUBLISHED' | 'CLOSED';
  startDate?: string | null;
  expireDate?: string | null;
  request?: RecruitmentRequestApiItem | null;
};

const iconPaths: Record<string, React.ReactNode> = {
  upload: <path d="M12 16V4m0 0 4 4m-4-4-4 4M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" />,
  save: <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2ZM17 21v-8H7v8M7 3v5h8" />,
  send: <path d="m22 2-7 20-4-9-9-4 20-7Z" />,
  close: <path d="M6 6l12 12M18 6 6 18" />,
  image: <path d="M4 5h16v14H4zM8 13l2.5-3 3 4 2-2.5L20 17M8.5 8.5h.01" />,
  arrow: <path d="M19 12H5m6-6-6 6 6 6" />,
  plus: <path d="M12 5v14M5 12h14" />,
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

const asRecord = (value: unknown): Record<string, unknown> =>
  value && typeof value === 'object' && !Array.isArray(value) ? (value as Record<string, unknown>) : {};

const toDateInput = (value?: string | null) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const toPostingIso = (date: string, endOfDay = false) =>
  new Date(`${date}T${endOfDay ? '23:59:59' : '00:00:00'}`).toISOString();

const formatDate = (value?: string | null) =>
  value ? new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric' }).format(new Date(value)) : 'Not set';

const formatDateTime = (value?: string | null) =>
  value
    ? new Intl.DateTimeFormat('en', {
        dateStyle: 'medium',
        timeStyle: 'short',
      }).format(new Date(value))
    : 'Not set';

const getPublicAvailability = (
  posting: JobPostingApiItem | null,
  draft: { visibility: 'PUBLIC' | 'PRIVATE'; startDate: string; expireDate: string },
) => {
  if (!posting) {
    return {
      tone: 'slate' as const,
      label: 'Not created',
      description: 'Create a draft before publishing this job.',
    };
  }

  if (posting.status === 'CLOSED') {
    return {
      tone: 'rejected' as const,
      label: 'Closed',
      description: 'This posting is closed and hidden from candidates.',
    };
  }

  if (posting.status !== 'PUBLISHED') {
    return {
      tone: 'pending' as const,
      label: 'Draft',
      description: 'Save the draft, then publish it to make it eligible for public listing.',
    };
  }

  if (draft.visibility !== 'PUBLIC') {
    return {
      tone: 'revision' as const,
      label: 'Private',
      description: 'This posting is published but visibility is Private.',
    };
  }

  const now = new Date();
  const opensAt = draft.startDate ? new Date(toPostingIso(draft.startDate)) : null;
  const closesAt = draft.expireDate ? new Date(toPostingIso(draft.expireDate, true)) : null;

  if (opensAt && opensAt > now) {
    return {
      tone: 'pending' as const,
      label: 'Scheduled',
      description: `Published, but candidates will see it after ${formatDateTime(opensAt.toISOString())}.`,
    };
  }

  if (closesAt && closesAt <= now) {
    return {
      tone: 'rejected' as const,
      label: 'Expired',
      description: 'This posting is published but the close date has passed.',
    };
  }

  return {
    tone: 'approved' as const,
    label: 'Visible',
    description: 'Published successfully. Candidates can see this job on the public list and Candidate Dashboard.',
  };
};

const newNotice = (): RecruitmentNotice => ({
  id: crypto.randomUUID?.() ?? `${Date.now()}`,
  title: '',
  body: '',
});

const extractMedia = (requirements: Record<string, unknown> | null): RecruitmentMediaAsset[] => {
  const media = asRecord(requirements).recruitmentMedia;
  if (!Array.isArray(media)) return [];
  return media.filter((item): item is RecruitmentMediaAsset => {
    const record = asRecord(item);
    return typeof record.url === 'string' && (record.kind === 'BANNER' || record.kind === 'NOTICE');
  });
};

const extractNotices = (requirements: Record<string, unknown> | null): RecruitmentNotice[] => {
  const notices = asRecord(requirements).recruitmentNotices;
  if (!Array.isArray(notices)) return [newNotice()];
  const mapped = notices
    .map((item) => {
      const record = asRecord(item);
      return {
        id: typeof record.id === 'string' ? record.id : crypto.randomUUID?.() ?? `${Date.now()}`,
        title: typeof record.title === 'string' ? record.title : '',
        body: typeof record.body === 'string' ? record.body : '',
      };
    })
    .filter((item) => item.title || item.body);
  return mapped.length ? mapped : [newNotice()];
};

export const HRJobPostingWorkspace: React.FC = () => {
  const { requestId = '' } = useParams();
  const navigate = useNavigate();
  const { token, user } = useAuth();
  const [request, setRequest] = useState<RecruitmentRequestApiItem | null>(null);
  const [plan, setPlan] = useState<OverallPlanApiItem | null>(null);
  const [posting, setPosting] = useState<JobPostingApiItem | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [visibility, setVisibility] = useState<'PUBLIC' | 'PRIVATE'>('PUBLIC');
  const [startDate, setStartDate] = useState('');
  const [expireDate, setExpireDate] = useState('');
  const [mediaKind, setMediaKind] = useState<MediaKind>('BANNER');
  const [media, setMedia] = useState<RecruitmentMediaAsset[]>([]);
  const [notices, setNotices] = useState<RecruitmentNotice[]>([newNotice()]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [closing, setClosing] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [apiError, setApiError] = useState('');
  const [actionMessage, setActionMessage] = useState('');

  const loadWorkspace = useCallback(async () => {
    if (!requestId) return;
    setLoading(true);
    setApiError('');
    try {
      const [requestResponse, planResponse, postingsResponse] = await Promise.all([
        apiRequest<RecruitmentRequestApiItem>(`/recruitment-requests/${requestId}`, token),
        apiRequest<OverallPlanApiItem>(`/overall-plan/by-request/${requestId}`, token).catch(() => null),
        apiRequest<JobPostingApiItem[]>('/job-postings', token),
      ]);
      const currentPosting =
        postingsResponse.find((item) => item.requestId === requestResponse.id) ?? null;
      const jobTask = planResponse?.tasks.find((task) => task.taskType === 'JOB_POSTING') ?? null;

      setRequest(requestResponse);
      setPlan(planResponse);
      setPosting(currentPosting);
      setTitle(currentPosting?.title || requestResponse.position);
      setDescription(currentPosting?.description || requestResponse.jobDescription);
      setVisibility(currentPosting?.visibility || 'PUBLIC');
      setStartDate(toDateInput(currentPosting?.startDate || jobTask?.startDate));
      setExpireDate(toDateInput(currentPosting?.expireDate || jobTask?.endDate));
      setMedia(extractMedia(currentPosting?.requirements ?? requestResponse.skillRequirements));
      setNotices(extractNotices(currentPosting?.requirements ?? requestResponse.skillRequirements));
    } catch (error) {
      setApiError(error instanceof Error ? error.message : 'Unable to load job posting workspace');
    } finally {
      setLoading(false);
    }
  }, [requestId, token]);

  useEffect(() => {
    void loadWorkspace();
  }, [loadWorkspace]);

  const jobPostingTask = useMemo(
    () => plan?.tasks.find((task) => task.taskType === 'JOB_POSTING') ?? null,
    [plan],
  );
  const canUseWorkspace = user?.role === UserRole.ADMIN || isHrRole(user?.role);
  const banner = media.find((item) => item.kind === 'BANNER') ?? null;
  const noticeImages = media.filter((item) => item.kind === 'NOTICE');
  const requirements = asRecord(posting?.requirements ?? request?.skillRequirements);
  const publicAvailability = getPublicAvailability(posting, { visibility, startDate, expireDate });

  const buildRequirements = () => ({
    ...requirements,
    recruitmentMedia: media,
    recruitmentNotices: notices.filter((notice) => notice.title.trim() || notice.body.trim()),
  });

  const savePosting = async () => {
    if (!request || !title.trim() || !description.trim() || !startDate || !expireDate) return;
    setSaving(true);
    setApiError('');
    setActionMessage('');
    try {
      const payload = {
        title: title.trim(),
        description: description.trim(),
        visibility,
        startDate: toPostingIso(startDate),
        expireDate: toPostingIso(expireDate, true),
        requirements: buildRequirements(),
      };
      const saved = posting
        ? await apiRequest<JobPostingApiItem>(`/job-postings/${posting.id}`, token, {
            method: 'PATCH',
            body: JSON.stringify(payload),
          })
        : await apiRequest<JobPostingApiItem>('/job-postings', token, {
            method: 'POST',
            body: JSON.stringify({ ...payload, requestId: request.id }),
          });
      setPosting(saved);
      const availability = getPublicAvailability(saved, { visibility, startDate, expireDate });
      setActionMessage(`Job posting saved. ${availability.description}`);
    } catch (error) {
      setApiError(error instanceof ApiError ? error.message : 'Unable to save job posting');
    } finally {
      setSaving(false);
    }
  };

  const publishPosting = async () => {
    if (!posting) return;
    setPublishing(true);
    setApiError('');
    try {
      const published = await apiRequest<JobPostingApiItem>(`/job-postings/${posting.id}/publish`, token, {
        method: 'POST',
        body: JSON.stringify({}),
      });
      setPosting(published);
      const availability = getPublicAvailability(published, { visibility, startDate, expireDate });
      setActionMessage(`Job posting published. ${availability.description}`);
    } catch (error) {
      setApiError(error instanceof ApiError ? error.message : 'Unable to publish job posting');
    } finally {
      setPublishing(false);
    }
  };

  const closePosting = async () => {
    if (!posting) return;
    setClosing(true);
    setApiError('');
    try {
      const closed = await apiRequest<JobPostingApiItem>(`/job-postings/${posting.id}/close`, token, {
        method: 'POST',
        body: JSON.stringify({}),
      });
      setPosting(closed);
      setActionMessage('Job posting closed.');
    } catch (error) {
      setApiError(error instanceof ApiError ? error.message : 'Unable to close job posting');
    } finally {
      setClosing(false);
    }
  };

  const uploadMedia = async (file: File | null) => {
    if (!file || !request) return;
    setUploading(true);
    setApiError('');
    try {
      const body = new FormData();
      body.append('file', file);
      body.append('requestId', request.id);
      body.append('kind', mediaKind);
      const uploaded = await apiRequest<RecruitmentMediaAsset>('/job-postings/media', token, {
        method: 'POST',
        body,
      });
      setMedia((current) => [...current, uploaded]);
      setActionMessage('Media uploaded. Save the job posting to persist it.');
    } catch (error) {
      setApiError(error instanceof ApiError ? error.message : 'Unable to upload media');
    } finally {
      setUploading(false);
    }
  };

  const updateNotice = (id: string, field: 'title' | 'body', value: string) => {
    setNotices((current) =>
      current.map((notice) => (notice.id === id ? { ...notice, [field]: value } : notice)),
    );
  };

  if (loading) {
    return <HRLoadingState label="Loading job posting workspace..." />;
  }

  if (!request) {
    return (
      <HREmptyState
        title="Job posting workspace unavailable."
        description={apiError || 'Select an active campaign with a job posting task.'}
      />
    );
  }

  return (
    <div className="mx-auto grid max-w-[1440px] gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
      <main className="min-w-0 space-y-6">
        <HRPageHeader
          eyebrow="HR Manager Portal"
          title="Job Posting Workspace"
          description="Prepare the public hiring announcement, campaign banner, and recruitment notices."
          actions={
            <HRActionButton onClick={() => navigate(`/hr/campaigns/${request.id}`)} variant="secondary">
              <Icon className="h-4 w-4" name="arrow" />
              Back to Campaign
            </HRActionButton>
          }
        />

        {apiError ? <HRInlineAlert>{apiError}</HRInlineAlert> : null}
        {actionMessage ? <HRInlineAlert tone="teal">{actionMessage}</HRInlineAlert> : null}
        {!canUseWorkspace ? (
          <HRInlineAlert>
            You need the JOB_POSTING task assignment for this campaign to edit or publish.
          </HRInlineAlert>
        ) : null}

        <HRCard className="overflow-hidden rounded-lg shadow-sm">
          <div className="relative min-h-[260px] bg-deep-charcoal">
            {banner ? (
              <img alt="Job posting banner" className="h-full min-h-[260px] w-full object-cover" src={banner.url} />
            ) : (
              <div className="flex min-h-[260px] items-center justify-center bg-surface-container-high text-on-surface-variant">
                <div className="text-center">
                  <Icon className="mx-auto h-10 w-10" name="image" />
                  <p className="mt-3 text-sm font-semibold">Upload a banner to preview the public announcement.</p>
                </div>
              </div>
            )}
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/75 to-transparent p-6 text-white">
              <p className="text-xs font-bold uppercase tracking-[0.16em]">
                {request.department?.name ?? 'Recruitment Campaign'}
              </p>
              <h1 className="mt-2 max-w-3xl text-3xl font-bold">{title || request.position}</h1>
              <p className="mt-2 text-sm font-semibold opacity-90">
                {request.headcount} opening{request.headcount > 1 ? 's' : ''} / {visibility}
              </p>
            </div>
          </div>
        </HRCard>

        <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
          <HRCard className="rounded-lg p-5 shadow-sm">
            <div className="grid gap-4">
              <label className="block">
                <span className="mb-1 block text-xs font-semibold uppercase tracking-[0.14em] text-on-surface-variant">
                  Posting Title
                </span>
                <input
                  className="h-11 w-full rounded-lg border border-border-warm bg-workflow-ivory px-3 text-sm outline-none focus:border-teal-command focus:ring-2 focus:ring-teal-command/20"
                  onChange={(event) => setTitle(event.target.value)}
                  value={title}
                />
              </label>

              <label className="block">
                <span className="mb-1 block text-xs font-semibold uppercase tracking-[0.14em] text-on-surface-variant">
                  Job Description
                </span>
                <textarea
                  className="min-h-[220px] w-full resize-y rounded-lg border border-border-warm bg-workflow-ivory p-3 text-sm leading-6 outline-none focus:border-teal-command focus:ring-2 focus:ring-teal-command/20"
                  onChange={(event) => setDescription(event.target.value)}
                  value={description}
                />
              </label>
            </div>
          </HRCard>

          <HRCard className="rounded-lg p-5 shadow-sm">
            <div className="space-y-4">
              <label className="block">
                <span className="mb-1 block text-xs font-semibold uppercase tracking-[0.14em] text-on-surface-variant">
                  Visibility
                </span>
                <select
                  className="h-10 w-full rounded-lg border border-border-warm bg-workflow-ivory px-3 text-sm outline-none focus:border-teal-command focus:ring-2 focus:ring-teal-command/20"
                  onChange={(event) => setVisibility(event.target.value as 'PUBLIC' | 'PRIVATE')}
                  value={visibility}
                >
                  <option value="PUBLIC">Public</option>
                  <option value="PRIVATE">Private</option>
                </select>
              </label>
              <label className="block">
                <span className="mb-1 block text-xs font-semibold uppercase tracking-[0.14em] text-on-surface-variant">
                  Opens
                </span>
                <input
                  className="h-10 w-full rounded-lg border border-border-warm bg-workflow-ivory px-3 text-sm outline-none focus:border-teal-command focus:ring-2 focus:ring-teal-command/20"
                  onChange={(event) => setStartDate(event.target.value)}
                  type="date"
                  value={startDate}
                />
              </label>
              <label className="block">
                <span className="mb-1 block text-xs font-semibold uppercase tracking-[0.14em] text-on-surface-variant">
                  Closes
                </span>
                <input
                  className="h-10 w-full rounded-lg border border-border-warm bg-workflow-ivory px-3 text-sm outline-none focus:border-teal-command focus:ring-2 focus:ring-teal-command/20"
                  onChange={(event) => setExpireDate(event.target.value)}
                  type="date"
                  value={expireDate}
                />
              </label>
              <div className="rounded-lg border border-border-warm bg-workflow-ivory p-3 text-xs leading-5 text-on-surface-variant">
                Task window: {formatDate(jobPostingTask?.startDate)} - {formatDate(jobPostingTask?.endDate)}
              </div>
            </div>
          </HRCard>
        </section>

        <HRCard className="rounded-lg p-5 shadow-sm">
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-deep-charcoal">Media Library</h2>
              <p className="mt-1 text-sm text-on-surface-variant">
                Upload banner advertising images or recruitment notice visuals.
              </p>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <select
                className="h-10 rounded-lg border border-border-warm bg-workflow-ivory px-3 text-sm outline-none focus:border-teal-command focus:ring-2 focus:ring-teal-command/20"
                onChange={(event) => setMediaKind(event.target.value as MediaKind)}
                value={mediaKind}
              >
                <option value="BANNER">Banner</option>
                <option value="NOTICE">Notice Image</option>
              </select>
              <label className="inline-flex h-10 cursor-pointer items-center justify-center gap-2 rounded-lg bg-teal-command px-4 text-sm font-semibold text-white transition hover:bg-primary">
                <Icon className="h-4 w-4" name="upload" />
                {uploading ? 'Uploading...' : 'Upload Image'}
                <input
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  className="hidden"
                  disabled={!canUseWorkspace || uploading}
                  onChange={(event) => void uploadMedia(event.target.files?.[0] ?? null)}
                  type="file"
                />
              </label>
            </div>
          </div>

          {media.length ? (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {media.map((asset, index) => (
                <article className="overflow-hidden rounded-lg border border-border-warm bg-workflow-ivory" key={`${asset.url}-${index}`}>
                  <img alt={asset.fileName || asset.kind} className="h-36 w-full object-cover" src={asset.url} />
                  <div className="flex items-center justify-between gap-3 p-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-deep-charcoal">
                        {asset.fileName || asset.kind}
                      </p>
                      <p className="text-xs font-semibold uppercase text-teal-command">{asset.kind}</p>
                    </div>
                    <button
                      className="rounded-lg border border-border-warm px-2 py-1 text-xs font-semibold text-rejected transition hover:bg-rejected/5"
                      disabled={!canUseWorkspace}
                      onClick={() => setMedia((current) => current.filter((_, itemIndex) => itemIndex !== index))}
                      type="button"
                    >
                      Remove
                    </button>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <p className="rounded-lg border border-dashed border-border-warm p-6 text-center text-sm text-on-surface-variant">
              No media uploaded yet.
            </p>
          )}
        </HRCard>

        <HRCard className="rounded-lg p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-deep-charcoal">Recruitment Notices</h2>
              <p className="mt-1 text-sm text-on-surface-variant">
                Add short announcements that can be reused in campaign communications.
              </p>
            </div>
            <button
              className="inline-flex h-9 items-center gap-2 rounded-lg border border-teal-command px-3 text-sm font-semibold text-teal-command transition hover:bg-teal-command/5"
              disabled={!canUseWorkspace}
              onClick={() => setNotices((current) => [...current, newNotice()])}
              type="button"
            >
              <Icon className="h-4 w-4" name="plus" />
              Add
            </button>
          </div>
          <div className="space-y-3">
            {notices.map((notice, index) => (
              <div className="grid gap-3 rounded-lg border border-border-warm bg-workflow-ivory p-3 md:grid-cols-[minmax(0,260px)_1fr_auto]" key={notice.id}>
                <input
                  className="h-10 rounded-lg border border-border-warm bg-clean-surface px-3 text-sm outline-none focus:border-teal-command focus:ring-2 focus:ring-teal-command/20"
                  onChange={(event) => updateNotice(notice.id, 'title', event.target.value)}
                  placeholder="Notice title"
                  value={notice.title}
                />
                <input
                  className="h-10 rounded-lg border border-border-warm bg-clean-surface px-3 text-sm outline-none focus:border-teal-command focus:ring-2 focus:ring-teal-command/20"
                  onChange={(event) => updateNotice(notice.id, 'body', event.target.value)}
                  placeholder="Announcement copy"
                  value={notice.body}
                />
                <button
                  className="h-10 rounded-lg border border-border-warm px-3 text-sm font-semibold text-rejected transition hover:bg-rejected/5 disabled:opacity-50"
                  disabled={notices.length === 1 || !canUseWorkspace}
                  onClick={() => setNotices((current) => current.filter((_, itemIndex) => itemIndex !== index))}
                  type="button"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        </HRCard>
      </main>

      <aside className="space-y-4 xl:sticky xl:top-6 xl:self-start">
        <HRCard className="rounded-lg p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-on-surface-variant">
            Publishing
          </p>
          <div className="mt-4 space-y-3">
            <div className="rounded-lg border border-border-warm bg-workflow-ivory p-3">
              <p className="text-xs text-on-surface-variant">Status</p>
              <p className="mt-1 text-sm font-bold text-deep-charcoal">{posting?.status || 'Not created'}</p>
            </div>
            <div className="rounded-lg border border-border-warm bg-workflow-ivory p-3">
              <p className="text-xs text-on-surface-variant">Public visibility</p>
              <span
                className={`mt-2 inline-flex rounded-full px-2.5 py-1 text-xs font-bold ${
                  publicAvailability.tone === 'approved'
                    ? 'bg-approved/10 text-approved'
                    : publicAvailability.tone === 'pending'
                      ? 'bg-pending/10 text-pending'
                      : publicAvailability.tone === 'revision'
                        ? 'bg-revision/10 text-revision'
                        : publicAvailability.tone === 'rejected'
                          ? 'bg-rejected/10 text-rejected'
                          : 'bg-surface-container-high text-slate-ink'
                }`}
              >
                {publicAvailability.label}
              </span>
              <p className="mt-2 text-xs leading-5 text-on-surface-variant">
                {publicAvailability.description}
              </p>
            </div>
            <div className="rounded-lg border border-border-warm bg-workflow-ivory p-3">
              <p className="text-xs text-on-surface-variant">Notice Images</p>
              <p className="mt-1 text-sm font-bold text-deep-charcoal">{noticeImages.length}</p>
            </div>
            <button
              className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-teal-command font-bold text-white transition hover:bg-primary disabled:cursor-not-allowed disabled:opacity-50"
              disabled={!canUseWorkspace || saving || !title.trim() || !description.trim() || !startDate || !expireDate}
              onClick={() => void savePosting()}
              type="button"
            >
              <Icon className="h-4 w-4" name="save" />
              {saving ? 'Saving...' : posting ? 'Save Changes' : 'Create Draft'}
            </button>
            <button
              className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg border border-teal-command bg-clean-surface font-bold text-teal-command transition hover:bg-teal-command/5 disabled:cursor-not-allowed disabled:opacity-50"
              disabled={!canUseWorkspace || !posting || posting.status === 'PUBLISHED' || publishing}
              onClick={() => void publishPosting()}
              type="button"
            >
              <Icon className="h-4 w-4" name="send" />
              {publishing ? 'Publishing...' : 'Publish'}
            </button>
            <button
              className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg border border-rejected bg-clean-surface font-bold text-rejected transition hover:bg-rejected/5 disabled:cursor-not-allowed disabled:opacity-50"
              disabled={!canUseWorkspace || !posting || posting.status === 'CLOSED' || closing}
              onClick={() => void closePosting()}
              type="button"
            >
              <Icon className="h-4 w-4" name="close" />
              {closing ? 'Closing...' : 'Close Posting'}
            </button>
          </div>
        </HRCard>

        <HRCard className="rounded-lg p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-on-surface-variant">
            Campaign
          </p>
          <h2 className="mt-2 text-xl font-bold text-deep-charcoal">{request.position}</h2>
          <p className="mt-2 text-sm text-on-surface-variant">
            {request.department?.name ?? 'Unassigned department'} / {request.headcount} openings
          </p>
          <div className="mt-4 rounded-lg border border-border-warm bg-workflow-ivory p-3 text-xs leading-5 text-on-surface-variant">
            The public posting is still governed by the approved campaign and the assigned JOB_POSTING task.
          </div>
        </HRCard>
      </aside>
    </div>
  );
};
