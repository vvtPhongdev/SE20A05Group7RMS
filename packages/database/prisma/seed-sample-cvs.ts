import { mkdir, writeFile } from 'fs/promises';
import { dirname, resolve } from 'path';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const passwordHash = '$2a$12$oHJcxrO8y3AeozTP//ubrumF6T3ZLjDDJxrF.mib4yYGmjsyVddle'; // Password123!

const uploadsDir = resolve(process.cwd(), '..', '..', 'services', 'gateway', 'uploads', 'cv');

const sampleEmbedding = (seed: number) =>
  Array.from({ length: 384 }, (_, index) =>
    Number((Math.sin((seed + 1) * (index + 1)) * 0.05).toFixed(6)),
  );

const pdfEscape = (text: string) => text.replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');

function buildPdf(lines: string[]) {
  const content = [
    'BT',
    '/F1 12 Tf',
    '50 760 Td',
    '16 TL',
    ...lines.map((line) => `(${pdfEscape(line)}) Tj T*`),
    'ET',
  ].join('\n');

  const objects = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>',
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
    `<< /Length ${Buffer.byteLength(content, 'utf8')} >>\nstream\n${content}\nendstream`,
  ];

  let pdf = '%PDF-1.4\n';
  const offsets = [0];

  objects.forEach((object, index) => {
    offsets.push(Buffer.byteLength(pdf, 'utf8'));
    pdf += `${index + 1} 0 obj\n${object}\nendobj\n`;
  });

  const xrefOffset = Buffer.byteLength(pdf, 'utf8');
  pdf += `xref\n0 ${objects.length + 1}\n`;
  pdf += '0000000000 65535 f \n';
  offsets.slice(1).forEach((offset) => {
    pdf += `${String(offset).padStart(10, '0')} 00000 n \n`;
  });
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF\n`;

  return Buffer.from(pdf, 'utf8');
}

const samples = [
  {
    email: 'candidate1@acme.com',
    displayName: 'Alex Rivera',
    phone: '123-456-7890',
    fileName: 'alex_rivera_cv.pdf',
    storedFileName: 'sample-alex-rivera.pdf',
    summary: 'Senior Full-Stack Developer with 8 years of experience in React and Node.js.',
    structuredData: {
      title: 'Senior TypeScript Engineer',
      role: 'Backend Engineer',
      location: 'Ho Chi Minh City',
      skills: ['TypeScript', 'Node.js', 'React', 'PostgreSQL', 'Prisma', 'Microservices'],
      experienceYears: 8,
    },
    rawText:
      'Alex Rivera CV: Senior TypeScript Engineer with 8 years in TypeScript, Node.js, React, PostgreSQL, Prisma, and microservices. Led API platform migrations and mentored backend teams.',
    applicationStatus: 'INTERVIEWING',
  },
  {
    email: 'candidate2@acme.com',
    displayName: 'Priya Sharma',
    phone: '987-654-3210',
    fileName: 'priya_sharma_cv.pdf',
    storedFileName: 'sample-priya-sharma.pdf',
    summary: 'Backend engineer specializing in Go, PostgreSQL, Redis, and distributed systems.',
    structuredData: {
      title: 'Backend Engineer',
      role: 'Backend Engineer',
      location: 'Ha Noi',
      skills: ['Go', 'PostgreSQL', 'Redis', 'Kafka', 'Docker', 'Kubernetes'],
      experienceYears: 6,
    },
    rawText:
      'Priya Sharma CV: Backend Engineer with 6 years in Go, PostgreSQL, Redis, Kafka, Docker, and Kubernetes. Built distributed fintech services and high-throughput data pipelines.',
    applicationStatus: 'SCREENING',
  },
  {
    email: 'candidate3@acme.com',
    displayName: 'Tomas Garcia',
    phone: '555-555-5555',
    fileName: 'tomas_garcia_cv.pdf',
    storedFileName: 'sample-tomas-garcia.pdf',
    summary: 'DevOps engineer with extensive AWS and Kubernetes experience.',
    structuredData: {
      title: 'DevOps Engineer',
      role: 'Platform Engineer',
      location: 'Da Nang',
      skills: ['AWS', 'Kubernetes', 'Terraform', 'CI/CD', 'Linux', 'Monitoring'],
      experienceYears: 7,
    },
    rawText:
      'Tomas Garcia CV: DevOps and Platform Engineer with AWS, Kubernetes, Terraform, Linux, monitoring, incident response, and CI/CD automation experience.',
    applicationStatus: 'SUBMITTED',
  },
  {
    email: 'candidate4@acme.com',
    displayName: 'Mina Nguyen',
    phone: '555-010-4444',
    fileName: 'mina_nguyen_cv.pdf',
    storedFileName: 'sample-mina-nguyen.pdf',
    summary: 'Frontend engineer building accessible React and design-system experiences.',
    structuredData: {
      title: 'Frontend Engineer',
      role: 'Frontend Engineer',
      location: 'Ho Chi Minh City',
      skills: ['React', 'TypeScript', 'Tailwind CSS', 'Accessibility', 'Design Systems'],
      experienceYears: 5,
    },
    rawText:
      'Mina Nguyen CV: Frontend Engineer with React, TypeScript, Tailwind CSS, accessibility, design systems, and enterprise dashboard experience.',
    applicationStatus: 'SUBMITTED',
  },
  {
    email: 'candidate5@acme.com',
    displayName: 'Jordan Lee',
    phone: '555-010-5555',
    fileName: 'jordan_lee_cv.pdf',
    storedFileName: 'sample-jordan-lee.pdf',
    summary: 'QA automation engineer focused on Playwright, API testing, and release quality.',
    structuredData: {
      title: 'QA Automation Engineer',
      role: 'QA Engineer',
      location: 'Remote',
      skills: ['Playwright', 'TypeScript', 'API Testing', 'Postman', 'CI/CD'],
      experienceYears: 4,
    },
    rawText:
      'Jordan Lee CV: QA Automation Engineer with Playwright, TypeScript, API testing, Postman, CI/CD quality gates, regression suites, and release validation.',
    applicationStatus: 'SCREENING',
  },
];

async function main() {
  const org = await prisma.organization.upsert({
    where: { slug: 'acme-corp' },
    update: {},
    create: { name: 'Acme Corporation', slug: 'acme-corp' },
  });

  const [admin, hrLeader, deptHead] = await Promise.all([
    prisma.user.upsert({
      where: { email: 'admin@acme.com' },
      update: {},
      create: {
        email: 'admin@acme.com',
        displayName: 'Admin User',
        role: 'ADMIN',
        passwordHash,
        organizationId: org.id,
      },
    }),
    prisma.user.upsert({
      where: { email: 'hr@acme.com' },
      update: {},
      create: {
        email: 'hr@acme.com',
        displayName: 'Emily Wong',
        role: 'HR_LEADER',
        passwordHash,
        organizationId: org.id,
      },
    }),
    prisma.user.upsert({
      where: { email: 'depthead@acme.com' },
      update: {},
      create: {
        email: 'depthead@acme.com',
        displayName: 'Sarah Chen',
        role: 'DEPARTMENT_HEAD',
        passwordHash,
        organizationId: org.id,
      },
    }),
  ]);

  const dept = await prisma.department.upsert({
    where: { organizationId_code: { organizationId: org.id, code: 'ENG' } },
    update: { headUserId: deptHead.id },
    create: {
      organizationId: org.id,
      name: 'Engineering',
      code: 'ENG',
      headUserId: deptHead.id,
    },
  });

  await prisma.user.update({ where: { id: deptHead.id }, data: { departmentId: dept.id } });

  let request = await prisma.recruitmentRequest.findFirst({
    where: { departmentId: dept.id, position: 'Senior TypeScript Engineer' },
    orderBy: { createdAt: 'desc' },
  });

  if (!request) {
    request = await prisma.recruitmentRequest.create({
      data: {
        departmentId: dept.id,
        createdById: deptHead.id,
        position: 'Senior TypeScript Engineer',
        headcount: 2,
        jobDescription:
          'Looking for a Senior TypeScript Engineer to lead core systems development.',
        skillRequirements: { required: ['TypeScript', 'Node.js', 'Prisma', 'PostgreSQL'] },
        justification: 'Increasing team bandwidth for new enterprise capabilities.',
        urgency: 'HIGH',
        status: 'PLAN_APPROVED',
        reviewedById: hrLeader.id,
        approvedById: admin.id,
      },
    });
  }

  await prisma.jobPosting.upsert({
    where: { requestId: request.id },
    update: { status: 'PUBLISHED', visibility: 'PUBLIC' },
    create: {
      requestId: request.id,
      title: request.position,
      description: request.jobDescription,
      requirements: request.skillRequirements as any,
      visibility: 'PUBLIC',
      status: 'PUBLISHED',
      expireDate: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000),
    },
  });

  await mkdir(uploadsDir, { recursive: true });

  for (let index = 0; index < samples.length; index++) {
    const sample = samples[index];
    const pdfPath = resolve(uploadsDir, sample.storedFileName);

    await writeFile(
      pdfPath,
      buildPdf([
        sample.displayName,
        sample.structuredData.title,
        sample.summary,
        `Skills: ${sample.structuredData.skills.join(', ')}`,
        sample.rawText,
      ]),
    );

    const user = await prisma.user.upsert({
      where: { email: sample.email },
      update: {
        displayName: sample.displayName,
        role: 'CANDIDATE',
        organizationId: org.id,
        passwordHash,
      },
      create: {
        email: sample.email,
        displayName: sample.displayName,
        role: 'CANDIDATE',
        passwordHash,
        organizationId: org.id,
      },
    });

    const profile = await prisma.candidateProfile.upsert({
      where: { userId: user.id },
      update: {
        fullName: sample.displayName,
        email: sample.email,
        phone: sample.phone,
        summary: sample.summary,
        structuredData: sample.structuredData,
      },
      create: {
        userId: user.id,
        fullName: sample.displayName,
        email: sample.email,
        phone: sample.phone,
        summary: sample.summary,
        structuredData: sample.structuredData,
      },
    });

    const oldCvs = await prisma.candidateCV.findMany({
      where: { candidateId: profile.id, fileName: sample.fileName },
      select: { id: true },
    });
    await prisma.cvEmbedding.deleteMany({
      where: { cvDocumentId: { in: oldCvs.map((cv) => cv.id) } },
    });
    await prisma.candidateCV.deleteMany({
      where: { candidateId: profile.id, fileName: sample.fileName },
    });

    await prisma.application.upsert({
      where: { requestId_candidateId: { requestId: request.id, candidateId: profile.id } },
      update: { status: sample.applicationStatus },
      create: {
        requestId: request.id,
        candidateId: profile.id,
        status: sample.applicationStatus,
      },
    });

    const cv = await prisma.candidateCV.create({
      data: {
        candidateId: profile.id,
        fileName: sample.fileName,
        fileType: 'PDF',
        filePath: pdfPath,
        rawText: sample.rawText,
        parsedAt: new Date(),
        screeningStatus: sample.applicationStatus === 'SUBMITTED' ? 'PENDING' : 'SHORTLISTED',
      },
    });

    const embedding = await prisma.cvEmbedding.create({
      data: {
        cvDocumentId: cv.id,
        chunkIndex: 0,
        chunkText: sample.rawText,
      },
      select: { id: true },
    });

    await prisma.$executeRawUnsafe(
      'UPDATE cv_embeddings SET embedding = $1::vector WHERE id = $2',
      `[${sampleEmbedding(index).join(',')}]`,
      embedding.id,
    );
  }

  console.log('Seeded 5 candidate accounts, 5 PDF CVs, parsed profiles, applications, and embeddings.');
}

main()
  .catch((error) => {
    console.error('Failed to seed sample CV data:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
