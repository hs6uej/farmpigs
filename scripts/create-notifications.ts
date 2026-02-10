import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // สร้างการแจ้งเตือน 4 รายการ (broadcast - userId = null เพื่อให้ทุกคนเห็น)
  const notifications = [
    {
      userId: null,
      title: 'แม่หมูคลอดลูกแล้ว',
      message: 'แม่หมูหมายเลข S-001 คลอดลูกหมูจำนวน 12 ตัว เมื่อเวลา 08:30 น.',
      type: 'SUCCESS' as const,
      category: 'FARROWING',
      link: '/farrowing',
    },
    {
      userId: null,
      title: 'เตือนฉีดวัคซีน',
      message: 'ลูกหมูรุ่นที่ 2024-12 ต้องฉีดวัคซีน PCV2 ภายในวันนี้ จำนวน 45 ตัว',
      type: 'WARNING' as const,
      category: 'HEALTH',
      link: '/health',
    },
    {
      userId: null,
      title: 'อาหารใกล้หมด',
      message: 'อาหารหมูสูตร Starter เหลือเพียง 500 กก. กรุณาสั่งเพิ่ม',
      type: 'ERROR' as const,
      category: 'FEED',
      link: '/feed',
    },
    {
      userId: null,
      title: 'รายงานประจำสัปดาห์',
      message: 'รายงานสรุปผลการเลี้ยงประจำสัปดาห์ที่ 52 พร้อมให้ตรวจสอบแล้ว',
      type: 'INFO' as const,
      category: 'REPORTS',
      link: '/reports',
    },
  ];

  console.log('กำลังสร้างการแจ้งเตือน...');

  for (const notification of notifications) {
    const created = await prisma.notification.create({
      data: notification,
    });
    console.log(`✅ สร้างแจ้งเตือน: ${created.title}`);
  }

  console.log('\n🎉 สร้างการแจ้งเตือนทั้ง 4 รายการเรียบร้อยแล้ว!');
}

main()
  .catch((e) => {
    console.error('Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
