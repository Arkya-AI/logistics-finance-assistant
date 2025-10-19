import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthProvider";
import { hasRole } from "@/lib/roles";

type UserRole = 'admin' | 'member' | null;

/**
 * Hook to get the current user's primary role
 * Returns 'admin' if user has admin role, 'member' if only member, or null if no role/not authenticated
 */
export function useUserRole() {
  const { user } = useAuth();
  const [role, setRole] = useState<UserRole>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchRole() {
      if (!user?.id) {
        setRole(null);
        setLoading(false);
        return;
      }

      setLoading(true);
      
      // Check admin first (higher priority)
      const isAdmin = await hasRole(user.id, 'admin');
      if (isAdmin) {
        setRole('admin');
        setLoading(false);
        return;
      }

      // Then check member
      const isMember = await hasRole(user.id, 'member');
      setRole(isMember ? 'member' : null);
      setLoading(false);
    }

    fetchRole();
  }, [user?.id]);

  return { role, loading };
}
