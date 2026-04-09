import { createClient } from '@/lib/supabase/server';
import DashboardContent from '@/components/dashboard/DashboardContent';

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from('users')
    .select('current_team_id')
    .eq('id', user!.id)
    .single();

  const { data: projects } = await supabase
    .from('projects')
    .select('*, tasks(*)')
    .eq('team_id', profile!.current_team_id!)
    .order('created_at', { ascending: false });

  return <DashboardContent projects={projects ?? []} />;
}
