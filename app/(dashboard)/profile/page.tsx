'use client';

import { useSession } from 'next-auth/react';
import { useTranslations } from 'next-intl';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { User, Mail, Shield, Calendar, Key } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function ProfilePage() {
    const { data: session } = useSession();
    const t = useTranslations();

    // Helper to format date
    const formatDate = (dateString?: string) => {
        if (!dateString) return '-';
        return new Date(dateString).toLocaleDateString('th-TH', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });
    };

    const roleColor = session?.user?.role === 'ADMIN' ? 'bg-purple-600' : 'bg-blue-600';

    return (
        <div className="p-4 sm:p-6 md:p-8 space-y-6">
            {/* Page Header */}
            <div className="mb-6">
                <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                    <User className="w-8 h-8" />
                    {t('profile.profile') || 'Profile'}
                </h1>
                <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
                    {t('profile.subtitle') || 'Manage your personal information'}
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* User Info Card */}
                <Card className="bg-white dark:bg-[#1f1d2e] border-gray-200 dark:border-[#8B8D98]/20 md:col-span-1">
                    <CardHeader className="text-center pb-2">
                        <div className="w-24 h-24 mx-auto rounded-full bg-gradient-to-tr from-purple-500 to-indigo-500 flex items-center justify-center text-4xl font-bold text-white mb-4 shadow-lg">
                            {session?.user?.name?.charAt(0).toUpperCase() || 'U'}
                        </div>
                        <CardTitle className="text-xl text-gray-900 dark:text-white">
                            {session?.user?.name || 'User'}
                        </CardTitle>
                        <CardDescription className="text-gray-500 dark:text-gray-400">
                            {session?.user?.email}
                        </CardDescription>
                        <div className="mt-4 flex justify-center">
                            <Badge className={`${roleColor} text-white hover:bg-opacity-90 px-3 py-1`}>
                                {session?.user?.role || 'USER'}
                            </Badge>
                        </div>
                    </CardHeader>
                    <CardContent className="pt-4 border-t border-gray-100 dark:border-gray-800 mt-4">
                        <div className="space-y-4">
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-gray-500 dark:text-gray-400 flex items-center gap-2">
                                    <Shield size={16} />
                                    Status
                                </span>
                                <span className="text-green-600 font-medium">Active</span>
                            </div>
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-gray-500 dark:text-gray-400 flex items-center gap-2">
                                    <Calendar size={16} />
                                    Joined
                                </span>
                                <span className="text-gray-900 dark:text-white">
                                    {/* Mock date if not available in session */}
                                    {formatDate(new Date().toISOString())}
                                </span>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Account Details */}
                <Card className="bg-white dark:bg-[#1f1d2e] border-gray-200 dark:border-[#8B8D98]/20 md:col-span-2">
                    <CardHeader>
                        <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                            <User size={20} />
                            Personal Information
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                    Full Name
                                </label>
                                <div className="p-3 rounded-md bg-gray-50 dark:bg-[#2a2640] border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white">
                                    {session?.user?.name || '-'}
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                    Email Address
                                </label>
                                <div className="p-3 rounded-md bg-gray-50 dark:bg-[#2a2640] border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white flex items-center gap-2">
                                    <Mail size={16} className="text-gray-500" />
                                    {session?.user?.email || '-'}
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                    Role
                                </label>
                                <div className="p-3 rounded-md bg-gray-50 dark:bg-[#2a2640] border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white flex items-center gap-2">
                                    <Key size={16} className="text-gray-500" />
                                    {session?.user?.role || 'USER'}
                                </div>
                            </div>
                        </div>

                        <div className="pt-6 border-t border-gray-200 dark:border-gray-800">
                            <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-4">Security</h3>
                            <div className="flex flex-col sm:flex-row gap-4">
                                {/* Placeholder buttons for future implementation */}
                                <button className="px-4 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-[#2a2640] dark:hover:bg-[#322d4d] text-gray-900 dark:text-white rounded-md text-sm font-medium transition-colors" disabled>
                                    Change Password (Coming Soon)
                                </button>
                                <button className="px-4 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-[#2a2640] dark:hover:bg-[#322d4d] text-gray-900 dark:text-white rounded-md text-sm font-medium transition-colors" disabled>
                                    Two-Factor Authentication (Coming Soon)
                                </button>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
