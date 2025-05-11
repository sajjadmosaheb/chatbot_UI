import type { Message } from '@/lib/types';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

interface MessageBubbleProps {
  message: Message;
}

export function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.sender === 'user';
  const isBot = message.sender === 'bot';
  const isSystem = message.sender === 'system';

  if (isSystem) {
    return (
      <div className="flex justify-center my-2">
        <div className="text-xs text-muted-foreground italic px-3 py-1 bg-muted/50 rounded-full">
          {message.text}
        </div>
      </div>
    );
  }

  return (
    <div className={cn('flex my-2', isUser ? 'justify-end' : 'justify-start')}>
      <div
        className={cn(
          'max-w-[70%] p-3 rounded-xl shadow-md',
          isUser ? 'bg-primary text-primary-foreground rounded-br-none' : 'bg-secondary text-secondary-foreground rounded-bl-none'
        )}
      >
        <p className="text-sm break-words">{message.text}</p>
        <p className={cn(
            "text-xs mt-1",
            isUser ? "text-primary-foreground/70 text-right" : "text-secondary-foreground/70 text-left"
          )}>
          {format(new Date(message.timestamp), 'p')}
        </p>
      </div>
    </div>
  );
}
