import { create } from "zustand";

interface AppState {
  messages: any
  setMessages: (messages: any) => void
  noteAndLink: any
  setNoteAndLink: (noteAndLink: any) => void
}

export const useAppStore = create<AppState>((set) => ({
  messages: localStorage.getItem("messages")
    ? JSON.parse(localStorage.getItem("messages") ?? '{}')
    : null,

  setMessages: (messages: any) => {
    if(messages){
      localStorage.setItem("messages", JSON.stringify(messages));
    }
    else{
      localStorage.removeItem("messages");
    }
    set({ messages });
  },
  noteAndLink: localStorage.getItem("noteAndLink")
        ? JSON.parse(localStorage.getItem("noteAndLink") ?? '{}')
        : null,

  setNoteAndLink: (noteAndLink: any) => {
      if (noteAndLink) {
          localStorage.setItem("noteAndLink", JSON.stringify(noteAndLink));
      }
      else {
          localStorage.removeItem("noteAndLink");
      }
      set({ noteAndLink });
  },
}));
