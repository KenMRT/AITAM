import { createClient } from '@/lib/supabase/server';
import { getProfile } from '@/lib/supabase/cached';
import DashboardContent from '@/components/dashboard/DashboardContent';

export default async function DashboardPage() {
  // profile は cached（Layout と共有）、projects のみ取得
  const [profile, supabase] = await Promise.all([getProfile(), createClient()]);
  const teamId = profile?.current_team_id;

  const { data: projects } = await supabase
    .from('projects')
    .select('*, tasks(*)')
    .eq('team_id', teamId!)
    .order('created_at', { ascending: false });

  return <DashboardContent projects={projects ?? []} />;
}
