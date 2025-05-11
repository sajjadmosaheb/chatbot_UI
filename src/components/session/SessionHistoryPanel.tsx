
"use client";

import type { Session } from '@/lib/types';
import { SessionItem } from './SessionItem';
import { 
  Sidebar, 
  SidebarHeader, 
  SidebarContent, 
  SidebarMenu, 
  SidebarMenuItem,
  SidebarTrigger // Imported SidebarTrigger
} from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PlusCircle, Search } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import React, { useState } from 'react'; 
import { cn } from '@/lib/utils';

interface SessionHistoryPanelProps {
  sessions: Session[];
  activeSessionId: string | null;
  onSelectSession: (sessionId: string) => void;
  onCreateNewSession: () => void;
  onDeleteSession: (sessionId: string) => void;
  isInitialized: boolean;
}

export function SessionHistoryPanel({
  sessions,
  activeSessionId,
  onSelectSession,
  onCreateNewSession,
  onDeleteSession,
  isInitialized
}: SessionHistoryPanelProps) {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredSessions = searchTerm.trim() === '' 
    ? sessions 
    : sessions.filter(session => {
        const searchTermLower = searchTerm.toLowerCase();
        // Check title
        if (session.title.toLowerCase().includes(searchTermLower)) {
          return true;
        }
        // Check message content
        if (session.messages.some(message => message.text.toLowerCase().includes(searchTermLower))) {
          return true;
        }
        return false;
      });

  return (
    <Sidebar side="left" variant="sidebar" collapsible="icon">
      <SidebarHeader className="flex flex-col p-3 border-b border-sidebar-border">
        <div className="flex items-center justify-between w-full mb-2">
          <h2 className="text-lg font-semibold text-sidebar-foreground group-data-[collapsible=icon]:hidden">Academix</h2>
          <div className="flex items-center gap-1">
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8 text-sidebar-foreground hover:text-sidebar-accent-foreground group-data-[collapsible=icon]:hidden" // Create button hidden when sidebar is icon-only
              onClick={onCreateNewSession}
              aria-label="New Conversation"
            >
              <PlusCircle className="h-5 w-5" />
            </Button>
             {/* SidebarTrigger always visible for manual toggle */}
            <SidebarTrigger className="h-8 w-8 text-sidebar-foreground hover:text-sidebar-accent-foreground" /> 
          </div>
        </div>
        <div className="relative group-data-[collapsible=icon]:hidden w-full">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search chats..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8 h-8 bg-sidebar-accent/50 border-sidebar-border focus:bg-sidebar-accent text-sidebar-foreground placeholder:text-muted-foreground rounded-md"
          />
        </div>
      </SidebarHeader>
      <SidebarContent className="p-0">
        <ScrollArea className={cn("h-full", "group-data-[collapsible=icon]:hidden")}>
          <SidebarMenu className="p-2">
            {!isInitialized && (
                <SidebarMenuItem className="p-2 text-sm text-muted-foreground">Loading sessions...</SidebarMenuItem>
            )}
            {isInitialized && sessions.length === 0 && (
              <SidebarMenuItem className="p-2 text-sm text-muted-foreground">No sessions yet. Start a new chat!</SidebarMenuItem>
            )}
             {isInitialized && sessions.length > 0 && filteredSessions.length === 0 && searchTerm && (
              <SidebarMenuItem className="p-2 text-sm text-muted-foreground">No sessions match your search.</SidebarMenuItem>
            )}
            {isInitialized && filteredSessions.map((session) => (
              <SidebarMenuItem key={session.id}>
                <SessionItem
                  session={session}
                  isActive={session.id === activeSessionId}
                  onSelect={() => {
                    onSelectSession(session.id);
                  }}
                  onDelete={() => onDeleteSession(session.id)}
                />
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </ScrollArea>
      </SidebarContent>
    </Sidebar>
  );
}
