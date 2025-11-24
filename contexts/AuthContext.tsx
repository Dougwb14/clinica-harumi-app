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

  // Helper to fetch profile data safely
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
      
      if (error) {
        console.warn("Erro ao buscar perfil no Supabase:", error.message);
      }
    } catch (e) {
      console.warn("Exceção ao buscar perfil:", e);
    }

    // --- FALLBACK DE SEGURANÇA ---
    // Se falhar ao buscar no banco (erro de RLS), usamos o email para garantir acesso Admin temporário
    const isAdminEmail = email === 'douglaswbarbosa@gmail.com'; // Seu e-mail

    return {
      id: userId,
      name: email.split('@')[0],
      email: email,
      role: isAdminEmail ? UserRole.ADMIN : UserRole.PATIENT, // Força Admin se for você
    };
  };

  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (session?.user) {
          const profile = await fetchProfile(session.user.id, session.user.email!);
          if (mounted) setUser(profile);
        }
      } catch (error) {
        console.error("Auth Init Error:", error);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    initializeAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
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
      subscription?.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    setUser(null);
    localStorage.clear(); // Limpa cache local para evitar loops
    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.error("Logout error:", error);
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