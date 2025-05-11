
"use client";

import type { Message } from '@/lib/types';
import { MessageBubble } from './MessageBubble';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Send, Paperclip } from 'lucide-react';
import React, { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { InitialGreeting } from './InitialGreeting';
import { ThemeToggle } from '@/components/ThemeToggle';
import { ExamplePromptsGrid } from './ExamplePromptsGrid';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from '@/components/ui/label';
import { getTextDirection } from '@/lib/languageUtils';

interface ChatInterfaceProps {
  messages: Message[];
  onSendMessage: (text: string) => void;
  currentSessionTitle: string;
  isLoading: boolean;
}

export function ChatInterface({ messages, onSendMessage, currentSessionTitle, isLoading }: ChatInterfaceProps) {
  const [inputValue, setInputValue] = useState('');
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const [isAttachmentDialogOpen, setIsAttachmentDialogOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
    onSendMessage(promptText.trim());
    setInputValue(''); 
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setSelectedFile(event.target.files[0]);
      // For now, just log the file. Actual upload would go here.
      console.log("Selected file:", event.target.files[0].name);
    }
  };

  const handleAttachmentUpload = () => {
    if (selectedFile) {
      // Simulate sending a file message. 
      // In a real app, you'd upload the file and get a URL, or send as data URI.
      onSendMessage(`Attached file: ${selectedFile.name}`);
      setSelectedFile(null);
      if(fileInputRef.current) fileInputRef.current.value = ""; // Reset file input
      setIsAttachmentDialogOpen(false);
    }
  };

  const isNewChatScreen = !isLoading && messages.length === 0;
  const inputDir = getTextDirection(inputValue);

  return (
    <TooltipProvider>
      <div className="flex flex-col h-full bg-background relative">
        <header className="p-4 border-b flex items-center justify-end sticky top-0 bg-background z-10 h-16">
          <ThemeToggle />
        </header>

        {isNewChatScreen ? (
          <div className="flex-grow flex flex-col items-center justify-start p-4 pt-16 space-y-12 overflow-y-auto">
            <InitialGreeting username="Sajjad" /> 
            <ExamplePromptsGrid onPromptClick={handleExamplePromptClick} />
          </div>
        ) : (
          <ScrollArea className="flex-grow p-4" ref={scrollAreaRef}>
            <div className={cn("space-y-4", messages.length > 0 ? "pb-[calc(4.5rem+1rem)]" : "pb-4")}>
              {isLoading && messages.length === 0 && <p className="text-center text-muted-foreground">Loading chat...</p>}
              {messages.map((msg) => (
                 <MessageBubble key={msg.id} message={msg} />
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
              <Dialog open={isAttachmentDialogOpen} onOpenChange={setIsAttachmentDialogOpen}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <DialogTrigger asChild>
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
                    </DialogTrigger>
                  </TooltipTrigger>
                  <TooltipContent side="top">
                    <p>Add photos and files</p>
                  </TooltipContent>
                </Tooltip>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Attach Files</DialogTitle>
                    <DialogDescription>
                      Select a photo or document to attach to your message.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="file-upload" className="text-right">
                        File
                      </Label>
                      <Input 
                        id="file-upload" 
                        type="file" 
                        ref={fileInputRef}
                        className="col-span-3" 
                        onChange={handleFileChange} 
                        accept="image/*,application/pdf,.doc,.docx,.txt,.csv" // Example accepted types
                      />
                    </div>
                    {selectedFile && <p className="text-sm text-muted-foreground col-span-4">Selected: {selectedFile.name}</p>}
                  </div>
                  <DialogFooter>
                    <DialogClose asChild>
                      <Button type="button" variant="outline" onClick={() => {
                        setSelectedFile(null);
                        if(fileInputRef.current) fileInputRef.current.value = "";
                      }}>
                        Cancel
                      </Button>
                    </DialogClose>
                    <Button type="button" onClick={handleAttachmentUpload} disabled={!selectedFile}>
                      Upload
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
              <Input
                type="text"
                placeholder="Ask Academix..."
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                className="flex-grow bg-card border-input focus:ring-primary rounded-full py-3 pl-12 pr-12 text-base"
                disabled={isLoading}
                dir={inputDir}
              />
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    type="submit"
                    size="icon"
                    className="bg-primary hover:bg-primary/90 rounded-full text-primary-foreground absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8"
                    disabled={isLoading || !inputValue.trim()}
                    aria-label="Send message"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="top">
                  <p>Send message</p>
                </TooltipContent>
              </Tooltip>
            </div>
          </form>
        </div>
      </div>
    </TooltipProvider>
  );
}
