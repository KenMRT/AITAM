import { createClient } from '@/lib/supabase/server';
import { getProfile } from '@/lib/supabase/cached';
import ProjectList from '@/components/project/ProjectList';

export default async function ProjectsPage() {
  // profile は cached（Layout と共有）、createClient と並列
  const [profile, supabase] = await Promise.all([getProfile(), createClient()]);
  const teamId = profile?.current_team_id;

  const { data: projects } = await supabase
    .from('projects')
    .select('*, tasks(id, status, due_date)')
    .eq('team_id', teamId!)
    .order('created_at', { ascending: false });

  return <ProjectList projects={projects ?? []} />;
}
