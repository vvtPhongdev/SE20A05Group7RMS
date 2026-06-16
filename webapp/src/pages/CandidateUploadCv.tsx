import React, { useEffect, useRef, useState } from 'react';
import { ResumeDraftSchema, ResumeSchema, type ResumeDraftData } from '@wr/contracts';
import { useAuth } from '../context/AuthContext';
import { apiRequest } from '../lib/api';

// SVG Icons definition to match high-fidelity design without depending on external fonts
const Icons = {
  uploadFile: () => (
    <svg
      width="32"
      height="32"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="17 8 12 3 7 8" />
      <line x1="12" y1="3" x2="12" y2="15" />
    </svg>
  ),
  description: () => (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="text-teal-command shrink-0"
    >
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
    </svg>
  ),
  warning: () => (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="text-red-600 shrink-0"
    >
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  ),
  delete: () => (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    </svg>
  ),
  download: () => (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 3v12" />
      <path d="m7 10 5 5 5-5" />
      <path d="M5 21h14" />
    </svg>
  ),
  spinner: () => (
    <svg className="animate-spin h-4 w-4 text-teal-command" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  ),
};

interface CvDocument {
  id: string;
  name: string;
  uploadedDate: string;
  parsingStatus: 'Ready' | 'Parsing...';
}

interface CvExperience {
  id: string;
  company: string;
  position: string;
  startDate: string;
  endDate: string;
  isCurrent: boolean;
  achievements: string;
}

interface CvEducation {
  id: string;
  school: string;
  major: string;
  degree: string;
  startDate: string;
  endDate: string;
}

interface CvFormData {
  fullName: string;
  email: string;
  phone: string;
  currentRole: string;
  address: string;
  linkedinUrl: string;
  githubUrl: string;
  portfolioUrl: string;
  summary: string;
  technicalSkills: string;
  softSkills: string;
  languages: string;
  experience: CvExperience[];
  education: CvEducation[];
}

const emptyCvForm: CvFormData = {
  fullName: '',
  email: '',
  phone: '',
  currentRole: '',
  address: '',
  linkedinUrl: '',
  githubUrl: '',
  portfolioUrl: '',
  summary: '',
  technicalSkills: '',
  softSkills: '',
  languages: '',
  experience: [],
  education: [],
};

type LegacyExperience = {
  id?: string;
  title?: string;
  company?: string;
  duration?: string;
  description?: string;
};

type LegacyEducation = {
  id?: string;
  degree?: string;
  school?: string;
  year?: string;
};

type StoredCvData = {
  resume?: unknown;
  currentRole?: string;
  location?: string;
  linkedinUrl?: string;
  skills?: string[];
  experience?: LegacyExperience[];
  education?: LegacyEducation[];
  [key: string]: unknown;
};

const optionalText = (value: string) => value.trim() || undefined;

const splitList = (value: string) =>
  value
    .split(/[,\n]/)
    .map((item) => item.trim())
    .filter(Boolean);

const splitAchievements = (value: string) =>
  value
    .split('\n')
    .map((item) => item.replace(/^[-*]\s*/, '').trim())
    .filter(Boolean);

const parseLanguages = (value: string) =>
  splitList(value).map((item) => {
    const [name, ...proficiencyParts] = item.split(/\s*[|:]\s*/);
    const proficiency = proficiencyParts.join(' | ').trim();
    return {
      name: name?.trim() || item,
      ...(proficiency ? { proficiency } : {}),
    };
  });

type ResumeDraftLanguage = NonNullable<
  NonNullable<ResumeDraftData['skills']>['languages']
>[number];

const formatLanguages = (languages: ResumeDraftLanguage[] | undefined) =>
  (languages ?? [])
    .map((language) =>
      language.proficiency ? `${language.name} | ${language.proficiency}` : language.name,
    )
    .join(', ');

const legacyMonth = (value: string | undefined) =>
  value?.match(/\b\d{4}-(?:0[1-9]|1[0-2])\b/)?.[0] ?? '';

const findLink = (
  links: NonNullable<NonNullable<ResumeDraftData['personalInfo']>['links']> | undefined,
  type: 'LINKEDIN' | 'GITHUB' | 'PORTFOLIO',
) => links?.find((link) => link.type === type)?.url ?? '';

const formatExperienceDuration = (experience: CvExperience) => {
  if (!experience.startDate && !experience.endDate && !experience.isCurrent) return '';
  return `${experience.startDate || 'Unknown'} - ${
    experience.isCurrent ? 'Present' : experience.endDate || 'Unknown'
  }`;
};

export const CandidateUploadCv: React.FC = () => {
  const { token } = useAuth();
  const [view, setView] = useState<'upload' | 'builder'>('upload');
  // Document History State
  const [documents, setDocuments] = useState<CvDocument[]>([]);

  // Drag and Drop Visual State
  const [isDragActive, setIsDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [apiError, setApiError] = useState('');
  const [cvForm, setCvForm] = useState<CvFormData>(emptyCvForm);
  const [existingStructuredData, setExistingStructuredData] = useState<Record<string, unknown>>({});
  const [savingCv, setSavingCv] = useState(false);
  const [cvSaved, setCvSaved] = useState(false);

  const mapDocument = (document: {
    id: string;
    fileName: string;
    parsedAt?: string | null;
    rawText?: string;
    createdAt: string;
  }): CvDocument => ({
    id: document.id,
    name: document.fileName,
    uploadedDate: new Date(document.createdAt).toLocaleDateString(),
    parsingStatus: document.parsedAt ? 'Ready' : 'Parsing...',
  });

  useEffect(() => {
    const loadDocuments = async () => {
      try {
        const response = await apiRequest<
          Array<{
            id: string;
            fileName: string;
            parsedAt?: string | null;
            rawText?: string;
            createdAt: string;
          }>
        >('/candidate/cvs', token);
        setDocuments(response.map(mapDocument));
      } catch (loadError) {
        setApiError(loadError instanceof Error ? loadError.message : 'Unable to load CV documents');
      } finally {
        setLoading(false);
      }
    };

    void loadDocuments();
  }, [token]);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const profile = await apiRequest<{
          fullName: string;
          email: string;
          phone?: string | null;
          summary?: string | null;
          structuredData?: StoredCvData | null;
        }>('/candidate-profiles/me', token);
        const structuredData = profile.structuredData ?? {};
        const parsedResume = ResumeDraftSchema.safeParse(structuredData.resume);
        const resume = parsedResume.success ? parsedResume.data : {};
        const personalInfo = resume.personalInfo ?? {};
        const resumeSkills = resume.skills ?? {};
        const resumeExperience = resume.workExperience ?? [];
        const resumeEducation = resume.education ?? [];
        const legacyExperience = Array.isArray(structuredData.experience)
          ? structuredData.experience
          : [];
        const legacyEducation = Array.isArray(structuredData.education)
          ? structuredData.education
          : [];

        setExistingStructuredData(structuredData);
        setCvForm({
          fullName: personalInfo.fullName || profile.fullName || '',
          email: personalInfo.email || profile.email || '',
          phone: personalInfo.phoneNumber || profile.phone || '',
          currentRole: resume.currentRole || structuredData.currentRole || '',
          address: personalInfo.address || structuredData.location || '',
          linkedinUrl:
            findLink(personalInfo.links, 'LINKEDIN') || structuredData.linkedinUrl || '',
          githubUrl: findLink(personalInfo.links, 'GITHUB'),
          portfolioUrl: findLink(personalInfo.links, 'PORTFOLIO'),
          summary: resume.summary || profile.summary || '',
          technicalSkills: (
            resumeSkills.technical ||
            (Array.isArray(structuredData.skills) ? structuredData.skills : [])
          ).join(', '),
          softSkills: (resumeSkills.softSkills || []).join(', '),
          languages: formatLanguages(resumeSkills.languages),
          experience:
            resumeExperience.length > 0
              ? resumeExperience.map((item, index) => ({
                  id: `resume-exp-${index}`,
                  company: item.company || '',
                  position: item.position || '',
                  startDate: item.startDate || '',
                  endDate: item.endDate || '',
                  isCurrent: item.isCurrent || false,
                  achievements: (item.achievements || []).join('\n'),
                }))
              : legacyExperience.map((item, index) => ({
                  id: item.id || `legacy-exp-${index}`,
                  company: item.company || '',
                  position: item.title || '',
                  startDate: '',
                  endDate: '',
                  isCurrent: /present|current|hiện tại/i.test(item.duration || ''),
                  achievements: item.description || '',
                })),
          education:
            resumeEducation.length > 0
              ? resumeEducation.map((item, index) => ({
                  id: `resume-edu-${index}`,
                  school: item.school || '',
                  major: item.major || '',
                  degree: item.degree || '',
                  startDate: item.startDate || '',
                  endDate: item.endDate || '',
                }))
              : legacyEducation.map((item, index) => ({
                  id: item.id || `legacy-edu-${index}`,
                  school: item.school || '',
                  major: '',
                  degree: item.degree || '',
                  startDate: '',
                  endDate: legacyMonth(item.year),
                })),
        });
      } catch (loadError) {
        setApiError(loadError instanceof Error ? loadError.message : 'Unable to load CV profile');
      }
    };

    void loadProfile();
  }, [token]);

  // Trigger file selection dialog
  const handleBrowseFiles = () => {
    fileInputRef.current?.click();
  };

  const handleFileUpload = async (file: File) => {
    if (file.size > 10 * 1024 * 1024) {
      setApiError('CV file must be 10MB or smaller');
      return;
    }

    setUploading(true);
    setApiError('');
    const formData = new FormData();
    formData.append('file', file);
    try {
      const uploaded = await apiRequest<{
        id: string;
        fileName: string;
        parsedAt?: string | null;
        rawText?: string;
        createdAt: string;
      }>('/candidate/cvs', token, { method: 'POST', body: formData });
      setDocuments((current) => [mapDocument(uploaded), ...current]);
    } catch (uploadError) {
      setApiError(uploadError instanceof Error ? uploadError.message : 'Unable to upload CV');
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Handle Drag Over
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragActive(true);
  };

  // Handle Drag Leave
  const handleDragLeave = () => {
    setIsDragActive(false);
  };

  // Handle Drop
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.name.endsWith('.pdf') || file.name.endsWith('.docx')) {
        void handleFileUpload(file);
      } else {
        alert('Invalid file format. Please upload a PDF or DOCX file.');
      }
    }
  };

  // Handle Native File Change
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      void handleFileUpload(e.target.files[0]);
    }
  };

  // Delete document
  const handleDeleteDoc = async (id: string) => {
    setApiError('');
    try {
      await apiRequest<{ success: boolean }>(`/candidate/cvs/${id}`, token, {
        method: 'DELETE',
      });
      setDocuments((current) => current.filter((doc) => doc.id !== id));
    } catch (deleteError) {
      setApiError(deleteError instanceof Error ? deleteError.message : 'Unable to delete CV');
    }
  };

  const updateCvField = (field: keyof CvFormData, value: string) => {
    setCvSaved(false);
    setCvForm((current) => ({ ...current, [field]: value }));
  };

  const addExperience = () => {
    setCvSaved(false);
    setCvForm((current) => ({
      ...current,
      experience: [
        ...current.experience,
        {
          id: `exp-${Date.now()}`,
          company: '',
          position: '',
          startDate: '',
          endDate: '',
          isCurrent: false,
          achievements: '',
        },
      ],
    }));
  };

  const updateExperience = <Field extends keyof Omit<CvExperience, 'id'>>(
    id: string,
    field: Field,
    value: CvExperience[Field],
  ) => {
    setCvSaved(false);
    setCvForm((current) => ({
      ...current,
      experience: current.experience.map((item) =>
        item.id === id ? { ...item, [field]: value } : item,
      ),
    }));
  };

  const removeExperience = (id: string) => {
    setCvSaved(false);
    setCvForm((current) => ({
      ...current,
      experience: current.experience.filter((item) => item.id !== id),
    }));
  };

  const addEducation = () => {
    setCvSaved(false);
    setCvForm((current) => ({
      ...current,
      education: [
        ...current.education,
        {
          id: `edu-${Date.now()}`,
          school: '',
          major: '',
          degree: '',
          startDate: '',
          endDate: '',
        },
      ],
    }));
  };

  const updateEducation = (id: string, field: keyof Omit<CvEducation, 'id'>, value: string) => {
    setCvSaved(false);
    setCvForm((current) => ({
      ...current,
      education: current.education.map((item) =>
        item.id === id ? { ...item, [field]: value } : item,
      ),
    }));
  };

  const removeEducation = (id: string) => {
    setCvSaved(false);
    setCvForm((current) => ({
      ...current,
      education: current.education.filter((item) => item.id !== id),
    }));
  };

  const buildResumeInput = () => ({
    personalInfo: {
      fullName: optionalText(cvForm.fullName),
      email: optionalText(cvForm.email),
      phoneNumber: optionalText(cvForm.phone),
      address: optionalText(cvForm.address),
      links: [
        ...(cvForm.linkedinUrl.trim()
          ? [{ type: 'LINKEDIN' as const, url: cvForm.linkedinUrl.trim() }]
          : []),
        ...(cvForm.githubUrl.trim()
          ? [{ type: 'GITHUB' as const, url: cvForm.githubUrl.trim() }]
          : []),
        ...(cvForm.portfolioUrl.trim()
          ? [{ type: 'PORTFOLIO' as const, url: cvForm.portfolioUrl.trim() }]
          : []),
      ],
    },
    currentRole: optionalText(cvForm.currentRole),
    summary: optionalText(cvForm.summary),
    skills: {
      technical: splitList(cvForm.technicalSkills),
      softSkills: splitList(cvForm.softSkills),
      languages: parseLanguages(cvForm.languages),
    },
    workExperience: cvForm.experience
      .filter((item) =>
        [
          item.company,
          item.position,
          item.startDate,
          item.endDate,
          item.achievements,
        ].some((value) => value.trim()),
      )
      .map((item) => ({
        company: optionalText(item.company),
        position: optionalText(item.position),
        startDate: optionalText(item.startDate),
        endDate: item.isCurrent ? null : optionalText(item.endDate),
        isCurrent: item.isCurrent,
        achievements: splitAchievements(item.achievements),
      })),
    education: cvForm.education
      .filter((item) =>
        [item.school, item.major, item.degree, item.startDate, item.endDate].some((value) =>
          value.trim(),
        ),
      )
      .map((item) => ({
        school: optionalText(item.school),
        major: optionalText(item.major),
        degree: optionalText(item.degree),
        startDate: optionalText(item.startDate),
        endDate: optionalText(item.endDate),
      })),
  });

  const saveCvForm = async (requireComplete = false) => {
    if (!cvForm.fullName.trim() || !cvForm.email.trim()) {
      setApiError('Full name and email are required');
      return false;
    }

    const validation = (requireComplete ? ResumeSchema : ResumeDraftSchema).safeParse(
      buildResumeInput(),
    );
    if (!validation.success) {
      const issue = validation.error.issues[0];
      setApiError(
        `${issue?.path.join('.') || 'CV'}: ${issue?.message || 'Invalid CV information'}`,
      );
      return false;
    }

    setSavingCv(true);
    setCvSaved(false);
    setApiError('');
    const resume = validation.data;
    const technicalSkills = resume.skills?.technical ?? [];
    const legacyExperience = cvForm.experience.map((item) => ({
      id: item.id,
      title: item.position.trim(),
      company: item.company.trim(),
      duration: formatExperienceDuration(item),
      description: item.achievements.trim(),
    }));
    const legacyEducation = cvForm.education.map((item) => ({
      id: item.id,
      degree: item.degree.trim(),
      school: item.school.trim(),
      year:
        item.startDate && item.endDate
          ? `${item.startDate} - ${item.endDate}`
          : item.endDate || item.startDate,
    }));
    const nextStructuredData = {
      ...existingStructuredData,
      resume,
      currentRole: cvForm.currentRole.trim(),
      location: cvForm.address.trim(),
      linkedinUrl: cvForm.linkedinUrl.trim(),
      skills: technicalSkills,
      experience: legacyExperience,
      education: legacyEducation,
    };

    try {
      await apiRequest('/candidate-profiles/me', token, {
        method: 'PATCH',
        body: JSON.stringify({
          fullName: cvForm.fullName.trim(),
          email: cvForm.email.trim(),
          phone: cvForm.phone.trim(),
          summary: cvForm.summary.trim(),
          structuredData: nextStructuredData,
        }),
      });
      setExistingStructuredData(nextStructuredData);
      setCvSaved(true);
      return true;
    } catch (saveError) {
      setApiError(saveError instanceof Error ? saveError.message : 'Unable to save CV form');
      return false;
    } finally {
      setSavingCv(false);
    }
  };

  const generateCv = async () => {
    const saved = await saveCvForm(true);
    if (saved) {
      window.setTimeout(() => window.print(), 150);
    }
  };

  const skillList = splitList(cvForm.technicalSkills);
  const softSkillList = splitList(cvForm.softSkills);
  const languageList = parseLanguages(cvForm.languages).map((language) =>
    language.proficiency ? `${language.name} (${language.proficiency})` : language.name,
  );

  if (view === 'builder') {
    return (
      <div className="mx-auto max-w-[1440px] space-y-6">
        <header className="print:hidden flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-teal-command">
              Candidate Portal
            </p>
            <h2 className="mt-2 text-3xl font-semibold tracking-tight text-deep-charcoal">
              Create Your CV
            </h2>
            <p className="mt-2 text-sm text-slate-ink">
              Complete the form, preview the result, then export it as PDF.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => setView('upload')}
              className="rounded-lg border border-border-warm bg-white px-4 py-2 text-sm font-semibold text-deep-charcoal hover:bg-surface-container-low"
            >
              Upload CV
            </button>
            <DownloadCvTemplateLink />
            <button
              type="button"
              disabled={savingCv}
              onClick={() => void saveCvForm()}
              className="rounded-lg border border-teal-command px-4 py-2 text-sm font-semibold text-teal-command hover:bg-teal-command/5 disabled:opacity-50"
            >
              {savingCv ? 'Saving...' : cvSaved ? 'Saved' : 'Save Draft'}
            </button>
            <button
              type="button"
              disabled={savingCv}
              onClick={() => void generateCv()}
              className="rounded-lg bg-teal-command px-5 py-2 text-sm font-semibold text-white hover:bg-primary disabled:opacity-50"
            >
              Generate PDF
            </button>
          </div>
        </header>

        {apiError ? (
          <p className="print:hidden rounded-lg border border-error/20 bg-error-container p-4 text-sm text-on-error-container">
            {apiError}
          </p>
        ) : null}

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(420px,0.82fr)]">
          <form
            className="print:hidden space-y-6 rounded-lg border border-border-warm bg-white p-6 shadow-sm"
            onSubmit={(event) => {
              event.preventDefault();
              void saveCvForm();
            }}
          >
            <CvSection title="Personal Information">
              <div className="grid gap-4 md:grid-cols-2">
                <CvInput
                  label="Full Name"
                  required
                  value={cvForm.fullName}
                  onChange={(value) => updateCvField('fullName', value)}
                />
                <CvInput
                  label="Professional Title"
                  value={cvForm.currentRole}
                  onChange={(value) => updateCvField('currentRole', value)}
                />
                <CvInput
                  label="Email"
                  required
                  type="email"
                  value={cvForm.email}
                  onChange={(value) => updateCvField('email', value)}
                />
                <CvInput
                  label="Phone"
                  value={cvForm.phone}
                  onChange={(value) => updateCvField('phone', value)}
                />
                <CvInput
                  label="Address / Location"
                  value={cvForm.address}
                  onChange={(value) => updateCvField('address', value)}
                />
                <CvInput
                  label="LinkedIn URL"
                  type="url"
                  value={cvForm.linkedinUrl}
                  onChange={(value) => updateCvField('linkedinUrl', value)}
                />
                <CvInput
                  label="GitHub URL"
                  type="url"
                  value={cvForm.githubUrl}
                  onChange={(value) => updateCvField('githubUrl', value)}
                />
                <CvInput
                  label="Portfolio URL"
                  type="url"
                  value={cvForm.portfolioUrl}
                  onChange={(value) => updateCvField('portfolioUrl', value)}
                />
              </div>
            </CvSection>

            <CvSection title="Professional Summary">
              <textarea
                rows={5}
                value={cvForm.summary}
                onChange={(event) => updateCvField('summary', event.target.value)}
                placeholder="Summarize your experience, strengths, and career goals."
                className="w-full rounded-lg border border-border-warm px-3 py-2 text-sm outline-none focus:border-teal-command focus:ring-2 focus:ring-teal-command/15"
              />
            </CvSection>

            <CvSection title="Skills">
              <div className="space-y-4">
                <label className="block">
                  <span className="mb-1.5 block text-xs font-semibold text-slate-ink">
                    Technical Skills
                  </span>
                  <textarea
                    rows={3}
                    value={cvForm.technicalSkills}
                    onChange={(event) => updateCvField('technicalSkills', event.target.value)}
                    placeholder="React, TypeScript, NestJS, Docker"
                    className="w-full rounded-lg border border-border-warm px-3 py-2 text-sm outline-none focus:border-teal-command focus:ring-2 focus:ring-teal-command/15"
                  />
                </label>
                <label className="block">
                  <span className="mb-1.5 block text-xs font-semibold text-slate-ink">
                    Soft Skills
                  </span>
                  <textarea
                    rows={2}
                    value={cvForm.softSkills}
                    onChange={(event) => updateCvField('softSkills', event.target.value)}
                    placeholder="Teamwork, Problem solving, Communication"
                    className="w-full rounded-lg border border-border-warm px-3 py-2 text-sm outline-none focus:border-teal-command focus:ring-2 focus:ring-teal-command/15"
                  />
                </label>
                <label className="block">
                  <span className="mb-1.5 block text-xs font-semibold text-slate-ink">
                    Languages
                  </span>
                  <textarea
                    rows={2}
                    value={cvForm.languages}
                    onChange={(event) => updateCvField('languages', event.target.value)}
                    placeholder="English | IELTS 7.0, Japanese | N3"
                    className="w-full rounded-lg border border-border-warm px-3 py-2 text-sm outline-none focus:border-teal-command focus:ring-2 focus:ring-teal-command/15"
                  />
                </label>
                <p className="text-xs text-on-surface-variant">
                  Separate entries with commas. Use "Language | Level" for languages.
                </p>
              </div>
            </CvSection>

            <CvSection
              title="Work Experience"
              actionLabel="Add Experience"
              onAction={addExperience}
            >
              <div className="space-y-4">
                {cvForm.experience.map((item) => (
                  <div
                    key={item.id}
                    className="space-y-3 rounded-lg border border-border-warm bg-workflow-ivory/40 p-4"
                  >
                    <div className="grid gap-3 md:grid-cols-2">
                      <CvInput
                        label="Position"
                        value={item.position}
                        onChange={(value) => updateExperience(item.id, 'position', value)}
                      />
                      <CvInput
                        label="Company"
                        value={item.company}
                        onChange={(value) => updateExperience(item.id, 'company', value)}
                      />
                      <CvInput
                        label="Start Month"
                        type="month"
                        value={item.startDate}
                        onChange={(value) => updateExperience(item.id, 'startDate', value)}
                      />
                      <CvInput
                        label="End Month"
                        type="month"
                        value={item.endDate}
                        onChange={(value) => updateExperience(item.id, 'endDate', value)}
                      />
                    </div>
                    <label className="flex items-center gap-2 text-xs font-semibold text-slate-ink">
                      <input
                        type="checkbox"
                        checked={item.isCurrent}
                        onChange={(event) => {
                          updateExperience(item.id, 'isCurrent', event.target.checked);
                          if (event.target.checked) {
                            updateExperience(item.id, 'endDate', '');
                          }
                        }}
                        className="h-4 w-4 rounded border-border-warm text-teal-command"
                      />
                      I currently work here
                    </label>
                    <textarea
                      rows={3}
                      value={item.achievements}
                      onChange={(event) =>
                        updateExperience(item.id, 'achievements', event.target.value)
                      }
                      placeholder="Enter one responsibility or measurable achievement per line."
                      className="w-full rounded-lg border border-border-warm px-3 py-2 text-sm outline-none focus:border-teal-command"
                    />
                    <button
                      type="button"
                      onClick={() => removeExperience(item.id)}
                      className="text-xs font-semibold text-rejected hover:underline"
                    >
                      Remove experience
                    </button>
                  </div>
                ))}
                {cvForm.experience.length === 0 ? (
                  <p className="text-sm text-on-surface-variant">No experience added yet.</p>
                ) : null}
              </div>
            </CvSection>

            <CvSection title="Education" actionLabel="Add Education" onAction={addEducation}>
              <div className="space-y-4">
                {cvForm.education.map((item) => (
                  <div
                    key={item.id}
                    className="grid gap-3 rounded-lg border border-border-warm bg-workflow-ivory/40 p-4 md:grid-cols-2"
                  >
                    <CvInput
                      label="School"
                      value={item.school}
                      onChange={(value) => updateEducation(item.id, 'school', value)}
                    />
                    <CvInput
                      label="Major"
                      value={item.major}
                      onChange={(value) => updateEducation(item.id, 'major', value)}
                    />
                    <CvInput
                      label="Degree"
                      value={item.degree}
                      onChange={(value) => updateEducation(item.id, 'degree', value)}
                    />
                    <CvInput
                      label="Start Month"
                      type="month"
                      value={item.startDate}
                      onChange={(value) => updateEducation(item.id, 'startDate', value)}
                    />
                    <CvInput
                      label="End Month"
                      type="month"
                      value={item.endDate}
                      onChange={(value) => updateEducation(item.id, 'endDate', value)}
                    />
                    <div className="flex items-end">
                      <button
                        type="button"
                        onClick={() => removeEducation(item.id)}
                        className="pb-2 text-xs font-semibold text-rejected hover:underline"
                      >
                        Remove education
                      </button>
                    </div>
                  </div>
                ))}
                {cvForm.education.length === 0 ? (
                  <p className="text-sm text-on-surface-variant">No education added yet.</p>
                ) : null}
              </div>
            </CvSection>
          </form>

          <CvPreview
            form={cvForm}
            skills={skillList}
            softSkills={softSkillList}
            languages={languageList}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[1440px]">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
        accept=".pdf,.docx"
      />

      {loading ? <p className="mb-4 text-sm text-slate-ink">Loading CV documents...</p> : null}
      {apiError ? (
        <p className="mb-4 rounded-lg border border-error/20 bg-error-container p-4 text-sm text-on-error-container">
          {apiError}
        </p>
      ) : null}

      <div className="grid grid-cols-12 gap-6 items-start">
        <div className="col-span-12 space-y-6">
          <section>
            <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <div>
                <h2 className="text-3xl font-semibold tracking-tight text-deep-charcoal">
                  Upload CV - Candidate
                </h2>
                <p className="text-base text-slate-ink mt-2">
                  Upload PDF or DOCX CV files and monitor parsing readiness.
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                <DownloadCvTemplateLink />
                <button
                  type="button"
                  onClick={() => setView('builder')}
                  className="rounded-lg bg-teal-command px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary"
                >
                  Create CV Form
                </button>
              </div>
            </div>
          </section>

          {/* Upload Card Dropzone */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={handleBrowseFiles}
            className={`bg-white border-dashed border-2 rounded-lg p-8 flex flex-col items-center justify-center transition-all group cursor-pointer ${
              isDragActive
                ? 'border-teal-command bg-teal-command/5 scale-[0.99]'
                : 'border-border-warm hover:border-teal-command/50'
            }`}
          >
            <div className="w-16 h-16 rounded-full bg-surface-container-low flex items-center justify-center text-teal-command mb-4 group-hover:scale-110 transition-transform">
              <Icons.uploadFile />
            </div>
            <h3 className="text-lg font-semibold text-deep-charcoal mb-1">
              Drag and drop your CV here
            </h3>
            <p className="text-xs text-on-surface-variant mb-6 text-center max-w-sm font-medium leading-relaxed">
              Support for PDF and DOCX files. Max file size: 10MB. Ensure your contact details and
              work history are clearly legible for best parsing results.
            </p>
            <div className="flex gap-3" onClick={(e) => e.stopPropagation()}>
              <button
                disabled={uploading}
                onClick={handleBrowseFiles}
                className="bg-teal-command text-white px-8 py-2.5 rounded-lg font-semibold text-sm active:scale-95 hover:bg-primary transition-all"
              >
                {uploading ? 'Uploading...' : 'Upload CV'}
              </button>
              <button
                onClick={handleBrowseFiles}
                className="border border-border-warm text-deep-charcoal px-8 py-2.5 rounded-lg font-semibold text-sm hover:bg-surface-container-low transition-colors"
              >
                Browse Files
              </button>
            </div>
          </div>

          {/* CV Table */}
          <div className="bg-white border border-border-warm rounded-lg overflow-hidden shadow-sm">
            <div className="px-6 py-4 border-b border-border-warm bg-surface-container-lowest flex justify-between items-center">
              <h3 className="text-sm font-bold text-deep-charcoal">Document History</h3>
              <span className="text-xs text-on-surface-variant font-medium">
                {documents.length} total documents
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-workflow-ivory text-on-surface-variant text-xs uppercase tracking-wider font-semibold border-b border-border-warm">
                    <th className="px-6 py-4">File Name</th>
                    <th className="px-6 py-4">Uploaded Date</th>
                    <th className="px-6 py-4">Parsing Status</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="text-xs text-deep-charcoal font-medium">
                  {documents.map((doc) => (
                    <tr
                      key={doc.id}
                      className="border-b border-border-warm hover:bg-teal-command/5 transition-colors group"
                    >
                      {/* Name */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <Icons.description />
                          <span className="font-semibold text-deep-charcoal">{doc.name}</span>
                        </div>
                      </td>

                      {/* Uploaded Date */}
                      <td className="px-6 py-4 text-on-surface-variant">{doc.uploadedDate}</td>

                      {/* Parsing Status */}
                      <td className="px-6 py-4">
                        {doc.parsingStatus === 'Ready' && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/50 text-[10px] font-bold">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span> Ready
                          </span>
                        )}
                        {doc.parsingStatus === 'Parsing...' && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200/50 text-[10px] font-bold">
                            <Icons.spinner /> Parsing...
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end">
                          <button
                            onClick={() => void handleDeleteDoc(doc.id)}
                            className="p-1 text-slate-ink hover:text-red-600"
                            title="Delete CV"
                          >
                            <Icons.delete />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {!loading && documents.length === 0 ? (
                    <tr>
                      <td
                        colSpan={4}
                        className="px-6 py-10 text-center text-sm text-on-surface-variant"
                      >
                        No CV documents uploaded yet.
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const CvSection = ({
  title,
  actionLabel,
  onAction,
  children,
}: {
  title: string;
  actionLabel?: string;
  onAction?: () => void;
  children: React.ReactNode;
}) => (
  <section>
    <div className="mb-4 flex items-center justify-between border-b border-border-warm pb-3">
      <h3 className="text-sm font-bold uppercase tracking-wider text-deep-charcoal">{title}</h3>
      {actionLabel && onAction ? (
        <button
          type="button"
          onClick={onAction}
          className="text-xs font-semibold text-teal-command hover:underline"
        >
          + {actionLabel}
        </button>
      ) : null}
    </div>
    {children}
  </section>
);

const DownloadCvTemplateLink = () => (
  <a
    href="/candidate-cv-template.doc"
    download="Candidate-CV-Template.doc"
    className="inline-flex items-center gap-2 rounded-lg border border-border-warm bg-white px-4 py-2 text-sm font-semibold text-deep-charcoal hover:border-teal-command hover:text-teal-command"
  >
    <Icons.download />
    Download CV Template
  </a>
);

const CvInput = ({
  label,
  value,
  onChange,
  required = false,
  type = 'text',
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  type?: string;
  placeholder?: string;
}) => (
  <label className="block">
    <span className="mb-1.5 block text-xs font-semibold text-slate-ink">
      {label}
      {required ? <span className="ml-1 text-rejected">*</span> : null}
    </span>
    <input
      required={required}
      type={type}
      value={value}
      placeholder={placeholder}
      onChange={(event) => onChange(event.target.value)}
      className="w-full rounded-lg border border-border-warm px-3 py-2 text-sm outline-none focus:border-teal-command focus:ring-2 focus:ring-teal-command/15"
    />
  </label>
);

const CvPreview = ({
  form,
  skills,
  softSkills,
  languages,
}: {
  form: CvFormData;
  skills: string[];
  softSkills: string[];
  languages: string[];
}) => (
  <article className="print:shadow-none print:border-0 min-h-[1040px] bg-white shadow-lg border border-border-warm">
    <header className="bg-deep-charcoal px-8 py-9 text-white">
      <h1 className="text-3xl font-bold tracking-tight">{form.fullName || 'Your Name'}</h1>
      <p className="mt-2 text-base font-medium text-white/80">
        {form.currentRole || 'Professional Title'}
      </p>
      <div className="mt-5 flex flex-wrap gap-x-5 gap-y-2 text-xs text-white/75">
        {form.email ? <span>{form.email}</span> : null}
        {form.phone ? <span>{form.phone}</span> : null}
        {form.address ? <span>{form.address}</span> : null}
        {form.linkedinUrl ? <span>{form.linkedinUrl}</span> : null}
      </div>
    </header>

    <div className="space-y-7 px-8 py-8 text-deep-charcoal">
      {form.summary ? (
        <PreviewSection title="Professional Summary">
          <p className="whitespace-pre-line text-sm leading-6 text-slate-ink">{form.summary}</p>
        </PreviewSection>
      ) : null}

      {skills.length > 0 ? (
        <PreviewSection title="Skills">
          <div className="flex flex-wrap gap-2">
            {skills.map((skill) => (
              <span
                key={skill}
                className="rounded bg-teal-command/10 px-2.5 py-1 text-xs font-semibold text-teal-command"
              >
                {skill}
              </span>
            ))}
          </div>
        </PreviewSection>
      ) : null}

      {softSkills.length > 0 ? (
        <PreviewSection title="Soft Skills">
          <p className="text-sm leading-6 text-slate-ink">{softSkills.join(', ')}</p>
        </PreviewSection>
      ) : null}

      {languages.length > 0 ? (
        <PreviewSection title="Languages">
          <p className="text-sm leading-6 text-slate-ink">{languages.join(', ')}</p>
        </PreviewSection>
      ) : null}

      {form.experience.length > 0 ? (
        <PreviewSection title="Work Experience">
          <div className="space-y-5">
            {form.experience.map((item) => (
              <div key={item.id}>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="text-sm font-bold">{item.position || 'Job Title'}</h3>
                    <p className="mt-0.5 text-sm font-medium text-teal-command">
                      {item.company || 'Company'}
                    </p>
                  </div>
                  <span className="shrink-0 text-xs font-semibold text-on-surface-variant">
                    {formatExperienceDuration(item)}
                  </span>
                </div>
                {item.achievements ? (
                  <p className="mt-2 whitespace-pre-line text-sm leading-6 text-slate-ink">
                    {item.achievements}
                  </p>
                ) : null}
              </div>
            ))}
          </div>
        </PreviewSection>
      ) : null}

      {form.education.length > 0 ? (
        <PreviewSection title="Education">
          <div className="space-y-4">
            {form.education.map((item) => (
              <div className="flex items-start justify-between gap-4" key={item.id}>
                <div>
                  <h3 className="text-sm font-bold">{item.degree || 'Degree'}</h3>
                  <p className="mt-0.5 text-sm text-slate-ink">
                    {[item.school || 'School', item.major].filter(Boolean).join(' - ')}
                  </p>
                </div>
                <span className="text-xs font-semibold text-on-surface-variant">
                  {[item.startDate, item.endDate].filter(Boolean).join(' - ')}
                </span>
              </div>
            ))}
          </div>
        </PreviewSection>
      ) : null}

      {!form.summary &&
      skills.length === 0 &&
      softSkills.length === 0 &&
      languages.length === 0 &&
      form.experience.length === 0 &&
      form.education.length === 0 ? (
        <div className="flex min-h-[520px] items-center justify-center text-center text-sm text-on-surface-variant">
          Complete the form to generate your CV preview.
        </div>
      ) : null}
    </div>
  </article>
);

const PreviewSection = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <section>
    <h2 className="mb-3 border-b-2 border-teal-command pb-2 text-xs font-bold uppercase tracking-[0.18em] text-deep-charcoal">
      {title}
    </h2>
    {children}
  </section>
);
