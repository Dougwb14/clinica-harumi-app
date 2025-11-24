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

      if (error && error.code !== 'PGRST116') {
         // PGRST116 é o erro de "nenhum resultado encontrado", que tratamos abaixo.
         // Outros erros logamos.
         console.error('Erro API Supabase:', error);
      }
      
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
        // FALLBACK IMPORTANTE:
        // Se o usuário logou no Supabase Auth mas não tem linha na tabela 'profiles',
        // criamos um objeto de usuário temporário para ele conseguir entrar no app.
        // Isso evita o Loop Infinito na tela de login.
        console.warn('Perfil não encontrado no banco. Usando fallback.');
        setUser({
          id: userId,
          name: email.split('@')[0],
          email: email,
          role: UserRole.PATIENT, // Assume paciente por segurança
        });
      }
    } catch (error) {
      console.error('Erro crítico ao buscar perfil:', error);
      // Mesmo com erro crítico, liberamos o acesso básico
      setUser({
        id: userId,
        name: email.split('@')[0],
        email: email,
        role: UserRole.PATIENT,
      });
    }
  };

  useEffect(() => {
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
        setLoading(false);
      }
    };

    initializeAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user && (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED')) {
        await fetchProfile(session.user.id, session.user.email!);
        setLoading(false); // Garante que saia do loading
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        setLoading(false);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    // LOGOUT OTIMISTA:
    // Limpa o usuário da tela IMEDIATAMENTE, sem esperar o servidor.
    // Isso faz o botão funcionar na hora.
    setUser(null);
    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.error('Erro ao deslogar no servidor (ignorado pois usuário já saiu localmente):', error);
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