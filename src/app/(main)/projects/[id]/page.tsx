import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import ProjectDetail from '@/components/project/ProjectDetail';

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: project } = await supabase
    .from('projects')
    .select('*, tasks(*, task_links(*))')
    .eq('id', id)
    .single();

  if (!project) {
    notFound();
  }

  return <ProjectDetail project={project} />;
}
