
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
import { InitialGreeting } from './InitialGreeting'; // New import

interface ChatInterfaceProps {
  messages: Message[];
  onSendMessage: (text: string) => void;
  currentSessionTitle: string;
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

  const showSpecialGreeting = !isLoading && messages.length === 1 && messages[0].sender === 'bot' && messages[0].text === "Hello! How can I help you today?";

  // Input is centered if loading, or if it's the special greeting case (initial bot message only)
  const isInputCentered = isLoading || showSpecialGreeting;

  const inputWrapperClass = cn(
    "p-4 border-t bg-background",
    isInputCentered
      ? "absolute bottom-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[calc(100%-2rem)] sm:w-full max-w-2xl px-4" // Centered input with max-width
      : "sticky bottom-0" // Input at bottom for ongoing chats
  );

  return (
    <div className="flex flex-col h-full bg-background relative">
      <header className="p-4 border-b flex items-center justify-between sticky top-0 bg-background z-10">
        {isMobile && ( 
          <Button variant="ghost" size="icon" onClick={toggleSidebar} className="mr-2 md:hidden">
            <PanelLeft className="h-5 w-5" />
          </Button>
        )}
        <h1 className="text-xl font-semibold text-foreground truncate flex-1">{currentSessionTitle}</h1>
      </header>

      {showSpecialGreeting ? (
        <div className="flex-grow flex"> {/* Container for InitialGreeting to take full space */}
          <InitialGreeting />
        </div>
      ) : (
        <ScrollArea className="flex-grow p-4" ref={scrollAreaRef}>
          <div className="space-y-4 pb-20"> {/* pb-20 for when input is at bottom */}
            {isLoading && <p className="text-center text-muted-foreground">Loading chat...</p>}
            {!isLoading && messages.map((msg) => (
              <MessageBubble key={msg.id} message={msg} />
            ))}
          </div>
        </ScrollArea>
      )}

      <div className={inputWrapperClass}>
        <form onSubmit={handleSendMessage} className="w-full">
          <div className="flex items-center gap-2 max-w-full mx-auto">
            <div className="relative flex-grow flex items-center">
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
                placeholder="Type your message..."
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                className="flex-grow bg-card border-input focus:ring-primary rounded-xl pl-10 pr-3 py-2 w-full" 
                disabled={isLoading}
              />
            </div>
            <Button
              type="submit"
              size="icon"
              className="bg-primary hover:bg-primary/90 rounded-xl text-primary-foreground" 
              disabled={isLoading || !inputValue.trim()}
              aria-label="Send message"
            >
              <Send className="h-5 w-5" />
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
