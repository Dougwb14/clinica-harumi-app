import React, { useState } from 'react';
import { Flower2, Lock, Mail, ArrowRight } from 'lucide-react';
import { UserRole } from '../types';

interface LoginProps {
  onLogin: (role: UserRole) => void;
}

export const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>(UserRole.ADMIN); // Default for demo

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Simulate login
    onLogin(role);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-bege p-4">
      <div className="bg-white w-full max-w-4xl rounded-3xl shadow-xl overflow-hidden flex flex-col md:flex-row">
        
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

           <div className="relative z-10 hidden md:block">
             <div className="flex gap-2">
               <div className="w-8 h-2 bg-menta rounded-full"></div>
               <div className="w-8 h-2 bg-sakura rounded-full"></div>
               <div className="w-8 h-2 bg-bege-dark rounded-full"></div>
             </div>
           </div>
        </div>

        {/* Right Side - Form */}
        <div className="w-full md:w-1/2 p-12 bg-white flex flex-col justify-center">
          <h2 className="text-2xl font-semibold text-cinza-dark mb-8">Acesse sua conta</h2>
          
          <form onSubmit={handleSubmit} className="space-y-6">
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

            <div className="flex items-center justify-between text-sm">
               <label className="flex items-center gap-2 cursor-pointer text-cinza">
                 <input type="checkbox" className="rounded border-gray-300 text-sakura focus:ring-sakura" />
                 Lembrar de mim
               </label>
               <a href="#" className="text-menta-dark hover:underline">Esqueceu a senha?</a>
            </div>

            {/* Role Switcher Demo */}
            <div className="flex gap-4 mb-4 text-xs">
              <button type="button" onClick={() => setRole(UserRole.ADMIN)} className={`px-2 py-1 rounded ${role === UserRole.ADMIN ? 'bg-sakura text-white' : 'bg-gray-100'}`}>Admin Demo</button>
              <button type="button" onClick={() => setRole(UserRole.PROFESSIONAL)} className={`px-2 py-1 rounded ${role === UserRole.PROFESSIONAL ? 'bg-menta text-white' : 'bg-gray-100'}`}>Profissional Demo</button>
            </div>

            <button 
              type="submit" 
              className="w-full bg-cinza-dark text-white py-3 rounded-xl font-medium shadow-lg hover:shadow-xl hover:bg-black transition-all flex items-center justify-center gap-2 group"
            >
              Entrar
              <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
            </button>
          </form>

          <p className="mt-8 text-center text-sm text-cinza">
            Não tem uma conta? <a href="#" className="text-sakura-dark font-semibold hover:underline">Cadastre-se</a>
          </p>
        </div>
      </div>
    </div>
  );
};