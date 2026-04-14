'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Container,
  Typography,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { Project, Task, TaskLink } from '@/types/database';
import { useSettings } from '@/lib/SettingsContext';
import { useTaskNumbers } from '@/lib/TaskNumberContext';

interface TaskWithLinks extends Task {
  task_links: TaskLink[];
}

interface ProjectWithTasks extends Project {
  tasks: TaskWithLinks[];
}

interface FlatTask extends TaskWithLinks {
  projectName: string;
}

interface TaskListContentProps {
  projects: ProjectWithTasks[];
  filterProjectId: string | null;
  dateFilter: string | null;
}

const priorityColor: Record<string, 'error' | 'warning' | 'default'> = {
  '高': 'error',
  '中': 'warning',
  '低': 'default',
};

const statusColor: Record<string, 'default' | 'info' | 'warning' | 'success'> = {
  '未着手': 'default',
  '進行中': 'info',
  'レビュー中': 'warning',
  '完了': 'success',
};

function formatDueDate(dueDate: string | null): string | null {
  if (!dueDate) return null;
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

function isOverdue(task: Task): boolean {
  if (!task.due_date || task.status === '完了') return false;
  return new Date(task.due_date) < new Date();
}

function getDateRange(filter: string): { start: Date; end: Date; label: string } {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (filter === 'today') {
    const end = new Date(today);
    end.setHours(23, 59, 59, 999);
    return { start: today, end, label: '今日のタスク' };
  }

  if (filter === 'week') {
    const day = today.getDay();
    const start = new Date(today);
    start.setDate(today.getDate() - (day === 0 ? 6 : day - 1)); // 月曜日
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    end.setHours(23, 59, 59, 999);
    return { start, end, label: '今週のタスク' };
  }

  // fallback
  return { start: today, end: new Date(9999, 11, 31), label: 'タスク' };
}

function TaskCard({ task, showProject, projectName, number }: { task: TaskWithLinks; showProject?: boolean; projectName?: string; number?: number }) {
  return (
    <Card
      variant="outlined"
      sx={{
        mb: 1,
        borderLeft: '3px solid',
        borderLeftColor: isOverdue(task)
          ? 'error.main'
          : task.status === '完了'
            ? 'success.main'
            : task.due_date
              ? 'primary.main'
              : 'grey.300',
      }}
    >
      <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, minWidth: 0 }}>
            {number !== undefined && (
              <Typography variant="caption" sx={{ color: 'text.disabled', fontWeight: 700, fontSize: '0.7rem', flexShrink: 0 }}>
                {number}
              </Typography>
            )}
            <Typography
              variant="body2"
              sx={{
                fontWeight: 500,
                textDecoration: task.status === '完了' ? 'line-through' : 'none',
                color: task.status === '完了' ? 'text.secondary' : 'text.primary',
              }}
            >
              {task.title}
            </Typography>
          </Box>
          <Chip
            label={task.status}
            size="small"
            color={statusColor[task.status] ?? 'default'}
            sx={{ height: 22, fontSize: '0.7rem', ml: 1, flexShrink: 0 }}
          />
        </Box>

        {showProject && projectName && (
          <Typography variant="caption" color="primary" sx={{ display: 'block', mt: 0.25 }}>
            {projectName}
          </Typography>
        )}

        {task.description && (
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
            {task.description}
          </Typography>
        )}

        <Box sx={{ display: 'flex', gap: 0.5, mt: 1, flexWrap: 'wrap', alignItems: 'center' }}>
          <Chip
            label={task.priority}
            size="small"
            color={priorityColor[task.priority] ?? 'default'}
            variant="outlined"
            sx={{ height: 20, fontSize: '0.65rem' }}
          />
          {task.due_date && (
            <Typography
              variant="caption"
              sx={{
                color: isOverdue(task) ? 'error.main' : 'text.secondary',
                fontWeight: isOverdue(task) ? 600 : 400,
              }}
            >
              {formatDueDate(task.due_date)}
            </Typography>
          )}
          {!task.due_date && (
            <Typography variant="caption" color="text.disabled">
              期限なし
            </Typography>
          )}
        </Box>

        {task.task_links.length > 0 && (
          <Box sx={{ mt: 0.5 }}>
            {task.task_links.map((link) => (
              <Typography key={link.id} variant="caption">
                <a
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: '#1976d2' }}
                >
                  {link.label || link.url}
                </a>
              </Typography>
            ))}
          </Box>
        )}
      </CardContent>
    </Card>
  );
}

export default function TaskListContent({ projects, filterProjectId, dateFilter }: TaskListContentProps) {
  const router = useRouter();
  const { settings } = useSettings();
  const { setMapping } = useTaskNumbers();
  const isFiltered = !!filterProjectId || !!dateFilter;

  // 納品済プロジェクトフィルタ + 完了タスクフィルタ
  const filteredProjects = projects
    .filter((p) => settings.showDelivered || p.status !== '納品済')
    .map((p) => settings.showCompleted ? p : { ...p, tasks: p.tasks.filter((t) => t.status !== '完了') });

  // 日付フィルタモード: プロジェクトをまたいでフラット表示
  if (dateFilter) {
    const { start, end, label } = getDateRange(dateFilter);

    const flatTasks: FlatTask[] = filteredProjects.flatMap((p) =>
      p.tasks
        .filter((t) => {
          if (!t.due_date) return false;
          const d = new Date(t.due_date);
          return d >= start && d <= end;
        })
        .map((t) => ({ ...t, projectName: p.name }))
    );

    // 期日順ソート
    flatTasks.sort((a, b) => {
      return new Date(a.due_date!).getTime() - new Date(b.due_date!).getTime();
    });

    // eslint-disable-next-line react-hooks/rules-of-hooks
    useEffect(() => {
      setMapping({
        projects: [],
        tasks: flatTasks.map((t, i) => ({ number: i + 1, id: t.id, title: t.title, projectName: t.projectName })),
      });
    }, [flatTasks.map(t => t.id).join(',')]);

    return (
      <Container maxWidth="sm" sx={{ py: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
          <Button
            size="small"
            startIcon={<ArrowBackIcon />}
            onClick={() => router.push('/tasks')}
            sx={{ minWidth: 'auto' }}
          >
            全て
          </Button>
          <Typography variant="h6" sx={{ fontWeight: 700 }}>
            {label}
          </Typography>
        </Box>

        {flatTasks.length === 0 ? (
          <Card variant="outlined">
            <CardContent>
              <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center' }}>
                {label}はありません。
              </Typography>
            </CardContent>
          </Card>
        ) : (
          flatTasks.map((task, i) => (
            <TaskCard key={task.id} task={task} showProject projectName={task.projectName} number={i + 1} />
          ))
        )}
      </Container>
    );
  }

  // 通常モード: プロジェクトごとにグループ表示
  // タスクをソートし、プロジェクトの最も近い期日を算出
  const sortedProjects = filteredProjects
    .map((p) => {
      const tasks = [...p.tasks].sort((a, b) => {
        if (a.due_date && !b.due_date) return -1;
        if (!a.due_date && b.due_date) return 1;
        if (a.due_date && b.due_date) {
          return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
        }
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      });
      // 未完了タスクの最も近い期日
      const nearestDue = tasks
        .filter((t) => t.due_date && t.status !== '完了')
        .map((t) => new Date(t.due_date!).getTime())[0] ?? null;
      return { ...p, tasks, nearestDue };
    })
    .sort((a, b) => {
      // 期日ありが先
      if (a.nearestDue !== null && b.nearestDue === null) return -1;
      if (a.nearestDue === null && b.nearestDue !== null) return 1;
      // 両方期日あり → 近い順
      if (a.nearestDue !== null && b.nearestDue !== null) {
        if (a.nearestDue !== b.nearestDue) return a.nearestDue - b.nearestDue;
      }
      // 同じ期日 or 両方なし → 登録が新しい順
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

  const hasProjects = sortedProjects.length > 0;
  const hasTasks = sortedProjects.some((p) => p.tasks.length > 0);

  // 通し番号を割り当て
  let taskCounter = 0;
  const numberedProjects = sortedProjects.map((p) => ({
    ...p,
    tasks: p.tasks.map((t) => ({ ...t, _number: ++taskCounter })),
  }));

  // マッピング登録
  useEffect(() => {
    const tasks = numberedProjects.flatMap((p) =>
      p.tasks.map((t) => ({ number: t._number, id: t.id, title: t.title, projectName: p.name }))
    );
    setMapping({
      projects: numberedProjects.map((p, i) => ({ number: i + 1, id: p.id, name: p.name })),
      tasks,
    });
  }, [numberedProjects.flatMap(p => p.tasks.map(t => t.id)).join(',')]);

  return (
    <Container maxWidth="sm" sx={{ py: 2 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
        {isFiltered && (
          <Button
            size="small"
            startIcon={<ArrowBackIcon />}
            onClick={() => router.push('/tasks')}
            sx={{ minWidth: 'auto' }}
          >
            全て
          </Button>
        )}
        <Typography variant="h6" sx={{ fontWeight: 700 }}>
          タスク
        </Typography>
      </Box>

      {!hasProjects && (
        <Card variant="outlined">
          <CardContent>
            <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center' }}>
              プロジェクトがありません。AIに「新しいプロジェクトを作成して」と話しかけてみましょう。
            </Typography>
          </CardContent>
        </Card>
      )}

      {hasProjects && !hasTasks && (
        <Card variant="outlined">
          <CardContent>
            <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center' }}>
              タスクがありません。AIに「タスクを追加して」と話しかけてみましょう。
            </Typography>
          </CardContent>
        </Card>
      )}

      {numberedProjects.map((project) => {
        if (project.tasks.length === 0) return null;

        return (
          <Box key={project.id} sx={{ mb: 3 }}>
            <Box sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography
                variant="subtitle2"
                color="text.secondary"
                sx={{
                  ...(!filterProjectId && {
                    cursor: 'pointer',
                    '&:hover': { textDecoration: 'underline', color: 'primary.main' },
                  }),
                }}
                onClick={!filterProjectId ? () => router.push(`/tasks?project=${project.id}`) : undefined}
              >
                {project.name}
              </Typography>
              <Chip label={project.status} size="small" variant="outlined" sx={{ height: 20, fontSize: '0.7rem' }} />
            </Box>
            {project.description && (
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: -0.5, mb: 1 }}>
                {project.description}
              </Typography>
            )}

            {project.tasks.map((task) => (
              <TaskCard key={task.id} task={task} number={task._number} />
            ))}
          </Box>
        );
      })}
    </Container>
  );
}
