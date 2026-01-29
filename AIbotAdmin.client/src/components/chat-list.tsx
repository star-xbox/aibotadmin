import { useState, useEffect, useCallback, useRef } from 'react';
import { useChatStore } from '@/hooks/use-chat-store';
import { Search, User, Bot, Eye, Download, Trash2, Filter, MessageSquare, X, Loader2, RefreshCw, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, FileText, ChevronDown, FileSpreadsheet, FileType } from 'lucide-react';
import { toast } from "sonner";
import { formatDateToSecond } from '@/lib/utils'
import { DatePicker } from '@/components/ui/date-picker'
import { TimePicker } from '@/components/ui/time-picker'
import ChatContentRenderer from '@/components/chat-content-renderer';
type ChatStatus = 'completed' | 'uncompleted';
type ExportFormat = 'csv' | 'excel' | 'pdf';

interface FilterOptions {
    searchTerm: string;
    statusFilter: string;
    selectedDate: string;    // YYYY-MM-DD
    startTime: string;       // HH:mm
    endTime: string;         // HH:mm
    sortColumn: string;
    sortDirection: 'ASC' | 'DESC';
}

const PAGE_SIZE_OPTIONS = [5, 10, 20, 50];
const DEFAULT_PAGE_SIZE = 10;
const DEBOUNCE_DELAY = 500;

const EXPORT_OPTIONS: { value: ExportFormat; label: string; icon: any }[] = [
    { value: 'csv', label: 'Export as CSV', icon: FileText },
    { value: 'excel', label: 'Export as Excel', icon: FileSpreadsheet },
    { value: 'pdf', label: 'Export as PDF', icon: FileType },
];

export default function ChatList() {
    const {
        sessions,
        loading,
        error,
        pagination,
        fetchSessions,
        fetchSessionDetail,
        deleteSession,
        exportSessions,
        //exportSingleSession,
        clearError,
        setSelectedSession,
        selectedSession
    } = useChatStore();

    const [filters, setFilters] = useState<FilterOptions>({
        searchTerm: '',
        statusFilter: 'all',
        selectedDate: '',
        startTime: '',
        endTime: '',
        sortColumn: 'StartTime',
        sortDirection: 'DESC'
    });

    const [dateField, setDateField] = useState({
        name: 'selectedDate',
        state: {
            value: filters.selectedDate,
            meta: {
                isTouched: false,
                errors: []
            }
        },
        handleChange: (value: string) => {
            handleFilterChange({ selectedDate: value });
        },
        handleBlur: () => {
        }
    });

    const [startTimeField, setStartTimeField] = useState({
        name: 'startTime',
        state: {
            value: filters.startTime,
            meta: {
                isTouched: false,
                errors: []
            }
        },
        handleChange: (value: string) => {
            handleFilterChange({ startTime: value });
        },
        handleBlur: () => { }
    });

    const [endTimeField, setEndTimeField] = useState({
        name: 'endTime',
        state: {
            value: filters.endTime,
            meta: {
                isTouched: false,
                errors: []
            }
        },
        handleChange: (value: string) => {
            handleFilterChange({ endTime: value });
        },
        handleBlur: () => { }
    });

    const [showFilters, setShowFilters] = useState(false);
    const [showChatModal, setShowChatModal] = useState(false);
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [sessionToDelete, setSessionToDelete] = useState<string | null>(null);
    const [sessionNameToDelete, setSessionNameToDelete] = useState<string>('this session');
    const [showExportDropdown, setShowExportDropdown] = useState(false);
    const initialLoadRef = useRef(true);
    const searchInputRef = useRef<HTMLInputElement>(null);
    const exportDropdownRef = useRef<HTMLDivElement>(null);

    // Close export dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (exportDropdownRef.current && !exportDropdownRef.current.contains(event.target as Node)) {
                setShowExportDropdown(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const getStatusFilter = useCallback((): ChatStatus | undefined => {
        if (
            filters.statusFilter === 'completed' ||
            filters.statusFilter === 'uncompleted'
        ) {
            return filters.statusFilter;
        }
        return undefined;
    }, [filters.statusFilter]);

    const loadSessions = useCallback(async (resetPage = false) => {
        const status = getStatusFilter();

        await fetchSessions({
            pageNumber: resetPage ? 1 : pagination.pageNumber,
            pageSize: pagination.pageSize,
            status,
            searchText: filters.searchTerm || undefined,
            selectedDate: filters.selectedDate || undefined,
            startTime: filters.startTime || undefined,
            endTime: filters.endTime || undefined,
            sortColumn: filters.sortColumn,
            sortDirection: filters.sortDirection,
        });
    }, [
        filters,
        pagination.pageNumber,
        pagination.pageSize,
        fetchSessions,
        getStatusFilter
    ]);

    useEffect(() => {
        const status = getStatusFilter();
        fetchSessions({
            pageNumber: 1,
            pageSize: DEFAULT_PAGE_SIZE,
            status,
            searchText: filters.searchTerm || undefined,
            selectedDate: filters.selectedDate || undefined,
            startTime: filters.startTime || undefined,
            endTime: filters.endTime || undefined,
            sortColumn: filters.sortColumn,
            sortDirection: filters.sortDirection
        });
    }, [
        fetchSessions,
        getStatusFilter,
        filters.searchTerm,
        filters.selectedDate,
        filters.startTime,
        filters.endTime,
        filters.sortColumn,
        filters.sortDirection
    ]);

    useEffect(() => {
        if (initialLoadRef.current) {
            initialLoadRef.current = false;
            loadSessions(true);
        }
    }, [loadSessions]);

    useEffect(() => {
        if (initialLoadRef.current) {
            initialLoadRef.current = false;
            return;
        }

        const timer = setTimeout(() => loadSessions(true), DEBOUNCE_DELAY);
        return () => clearTimeout(timer);
    }, [
        filters.searchTerm,
        filters.statusFilter,
        filters.selectedDate,
        filters.startTime,
        filters.endTime,
        filters.sortColumn,
        filters.sortDirection,
        loadSessions
    ]);

    useEffect(() => {
        setDateField(prev => ({
            ...prev,
            state: { ...prev.state, value: filters.selectedDate }
        }));
        setStartTimeField(prev => ({
            ...prev,
            state: { ...prev.state, value: filters.startTime }
        }));
        setEndTimeField(prev => ({
            ...prev,
            state: { ...prev.state, value: filters.endTime }
        }));
    }, [filters.selectedDate, filters.startTime, filters.endTime]);

    const openDeleteDialog = (sessionId: string, userName: string = 'Anonymous') => {
        setSessionToDelete(sessionId);
        setSessionNameToDelete(userName);
        setShowDeleteDialog(true);
    };

    const confirmDelete = async () => {
        if (!sessionToDelete) return;

        const success = await deleteSession(sessionToDelete);
        if (success) {
            toast.success('Session deleted successfully', {
                position: 'top-center'
            });

            loadSessions?.();

            if (selectedSession?.sessionId === sessionToDelete) {
                setShowChatModal?.(false);
                setSelectedSession(null);
            }
        }

        setShowDeleteDialog(false);
        setSessionToDelete(null);
        setSessionNameToDelete('this session');
    };

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setFilters(prev => ({ ...prev, searchTerm: value }));
    };

    const handleFilterChange = (newFilters: Partial<FilterOptions>) => {
        setFilters(prev => ({ ...prev, ...newFilters }));
    };

    const handlePageChange = (page: number) => {
        loadSessionsWithPage(page);
    };

    const handlePageSizeChange = (size: number) => {
        const status = getStatusFilter();

        fetchSessions({
            pageNumber: 1,
            pageSize: size,
            status: status,
            searchText: filters.searchTerm || undefined,
            selectedDate: filters.selectedDate || undefined,
            startTime: filters.startTime || undefined,
            endTime: filters.endTime || undefined,
            sortColumn: filters.sortColumn,
            sortDirection: filters.sortDirection
        });
    };

    const handleSort = (column: string) => {
        setFilters(prev => {
            if (prev.sortColumn !== column) {
                return {
                    ...prev,
                    sortColumn: column,
                    sortDirection: 'DESC'
                };
            }
            return {
                ...prev,
                sortDirection: prev.sortDirection === 'ASC' ? 'DESC' : 'ASC'
            };
        });
    };

    const getSortIcon = (column: string) => {
        if (filters.sortColumn !== column) return <span className="ml-1 text-gray-300">↕</span>;
        return filters.sortDirection === 'ASC' ? '↑' : '↓';
    };

    const loadSessionsWithPage = useCallback((pageNumber: number) => {
        const status = getStatusFilter();
        fetchSessions({
            pageNumber,
            pageSize: pagination.pageSize,
            status,
            searchText: filters.searchTerm || undefined,
            selectedDate: filters.selectedDate || undefined,
            startTime: filters.startTime || undefined,
            endTime: filters.endTime || undefined,
            sortColumn: filters.sortColumn,
            sortDirection: filters.sortDirection,
        });
    }, [
        filters,
        pagination.pageSize,
        fetchSessions,
        getStatusFilter
    ]);

    const handleClearFilter = () => {
        setFilters({
            searchTerm: '',
            statusFilter: 'all',
            selectedDate: '',
            startTime: '',
            endTime: '',
            sortColumn: 'StartTime',
            sortDirection: 'DESC'
        });

        fetchSessions({
            pageNumber: 1,
            pageSize: pagination.pageSize,
            status: undefined,
            searchText: undefined,
            selectedDate: undefined,
            startTime: undefined,
            endTime: undefined,
            sortColumn: 'StartTime',
            sortDirection: 'DESC'
        });

        setDateField(prev => ({
            ...prev,
            state: { ...prev.state, value: '' }
        }));
        setStartTimeField(prev => ({
            ...prev,
            state: { ...prev.state, value: '' }
        }));
        setEndTimeField(prev => ({
            ...prev,
            state: { ...prev.state, value: '' }
        }));
    };

    const handleViewChat = async (session: any) => {
        try {
            await fetchSessionDetail(session.sessionId);
            setShowChatModal(true);
        } catch (error) {
            toast.error('Failed to load chat details', {
                position: 'top-center'
            });
            console.error('Error loading chat details:', error);
        }
    };

    const handleExport = async (format: ExportFormat) => {
        try {
            const status = getStatusFilter();

            await exportSessions({
                status: status,
                searchText: filters.searchTerm || undefined,
                selectedDate: filters.selectedDate || undefined,
                startTime: filters.startTime || undefined,
                endTime: filters.endTime || undefined,
            }, format);

            setShowExportDropdown(false);

            const formatLabels = { csv: 'CSV', excel: 'Excel', pdf: 'PDF' };
            toast.success(`${formatLabels[format]} exported successfully`, {
                position: 'top-center'
            });
        } catch (err) {
            toast.error('Failed to export data', {
                position: 'top-center'
            });
            console.error('Failed to export:', err);
        }
    };

    //const handleExportSingleSession = async (sessionId: string) => {
    //    try {
    //        await exportSingleSession(sessionId);
    //        toast.success('Session exported successfully', {
    //            position: 'top-center'
    //        });
    //    } catch (err) {
    //        toast.error('Failed to export session', {
    //            position: 'top-center'
    //        });
    //        console.error('Failed to export session:', err);
    //    }
    //};

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'completed':
                return 'bg-blue-100 text-blue-700';
            case 'uncompleted':
                return 'bg-gray-100 text-gray-700';
            default:
                return 'bg-gray-100 text-gray-700';
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            loadSessions(true);
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="bg-white rounded-lg border border-gray-200 p-4 md:p-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Chat List</h1>
                        <p className="text-gray-600">
                            Manage and monitor all chat sessions ({pagination.totalCount} total)
                        </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        <button
                            onClick={() => loadSessions()}
                            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 cursor-pointer transition-colors flex items-center gap-2"
                            disabled={loading}
                        >
                            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                            Refresh
                        </button>

                        {/* Export Dropdown */}
                        <div className="relative" ref={exportDropdownRef}>
                            <button
                                onClick={() => setShowExportDropdown(!showExportDropdown)}
                                disabled={loading}
                                className="px-4 py-2 cursor-pointer bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2 disabled:bg-gray-400 disabled:cursor-not-allowed"
                            >
                                <Download className="w-4 h-4" />
                                Export
                                <ChevronDown className="w-4 h-4" />
                            </button>

                            {showExportDropdown && (
                                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-10">
                                    {EXPORT_OPTIONS.map((option) => {
                                        const Icon = option.icon;
                                        return (
                                            <button
                                                key={option.value}
                                                onClick={() => handleExport(option.value)}
                                                disabled={loading}
                                                className="w-full px-4 py-2 text-left cursor-pointer hover:bg-gray-50 flex items-center gap-3 first:rounded-t-lg last:rounded-b-lg transition-colors disabled:opacity-50"
                                            >
                                                <Icon className="w-4 h-4 text-gray-600" />
                                                <span className="text-sm text-gray-700">{option.label}</span>
                                            </button>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Filter Section */}
                <div className="flex flex-col lg:flex-row gap-4 pt-4">
                    <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                            ref={searchInputRef}
                            type="text"
                            placeholder="Search by user, session ID, or conversation content..."
                            value={filters.searchTerm}
                            onChange={handleSearchChange}
                            onKeyDown={handleKeyPress}
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                        />
                    </div>

                    <button
                        onClick={() => setShowFilters(!showFilters)}
                        className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                        disabled={loading}
                    >
                        <Filter className="w-5 h-5" />
                        Filters
                        {showFilters ? '↑' : '↓'}
                    </button>
                </div>

                {showFilters && (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                        <div className="flex flex-wrap items-end gap-3">
                            {/* Status Filter - Compact */}
                            <div className="w-32">
                                <label className="block text-md font-medium text-gray-700 mb-1 truncate">Status</label>
                                <select
                                    value={filters.statusFilter}
                                    onChange={(e) => handleFilterChange({ statusFilter: e.target.value })}
                                    className="w-full px-2 h-[38px] py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 cursor-pointer"
                                    disabled={loading}
                                >
                                    <option value="all">All</option>
                                    <option value="completed">Completed</option>
                                    <option value="uncompleted">Uncompleted</option>
                                </select>
                            </div>

                            {/* Date Picker */}
                            <div className="w-36">
                                <label className="block text-md font-medium text-gray-700 mb-1 truncate">Date</label>
                                <DatePicker
                                    field={dateField}
                                    disabled={loading}
                                    className="w-full text-left h-[38px] px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                                />
                            </div>

                            {/* Start Time Picker */}
                            <div className={`w-32 ${!filters.selectedDate ? 'cursor-not-allowed' : ''}`}>
                                <label className="block text-md font-medium text-gray-700 mb-1 truncate">
                                    Start Time
                                </label>
                                <TimePicker
                                    field={startTimeField}
                                    disabled={loading || !filters.selectedDate}
                                    className="w-full h-[38px] px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                                />
                            </div>

                            {/* End Time Picker */}
                            <div className={`w-32 ${!filters.selectedDate ? 'cursor-not-allowed' : ''}`}>
                                <label className="block text-md font-medium text-gray-700 mb-1 truncate">
                                    End Time
                                </label>
                                <TimePicker
                                    field={endTimeField}
                                    disabled={loading || !filters.selectedDate}
                                    className="w-full h-[38px] px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                                />
                            </div>

                            {/* Clear Button */}
                            <div className="ml-auto">
                                <button
                                    onClick={handleClearFilter}
                                    className="px-4 py-1.5 border cursor-pointer border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors whitespace-nowrap text-md font-medium"
                                    disabled={loading}
                                >
                                    Clear
                                </button>
                            </div>
                        </div>

                        <div className="mt-2">
                            <p className="text-xs text-gray-500">
                                {filters.selectedDate
                                    ? "💡 Leave time fields empty to search entire day (00:00 - 23:59)"
                                    : "💡 Select a date to enable time filtering"}
                            </p>
                        </div>
                    </div>
                )}
            </div>

            {/* Error Display */}
            {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-lg">
                    <div className="flex justify-between items-center">
                        <span>{error}</span>
                        <button
                            onClick={clearError}
                            className="text-red-700 hover:text-red-900"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            )}

            {/* Chat Sessions Table */}
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto relative">
                    <table className="w-full">
                        <thead className="bg-gray-50 border-b border-gray-200">
                            <tr>
                                <th className="ps-10 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    STT
                                </th>
                                <th
                                    className="ps-9 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                                    onClick={() => handleSort('UserName')}
                                >
                                    <div className="flex items-center gap-1">
                                        User {getSortIcon('UserName')}
                                    </div>
                                </th>
                                <th
                                    className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                                    onClick={() => handleSort('StartTime')}
                                >
                                    <div className="flex items-center gap-1">
                                        Time {getSortIcon('StartTime')}
                                    </div>
                                </th>
                                <th
                                    className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 text-center"
                                    onClick={() => handleSort('TurnCount')}
                                >
                                    <div className="flex items-center gap-1 justify-center">
                                        Turns {getSortIcon('TurnCount')}
                                    </div>
                                </th>
                                <th className="px-4 py-3 ps-9 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Status
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Last Question
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Last Answer
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {sessions.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className="px-6 py-12 text-center text-gray-500">
                                        <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                                        <div className="text-gray-900 mb-2">No chat sessions found</div>
                                        <div className="text-gray-600">
                                            {filters.searchTerm || filters.selectedDate || filters.startTime || filters.endTime || filters.statusFilter !== 'all'
                                                ? 'Try adjusting your search criteria'
                                                : 'No chat history available'}
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                sessions.map((session, index) => {
                                    const userName = session.userName || 'Anonymous';
                                    const userInitial = userName.charAt(0).toUpperCase() || 'A';
                                    const stt = ((pagination.pageNumber - 1) * pagination.pageSize) + index + 1;

                                    return (
                                        <tr key={session.sessionId} className="hover:bg-gray-50 transition-colors">
                                            <td className="ps-10 py-3 text-sm font-medium text-gray-900">
                                                {stt}
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-semibold">
                                                        {userInitial}
                                                    </div>
                                                    <div>
                                                        <div className="text-sm font-medium text-gray-900">
                                                            {userName}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="space-y-1">
                                                    <div className="text-sm text-gray-900">
                                                        {session.startTime ? formatDateToSecond(session.startTime) : 'N/A'}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-700 rounded-full">
                                                    {session.turnCount || 0} turns
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(session.status || 'unknown')}`}>
                                                    {session.status || 'unknown'}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="max-w-xs truncate" title={session.lastQuestion || ''}>
                                                    <div className="text-sm text-gray-700 truncate">
                                                        {session.lastQuestion || 'No question'}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="max-w-xl truncate" title={session.lastAnswer || ''}>
                                                    <div className="text-sm text-gray-700 truncate">
                                                        {session.lastAnswer || 'No answer'}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-2">
                                                    <button
                                                        onClick={() => handleViewChat(session)}
                                                        className="p-2 hover:bg-blue-50 rounded-lg cursor-pointer transition-colors text-blue-600 hover:text-blue-700"
                                                        title="View chat details"
                                                        disabled={loading}
                                                    >
                                                        <Eye className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => openDeleteDialog(session.sessionId!, session.userName || 'Anonymous')}
                                                        className="p-2 hover:bg-red-50 rounded-lg cursor-pointer transition-colors text-red-600 hover:text-red-700"
                                                        title="Delete session"
                                                        disabled={loading}
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>

                    {loading && sessions.length > 0 && (
                        <div className="p-12 text-center">
                            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                            <p className="mt-2 text-gray-600">Loading chat list...</p>
                        </div>
                    )}
                </div>

                {/* Pagination */}
                {pagination.totalCount > 0 && (
                    <div className="flex flex-col md:flex-row items-center justify-between px-4 py-3 border-t border-gray-200 bg-white">
                        <div className="flex items-center gap-4 mb-4 md:mb-0">
                            <div className="text-sm text-gray-700">
                                Showing{' '}
                                <span className="font-medium">{(pagination.pageNumber - 1) * pagination.pageSize + 1}</span>{' '}
                                to{' '}
                                <span className="font-medium">
                                    {Math.min(pagination.pageNumber * pagination.pageSize, pagination.totalCount)}
                                </span>{' '}
                                of <span className="font-medium">{pagination.totalCount}</span> results
                            </div>
                            <select
                                value={pagination.pageSize}
                                onChange={(e) => handlePageSizeChange(Number(e.target.value))}
                                className="px-3 py-1 border border-gray-300 rounded-lg cursor-pointer text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                disabled={loading}
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
                                disabled={!pagination.hasPrevious || loading}
                                className="p-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                title="First page"
                            >
                                <ChevronsLeft className="w-4 h-4" />
                            </button>
                            <button
                                onClick={() => handlePageChange(pagination.pageNumber - 1)}
                                disabled={!pagination.hasPrevious || loading}
                                className="p-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                title="Previous page"
                            >
                                <ChevronLeft className="w-4 h-4" />
                            </button>

                            <div className="flex items-center gap-1">
                                {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                                    let pageNum;
                                    if (pagination.totalPages <= 5) {
                                        pageNum = i + 1;
                                    } else if (pagination.pageNumber <= 3) {
                                        pageNum = i + 1;
                                    } else if (pagination.pageNumber >= pagination.totalPages - 2) {
                                        pageNum = pagination.totalPages - 4 + i;
                                    } else {
                                        pageNum = pagination.pageNumber - 2 + i;
                                    }

                                    return (
                                        <button
                                            key={pageNum}
                                            onClick={() => handlePageChange(pageNum)}
                                            disabled={loading}
                                            className={`px-3 py-1 rounded-lg text-sm ${pagination.pageNumber === pageNum
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
                                onClick={() => handlePageChange(pagination.pageNumber + 1)}
                                disabled={!pagination.hasNext || loading}
                                className="p-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                title="Next page"
                            >
                                <ChevronRight className="w-4 h-4" />
                            </button>
                            <button
                                onClick={() => handlePageChange(pagination.totalPages)}
                                disabled={!pagination.hasNext || loading}
                                className="p-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                title="Last page"
                            >
                                <ChevronsRight className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Chat Detail Modal */}
            {showChatModal && selectedSession && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 overflow-hidden">
                    <div className="
            bg-white rounded-lg w-full 
            max-w-6xl max-h-[90vh] 
            flex flex-col
            /* Mobile: full height, full width */
            h-full sm:h-auto 
            sm:max-h-[90vh]
        ">
                        {/* Header */}
                        <div className="p-2 border-b border-gray-200 bg-white flex items-center justify-between sticky top-0 z-10">
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                                <button
                                    onClick={() => {
                                        setShowChatModal(false);
                                        setSelectedSession(null);
                                    }}
                                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors sm:hidden"
                                >
                                    <ChevronLeft className="w-5 h-5" />
                                </button>
                                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-semibold flex-shrink-0">
                                    {selectedSession.userName?.charAt(0).toUpperCase() || 'A'}
                                </div>
                                <div className="min-w-0 flex-1">
                                    <div className="text-lg font-semibold text-gray-900 truncate">
                                        {selectedSession.userName || 'Anonymous'}
                                    </div>
                                    <div className="text-xs text-gray-500 truncate">
                                        <span className="pe-2">
                                            {selectedSession.turnCount} turns
                                        </span>
                                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(selectedSession.status)}`}>
                                            {selectedSession.status === 'completed' ? 'Completed' : 'Uncompleted'}
                                        </span>
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center gap-1">
                                {/*<button*/}
                                {/*    onClick={() => handleExportSingleSession(selectedSession.sessionId)}*/}
                                {/*    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"*/}
                                {/*    title="Export session"*/}
                                {/*>*/}
                                {/*    <Download className="w-5 h-5 text-gray-600" />*/}
                                {/*</button>*/}
                                <button
                                    onClick={() => openDeleteDialog(selectedSession.sessionId, selectedSession.userName || 'Anonymous')}
                                    className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                                    title="Delete session"
                                >
                                    <Trash2 className="w-5 h-5 text-red-600" />
                                </button>
                                <button
                                    onClick={() => {
                                        setShowChatModal(false);
                                        setSelectedSession(null);
                                    }}
                                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors hidden sm:block"
                                    title="Close"
                                >
                                    <X className="w-5 h-5 text-gray-600" />
                                </button>
                            </div>
                        </div>

                        {/* Chat Content - Scrollable */}
                        <div className="flex-1 overflow-y-auto p-2 space-y-6 bg-gray-50">
                            {loading ? (
                                <div className="flex items-center justify-center h-full">
                                    <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                                    <span className="ml-3 text-gray-600">Loading conversation...</span>
                                </div>
                            ) : selectedSession.qaLogs && selectedSession.qaLogs.length > 0 ? (
                                selectedSession.qaLogs.map((log: any) => (
                                    <div key={log.qaLogCD} className="space-y-1">
                                        {/* Turn Header */}
                                        <div className="text-center text-xs text-gray-500 font-medium">
                                            <span className="px-3 py-1 bg-white rounded-full border border-gray-300">
                                                Turn {log.turnNo}
                                                {log.resolvedTurnNo && (
                                                    <span className="ml-2 px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs">
                                                        Resolved
                                                    </span>
                                                )}
                                            </span>
                                        </div>

                                        {/* User Message - Right aligned */}
                                        <div className="flex justify-end">
                                            <div className="flex gap-3 max-w-[85%] sm:max-w-[70%]">
                                                <div className="flex-1">
                                                    <div className="bg-blue-600 text-white p-3 rounded-2xl rounded-tr-none shadow-sm">
                                                        <div className="text-sm leading-relaxed break-words">
                                                            {log.questionText}
                                                        </div>
                                                    </div>
                                                    <div className="text-xs text-gray-500 text-right mt-1">
                                                        {formatDateToSecond(log.registeredAt)}
                                                    </div>
                                                </div>
                                                <div className="w-9 h-9 bg-blue-200 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                                                    <User className="w-5 h-5 text-blue-700" />
                                                </div>
                                            </div>
                                        </div>

                                        {/* Bot Message - Left aligned */}
                                        <div className="flex justify-start">
                                            <div className="flex gap-3 max-w-[85%] sm:max-w-[70%]">
                                                <div className="w-9 h-9 bg-yellow-200 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                                                    <Bot className="w-5 h-5 text-yellow-700" />
                                                </div>
                                                <div className="flex-1">
                                                    <div className="bg-white ps-4 pe-4 p-1 rounded-2xl rounded-tl-none shadow-sm border border-gray-200">
                                                        <ChatContentRenderer content={log.answerText || ''} />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="flex items-center justify-center h-full text-gray-500">
                                    <div className="text-center">
                                        <MessageSquare className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                                        <p className="text-lg font-medium">No conversation data</p>
                                        <p className="text-sm">This session has no Q&A logs</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Dialog */}
            {showDeleteDialog && (
                <div
                    className="fixed inset-0 flex items-center justify-center z-50 p-4"
                    style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
                    onClick={() => setShowDeleteDialog(false)}
                >
                    <div
                        className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 relative"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
                            <Trash2 className="w-8 h-8 text-red-600" />
                        </div>

                        <h3 className="text-xl font-bold text-center text-gray-900 mb-2">
                            Delete Chat Session?
                        </h3>

                        <p className="text-center text-gray-600 mb-6 leading-relaxed">
                            Are you sure you want to <span className="font-semibold text-red-600">delete</span> the chat session with
                            <span className="font-medium text-gray-900"> {sessionNameToDelete}</span>?
                        </p>

                        <div className="flex gap-3 justify-center">
                            <button
                                onClick={() => setShowDeleteDialog(false)}
                                className="px-5 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={confirmDelete}
                                disabled={loading}
                                className="px-5 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium flex items-center gap-2 disabled:opacity-70"
                            >
                                {loading ? (
                                    <div className="p-12 text-center">
                                        <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                                        <p className="mt-2 text-gray-600">Loading admins...</p>
                                    </div>
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