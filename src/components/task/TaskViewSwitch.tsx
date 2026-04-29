'use client';

import { useEffect } from 'react';
import { useSettings } from '@/lib/SettingsContext';
import { useProject } from '@/lib/ProjectContext';
import TaskListContent from './TaskListContent';
import TaskCalendarView from './TaskCalendarView';
import { Project, Task, TaskLink } from '@/types/database';

interface TaskWithLinks extends Task {
  task_links: TaskLink[];
}

interface ProjectWithTasks extends Project {
  tasks: TaskWithLinks[];
}

interface TaskViewSwitchProps {
  projects: ProjectWithTasks[];
  filterProjectId: string | null;
  dateFilter: string | null;
}

export default function TaskViewSwitch({ projects, filterProjectId, dateFilter }: TaskViewSwitchProps) {
  const { settings } = useSettings();
  const { setCurrentProject } = useProject();

  // フィルタ中のプロジェクト情報をコンテキストに設定
  useEffect(() => {
    if (filterProjectId) {
      const project = projects.find(p => p.id === filterProjectId);
      if (project) {
        setCurrentProject({ id: project.id, name: project.name });
      }
    } else {
      setCurrentProject(null);
    }
  }, [filterProjectId, projects, setCurrentProject]);

  // 日付フィルタがある場合は常にリスト表示
  if (dateFilter) {
    return (
      <TaskListContent
        projects={projects}
        filterProjectId={filterProjectId}
        dateFilter={dateFilter}
      />
    );
  }

  if (settings.taskView === 'calendar') {
    return (
      <TaskCalendarView
        projects={projects}
        filterProjectId={filterProjectId}
      />
    );
  }

  return (
    <TaskListContent
      projects={projects}
      filterProjectId={filterProjectId}
      dateFilter={null}
    />
  );
}
