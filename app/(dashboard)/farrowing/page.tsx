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
import { DatePicker } from '@/components/ui/date-picker';
import { format } from 'date-fns';

interface Farrowing {
  id: string;
  sowId: string;
  breedingId: string;
  farrowingDate: string;
  totalBorn: number;
  bornAlive: number;
  stillborn: number;
  mummified: number;
  averageBirthWeight: number | null;
  notes?: string;
  sow: {
    id: string;
    tagNumber: string;
  };
  breeding: {
    id: string;
    breedingDate: string;
    boar: {
      id: string;
      tagNumber: string;
    };
  };
  piglets: any[];
}

interface Sow {
  id: string;
  tagNumber: string;
  status: string;
}

interface Breeding {
  id: string;
  breedingDate: string;
  sow: { id: string; tagNumber: string };
  boar: { id: string; tagNumber: string };
}

type SortField = 'sowTag' | 'farrowingDate' | 'totalBorn' | 'bornAlive' | 'stillborn' | 'avgWeight' | 'piglets';
type SortDirection = 'asc' | 'desc';

export default function FarrowingPage() {
  const t = useTranslations();
  const locale = useLocale();
  
  const [farrowings, setFarrowings] = useState<Farrowing[]>([]);
  const [sows, setSows] = useState<Sow[]>([]);
  const [breedings, setBreedings] = useState<Breeding[]>([]);
  const [allBreedings, setAllBreedings] = useState<Breeding[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingFarrowing, setEditingFarrowing] = useState<Farrowing | null>(null);
  const [formData, setFormData] = useState({
    sowId: '',
    breedingId: '',
    farrowingDate: '',
    totalBorn: '',
    bornAlive: '',
    stillborn: '0',
    mummified: '0',
    averageBirthWeight: '',
    notes: ''
  });

  // Delete confirmation state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [farrowingToDelete, setFarrowingToDelete] = useState<Farrowing | null>(null);

  // Error dialog state
  const [errorDialogOpen, setErrorDialogOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Field validation errors
  const [fieldErrors, setFieldErrors] = useState<{
    sowId?: string;
    breedingId?: string;
    farrowingDate?: string;
    totalBorn?: string;
    bornAlive?: string;
  }>({});

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Sorting state
  const [sortField, setSortField] = useState<SortField | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  useEffect(() => {
    fetchFarrowings();
    fetchSows();
    fetchBreedings();
  }, []);

  const fetchFarrowings = async () => {
    try {
      const res = await fetch('/api/farrowings');
      if (res.ok) {
        const data = await res.json();
        setFarrowings(data);
      }
    } catch (error) {
      console.error('Error fetching farrowings:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSows = async () => {
    try {
      const res = await fetch('/api/sows');
      if (res.ok) {
        const data = await res.json();
        // Filter sows that are PREGNANT or ACTIVE (can have farrowing)
        setSows(data.filter((s: Sow) => s.status === 'PREGNANT' || s.status === 'ACTIVE'));
      }
    } catch (error) {
      console.error('Error fetching sows:', error);
    }
  };

  const fetchBreedings = async () => {
    try {
      const res = await fetch('/api/breedings');
      if (res.ok) {
        const data = await res.json();
        console.log('All breedings from API:', data.length, 'records');
        
        // Keep all breedings for editing
        setAllBreedings(data);
        
        // Filter breedings that don't have farrowing yet and not failed (for new records)
        const availableBreedings = data.filter((b: any) => {
          const hasNoFarrowing = b.farrowing === null || b.farrowing === undefined;
          const notFailed = b.success !== false;
          return hasNoFarrowing && notFailed;
        });
        
        console.log('Available for farrowing:', availableBreedings.length, 'records');
        
        // If no available breedings, show message in console
        if (availableBreedings.length === 0) {
          console.log('No breedings available! All breedings either have farrowing or failed.');
          data.forEach((b: any, i: number) => {
            console.log(`Breeding ${i + 1}: farrowing=${b.farrowing ? 'HAS' : 'NULL'}, success=${b.success}`);
          });
        }
        
        setBreedings(availableBreedings);
      }
    } catch (error) {
      console.error('Error fetching breedings:', error);
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
    if (!formData.breedingId) {
      errors.breedingId = locale === 'th' ? 'กรุณาเลือกการผสม' : 'Breeding is required';
    }
    if (!formData.farrowingDate) {
      errors.farrowingDate = locale === 'th' ? 'กรุณาเลือกวันที่คลอด' : 'Farrowing date is required';
    }
    if (!formData.totalBorn || parseInt(formData.totalBorn) < 0) {
      errors.totalBorn = locale === 'th' ? 'กรุณากรอกจำนวนเกิดทั้งหมด' : 'Total born is required';
    }
    if (!formData.bornAlive || parseInt(formData.bornAlive) < 0) {
      errors.bornAlive = locale === 'th' ? 'กรุณากรอกจำนวนเกิดมีชีวิต' : 'Born alive is required';
    }
    
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }
    
    try {
      const url = editingFarrowing ? `/api/farrowings/${editingFarrowing.id}` : '/api/farrowings';
      const method = editingFarrowing ? 'PUT' : 'POST';
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          totalBorn: parseInt(formData.totalBorn),
          bornAlive: parseInt(formData.bornAlive),
          stillborn: parseInt(formData.stillborn),
          mummified: parseInt(formData.mummified),
          averageBirthWeight: formData.averageBirthWeight ? parseFloat(formData.averageBirthWeight) : null
        })
      });

      if (res.ok) {
        fetchFarrowings();
        closeModal();
      } else {
        const error = await res.json();
        setErrorMessage(error.error || (locale === 'th' ? 'เกิดข้อผิดพลาด' : 'An error occurred'));
        setErrorDialogOpen(true);
      }
    } catch (error) {
      console.error('Error saving farrowing:', error);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/farrowings/${id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchFarrowings();
      } else {
        const error = await res.json();
        alert(error.error || 'เกิดข้อผิดพลาด');
      }
    } catch (error) {
      console.error('Error deleting farrowing:', error);
    } finally {
      setDeleteDialogOpen(false);
      setFarrowingToDelete(null);
    }
  };

  const openDeleteDialog = (farrowing: Farrowing) => {
    setFarrowingToDelete(farrowing);
    setDeleteDialogOpen(true);
  };

  const openModal = (farrowing?: Farrowing) => {
    if (farrowing) {
      setEditingFarrowing(farrowing);
      setFormData({
        sowId: farrowing.sowId,
        breedingId: farrowing.breedingId,
        farrowingDate: farrowing.farrowingDate.split('T')[0],
        totalBorn: farrowing.totalBorn.toString(),
        bornAlive: farrowing.bornAlive.toString(),
        stillborn: farrowing.stillborn.toString(),
        mummified: farrowing.mummified.toString(),
        averageBirthWeight: farrowing.averageBirthWeight?.toString() || '',
        notes: farrowing.notes || ''
      });
    } else {
      setEditingFarrowing(null);
      setFormData({
        sowId: '',
        breedingId: '',
        farrowingDate: new Date().toISOString().split('T')[0],
        totalBorn: '',
        bornAlive: '',
        stillborn: '0',
        mummified: '0',
        averageBirthWeight: '',
        notes: ''
      });
    }
    setFieldErrors({});
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingFarrowing(null);
    setFieldErrors({});
    setFormData({
      sowId: '',
      breedingId: '',
      farrowingDate: '',
      totalBorn: '',
      bornAlive: '',
      stillborn: '0',
      mummified: '0',
      averageBirthWeight: '',
      notes: ''
    });
  };

  const exportToExcel = () => {
    const exportData = farrowings.map(f => ({
      [locale === 'th' ? 'แม่พันธุ์' : 'Sow']: f.sow?.tagNumber,
      [locale === 'th' ? 'วันคลอด' : 'Farrowing Date']: format(new Date(f.farrowingDate), 'dd/MM/yyyy'),
      [locale === 'th' ? 'เกิดทั้งหมด' : 'Total Born']: f.totalBorn,
      [locale === 'th' ? 'เกิดมีชีวิต' : 'Born Alive']: f.bornAlive,
      [locale === 'th' ? 'ตายคลอด' : 'Stillborn']: f.stillborn,
      [locale === 'th' ? 'มัมมี่' : 'Mummified']: f.mummified,
      [locale === 'th' ? 'น้ำหนักเฉลี่ย (กก.)' : 'Avg Weight (kg)']: f.averageBirthWeight || '-',
      [locale === 'th' ? 'ลูกสุกร' : 'Piglets']: f.piglets?.length || 0
    }));
    
    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Farrowing');
    XLSX.writeFile(wb, `farrowing_${new Date().toISOString().split('T')[0]}.xlsx`);
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

  // Filter and sort farrowings
  const filteredAndSortedFarrowings = useMemo(() => {
    let result = farrowings.filter(f => 
      f.sow?.tagNumber?.toLowerCase().includes(search.toLowerCase()) ||
      f.breeding?.boar?.tagNumber?.toLowerCase().includes(search.toLowerCase())
    );

    // Apply sorting
    if (sortField) {
      result = [...result].sort((a, b) => {
        let aValue: any;
        let bValue: any;

        switch (sortField) {
          case 'sowTag':
            aValue = a.sow?.tagNumber || '';
            bValue = b.sow?.tagNumber || '';
            break;
          case 'farrowingDate':
            aValue = new Date(a.farrowingDate).getTime();
            bValue = new Date(b.farrowingDate).getTime();
            break;
          case 'totalBorn':
            aValue = a.totalBorn || 0;
            bValue = b.totalBorn || 0;
            break;
          case 'bornAlive':
            aValue = a.bornAlive || 0;
            bValue = b.bornAlive || 0;
            break;
          case 'stillborn':
            aValue = a.stillborn || 0;
            bValue = b.stillborn || 0;
            break;
          case 'avgWeight':
            aValue = a.averageBirthWeight || 0;
            bValue = b.averageBirthWeight || 0;
            break;
          case 'piglets':
            aValue = a.piglets?.length || 0;
            bValue = b.piglets?.length || 0;
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
  }, [farrowings, search, sortField, sortDirection]);

  // Pagination
  const totalPages = Math.ceil(filteredAndSortedFarrowings.length / rowsPerPage);
  const paginatedFarrowings = useMemo(() => {
    const startIndex = (currentPage - 1) * rowsPerPage;
    return filteredAndSortedFarrowings.slice(startIndex, startIndex + rowsPerPage);
  }, [filteredAndSortedFarrowings, currentPage, rowsPerPage]);

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

  // Get breedings for selected sow
  const filteredBreedings = useMemo(() => {
    // If editing, include the current breeding in the list
    let availableBreedings = [...breedings];
    
    if (editingFarrowing && editingFarrowing.breedingId) {
      // Find the current breeding from allBreedings
      const currentBreeding = allBreedings.find(b => b.id === editingFarrowing.breedingId);
      if (currentBreeding && !availableBreedings.find(b => b.id === currentBreeding.id)) {
        availableBreedings = [currentBreeding, ...availableBreedings];
      }
    }
    
    if (!formData.sowId) return availableBreedings;
    return availableBreedings.filter(b => b.sow.id === formData.sowId);
  }, [formData.sowId, breedings, editingFarrowing, allBreedings]);

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
            {locale === 'th' ? 'บันทึกการคลอด' : 'Farrowing Records'}
          </h1>
          <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 mt-1">
            {locale === 'th' ? 'จัดการข้อมูลการคลอดของแม่พันธุ์' : 'Manage sow farrowing records'}
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
            <span className="hidden sm:inline">{locale === 'th' ? 'เพิ่มบันทึกคลอด' : 'Add Farrowing'}</span>
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
                <Baby className="text-purple-600 dark:text-purple-400 w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <div>
                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 mb-0.5 sm:mb-1">{locale === 'th' ? 'คลอดทั้งหมด' : 'Total'}</p>
                <p className="text-xl sm:text-2xl md:text-3xl font-bold text-purple-600">{farrowings.length}</p>
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
                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 mb-0.5 sm:mb-1">{locale === 'th' ? 'มีชีวิต' : 'Alive'}</p>
                <p className="text-xl sm:text-2xl md:text-3xl font-bold text-green-600">{farrowings.reduce((sum, f) => sum + f.bornAlive, 0)}</p>
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
                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 mb-0.5 sm:mb-1">{locale === 'th' ? 'เฉลี่ย/ครอก' : 'Avg'}</p>
                <p className="text-xl sm:text-2xl md:text-3xl font-bold text-blue-600">
                  {farrowings.length > 0 ? (farrowings.reduce((sum, f) => sum + f.bornAlive, 0) / farrowings.length).toFixed(1) : '0'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white dark:bg-[#1f1d2e]">
          <CardContent className="pt-4 sm:pt-6 pb-4">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="p-1.5 sm:p-2 bg-pink-100 dark:bg-pink-900/50 rounded-lg">
                <Baby className="text-pink-600 dark:text-pink-400 w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <div>
                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 mb-0.5 sm:mb-1">{locale === 'th' ? 'ลูกสุกร' : 'Piglets'}</p>
                <p className="text-xl sm:text-2xl md:text-3xl font-bold text-pink-600">{farrowings.reduce((sum, f) => sum + (f.piglets?.length || 0), 0)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Farrowings Table */}
      <Card className="bg-white dark:bg-[#1f1d2e] overflow-hidden">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-b border-gray-100 dark:border-gray-600 bg-gray-50 dark:bg-[#2a2640] hover:bg-gray-50 dark:hover:bg-[#2a2640]">
                <TableHead 
                  className="px-1.5 sm:px-2 md:px-4 py-2 sm:py-3 text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-300 uppercase first:rounded-tl-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-[#3a3650]"
                  onClick={() => handleSort('sowTag')}
                >
                  <div className="flex items-center">
                    {locale === 'th' ? 'แม่' : 'Sow'}
                    {getSortIcon('sowTag')}
                  </div>
                </TableHead>
                <TableHead 
                  className="px-1.5 sm:px-2 md:px-4 py-2 sm:py-3 text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-300 uppercase cursor-pointer hover:bg-gray-100 dark:hover:bg-[#3a3650]"
                  onClick={() => handleSort('farrowingDate')}
                >
                  <div className="flex items-center">
                    {locale === 'th' ? 'วันคลอด' : 'Date'}
                    {getSortIcon('farrowingDate')}
                  </div>
                </TableHead>
                <TableHead 
                  className="hidden sm:table-cell px-1.5 sm:px-2 md:px-4 py-2 sm:py-3 text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-300 uppercase cursor-pointer hover:bg-gray-100 dark:hover:bg-[#3a3650]"
                  onClick={() => handleSort('totalBorn')}
                >
                  <div className="flex items-center">
                    {locale === 'th' ? 'ทั้งหมด' : 'Total'}
                    {getSortIcon('totalBorn')}
                  </div>
                </TableHead>
                <TableHead 
                  className="px-1.5 sm:px-2 md:px-4 py-2 sm:py-3 text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-300 uppercase cursor-pointer hover:bg-gray-100 dark:hover:bg-[#3a3650]"
                  onClick={() => handleSort('bornAlive')}
                >
                  <div className="flex items-center">
                    {locale === 'th' ? 'มีชีวิต' : 'Alive'}
                    {getSortIcon('bornAlive')}
                  </div>
                </TableHead>
                <TableHead 
                  className="hidden md:table-cell px-1.5 sm:px-2 md:px-4 py-2 sm:py-3 text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-300 uppercase cursor-pointer hover:bg-gray-100 dark:hover:bg-[#3a3650]"
                  onClick={() => handleSort('stillborn')}
                >
                  <div className="flex items-center">
                    {locale === 'th' ? 'ตาย' : 'Still'}
                    {getSortIcon('stillborn')}
                  </div>
                </TableHead>
                <TableHead 
                  className="hidden lg:table-cell px-1.5 sm:px-2 md:px-4 py-2 sm:py-3 text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-300 uppercase cursor-pointer hover:bg-gray-100 dark:hover:bg-[#3a3650]"
                  onClick={() => handleSort('avgWeight')}
                >
                  <div className="flex items-center">
                    {locale === 'th' ? 'น้ำหนัก' : 'Weight'}
                    {getSortIcon('avgWeight')}
                  </div>
                </TableHead>
                <TableHead 
                  className="hidden sm:table-cell px-1.5 sm:px-2 md:px-4 py-2 sm:py-3 text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-300 uppercase cursor-pointer hover:bg-gray-100 dark:hover:bg-[#3a3650]"
                  onClick={() => handleSort('piglets')}
                >
                  <div className="flex items-center">
                    {locale === 'th' ? 'ลูก' : 'Pigs'}
                    {getSortIcon('piglets')}
                  </div>
                </TableHead>
                <TableHead className="px-1.5 sm:px-2 md:px-4 py-2 sm:py-3 text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-300 uppercase text-right last:rounded-tr-lg">
                  <span className="sm:hidden"></span>
                  <span className="hidden sm:inline">{t('common.edit')}</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedFarrowings.map((farrowing) => (
                <TableRow key={farrowing.id} className="border-b border-gray-100 dark:border-gray-600 hover:bg-gray-50  dark:hover:bg-[#7800A3]/10">
                  <TableCell className="px-1.5 sm:px-2 md:px-4 py-2 sm:py-3">
                    <span className="font-semibold text-xs sm:text-sm text-gray-900 dark:text-white">{farrowing.sow?.tagNumber}</span>
                  </TableCell>
                  <TableCell className="px-1.5 sm:px-2 md:px-4 py-2 sm:py-3 text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                    <span className="sm:hidden">{format(new Date(farrowing.farrowingDate), 'd/M')}</span>
                    <span className="hidden sm:inline">{format(new Date(farrowing.farrowingDate), 'dd/MM/yyyy')}</span>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell px-1.5 sm:px-2 md:px-4 py-2 sm:py-3 text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                    {farrowing.totalBorn}
                  </TableCell>
                  <TableCell className="px-1.5 sm:px-2 md:px-4 py-2 sm:py-3">
                    <span className="px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full text-xs sm:text-sm font-medium bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-200">
                      {farrowing.bornAlive}
                    </span>
                  </TableCell>
                  <TableCell className="hidden md:table-cell px-1.5 sm:px-2 md:px-4 py-2 sm:py-3">
                    {farrowing.stillborn > 0 ? (
                      <span className="px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full text-xs sm:text-sm font-medium bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-200">
                        {farrowing.stillborn}
                      </span>
                    ) : (
                      <span className="text-gray-400 text-xs sm:text-sm">0</span>
                    )}
                  </TableCell>
                  <TableCell className="hidden lg:table-cell px-1.5 sm:px-2 md:px-4 py-2 sm:py-3 text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                    {farrowing.averageBirthWeight ? `${farrowing.averageBirthWeight}` : '-'}
                  </TableCell>
                  <TableCell className="hidden sm:table-cell px-1.5 sm:px-2 md:px-4 py-2 sm:py-3">
                    <span className="px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full text-xs sm:text-sm font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-200">
                      {farrowing.piglets?.length || 0}
                    </span>
                  </TableCell>
                  <TableCell className="px-1.5 sm:px-2 md:px-4 py-2 sm:py-3 text-right">
                    <div className="flex justify-end gap-0.5 sm:gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openModal(farrowing)}
                        className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 cursor-pointer h-7 w-7 sm:h-8 sm:w-8"
                      >
                        <Edit2 className="w-4 h-4 sm:w-[16px] sm:h-[16px]" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openDeleteDialog(farrowing)}
                        className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 cursor-pointer h-7 w-7 sm:h-8 sm:w-8"
                      >
                        <Trash2 className="w-4 h-4 sm:w-[16px] sm:h-[16px]" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          </div>
          
          {paginatedFarrowings.length === 0 && (
            <div className="text-center py-12">
              <Baby className="mx-auto text-gray-400 mb-4" size={48} />
              <p className="text-gray-500 dark:text-gray-400">
                {locale === 'th' ? 'ไม่พบข้อมูลการคลอด' : 'No farrowing records found'}
              </p>
            </div>
          )}

          {/* Pagination Controls */}
          {filteredAndSortedFarrowings.length > 0 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-2 sm:gap-4 px-2 sm:px-4 py-3 sm:py-4 border-t border-gray-200 dark:border-[#8B8D98]/50">
              <div className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm text-gray-600 dark:text-gray-300">
                <span>{locale === 'th' ? 'แสดง' : 'Showing'}</span>
                <span className="font-medium text-gray-900 dark:text-white">
                  {((currentPage - 1) * rowsPerPage) + 1}-{Math.min(currentPage * rowsPerPage, filteredAndSortedFarrowings.length)}
                </span>
                <span>{locale === 'th' ? 'จาก' : 'of'}</span>
                <span className="font-medium text-gray-900 dark:text-white">{filteredAndSortedFarrowings.length}</span>
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
                    <SelectContent className="bg-white dark:bg-[#2a2640] border border-gray-200 dark:border-[#8B8D98]/50">
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

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[200] p-3 sm:p-4">
          <div className="bg-white dark:bg-[#1f1d2e] border border-gray-200 dark:border-[#8B8D98]/50 rounded-lg p-4 sm:p-6 w-full max-w-2xl shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">
                {editingFarrowing ? (locale === 'th' ? 'แก้ไขบันทึกคลอด' : 'Edit Farrowing') : (locale === 'th' ? 'เพิ่มบันทึกคลอดใหม่' : 'Add New Farrowing')}
              </h2>
              <Button 
                variant="ghost" 
                size="icon" 
                 className=" dark:hover:text-gray-200 cursor-pointer rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:text-gray-300  dark:hover:bg-[#2a2640] transition-colors" 
                onClick={closeModal}
              >
                <X size={20} />
              </Button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-600 dark:text-gray-300 mb-2">
                    {locale === 'th' ? 'แม่พันธุ์' : 'Sow'} *
                  </label>
                  <Select 
                    value={formData.sowId} 
                    onValueChange={(value) => {
                      setFormData({...formData, sowId: value, breedingId: ''});
                      if (fieldErrors.sowId) setFieldErrors({ ...fieldErrors, sowId: undefined });
                    }}
                    disabled={!!editingFarrowing}
                  >
                    <SelectTrigger className={`w-full h-10 px-3 py-2 border rounded-lg bg-gray-50 dark:bg-[#2a2640] text-gray-900 dark:text-white focus:ring-0 focus:ring-[#7800A3] disabled:opacity-100 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:dark:bg-[#1f1d2e] shadow-none ${
                      fieldErrors.sowId 
                        ? 'border-red-500 dark:border-red-500' 
                        : 'border-gray-200 dark:border-[#8B8D98]/50 focus:border-[#7800A3]'
                    }`}>
                      <SelectValue placeholder={locale === 'th' ? 'เลือกแม่พันธุ์' : 'Select Sow'}>
                        {editingFarrowing ? editingFarrowing.sow.tagNumber : undefined}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent className="bg-white dark:bg-[#2a2640] border border-gray-200 dark:border-[#8B8D98]/50">
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
                  <label className="block text-sm text-gray-600 dark:text-gray-300 mb-2">
                    {locale === 'th' ? 'การผสม' : 'Breeding'} *
                  </label>
                  <Select 
                    value={formData.breedingId} 
                    onValueChange={(value) => {
                      setFormData({...formData, breedingId: value});
                      if (fieldErrors.breedingId) setFieldErrors({ ...fieldErrors, breedingId: undefined });
                    }}
                    disabled={!!editingFarrowing}
                  >
                    <SelectTrigger className={`w-full h-10 px-3 py-2 border rounded-lg bg-gray-50 dark:bg-[#2a2640] text-gray-900 dark:text-white focus:ring-0 focus:ring-[#7800A3] disabled:opacity-100 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:dark:bg-[#1f1d2e] ${
                      fieldErrors.breedingId 
                        ? 'border-red-500 dark:border-red-500' 
                        : 'border-gray-200 dark:border-[#8B8D98]/50 focus:border-[#7800A3]'
                    }`}>
                      <SelectValue placeholder={locale === 'th' ? 'เลือกการผสม' : 'Select Breeding'}>
                        {editingFarrowing ? `${format(new Date(editingFarrowing.breeding.breedingDate), 'dd/MM/yyyy')} - ${editingFarrowing.breeding.boar?.tagNumber || ''}` : undefined}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent className="bg-white dark:bg-[#2a2640] border border-gray-200 dark:border-[#8B8D98]/50">
                      {filteredBreedings.length === 0 ? (
                        <div className="px-3 py-2 text-sm text-gray-500 dark:text-gray-400">
                          {locale === 'th' ? 'ไม่มีการผสมที่พร้อมบันทึกการคลอด' : 'No breedings available for farrowing'}
                        </div>
                      ) : (
                        filteredBreedings.map((b) => (
                          <SelectItem key={b.id} value={b.id} className="cursor-pointer hover:bg-gray-100 dark:hover:bg-[#7800A3]/20 dark:text-white dark:hover:text-white">
                            {format(new Date(b.breedingDate), 'dd/MM/yyyy')} - {b.boar?.tagNumber}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                  {fieldErrors.breedingId && (
                    <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                      <AlertCircle size={14} />
                      {fieldErrors.breedingId}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm text-gray-600 dark:text-gray-300 mb-2">
                    {locale === 'th' ? 'วันคลอด' : 'Farrowing Date'} *
                  </label>
                  <DatePicker
                    className={`cursor-pointer w-full h-10 px-3 py-2 border rounded-lg bg-gray-50 dark:bg-[#2a2640] text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400 focus:border-[#7800A3] focus:ring-1 focus:ring-[#7800A3] ${
                      fieldErrors.farrowingDate 
                        ? 'border-red-500 dark:border-red-500' 
                        : 'border-gray-200 dark:border-[#8B8D98]/60'
                    }`}
                    value={formData.farrowingDate}
                    onChange={(date) => {
                      setFormData({...formData, farrowingDate: date ? format(date, 'yyyy-MM-dd') : ''});
                      if (fieldErrors.farrowingDate) setFieldErrors({ ...fieldErrors, farrowingDate: undefined });
                    }}
                    placeholder={locale === 'th' ? 'เลือกวันคลอด' : 'Select Date'}
                    locale={locale}
                  />
                  {fieldErrors.farrowingDate && (
                    <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                      <AlertCircle size={14} />
                      {fieldErrors.farrowingDate}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm text-gray-600 dark:text-gray-300 mb-2">
                    {locale === 'th' ? 'น้ำหนักเกิดเฉลี่ย (กก.)' : 'Avg Birth Weight (kg)'}
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.averageBirthWeight}
                    onChange={(e) => setFormData({...formData, averageBirthWeight: e.target.value})}
                    className="w-full px-3 py-2 h-10 border border-gray-200 dark:border-[#8B8D98]/50 rounded-lg bg-gray-50 dark:bg-[#2a2640] text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400 focus:border-[#7800A3] focus:ring-1 focus:ring-[#7800A3] outline-none"
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 dark:text-gray-300 mb-2">
                    {locale === 'th' ? 'เกิดทั้งหมด' : 'Total Born'} *
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.totalBorn}
                    onChange={(e) => {
                      setFormData({...formData, totalBorn: e.target.value});
                      if (fieldErrors.totalBorn) setFieldErrors({ ...fieldErrors, totalBorn: undefined });
                    }}
                    className={`w-full px-3 py-2 h-10 border rounded-lg bg-gray-50 dark:bg-[#2a2640] text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400 focus:ring-1 focus:ring-[#7800A3] outline-none ${
                      fieldErrors.totalBorn 
                        ? 'border-red-500 dark:border-red-500' 
                        : 'border-gray-200 dark:border-[#8B8D98]/50 focus:border-[#7800A3]'
                    }`}
                    placeholder="0"
                  />
                  {fieldErrors.totalBorn && (
                    <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                      <AlertCircle size={14} />
                      {fieldErrors.totalBorn}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm text-gray-600 dark:text-gray-300 mb-2">
                    {locale === 'th' ? 'เกิดมีชีวิต' : 'Born Alive'} *
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.bornAlive}
                    onChange={(e) => {
                      setFormData({...formData, bornAlive: e.target.value});
                      if (fieldErrors.bornAlive) setFieldErrors({ ...fieldErrors, bornAlive: undefined });
                    }}
                    className={`w-full px-3 py-2 h-10 border rounded-lg bg-gray-50 dark:bg-[#2a2640] text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400 focus:ring-1 focus:ring-[#7800A3] outline-none ${
                      fieldErrors.bornAlive 
                        ? 'border-red-500 dark:border-red-500' 
                        : 'border-gray-200 dark:border-[#8B8D98]/50 focus:border-[#7800A3]'
                    }`}
                    placeholder="0"
                  />
                  {fieldErrors.bornAlive && (
                    <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                      <AlertCircle size={14} />
                      {fieldErrors.bornAlive}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm text-gray-600 dark:text-gray-300 mb-2">
                    {locale === 'th' ? 'ตายคลอด' : 'Stillborn'}
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.stillborn}
                    onChange={(e) => setFormData({...formData, stillborn: e.target.value})}
                    className="w-full px-3 py-2 h-10 border border-gray-200 dark:border-[#8B8D98]/50 rounded-lg bg-gray-50 dark:bg-[#2a2640] text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400 focus:border-[#7800A3] focus:ring-1 focus:ring-[#7800A3] outline-none"
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 dark:text-gray-300 mb-2">
                    {locale === 'th' ? 'มัมมี่' : 'Mummified'}
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.mummified}
                    onChange={(e) => setFormData({...formData, mummified: e.target.value})}
                    className="w-full px-3 py-2 h-10 border border-gray-200 dark:border-[#8B8D98]/50 rounded-lg bg-gray-50 dark:bg-[#2a2640] text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400 focus:border-[#7800A3] focus:ring-1 focus:ring-[#7800A3] outline-none"
                    placeholder="0"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm text-gray-600 dark:text-gray-300 mb-2">
                  {locale === 'th' ? 'หมายเหตุ' : 'Notes'}
                </label>
                <textarea
                  rows={3}
                  value={formData.notes}
                  onChange={(e) => setFormData({...formData, notes: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-200 dark:border-[#8B8D98]/50 rounded-lg bg-gray-50 dark:bg-[#2a2640] text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400 focus:border-[#7800A3] focus:ring-1 focus:ring-[#7800A3] outline-none resize-none"
                  placeholder={locale === 'th' ? 'หมายเหตุเพิ่มเติม...' : 'Optional notes...'}
                />
              </div>
              <div className="flex gap-3 pt-4 border-gray-100 dark:border-gray-600 border-t">
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
                  {editingFarrowing ? t('common.save') : t('common.add')}
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
              {locale === 'th' ? 'ยืนยันการลบ' : 'Confirm Delete'}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-gray-600 dark:text-gray-300">
              {locale === 'th' 
                ? `คุณต้องการลบบันทึกคลอดของแม่พันธุ์ "${farrowingToDelete?.sow?.tagNumber}" หรือไม่? ลูกสุกรที่เชื่อมโยงจะถูกลบด้วย` 
                : `Are you sure you want to delete farrowing record for sow "${farrowingToDelete?.sow?.tagNumber}"? Associated piglets will also be deleted.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="cursor-pointer border-gray-400 dark:text-white dark:hover:text-gray-200 hover:border-gray-200 dark:bg-transparent">
              {t('common.cancel')}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => farrowingToDelete && handleDelete(farrowingToDelete.id)}
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
