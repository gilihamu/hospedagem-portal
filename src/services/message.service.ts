import type { Conversation, Message } from '../types';
import { api } from '../lib/api';
import { mockConversations, mockMessages } from '../mocks/data';
import { getItem, setItem } from '../utils/storage';

const CONV_KEY = 'hbs_conversations';
const MSG_KEY = 'hbs_messages';
const USE_API = !!import.meta.env.VITE_API_URL;

function getAllConversations(): Conversation[] {
  const stored = getItem<Conversation[]>(CONV_KEY) || [];
  const storedIds = new Set(stored.map((c) => c.id));
  const mockFiltered = mockConversations.filter((c) => !storedIds.has(c.id));
  return [...mockFiltered, ...stored];
}

function getAllMessages(): Message[] {
  const stored = getItem<Message[]>(MSG_KEY) || [];
  const storedIds = new Set(stored.map((m) => m.id));
  const mockFiltered = mockMessages.filter((m) => !storedIds.has(m.id));
  return [...mockFiltered, ...stored];
}

export interface SendMessageData {
  conversationId: string;
  senderId: string;
  senderName: string;
  senderAvatar?: string;
  content: string;
}

export const messageService = {
  async getConversations(userId: string): Promise<Conversation[]> {
    if (USE_API) {
      try {
        return await api.get<Conversation[]>('/conversations');
      } catch { /* fallback */ }
    }
    return getAllConversations()
      .filter((c) => c.participants.includes(userId))
      .sort((a, b) => {
        const aTime = a.lastMessageAt ? new Date(a.lastMessageAt).getTime() : 0;
        const bTime = b.lastMessageAt ? new Date(b.lastMessageAt).getTime() : 0;
        return bTime - aTime;
      });
  },

  async getMessages(conversationId: string): Promise<Message[]> {
    if (USE_API) {
      try {
        // Backend MessageDto uses isRead instead of read
        const apiData = await api.get<Array<Message & { isRead?: boolean }>>(`/conversations/${conversationId}/messages`);
        return apiData.map((m) => ({
          ...m,
          read: m.isRead ?? m.read ?? false,
        }));
      } catch { /* fallback */ }
    }
    return getAllMessages()
      .filter((m) => m.conversationId === conversationId)
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  },

  async sendMessage(data: SendMessageData): Promise<Message> {
    if (USE_API) {
      try {
        return await api.post<Message>(`/conversations/${data.conversationId}/messages`, {
          content: data.content,
        });
      } catch { /* fallback */ }
    }
    const newMessage: Message = {
      id: `msg${Date.now()}`,
      conversationId: data.conversationId,
      senderId: data.senderId,
      senderName: data.senderName,
      senderAvatar: data.senderAvatar,
      content: data.content,
      createdAt: new Date().toISOString(),
      read: false,
    };

    const stored = getItem<Message[]>(MSG_KEY) || [];
    setItem(MSG_KEY, [...stored, newMessage]);

    // Update conversation's last message
    const storedConvs = getItem<Conversation[]>(CONV_KEY) || [];
    const allConvs = getAllConversations();
    const conv = allConvs.find((c) => c.id === data.conversationId);
    if (conv) {
      const updatedConv = { ...conv, lastMessage: data.content, lastMessageAt: newMessage.createdAt };
      const existingIdx = storedConvs.findIndex((c) => c.id === data.conversationId);
      if (existingIdx >= 0) {
        storedConvs[existingIdx] = updatedConv;
      } else {
        storedConvs.push(updatedConv);
      }
      setItem(CONV_KEY, storedConvs);
    }

    return newMessage;
  },

  async markAsRead(conversationId: string, userId: string): Promise<void> {
    if (USE_API) {
      try {
        await api.post(`/conversations/${conversationId}/read`);
        return;
      } catch { /* fallback */ }
    }
    const stored = getItem<Message[]>(MSG_KEY) || [];
    const updated = stored.map((m) =>
      m.conversationId === conversationId && m.senderId !== userId ? { ...m, read: true } : m
    );
    setItem(MSG_KEY, updated);

    const storedConvs = getItem<Conversation[]>(CONV_KEY) || [];
    const mockConv = mockConversations.find((c) => c.id === conversationId);
    const convIdx = storedConvs.findIndex((c) => c.id === conversationId);
    if (convIdx >= 0) {
      storedConvs[convIdx] = { ...storedConvs[convIdx], unreadCount: 0 };
      setItem(CONV_KEY, storedConvs);
    } else if (mockConv) {
      setItem(CONV_KEY, [...storedConvs, { ...mockConv, unreadCount: 0 }]);
    }
  },

  async createConversation(
    data: Omit<Conversation, 'id' | 'unreadCount' | 'lastMessage' | 'lastMessageAt'>
  ): Promise<Conversation> {
    if (USE_API) {
      try {
        return await api.post<Conversation>('/conversations', data);
      } catch { /* fallback */ }
    }
    const newConv: Conversation = { ...data, id: `conv${Date.now()}`, unreadCount: 0 };
    const stored = getItem<Conversation[]>(CONV_KEY) || [];
    setItem(CONV_KEY, [...stored, newConv]);
    return newConv;
  },

  async getOrCreateConversation(
    userId: string, otherUserId: string, propertyId: string, propertyName: string
  ): Promise<Conversation> {
    const existing = getAllConversations().find(
      (c) => c.participants.includes(userId) && c.participants.includes(otherUserId) && c.propertyId === propertyId
    );
    if (existing) return existing;
    return messageService.createConversation({
      propertyId, propertyName,
      participants: [userId, otherUserId],
      otherUser: { id: otherUserId, name: '' },
    });
  },
};
