/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useSidebar } from './sidebar-provider';
import Header from './header';

export default function DashboardContent({ 
  children,
  translations,
  locale = 'th'
}: { 
  children: React.ReactNode;
  translations: any;
  locale?: string;
}) {
  const { collapsed } = useSidebar();

  return (
    <div 
      className={`flex-1 flex flex-col h-screen transition-all duration-300 ${
        collapsed ? 'lg:ml-16' : 'lg:ml-64'
      }`}
    >
      {/* Fixed Header */}
      <Header translations={translations} locale={locale} />
      
      {/* Scrollable Content Area */}
      <main className="flex-1 overflow-y-auto bg-gray-100 dark:bg-[#0f0d1a]">
        {children}
        
        {/* Footer */}
        <footer className="py-4 px-6 text-center text-xs text-gray-500 dark:text-gray-400 border-t border-gray-200 dark:border-[#8B8D98]/20 bg-white dark:bg-[#0f0d1a]">
          <p>Copyright © 2025, Methasit J. All rights reserved.</p>
        </footer>
      </main>
    </div>
  );
}
