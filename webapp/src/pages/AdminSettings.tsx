import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { apiRequest } from '../lib/api';

interface Department {
  id?: string;
  name: string;
  code: string;
  head: string;
  headUserId?: string;
  headcount: number;
  activeRequests: number;
}

interface PipelineStage {
  name: string;
  color: string;
}

const defaultDepartments: Department[] = [
  {
    name: 'IT & Engineering',
    code: 'ENG',
    head: 'Nguyen Van A',
    headcount: 15,
    activeRequests: 3,
  },
  {
    name: 'Marketing',
    code: 'MARKETING',
    head: 'Tran Thi B',
    headcount: 8,
    activeRequests: 0,
  },
  {
    name: 'Human Resources',
    code: 'HR',
    head: 'Le Van C',
    headcount: 5,
    activeRequests: 1,
  },
  {
    name: 'Finance',
    code: 'FINANCE',
    head: 'Pham Van D',
    headcount: 10,
    activeRequests: 0,
  },
];

void defaultDepartments;

const defaultStages: PipelineStage[] = [
  { name: 'Application Received', color: 'bg-blue-500' },
  { name: 'Resume Screening', color: 'bg-cyan-500' },
  { name: 'Technical Assessment', color: 'bg-amber-500' },
  { name: 'Onboarding', color: 'bg-teal-command' },
];

export const AdminSettings: React.FC = () => {
  const { token } = useAuth();
  // Organization States
  const [organizationId, setOrganizationId] = useState('');
  const [orgName, setOrgName] = useState('');
  const [orgCode, setOrgCode] = useState('');
  const [industry, setIndustry] = useState('Information Technology');
  const [orgSize, setOrgSize] = useState('201-500 employees');
  const [logoUrl, setLogoUrl] = useState(
    'https://lh3.googleusercontent.com/aida-public/AB6AXBKIWziYFI2f30JGLWZLz7T_wVjimcKWVHMmtsvMkfoHEldDaGfgCfgVZJXmzebuiG6fPfWhkykmBw6Ylcam_o1bphMSdQrNH0F1GlVFFCHTmnnAmz2nQg_ANkCMisECS19Eq-ki0nYqBoo8t8AEkXneZbpguANpUA8g7M-cpzcwpsQ5N82H_T9-d5gQbtf5pg9lDyd0B6VGPK_E1DZcQ2_70N6Je3mWOkrR-NdyZ_zo1Emx9PxT7JNOyzNOnj7zscbs0LwRouLzP8',
  );
  const [storedSettings, setStoredSettings] = useState<Record<string, unknown>>({});
  const [departmentHeads, setDepartmentHeads] = useState<Array<{ id: string; name: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [apiError, setApiError] = useState('');

  // Department Management
  const [departments, setDepartments] = useState<Department[]>([]);
  const [deptModalOpen, setDeptModalOpen] = useState(false);
  const [editingDeptIdx, setEditingDeptIdx] = useState<number | null>(null);
  const [deptForm, setDeptForm] = useState<Department>({
    name: '',
    code: '',
    head: '',
    headcount: 0,
    activeRequests: 0,
  });

  // Workflow Configuration
  const [budgetJustification, setBudgetJustification] = useState(true);
  const [autoApproveLow, setAutoApproveLow] = useState(false);
  const [requireVpExecutive, setRequireVpExecutive] = useState(true);
  const [enableMultiLevel, setEnableMultiLevel] = useState(false);

  // Pipeline Stages
  const [pipelineStages, setPipelineStages] = useState<PipelineStage[]>(defaultStages);
  const [stageModalOpen, setStageModalOpen] = useState(false);
  const [stageForm, setStageForm] = useState<PipelineStage>({ name: '', color: 'bg-blue-500' });

  // Page level alerts & notifications
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  type OrganizationResponse = {
    id: string;
    name: string;
    slug: string;
    settings?: {
      industry?: string;
      orgSize?: string;
      logoUrl?: string;
      approvalWorkflow?: {
        budgetJustification?: boolean;
        autoApproveLow?: boolean;
        requireVpExecutive?: boolean;
        enableMultiLevel?: boolean;
      };
      pipelineStages?: PipelineStage[];
    };
  };

  type DepartmentResponse = {
    id: string;
    name: string;
    code: string;
    headUserId?: string | null;
    headUser?: { displayName: string } | null;
    _count?: { users: number; requests: number };
  };

  const loadDepartments = async (orgId: string) => {
    const response = await apiRequest<DepartmentResponse[]>(
      `/departments?organizationId=${encodeURIComponent(orgId)}`,
      token,
    );
    setDepartments(
      response.map((department) => ({
        id: department.id,
        name: department.name,
        code: department.code,
        head: department.headUser?.displayName ?? 'Not assigned',
        headUserId: department.headUserId ?? undefined,
        headcount: department._count?.users ?? 0,
        activeRequests: department._count?.requests ?? 0,
      })),
    );
  };

  const loadSettings = async () => {
    setLoading(true);
    setApiError('');
    try {
      const organizations = await apiRequest<OrganizationResponse[]>('/organizations', token);
      const organization = organizations[0];
      if (!organization) {
        throw new Error('No organization is available');
      }

      const [heads] = await Promise.all([
        apiRequest<{
          data: Array<{ id: string; displayName: string }>;
        }>('/users?role=DEPARTMENT_HEAD&limit=100', token),
        loadDepartments(organization.id),
      ]);

      const workflow = organization.settings?.approvalWorkflow ?? {};
      setOrganizationId(organization.id);
      setStoredSettings(organization.settings ?? {});
      setOrgName(organization.name);
      setOrgCode(organization.slug);
      setIndustry(organization.settings?.industry ?? 'Information Technology');
      setOrgSize(organization.settings?.orgSize ?? '201-500 employees');
      setLogoUrl(organization.settings?.logoUrl ?? '');
      setBudgetJustification(workflow.budgetJustification ?? true);
      setAutoApproveLow(workflow.autoApproveLow ?? false);
      setRequireVpExecutive(workflow.requireVpExecutive ?? true);
      setEnableMultiLevel(workflow.enableMultiLevel ?? false);
      setPipelineStages(organization.settings?.pipelineStages ?? defaultStages);
      setDepartmentHeads(heads.data.map((head) => ({ id: head.id, name: head.displayName })));
    } catch (loadError) {
      setApiError(loadError instanceof Error ? loadError.message : 'Unable to load settings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadSettings();
  }, [token]);

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const saveOrganizationSettings = async () => {
    if (!organizationId) {
      throw new Error('No organization is available');
    }

    await apiRequest(`/organizations/${organizationId}`, token, {
      method: 'PATCH',
      body: JSON.stringify({
        name: orgName,
        settings: {
          ...storedSettings,
          industry,
          orgSize,
          logoUrl,
          approvalWorkflow: {
            budgetJustification,
            autoApproveLow,
            requireVpExecutive,
            enableMultiLevel,
          },
          pipelineStages,
        },
      }),
    });
  };

  // Profile Save
  const handleSaveProfile = async () => {
    setSaving(true);
    setApiError('');
    try {
      await saveOrganizationSettings();
      triggerToast('Organization profile changes saved successfully.');
    } catch (saveError) {
      setApiError(saveError instanceof Error ? saveError.message : 'Unable to save organization');
    } finally {
      setSaving(false);
    }
  };

  // Save All settings
  const handleSaveAllSettings = async () => {
    setSaving(true);
    setApiError('');
    try {
      await saveOrganizationSettings();
      triggerToast('All system configurations saved successfully.');
    } catch (saveError) {
      setApiError(saveError instanceof Error ? saveError.message : 'Unable to save settings');
    } finally {
      setSaving(false);
    }
  };

  // Discard draft settings
  const handleDiscardChanges = async () => {
    await loadSettings();
    triggerToast('Draft configuration settings discarded.');
  };

  // Department CRUD
  const openAddDeptModal = () => {
    setEditingDeptIdx(null);
    setDeptForm({
      name: '',
      code: '',
      head: '',
      headUserId: undefined,
      headcount: 0,
      activeRequests: 0,
    });
    setDeptModalOpen(true);
  };

  const openEditDeptModal = (idx: number) => {
    setEditingDeptIdx(idx);
    setDeptForm({ ...departments[idx] });
    setDeptModalOpen(true);
  };

  const handleSaveDept = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!deptForm.name.trim() || !deptForm.code.trim() || !organizationId) return;

    setApiError('');
    try {
      if (editingDeptIdx !== null && deptForm.id) {
        await apiRequest(`/departments/${deptForm.id}`, token, {
          method: 'PATCH',
          body: JSON.stringify({
            name: deptForm.name,
            code: deptForm.code.toUpperCase(),
            headUserId: deptForm.headUserId ?? null,
          }),
        });
        triggerToast(`Department "${deptForm.name}" updated.`);
      } else {
        await apiRequest('/departments', token, {
          method: 'POST',
          body: JSON.stringify({
            organizationId,
            name: deptForm.name,
            code: deptForm.code.toUpperCase(),
            headUserId: deptForm.headUserId,
          }),
        });
        triggerToast(`Department "${deptForm.name}" added.`);
      }
      await loadDepartments(organizationId);
      setDeptModalOpen(false);
    } catch (saveError) {
      setApiError(saveError instanceof Error ? saveError.message : 'Unable to save department');
    }
  };

  const handleDeleteDept = async (idx: number) => {
    const department = departments[idx];
    if (!department?.id || !organizationId) return;

    setApiError('');
    try {
      await apiRequest(`/departments/${department.id}`, token, { method: 'DELETE' });
      await loadDepartments(organizationId);
      triggerToast(`Department "${department.name}" deleted.`);
    } catch (deleteError) {
      setApiError(
        deleteError instanceof Error ? deleteError.message : 'Unable to delete department',
      );
    }
  };

  // Pipeline Stage CRUD
  const openAddStageModal = () => {
    setStageForm({ name: '', color: 'bg-blue-500' });
    setStageModalOpen(true);
  };

  const handleSaveStage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!stageForm.name.trim()) return;

    setPipelineStages((prev) => [...prev, { ...stageForm }]);
    setStageModalOpen(false);
    triggerToast(`Pipeline stage "${stageForm.name}" added.`);
  };

  const handleDeleteStage = (idx: number) => {
    const name = pipelineStages[idx].name;
    setPipelineStages((prev) => prev.filter((_, i) => i !== idx));
    triggerToast(`Pipeline stage "${name}" deleted.`);
  };

  // Workflow visual steps
  const workflowSteps = [
    { title: 'Request Created', subtitle: 'Initiator Action', icon: 'add_box' },
    { title: 'Dept Head Review', subtitle: 'Internal Verification', icon: 'rule' },
    { title: 'Admin Approval', subtitle: 'Final Validation', icon: 'verified_user' },
    { title: 'HR Plan Creation', subtitle: 'Execution Phase', icon: 'assignment_turned_in' },
  ];

  return (
    <div className="p-0 max-w-[1440px] mx-auto space-y-8 pb-24">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed top-20 right-8 z-50 bg-teal-command text-white px-6 py-3.5 rounded-lg shadow-lg flex items-center gap-2 transition-all transform animate-bounce">
          <span className="material-symbols-outlined">check_circle</span>
          <span className="text-sm font-semibold">{toastMessage}</span>
        </div>
      )}
      {apiError ? (
        <div className="rounded-lg border border-error/20 bg-error-container p-4 text-sm text-on-error-container">
          {apiError}
        </div>
      ) : null}
      {loading ? <p className="text-sm text-secondary">Loading organization settings...</p> : null}

      {/* Sub Header / Action Header */}
      <div className="flex justify-between items-center mb-margin-lg">
        <div>
          <div className="flex items-center text-secondary font-label-md text-label-md">
            <span>Director Portal</span>
            <span className="material-symbols-outlined text-[16px] mx-2">chevron_right</span>
            <span className="text-on-surface font-semibold">Settings</span>
          </div>
          <h2 className="font-headline-xl text-headline-xl text-on-surface font-semibold mt-2">
            Organization Configuration Settings
          </h2>
          <p className="font-body-md text-body-md text-secondary mt-1">
            Configure your corporate identity, department hierarchy, and global approval protocols.
          </p>
        </div>
        <button
          disabled={loading || saving}
          onClick={() => void handleSaveAllSettings()}
          className="bg-teal-command text-white px-6 py-2.5 rounded-lg font-label-md text-label-md hover:opacity-90 transition-all active:opacity-80 flex items-center gap-2"
        >
          <span className="material-symbols-outlined text-lg">save</span>
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>

      <div className="grid grid-cols-12 gap-6">
        {/* 1. Organization Profile */}
        <section className="col-span-12 lg:col-span-5 bg-clean-surface p-margin-md rounded-lg border border-border-warm shadow-sm flex flex-col h-full">
          <div className="flex items-center gap-2 mb-6">
            <span className="material-symbols-outlined text-teal-command">corporate_fare</span>
            <h3 className="font-headline-md text-headline-md font-semibold">
              Organization Profile
            </h3>
          </div>
          <div className="space-y-5 flex-1">
            <div className="flex gap-6 mb-6">
              <div className="relative group">
                <div className="w-24 h-24 bg-surface-container-low rounded-lg border-2 border-dashed border-border-warm flex flex-col items-center justify-center cursor-pointer hover:border-teal-command transition-colors overflow-hidden">
                  <span className="material-symbols-outlined text-outline-variant mb-1">
                    add_photo_alternate
                  </span>
                  <span className="text-[10px] font-label-sm text-secondary">Upload Logo</span>
                  {logoUrl && (
                    <img
                      alt="Organization Logo"
                      className="absolute inset-0 w-full h-full object-contain bg-white p-2"
                      src={logoUrl}
                    />
                  )}
                </div>
              </div>
              <div className="flex-1 space-y-4">
                <div>
                  <label className="block font-label-md text-label-md text-on-surface-variant mb-1.5">
                    Organization Name
                  </label>
                  <input
                    className="w-full px-4 py-2.5 bg-white border border-border-warm rounded-lg text-body-md focus:ring-2 focus:ring-teal-command focus:border-teal-command outline-none text-on-surface"
                    type="text"
                    value={orgName}
                    onChange={(e) => setOrgName(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block font-label-md text-label-md text-on-surface-variant mb-1.5">
                    Organization Code
                  </label>
                  <input
                    className="w-full px-4 py-2.5 bg-surface-container-low border border-border-warm rounded-lg text-data-mono font-data-mono text-secondary cursor-not-allowed"
                    readOnly
                    type="text"
                    value={orgCode}
                  />
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block font-label-md text-label-md text-on-surface-variant mb-1.5">
                  Industry
                </label>
                <select
                  className="w-full px-4 py-2.5 bg-white border border-border-warm rounded-lg text-body-md focus:ring-2 focus:ring-teal-command focus:border-teal-command outline-none text-on-surface"
                  value={industry}
                  onChange={(e) => setIndustry(e.target.value)}
                >
                  <option value="Information Technology">Information Technology</option>
                  <option value="Financial Services">Financial Services</option>
                  <option value="Healthcare">Healthcare</option>
                  <option value="Logistics">Logistics</option>
                </select>
              </div>
              <div>
                <label className="block font-label-md text-label-md text-on-surface-variant mb-1.5">
                  Size
                </label>
                <select
                  className="w-full px-4 py-2.5 bg-white border border-border-warm rounded-lg text-body-md focus:ring-2 focus:ring-teal-command focus:border-teal-command outline-none text-on-surface"
                  value={orgSize}
                  onChange={(e) => setOrgSize(e.target.value)}
                >
                  <option value="1-50 employees">1-50 employees</option>
                  <option value="51-200 employees">51-200 employees</option>
                  <option value="201-500 employees">201-500 employees</option>
                  <option value="500+ employees">500+ employees</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block font-label-md text-label-md text-on-surface-variant mb-1.5">
                Organization Logo URL
              </label>
              <input
                className="w-full px-4 py-2.5 bg-white border border-border-warm rounded-lg text-body-md focus:ring-2 focus:ring-teal-command focus:border-teal-command outline-none text-on-surface"
                type="url"
                value={logoUrl}
                onChange={(e) => setLogoUrl(e.target.value)}
                placeholder="https://example.com/logo.png"
              />
            </div>
          </div>
          <div className="mt-8 pt-6 border-t border-border-warm flex justify-end">
            <button
              disabled={loading || saving}
              onClick={() => void handleSaveProfile()}
              className="bg-teal-command text-white px-6 py-2.5 rounded-lg font-label-md text-label-md hover:opacity-90 transition-colors shadow-sm"
            >
              {saving ? 'Saving...' : 'Save Profile Changes'}
            </button>
          </div>
        </section>

        {/* 2. Department Management */}
        <section className="col-span-12 lg:col-span-7 bg-clean-surface p-margin-md rounded-lg border border-border-warm shadow-sm flex flex-col h-full">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-teal-command">domain</span>
              <h3 className="font-headline-md text-headline-md font-semibold">
                Department Management
              </h3>
            </div>
            <button
              onClick={openAddDeptModal}
              className="border border-teal-command text-teal-command px-4 py-1.5 rounded-lg font-label-md text-label-md hover:bg-teal-command/5 transition-colors flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-[18px]">add</span>
              Add Department
            </button>
          </div>
          <div className="flex-1 overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-surface-container-low border-b border-border-warm">
                  <th className="px-4 py-3 font-label-md text-label-md text-secondary">
                    Department Name
                  </th>
                  <th className="px-4 py-3 font-label-md text-label-md text-secondary">Head</th>
                  <th className="px-4 py-3 font-label-md text-label-md text-secondary text-center">
                    Headcount
                  </th>
                  <th className="px-4 py-3 font-label-md text-label-md text-secondary text-center">
                    Active Requests
                  </th>
                  <th className="px-4 py-3 font-label-md text-label-md text-secondary text-right">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-warm/50 text-on-surface">
                {departments.map((dept, idx) => (
                  <tr
                    className={`hover:bg-teal-command/5 transition-colors group ${
                      idx % 2 === 1 ? 'bg-workflow-ivory' : ''
                    }`}
                    key={dept.name}
                  >
                    <td className="px-4 py-3.5 font-body-md text-body-md font-medium">
                      {dept.name}
                    </td>
                    <td className="px-4 py-3.5 font-body-md text-body-md">{dept.head}</td>
                    <td className="px-4 py-3.5 font-data-mono text-data-mono text-center">
                      {dept.headcount}
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[12px] font-medium border ${
                          dept.activeRequests > 0
                            ? 'bg-pending/10 text-pending border-pending/20'
                            : 'bg-approved/10 text-approved border-approved/20'
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full mr-1.5 ${
                            dept.activeRequests > 0 ? 'bg-pending' : 'bg-approved'
                          }`}
                        ></span>
                        {dept.activeRequests}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-right whitespace-nowrap">
                      <button
                        onClick={() => openEditDeptModal(idx)}
                        className="text-outline-variant hover:text-teal-command transition-colors px-1"
                      >
                        <span className="material-symbols-outlined text-lg">edit</span>
                      </button>
                      <button
                        onClick={() => handleDeleteDept(idx)}
                        className="text-outline-variant hover:text-error transition-colors px-1"
                      >
                        <span className="material-symbols-outlined text-lg">delete</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* 3. Approval Workflow Configuration */}
        <section className="col-span-12 bg-clean-surface p-margin-md rounded-lg border border-border-warm shadow-sm">
          <div className="flex items-center gap-2 mb-8">
            <span className="material-symbols-outlined text-teal-command">account_tree</span>
            <h3 className="font-headline-md text-headline-md font-semibold">
              Approval Workflow Configuration
            </h3>
          </div>
          <div className="bg-workflow-ivory rounded-lg p-8 mb-8 border border-border-warm/50 relative overflow-hidden">
            <div
              className="absolute inset-0 opacity-[0.03] pointer-events-none"
              style={{
                backgroundImage: 'radial-gradient(#0D9488 1px, transparent 1px)',
                backgroundSize: '20px 20px',
              }}
            ></div>
            <div className="flex flex-col md:flex-row items-center justify-between gap-8 md:gap-4 relative z-1">
              {workflowSteps.map((step, index) => (
                <div
                  className="flex flex-col items-center gap-3 relative flex-1 w-full md:w-auto"
                  key={step.title}
                >
                  <div className="w-14 h-14 rounded-full bg-white border-2 border-teal-command flex items-center justify-center text-teal-command shadow-sm">
                    <span className="material-symbols-outlined text-[28px]">{step.icon}</span>
                  </div>
                  <div className="text-center">
                    <p className="font-label-md text-label-md font-semibold">{step.title}</p>
                    <p className="font-label-sm text-label-sm text-secondary">{step.subtitle}</p>
                  </div>
                  {index < workflowSteps.length - 1 && (
                    <span className="material-symbols-outlined text-[20px] text-outline select-none hidden md:inline absolute right-[-24px] top-1/2 -translate-y-1/2">
                      arrow_forward
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                label: 'Require budget justification for 3+ positions',
                val: budgetJustification,
                set: setBudgetJustification,
              },
              {
                label: 'Auto-approve low-priority requests',
                val: autoApproveLow,
                set: setAutoApproveLow,
              },
              {
                label: 'Require VP approval for executive hires',
                val: requireVpExecutive,
                set: setRequireVpExecutive,
              },
              {
                label: 'Enable multi-level sub-departments',
                val: enableMultiLevel,
                set: setEnableMultiLevel,
              },
            ].map((toggle, idx) => (
              <div
                className={`flex items-center justify-between p-4 bg-workflow-ivory rounded-lg border transition-all duration-200 ${
                  toggle.val ? 'border-teal-command/30' : 'border-border-warm'
                }`}
                key={idx}
              >
                <span className="font-label-md text-label-md pr-4 text-on-surface">
                  {toggle.label}
                </span>
                <button
                  type="button"
                  onClick={() => toggle.set(!toggle.val)}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    toggle.val ? 'bg-teal-command' : 'bg-surface-container-highest'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                      toggle.val ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            ))}
          </div>
        </section>

        {/* 4. Recruitment Pipeline Stages */}
        <section className="col-span-12 bg-clean-surface p-margin-md rounded-lg border border-border-warm shadow-sm mb-12">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-teal-command">view_kanban</span>
              <h3 className="font-headline-md text-headline-md font-semibold">
                Recruitment Pipeline Stages
              </h3>
            </div>
            <button
              onClick={openAddStageModal}
              className="bg-surface-variant text-on-surface-variant px-4 py-1.5 rounded-lg font-label-md text-label-md hover:bg-surface-container-highest transition-colors flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-[18px]">add</span>
              Add Stage
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {pipelineStages.map((stage, idx) => (
              <div
                className="flex items-center gap-3 p-3 bg-workflow-ivory border border-border-warm rounded-lg group hover:border-teal-command/50 transition-all text-on-surface"
                key={stage.name}
              >
                <span className="material-symbols-outlined text-outline-variant transition-colors select-none">
                  drag_indicator
                </span>
                <div className={`w-3 h-3 rounded-full ${stage.color}`}></div>
                <span className="font-body-md text-body-md flex-1 font-semibold">{stage.name}</span>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => handleDeleteStage(idx)}
                    className="p-1 hover:text-error transition-colors"
                  >
                    <span className="material-symbols-outlined text-[18px]">delete</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* Sticky Footer Action */}
      <footer className="fixed bottom-0 right-0 left-0 md:left-[260px] bg-white border-t border-border-warm px-margin-lg py-4 flex justify-between items-center z-10 shadow-[0_-4px_12px_rgba(0,0,0,0.03)] text-on-surface">
        <div className="flex items-center gap-2 text-secondary font-label-md">
          <span className="material-symbols-outlined text-[18px]">info</span>
          Changes are automatically saved in draft mode.
        </div>
        <div className="flex items-center gap-4">
          <button
            disabled={loading || saving}
            onClick={() => void handleDiscardChanges()}
            className="px-6 py-2.5 rounded-lg font-label-md text-label-md text-secondary hover:bg-surface-variant transition-colors"
          >
            Discard Draft
          </button>
          <button
            disabled={loading || saving}
            onClick={() => void handleSaveAllSettings()}
            className="bg-teal-command text-white px-10 py-2.5 rounded-lg font-semibold text-label-md hover:opacity-90 transition-all shadow-md flex items-center gap-2 active:scale-95"
          >
            <span className="material-symbols-outlined">save</span>
            {saving ? 'Saving...' : 'Save All Settings'}
          </button>
        </div>
      </footer>

      {/* Department Add/Edit Modal */}
      {deptModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(28,25,23,0.42)] px-4 py-6 text-on-surface">
          <div className="w-full max-w-[480px] rounded-xl border border-border-warm bg-clean-surface shadow-xl overflow-hidden">
            <div className="flex items-start justify-between gap-4 border-b border-border-warm p-6">
              <h2 className="text-lg font-bold text-deep-charcoal">
                {editingDeptIdx !== null ? 'Edit Department' : 'Add Department'}
              </h2>
              <button
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-border-warm bg-white text-slate-ink hover:text-rejected"
                onClick={() => setDeptModalOpen(false)}
              >
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            </div>
            <form onSubmit={handleSaveDept} className="space-y-4 p-6">
              <label className="block space-y-1.5">
                <span className="text-sm font-semibold text-deep-charcoal">Department Name</span>
                <input
                  required
                  className="w-full px-3 py-2 bg-workflow-ivory border border-border-warm rounded-lg text-sm outline-none focus:ring-2 focus:ring-teal-command/20"
                  value={deptForm.name}
                  onChange={(e) => setDeptForm({ ...deptForm, name: e.target.value })}
                />
              </label>
              <label className="block space-y-1.5">
                <span className="text-sm font-semibold text-deep-charcoal">Department Code</span>
                <input
                  required
                  className="w-full px-3 py-2 bg-workflow-ivory border border-border-warm rounded-lg text-sm outline-none focus:ring-2 focus:ring-teal-command/20"
                  value={deptForm.code}
                  onChange={(e) => setDeptForm({ ...deptForm, code: e.target.value.toUpperCase() })}
                />
              </label>
              <label className="block space-y-1.5">
                <span className="text-sm font-semibold text-deep-charcoal">Department Head</span>
                <select
                  className="w-full px-3 py-2 bg-workflow-ivory border border-border-warm rounded-lg text-sm outline-none focus:ring-2 focus:ring-teal-command/20"
                  value={deptForm.headUserId ?? ''}
                  onChange={(e) => {
                    const selected = departmentHeads.find((head) => head.id === e.target.value);
                    setDeptForm({
                      ...deptForm,
                      headUserId: selected?.id,
                      head: selected?.name ?? '',
                    });
                  }}
                >
                  <option value="">Not assigned</option>
                  {departmentHeads.map((head) => (
                    <option key={head.id} value={head.id}>
                      {head.name}
                    </option>
                  ))}
                </select>
              </label>
              <div className="grid grid-cols-2 gap-4">
                <label className="block space-y-1.5">
                  <span className="text-sm font-semibold text-deep-charcoal">Current Users</span>
                  <input
                    readOnly
                    className="w-full px-3 py-2 bg-surface-container-low border border-border-warm rounded-lg text-sm outline-none"
                    value={deptForm.headcount}
                  />
                </label>
                <label className="block space-y-1.5">
                  <span className="text-sm font-semibold text-deep-charcoal">Active Requests</span>
                  <input
                    readOnly
                    className="w-full px-3 py-2 bg-surface-container-low border border-border-warm rounded-lg text-sm outline-none"
                    value={deptForm.activeRequests}
                  />
                </label>
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t border-border-warm">
                <button
                  type="button"
                  onClick={() => setDeptModalOpen(false)}
                  className="px-4 py-2 border border-border-warm rounded-lg text-sm text-slate-ink"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-teal-command text-white px-5 py-2 rounded-lg text-sm font-semibold"
                >
                  {editingDeptIdx !== null ? 'Save Changes' : 'Add Department'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Pipeline Stage Add Modal */}
      {stageModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(28,25,23,0.42)] px-4 py-6 text-on-surface">
          <div className="w-full max-w-[400px] rounded-xl border border-border-warm bg-clean-surface shadow-xl overflow-hidden">
            <div className="flex items-start justify-between gap-4 border-b border-border-warm p-6">
              <h2 className="text-lg font-bold text-deep-charcoal">Add Recruitment Stage</h2>
              <button
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-border-warm bg-white text-slate-ink hover:text-rejected"
                onClick={() => setStageModalOpen(false)}
              >
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            </div>
            <form onSubmit={handleSaveStage} className="space-y-4 p-6">
              <label className="block space-y-1.5">
                <span className="text-sm font-semibold text-deep-charcoal">Stage Name</span>
                <input
                  required
                  className="w-full px-3 py-2 bg-workflow-ivory border border-border-warm rounded-lg text-sm outline-none focus:ring-2 focus:ring-teal-command/20"
                  value={stageForm.name}
                  onChange={(e) => setStageForm({ ...stageForm, name: e.target.value })}
                />
              </label>
              <label className="block space-y-1.5">
                <span className="text-sm font-semibold text-deep-charcoal">Theme Color</span>
                <select
                  className="w-full px-3 py-2 bg-workflow-ivory border border-border-warm rounded-lg text-sm outline-none text-on-surface"
                  value={stageForm.color}
                  onChange={(e) => setStageForm({ ...stageForm, color: e.target.value })}
                >
                  <option value="bg-blue-500">Blue</option>
                  <option value="bg-cyan-500">Cyan</option>
                  <option value="bg-amber-500">Amber</option>
                  <option value="bg-teal-command">Teal</option>
                  <option value="bg-rejected">Red</option>
                  <option value="bg-approved">Green</option>
                </select>
              </label>
              <div className="flex justify-end gap-3 pt-4 border-t border-border-warm">
                <button
                  type="button"
                  onClick={() => setStageModalOpen(false)}
                  className="px-4 py-2 border border-border-warm rounded-lg text-sm text-slate-ink"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-teal-command text-white px-5 py-2 rounded-lg text-sm font-semibold"
                >
                  Add Stage
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
