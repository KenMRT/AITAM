import { createClient } from '@/lib/supabase/server';
import TaskViewSwitch from '@/components/task/TaskViewSwitch';

interface TasksPageProps {
  searchParams: Promise<{ project?: string; filter?: string }>;
}

export default async function TasksPage({ searchParams }: TasksPageProps) {
  const params = await searchParams;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from('users')
    .select('current_team_id')
    .eq('id', user!.id)
    .single();

  const teamId = profile!.current_team_id!;

  // プロジェクト一覧を取得（タスク付き）
  let projectsQuery = supabase
    .from('projects')
    .select('*, tasks(*, task_links(*))')
    .eq('team_id', teamId)
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
