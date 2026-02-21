const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const userCount = await prisma.user.count();
    const users = await prisma.user.findMany({
        select: { id: true, username: true, email: true, role: true, lockedAt: true, lockedUntil: true }
    });
    console.log('User count:', userCount);
    console.log('Users:', JSON.stringify(users, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
