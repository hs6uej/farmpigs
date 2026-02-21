/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useTheme } from 'next-themes';
import { signOut, useSession } from 'next-auth/react';
import {
  User,
  Settings,
  Palette,
  HelpCircle,
  ChevronDown,
  ChevronRight,
  LogOut,
  Sun,
  Moon
} from 'lucide-react';
import NotificationCenter from './notification-center';

interface HeaderProps {
  translations: any;
  locale?: string;
}

export default function Header({ translations, locale = 'th' }: HeaderProps) {
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const { theme, setTheme } = useTheme();
  const { data: session } = useSession();
  const [mounted, setMounted] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);

  const isAdmin = session?.user?.role === 'ADMIN';

  useEffect(() => {
    setTimeout(() => setMounted(true));
  }, []);

  useEffect(() => {
    console.log('Header mounted, current theme:', theme);
  }, [theme]);

  // Close profile menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
        setProfileMenuOpen(false);
      }
    };

    if (profileMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [profileMenuOpen]);

  return (
    <header className="relative z-100 bg-white dark:bg-[#0f0d1a] border-b border-gray-200 dark:border-[#8B8D98]/20">
      <div className="flex items-center justify-between px-6 py-3.5">{/* Left side - can add breadcrumbs or page title here */}
        <div></div>

        {/* Right side - Theme Toggle, Notifications & Profile Menu */}
        <div className="flex items-center gap-2">
          {/* Theme Toggle Button */}
          {mounted && (
            <button
              onClick={() => {
                const newTheme = theme === 'dark' ? 'light' : 'dark';
                setTheme(newTheme);
              }}
              className="cursor-pointer relative w-10 h-10 rounded-md flex items-center justify-center hover:bg-gray-100/80 dark:hover:bg-[#7800A3]/35 transition-colors"
              title={theme === 'dark' ? (translations.profile?.light || 'Light Mode') : (translations.profile?.dark || 'Dark Mode')}
            >
              {theme === 'dark' ? (
                <Sun size={20} className="text-gray-100" />
              ) : (
                <Moon size={20} className="text-gray-600" />
              )}
            </button>
          )}

          {/* Notification Center */}
          <NotificationCenter locale={locale} />

          {/* Profile Menu */}
          <div className="relative" ref={profileMenuRef}>
            <button
              onClick={() => setProfileMenuOpen(!profileMenuOpen)}
              className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-gray-100/80 dark:bg-[#7800A3]/15 dark:hover:bg-[#7800A3]/35 transition-colors backdrop-blur-sm cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className="flex flex-col items-end">
                  <span className="text-sm font-medium text-gray-900 dark:text-white">{session?.user?.name || 'User'}</span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">{translations.profile?.online || 'Online'}</span>
                </div>
                <div className="relative">
                  <div className="w-8 h-8 rounded-full bg-[#7800A3]/90 flex items-center justify-center text-sm font-semibold text-white backdrop-blur-sm">
                    {session?.user?.name?.charAt(0).toUpperCase() || 'U'}
                  </div>
                  <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-white dark:border-[#1f1d2e]"></div>
                </div>
              </div>
              <ChevronDown size={16} className={`text-gray-400 transition-transform ${profileMenuOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Profile Dropdown Menu */}
            {profileMenuOpen && (
              <div className="absolute top-full right-0 mt-2 w-64 bg-white dark:bg-[#1f1d2e] rounded-lg shadow-xl border border-gray-200 dark:border-[#8B8D98]/20 py-2 z-50">
                <Link
                  href="/profile"
                  onClick={() => setProfileMenuOpen(false)}
                  className="flex items-center gap-3 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#7800A3]/20 transition-colors"
                >
                  <User size={16} className="text-gray-400" />
                  <span>{translations.profile?.profile || 'Profile'}</span>
                </Link>


                <div className="border-t border-gray-200 dark:border-[#8B8D98]/20 my-2"></div>

                {isAdmin && (
                  <Link
                    href="/settings"
                    onClick={() => setProfileMenuOpen(false)}
                    className="flex items-center gap-3 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#7800A3]/20 transition-colors"
                  >
                    <Settings size={16} className="text-gray-400" />
                    <span>{translations.profile?.settings || 'Settings'}</span>
                  </Link>
                )}

                <button
                  onClick={() => {
                    const newTheme = theme === 'dark' ? 'light' : 'dark';
                    console.log('Toggling theme from', theme, 'to', newTheme);
                    setTheme(newTheme);
                    setProfileMenuOpen(false);

                    // Force immediate DOM update
                    setTimeout(() => {
                      const isDark = document.documentElement.classList.contains('dark');
                      console.log('Theme after toggle:', isDark ? 'dark' : 'light');

                      // Force re-render if needed
                      if ((newTheme === 'dark' && !isDark) || (newTheme === 'light' && isDark)) {
                        console.log('Forcing class toggle');
                        document.documentElement.classList.toggle('dark', newTheme === 'dark');
                      }
                    }, 100);
                  }}
                  className="w-full flex items-center justify-between px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#7800A3]/20 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    {mounted ? (
                      theme === 'dark' ? (
                        <Moon size={16} className="text-gray-400" />
                      ) : (
                        <Sun size={16} className="text-gray-400" />
                      )
                    ) : (
                      <Palette size={16} className="text-gray-400" />
                    )}
                    <span>{translations.profile?.theme || 'Theme'}{mounted ? `: ${theme === 'dark' ? (translations.profile?.dark || 'Dark') : (translations.profile?.light || 'Light')}` : ''}</span>
                  </div>
                  <ChevronRight size={14} className="text-gray-400" />
                </button>



                {/* <a
                href="https://clickup.com"
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setProfileMenuOpen(false)}
                className="flex items-center justify-between px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#7800A3]/20 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Download size={16} className="text-gray-400" />
                  <span>Download ClickUp</span>
                </div>
                <ExternalLink size={14} className="text-gray-400" />
              </a> */}

                <Link
                  href="/help"
                  onClick={() => setProfileMenuOpen(false)}
                  className="flex items-center gap-3 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#7800A3]/20 transition-colors"
                >
                  <HelpCircle size={16} className="text-gray-400" />
                  <span>{translations.profile?.help || 'Help'}</span>
                </Link>

                <div className="border-t border-gray-200 dark:border-[#8B8D98]/20 my-2"></div>

                <button
                  onClick={async () => {
                    if (isSigningOut) return;
                    setIsSigningOut(true);
                    setProfileMenuOpen(false);
                    await signOut({ redirect: false });
                    window.location.href = '/auth/signin';
                  }}
                  disabled={isSigningOut}
                  className="w-full flex items-center gap-3 px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors disabled:opacity-50"
                >
                  <LogOut size={16} />
                  <span>{isSigningOut ? (translations.common?.loading || 'Signing out...') : translations.auth.signOut}</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
