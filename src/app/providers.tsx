'use client';

import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import EmotionRegistry from '@/lib/EmotionRegistry';
import { SettingsProvider } from '@/lib/SettingsContext';
import { TaskNumberProvider } from '@/lib/TaskNumberContext';
import { ProjectProvider } from '@/lib/ProjectContext';
import { ChatProvider } from '@/lib/ChatContext';
import theme from '@/theme';

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <EmotionRegistry>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <SettingsProvider>
          <TaskNumberProvider>
            <ProjectProvider>
              <ChatProvider>
                {children}
              </ChatProvider>
            </ProjectProvider>
          </TaskNumberProvider>
        </SettingsProvider>
      </ThemeProvider>
    </EmotionRegistry>
  );
}
