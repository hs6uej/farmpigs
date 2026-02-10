const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function createAdmin() {
  try {
    const hashedPassword = await bcrypt.hash('Forum#118811', 10);
    
    const admin = await prisma.user.upsert({
      where: { email: 'suwit1968@gmail.com' },
      update: {
        password: hashedPassword,
        role: 'ADMIN',
        name: 'Suwit'
      },
      create: {
        email: 'suwit1968@gmail.com',
        name: 'Suwit',
        password: hashedPassword,
        role: 'ADMIN'
      }
    });
    
    console.log('✅ Admin user created/updated successfully!');
    console.log('Email:', admin.email);
    console.log('Role:', admin.role);
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createAdmin();
