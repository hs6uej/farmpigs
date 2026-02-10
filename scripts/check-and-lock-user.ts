import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const email = 'mac77717778@gmail.com';
  
  // ตรวจสอบสถานะผู้ใช้
  const user = await prisma.user.findUnique({
    where: { email },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      failedLoginAttempts: true,
      lockedAt: true,
      lockedUntil: true,
      lockedReason: true,
    }
  });

  if (!user) {
    console.log(`User ${email} not found`);
    return;
  }

  console.log('Current user status:');
  console.log(JSON.stringify(user, null, 2));

  if (!user.lockedAt) {
    console.log('\nUser is NOT locked. Locking now...');
    
    // ล็อคผู้ใช้
    const updatedUser = await prisma.user.update({
      where: { email },
      data: {
        lockedAt: new Date(),
        lockedReason: 'Locked by admin',
        failedLoginAttempts: 5,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        failedLoginAttempts: true,
        lockedAt: true,
        lockedUntil: true,
        lockedReason: true,
      }
    });

    console.log('\nUser has been locked:');
    console.log(JSON.stringify(updatedUser, null, 2));
  } else {
    console.log('\nUser is already locked');
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
