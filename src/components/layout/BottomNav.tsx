'use client';

import { usePathname, useRouter } from 'next/navigation';
import { BottomNavigation, BottomNavigationAction, Paper } from '@mui/material';
import DashboardIcon from '@mui/icons-material/Dashboard';
import AssignmentIcon from '@mui/icons-material/Assignment';
import SettingsIcon from '@mui/icons-material/Settings';

const navItems = [
  { label: 'ダッシュボード', icon: <DashboardIcon />, path: '/dashboard' },
  { label: 'タスク', icon: <AssignmentIcon />, path: '/tasks' },
  { label: '設定', icon: <SettingsIcon />, path: '/settings' },
];

export default function BottomNav() {
  const pathname = usePathname();
  const router = useRouter();

  const currentIndex = navItems.findIndex((item) =>
    pathname.startsWith(item.path),
  );

  return (
    <Paper
      sx={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 1200 }}
      elevation={3}
    >
      <BottomNavigation
        value={currentIndex}
        onChange={(_, newValue) => router.push(navItems[newValue].path)}
        showLabels
      >
        {navItems.map((item) => (
          <BottomNavigationAction
            key={item.path}
            label={item.label}
            icon={item.icon}
          />
        ))}
      </BottomNavigation>
    </Paper>
  );
}
