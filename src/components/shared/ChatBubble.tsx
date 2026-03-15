import type { Message } from '../../types';
import { formatDateTime } from '../../utils/formatters';
import { cn } from '../../utils/cn';

interface ChatBubbleProps {
  message: Message;
  isSent: boolean;
}

export function ChatBubble({ message, isSent }: ChatBubbleProps) {
  return (
    <div className={cn('flex flex-col mb-3', isSent ? 'items-end' : 'items-start')}>
      <div
        className={cn(
          'max-w-xs sm:max-w-sm lg:max-w-md px-4 py-2.5 rounded-2xl text-sm',
          isSent
            ? 'bg-primary text-white rounded-br-sm'
            : 'bg-neutral-100 text-neutral-900 rounded-bl-sm'
        )}
      >
        {message.content}
      </div>
      <span className="text-xs text-neutral-400 mt-1 mx-1">
        {formatDateTime(message.createdAt)}
      </span>
    </div>
  );
}
