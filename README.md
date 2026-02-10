# Pig Farm Management System (ระบบจัดการฟาร์มสุกร)

ระบบจัดการฟาร์มสุกรครบวงจร พัฒนาด้วย Next.js, TypeScript, Tailwind CSS และ PostgreSQL

## Features (ฟีเจอร์)

### 1. การจัดการแม่พันธุ์ (Sow Management)
- ✅ บันทึกประวัติแม่สุกร (หมายเลขประจำตัว, สายพันธุ์, วันเกิด)
- ✅ บันทึกข้อมูลการผสมพันธุ์ (วันที่ผสม, พ่อพันธุ์, วิธีการผสม)
- ✅ บันทึกข้อมูลการคลอด (วันคลอด, จำนวนลูกสุกร, น้ำหนักแรกคลอด)

### 2. การจัดการลูกสุกร/สุกรขุน (Piglet Management)
- ✅ การบันทึกการหย่านม (วันที่หย่านม, น้ำหนัก)
- ✅ การบันทึกการย้ายคอก/จัดกลุ่ม
- ✅ การบันทึกอัตราการเจริญเติบโต (น้ำหนัก ณ ช่วงเวลาต่าง ๆ)

### 3. สุขภาพและการรักษา (Health Management)
- ✅ การบันทึกการให้วัคซีนและยา
- ✅ การบันทึกการป่วยและการรักษา
- ✅ การบันทึกการสูญเสีย (สาเหตุการตาย)

### 4. การวิเคราะห์และการรายงาน (Analytics & Reports)
- ✅ FCR (Feed Conversion Ratio) – อัตราการแลกเนื้อ
- ✅ อัตราการตาย (Mortality Rate)
- ✅ อัตราการผสมติด (Breeding Success Rate)
- ✅ Dashboard สรุปข้อมูลสำคัญ

## Tech Stack

- **Frontend:** Next.js 15, React 19, TypeScript
- **Styling:** Tailwind CSS
- **Backend:** Next.js API Routes
- **Database:** PostgreSQL
- **ORM:** Prisma
- **Form Handling:** React Hook Form, Zod
- **Charts:** Recharts

## Installation (การติดตั้ง)

### 1. Install dependencies

```bash
npm install
```

### 2. Setup database

Update the `.env` file with your PostgreSQL connection string:

```env
DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE?schema=public"
```

Example:
```env
DATABASE_URL="postgresql://postgres:password@localhost:5432/farmpigs?schema=public"
```

### 3. Run Prisma migrations

```bash
npx prisma migrate dev --name init
```

### 4. Generate Prisma client

```bash
npx prisma generate
```

### 5. Run the development server

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
