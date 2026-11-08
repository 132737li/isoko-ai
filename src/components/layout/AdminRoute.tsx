import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';

export default function AdminRoute() {
  const { user } = useAuthStore();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);

  useEffect(() => {
    if (!user) return;
    
    supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()
      .then(({ data }) => setIsAdmin(data?.role === 'admin'));
  }, [user]);

  if (isAdmin === null) return <div className="p-6 text-center text-gray-600">Vérification des droits...</div>;
  if (!isAdmin) return <Navigate to="/dashboard" replace />;

  return <Outlet />;
}