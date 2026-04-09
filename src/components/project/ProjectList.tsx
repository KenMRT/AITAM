'use client';

import { useRouter } from 'next/navigation';
import {
  Box,
  Card,
  CardActionArea,
  CardContent,
  Chip,
  Container,
  LinearProgress,
  Typography,
} from '@mui/material';
import { Project, Task } from '@/types/database';

interface ProjectWithTasks extends Project {
  tasks: Pick<Task, 'id' | 'status' | 'due_date'>[];
}

interface ProjectListProps {
  projects: ProjectWithTasks[];
}

const statusColor: Record<string, 'default' | 'info' | 'warning' | 'success'> = {
  '提案（未定）': 'default',
  '提案（高）': 'info',
  '制作中': 'warning',
  '納品済': 'success',
};

export default function ProjectList({ projects }: ProjectListProps) {
  const router = useRouter();

  return (
    <Container maxWidth="sm" sx={{ py: 2 }}>
      <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
        プロジェクト
      </Typography>

      {projects.length === 0 ? (
        <Card variant="outlined">
          <CardContent>
            <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center' }}>
              プロジェクトがありません
            </Typography>
          </CardContent>
        </Card>
      ) : (
        projects.map((project) => {
          const completedTasks = project.tasks.filter((t) => t.status === '完了').length;
          const progress = project.tasks.length > 0
            ? Math.round((completedTasks / project.tasks.length) * 100)
            : 0;

          const nearestDue = project.tasks
            .filter((t) => t.due_date && t.status !== '完了')
            .sort((a, b) => new Date(a.due_date!).getTime() - new Date(b.due_date!).getTime())[0];

          return (
            <Card key={project.id} variant="outlined" sx={{ mb: 1.5 }}>
              <CardActionArea onClick={() => router.push(`/projects/${project.id}`)}>
                <CardContent sx={{ pb: '12px !important' }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                      {project.name}
                    </Typography>
                    <Chip
                      label={project.status}
                      size="small"
                      color={statusColor[project.status] ?? 'default'}
                      variant="outlined"
                    />
                  </Box>

                  {project.description && (
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }} noWrap>
                      {project.description}
                    </Typography>
                  )}

                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
                    <LinearProgress
                      variant="determinate"
                      value={progress}
                      sx={{ flexGrow: 1, height: 6, borderRadius: 3 }}
                    />
                    <Typography variant="caption" color="text.secondary" sx={{ minWidth: 36 }}>
                      {progress}%
                    </Typography>
                  </Box>

                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.5 }}>
                    <Typography variant="caption" color="text.secondary">
                      {completedTasks}/{project.tasks.length} タスク完了
                    </Typography>
                    {nearestDue && (
                      <Typography
                        variant="caption"
                        color={
                          new Date(nearestDue.due_date!) < new Date()
                            ? 'error'
                            : 'text.secondary'
                        }
                      >
                        次の締切: {new Date(nearestDue.due_date!).toLocaleDateString('ja-JP')}
                      </Typography>
                    )}
                  </Box>
                </CardContent>
              </CardActionArea>
            </Card>
          );
        })
      )}
    </Container>
  );
}
