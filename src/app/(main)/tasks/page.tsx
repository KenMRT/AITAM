import { createClient } from '@/lib/supabase/server';
import TaskViewSwitch from '@/components/task/TaskViewSwitch';

interface TasksPageProps {
  searchParams: Promise<{ project?: string; filter?: string }>;
}

export default async function TasksPage({ searchParams }: TasksPageProps) {
  const [params, supabase] = await Promise.all([searchParams, createClient()]);
  const { data: { user } } = await supabase.auth.getUser();

  // profile と projects を並列取得
  let projectsQuery = supabase
    .from('projects')
    .select('*, tasks(*, task_links(*))')
    .order('created_at', { ascending: false });

  if (params.project) {
    projectsQuery = projectsQuery.eq('id', params.project);
  }

  const [{ data: profile }, { data: projects }] = await Promise.all([
    supabase.from('users').select('current_team_id').eq('id', user!.id).single(),
    projectsQuery,
  ]);

  const teamId = profile?.current_team_id;
  const filtered = (projects ?? []).filter((p) => p.team_id === teamId);

  return (
    <TaskViewSwitch
      projects={filtered}
      filterProjectId={params.project || null}
      dateFilter={params.filter || null}
    />
  );
}
