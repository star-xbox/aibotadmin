import { create } from "zustand";
import { callApi } from '@/utils';
import type { M_AdminUser } from "@/types/m-admin-user";
import type { M_Unit } from "@/types/m-unit";

interface UserState {
  getUserList: (options?: { onUnauthorized?: () => void }) => Promise<M_AdminUser[] | undefined>,
  getUnitList: (options?: { onUnauthorized?: () => void }) => Promise<M_Unit[] | undefined>
  getUnit: (ofcCode: string, options?: { onUnauthorized?: () => void }) => Promise<M_Unit | undefined>
}

export const useUserStore = create<UserState>(() => ({
    getUserList: async (options?: { onUnauthorized?: () => void }): Promise<M_AdminUser[] | undefined> => {
        try {
            const response = await callApi(
                '/api/user/get-list',
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
                return json.data as M_AdminUser[];
            }
        } catch { /* empty */ }
        return undefined;
    },
    getUnitList: async (options?: { onUnauthorized?: () => void }): Promise<M_Unit[] | undefined> => {
        try {
            const response = await callApi(
                '/api/user/get-unit-list',
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
                return json.data as M_Unit[];
            }
        } catch { /* empty */ }
        return undefined;
    },
    getUnit: async (ofcCode: string, options?: { onUnauthorized?: () => void }): Promise<M_Unit | undefined> => {
        try {
            const response = await callApi(
                `/api/user/get-unit?ofcCode=${ofcCode}`,
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
                return json.data as M_Unit;
            }
        } catch { /* empty */ }
        return undefined;
    }
}));
