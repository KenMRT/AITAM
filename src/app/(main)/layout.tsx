import { redirect } from 'next/navigation';
import { getUser, getProfile } from '@/lib/supabase/cached';
import MainShell from '@/components/layout/MainShell';

export default async function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getUser();

  if (!user) {
    redirect('/login');
  }

  const profile = await getProfile();
  const displayName = profile?.display_name || '';

  return (
    <MainShell displayName={displayName}>
      {children}
    </MainShell>
  );
}
