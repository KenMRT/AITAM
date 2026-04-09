import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import OnboardingContent from '@/components/onboarding/OnboardingContent';

export default async function OnboardingPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // 所属チームを取得
  const { data: memberships } = await supabase
    .from('team_members')
    .select('team_id, role, teams(id, name)')
    .eq('user_id', user.id);

  // 全チーム一覧（参加可能なチーム）
  const { data: allTeams } = await supabase
    .from('teams')
    .select('id, name');

  return (
    <OnboardingContent
      userId={user.id}
      memberships={memberships ?? []}
      allTeams={allTeams ?? []}
    />
  );
}
