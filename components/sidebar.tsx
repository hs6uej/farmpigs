/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTheme } from 'next-themes';
import { signOut, useSession } from 'next-auth/react';
import {
  LayoutDashboard,
  Rabbit,
  Factory,
  Baby,
  Heart,
  Utensils,
  Home,
  FileText,
  Menu,
  X,
  Languages,
  LogOut,
  ChevronDown,
  ChevronRight,
  Users,
  Activity
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useSidebar } from './sidebar-provider';

interface SidebarProps {
  locale: string;
  translations: any;
}

export default function Sidebar({ locale, translations }: SidebarProps) {
  const { collapsed, setCollapsed } = useSidebar();
  const [breedingOpen, setBreedingOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { data: session } = useSession();

  const isAdmin = session?.user?.role === 'ADMIN';

  // Prevent hydration mismatch
  useEffect(() => {
    const timer = setTimeout(() => setMounted(true), 0);
    return () => clearTimeout(timer);
  }, []);

  const toggleLanguage = async () => {
    const newLocale = locale === 'th' ? 'en' : 'th';
    document.cookie = `NEXT_LOCALE=${newLocale}; path=/`;
    router.refresh();
  };

  const menuItems = [
    {
      title: translations.menu.dashboard,
      icon: LayoutDashboard,
      href: '/dashboard',
      allowUser: true
    },
    {
      title: translations.menu.sows,
      icon: Rabbit,
      href: '/sows',
      allowUser: false
    },
    {
      title: translations.menu.boars,
      icon: Factory,
      href: '/boars',
      allowUser: false
    },
    {
      title: translations.menu.piglets,
      icon: Baby,
      href: '/piglets',
      allowUser: false
    },
    {
      title: translations.menu.breedingManagement || 'Breeding Management',
      icon: Heart,
      submenu: [
        { title: translations.menu.breeding, href: '/breeding' },
        { title: translations.menu.farrowing, href: '/farrowing' }
      ],
      allowUser: false
    },
    {
      title: translations.menu.pens,
      icon: Home,
      href: '/pens',
      allowUser: false
    },
    {
      title: translations.menu.health,
      icon: Heart,
      href: '/health',
      allowUser: false
    },
    {
      title: translations.menu.feed,
      icon: Utensils,
      href: '/feed',
      allowUser: false
    },
    {
      title: translations.menu.reports,
      icon: FileText,
      href: '/reports',
      allowUser: true
    },
    {
      title: translations.menu.users,
      icon: Users,
      href: '/users',
      allowUser: false,
      adminOnly: true
    },
    {
      title: translations.menu.activityLogs || 'Activity Logs',
      icon: Activity,
      href: '/activity-logs',
      allowUser: false,
      adminOnly: true
    }
  ].filter(item => isAdmin || item.allowUser);

  return (
    <>
      {/* Mobile menu button */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="lg:hidden fixed top-4 left-4 z-[110] p-2 rounded-lg bg-[#1f1d2e] dark:bg-[#1f1d2e] text-white"
      >
        {collapsed ? <Menu size={24} /> : <X size={24} />}
      </button>

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-full bg-[#1f1d2e] dark:bg-[#1f1d2e] text-white transition-all duration-300 z-[105] flex flex-col border-r border-[#8B8D98]/20 ${
          collapsed ? 'w-0 lg:w-16' : 'w-64'
        } overflow-hidden`}
      >
        {/* Header */}
        <div className="p-6 border-b border-[#8B8D98]/20">
          <div className="flex items-center justify-between">
            {!collapsed && (
              <div>
                {locale === 'en' ? (
                  <h1 className="text-base font-bold tracking-tight flex items-center gap-1 group cursor-default">
                    <span className="text-xl animate-bounce-slow hover:animate-spin transition-all duration-300">🐷</span>
                    <span className="bg-gradient-to-r from-pink-400 via-purple-400 to-indigo-400 bg-[length:200%_auto] animate-gradient bg-clip-text text-transparent font-extrabold italic hover:scale-110 transition-transform duration-300">
                      Pig
                    </span>
                    <span className="bg-gradient-to-r from-indigo-400 via-cyan-400 to-emerald-400 bg-[length:200%_auto] animate-gradient-reverse bg-clip-text text-transparent font-extrabold hover:scale-110 transition-transform duration-300">
                      Farm
                    </span>
                    <span className="text-[10px] font-medium text-gray-400 ml-0.5 self-start mt-0.5 tracking-widest uppercase animate-pulse">
                      Pro
                    </span>
                  </h1>
                ) : (
                  <h1 className="text-base font-semibold tracking-tight flex items-center gap-1">
                    <span className="animate-bounce-slow">🐷</span>
                    <span>{translations.common.appName}</span>
                  </h1>
                )}
              </div>
            )}
            <button
              onClick={() => setCollapsed(!collapsed)}
              className="hidden lg:block p-1.5 hover:bg-[#7800A3]/20 rounded transition-colors"
            >
              {collapsed ? <ChevronRight size={18} /> : <Menu size={18} />}
            </button>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-3 px-2">
          {menuItems.map((item, index) => (
            <div key={index} className="mb-0.5">
              {item.submenu ? (
                <div>
                  <button
                    onClick={() => setBreedingOpen(!breedingOpen)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-md text-sm font-medium hover:bg-[#7800A3]/20 transition-colors ${
                      collapsed ? 'justify-center' : ''
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <item.icon size={18} className="shrink-0" />
                      {!collapsed && <span>{item.title}</span>}
                    </div>
                    {!collapsed && (
                      <ChevronDown
                        size={14}
                        className={`transition-transform ${breedingOpen ? 'rotate-180' : ''}`}
                      />
                    )}
                  </button>
                  {breedingOpen && !collapsed && (
                    <div className="mt-0.5 ml-1">
                      {item.submenu.map((subItem, subIndex) => (
                        <Link
                          key={subIndex}
                          href={subItem.href}
                          className={`block px-3 py-2 pl-9 rounded-md text-sm hover:bg-[#7800A3]/20 transition-colors ${
                            pathname === subItem.href ? 'bg-[#7800A3] text-white font-medium' : 'text-gray-300'
                          }`}
                        >
                          {subItem.title}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <Link
                  href={item.href}
                  className={`flex items-center gap-2.5 px-3 py-2 rounded-md text-sm font-medium hover:bg-[#7800A3]/20 transition-colors ${
                    pathname === item.href ? 'bg-[#7800A3] text-white' : 'text-gray-300'
                  } ${collapsed ? 'justify-center' : ''}`}
                >
                  <item.icon size={18} className="shrink-0" />
                  {!collapsed && <span>{item.title}</span>}
                </Link>
              )}
            </div>
          ))}
        </nav>

        {/* Footer */}
        <div className="border-t border-[#8B8D98]/20 p-3 space-y-1">
          {/* Language Toggle */}
          <button
            onClick={toggleLanguage}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-sm font-medium hover:bg-[#7800A3]/20 transition-colors ${
              collapsed ? 'justify-center' : ''
            }`}
          >
            <Languages size={18} />
            {!collapsed && <span>{locale === 'th' ? 'EN' : 'TH'}</span>}
          </button>

          {/* Sign Out */}
          <button
            onClick={async () => {
              if (isSigningOut) return;
              setIsSigningOut(true);
              await signOut({ redirect: false });
              window.location.href = '/auth/signin';
            }}
            disabled={isSigningOut}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-sm font-medium hover:bg-red-600/90 transition-colors disabled:opacity-50 ${
              collapsed ? 'justify-center' : ''
            }`}
          >
            <LogOut size={18} />
            {!collapsed && <span>{isSigningOut ? '...' : translations.auth.signOut}</span>}
          </button>
        </div>
      </aside>
    </>
  );
}
