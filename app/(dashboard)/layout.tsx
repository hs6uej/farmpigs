import Sidebar from "@/components/sidebar";
import { cookies } from 'next/headers';
import { getMessages } from 'next-intl/server';
import { SidebarProvider } from '@/components/sidebar-provider';
import DashboardContent from '@/components/dashboard-content';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const locale = cookieStore.get('NEXT_LOCALE')?.value || 'th';
  const messages = await getMessages({ locale });

  return (
    <SidebarProvider>
      <div className="flex h-screen overflow-hidden">
        <Sidebar locale={locale} translations={messages} />
        <DashboardContent translations={messages} locale={locale}>{children}</DashboardContent>
      </div>
    </SidebarProvider>
  );
}
