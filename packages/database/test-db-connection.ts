import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function run() {
  try {
    console.log('Connecting to Prisma DB...');
    const usersCount = await prisma.user.count();
    console.log(`Connection successful. Total users in database: ${usersCount}`);

    // Try creating a test user and deleting it
    const testEmail = `test_temp_${Date.now()}@example.com`;
    console.log(`Creating test user with email ${testEmail}...`);
    
    // Check if Acme corp org exists
    let organization = await prisma.organization.findFirst();
    if (!organization) {
      organization = await prisma.organization.create({
        data: {
          name: 'Acme Corporation',
          slug: 'acme-corp',
        },
      });
    }

    const testUser = await prisma.user.create({
      data: {
        email: testEmail,
        displayName: 'Test Temp User',
        role: 'CANDIDATE',
        passwordHash: 'hashed-pwd',
        organizationId: organization.id,
        isActive: false,
      },
    });

    console.log(`User created successfully: ${JSON.stringify(testUser)}`);

    console.log('Deleting test user...');
    await prisma.user.delete({
      where: { id: testUser.id },
    });
    console.log('Test user deleted.');
  } catch (err: any) {
    console.error('Error running prisma query:', err);
  } finally {
    await prisma.$disconnect();
  }
}

run();
