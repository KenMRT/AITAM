-- ============================================
-- AITAM データベーススキーマ
-- ============================================

-- 1. users テーブル
create table public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default '',
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 2. projects テーブル
create table public.projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  name text not null,
  description text,
  status text not null default '提案（未定）'
    check (status in ('提案（未定）', '提案（高）', '制作中', '納品済')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 3. tasks テーブル
create table public.tasks (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  assignee_id uuid references public.users(id) on delete set null,
  title text not null,
  description text,
  status text not null default '未着手'
    check (status in ('未着手', '進行中', 'レビュー中', '完了')),
  priority text not null default '中'
    check (priority in ('高', '中', '低')),
  due_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 4. task_links テーブル
create table public.task_links (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references public.tasks(id) on delete cascade,
  url text not null,
  label text,
  created_at timestamptz not null default now()
);

-- ============================================
-- インデックス
-- ============================================
create index idx_projects_user_id on public.projects(user_id);
create index idx_tasks_project_id on public.tasks(project_id);
create index idx_tasks_assignee_id on public.tasks(assignee_id);
create index idx_tasks_due_date on public.tasks(due_date);
create index idx_tasks_status on public.tasks(status);
create index idx_task_links_task_id on public.task_links(task_id);

-- ============================================
-- updated_at 自動更新トリガー
-- ============================================
create or replace function public.update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger trg_users_updated_at
  before update on public.users
  for each row execute function public.update_updated_at();

create trigger trg_projects_updated_at
  before update on public.projects
  for each row execute function public.update_updated_at();

create trigger trg_tasks_updated_at
  before update on public.tasks
  for each row execute function public.update_updated_at();

-- ============================================
-- 新規ユーザー登録時に users レコードを自動作成
-- ============================================
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.users (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'display_name', ''));
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================
-- Row Level Security (RLS)
-- ============================================

-- users
alter table public.users enable row level security;

create policy "users: 自分のレコードを参照"
  on public.users for select
  using (auth.uid() = id);

create policy "users: 自分のレコードを更新"
  on public.users for update
  using (auth.uid() = id);

-- projects
alter table public.projects enable row level security;

create policy "projects: 自分のプロジェクトを参照"
  on public.projects for select
  using (auth.uid() = user_id);

create policy "projects: 自分のプロジェクトを作成"
  on public.projects for insert
  with check (auth.uid() = user_id);

create policy "projects: 自分のプロジェクトを更新"
  on public.projects for update
  using (auth.uid() = user_id);

create policy "projects: 自分のプロジェクトを削除"
  on public.projects for delete
  using (auth.uid() = user_id);

-- tasks
alter table public.tasks enable row level security;

create policy "tasks: 自分のプロジェクトのタスクを参照"
  on public.tasks for select
  using (
    exists (
      select 1 from public.projects
      where projects.id = tasks.project_id
      and projects.user_id = auth.uid()
    )
  );

create policy "tasks: 自分のプロジェクトにタスクを作成"
  on public.tasks for insert
  with check (
    exists (
      select 1 from public.projects
      where projects.id = tasks.project_id
      and projects.user_id = auth.uid()
    )
  );

create policy "tasks: 自分のプロジェクトのタスクを更新"
  on public.tasks for update
  using (
    exists (
      select 1 from public.projects
      where projects.id = tasks.project_id
      and projects.user_id = auth.uid()
    )
  );

create policy "tasks: 自分のプロジェクトのタスクを削除"
  on public.tasks for delete
  using (
    exists (
      select 1 from public.projects
      where projects.id = tasks.project_id
      and projects.user_id = auth.uid()
    )
  );

-- task_links
alter table public.task_links enable row level security;

create policy "task_links: 自分のタスクのリンクを参照"
  on public.task_links for select
  using (
    exists (
      select 1 from public.tasks
      join public.projects on projects.id = tasks.project_id
      where tasks.id = task_links.task_id
      and projects.user_id = auth.uid()
    )
  );

create policy "task_links: 自分のタスクにリンクを作成"
  on public.task_links for insert
  with check (
    exists (
      select 1 from public.tasks
      join public.projects on projects.id = tasks.project_id
      where tasks.id = task_links.task_id
      and projects.user_id = auth.uid()
    )
  );

create policy "task_links: 自分のタスクのリンクを更新"
  on public.task_links for update
  using (
    exists (
      select 1 from public.tasks
      join public.projects on projects.id = tasks.project_id
      where tasks.id = task_links.task_id
      and projects.user_id = auth.uid()
    )
  );

create policy "task_links: 自分のタスクのリンクを削除"
  on public.task_links for delete
  using (
    exists (
      select 1 from public.tasks
      join public.projects on projects.id = tasks.project_id
      where tasks.id = task_links.task_id
      and projects.user_id = auth.uid()
    )
  );
