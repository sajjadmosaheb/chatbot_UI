// @ts-nocheck
"use client";

import type { Session, Message } from '@/lib/types';
import { summarizeSession } from '@/ai/flows/summarize-session';
import { chat } from '@/ai/flows/chat-flow'; // Import the chat flow
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
      setIsInitialized(true); // Set initialized here, after attempting to load or setting empty
    }
  }, []); // Empty dependency array: run once on mount

  // Effect to create a new session if none exist after initialization
  useEffect(() => {
    if (isInitialized && sessions.length === 0) {
      createNewSession();
    }
  }, [isInitialized, sessions.length]); // Added sessions.length to dependencies


  useEffect(() => {
    if (typeof window !== 'undefined' && isInitialized && sessions.length > 0) {
      try {
        const sortedSessions = [...sessions].sort((a, b) => b.lastModified - a.lastModified);
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(sortedSessions));
      } catch (error) {
        console.error("Failed to save sessions to localStorage:", error);
        toast({ title: "Error", description: "Could not save session changes.", variant: "destructive" });
      }
    } else if (isInitialized && sessions.length === 0) {
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
        createNewSession(); 
      }
    }
    toast({ title: "Session Deleted", description: "The session has been removed." });
  }, [activeSessionId, sessions, createNewSession, toast]);

  const addMessageToSession = useCallback(async (sessionId: string, text: string, sender: 'user' | 'bot') => {
    const messageDirection = getTextDirection(text);
    const newMessage: Message = { id: crypto.randomUUID(), text, sender, timestamp: Date.now(), direction: messageDirection };
    
    setSessions(prevSessions =>
      prevSessions.map(s =>
        s.id === sessionId
          ? { ...s, messages: [...s.messages, newMessage], lastModified: Date.now() }
          : s
      ).sort((a, b) => b.lastModified - a.lastModified)
    );

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
        const currentSessionForHistory = sessions.find(s => s.id === sessionId);
        const history = currentSessionForHistory?.messages
            .filter(m => m.sender === 'user' || m.sender === 'bot')
            .map(m => ({role: m.sender, content: m.text})) || [];
        
        const aiResponse = await chat({ message: text, history: history.slice(-10) }); // Limit history for context window
        
        const botResponseDirection = getTextDirection(aiResponse.response);
        const botMessage: Message = {
          id: crypto.randomUUID(),
          text: aiResponse.response,
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
        
        const updatedSession = sessions.find(s => s.id === sessionId);
        if (updatedSession && updatedSession.messages.length >= 2 && updatedSession.title === DEFAULT_TITLE && !updatedSession.isGeneratingTitle) {
          generateSessionTitle(sessionId);
        }

      } catch (error) {
        console.error("AI chat error:", error);
        const errorBotMessage: Message = {
          id: crypto.randomUUID(),
          text: "Sorry, I encountered an error. Please try again.",
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
  }, [sessions, toast]); // Added sessions and toast to dependency array

  const generateSessionTitle = useCallback(async (sessionId: string) => {
    const session = sessions.find(s => s.id === sessionId);
    if (!session || session.messages.length === 0) return;

    setSessions(prev => prev.map(s => s.id === sessionId ? { ...s, isGeneratingTitle: true } : s));

    const transcript = session.messages
      .filter(m => m.sender === 'user' || m.sender === 'bot')
      .map(m => `${m.sender}: ${m.text}`)
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
      // toast({ title: "Title Generated", description: `Session title updated to "${summary.title}".` });
    } catch (error) {
      console.error("Failed to generate session title:", error);
      toast({ title: "Error", description: "Could not generate session title.", variant: "destructive" });
      setSessions(prev => prev.map(s => s.id === sessionId ? { ...s, isGeneratingTitle: false } : s));
    }
  }, [sessions, toast]);

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
