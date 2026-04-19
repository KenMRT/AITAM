import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import MainShell from '@/components/layout/MainShell';

export default async function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { data: profile } = await supabase
    .from('users')
    .select('display_name')
    .eq('id', user.id)
    .single();

  const displayName = profile?.display_name || '';

  return (
    <MainShell displayName={displayName}>
      {children}
    </MainShell>
  );
}
