
// @ts-nocheck
"use client";

import type { Session, Message } from '@/lib/types';
import { summarizeSession } from '@/ai/flows/summarize-session';
import { chat } from '@/ai/flows/chat-flow';
import { useToast } from '@/hooks/use-toast';
import { useState, useEffect, useCallback } from 'react';
import { getTextDirection } from '@/lib/languageUtils'; // Import text direction utility

const LOCAL_STORAGE_KEY = 'academix-sessions';
const DEFAULT_TITLE = "New Chat";

export function useSessions() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const { toast } = useToast();
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const storedSessions = localStorage.getItem(LOCAL_STORAGE_KEY);
        if (storedSessions) {
          const parsedSessions: Session[] = JSON.parse(storedSessions);
          parsedSessions.sort((a, b) => b.lastModified - a.lastModified);
          setSessions(parsedSessions);
          if (parsedSessions.length > 0 && !activeSessionId) {
            setActiveSessionId(parsedSessions[0].id);
          }
        }
      } catch (error) {
        console.error("Failed to load sessions from localStorage:", error);
        toast({ title: "Error", description: "Could not load sessions.", variant: "destructive" });
      }
      setIsInitialized(true); 
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); 

  useEffect(() => {
    if (isInitialized && typeof window !== 'undefined' && sessions.length === 0) {
      createNewSession();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isInitialized, sessions.length]);


  useEffect(() => {
    if (typeof window !== 'undefined' && isInitialized && sessions.length > 0) {
      try {
        const sortedSessions = [...sessions].sort((a, b) => b.lastModified - a.lastModified);
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(sortedSessions));
      } catch (error) {
        console.error("Failed to save sessions to localStorage:", error);
        toast({ title: "Error", description: "Could not save session changes.", variant: "destructive" });
      }
    } else if (isInitialized && typeof window !== 'undefined' && sessions.length === 0) {
        localStorage.removeItem(LOCAL_STORAGE_KEY);
    }
  }, [sessions, isInitialized, toast]);

  const createNewSession = useCallback((setActive = true) => {
    const newSessionId = crypto.randomUUID();
    const now = Date.now();
    const newSession: Session = {
      id: newSessionId,
      title: DEFAULT_TITLE,
      createdAt: now,
      lastModified: now,
      messages: [],
      isGeneratingTitle: false,
    };
    setSessions(prevSessions => [newSession, ...prevSessions].sort((a,b) => b.lastModified - a.lastModified));
    if (setActive) {
      setActiveSessionId(newSessionId);
    }
    return newSessionId;
  }, []);

  const loadSession = useCallback((sessionId: string) => {
    const sessionExists = sessions.some(s => s.id === sessionId);
    if (sessionExists) {
      setActiveSessionId(sessionId);
    } else {
      toast({ title: "Error", description: "Session not found.", variant: "destructive" });
    }
  }, [sessions, toast]);

  const deleteSession = useCallback((sessionId: string) => {
    setSessions(prevSessions => prevSessions.filter(s => s.id !== sessionId));
    if (activeSessionId === sessionId) {
      const remainingSessions = sessions.filter(s => s.id !== sessionId);
      if (remainingSessions.length > 0) {
        setActiveSessionId(remainingSessions.sort((a,b) => b.lastModified - a.lastModified)[0].id);
      } else {
        setActiveSessionId(null); 
        // Ensure createNewSession is called properly after state update
        setTimeout(() => createNewSession(), 0);
      }
    }
    toast({ title: "Session Deleted", description: "The session has been removed." });
  }, [activeSessionId, sessions, createNewSession, toast]);

  const generateSessionTitle = useCallback(async (sessionId: string) => {
    let sessionToSummarize: Session | undefined;
    setSessions(prev => {
      sessionToSummarize = prev.find(s => s.id === sessionId);
      if (sessionToSummarize && sessionToSummarize.title !== DEFAULT_TITLE && sessionToSummarize.messages.length > 2) { // Only generate if it's default and has enough messages
        return prev.map(s => s.id === sessionId ? { ...s, isGeneratingTitle: false } : s); // Already has title or not enough messages
      }
      return prev.map(s => s.id === sessionId ? { ...s, isGeneratingTitle: true } : s);
    });


    if (!sessionToSummarize || sessionToSummarize.messages.length < 1 ) { // Require at least 1 message (user + bot = 2 usually)
        setSessions(prev => prev.map(s => s.id === sessionId ? { ...s, isGeneratingTitle: false } : s));
        return;
    }
     // Only generate title if it's still the default title
    if (sessionToSummarize.title !== DEFAULT_TITLE && sessionToSummarize.messages.length > 2) {
      setSessions(prev => prev.map(s => s.id === sessionId ? { ...s, isGeneratingTitle: false } : s));
      return;
    }


    const transcript = sessionToSummarize.messages
      .filter(m => m.sender === 'user' || m.sender === 'bot') 
      .map(m => `${m.sender === 'user' ? 'User' : 'Assistant'}: ${m.text}`)
      .join('\n');

    if (transcript.length < 10) { 
        setSessions(prev => prev.map(s => s.id === sessionId ? { ...s, isGeneratingTitle: false } : s));
        return;
    }

    try {
      const summary = await summarizeSession({ messages: transcript });
      setSessions(prevSessions =>
        prevSessions.map(s =>
          s.id === sessionId ? { ...s, title: summary.title, isGeneratingTitle: false } : s
        )
      );
    } catch (error) {
      console.error("Failed to generate session title:", error);
      toast({ title: "Error", description: "Could not generate session title.", variant: "destructive" });
      setSessions(prev => prev.map(s => s.id === sessionId ? { ...s, isGeneratingTitle: false } : s));
    }
  }, [toast]);


  const addMessageToSession = useCallback(async (sessionId: string, text: string, sender: 'user' | 'bot') => {
    const messageDirection = getTextDirection(text);
    const newMessage: Message = { id: crypto.randomUUID(), text, sender, timestamp: Date.now(), direction: messageDirection };
    
    let currentSessionBeforeUpdate: Session | undefined;
    setSessions(prevSessions => {
      currentSessionBeforeUpdate = prevSessions.find(s => s.id === sessionId);
      return prevSessions.map(s =>
        s.id === sessionId
          ? { ...s, messages: [...s.messages, newMessage], lastModified: Date.now() }
          : s
      ).sort((a, b) => b.lastModified - a.lastModified)
    });

    if (sender === 'user') {
      const typingMessage: Message = { id: crypto.randomUUID(), text: "Academix is thinking...", sender: 'system', timestamp: Date.now() + 100, direction: 'ltr' };
      setSessions(prevSessions =>
        prevSessions.map(s =>
          s.id === sessionId
            ? { ...s, messages: [...s.messages, typingMessage] }
            : s
        )
      );

      try {
        // Use Python backend for chat
        const apiResponse = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prompt: text }),
        });

        if (!apiResponse.ok) {
          const errorData = await apiResponse.json();
          throw new Error(errorData.error || `API request failed with status ${apiResponse.status}`);
        }
        
        const data = await apiResponse.json();
        const aiResponseMessage = data.response;
        
        const botResponseDirection = getTextDirection(aiResponseMessage);
        const botMessage: Message = {
          id: crypto.randomUUID(),
          text: aiResponseMessage,
          sender: 'bot',
          timestamp: Date.now(),
          direction: botResponseDirection,
        };

        setSessions(prevSessions =>
          prevSessions.map(s =>
            s.id === sessionId
              ? { ...s, messages: s.messages.filter(m => m.id !== typingMessage.id).concat(botMessage), lastModified: Date.now() }
              : s
          ).sort((a, b) => b.lastModified - a.lastModified)
        );
        
        // Check if title needs to be generated
        // Ensure currentSessionBeforeUpdate has the latest messages array structure
        // or fetch the updated session state more reliably.
        const sessionForTitleCheck = sessions.find(s => s.id === sessionId) || currentSessionBeforeUpdate;

        if (sessionForTitleCheck && sessionForTitleCheck.messages.length >= 1 && sessionForTitleCheck.title === DEFAULT_TITLE && !sessionForTitleCheck.isGeneratingTitle) {
            setTimeout(() => generateSessionTitle(sessionId), 100);
        }

      } catch (error: any) {
        console.error("AI chat API error:", error);
        const errorBotMessage: Message = {
          id: crypto.randomUUID(),
          text: error.message || "Sorry, I encountered an error. Please try again.",
          sender: 'bot',
          timestamp: Date.now(),
          direction: 'ltr',
        };
        setSessions(prevSessions =>
          prevSessions.map(s =>
            s.id === sessionId
              ? { ...s, messages: s.messages.filter(m => m.id !== typingMessage.id).concat(errorBotMessage), lastModified: Date.now() }
              : s
          ).sort((a, b) => b.lastModified - a.lastModified)
        );
        toast({ title: "AI Error", description: "Failed to get response from AI.", variant: "destructive" });
      }
    }
  }, [sessions, toast, generateSessionTitle]); 


  const currentSessionMessages = activeSessionId ? sessions.find(s => s.id === activeSessionId)?.messages || [] : [];
  const currentSessionTitle = activeSessionId ? sessions.find(s => s.id === activeSessionId)?.title || DEFAULT_TITLE : DEFAULT_TITLE;

  return {
    sessions,
    activeSessionId,
    currentSessionMessages,
    currentSessionTitle,
    isInitialized,
    createNewSession,
    loadSession,
    deleteSession,
    addMessageToSession,
  };
}
