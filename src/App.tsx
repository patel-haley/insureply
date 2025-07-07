import React, { useEffect, useState } from 'react';
import { supabase } from './lib/supabase';
import { User } from '@supabase/supabase-js';
import AuthPage from './components/AuthPage';
import AdminDashboard from './components/admin/AdminDashboard';
import ClientDashboard from './components/client/ClientDashboard';
import LoadingSpinner from './components/LoadingSpinner';

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        checkAdminStatus(session.user.id);
      } else {
        setLoading(false);
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        checkAdminStatus(session.user.id);
      } else {
        setIsAdmin(false);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const checkAdminStatus = async (userId: string) => {
    try {
      // First get the user's email from their profile
      const { data: userData } = await supabase.auth.getUser();
      const userEmail = userData.user?.email;
      
      // Check if the email is an admin email
      const adminEmails = ['haley@admin.com', 'jigar@admin.com', 'priyal@admin.com'];
      const isAdminEmail = userEmail && adminEmails.includes(userEmail);
      
      if (isAdminEmail) {
        // Ensure admin record exists
        const { data: existingAdmin } = await supabase
          .from('admin_users')
          .select('user_id')
          .eq('user_id', userId)
          .single();
        
        if (!existingAdmin) {
          const { error: insertError } = await supabase
            .from('admin_users')
            .insert({
              user_id: userId,
              admin_name: userEmail === 'haley@admin.com' ? 'haley' : 
                         userEmail === 'jigar@admin.com' ? 'jigar' : 'priyal'
            });
          
          if (insertError) {
            console.error('Error creating admin record:', insertError);
          }
        }
      }

      setIsAdmin(!!isAdminEmail);
    } catch (error) {
      console.error('Error checking admin status:', error);
      setIsAdmin(false);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!user) {
    return <AuthPage />;
  }

  return isAdmin ? <AdminDashboard user={user} /> : <ClientDashboard user={user} />;
}

export default App;