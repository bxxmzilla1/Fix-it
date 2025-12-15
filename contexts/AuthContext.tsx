import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session, AuthError } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { getTokenBalance } from '../services/tokenService';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  tokenBalance: number;
  refreshTokenBalance: () => Promise<void>;
  signUp: (email: string, password: string) => Promise<{ error: AuthError | null }>;
  signIn: (email: string, password: string) => Promise<{ error: AuthError | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [tokenBalance, setTokenBalance] = useState<number>(0);

  const refreshTokenBalance = async () => {
    if (user) {
      try {
        const balance = await getTokenBalance();
        setTokenBalance(balance);
      } catch (error) {
        console.error('Error refreshing token balance:', error);
        // Set to 0 if there's an error (table might not exist yet)
        setTokenBalance(0);
      }
    } else {
      setTokenBalance(0);
    }
  };

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
      // Fetch token balance asynchronously after loading is set to false
      if (session?.user) {
        refreshTokenBalance().catch(console.error);
      }
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
      // Fetch token balance asynchronously after loading is set to false
      if (session?.user) {
        refreshTokenBalance().catch(console.error);
      } else {
        setTokenBalance(0);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Refresh token balance when user changes (non-blocking)
  useEffect(() => {
    if (user && !loading) {
      refreshTokenBalance().catch(console.error);
    }
  }, [user, loading]);

  const signUp = async (email: string, password: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
    });
    return { error };
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const value = {
    user,
    session,
    loading,
    tokenBalance,
    refreshTokenBalance,
    signUp,
    signIn,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

