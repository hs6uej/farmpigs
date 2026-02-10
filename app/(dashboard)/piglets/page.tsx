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
  Baby,
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

interface Piglet {
  id: string;
  tagNumber: string | null;
  farrowingId: string;
  birthWeight: number | null;
  currentPenId: string | null;
  status: string;
  gender: string | null;
  notes: string | null;
  createdAt: string;
  farrowing: {
    id: string;
    farrowingDate: string;
    sow: {
      id: string;
      tagNumber: string;
    };
  };
  currentPen: {
    id: string;
    penNumber: string;
  } | null;
  growthRecords: {
    weight: number;
    recordDate: string;
  }[];
}

interface Farrowing {
  id: string;
  farrowingDate: string;
  sow: {
    id: string;
    tagNumber: string;
  };
}

interface Pen {
  id: string;
  penNumber: string;
  penType: string;
}

const STATUS_OPTIONS = ['NURSING', 'WEANED', 'GROWING', 'READY', 'SOLD', 'DEAD'];
const GENDER_OPTIONS = ['MALE', 'FEMALE'];

type SortField = 'tagNumber' | 'mother' | 'age' | 'birthWeight' | 'currentPen' | 'gender' | 'status';
type SortDirection = 'asc' | 'desc';

export default function PigletsPage() {
  const t = useTranslations();
  const locale = useLocale();
  
  const [piglets, setPiglets] = useState<Piglet[]>([]);
  const [farrowings, setFarrowings] = useState<Farrowing[]>([]);
  const [pens, setPens] = useState<Pen[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingPiglet, setEditingPiglet] = useState<Piglet | null>(null);
  const [formData, setFormData] = useState({
    tagNumber: '',
    farrowingId: '',
    birthWeight: '',
    currentPenId: '',
    status: 'NURSING',
    gender: '',
    notes: ''
  });

  // Delete confirmation state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [pigletToDelete, setPigletToDelete] = useState<Piglet | null>(null);

  // Error dialog state
  const [errorDialogOpen, setErrorDialogOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Field validation errors (inline)
  const [fieldErrors, setFieldErrors] = useState<{
    tagNumber?: string;
    farrowingId?: string;
    birthWeight?: string;
  }>({});

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Sorting state
  const [sortField, setSortField] = useState<SortField | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  useEffect(() => {
    fetchPiglets();
    fetchFarrowings();
    fetchPens();
  }, []);

  const fetchPiglets = async () => {
    try {
      const res = await fetch('/api/piglets');
      if (res.ok) {
        const data = await res.json();
        setPiglets(data);
      }
    } catch (error) {
      console.error('Error fetching piglets:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchFarrowings = async () => {
    try {
      const res = await fetch('/api/farrowings');
      if (res.ok) {
        const data = await res.json();
        setFarrowings(data);
      }
    } catch (error) {
      console.error('Error fetching farrowings:', error);
    }
  };

  const fetchPens = async () => {
    try {
      const res = await fetch('/api/pens');
      if (res.ok) {
        const data = await res.json();
        setPens(data);
      }
    } catch (error) {
      console.error('Error fetching pens:', error);
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
    
    if (!editingPiglet && !formData.farrowingId) {
      errors.farrowingId = locale === 'th' ? 'กรุณาเลือกการคลอด' : 'Farrowing is required';
    }
    
    if (formData.birthWeight && (isNaN(parseFloat(formData.birthWeight)) || parseFloat(formData.birthWeight) <= 0)) {
      errors.birthWeight = locale === 'th' ? 'น้ำหนักต้องเป็นตัวเลขที่มากกว่า 0' : 'Birth weight must be a positive number';
    }
    
    // If there are errors, set them and return
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }
    
    try {
      const url = '/api/piglets';
      const method = 'POST';
      
      const payload = editingPiglet 
        ? {
            id: editingPiglet.id,
            tagNumber: formData.tagNumber.trim(),
            currentPenId: formData.currentPenId || null,
            status: formData.status,
            gender: formData.gender || null,
            notes: formData.notes || null,
          }
        : {
            tagNumber: formData.tagNumber.trim(),
            farrowingId: formData.farrowingId,
            birthWeight: formData.birthWeight ? parseFloat(formData.birthWeight) : null,
            currentPenId: formData.currentPenId || null,
            status: formData.status,
            gender: formData.gender || null,
            notes: formData.notes || null,
          };

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        fetchPiglets();
        closeModal();
      } else {
        const error = await res.json();
        setErrorMessage(error.error || (locale === 'th' ? 'เกิดข้อผิดพลาด' : 'An error occurred'));
        setErrorDialogOpen(true);
      }
    } catch (error) {
      console.error('Error saving piglet:', error);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/piglets/${id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchPiglets();
      }
    } catch (error) {
      console.error('Error deleting piglet:', error);
    } finally {
      setDeleteDialogOpen(false);
      setPigletToDelete(null);
    }
  };

  const openDeleteDialog = (piglet: Piglet) => {
    setPigletToDelete(piglet);
    setDeleteDialogOpen(true);
  };

  const openModal = (piglet?: Piglet) => {
    if (piglet) {
      setEditingPiglet(piglet);
      setFormData({
        tagNumber: piglet.tagNumber || '',
        farrowingId: piglet.farrowingId,
        birthWeight: piglet.birthWeight?.toString() || '',
        currentPenId: piglet.currentPenId || '',
        status: piglet.status,
        gender: piglet.gender || '',
        notes: piglet.notes || ''
      });
    } else {
      setEditingPiglet(null);
      setFormData({ 
        tagNumber: '', 
        farrowingId: '', 
        birthWeight: '', 
        currentPenId: '', 
        status: 'NURSING', 
        gender: '', 
        notes: '' 
      });
    }
    setFieldErrors({});
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingPiglet(null);
    setFieldErrors({});
    setFormData({ 
      tagNumber: '', 
      farrowingId: '', 
      birthWeight: '', 
      currentPenId: '', 
      status: 'NURSING', 
      gender: '', 
      notes: '' 
    });
  };

  const exportToExcel = () => {
    const exportData = piglets.map(piglet => ({
      [t('piglets.tagNumber')]: piglet.tagNumber || '-',
      [t('piglets.mother')]: piglet.farrowing?.sow?.tagNumber || '-',
      [t('piglets.birthWeight')]: piglet.birthWeight ? `${piglet.birthWeight} ${t('piglets.kg')}` : '-',
      [t('piglets.currentWeight')]: piglet.growthRecords?.[0]?.weight ? `${piglet.growthRecords[0].weight} ${t('piglets.kg')}` : '-',
      [t('piglets.currentPen')]: piglet.currentPen?.penNumber || t('piglets.noPen'),
      [t('piglets.status')]: piglet.status,
      [t('piglets.gender')]: piglet.gender || '-',
      [t('piglets.age')]: getAgeInDays(piglet.farrowing?.farrowingDate)
    }));
    
    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Piglets');
    XLSX.writeFile(wb, `piglets_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  // Helper function to get age in days
  const getAgeInDays = (farrowingDate: string | undefined): number => {
    if (!farrowingDate) return 0;
    const birth = new Date(farrowingDate);
    const now = new Date();
    return Math.floor((now.getTime() - birth.getTime()) / (1000 * 60 * 60 * 24));
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

  // Filter and sort piglets
  const filteredAndSortedPiglets = useMemo(() => {
    let result = piglets.filter(piglet => 
      (piglet.tagNumber?.toLowerCase().includes(search.toLowerCase()) || false) ||
      (piglet.farrowing?.sow?.tagNumber?.toLowerCase().includes(search.toLowerCase()) || false) ||
      (piglet.currentPen?.penNumber?.toLowerCase().includes(search.toLowerCase()) || false)
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
          case 'mother':
            aValue = a.farrowing?.sow?.tagNumber || '';
            bValue = b.farrowing?.sow?.tagNumber || '';
            break;
          case 'age':
            aValue = getAgeInDays(a.farrowing?.farrowingDate);
            bValue = getAgeInDays(b.farrowing?.farrowingDate);
            break;
          case 'birthWeight':
            aValue = a.birthWeight || 0;
            bValue = b.birthWeight || 0;
            break;
          case 'currentPen':
            aValue = a.currentPen?.penNumber || '';
            bValue = b.currentPen?.penNumber || '';
            break;
          case 'gender':
            aValue = a.gender || '';
            bValue = b.gender || '';
            break;
          case 'status':
            aValue = a.status || '';
            bValue = b.status || '';
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
  }, [piglets, search, sortField, sortDirection]);

  // Pagination
  const totalPages = Math.ceil(filteredAndSortedPiglets.length / rowsPerPage);
  const paginatedPiglets = useMemo(() => {
    const startIndex = (currentPage - 1) * rowsPerPage;
    return filteredAndSortedPiglets.slice(startIndex, startIndex + rowsPerPage);
  }, [filteredAndSortedPiglets, currentPage, rowsPerPage]);

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
      NURSING: 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-200',
      WEANED: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-200',
      GROWING: 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-200',
      READY: 'bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-200',
      SOLD: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200',
      DEAD: 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-200',
    };
    
    const statusLabel = t(`piglets.${status.toLowerCase()}`) || status;
    
    return (
      <span className={`px-3 py-1 rounded-full text-sm font-medium ${colors[status] || 'bg-gray-100 text-gray-800'}`}>
        {statusLabel}
      </span>
    );
  };

  const getGenderLabel = (gender: string | null) => {
    if (!gender) return '-';
    return t(`piglets.${gender.toLowerCase()}`) || gender;
  };

  // getAgeInDays for display (returns string or number)
  const getAgeInDaysDisplay = (farrowingDate: string | undefined) => {
    if (!farrowingDate) return '-';
    return getAgeInDays(farrowingDate);
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
            <Baby className="text-purple-500 w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8" />
            {t('piglets.title')}
          </h1>
          <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 mt-1">
            {locale === 'th' ? 'จัดการข้อมูลลูกสุกร' : 'Manage piglet records'}
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
            <span className="hidden sm:inline">{t('piglets.add')}</span>
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
          className="w-full pl-10 pr-4 py-2 border text-sm border-gray-200 dark:border-[#8B8D98]/50 rounded-lg bg-white dark:bg-[#1f1d2e] text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400 outline-none focus:border-[#7800A3] focus:ring-0 focus:ring-[#7800A3] transition-colors"
        />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-6 mb-4 sm:mb-8">
        <Card className="bg-white dark:bg-[#1f1d2e]">
          <CardContent className="pt-4 sm:pt-6 pb-4">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="p-1.5 sm:p-2 bg-purple-100 dark:bg-purple-900/50 rounded-lg">
                <Baby className="text-purple-600 dark:text-purple-400 w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <div>
                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 mb-0.5 sm:mb-1">{t('piglets.total')}</p>
                <p className="text-xl sm:text-2xl md:text-3xl font-bold text-purple-600">{piglets.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white dark:bg-[#1f1d2e]">
          <CardContent className="pt-4 sm:pt-6 pb-4">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="p-1.5 sm:p-2 bg-blue-100 dark:bg-blue-900/50 rounded-lg">
                <Baby className="text-blue-600 dark:text-blue-400 w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <div>
                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 mb-0.5 sm:mb-1">{t('piglets.nursing')}</p>
                <p className="text-xl sm:text-2xl md:text-3xl font-bold text-blue-600">{piglets.filter(p => p.status === 'NURSING').length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white dark:bg-[#1f1d2e]">
          <CardContent className="pt-4 sm:pt-6 pb-4">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="p-1.5 sm:p-2 bg-green-100 dark:bg-green-900/50 rounded-lg">
                <Baby className="text-green-600 dark:text-green-400 w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <div>
                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 mb-0.5 sm:mb-1">{t('piglets.growing')}</p>
                <p className="text-xl sm:text-2xl md:text-3xl font-bold text-green-600">{piglets.filter(p => p.status === 'GROWING').length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white dark:bg-[#1f1d2e]">
          <CardContent className="pt-4 sm:pt-6 pb-4">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="p-1.5 sm:p-2 bg-yellow-100 dark:bg-yellow-900/50 rounded-lg">
                <Baby className="text-yellow-600 dark:text-yellow-400 w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <div>
                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 mb-0.5 sm:mb-1">{t('piglets.ready')}</p>
                <p className="text-xl sm:text-2xl md:text-3xl font-bold text-yellow-600">{piglets.filter(p => p.status === 'READY').length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Piglets Table */}
      <Card className="bg-white dark:bg-[#1f1d2e] overflow-hidden">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-b border-gray-100 dark:border-gray-600 bg-gray-50 dark:bg-[#2a2640] hover:bg-gray-50 dark:hover:bg-[#2a2640]">
                <TableHead 
                  className="px-1.5 sm:px-2 md:px-4 py-2 sm:py-3 text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-300 uppercase first:rounded-tl-lg cursor-pointer select-none hover:bg-gray-100 dark:hover:bg-[#3a3650]"
                  onClick={() => handleSort('tagNumber')}
                >
                  <div className="flex items-center">
                    <span className="sm:hidden">Tag</span>
                    <span className="hidden sm:inline">{t('piglets.tagNumber')}</span>
                    {getSortIcon('tagNumber')}
                  </div>
                </TableHead>
                <TableHead 
                  className="px-1.5 sm:px-2 md:px-4 py-2 sm:py-3 text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-300 uppercase cursor-pointer select-none hover:bg-gray-100 dark:hover:bg-[#3a3650]"
                  onClick={() => handleSort('mother')}
                >
                  <div className="flex items-center">
                    <span className="sm:hidden">{locale === 'th' ? 'แม่' : 'Mom'}</span>
                    <span className="hidden sm:inline">{t('piglets.mother')}</span>
                    {getSortIcon('mother')}
                  </div>
                </TableHead>
                <TableHead 
                  className="hidden sm:table-cell px-1.5 sm:px-2 md:px-4 py-2 sm:py-3 text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-300 uppercase cursor-pointer select-none hover:bg-gray-100 dark:hover:bg-[#3a3650]"
                  onClick={() => handleSort('age')}
                >
                  <div className="flex items-center">
                    {t('piglets.age')}
                    {getSortIcon('age')}
                  </div>
                </TableHead>
                <TableHead 
                  className="hidden md:table-cell px-1.5 sm:px-2 md:px-4 py-2 sm:py-3 text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-300 uppercase cursor-pointer select-none hover:bg-gray-100 dark:hover:bg-[#3a3650]"
                  onClick={() => handleSort('birthWeight')}
                >
                  <div className="flex items-center">
                    {locale === 'th' ? 'น้ำหนัก' : 'Weight'}
                    {getSortIcon('birthWeight')}
                  </div>
                </TableHead>
                <TableHead 
                  className="hidden md:table-cell px-1.5 sm:px-2 md:px-4 py-2 sm:py-3 text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-300 uppercase cursor-pointer select-none hover:bg-gray-100 dark:hover:bg-[#3a3650]"
                  onClick={() => handleSort('currentPen')}
                >
                  <div className="flex items-center">
                    {locale === 'th' ? 'คอก' : 'Pen'}
                    {getSortIcon('currentPen')}
                  </div>
                </TableHead>
                <TableHead 
                  className="hidden lg:table-cell px-1.5 sm:px-2 md:px-4 py-2 sm:py-3 text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-300 uppercase cursor-pointer select-none hover:bg-gray-100 dark:hover:bg-[#3a3650]"
                  onClick={() => handleSort('gender')}
                >
                  <div className="flex items-center">
                    {t('piglets.gender')}
                    {getSortIcon('gender')}
                  </div>
                </TableHead>
                <TableHead 
                  className="px-1.5 sm:px-2 md:px-4 py-2 sm:py-3 text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-300 uppercase cursor-pointer select-none hover:bg-gray-100 dark:hover:bg-[#3a3650]"
                  onClick={() => handleSort('status')}
                >
                  <div className="flex items-center">
                    {t('piglets.status')}
                    {getSortIcon('status')}
                  </div>
                </TableHead>
                <TableHead className="px-1.5 sm:px-2 md:px-4 py-2 sm:py-3 text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-300 uppercase text-right last:rounded-tr-lg">
                  <span className="sm:hidden"></span>
                  <span className="hidden sm:inline">{t('common.edit')}</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedPiglets.map((piglet) => (
                <TableRow key={piglet.id} className="hover:bg-gray-50 dark:hover:bg-[#7800A3]/10">
                  <TableCell className="px-1.5 sm:px-2 md:px-4 py-2 sm:py-3">
                    <span className="font-semibold text-xs sm:text-sm text-gray-900 dark:text-white">
                      {piglet.tagNumber || '-'}
                    </span>
                  </TableCell>
                  <TableCell className="px-1.5 sm:px-2 md:px-4 py-2 sm:py-3 text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                    {piglet.farrowing?.sow?.tagNumber || '-'}
                  </TableCell>
                  <TableCell className="hidden sm:table-cell px-1.5 sm:px-2 md:px-4 py-2 sm:py-3 text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                    {getAgeInDaysDisplay(piglet.farrowing?.farrowingDate)} {t('piglets.days')}
                  </TableCell>
                  <TableCell className="hidden md:table-cell px-1.5 sm:px-2 md:px-4 py-2 sm:py-3 text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                    {piglet.birthWeight ? `${piglet.birthWeight}` : '-'}
                  </TableCell>
                  <TableCell className="hidden md:table-cell px-1.5 sm:px-2 md:px-4 py-2 sm:py-3 text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                    {piglet.currentPen?.penNumber || '-'}
                  </TableCell>
                  <TableCell className="hidden lg:table-cell px-1.5 sm:px-2 md:px-4 py-2 sm:py-3 text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                    {getGenderLabel(piglet.gender)}
                  </TableCell>
                  <TableCell className="px-1.5 sm:px-2 md:px-4 py-2 sm:py-3">
                    <span className={`px-1.5 sm:px-3 py-0.5 sm:py-1 rounded-full text-xs sm:text-sm font-medium ${
                      piglet.status === 'NURSING' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-200' :
                      piglet.status === 'WEANED' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-200' :
                      piglet.status === 'GROWING' ? 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-200' :
                      piglet.status === 'READY' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-200' :
                      piglet.status === 'DEAD' ? 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-200' :
                      'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
                    }`}>
                      <span className="sm:hidden">
                        {piglet.status === 'NURSING' ? (locale === 'th' ? 'ดูด' : 'NRS') :
                         piglet.status === 'WEANED' ? (locale === 'th' ? 'หย่า' : 'WND') :
                         piglet.status === 'GROWING' ? (locale === 'th' ? 'โต' : 'GRW') :
                         piglet.status === 'READY' ? (locale === 'th' ? 'พร้อม' : 'RDY') :
                         piglet.status === 'SOLD' ? (locale === 'th' ? 'ขาย' : 'SLD') :
                         piglet.status === 'DEAD' ? (locale === 'th' ? 'ตาย' : 'DED') : piglet.status}
                      </span>
                      <span className="hidden sm:inline">{t(`piglets.${piglet.status.toLowerCase()}`) || piglet.status}</span>
                    </span>
                  </TableCell>
                  <TableCell className="px-1.5 sm:px-2 md:px-4 py-2 sm:py-3 text-right">
                    <div className="flex items-center justify-end gap-0.5 sm:gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openModal(piglet)}
                        className="cursor-pointer text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/20 h-7 w-7 sm:h-8 sm:w-8"
                      >
                        <Edit2 className="w-4 h-4 sm:w-[18px] sm:h-[18px]" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openDeleteDialog(piglet)}
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

          {filteredAndSortedPiglets.length === 0 && (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
              {t('common.noData')}
            </div>
          )}

          {/* Pagination Controls */}
          {filteredAndSortedPiglets.length > 0 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-2 sm:gap-4 px-2 sm:px-4 py-3 sm:py-4 border-t border-gray-200 dark:border-[#8B8D98]/50">
              <div className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm text-gray-600 dark:text-gray-300">
                <span>{locale === 'th' ? 'แสดง' : 'Showing'}</span>
                <span className="font-medium text-gray-900 dark:text-white">
                  {((currentPage - 1) * rowsPerPage) + 1}-{Math.min(currentPage * rowsPerPage, filteredAndSortedPiglets.length)}
                </span>
                <span>{locale === 'th' ? 'จาก' : 'of'}</span>
                <span className="font-medium text-gray-900 dark:text-white">{filteredAndSortedPiglets.length}</span>
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
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-200 p-3 sm:p-4">
          <div className="bg-white dark:bg-[#1f1d2e] border border-gray-200 dark:border-[#8B8D98]/50 rounded-lg p-4 sm:p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">
                {editingPiglet ? t('common.edit') + ' Piglet' : t('piglets.add')}
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
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-600 dark:text-gray-300 mb-2">{t('piglets.tagNumber')} *</label>
                  <input
                    type="text"
                    value={formData.tagNumber}
                    onChange={(e) => {
                      setFormData({ ...formData, tagNumber: e.target.value });
                      if (fieldErrors.tagNumber) setFieldErrors({ ...fieldErrors, tagNumber: undefined });
                    }}
                    required
                    className={`w-full px-3 py-2 h-10 border focus:border-0 rounded-lg bg-gray-50 dark:bg-[#2a2640] text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400 focus:ring-1 outline-none ${fieldErrors.tagNumber ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'border-gray-200 dark:border-[#8B8D98]/50 focus:border-[#7800A3] focus:ring-[#7800A3]'}`}
                    placeholder="e.g., P001" />
                  {fieldErrors.tagNumber && (
                    <p className="mt-1 text-sm text-red-500">{fieldErrors.tagNumber}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm text-gray-600 dark:text-gray-300 mb-2">{t('piglets.status')}</label>
                  <Select
                    value={formData.status}
                    onValueChange={(value) => setFormData({ ...formData, status: value })}
                  >
                    <SelectTrigger className="w-full px-3 py-2 h-10 border border-gray-200 dark:border-[#8B8D98]/50 rounded-lg bg-gray-50 dark:bg-[#2a2640] text-gray-900 dark:text-white focus:border-[#7800A3] focus:ring-0 focus:ring-[#7800A3]">
                      <SelectValue placeholder={t('piglets.selectStatus')} />
                    </SelectTrigger>
                    <SelectContent className="z-300 bg-white dark:bg-[#2a2640] border border-gray-200 dark:border-[#8B8D98]/50">
                      {STATUS_OPTIONS.map((status) => (
                        <SelectItem key={status} value={status} className="cursor-pointer hover:bg-gray-100 dark:hover:bg-[#7800A3]/20 dark:text-white dark:hover:text-white">
                          {t(`piglets.${status.toLowerCase()}`) || status}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Age field - read only for edit, calculated for add */}
                {editingPiglet && (
                  <div>
                    <label className="block text-sm text-gray-600 dark:text-gray-300 mb-2">{t('piglets.age')}</label>
                    <input
                      type="text"
                      value={`${getAgeInDays(editingPiglet.farrowing?.farrowingDate)} ${t('piglets.days')}`}
                      readOnly
                      className="w-full px-3 py-2 h-10 border border-gray-200 dark:border-[#8B8D98]/50 rounded-lg bg-gray-100 dark:bg-[#3a3650] text-gray-600 dark:text-gray-300 cursor-not-allowed"
                    />
                  </div>
                )}

                {!editingPiglet && (
                  <>
                    <div>
                      <label className="block text-sm text-gray-600 dark:text-gray-300 mb-2">{t('piglets.farrowing')} *</label>
                      <Select
                        value={formData.farrowingId}
                        onValueChange={(value) => {
                          setFormData({ ...formData, farrowingId: value });
                          if (fieldErrors.farrowingId) setFieldErrors({ ...fieldErrors, farrowingId: undefined });
                        }}
                      >
                        <SelectTrigger className={`w-full h-10 px-3 py-2 border rounded-lg bg-gray-50 dark:bg-[#2a2640] text-gray-900 dark:text-white focus:ring-0 data-[placeholder]:text-gray-500 dark:data-[placeholder]:text-white ${fieldErrors.farrowingId ? 'border-red-500 focus:border-red-500' : 'border-gray-200 dark:border-[#8B8D98]/50 focus:border-[#7800A3]'}`}>
                          <SelectValue placeholder={t('piglets.selectFarrowing')} />
                        </SelectTrigger>
                        <SelectContent className="z-300 bg-white dark:bg-[#2a2640] border border-gray-200 dark:border-[#8B8D98]/50">
                          {farrowings.map((farrowing) => (
                            <SelectItem key={farrowing.id} value={farrowing.id} className="cursor-pointer hover:bg-gray-100 dark:hover:bg-[#7800A3]/20 dark:text-white dark:hover:text-white">
                              {farrowing.sow?.tagNumber} - {new Date(farrowing.farrowingDate).toLocaleDateString(locale === 'th' ? 'th-TH' : 'en-US')}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {fieldErrors.farrowingId && (
                        <p className="mt-1 text-sm text-red-500">{fieldErrors.farrowingId}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm text-gray-600 dark:text-gray-300 mb-2">{t('piglets.birthWeight')}</label>
                      <input
                        type="number"
                        step="0.01"
                        value={formData.birthWeight}
                        onChange={(e) => {
                          setFormData({ ...formData, birthWeight: e.target.value });
                          if (fieldErrors.birthWeight) setFieldErrors({ ...fieldErrors, birthWeight: undefined });
                        }}
                        className={`w-full px-3 py-2 h-10 border focus:border-0 rounded-lg bg-gray-50 dark:bg-[#2a2640] text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400 focus:ring-1 outline-none ${fieldErrors.birthWeight ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'border-gray-200 dark:border-[#8B8D98]/50 focus:border-[#7800A3] focus:ring-[#7800A3]'}`}
                        placeholder="e.g., 1.5"
                      />
                      {fieldErrors.birthWeight && (
                        <p className="mt-1 text-sm text-red-500">{fieldErrors.birthWeight}</p>
                      )}
                    </div>
                  </>
                )}

                {/* Current Pen - for both add and edit */}
                <div>
                  <label className="block text-sm text-gray-600 dark:text-gray-300 mb-2">{t('piglets.currentPen')}</label>
                  <Select
                    value={formData.currentPenId}
                    onValueChange={(value) => setFormData({ ...formData, currentPenId: value })}
                  >
                    <SelectTrigger className="w-full h-10 px-3 py-2 border border-gray-200 dark:border-[#8B8D98]/50 rounded-lg bg-gray-50 dark:bg-[#2a2640] text-gray-900 dark:text-white focus:border-[#7800A3] focus:ring-0 focus:ring-[#7800A3] data-[placeholder]:text-gray-500 dark:data-[placeholder]:text-white">
                      <SelectValue placeholder={t('piglets.selectPen')} />
                    </SelectTrigger>
                    <SelectContent className="z-[300] bg-white dark:bg-[#2a2640] border border-gray-200 dark:border-[#8B8D98]/50">
                      {pens.map((pen) => (
                        <SelectItem key={pen.id} value={pen.id} className="cursor-pointer hover:bg-gray-100 dark:hover:bg-[#7800A3]/20 dark:text-white dark:hover:text-white">
                          {pen.penNumber} ({pen.penType})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Gender - for both add and edit */}
                <div>
                  <label className="block text-sm text-gray-600 dark:text-gray-300 mb-2">{t('piglets.gender')}</label>
                  <Select
                    value={formData.gender}
                    onValueChange={(value) => setFormData({ ...formData, gender: value })}
                  >
                    <SelectTrigger className="w-full h-10 px-3 py-2 border border-gray-200 dark:border-[#8B8D98]/50 rounded-lg bg-gray-50 dark:bg-[#2a2640] text-gray-900 dark:text-white focus:border-[#7800A3] focus:ring-0 focus:ring-[#7800A3] data-[placeholder]:text-gray-500 dark:data-[placeholder]:text-white">
                      <SelectValue placeholder={t('piglets.selectGender')} />
                    </SelectTrigger>
                    <SelectContent className="z-300 bg-white dark:bg-[#2a2640] border border-gray-200 dark:border-[#8B8D98]/50">
                      {GENDER_OPTIONS.map((gender) => (
                        <SelectItem key={gender} value={gender} className="cursor-pointer hover:bg-gray-100 dark:hover:bg-[#7800A3]/20 dark:text-white dark:hover:text-white">
                          {t(`piglets.${gender.toLowerCase()}`) || gender}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <label className="block text-sm text-gray-600 dark:text-gray-300 mb-2">{t('piglets.notes')}</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={2}
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
                  {editingPiglet ? t('common.save') : t('piglets.add')}
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
              {t('common.delete')} Piglet?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-gray-600 dark:text-gray-300">
              {pigletToDelete?.tagNumber || 'No Tag'} - {pigletToDelete?.farrowing?.sow?.tagNumber || 'Unknown Mother'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="cursor-pointer border-gray-400 dark:text-white dark:hover:text-gray-200 hover:border-gray-200 dark:bg-transparent">
              {t('common.cancel')}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => pigletToDelete && handleDelete(pigletToDelete.id)}
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
          {/* Close button */}
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-4 top-4 cursor-pointer rounded-full text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:text-white dark:hover:bg-gray-700 transition-colors"
            onClick={() => setErrorDialogOpen(false)}
          >
            <X size={18} />
          </Button>
          
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-red-600 dark:text-red-400">
              <AlertCircle size={20} />
              {locale === 'th' ? 'ข้อผิดพลาด' : 'Error'}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-gray-600 dark:text-gray-300">
              {errorMessage}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction
              onClick={() => setErrorDialogOpen(false)}
              className="bg-red-600 hover:bg-red-700 text-white cursor-pointer"
            >
              {locale === 'th' ? 'ตกลง' : 'OK'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
