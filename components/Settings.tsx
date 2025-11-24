import React, { useState } from 'react';
import { Save, Bell, Shield, Palette, Building2 } from 'lucide-react';

export const Settings: React.FC = () => {
  const [activeTab, setActiveTab] = useState('general');
  const [notifications, setNotifications] = useState({
    email: true,
    sms: false,
    app: true
  });

  const handleSave = () => {
    alert('Configurações salvas com sucesso!');
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <header>
        <h2 className="text-3xl font-serif text-cinza-dark mb-2">Configurações</h2>
        <p className="text-cinza">Gerencie as preferências do sistema e da clínica.</p>
      </header>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Settings Navigation */}
        <div className="w-full lg:w-64 flex flex-col gap-2">
          {[
            { id: 'general', label: 'Geral', icon: Building2 },
            { id: 'notifications', label: 'Notificações', icon: Bell },
            { id: 'appearance', label: 'Aparência', icon: Palette },
            { id: 'security', label: 'Segurança', icon: Shield },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium text-left ${
                activeTab === item.id
                  ? 'bg-white text-menta-dark shadow-sm border border-sakura/30'
                  : 'text-cinza hover:bg-white/50'
              }`}
            >
              <item.icon size={18} />
              {item.label}
            </button>
          ))}
        </div>

        {/* Content Area */}
        <div className="flex-1 bg-white rounded-2xl p-8 shadow-sm border border-sakura/20">
          
          {activeTab === 'general' && (
            <div className="space-y-6 animate-fade-in">
              <h3 className="text-xl font-medium text-cinza-dark border-b border-bege pb-4">Dados da Clínica</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-cinza">Nome da Clínica</label>
                  <input type="text" defaultValue="Clínica Harumi" className="w-full px-4 py-2 bg-bege/30 rounded-lg border border-bege-dark focus:ring-1 focus:ring-sakura outline-none text-cinza-dark" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-cinza">CNPJ</label>
                  <input type="text" defaultValue="12.345.678/0001-90" className="w-full px-4 py-2 bg-bege/30 rounded-lg border border-bege-dark focus:ring-1 focus:ring-sakura outline-none text-cinza-dark" />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <label className="text-sm font-medium text-cinza">Endereço Completo</label>
                  <input type="text" defaultValue="Av. Paulista, 1000 - Bela Vista, São Paulo - SP" className="w-full px-4 py-2 bg-bege/30 rounded-lg border border-bege-dark focus:ring-1 focus:ring-sakura outline-none text-cinza-dark" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-cinza">Telefone</label>
                  <input type="text" defaultValue="(11) 99999-8888" className="w-full px-4 py-2 bg-bege/30 rounded-lg border border-bege-dark focus:ring-1 focus:ring-sakura outline-none text-cinza-dark" />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'notifications' && (
            <div className="space-y-6 animate-fade-in">
               <h3 className="text-xl font-medium text-cinza-dark border-b border-bege pb-4">Preferências de Alerta</h3>
               <div className="space-y-4">
                 {[
                   { id: 'email', label: 'Notificações por E-mail', desc: 'Receba resumos semanais e alertas de segurança.' },
                   { id: 'sms', label: 'Alertas SMS', desc: 'Avisos urgentes sobre cancelamentos.' },
                   { id: 'app', label: 'Notificações no App', desc: 'Alertas em tempo real no painel.' },
                 ].map((item) => (
                   <div key={item.id} className="flex items-center justify-between p-4 bg-bege/20 rounded-xl">
                      <div>
                        <p className="font-medium text-cinza-dark">{item.label}</p>
                        <p className="text-sm text-cinza">{item.desc}</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input 
                          type="checkbox" 
                          checked={notifications[item.id as keyof typeof notifications]}
                          onChange={() => setNotifications({...notifications, [item.id]: !notifications[item.id as keyof typeof notifications]})}
                          className="sr-only peer" 
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-sakura/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-menta"></div>
                      </label>
                   </div>
                 ))}
               </div>
            </div>
          )}

          {activeTab === 'appearance' && (
            <div className="space-y-6 animate-fade-in">
              <h3 className="text-xl font-medium text-cinza-dark border-b border-bege pb-4">Personalização</h3>
              <p className="text-cinza">O tema atual é gerenciado globalmente pela identidade visual Harumi.</p>
              <div className="flex gap-4">
                <div className="w-32 h-24 rounded-lg bg-white border-2 border-sakura shadow-md flex items-center justify-center cursor-pointer relative">
                  <span className="text-sakura-dark font-medium">Claro (Padrão)</span>
                  <div className="absolute top-2 right-2 w-2 h-2 bg-menta rounded-full"></div>
                </div>
                <div className="w-32 h-24 rounded-lg bg-gray-100 border border-gray-200 flex items-center justify-center opacity-50 cursor-not-allowed">
                  <span className="text-gray-400 font-medium">Escuro</span>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'security' && (
            <div className="space-y-6 animate-fade-in">
              <h3 className="text-xl font-medium text-cinza-dark border-b border-bege pb-4">Acesso e Senha</h3>
              <button className="text-menta-dark hover:underline font-medium">Alterar senha de administrador</button>
              <div className="pt-4">
                <button className="text-red-400 hover:text-red-600 hover:underline font-medium text-sm">Desativar conta da clínica</button>
              </div>
            </div>
          )}

          <div className="mt-8 pt-6 border-t border-bege flex justify-end">
            <button 
              onClick={handleSave}
              className="flex items-center gap-2 px-8 py-3 bg-cinza-dark text-white rounded-xl hover:bg-black transition-colors shadow-lg"
            >
              <Save size={18} />
              Salvar Alterações
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};