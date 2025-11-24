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

  const fetchProfile = async (userId: string, email: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (data) {
        setUser({
          id: data.id,
          name: data.name || email.split('@')[0],
          email: email,
          role: (data.role as UserRole) || UserRole.PATIENT,
          specialty: data.specialty,
          avatar_url: data.avatar_url
        });
      } else {
        // FALLBACK: Se não achar perfil, cria um temporário para não travar o app
        console.warn('Perfil não encontrado. Usando fallback temporário.');
        setUser({
          id: userId,
          name: email.split('@')[0],
          email: email,
          role: UserRole.PATIENT,
        });
      }
    } catch (error) {
      console.error('Erro crítico ao buscar perfil:', error);
      // Fallback em caso de erro de rede
      setUser({
        id: userId,
        name: email.split('@')[0],
        email: email,
        role: UserRole.PATIENT,
      });
    }
  };

  useEffect(() => {
    let mounted = true;

    // 1. TIMEOUT DE SEGURANÇA:
    // Se o Supabase não responder em 3 segundos, libera o loading
    // para o usuário não ficar preso na tela branca.
    const safetyTimeout = setTimeout(() => {
      if (mounted && loading) {
        console.warn('Tempo limite de carregamento excedido. Liberando app.');
        setLoading(false);
      }
    }, 3000);

    const initializeAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session?.user) {
          await fetchProfile(session.user.id, session.user.email!);
        } else {
          setUser(null);
        }
      } catch (error) {
        console.error("Erro na inicialização da Auth:", error);
      } finally {
        if (mounted) setLoading(false);
        clearTimeout(safetyTimeout);
      }
    };

    initializeAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user && (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED')) {
        await fetchProfile(session.user.id, session.user.email!);
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
      }
      if (mounted) setLoading(false);
    });

    return () => {
      mounted = false;
      clearTimeout(safetyTimeout);
      subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    // LOGOUT OTIMISTA: Limpa a tela antes de chamar o servidor
    setUser(null);
    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.error('Erro no logout (ignorado):', error);
    }
  };

  const refreshUser = async () => {
    if (user?.id && user?.email) {
      await fetchProfile(user.id, user.email);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, signOut, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);