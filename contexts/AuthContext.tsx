import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { User, UserRole } from '../types';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  signOut: async () => {},
  refreshUser: async () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Função auxiliar para buscar dados do perfil
  const fetchProfile = async (userId: string, email: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (data) {
        return {
          id: data.id,
          name: data.name || email.split('@')[0],
          email: email,
          role: (data.role as UserRole) || UserRole.PATIENT,
          specialty: data.specialty,
          avatar_url: data.avatar_url
        };
      }
    } catch (e) {
      console.error("Erro ao buscar perfil:", e);
    }
    // Fallback se falhar
    return {
      id: userId,
      name: email.split('@')[0],
      email: email,
      role: UserRole.PATIENT,
    };
  };

  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      try {
        // CORREÇÃO CRÍTICA: Supabase V2 usa getSession() assíncrono
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (session?.user) {
          const profile = await fetchProfile(session.user.id, session.user.email!);
          if (mounted) setUser(profile);
        } else {
          if (mounted) setUser(null);
        }
      } catch (error) {
        console.error("Erro fatal na auth:", error);
        if (mounted) setUser(null);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    // TIMEOUT DE SEGURANÇA
    const safetyTimeout = setTimeout(() => {
      if (loading && mounted) {
        console.warn("Auth timeout - Forçando liberação da tela.");
        setLoading(false);
      }
    }, 2000);

    initializeAuth();

    // CORREÇÃO CRÍTICA: Listener V2 retorna { data: { subscription } }
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user && (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED')) {
        const profile = await fetchProfile(session.user.id, session.user.email!);
        if (mounted) setUser(profile);
      } else if (event === 'SIGNED_OUT') {
        if (mounted) setUser(null);
      }
      if (mounted) setLoading(false);
    });

    return () => {
      mounted = false;
      clearTimeout(safetyTimeout);
      subscription?.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    // LOGOUT OTIMISTA
    setUser(null);
    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.error("Erro silencioso no logout:", error);
    }
  };

  const refreshUser = async () => {
    if (user?.id && user?.email) {
      const profile = await fetchProfile(user.id, user.email);
      setUser(profile);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, signOut, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);