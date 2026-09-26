import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';

export function useAuth() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tier, setTier] = useState('basic');

  useEffect(() => {
    let mounted = true;

    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      setSession(data.session ?? null);
      setLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
    });

    return () => {
      mounted = false;
      listener?.subscription?.unsubscribe();
    };
  }, []);

  useEffect(() => {
    let mounted = true;
    const userId = session?.user?.id;
    if (!userId) {
      setTier('basic');
      return;
    }

    supabase
      .from('profiles')
      .select('tier')
      .eq('id', userId)
      .maybeSingle()
      .then(({ data, error }) => {
        if (!mounted) return;
        if (error) {
          console.error('Failed to load profile tier', error);
          return;
        }
        setTier(data?.tier || 'basic');
      });

    return () => {
      mounted = false;
    };
  }, [session?.user?.id]);

  const updateTier = useCallback(
    async (newTier) => {
      const userId = session?.user?.id;
      if (!userId) return;
      setTier(newTier);
      const { error } = await supabase
        .from('profiles')
        .update({ tier: newTier, updated_at: new Date().toISOString() })
        .eq('id', userId);
      if (error) console.error('Failed to update tier', error);
    },
    [session?.user?.id]
  );

  const signUpWithPassword = useCallback(async (email, password, fullName) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName || '' } }
    });
    return { error };
  }, []);

  const signInWithPassword = useCallback(async (email, password) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error };
  }, []);

  const signInWithGoogle = useCallback(async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin }
    });
    return { error };
  }, []);

  const signOut = useCallback(async () => {
    const { error } = await supabase.auth.signOut();
    return { error };
  }, []);

  return {
    session,
    user: session?.user ?? null,
    loading,
    tier,
    updateTier,
    signUpWithPassword,
    signInWithPassword,
    signInWithGoogle,
    signOut
  };
}
