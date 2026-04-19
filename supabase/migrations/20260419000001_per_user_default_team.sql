-- ============================================
-- 新規ユーザーごとに個別のデフォルトチームを自動作成
-- ============================================
-- 背景: チーム機能をUI上は一時的にオフにするが、DB構造は維持する。
-- 各ユーザーが独立したデータを持つよう、新規ユーザー登録時に
-- そのユーザー専用のチームを自動作成し、owner として参加させ、
-- current_team_id にセットする。
--
-- 既存ユーザーはそのまま放置（従来の共有デフォルトチームに残る）。
-- SECURITY DEFINER なので RLS を迂回して全ての INSERT が可能。

create or replace function public.handle_new_user()
returns trigger as $$
declare
  new_team_id uuid := gen_random_uuid();
  new_display_name text := coalesce(new.raw_user_meta_data->>'display_name', '');
  new_team_name text := case
    when new_display_name <> '' then new_display_name || 'のワークスペース'
    else 'マイワークスペース'
  end;
begin
  insert into public.teams (id, name)
  values (new_team_id, new_team_name);

  insert into public.users (id, display_name, current_team_id)
  values (new.id, new_display_name, new_team_id);

  insert into public.team_members (team_id, user_id, role)
  values (new_team_id, new.id, 'owner');

  return new;
end;
$$ language plpgsql security definer;
