'use client';

import { useTranslations } from 'next-intl';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { HelpCircle, FileText, MessageCircle, Phone, Mail, Book } from 'lucide-react';


export default function HelpPage() {
    const t = useTranslations();

    return (
        <div className="p-4 sm:p-6 md:p-8 space-y-6">
            {/* Header */}
            <div className="mb-6">
                <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                    <HelpCircle className="w-8 h-8" />
                    {t('help.title') || 'Help Center'}
                </h1>
                <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
                    {t('help.subtitle') || 'Find answers to common questions and support resources.'}
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* FAQs */}
                <Card className="bg-white dark:bg-[#1f1d2e] border-gray-200 dark:border-[#8B8D98]/20 md:col-span-1">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-lg font-semibold text-gray-900 dark:text-white">
                            <Book size={20} />
                            Frequently Asked Questions
                        </CardTitle>
                        <CardDescription>
                            Common questions about using the platform.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {/* Note: In a real app, Accordion should be imported from shadcn/ui. 
                If not available, we can use simple details/summary or just list.
                Using simple details/summary for zero-dependency safety here. */}
                        <div className="space-y-4">
                            <details className="group border-b border-gray-200 dark:border-gray-800 pb-2">
                                <summary className="flex justify-between items-center font-medium cursor-pointer list-none text-gray-900 dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                                    <span>How do I add a new Sow?</span>
                                    <span className="transition group-open:rotate-180">
                                        <svg fill="none" height="24" shapeRendering="geometricPrecision" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" viewBox="0 0 24 24" width="24"><path d="M6 9l6 6 6-6"></path></svg>
                                    </span>
                                </summary>
                                <div className="text-gray-600 dark:text-gray-400 mt-3 group-open:animate-fadeIn text-sm">
                                    Navigate to the "Sows" menu in the sidebar and click the "Add New Sow" button in the top right corner. Fill in the required details such as Tag Number, Breed, and Birth Date.
                                </div>
                            </details>

                            <details className="group border-b border-gray-200 dark:border-gray-800 pb-2">
                                <summary className="flex justify-between items-center font-medium cursor-pointer list-none text-gray-900 dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                                    <span>How can I record a breeding event?</span>
                                    <span className="transition group-open:rotate-180">
                                        <svg fill="none" height="24" shapeRendering="geometricPrecision" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" viewBox="0 0 24 24" width="24"><path d="M6 9l6 6 6-6"></path></svg>
                                    </span>
                                </summary>
                                <div className="text-gray-600 dark:text-gray-400 mt-3 group-open:animate-fadeIn text-sm">
                                    Go to "Breeding Management" &gt; "Breeding". Select the Sow and Boar from the lists, choose the breeding date and method (Natural or AI), then click Save.
                                </div>
                            </details>

                            <details className="group border-b border-gray-200 dark:border-gray-800 pb-2">
                                <summary className="flex justify-between items-center font-medium cursor-pointer list-none text-gray-900 dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                                    <span>What should I do if the system is slow?</span>
                                    <span className="transition group-open:rotate-180">
                                        <svg fill="none" height="24" shapeRendering="geometricPrecision" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" viewBox="0 0 24 24" width="24"><path d="M6 9l6 6 6-6"></path></svg>
                                    </span>
                                </summary>
                                <div className="text-gray-600 dark:text-gray-400 mt-3 group-open:animate-fadeIn text-sm">
                                    Please check your internet connection first. If the problem persists, try clearing your browser cache or contact the technical support team.
                                </div>
                            </details>

                            <details className="group pb-2">
                                <summary className="flex justify-between items-center font-medium cursor-pointer list-none text-gray-900 dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                                    <span>How do I export reports?</span>
                                    <span className="transition group-open:rotate-180">
                                        <svg fill="none" height="24" shapeRendering="geometricPrecision" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" viewBox="0 0 24 24" width="24"><path d="M6 9l6 6 6-6"></path></svg>
                                    </span>
                                </summary>
                                <div className="text-gray-600 dark:text-gray-400 mt-3 group-open:animate-fadeIn text-sm">
                                    Visit the "Reports" section. Select the type of report you need (e.g., Performance, Health), choose the date range, and click the "Export PDF" or "Export Excel" button.
                                </div>
                            </details>
                        </div>
                    </CardContent>
                </Card>

                {/* Contact & Support */}
                <div className="space-y-6 md:col-span-1">
                    <Card className="bg-white dark:bg-[#1f1d2e] border-gray-200 dark:border-[#8B8D98]/20">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-lg font-semibold text-gray-900 dark:text-white">
                                <MessageCircle size={20} />
                                Contact Support
                            </CardTitle>
                            <CardDescription>
                                Need help? Reach out to our support team.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center gap-4 p-3 rounded-lg bg-gray-50 dark:bg-[#2a2640] border border-gray-100 dark:border-[#8B8D98]/10">
                                <div className="bg-blue-100 dark:bg-blue-900/30 p-2 rounded-full">
                                    <Phone size={20} className="text-blue-600 dark:text-blue-400" />
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-gray-900 dark:text-white">Phone Support</p>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">02-123-4567 (Mon-Fri, 9am - 6pm)</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-4 p-3 rounded-lg bg-gray-50 dark:bg-[#2a2640] border border-gray-100 dark:border-[#8B8D98]/10">
                                <div className="bg-purple-100 dark:bg-purple-900/30 p-2 rounded-full">
                                    <Mail size={20} className="text-purple-600 dark:text-purple-400" />
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-gray-900 dark:text-white">Email Support</p>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">support@farmpigspro.com</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-gradient-to-br from-[#7800A3] to-indigo-600 text-white border-none">
                        <CardContent className="pt-6">
                            <h3 className="text-lg font-bold mb-2">User Manual</h3>
                            <p className="text-blue-100 text-sm mb-4">
                                Download the complete user guide to learn how to use every feature of the Pig Farm Management System.
                            </p>
                            <button className="bg-white text-[#7800A3] px-4 py-2 rounded-md text-sm font-semibold hover:bg-gray-100 transition-colors flex items-center gap-2">
                                <FileText size={16} />
                                Download PDF Manual
                            </button>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
