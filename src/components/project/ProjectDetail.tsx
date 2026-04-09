'use client';

import {
  Box,
  Card,
  CardContent,
  Chip,
  Container,
  Divider,
  IconButton,
  LinearProgress,
  Typography,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import LinkIcon from '@mui/icons-material/Link';
import { useRouter } from 'next/navigation';
import { Project, Task, TaskLink } from '@/types/database';

interface TaskWithLinks extends Task {
  task_links: TaskLink[];
}

interface ProjectWithTasks extends Project {
  tasks: TaskWithLinks[];
}

const statusColor: Record<string, 'default' | 'info' | 'warning' | 'success'> = {
  '提案（未定）': 'default',
  '提案（高）': 'info',
  '制作中': 'warning',
  '納品済': 'success',
};

const taskStatusColor: Record<string, 'default' | 'info' | 'warning' | 'success'> = {
  '未着手': 'default',
  '進行中': 'info',
  'レビュー中': 'warning',
  '完了': 'success',
};

const priorityColor: Record<string, 'error' | 'warning' | 'info'> = {
  '高': 'error',
  '中': 'warning',
  '低': 'info',
};

export default function ProjectDetail({ project }: { project: ProjectWithTasks }) {
  const router = useRouter();

  const tasks = project.tasks ?? [];
  const completedTasks = tasks.filter((t) => t.status === '完了').length;
  const progress = tasks.length > 0
    ? Math.round((completedTasks / tasks.length) * 100)
    : 0;

  const sortedTasks = [...tasks].sort((a, b) => {
    if (!a.due_date && !b.due_date) return 0;
    if (!a.due_date) return 1;
    if (!b.due_date) return -1;
    return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
  });

  return (
    <Container maxWidth="sm" sx={{ py: 2 }}>
      {/* ヘッダー */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
        <IconButton onClick={() => router.push('/projects')} size="small">
          <ArrowBackIcon />
        </IconButton>
        <Box sx={{ flexGrow: 1 }}>
          <Typography variant="h6" sx={{ fontWeight: 700 }}>
            {project.name}
          </Typography>
        </Box>
        <Chip
          label={project.status}
          size="small"
          color={statusColor[project.status] ?? 'default'}
          variant="outlined"
        />
      </Box>

      {project.description && (
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          {project.description}
        </Typography>
      )}

      {/* 進捗 */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
        <LinearProgress
          variant="determinate"
          value={progress}
          sx={{ flexGrow: 1, height: 8, borderRadius: 4 }}
        />
        <Typography variant="body2" sx={{ fontWeight: 600 }}>
          {progress}%
        </Typography>
      </Box>

      <Divider sx={{ mb: 2 }} />

      {/* タスク一覧 */}
      <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
        タスク ({tasks.length})
      </Typography>

      {sortedTasks.length === 0 ? (
        <Card variant="outlined">
          <CardContent>
            <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center' }}>
              タスクがありません。AIに「タスクを追加して」と話しかけてみましょう。
            </Typography>
          </CardContent>
        </Card>
      ) : (
        sortedTasks.map((task) => (
          <Card key={task.id} variant="outlined" sx={{ mb: 1.5 }}>
            <CardContent sx={{ pb: '12px !important' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 0.5 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                  {task.title}
                </Typography>
                <Box sx={{ display: 'flex', gap: 0.5, flexShrink: 0, ml: 1 }}>
                  <Chip
                    label={task.priority}
                    size="small"
                    color={priorityColor[task.priority]}
                    variant="filled"
                    sx={{ height: 20, fontSize: '0.7rem' }}
                  />
                  <Chip
                    label={task.status}
                    size="small"
                    color={taskStatusColor[task.status] ?? 'default'}
                    variant="outlined"
                    sx={{ height: 20, fontSize: '0.7rem' }}
                  />
                </Box>
              </Box>

              {task.description && (
                <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                  {task.description}
                </Typography>
              )}

              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                {task.due_date ? (
                  <Typography
                    variant="caption"
                    color={
                      new Date(task.due_date) < new Date() && task.status !== '完了'
                        ? 'error'
                        : 'text.secondary'
                    }
                  >
                    締切: {new Date(task.due_date).toLocaleDateString('ja-JP')}
                  </Typography>
                ) : (
                  <Typography variant="caption" color="text.secondary">
                    締切未設定
                  </Typography>
                )}
              </Box>

              {/* 関連リンク */}
              {task.task_links.length > 0 && (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 1 }}>
                  {task.task_links.map((link) => (
                    <Chip
                      key={link.id}
                      icon={<LinkIcon />}
                      label={link.label || new URL(link.url).hostname}
                      size="small"
                      variant="outlined"
                      component="a"
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      clickable
                      sx={{ height: 24, fontSize: '0.7rem' }}
                    />
                  ))}
                </Box>
              )}
            </CardContent>
          </Card>
        ))
      )}
    </Container>
  );
}
