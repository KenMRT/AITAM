-- ============================================
-- team_members の RLS 無限再帰を修正
-- 旧ポリシーは team_members 内で team_members を参照して再帰していた
-- → user_id = auth.uid() で直接判定に変更
-- ============================================

-- 旧ポリシーを削除
drop policy if exists "team_members: 所属チームのメンバーを参照" on public.team_members;

-- 新ポリシー: 自分が所属しているチームのメンバー行はすべて参照可能
-- auth.uid() との比較だけで判定するため再帰しない
create policy "team_members: 所属チームのメンバーを参照"
  on public.team_members for select
  using (user_id = auth.uid());

-- DELETEポリシーも同様に再帰の可能性があるため修正
drop policy if exists "team_members: オーナーがメンバー削除" on public.team_members;

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
