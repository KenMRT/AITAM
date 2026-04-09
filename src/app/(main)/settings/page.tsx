import { createClient } from '@/lib/supabase/server';
import SettingsContent from '@/components/settings/SettingsContent';

export default async function SettingsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from('users')
    .select('*')
    .eq('id', user!.id)
    .single();

  // ユーザーの所属チーム一覧（team_membersからteam_idを取得し、別クエリでチーム情報を取得）
  const { data: memberRows } = await supabase
    .from('team_members')
    .select('team_id, role')
    .eq('user_id', user!.id);

  const teamIds = (memberRows ?? []).map((m) => m.team_id);
  let teams: { id: string; name: string }[] = [];
  if (teamIds.length > 0) {
    const { data: teamRows } = await supabase
      .from('teams')
      .select('id, name')
      .in('id', teamIds);
    teams = teamRows ?? [];
  }

  // team_members + teams を結合
  const memberships = (memberRows ?? []).map((m) => {
    const team = teams.find((t) => t.id === m.team_id) ?? null;
    return { team_id: m.team_id, role: m.role, teams: team };
  });

  return (
    <SettingsContent
      profile={profile}
      email={user!.email ?? ''}
      memberships={memberships}
      currentTeamId={profile?.current_team_id ?? null}
    />
  );
}
