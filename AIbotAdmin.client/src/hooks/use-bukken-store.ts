import { create } from "zustand";
import { callApi, callAxiosPostApi, callAxiosPutApi } from '@/utils';
import type { T_Bukken } from "@/types/t-bukken";

interface BukkenState {
  bukkenListHistorySearch: any
  setBukkenListHistorySearch: (data: any) => void
  bukkenListAllHistorySearch: any
  setBukkenListAllHistorySearch: (data: any) => void
  getDataList: (formSearch: any, options?: { onUnauthorized?: () => void }) => Promise<BukkenListResult | undefined >
  getData: (bukken_cd: string | null, options?: { onUnauthorized?: () => void }) => Promise<T_Bukken | undefined>
  createData: (payload: FormData, options?: { onUnauthorized?: () => void }) => Promise<boolean>
  updateData: (d_img: boolean | null | undefined, payload: FormData, options?: { onUnauthorized?: () => void }) => Promise<boolean>
  clearBukkenStore: () => void
}

interface BukkenListResult {
    data: T_Bukken[];
    rowsNumber: number;
}

export const useBukkenStore = create<BukkenState>((set) => ({
    bukkenListHistorySearch: localStorage.getItem("bukkenListHistorySearch")
        ? JSON.parse(localStorage.getItem("bukkenListHistorySearch") ?? '{}')
    : null,
    setBukkenListHistorySearch: (data: any) => {
        if (data){
            localStorage.setItem("bukkenListHistorySearch", JSON.stringify(data));
        }
        else{
                localStorage.removeItem("bukkenListHistorySearch");
        }
        set({ bukkenListHistorySearch: data });
    },

    bukkenListAllHistorySearch: localStorage.getItem("bukkenListAllHistorySearch")
        ? JSON.parse(localStorage.getItem("bukkenListAllHistorySearch") ?? '{}')
        : null,

    setBukkenListAllHistorySearch: (data: any) => {
        if (data) {
            localStorage.setItem("bukkenListAllHistorySearch", JSON.stringify(data));
        }
        else {
            localStorage.removeItem("bukkenListAllHistorySearch");
        }
        set({ bukkenListAllHistorySearch: data });
    },
    getDataList: async (formSearch: any, options?: { onUnauthorized?: () => void }): Promise<BukkenListResult | undefined> => {
        try {
            let query = ""
            if(formSearch){
                query = new URLSearchParams(formSearch as any).toString();
            }

            const response = await callApi(
                `/api/bukken/get-list?${query}`,
                {
                    method: 'GET',
                }
            );
            if (response.status === 401 && options) {
                options.onUnauthorized?.();
                return undefined;
            }
            if (response.status === 401 && options) {
                options.onUnauthorized?.();
                return undefined;
            }
            const json = await response.json();
            if (json && json.status === 'ok') {
                return { data: json.data as T_Bukken[], rowsNumber: json.rowsNumber } ;
            }
        } catch { /* empty */ }
        return undefined;
    },
    getData: async (bukken_cd: string | null = null, options?: { onUnauthorized?: () => void }): Promise<T_Bukken | undefined> => {
        try {
            const response = await callApi(
                `/api/bukken/get?bukken_cd=${bukken_cd}`,
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
                return  json.data as T_Bukken;
            }
        } catch { /* empty */ }
        return undefined;
    },
    createData: async(payload: FormData, options?: { onUnauthorized?: () => void }): Promise<any> => {
        try {
            const response = await callAxiosPostApi('/api/bukken/registration', payload, {
                timeout: -1,
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });
            if (response.status === 401 && options) {
                options.onUnauthorized?.();
                return undefined;
            }
            if(response.status == 200 || response.status == 201) {
                return response.data;
            }
        } catch { /* empty */ }
        return undefined;
    },
    updateData: async(d_img: boolean | null | undefined, payload: FormData, options?: { onUnauthorized?: () => void }): Promise<any> => {
        try {
            const response = await callAxiosPutApi(d_img ? '/api/bukken/set-d-img' : '/api/bukken/update', payload, {
                timeout: -1,
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });
            if (response.status === 401 && options) {
                options.onUnauthorized?.();
                return undefined;
            }
            if(response.status == 200 || response.status == 201) {
                return response.data;
            }
        } catch { /* empty */ }
        return undefined;
    },
    clearBukkenStore: () => {
        localStorage.removeItem("bukkenListHistorySearch");
        localStorage.removeItem("bukkenListAllHistorySearch");
        set({ bukkenListHistorySearch: null });
        set({ bukkenListAllHistorySearch: null });
    }
}));
