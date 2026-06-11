import React, { useEffect, useRef, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { apiRequest } from '../lib/api';

// SVG Icons definition to match high-fidelity design without depending on external fonts
const Icons = {
  verified: () => (
    <svg className="w-4 h-4 text-emerald-600 fill-current" viewBox="0 0 20 20">
      <path
        fillRule="evenodd"
        d="M6.267 3.455a.75.75 0 0 0-.708-.523H4.5a2.5 2.5 0 0 0-2.5 2.5v1.059a.75.75 0 0 0 .523.708 3.502 3.502 0 0 1 2.477 2.477.75.75 0 0 0 .708.523h1.059a2.5 2.5 0 0 0 2.5-2.5V6.657a.75.75 0 0 0-.523-.708 3.502 3.502 0 0 1-2.477-2.477Zm8.223.708a.75.75 0 0 0-.708-.523h-1.059a2.5 2.5 0 0 0-2.5 2.5v1.059a.75.75 0 0 0 .523.708 3.502 3.502 0 0 1 2.477 2.477.75.75 0 0 0 .708.523h1.059a2.5 2.5 0 0 0 2.5-2.5V6.657a.75.75 0 0 0-.523-.708 3.502 3.502 0 0 1-2.477-2.477ZM3.455 13.733a.75.75 0 0 0-.523-.708H1.873a.75.75 0 0 0-.523.708 2.5 2.5 0 0 0 2.5 2.5h1.059a.75.75 0 0 0 .708-.523 3.502 3.502 0 0 1 2.477-2.477.75.75 0 0 0 .523-.708V11.43a2.5 2.5 0 0 0-2.5-2.5H2.382a.75.75 0 0 0-.708.523 3.502 3.502 0 0 1-2.477 2.477.75.75 0 0 0-.523.708v1.059a2.5 2.5 0 0 0 2.5 2.5h1.059a.75.75 0 0 0 .708-.523 3.502 3.502 0 0 1 2.477-2.477Z"
        clipRule="evenodd"
      />
      <path
        d="m7.25 9.75 2 2 4.5-4.5"
        stroke="white"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  ),
  camera: () => (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="shrink-0 text-on-surface-variant group-hover:text-teal-command"
    >
      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
      <circle cx="12" cy="13" r="4" />
    </svg>
  ),
  checkCircle: () => (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="text-emerald-600"
    >
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  ),
  add: () => (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  ),
  edit: () => (
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
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
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
  apartment: () => (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="text-on-surface-variant"
    >
      <rect x="4" y="2" width="16" height="20" rx="2" ry="2" />
      <line x1="9" y1="22" x2="9" y2="16" />
      <line x1="15" y1="22" x2="15" y2="16" />
      <line x1="9" y1="16" x2="15" y2="16" />
      <path d="M8 6h.01M16 6h.01M8 10h.01M16 10h.01M12 6h.01M12 10h.01M8 14h.01M16 14h.01M12 14h.01" />
    </svg>
  ),
  visibility: () => (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="text-on-surface-variant"
    >
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  ),
  info: () => (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="text-cyan-600"
    >
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="16" x2="12" y2="12" />
      <line x1="12" y1="8" x2="12.01" y2="8" />
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
      className="text-teal-command"
    >
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  ),
  spinner: () => (
    <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  ),
  check: () => (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="text-white"
    >
      <polyline points="20 6 9 17 5 12" />
    </svg>
  ),
};

interface WorkExperience {
  id: string;
  title: string;
  company: string;
  duration: string;
  description: string;
}

interface Education {
  id: string;
  degree: string;
  school: string;
  year: string;
}

export const CandidateProfile: React.FC = () => {
  const { token } = useAuth();
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const avatarObjectUrlRef = useRef<string | null>(null);
  // Core Profile Info State
  const [fullName, setFullName] = useState('');
  const [currentRole, setCurrentRole] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [location, setLocation] = useState('');
  const [linkedinUrl, setLinkedinUrl] = useState('');
  const [summary, setSummary] = useState('');

  // Visibility States
  const [visibleToRecruiters, setVisibleToRecruiters] = useState(true);
  const [openToNewOpportunities, setOpenToNewOpportunities] = useState(true);

  // Work Experience State
  const [experience, setExperience] = useState<WorkExperience[]>([]);

  // Education State
  const [education, setEducation] = useState<Education[]>([]);

  // Skills State
  const [skills, setSkills] = useState<string[]>([]);

  // Helper States for adding/editing items
  const [isAddingExperience, setIsAddingExperience] = useState(false);
  const [editingExperienceId, setEditingExperienceId] = useState<string | null>(null);
  const [expForm, setExpForm] = useState<Omit<WorkExperience, 'id'>>({
    title: '',
    company: '',
    duration: '',
    description: '',
  });

  const [isAddingEducation, setIsAddingEducation] = useState(false);
  const [editingEducationId, setEditingEducationId] = useState<string | null>(null);
  const [eduForm, setEduForm] = useState<Omit<Education, 'id'>>({
    degree: '',
    school: '',
    year: '',
  });

  const [newSkill, setNewSkill] = useState('');
  const [isEditingSkills, setIsEditingSkills] = useState(false);

  // Profile Save State
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState('');
  const [lastUpdated, setLastUpdated] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [avatarUploading, setAvatarUploading] = useState(false);

  const clearAvatarPreview = () => {
    if (avatarObjectUrlRef.current) {
      URL.revokeObjectURL(avatarObjectUrlRef.current);
      avatarObjectUrlRef.current = null;
    }
    setAvatarUrl('');
  };

  const showAvatarPreview = (blob: Blob) => {
    clearAvatarPreview();
    const objectUrl = URL.createObjectURL(blob);
    avatarObjectUrlRef.current = objectUrl;
    setAvatarUrl(objectUrl);
  };

  const loadAvatar = async () => {
    const headers = new Headers();
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }

    const response = await fetch('/api/v1/candidate-profiles/me/avatar', {
      headers,
      cache: 'no-store',
    });
    if (response.status === 404) {
      clearAvatarPreview();
      return;
    }
    if (!response.ok) {
      throw new Error(`Unable to load profile photo (${response.status})`);
    }

    showAvatarPreview(await response.blob());
  };

  useEffect(() => {
    type ProfileResponse = {
      fullName: string;
      email: string;
      phone?: string | null;
      summary?: string | null;
      structuredData?: {
        currentRole?: string;
        location?: string;
        linkedinUrl?: string;
        visibility?: string;
        openToNewOpportunities?: boolean;
        experience?: WorkExperience[];
        education?: Education[];
        skills?: string[];
        avatar?: {
          fileName: string;
          mimeType: string;
          updatedAt: string;
        };
      } | null;
      updatedAt: string;
    };

    const loadProfile = async () => {
      try {
        const profile = await apiRequest<ProfileResponse>('/candidate-profiles/me', token);
        const data = profile.structuredData ?? {};
        setFullName(profile.fullName);
        setEmail(profile.email);
        setPhone(profile.phone ?? '');
        setSummary(profile.summary ?? '');
        setCurrentRole(data.currentRole ?? '');
        setLocation(data.location ?? '');
        setLinkedinUrl(data.linkedinUrl ?? '');
        setVisibleToRecruiters(data.visibility !== 'PRIVATE');
        setOpenToNewOpportunities(data.openToNewOpportunities ?? true);
        setExperience(data.experience ?? []);
        setEducation(data.education ?? []);
        setSkills(data.skills ?? []);
        setLastUpdated(new Date(profile.updatedAt).toLocaleDateString());
        if (data.avatar) {
          await loadAvatar();
        } else {
          clearAvatarPreview();
        }
      } catch (loadError) {
        setApiError(loadError instanceof Error ? loadError.message : 'Unable to load profile');
      } finally {
        setLoading(false);
      }
    };

    void loadProfile();
  }, [token]);

  useEffect(
    () => () => {
      if (avatarObjectUrlRef.current) {
        URL.revokeObjectURL(avatarObjectUrlRef.current);
      }
    },
    [],
  );

  // Calculates profile completeness dynamically
  const calculateCompleteness = () => {
    let score = 70; // Base score for fundamental items already set
    if (fullName) score += 5;
    if (currentRole) score += 5;
    if (phone) score += 5;
    if (location) score += 5;
    if (linkedinUrl) score += 10;
    return Math.min(score, 100);
  };

  const completeness = calculateCompleteness();

  // Handle Save Action
  const handleSave = async () => {
    setSaveStatus('saving');
    setApiError('');
    try {
      const updated = await apiRequest<{ updatedAt: string }>('/candidate-profiles/me', token, {
        method: 'PATCH',
        body: JSON.stringify({
          fullName,
          email,
          phone,
          summary,
          structuredData: {
            currentRole,
            location,
            linkedinUrl,
            visibility: visibleToRecruiters ? 'REGISTERED_ONLY' : 'PRIVATE',
            openToNewOpportunities,
            experience,
            education,
            skills,
          },
        }),
      });
      setSaveStatus('saved');
      setLastUpdated(new Date(updated.updatedAt).toLocaleDateString());
      window.setTimeout(() => setSaveStatus('idle'), 2000);
    } catch (saveError) {
      setSaveStatus('idle');
      setApiError(saveError instanceof Error ? saveError.message : 'Unable to save profile');
    }
  };

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const supportedTypes = ['image/jpeg', 'image/png', 'image/gif'];
    if (!supportedTypes.includes(file.type)) {
      setApiError('Please choose a JPG, PNG, or GIF image.');
      event.target.value = '';
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setApiError('Profile photo must be 5 MB or smaller.');
      event.target.value = '';
      return;
    }

    setAvatarUploading(true);
    setApiError('');
    const formData = new FormData();
    formData.append('file', file);

    try {
      const result = await apiRequest<{ updatedAt: string }>(
        '/candidate-profiles/me/avatar',
        token,
        {
          method: 'POST',
          body: formData,
        },
      );
      await loadAvatar();
      window.dispatchEvent(new Event('avatar-updated'));
      setLastUpdated(new Date(result.updatedAt).toLocaleDateString());
    } catch (uploadError) {
      setApiError(
        uploadError instanceof Error ? uploadError.message : 'Unable to upload profile photo',
      );
    } finally {
      setAvatarUploading(false);
      event.target.value = '';
    }
  };

  const handleAvatarDelete = async () => {
    setAvatarUploading(true);
    setApiError('');

    try {
      const result = await apiRequest<{ updatedAt: string }>(
        '/candidate-profiles/me/avatar',
        token,
        { method: 'DELETE' },
      );
      clearAvatarPreview();
      window.dispatchEvent(new Event('avatar-updated'));
      setLastUpdated(new Date(result.updatedAt).toLocaleDateString());
    } catch (deleteError) {
      setApiError(
        deleteError instanceof Error ? deleteError.message : 'Unable to remove profile photo',
      );
    } finally {
      setAvatarUploading(false);
    }
  };

  // Experience Handlers
  const handleAddExperience = () => {
    if (!expForm.title || !expForm.company) return;
    setExperience([
      ...experience,
      {
        ...expForm,
        id: `exp-${Date.now()}`,
      },
    ]);
    setExpForm({ title: '', company: '', duration: '', description: '' });
    setIsAddingExperience(false);
  };

  const handleEditExperience = (exp: WorkExperience) => {
    setEditingExperienceId(exp.id);
    setExpForm({
      title: exp.title,
      company: exp.company,
      duration: exp.duration,
      description: exp.description,
    });
  };

  const handleUpdateExperience = () => {
    if (!editingExperienceId) return;
    setExperience(
      experience.map((exp) =>
        exp.id === editingExperienceId ? { ...expForm, id: editingExperienceId } : exp,
      ),
    );
    setEditingExperienceId(null);
    setExpForm({ title: '', company: '', duration: '', description: '' });
  };

  const handleDeleteExperience = (id: string) => {
    setExperience(experience.filter((exp) => exp.id !== id));
  };

  // Education Handlers
  const handleAddEducation = () => {
    if (!eduForm.degree || !eduForm.school) return;
    setEducation([
      ...education,
      {
        ...eduForm,
        id: `edu-${Date.now()}`,
      },
    ]);
    setEduForm({ degree: '', school: '', year: '' });
    setIsAddingEducation(false);
  };

  const handleEditEducation = (edu: Education) => {
    setEditingEducationId(edu.id);
    setEduForm({
      degree: edu.degree,
      school: edu.school,
      year: edu.year,
    });
  };

  const handleUpdateEducation = () => {
    if (!editingEducationId) return;
    setEducation(
      education.map((edu) =>
        edu.id === editingEducationId ? { ...eduForm, id: editingEducationId } : edu,
      ),
    );
    setEditingEducationId(null);
    setEduForm({ degree: '', school: '', year: '' });
  };

  const handleDeleteEducation = (id: string) => {
    setEducation(education.filter((edu) => edu.id !== id));
  };

  // Skill Handlers
  const handleAddSkill = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSkill.trim() || skills.includes(newSkill.trim())) return;
    setSkills([...skills, newSkill.trim()]);
    setNewSkill('');
  };

  const handleDeleteSkill = (skillToDelete: string) => {
    setSkills(skills.filter((s) => s !== skillToDelete));
  };

  return (
    <div className="mx-auto max-w-[1440px]">
      {/* Header */}
      <header className="mb-8">
        <h1 className="text-3xl font-semibold tracking-tight text-deep-charcoal mb-2">
          My Profile - Candidate
        </h1>
        <p className="text-base text-slate-ink">
          Keep contact details and career information current for active applications.
        </p>
      </header>

      {loading ? <p className="mb-6 text-sm text-slate-ink">Loading profile...</p> : null}
      {apiError ? (
        <p className="mb-6 rounded-lg border border-error/20 bg-error-container p-4 text-sm text-on-error-container">
          {apiError}
        </p>
      ) : null}

      <div className="grid grid-cols-12 gap-6 items-start pb-20">
        {/* Left & Middle: Main Profile Data */}
        <div className="col-span-12 lg:col-span-8 space-y-6">
          {/* Profile Completeness Card */}
          <section className="bg-white border border-border-warm p-6 shadow-sm rounded-lg">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <h2 className="text-lg font-semibold text-deep-charcoal">Profile Completeness</h2>
                <span
                  className={`flex items-center px-2.5 py-0.5 text-xs font-semibold rounded-full ${
                    completeness === 100
                      ? 'bg-emerald-50 text-emerald-700'
                      : 'bg-cyan-50 text-cyan-700'
                  }`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full mr-1.5 ${
                      completeness === 100 ? 'bg-emerald-600' : 'bg-cyan-600'
                    }`}
                  ></span>
                  {completeness === 100 ? 'Complete' : 'Almost there'}
                </span>
              </div>
              <div className="flex items-center text-xs font-semibold text-slate-ink gap-1">
                <Icons.verified />
                <span>Identity Verified</span>
              </div>
            </div>
            <div className="relative w-full h-3 bg-surface-container-low rounded-full overflow-hidden">
              <div
                className="absolute top-0 left-0 h-full bg-teal-command transition-all duration-500 rounded-full"
                style={{ width: `${completeness}%` }}
              ></div>
            </div>
            <div className="flex justify-between items-center mt-3 text-xs text-on-surface-variant font-medium">
              <span>
                {completeness === 100
                  ? 'Your profile is fully complete! Thank you.'
                  : `${completeness}% complete — Add your LinkedIn URL to reach 100%`}
              </span>
              <span>Last updated: {lastUpdated || 'Not available'}</span>
            </div>
          </section>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Personal Information Card */}
            <section className="bg-white border border-border-warm p-6 shadow-sm rounded-lg">
              <h3 className="text-lg font-semibold text-deep-charcoal mb-6 border-b border-border-warm pb-2">
                Personal Information
              </h3>
              <div className="space-y-6">
                <div className="flex items-center space-x-6">
                  <input
                    ref={avatarInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/gif"
                    className="hidden"
                    onChange={(event) => void handleAvatarUpload(event)}
                  />
                  <button
                    type="button"
                    disabled={avatarUploading}
                    onClick={() => avatarInputRef.current?.click()}
                    className="relative w-20 h-20 overflow-hidden bg-workflow-ivory border-2 border-dashed border-border-warm rounded-lg flex flex-col items-center justify-center cursor-pointer hover:bg-surface-container-low transition-colors group disabled:cursor-wait"
                    aria-label={avatarUrl ? 'Change profile photo' : 'Upload profile photo'}
                  >
                    {avatarUrl ? (
                      <img
                        src={avatarUrl}
                        alt={`${fullName || 'Candidate'} profile`}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <>
                        <Icons.camera />
                        <span className="text-[10px] mt-1 font-semibold text-on-surface-variant">
                          Upload
                        </span>
                      </>
                    )}
                    {avatarUploading ? (
                      <span className="absolute inset-0 flex items-center justify-center bg-deep-charcoal/60">
                        <Icons.spinner />
                      </span>
                    ) : null}
                  </button>
                  <div className="flex-1">
                    <p className="text-xs font-semibold mb-1 text-deep-charcoal">Profile Photo</p>
                    <p className="text-xs text-on-surface-variant">JPG, PNG or GIF. Max 5MB.</p>
                    <div className="mt-2 flex items-center gap-3">
                      <button
                        type="button"
                        disabled={avatarUploading}
                        onClick={() => avatarInputRef.current?.click()}
                        className="text-xs font-semibold text-teal-command hover:underline disabled:opacity-50"
                      >
                        {avatarUrl ? 'Change photo' : 'Choose photo'}
                      </button>
                      {avatarUrl ? (
                        <button
                          type="button"
                          disabled={avatarUploading}
                          onClick={() => void handleAvatarDelete()}
                          className="text-xs font-semibold text-error hover:underline disabled:opacity-50"
                        >
                          Remove
                        </button>
                      ) : null}
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-deep-charcoal mb-2">
                      Full Name
                    </label>
                    <input
                      className="w-full text-sm border border-border-warm rounded-lg p-2.5 focus:ring-2 focus:ring-teal-command focus:border-transparent bg-white outline-none"
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-deep-charcoal mb-2">
                      Current Role
                    </label>
                    <input
                      className="w-full text-sm border border-border-warm rounded-lg p-2.5 focus:ring-2 focus:ring-teal-command focus:border-transparent bg-white outline-none"
                      type="text"
                      value={currentRole}
                      onChange={(e) => setCurrentRole(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-deep-charcoal mb-2">
                      Professional Summary
                    </label>
                    <textarea
                      className="w-full min-h-24 resize-y text-sm border border-border-warm rounded-lg p-2.5 focus:ring-2 focus:ring-teal-command focus:border-transparent bg-white outline-none"
                      value={summary}
                      onChange={(e) => setSummary(e.target.value)}
                      placeholder="Briefly describe your experience and career goals"
                    />
                  </div>
                </div>
              </div>
            </section>

            {/* Contact Details Card */}
            <section className="bg-white border border-border-warm p-6 shadow-sm rounded-lg">
              <h3 className="text-lg font-semibold text-deep-charcoal mb-6 border-b border-border-warm pb-2">
                Contact Details
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-deep-charcoal mb-2">
                    Email Address
                  </label>
                  <div className="relative">
                    <input
                      className="w-full text-sm border border-border-warm rounded-lg p-2.5 pr-10 focus:ring-2 focus:ring-teal-command focus:border-transparent bg-white outline-none"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center">
                      <Icons.checkCircle />
                    </span>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-deep-charcoal mb-2">
                    Phone Number
                  </label>
                  <input
                    className="w-full text-sm border border-border-warm rounded-lg p-2.5 focus:ring-2 focus:ring-teal-command focus:border-transparent bg-white outline-none"
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-deep-charcoal mb-2">
                      Location
                    </label>
                    <input
                      className="w-full text-sm border border-border-warm rounded-lg p-2.5 focus:ring-2 focus:ring-teal-command focus:border-transparent bg-white outline-none"
                      type="text"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-deep-charcoal mb-2">
                      LinkedIn URL
                    </label>
                    <input
                      className="w-full text-sm border border-border-warm rounded-lg p-2.5 focus:ring-2 focus:ring-teal-command focus:border-transparent bg-white outline-none"
                      placeholder="linkedin.com/in/user"
                      type="url"
                      value={linkedinUrl}
                      onChange={(e) => setLinkedinUrl(e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </section>
          </div>

          {/* Work Experience Card */}
          <section className="bg-white border border-border-warm p-6 shadow-sm rounded-lg">
            <div className="flex justify-between items-center mb-6 border-b border-border-warm pb-2">
              <h3 className="text-lg font-semibold text-deep-charcoal">Work Experience</h3>
              {!isAddingExperience && editingExperienceId === null && (
                <button
                  onClick={() => setIsAddingExperience(true)}
                  className="text-teal-command font-semibold text-sm flex items-center hover:underline gap-1"
                >
                  <Icons.add /> Add Role
                </button>
              )}
            </div>

            {/* Experience List / Form */}
            <div className="space-y-6">
              {(isAddingExperience || editingExperienceId !== null) && (
                <div className="bg-workflow-ivory p-4 rounded-lg border border-border-warm space-y-4 mb-4">
                  <h4 className="text-sm font-semibold text-deep-charcoal">
                    {editingExperienceId ? 'Edit Work Experience' : 'Add Work Experience'}
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-ink mb-1">
                        Job Title
                      </label>
                      <input
                        type="text"
                        className="w-full text-sm border border-border-warm rounded bg-white p-2 outline-none focus:ring-1 focus:ring-teal-command"
                        placeholder="e.g. Lead Designer"
                        value={expForm.title}
                        onChange={(e) => setExpForm({ ...expForm, title: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-ink mb-1">
                        Company / Organization
                      </label>
                      <input
                        type="text"
                        className="w-full text-sm border border-border-warm rounded bg-white p-2 outline-none focus:ring-1 focus:ring-teal-command"
                        placeholder="e.g. Acme Corp"
                        value={expForm.company}
                        onChange={(e) => setExpForm({ ...expForm, company: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-ink mb-1">
                        Duration
                      </label>
                      <input
                        type="text"
                        className="w-full text-sm border border-border-warm rounded bg-white p-2 outline-none focus:ring-1 focus:ring-teal-command"
                        placeholder="e.g. Jan 2023 — Present"
                        value={expForm.duration}
                        onChange={(e) => setExpForm({ ...expForm, duration: e.target.value })}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-ink mb-1">
                      Description
                    </label>
                    <textarea
                      className="w-full text-sm border border-border-warm rounded bg-white p-2 outline-none focus:ring-1 focus:ring-teal-command h-24"
                      placeholder="Describe your responsibilities and achievements..."
                      value={expForm.description}
                      onChange={(e) => setExpForm({ ...expForm, description: e.target.value })}
                    />
                  </div>
                  <div className="flex justify-end space-x-3 pt-2">
                    <button
                      onClick={() => {
                        setIsAddingExperience(false);
                        setEditingExperienceId(null);
                        setExpForm({ title: '', company: '', duration: '', description: '' });
                      }}
                      className="px-4 py-2 border border-border-warm rounded text-sm text-slate-ink bg-white hover:bg-surface-container-low transition"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={editingExperienceId ? handleUpdateExperience : handleAddExperience}
                      className="px-4 py-2 bg-teal-command text-white rounded text-sm hover:bg-primary transition"
                    >
                      {editingExperienceId ? 'Update Role' : 'Add Role'}
                    </button>
                  </div>
                </div>
              )}

              {experience.map((exp) => (
                <div className="flex group relative" key={exp.id}>
                  <div className="flex flex-col items-center mr-6 shrink-0">
                    <div className="w-10 h-10 rounded-lg bg-surface-container-high border border-border-warm flex items-center justify-center mb-2">
                      <Icons.apartment />
                    </div>
                    <div className="w-px h-full bg-border-warm"></div>
                  </div>
                  <div className="pb-6 flex-1 pr-12">
                    <h4 className="text-base font-semibold text-deep-charcoal">{exp.title}</h4>
                    <p className="text-sm font-semibold text-teal-command mb-2">
                      {exp.company} • {exp.duration}
                    </p>
                    <p className="text-sm text-on-surface-variant leading-relaxed">
                      {exp.description}
                    </p>
                  </div>

                  {/* Actions (visible on hover) */}
                  <div className="opacity-0 group-hover:opacity-100 absolute right-0 top-0 flex space-x-2 transition-opacity">
                    <button
                      onClick={() => handleEditExperience(exp)}
                      className="text-on-surface-variant hover:text-teal-command p-1 rounded hover:bg-surface-container-low"
                      title="Edit"
                    >
                      <Icons.edit />
                    </button>
                    <button
                      onClick={() => handleDeleteExperience(exp.id)}
                      className="text-on-surface-variant hover:text-red-600 p-1 rounded hover:bg-red-50"
                      title="Delete"
                    >
                      <Icons.delete />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Education & Skills Side-by-Side */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Education Card */}
            <section className="bg-white border border-border-warm p-6 shadow-sm rounded-lg">
              <div className="flex justify-between items-center mb-6 border-b border-border-warm pb-2">
                <h3 className="text-lg font-semibold text-deep-charcoal">Education</h3>
                {!isAddingEducation && editingEducationId === null && (
                  <button
                    onClick={() => setIsAddingEducation(true)}
                    className="text-teal-command font-semibold text-sm flex items-center hover:underline"
                  >
                    <Icons.add />
                  </button>
                )}
              </div>

              <div className="space-y-4">
                {(isAddingEducation || editingEducationId !== null) && (
                  <div className="bg-workflow-ivory p-3 rounded border border-border-warm space-y-3 mb-2">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-ink mb-1">
                        Degree / Certificate
                      </label>
                      <input
                        type="text"
                        className="w-full text-xs border border-border-warm rounded bg-white p-2 outline-none"
                        placeholder="e.g. MA Digital Design"
                        value={eduForm.degree}
                        onChange={(e) => setEduForm({ ...eduForm, degree: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-ink mb-1">
                        School / University
                      </label>
                      <input
                        type="text"
                        className="w-full text-xs border border-border-warm rounded bg-white p-2 outline-none"
                        placeholder="e.g. Royal College of Art"
                        value={eduForm.school}
                        onChange={(e) => setEduForm({ ...eduForm, school: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-ink mb-1">
                        Graduation Year
                      </label>
                      <input
                        type="text"
                        className="w-full text-xs border border-border-warm rounded bg-white p-2 outline-none"
                        placeholder="e.g. 2018"
                        value={eduForm.year}
                        onChange={(e) => setEduForm({ ...eduForm, year: e.target.value })}
                      />
                    </div>
                    <div className="flex justify-end space-x-2 pt-1">
                      <button
                        onClick={() => {
                          setIsAddingEducation(false);
                          setEditingEducationId(null);
                          setEduForm({ degree: '', school: '', year: '' });
                        }}
                        className="px-2.5 py-1 border border-border-warm rounded text-xs"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={editingEducationId ? handleUpdateEducation : handleAddEducation}
                        className="px-2.5 py-1 bg-teal-command text-white rounded text-xs hover:bg-primary"
                      >
                        Save
                      </button>
                    </div>
                  </div>
                )}

                {education.map((edu) => (
                  <div
                    className="flex justify-between items-start group relative pr-8"
                    key={edu.id}
                  >
                    <div>
                      <h4 className="text-sm font-semibold text-deep-charcoal">{edu.degree}</h4>
                      <p className="text-xs text-on-surface-variant font-medium mt-0.5">
                        {edu.school}, {edu.year}
                      </p>
                    </div>

                    <div className="opacity-0 group-hover:opacity-100 absolute right-0 top-1/2 -translate-y-1/2 flex space-x-1 transition-opacity">
                      <button
                        onClick={() => handleEditEducation(edu)}
                        className="text-on-surface-variant hover:text-teal-command p-1 rounded hover:bg-surface-container-low"
                      >
                        <Icons.edit />
                      </button>
                      <button
                        onClick={() => handleDeleteEducation(edu.id)}
                        className="text-on-surface-variant hover:text-red-600 p-1 rounded hover:bg-red-50"
                      >
                        <Icons.delete />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Skills Card */}
            <section className="bg-white border border-border-warm p-6 shadow-sm rounded-lg">
              <div className="flex justify-between items-center mb-6 border-b border-border-warm pb-2">
                <h3 className="text-lg font-semibold text-deep-charcoal">Skills</h3>
                <button
                  onClick={() => setIsEditingSkills(!isEditingSkills)}
                  className="text-teal-command font-semibold text-sm flex items-center hover:underline"
                >
                  <Icons.edit />
                </button>
              </div>

              {isEditingSkills && (
                <form onSubmit={handleAddSkill} className="flex gap-2 mb-4">
                  <input
                    type="text"
                    className="flex-1 text-xs border border-border-warm rounded bg-white p-2 outline-none focus:ring-1 focus:ring-teal-command"
                    placeholder="Type new skill and hit enter"
                    value={newSkill}
                    onChange={(e) => setNewSkill(e.target.value)}
                  />
                  <button
                    type="submit"
                    className="px-3 py-1 bg-teal-command text-white rounded text-xs hover:bg-primary font-semibold"
                  >
                    Add
                  </button>
                </form>
              )}

              <div className="flex flex-wrap gap-2">
                {skills.map((skill) => (
                  <span
                    key={skill}
                    className="inline-flex items-center gap-1 px-3 py-1 bg-surface-container-low border border-border-warm rounded-lg text-xs font-semibold text-on-surface-variant"
                  >
                    {skill}
                    {isEditingSkills && (
                      <button
                        type="button"
                        onClick={() => handleDeleteSkill(skill)}
                        className="text-slate-ink hover:text-red-600 ml-1 rounded-full flex items-center justify-center hover:bg-surface-container-high w-4 h-4 text-[9px]"
                      >
                        ✕
                      </button>
                    )}
                  </span>
                ))}
              </div>
            </section>
          </div>
        </div>

        {/* Right: Utility Panel */}
        <aside className="col-span-12 lg:col-span-4 space-y-6">
          {/* Application Visibility Settings */}
          <section className="bg-white border border-border-warm p-6 shadow-sm rounded-lg">
            <h3 className="text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-6 flex items-center">
              <Icons.visibility />
              <span className="ml-2">Visibility Settings</span>
            </h3>
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-deep-charcoal">Visible to Recruiters</p>
                  <p className="text-xs text-on-surface-variant font-medium">
                    Allow HR teams to find your profile
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={visibleToRecruiters}
                    onChange={(e) => setVisibleToRecruiters(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-surface-container-high peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-teal-command"></div>
                </label>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-deep-charcoal">
                    Open to New Opportunities
                  </p>
                  <p className="text-xs text-on-surface-variant font-medium">
                    Signals active interest in new roles
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={openToNewOpportunities}
                    onChange={(e) => setOpenToNewOpportunities(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-surface-container-high peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-teal-command"></div>
                </label>
              </div>
            </div>
          </section>

          {/* Privacy Note */}
          <div className="bg-surface-container-low border border-border-warm p-6 flex items-start space-x-3 rounded-lg">
            <span className="shrink-0">
              <Icons.info />
            </span>
            <div>
              <p className="text-xs font-bold text-deep-charcoal">Privacy Note</p>
              <p className="text-xs text-on-surface-variant font-medium mt-1 leading-relaxed">
                Internal HR notes and screening criteria are never visible to candidates. Your
                private data is encrypted and secure.
              </p>
            </div>
          </div>

          {/* Profile Audit Summary */}
          <section className="bg-white border border-border-warm p-6 shadow-sm rounded-lg">
            <h3 className="text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-4">
              Profile Audit
            </h3>
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <div className="w-1.5 h-1.5 rounded-full bg-teal-command mt-2 shrink-0"></div>
                <div>
                  <p className="text-xs text-deep-charcoal font-medium">Work experience updated</p>
                  <p className="text-[10px] text-on-surface-variant uppercase font-semibold">
                    May 29, 2026 • 14:22
                  </p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-1.5 h-1.5 rounded-full bg-border-warm mt-2 shrink-0"></div>
                <div>
                  <p className="text-xs text-deep-charcoal font-medium">Skills tags modified</p>
                  <p className="text-[10px] text-on-surface-variant uppercase font-semibold">
                    May 24, 2026 • 09:10
                  </p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-1.5 h-1.5 rounded-full bg-border-warm mt-2 shrink-0"></div>
                <div>
                  <p className="text-xs text-deep-charcoal font-medium">Phone number verified</p>
                  <p className="text-[10px] text-on-surface-variant uppercase font-semibold">
                    May 20, 2026 • 16:45
                  </p>
                </div>
              </div>
            </div>
          </section>
        </aside>
      </div>

      {/* Bottom Actions Bar */}
      <div className="fixed bottom-0 left-[260px] right-0 p-4 bg-workflow-ivory/80 backdrop-blur-sm border-t border-border-warm flex items-center justify-between px-8 z-30">
        <div className="flex items-center space-x-6">
          <a
            className="text-teal-command font-semibold text-xs hover:underline flex items-center gap-1.5"
            href="#export"
          >
            <Icons.download />
            Request Data Export
          </a>
        </div>
        <div className="flex items-center space-x-4">
          <button className="px-5 py-2 text-xs font-semibold bg-surface-container-high text-on-surface-variant rounded-lg hover:bg-surface-container-highest transition-colors active:scale-[0.98]">
            Preview Profile
          </button>

          <button
            disabled={loading || saveStatus === 'saving'}
            onClick={() => void handleSave()}
            className="inline-flex items-center justify-center min-w-36 h-9 px-6 bg-teal-command text-white rounded-lg font-semibold text-xs hover:bg-primary shadow-lg shadow-teal-command/10 transition-all active:scale-[0.98]"
            id="save-changes-btn"
          >
            {saveStatus === 'idle' && 'Save Changes'}
            {saveStatus === 'saving' && <Icons.spinner />}
            {saveStatus === 'saved' && (
              <span className="flex items-center gap-1.5">
                <Icons.check /> Changes Saved
              </span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
