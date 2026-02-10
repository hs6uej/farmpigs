/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { Download, FileDown } from 'lucide-react';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Card, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function ReportsPage() {
  const t = useTranslations();
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/analytics')
      .then((res) => res.json())
      .then((data) => {
        setAnalytics(data);
        setLoading(false);
      });
  }, []);

  const exportToExcel = () => {
    if (!analytics) return;

    const wb = XLSX.utils.book_new();

    // Summary sheet
    const summary = [
      ['Metric', 'Value'],
      ['Total Sows', analytics.overview.totalSows],
      ['Total Boars', analytics.overview.totalBoars],
      ['Total Piglets', analytics.overview.totalPiglets],
      ['Total Pens', analytics.overview.totalPens],
      ['Breeding Success Rate', `${analytics.performance.breedingSuccessRate}%`],
      ['Mortality Rate', `${analytics.performance.mortalityRate}%`],
      ['Average ADG', `${analytics.performance.avgDailyGain} kg`],
      ['FCR', analytics.performance.fcr || 'N/A']
    ];
    const ws = XLSX.utils.aoa_to_sheet(summary);
    XLSX.utils.book_append_sheet(wb, ws, 'Summary');

    XLSX.writeFile(wb, 'farm-report.xlsx');
  };

  const exportToPDF = () => {
    if (!analytics) return;

    const doc = new jsPDF();

    doc.setFontSize(20);
    doc.text('Farm Report', 14, 22);

    doc.setFontSize(12);
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, 14, 32);

    const tableData = [
      ['Total Sows', analytics.overview.totalSows.toString()],
      ['Total Boars', analytics.overview.totalBoars.toString()],
      ['Total Piglets', analytics.overview.totalPiglets.toString()],
      ['Total Pens', analytics.overview.totalPens.toString()],
      ['Breeding Success Rate', `${analytics.performance.breedingSuccessRate}%`],
      ['Mortality Rate', `${analytics.performance.mortalityRate}%`],
      ['Average ADG', `${analytics.performance.avgDailyGain} kg`],
      ['FCR', (analytics.performance.fcr || 'N/A').toString()]
    ];

    autoTable(doc, {
      head: [['Metric', 'Value']],
      body: tableData,
      startY: 40
    });

    doc.save('farm-report.pdf');
  };

  if (loading) return <div className="p-4 sm:p-6 md:p-8 min-h-screen bg-white dark:bg-background">{t('common.loading')}</div>;

  return (
    <div className="p-4 sm:p-6 md:p-8 min-h-screen bg-white dark:bg-background">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
          {t('menu.reports')}
        </h1>
        <div className="flex gap-2 w-full sm:w-auto">
          <Button
            onClick={exportToExcel}
            className="flex-1 sm:flex-none text-gray-900 dark:text-white bg-green-600 hover:bg-green-700"
            size="sm"
          >
            <Download size={16} className="mr-1.5" />
            <span className="hidden sm:inline">{t('common.exportExcel')}</span>
            <span className="sm:hidden">Excel</span>
          </Button>
          <Button
            onClick={exportToPDF}
            className="flex-1 sm:flex-none text-gray-900 dark:text-white bg-red-600 hover:bg-red-700"
            size="sm"
          >
            <FileDown size={16} className="mr-1.5" />
            <span className="hidden sm:inline">{t('common.exportPDF')}</span>
            <span className="sm:hidden">PDF</span>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
        <Card className="bg-white dark:bg-[#1f1d2e] ">
          <CardContent className="pt-4 sm:pt-6 pb-4">
            <CardDescription className="text-sm sm:text-base lg:text-lg font-semibold text-gray-700 dark:text-gray-300 mb-1 sm:mb-2">
              {t('dashboard.totalSows')}
            </CardDescription>
            <p className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
              {analytics?.overview?.totalSows || 0}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-[#1f1d2e] ">
          <CardContent className="pt-4 sm:pt-6 pb-4">
            <CardDescription className="text-sm sm:text-base lg:text-lg font-semibold text-gray-700 dark:text-gray-300 mb-1 sm:mb-2">
              {t('dashboard.totalBoars')}
            </CardDescription>
            <p className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
              {analytics?.overview?.totalBoars || 0}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-[#1f1d2e] ">
          <CardContent className="pt-4 sm:pt-6 pb-4">
            <CardDescription className="text-sm sm:text-base lg:text-lg font-semibold text-gray-700 dark:text-gray-300 mb-1 sm:mb-2">
              {t('dashboard.totalPiglets')}
            </CardDescription>
            <p className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
              {analytics?.overview?.totalPiglets || 0}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-[#1f1d2e] ">
          <CardContent className="pt-4 sm:pt-6 pb-4">
            <CardDescription className="text-sm sm:text-base lg:text-lg font-semibold text-gray-700 dark:text-gray-300 mb-1 sm:mb-2">
              {t('dashboard.breedingRate')}
            </CardDescription>
            <p className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
              {analytics?.performance?.breedingSuccessRate || 0}%
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
