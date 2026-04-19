'use client';

import { AppBar, Toolbar, Typography } from '@mui/material';
import SmartToyIcon from '@mui/icons-material/SmartToy';

interface HeaderProps {
  displayName: string;
}

export default function Header({ displayName }: HeaderProps) {
  return (
    <AppBar position="fixed" elevation={1} sx={{ bgcolor: 'background.paper', color: 'text.primary' }}>
      <Toolbar sx={{ minHeight: 56 }}>
        <SmartToyIcon color="primary" sx={{ mr: 1 }} />
        <Typography variant="h6" sx={{ fontWeight: 700, mr: 2 }}>
          AITAM
        </Typography>
        <Typography variant="body2" sx={{ fontWeight: 500 }} noWrap>
          {displayName}
        </Typography>
      </Toolbar>
    </AppBar>
  );
}
