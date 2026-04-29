'use client';

import { useRef } from 'react';
import { Box } from '@mui/material';
import Header from './Header';
import BottomNav from './BottomNav';
import ChatBar from '@/components/chat/ChatBar';
import { useSettings } from '@/lib/SettingsContext';
import { useTaskNumbers } from '@/lib/TaskNumberContext';
import { useProject } from '@/lib/ProjectContext';

interface ChatResponse {
  reply: string;
  navigateUrl?: string;
}

interface MainShellProps {
  children: React.ReactNode;
  displayName: string;
}

// クライアント側で即処理できるコマンドのパターンマッチ
function tryClientCommand(
  message: string,
  updateSettings: (updates: Record<string, boolean | string>) => void,
): ChatResponse | null {
  const msg = message.trim();

  // 設定変更: 完了表示
  if (/完了.*(表示|見せ|出し)/.test(msg) && !/非表示|隠|消/.test(msg)) {
    updateSettings({ showCompleted: true });
    return { reply: '完了タスクを表示します' };
  }
  if (/完了.*(非表示|隠|消)/.test(msg)) {
    updateSettings({ showCompleted: false });
    return { reply: '完了タスクを非表示にしました' };
  }

  // 設定変更: 納品済表示
  if (/納品済.*(表示|見せ|出し)/.test(msg) && !/非表示|隠|消/.test(msg)) {
    updateSettings({ showDelivered: true });
    return { reply: '納品済プロジェクトを表示します' };
  }
  if (/納品済.*(非表示|隠|消)/.test(msg)) {
    updateSettings({ showDelivered: false });
    return { reply: '納品済プロジェクトを非表示にしました' };
  }

  // 設定変更: カレンダー/リスト表示
  if (/カレンダー.*(表示|にし|で)/.test(msg)) {
    updateSettings({ taskView: 'calendar' });
    return { reply: 'カレンダー表示に切り替えました', navigateUrl: '/tasks' };
  }
  if (/リスト.*(表示|にし|で|戻)/.test(msg)) {
    updateSettings({ taskView: 'list' });
    return { reply: 'リスト表示に切り替えました', navigateUrl: '/tasks' };
  }

  // ページ遷移: ダッシュボード
  if (/^(ダッシュボード|ホーム)$/.test(msg)) {
    return { reply: 'ダッシュボードに移動します', navigateUrl: '/dashboard' };
  }

  // ページ遷移: 設定
  if (/^設定(画面)?$/.test(msg)) {
    return { reply: '設定画面に移動します', navigateUrl: '/settings' };
  }

  // ページ遷移: タスク（日付フィルタ）
  if (/今日のタスク/.test(msg)) {
    return { reply: '今日のタスクを表示します', navigateUrl: '/tasks?filter=today' };
  }
  if (/今週のタスク/.test(msg)) {
    return { reply: '今週のタスクを表示します', navigateUrl: '/tasks?filter=week' };
  }

  // ページ遷移: タスク一覧
  if (/^(タスク(一覧|リスト|を?(表示|見せ)))/.test(msg) && msg.length < 15) {
    return { reply: 'タスク一覧を表示します', navigateUrl: '/tasks' };
  }

  return null;
}

export default function MainShell({ children, displayName }: MainShellProps) {
  const { updateSettings } = useSettings();
  const { getMapping } = useTaskNumbers();
  const { currentProject } = useProject();
  const contextProjectRef = useRef<{ id: string; name: string } | null>(null);

  const handleSend = async (message: string): Promise<ChatResponse> => {
    // クライアント側で即処理できるか試す
    const clientResult = tryClientCommand(message, updateSettings);
    if (clientResult) return clientResult;

    // AI APIに送信
    // 優先順位: 1. URLプロジェクト（コンテキストから）, 2. 会話コンテキスト
    const urlProject = currentProject;
    const conversationProject = contextProjectRef.current;

    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message,
        currentProjectId: urlProject?.id || conversationProject?.id,
        contextProjectName: !urlProject ? conversationProject?.name : undefined,
        numberMapping: getMapping(),
      }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);

    if (data.contextProject) {
      contextProjectRef.current = data.contextProject;
    }
    if (data.settingsUpdate) {
      updateSettings(data.settingsUpdate);
    }

    return { reply: data.reply, navigateUrl: data.navigateUrl };
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100dvh' }}>
      <Header displayName={displayName} />
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
