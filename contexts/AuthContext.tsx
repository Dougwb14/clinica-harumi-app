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

  // Helper: Busca perfil no banco
  const fetchProfile = async (userId: string, email: string) => {
    try {
      // Como as políticas RLS estão configuradas, o usuário logado CONSEGUE ler seu perfil.
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.warn("Erro ao buscar perfil (verifique RLS):", error.message);
      } else if (data) {
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
      console.warn("Exceção na busca de perfil:", e);
    }
    
    // Fallback padrão se não encontrar perfil (evita travamento, mas assume role PATIENT)
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
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session?.user) {
          const profile = await fetchProfile(session.user.id, session.user.email!);
          if (mounted) setUser(profile);
        } else {
          if (mounted) setUser(null);
        }
      } catch (error) {
        console.error("Erro fatal na auth:", error);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    initializeAuth();

    // Listener de mudanças de estado
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_OUT') {
        if (mounted) {
          setUser(null);
          setLoading(false);
        }
        return;
      }

      if (session?.user && (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED')) {
        // Pequeno delay para garantir consistência
        if (event === 'SIGNED_IN') await new Promise(r => setTimeout(r, 500));
        
        const profile = await fetchProfile(session.user.id, session.user.email!);
        if (mounted) {
          setUser(profile);
          setLoading(false);
        }
      }
    });

    return () => {
      mounted = false;
      subscription?.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    setUser(null);
    localStorage.clear(); // Limpa cache local
    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.error("Erro no logout:", error);
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