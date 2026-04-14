import { createClient } from '@/lib/supabase/server';
import SettingsContent from '@/components/settings/SettingsContent';

export default async function SettingsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // profile と team_members を並列取得
  const [{ data: profile }, { data: memberRows }] = await Promise.all([
    supabase.from('users').select('*').eq('id', user!.id).single(),
    supabase.from('team_members').select('team_id, role').eq('user_id', user!.id),
  ]);

  // チーム情報を取得
  const teamIds = (memberRows ?? []).map((m) => m.team_id);
  let teams: { id: string; name: string }[] = [];
  if (teamIds.length > 0) {
    const { data: teamRows } = await supabase
      .from('teams')
      .select('id, name')
      .in('id', teamIds);
    teams = teamRows ?? [];
  }

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
