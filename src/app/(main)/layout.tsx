import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import MainShell from '@/components/layout/MainShell';

export default async function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // プロフィール取得
  const { data: profile } = await supabase
    .from('users')
    .select('display_name, current_team_id')
    .eq('id', user.id)
    .single();

  const displayName = profile?.display_name || '';
  const teamId = profile?.current_team_id || '';

  // チーム名取得
  let teamName = '';
  if (teamId) {
    const { data: team } = await supabase.from('teams').select('name').eq('id', teamId).single();
    teamName = team?.name || '';
  }

  return (
    <MainShell displayName={displayName} teamName={teamName}>
      {children}
    </MainShell>
  );
}
