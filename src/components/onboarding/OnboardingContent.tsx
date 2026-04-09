'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Box,
  Button,
  Card,
  CardActionArea,
  CardContent,
  Container,
  Divider,
  Paper,
  TextField,
  Typography,
} from '@mui/material';
import GroupIcon from '@mui/icons-material/Group';
import AddIcon from '@mui/icons-material/Add';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { createClient } from '@/lib/supabase/client';

interface Membership {
  team_id: string;
  role: string;
  teams: { id: string; name: string }[] | { id: string; name: string } | null;
}

interface OnboardingContentProps {
  userId: string;
  memberships: Membership[];
  allTeams: { id: string; name: string }[];
}

export default function OnboardingContent({
  userId,
  memberships,
  allTeams,
}: OnboardingContentProps) {
  const router = useRouter();
  const [mode, setMode] = useState<'select' | 'create'>('select');
  const [newTeamName, setNewTeamName] = useState('');
  const [loading, setLoading] = useState(false);

  const joinedTeamIds = memberships.map((m) => m.team_id);

  const handleSelectTeam = async (teamId: string) => {
    setLoading(true);
    const supabase = createClient();

    // まだ参加していなければ参加
    if (!joinedTeamIds.includes(teamId)) {
      await supabase.from('team_members').insert({
        team_id: teamId,
        user_id: userId,
        role: 'member',
      });
    }

    // アクティブチームに設定
    await supabase
      .from('users')
      .update({ current_team_id: teamId })
      .eq('id', userId);

    router.push('/dashboard');
    router.refresh();
  };

  const handleCreateTeam = async () => {
    if (!newTeamName.trim()) return;
    setLoading(true);
    const supabase = createClient();

    // UUIDをクライアント側で生成（INSERT後のSELECTがRLSで阻まれるため）
    const teamId = crypto.randomUUID();

    // チーム作成
    const { error: insertError } = await supabase
      .from('teams')
      .insert({ id: teamId, name: newTeamName.trim() });

    if (insertError) {
      setLoading(false);
      return;
    }

    // オーナーとして参加
    await supabase.from('team_members').insert({
      team_id: teamId,
      user_id: userId,
      role: 'owner',
    });

    // アクティブチームに設定
    await supabase
      .from('users')
      .update({ current_team_id: teamId })
      .eq('id', userId);

    router.push('/dashboard');
    router.refresh();
  };

  return (
    <Container maxWidth="xs" sx={{ minHeight: '100dvh', display: 'flex', alignItems: 'center' }}>
      <Paper elevation={0} sx={{ width: '100%', p: 4 }}>
        <Typography variant="h5" gutterBottom sx={{ fontWeight: 700, textAlign: 'center' }}>
          チームを選択
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', mb: 3 }}>
          所属するチームを選択するか、新しいチームを作成してください
        </Typography>

        {mode === 'select' ? (
          <>
            {/* 既存チーム一覧 */}
            {allTeams.map((team) => {
              const isJoined = joinedTeamIds.includes(team.id);
              return (
                <Card key={team.id} variant="outlined" sx={{ mb: 1 }}>
                  <CardActionArea
                    onClick={() => handleSelectTeam(team.id)}
                    disabled={loading}
                  >
                    <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 1.5, py: 1.5 }}>
                      <GroupIcon color="primary" />
                      <Box sx={{ flexGrow: 1 }}>
                        <Typography variant="subtitle2">{team.name}</Typography>
                      </Box>
                      {isJoined && <CheckCircleIcon color="success" fontSize="small" />}
                    </CardContent>
                  </CardActionArea>
                </Card>
              );
            })}

            <Divider sx={{ my: 2 }}>または</Divider>

            <Button
              fullWidth
              variant="outlined"
              startIcon={<AddIcon />}
              onClick={() => setMode('create')}
            >
              新しいチームを作成
            </Button>
          </>
        ) : (
          <>
            <TextField
              label="チーム名"
              fullWidth
              value={newTeamName}
              onChange={(e) => setNewTeamName(e.target.value)}
              autoFocus
              sx={{ mb: 2 }}
            />
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button
                variant="outlined"
                onClick={() => setMode('select')}
                disabled={loading}
                sx={{ flex: 1 }}
              >
                戻る
              </Button>
              <Button
                variant="contained"
                onClick={handleCreateTeam}
                disabled={loading || !newTeamName.trim()}
                sx={{ flex: 1 }}
              >
                {loading ? '作成中...' : '作成'}
              </Button>
            </Box>
          </>
        )}
      </Paper>
    </Container>
  );
}
