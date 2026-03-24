import type { Conversation } from '../../types';
import { Avatar } from '../ui/Avatar';
import { cn } from '../../utils/cn';
import { formatDateShort } from '../../utils/formatters';

interface ConversationListItemProps {
  conversation: Conversation;
  isActive?: boolean;
  onClick: () => void;
}

export function ConversationListItem({ conversation, isActive, onClick }: ConversationListItemProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full flex items-center gap-3 p-3 rounded-xl transition-colors text-left',
        isActive ? 'bg-primary/10' : 'hover:bg-surface-muted'
      )}
    >
      <div className="relative flex-shrink-0">
        <Avatar
          src={conversation.otherUser.avatar}
          name={conversation.otherUser.name}
          size="md"
        />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-0.5">
          <p className={cn('text-sm font-semibold truncate', isActive ? 'text-primary' : 'text-neutral-800')}>
            {conversation.otherUser.name}
          </p>
          {conversation.lastMessageAt && (
            <span className="text-xs text-neutral-400 flex-shrink-0 ml-2">
              {formatDateShort(conversation.lastMessageAt)}
            </span>
          )}
        </div>
        <p className="text-xs text-neutral-500 truncate">{conversation.propertyName}</p>
        {conversation.lastMessage && (
          <p className="text-xs text-neutral-400 truncate mt-0.5">{conversation.lastMessage}</p>
        )}
      </div>

      {conversation.unreadCount > 0 && (
        <div className="flex-shrink-0 w-5 h-5 bg-primary rounded-full flex items-center justify-center">
          <span className="text-xs text-white font-semibold">{conversation.unreadCount}</span>
        </div>
      )}
    </button>
  );
}
