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
    // If no clear ```blocks```, or only one ```, assume the part after a single ``` might be code.
    // This is a fallback, proper markdown parsing is better.
    const singleMarker = text.indexOf("```");
    if (singleMarker !== -1 && text.lastIndexOf("```") === singleMarker) {
        return text.substring(singleMarker + 3).trim();
    }
    return text; // Return original if no clear code block or if it's not primarily a code block
  };
  
  const renderMessageText = (text: string) => {
    // Check if the message IS primarily a code block
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
    // For regular text, or text with inline code, just render it.
    // Proper markdown rendering for inline code, bold, etc. would require a library.
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
      "absolute top-1 right-1 z-10 flex opacity-0 group-hover:opacity-100 transition-opacity duration-150 rounded-md p-0.5 bg-transparent" // Colorless button container
      )}>
      <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleCopy(message.text)} aria-label="Copy message">
        <Copy className={cn("h-3 w-3", isUser ? "text-primary-foreground/80 hover:text-primary-foreground" : "text-muted-foreground hover:text-foreground")} />
      </Button>
      {isBot && (
        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setLiked(!liked)} aria-label="Like message">
          <ThumbsUp className={cn("h-3 w-3", liked ? "text-primary fill-primary" : "text-muted-foreground hover:text-primary")} />
        </Button>
      )}
    </div>
  );

  return (
    <div className={cn('flex my-2 group relative', isUser ? 'justify-end' : 'justify-start')}>
      <div
        className={cn(
          'max-w-[75%] p-3 rounded-xl', // All messages get rounded-xl
          isUser 
            ? 'bg-primary text-primary-foreground shadow-md rounded-br-none' 
            : 'bg-transparent text-foreground shadow-none', // Bot message: frameless
           'relative' 
        )}
      >
        {renderMessageText(message.text)}
        <ActionButtons />
        
        <p className={cn(
            "text-xs mt-1",
            isUser ? "text-primary-foreground/70 text-right" : "text-muted-foreground text-left"
          )}>
          {format(new Date(message.timestamp), 'p')}
        </p>
      </div>
    </div>
  );
}
