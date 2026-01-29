import { useState, useEffect, useCallback } from 'react';
import { Search, Plus, Edit2, Trash2, X, Check, RefreshCw, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Filter } from 'lucide-react';
import { toast } from "sonner";
import { formatDateToMinute } from '@/lib/utils'
import { getMyUrl } from '../utils';

interface AdminUser {
    adminUserCD: number;
    loginID?: string;
    loginType?: number;
    adminUserName?: string;
    adminUserKana?: string;
    adminUserNaisen?: string;
    adminUserMail?: string;
    estName?: string;
    kaSoshikiName?: string;
    adminUserKengen?: string;
    lastAccess?: string;
    createDate?: string;
    delFlg?: number;
}

interface PagedResult {
    items: AdminUser[];
    totalCount: number;
    pageNumber: number;
    pageSize: number;
    totalPages: number;
    hasPrevious: boolean;
    hasNext: boolean;
}

interface LoginTypeOption {
    value: number;
    displayName: string;
}

interface KengenOption {
    value: string;
    displayName: string;
}


interface FilterOptions {
    searchTerm: string;
    loginTypeFilter: string;
    adminUserKengenFilter: string;
    sortColumn: string;
    sortDirection: 'ASC' | 'DESC';
}

const PAGE_SIZE_OPTIONS = [5, 10, 20, 50];

export function AdminUserManagement() {
    const [pagedResult, setPagedResult] = useState<PagedResult>({
        items: [],
        totalCount: 0,
        pageNumber: 1,
        pageSize: 10,
        totalPages: 0,
        hasPrevious: false,
        hasNext: false
    });

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [filters, setFilters] = useState<FilterOptions>({
        searchTerm: '',
        loginTypeFilter: '',
        adminUserKengenFilter: '',
        sortColumn: 'AdminUserCD',
        sortDirection: 'ASC'
    });

    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);

    const [editingUser, setEditingUser] = useState<AdminUser | null>(null);
    const [deleteUser, setDeleteUser] = useState<AdminUser | null>(null);

    const [showFilters, setShowFilters] = useState(false);

    const [formData, setFormData] = useState({
        loginID: '',
        //password: '',
        adminUserName: '',
        adminUserKana: '',
        loginType: 1,
        adminUserNaisen: '',
        adminUserMail: '',
        estName: '',
        kaSoshikiName: '',
        adminUserKengen: '1523'
    });

    const loginTypeOptions: LoginTypeOption[] = [
        { value: 1, displayName: 'API' },
        { value: 2, displayName: 'Microsoft' }
    ];

    const fetchUsers = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);

            const params = new URLSearchParams({
                page: pagedResult.pageNumber.toString(),
                pageSize: pagedResult.pageSize.toString()
            });

            if (filters.searchTerm) {
                params.append('search', filters.searchTerm);
            }

            if (filters.loginTypeFilter !== '') {
                params.append('loginType', filters.loginTypeFilter);
            }

            if (filters.adminUserKengenFilter) {
                params.append('adminUserKengen', filters.adminUserKengenFilter);
            }

            if (filters.sortColumn && filters.sortDirection) {
                params.append('sortColumn', filters.sortColumn);
                params.append('sortDirection', filters.sortDirection);
            }

            const response = await fetch(getMyUrl(`/api/admin-user?${params}`), {
                method: 'GET',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                },
                credentials: 'include'
            });

            if (!response.ok) {
                if (response.status === 401) {
                    throw new Error('Unauthorized - Please login again');
                }
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();

            setPagedResult({
                items: data.items || [],
                totalCount: data.totalCount || 0,
                pageNumber: data.pageNumber || 1,
                pageSize: data.pageSize || 10,
                totalPages: data.totalPages || 0,
                hasPrevious: data.hasPrevious || false,
                hasNext: data.hasNext || false
            });

        } catch (err) {
            console.error('Error fetching users:', err);
            setError(err instanceof Error ? err.message : 'Failed to load users. Please try again later.');
        } finally {
            setLoading(false);
        }
    }, [pagedResult.pageNumber, pagedResult.pageSize, filters]);

    useEffect(() => {
        fetchUsers();
    }, [pagedResult.pageNumber, pagedResult.pageSize, filters]);

    useEffect(() => {
        const timer = setTimeout(() => {
            setPagedResult(prev => ({ ...prev, pageNumber: 1 }));
        }, 500);

        return () => clearTimeout(timer);
    }, [filters.searchTerm]);

    const handleFilterChange = (newFilters: Partial<FilterOptions>) => {
        setFilters(prev => ({ ...prev, ...newFilters }));
        setPagedResult(prev => ({ ...prev, pageNumber: 1 }));
    };

    const handlePageChange = (page: number) => {
        setPagedResult(prev => ({ ...prev, pageNumber: page }));
    };

    const handlePageSizeChange = (size: number) => {
        setPagedResult(prev => ({ ...prev, pageSize: size, pageNumber: 1 }));
    };

    const handleSort = (column: string) => {
        setFilters(prev => ({
            ...prev,
            sortColumn: column,
            sortDirection: prev.sortColumn === column && prev.sortDirection === 'ASC' ? 'DESC' : 'ASC'
        }));
    };

    const getSortIcon = (column: string) => {

        if (filters.sortColumn !== column) return <span className="ml-1 text-gray-300">↕</span>;
        return filters.sortDirection === 'ASC' ? '↑' : '↓';
    };

    const handleEdit = (user: AdminUser) => {
        setEditingUser(user);
        setFormData({
            loginID: user.loginID || '',
            //password: '',
            adminUserName: user.adminUserName || '',
            adminUserKana: user.adminUserKana || '',
            loginType: user.loginType || 1,
            adminUserNaisen: user.adminUserNaisen || '',
            adminUserMail: user.adminUserMail || '',
            estName: user.estName || '',
            kaSoshikiName: user.kaSoshikiName || '',
            adminUserKengen: user.adminUserKengen || '1523'
        });
        setShowEditModal(true);
    };

    const handleDeleteClick = (user: AdminUser) => {
        setDeleteUser(user);
        setShowDeleteModal(true);
    };

    const handleSaveEdit = async () => {
        if (!editingUser) return;
        if (!formData.adminUserName.trim()) {
            toast.info('Admin Name is required', {
                position: 'top-center'
            });
            return;
        }
        try {
            const response = await fetch(getMyUrl(`/api/admin-user/${editingUser.adminUserCD}`), {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    adminUserName: formData.adminUserName,
                    adminUserKana: formData.adminUserKana,
                    loginType: formData.loginType,
                    adminUserKengen: formData.adminUserKengen,
                    adminUserNaisen: formData.adminUserNaisen,
                    adminUserMail: formData.adminUserMail,
                    estName: formData.estName,
                    kaSoshikiName: formData.kaSoshikiName
                }),
            });

            if (response.ok) {
                await fetchUsers();
                setShowEditModal(false);
                setEditingUser(null);
                resetForm();
                toast.success('Admin account updated successfully', {
                    style: {
                        '--normal-bg':
                            'color-mix(in oklab, light-dark(var(--color-green-600), var(--color-green-400)) 10%, var(--background))',
                        '--normal-text': 'light-dark(var(--color-green-600), var(--color-green-400))',
                        '--normal-border': 'light-dark(var(--color-green-600), var(--color-green-400))'
                    } as React.CSSProperties,
                    position: 'top-center'
                });
            } else {
                const error = await response.json();
                throw new Error(error.message || 'Failed to update user');
            }
        } catch (err) {
            console.error('Error updating user:', err);
            toast.error(err instanceof Error ? err.message : 'Failed to update user. Please try again.', {
                position: 'top-center'
            });
        }
    };

    const [forcePageChange, setForcePageChange] = useState(false);

    useEffect(() => {
        if (forcePageChange && pagedResult.items.length === 0 && pagedResult.pageNumber > 1 && !loading) {
            setPagedResult(prev => ({
                ...prev,
                pageNumber: prev.pageNumber - 1
            }));
            setForcePageChange(false);
        }
    }, [pagedResult.items.length, pagedResult.pageNumber, loading, forcePageChange]);

    const handleConfirmDelete = async () => {
        if (!deleteUser) return;

        try {
            const response = await fetch(getMyUrl(`/api/admin-user/${deleteUser.adminUserCD}`), {
                method: 'DELETE',
            });

            if (response.ok) {
                setForcePageChange(true);

                await fetchUsers();

                setShowDeleteModal(false);
                setDeleteUser(null);

                toast.success('Admin account deleted successfully!', {
                    style: {
                        '--normal-bg':
                            'color-mix(in oklab, light-dark(var(--color-green-600), var(--color-green-400)) 10%, var(--background))',
                        '--normal-text': 'light-dark(var(--color-green-600), var(--color-green-400))',
                        '--normal-border': 'light-dark(var(--color-green-600), var(--color-green-400))'
                    } as React.CSSProperties,
                    position: 'top-center'
                });

            } else {
                const error = await response.json();
                throw new Error(error.message || 'Failed to delete user');
            }
        } catch (err) {
            console.error('Error deleting user:', err);
            toast.error(err instanceof Error ? err.message : 'Failed to delete user. Please try again.', {
                position: 'top-center'
            });
        }
    };

    const handleCreate = async () => {
        if (!formData.loginID.trim()) {
            toast.info('LoginID(email) is required!', {
                position: 'top-center'
            });
            return;
        }

        if (formData.loginType === 2) {
            //if (!formData.adminUserMail?.trim()) {
            //    toast.info('Email is required for Microsoft login type', {
            //        position: 'top-center'
            //    });
            //    return;
            //}

            if (!formData.loginID?.trim()) {
                toast.info('LoginID(email) is required for Microsoft login type', {
                    position: 'top-center'
                });
                return;
            }

            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(formData.loginID)) {
                toast.info('Please enter a valid loginID(email address) with microsoft account', {
                    position: 'top-center'
                });
                return;
            }
        }

        if (!formData.adminUserName.trim()) {
            toast.info('Admin Name is required', {
                position: 'top-center'
            });
            return;
        }

        //if (formData.loginType === 1) {
        //    if (!formData.password.trim()) {
        //        alert('Password is required for API login type');
        //        return;
        //    }
        //}

        try {
            const response = await fetch(getMyUrl('/api/admin-user'), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    loginID: formData.loginID,
                    //password: formData.password,
                    adminUserName: formData.adminUserName,
                    adminUserKana: formData.adminUserKana,
                    loginType: formData.loginType,
                    adminUserKengen: formData.adminUserKengen,
                    adminUserNaisen: formData.adminUserNaisen,
                    adminUserMail: formData.adminUserMail,
                    estName: formData.estName,
                    kaSoshikiName: formData.kaSoshikiName
                }),
            });

            if (response.ok) {
                await fetchUsers();
                setShowCreateModal(false);
                resetForm();
                toast.success('Admin created successfully', {
                    style: {
                        '--normal-bg':
                            'color-mix(in oklab, light-dark(var(--color-green-600), var(--color-green-400)) 10%, var(--background))',
                        '--normal-text': 'light-dark(var(--color-green-600), var(--color-green-400))',
                        '--normal-border': 'light-dark(var(--color-green-600), var(--color-green-400))'
                    } as React.CSSProperties,
                    position: 'top-center'
                });
            } else {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to create user');
            }
        } catch (err) {
            console.error('Error creating user:', err);
            toast.error(err instanceof Error ? err.message : 'Failed to create admin. Please try again.', {
                position: 'top-center'
            });
        }
    };

    const formatLoginType = (type?: number) => {
        switch (type) {
            case 0: return 'Local';
            case 1: return 'API';
            case 2: return 'Microsoft';
            default: return 'Unknown';
        }
    };

    const kengenOptions: KengenOption[] = [
        { value: '1523', displayName: 'GOD' },
        { value: '1111', displayName: '登録管理' },
        { value: '0111', displayName: 'スーパーユーザ' },
        { value: '0011', displayName: 'BU長' },
        { value: '0001', displayName: '担当' },
        { value: '0000', displayName: 'ログイン出来ない人' }
    ];

    const formatKengen = (kengenCode?: string) => {
        if (!kengenCode) return 'N/A';
        const option = kengenOptions.find(opt => opt.value === kengenCode);
        return option ? option.displayName : kengenCode;
    };

    const resetForm = () => {
        setFormData({
            loginID: '',
            //password: '',
            adminUserName: '',
            adminUserKana: '',
            loginType: 1,
            adminUserNaisen: '',
            adminUserMail: '',
            estName: '',
            kaSoshikiName: '',
            adminUserKengen: '1523'
        });
    };

    const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            setPagedResult(prev => ({ ...prev, pageNumber: 1 }));
            fetchUsers();
        }
    };

    if (error) {
        return (
            <div className="p-6">
                <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-lg">
                    <p className="font-semibold text-lg mb-2">Error Loading Users</p>
                    <p className="mb-4">{error}</p>
                    <div className="flex gap-3">
                        <button
                            onClick={fetchUsers}
                            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2"
                        >
                            <RefreshCw className="w-4 h-4" />
                            Retry
                        </button>
                        <button
                            onClick={() => setError(null)}
                            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                            Dismiss
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="bg-white rounded-lg border border-gray-200 p-4 md:p-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Admin User Management</h1>
                        <p className="text-gray-600">Manage system admins and permissions</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        <button
                            onClick={fetchUsers}
                            disabled={loading}
                            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50 transition-colors flex items-center gap-2"
                        >
                            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                            Refresh
                        </button>
                        <button
                            onClick={() => {
                                resetForm();
                                setShowCreateModal(true);
                            }}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                        >
                            <Plus className="w-4 h-4" />
                            Create New
                        </button>
                    </div>
                </div>

                {/* Filter Section */}
                <div className="flex flex-col lg:flex-row gap-4 pt-4">
                    {/* Search */}
                    <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search by name, ID, email..."
                            value={filters.searchTerm}
                            onChange={(e) => handleFilterChange({ searchTerm: e.target.value })}
                            onKeyDown={handleKeyPress}
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    {/* Filter Toggle Button */}
                    <button
                        onClick={() => setShowFilters(!showFilters)}
                        className="flex items-center gap-2 px-2 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                        <Filter className="w-5 h-5" />
                        Filters
                        {showFilters ? '↑' : '↓'}
                    </button>
                </div>

                {/* Filters */}
                {showFilters && (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                        <div className="flex flex-wrap items-end gap-3">
                            {/* Login Type Filter */}
                            <div className="w-32">
                                <label className="block text-md font-medium text-gray-700 mb-1 truncate">Login Type</label>
                                <select
                                    value={filters.loginTypeFilter}
                                    onChange={(e) => handleFilterChange({ loginTypeFilter: e.target.value })}
                                    className="px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 cursor-pointer w-30 h-[38px]"
                                >
                                    <option value="">All Types</option>
                                    {loginTypeOptions.map(option => (
                                        <option key={option.value} value={option.value}>
                                            {option.displayName}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Kengen Filter */}
                            <div className="w-32">
                                <label className="block text-md font-medium text-gray-700 mb-1 truncate">Kengen</label>
                                <select
                                    value={filters.adminUserKengenFilter}
                                    onChange={(e) => handleFilterChange({ adminUserKengenFilter: e.target.value })}
                                    className="w-30 px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 cursor-pointer h-[38px]"
                                >
                                    <option value="">All Kengen</option>
                                    {kengenOptions.map(option => (
                                        <option key={option.value} value={option.value}>
                                            {option.displayName}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Clear Button */}
                            <div className="ml-auto">
                                <button
                                    onClick={() => {
                                        setFilters({
                                            searchTerm: '',
                                            loginTypeFilter: '',
                                            adminUserKengenFilter: '',
                                            sortColumn: 'AdminUserCD',
                                            sortDirection: 'ASC'
                                        });
                                        setPagedResult(prev => ({ ...prev, pageNumber: 1 }));
                                    }}
                                    className="px-4 py-1.5 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors whitespace-nowrap text-md font-medium"
                                >
                                    Clear
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Admins Table */}
            <div className="relative bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
                {loading ? (
                    <div className="p-12 text-center">
                        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                        <p className="mt-2 text-gray-600">Loading admins...</p>
                    </div>
                ) : (
                    <>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50 border-b border-gray-200">
                                    <tr>
                                        <th
                                            className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                                            onClick={() => handleSort('AdminUserCD')}
                                        >
                                            <div className="flex items-center gap-1 text-center">
                                                Admin CD {getSortIcon('AdminUserCD')}
                                            </div>
                                        </th>
                                        <th
                                            className="ps-9 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                                            onClick={() => handleSort('AdminUserName')}
                                        >
                                            <div className="flex items-center gap-1">
                                                Admin Name {getSortIcon('AdminUserName')}
                                            </div>
                                        </th>
                                        <th
                                            className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                                            onClick={() => handleSort('LoginID')}
                                        >
                                            <div className="flex items-center gap-1">
                                                Login ID {getSortIcon('LoginID')}
                                            </div>
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Email
                                        </th>
                                        <th className="ps-9 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider text-center">
                                            Type
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Kengen
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Est Name
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            KaSoshiki
                                        </th>
                                        <th
                                            className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                                            onClick={() => handleSort('LastAccess')}
                                        >
                                            <div className="flex items-center gap-1">
                                                Last Access {getSortIcon('LastAccess')}
                                            </div>
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Actions
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {pagedResult.items.map((user) => (
                                        <tr key={user.adminUserCD} className="hover:bg-gray-50 transition-colors">
                                            <td className="ps-10 py-3 text-sm font-medium text-gray-900 ">
                                                {user.adminUserCD}
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-semibold">
                                                        {user.adminUserName?.charAt(0) || user.loginID?.charAt(0) || 'U'}
                                                    </div>
                                                    <div>
                                                        <div className="text-sm font-medium text-gray-900">
                                                            {user.adminUserName || 'N/A'}
                                                        </div>
                                                        {user.adminUserKana && (
                                                            <div className="text-xs text-gray-500">{user.adminUserKana}</div>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 text-sm text-gray-700">
                                                {user.loginID || 'N/A'}
                                            </td>
                                            <td className="px-4 py-3 text-sm text-gray-700">
                                                {user.adminUserMail || 'N/A'}
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                <span className={`px-2 py-1 text-xs font-medium rounded-full ${user.loginType === 2
                                                    ? 'bg-purple-100 text-purple-800'
                                                    : 'bg-blue-100 text-blue-700'
                                                    }`}>
                                                    {formatLoginType(user.loginType)}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-sm text-gray-700">
                                                {formatKengen(user.adminUserKengen)}
                                            </td>
                                            <td className="px-4 py-3 text-sm text-gray-700">
                                                {user.estName || 'N/A'}
                                            </td>
                                            <td className="px-4 py-3 text-sm text-gray-700">
                                                {user.kaSoshikiName || 'N/A'}
                                            </td>
                                            <td className="px-4 py-3 text-sm text-gray-700">
                                                {user.lastAccess === null ? 'Never' : formatDateToMinute(user.lastAccess)}
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-2">
                                                    <button
                                                        onClick={() => handleEdit(user)}
                                                        className="p-2 hover:bg-blue-50 rounded-lg transition-colors text-blue-600 hover:text-blue-700"
                                                        title="Edit user"
                                                    >
                                                        <Edit2 className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteClick(user)}
                                                        className="p-2 hover:bg-red-50 rounded-lg transition-colors text-red-600 hover:text-red-700"
                                                        title="Delete user"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Loading overlay */}
                        {(
                            !loading && pagedResult.items.length === 0 && (
                                <div className="p-6 text-center">
                                    <div className="p-6 text-center text-gray-500">
                                        No admins found matching your search criteria
                                    </div>
                                    <p className="text-gray-500">
                                        {filters.searchTerm || filters.loginTypeFilter || filters.adminUserKengenFilter
                                            ? 'Try adjusting your filters'
                                            : 'No admin users have been created yet'}
                                    </p>
                                </div>
                            )
                        )}
                    </>
                )}

                {/* Pagination */}
                {pagedResult.totalPages > 0 && (
                    <div className="flex flex-col md:flex-row items-center justify-between px-4 py-3 border-t border-gray-200 bg-white rounded-lg border">
                        <div className="flex items-center gap-4 mb-4 md:mb-0">
                            <div className="text-sm text-gray-700">
                                Showing{' '}
                                <span className="font-medium">{(pagedResult.pageNumber - 1) * pagedResult.pageSize + 1}</span>{' '}
                                to{' '}
                                <span className="font-medium">
                                    {Math.min(pagedResult.pageNumber * pagedResult.pageSize, pagedResult.totalCount)}
                                </span>{' '}
                                of <span className="font-medium">{pagedResult.totalCount}</span> results
                            </div>
                            <select
                                value={pagedResult.pageSize}
                                onChange={(e) => handlePageSizeChange(Number(e.target.value))}
                                className="px-3 py-1 border border-gray-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                {PAGE_SIZE_OPTIONS.map(size => (
                                    <option key={size} value={size}>
                                        {size} per page
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => handlePageChange(1)}
                                disabled={!pagedResult.hasPrevious || loading}
                                className="p-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                title="First page"
                            >
                                <ChevronsLeft className="w-4 h-4" />
                            </button>
                            <button
                                onClick={() => handlePageChange(pagedResult.pageNumber - 1)}
                                disabled={!pagedResult.hasPrevious || loading}
                                className="p-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                title="Previous page"
                            >
                                <ChevronLeft className="w-4 h-4" />
                            </button>

                            <div className="flex items-center gap-1">
                                {Array.from({ length: Math.min(5, pagedResult.totalPages) }, (_, i) => {
                                    let pageNum;
                                    if (pagedResult.totalPages <= 5) {
                                        pageNum = i + 1;
                                    } else if (pagedResult.pageNumber <= 3) {
                                        pageNum = i + 1;
                                    } else if (pagedResult.pageNumber >= pagedResult.totalPages - 2) {
                                        pageNum = pagedResult.totalPages - 4 + i;
                                    } else {
                                        pageNum = pagedResult.pageNumber - 2 + i;
                                    }

                                    return (
                                        <button
                                            key={pageNum}
                                            onClick={() => handlePageChange(pageNum)}
                                            disabled={loading}
                                            className={`px-3 py-1 rounded-lg text-sm ${pagedResult.pageNumber === pageNum
                                                ? 'bg-blue-600 text-white'
                                                : 'border border-gray-300 text-gray-700 hover:bg-gray-50'
                                                }`}
                                        >
                                            {pageNum}
                                        </button>
                                    );
                                })}
                            </div>

                            <button
                                onClick={() => handlePageChange(pagedResult.pageNumber + 1)}
                                disabled={!pagedResult.hasNext || loading}
                                className="p-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                title="Next page"
                            >
                                <ChevronRight className="w-4 h-4" />
                            </button>
                            <button
                                onClick={() => handlePageChange(pagedResult.totalPages)}
                                disabled={!pagedResult.hasNext || loading}
                                className="p-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                title="Last page"
                            >
                                <ChevronsRight className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Create User Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg p-4 md:p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-semibold text-gray-900">Create New Admin Account</h2>
                            <button
                                onClick={() => {
                                    setShowCreateModal(false);
                                    resetForm();
                                }}
                                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                                title="Close"
                            >
                                <X className="w-5 h-5 text-gray-600" />
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* Login ID */}
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Login ID *
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.loginID}
                                        onChange={(e) => setFormData({ ...formData, loginID: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        placeholder="Enter login ID"
                                        required
                                    />
                                </div>

                                {/* Password */}
                                {/*<div className="md:col-span-2">*/}
                                {/*    <label className="block text-sm font-medium text-gray-700 mb-2">*/}
                                {/*        Password **/}
                                {/*    </label>*/}
                                {/*    <input*/}
                                {/*        type="password"*/}
                                {/*        value={formData.password}*/}
                                {/*        onChange={(e) => setFormData({ ...formData, password: e.target.value })}*/}
                                {/*        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"*/}
                                {/*        placeholder="Enter password"*/}
                                {/*        required*/}
                                {/*    />*/}
                                {/*</div>*/}

                                {/* Login Type */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Login Type *
                                    </label>
                                    <select
                                        value={formData.loginType}
                                        onChange={(e) => setFormData({ ...formData, loginType: parseInt(e.target.value) })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    >
                                        {loginTypeOptions.map(option => (
                                            <option key={option.value} value={option.value}>
                                                {option.displayName}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {/* Admin User Kengen */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Admin User Kengen *
                                    </label>
                                    <select
                                        value={formData.adminUserKengen}
                                        onChange={(e) => setFormData({ ...formData, adminUserKengen: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        required
                                    >
                                        {kengenOptions.map(option => (
                                            <option key={option.value} value={option.value}>
                                                {option.displayName}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {/* Admin Name */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Admin Name *
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.adminUserName}
                                        onChange={(e) => setFormData({ ...formData, adminUserName: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        placeholder="Enter admin name"
                                    />
                                </div>

                                {/* Email */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Email Address
                                    </label>
                                    <input
                                        type="email"
                                        value={formData.adminUserMail}
                                        onChange={(e) => setFormData({ ...formData, adminUserMail: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        placeholder="Enter email address"
                                    />
                                </div>

                                {/* Admin Name Kana */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Admin Name Kana
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.adminUserKana}
                                        onChange={(e) => setFormData({ ...formData, adminUserKana: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        placeholder="Enter admin name (kana)"
                                    />
                                </div>

                                {/* Naisen */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Naisen
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.adminUserNaisen}
                                        onChange={(e) => setFormData({ ...formData, adminUserNaisen: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        placeholder="Enter naisen number"
                                    />
                                </div>

                                {/* Est Name */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Est Name
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.estName}
                                        onChange={(e) => setFormData({ ...formData, estName: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        placeholder="Enter est name"
                                    />
                                </div>

                                {/* KaSoshiki */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        KaSoshiki
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.kaSoshikiName}
                                        onChange={(e) => setFormData({ ...formData, kaSoshikiName: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        placeholder="Enter ka soshiki name"
                                    />
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex flex-col md:flex-row items-center gap-3 pt-6">
                                <button
                                    onClick={handleCreate}
                                    className="w-full md:flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                                >
                                    <Check className="w-5 h-5" />
                                    Create User
                                </button>
                                <button
                                    onClick={() => {
                                        setShowCreateModal(false);
                                        resetForm();
                                    }}
                                    className="w-full md:flex-1 flex items-center justify-center gap-2 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                                >
                                    <X className="w-5 h-5" />
                                    Cancel
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Edit Admin Modal */}
            {showEditModal && editingUser && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg p-4 md:p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <h2 className="text-xl font-semibold text-gray-900">Edit Admin Account</h2>
                                {/*<p className="text-sm text-gray-600">UserCD: {editingUser.adminUserCD}</p>*/}
                            </div>
                            <button
                                onClick={() => {
                                    setShowEditModal(false);
                                    setEditingUser(null);
                                }}
                                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                                title="Close"
                            >
                                <X className="w-5 h-5 text-gray-600" />
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* Read-only field */}
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-gray-500 mb-2">
                                        Login ID (Read-only)
                                    </label>
                                    <div className="px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-gray-700">
                                        {editingUser.loginID}
                                    </div>
                                </div>

                                {/* Login Type */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Login Type *
                                    </label>
                                    <select
                                        value={formData.loginType}
                                        onChange={(e) => setFormData({ ...formData, loginType: parseInt(e.target.value) })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    >
                                        {loginTypeOptions.map(option => (
                                            <option key={option.value} value={option.value}>
                                                {option.displayName}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Admin User Kengen *
                                    </label>
                                    <select
                                        value={formData.adminUserKengen}
                                        onChange={(e) => setFormData({ ...formData, adminUserKengen: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        required
                                    >
                                        {kengenOptions.map(option => (
                                            <option key={option.value} value={option.value}>
                                                {option.displayName}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {/* Admin Name */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Admin Name *
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.adminUserName}
                                        onChange={(e) => setFormData({ ...formData, adminUserName: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        placeholder="Enter admin name"
                                        required
                                    />
                                </div>

                                {/* Email */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Email Address
                                    </label>
                                    <input
                                        type="email"
                                        value={formData.adminUserMail}
                                        onChange={(e) => setFormData({ ...formData, adminUserMail: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        placeholder="Enter email address"
                                    />
                                </div>

                                {/* Admin Name Kana */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Admin Name Kana
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.adminUserKana}
                                        onChange={(e) => setFormData({ ...formData, adminUserKana: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        placeholder="Enter admin name (kana)"
                                    />
                                </div>

                                {/* Naisen */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Naisen
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.adminUserNaisen}
                                        onChange={(e) => setFormData({ ...formData, adminUserNaisen: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        placeholder="Enter naisen number"
                                    />
                                </div>

                                {/* Est Name */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Est Name
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.estName}
                                        onChange={(e) => setFormData({ ...formData, estName: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        placeholder="Enter est name"
                                    />
                                </div>

                                {/* KaSoshiki */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        KaSoshiki
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.kaSoshikiName}
                                        onChange={(e) => setFormData({ ...formData, kaSoshikiName: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        placeholder="Enter ka soshiki name"
                                    />
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex flex-col md:flex-row items-center gap-3 pt-6">
                                <button
                                    onClick={handleSaveEdit}
                                    className="w-full md:flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                                >
                                    <Check className="w-5 h-5" />
                                    Save Changes
                                </button>
                                <button
                                    onClick={() => {
                                        setShowEditModal(false);
                                        setEditingUser(null);
                                    }}
                                    className="w-full md:flex-1 flex items-center justify-center gap-2 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                                >
                                    <X className="w-5 h-5" />
                                    Cancel
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {showDeleteModal && deleteUser && (
                <div
                    className="fixed inset-0 flex items-center justify-center z-50 p-4"
                    style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
                    onClick={() => {
                        setShowDeleteModal(false);
                        setDeleteUser(null);
                    }}
                >
                    <div
                        className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 relative"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
                            <Trash2 className="w-8 h-8 text-red-600" />
                        </div>

                        <h3 className="text-xl font-bold text-center text-gray-900 mb-2">
                            Delete Admin User?
                        </h3>

                        <div className="text-center space-y-3 mb-6">
                            <p className="text-gray-600 leading-relaxed">
                                Are you sure you want to <span className="font-semibold text-red-600">delete</span> this admin account?
                            </p>
                            <div className="bg-gray-50 rounded-lg p-4">
                                <div className="font-medium text-gray-900 text-lg">
                                    {deleteUser.adminUserName || 'Unnamed User'}
                                </div>
                                <div className="text-sm text-gray-500 mt-1">
                                    ID: {deleteUser.adminUserCD} • {deleteUser.loginID || 'No login ID'}
                                </div>
                                <div className="text-sm text-gray-500">
                                    Role: <span className="font-medium">{formatKengen(deleteUser.adminUserKengen)}</span>
                                </div>
                            </div>
                            {/*<p className="text-sm text-red-600 font-medium">*/}
                            {/*    This action cannot be undone. The user will lose all access immediately.*/}
                            {/*</p>*/}
                        </div>

                        <div className="flex gap-3 justify-center">
                            <button
                                onClick={() => {
                                    setShowDeleteModal(false);
                                    setDeleteUser(null);
                                }}
                                className="px-5 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleConfirmDelete}
                                disabled={loading}
                                className="px-5 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                            >
                                {loading ? (
                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                ) : (
                                    <Trash2 className="w-4 h-4" />
                                )}
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}