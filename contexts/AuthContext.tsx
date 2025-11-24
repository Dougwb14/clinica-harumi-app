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

  // Helper: Busca perfil no banco de forma segura
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
    
    // Se falhar ao buscar o perfil, retorna null para forçar logout ou fallback controlado
    // Não retornamos um objeto "fake" para evitar que entre como paciente indevidamente
    return null;
  };

  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      try {
        // Verifica sessão atual
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session?.user) {
          const profile = await fetchProfile(session.user.id, session.user.email!);
          if (mounted) setUser(profile);
        } else {
          if (mounted) setUser(null);
        }
      } catch (error) {
        console.error("Erro na inicialização:", error);
        if (mounted) setUser(null);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    // TIMEOUT DE SEGURANÇA:
    // Se o Supabase demorar mais de 2s para responder (rede lenta ou bug),
    // forçamos o fim do carregamento para não travar a tela branca.
    const safetyTimeout = setTimeout(() => {
      if (loading && mounted) {
        console.warn("Auth timeout - Forçando liberação da UI");
        setLoading(false);
      }
    }, 2000);

    initializeAuth();

    // Escuta mudanças na autenticação (Login/Logout)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        if (session?.user) {
          const profile = await fetchProfile(session.user.id, session.user.email!);
          if (mounted) {
            setUser(profile);
            setLoading(false);
          }
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
    try {
      // Limpeza imediata do estado para UI responder rápido
      setUser(null);
      localStorage.clear(); // Limpa cache local para evitar loops de sessão antiga
      await supabase.auth.signOut();
    } catch (error) {
      console.error("Erro ao sair:", error);
    }
  };

  const refreshUser = async () => {
    if (user?.id && user?.email) {
      const profile = await fetchProfile(user.id, user.email);
      if (profile) setUser(profile);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, signOut, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);