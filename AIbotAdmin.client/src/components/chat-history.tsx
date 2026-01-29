import { useState, useEffect, useCallback, useRef } from 'react';
import { useChatStore } from '@/hooks/use-chat-store';
import { Search, Filter, Eye, Trash2, MessageSquare, RefreshCw, X, Loader2, Bot, User, ChevronLeft } from 'lucide-react';
import { formatDateToSecond } from '@/lib/utils'
import { toast } from "sonner";
import { DatePicker } from '@/components/ui/date-picker'
import { TimePicker } from '@/components/ui/time-picker'
import ChatContentRenderer from '@/components/chat-content-renderer';

type ChatStatus = 'completed' | 'uncompleted';
interface FilterOptions {
    searchTerm: string;
    statusFilter: string;
    selectedDate: string;
    startTime: string;
    endTime: string;
}

export default function ChatHistory() {
    const {
        sessions,
        selectedSession,
        loading,
        error,
        fetchSessions,
        fetchSessionDetail,
        deleteSession,
        //exportSingleSession,
        setSelectedSession,
        clearError
    } = useChatStore();

    const [filters, setFilters] = useState<FilterOptions>({
        searchTerm: '',
        statusFilter: 'all',
        selectedDate: '',
        startTime: '',
        endTime: ''
    });

    const [showFilters, setShowFilters] = useState(false);
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [sessionToDelete, setSessionToDelete] = useState<string | null>(null);
    const [sessionNameToDelete, setSessionNameToDelete] = useState<string>('this session');
    const initialLoadRef = useRef(true);

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

    const getStatusFilter = useCallback((): ChatStatus | undefined => {
        if (filters.statusFilter === 'completed' || filters.statusFilter === 'uncompleted') {
            return filters.statusFilter;
        }
        return undefined;
    }, [filters.statusFilter]);

    const loadSessions = useCallback(async () => {
        const status = getStatusFilter();

        await fetchSessions({
            pageNumber: 1,
            pageSize: 100,
            status,
            searchText: filters.searchTerm || undefined,
            selectedDate: filters.selectedDate || undefined,
            startTime: filters.startTime || undefined,
            endTime: filters.endTime || undefined,
        });
    }, [filters, fetchSessions, getStatusFilter]);

    useEffect(() => {
        if (initialLoadRef.current) {
            initialLoadRef.current = false;
            loadSessions();
        }
    }, [loadSessions]);

    useEffect(() => {
        if (initialLoadRef.current) {
            return;
        }

        const timer = setTimeout(() => loadSessions(), 300);
        return () => clearTimeout(timer);
    }, [
        filters.searchTerm,
        filters.statusFilter,
        filters.selectedDate,
        filters.startTime,
        filters.endTime,
        loadSessions
    ]);

    useEffect(() => {
        if (selectedSession) {
            const sessionExists = sessions.some(s => s.sessionId === selectedSession.sessionId);
            if (!sessionExists) {
                setSelectedSession(null);
            }
        }
    }, [sessions, selectedSession, setSelectedSession]);

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

    const handleFilterChange = (newFilters: Partial<FilterOptions>) => {
        setFilters(prev => ({ ...prev, ...newFilters }));
    };

    const handleClearFilter = () => {
        setFilters({
            searchTerm: '',
            statusFilter: 'all',
            selectedDate: '',
            startTime: '',
            endTime: ''
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

    const handleSelectSession = async (sessionId: string) => {
        if (selectedSession?.sessionId === sessionId) return;
        await fetchSessionDetail(sessionId);
    };

    //const handleExportSession = async (sessionId: string) => {
    //    try {
    //        await exportSingleSession(sessionId);
    //        toast.success('Session exported successfully', {
    //            position: 'top-center'
    //        });
    //    } catch (err) {
    //        toast.error('Failed to export session', {
    //            position: 'top-center'
    //        });
    //        console.log('Failed to export session', err);
    //    }
    //};

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

            if (selectedSession?.sessionId === sessionToDelete) {
                setSelectedSession(null);
            }

            await loadSessions();
        }

        setShowDeleteDialog(false);
        setSessionToDelete(null);
        setSessionNameToDelete('this session');
    };

    const getStatusColor = (status?: string) => {
        switch (status) {
            case 'completed':
                return 'bg-blue-100 text-blue-700';
            case 'uncompleted':
                return 'bg-gray-100 text-gray-700';
            default:
                return 'bg-gray-100 text-gray-700';
        }
    };

    return (
        <div className="space-y-6">
            <div className="bg-white rounded-lg border border-gray-200 p-4 md:p-4">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Chat History</h1>
                        <p className="text-gray-600">
                            View detailed conversation history ({sessions.length} sessions)
                        </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        <button
                            onClick={loadSessions}
                            disabled={loading}
                            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50 transition-colors flex items-center gap-2"
                        >
                            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                            Refresh
                        </button>
                    </div>
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

                {/* Filter Section */}
                <div className="flex flex-col lg:flex-row gap-4 pt-4">
                    <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search by user, session ID, or conversation content..."
                            value={filters.searchTerm}
                            onChange={(e) => handleFilterChange({ searchTerm: e.target.value })}
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                        />
                    </div>

                    <button
                        onClick={() => setShowFilters(!showFilters)}
                        className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
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
                                    className="px-4 py-1.5 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors whitespace-nowrap text-md font-medium"
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

            {/* Main Content */}
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                {/* Session List */}
                <div className="lg:col-span-1 space-y-3">
                    <div className="bg-white rounded-lg border border-gray-200 divide-y divide-gray-200 max-h-[700px] overflow-y-auto">
                        {sessions.length === 0 ? (
                            <div className="p-8 text-center text-gray-500">
                                <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                                <div className="text-gray-900 mb-2">No sessions found</div>
                                <div className="text-gray-600">
                                    {filters.searchTerm || filters.selectedDate || filters.statusFilter !== 'all'
                                        ? 'Try adjusting your filters'
                                        : 'No chat history available'}
                                </div>
                            </div>
                        ) : (
                            sessions.map((session) => (
                                <div
                                    key={session.sessionId}
                                    onClick={() => handleSelectSession(session.sessionId)}
                                    className={`p-4 cursor-pointer transition-colors ${selectedSession?.sessionId === session.sessionId
                                        ? 'bg-blue-50'
                                        : 'hover:bg-gray-50'
                                        }`}
                                >
                                    <div className="flex items-start justify-between gap-2">
                                        <div className="flex-1 min-w-0 p-1">
                                            <div className="flex items-center gap-2">
                                                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 flex-shrink-0">
                                                    {session.userName.charAt(0).toUpperCase()}
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <div className="text-sm font-medium text-gray-900 truncate">{session.userName}</div>
                                                </div>
                                                <span className="text-xs text-gray-600">{session.turnCount} turns</span>
                                            </div>
                                            <div className="mt-2 flex items-center justify-between">
                                                <div className="text-xs text-gray-500">
                                                    {formatDateToSecond(session.startTime)}
                                                </div>
                                                <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(session.status)}`}>
                                                    {session.status}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Session Detail */}
                <div className="lg:col-span-4">
                    {selectedSession ? (
                        <div className="bg-white rounded-lg border border-gray-200 h-full flex flex-col">
                            {/* Header  */}
                            <div className="p-2 border-b border-gray-200 bg-white sticky top-0 z-10 flex items-center justify-between">
                                <div className="flex items-center gap-3 flex-1 min-w-0">
                                    <button
                                        onClick={() => setSelectedSession(null)}
                                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors sm:hidden"
                                    >
                                        <ChevronLeft className="w-6 h-6" />
                                    </button>

                                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-semibold text-lg flex-shrink-0">
                                        {selectedSession.userName?.charAt(0).toUpperCase() || 'A'}
                                    </div>

                                    <div className="min-w-0 flex-1">
                                        <div className="text-lg font-semibold text-gray-900 truncate">
                                            {selectedSession.userName || 'Anonymous'}
                                        </div>
                                        <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500 mt-1">
                                            <span>{selectedSession.turnCount} turns</span>
                                            <span className="hidden xs:inline">•</span>
                                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(selectedSession.status)}`}>
                                                {selectedSession.status === 'completed' ? 'Completed' : 'Uncompleted'}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-1">
                                    {/*<button*/}
                                    {/*    onClick={() => handleExportSession(selectedSession.sessionId)}*/}
                                    {/*    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"*/}
                                    {/*    title="Export session"*/}
                                    {/*>*/}
                                    {/*    <Download className="w-5 h-5 text-gray-600" />*/}
                                    {/*</button>*/}
                                    <button
                                        onClick={() => openDeleteDialog(selectedSession.sessionId, selectedSession.userName)}
                                        className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                                        title="Delete session"
                                    >
                                        <Trash2 className="w-5 h-5 text-red-600" />
                                    </button>
                                    <button
                                        onClick={() => setSelectedSession(null)}
                                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors hidden sm:block"
                                        title="Close"
                                    >
                                        <X className="w-5 h-5 text-gray-600" />
                                    </button>
                                </div>
                            </div>

                            {/* Chat Messages  */}
                            <div className="flex-1 overflow-y-auto p-3 bg-gray-50/50">
                                <div className="max-w-7xl mx-auto space-y-3">
                                    {loading ? (
                                        <div className="flex items-center justify-center h-64">
                                            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                                            <span className="ml-3 text-gray-600">Loading conversation...</span>
                                        </div>
                                    ) : selectedSession.qaLogs && selectedSession.qaLogs.length > 0 ? (
                                        selectedSession.qaLogs.map((log: any) => (
                                            <div key={log.qaLogCD} className="space-y-1">
                                                {/* Turn Header */}
                                                <div className="text-center">
                                                    <span className="inline-flex items-center gap-2 px-3 py-1 bg-white border border-gray-300 rounded-full text-xs font-medium text-gray-600">
                                                        <MessageSquare className="w-3.5 h-3.5" />
                                                        Turn {log.turnNo}
                                                        {log.resolvedTurnNo && (
                                                            <span className="ml-1 px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs">
                                                                Resolved
                                                            </span>
                                                        )}
                                                    </span>
                                                </div>

                                                {/* User Message */}
                                                <div className="flex justify-end">
                                                    <div className="flex gap-3 max-w-[90%] sm:max-w-[80%]">
                                                        <div className="order-1">
                                                            <div className="bg-blue-600 text-white p-4 rounded-2xl rounded-tr-none shadow-md">
                                                                <div className="text-sm leading-relaxed whitespace-pre-wrap break-words">
                                                                    {log.questionText}
                                                                </div>
                                                            </div>
                                                            <div className="text-xs text-gray-500 text-right mt-1.5">
                                                                {formatDateToSecond(log.registeredAt)}
                                                            </div>
                                                        </div>
                                                        <div className="w-9 h-9 bg-blue-200 rounded-full flex items-center justify-center flex-shrink-0 mt-1 order-2">
                                                            <User className="w-5 h-5 text-blue-700" />
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Bot Message */}
                                                <div className="flex justify-start">
                                                    <div className="flex gap-3 max-w-[90%] sm:max-w-[80%]">
                                                        <div className="w-9 h-9 bg-yellow-200 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                                                            <Bot className="w-5 h-5 text-yellow-700" />
                                                        </div>
                                                        <div>
                                                            <div className="bg-white ps-4 pe-4 p-1 rounded-2xl rounded-tl-none shadow-md border border-gray-200">
                                                                <ChatContentRenderer content={log.answerText || ''} />
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="flex items-center justify-center h-64 text-gray-500">
                                            <div className="text-center">
                                                <MessageSquare className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                                                <p className="text-lg font-medium">No conversation data</p>
                                                <p className="text-sm">This session has no Q&A logs</p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Footer Info - Mobile đẹp */}
                            <div className="p-3 bg-gray-100 border-t border-gray-200 text-center text-xs text-gray-600">
                                Session ID: {selectedSession.sessionId} •
                                Started at {formatDateToSecond(selectedSession.startTime)}
                            </div>
                        </div>
                    ) : (
                        /* No Session Selected - Mobile friendly */
                        <div className="bg-white rounded-lg border border-gray-200 p-8 sm:p-12 flex items-center justify-center h-full min-h-[500px] border-dashed border-2 border-gray-300">
                            <div className="text-center max-w-md">
                                <Eye className="w-16 h-16 text-gray-400 mx-auto mb-6" />
                                <h3 className="text-2xl font-semibold text-gray-900 mb-3">No Session Selected</h3>
                                <p className="text-gray-600 leading-relaxed">
                                    Tap on a session from the list on the left to view the full conversation
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            </div>

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
                                    <Loader2 className="w-4 h-4 animate-spin" />
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