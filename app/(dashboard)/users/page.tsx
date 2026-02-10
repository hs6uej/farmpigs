'use client';

import { useState, useEffect, useMemo } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useTranslations, useLocale } from 'next-intl';
import { 
  Users, 
  Search, 
  Plus, 
  Edit2, 
  Trash2, 
  Shield, 
  User,
  X,
  Check,
  Download,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Lock,
  Unlock,
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

interface UserData {
  id: string;
  name: string | null;
  email: string;
  role: 'ADMIN' | 'USER';
  createdAt: string;
  failedLoginAttempts?: number;
  lockedAt?: string | null;
  lockedUntil?: string | null;
  lockedReason?: string | null;
  _count?: {
    accounts: number;
  };
}

type SortField = 'name' | 'email' | 'role' | 'oauth' | 'createdAt';
type SortDirection = 'asc' | 'desc';

export default function UsersPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const t = useTranslations('users');
  const locale = useLocale();
  
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState<UserData | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'USER' as 'ADMIN' | 'USER'
  });

  // Delete confirmation state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<UserData | null>(null);

  // Error dialog state
  const [errorDialogOpen, setErrorDialogOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Field validation errors
  const [fieldErrors, setFieldErrors] = useState<{
    email?: string;
    password?: string;
  }>({});

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Sorting state
  const [sortField, setSortField] = useState<SortField | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  // Check if user is admin
  useEffect(() => {
    if (status === 'authenticated' && session?.user?.role !== 'ADMIN') {
      router.push('/dashboard');
    }
  }, [session, status, router]);

  // Fetch users
  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/users');
      if (res.ok) {
        const data = await res.json();
        setUsers(data);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
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
    
    if (!formData.email.trim()) {
      errors.email = locale === 'th' ? 'กรุณากรอกอีเมล' : 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = locale === 'th' ? 'รูปแบบอีเมลไม่ถูกต้อง' : 'Invalid email format';
    }
    if (!editingUser && !formData.password.trim()) {
      errors.password = locale === 'th' ? 'กรุณากรอกรหัสผ่าน' : 'Password is required';
    } else if (!editingUser && formData.password.length < 6) {
      errors.password = locale === 'th' ? 'รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร' : 'Password must be at least 6 characters';
    }
    
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }
    
    try {
      const url = editingUser ? `/api/users/${editingUser.id}` : '/api/users';
      const method = editingUser ? 'PUT' : 'POST';
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (res.ok) {
        fetchUsers();
        closeModal();
      } else {
        const error = await res.json();
        setErrorMessage(error.message || (locale === 'th' ? 'เกิดข้อผิดพลาด' : 'An error occurred'));
        setErrorDialogOpen(true);
      }
    } catch (error) {
      console.error('Error saving user:', error);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/users/${id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchUsers();
      }
    } catch (error) {
      console.error('Error deleting user:', error);
    } finally {
      setDeleteDialogOpen(false);
      setUserToDelete(null);
    }
  };

  const openDeleteDialog = (user: UserData) => {
    setUserToDelete(user);
    setDeleteDialogOpen(true);
  };

  const handleUnlockUser = async (userId: string) => {
    try {
      const res = await fetch(`/api/users/${userId}/unlock`, {
        method: 'POST',
      });
      if (res.ok) {
        fetchUsers();
      } else {
        const error = await res.json();
        alert(error.error || 'เกิดข้อผิดพลาดในการปลดล็อค');
      }
    } catch (error) {
      console.error('Error unlocking user:', error);
      alert('เกิดข้อผิดพลาดในการปลดล็อค');
    }
  };

  const handleRoleChange = async (id: string, newRole: 'ADMIN' | 'USER') => {
    try {
      const res = await fetch(`/api/users/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRole })
      });
      if (res.ok) {
        fetchUsers();
      }
    } catch (error) {
      console.error('Error updating role:', error);
    }
  };

  const openModal = (user?: UserData) => {
    if (user) {
      setEditingUser(user);
      setFormData({
        name: user.name || '',
        email: user.email,
        password: '',
        role: user.role
      });
    } else {
      setEditingUser(null);
      setFormData({ name: '', email: '', password: '', role: 'USER' });
    }
    setFieldErrors({});
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingUser(null);
    setFieldErrors({});
    setFormData({ name: '', email: '', password: '', role: 'USER' });
  };

  const exportToExcel = () => {
    const exportData = users.map(user => ({
      [t('name')]: user.name || '-',
      [t('email')]: user.email,
      [t('role')]: user.role === 'ADMIN' ? t('roleAdmin') : t('roleUser'),
      [t('createdDate')]: new Date(user.createdAt).toLocaleDateString(locale === 'th' ? 'th-TH' : 'en-US'),
      'OAuth': user._count?.accounts ? t('linked') : '-'
    }));
    
    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Users');
    XLSX.writeFile(wb, `users_${new Date().toISOString().split('T')[0]}.xlsx`);
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

  // Filter and sort users
  const filteredAndSortedUsers = useMemo(() => {
    let result = users.filter(user => 
      user.name?.toLowerCase().includes(search.toLowerCase()) ||
      user.email.toLowerCase().includes(search.toLowerCase())
    );

    // Apply sorting
    if (sortField) {
      result = [...result].sort((a, b) => {
        let aValue: string | number;
        let bValue: string | number;

        switch (sortField) {
          case 'name':
            aValue = a.name || '';
            bValue = b.name || '';
            break;
          case 'email':
            aValue = a.email || '';
            bValue = b.email || '';
            break;
          case 'role':
            aValue = a.role || '';
            bValue = b.role || '';
            break;
          case 'oauth':
            aValue = a._count?.accounts || 0;
            bValue = b._count?.accounts || 0;
            break;
          case 'createdAt':
            aValue = new Date(a.createdAt).getTime();
            bValue = new Date(b.createdAt).getTime();
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
  }, [users, search, sortField, sortDirection]);

  // Pagination
  const totalPages = Math.ceil(filteredAndSortedUsers.length / rowsPerPage);
  const paginatedUsers = useMemo(() => {
    const startIndex = (currentPage - 1) * rowsPerPage;
    return filteredAndSortedUsers.slice(startIndex, startIndex + rowsPerPage);
  }, [filteredAndSortedUsers, currentPage, rowsPerPage]);

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

  if (status === 'loading' || loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  if (session?.user?.role !== 'ADMIN') {
    return null;
  }

  return (
    <div className="p-4 sm:p-6 md:p-8">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-gray-100 dark:bg-[#0f0d1a] pt-2 pb-4 -mt-2 -mx-4 sm:-mx-6 md:-mx-8 px-4 sm:px-6 md:px-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4 mb-4 sm:mb-6">
        <div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold flex items-center text-gray-900 dark:text-white gap-2">
            <Users className="text-purple-500 w-5 h-5 sm:w-6 sm:h-6" />
            {t('title')}
          </h1>
          <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 mt-1">
            {t('description')}
          </p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <Button
            variant="outline"
            size="sm"
            onClick={exportToExcel}
            className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 bg-green-600 text-white border-green-600 hover:bg-green-700 hover:text-white cursor-pointer"
          >
            <Download size={16} />
            <span className="hidden sm:inline">{t('export')}</span>
            <span className="sm:hidden">Excel</span>
          </Button>
          <Button
            size="sm"
            onClick={() => openModal()}
            className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 bg-purple-600 text-white hover:text-white hover:bg-purple-700 cursor-pointer"
          >
            <Plus size={16} />
            <span className="hidden sm:inline">{t('addUser')}</span>
            <span className="sm:hidden">เพิ่ม</span>
          </Button>
        </div>
      </div>

      {/* Search */}
      <div className="relative mb-4 sm:mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground dark:text-gray-600" size={18} />
        <input
          type="text"
          placeholder={t('searchPlaceholder')}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full h-10 pl-10 pr-4 py-2 text-sm text-gray-900 dark:text-white border border-[#8B8D98]/20 rounded-lg bg-white dark:bg-[#1f1d2e] placeholder:text-gray-400 dark:placeholder:text-gray-500 outline-none focus:border-[#7800A3] focus:ring-0 focus:ring-[#7800A3] transition-colors"
        />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 sm:gap-6 mb-4 sm:mb-8">
        <Card className="bg-white dark:bg-[#1f1d2e]">
          <CardContent className="pt-4 sm:pt-6 pb-4">
            <div className="flex flex-col sm:flex-row items-center sm:items-center gap-2 sm:gap-3">
              <div className="p-1.5 sm:p-2 bg-purple-100 dark:bg-purple-900/50 rounded-lg">
                <Users className="text-purple-600 dark:text-purple-400 w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <div className="text-center sm:text-left">
                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 mb-0.5 sm:mb-2">{t('totalUsers')}</p>
                <p className="text-xl sm:text-2xl md:text-3xl font-bold text-purple-600">{users.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white dark:bg-[#1f1d2e]">
          <CardContent className="pt-4 sm:pt-6 pb-4">
            <div className="flex flex-col sm:flex-row items-center sm:items-center gap-2 sm:gap-3">
              <div className="p-1.5 sm:p-2 bg-red-100 dark:bg-red-900/50 rounded-lg">
                <Shield className="text-red-600 dark:text-red-400 w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <div className="text-center sm:text-left">
                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 mb-0.5 sm:mb-2">{t('admins')}</p>
                <p className="text-xl sm:text-2xl md:text-3xl font-bold text-red-600">{users.filter(u => u.role === 'ADMIN').length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white dark:bg-[#1f1d2e]">
          <CardContent className="pt-4 sm:pt-6 pb-4">
            <div className="flex flex-col sm:flex-row items-center sm:items-center gap-2 sm:gap-3">
              <div className="p-1.5 sm:p-2 bg-blue-100 dark:bg-blue-900/50 rounded-lg">
                <User className="text-blue-600 dark:text-blue-400 w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <div className="text-center sm:text-left">
                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 mb-0.5 sm:mb-2">{t('regularUsers')}</p>
                <p className="text-xl sm:text-2xl md:text-3xl font-bold text-blue-600">{users.filter(u => u.role === 'USER').length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Users Table */}
      <Card className="bg-white dark:bg-[#1f1d2e] overflow-hidden">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-b border-gray-100 dark:border-gray-600 bg-gray-50 dark:bg-[#2a2640] hover:bg-gray-50 dark:hover:bg-[#2a2640]">
                <TableHead 
                  className="px-2 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-300 uppercase first:rounded-tl-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-[#3a3650]"
                  onClick={() => handleSort('name')}
                >
                  <div className="flex items-center">
                    <span className="sm:hidden">User</span>
                    <span className="hidden sm:inline">{t('user')}</span>
                    {getSortIcon('name')}
                  </div>
                </TableHead>
                <TableHead 
                  className="px-2 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-300 uppercase cursor-pointer hover:bg-gray-100 dark:hover:bg-[#3a3650]"
                  onClick={() => handleSort('role')}
                >
                  <div className="flex items-center">
                    {t('role')}
                    {getSortIcon('role')}
                  </div>
                </TableHead>
                <TableHead 
                  className="hidden md:table-cell px-2 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-300 uppercase cursor-pointer hover:bg-gray-100 dark:hover:bg-[#3a3650]"
                  onClick={() => handleSort('oauth')}
                >
                  <div className="flex items-center">
                    {t('oauth')}
                    {getSortIcon('oauth')}
                  </div>
                </TableHead>
                <TableHead 
                  className="hidden sm:table-cell px-2 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-300 uppercase cursor-pointer hover:bg-gray-100 dark:hover:bg-[#3a3650]"
                  onClick={() => handleSort('createdAt')}
                >
                  <div className="flex items-center">
                    <span className="hidden lg:inline">{t('createdDate')}</span>
                    <span className="lg:hidden">Date</span>
                    {getSortIcon('createdAt')}
                  </div>
                </TableHead>
                <TableHead className="hidden md:table-cell px-2 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-300 uppercase">
                  {locale === 'th' ? 'สถานะ' : 'Status'}
                </TableHead>
                <TableHead className="px-2 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-300 uppercase text-right last:rounded-tr-lg">
                  <span className="hidden sm:inline">{t('manage')}</span>
                  <span className="sm:hidden">Actions</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedUsers.map((user) => (
                <TableRow key={user.id} className="px-8 border-b border-gray-100 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-[#7800A3]/10">
                  <TableCell className="px-2 sm:px-4 py-2 sm:py-3">
                    <div className="flex items-center gap-2 sm:gap-3">
                      <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-purple-100 dark:bg-purple-900/50 flex items-center justify-center flex-shrink-0">
                        <span className="text-xs sm:text-sm text-purple-600 dark:text-purple-400 font-medium">
                          {(user.name || user.email)[0].toUpperCase()}
                        </span>
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs sm:text-sm font-semibold text-gray-900 dark:text-white truncate">{user.name || '-'}</p>
                        <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 truncate max-w-[100px] sm:max-w-none">{user.email}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="px-2 sm:px-4 py-2 sm:py-3">
                    <Select
                      value={user.role}
                      onValueChange={(value: 'ADMIN' | 'USER') => handleRoleChange(user.id, value)}
                      disabled={user.id === session?.user?.id}
                    >
                      <SelectTrigger 
                        className={`w-20 sm:w-34 px-2 sm:px-3 py-1 h-auto rounded-full text-xs sm:text-sm font-medium border-0 ${
                          user.role === 'ADMIN'
                            ? 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-200'
                            : 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-200'
                        } ${user.id === session?.user?.id ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                      >
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="z-[300] bg-white dark:bg-[#2a2640] border border-gray-200 dark:border-[#8B8D98]/20">
                        <SelectItem value="ADMIN" className="cursor-pointer dark:text-gray-200 dark:hover:text-white dark:data-[state=checked]:text-gray-200">
                          {t('roleAdmin')}
                        </SelectItem>
                        <SelectItem value="USER" className="cursor-pointer dark:text-gray-200 dark:hover:text-white dark:data-[state=checked]:text-gray-200">
                          {t('roleUser')}
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell className='hidden md:table-cell px-2 sm:px-4 py-2 sm:py-3'>
                    {user._count?.accounts ? (
                      <span className="inline-flex items-center gap-1 text-xs sm:text-sm text-green-600 dark:text-green-400">
                        <Check size={14} /> <span className="hidden lg:inline">{t('linked')}</span>
                      </span>
                    ) : (
                      <span className="text-gray-500 dark:text-gray-400">-</span>
                    )}
                  </TableCell>
                  <TableCell className="hidden sm:table-cell px-2 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                    {new Date(user.createdAt).toLocaleDateString(locale === 'th' ? 'th-TH' : 'en-US')}
                  </TableCell>
                  <TableCell className="hidden md:table-cell px-2 sm:px-4 py-2 sm:py-3">
                    {user.lockedAt ? (
                      <div className="flex items-center gap-2">
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-200">
                          <Lock size={12} />
                          {locale === 'th' ? 'ถูกล็อค' : 'Locked'}
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleUnlockUser(user.id)}
                          className="h-6 px-2 text-xs cursor-pointer text-green-600 hover:text-green-700 hover:bg-green-50 dark:hover:bg-green-900/20"
                          title={locale === 'th' ? 'ปลดล็อค' : 'Unlock'}
                        >
                          <Unlock size={14} />
                        </Button>
                      </div>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-200">
                        <Check size={12} />
                        {locale === 'th' ? 'ปกติ' : 'Active'}
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="px-2 sm:px-4 py-2 sm:py-3 text-right">
                    <div className="flex items-center justify-end gap-0.5 sm:gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openModal(user)}
                        className="h-7 w-7 sm:h-8 sm:w-8 cursor-pointer text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                      >
                        <Edit2 size={16} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openDeleteDialog(user)}
                        disabled={user.id === session?.user?.id}
                        className={`h-7 w-7 sm:h-8 sm:w-8 cursor-pointer text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 ${
                          user.id === session?.user?.id ? 'opacity-50 cursor-not-allowed' : ''
                        }`}
                      >
                        <Trash2 size={16} />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          </div>

          {filteredAndSortedUsers.length === 0 && (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
              {t('noUsers')}
            </div>
          )}

          {/* Pagination Controls */}
          {filteredAndSortedUsers.length > 0 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-2 sm:gap-4 px-2 sm:px-4 py-3 sm:py-4 border-t border-gray-200 dark:border-[#8B8D98]/20">
              <div className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm text-gray-600 dark:text-gray-300">
                <span className="hidden sm:inline">{t('showing')}</span>
                <span className="font-medium text-gray-900 dark:text-white">
                  {((currentPage - 1) * rowsPerPage) + 1}-{Math.min(currentPage * rowsPerPage, filteredAndSortedUsers.length)}
                </span>
                <span>{t('of')}</span>
                <span className="font-medium text-gray-900 dark:text-white">{filteredAndSortedUsers.length}</span>
                <span className="hidden sm:inline">{t('users')}</span>
              </div>
              
              <div className="flex items-center gap-2 sm:gap-4">
                <div className="flex items-center gap-1 sm:gap-2">
                  <span className="hidden sm:inline text-sm text-gray-600 dark:text-gray-300">{t('rowsPerPage')}</span>
                  <Select
                    value={String(rowsPerPage)}
                    onValueChange={(value) => {
                      setRowsPerPage(Number(value));
                      setCurrentPage(1);
                    }}
                  >
                    <SelectTrigger className="w-14 sm:w-17.5 h-7 sm:h-8 px-2 py-1 text-xs sm:text-sm border border-gray-200 dark:border-[#8B8D98]/20 rounded-md bg-white dark:bg-[#1f1d2e] text-gray-900 dark:text-white focus:border-[#7800A3]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="z-[300] bg-white  dark:bg-[#2a2640] border border-gray-200 dark:border-[#8B8D98]/20">
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
                    className="h-7 w-7 sm:h-8 sm:w-8 cursor-pointer dark:text-gray-200 border-gray-200 dark:border-[#8B8D98]/20 dark:focus:border-[#7800A3]"
                  >
                    <ChevronLeft size={14} />
                  </Button>
                  
                  <div className="flex items-center gap-0.5 sm:gap-1 px-1 sm:px-2">
                    <span className="hidden sm:inline text-sm text-gray-600 dark:text-gray-300">{t('page')}</span>
                    <span className="text-xs sm:text-sm font-medium text-gray-900 dark:text-white">{currentPage}</span>
                    <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-300">/</span>
                    <span className="text-xs sm:text-sm font-medium text-gray-900 dark:text-white">{totalPages}</span>
                  </div>
                  
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="h-7 w-7 sm:h-8 sm:w-8 cursor-pointer dark:text-gray-200 border-gray-200 dark:border-[#8B8D98]/20 dark:focus:border-[#7800A3]"
                  >
                    <ChevronRight size={14} />
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
          <div className="bg-white dark:bg-[#1f1d2e] border border-gray-200 dark:border-[#8B8D98]/20 rounded-xl shadow-xl w-full max-w-md p-4 sm:p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4 sm:mb-6">
              <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">
                {editingUser ? t('editUser') : t('addNewUser')}
              </h2>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8 dark:hover:text-gray-200 cursor-pointer rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:text-gray-300  dark:hover:bg-[#2a2640] transition-colors" 
                onClick={closeModal}
              >
                <X size={18} />
              </Button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-200 mb-1.5 sm:mb-2">{t('name')}</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="h-10 w-full px-3 sm:px-4 py-2.5 sm:py-3 text-sm bg-gray-50 dark:bg-[#2a2640] border border-gray-300 dark:border-[#8B8D98]/20 rounded-lg text-gray-900 dark:text-white placeholder:text-gray-400 focus:ring-0 focus:border-[#7800A3] focus:ring-[#7800A3] focus:outline-none transition-all"
                  placeholder={t('namePlaceholder')}
                />
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-200 mb-1.5 sm:mb-2">{t('email')} *</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => {
                    setFormData({ ...formData, email: e.target.value });
                    if (fieldErrors.email) setFieldErrors({ ...fieldErrors, email: undefined });
                  }}
                  className={`h-10 w-full px-3 sm:px-4 py-2.5 sm:py-3 text-sm bg-gray-50 dark:bg-[#2a2640] border rounded-lg text-gray-900 dark:text-white placeholder:text-gray-400 focus:ring-0 focus:ring-[#7800A3] focus:outline-none transition-colors ${
                    fieldErrors.email 
                      ? 'border-red-500 dark:border-red-500' 
                      : 'border-gray-300 dark:border-[#8B8D98]/20 focus:border-[#7800A3]'
                  }`}
                  placeholder={t('emailPlaceholder')}
                />
                {fieldErrors.email && (
                  <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                    <AlertCircle size={14} />
                    {fieldErrors.email}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-200 mb-1.5 sm:mb-2">
                  {t('password')} {editingUser ? t('passwordHint') : '*'}
                </label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => {
                    setFormData({ ...formData, password: e.target.value });
                    if (fieldErrors.password) setFieldErrors({ ...fieldErrors, password: undefined });
                  }}
                  className={`h-10 w-full px-3 sm:px-4 py-2.5 sm:py-3 text-sm bg-gray-50 dark:bg-[#2a2640] border rounded-lg text-gray-900 dark:text-white placeholder:text-gray-400 focus:ring-0 focus:ring-[#7800A3] focus:outline-none transition-all ${
                    fieldErrors.password 
                      ? 'border-red-500 dark:border-red-500' 
                      : 'border-gray-300 dark:border-[#8B8D98]/20 focus:border-[#7800A3]'
                  }`}
                  placeholder="••••••••"
                />
                {fieldErrors.password && (
                  <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                    <AlertCircle size={14} />
                    {fieldErrors.password}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-200 mb-1.5 sm:mb-2">{t('role')}</label>
                <Select
                  value={formData.role}
                  onValueChange={(value: 'ADMIN' | 'USER') => setFormData({ ...formData, role: value })}
                >
                  <SelectTrigger className="w-full h-10 px-3 sm:px-4 py-2.5 sm:py-3 text-sm bg-gray-50 dark:bg-[#2a2640] border border-gray-300 dark:border-[#8B8D98]/20 rounded-lg text-gray-900 dark:text-white focus:ring-0 focus:border-[#7800A3] focus:ring-[#7800A3] transition-all">
                    <SelectValue placeholder={t('role')} />
                  </SelectTrigger>
                  <SelectContent className="z-300 bg-white dark:bg-[#2a2640] border border-gray-200 dark:border-[#8B8D98]/20 rounded-lg">
                    <SelectItem value="USER" className="cursor-pointer hover:bg-gray-100 dark:hover:bg-[#3a3650] dark:text-white rounded-lg">
                      {t('roleUser')}
                    </SelectItem>
                    <SelectItem value="ADMIN" className="cursor-pointer hover:bg-gray-100 dark:hover:bg-[#3a3650] dark:text-white rounded-lg">
                      {t('roleAdmin')}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex gap-2 sm:gap-3 pt-3 sm:pt-4 border-t border-gray-200 dark:border-[#8B8D98]/20">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowModal(false)}
                  className="flex-1 text-sm cursor-pointer bg-white hover:bg-gray-50 hover:text-gray-100 dark:bg-transparent dark:hover:bg-[#2a2640] border-gray-300 dark:border-[#8B8D98]/20 text-gray-700 dark:text-gray-400 rounded-lg"
                >
                  {t('cancel')}
                </Button>
                <Button
                  type="submit"
                  className="flex-1 text-sm bg-purple-600 hover:bg-purple-700 text-white cursor-pointer rounded-lg"
                >
                  {editingUser ? t('update') : t('addUser')}
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
            className="absolute right-4 top-4 cursor-pointer rounded-lg text-gray-500 hover:text-gray-100 hover:bg-gray-100 dark:text-gray-300 dark:hover:text-white dark:hover:bg-[#2a2640] transition-colorstransition-colors"
            onClick={() => setDeleteDialogOpen(false)}
          >
            <X size={18} />
          </Button>
          
          <AlertDialogHeader>
            <AlertDialogTitle className="text-gray-900 dark:text-white">
              {t('deleteConfirm')}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-gray-600 dark:text-gray-300">
              {userToDelete?.name || userToDelete?.email}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="cursor-pointer border-gray-400 dark:text-white dark:hover:text-gray-200 hover:border-gray-200 dark:bg-transparent">
              {t('cancel')}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => userToDelete && handleDelete(userToDelete.id)}
              className="bg-red-600 hover:bg-red-700 text-white cursor-pointer"
            >
              {t('delete') || 'Delete'}
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
            className="absolute right-4 top-4 cursor-pointer rounded-lg text-gray-500 hover:text-gray-100 hover:bg-gray-100 dark:text-gray-300 dark:hover:text-white dark:hover:bg-[#2a2640] transition-colors"
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
