-- ============================================
-- チーム機能追加
-- ============================================

-- 1. teams テーブル
create table public.teams (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 2. team_members テーブル
create table public.team_members (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references public.teams(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  role text not null default 'member'
    check (role in ('owner', 'member')),
  created_at timestamptz not null default now(),
  unique (team_id, user_id)
);

-- 3. users に現在のチーム（アクティブチーム）を追加
alter table public.users add column current_team_id uuid references public.teams(id) on delete set null;

-- 4. projects に team_id を追加
alter table public.projects add column team_id uuid references public.teams(id) on delete cascade;

-- ============================================
-- インデックス
-- ============================================
create index idx_team_members_team_id on public.team_members(team_id);
create index idx_team_members_user_id on public.team_members(user_id);
create index idx_projects_team_id on public.projects(team_id);

-- ============================================
-- updated_at トリガー
-- ============================================
create trigger trg_teams_updated_at
  before update on public.teams
  for each row execute function public.update_updated_at();

-- ============================================
-- RLS: teams
-- ============================================
alter table public.teams enable row level security;

create policy "teams: 所属チームを参照"
  on public.teams for select
  using (
    exists (
      select 1 from public.team_members
      where team_members.team_id = teams.id
      and team_members.user_id = auth.uid()
    )
  );

create policy "teams: 認証ユーザーがチームを作成"
  on public.teams for insert
  with check (auth.uid() is not null);

create policy "teams: オーナーがチームを更新"
  on public.teams for update
  using (
    exists (
      select 1 from public.team_members
      where team_members.team_id = teams.id
      and team_members.user_id = auth.uid()
      and team_members.role = 'owner'
    )
  );

create policy "teams: オーナーがチームを削除"
  on public.teams for delete
  using (
    exists (
      select 1 from public.team_members
      where team_members.team_id = teams.id
      and team_members.user_id = auth.uid()
      and team_members.role = 'owner'
    )
  );

-- ============================================
-- RLS: team_members
-- ============================================
alter table public.team_members enable row level security;

create policy "team_members: 所属チームのメンバーを参照"
  on public.team_members for select
  using (
    exists (
      select 1 from public.team_members as my
      where my.team_id = team_members.team_id
      and my.user_id = auth.uid()
    )
  );

create policy "team_members: 認証ユーザーがメンバー追加"
  on public.team_members for insert
  with check (auth.uid() is not null);

create policy "team_members: オーナーがメンバー削除"
  on public.team_members for delete
  using (
    exists (
      select 1 from public.team_members as my
      where my.team_id = team_members.team_id
      and my.user_id = auth.uid()
      and my.role = 'owner'
    )
  );

-- ============================================
-- デフォルトチーム作成
-- ============================================
insert into public.teams (id, name) values
  ('00000000-0000-0000-0000-000000000001', 'デフォルトチーム');

-- ============================================
-- 新規ユーザー登録時にデフォルトチームに自動参加させるようにトリガーを更新
-- ============================================
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.users (id, display_name, current_team_id)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'display_name', ''),
    '00000000-0000-0000-0000-000000000001'
  );
  insert into public.team_members (team_id, user_id, role)
  values ('00000000-0000-0000-0000-000000000001', new.id, 'member');
  return new;
end;
$$ language plpgsql security definer;

-- ============================================
-- projects の RLS を更新（チームベース）
-- ============================================
drop policy if exists "projects: 自分のプロジェクトを参照" on public.projects;
drop policy if exists "projects: 自分のプロジェクトを作成" on public.projects;
drop policy if exists "projects: 自分のプロジェクトを更新" on public.projects;
drop policy if exists "projects: 自分のプロジェクトを削除" on public.projects;

create policy "projects: チームメンバーがプロジェクトを参照"
  on public.projects for select
  using (
    auth.uid() = user_id
    or exists (
      select 1 from public.team_members
      where team_members.team_id = projects.team_id
      and team_members.user_id = auth.uid()
    )
  );

create policy "projects: チームメンバーがプロジェクトを作成"
  on public.projects for insert
  with check (
    auth.uid() = user_id
  );

create policy "projects: チームメンバーがプロジェクトを更新"
  on public.projects for update
  using (
    auth.uid() = user_id
    or exists (
      select 1 from public.team_members
      where team_members.team_id = projects.team_id
      and team_members.user_id = auth.uid()
    )
  );

create policy "projects: オーナーがプロジェクトを削除"
  on public.projects for delete
  using (
    auth.uid() = user_id
  );
