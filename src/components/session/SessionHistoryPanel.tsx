
"use client";

import type { Session } from '@/lib/types';
import { SessionItem } from './SessionItem';
import { 
  Sidebar, 
  SidebarHeader, 
  SidebarContent, 
  SidebarMenu, 
  SidebarMenuItem,
  SidebarTrigger, 
  useSidebar 
} from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PlusCircle, Search, PanelLeft } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import React, { useState } from 'react'; 
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";

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
  const { state: sidebarState, isMobile, openMobile: isSidebarOpenMobile } = useSidebar();

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

  const getSidebarToggleTooltipText = () => {
    if (isMobile) {
      return isSidebarOpenMobile ? "Close sidebar" : "Open sidebar";
    }
    return sidebarState === 'expanded' ? "Collapse sidebar" : "Expand sidebar";
  };
  
  const getNewConversationTooltipText = () => "New Conversation";


  return (
    <TooltipProvider>
      <Sidebar side="left" variant="sidebar" collapsible="icon">
        <SidebarHeader className="flex flex-col p-3 group-data-[collapsible=icon]:p-0 border-b border-sidebar-border">
          <div className="flex items-center justify-between w-full group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:mb-0 mb-2">
            <h2 className="text-lg font-semibold text-sidebar-foreground group-data-[collapsible=icon]:hidden">Academix</h2>
            {/* Icon container */}
            <div className="flex items-center group-data-[collapsible=icon]:flex-col group-data-[collapsible=icon]:gap-0 gap-1">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 group-data-[collapsible=icon]:h-[var(--sidebar-width-icon)] group-data-[collapsible=icon]:w-[var(--sidebar-width-icon)] group-data-[collapsible=icon]:rounded-none text-sidebar-foreground hover:bg-sidebar-accent-foreground"
                    onClick={onCreateNewSession}
                    aria-label={getNewConversationTooltipText()}
                  >
                    <PlusCircle className="h-5 w-5 group-data-[collapsible=icon]:h-4 group-data-[collapsible=icon]:w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent sideOffset={10} side={isMobile ? "bottom" : (sidebarState === 'expanded' ? "bottom" : "right")} align="center">
                  <p>{getNewConversationTooltipText()}</p>
                </TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <SidebarTrigger className="h-8 w-8 group-data-[collapsible=icon]:h-[var(--sidebar-width-icon)] group-data-[collapsible=icon]:w-[var(--sidebar-width-icon)] group-data-[collapsible=icon]:rounded-none text-sidebar-foreground hover:bg-sidebar-accent-foreground" />
                </TooltipTrigger>
                <TooltipContent sideOffset={10} side={isMobile ? "bottom" : (sidebarState === 'expanded' ? "bottom" : "right")} align="center">
                   <p>{getSidebarToggleTooltipText()}</p>
                </TooltipContent>
              </Tooltip>
            </div>
          </div>
          {/* Search Input (hidden when collapsed) */}
          <div className="relative group-data-[collapsible=icon]:hidden w-full">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search chats..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 h-8 bg-sidebar-accent/50 border-sidebar-border focus:bg-sidebar-accent text-sidebar-foreground placeholder:text-muted-foreground rounded-md"
              suppressHydrationWarning={true}
            />
          </div>
        </SidebarHeader>
        <SidebarContent className="p-0">
          <ScrollArea className={cn("h-full", "group-data-[collapsible=icon]:hidden")}>
            <div className="p-2"> {/* Wrapper for padding */}
              <SidebarMenu> {/* Removed p-2 from here */}
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
            </div>
          </ScrollArea>
           {/* Collapsed state icon-only menu items */}
           <SidebarMenu className={cn("p-2", "hidden group-data-[collapsible=icon]:flex flex-col items-center")}>
            {/* Icons for collapsed view will be handled by SessionItem's tooltip prop */}
           </SidebarMenu>
        </SidebarContent>
      </Sidebar>
    </TooltipProvider>
  );
}

