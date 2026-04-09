import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

export default async function RootPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // チーム未設定ならオンボーディングへ
  const { data: profile } = await supabase
    .from('users')
    .select('current_team_id')
    .eq('id', user.id)
    .single();

  if (!profile?.current_team_id) {
    redirect('/onboarding');
  }

  redirect('/dashboard');
}
