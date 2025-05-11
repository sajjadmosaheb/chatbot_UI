"use client";

import type { Session } from '@/lib/types';
import { SessionItem } from './SessionItem';
import { 
  Sidebar, 
  SidebarHeader, 
  SidebarContent, 
  SidebarMenu, 
  SidebarMenuItem,
  SidebarTrigger
} from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

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
  return (
    <Sidebar side="left" variant="sidebar" collapsible="icon">
      <SidebarHeader className="flex items-center justify-between p-3 border-b border-sidebar-border">
        <h2 className="text-lg font-semibold text-sidebar-foreground group-data-[collapsible=icon]:hidden">Academix</h2>
        <div className="flex items-center gap-1">
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-8 w-8 group-data-[collapsible=icon]:hidden"
            onClick={onCreateNewSession}
            aria-label="New Conversation"
          >
            <PlusCircle className="h-5 w-5" />
          </Button>
           <SidebarTrigger className="h-8 w-8 md:hidden" /> {/* Mobile toggle */}
        </div>
      </SidebarHeader>
      <SidebarContent className="p-0">
        <ScrollArea className="h-full">
          <SidebarMenu className="p-2">
            {!isInitialized && (
                <SidebarMenuItem className="p-2 text-sm text-muted-foreground">Loading sessions...</SidebarMenuItem>
            )}
            {isInitialized && sessions.length === 0 && (
              <SidebarMenuItem className="p-2 text-sm text-muted-foreground">No sessions yet. Start a new chat!</SidebarMenuItem>
            )}
            {isInitialized && sessions.map((session) => (
              <SidebarMenuItem key={session.id}>
                <SessionItem
                  session={session}
                  isActive={session.id === activeSessionId}
                  onSelect={() => onSelectSession(session.id)}
                  onDelete={() => onDeleteSession(session.id)}
                />
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </ScrollArea>
      </SidebarContent>
      {/* <SidebarFooter className="p-2 border-t border-sidebar-border">
         Can add settings or other actions here 
      </SidebarFooter> */}
    </Sidebar>
  );
}
