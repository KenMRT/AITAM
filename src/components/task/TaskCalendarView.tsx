'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Container,
  IconButton,
  Typography,
} from '@mui/material';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { Project, Task, TaskLink } from '@/types/database';
import { useSettings } from '@/lib/SettingsContext';

interface TaskWithLinks extends Task {
  task_links: TaskLink[];
}

interface ProjectWithTasks extends Project {
  tasks: TaskWithLinks[];
}

interface TaskCalendarViewProps {
  projects: ProjectWithTasks[];
  filterProjectId: string | null;
}

interface CalendarTask extends Task {
  projectName: string;
  projectId: string;
}

const priorityColor: Record<string, 'error' | 'warning' | 'default'> = {
  '高': 'error',
  '中': 'warning',
  '低': 'default',
};

const statusDot: Record<string, string> = {
  '未着手': '#bdbdbd',
  '進行中': '#2196f3',
  'レビュー中': '#ff9800',
  '完了': '#4caf50',
};

export default function TaskCalendarView({ projects, filterProjectId }: TaskCalendarViewProps) {
  const router = useRouter();
  const { settings } = useSettings();
  const [currentDate, setCurrentDate] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });

  const isFiltered = !!filterProjectId;

  // 納品済プロジェクトフィルタ + 完了タスクフィルタ
  const filteredProjects = projects
    .filter((p) => settings.showDelivered || p.status !== '納品済')
    .map((p) => settings.showCompleted ? p : { ...p, tasks: p.tasks.filter((t) => t.status !== '完了') });

  // 全タスクをフラット化
  const allTasks: CalendarTask[] = filteredProjects.flatMap((p) =>
    p.tasks
      .filter((t) => t.due_date)
      .map((t) => ({ ...t, projectName: p.name, projectId: p.id }))
  );

  // タスクを日付でグルーピング
  const tasksByDate = new Map<string, CalendarTask[]>();
  for (const task of allTasks) {
    const key = task.due_date!;
    if (!tasksByDate.has(key)) tasksByDate.set(key, []);
    tasksByDate.get(key)!.push(task);
  }

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);

  // 月曜始まり
  const startDow = (firstDay.getDay() + 6) % 7;
  const totalDays = lastDay.getDate();

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));
  const goToday = () => {
    const d = new Date();
    setCurrentDate(new Date(d.getFullYear(), d.getMonth(), 1));
  };

  // カレンダーのセルを生成
  const cells: (number | null)[] = [];
  for (let i = 0; i < startDow; i++) cells.push(null);
  for (let d = 1; d <= totalDays; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);

  const weekDays = ['月', '火', '水', '木', '金', '土', '日'];

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

      {/* 月ナビゲーション */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
        <IconButton size="small" onClick={prevMonth}>
          <ChevronLeftIcon />
        </IconButton>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
            {year}年{month + 1}月
          </Typography>
          <Button size="small" variant="text" onClick={goToday} sx={{ minWidth: 'auto', fontSize: '0.75rem' }}>
            今日
          </Button>
        </Box>
        <IconButton size="small" onClick={nextMonth}>
          <ChevronRightIcon />
        </IconButton>
      </Box>

      {/* 曜日ヘッダー */}
      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 0 }}>
        {weekDays.map((d, i) => (
          <Box key={d} sx={{ textAlign: 'center', py: 0.5 }}>
            <Typography
              variant="caption"
              color={i >= 5 ? (i === 5 ? 'primary.main' : 'error.main') : 'text.secondary'}
              sx={{ fontWeight: 600 }}
            >
              {d}
            </Typography>
          </Box>
        ))}
      </Box>

      {/* カレンダーグリッド */}
      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 0 }}>
        {cells.map((day, idx) => {
          if (day === null) {
            return <Box key={`empty-${idx}`} sx={{ minHeight: 60, borderTop: '1px solid', borderColor: 'divider' }} />;
          }

          const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
          const dayTasks = tasksByDate.get(dateStr) || [];
          const isToday = dateStr === todayStr;
          const dow = idx % 7;

          return (
            <Box
              key={dateStr}
              sx={{
                minHeight: 60,
                borderTop: '1px solid',
                borderColor: 'divider',
                p: 0.25,
                bgcolor: isToday ? 'primary.50' : 'transparent',
              }}
            >
              <Typography
                variant="caption"
                sx={{
                  fontWeight: isToday ? 700 : 400,
                  color: isToday ? 'primary.main' : dow === 5 ? 'primary.main' : dow === 6 ? 'error.main' : 'text.primary',
                  display: 'block',
                  textAlign: 'right',
                  px: 0.5,
                  fontSize: '0.7rem',
                }}
              >
                {day}
              </Typography>
              {dayTasks.slice(0, 3).map((task) => (
                <Box
                  key={task.id}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 0.25,
                    px: 0.25,
                    borderRadius: 0.5,
                    cursor: 'default',
                    '&:hover': { bgcolor: 'action.hover' },
                  }}
                >
                  <Box
                    sx={{
                      width: 6,
                      height: 6,
                      borderRadius: '50%',
                      bgcolor: statusDot[task.status] || '#bdbdbd',
                      flexShrink: 0,
                    }}
                  />
                  <Typography
                    variant="caption"
                    noWrap
                    sx={{
                      fontSize: '0.6rem',
                      lineHeight: 1.4,
                      textDecoration: task.status === '完了' ? 'line-through' : 'none',
                    }}
                  >
                    {task.title}
                  </Typography>
                </Box>
              ))}
              {dayTasks.length > 3 && (
                <Typography variant="caption" color="text.secondary" sx={{ px: 0.25, fontSize: '0.55rem' }}>
                  +{dayTasks.length - 3}件
                </Typography>
              )}
            </Box>
          );
        })}
      </Box>

      {/* 選択月のタスク一覧（日付順） */}
      <Box sx={{ mt: 3 }}>
        <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
          {month + 1}月のタスク
        </Typography>
        {(() => {
          const monthTasks = allTasks
            .filter((t) => {
              const d = new Date(t.due_date!);
              return d.getFullYear() === year && d.getMonth() === month;
            })
            .sort((a, b) => new Date(a.due_date!).getTime() - new Date(b.due_date!).getTime());

          if (monthTasks.length === 0) {
            return (
              <Typography variant="body2" color="text.secondary">
                タスクはありません
              </Typography>
            );
          }

          return monthTasks.map((task) => {
            const d = new Date(task.due_date!);
            const isOverdue = d < today && task.status !== '完了';
            return (
              <Card
                key={task.id}
                variant="outlined"
                sx={{
                  mb: 0.75,
                  borderLeft: '3px solid',
                  borderLeftColor: isOverdue ? 'error.main' : statusDot[task.status] || 'grey.300',
                }}
              >
                <CardContent sx={{ py: 1, px: 2, '&:last-child': { pb: 1 } }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box sx={{ minWidth: 0, flex: 1 }}>
                      <Typography
                        variant="body2"
                        sx={{
                          fontWeight: 500,
                          textDecoration: task.status === '完了' ? 'line-through' : 'none',
                        }}
                        noWrap
                      >
                        {task.title}
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <Typography
                          variant="caption"
                          color="primary"
                          sx={{
                            cursor: 'pointer',
                            '&:hover': { textDecoration: 'underline' },
                          }}
                          onClick={() => router.push(`/tasks?project=${task.projectId}`)}
                        >
                          {task.projectName}
                        </Typography>
                        <Chip
                          label={task.priority}
                          size="small"
                          color={priorityColor[task.priority] ?? 'default'}
                          variant="outlined"
                          sx={{ height: 18, fontSize: '0.6rem' }}
                        />
                      </Box>
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
                      {d.getMonth() + 1}/{d.getDate()}
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            );
          });
        })()}
      </Box>
    </Container>
  );
}
