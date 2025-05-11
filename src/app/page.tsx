"use client";

import { ChatInterface } from '@/components/chat/ChatInterface';
import { SessionHistoryPanel } from '@/components/session/SessionHistoryPanel';
import { SidebarProvider } from '@/components/ui/sidebar';
import { useSessions } from '@/hooks/use-sessions';
import { useEffect } from 'react';

export default function AcademixPage() {
  const {
    sessions,
    activeSessionId,
    currentSessionMessages,
    currentSessionTitle,
    isInitialized,
    createNewSession,
    loadSession,
    deleteSession,
    addMessageToSession,
  } = useSessions();

  const handleSendMessage = (text: string) => {
    if (activeSessionId) {
      addMessageToSession(activeSessionId, text, 'user');
    } else {
      // This case should ideally not happen if a session is always active
      const newSessionId = createNewSession();
      addMessageToSession(newSessionId, text, 'user');
    }
  };
  
  // Ensure an active session exists on initialization
  useEffect(() => {
    if (isInitialized && sessions.length > 0 && !activeSessionId) {
      loadSession(sessions[0].id);
    } else if (isInitialized && sessions.length === 0) {
      createNewSession();
    }
  }, [isInitialized, sessions, activeSessionId, loadSession, createNewSession]);


  return (
    <SidebarProvider defaultOpen={true}>
      <div className="flex h-screen w-full">
        <SessionHistoryPanel
          sessions={sessions}
          activeSessionId={activeSessionId}
          onSelectSession={loadSession}
          onCreateNewSession={() => createNewSession()}
          onDeleteSession={deleteSession}
          isInitialized={isInitialized}
        />
        <main className="flex-1 h-screen overflow-hidden">
          <ChatInterface
            messages={currentSessionMessages}
            onSendMessage={handleSendMessage}
            currentSessionTitle={isInitialized && activeSessionId ? currentSessionTitle : "Loading..."}
            isLoading={!isInitialized || !activeSessionId}
          />
        </main>
      </div>
    </SidebarProvider>
  );
}
