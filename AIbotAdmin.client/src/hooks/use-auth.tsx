import React, { createContext, useContext } from 'react';
import { useAuthStore } from '@/hooks/use-auth-store';
import { callApi } from '@/utils';
import type { M_AdminUser } from '@/types/m-admin-user';
import { useApp } from '@/hooks/use-app'
import { useBukkenStore } from "@/hooks/use-bukken-store"

interface AuthContextProps {
    authData: M_AdminUser | undefined;
    isAdmin: boolean;
    isAcc: boolean;
    loginUser: (credentials: {
        loginId: any;
        password: any;
    }) => any;
    fetchUserLocked: () => any;
    logoutUser: () => void;
    fetchUser: (options?: { onUnauthorized?: () => void }) => any;
}

const AuthContext = createContext<AuthContextProps | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { authData, setAuthData, isAdmin, setIsAdmin, isAcc, setIsAcc } = useAuthStore();
    const { clearAppData } = useApp();
    const { clearBukkenStore } = useBukkenStore();
    const clearStore = () => {
        setAuthData(null)
        setIsAdmin(false)
        setIsAcc(false)
    }

    const fetchUser = async (options?: { onUnauthorized?: () => void }) => {
        try {
            const response = await callApi(
                '/api/auth/whoami',
                {
                    method: 'GET',
                    credentials: "include",
                }
            );
            if (response.status === 401 && options) {
                options.onUnauthorized?.();
                return undefined;
            }
            const json = await response.json();
            if (json && json.status === 'ok') {
                const managerKengen = ["1111", "1523"];
                const accKengen = ["0111"];

                const isAdmin = managerKengen.includes(json.userLogin.adminUserKengen);
                const isAcc = accKengen.includes(json.userLogin.adminUserKengen);


                setIsAdmin(isAdmin);
                setIsAcc(isAcc);
                setAuthData(json.userLogin);
                return ;
            }
        } catch { /* empty */ }
        clearStore()
    };

    const fetchUserLocked = async () => {
        try {
            const response = await callApi(
                '/api/auth/locked',
                {
                    method: 'GET',
                }
            );
            const json = await response.json();
            return json;
        } catch {
            clearStore()
            return null;
        }
    };

    const loginUser = async (credentials: {
        loginId: string;
        password: string;
    }) => {
        try {
            clearStore()
            clearAppData()
            clearBukkenStore()
            const response = await callApi(
                '/api/auth/login',
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(credentials),
                }
            );
            const json = await response.json();
            if (json && json.status === 'ok') {
                setIsAdmin(json.isAdmin)
                setIsAcc(json.isAcc)
                setAuthData(json.user)
            }
            return json;
        } catch {
            clearStore()
            return null;
        }
    };

    const logoutUser = async () => {
        await callApi('/api/auth/logout');
        clearStore()
        clearAppData();
        clearBukkenStore();
    };

    return (
        <AuthContext.Provider value={{ authData, isAdmin, isAcc, loginUser, logoutUser, fetchUser, fetchUserLocked }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = (): AuthContextProps => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};