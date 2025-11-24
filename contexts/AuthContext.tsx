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

  // Busca dados extras do usuário (cargo, nome, etc)
  const fetchProfile = async (userId: string, email: string) => {
    try {
      const { data } = await supabase
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
      // Silently fail and return fallback
    }
    
    // Fallback para permitir login mesmo se o perfil não tiver sido criado ainda
    return {
      id: userId,
      name: email.split('@')[0],
      email: email,
      role: UserRole.PATIENT,
    };
  };

  useEffect(() => {
    let mounted = true;

    // Função centralizada para definir o usuário
    const handleSession = async (session: any) => {
      if (session?.user) {
        const profile = await fetchProfile(session.user.id, session.user.email!);
        if (mounted) {
          setUser(profile);
          setLoading(false);
        }
      } else {
        if (mounted) {
          setUser(null);
          setLoading(false);
        }
      }
    };

    // 1. Verificar sessão atual ao carregar a página
    supabase.auth.getSession().then(({ data: { session } }) => {
      handleSession(session);
    });

    // 2. Ouvir mudanças em tempo real (Login, Logout, Auto-Refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      handleSession(session);
    });

    // 3. Timeout de segurança: Se o Supabase não responder em 3s, libera a tela
    const timer = setTimeout(() => {
      if (mounted && loading) {
        console.warn("Forçando fim do carregamento por timeout.");
        setLoading(false);
      }
    }, 3000);

    return () => {
      mounted = false;
      clearTimeout(timer);
      subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    try {
      // 1. Limpa estado da UI imediatamente
      setUser(null);
      
      // 2. Limpa armazenamento local (Resolve o problema de "não desconectar")
      localStorage.clear(); 
      
      // 3. Avisa o Supabase
      await supabase.auth.signOut();
      
    } catch (error) {
      console.error("Erro ao sair:", error);
      // Mesmo com erro, forçamos o refresh para garantir o logout visual
      window.location.reload();
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