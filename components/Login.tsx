import React, { useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Flower2, Lock, Mail, ArrowRight, Loader2 } from 'lucide-react';

export const Login: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  // Registration fields
  const [name, setName] = useState('');
  const [isProfessional, setIsProfessional] = useState(false); // Checkbox for signup

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    console.log("Tentando autenticar com versão V2..."); // Log para debug

    try {
      if (isLogin) {
        // CORREÇÃO DEFINITIVA: V2 usa signInWithPassword
        // O erro "signIn is not a function" acontece porque a V2 removeu o método antigo.
        const { data, error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password: password.trim()
        });
        
        if (error) {
          console.error("Erro Supabase:", error);
          throw error;
        }
        console.log("Login bem sucedido:", data);
      } else {
        // CORREÇÃO DEFINITIVA: V2 signUp structure
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password: password.trim(),
          options: {
            data: {
              name: name.trim(),
              role: isProfessional ? 'PROFESSIONAL' : 'PATIENT',
              specialty: isProfessional ? 'Psicologia' : null
            }
          }
        });

        if (error) throw error;
        alert('Cadastro realizado! Verifique seu e-mail ou faça login.');
        setIsLogin(true);
      }
    } catch (error: any) {
      console.error("Erro capturado:", error);
      let msg = error.message;
      if (msg === "Invalid login credentials") msg = "E-mail ou senha incorretos.";
      alert(msg || 'Erro ao autenticar');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-bege p-4">
      <div className="bg-white w-full max-w-4xl rounded-3xl shadow-xl overflow-hidden flex flex-col md:flex-row animate-fade-in">
        
        {/* Left Side - Brand */}
        <div className="w-full md:w-1/2 bg-gradient-to-br from-sakura via-sakura-light to-white p-12 flex flex-col justify-between relative overflow-hidden">
           <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-white/20 rounded-full blur-3xl"></div>
           <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-64 h-64 bg-menta/20 rounded-full blur-3xl"></div>
           
           <div className="relative z-10">
             <div className="w-16 h-16 bg-white/50 backdrop-blur rounded-2xl flex items-center justify-center mb-6 shadow-sm">
                <Flower2 className="w-8 h-8 text-sakura-dark" />
             </div>
             <h1 className="font-serif text-4xl text-cinza-dark mb-2">Clínica <br/> <span className="text-sakura-dark font-semibold">HARUMI</span></h1>
             <p className="text-cinza-dark/80 mt-4 text-lg italic">"Cuidar de si é florescer."</p>
           </div>
        </div>

        {/* Right Side - Form */}
        <div className="w-full md:w-1/2 p-12 bg-white flex flex-col justify-center">
          <h2 className="text-2xl font-semibold text-cinza-dark mb-8">
            {isLogin ? 'Acesse sua conta' : 'Crie sua conta'}
          </h2>
          
          <form onSubmit={handleAuth} className="space-y-4">
            {!isLogin && (
              <div className="space-y-2 animate-slide-up">
                <label className="text-sm font-medium text-cinza">Nome Completo</label>
                <input 
                  type="text" 
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-3 bg-bege/30 border border-bege-dark rounded-xl focus:outline-none focus:border-sakura focus:ring-1 focus:ring-sakura text-cinza-dark"
                  required
                />
              </div>
            )}

            <div className="space-y-2">
              <label className="text-sm font-medium text-cinza">E-mail</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-cinza/40" size={18} />
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-bege/30 border border-bege-dark rounded-xl focus:outline-none focus:border-sakura focus:ring-1 focus:ring-sakura text-cinza-dark transition-all"
                  placeholder="seu@email.com"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-cinza">Senha</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-cinza/40" size={18} />
                <input 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-bege/30 border border-bege-dark rounded-xl focus:outline-none focus:border-sakura focus:ring-1 focus:ring-sakura text-cinza-dark transition-all"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            {!isLogin && (
               <div className="flex items-center gap-2 mt-4 animate-slide-up">
                 <input 
                  type="checkbox" 
                  id="isProf"
                  checked={isProfessional}
                  onChange={(e) => setIsProfessional(e.target.checked)}
                  className="rounded text-sakura focus:ring-sakura"
                 />
                 <label htmlFor="isProf" className="text-sm text-cinza">Sou um profissional (Psicólogo/Nutricionista)</label>
               </div>
            )}

            <button 
              type="submit" 
              disabled={loading}
              className="w-full mt-4 bg-cinza-dark text-white py-3 rounded-xl font-medium shadow-lg hover:shadow-xl hover:bg-black transition-all flex items-center justify-center gap-2 group disabled:opacity-50"
            >
              {loading ? <Loader2 className="animate-spin" /> : (isLogin ? 'Entrar' : 'Cadastrar')}
              {!loading && <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />}
            </button>
          </form>

          <p className="mt-8 text-center text-sm text-cinza">
            {isLogin ? 'Não tem uma conta?' : 'Já tem uma conta?'} 
            <button 
              onClick={() => setIsLogin(!isLogin)} 
              className="ml-2 text-sakura-dark font-semibold hover:underline"
            >
              {isLogin ? 'Cadastre-se' : 'Faça Login'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};