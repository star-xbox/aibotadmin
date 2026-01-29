export interface T_QALog {
    qaLogCD: number;
    sessionId: string;
    turnNo: number;
    userCD: number | null;
    questionText: string;
    answerText: string;
    resolvedTurnNo: number | null;
    registeredAt: string; 
}

export interface ChatSession {
    sessionId: string;
    userCD: number | null;
    userName: string;
    startTime: string;
    endTime: string; 
    turnCount: number;
    status: 'completed' | 'uncompleted';
    lastQuestion: string;
    lastAnswer: string;
}

export interface ChatSessionDetail {
    sessionId: string;
    userCD: number | null;
    userName: string;
    startTime: string;
    endTime: string;
    turnCount: number;
    status: 'completed' | 'uncompleted';
    qaLogs: Array<{
        qaLogCD: number;
        sessionId: string;
        turnNo: number;
        userCD: number | null;
        questionText: string;
        answerText: string;
        resolvedTurnNo: number | null;
        registeredAt: string;
    }>;
}

export interface ChatListRequest {
    pageNumber: number;
    pageSize: number;
    sessionId?: string;
    userCD?: number;
    userName?: string;
    status?: 'completed' | 'uncompleted';
    selectedDate?: string;   // Format: YYYY-MM-DD
    startTime?: string;      // Format: HH:mm
    endTime?: string;        // Format: HH:mm
    searchText?: string;
    sortColumn?: string;
    sortDirection?: 'ASC' | 'DESC';
}

export interface ChatExportRequest {
    sessionId?: string;
    userCD?: number;
    userName?: string;
    status?: 'completed' | 'uncompleted';
    selectedDate?: string;
    startTime?: string;
    endTime?: string;
    searchText?: string;
    format?: 'csv' | 'excel' | 'pdf';
}

export interface PaginationInfo {
    pageNumber: number;
    pageSize: number;
    totalCount: number;
    totalPages: number;
    hasPrevious: boolean;
    hasNext: boolean;
}

export interface ChatSessionsResponse {
    status: 'ok' | 'error';
    message?: string;
    items: ChatSession[];
    totalCount: number;
    pageNumber: number;
    pageSize: number;
    totalPages: number;
    hasPrevious: boolean;
    hasNext: boolean;
}

export interface ChatSessionDetailResponse {
    status: 'ok' | 'error';
    message?: string;
    data: ChatSessionDetail;
}

export interface ApiErrorResponse {
    status: 'error';
    message: string;
    error?: string;
}