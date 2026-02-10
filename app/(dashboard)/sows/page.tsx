/* eslint-disable @typescript-eslint/no-explicit-any */
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
  PiggyBank,
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
  breed: string;
  birthDate: string;
  status: string;
  notes?: string;
  breedings: any[];
  farrowings: any[];
}

const STATUS_OPTIONS = ['ACTIVE', 'PREGNANT', 'LACTATING', 'WEANED', 'CULLED', 'SOLD'];

type SortField = 'tagNumber' | 'breed' | 'age' | 'status' | 'breedings' | 'farrowings';
type SortDirection = 'asc' | 'desc';

export default function SowsPage() {
  const t = useTranslations();
  const locale = useLocale();
  
  const [sows, setSows] = useState<Sow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingSow, setEditingSow] = useState<Sow | null>(null);
  const [formData, setFormData] = useState({
    tagNumber: '',
    breed: '',
    birthDate: '',
    status: 'ACTIVE',
    notes: ''
  });

  // Delete confirmation state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [sowToDelete, setSowToDelete] = useState<Sow | null>(null);

  // Error dialog state
  const [errorDialogOpen, setErrorDialogOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Field validation errors
  const [fieldErrors, setFieldErrors] = useState<{
    tagNumber?: string;
    breed?: string;
    birthDate?: string;
  }>({});

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Sorting state
  const [sortField, setSortField] = useState<SortField | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  useEffect(() => {
    fetchSows();
  }, []);

  const fetchSows = async () => {
    try {
      const res = await fetch('/api/sows');
      if (res.ok) {
        const data = await res.json();
        setSows(data);
      }
    } catch (error) {
      console.error('Error fetching sows:', error);
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
    
    if (!formData.tagNumber.trim()) {
      errors.tagNumber = locale === 'th' ? 'กรุณากรอก Tag Number' : 'Tag Number is required';
    }
    if (!formData.breed.trim()) {
      errors.breed = locale === 'th' ? 'กรุณากรอกสายพันธุ์' : 'Breed is required';
    }
    if (!formData.birthDate) {
      errors.birthDate = locale === 'th' ? 'กรุณาเลือกวันเกิด' : 'Birth date is required';
    }
    
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }
    
    try {
      const url = editingSow ? `/api/sows/${editingSow.id}` : '/api/sows';
      const method = editingSow ? 'PUT' : 'POST';
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (res.ok) {
        fetchSows();
        closeModal();
      } else {
        const error = await res.json();
        setErrorMessage(error.message || (locale === 'th' ? 'เกิดข้อผิดพลาด' : 'An error occurred'));
        setErrorDialogOpen(true);
      }
    } catch (error) {
      console.error('Error saving sow:', error);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/sows/${id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchSows();
      }
    } catch (error) {
      console.error('Error deleting sow:', error);
    } finally {
      setDeleteDialogOpen(false);
      setSowToDelete(null);
    }
  };

  const openDeleteDialog = (sow: Sow) => {
    setSowToDelete(sow);
    setDeleteDialogOpen(true);
  };

  const openModal = (sow?: Sow) => {
    if (sow) {
      setEditingSow(sow);
      setFormData({
        tagNumber: sow.tagNumber,
        breed: sow.breed,
        birthDate: sow.birthDate.split('T')[0],
        status: sow.status,
        notes: sow.notes || ''
      });
    } else {
      setEditingSow(null);
      setFormData({ tagNumber: '', breed: '', birthDate: '', status: 'ACTIVE', notes: '' });
    }
    setFieldErrors({});
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingSow(null);
    setFieldErrors({});
    setFormData({ tagNumber: '', breed: '', birthDate: '', status: 'ACTIVE', notes: '' });
  };

  const exportToExcel = () => {
    const exportData = sows.map(sow => ({
      [t('sows.tagNumber')]: sow.tagNumber,
      [t('sows.breed')]: sow.breed,
      [t('sows.birthDate')]: new Date(sow.birthDate).toLocaleDateString(locale === 'th' ? 'th-TH' : 'en-US'),
      [t('sows.status')]: sow.status,
      'Breedings': sow.breedings?.length || 0,
      'Farrowings': sow.farrowings?.length || 0
    }));
    
    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Sows');
    XLSX.writeFile(wb, `sows_${new Date().toISOString().split('T')[0]}.xlsx`);
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

  // Filter and sort sows
  const filteredAndSortedSows = useMemo(() => {
    let result = sows.filter(sow => 
      sow.tagNumber.toLowerCase().includes(search.toLowerCase()) ||
      sow.breed.toLowerCase().includes(search.toLowerCase())
    );

    // Apply sorting
    if (sortField) {
      result = [...result].sort((a, b) => {
        let aValue: any;
        let bValue: any;

        switch (sortField) {
          case 'tagNumber':
            aValue = a.tagNumber || '';
            bValue = b.tagNumber || '';
            break;
          case 'breed':
            aValue = a.breed || '';
            bValue = b.breed || '';
            break;
          case 'age':
            aValue = getAgeInMonths(a.birthDate);
            bValue = getAgeInMonths(b.birthDate);
            break;
          case 'status':
            aValue = a.status || '';
            bValue = b.status || '';
            break;
          case 'breedings':
            aValue = a.breedings?.length || 0;
            bValue = b.breedings?.length || 0;
            break;
          case 'farrowings':
            aValue = a.farrowings?.length || 0;
            bValue = b.farrowings?.length || 0;
            break;
          default:
            return 0;
        }

        if (typeof aValue === 'string') {
          const comparison = aValue.localeCompare(bValue);
          return sortDirection === 'asc' ? comparison : -comparison;
        } else {
          return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
        }
      });
    }

    return result;
  }, [sows, search, sortField, sortDirection]);

  // Pagination
  const totalPages = Math.ceil(filteredAndSortedSows.length / rowsPerPage);
  const paginatedSows = useMemo(() => {
    const startIndex = (currentPage - 1) * rowsPerPage;
    return filteredAndSortedSows.slice(startIndex, startIndex + rowsPerPage);
  }, [filteredAndSortedSows, currentPage, rowsPerPage]);

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

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      ACTIVE: 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-200',
      PREGNANT: 'bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-200',
      LACTATING: 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-200',
      WEANED: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-200',
      CULLED: 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-200',
      SOLD: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200',
    };
    
    return (
      <span className={`px-3 py-1 rounded-full text-sm font-medium ${colors[status] || 'bg-gray-100 text-gray-800'}`}>
        {status}
      </span>
    );
  };

  const getAgeInMonths = (birthDate: string) => {
    const birth = new Date(birthDate);
    const now = new Date();
    return Math.floor((now.getTime() - birth.getTime()) / (1000 * 60 * 60 * 24 * 30));
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
      <div className="sticky top-0 z-10 bg-gray-100 dark:bg-[#0f0d1a] pt-2 pb-4 -mt-2 -mx-4 sm:-mx-6 md:-mx-8 px-4 sm:px-6 md:px-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4 mb-4 sm:mb-6">
        <div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold flex items-center text-gray-900 dark:text-white gap-2">
            <PiggyBank className="text-purple-500 w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8" />
            {t('sows.title')}
          </h1>
          <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 mt-1">
            {locale === 'th' ? 'จัดการข้อมูลแม่พันธุ์สุกร' : 'Manage sow records'}
          </p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <Button
            variant="outline"
            size="sm"
            onClick={exportToExcel}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 bg-green-600 text-white border-green-600 hover:bg-green-700 hover:text-white cursor-pointer text-xs sm:text-sm h-8 sm:h-9"
          >
            <Download size={14} className="sm:w-4 sm:h-4" />
            <span className="hidden sm:inline">{t('common.exportExcel')}</span>
            <span className="sm:hidden">Excel</span>
          </Button>
          <Button
            size="sm"
            onClick={() => openModal()}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 bg-purple-600 text-white hover:text-white hover:bg-purple-700 cursor-pointer text-xs sm:text-sm h-8 sm:h-9"
          >
            <Plus size={14} className="sm:w-4 sm:h-4" />
            <span className="hidden sm:inline">{t('sows.add')}</span>
            <span className="sm:hidden">{locale === 'th' ? 'เพิ่ม' : 'Add'}</span>
          </Button>
        </div>
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground dark:text-gray-400" size={20} />
        <input
          type="text"
          placeholder={t('common.search') + '...'}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2 text-sm border border-gray-200 dark:border-[#8B8D98]/50 rounded-lg bg-white dark:bg-[#1f1d2e] text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400 outline-none focus:border-[#7800A3] focus:ring-0 focus:ring-[#7800A3] transition-colors"
        />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-6 mb-4 sm:mb-8">
        <Card className="bg-white dark:bg-[#1f1d2e]">
          <CardContent className="pt-4 sm:pt-6 pb-4">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="p-1.5 sm:p-2 bg-purple-100 dark:bg-purple-900/50 rounded-lg">
                <PiggyBank className="text-purple-600 dark:text-purple-400 w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <div>
                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 mb-0.5 sm:mb-1">{locale === 'th' ? 'ทั้งหมด' : 'Total'}</p>
                <p className="text-xl sm:text-2xl md:text-3xl font-bold text-purple-600">{sows.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white dark:bg-[#1f1d2e]">
          <CardContent className="pt-4 sm:pt-6 pb-4">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="p-1.5 sm:p-2 bg-green-100 dark:bg-green-900/50 rounded-lg">
                <PiggyBank className="text-green-600 dark:text-green-400 w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <div>
                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 mb-0.5 sm:mb-1">{locale === 'th' ? 'ใช้งานอยู่' : 'Active'}</p>
                <p className="text-xl sm:text-2xl md:text-3xl font-bold text-green-600">{sows.filter(s => s.status === 'ACTIVE').length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white dark:bg-[#1f1d2e]">
          <CardContent className="pt-4 sm:pt-6 pb-4">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="p-1.5 sm:p-2 bg-pink-100 dark:bg-pink-900/50 rounded-lg">
                <PiggyBank className="text-pink-600 dark:text-pink-400 w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <div>
                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 mb-0.5 sm:mb-1">{locale === 'th' ? 'ท้อง' : 'Pregnant'}</p>
                <p className="text-xl sm:text-2xl md:text-3xl font-bold text-pink-600">{sows.filter(s => s.status === 'PREGNANT').length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white dark:bg-[#1f1d2e]">
          <CardContent className="pt-4 sm:pt-6 pb-4">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="p-1.5 sm:p-2 bg-blue-100 dark:bg-blue-900/50 rounded-lg">
                <PiggyBank className="text-blue-600 dark:text-blue-400 w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <div>
                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 mb-0.5 sm:mb-1">{locale === 'th' ? 'ให้นม' : 'Lactating'}</p>
                <p className="text-xl sm:text-2xl md:text-3xl font-bold text-blue-600">{sows.filter(s => s.status === 'LACTATING').length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Sows Table */}
      <Card className="bg-white dark:bg-[#1f1d2e] overflow-hidden">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-b border-gray-100 dark:border-gray-600 bg-gray-50 dark:bg-[#2a2640] hover:bg-gray-50 dark:hover:bg-[#2a2640]">
                <TableHead 
                  className="px-1.5 sm:px-2 md:px-4 py-2 sm:py-3 text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-300 uppercase first:rounded-tl-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-[#3a3650]"
                  onClick={() => handleSort('tagNumber')}
                >
                  <div className="flex items-center">
                    <span className="sm:hidden">{locale === 'th' ? 'Tag' : 'Tag'}</span>
                    <span className="hidden sm:inline">{t('sows.tagNumber')}</span>
                    {getSortIcon('tagNumber')}
                  </div>
                </TableHead>
                <TableHead 
                  className="px-1.5 sm:px-2 md:px-4 py-2 sm:py-3 text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-300 uppercase cursor-pointer hover:bg-gray-100 dark:hover:bg-[#3a3650]"
                  onClick={() => handleSort('breed')}
                >
                  <div className="flex items-center">
                    {t('sows.breed')}
                    {getSortIcon('breed')}
                  </div>
                </TableHead>
                <TableHead 
                  className="hidden sm:table-cell px-1.5 sm:px-2 md:px-4 py-2 sm:py-3 text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-300 uppercase cursor-pointer hover:bg-gray-100 dark:hover:bg-[#3a3650]"
                  onClick={() => handleSort('age')}
                >
                  <div className="flex items-center">
                    {locale === 'th' ? 'อายุ' : 'Age'}
                    {getSortIcon('age')}
                  </div>
                </TableHead>
                <TableHead 
                  className="px-1.5 sm:px-2 md:px-4 py-2 sm:py-3 text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-300 uppercase cursor-pointer hover:bg-gray-100 dark:hover:bg-[#3a3650]"
                  onClick={() => handleSort('status')}
                >
                  <div className="flex items-center">
                    {t('sows.status')}
                    {getSortIcon('status')}
                  </div>
                </TableHead>
                <TableHead 
                  className="hidden sm:table-cell px-1.5 sm:px-2 md:px-4 py-2 sm:py-3 text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-300 uppercase cursor-pointer hover:bg-gray-100 dark:hover:bg-[#3a3650]"
                  onClick={() => handleSort('breedings')}
                >
                  <div className="flex items-center">
                    {locale === 'th' ? 'ผสม' : 'Breedings'}
                    {getSortIcon('breedings')}
                  </div>
                </TableHead>
                <TableHead 
                  className="hidden md:table-cell px-1.5 sm:px-2 md:px-4 py-2 sm:py-3 text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-300 uppercase cursor-pointer hover:bg-gray-100 dark:hover:bg-[#3a3650]"
                  onClick={() => handleSort('farrowings')}
                >
                  <div className="flex items-center">
                    {locale === 'th' ? 'คลอด' : 'Farrowings'}
                    {getSortIcon('farrowings')}
                  </div>
                </TableHead>
                <TableHead className="px-1.5 sm:px-2 md:px-4 py-2 sm:py-3 text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-300 uppercase text-right last:rounded-tr-lg">
                  <span className="sm:hidden">{locale === 'th' ? '' : ''}</span>
                  <span className="hidden sm:inline">{t('common.edit')}</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedSows.map((sow) => (
                <TableRow key={sow.id} className="hover:bg-gray-50 dark:hover:bg-[#7800A3]/10">
                  <TableCell className="px-1.5 sm:px-2 md:px-4 py-2 sm:py-3">
                    <span className="font-semibold text-xs sm:text-sm text-gray-900 dark:text-white">{sow.tagNumber}</span>
                  </TableCell>
                  <TableCell className="px-1.5 sm:px-2 md:px-4 py-2 sm:py-3 text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                    {sow.breed}
                  </TableCell>
                  <TableCell className="hidden sm:table-cell px-1.5 sm:px-2 md:px-4 py-2 sm:py-3 text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                    {getAgeInMonths(sow.birthDate)}
                  </TableCell>
                  <TableCell className="px-1.5 sm:px-2 md:px-4 py-2 sm:py-3">
                    <span className={`px-1.5 sm:px-3 py-0.5 sm:py-1 rounded-full text-xs sm:text-sm font-medium ${
                      sow.status === 'ACTIVE' ? 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-200' :
                      sow.status === 'PREGNANT' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-200' :
                      sow.status === 'LACTATING' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-200' :
                      sow.status === 'WEANED' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-200' :
                      sow.status === 'CULLED' ? 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-200' :
                      'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
                    }`}>
                      <span className="sm:hidden">
                        {sow.status === 'ACTIVE' ? (locale === 'th' ? 'ใช้งาน' : 'ACT') :
                         sow.status === 'PREGNANT' ? (locale === 'th' ? 'ท้อง' : 'PREG') :
                         sow.status === 'LACTATING' ? (locale === 'th' ? 'นม' : 'LACT') :
                         sow.status === 'WEANED' ? (locale === 'th' ? 'หย่า' : 'WEAN') :
                         sow.status === 'CULLED' ? (locale === 'th' ? 'คัด' : 'CULL') :
                         sow.status === 'SOLD' ? (locale === 'th' ? 'ขาย' : 'SOLD') : sow.status}
                      </span>
                      <span className="hidden sm:inline">{sow.status}</span>
                    </span>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell px-1.5 sm:px-2 md:px-4 py-2 sm:py-3 text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                    {sow.breedings?.length || 0}
                  </TableCell>
                  <TableCell className="hidden md:table-cell px-1.5 sm:px-2 md:px-4 py-2 sm:py-3 text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                    {sow.farrowings?.length || 0}
                  </TableCell>
                  <TableCell className="px-1.5 sm:px-2 md:px-4 py-2 sm:py-3 text-right">
                    <div className="flex items-center justify-end gap-0.5 sm:gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openModal(sow)}
                        className="cursor-pointer text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/20 h-7 w-7 sm:h-8 sm:w-8"
                      >
                        <Edit2 className="w-4 h-4 sm:w-[18px] sm:h-[18px]" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openDeleteDialog(sow)}
                        className="cursor-pointer text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 h-7 w-7 sm:h-8 sm:w-8"
                      >
                        <Trash2 className="w-4 h-4 sm:w-[18px] sm:h-[18px]" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          </div>

          {filteredAndSortedSows.length === 0 && (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
              {t('common.noData')}
            </div>
          )}

          {/* Pagination Controls */}
          {filteredAndSortedSows.length > 0 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-2 sm:gap-4 px-2 sm:px-4 py-3 sm:py-4 border-t border-gray-200 dark:border-[#8B8D98]/50">
              <div className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm text-gray-600 dark:text-gray-300">
                <span>{locale === 'th' ? 'แสดง' : 'Showing'}</span>
                <span className="font-medium text-gray-900 dark:text-white">
                  {((currentPage - 1) * rowsPerPage) + 1}-{Math.min(currentPage * rowsPerPage, filteredAndSortedSows.length)}
                </span>
                <span>{locale === 'th' ? 'จาก' : 'of'}</span>
                <span className="font-medium text-gray-900 dark:text-white">{filteredAndSortedSows.length}</span>
              </div>
              
              <div className="flex items-center gap-2 sm:gap-4">
                <div className="flex items-center gap-1 sm:gap-2">
                  <span className="hidden sm:inline text-sm text-gray-600 dark:text-gray-300">{locale === 'th' ? 'แถวต่อหน้า' : 'Rows per page'}</span>
                  <Select
                    value={String(rowsPerPage)}
                    onValueChange={(value) => {
                      setRowsPerPage(Number(value));
                      setCurrentPage(1);
                    }}
                  >
                    <SelectTrigger className="w-14 sm:w-17.5 h-7 sm:h-8 px-2 py-1 text-xs sm:text-sm border border-gray-200 dark:border-[#8B8D98]/50 rounded-md bg-white dark:bg-[#1f1d2e] text-gray-900 dark:text-white focus:ring-0 focus:border-[#7800A3]">
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
                
                <div className="flex items-center gap-0.5 sm:gap-1">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="h-7 w-7 sm:h-8 sm:w-8 cursor-pointer dark:text-gray-200 border-gray-200 dark:border-[#8B8D98]/50 dark:focus:border-[#7800A3]"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  
                  <div className="flex items-center gap-1 px-1 sm:px-2">
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
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[200] p-3 sm:p-4">
          <div className="bg-white dark:bg-[#1f1d2e] border border-gray-200 dark:border-[#8B8D98]/50 rounded-lg p-4 sm:p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">
                {editingSow ? t('common.edit') + ' Sow' : t('sows.add')}
              </h2>
              <Button 
                variant="ghost" 
                size="icon" 
                className="dark:hover:text-gray-200 cursor-pointer rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:text-gray-300  dark:hover:bg-[#2a2640] transition-colors" 
                onClick={closeModal}
              >
                <X size={20} />
              </Button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm text-gray-600 dark:text-gray-300 mb-2">{t('sows.tagNumber')} *</label>
                <input
                  type="text"
                  value={formData.tagNumber}
                  onChange={(e) => {
                    setFormData({ ...formData, tagNumber: e.target.value });
                    if (fieldErrors.tagNumber) setFieldErrors({ ...fieldErrors, tagNumber: undefined });
                  }}
                  className={`w-full px-3 py-2 h-10 border focus:border-0 rounded-lg bg-gray-50 dark:bg-[#2a2640] text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400 focus:ring-1 focus:ring-[#7800A3] outline-none ${
                    fieldErrors.tagNumber 
                      ? 'border-red-500 dark:border-red-500' 
                      : 'border-gray-200 dark:border-[#8B8D98]/50 focus:border-[#7800A3]'
                  }`}
                  placeholder="e.g., S001"
                />
                {fieldErrors.tagNumber && (
                  <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                    <AlertCircle size={14} />
                    {fieldErrors.tagNumber}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm text-gray-600 dark:text-gray-300 mb-2">{t('sows.breed')} *</label>
                <input
                  type="text"
                  value={formData.breed}
                  onChange={(e) => {
                    setFormData({ ...formData, breed: e.target.value });
                    if (fieldErrors.breed) setFieldErrors({ ...fieldErrors, breed: undefined });
                  }}
                  className={`w-full px-3 py-2 h-10 border focus:border-0 rounded-lg bg-gray-50 dark:bg-[#2a2640] text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400 focus:ring-1 focus:ring-[#7800A3] outline-none ${
                    fieldErrors.breed 
                      ? 'border-red-500 dark:border-red-500' 
                      : 'border-gray-200 dark:border-[#8B8D98]/50 focus:border-[#7800A3]'
                  }`}
                  placeholder="e.g., Landrace"
                />
                {fieldErrors.breed && (
                  <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                    <AlertCircle size={14} />
                    {fieldErrors.breed}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm text-gray-600 dark:text-gray-300 mb-2">{t('sows.birthDate')} *</label>
                <DatePicker
                  className={`cursor-pointer w-full h-10 px-3 py-2 border rounded-lg bg-gray-50 dark:bg-[#2a2640] text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400 focus:border-[#7800A3] focus:ring-0 focus:ring-[#7800A3] ${
                    fieldErrors.birthDate 
                      ? 'border-red-500 dark:border-red-500' 
                      : 'border-gray-200 dark:border-[#8B8D98]/60'
                  }`}
                  value={formData.birthDate}
                  onChange={(date) => {
                    setFormData({ ...formData, birthDate: date ? format(date, 'yyyy-MM-dd') : '' });
                    if (fieldErrors.birthDate) setFieldErrors({ ...fieldErrors, birthDate: undefined });
                  }}
                  placeholder={t('sows.birthDate')}
                  locale={locale}
                />
                {fieldErrors.birthDate && (
                  <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                    <AlertCircle size={14} />
                    {fieldErrors.birthDate}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm text-gray-600 dark:text-gray-300 mb-2">{t('sows.status')}</label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => setFormData({ ...formData, status: value })}
                >
                  <SelectTrigger className="w-full h-10 px-3 py-2 border border-gray-200 dark:border-[#8B8D98]/50 rounded-lg bg-gray-50 dark:bg-[#2a2640] text-gray-900 dark:text-white focus:border-[#7800A3] focus:ring-0 focus:ring-[#7800A3]">
                    <SelectValue placeholder={t('sows.status')} />
                  </SelectTrigger>
                  <SelectContent className="z-[300] bg-white dark:bg-[#2a2640] border border-gray-200 dark:border-[#8B8D98]/50">
                    {STATUS_OPTIONS.map((status) => (
                      <SelectItem key={status} value={status} className="cursor-pointer hover:bg-gray-100 dark:hover:bg-[#7800A3]/20 dark:text-white dark:hover:text-white">
                        {status}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="block text-sm text-gray-600 dark:text-gray-300 mb-2">{t('sows.notes')}</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-200 dark:border-[#8B8D98]/50 rounded-lg bg-gray-50 dark:bg-[#2a2640] text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400 focus:border-[#7800A3] focus:ring-0 focus:ring-[#7800A3] outline-none resize-none"
                  placeholder="Optional notes..."
                />
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={closeModal}
                  className="flex-1 cursor-pointer border-gray-400 dark:text-white dark:hover:text-gray-200 hover:border-gray-200"
                >
                  {t('common.cancel')}
                </Button>
                <Button
                  type="submit"
                  className="flex-1 bg-purple-600 hover:bg-purple-700 cursor-pointer dark:text-white"
                >
                  {editingSow ? t('common.save') : t('sows.add')}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent 
          className="bg-white dark:bg-[#1f1d2e] border border-gray-200 dark:border-[#8B8D98]/20"
          onEscapeKeyDown={() => setDeleteDialogOpen(false)}
        >
          {/* Close button */}
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-4 top-4 cursor-pointer rounded-full text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:text-white dark:hover:bg-gray-700 transition-colors"
            onClick={() => setDeleteDialogOpen(false)}
          >
            <X size={18} />
          </Button>
          
          <AlertDialogHeader>
            <AlertDialogTitle className="text-gray-900 dark:text-white">
              {t('common.delete')} Sow?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-gray-600 dark:text-gray-300">
              {sowToDelete?.tagNumber} - {sowToDelete?.breed}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="cursor-pointer border-gray-400 dark:text-white dark:hover:text-gray-200 hover:border-gray-200 dark:bg-transparent">
              {t('common.cancel')}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => sowToDelete && handleDelete(sowToDelete.id)}
              className="bg-red-600 hover:bg-red-700 text-white cursor-pointer"
            >
              {t('common.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Error Dialog */}
      <AlertDialog open={errorDialogOpen} onOpenChange={setErrorDialogOpen}>
        <AlertDialogContent 
          className="bg-white dark:bg-[#1f1d2e] border border-gray-200 dark:border-[#8B8D98]/20"
          onEscapeKeyDown={() => setErrorDialogOpen(false)}
        >
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-4 top-4 cursor-pointer rounded-full text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:text-white dark:hover:bg-gray-700 transition-colors"
            onClick={() => setErrorDialogOpen(false)}
          >
            <X size={18} />
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
