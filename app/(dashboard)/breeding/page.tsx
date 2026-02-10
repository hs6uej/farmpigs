'use client';

import { useState, useEffect, useMemo } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { 
  Search, 
  Plus, 
  Edit2, 
  Trash2, 
  X,
  Download,
  ChevronLeft,
  ChevronRight,
  Heart,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  AlertCircle
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { DatePicker } from '@/components/ui/date-picker';
import { format } from 'date-fns';

interface Sow {
  id: string;
  tagNumber: string;
}

interface Boar {
  id: string;
  tagNumber: string;
}

interface Breeding {
  id: string;
  sowId: string;
  boarId: string;
  breedingDate: string;
  breedingMethod: string;
  expectedFarrowDate: string | null;
  success: boolean | null;
  notes: string | null;
  sow: Sow;
  boar: Boar;
}

const BREEDING_METHODS = ['NATURAL', 'AI'];

type SortField = 'sow' | 'boar' | 'breedingDate' | 'method' | 'expectedFarrowDate' | 'result';
type SortDirection = 'asc' | 'desc';

export default function BreedingPage() {
  const t = useTranslations();
  const locale = useLocale();
  
  const [breedings, setBreedings] = useState<Breeding[]>([]);
  const [sows, setSows] = useState<Sow[]>([]);
  const [boars, setBoars] = useState<Boar[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingBreeding, setEditingBreeding] = useState<Breeding | null>(null);
  const [formData, setFormData] = useState({
    sowId: '',
    boarId: '',
    breedingDate: new Date().toISOString().split('T')[0],
    breedingMethod: 'NATURAL',
    expectedFarrowDate: '',
    success: 'pending',
    notes: ''
  });

  // Delete confirmation state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [breedingToDelete, setBreedingToDelete] = useState<Breeding | null>(null);

  // Error dialog state
  const [errorDialogOpen, setErrorDialogOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Field validation errors
  const [fieldErrors, setFieldErrors] = useState<{
    sowId?: string;
    boarId?: string;
    breedingDate?: string;
  }>({});

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Sorting state
  const [sortField, setSortField] = useState<SortField | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [breedingsRes, sowsRes, boarsRes] = await Promise.all([
        fetch('/api/breedings'),
        fetch('/api/sows'),
        fetch('/api/boars')
      ]);
      
      if (breedingsRes.ok) {
        const breedingsData = await breedingsRes.json();
        setBreedings(breedingsData);
      }
      if (sowsRes.ok) {
        const sowsData = await sowsRes.json();
        setSows(sowsData);
      }
      if (boarsRes.ok) {
        const boarsData = await boarsRes.json();
        setBoars(boarsData);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Clear previous errors
    setFieldErrors({});
    
    // Validate required fields
    const errors: typeof fieldErrors = {};
    
    if (!formData.sowId) {
      errors.sowId = locale === 'th' ? 'กรุณาเลือกแม่พันธุ์' : 'Sow is required';
    }
    if (!formData.boarId) {
      errors.boarId = locale === 'th' ? 'กรุณาเลือกพ่อพันธุ์' : 'Boar is required';
    }
    if (!formData.breedingDate) {
      errors.breedingDate = locale === 'th' ? 'กรุณาเลือกวันที่ผสมพันธุ์' : 'Breeding date is required';
    }
    
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }
    
    try {
      const url = editingBreeding ? `/api/breedings/${editingBreeding.id}` : '/api/breedings';
      const method = editingBreeding ? 'PUT' : 'POST';
      
      const payload = {
        ...formData,
        success: formData.success === 'true' ? true : formData.success === 'false' ? false : null,
        expectedFarrowDate: formData.expectedFarrowDate || null
      };
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        fetchData();
        closeModal();
      } else {
        const error = await res.json();
        setErrorMessage(error.message || (locale === 'th' ? 'เกิดข้อผิดพลาด' : 'An error occurred'));
        setErrorDialogOpen(true);
      }
    } catch (error) {
      console.error('Error saving breeding:', error);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/breedings/${id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchData();
      }
    } catch (error) {
      console.error('Error deleting breeding:', error);
    } finally {
      setDeleteDialogOpen(false);
      setBreedingToDelete(null);
    }
  };

  const openDeleteDialog = (breeding: Breeding) => {
    setBreedingToDelete(breeding);
    setDeleteDialogOpen(true);
  };

  const openModal = (breeding?: Breeding) => {
    if (breeding) {
      setEditingBreeding(breeding);
      setFormData({
        sowId: breeding.sowId,
        boarId: breeding.boarId,
        breedingDate: breeding.breedingDate.split('T')[0],
        breedingMethod: breeding.breedingMethod,
        expectedFarrowDate: breeding.expectedFarrowDate?.split('T')[0] || '',
        success: breeding.success === null ? 'pending' : String(breeding.success),
        notes: breeding.notes || ''
      });
    } else {
      setEditingBreeding(null);
      setFormData({
        sowId: '',
        boarId: '',
        breedingDate: new Date().toISOString().split('T')[0],
        breedingMethod: 'NATURAL',
        expectedFarrowDate: '',
        success: 'pending',
        notes: ''
      });
    }
    setFieldErrors({});
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingBreeding(null);
    setFieldErrors({});
    setFormData({
      sowId: '',
      boarId: '',
      breedingDate: new Date().toISOString().split('T')[0],
      breedingMethod: 'NATURAL',
      expectedFarrowDate: '',
      success: 'pending',
      notes: ''
    });
  };

  const exportToExcel = () => {
    const exportData = breedings.map(b => ({
      [locale === 'th' ? 'แม่พันธุ์' : 'Sow']: b.sow?.tagNumber || '-',
      [locale === 'th' ? 'พ่อพันธุ์' : 'Boar']: b.boar?.tagNumber || '-',
      [locale === 'th' ? 'วันผสม' : 'Breeding Date']: new Date(b.breedingDate).toLocaleDateString(locale === 'th' ? 'th-TH' : 'en-US'),
      [locale === 'th' ? 'วิธีการ' : 'Method']: b.breedingMethod,
      [locale === 'th' ? 'คาดคลอด' : 'Expected Farrow']: b.expectedFarrowDate ? new Date(b.expectedFarrowDate).toLocaleDateString(locale === 'th' ? 'th-TH' : 'en-US') : '-',
      [locale === 'th' ? 'สำเร็จ' : 'Success']: b.success === null ? '-' : b.success ? 'Yes' : 'No'
    }));
    
    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Breeding');
    XLSX.writeFile(wb, `breeding_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  // Handle sort click
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
    setCurrentPage(1);
  };

  // Get sort icon
  const getSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return <ArrowUpDown size={14} className="ml-1 opacity-50" />;
    }
    return sortDirection === 'asc' 
      ? <ArrowUp size={14} className="ml-1 text-purple-500" /> 
      : <ArrowDown size={14} className="ml-1 text-purple-500" />;
  };

  // Filter and sort breedings
  const filteredAndSortedBreedings = useMemo(() => {
    let result = breedings.filter(b => 
      b.sow?.tagNumber?.toLowerCase().includes(search.toLowerCase()) ||
      b.boar?.tagNumber?.toLowerCase().includes(search.toLowerCase()) ||
      b.breedingMethod.toLowerCase().includes(search.toLowerCase())
    );

    // Apply sorting
    if (sortField) {
      result = [...result].sort((a, b) => {
        let aValue: string | number;
        let bValue: string | number;

        switch (sortField) {
          case 'sow':
            aValue = a.sow?.tagNumber || '';
            bValue = b.sow?.tagNumber || '';
            break;
          case 'boar':
            aValue = a.boar?.tagNumber || '';
            bValue = b.boar?.tagNumber || '';
            break;
          case 'breedingDate':
            aValue = new Date(a.breedingDate).getTime();
            bValue = new Date(b.breedingDate).getTime();
            break;
          case 'method':
            aValue = a.breedingMethod || '';
            bValue = b.breedingMethod || '';
            break;
          case 'expectedFarrowDate':
            aValue = a.expectedFarrowDate ? new Date(a.expectedFarrowDate).getTime() : 0;
            bValue = b.expectedFarrowDate ? new Date(b.expectedFarrowDate).getTime() : 0;
            break;
          case 'result':
            aValue = a.success === null ? 0 : a.success ? 1 : -1;
            bValue = b.success === null ? 0 : b.success ? 1 : -1;
            break;
          default:
            return 0;
        }

        if (typeof aValue === 'string') {
          const comparison = aValue.localeCompare(bValue as string);
          return sortDirection === 'asc' ? comparison : -comparison;
        } else {
          return sortDirection === 'asc' ? aValue - (bValue as number) : (bValue as number) - aValue;
        }
      });
    }

    return result;
  }, [breedings, search, sortField, sortDirection]);

  // Pagination
  const totalPages = Math.ceil(filteredAndSortedBreedings.length / rowsPerPage);
  const paginatedBreedings = useMemo(() => {
    const startIndex = (currentPage - 1) * rowsPerPage;
    return filteredAndSortedBreedings.slice(startIndex, startIndex + rowsPerPage);
  }, [filteredAndSortedBreedings, currentPage, rowsPerPage]);

  // Reset page when search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [search]);

  // Handle ESC key to close modal
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && showModal) {
        closeModal();
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [showModal]);

  const getSuccessBadge = (success: boolean | null) => {
    if (success === null) {
      return (
        <span className="px-1.5 sm:px-3 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-sm font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200 whitespace-nowrap">
          <span className="sm:hidden">{locale === 'th' ? 'รอ' : 'Wait'}</span>
          <span className="hidden sm:inline">{locale === 'th' ? 'รอผล' : 'Pending'}</span>
        </span>
      );
    }
    if (success) {
      return (
        <span className="px-1.5 sm:px-3 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-sm font-medium bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-200 whitespace-nowrap">
          <span className="sm:hidden">✓</span>
          <span className="hidden sm:inline">{locale === 'th' ? 'สำเร็จ' : 'Success'}</span>
        </span>
      );
    }
    return (
      <span className="px-1.5 sm:px-3 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-sm font-medium bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-200 whitespace-nowrap">
        <span className="sm:hidden">✗</span>
        <span className="hidden sm:inline">{locale === 'th' ? 'ไม่สำเร็จ' : 'Failed'}</span>
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 md:p-8">
      {/* Header */}
      <div className="sticky top-0 z-48 bg-gray-100 dark:bg-[#0f0d1a] pt-2 pb-4 -mt-2 -mx-4 sm:-mx-6 md:-mx-8 px-4 sm:px-6 md:px-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4 mb-4 sm:mb-6">
        <div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold flex items-center text-gray-900 dark:text-white gap-2">
            <Heart className="text-pink-500" size={24} />
            {t('menu.breeding')}
          </h1>
          <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 mt-1">
            {locale === 'th' ? 'จัดการข้อมูลการผสมพันธุ์' : 'Manage breeding records'}
          </p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <Button
            variant="outline"
            size="sm"
            onClick={exportToExcel}
            className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 bg-green-600 text-white border-green-600 hover:bg-green-700 hover:text-white cursor-pointer text-xs sm:text-sm"
          >
            <Download size={16} />
            <span className="hidden sm:inline">{t('common.exportExcel')}</span>
            <span className="sm:hidden">Export</span>
          </Button>
          <Button
            size="sm"
            onClick={() => openModal()}
            className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 bg-purple-600 text-white hover:text-white hover:bg-purple-700 cursor-pointer text-xs sm:text-sm"
          >
            <Plus size={16} />
            <span className="hidden sm:inline">{locale === 'th' ? 'เพิ่มการผสม' : 'Add Breeding'}</span>
            <span className="sm:hidden">{locale === 'th' ? 'เพิ่ม' : 'Add'}</span>
          </Button>
        </div>
      </div>

      {/* Search */}
      <div className="relative mb-4 sm:mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground  dark:text-gray-400" size={18} />
        <input
          type="text"
          placeholder={t('common.search') + '...'}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 sm:pl-10 pr-4 py-2 text-sm border border-gray-200 dark:border-[#8B8D98]/50 rounded-lg bg-white dark:bg-[#1f1d2e] text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400 outline-none focus:border-[#7800A3] focus:ring-0 focus:ring-[#7800A3] transition-colors"
        />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-6 mb-6 sm:mb-8">
        <Card className="bg-white dark:bg-[#1f1d2e]">
          <CardContent className="p-3 sm:pt-6 sm:px-6">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="p-1.5 sm:p-2 bg-pink-100 dark:bg-pink-900/50 rounded-lg">
                <Heart className="text-pink-600 dark:text-pink-400 w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <div>
                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 mb-0.5 sm:mb-1">{locale === 'th' ? 'ทั้งหมด' : 'Total'}</p>
                <p className="text-xl sm:text-2xl md:text-3xl font-bold text-pink-600">{breedings.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white dark:bg-[#1f1d2e]">
          <CardContent className="p-3 sm:pt-6 sm:px-6">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="p-1.5 sm:p-2 bg-green-100 dark:bg-green-900/50 rounded-lg">
                <Heart className="text-green-600 dark:text-green-400 w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <div>
                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 mb-0.5 sm:mb-1">{locale === 'th' ? 'สำเร็จ' : 'Success'}</p>
                <p className="text-xl sm:text-2xl md:text-3xl font-bold text-green-600">{breedings.filter(b => b.success === true).length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white dark:bg-[#1f1d2e]">
          <CardContent className="p-3 sm:pt-6 sm:px-6">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="p-1.5 sm:p-2 bg-yellow-100 dark:bg-yellow-900/50 rounded-lg">
                <Heart className="text-yellow-600 dark:text-yellow-400 w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <div>
                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 mb-0.5 sm:mb-1">{locale === 'th' ? 'รอผล' : 'Pending'}</p>
                <p className="text-xl sm:text-2xl md:text-3xl font-bold text-yellow-600">{breedings.filter(b => b.success === null).length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white dark:bg-[#1f1d2e]">
          <CardContent className="p-3 sm:pt-6 sm:px-6">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="p-1.5 sm:p-2 bg-red-100 dark:bg-red-900/50 rounded-lg">
                <Heart className="text-red-600 dark:text-red-400 w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <div>
                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 mb-0.5 sm:mb-1">{locale === 'th' ? 'ไม่สำเร็จ' : 'Failed'}</p>
                <p className="text-xl sm:text-2xl md:text-3xl font-bold text-red-600">{breedings.filter(b => b.success === false).length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Breeding Table */}
      <Card className="bg-white dark:bg-[#1f1d2e] overflow-hidden">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-b border-gray-100  dark:border-gray-600 bg-gray-50 dark:bg-[#2a2640] hover:bg-gray-50 dark:hover:bg-[#2a2640]">
                <TableHead 
                  className="px-1.5 sm:px-4 text-[10px] sm:text-sm font-medium text-gray-600 dark:text-gray-300 uppercase first:rounded-tl-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-[#3a3650] whitespace-nowrap"
                  onClick={() => handleSort('sow')}
                >
                  <div className="flex items-center">
                    <span className="sm:hidden">{locale === 'th' ? 'แม่' : 'Sow'}</span>
                    <span className="hidden sm:inline">{locale === 'th' ? 'แม่พันธุ์' : 'Sow'}</span>
                    {getSortIcon('sow')}
                  </div>
                </TableHead>
                <TableHead 
                  className="px-1.5 sm:px-4 text-[10px] sm:text-sm font-medium text-gray-600 dark:text-gray-300 uppercase cursor-pointer hover:bg-gray-100 dark:hover:bg-[#3a3650] whitespace-nowrap"
                  onClick={() => handleSort('boar')}
                >
                  <div className="flex items-center">
                    <span className="sm:hidden">{locale === 'th' ? 'พ่อ' : 'Boar'}</span>
                    <span className="hidden sm:inline">{locale === 'th' ? 'พ่อพันธุ์' : 'Boar'}</span>
                    {getSortIcon('boar')}
                  </div>
                </TableHead>
                <TableHead 
                  className="px-1.5 sm:px-4 text-[10px] sm:text-sm font-medium text-gray-600 dark:text-gray-300 uppercase cursor-pointer hover:bg-gray-100 dark:hover:bg-[#3a3650] whitespace-nowrap"
                  onClick={() => handleSort('breedingDate')}
                >
                  <div className="flex items-center">
                    <span className="sm:hidden">{locale === 'th' ? 'วันที่' : 'Date'}</span>
                    <span className="hidden sm:inline">{locale === 'th' ? 'วันผสม' : 'Date'}</span>
                    {getSortIcon('breedingDate')}
                  </div>
                </TableHead>
                <TableHead 
                  className="px-1.5 sm:px-4 text-[10px] sm:text-sm font-medium text-gray-600 dark:text-gray-300 uppercase cursor-pointer hover:bg-gray-100 dark:hover:bg-[#3a3650] hidden sm:table-cell whitespace-nowrap"
                  onClick={() => handleSort('method')}
                >
                  <div className="flex items-center">
                    {locale === 'th' ? 'วิธีการ' : 'Method'}
                    {getSortIcon('method')}
                  </div>
                </TableHead>
                <TableHead 
                  className="px-1.5 sm:px-4 text-[10px] sm:text-sm font-medium text-gray-600 dark:text-gray-300 uppercase cursor-pointer hover:bg-gray-100 dark:hover:bg-[#3a3650] hidden lg:table-cell whitespace-nowrap"
                  onClick={() => handleSort('expectedFarrowDate')}
                >
                  <div className="flex items-center">
                    {locale === 'th' ? 'คาดคลอด' : 'Expected'}
                    {getSortIcon('expectedFarrowDate')}
                  </div>
                </TableHead>
                <TableHead 
                  className="px-1.5 sm:px-4 text-[10px] sm:text-sm font-medium text-gray-600 dark:text-gray-300 uppercase cursor-pointer hover:bg-gray-100 dark:hover:bg-[#3a3650] whitespace-nowrap"
                  onClick={() => handleSort('result')}
                >
                  <div className="flex items-center">
                    <span className="sm:hidden">{locale === 'th' ? 'ผล' : 'Status'}</span>
                    <span className="hidden sm:inline">{locale === 'th' ? 'ผลลัพธ์' : 'Result'}</span>
                    {getSortIcon('result')}
                  </div>
                </TableHead>
                <TableHead className="px-1.5 sm:px-4 text-[10px] sm:text-sm font-medium text-gray-600 dark:text-gray-300 uppercase text-right last:rounded-tr-lg whitespace-nowrap">
                  <span className="sm:hidden"></span>
                  <span className="hidden sm:inline">{t('common.edit')}</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedBreedings.map((breeding) => (
                <TableRow key={breeding.id} className="border-b border-gray-100  dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-[#7800A3]/10">
                  <TableCell className="px-1.5 sm:px-4 py-2 sm:py-4">
                    <span className="font-semibold text-[11px] sm:text-sm text-gray-900 dark:text-white">{breeding.sow?.tagNumber || '-'}</span>
                  </TableCell>
                  <TableCell className="px-1.5 sm:px-4 py-2 sm:py-4 text-[11px] sm:text-sm text-gray-500 dark:text-gray-400">
                    {breeding.boar?.tagNumber || '-'}
                  </TableCell>
                  <TableCell className="px-1.5 sm:px-4 py-2 sm:py-4 text-[11px] sm:text-sm text-gray-500 dark:text-gray-400 whitespace-nowrap">
                    <span className="sm:hidden">
                      {new Date(breeding.breedingDate).toLocaleDateString(locale === 'th' ? 'th-TH' : 'en-US', { day: '2-digit', month: 'short' })}
                    </span>
                    <span className="hidden sm:inline">
                      {new Date(breeding.breedingDate).toLocaleDateString(locale === 'th' ? 'th-TH' : 'en-US')}
                    </span>
                  </TableCell>
                  <TableCell className="px-1.5 sm:px-4 py-2 sm:py-4 hidden sm:table-cell">
                    <span className={`px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-sm font-medium ${
                      breeding.breedingMethod === 'AI' 
                        ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-200'
                        : 'bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-200'
                    }`}>
                      {breeding.breedingMethod}
                    </span>
                  </TableCell>
                  <TableCell className="px-1.5 sm:px-4 py-2 sm:py-4 text-[11px] sm:text-sm text-gray-500 dark:text-gray-400 hidden lg:table-cell">
                    {breeding.expectedFarrowDate 
                      ? new Date(breeding.expectedFarrowDate).toLocaleDateString(locale === 'th' ? 'th-TH' : 'en-US')
                      : '-'
                    }
                  </TableCell>
                  <TableCell className="px-1.5 sm:px-4 py-2 sm:py-4">
                    {getSuccessBadge(breeding.success)}
                  </TableCell>
                  <TableCell className="px-1.5 sm:px-4 py-2 sm:py-4 text-right">
                    <div className="flex items-center justify-end gap-0">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openModal(breeding)}
                        className="cursor-pointer text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/20 h-7 w-7 sm:h-9 sm:w-9"
                      >
                        <Edit2 size={14} className="sm:hidden" />
                        <Edit2 size={18} className="hidden sm:block" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openDeleteDialog(breeding)}
                        className="cursor-pointer text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 h-7 w-7 sm:h-9 sm:w-9"
                      >
                        <Trash2 size={14} className="sm:hidden" />
                        <Trash2 size={18} className="hidden sm:block" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          </div>

          {filteredAndSortedBreedings.length === 0 && (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
              {t('common.noData')}
            </div>
          )}

          {/* Pagination Controls */}
          {filteredAndSortedBreedings.length > 0 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4 px-3 sm:px-4 py-3 sm:py-4 border-t border-gray-200 dark:border-[#8B8D98]/50">
              <div className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm text-gray-600 dark:text-gray-300">
                <span>{locale === 'th' ? 'แสดง' : 'Showing'}</span>
                <span className="font-medium text-gray-900 dark:text-white">
                  {((currentPage - 1) * rowsPerPage) + 1}-{Math.min(currentPage * rowsPerPage, filteredAndSortedBreedings.length)}
                </span>
                <span>{locale === 'th' ? 'จาก' : 'of'}</span>
                <span className="font-medium text-gray-900 dark:text-white">{filteredAndSortedBreedings.length}</span>
                <span className="hidden sm:inline">{locale === 'th' ? 'รายการ' : 'records'}</span>
              </div>
              
              <div className="flex items-center gap-2 sm:gap-4">
                <div className="flex items-center gap-1 sm:gap-2">
                  <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 hidden sm:inline">{locale === 'th' ? 'แถวต่อหน้า' : 'Rows per page'}</span>
                  <Select
                    value={String(rowsPerPage)}
                    onValueChange={(value) => {
                      setRowsPerPage(Number(value));
                      setCurrentPage(1);
                    }}
                  >
                    <SelectTrigger className="w-17.5 h-8 px-2 py-1 text-sm border border-gray-200 dark:border-[#8B8D98]/50 rounded-md bg-white dark:bg-[#1f1d2e] text-gray-900 dark:text-white focus:ring-0 focus:border-[#7800A3]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="z-[300] bg-white dark:bg-[#2a2640] border border-gray-200 dark:border-[#8B8D98]/50">
                      <SelectItem value="5" className="cursor-pointer dark:text-gray-200 dark:hover:text-white dark:data-[state=checked]:text-gray-200">5</SelectItem>
                      <SelectItem value="10" className="cursor-pointer dark:text-gray-200 dark:hover:text-white dark:data-[state=checked]:text-gray-200">10</SelectItem>
                      <SelectItem value="20" className="cursor-pointer dark:text-gray-200 dark:hover:text-white dark:data-[state=checked]:text-gray-200">20</SelectItem>
                      <SelectItem value="50" className="cursor-pointer dark:text-gray-200 dark:hover:text-white dark:data-[state=checked]:text-gray-200">50</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="flex items-center gap-1">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="h-7 w-7 sm:h-8 sm:w-8 cursor-pointer dark:text-gray-200 border-gray-200 dark:border-[#8B8D98]/50 dark:focus:border-[#7800A3]"
                  >
                    <ChevronLeft size={14} className="sm:hidden" />
                    <ChevronLeft size={16} className="hidden sm:block" />
                  </Button>
                  
                  <div className="flex items-center gap-0.5 sm:gap-1 px-1 sm:px-2">
                    <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-300">{locale === 'th' ? 'หน้า' : 'Page'}</span>
                    <span className="text-xs sm:text-sm font-medium text-gray-900 dark:text-white">{currentPage}</span>
                    <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-300">/</span>
                    <span className="text-xs sm:text-sm font-medium text-gray-900 dark:text-white">{totalPages || 1}</span>
                  </div>
                  
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages || totalPages === 0}
                    className="h-7 w-7 sm:h-8 sm:w-8 cursor-pointer dark:text-gray-200 border-gray-200 dark:border-[#8B8D98]/50 dark:focus:border-[#7800A3]"
                  >
                    <ChevronRight size={14} className="sm:hidden" />
                    <ChevronRight size={16} className="hidden sm:block" />
                  </Button>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-3 sm:p-4 z-[200]">
          <div className="bg-white dark:bg-[#1f1d2e] border border-gray-200 dark:border-[#8B8D98]/50 rounded-lg p-4 sm:p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">
                {editingBreeding ? (locale === 'th' ? 'แก้ไขการผสม' : 'Edit Breeding') : (locale === 'th' ? 'เพิ่มการผสม' : 'Add Breeding')}
              </h2>
              <Button 
                variant="ghost" 
                size="icon" 
                 className="h-8 w-8 sm:h-9 sm:w-9 dark:hover:text-gray-200 cursor-pointer rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:text-gray-300  dark:hover:bg-[#2a2640] transition-colors" 
                onClick={closeModal}
              >
                <X size={18} className="sm:hidden" />
                <X size={20} className="hidden sm:block" />
              </Button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <label className="block text-xs sm:text-sm text-gray-600 dark:text-gray-300 mb-1.5 sm:mb-2">{locale === 'th' ? 'แม่พันธุ์' : 'Sow'} *</label>
                  <Select
                    value={formData.sowId}
                    onValueChange={(value) => {
                      setFormData({ ...formData, sowId: value });
                      if (fieldErrors.sowId) setFieldErrors({ ...fieldErrors, sowId: undefined });
                    }}
                  >
                    <SelectTrigger className={`w-full h-9 sm:h-10 px-3 py-2 text-sm border rounded-lg bg-gray-50 dark:bg-[#2a2640] text-gray-900 dark:text-white focus:ring-0 focus:ring-[#7800A3] ${
                      fieldErrors.sowId 
                        ? 'border-red-500 dark:border-red-500' 
                        : 'border-gray-200 dark:border-[#8B8D98]/50 focus:border-[#7800A3]'
                    }`}>
                      <SelectValue placeholder={locale === 'th' ? 'เลือกแม่พันธุ์' : 'Select Sow'} />
                    </SelectTrigger>
                    <SelectContent className="z-[300] bg-white dark:bg-[#2a2640] border border-gray-200 dark:border-[#8B8D98]/50">
                      {sows.map((sow) => (
                        <SelectItem key={sow.id} value={sow.id} className="cursor-pointer hover:bg-gray-100 dark:hover:bg-[#7800A3]/20 dark:text-white dark:hover:text-white">
                          {sow.tagNumber}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {fieldErrors.sowId && (
                    <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                      <AlertCircle size={14} />
                      {fieldErrors.sowId}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-xs sm:text-sm text-gray-600 dark:text-gray-300 mb-1.5 sm:mb-2">{locale === 'th' ? 'พ่อพันธุ์' : 'Boar'} *</label>
                  <Select
                    value={formData.boarId}
                    onValueChange={(value) => {
                      setFormData({ ...formData, boarId: value });
                      if (fieldErrors.boarId) setFieldErrors({ ...fieldErrors, boarId: undefined });
                    }}
                  >
                    <SelectTrigger className={`w-full h-9 sm:h-10 px-3 py-2 text-sm border rounded-lg bg-gray-50 dark:bg-[#2a2640] text-gray-900 dark:text-white focus:ring-0 focus:ring-[#7800A3] ${
                      fieldErrors.boarId 
                        ? 'border-red-500 dark:border-red-500' 
                        : 'border-gray-200 dark:border-[#8B8D98]/50 focus:border-[#7800A3]'
                    }`}>
                      <SelectValue placeholder={locale === 'th' ? 'เลือกพ่อพันธุ์' : 'Select Boar'} />
                    </SelectTrigger>
                    <SelectContent className="z-[300] bg-white dark:bg-[#2a2640] border border-gray-200 dark:border-[#8B8D98]/50">
                      {boars.map((boar) => (
                        <SelectItem key={boar.id} value={boar.id} className="cursor-pointer hover:bg-gray-100 dark:hover:bg-[#7800A3]/20 dark:text-white dark:hover:text-white">
                          {boar.tagNumber}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {fieldErrors.boarId && (
                    <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                      <AlertCircle size={14} />
                      {fieldErrors.boarId}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-xs sm:text-sm text-gray-600 dark:text-gray-300 mb-1.5 sm:mb-2">{locale === 'th' ? 'วันผสม' : 'Breeding Date'} *</label>
                  <DatePicker
                    className={`cursor-pointer w-full h-9 sm:h-10 px-3 py-2 text-sm border rounded-lg bg-gray-50 dark:bg-[#2a2640] text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400 focus:border-[#7800A3] focus:ring-1 focus:ring-[#7800A3] ${
                      fieldErrors.breedingDate 
                        ? 'border-red-500 dark:border-red-500' 
                        : 'border-gray-200 dark:border-[#8B8D98]/60'
                    }`}
                    value={formData.breedingDate}
                    onChange={(date) => {
                      setFormData({ ...formData, breedingDate: date ? format(date, 'yyyy-MM-dd') : '' });
                      if (fieldErrors.breedingDate) setFieldErrors({ ...fieldErrors, breedingDate: undefined });
                    }}
                    placeholder={locale === 'th' ? 'วันผสม' : 'Breeding Date'}
                    locale={locale}
                  />
                  {fieldErrors.breedingDate && (
                    <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                      <AlertCircle size={14} />
                      {fieldErrors.breedingDate}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-xs sm:text-sm text-gray-600 dark:text-gray-300 mb-1.5 sm:mb-2">{locale === 'th' ? 'วิธีการ' : 'Method'}</label>
                  <Select
                    value={formData.breedingMethod}
                    onValueChange={(value) => setFormData({ ...formData, breedingMethod: value })}
                  >
                    <SelectTrigger className="w-full h-9 sm:h-10 px-3 py-2 text-sm border border-gray-200 dark:border-[#8B8D98]/50 rounded-lg bg-gray-50 dark:bg-[#2a2640] text-gray-900 dark:text-white focus:border-[#7800A3] focus:ring-0 focus:ring-[#7800A3]">
                      <SelectValue placeholder={locale === 'th' ? 'เลือกวิธีการ' : 'Select Method'} />
                    </SelectTrigger>
                    <SelectContent className="z-[300] bg-white dark:bg-[#2a2640] border border-gray-200 dark:border-[#8B8D98]/50">
                      {BREEDING_METHODS.map((method) => (
                        <SelectItem key={method} value={method} className="cursor-pointer hover:bg-gray-100 dark:hover:bg-[#7800A3]/20 dark:text-white dark:hover:text-white">
                          {method === 'AI' ? (locale === 'th' ? 'ผสมเทียม (AI)' : 'Artificial Insemination') : (locale === 'th' ? 'ผสมธรรมชาติ' : 'Natural')}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="block text-xs sm:text-sm text-gray-600 dark:text-gray-300 mb-1.5 sm:mb-2">{locale === 'th' ? 'คาดว่าคลอด' : 'Expected Farrow Date'}</label>
                  <DatePicker
                    className="z-[300] cursor-pointer w-full h-9 sm:h-10 px-3 py-2 text-sm border border-gray-200 dark:border-[#8B8D98]/60 rounded-lg bg-gray-50 dark:bg-[#2a2640] text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400 focus:border-[#7800A3] focus:ring-1 focus:ring-[#7800A3] dark:hover:text-gray-200"
                    value={formData.expectedFarrowDate}
                    onChange={(date) => setFormData({ ...formData, expectedFarrowDate: date ? format(date, 'yyyy-MM-dd') : '' })}
                    placeholder={locale === 'th' ? 'คาดว่าคลอด' : 'Expected Farrow Date'}
                    locale={locale}
                  />
                </div>

                <div>
                  <label className="block text-xs sm:text-sm text-gray-600 dark:text-gray-300 mb-1.5 sm:mb-2">{locale === 'th' ? 'ผลลัพธ์' : 'Result'}</label>
                  <Select
                    value={formData.success}
                    onValueChange={(value) => setFormData({ ...formData, success: value })}
                  >
                    <SelectTrigger className="w-full h-9 sm:h-10 px-3 py-2 text-sm border border-gray-200 dark:border-[#8B8D98]/50 rounded-lg bg-gray-50 dark:bg-[#2a2640] text-gray-900 dark:text-white focus:border-[#7800A3] focus:ring-1 focus:ring-[#7800A3]">
                      <SelectValue placeholder={locale === 'th' ? 'รอผล' : 'Pending'} />
                    </SelectTrigger>
                    <SelectContent className="z-[300] bg-white dark:bg-[#2a2640] border border-gray-200 dark:border-[#8B8D98]/50">
                      <SelectItem value="pending" className="cursor-pointer hover:bg-gray-100 dark:hover:bg-[#7800A3]/20 dark:text-white dark:hover:text-white">
                        {locale === 'th' ? 'รอผล' : 'Pending'}
                      </SelectItem>
                      <SelectItem value="true" className="cursor-pointer hover:bg-gray-100 dark:hover:bg-[#7800A3]/20 dark:text-white dark:hover:text-white">
                        {locale === 'th' ? 'สำเร็จ' : 'Success'}
                      </SelectItem>
                      <SelectItem value="false" className="cursor-pointer hover:bg-gray-100 dark:hover:bg-[#7800A3]/20 dark:text-white dark:hover:text-white">
                        {locale === 'th' ? 'ไม่สำเร็จ' : 'Failed'}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <label className="block text-xs sm:text-sm text-gray-600 dark:text-gray-300 mb-1.5 sm:mb-2">{locale === 'th' ? 'หมายเหตุ' : 'Notes'}</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-[#8B8D98]/50 rounded-lg bg-gray-50 dark:bg-[#2a2640] text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400 focus:border-[#7800A3] focus:ring-1 focus:ring-[#7800A3] outline-none resize-none"
                  placeholder={locale === 'th' ? 'หมายเหตุเพิ่มเติม...' : 'Optional notes...'}
                />
              </div>

              <div className="flex gap-2 sm:gap-3 pt-3 sm:pt-4 border-t border-gray-100 dark:border-gray-600">
                <Button
                  type="button"
                  variant="outline"
                  onClick={closeModal}
                  className="flex-1 h-9 sm:h-10 text-sm cursor-pointer border-gray-400 dark:text-white dark:hover:text-gray-200 hover:border-gray-200"
                >
                  {t('common.cancel')}
                </Button>
                <Button
                  type="submit"
                  className="flex-1 h-9 sm:h-10 text-sm bg-purple-600 hover:bg-purple-700 cursor-pointer dark:text-white"
                >
                  {editingBreeding ? t('common.save') : (locale === 'th' ? 'เพิ่ม' : 'Add')}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent 
          className="bg-white dark:bg-[#1f1d2e] border border-gray-200 dark:border-[#8B8D98]/20 w-[calc(100%-2rem)] sm:w-full max-w-md mx-auto"
          onEscapeKeyDown={() => setDeleteDialogOpen(false)}
        >
          {/* Close button */}
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-3 top-3 sm:right-4 sm:top-4 h-8 w-8 cursor-pointer rounded-full text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:text-white dark:hover:bg-gray-700 transition-colors"
            onClick={() => setDeleteDialogOpen(false)}
          >
            <X size={16} className="sm:hidden" />
            <X size={18} className="hidden sm:block" />
          </Button>
          
          <AlertDialogHeader>
            <AlertDialogTitle className="text-base sm:text-lg text-gray-900 dark:text-white pr-8">
              {t('common.delete')} {locale === 'th' ? 'การผสม?' : 'Breeding?'}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-sm text-gray-600 dark:text-gray-300">
              {breedingToDelete?.sow?.tagNumber} x {breedingToDelete?.boar?.tagNumber} - {breedingToDelete?.breedingDate && new Date(breedingToDelete.breedingDate).toLocaleDateString(locale === 'th' ? 'th-TH' : 'en-US')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2 sm:gap-0">
            <AlertDialogCancel className="h-9 sm:h-10 text-sm cursor-pointer border-gray-400 dark:text-white dark:hover:text-gray-200 hover:border-gray-200 dark:bg-transparent">
              {t('common.cancel')}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => breedingToDelete && handleDelete(breedingToDelete.id)}
              className="h-9 sm:h-10 text-sm bg-red-600 hover:bg-red-700 text-white cursor-pointer"
            >
              {t('common.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Error Dialog */}
      <AlertDialog open={errorDialogOpen} onOpenChange={setErrorDialogOpen}>
        <AlertDialogContent 
          className="bg-white dark:bg-[#1f1d2e] border border-gray-200 dark:border-[#8B8D98]/20 w-[calc(100%-2rem)] sm:w-full max-w-md mx-auto"
          onEscapeKeyDown={() => setErrorDialogOpen(false)}
        >
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-3 top-3 sm:right-4 sm:top-4 h-8 w-8 cursor-pointer rounded-full text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:text-white dark:hover:bg-gray-700 transition-colors"
            onClick={() => setErrorDialogOpen(false)}
          >
            <X size={16} className="sm:hidden" />
            <X size={18} className="hidden sm:block" />
          </Button>
          
          <AlertDialogHeader>
            <AlertDialogTitle className="text-red-600 dark:text-red-400 flex items-center gap-2">
              <AlertCircle size={20} />
              {locale === 'th' ? 'เกิดข้อผิดพลาด' : 'Error'}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-gray-600 dark:text-gray-300">
              {errorMessage}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction
              onClick={() => setErrorDialogOpen(false)}
              className="bg-purple-600 hover:bg-purple-700 text-white cursor-pointer"
            >
              {locale === 'th' ? 'ตกลง' : 'OK'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
