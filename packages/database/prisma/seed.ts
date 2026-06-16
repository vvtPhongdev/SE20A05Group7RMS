import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const sampleEmbedding = (seed: number) =>
  Array.from({ length: 384 }, (_, index) =>
    Number((Math.sin((seed + 1) * (index + 1)) * 0.05).toFixed(6)),
  );

async function main() {
  console.log('🌱 Seeding Works Reruiter database with workflow-first models...');

  // 1. Create Organization
  const org = await prisma.organization.upsert({
    where: { slug: 'acme-corp' },
    update: {},
    create: {
      name: 'Acme Corporation',
      slug: 'acme-corp',
    },
  });
  console.log(`  Org: ${org.name}`);

  // 2. Clear out existing tables to prevent duplicate key conflicts in relations
  // In reverse order of dependencies
  await prisma.emailLog.deleteMany({});
  await prisma.notification.deleteMany({});
  await prisma.offerLetter.deleteMany({});
  await prisma.interviewResult.deleteMany({});
  await prisma.interviewSchedule.deleteMany({});
  await prisma.cvEmbedding.deleteMany({});
  await prisma.candidateCV.deleteMany({});
  await prisma.application.deleteMany({});
  await prisma.candidateProfile.deleteMany({});
  await prisma.taskPlan.deleteMany({});
  await prisma.overallPlan.deleteMany({});
  await prisma.jobPosting.deleteMany({});
  await prisma.requestLog.deleteMany({});
  await prisma.approvalRecord.deleteMany({});
  await prisma.recruitmentRequest.deleteMany({});
  await prisma.user.deleteMany({});
  await prisma.department.deleteMany({});

  const passwordHash = '$2a$12$oHJcxrO8y3AeozTP//ubrumF6T3ZLjDDJxrF.mib4yYGmjsyVddle'; // Password123!

  // 3. Create Department heads and users
  const admin = await prisma.user.create({
    data: {
      email: 'admin@acme.com',
      displayName: 'Admin User',
      role: 'ADMIN',
      passwordHash,
      organizationId: org.id,
    },
  });

  const dhEng = await prisma.user.create({
    data: {
      email: 'depthead@acme.com',
      displayName: 'Sarah Chen',
      role: 'DEPARTMENT_HEAD',
      passwordHash,
      organizationId: org.id,
    },
  });

  const dhProd = await prisma.user.create({
    data: {
      email: 'dh.product@acme.com',
      displayName: 'Marcus Johnson',
      role: 'DEPARTMENT_HEAD',
      passwordHash,
      organizationId: org.id,
    },
  });

  const hrManager = await prisma.user.create({
    data: {
      email: 'hr@acme.com',
      displayName: 'Emily Wong',
      role: 'HR_LEADER',
      passwordHash,
      organizationId: org.id,
    },
  });

  const hrStaff = await prisma.user.create({
    data: {
      email: 'recruiter1@acme.com',
      displayName: 'Lisa Thompson',
      role: 'HR_RECRUITER',
      passwordHash,
      organizationId: org.id,
    },
  });

  // Candidates
  const candidates = [
    { email: 'candidate1@acme.com', displayName: 'Alex Rivera' },
    { email: 'candidate2@acme.com', displayName: 'Priya Sharma' },
    { email: 'candidate3@acme.com', displayName: 'Tomas Garcia' },
    { email: 'candidate4@acme.com', displayName: 'Mina Nguyen' },
    { email: 'candidate5@acme.com', displayName: 'Jordan Lee' },
  ];

  const createdCandidates = [];
  for (const c of candidates) {
    const u = await prisma.user.create({
      data: {
        email: c.email,
        displayName: c.displayName,
        role: 'CANDIDATE',
        passwordHash,
        organizationId: org.id,
      },
    });
    createdCandidates.push(u);
  }

  // 4. Create Departments
  const deptEng = await prisma.department.create({
    data: {
      organizationId: org.id,
      name: 'Engineering',
      code: 'ENG',
      headUserId: dhEng.id,
    },
  });

  const deptProd = await prisma.department.create({
    data: {
      organizationId: org.id,
      name: 'Product Management',
      code: 'PRODUCT',
      headUserId: dhProd.id,
    },
  });

  // Update Users with their departmentId
  await prisma.user.update({
    where: { id: dhEng.id },
    data: { departmentId: deptEng.id },
  });
  await prisma.user.update({
    where: { id: dhProd.id },
    data: { departmentId: deptProd.id },
  });

  // 5. Create Candidate Profiles
  const profileDetails = [
    {
      phone: '123-456-7890',
      summary: 'Senior Full-Stack Developer with 8 years of experience in React and Node.js.',
      structuredData: {
        title: 'Senior TypeScript Engineer',
        role: 'Backend Engineer',
        location: 'Ho Chi Minh City',
        skills: ['TypeScript', 'Node.js', 'React', 'PostgreSQL', 'Prisma', 'Microservices'],
        experienceYears: 8,
      },
    },
    {
      phone: '987-654-3210',
      summary: 'Backend engineer specializing in Go, PostgreSQL, Redis, and distributed systems.',
      structuredData: {
        title: 'Backend Engineer',
        role: 'Backend Engineer',
        location: 'Ha Noi',
        skills: ['Go', 'PostgreSQL', 'Redis', 'Kafka', 'Docker', 'Kubernetes'],
        experienceYears: 6,
      },
    },
    {
      phone: '555-555-5555',
      summary: 'DevOps engineer with extensive AWS and Kubernetes experience.',
      structuredData: {
        title: 'DevOps Engineer',
        role: 'Platform Engineer',
        location: 'Da Nang',
        skills: ['AWS', 'Kubernetes', 'Terraform', 'CI/CD', 'Linux', 'Monitoring'],
        experienceYears: 7,
      },
    },
    {
      phone: '555-010-4444',
      summary: 'Frontend engineer building accessible React and design-system experiences.',
      structuredData: {
        title: 'Frontend Engineer',
        role: 'Frontend Engineer',
        location: 'Ho Chi Minh City',
        skills: ['React', 'TypeScript', 'Tailwind CSS', 'Accessibility', 'Design Systems'],
        experienceYears: 5,
      },
    },
    {
      phone: '555-010-5555',
      summary: 'QA automation engineer focused on Playwright, API testing, and release quality.',
      structuredData: {
        title: 'QA Automation Engineer',
        role: 'QA Engineer',
        location: 'Remote',
        skills: ['Playwright', 'TypeScript', 'API Testing', 'Postman', 'CI/CD'],
        experienceYears: 4,
      },
    },
  ];

  const createdProfiles = [];
  for (let i = 0; i < createdCandidates.length; i++) {
    const c = createdCandidates[i];
    const details = profileDetails[i];
    if (!c || !details) continue;

    const profile = await prisma.candidateProfile.create({
      data: {
        userId: c.id,
        fullName: c.displayName,
        email: c.email,
        phone: details.phone,
        summary: details.summary,
        structuredData: details.structuredData,
      },
    });
    createdProfiles.push(profile);
  }

  const firstProfile = createdProfiles[0];
  const firstCandidate = createdCandidates[0];
  if (!firstProfile || !firstCandidate) {
    throw new Error('Failed to create candidate or profile for seeding.');
  }

  // 6. Create a Recruitment Request
  const request = await prisma.recruitmentRequest.create({
    data: {
      departmentId: deptEng.id,
      createdById: dhEng.id,
      position: 'Senior TypeScript Engineer',
      headcount: 2,
      jobDescription: 'Looking for a Senior TypeScript Engineer to lead core systems development.',
      skillRequirements: { required: ['TypeScript', 'Node.js', 'Prisma', 'PostgreSQL'] },
      justification: 'Increasing team bandwidth for new enterprise capabilities.',
      urgency: 'HIGH',
      status: 'PLAN_APPROVED',
      reviewedById: hrManager.id,
      approvedById: admin.id,
    },
  });

  // 7. Request logs & approval records
  await prisma.requestLog.create({
    data: {
      requestId: request.id,
      action: 'STATUS_CHANGE',
      fromStatus: 'DRAFT',
      toStatus: 'PENDING_REVIEW',
      performedById: dhEng.id,
      metadata: { note: 'Initial submission' },
    },
  });

  await prisma.approvalRecord.create({
    data: {
      requestId: request.id,
      approverId: admin.id,
      decision: 'APPROVED',
      comments: 'Approved request for ENG headcount increase.',
    },
  });

  // 8. Overall Plan and Task Plans
  const plan = await prisma.overallPlan.create({
    data: {
      requestId: request.id,
      startDate: new Date(),
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      status: 'APPROVED',
      createdById: hrManager.id,
      approvedById: admin.id,
    },
  });

  await prisma.taskPlan.create({
    data: {
      overallPlanId: plan.id,
      taskType: 'JOB_POSTING',
      assignedToId: hrStaff.id,
      startDate: new Date(),
      endDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
      status: 'COMPLETED',
    },
  });

  await prisma.taskPlan.create({
    data: {
      overallPlanId: plan.id,
      taskType: 'CV_COLLECTION',
      assignedToId: hrStaff.id,
      startDate: new Date(),
      endDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
      status: 'IN_PROGRESS',
    },
  });

  await prisma.jobPosting.create({
    data: {
      requestId: request.id,
      title: request.position,
      description: request.jobDescription,
      requirements: request.skillRequirements as any,
      visibility: 'PUBLIC',
      status: 'PUBLISHED',
      expireDate: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000),
    },
  });

  // 9. Candidate CVs, applications & CV Embeddings (pgvector column is raw and separate)
  const cvSamples = [
    {
      fileName: 'alex_rivera_cv.pdf',
      filePath: 'services/gateway/uploads/cv/sample-alex-rivera.pdf',
      rawText:
        'Alex Rivera CV: Senior TypeScript Engineer with 8 years in TypeScript, Node.js, React, PostgreSQL, Prisma, and microservices. Led API platform migrations and mentored backend teams.',
      status: 'INTERVIEWING',
    },
    {
      fileName: 'priya_sharma_cv.pdf',
      filePath: 'services/gateway/uploads/cv/sample-priya-sharma.pdf',
      rawText:
        'Priya Sharma CV: Backend Engineer with 6 years in Go, PostgreSQL, Redis, Kafka, Docker, and Kubernetes. Built distributed fintech services and high-throughput data pipelines.',
      status: 'SCREENING',
    },
    {
      fileName: 'tomas_garcia_cv.pdf',
      filePath: 'services/gateway/uploads/cv/sample-tomas-garcia.pdf',
      rawText:
        'Tomas Garcia CV: DevOps and Platform Engineer with AWS, Kubernetes, Terraform, Linux, monitoring, incident response, and CI/CD automation experience.',
      status: 'SUBMITTED',
    },
    {
      fileName: 'mina_nguyen_cv.pdf',
      filePath: 'services/gateway/uploads/cv/sample-mina-nguyen.pdf',
      rawText:
        'Mina Nguyen CV: Frontend Engineer with React, TypeScript, Tailwind CSS, accessibility, design systems, and enterprise dashboard experience.',
      status: 'SUBMITTED',
    },
    {
      fileName: 'jordan_lee_cv.pdf',
      filePath: 'services/gateway/uploads/cv/sample-jordan-lee.pdf',
      rawText:
        'Jordan Lee CV: QA Automation Engineer with Playwright, TypeScript, API testing, Postman, CI/CD quality gates, regression suites, and release validation.',
      status: 'SCREENING',
    },
  ];

  for (let i = 0; i < createdProfiles.length; i++) {
    const profile = createdProfiles[i];
    const cv = cvSamples[i];
    if (!profile || !cv) continue;

    await prisma.application.create({
      data: {
        requestId: request.id,
        candidateId: profile.id,
        status: cv.status,
      },
    });

    const candidateCv = await prisma.candidateCV.create({
      data: {
        candidateId: profile.id,
        fileName: cv.fileName,
        fileType: 'PDF',
        filePath: cv.filePath,
        rawText: cv.rawText,
        parsedAt: new Date(),
        screeningStatus: cv.status === 'SUBMITTED' ? 'PENDING' : 'SHORTLISTED',
      },
    });

    const embeddingRecord = await prisma.cvEmbedding.create({
      data: {
        cvDocumentId: candidateCv.id,
        chunkIndex: 0,
        chunkText: cv.rawText,
      },
      select: { id: true },
    });

    const vectorStr = `[${sampleEmbedding(i).join(',')}]`;
    await prisma.$executeRawUnsafe(
      `UPDATE cv_embeddings SET embedding = $1::vector WHERE id = $2`,
      vectorStr,
      embeddingRecord.id,
    );
  }

  // 10. Interview schedule and result
  const interview = await prisma.interviewSchedule.create({
    data: {
      requestId: request.id,
      candidateId: firstProfile.id,
      scheduledAt: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2 days
      duration: 60,
      location: 'https://meet.google.com/abc-defg-hij',
      interviewers: [hrManager.id, dhEng.id],
      status: 'COMPLETED',
    },
  });

  await prisma.interviewResult.create({
    data: {
      interviewId: interview.id,
      result: 'PASS',
      notes: 'Excellent coding skills. Deep knowledge of microservices and SQL.',
    },
  });

  // 11. Notification and Email logs
  await prisma.notification.create({
    data: {
      userId: dhEng.id,
      type: 'REQUEST_UPDATE',
      title: 'Recruitment Plan Approved',
      body: `Your recruitment campaign plan for ${request.position} has been approved by the Admin.`,
      relatedEntityId: request.id,
      relatedEntityType: 'RecruitmentRequest',
    },
  });

  await prisma.emailLog.create({
    data: {
      userId: firstCandidate.id,
      toEmail: firstCandidate.email,
      subject: 'Interview Invitation',
      body: 'You have been invited to interview for the Senior TypeScript Engineer position.',
      status: 'SENT',
      sentAt: new Date(),
    },
  });

  console.log('🎉 Seed complete! Seeding finished successfully.');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
