'use client';

import { AppBar, Box, Toolbar, Typography } from '@mui/material';
import SmartToyIcon from '@mui/icons-material/SmartToy';

interface HeaderProps {
  displayName: string;
  teamName: string;
}

export default function Header({ displayName, teamName }: HeaderProps) {
  return (
    <AppBar position="fixed" elevation={1} sx={{ bgcolor: 'background.paper', color: 'text.primary' }}>
      <Toolbar sx={{ minHeight: 56 }}>
        <SmartToyIcon color="primary" sx={{ mr: 1 }} />
        <Typography variant="h6" sx={{ fontWeight: 700, mr: 2 }}>
          AITAM
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <Typography variant="body2" color="text.secondary" noWrap>
            {teamName}
          </Typography>
          {teamName && displayName && (
            <Typography variant="body2" color="text.secondary">
              /
            </Typography>
          )}
          <Typography variant="body2" sx={{ fontWeight: 500 }} noWrap>
            {displayName}
          </Typography>
        </Box>
      </Toolbar>
    </AppBar>
  );
}
