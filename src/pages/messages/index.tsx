import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Send, ArrowLeft, MessageSquare } from 'lucide-react';
import { useAuthStore } from '../../store/auth.store';
import { useConversations, useMessages, useSendMessage, useMarkAsRead } from '../../hooks/useMessages';
import { ConversationListItem } from '../../components/shared/ConversationListItem';
import { ChatBubble } from '../../components/shared/ChatBubble';
import { Avatar } from '../../components/ui/Avatar';
import { EmptyState } from '../../components/ui/EmptyState';
import { Spinner } from '../../components/ui/Spinner';
import { useIsMobile } from '../../hooks/useMediaQuery';
import { useChatStore } from '../../store/chat.store';
import { messageDetailRoute } from '../../router/routes';
import { format, isToday, isYesterday } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { Message } from '../../types';

function formatSeparatorDate(date: string): string {
  const d = new Date(date);
  if (isToday(d)) return 'Hoje';
  if (isYesterday(d)) return 'Ontem';
  return format(d, 'dd/MM/yyyy', { locale: ptBR });
}

function groupMessagesByDate(messages: Message[]): Array<{ date: string; messages: Message[] }> {
  const groups: Record<string, Message[]> = {};
  messages.forEach((m) => {
    const key = format(new Date(m.createdAt), 'yyyy-MM-dd');
    if (!groups[key]) groups[key] = [];
    groups[key].push(m);
  });
  return Object.entries(groups).map(([date, msgs]) => ({ date, messages: msgs }));
}

function ChatView({
  conversationId,
  userId,
  onBack,
}: {
  conversationId: string;
  userId: string;
  onBack?: () => void;
}) {
  const { data: conversations } = useConversations(userId);
  const { data: messages, isLoading } = useMessages(conversationId);
  const sendMessage = useSendMessage();
  const markAsRead = useMarkAsRead();
  const [inputText, setInputText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const { user } = useAuthStore();

  const conversation = conversations?.find((c) => c.id === conversationId);
  const grouped = messages ? groupMessagesByDate(messages) : [];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (conversationId && userId) {
      markAsRead.mutate({ conversationId, userId });
    }
  }, [conversationId, userId]);

  const handleSend = async () => {
    if (!inputText.trim() || !user) return;
    const content = inputText.trim();
    setInputText('');
    try {
      await sendMessage.mutateAsync({
        conversationId,
        senderId: user.id,
        senderName: user.name,
        senderAvatar: user.avatar,
        content,
      });
    } catch {}
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Top bar */}
      <div className="h-16 px-4 flex items-center gap-3 border-b border-surface-border bg-white flex-shrink-0">
        {onBack && (
          <button onClick={onBack} className="p-2 rounded-lg hover:bg-neutral-100 transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
        )}
        {conversation?.otherUser && (
          <>
            <Avatar
              src={conversation.otherUser.avatar}
              name={conversation.otherUser.name}
              size="sm"
            />
            <div className="min-w-0">
              <p className="font-semibold text-neutral-800 text-sm truncate">{conversation.otherUser.name}</p>
              <p className="text-xs text-neutral-400 truncate">{conversation.propertyName}</p>
            </div>
          </>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4">
        {isLoading ? (
          <div className="flex justify-center py-8"><Spinner /></div>
        ) : grouped.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-neutral-400">
            <MessageSquare className="w-10 h-10 mb-3" />
            <p className="text-sm">Nenhuma mensagem ainda</p>
            <p className="text-xs">Seja o primeiro a enviar uma mensagem!</p>
          </div>
        ) : (
          <>
            {grouped.map(({ date, messages: dayMessages }) => (
              <div key={date}>
                <div className="flex items-center gap-3 my-4">
                  <div className="flex-1 h-px bg-surface-border" />
                  <span className="text-xs text-neutral-400">{formatSeparatorDate(date + 'T12:00:00')}</span>
                  <div className="flex-1 h-px bg-surface-border" />
                </div>
                {dayMessages.map((msg) => (
                  <ChatBubble key={msg.id} message={msg} isSent={msg.senderId === userId} />
                ))}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Input */}
      <div className="p-4 border-t border-surface-border bg-white flex-shrink-0">
        <div className="flex gap-2 items-end">
          <textarea
            ref={inputRef}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Escreva uma mensagem... (Enter para enviar)"
            rows={1}
            className="flex-1 input-base resize-none max-h-32"
            style={{ minHeight: '40px' }}
          />
          <button
            onClick={handleSend}
            disabled={!inputText.trim() || sendMessage.isPending}
            className="h-10 w-10 flex-shrink-0 bg-primary text-white rounded-lg flex items-center justify-center hover:bg-primary-light transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {sendMessage.isPending ? (
              <Spinner size="sm" color="white" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export function MessagesPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { activeConversationId, setActiveConversation } = useChatStore();
  const isMobile = useIsMobile();

  const { data: conversations, isLoading } = useConversations(user?.id);

  const selectedId = id || activeConversationId;

  const handleSelectConversation = (convId: string) => {
    setActiveConversation(convId);
    navigate(messageDetailRoute(convId));
  };

  const handleBack = () => {
    setActiveConversation(null);
    navigate('/messages');
  };

  if (!user) return null;

  // Mobile: show chat if conversation selected, else list
  if (isMobile) {
    if (selectedId) {
      return (
        <div className="h-[calc(100vh-4rem)]">
          <ChatView
            conversationId={selectedId}
            userId={user.id}
            onBack={handleBack}
          />
        </div>
      );
    }
    return (
      <div className="container-app py-4">
        <h1 className="text-xl font-bold text-neutral-900 mb-4">Mensagens</h1>
        {isLoading ? (
          <div className="flex justify-center py-12"><Spinner /></div>
        ) : !conversations || conversations.length === 0 ? (
          <EmptyState
            icon={MessageSquare}
            title="Nenhuma conversa ainda"
            description="Suas conversas com anfitriões e hóspedes aparecerão aqui."
          />
        ) : (
          <div className="space-y-1">
            {conversations.map((conv) => (
              <ConversationListItem
                key={conv.id}
                conversation={conv}
                isActive={conv.id === selectedId}
                onClick={() => handleSelectConversation(conv.id)}
              />
            ))}
          </div>
        )}
      </div>
    );
  }

  // Desktop: two-panel
  return (
    <div className="h-[calc(100vh-4rem)] flex">
      {/* Left panel */}
      <div className="w-80 flex-shrink-0 border-r border-surface-border flex flex-col bg-white">
        <div className="p-4 border-b border-surface-border">
          <h1 className="font-bold text-neutral-900">Mensagens</h1>
        </div>
        <div className="flex-1 overflow-y-auto p-3">
          {isLoading ? (
            <div className="flex justify-center py-8"><Spinner /></div>
          ) : !conversations || conversations.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-neutral-400">
              <MessageSquare className="w-8 h-8 mb-2" />
              <p className="text-sm">Nenhuma conversa</p>
            </div>
          ) : (
            conversations.map((conv) => (
              <ConversationListItem
                key={conv.id}
                conversation={conv}
                isActive={conv.id === selectedId}
                onClick={() => handleSelectConversation(conv.id)}
              />
            ))
          )}
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex flex-col min-w-0">
        {selectedId ? (
          <ChatView
            conversationId={selectedId}
            userId={user.id}
          />
        ) : (
          <EmptyState
            icon={MessageSquare}
            title="Selecione uma conversa"
            description="Escolha uma conversa na lista ao lado para começar a trocar mensagens."
          />
        )}
      </div>
    </div>
  );
}
