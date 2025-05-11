
"use client";

import type { Message } from '@/lib/types';
import { MessageBubble } from './MessageBubble';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Send, PanelLeft, Paperclip } from 'lucide-react';
import React, { useState, useRef, useEffect } from 'react';
import { useSidebar } from '@/components/ui/sidebar'; 
import { cn } from '@/lib/utils';
import { InitialGreeting } from './InitialGreeting';
import { ThemeToggle } from '@/components/ThemeToggle';
import { ExamplePromptsGrid } from './ExamplePromptsGrid';

interface ChatInterfaceProps {
  messages: Message[];
  onSendMessage: (text: string) => void;
  currentSessionTitle: string; // Kept for potential future use, but not displayed
  isLoading: boolean; 
}

export function ChatInterface({ messages, onSendMessage, currentSessionTitle, isLoading }: ChatInterfaceProps) {
  const [inputValue, setInputValue] = useState('');
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const { toggleSidebar, isMobile } = useSidebar();

  useEffect(() => {
    if (scrollAreaRef.current) {
      const scrollViewport = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollViewport) {
        scrollViewport.scrollTop = scrollViewport.scrollHeight;
      }
    }
  }, [messages]);

  const handleSendMessage = (e?: React.FormEvent<HTMLFormElement>) => {
    e?.preventDefault();
    if (inputValue.trim()) {
      onSendMessage(inputValue.trim());
      setInputValue('');
    }
  };

  const handleExamplePromptClick = (promptText: string) => {
    setInputValue(promptText);
    // Optionally, auto-send the prompt:
    // onSendMessage(promptText);
    // setInputValue('');
  };

  // Show special greeting and example prompts if not loading, it's the initial bot message, and no user messages yet.
  const isNewChatScreen = !isLoading && messages.length === 1 && messages[0].sender === 'bot' && messages[0].text === "Hello! How can I help you today?";

  return (
    <div className="flex flex-col h-full bg-background relative">
      <header className="p-4 border-b flex items-center justify-between sticky top-0 bg-background z-10 h-16">
        <div className="flex items-center">
          {isMobile && ( 
            <Button variant="ghost" size="icon" onClick={toggleSidebar} className="mr-2 md:hidden">
              <PanelLeft className="h-5 w-5" />
            </Button>
          )}
           {/* Placeholder for potential future elements or to balance the ThemeToggle */}
          <div className="w-8 h-8 md:w-0 md:h-0"></div>
        </div>
        <ThemeToggle />
      </header>

      {isNewChatScreen ? (
        <div className="flex-grow flex flex-col items-center justify-start p-4 pt-16 space-y-12 overflow-y-auto">
          <InitialGreeting username="sajjad" />
          <ExamplePromptsGrid onPromptClick={handleExamplePromptClick} />
        </div>
      ) : (
        <ScrollArea className="flex-grow p-4" ref={scrollAreaRef}>
          <div className={cn("space-y-4", messages.length > 0 ? "pb-[calc(4.5rem+1rem)]" : "pb-4")}> {/* Add padding-bottom for input area */}
            {isLoading && !isNewChatScreen && <p className="text-center text-muted-foreground">Loading chat...</p>}
            {!isLoading && messages.map((msg) => (
              // Do not render the initial "Hello! How can I help you today?" message if we are showing the new chat screen
              (isNewChatScreen && msg.text === "Hello! How can I help you today!" && msg.sender === "bot") 
              ? null 
              : <MessageBubble key={msg.id} message={msg} />
            ))}
          </div>
        </ScrollArea>
      )}

      <div className={cn(
        "p-4 border-t bg-background w-full max-w-3xl mx-auto",
        "sticky bottom-0" 
      )}>
        <form onSubmit={handleSendMessage} className="w-full">
          <div className="relative flex items-center gap-2">
             <Button
                type="button"
                variant="ghost"
                size="icon"
                disabled={isLoading}
                aria-label="Attach file"
                className="absolute left-2 top-1/2 -translate-y-1/2 h-8 w-8 text-muted-foreground hover:text-primary z-10 p-1"
              >
                <Paperclip className="h-5 w-5" />
              </Button>
            <Input
              type="text"
              placeholder="Ask Academix..."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              className="flex-grow bg-card border-input focus:ring-primary rounded-full py-3 pl-12 pr-12 text-base" 
              disabled={isLoading}
            />
            <Button
              type="submit"
              size="icon"
              className="bg-primary hover:bg-primary/90 rounded-full text-primary-foreground absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8" 
              disabled={isLoading || !inputValue.trim()}
              aria-label="Send message"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
