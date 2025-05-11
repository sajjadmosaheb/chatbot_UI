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

  const handleCopy = (textToCopy: string) => {
    navigator.clipboard.writeText(textToCopy)
      .then(() => {
        toast({ title: "Copied to clipboard!" });
      })
      .catch(err => {
        toast({ title: "Failed to copy", description: "Could not copy text to clipboard.", variant: "destructive" });
        console.error('Failed to copy text: ', err);
      });
  };

  const isUser = message.sender === 'user';
  const isBot = message.sender === 'bot';
  const isSystem = message.sender === 'system';

  // Placeholder for code block rendering for bot messages
  const renderMessageText = (text: string) => {
    if (isBot && text.includes("```")) {
      let codeContent = text;
      const firstMarker = text.indexOf("```");
      const lastMarker = text.lastIndexOf("```");

      if (firstMarker !== -1 && lastMarker > firstMarker + 2) {
        codeContent = text.substring(firstMarker + 3, lastMarker).trim();
        const lines = codeContent.split('\n');
        // Basic removal of language hint from first line e.g. "javascript"
        if (lines.length > 0 && /^[a-zA-Z0-9_.-]+$/.test(lines[0].trim()) && lines[0].trim().length < 20 && !lines[0].trim().includes(" ")) {
          lines.shift();
        }
        codeContent = lines.join('\n').trim();
      }
      // If no clear ```blocks```, the original text (potentially with ``` in it) will be used as codeContent

      return (
        <div className="my-2 p-3 border border-dashed border-border rounded-lg bg-card shadow-sm text-card-foreground">
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs font-semibold text-muted-foreground">Code Snippet (Preview)</span>
            <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-foreground" onClick={() => handleCopy(codeContent)} aria-label="Copy code">
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
      "absolute top-1 right-1 z-10 flex opacity-0 group-hover:opacity-100 transition-opacity duration-150 rounded-md p-0.5",
      isUser ? "bg-primary/20 backdrop-blur-sm" : "bg-card/50 backdrop-blur-sm" // Different bg for visibility
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
          'max-w-[75%] p-3', 
          isUser 
            ? 'bg-primary text-primary-foreground shadow-md rounded-xl rounded-br-none' // More curved for user
            : 'bg-transparent text-foreground shadow-none rounded-xl', // Bot is frameless but can have a subtle roundness for content block
           'relative' 
        )}
      >
        {/* Optionally, add sender name or avatar here */}
        {/* {isBot && <p className="text-xs font-semibold mb-1 text-muted-foreground">Academix Bot</p>} */}
        
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
