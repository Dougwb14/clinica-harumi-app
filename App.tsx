
import React, { useState } from 'react';
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './components/Dashboard';
import { RoomScheduler } from './components/RoomScheduler';
import { PatientAgenda } from './components/PatientAgenda';
import { ProfessionalManager } from './components/ProfessionalManager';
import { Settings } from './components/Settings';
import { Login } from './components/Login';
import { UserRole } from './types';
import { Users } from 'lucide-react';

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [currentView, setCurrentView] = useState('dashboard');

  const handleLogin = (role: UserRole) => {
    setUserRole(role);
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setUserRole(null);
    setCurrentView('dashboard');
  };

  if (!isAuthenticated) {
    return <Login onLogin={handleLogin} />;
  }

  // View Router
  const renderContent = () => {
    switch (currentView) {
      case 'dashboard':
        return <Dashboard />;
      case 'rooms':
        return <RoomScheduler />;
      case 'schedule':
        return <PatientAgenda />;
      case 'professionals':
        return <ProfessionalManager />;
      case 'patients':
        return (
          <div className="text-center p-12 bg-white rounded-2xl shadow-sm border border-sakura/20">
            <Users size={64} className="mx-auto text-menta mb-4" />
            <h2 className="text-2xl text-cinza-dark font-serif">Gestão de Pacientes</h2>
            <p className="text-cinza mt-2">Módulo em desenvolvimento: Prontuários e dados cadastrais.</p>
          </div>
        );
      case 'settings':
        return <Settings />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="min-h-screen flex bg-bege font-sans">
      <Sidebar 
        currentView={currentView} 
        onChangeView={setCurrentView} 
        userRole={userRole || UserRole.ADMIN} 
        onLogout={handleLogout}
      />
      
      <main className="flex-1 ml-64 p-8 transition-all">
        {/* Top bar (mobile placeholder/user profile) */}
        <div className="flex justify-end mb-8">
           <div className="flex items-center gap-3">
              <div className="text-right">
                <p className="text-sm font-semibold text-cinza-dark">Dra. Elisa Harumi</p>
                <p className="text-xs text-cinza">{userRole === UserRole.ADMIN ? 'Administradora' : 'Psicóloga'}</p>
              </div>
              <img 
                src="https://picsum.photos/id/64/200/200" 
                alt="Profile" 
                className="w-10 h-10 rounded-full border-2 border-sakura object-cover"
              />
           </div>
        </div>

        {renderContent()}
      </main>
    </div>
  );
};

export default App;
