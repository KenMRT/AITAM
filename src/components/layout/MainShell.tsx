'use client';

import { useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { Box } from '@mui/material';
import Header from './Header';
import BottomNav from './BottomNav';
import ChatBar from '@/components/chat/ChatBar';
import { useSettings } from '@/lib/SettingsContext';

interface ChatResponse {
  reply: string;
  navigateUrl?: string;
}

interface MainShellProps {
  children: React.ReactNode;
  displayName: string;
  teamName: string;
}

export default function MainShell({ children, displayName, teamName }: MainShellProps) {
  const searchParams = useSearchParams();
  const { updateSettings } = useSettings();
  // 会話コンテキスト: 直前に操作したプロジェクト
  const contextProjectRef = useRef<{ id: string; name: string } | null>(null);

  const handleSend = async (message: string): Promise<ChatResponse> => {
    // URLのプロジェクトフィルタ or 会話コンテキストのプロジェクト
    const urlProjectId = searchParams.get('project') || undefined;
    const contextProject = contextProjectRef.current;

    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message,
        currentProjectId: urlProjectId || contextProject?.id,
        contextProjectName: !urlProjectId ? contextProject?.name : undefined,
      }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);

    // AIが操作したプロジェクトを会話コンテキストに保持
    if (data.contextProject) {
      contextProjectRef.current = data.contextProject;
    }
    // 設定変更を適用
    if (data.settingsUpdate) {
      updateSettings(data.settingsUpdate);
    }

    return { reply: data.reply, navigateUrl: data.navigateUrl };
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100dvh' }}>
      <Header displayName={displayName} teamName={teamName} />
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          mt: '56px',
          mb: 'calc(56px + 64px)',
          overflow: 'auto',
        }}
      >
        {children}
      </Box>
      <ChatBar onSend={handleSend} />
      <BottomNav />
    </Box>
  );
}
