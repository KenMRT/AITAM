import { createClient } from '@/lib/supabase/server';
import DashboardContent from '@/components/dashboard/DashboardContent';

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // profile と projects を並列取得
  const [{ data: profile }, { data: projects }] = await Promise.all([
    supabase.from('users').select('current_team_id').eq('id', user!.id).single(),
    supabase.from('projects').select('*, tasks(*)').order('created_at', { ascending: false }),
  ]);

  // RLSでチームフィルタ済みだが、current_team_idで追加フィルタ
  const teamId = profile?.current_team_id;
  const filtered = (projects ?? []).filter((p) => p.team_id === teamId);

  return <DashboardContent projects={filtered} />;
}
