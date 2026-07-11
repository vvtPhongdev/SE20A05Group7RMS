export type EmploymentType = 'Full-time' | 'Contract';
export type RequestTemplateKey = 'engineering' | 'marketing' | 'sales' | 'general';

export type TemplateFieldType = 'text' | 'textarea' | 'select';

export interface TemplateFieldDefinition {
  key: string;
  label: string;
  type: TemplateFieldType;
  required?: boolean;
  placeholder?: string;
  options?: string[];
  defaultValue?: string;
}

export interface DepartmentRequestTemplate {
  key: RequestTemplateKey;
  name: string;
  description: string;
  matchers: string[];
  defaultPositionTitle: string;
  defaultJobLevel: string;
  defaultEmploymentType: EmploymentType;
  defaultExperience: string;
  defaultEducation: string;
  defaultSkills: string[];
  skillOptions: string[];
  jobLevelOptions: string[];
  employmentTypeOptions: EmploymentType[];
  experienceOptions: string[];
  fields: TemplateFieldDefinition[];
}

const NO_EXPERIENCE_OPTION = 'No experience (Intern)';

const normalize = (value?: string | null) =>
  (value ?? '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ');

export const DEPARTMENT_REQUEST_TEMPLATES: DepartmentRequestTemplate[] = [
  {
    key: 'engineering',
    name: 'Engineering Request Template',
    description: 'Technical hiring fields for product, platform, and software delivery roles.',
    matchers: ['engineering', 'eng', 'technology', 'software'],
    defaultPositionTitle: 'Senior Backend Platform Engineer',
    defaultJobLevel: 'Senior',
    defaultEmploymentType: 'Full-time',
    defaultExperience: '3-5 years',
    defaultEducation: "Bachelor's in Computer Science or equivalent",
    defaultSkills: ['React', 'TypeScript', 'Node.js'],
    skillOptions: [
      'React',
      'TypeScript',
      'Node.js',
      'JavaScript',
      'Python',
      'Java',
      'PostgreSQL',
      'Docker',
      'AWS',
      'REST APIs',
      'GraphQL',
      'System Design',
      'CI/CD',
      'Git',
    ],
    jobLevelOptions: ['Junior', 'Mid', 'Senior', 'Lead', 'Principal'],
    employmentTypeOptions: ['Full-time', 'Contract'],
    experienceOptions: [NO_EXPERIENCE_OPTION, '1-3 years', '3-5 years', '5+ years', '8+ years'],
    fields: [
      {
        key: 'techStack',
        label: 'Primary Tech Stack',
        type: 'select',
        required: true,
        options: ['Frontend', 'Backend', 'Full-stack', 'Mobile', 'Data', 'DevOps'],
        defaultValue: 'Full-stack',
      },
      {
        key: 'systemScope',
        label: 'Product / System Scope',
        type: 'text',
        required: true,
        placeholder: 'e.g. ATS workflow, candidate portal, reporting platform',
      },
      {
        key: 'technicalAssessment',
        label: 'Technical Assessment Focus',
        type: 'textarea',
        placeholder: 'Algorithms, system design, code review, framework knowledge...',
      },
    ],
  },
  {
    key: 'marketing',
    name: 'Marketing Request Template',
    description: 'Campaign, content, brand, and growth hiring fields.',
    matchers: ['marketing', 'mkt', 'brand', 'growth'],
    defaultPositionTitle: 'Content Marketing Specialist',
    defaultJobLevel: 'Mid',
    defaultEmploymentType: 'Full-time',
    defaultExperience: '1-3 years',
    defaultEducation: "Bachelor's in Marketing, Communications, or related field",
    defaultSkills: ['Campaign Planning', 'Content Strategy', 'Analytics'],
    skillOptions: [
      'Campaign Planning',
      'Content Strategy',
      'Analytics',
      'SEO',
      'Copywriting',
      'Brand Strategy',
      'Performance Marketing',
      'CRM',
      'Email Marketing',
      'Social Media',
      'Google Analytics',
      'Event Marketing',
    ],
    jobLevelOptions: ['Junior', 'Mid', 'Senior', 'Lead'],
    employmentTypeOptions: ['Full-time', 'Contract'],
    experienceOptions: [
      NO_EXPERIENCE_OPTION,
      'Fresh graduate',
      '1-3 years',
      '3-5 years',
      '5+ years',
    ],
    fields: [
      {
        key: 'campaignType',
        label: 'Campaign Type',
        type: 'select',
        required: true,
        options: ['Brand', 'Performance', 'Content', 'Event', 'CRM'],
        defaultValue: 'Content',
      },
      {
        key: 'channels',
        label: 'Main Channels',
        type: 'text',
        required: true,
        placeholder: 'e.g. Facebook, TikTok, SEO, email, events',
      },
      {
        key: 'portfolioRequirement',
        label: 'Portfolio Requirement',
        type: 'textarea',
        placeholder: 'Campaign examples, writing samples, analytics reports...',
      },
    ],
  },
  {
    key: 'sales',
    name: 'Sales Request Template',
    description: 'Revenue, account ownership, and territory hiring fields.',
    matchers: ['sales', 'business development', 'bd', 'commercial'],
    defaultPositionTitle: 'Enterprise Account Executive',
    defaultJobLevel: 'Mid',
    defaultEmploymentType: 'Full-time',
    defaultExperience: '1-3 years',
    defaultEducation: "Bachelor's in Business or related field",
    defaultSkills: ['Enterprise Sales', 'CRM', 'Negotiation'],
    skillOptions: [
      'Enterprise Sales',
      'CRM',
      'Negotiation',
      'Lead Generation',
      'Pipeline Management',
      'Account Management',
      'B2B Sales',
      'Sales Forecasting',
      'Customer Discovery',
      'HubSpot',
      'Salesforce',
      'Presentation Skills',
    ],
    jobLevelOptions: ['Junior', 'Mid', 'Senior', 'Lead'],
    employmentTypeOptions: ['Full-time', 'Contract'],
    experienceOptions: [NO_EXPERIENCE_OPTION, '1-3 years', '3-5 years', '5+ years'],
    fields: [
      {
        key: 'territory',
        label: 'Territory / Segment',
        type: 'text',
        required: true,
        placeholder: 'e.g. SMB Vietnam, enterprise APAC, strategic accounts',
      },
      {
        key: 'quotaOwnership',
        label: 'Quota Ownership',
        type: 'select',
        required: true,
        options: [
          'Lead generation',
          'Pipeline ownership',
          'Full-cycle sales',
          'Account management',
        ],
        defaultValue: 'Full-cycle sales',
      },
      {
        key: 'salesTools',
        label: 'Sales Tools',
        type: 'text',
        placeholder: 'e.g. HubSpot, Salesforce, LinkedIn Sales Navigator',
      },
    ],
  },
  {
    key: 'general',
    name: 'General Department Request Template',
    description: 'Flexible hiring fields for departments without a dedicated template.',
    matchers: [],
    defaultPositionTitle: '',
    defaultJobLevel: 'Mid',
    defaultEmploymentType: 'Full-time',
    defaultExperience: '1-3 years',
    defaultEducation: '',
    defaultSkills: [],
    skillOptions: [
      'Communication',
      'Project Management',
      'Stakeholder Management',
      'Problem Solving',
      'Data Analysis',
      'Documentation',
      'Process Improvement',
      'Microsoft Office',
      'Google Workspace',
      'Reporting',
    ],
    jobLevelOptions: ['Junior', 'Mid', 'Senior', 'Lead'],
    employmentTypeOptions: ['Full-time', 'Contract'],
    experienceOptions: [
      NO_EXPERIENCE_OPTION,
      'Fresh graduate',
      '1-3 years',
      '3-5 years',
      '5+ years',
    ],
    fields: [
      {
        key: 'businessContext',
        label: 'Business Context',
        type: 'textarea',
        required: true,
        placeholder: 'Why this role is needed and what work it supports...',
      },
      {
        key: 'requiredTools',
        label: 'Required Tools / Domain Knowledge',
        type: 'text',
        placeholder: 'Systems, tools, domain knowledge, or certifications',
      },
    ],
  },
];

export const getRequestTemplateByKey = (key?: string | null) =>
  DEPARTMENT_REQUEST_TEMPLATES.find((template) => template.key === key) ??
  DEPARTMENT_REQUEST_TEMPLATES.find((template) => template.key === 'general')!;

export const resolveDepartmentRequestTemplate = (
  departmentName?: string | null,
  departmentCode?: string | null,
) => {
  const normalizedValues = [normalize(departmentName), normalize(departmentCode)].filter(Boolean);
  const matched = DEPARTMENT_REQUEST_TEMPLATES.find((template) =>
    template.matchers.some((matcher) => {
      const normalizedMatcher = normalize(matcher);
      return normalizedValues.some(
        (value) => value === normalizedMatcher || value.includes(normalizedMatcher),
      );
    }),
  );

  return matched ?? getRequestTemplateByKey('general');
};

export const buildTemplateFieldValues = (
  template: DepartmentRequestTemplate,
  source?: Record<string, unknown> | null,
) =>
  template.fields.reduce<Record<string, string>>((values, field) => {
    const rawValue = source?.[field.key];
    values[field.key] =
      rawValue === undefined || rawValue === null ? (field.defaultValue ?? '') : String(rawValue);
    return values;
  }, {});

export const getTemplateFieldsForDisplay = (
  template: DepartmentRequestTemplate,
  source?: Record<string, unknown> | null,
) =>
  template.fields
    .map((field) => ({
      ...field,
      value:
        source?.[field.key] === undefined || source?.[field.key] === null
          ? ''
          : String(source[field.key]),
    }))
    .filter((field) => field.value.trim().length > 0);
