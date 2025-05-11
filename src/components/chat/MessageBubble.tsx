
import type { Message } from '@/lib/types';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { ThumbsUp, Copy } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import React, { useState } from 'react';

interface MessageBubbleProps {
  message: Message;
}

export function MessageBubble({ message }: MessageBubbleProps) {
  const { toast } = useToast();
  const [liked, setLiked] = useState(false);

  const handleCopy = (textToCopy: string, type: 'message' | 'code' = 'message') => {
    navigator.clipboard.writeText(textToCopy)
      .then(() => {
        toast({ title: type === 'code' ? "Code copied!" : "Message copied!" });
      })
      .catch(err => {
        toast({ title: "Failed to copy", description: "Could not copy text to clipboard.", variant: "destructive" });
        console.error('Failed to copy text: ', err);
      });
  };

  const isUser = message.sender === 'user';
  const isBot = message.sender === 'bot';
  const isSystem = message.sender === 'system';

  const extractCodeContent = (text: string): string => {
    if (text.includes("```")) {
      const firstMarker = text.indexOf("```");
      const lastMarker = text.lastIndexOf("```");

      if (firstMarker !== -1 && lastMarker > firstMarker + 2) {
        let code = text.substring(firstMarker + 3, lastMarker).trim();
        const lines = code.split('\n');
        // Basic removal of language hint from first line
        if (lines.length > 0 && /^[a-zA-Z0-9_.-]+$/.test(lines[0].trim()) && lines[0].trim().length < 20 && !lines[0].trim().includes(" ")) {
          lines.shift();
        }
        return lines.join('\n').trim();
      }
    }
    const singleMarker = text.indexOf("```");
    if (singleMarker !== -1 && text.lastIndexOf("```") === singleMarker) {
        return text.substring(singleMarker + 3).trim();
    }
    return text; 
  };
  
  const renderMessageText = (text: string) => {
    const isCodeBlockMessage = isBot && text.startsWith("```") && text.endsWith("```") && text.indexOf("```") !== text.lastIndexOf("```");

    if (isCodeBlockMessage) {
      const codeContent = extractCodeContent(text);
      return (
        <div className="my-2 p-3 border border-dashed border-border rounded-lg bg-card shadow-sm text-card-foreground">
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs font-semibold text-muted-foreground">Code Snippet</span>
            <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-foreground" onClick={() => handleCopy(codeContent, 'code')} aria-label="Copy code">
              <Copy className="h-4 w-4" />
            </Button>
          </div>
          <pre className="text-sm whitespace-pre-wrap bg-transparent p-0 overflow-x-auto">
            <code className="font-mono">{codeContent}</code>
          </pre>
        </div>
      );
    }
    return <p className="text-sm break-words leading-relaxed">{text}</p>;
  };


  if (isSystem) {
    return (
      <div className="flex justify-center my-2">
        <div className="text-xs text-muted-foreground italic px-3 py-1 bg-muted/50 rounded-full">
          {message.text}
        </div>
      </div>
    );
  }

  const ActionButtons = () => (
    <div className={cn(
      "flex items-center space-x-1", 
      )}>
      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleCopy(message.text)} aria-label="Copy message">
        <Copy className={cn("h-4 w-4", isUser ? "text-primary-foreground/80 hover:text-primary-foreground" : "text-muted-foreground hover:text-foreground")} />
      </Button>
      {isBot && (
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setLiked(!liked)} aria-label="Like message">
          <ThumbsUp className={cn("h-4 w-4", liked ? "text-primary fill-primary" : "text-muted-foreground hover:text-primary")} />
        </Button>
      )}
    </div>
  );

  return (
    <div className={cn('flex my-2', isUser ? 'justify-end' : 'justify-start')}>
      <div
        className={cn(
          'max-w-[75%] p-3 rounded-xl flex flex-col', 
          isUser 
            ? 'bg-primary text-primary-foreground shadow-md rounded-br-none' 
            : 'bg-transparent text-foreground shadow-none'
        )}
      >
        <div className="mb-1">
          {renderMessageText(message.text)}
        </div>
        
        <div className={cn(
            "flex items-center w-full mt-1",
            isUser ? "justify-end" : "justify-between" 
          )}>
          {!isUser && ( 
            <>
              <p className="text-xs text-muted-foreground mr-2">
                {format(new Date(message.timestamp), 'p')}
              </p>
              <ActionButtons /> 
            </>
          )}
          {isUser && ( 
            <>
              <ActionButtons />
              <p className="text-xs text-primary-foreground/70 ml-2">
                {format(new Date(message.timestamp), 'p')}
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
