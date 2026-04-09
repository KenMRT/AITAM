'use client';

import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import EmotionRegistry from '@/lib/EmotionRegistry';
import { SettingsProvider } from '@/lib/SettingsContext';
import theme from '@/theme';

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <EmotionRegistry>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <SettingsProvider>
          {children}
        </SettingsProvider>
      </ThemeProvider>
    </EmotionRegistry>
  );
}
