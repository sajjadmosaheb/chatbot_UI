export interface Message {
  id: string;
  text: string;
  sender: 'user' | 'bot' | 'system'; // 'system' for typing indicators or initial messages
  timestamp: number;
  direction?: 'rtl' | 'ltr'; // Added for text direction
}

export interface Session {
  id:string;
  title: string;
  createdAt: number;
  lastModified: number;
  messages: Message[];
  isGeneratingTitle?: boolean; // Optional flag for UI indication
}

