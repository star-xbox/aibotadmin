import { useState, useEffect, useCallback } from 'react';
import { Search, Filter, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Edit2, Trash2, X, Check, RefreshCw } from 'lucide-react';
import { formatDateToMinute } from '@/lib/utils'
import { getMyUrl } from '../utils';
interface ApiResponse<T> {
    users?: T[];
    totalCount?: number;
    pageNumber?: number;
    pageSize?: number;
    totalPages?: number;
    message?: string;
    error?: string;
}

interface User {
    userCD: number;
    microsoftId: string | null;
    loginName: string;
    displayName: string | null;
    emailAddress: string | null;
    provider: string;
    lastLoginAt: string | null;
    deleteFlg: number; // 0: Valid, 9: Deleted
    createdAt: string;
}

interface FilterOptions {
    searchTerm: string;
    providerFilter: string;
    statusFilter: string;
    sortColumn: string;
    sortDirection: 'ASC' | 'DESC';
}

interface PagedResult<T> {
    items: T[];
    totalCount: number;
    pageNumber: number;
    pageSize: number;
    totalPages: number;
    hasPrevious: boolean;
    hasNext: boolean;
}

const PAGE_SIZE_OPTIONS = [5, 10, 20, 50];

export function UserManagement() {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [pagedResult, setPagedResult] = useState<PagedResult<User>>({
        items: [],
        totalCount: 0,
        pageNumber: 1,
        pageSize: 10,
        totalPages: 0,
        hasPrevious: false,
        hasNext: false
    });

    const [filters, setFilters] = useState<FilterOptions>({
        searchTerm: '',
        providerFilter: '',
        statusFilter: '0', // Default: Active users
        sortColumn: 'UserCD',
        sortDirection: 'ASC'
    });

    const [showEditModal, setShowEditModal] = useState(false);
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [formData, setFormData] = useState<Partial<User>>({});
    const [showFilters, setShowFilters] = useState(false);
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [showRestoreDialog, setShowRestoreDialog] = useState(false);
    const [userToDelete, setUserToDelete] = useState<User | null>(null);
    const [userToRestore, setUserToRestore] = useState<User | null>(null);

    const fetchUsers = useCallback(async () => {
        setLoading(true);
        setError(null);

        try {
            const queryParams = new URLSearchParams({
                pageNumber: pagedResult.pageNumber.toString(),
                pageSize: pagedResult.pageSize.toString(),
                ...(filters.searchTerm && { searchTerm: filters.searchTerm }),
                ...(filters.providerFilter && { providerFilter: filters.providerFilter }),
                ...(filters.statusFilter !== undefined && { statusFilter: filters.statusFilter }),
                sortColumn: filters.sortColumn,
                sortDirection: filters.sortDirection
            });

            const response = await fetch(getMyUrl(`/api/user/list?${queryParams}`), {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                if (response.status === 401) {
                    throw new Error('Unauthorized - Please login again');
                }
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data: ApiResponse<User> = await response.json();
            if (data.error) {
                throw new Error(data.error);
            }

            setUsers(data.users || []);
            setPagedResult({
                items: data.users || [],
                totalCount: data.totalCount || 0,
                pageNumber: data.pageNumber || 1,
                pageSize: data.pageSize || 10,
                totalPages: data.totalPages || 0,
                hasPrevious: (data.pageNumber || 1) > 1,
                hasNext: (data.pageNumber || 1) < (data.totalPages || 0)
            });
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to fetch users');
            console.error('Error fetching users:', err);

            setUsers([]);
            setPagedResult({
                items: [],
                totalCount: 0,
                pageNumber: 1,
                pageSize: 10,
                totalPages: 0,
                hasPrevious: false,
                hasNext: false
            });
        } finally {
            setLoading(false);
        }
    }, [pagedResult.pageNumber, pagedResult.pageSize, filters]);

    useEffect(() => {
        fetchUsers();
    }, [fetchUsers]);

    // Handle page size change
    useEffect(() => {
        setPagedResult(prev => ({ ...prev, pageNumber: 1 }));
        fetchUsers();
    }, [pagedResult.pageSize]);

    const handlePageChange = (page: number) => {
        setPagedResult(prev => ({ ...prev, pageNumber: page }));
    };

    const handleClearFilter = () => {
        setFilters({
            searchTerm: '',
            providerFilter: '',
            statusFilter: '0',
            sortColumn: 'UserCD',
            sortDirection: 'ASC'
        });
        setPagedResult(prev => ({ ...prev, pageNumber: 1 }));
    };

    const handlePageSizeChange = (size: number) => {
        setPagedResult(prev => ({ ...prev, pageSize: size, pageNumber: 1 }));
    };

    const handleEdit = (user: User) => {
        setEditingUser(user);
        setFormData({
            displayName: user.displayName,
            emailAddress: user.emailAddress,
            loginName: user.loginName,
        });
        setShowEditModal(true);
    };

    const handleSaveEdit = async () => {
        if (!editingUser) return;

        try {
            const response = await fetch(getMyUrl(`/api/user/${editingUser.userCD}`), {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData),
            });

            if (response.ok) {
                await fetchUsers();
                setShowEditModal(false);
                setEditingUser(null);
                setFormData({});
            } else {
                throw new Error('Failed to update user');
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to update user');
        }
    };

    const openDeleteDialog = (user: User) => {
        setUserToDelete(user);
        setShowDeleteDialog(true);
    };

    const openRestoreDialog = (user: User) => {
        setUserToRestore(user);
        setShowRestoreDialog(true);
    };

    const confirmDelete = async () => {
        if (!userToDelete) return;
        try {
            const response = await fetch(getMyUrl(`/api/user/${userToDelete.userCD}`), {
                method: 'DELETE',
            });
            if (response.ok) {
                await fetchUsers();
                setShowDeleteDialog(false);
                setUserToDelete(null);
            } else {
                throw new Error('Failed to delete user');
            }
        } catch (err) {
            setError('Failed to delete user');
            console.log("Failed to delete user", err)
        }
    };

    const confirmRestore = async () => {
        if (!userToRestore) return;
        try {
            const response = await fetch(getMyUrl(`/api/user/${userToRestore.userCD}/restore`), {
                method: 'POST',
            });
            if (response.ok) {
                await fetchUsers();
                setShowRestoreDialog(false);
                setUserToRestore(null);
            } else {
                throw new Error('Failed to restore user');
            }
        } catch (err) {
            setError('Failed to restore user');
            console.log("Failed to restore user", err)
        }
    };

    const handleSort = (column: string) => {
        setPagedResult(prev => ({ ...prev, pageNumber: 1 }));
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

    // Available providers from data
    const availableProviders = Array.from(new Set(users.map(user => user.provider)));

    // Handle enter key press in search input 
    const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            setPagedResult(prev => ({ ...prev, pageNumber: 1 }));
            fetchUsers();
        }
    };

    return (
        <div className="space-y-6">
            <div className="bg-white rounded-lg border border-gray-200 p-4 md:p-4">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
                        <p className="text-gray-600">Manage system users and permissions</p>
                    </div>
                    <button
                        onClick={fetchUsers}
                        disabled={loading}
                        className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
                    >
                        <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                        Refresh
                    </button>
                </div>

                {/* Error Alert */}
                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                        {error}
                    </div>
                )}

            {/* Filters */}
                <div className="flex flex-col lg:flex-row gap-4 pt-4">
                    {/* Search */}
                    <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search users by name, email, or login..."
                            value={filters.searchTerm}
                            onChange={(e) => setFilters(prev => ({ ...prev, searchTerm: e.target.value }))}
                            onKeyDown={handleKeyPress}
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    {/* Filter Toggle Button */}
                    <button
                        onClick={() => setShowFilters(!showFilters)}
                        className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                        <Filter className="w-5 h-5" />
                        Filters
                        {showFilters ? '↑' : '↓'}
                    </button>
                </div>

                {/* Advanced Filters */}
                {showFilters && (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                        <div className="flex flex-wrap items-end gap-3">
                            {/* Provider Filter */}
                            <div className="w-32">
                                <label className="block text-md font-medium text-gray-700 mb-1 truncate">Provider</label>
                                <select
                                    value={filters.providerFilter}
                                    onChange={(e) => setFilters(prev => ({ ...prev, providerFilter: e.target.value }))}
                                    className="w-32 px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 cursor-pointer h-[38px]"
                                >
                                    <option value="">All Providers</option>
                                    {availableProviders.map(provider => (
                                        <option key={provider} value={provider}>{provider}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Status Filter */}
                            <div className="w-28">
                                <label className="block text-md font-medium text-gray-700 mb-1 truncate">Status</label>
                                <select
                                    value={filters.statusFilter}
                                    onChange={(e) => setFilters(prev => ({ ...prev, statusFilter: e.target.value }))}
                                    className="w-26 px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 cursor-pointer h-[38px]"
                                >
                                    <option value="0">Active</option>
                                    <option value="9">Deleted</option>
                                    <option value="">All</option>
                                </select>
                            </div>

                            {/* Clear Button - Right aligned */}
                            <div className="ml-auto">
                                <button
                                    onClick={handleClearFilter}
                                    className="px-4 py-1.5 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors whitespace-nowrap text-md font-medium"
                                >
                                    Clear
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Users Table */}
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                {loading ? (
                    <div className="p-12 text-center">
                        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                        <p className="mt-2 text-gray-600">Loading users...</p>
                    </div>
                ) : (
                    <>
                        <div className="overflow-x-auto">
                            <table className="w-full min-w-[1000px]">
                                    <thead className="bg-gray-50 border-b border-gray-200">
                                        <tr>
                                            <th
                                                className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                                                onClick={() => handleSort('UserCD')}
                                            >
                                                <div className="flex items-center gap-1 text-center">
                                                    User CD {getSortIcon('UserCD')}
                                                </div>
                                            </th>
                                            <th
                                                className="ps-9 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                                                onClick={() => handleSort('DisplayName')}
                                            >
                                                <div className="flex items-center gap-1">
                                                    Display Name {getSortIcon('DisplayName')}
                                                </div>
                                            </th>
                                            <th
                                                className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                                                onClick={() => handleSort('LoginName')}
                                            >
                                                <div className="flex items-center gap-1">
                                                    Login Name {getSortIcon('LoginName')}
                                                </div>
                                            </th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Email Address
                                            </th>
                                            <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Provider
                                            </th>
                                            <th
                                                className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                                                onClick={() => handleSort('LastLoginAt')}
                                            >
                                                <div className="flex items-center gap-1">
                                                    Last Login {getSortIcon('LastLoginAt')}
                                                </div>
                                            </th>
                                            <th
                                                className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                                                onClick={() => handleSort('CreatedAt')}
                                            >
                                                <div className="flex items-center gap-1">
                                                    Registered {getSortIcon('CreatedAt')}
                                                </div>
                                            </th>
                                            <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Status
                                            </th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Actions
                                            </th>
                                        </tr>
                                    </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {users.map((user) => (
                                        <tr key={user.userCD} className="hover:bg-gray-50">
                                            <td className="py-3 text-gray-700 text-sm ps-9">{user.userCD}</td>
                                            <td className="ps-9 text-sm py-3">
                                                <div className="flex items-center gap-3">
                                                    <div>
                                                        <div className="text-gray-900 font-medium">
                                                            {user.displayName || 'N/A'}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 text-sm text-gray-700">{user.loginName}</td>
                                            <td className="px-4 py-3 text-sm text-gray-700">{user.emailAddress || 'N/A'}</td>
                                            <td className="px-4 py-3 text-sm text-center">
                                                <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-sm text-center">
                                                    {user.provider}
                                                </span>
                                            </td>
                                            <td className="px-4 text-sm py-3 text-gray-700 text-sm">
                                                {user.lastLoginAt === null
                                                    ? 'Never'
                                                    : formatDateToMinute(user.lastLoginAt)}
                                            </td>
                                            <td className="px-4 py-3 text-sm text-gray-700 text-sm">
                                                {formatDateToMinute(user.createdAt)}
                                            </td>
                                            <td className="px-4 py-3 text-sm text-center">
                                                <span className={`px-2 py-1 rounded-full text-sm text-center ${user.deleteFlg === 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                                    {user.deleteFlg === 0 ? 'Active' : 'Deleted'}
                                                </span>
                                            </td>
                                            <td className="px-4 text-sm py-3">
                                                <div className="flex items-center gap-2">
                                                    <button
                                                        onClick={() => handleEdit(user)}
                                                        className="p-2 hover:bg-blue-50 rounded-lg transition-colors"
                                                        title="Edit user"
                                                    >
                                                        <Edit2 className="w-4 h-4 text-blue-600" />
                                                    </button>
                                                    {user.deleteFlg === 0 ? (
                                                        <button
                                                            onClick={() => openDeleteDialog(user)}
                                                            className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                                                            title="Delete user"
                                                        >
                                                            <Trash2 className="w-4 h-4 text-red-600" />
                                                        </button>
                                                    ) : (
                                                        <button
                                                            onClick={() => openRestoreDialog(user)}
                                                            className="p-2 hover:bg-green-50 rounded-lg transition-colors"
                                                            title="Restore user"
                                                        >
                                                            <Check className="w-4 h-4 text-green-600" />
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {users.length === 0 && (
                            <div className="p-12 text-center text-gray-500">
                                No users found matching your search criteria
                            </div>
                        )}
                    </>
                )}
            </div>

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
                            className="px-2s py-1 border border-gray-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                            disabled={!pagedResult.hasPrevious}
                            className="p-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                            title="First page"
                        >
                            <ChevronsLeft className="w-4 h-4" />
                        </button>
                        <button
                            onClick={() => handlePageChange(pagedResult.pageNumber - 1)}
                            disabled={!pagedResult.hasPrevious}
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
                            disabled={!pagedResult.hasNext}
                            className="p-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                            title="Next page"
                        >
                            <ChevronRight className="w-4 h-4" />
                        </button>
                        <button
                            onClick={() => handlePageChange(pagedResult.totalPages)}
                            disabled={!pagedResult.hasNext}
                            className="p-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                            title="Last page"
                        >
                            <ChevronsRight className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            )}

            {/* Edit User Modal */}
            {showEditModal && editingUser && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-semibold text-gray-900">
                                Edit User - UserCD: {editingUser.userCD}
                            </h2>
                            <button
                                onClick={() => {
                                    setShowEditModal(false);
                                    setEditingUser(null);
                                    setFormData({});
                                }}
                                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                                <X className="w-5 h-5 text-gray-600" />
                            </button>
                        </div>

                        <div className="space-y-4">
                            {/* Microsoft ID  */}
                            <div>
                                <label className="block text-gray-700 mb-2">Microsoft ID</label>
                                <input
                                    type="text"
                                    value={editingUser.microsoftId || 'N/A'}
                                    disabled
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500"
                                />
                            </div>

                            {/* Login Name */}
                            <div>
                                <label className="block text-gray-700 mb-2">Login Name *</label>
                                <input
                                    type="text"
                                    value={formData.loginName || ''}
                                    onChange={(e) => setFormData({ ...formData, loginName: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="Enter login name"
                                />
                            </div>

                            {/* Display Name */}
                            <div>
                                <label className="block text-gray-700 mb-2">Display Name</label>
                                <input
                                    type="text"
                                    value={formData.displayName || ''}
                                    onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="Enter display name"
                                />
                            </div>

                            {/* Email Address */}
                            <div>
                                <label className="block text-gray-700 mb-2">Email Address</label>
                                <input
                                    type="email"
                                    value={formData.emailAddress || ''}
                                    onChange={(e) => setFormData({ ...formData, emailAddress: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="Enter email address"
                                />
                            </div>
                            {/* Action Buttons */}
                            <div className="flex flex-col sm:flex-row items-center gap-3 pt-6">
                                <button
                                    onClick={handleSaveEdit}
                                    className="flex-1 w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                    disabled={loading}
                                >
                                    <Check className="w-5 h-5" />
                                    Save Changes
                                </button>
                                <button
                                    onClick={() => {
                                        setShowEditModal(false);
                                        setEditingUser(null);
                                        setFormData({});
                                    }}
                                    className="flex-1 w-full flex items-center justify-center gap-2 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                                >
                                    <X className="w-5 h-5" />
                                    Cancel
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Dialog Confirm */ }
            {showDeleteDialog && userToDelete && (
                <div
                    className="fixed inset-0 flex items-center justify-center z-50 p-4"
                    style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
                    onClick={() => setShowDeleteDialog(false)}
                >
                    <div
                        className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
                            <Trash2 className="w-8 h-8 text-red-600" />
                        </div>
                        <h3 className="text-xl font-bold text-center text-gray-900 mb-2">
                            Delete User?
                        </h3>
                        <p className="text-center text-gray-600 mb-6 leading-relaxed">
                            Are you sure you want to <span className="font-semibold text-red-600">delete</span> this user?
                            <br /><br />
                            <span className="font-medium text-gray-900">
                                {userToDelete.displayName || userToDelete.loginName}
                            </span>
                            <br />
                            <span className="text-sm block text-red-600 font-medium mt-2">
                                This action will mark the user as deleted.
                            </span>
                        </p>
                        <div className="flex gap-3 justify-center">
                            <button
                                onClick={() => setShowDeleteDialog(false)}
                                className="px-5 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={confirmDelete}
                                disabled={loading}
                                className="px-5 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium flex items-center gap-2 disabled:opacity-70"
                            >
                                {loading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Trash2 className="w-4 h-4" />}
                                Delete User
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Restore Dialog Confirm */}
            {showRestoreDialog && userToRestore && (
                <div
                    className="fixed inset-0 flex items-center justify-center z-50 p-4"
                    style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
                    onClick={() => setShowRestoreDialog(false)}
                >
                    <div
                        className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                            <Check className="w-8 h-8 text-green-600" />
                        </div>
                        <h3 className="text-xl font-bold text-center text-gray-900 mb-2">
                            Restore User?
                        </h3>
                        <p className="text-center text-gray-600 mb-6 leading-relaxed">
                            Are you sure you want to <span className="font-semibold text-green-600">restore</span> this user?
                            <br /><br />
                            <span className="font-medium text-gray-900">
                                {userToRestore.displayName || userToRestore.loginName}
                            </span>
                            <br />
                            <span className="text-sm block text-green-600 font-medium mt-2">
                                The user will be active again.
                            </span>
                        </p>
                        <div className="flex gap-3 justify-center">
                            <button
                                onClick={() => setShowRestoreDialog(false)}
                                className="px-5 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={confirmRestore}
                                disabled={loading}
                                className="px-5 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium flex items-center gap-2 disabled:opacity-70"
                            >
                                {loading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Check className="w-4 h-4" />}
                                Restore User
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}