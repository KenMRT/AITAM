'use client';

import { createContext, useContext, useState, useCallback } from 'react';

interface ChatMessage {
  role: 'user' | 'model';
  content: string;
}

interface ChatContextType {
  history: ChatMessage[];
  addMessage: (role: 'user' | 'model', content: string) => void;
  clearHistory: () => void;
}

const MAX_HISTORY_TURNS = 10; // 最大10ターン（20メッセージ）

const ChatContext = createContext<ChatContextType>({
  history: [],
  addMessage: () => {},
  clearHistory: () => {},
});

export function ChatProvider({ children }: { children: React.ReactNode }) {
  const [history, setHistory] = useState<ChatMessage[]>([]);

  const addMessage = useCallback((role: 'user' | 'model', content: string) => {
    setHistory((prev) => {
      const newHistory = [...prev, { role, content }];
      // 10ターン（20メッセージ）を超えたら古い2メッセージ（1ターン）を削除
      if (newHistory.length > MAX_HISTORY_TURNS * 2) {
        return newHistory.slice(2);
      }
      return newHistory;
    });
  }, []);

  const clearHistory = useCallback(() => {
    setHistory([]);
  }, []);

  return (
    <ChatContext.Provider value={{ history, addMessage, clearHistory }}>
      {children}
    </ChatContext.Provider>
  );
}

export function useChat() {
  return useContext(ChatContext);
}
