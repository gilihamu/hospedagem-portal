import { create } from 'zustand';

interface ChatState {
  activeConversationId: string | null;
  unreadCount: number;
}

interface ChatActions {
  setActiveConversation: (id: string | null) => void;
  incrementUnread: () => void;
  resetUnread: () => void;
  setUnreadCount: (count: number) => void;
}

export const useChatStore = create<ChatState & ChatActions>((set) => ({
  activeConversationId: null,
  unreadCount: 0,

  setActiveConversation: (id) => set({ activeConversationId: id }),
  incrementUnread: () => set((state) => ({ unreadCount: state.unreadCount + 1 })),
  resetUnread: () => set({ unreadCount: 0 }),
  setUnreadCount: (count) => set({ unreadCount: count }),
}));
