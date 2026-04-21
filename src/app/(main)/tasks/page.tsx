import { createClient } from '@/lib/supabase/server';
import { getProfile } from '@/lib/supabase/cached';
import TaskViewSwitch from '@/components/task/TaskViewSwitch';

interface TasksPageProps {
  searchParams: Promise<{ project?: string; filter?: string }>;
}

export default async function TasksPage({ searchParams }: TasksPageProps) {
  // profile は cached（Layout と共有）
  const [params, profile, supabase] = await Promise.all([
    searchParams,
    getProfile(),
    createClient(),
  ]);
  const teamId = profile?.current_team_id;

  let projectsQuery = supabase
    .from('projects')
    .select('*, tasks(*, task_links(*))')
    .eq('team_id', teamId!)
    .order('created_at', { ascending: false });

  if (params.project) {
    projectsQuery = projectsQuery.eq('id', params.project);
  }

  const { data: projects } = await projectsQuery;

  return (
    <TaskViewSwitch
      projects={projects ?? []}
      filterProjectId={params.project || null}
      dateFilter={params.filter || null}
    />
  );
}
