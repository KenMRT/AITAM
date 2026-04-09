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
import FolderIcon from '@mui/icons-material/Folder';
import AssignmentIcon from '@mui/icons-material/Assignment';
import WarningIcon from '@mui/icons-material/Warning';
import { Project, Task } from '@/types/database';
import { useSettings } from '@/lib/SettingsContext';

interface ProjectWithTasks extends Project {
  tasks: Task[];
}

interface DashboardContentProps {
  projects: ProjectWithTasks[];
}

const statusColor: Record<string, 'default' | 'info' | 'warning' | 'success'> = {
  '提案（未定）': 'default',
  '提案（高）': 'info',
  '制作中': 'warning',
  '納品済': 'success',
};

function formatDueDate(dueDate: string): string {
  const d = new Date(dueDate);
  const dateStr = `${d.getMonth() + 1}/${d.getDate()}`;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diff = Math.ceil((d.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

  if (diff < 0) return `${Math.abs(diff)}日超過 (${dateStr})`;
  if (diff === 0) return `今日 (${dateStr})`;
  if (diff === 1) return `明日 (${dateStr})`;
  if (diff <= 7) return `${diff}日後 (${dateStr})`;
  return dateStr;
}

export default function DashboardContent({ projects }: DashboardContentProps) {
  const router = useRouter();
  const { settings } = useSettings();

  // 納品済プロジェクトフィルタ + 完了タスクフィルタ
  const displayProjects = projects
    .filter((p) => settings.showDelivered || p.status !== '納品済')
    .map((p) => settings.showCompleted ? p : { ...p, tasks: p.tasks.filter((t) => t.status !== '完了') });

  const totalProjects = displayProjects.length;
  const totalTasks = displayProjects.reduce((sum, p) => sum + p.tasks.length, 0);
  const overdueTasks = displayProjects.reduce(
    (sum, p) =>
      sum +
      p.tasks.filter(
        (t) => t.due_date && new Date(t.due_date) < new Date() && t.status !== '完了',
      ).length,
    0,
  );

  // 直近タスク: 未完了 & 期限あり、期日順に5件
  const upcomingTasks = displayProjects
    .flatMap((p) =>
      p.tasks
        .filter((t) => t.due_date && t.status !== '完了')
        .map((t) => ({ ...t, projectName: p.name }))
    )
    .sort((a, b) => new Date(a.due_date!).getTime() - new Date(b.due_date!).getTime())
    .slice(0, 5);

  // プロジェクトをタスクの最も近い期日順にソート
  const sortedProjects = [...displayProjects]
    .map((p) => {
      const nearestDue = p.tasks
        .filter((t) => t.due_date && t.status !== '完了')
        .map((t) => new Date(t.due_date!).getTime())
        .sort((a, b) => a - b)[0] ?? null;
      return { ...p, nearestDue };
    })
    .sort((a, b) => {
      if (a.nearestDue !== null && b.nearestDue === null) return -1;
      if (a.nearestDue === null && b.nearestDue !== null) return 1;
      if (a.nearestDue !== null && b.nearestDue !== null) {
        if (a.nearestDue !== b.nearestDue) return a.nearestDue - b.nearestDue;
      }
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

  return (
    <Container maxWidth="sm" sx={{ py: 2 }}>
      <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
        ダッシュボード
      </Typography>

      {/* 直近タスク */}
      {upcomingTasks.length > 0 && (
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
            直近タスク
          </Typography>
          {upcomingTasks.map((task) => {
            const isOverdue = new Date(task.due_date!) < new Date();
            return (
              <Card
                key={task.id}
                variant="outlined"
                sx={{
                  mb: 0.75,
                  borderLeft: '3px solid',
                  borderLeftColor: isOverdue ? 'error.main' : 'primary.main',
                }}
              >
                <CardContent sx={{ py: 1, px: 2, '&:last-child': { pb: 1 } }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box sx={{ minWidth: 0, flex: 1 }}>
                      <Typography variant="body2" sx={{ fontWeight: 500 }} noWrap>
                        {task.title}
                      </Typography>
                      <Typography
                        variant="caption"
                        color="primary"
                        sx={{ cursor: 'pointer', '&:hover': { textDecoration: 'underline' } }}
                        onClick={() => router.push(`/tasks?project=${task.project_id}`)}
                      >
                        {task.projectName}
                      </Typography>
                    </Box>
                    <Typography
                      variant="caption"
                      sx={{
                        ml: 1,
                        flexShrink: 0,
                        color: isOverdue ? 'error.main' : 'text.secondary',
                        fontWeight: isOverdue ? 600 : 400,
                      }}
                    >
                      {formatDueDate(task.due_date!)}
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            );
          })}
        </Box>
      )}

      {/* サマリーカード */}
      <Box sx={{ display: 'flex', gap: 1.5, mb: 3, overflowX: 'auto' }}>
        <SummaryCard
          icon={<FolderIcon color="primary" />}
          label="プロジェクト"
          value={totalProjects}
        />
        <SummaryCard
          icon={<AssignmentIcon color="info" />}
          label="タスク"
          value={totalTasks}
        />
        <SummaryCard
          icon={<WarningIcon color="error" />}
          label="期限超過"
          value={overdueTasks}
        />
      </Box>

      {/* プロジェクト一覧 */}
      <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
        プロジェクト
      </Typography>

      {sortedProjects.length === 0 ? (
        <Card variant="outlined">
          <CardContent>
            <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center' }}>
              プロジェクトがありません。AIに「新しいプロジェクトを作成して」と話しかけてみましょう。
            </Typography>
          </CardContent>
        </Card>
      ) : (
        sortedProjects.map((project) => {
          const completedTasks = project.tasks.filter((t) => t.status === '完了').length;
          const progress = project.tasks.length > 0
            ? Math.round((completedTasks / project.tasks.length) * 100)
            : 0;

          return (
            <Card key={project.id} variant="outlined" sx={{ mb: 1.5 }}>
              <CardActionArea onClick={() => router.push(`/tasks?project=${project.id}`)}>
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
                  <Typography variant="caption" color="text.secondary">
                    {completedTasks}/{project.tasks.length} タスク完了
                  </Typography>
                </CardContent>
              </CardActionArea>
            </Card>
          );
        })
      )}
    </Container>
  );
}

function SummaryCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
}) {
  return (
    <Card variant="outlined" sx={{ minWidth: 100, flex: 1 }}>
      <CardContent sx={{ py: 1.5, px: 2, '&:last-child': { pb: 1.5 } }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5 }}>
          {icon}
          <Typography variant="caption" color="text.secondary">
            {label}
          </Typography>
        </Box>
        <Typography variant="h5" sx={{ fontWeight: 700 }}>
          {value}
        </Typography>
      </CardContent>
    </Card>
  );
}
