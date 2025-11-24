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
      console.warn("Perfil não encontrado, usando fallback:", e);
    }
    // Fallback: Se não achar perfil no banco, cria objeto temporário para permitir login
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
        // CORREÇÃO: Supabase V2 usa getSession() que é assíncrono
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (session?.user) {
          const profile = await fetchProfile(session.user.id, session.user.email!);
          if (mounted) setUser(profile);
        } else {
          if (mounted) setUser(null);
        }
      } catch (error) {
        console.error("Erro na inicialização da auth:", error);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    // TIMEOUT DE SEGURANÇA: Se demorar mais de 2s, força a tela a abrir
    // Isso evita a "Tela Branca da Morte" se a conexão estiver lenta
    const safetyTimeout = setTimeout(() => {
      if (loading && mounted) {
        console.warn("Auth demorou. Forçando abertura do app.");
        setLoading(false);
      }
    }, 2000);

    initializeAuth();

    // CORREÇÃO: Supabase V2 listener retorna { data: { subscription } }
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("Auth event:", event);
      if (session?.user && (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED')) {
        const profile = await fetchProfile(session.user.id, session.user.email!);
        if (mounted) {
            setUser(profile);
            setLoading(false);
        }
      } else if (event === 'SIGNED_OUT') {
        if (mounted) {
            setUser(null);
            setLoading(false);
        }
      }
    });

    return () => {
      mounted = false;
      clearTimeout(safetyTimeout);
      subscription?.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    // Logout Otimista: Limpa UI instantaneamente
    setUser(null);
    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.error("Erro ao deslogar no servidor:", error);
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