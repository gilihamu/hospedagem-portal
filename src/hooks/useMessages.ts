import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { messageService, type SendMessageData } from '../services/message.service';
import type { Message } from '../types';

export function useConversations(userId?: string) {
  return useQuery({
    queryKey: ['conversations', userId],
    queryFn: () => messageService.getConversations(userId!),
    enabled: !!userId,
    refetchInterval: 3000,
  });
}

export function useMessages(conversationId?: string) {
  return useQuery({
    queryKey: ['messages', conversationId],
    queryFn: () => messageService.getMessages(conversationId!),
    enabled: !!conversationId,
    refetchInterval: 3000,
  });
}

export function useSendMessage() {
  const queryClient = useQueryClient();
  return useMutation<Message, Error, SendMessageData>({
    mutationFn: (data) => messageService.sendMessage(data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['messages', variables.conversationId] });
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    },
  });
}

export function useMarkAsRead() {
  const queryClient = useQueryClient();
  return useMutation<void, Error, { conversationId: string; userId: string }>({
    mutationFn: ({ conversationId, userId }) => messageService.markAsRead(conversationId, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    },
  });
}
