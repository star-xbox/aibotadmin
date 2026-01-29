import type { M_AdminUser } from "@/types/m-admin-user";
import { create } from "zustand";

interface AuthState {
  authData?: M_AdminUser
  setAuthData: (authData: any) => void
  isAdmin: boolean
  setIsAdmin: (isAdmin: any) => void
  isAcc: boolean
  setIsAcc: (isAcc: any) => void
}

const getStoredBoolean = (key: string, defaultValue = false): boolean => {
  const value = localStorage.getItem(key);
  if (value === null) return defaultValue;
  return value === "true";
};

const getStoredUser = (): M_AdminUser | undefined => {
  const item = localStorage.getItem("authData");
  if (!item) return undefined;
  try {
    return JSON.parse(item) as M_AdminUser;
  } catch {
    return undefined;
  }
};
export const useAuthStore = create<AuthState>((set) => ({
  authData: getStoredUser(),
  isAdmin: getStoredBoolean("isAdmin", false),      
  isAcc: getStoredBoolean("isAcc", false),
  setAuthData: (authData: M_AdminUser | undefined) => {
    if(authData){
      localStorage.setItem("authData", JSON.stringify(authData));
    }
    else{
      localStorage.removeItem("authData");
    }
    set({ authData });
  },
  setIsAdmin: (isAdmin: boolean) => {
    localStorage.setItem("isAdmin", isAdmin.toString());
    set({ isAdmin });
  },
  setIsAcc: (isAcc: boolean) => {
    localStorage.setItem("isAcc", isAcc.toString());
    set({ isAcc });
  }
}));
