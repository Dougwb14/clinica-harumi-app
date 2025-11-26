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
    // BACKDOOR DE EMERGÊNCIA: Se for seu email, força Admin
    // Isso impede que você fique trancado para fora se o banco der erro
    if (email === 'douglaswbarbosa@gmail.com') {
      return {
        id: userId,
        name: 'Douglas Barbosa',
        email: email,
        role: UserRole.ADMIN,
        specialty: 'Gestor',
        avatar_url: null
      };
    }

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
      console.warn("Erro ao buscar perfil (ignorando):", e);
    }
    
    // Fallback: Se tem sessão mas não achou perfil, cria um básico para não travar
    return {
      id: userId,
      name: email.split('@')[0],
      email: email,
      role: UserRole.PATIENT, // Padrão seguro
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
        if (mounted) setUser(null);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    // TIMEOUT DE SEGURANÇA: 
    // Se o Supabase não responder em 2 segundos, destrava a tela.
    const safetyTimeout = setTimeout(() => {
      if (loading && mounted) {
        console.warn("Timeout de Autenticação: Forçando liberação da tela.");
        setLoading(false);
      }
    }, 2000);

    initializeAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_OUT') {
        if (mounted) {
          setUser(null);
          setLoading(false);
        }
      } else if (session?.user && (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED')) {
        const profile = await fetchProfile(session.user.id, session.user.email!);
        if (mounted) {
          setUser(profile);
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
    setUser(null);
    localStorage.clear(); // Limpa cache para evitar loops
    try {
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