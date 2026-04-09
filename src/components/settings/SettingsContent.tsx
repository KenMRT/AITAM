'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
  Switch,
  TextField,
  Typography,
} from '@mui/material';
import LogoutIcon from '@mui/icons-material/Logout';
import EditIcon from '@mui/icons-material/Edit';
import AddIcon from '@mui/icons-material/Add';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import GroupIcon from '@mui/icons-material/Group';
import { createClient } from '@/lib/supabase/client';
import { useSettings } from '@/lib/SettingsContext';
import { User } from '@/types/database';

interface Membership {
  team_id: string;
  role: string;
  teams: { id: string; name: string }[] | { id: string; name: string } | null;
}

interface SettingsContentProps {
  profile: User | null;
  email: string;
  memberships: Membership[];
  currentTeamId: string | null;
}

export default function SettingsContent({
  profile,
  email,
  memberships,
  currentTeamId,
}: SettingsContentProps) {
  const router = useRouter();
  const [displayName, setDisplayName] = useState(profile?.display_name ?? '');
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState('');

  // チーム名変更ダイアログ
  const [editingTeam, setEditingTeam] = useState<{ id: string; name: string } | null>(null);
  const [editTeamName, setEditTeamName] = useState('');

  // 新規チーム作成ダイアログ
  const [showCreateTeam, setShowCreateTeam] = useState(false);
  const [newTeamName, setNewTeamName] = useState('');

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

  const handleSwitchTeam = async (teamId: string) => {
    const supabase = createClient();
    await supabase
      .from('users')
      .update({ current_team_id: teamId })
      .eq('id', profile!.id);
    setSuccess('チームを切り替えました');
    router.refresh();
  };

  const handleRenameTeam = async () => {
    if (!editingTeam || !editTeamName.trim()) return;
    const supabase = createClient();
    await supabase
      .from('teams')
      .update({ name: editTeamName.trim() })
      .eq('id', editingTeam.id);
    setEditingTeam(null);
    setSuccess('チーム名を変更しました');
    router.refresh();
  };

  const handleCreateTeam = async () => {
    if (!newTeamName.trim()) return;
    const supabase = createClient();

    const teamId = crypto.randomUUID();

    const { error: insertError } = await supabase
      .from('teams')
      .insert({ id: teamId, name: newTeamName.trim() });

    if (insertError) return;

    await supabase.from('team_members').insert({
      team_id: teamId,
      user_id: profile!.id,
      role: 'owner',
    });

    await supabase
      .from('users')
      .update({ current_team_id: teamId })
      .eq('id', profile!.id);

    setShowCreateTeam(false);
    setNewTeamName('');
    setSuccess('新しいチームを作成しました');
    router.refresh();
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

      {/* プロフィール */}
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

      {/* チーム管理 */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
        <Typography variant="subtitle2" color="text.secondary">
          チーム
        </Typography>
        <Button
          size="small"
          startIcon={<AddIcon />}
          onClick={() => setShowCreateTeam(true)}
        >
          新規作成
        </Button>
      </Box>

      {memberships.map((m) => {
        const teamRaw = m.teams;
        const team = Array.isArray(teamRaw) ? teamRaw[0] : teamRaw;
        if (!team) return null;
        const isCurrent = team.id === currentTeamId;
        const isOwner = m.role === 'owner';

        return (
          <Card
            key={team.id}
            variant={isCurrent ? 'elevation' : 'outlined'}
            sx={{
              mb: 1,
              border: isCurrent ? '2px solid' : undefined,
              borderColor: isCurrent ? 'primary.main' : undefined,
            }}
          >
            <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 1, py: 1.5, '&:last-child': { pb: 1.5 } }}>
              <GroupIcon color={isCurrent ? 'primary' : 'action'} />
              <Box sx={{ flexGrow: 1 }}>
                <Typography variant="subtitle2">{team.name}</Typography>
                <Box sx={{ display: 'flex', gap: 0.5 }}>
                  {isOwner && <Chip label="オーナー" size="small" sx={{ height: 20, fontSize: '0.7rem' }} />}
                  {isCurrent && <Chip label="使用中" size="small" color="primary" sx={{ height: 20, fontSize: '0.7rem' }} />}
                </Box>
              </Box>
              {isOwner && (
                <IconButton
                  size="small"
                  onClick={() => {
                    setEditingTeam(team);
                    setEditTeamName(team.name);
                  }}
                >
                  <EditIcon fontSize="small" />
                </IconButton>
              )}
              {!isCurrent && (
                <Button size="small" variant="outlined" onClick={() => handleSwitchTeam(team.id)}>
                  切替
                </Button>
              )}
              {isCurrent && <CheckCircleIcon color="primary" />}
            </CardContent>
          </Card>
        );
      })}

      <Divider sx={{ my: 3 }} />

      {/* 表示設定 */}
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

      {/* チーム名変更ダイアログ */}
      <Dialog open={!!editingTeam} onClose={() => setEditingTeam(null)}>
        <DialogTitle>チーム名を変更</DialogTitle>
        <DialogContent>
          <TextField
            label="チーム名"
            fullWidth
            value={editTeamName}
            onChange={(e) => setEditTeamName(e.target.value)}
            autoFocus
            sx={{ mt: 1 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditingTeam(null)}>キャンセル</Button>
          <Button variant="contained" onClick={handleRenameTeam} disabled={!editTeamName.trim()}>
            変更
          </Button>
        </DialogActions>
      </Dialog>

      {/* 新規チーム作成ダイアログ */}
      <Dialog open={showCreateTeam} onClose={() => setShowCreateTeam(false)}>
        <DialogTitle>新しいチームを作成</DialogTitle>
        <DialogContent>
          <TextField
            label="チーム名"
            fullWidth
            value={newTeamName}
            onChange={(e) => setNewTeamName(e.target.value)}
            autoFocus
            sx={{ mt: 1 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowCreateTeam(false)}>キャンセル</Button>
          <Button variant="contained" onClick={handleCreateTeam} disabled={!newTeamName.trim()}>
            作成
          </Button>
        </DialogActions>
      </Dialog>
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
