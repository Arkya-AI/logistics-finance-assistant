import { supabase } from "@/integrations/supabase/client";

/**
 * Check if a user has a specific role
 * @param userId - The user's UUID
 * @param role - The role to check ('admin' or 'member')
 * @returns Promise<boolean> - True if user has the role
 */
export async function hasRole(
  userId: string,
  role: 'admin' | 'member'
): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('user_roles')
      .select('role_id')
      .eq('user_id', userId)
      .eq('role_id', role)
      .maybeSingle();

    if (error) {
      console.error('Error checking role:', error);
      return false;
    }

    return !!data;
  } catch (err) {
    console.error('Unexpected error in hasRole:', err);
    return false;
  }
}
