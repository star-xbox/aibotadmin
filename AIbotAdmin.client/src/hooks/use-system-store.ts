import { create } from "zustand";
import { callApi } from '@/utils';
import type { M_System } from "@/types/m-system";

interface SystemState {
  getSystemList: (paramKey: number, options?: { onUnauthorized?: () => void }) => Promise<M_System[] | undefined>
}

export const useSystemStore = create<SystemState>(() => ({
    getSystemList: async (paramKey: number, options?: { onUnauthorized?: () => void }) : Promise<M_System[] | undefined> =>{
        try {
            const response = await callApi(
                '/api/system/get-list?paramKey=' + paramKey,
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
                return json.data as M_System[];
            }
        } catch { /* empty */ }
        return undefined;
    }
}));
