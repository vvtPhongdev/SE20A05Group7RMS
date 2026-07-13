import { PrismaClient } from '@prisma/client';
import { existsSync } from 'fs';
import { resolve } from 'path';

const prisma = new PrismaClient();

const FIXTURE_DIR = resolve(__dirname, '..', 'fixtures');
const PASSWORD_HASH = '$2a$12$oHJcxrO8y3AeozTP//ubrumF6T3ZLjDDJxrF.mib4yYGmjsyVddle'; // Password123!

const ids = {
  org: '00000000-0000-4000-8000-000000000001',
  admin: '00000000-0000-4000-8000-000000000101',
  deptHeadEngineering: '00000000-0000-4000-8000-000000000102',
  deptHeadMarketing: '00000000-0000-4000-8000-000000000103',
  hrManager: '00000000-0000-4000-8000-000000000104',
  hrRecruiter: '00000000-0000-4000-8000-000000000105',
  hrRecruiterTwo: '00000000-0000-4000-8000-000000000106',
  hrRecruiterThree: '00000000-0000-4000-8000-000000000107',
  hrRecruiterFour: '00000000-0000-4000-8000-000000000108',
  engineering: '00000000-0000-4000-8000-000000000201',
  marketing: '00000000-0000-4000-8000-000000000202',
  sales: '00000000-0000-4000-8000-000000000203',
  requestDraft: '00000000-0000-4000-8000-000000000301',
  requestApproved: '00000000-0000-4000-8000-000000000302',
  requestSourcing: '00000000-0000-4000-8000-000000000303',
  planApproved: '00000000-0000-4000-8000-000000000401',
  taskJobPost: '00000000-0000-4000-8000-000000000501',
  taskScreenCvs: '00000000-0000-4000-8000-000000000502',
  taskInterviews: '00000000-0000-4000-8000-000000000503',
  interviewScheduledOne: '00000000-0000-4000-8000-000000000701',
  interviewScheduledTwo: '00000000-0000-4000-8000-000000000702',
  interviewCompleted: '00000000-0000-4000-8000-000000000703',
  interviewResultOne: '00000000-0000-4000-8000-000000000801',
  interviewResultTwo: '00000000-0000-4000-8000-000000000802',
  approvalRecord: '00000000-0000-4000-8000-000000000901',
  requestLog: '00000000-0000-4000-8000-000000000902',
  jobPosting: '00000000-0000-4000-8000-000000000903',
  notification: '00000000-0000-4000-8000-000000000904',
  emailLog: '00000000-0000-4000-8000-000000000905',
};

const legacySeedEmails = [
  'admin@acme.com',
  'hr@acme.com',
  'depthead@acme.com',
  'candidate1@acme.com',
  'candidate2@acme.com',
  'candidate3@acme.com',
  'candidate4@acme.com',
  'candidate5@acme.com',
];

const candidateSeeds = [
  {
    userId: '00000000-0000-4000-8000-000000000111',
    profileId: '00000000-0000-4000-8000-000000000611',
    cvId: '00000000-0000-4000-8000-000000000621',
    embeddingId: '00000000-0000-4000-8000-000000000631',
    applicationId: '00000000-0000-4000-8000-000000000641',
    email: 'candidate1@demo.test',
    displayName: 'Alex Rivera',
    phone: '+84 900 000 001',
    title: 'Senior TypeScript Engineer',
    role: 'Backend Engineer',
    location: 'Ho Chi Minh City',
    skills: ['TypeScript', 'Node.js', 'React', 'PostgreSQL', 'Prisma', 'Microservices'],
    experienceYears: 8,
    fileName: 'alex-rivera-cv.pdf',
    rawText:
      'Alex Rivera CV: Senior TypeScript Engineer with 8 years in TypeScript, Node.js, React, PostgreSQL, Prisma, and microservices. Led API platform migrations and mentored backend teams.',
    applicationStatus: 'INTERVIEWING',
    screeningStatus: 'SHORTLISTED',
  },
  {
    userId: '00000000-0000-4000-8000-000000000112',
    profileId: '00000000-0000-4000-8000-000000000612',
    cvId: '00000000-0000-4000-8000-000000000622',
    embeddingId: '00000000-0000-4000-8000-000000000632',
    applicationId: '00000000-0000-4000-8000-000000000642',
    email: 'candidate2@demo.test',
    displayName: 'Priya Sharma',
    phone: '+84 900 000 002',
    title: 'Backend Engineer',
    role: 'Backend Engineer',
    location: 'Ha Noi',
    skills: ['Go', 'PostgreSQL', 'Redis', 'Kafka', 'Docker', 'Kubernetes'],
    experienceYears: 6,
    fileName: 'priya-sharma-cv.pdf',
    rawText:
      'Priya Sharma CV: Backend Engineer with 6 years in Go, PostgreSQL, Redis, Kafka, Docker, and Kubernetes. Built distributed fintech services and high-throughput data pipelines.',
    applicationStatus: 'SCREENING',
    screeningStatus: 'SHORTLISTED',
  },
  {
    userId: '00000000-0000-4000-8000-000000000113',
    profileId: '00000000-0000-4000-8000-000000000613',
    cvId: '00000000-0000-4000-8000-000000000623',
    embeddingId: '00000000-0000-4000-8000-000000000633',
    applicationId: '00000000-0000-4000-8000-000000000643',
    email: 'candidate3@demo.test',
    displayName: 'Tomas Garcia',
    phone: '+84 900 000 003',
    title: 'DevOps Engineer',
    role: 'Platform Engineer',
    location: 'Da Nang',
    skills: ['AWS', 'Kubernetes', 'Terraform', 'CI/CD', 'Linux', 'Monitoring'],
    experienceYears: 7,
    fileName: 'tomas-garcia-cv.pdf',
    rawText:
      'Tomas Garcia CV: DevOps and Platform Engineer with AWS, Kubernetes, Terraform, Linux, monitoring, incident response, and CI/CD automation experience.',
    applicationStatus: 'SUBMITTED',
    screeningStatus: 'PENDING',
  },
  {
    userId: '00000000-0000-4000-8000-000000000114',
    profileId: '00000000-0000-4000-8000-000000000614',
    cvId: '00000000-0000-4000-8000-000000000624',
    embeddingId: '00000000-0000-4000-8000-000000000634',
    applicationId: '00000000-0000-4000-8000-000000000644',
    email: 'candidate4@demo.test',
    displayName: 'Mina Nguyen',
    phone: '+84 900 000 004',
    title: 'Frontend Engineer',
    role: 'Frontend Engineer',
    location: 'Ho Chi Minh City',
    skills: ['React', 'TypeScript', 'Tailwind CSS', 'Accessibility', 'Design Systems'],
    experienceYears: 5,
    fileName: 'mina-nguyen-cv.pdf',
    rawText:
      'Mina Nguyen CV: Frontend Engineer with React, TypeScript, Tailwind CSS, accessibility, design systems, and enterprise dashboard experience.',
    applicationStatus: 'SUBMITTED',
    screeningStatus: 'PENDING',
  },
  {
    userId: '00000000-0000-4000-8000-000000000115',
    profileId: '00000000-0000-4000-8000-000000000615',
    cvId: '00000000-0000-4000-8000-000000000625',
    embeddingId: '00000000-0000-4000-8000-000000000635',
    applicationId: '00000000-0000-4000-8000-000000000645',
    email: 'candidate5@demo.test',
    displayName: 'Jordan Lee',
    phone: '+84 900 000 005',
    title: 'QA Automation Engineer',
    role: 'QA Engineer',
    location: 'Remote',
    skills: ['Playwright', 'TypeScript', 'API Testing', 'Postman', 'CI/CD'],
    experienceYears: 4,
    fileName: 'jordan-lee-cv.pdf',
    rawText:
      'Jordan Lee CV: QA Automation Engineer with Playwright, TypeScript, API testing, Postman, CI/CD quality gates, regression suites, and release validation.',
    applicationStatus: 'SCREENING',
    screeningStatus: 'SHORTLISTED',
  },
];

const sampleEmbedding = (seed: number) =>
  Array.from({ length: 384 }, (_, index) =>
    Number((Math.sin((seed + 1) * (index + 1)) * 0.05).toFixed(6)),
  );

const daysFromNow = (days: number) => new Date(Date.now() + days * 24 * 60 * 60 * 1000);

async function ensureVectorStorage() {
  await prisma.$executeRawUnsafe('CREATE EXTENSION IF NOT EXISTS vector;');
  await prisma.$executeRawUnsafe(
    'ALTER TABLE "cv_embeddings" ADD COLUMN IF NOT EXISTS "embedding" vector(384);',
  );
  await prisma.$executeRawUnsafe(
    'CREATE INDEX IF NOT EXISTS "idx_cv_embeddings_vector" ON "cv_embeddings" USING ivfflat ("embedding" vector_cosine_ops) WITH (lists = 100);',
  );
}

async function assertFixtureFiles() {
  const missing = candidateSeeds
    .map((candidate) => candidate.fileName)
    .filter((fileName) => !existsSync(resolve(FIXTURE_DIR, fileName)));

  if (missing.length > 0) {
    throw new Error(`Missing CV PDF fixture(s): ${missing.join(', ')}`);
  }
}

async function cleanupLegacySeedData() {
  const legacyOrganizations = await prisma.organization.findMany({
    where: {
      OR: [{ slug: 'acme-corp' }, { users: { some: { email: { in: legacySeedEmails } } } }],
    },
    select: { id: true },
  });

  const legacyOrganizationIds = legacyOrganizations.map((organization) => organization.id);

  if (legacyOrganizationIds.length > 0) {
    await prisma.organization.deleteMany({
      where: { id: { in: legacyOrganizationIds } },
    });
  }
}

async function seedOrganization() {
  return prisma.organization.upsert({
    where: { slug: 'demo-corp' },
    update: {
      id: ids.org,
      name: 'Demo Corp',
      settings: {
        industry: 'Information Technology',
        orgSize: '51-200 employees',
        approvalWorkflow: {
          budgetJustification: true,
          autoApproveLow: false,
          requireVpExecutive: true,
          enableMultiLevel: false,
        },
      },
    },
    create: {
      id: ids.org,
      name: 'Demo Corp',
      slug: 'demo-corp',
      settings: {
        industry: 'Information Technology',
        orgSize: '51-200 employees',
      },
    },
  });
}

async function cleanupDuplicateDemoDepartments(organizationId: string) {
  await prisma.department.deleteMany({
    where: {
      organizationId,
      id: { not: ids.engineering },
      OR: [
        { name: { equals: 'Engineering', mode: 'insensitive' } },
        { name: { equals: 'Engineer', mode: 'insensitive' } },
        { code: { in: ['ENGINEER', 'ENGINEERING'] } },
      ],
    },
  });
}

async function upsertUser(data: {
  id: string;
  email: string;
  displayName: string;
  role: string;
  organizationId: string;
  departmentId?: string | null;
}) {
  return prisma.user.upsert({
    where: { email: data.email },
    update: {
      id: data.id,
      displayName: data.displayName,
      role: data.role,
      passwordHash: PASSWORD_HASH,
      organizationId: data.organizationId,
      departmentId: data.departmentId ?? null,
      isActive: true,
    },
    create: {
      ...data,
      passwordHash: PASSWORD_HASH,
      isActive: true,
    },
  });
}

async function main() {
  console.log('Seeding required RMS fixture set...');

  await ensureVectorStorage();
  await assertFixtureFiles();
  await cleanupLegacySeedData();

  const org = await seedOrganization();
  await cleanupDuplicateDemoDepartments(org.id);

  const admin = await upsertUser({
    id: ids.admin,
    email: 'admin@demo.test',
    displayName: 'Demo Admin',
    role: 'ADMIN',
    organizationId: org.id,
  });

  const deptHeadEngineering = await upsertUser({
    id: ids.deptHeadEngineering,
    email: 'engineering.head@demo.test',
    displayName: 'Sarah Chen',
    role: 'DEPARTMENT_HEAD',
    organizationId: org.id,
  });

  const deptHeadMarketing = await upsertUser({
    id: ids.deptHeadMarketing,
    email: 'marketing.head@demo.test',
    displayName: 'Marcus Johnson',
    role: 'DEPARTMENT_HEAD',
    organizationId: org.id,
  });

  const hrManager = await upsertUser({
    id: ids.hrManager,
    email: 'hr.manager@demo.test',
    displayName: 'Emily Wong',
    role: 'HR_LEADER',
    organizationId: org.id,
  });

  const hrRecruiter = await upsertUser({
    id: ids.hrRecruiter,
    email: 'hr.recruiter@demo.test',
    displayName: 'Lisa Thompson',
    role: 'HR_LEADER',
    organizationId: org.id,
  });

  await upsertUser({
    id: ids.hrRecruiterTwo,
    email: 'hr.recruiter2@demo.test',
    displayName: 'Nina Patel',
    role: 'HR_LEADER',
    organizationId: org.id,
  });

  await upsertUser({
    id: ids.hrRecruiterThree,
    email: 'hr.recruiter3@demo.test',
    displayName: 'David Kim',
    role: 'HR_LEADER',
    organizationId: org.id,
  });

  await upsertUser({
    id: ids.hrRecruiterFour,
    email: 'hr.recruiter4@demo.test',
    displayName: 'An Tran',
    role: 'HR_LEADER',
    organizationId: org.id,
  });

  const engineering = await prisma.department.upsert({
    where: { organizationId_code: { organizationId: org.id, code: 'ENG' } },
    update: { id: ids.engineering, name: 'Engineering', headUserId: deptHeadEngineering.id },
    create: {
      id: ids.engineering,
      organizationId: org.id,
      name: 'Engineering',
      code: 'ENG',
      headUserId: deptHeadEngineering.id,
    },
  });

  const marketing = await prisma.department.upsert({
    where: { organizationId_code: { organizationId: org.id, code: 'MKT' } },
    update: { id: ids.marketing, name: 'Marketing', headUserId: deptHeadMarketing.id },
    create: {
      id: ids.marketing,
      organizationId: org.id,
      name: 'Marketing',
      code: 'MKT',
      headUserId: deptHeadMarketing.id,
    },
  });

  const sales = await prisma.department.upsert({
    where: { organizationId_code: { organizationId: org.id, code: 'SALES' } },
    update: { id: ids.sales, name: 'Sales' },
    create: {
      id: ids.sales,
      organizationId: org.id,
      name: 'Sales',
      code: 'SALES',
    },
  });

  await prisma.user.update({
    where: { id: deptHeadEngineering.id },
    data: { departmentId: engineering.id },
  });
  await prisma.user.update({
    where: { id: deptHeadMarketing.id },
    data: { departmentId: marketing.id },
  });
  await prisma.user.update({
    where: { id: hrManager.id },
    data: { departmentId: sales.id },
  });
  await prisma.user.update({
    where: { id: hrRecruiter.id },
    data: { departmentId: sales.id },
  });

  const candidateProfiles = [];
  for (const seed of candidateSeeds) {
    const user = await upsertUser({
      id: seed.userId,
      email: seed.email,
      displayName: seed.displayName,
      role: 'CANDIDATE',
      organizationId: org.id,
    });

    const profile = await prisma.candidateProfile.upsert({
      where: { userId: user.id },
      update: {
        id: seed.profileId,
        fullName: seed.displayName,
        email: seed.email,
        phone: seed.phone,
        summary: seed.rawText,
        structuredData: {
          title: seed.title,
          role: seed.role,
          location: seed.location,
          skills: seed.skills,
          experienceYears: seed.experienceYears,
          resume: {
            personalInfo: {
              fullName: seed.displayName,
              email: seed.email,
              phone: seed.phone,
            },
            summary: seed.rawText,
            skills: {
              technical: seed.skills,
            },
          },
        },
      },
      create: {
        id: seed.profileId,
        userId: user.id,
        fullName: seed.displayName,
        email: seed.email,
        phone: seed.phone,
        summary: seed.rawText,
        structuredData: {
          title: seed.title,
          role: seed.role,
          location: seed.location,
          skills: seed.skills,
          experienceYears: seed.experienceYears,
        },
      },
    });
    candidateProfiles.push({ ...seed, profile });
  }

  const requestDraft = await prisma.recruitmentRequest.upsert({
    where: { id: ids.requestDraft },
    update: {
      departmentId: marketing.id,
      createdById: deptHeadMarketing.id,
      position: 'Content Marketing Specialist',
      headcount: 1,
      jobDescription: 'Draft request for a content marketer to support product launches.',
      skillRequirements: { skills: ['SEO', 'Content Strategy', 'Copywriting'] },
      justification: 'Upcoming campaign coverage.',
      urgency: 'MEDIUM',
      status: 'DRAFT',
      reviewedById: null,
      approvedById: null,
    },
    create: {
      id: ids.requestDraft,
      departmentId: marketing.id,
      createdById: deptHeadMarketing.id,
      position: 'Content Marketing Specialist',
      headcount: 1,
      jobDescription: 'Draft request for a content marketer to support product launches.',
      skillRequirements: { skills: ['SEO', 'Content Strategy', 'Copywriting'] },
      justification: 'Upcoming campaign coverage.',
      urgency: 'MEDIUM',
      status: 'DRAFT',
    },
  });

  const requestApproved = await prisma.recruitmentRequest.upsert({
    where: { id: ids.requestApproved },
    update: {
      departmentId: engineering.id,
      createdById: deptHeadEngineering.id,
      position: 'Senior TypeScript Engineer',
      headcount: 2,
      jobDescription: 'Hire a senior engineer to lead core systems and platform integrations.',
      skillRequirements: { skills: ['TypeScript', 'Node.js', 'PostgreSQL', 'Prisma'] },
      justification: 'Enterprise roadmap requires additional backend capacity.',
      urgency: 'HIGH',
      status: 'APPROVED',
      reviewedById: hrManager.id,
      approvedById: admin.id,
    },
    create: {
      id: ids.requestApproved,
      departmentId: engineering.id,
      createdById: deptHeadEngineering.id,
      position: 'Senior TypeScript Engineer',
      headcount: 2,
      jobDescription: 'Hire a senior engineer to lead core systems and platform integrations.',
      skillRequirements: { skills: ['TypeScript', 'Node.js', 'PostgreSQL', 'Prisma'] },
      justification: 'Enterprise roadmap requires additional backend capacity.',
      urgency: 'HIGH',
      status: 'APPROVED',
      reviewedById: hrManager.id,
      approvedById: admin.id,
    },
  });

  const requestSourcing = await prisma.recruitmentRequest.upsert({
    where: { id: ids.requestSourcing },
    update: {
      departmentId: sales.id,
      createdById: deptHeadMarketing.id,
      position: 'Enterprise Account Executive',
      headcount: 1,
      jobDescription: 'Source a senior account executive for enterprise pipeline expansion.',
      skillRequirements: { skills: ['Enterprise Sales', 'CRM', 'Negotiation'] },
      justification: 'Sales pipeline coverage for strategic accounts.',
      urgency: 'HIGH',
      status: 'SOURCING',
      reviewedById: hrManager.id,
      approvedById: admin.id,
    },
    create: {
      id: ids.requestSourcing,
      departmentId: sales.id,
      createdById: deptHeadMarketing.id,
      position: 'Enterprise Account Executive',
      headcount: 1,
      jobDescription: 'Source a senior account executive for enterprise pipeline expansion.',
      skillRequirements: { skills: ['Enterprise Sales', 'CRM', 'Negotiation'] },
      justification: 'Sales pipeline coverage for strategic accounts.',
      urgency: 'HIGH',
      status: 'SOURCING',
      reviewedById: hrManager.id,
      approvedById: admin.id,
    },
  });

  await prisma.approvalRecord.upsert({
    where: { id: ids.approvalRecord },
    update: {
      requestId: requestApproved.id,
      approverId: admin.id,
      decision: 'APPROVED',
      comments: 'Approved for engineering roadmap delivery.',
    },
    create: {
      id: ids.approvalRecord,
      requestId: requestApproved.id,
      approverId: admin.id,
      decision: 'APPROVED',
      comments: 'Approved for engineering roadmap delivery.',
    },
  });

  await prisma.requestLog.upsert({
    where: { id: ids.requestLog },
    update: {
      requestId: requestApproved.id,
      action: 'STATUS_CHANGE',
      fromStatus: 'PENDING_BOSS_APPROVAL',
      toStatus: 'APPROVED',
      performedById: admin.id,
      metadata: { seeded: true },
    },
    create: {
      id: ids.requestLog,
      requestId: requestApproved.id,
      action: 'STATUS_CHANGE',
      fromStatus: 'PENDING_BOSS_APPROVAL',
      toStatus: 'APPROVED',
      performedById: admin.id,
      metadata: { seeded: true },
    },
  });

  const approvedPlan = await prisma.overallPlan.upsert({
    where: { requestId: requestApproved.id },
    update: {
      id: ids.planApproved,
      startDate: daysFromNow(-2),
      endDate: daysFromNow(28),
      status: 'APPROVED',
      createdById: hrManager.id,
      approvedById: admin.id,
      revisionNotes: null,
    },
    create: {
      id: ids.planApproved,
      requestId: requestApproved.id,
      startDate: daysFromNow(-2),
      endDate: daysFromNow(28),
      status: 'APPROVED',
      createdById: hrManager.id,
      approvedById: admin.id,
    },
  });

  const taskPlans = [
    {
      id: ids.taskJobPost,
      taskType: 'JOB_POSTING',
      startDate: daysFromNow(-2),
      endDate: daysFromNow(2),
      status: 'COMPLETED',
    },
    {
      id: ids.taskScreenCvs,
      taskType: 'CV_SCREENING',
      startDate: daysFromNow(0),
      endDate: daysFromNow(10),
      status: 'IN_PROGRESS',
    },
    {
      id: ids.taskInterviews,
      taskType: 'INTERVIEW_COORDINATION',
      startDate: daysFromNow(4),
      endDate: daysFromNow(18),
      status: 'PENDING',
    },
  ];

  for (const task of taskPlans) {
    await prisma.taskPlan.upsert({
      where: { id: task.id },
      update: {
        overallPlanId: approvedPlan.id,
        taskType: task.taskType,
        assignedToId: hrRecruiter.id,
        startDate: task.startDate,
        endDate: task.endDate,
        status: task.status,
      },
      create: {
        ...task,
        overallPlanId: approvedPlan.id,
        assignedToId: hrRecruiter.id,
      },
    });
  }

  await prisma.jobPosting.upsert({
    where: { requestId: requestApproved.id },
    update: {
      id: ids.jobPosting,
      title: requestApproved.position,
      description: requestApproved.jobDescription,
      requirements: requestApproved.skillRequirements as object,
      visibility: 'PUBLIC',
      status: 'PUBLISHED',
      startDate: new Date(),
      expireDate: daysFromNow(45),
    },
    create: {
      id: ids.jobPosting,
      requestId: requestApproved.id,
      title: requestApproved.position,
      description: requestApproved.jobDescription,
      requirements: requestApproved.skillRequirements as object,
      visibility: 'PUBLIC',
      status: 'PUBLISHED',
      startDate: new Date(),
      expireDate: daysFromNow(45),
    },
  });

  for (let index = 0; index < candidateProfiles.length; index += 1) {
    const candidate = candidateProfiles[index];
    const filePath = resolve(FIXTURE_DIR, candidate.fileName);

    await prisma.application.upsert({
      where: {
        requestId_candidateId: {
          requestId: requestApproved.id,
          candidateId: candidate.profile.id,
        },
      },
      update: {
        id: candidate.applicationId,
        status: candidate.applicationStatus,
        collectedById: hrRecruiter.id,
      },
      create: {
        id: candidate.applicationId,
        requestId: requestApproved.id,
        candidateId: candidate.profile.id,
        collectedById: hrRecruiter.id,
        status: candidate.applicationStatus,
      },
    });

    await prisma.candidateCV.upsert({
      where: { id: candidate.cvId },
      update: {
        candidateId: candidate.profile.id,
        fileName: candidate.fileName,
        fileType: 'PDF',
        filePath,
        rawText: candidate.rawText,
        parsedAt: daysFromNow(-1),
        screeningStatus: candidate.screeningStatus,
      },
      create: {
        id: candidate.cvId,
        candidateId: candidate.profile.id,
        fileName: candidate.fileName,
        fileType: 'PDF',
        filePath,
        rawText: candidate.rawText,
        parsedAt: daysFromNow(-1),
        screeningStatus: candidate.screeningStatus,
      },
    });

    await prisma.cvEmbedding.upsert({
      where: { id: candidate.embeddingId },
      update: {
        cvDocumentId: candidate.cvId,
        chunkIndex: 0,
        chunkText: candidate.rawText,
      },
      create: {
        id: candidate.embeddingId,
        cvDocumentId: candidate.cvId,
        chunkIndex: 0,
        chunkText: candidate.rawText,
      },
    });

    await prisma.$executeRawUnsafe(
      'UPDATE "cv_embeddings" SET "embedding" = $1::vector WHERE "id" = $2',
      `[${sampleEmbedding(index).join(',')}]`,
      candidate.embeddingId,
    );
  }

  const [alex, priya, tomas] = candidateProfiles;
  if (!alex || !priya || !tomas) {
    throw new Error('Candidate fixture setup failed.');
  }

  await prisma.interviewSchedule.upsert({
    where: { id: ids.interviewScheduledOne },
    update: {
      requestId: requestApproved.id,
      candidateId: alex.profile.id,
      scheduledAt: daysFromNow(3),
      duration: 60,
      location: 'https://meet.demo.test/alex-rivera',
      interviewers: [hrManager.id, deptHeadEngineering.id],
      status: 'SCHEDULED',
      finalRecommendation: null,
      summaryNotes: null,
    },
    create: {
      id: ids.interviewScheduledOne,
      requestId: requestApproved.id,
      candidateId: alex.profile.id,
      scheduledAt: daysFromNow(3),
      duration: 60,
      location: 'https://meet.demo.test/alex-rivera',
      interviewers: [hrManager.id, deptHeadEngineering.id],
      status: 'SCHEDULED',
    },
  });

  await prisma.interviewSchedule.upsert({
    where: { id: ids.interviewScheduledTwo },
    update: {
      requestId: requestApproved.id,
      candidateId: priya.profile.id,
      scheduledAt: daysFromNow(5),
      duration: 45,
      location: 'Room 3A',
      interviewers: [hrManager.id, hrRecruiter.id],
      status: 'SCHEDULED',
      finalRecommendation: null,
      summaryNotes: null,
    },
    create: {
      id: ids.interviewScheduledTwo,
      requestId: requestApproved.id,
      candidateId: priya.profile.id,
      scheduledAt: daysFromNow(5),
      duration: 45,
      location: 'Room 3A',
      interviewers: [hrManager.id, hrRecruiter.id],
      status: 'SCHEDULED',
    },
  });

  const completedInterview = await prisma.interviewSchedule.upsert({
    where: { id: ids.interviewCompleted },
    update: {
      requestId: requestApproved.id,
      candidateId: tomas.profile.id,
      scheduledAt: daysFromNow(-1),
      duration: 60,
      location: 'https://meet.demo.test/tomas-garcia',
      interviewers: [hrManager.id, deptHeadEngineering.id],
      status: 'COMPLETED',
      finalRecommendation: 'Recommend Hire',
      summaryNotes: 'Strong infrastructure depth and clear incident-response experience.',
    },
    create: {
      id: ids.interviewCompleted,
      requestId: requestApproved.id,
      candidateId: tomas.profile.id,
      scheduledAt: daysFromNow(-1),
      duration: 60,
      location: 'https://meet.demo.test/tomas-garcia',
      interviewers: [hrManager.id, deptHeadEngineering.id],
      status: 'COMPLETED',
      finalRecommendation: 'Recommend Hire',
      summaryNotes: 'Strong infrastructure depth and clear incident-response experience.',
    },
  });

  await prisma.interviewResult.upsert({
    where: { id: ids.interviewResultOne },
    update: {
      interviewId: completedInterview.id,
      result: 'PASS',
      notes: 'Excellent Kubernetes and Terraform experience.',
      evaluatorId: hrManager.id,
      technical: 9,
      communication: 8,
      culture: 8,
    },
    create: {
      id: ids.interviewResultOne,
      interviewId: completedInterview.id,
      result: 'PASS',
      notes: 'Excellent Kubernetes and Terraform experience.',
      evaluatorId: hrManager.id,
      technical: 9,
      communication: 8,
      culture: 8,
    },
  });

  await prisma.interviewResult.upsert({
    where: { id: ids.interviewResultTwo },
    update: {
      interviewId: completedInterview.id,
      result: 'PASS',
      notes: 'Strong collaboration habits and practical SRE judgment.',
      evaluatorId: deptHeadEngineering.id,
      technical: 8,
      communication: 9,
      culture: 9,
    },
    create: {
      id: ids.interviewResultTwo,
      interviewId: completedInterview.id,
      result: 'PASS',
      notes: 'Strong collaboration habits and practical SRE judgment.',
      evaluatorId: deptHeadEngineering.id,
      technical: 8,
      communication: 9,
      culture: 9,
    },
  });

  await prisma.notification.upsert({
    where: { id: ids.notification },
    update: {
      userId: deptHeadEngineering.id,
      type: 'REQUEST_UPDATE',
      title: 'Approved recruitment request is ready',
      body: `${requestApproved.position} has an approved recruitment plan and seeded candidates.`,
      relatedEntityId: requestApproved.id,
      relatedEntityType: 'RecruitmentRequest',
      isRead: false,
    },
    create: {
      id: ids.notification,
      userId: deptHeadEngineering.id,
      type: 'REQUEST_UPDATE',
      title: 'Approved recruitment request is ready',
      body: `${requestApproved.position} has an approved recruitment plan and seeded candidates.`,
      relatedEntityId: requestApproved.id,
      relatedEntityType: 'RecruitmentRequest',
    },
  });

  await prisma.emailLog.upsert({
    where: { id: ids.emailLog },
    update: {
      userId: alex.userId,
      toEmail: alex.email,
      subject: 'Interview Invitation',
      body: 'You have been invited to interview for the Senior TypeScript Engineer position.',
      status: 'SENT',
      errorMessage: null,
      sentAt: daysFromNow(0),
    },
    create: {
      id: ids.emailLog,
      userId: alex.userId,
      toEmail: alex.email,
      subject: 'Interview Invitation',
      body: 'You have been invited to interview for the Senior TypeScript Engineer position.',
      status: 'SENT',
      sentAt: daysFromNow(0),
    },
  });

  // Keep the shared demo database aligned with the single multi-department head model.
  // The external account is managed outside the seed, so only consolidate when it exists.
  const consolidatedDepartmentHead = await prisma.user.findUnique({
    where: { email: 'nlbtboss1@gmail.com' },
    select: { id: true, organizationId: true },
  });

  if (consolidatedDepartmentHead) {
    await prisma.$transaction([
      prisma.user.update({
        where: { id: consolidatedDepartmentHead.id },
        data: { role: 'DEPARTMENT_HEAD', isActive: true },
      }),
      prisma.recruitmentRequest.updateMany({
        where: {
          department: { organizationId: consolidatedDepartmentHead.organizationId },
          createdById: { not: consolidatedDepartmentHead.id },
        },
        data: { createdById: consolidatedDepartmentHead.id },
      }),
      prisma.department.updateMany({
        where: { organizationId: consolidatedDepartmentHead.organizationId },
        data: { headUserId: consolidatedDepartmentHead.id },
      }),
      prisma.user.updateMany({
        where: {
          organizationId: consolidatedDepartmentHead.organizationId,
          role: 'DEPARTMENT_HEAD',
          id: { not: consolidatedDepartmentHead.id },
        },
        data: { role: 'CANDIDATE', isActive: false },
      }),
    ]);
  }

  console.log('Seed complete: required fixture set is ready.');
  console.log('Login password for all seeded users: Password123!');
}

main()
  .catch((error) => {
    console.error('Seed failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
