import { cache } from 'react';
import { createClient } from './server';

/**
 * Cached user fetch - deduplicated within a single request
 * React's cache() ensures this only executes once per render pass
 */
export const getUser = cache(async () => {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return user;
});

/**
 * Cached profile fetch - deduplicated within a single request
 * Returns both display_name and current_team_id to serve all pages
 */
export const getProfile = cache(async () => {
  const user = await getUser();
  if (!user) return null;

  const supabase = await createClient();
  const { data: profile } = await supabase
    .from('users')
    .select('display_name, current_team_id')
    .eq('id', user.id)
    .single();

  return profile;
});

/**
 * Combined fetch for pages that need both user and profile
 */
export const getUserWithProfile = cache(async () => {
  const user = await getUser();
  if (!user) return { user: null, profile: null };

  const profile = await getProfile();
  return { user, profile };
});
