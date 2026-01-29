import React, { createContext, useCallback, useContext, useEffect } from "react";
import { useAppStore } from "@/hooks/use-app-store";
import { callApi } from "@/utils";
import { toast } from "sonner";
import { useNavigate } from "react-router";

interface AppContextProps {
  messages: any;
  fetchMessages: () => void;
  noteAndLink: any;
  fetchNoteAndLink: () => void;
  clearAppData: () => void;
  goToLoginPage: () => void;
}

const AppContext = createContext<AppContextProps | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const navigate = useNavigate();
  const { messages, setMessages, noteAndLink, setNoteAndLink } = useAppStore();
  const goToLoginPage = useCallback(() => {
    const returnUrl = (window.location.pathname + window.location.search).replace(/^\/AIbotAdmin/, "") || "/";
    if (returnUrl != "/login") {
      toast.warning("セッションがタイムアウトになりました。");
      navigate(`/login?returnUrl=${encodeURIComponent(returnUrl)}`);
    }
  }, [navigate]);
  const fetchMessages = async () => {
    try {
      const response = await callApi("/api/messages", {
        method: "GET",
      });
      const messages = await response.json();
      setMessages(messages);
    } catch {
      setMessages(null);
    }
  };

  const fetchNoteAndLink = async () => {
    try {
      const response = await callApi("/api/config/get-note-and-link", {
        method: "GET",
      });

      const noteAndLink = await response.json();
      setNoteAndLink(noteAndLink.data);
    } catch {
      setNoteAndLink(null);
    }
  };

  const clearAppData = () => {
    setNoteAndLink(null);
  };
  useEffect(() => {
    (window as any).__GO_TO_LOGIN_PAGE = goToLoginPage;

    return () => {
      delete (window as any).__GO_TO_LOGIN_PAGE;
    };
  }, [goToLoginPage]);
  return <AppContext.Provider value={{ messages, fetchMessages, noteAndLink, fetchNoteAndLink, clearAppData, goToLoginPage }}>{children}</AppContext.Provider>;
};

export const useApp = (): AppContextProps => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useApp must be used within an AppProvider");
  }
  return context;
};
