import { create } from 'zustand';
import { callApi } from '@/utils';
import type { ChatSession, ChatSessionDetail, ChatListRequest } from '@/types/t-qalog';

interface ChatState {
    sessions: ChatSession[];
    selectedSession: ChatSessionDetail | null;
    loading: boolean;
    error: string | null;
    pagination: {
        pageNumber: number;
        pageSize: number;
        totalCount: number;
        totalPages: number;
        hasPrevious: boolean;
        hasNext: boolean;
    };

    fetchSessions: (request: ChatListRequest) => Promise<void>;
    fetchSessionDetail: (sessionId: string) => Promise<void>;
    deleteSession: (sessionId: string) => Promise<boolean>;
    exportSessions: (request: Omit<ChatListRequest, 'pageNumber' | 'pageSize'>, format: 'csv' | 'excel' | 'pdf') => Promise<void>;
    exportSingleSession: (sessionId: string) => Promise<void>;
    setSelectedSession: (session: ChatSessionDetail | null) => void;
    clearError: () => void;
    resetStore: () => void;
}

export const useChatStore = create<ChatState>((set, get) => ({
    sessions: [],
    selectedSession: null,
    loading: false,
    error: null,
    pagination: {
        pageNumber: 1,
        pageSize: 10,
        totalCount: 0,
        totalPages: 0,
        hasPrevious: false,
        hasNext: false,
    },

    fetchSessions: async (request: ChatListRequest) => {
        set({ loading: true, error: null });

        try {
            const params = new URLSearchParams();
            params.append('pageNumber', request.pageNumber.toString());
            params.append('pageSize', request.pageSize.toString());

            if (request.sessionId) params.append('sessionId', request.sessionId);
            if (request.userCD) params.append('userCD', request.userCD.toString());
            if (request.userName) params.append('userName', request.userName);
            if (request.status) params.append('status', request.status);

            // Thay đổi: Gửi selectedDate, startTime, endTime thay vì startDate/endDate
            if (request.selectedDate) params.append('selectedDate', request.selectedDate);
            if (request.startTime) params.append('startTime', request.startTime);
            if (request.endTime) params.append('endTime', request.endTime);

            if (request.searchText) params.append('searchText', request.searchText);
            if (request.sortColumn) params.append('sortColumn', request.sortColumn);
            if (request.sortDirection) params.append('sortDirection', request.sortDirection);

            const response = await callApi(`/api/chat/sessions?${params.toString()}`, {
                method: 'GET',
            });

            if (response.status === 401) {
                throw new Error('Unauthorized - Please log in again');
            }

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();

            if (data.status !== 'ok') {
                throw new Error(data.message || 'Failed to fetch sessions');
            }

            set({
                sessions: data.items || [],
                pagination: {
                    pageNumber: data.pageNumber || 1,
                    pageSize: data.pageSize || 10,
                    totalCount: data.totalCount || 0,
                    totalPages: data.totalPages || 0,
                    hasPrevious: data.hasPrevious || false,
                    hasNext: data.hasNext || false,
                },
                loading: false,
            });
        } catch (error: any) {
            console.error('Failed to fetch sessions:', error);
            set({
                error: error.message || 'Failed to fetch sessions',
                loading: false,
                sessions: [],
            });
        }
    },

    fetchSessionDetail: async (sessionId: string) => {
        set({ loading: true, error: null });

        try {
            const response = await callApi(`/api/chat/sessions/${sessionId}`, {
                method: 'GET',
            });

            if (response.status === 401) {
                throw new Error('Unauthorized - Please log in again');
            }

            if (response.status === 404) {
                throw new Error(`Session ${sessionId} not found`);
            }

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();

            if (data.status !== 'ok') {
                throw new Error(data.message || 'Failed to fetch session detail');
            }

            set({
                selectedSession: data.data,
                loading: false
            });
        } catch (error: any) {
            console.error(`Failed to fetch session detail for ${sessionId}:`, error);
            set({
                error: error.message || 'Failed to fetch session detail',
                loading: false
            });
        }
    },

    deleteSession: async (sessionId: string): Promise<boolean> => {
        set({ loading: true, error: null });

        try {
            const response = await callApi(`/api/chat/sessions/${sessionId}`, {
                method: 'DELETE',
            });

            if (response.status === 401) {
                throw new Error('Unauthorized - Please log in again');
            }

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || `Failed to delete session (${response.status})`);
            }

            const { sessions, selectedSession } = get();
            set({
                sessions: sessions.filter(s => s.sessionId !== sessionId),
                selectedSession: selectedSession?.sessionId === sessionId ? null : selectedSession,
                loading: false,
            });

            return true;
        } catch (error: any) {
            console.error(`Failed to delete session ${sessionId}:`, error);
            set({
                error: error.message || 'Failed to delete session',
                loading: false
            });
            return false;
        }
    },

    exportSessions: async (request, format: 'csv' | 'excel' | 'pdf') => {
        set({ loading: true, error: null });

        try {
            const response = await callApi('/api/chat/export', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    ...request,
                    format
                }),
            });

            if (response.status === 401) {
                throw new Error('Unauthorized - Please log in again');
            }

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || `Export failed (${response.status})`);
            }

            const disposition = response.headers.get("Content-Disposition");
            let fileName = "downloaded_file";

            if (disposition && disposition.includes("filename")) {
                const match = disposition.match(/filename[^;=\n]*=\s*(?:UTF-8''|")?([^;\n"]*)/);
                if (match && match[1]) fileName = decodeURIComponent(match[1]);
            }

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = fileName;
            document.body.appendChild(link);
            link.click();

            setTimeout(() => {
                document.body.removeChild(link);
                window.URL.revokeObjectURL(url);
            }, 100);

            set({ loading: false });
        } catch (error: any) {
            console.error(`Failed to export sessions to ${format}:`, error);
            set({
                error: error.message || 'Failed to export sessions',
                loading: false
            });
        }
    },

    exportSingleSession: async (sessionId: string) => {
        set({ loading: true, error: null });

        try {
            const response = await callApi(`/api/chat/export/${sessionId}`, {
                method: 'GET',
            });

            if (response.status === 401) {
                throw new Error('Unauthorized - Please log in again');
            }

            if (response.status === 404) {
                throw new Error(`Session ${sessionId} not found`);
            }

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || `Export failed (${response.status})`);
            }

            const contentDisposition = response.headers.get('Content-Disposition');
            let filename = `chat-session-${sessionId}-${new Date().toISOString().slice(0, 19).replace(/[:]/g, '-')}.txt`;

            if (contentDisposition) {
                const match = contentDisposition.match(/filename="?(.+)"?/);
                if (match?.[1]) {
                    filename = match[1];
                }
            }

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = filename;
            document.body.appendChild(link);
            link.click();

            setTimeout(() => {
                document.body.removeChild(link);
                window.URL.revokeObjectURL(url);
            }, 100);

            set({ loading: false });
        } catch (error: any) {
            console.error(`Failed to export session ${sessionId}:`, error);
            set({
                error: error.message || 'Failed to export session',
                loading: false
            });
        }
    },

    setSelectedSession: (session: ChatSessionDetail | null) => {
        set({ selectedSession: session });
    },

    clearError: () => {
        set({ error: null });
    },

    resetStore: () => {
        set({
            sessions: [],
            selectedSession: null,
            loading: false,
            error: null,
            pagination: {
                pageNumber: 1,
                pageSize: 10,
                totalCount: 0,
                totalPages: 0,
                hasPrevious: false,
                hasNext: false,
            },
        });
    },
}));