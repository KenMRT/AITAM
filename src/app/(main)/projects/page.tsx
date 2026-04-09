import { createClient } from '@/lib/supabase/server';
import ProjectList from '@/components/project/ProjectList';

export default async function ProjectsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from('users')
    .select('current_team_id')
    .eq('id', user!.id)
    .single();

  const { data: projects } = await supabase
    .from('projects')
    .select('*, tasks(id, status, due_date)')
    .eq('team_id', profile!.current_team_id!)
    .order('created_at', { ascending: false });

  return <ProjectList projects={projects ?? []} />;
}
