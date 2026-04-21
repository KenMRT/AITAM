import { createClient } from '@/lib/supabase/server';
import { getUser } from '@/lib/supabase/cached';
import SettingsContent from '@/components/settings/SettingsContent';

export default async function SettingsPage() {
  // user は cached（Layout と共有）、createClient と並列
  const [user, supabase] = await Promise.all([getUser(), createClient()]);

  const { data: profile } = await supabase
    .from('users')
    .select('*')
    .eq('id', user!.id)
    .single();

  return (
    <SettingsContent
      profile={profile}
      email={user!.email ?? ''}
    />
  );
}
