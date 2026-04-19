'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Alert,
  Box,
  Button,
  Container,
  Divider,
  Switch,
  TextField,
  Typography,
} from '@mui/material';
import LogoutIcon from '@mui/icons-material/Logout';
import { createClient } from '@/lib/supabase/client';
import { useSettings } from '@/lib/SettingsContext';
import { User } from '@/types/database';

interface SettingsContentProps {
  profile: User | null;
  email: string;
}

export default function SettingsContent({
  profile,
  email,
}: SettingsContentProps) {
  const router = useRouter();
  const [displayName, setDisplayName] = useState(profile?.display_name ?? '');
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState('');

  const handleSaveProfile = async () => {
    setSaving(true);
    setSuccess('');
    const supabase = createClient();
    await supabase
      .from('users')
      .update({ display_name: displayName })
      .eq('id', profile!.id);
    setSaving(false);
    setSuccess('プロフィールを保存しました');
  };

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  };

  return (
    <Container maxWidth="sm" sx={{ py: 2 }}>
      <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
        設定
      </Typography>

      {success && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>
          {success}
        </Alert>
      )}

      <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
        プロフィール
      </Typography>

      <TextField
        label="メールアドレス"
        value={email}
        fullWidth
        disabled
        sx={{ mb: 2 }}
      />
      <TextField
        label="表示名"
        value={displayName}
        onChange={(e) => setDisplayName(e.target.value)}
        fullWidth
        sx={{ mb: 2 }}
      />
      <Button
        variant="contained"
        onClick={handleSaveProfile}
        disabled={saving}
        sx={{ mb: 3 }}
      >
        {saving ? '保存中...' : '保存'}
      </Button>

      <Divider sx={{ my: 3 }} />

      <DisplaySettings />

      <Divider sx={{ my: 3 }} />

      <Button
        variant="outlined"
        color="error"
        startIcon={<LogoutIcon />}
        onClick={handleLogout}
      >
        ログアウト
      </Button>
    </Container>
  );
}

function DisplaySettings() {
  const { settings, updateSettings } = useSettings();

  return (
    <>
      <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
        表示設定
      </Typography>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
        <Typography variant="body2">完了タスクを表示</Typography>
        <Switch
          checked={settings.showCompleted}
          onChange={(e) => updateSettings({ showCompleted: e.target.checked })}
        />
      </Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
        <Typography variant="body2">納品済プロジェクトを表示</Typography>
        <Switch
          checked={settings.showDelivered}
          onChange={(e) => updateSettings({ showDelivered: e.target.checked })}
        />
      </Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="body2">タスク表示</Typography>
        <Box sx={{ display: 'flex', gap: 0.5 }}>
          <Button
            size="small"
            variant={settings.taskView === 'list' ? 'contained' : 'outlined'}
            onClick={() => updateSettings({ taskView: 'list' })}
          >
            リスト
          </Button>
          <Button
            size="small"
            variant={settings.taskView === 'calendar' ? 'contained' : 'outlined'}
            onClick={() => updateSettings({ taskView: 'calendar' })}
          >
            カレンダー
          </Button>
        </Box>
      </Box>
    </>
  );
}
