import { create } from "zustand";
import { callApi } from '@/utils';
import type { M_DocumentType } from "@/types/m-document-type";

interface DocumentTypeState {
  getDocumentTypeList: (classFlg: number, options?: { onUnauthorized?: () => void }) => Promise<M_DocumentType[] | undefined>
}

export const useDocumentTypeStore = create<DocumentTypeState>(() => ({
    getDocumentTypeList: async (classFlg: number, options?: { onUnauthorized?: () => void }): Promise<M_DocumentType[] | undefined> => {
        try {
            const response = await callApi(
                '/api/document-type/get-list?classFlg=' + classFlg,
                {
                    method: 'GET',
                }
            );
            if (response.status === 401 && options) {
                options.onUnauthorized?.();
                return undefined;
            }
            const json = await response.json();
            if (json && json.status === 'ok') {
                return json.data as M_DocumentType[];
            }
        } catch { /* empty */ }
        return undefined;
    }
}));
