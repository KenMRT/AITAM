import { createClient } from '@/lib/supabase/server';
import SettingsContent from '@/components/settings/SettingsContent';

export default async function SettingsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

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
