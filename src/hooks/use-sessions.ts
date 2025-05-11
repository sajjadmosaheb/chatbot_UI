// @ts-nocheck
"use client";

import type { Session, Message } from '@/lib/types';
import { summarizeSession } from '@/ai/flows/summarize-session';
import { useToast } from '@/hooks/use-toast';
import { useState, useEffect, useCallback } from 'react';

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
          // Sort sessions by lastModified descending
          parsedSessions.sort((a, b) => b.lastModified - a.lastModified);
          setSessions(parsedSessions);
          if (parsedSessions.length > 0 && !activeSessionId) {
            setActiveSessionId(parsedSessions[0].id);
          }
        } else {
          // If no stored sessions, create a default one
          createNewSession(false); // Don't setActive if already trying to load
        }
      } catch (error) {
        console.error("Failed to load sessions from localStorage:", error);
        toast({ title: "Error", description: "Could not load sessions.", variant: "destructive" });
        createNewSession(false); 
      }
      setIsInitialized(true);
    }
  }, []); // Empty dependency array: run once on mount

  useEffect(() => {
    if (typeof window !== 'undefined' && isInitialized && sessions.length > 0) {
      try {
        // Sort sessions before saving to keep order consistent
        const sortedSessions = [...sessions].sort((a, b) => b.lastModified - a.lastModified);
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(sortedSessions));
      } catch (error) {
        console.error("Failed to save sessions to localStorage:", error);
        toast({ title: "Error", description: "Could not save session changes.", variant: "destructive" });
      }
    } else if (isInitialized && sessions.length === 0) {
        localStorage.removeItem(LOCAL_STORAGE_KEY);
    }
  }, [sessions, isInitialized]);

  const createNewSession = useCallback((setActive = true) => {
    const newSessionId = crypto.randomUUID();
    const now = Date.now();
    const newSession: Session = {
      id: newSessionId,
      title: DEFAULT_TITLE,
      createdAt: now,
      lastModified: now,
      messages: [
        { id: crypto.randomUUID(), text: "Hello! How can I help you today?", sender: 'bot', timestamp: now }
      ],
    };
    setSessions(prevSessions => [newSession, ...prevSessions]);
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
        setActiveSessionId(null); // No sessions left
        createNewSession(); // Create a new one if all are deleted
      }
    }
    toast({ title: "Session Deleted", description: "The session has been removed." });
  }, [activeSessionId, sessions, createNewSession, toast]);

  const addMessageToSession = useCallback(async (sessionId: string, text: string, sender: 'user' | 'bot') => {
    const newMessage: Message = { id: crypto.randomUUID(), text, sender, timestamp: Date.now() };
    
    setSessions(prevSessions =>
      prevSessions.map(s =>
        s.id === sessionId
          ? { ...s, messages: [...s.messages, newMessage], lastModified: Date.now() }
          : s
      ).sort((a, b) => b.lastModified - a.lastModified) // Re-sort after modification
    );

    if (sender === 'user') {
      // Simulate bot thinking and responding
      const typingMessage: Message = { id: crypto.randomUUID(), text: "Academix is thinking...", sender: 'system', timestamp: Date.now() + 100 };
      setSessions(prevSessions =>
        prevSessions.map(s =>
          s.id === sessionId
            ? { ...s, messages: [...s.messages, typingMessage] }
            : s
        )
      );

      setTimeout(() => {
        const botResponse: Message = {
          id: crypto.randomUUID(),
          text: `I've received your message: "${text}". As a demo bot, I'm just echoing this back.`,
          sender: 'bot',
          timestamp: Date.now(),
        };
        setSessions(prevSessions =>
          prevSessions.map(s =>
            s.id === sessionId
              ? { ...s, messages: s.messages.filter(m => m.id !== typingMessage.id).concat(botResponse) }
              : s
          )
        );

        // Check for title generation after bot response
        const currentSession = sessions.find(s => s.id === sessionId);
        if (currentSession && currentSession.messages.length >= 2 && currentSession.title === DEFAULT_TITLE && !currentSession.isGeneratingTitle) { // Adjusted to 2 messages (1 user, 1 bot)
          generateSessionTitle(sessionId);
        }
      }, 1500);
    }
  }, [sessions]); // Added sessions to dependency array for currentSession access.

  const generateSessionTitle = useCallback(async (sessionId: string) => {
    const session = sessions.find(s => s.id === sessionId);
    if (!session || session.messages.length === 0) return;

    setSessions(prev => prev.map(s => s.id === sessionId ? { ...s, isGeneratingTitle: true } : s));

    const transcript = session.messages
      .filter(m => m.sender === 'user' || m.sender === 'bot') // Only user and bot messages for summary
      .map(m => `${m.sender}: ${m.text}`)
      .join('\n');

    if (transcript.length < 20) { // Avoid calling AI for very short conversations
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
      toast({ title: "Title Generated", description: `Session title updated to "${summary.title}".` });
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
