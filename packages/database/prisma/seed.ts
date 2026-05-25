import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding Works Reruiter database...');

  // ─── Organization ──────────────────────────────────────────────
  const org = await prisma.organization.upsert({
    where: { slug: 'acme-corp' },
    update: {},
    create: {
      name: 'Acme Corporation',
      slug: 'acme-corp',
    },
  });
  console.log(`  ✅ Organization: ${org.name}`);

  // ─── Users ─────────────────────────────────────────────────────
  // Password hash for "Password123!" (bcrypt 12 rounds)
  // In production, generate with: await bcrypt.hash('Password123!', 12)
  const passwordHash = '$2b$12$LJ3m4ys9xCR.pPJ0qkbKqeHHmN0BVPGz7v8TmJ6q4.kIqz1uPrO7K';

  const users = [
    { email: 'admin@acme.com', displayName: 'Admin User', role: 'ADMIN' },
    { email: 'dh.engineering@acme.com', displayName: 'Sarah Chen', role: 'DEPARTMENT_HEAD' },
    { email: 'dh.product@acme.com', displayName: 'Marcus Johnson', role: 'DEPARTMENT_HEAD' },
    { email: 'hm.senior@acme.com', displayName: 'Emily Wong', role: 'HIRING_MANAGER' },
    { email: 'hm.vp@acme.com', displayName: 'David Park', role: 'HIRING_MANAGER' },
    { email: 'recruiter1@acme.com', displayName: 'Lisa Thompson', role: 'RECRUITER' },
    { email: 'recruiter2@acme.com', displayName: 'James Wilson', role: 'RECRUITER' },
    { email: 'candidate1@gmail.com', displayName: 'Alex Rivera', role: 'CANDIDATE' },
    { email: 'candidate2@gmail.com', displayName: 'Priya Sharma', role: 'CANDIDATE' },
    { email: 'candidate3@gmail.com', displayName: 'Tomás García', role: 'CANDIDATE' },
    { email: 'candidate4@gmail.com', displayName: 'Yuki Tanaka', role: 'CANDIDATE' },
    { email: 'candidate5@gmail.com', displayName: 'Olena Kovalenko', role: 'CANDIDATE' },
  ];

  const createdUsers: Record<string, any> = {};
  for (const u of users) {
    const user = await prisma.user.upsert({
      where: { email: u.email },
      update: {},
      create: { ...u, passwordHash },
    });
    createdUsers[u.email] = user;
  }
  console.log(`  ✅ Users: ${users.length} created`);

  // ─── Organization Members ──────────────────────────────────────
  const adminUser = createdUsers['admin@acme.com'];
  await prisma.organizationMember.upsert({
    where: {
      userId_organizationId: {
        userId: adminUser.id,
        organizationId: org.id,
      },
    },
    update: {},
    create: {
      userId: adminUser.id,
      organizationId: org.id,
      memberRole: 'OWNER',
    },
  });

  // Add all non-candidate users as members
  for (const [email, user] of Object.entries(createdUsers)) {
    if (user.role === 'CANDIDATE') continue;
    if (email === 'admin@acme.com') continue; // already added

    await prisma.organizationMember.upsert({
      where: {
        userId_organizationId: {
          userId: user.id,
          organizationId: org.id,
        },
      },
      update: {},
      create: {
        userId: user.id,
        organizationId: org.id,
        memberRole: 'MEMBER',
      },
    });
  }
  console.log(`  ✅ Organization members assigned`);

  // ─── Departments ───────────────────────────────────────────────
  const departments = [
    {
      name: 'Engineering',
      code: 'ENG',
      headUserId: createdUsers['dh.engineering@acme.com'].id,
    },
    {
      name: 'Product Management',
      code: 'PRODUCT',
      headUserId: createdUsers['dh.product@acme.com'].id,
    },
    {
      name: 'Design',
      code: 'DESIGN',
      headUserId: null,
    },
  ];

  const createdDepts: Record<string, any> = {};
  for (const d of departments) {
    const dept = await prisma.department.upsert({
      where: {
        organizationId_code: {
          organizationId: org.id,
          code: d.code,
        },
      },
      update: {},
      create: {
        organizationId: org.id,
        name: d.name,
        code: d.code,
        headUserId: d.headUserId,
      },
    });
    createdDepts[d.code] = dept;
  }
  console.log(`  ✅ Departments: ${departments.length} created`);

  // ─── Approval Chain ────────────────────────────────────────────
  const chain = await prisma.approvalChain.create({
    data: {
      organizationId: org.id,
      name: 'Default 2-Level Approval',
      isDefault: true,
      levels: {
        create: [
          {
            level: 1,
            approverUserId: createdUsers['hm.senior@acme.com'].id,
            role: 'LEVEL_1',
          },
          {
            level: 2,
            approverUserId: createdUsers['hm.vp@acme.com'].id,
            role: 'LEVEL_2',
          },
        ],
      },
    },
  });
  console.log(`  ✅ Approval chain: ${chain.name} (${2} levels)`);

  // ─── Skill Nodes ───────────────────────────────────────────────
  const skills = [
    // Languages
    { canonicalName: 'JavaScript', category: 'LANGUAGE', aliases: ['JS', 'ECMAScript'] },
    { canonicalName: 'TypeScript', category: 'LANGUAGE', aliases: ['TS'] },
    { canonicalName: 'Python', category: 'LANGUAGE', aliases: ['Python3', 'Py'] },
    { canonicalName: 'Java', category: 'LANGUAGE', aliases: [] },
    { canonicalName: 'Go', category: 'LANGUAGE', aliases: ['Golang'] },
    { canonicalName: 'Rust', category: 'LANGUAGE', aliases: [] },
    { canonicalName: 'C#', category: 'LANGUAGE', aliases: ['CSharp', 'C Sharp'] },
    { canonicalName: 'SQL', category: 'LANGUAGE', aliases: [] },
    // Frameworks
    { canonicalName: 'React', category: 'FRAMEWORK', aliases: ['ReactJS', 'React.js'] },
    { canonicalName: 'Next.js', category: 'FRAMEWORK', aliases: ['NextJS'] },
    { canonicalName: 'NestJS', category: 'FRAMEWORK', aliases: ['Nest.js'] },
    { canonicalName: 'Express.js', category: 'FRAMEWORK', aliases: ['Express'] },
    { canonicalName: 'Angular', category: 'FRAMEWORK', aliases: ['AngularJS'] },
    { canonicalName: 'Vue.js', category: 'FRAMEWORK', aliases: ['Vue', 'VueJS'] },
    { canonicalName: 'Django', category: 'FRAMEWORK', aliases: [] },
    { canonicalName: 'FastAPI', category: 'FRAMEWORK', aliases: [] },
    { canonicalName: 'Spring Boot', category: 'FRAMEWORK', aliases: ['Spring'] },
    // Databases
    { canonicalName: 'PostgreSQL', category: 'DATABASE', aliases: ['Postgres', 'PG'] },
    { canonicalName: 'MongoDB', category: 'DATABASE', aliases: ['Mongo'] },
    { canonicalName: 'Redis', category: 'DATABASE', aliases: [] },
    { canonicalName: 'MySQL', category: 'DATABASE', aliases: [] },
    { canonicalName: 'Elasticsearch', category: 'DATABASE', aliases: ['ES', 'Elastic'] },
    // Cloud
    { canonicalName: 'AWS', category: 'CLOUD', aliases: ['Amazon Web Services'] },
    { canonicalName: 'Google Cloud', category: 'CLOUD', aliases: ['GCP', 'Google Cloud Platform'] },
    { canonicalName: 'Azure', category: 'CLOUD', aliases: ['Microsoft Azure'] },
    // DevOps
    { canonicalName: 'Docker', category: 'DEVOPS', aliases: [] },
    { canonicalName: 'Kubernetes', category: 'DEVOPS', aliases: ['K8s'] },
    { canonicalName: 'Terraform', category: 'DEVOPS', aliases: ['TF'] },
    { canonicalName: 'CI/CD', category: 'DEVOPS', aliases: ['Continuous Integration'] },
    { canonicalName: 'GitHub Actions', category: 'DEVOPS', aliases: ['GHA'] },
    // Tools
    { canonicalName: 'Git', category: 'TOOL', aliases: [] },
    { canonicalName: 'Prisma', category: 'TOOL', aliases: ['Prisma ORM'] },
    { canonicalName: 'GraphQL', category: 'TOOL', aliases: ['GQL'] },
    { canonicalName: 'REST API', category: 'TOOL', aliases: ['RESTful'] },
    // Paradigms
    { canonicalName: 'Microservices', category: 'PARADIGM', aliases: [] },
    { canonicalName: 'Event-Driven Architecture', category: 'PARADIGM', aliases: ['EDA'] },
    { canonicalName: 'Domain-Driven Design', category: 'PARADIGM', aliases: ['DDD'] },
    { canonicalName: 'Test-Driven Development', category: 'PARADIGM', aliases: ['TDD'] },
    // Domains
    { canonicalName: 'Machine Learning', category: 'DOMAIN', aliases: ['ML'] },
    { canonicalName: 'Data Engineering', category: 'DOMAIN', aliases: [] },
    { canonicalName: 'Frontend Development', category: 'DOMAIN', aliases: ['FE', 'Front-end'] },
    { canonicalName: 'Backend Development', category: 'DOMAIN', aliases: ['BE', 'Back-end'] },
    { canonicalName: 'DevOps Engineering', category: 'DOMAIN', aliases: ['SRE', 'Platform Engineering'] },
    { canonicalName: 'Mobile Development', category: 'DOMAIN', aliases: ['Mobile Dev'] },
    { canonicalName: 'System Design', category: 'DOMAIN', aliases: ['Architecture'] },
  ];

  for (const skill of skills) {
    await prisma.skillNode.upsert({
      where: { canonicalName: skill.canonicalName },
      update: {},
      create: {
        canonicalName: skill.canonicalName,
        category: skill.category,
        aliases: skill.aliases,
      },
    });
  }
  console.log(`  ✅ Skill nodes: ${skills.length} created`);

  // ─── Skill Edges ───────────────────────────────────────────────
  const skillNodes = await prisma.skillNode.findMany();
  const nodeMap = new Map(skillNodes.map((n) => [n.canonicalName, n.id]));

  const edges = [
    // IS_A relationships
    { from: 'React', to: 'Frontend Development', rel: 'IS_A' },
    { from: 'Angular', to: 'Frontend Development', rel: 'IS_A' },
    { from: 'Vue.js', to: 'Frontend Development', rel: 'IS_A' },
    { from: 'NestJS', to: 'Backend Development', rel: 'IS_A' },
    { from: 'Express.js', to: 'Backend Development', rel: 'IS_A' },
    { from: 'Django', to: 'Backend Development', rel: 'IS_A' },
    { from: 'FastAPI', to: 'Backend Development', rel: 'IS_A' },
    { from: 'Spring Boot', to: 'Backend Development', rel: 'IS_A' },
    // REQUIRES relationships
    { from: 'React', to: 'JavaScript', rel: 'REQUIRES' },
    { from: 'Next.js', to: 'React', rel: 'REQUIRES' },
    { from: 'NestJS', to: 'TypeScript', rel: 'REQUIRES' },
    { from: 'Angular', to: 'TypeScript', rel: 'REQUIRES' },
    { from: 'Express.js', to: 'JavaScript', rel: 'REQUIRES' },
    { from: 'Django', to: 'Python', rel: 'REQUIRES' },
    { from: 'FastAPI', to: 'Python', rel: 'REQUIRES' },
    { from: 'Spring Boot', to: 'Java', rel: 'REQUIRES' },
    { from: 'Kubernetes', to: 'Docker', rel: 'REQUIRES' },
    // RELATED_TO relationships
    { from: 'React', to: 'Angular', rel: 'RELATED_TO' },
    { from: 'React', to: 'Vue.js', rel: 'RELATED_TO' },
    { from: 'PostgreSQL', to: 'MySQL', rel: 'RELATED_TO' },
    { from: 'AWS', to: 'Google Cloud', rel: 'RELATED_TO' },
    { from: 'AWS', to: 'Azure', rel: 'RELATED_TO' },
    { from: 'TypeScript', to: 'JavaScript', rel: 'VARIANT_OF' },
    // PART_OF relationships
    { from: 'Prisma', to: 'NestJS', rel: 'PART_OF' },
    { from: 'Express.js', to: 'NestJS', rel: 'PART_OF' },
  ];

  for (const edge of edges) {
    const fromId = nodeMap.get(edge.from);
    const toId = nodeMap.get(edge.to);
    if (!fromId || !toId) continue;

    await prisma.skillEdge.upsert({
      where: {
        fromNodeId_toNodeId_relationship: {
          fromNodeId: fromId,
          toNodeId: toId,
          relationship: edge.rel,
        },
      },
      update: {},
      create: {
        fromNodeId: fromId,
        toNodeId: toId,
        relationship: edge.rel,
        weight: 1.0,
      },
    });
  }
  console.log(`  ✅ Skill edges: ${edges.length} created`);

  // ─── Candidate Profiles ────────────────────────────────────────
  const candidateEmails = [
    'candidate1@gmail.com',
    'candidate2@gmail.com',
    'candidate3@gmail.com',
    'candidate4@gmail.com',
    'candidate5@gmail.com',
  ];

  const profileData = [
    { headline: 'Senior Full-Stack Developer', summary: '8 years of experience in React, Node.js, and PostgreSQL. Built and scaled SaaS products serving 100K+ users.', visibility: 'PUBLIC', preferredWorkMode: 'REMOTE', yearsOfExperience: 8 },
    { headline: 'ML Engineer & Data Scientist', summary: 'PhD in Computer Science. 5 years building ML pipelines with Python, TensorFlow, and AWS SageMaker.', visibility: 'PUBLIC', preferredWorkMode: 'HYBRID', yearsOfExperience: 5 },
    { headline: 'DevOps & Platform Engineer', summary: 'Expert in Kubernetes, Terraform, and AWS. Reduced deployment times by 80% at previous startup.', visibility: 'REGISTERED_ONLY', preferredWorkMode: 'ONSITE', yearsOfExperience: 6 },
    { headline: 'Frontend Developer (React/TypeScript)', summary: '4 years of experience building responsive web applications with React, TypeScript, and Next.js.', visibility: 'PUBLIC', preferredWorkMode: 'REMOTE', yearsOfExperience: 4 },
    { headline: 'Backend Engineer (Go/Rust)', summary: 'Systems programmer with 7 years experience. Focus on high-performance APIs and distributed systems.', visibility: 'PRIVATE', preferredWorkMode: 'HYBRID', yearsOfExperience: 7 },
  ];

  for (let i = 0; i < candidateEmails.length; i++) {
    const user = createdUsers[candidateEmails[i]];
    const data = profileData[i];

    await prisma.candidateProfile.upsert({
      where: { userId: user.id },
      update: {},
      create: {
        userId: user.id,
        headline: data.headline,
        summary: data.summary,
        visibility: data.visibility,
        preferredWorkMode: data.preferredWorkMode,
        yearsOfExperience: data.yearsOfExperience,
      },
    });
  }
  console.log(`  ✅ Candidate profiles: ${candidateEmails.length} created`);

  console.log('\n🎉 Seed complete!');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
