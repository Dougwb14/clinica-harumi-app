import React from 'react';
import { LayoutDashboard, Calendar, Users, DoorOpen, Settings, LogOut, Flower2, Briefcase, CalendarPlus, DollarSign, FileBarChart, Lock } from 'lucide-react';
import { UserRole } from '../types';

interface SidebarProps {
  currentView: string;
  onChangeView: (view: string) => void;
  userRole: UserRole;
  onLogout: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentView, onChangeView, userRole, onLogout }) => {
  const menuItems = [];

  // Common items or Role based items
  if (userRole === UserRole.ADMIN || userRole === UserRole.PROFESSIONAL) {
    menuItems.push({ id: 'dashboard', label: 'Visão Geral', icon: LayoutDashboard });
    menuItems.push({ id: 'schedule', label: 'Agenda', icon: Calendar });
    menuItems.push({ id: 'rooms', label: 'Salas', icon: DoorOpen });
  }

  if (userRole === UserRole.ADMIN) {
    menuItems.push({ id: 'financial', label: 'Financeiro', icon: DollarSign });
    menuItems.push({ id: 'professionals', label: 'Profissionais', icon: Briefcase });
    menuItems.push({ id: 'blocks', label: 'Bloqueios', icon: Lock });
    menuItems.push({ id: 'reports', label: 'Relatórios', icon: FileBarChart });
    menuItems.push({ id: 'settings', label: 'Configurações', icon: Settings });
  }

  if (userRole === UserRole.PATIENT) {
    menuItems.push({ id: 'patient_booking', label: 'Agendar Consulta', icon: CalendarPlus });
    menuItems.push({ id: 'schedule', label: 'Meus Agendamentos', icon: Calendar });
    menuItems.push({ id: 'settings', label: 'Meu Perfil', icon: Settings });
  }

  return (
    <aside className="w-64 bg-white/80 backdrop-blur-md h-screen fixed left-0 top-0 border-r border-sakura/30 shadow-sm flex flex-col z-20">
      <div className="p-8 flex flex-col items-center">
        <div className="w-16 h-16 bg-sakura rounded-full flex items-center justify-center mb-4 shadow-inner">
           <Flower2 className="w-8 h-8 text-white" />
        </div>
        <h1 className="font-serif text-2xl text-cinza-dark text-center leading-tight">
          Clínica <br/><span className="text-sakura-dark font-semibold">HARUMI</span>
        </h1>
      </div>

      <nav className="flex-1 px-4 space-y-2 mt-4 overflow-y-auto custom-scrollbar">
        {menuItems.map((item) => {
          const isActive = currentView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onChangeView(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 font-medium ${
                isActive 
                  ? 'bg-menta text-white shadow-md' 
                  : 'text-cinza hover:bg-bege hover:text-cinza-dark'
              }`}
            >
              <item.icon size={20} />
              {item.label}
            </button>
          );
        })}
      </nav>

      <div className="p-4 border-t border-sakura/20">
        <button 
          onClick={onLogout}
          className="w-full flex items-center gap-3 px-4 py-3 text-cinza hover:text-red-400 hover:bg-red-50 rounded-xl transition-colors"
        >
          <LogOut size={20} />
          Sair
        </button>
      </div>
    </aside>
  );
};