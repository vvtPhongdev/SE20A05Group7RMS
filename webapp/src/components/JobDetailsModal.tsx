import React, { useEffect } from 'react';

type RecruitmentMediaAsset = {
  kind?: string;
  url?: string;
  fileName?: string;
};

type RecruitmentNotice = {
  id?: string;
  title?: string;
  body?: string;
};

export type JobDetailsModalJob = {
  id: string;
  title: string;
  description: string;
  requirements?: Record<string, unknown> | null;
  expireDate?: string | null;
  request?: {
    headcount?: number;
    department?: { name: string } | null;
  } | null;
};

const asRecord = (value: unknown): Record<string, unknown> =>
  value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};

const asStringList = (value: unknown) =>
  Array.isArray(value)
    ? value.map((item) => String(item).trim()).filter(Boolean)
    : typeof value === 'string'
      ? value
          .split(/[,;]/)
          .map((item) => item.trim())
          .filter(Boolean)
      : [];

const formatDate = (value?: string | null) =>
  value
    ? new Intl.DateTimeFormat('en', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      }).format(new Date(value))
    : 'Open until filled';

const getMedia = (job: JobDetailsModalJob): RecruitmentMediaAsset[] => {
  const media = asRecord(job.requirements).recruitmentMedia;
  if (!Array.isArray(media)) return [];
  return media
    .map((item) => asRecord(item))
    .filter((item) => typeof item.url === 'string')
    .map((item) => ({
      kind: typeof item.kind === 'string' ? item.kind : undefined,
      url: item.url as string,
      fileName: typeof item.fileName === 'string' ? item.fileName : undefined,
    }));
};

const getNotices = (job: JobDetailsModalJob): RecruitmentNotice[] => {
  const notices = asRecord(job.requirements).recruitmentNotices;
  if (!Array.isArray(notices)) return [];
  return notices
    .map((item) => asRecord(item))
    .map((item) => ({
      id: typeof item.id === 'string' ? item.id : undefined,
      title: typeof item.title === 'string' ? item.title : undefined,
      body: typeof item.body === 'string' ? item.body : undefined,
    }))
    .filter((item) => item.title || item.body);
};

export const JobDetailsModal = ({
  action,
  job,
  onClose,
}: {
  action?: React.ReactNode;
  job: JobDetailsModalJob | null;
  onClose: () => void;
}) => {
  useEffect(() => {
    if (!job) return undefined;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [job, onClose]);

  if (!job) return null;

  const requirements = asRecord(job.requirements);
  const media = getMedia(job);
  const banner = media.find((item) => item.kind === 'BANNER') ?? null;
  const noticeImages = media.filter((item) => item.kind === 'NOTICE');
  const notices = getNotices(job);
  const skills = asStringList(requirements.skills);
  const experience = String(requirements.experience ?? requirements.experienceYears ?? '').trim();
  const education = String(requirements.education ?? '').trim();
  const jobLevel = String(requirements.jobLevel ?? '').trim();
  const employmentType = String(requirements.employmentType ?? '').trim();
  const salaryMin = String(requirements.salaryMin ?? '').trim();
  const salaryMax = String(requirements.salaryMax ?? '').trim();

  return (
    <div
      aria-labelledby="job-details-title"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 px-4 py-6"
      role="dialog"
    >
      <div className="flex max-h-[92dvh] w-full max-w-5xl flex-col overflow-hidden rounded-lg border border-border-warm bg-clean-surface shadow-2xl">
        <div className="flex items-start justify-between gap-4 border-b border-border-warm px-5 py-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-teal-command">
              {job.request?.department?.name ?? 'Hiring team'}
            </p>
            <h2 id="job-details-title" className="mt-1 text-2xl font-semibold text-deep-charcoal">
              {job.title}
            </h2>
          </div>
          <button
            aria-label="Close job details"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-border-warm text-xl leading-none text-slate-ink transition hover:bg-surface-container-low"
            onClick={onClose}
            type="button"
          >
            x
          </button>
        </div>

        <div className="overflow-y-auto">
          {banner?.url ? (
            <div className="border-b border-border-warm bg-surface-container-low">
              <img
                alt={`${job.title} recruitment banner`}
                className="max-h-[380px] w-full object-contain"
                src={banner.url}
              />
            </div>
          ) : null}

          <div className="grid gap-6 p-5 lg:grid-cols-[minmax(0,1fr)_300px]">
            <main className="min-w-0 space-y-6">
              <section>
                <h3 className="text-lg font-semibold text-deep-charcoal">Job Description</h3>
                <p className="mt-3 whitespace-pre-line text-sm leading-7 text-slate-ink">
                  {job.description}
                </p>
              </section>

              {skills.length ? (
                <section>
                  <h3 className="text-lg font-semibold text-deep-charcoal">Required Skills</h3>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {skills.map((skill) => (
                      <span
                        className="rounded-full bg-teal-command/10 px-3 py-1 text-xs font-semibold text-teal-command"
                        key={skill}
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </section>
              ) : null}

              {notices.length ? (
                <section>
                  <h3 className="text-lg font-semibold text-deep-charcoal">Recruitment Notices</h3>
                  <div className="mt-3 grid gap-3">
                    {notices.map((notice, index) => (
                      <article
                        className="rounded-lg border border-border-warm bg-workflow-ivory p-4"
                        key={notice.id ?? `${notice.title}-${index}`}
                      >
                        {notice.title ? (
                          <h4 className="text-sm font-semibold text-deep-charcoal">{notice.title}</h4>
                        ) : null}
                        {notice.body ? (
                          <p className="mt-1 text-sm leading-6 text-slate-ink">{notice.body}</p>
                        ) : null}
                      </article>
                    ))}
                  </div>
                </section>
              ) : null}

              {noticeImages.length ? (
                <section>
                  <h3 className="text-lg font-semibold text-deep-charcoal">Notice Images</h3>
                  <div className="mt-3 grid gap-4 md:grid-cols-2">
                    {noticeImages.map((asset, index) => (
                      <img
                        alt={asset.fileName || `Recruitment notice ${index + 1}`}
                        className="w-full rounded-lg border border-border-warm bg-surface-container-low object-contain"
                        key={`${asset.url}-${index}`}
                        src={asset.url}
                      />
                    ))}
                  </div>
                </section>
              ) : null}
            </main>

            <aside className="space-y-4">
              <section className="rounded-lg border border-border-warm bg-workflow-ivory p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-teal-command">
                  Summary
                </p>
                <dl className="mt-4 space-y-3 text-sm">
                  <div>
                    <dt className="text-slate-ink">Closes</dt>
                    <dd className="mt-1 font-semibold text-deep-charcoal">{formatDate(job.expireDate)}</dd>
                  </div>
                  {job.request?.headcount ? (
                    <div>
                      <dt className="text-slate-ink">Openings</dt>
                      <dd className="mt-1 font-semibold text-deep-charcoal">
                        {job.request.headcount}
                      </dd>
                    </div>
                  ) : null}
                  {employmentType ? (
                    <div>
                      <dt className="text-slate-ink">Employment</dt>
                      <dd className="mt-1 font-semibold text-deep-charcoal">{employmentType}</dd>
                    </div>
                  ) : null}
                  {jobLevel ? (
                    <div>
                      <dt className="text-slate-ink">Level</dt>
                      <dd className="mt-1 font-semibold text-deep-charcoal">{jobLevel}</dd>
                    </div>
                  ) : null}
                  {experience ? (
                    <div>
                      <dt className="text-slate-ink">Experience</dt>
                      <dd className="mt-1 font-semibold text-deep-charcoal">{experience}</dd>
                    </div>
                  ) : null}
                  {education ? (
                    <div>
                      <dt className="text-slate-ink">Education</dt>
                      <dd className="mt-1 font-semibold text-deep-charcoal">{education}</dd>
                    </div>
                  ) : null}
                  {salaryMin || salaryMax ? (
                    <div>
                      <dt className="text-slate-ink">Salary</dt>
                      <dd className="mt-1 font-semibold text-deep-charcoal">
                        {[salaryMin, salaryMax].filter(Boolean).join(' - ')}
                      </dd>
                    </div>
                  ) : null}
                </dl>
              </section>

              {action}
            </aside>
          </div>
        </div>
      </div>
    </div>
  );
};
