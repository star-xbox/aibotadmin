import { create } from "zustand";
import { callApi, getMyUrl } from '@/utils';
import type { T_Document } from "@/types/t-document";
interface DocumentState {
    getDocumentList: (bukken_cd: string, options?: { onUnauthorized?: () => void }) => Promise<T_Document[] | undefined>

    viewFile: (doc_cd: string | number, name: string) => void;

    downloadFile: (doc_cd: string | number) => void;
}

export const useDocumentStore = create<DocumentState>(() => ({
    getDocumentList: async (bukken_cd: string, options?: { onUnauthorized?: () => void }): Promise<T_Document[] | undefined> => {
        try {
            const response = await callApi(
                '/api/document/get-list?bukken_cd=' + bukken_cd,
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
                return json.data as T_Document[];
            }
        } catch { /* empty */ }
        return undefined;
    },
    viewFile: (doc_cd: string | number, name: string) => {
        window.open(getMyUrl(`/bukken/view?doc_cd=${doc_cd}&doc_name=${name}`))
    },

    downloadFile: (doc_cd: string | number) => {
        (window as any).location = getMyUrl('/api/document/download?doc_cd=' + doc_cd)
    }
}));
