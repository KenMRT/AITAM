export type ProjectStatus = '提案（未定）' | '提案（高）' | '制作中' | '納品済';
export type TaskStatus = '未着手' | '進行中' | 'レビュー中' | '完了';
export type TaskPriority = '高' | '中' | '低';

export type TeamMemberRole = 'owner' | 'member';

export interface Team {
  id: string;
  name: string;
  created_at: string;
  updated_at: string;
}

export interface TeamMember {
  id: string;
  team_id: string;
  user_id: string;
  role: TeamMemberRole;
  created_at: string;
}

export interface User {
  id: string;
  display_name: string;
  avatar_url: string | null;
  current_team_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface Project {
  id: string;
  user_id: string;
  team_id: string | null;
  name: string;
  description: string | null;
  status: ProjectStatus;
  created_at: string;
  updated_at: string;
}

export interface Task {
  id: string;
  project_id: string;
  user_id: string;
  assignee_id: string | null;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  due_date: string | null;
  created_at: string;
  updated_at: string;
}

export interface TaskLink {
  id: string;
  task_id: string;
  url: string;
  label: string | null;
  created_at: string;
}
