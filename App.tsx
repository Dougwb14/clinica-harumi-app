import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './components/Dashboard';
import { RoomScheduler } from './components/RoomScheduler';
import { PatientAgenda } from './components/PatientAgenda';
import { ProfessionalManager } from './components/ProfessionalManager';
import { PatientBooking } from './components/PatientBooking';
import { Settings } from './components/Settings';
import { Login } from './components/Login';
import { FinancialManager } from './components/FinancialManager';
import { Reports } from './components/Reports';
import { ScheduleBlocker } from './components/ScheduleBlocker';
import { AgendaTypeManager } from './components/AgendaTypeManager';
import { PatientManager } from './components/PatientManager'; // Novo
import { UserRole } from './types';
import { Loader2 } from 'lucide-react';

const AppContent: React.FC = () => {
  const { user, loading, signOut } = useAuth();
  const [currentView, setCurrentView] = useState('dashboard');

  useEffect(() => {
    if (user) {
      if (user.role === UserRole.PATIENT) {
        setCurrentView('patient_booking');
      } else {
        setCurrentView('dashboard');
      }
    }
  }, [user]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-bege gap-4">
        <Loader2 className="w-12 h-12 text-sakura animate-spin" />
        <p className="text-cinza text-sm animate-pulse">Iniciando sistema Harumi...</p>
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  const renderContent = () => {
    switch (currentView) {
      case 'dashboard':
        return user.role !== UserRole.PATIENT ? <Dashboard /> : <PatientAgenda />;
      case 'rooms':
        return <RoomScheduler />;
      case 'schedule':
        return <PatientAgenda />;
      case 'professionals':
        return <ProfessionalManager />;
      case 'agenda_types':
        return <AgendaTypeManager />;
      case 'patients_record': // Nova Rota
        return <PatientManager />;
      case 'financial':
        return <FinancialManager />;
      case 'reports':
        return <Reports />;
      case 'blocks':
        return <ScheduleBlocker />;
      case 'patient_booking':
        return <PatientBooking />;
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
        userRole={user.role} 
        onLogout={signOut}
      />
      
      <main className="flex-1 ml-64 p-8 transition-all">
        <div className="flex justify-end mb-8 animate-fade-in">
           <div className="flex items-center gap-3">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-semibold text-cinza-dark">{user.name}</p>
                <p className="text-xs text-cinza">
                  {user.role === UserRole.ADMIN ? 'Administrador' : 
                   user.role === UserRole.PROFESSIONAL ? 'Profissional' : 'Paciente'}
                </p>
              </div>
              <img 
                src={user.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=FADADD&color=fff`} 
                alt="Profile" 
                className="w-10 h-10 rounded-full border-2 border-sakura object-cover shadow-sm"
              />
           </div>
        </div>

        <div className="animate-slide-up">
          {renderContent()}
        </div>
      </main>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
};

export default App;