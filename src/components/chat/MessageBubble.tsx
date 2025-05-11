
"use client";

import type { Message } from '@/lib/types';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { ThumbsUp, ThumbsDown, Copy } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import React, { useState } from 'react';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";

interface MessageBubbleProps {
  message: Message;
}

export function MessageBubble({ message }: MessageBubbleProps) {
  const { toast } = useToast();
  const [liked, setLiked] = useState(false);
  const [disliked, setDisliked] = useState(false);

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

  const handleLike = () => {
    setLiked(!liked);
    if (disliked && !liked) setDisliked(false); 
  }

  const handleDislike = () => {
    setDisliked(!disliked);
    if (liked && !disliked) setLiked(false); 
  }

  const isUser = message.sender === 'user';
  const isBot = message.sender === 'bot';
  const isSystem = message.sender === 'system';
  const messageDir = message.direction || 'ltr';

  const extractCodeContent = (text: string): string => {
    if (text.includes("```")) {
      const firstMarker = text.indexOf("```");
      const lastMarker = text.lastIndexOf("```");

      if (firstMarker !== -1 && lastMarker > firstMarker + 2) {
        let code = text.substring(firstMarker + 3, lastMarker).trim();
        const lines = code.split('\n');
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
    const isSingleCodeBlock = isBot && text.startsWith("```") && text.endsWith("```") && text.indexOf("```") === text.lastIndexOf("```", text.length - 4);
    const hasCodeBlocks = isBot && text.includes("```");

    if (isSingleCodeBlock || (hasCodeBlocks && !text.replace(/```[\s\S]*?```/g, '').trim())) {
      const codeContent = extractCodeContent(text);
      return (
        <div className="my-2 p-3 border border-dashed border-border rounded-lg bg-card shadow-sm text-card-foreground" dir="ltr"> {/* Code blocks are usually LTR */}
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs font-semibold text-muted-foreground">Code Snippet</span>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-foreground" onClick={() => handleCopy(codeContent, 'code')} aria-label="Copy code">
                  <Copy className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="top">
                <p>Copy</p>
              </TooltipContent>
            </Tooltip>
          </div>
          <pre className="text-sm whitespace-pre-wrap bg-transparent p-0 overflow-x-auto">
            <code className="font-mono">{codeContent}</code>
          </pre>
        </div>
      );
    }
    
    if (hasCodeBlocks) {
      const parts = text.split(/(```[\s\S]*?```)/g);
      return parts.map((part, index) => {
        if (part.startsWith("```") && part.endsWith("```")) {
          const codeContent = extractCodeContent(part);
          return (
            <div key={index} className="my-2 p-3 border border-dashed border-border rounded-lg bg-card shadow-sm text-card-foreground" dir="ltr"> {/* Code blocks LTR */}
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs font-semibold text-muted-foreground">Code Snippet</span>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-foreground" onClick={() => handleCopy(codeContent, 'code')} aria-label="Copy code">
                      <Copy className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="top">
                    <p>Copy</p>
                  </TooltipContent>
                </Tooltip>
              </div>
              <pre className="text-sm whitespace-pre-wrap bg-transparent p-0 overflow-x-auto">
                <code className="font-mono">{codeContent}</code>
              </pre>
            </div>
          );
        }
        // Apply direction to non-code parts
        return part.split('\n').map((line, lineIdx) => (
          <p key={`${index}-${lineIdx}`} className="text-sm break-words leading-relaxed my-0 py-0" dir={messageDir}>{line || <>&nbsp;</>}</p>
        ));
      }).flat();
    }

    return <p className="text-sm break-words leading-relaxed" dir={messageDir}>{text}</p>;
  };


  if (isSystem) {
    return (
      <div className="flex justify-center my-2">
        <div className="text-xs text-muted-foreground italic px-3 py-1 bg-muted/50 rounded-full" dir="ltr"> {/* System messages usually LTR */}
          {message.text}
        </div>
      </div>
    );
  }

  const ActionButtons = ({ isUserMsg }: { isUserMsg: boolean }) => (
    <div className={cn("flex items-center space-x-1 opacity-100 group-hover:opacity-100 transition-opacity duration-150", isUserMsg ? "ml-2" : "mr-2")}>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleCopy(message.text)} aria-label="Copy message">
            <Copy className={cn("h-4 w-4", isUserMsg ? "text-muted-foreground hover:text-foreground" : "text-muted-foreground hover:text-foreground")} />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="top">
          <p>Copy</p>
        </TooltipContent>
      </Tooltip>
      {!isUserMsg && (
        <>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleLike} aria-label="Like message">
                <ThumbsUp className={cn("h-4 w-4", liked ? "text-primary fill-primary" : "text-muted-foreground hover:text-primary")} />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="top">
              <p>Good response</p>
            </TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleDislike} aria-label="Dislike message">
                <ThumbsDown className={cn("h-4 w-4", disliked ? "text-destructive fill-destructive" : "text-muted-foreground hover:text-destructive")} />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="top">
              <p>Bad response</p>
            </TooltipContent>
          </Tooltip>
        </>
      )}
    </div>
  );

  return (
    <TooltipProvider>
      <div className={cn('flex flex-col my-2 group', isUser ? 'items-end' : 'items-start')}>
        <div
          className={cn(
            'max-w-[75%] p-3',
            isUser
              ? 'bg-primary text-primary-foreground shadow-md rounded-xl rounded-br-none'
              : 'bg-transparent text-foreground shadow-none' 
          )}
          dir={messageDir} // Apply direction to the bubble itself for alignment
        >
          {renderMessageText(message.text)}
        </div>
        <div className={cn(
            "flex items-center mt-1",
            isUser ? "justify-end" : "justify-start w-full max-w-[75%]"
          )}>
            {isBot && <ActionButtons isUserMsg={false} />}
            <p className={cn(
              "text-xs",
              isUser ? "text-muted-foreground mr-2" : "text-muted-foreground"
            )}>
              {format(new Date(message.timestamp), 'p')}
            </p>
            {isUser && <ActionButtons isUserMsg={true} />}
          </div>
      </div>
    </TooltipProvider>
  );
}
