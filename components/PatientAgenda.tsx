import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../contexts/AuthContext';
import { Appointment, UserRole, User, Patient } from '../types';
import { Calendar as CalendarIcon, Loader2, XCircle, RefreshCw, Tag, User as UserIcon, Filter } from 'lucide-react';

export const PatientAgenda: React.FC = () => {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [filterProfessional, setFilterProfessional] = useState('');
  const [filterPatient, setFilterPatient] = useState('');
  
  // Dropdown data
  const [professionals, setProfessionals] = useState<User[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);

  const isAdmin = user?.role === UserRole.ADMIN;

  useEffect(() => {
    if (user) {
      fetchAppointments();
      if (isAdmin) {
        fetchDropdowns();
      }
    }
  }, [user]);

  // Refetch when filters change
  useEffect(() => {
    fetchAppointments();
  }, [filterProfessional, filterPatient]);

  const fetchDropdowns = async () => {
    const { data: profs } = await supabase.from('profiles').select('*').eq('role', 'PROFESSIONAL');
    if (profs) setProfessionals(profs as any);

    const { data: pats } = await supabase.from('patients').select('id, name');
    if (pats) setPatients(pats as any);
  };

  const fetchAppointments = async () => {
    setLoading(true);
    try {
      let query = supabase.from('appointments').select(`
        *,
        patient:patient_id(name),
        professional:professional_id(name),
        agenda_type:agenda_type_id(name, price, color)
      `).order('date', { ascending: true }).order('start_time', { ascending: true });

      // Permission Logic
      if (user?.role === UserRole.PATIENT) {
        query = query.eq('patient_id', user.id);
      } else if (user?.role === UserRole.PROFESSIONAL) {
        query = query.eq('professional_id', user.id);
      }
      
      // Admin Filters
      if (isAdmin) {
        if (filterProfessional) query = query.eq('professional_id', filterProfessional);
        if (filterPatient) query = query.eq('patient_id', filterPatient);
      }

      const { data, error } = await query;
      
      if (error) throw error;
      
      const mapped: Appointment[] = data.map((apt: any) => ({
        id: apt.id,
        date: apt.date,
        start_time: apt.start_time,
        status: apt.status,
        patient_id: apt.patient_id,
        professional_id: apt.professional_id,
        patient_name: apt.patient?.name,
        professional_name: apt.professional?.name,
        agenda_type: apt.agenda_type
      }));
      
      setAppointments(mapped);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async (id: string) => {
    if (!confirm('Tem certeza que deseja cancelar este agendamento?')) return;
    
    try {
      const { error } = await supabase
        .from('appointments')
        .update({ status: 'cancelled' })
        .eq('id', id);

      if (error) throw error;
      
      fetchAppointments(); 
    } catch (error) {
      alert('Erro ao cancelar.');
    }
  };

  const formatDate = (dateStr: string) => {
    const [year, month, day] = dateStr.split('-');
    return `${day}/${month}/${year}`;
  };

  // Group by date for better visualization
  const groupedAppointments = appointments.reduce((acc, apt) => {
    const dateKey = apt.date;
    if (!acc[dateKey]) acc[dateKey] = [];
    acc[dateKey].push(apt);
    return acc;
  }, {} as Record<string, Appointment[]>);

  return (
    <div className="space-y-6 animate-fade-in">
      <header className="flex flex-col md:flex-row justify-between md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-serif text-cinza-dark mb-2">
            {user?.role === UserRole.PATIENT ? 'Meus Agendamentos' : 'Agenda Completa'}
          </h2>
          <p className="text-cinza text-sm">Visualize e gerencie os atendimentos.</p>
        </div>
        <button onClick={() => fetchAppointments()} className="self-start md:self-auto p-2 text-cinza hover:bg-bege rounded-full transition-colors" title="Atualizar">
          <RefreshCw size={20} />
        </button>
      </header>

      {/* Filters for Admin */}
      {isAdmin && (
        <div className="bg-white p-4 rounded-xl shadow-sm border border-sakura/20 flex flex-wrap gap-4 items-end">
           <div className="flex items-center gap-2 text-cinza-dark font-medium mr-2">
             <Filter size={18} /> Filtros:
           </div>
           
           <div className="flex-1 min-w-[200px]">
             <label className="block text-xs font-bold text-cinza uppercase mb-1">Profissional</label>
             <select 
               value={filterProfessional} 
               onChange={(e) => setFilterProfessional(e.target.value)}
               className="w-full p-2 bg-bege/30 rounded-lg border border-bege-dark text-sm"
             >
               <option value="">Todos</option>
               {professionals.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
             </select>
           </div>

           <div className="flex-1 min-w-[200px]">
             <label className="block text-xs font-bold text-cinza uppercase mb-1">Paciente</label>
             <select 
               value={filterPatient} 
               onChange={(e) => setFilterPatient(e.target.value)}
               className="w-full p-2 bg-bege/30 rounded-lg border border-bege-dark text-sm"
             >
               <option value="">Todos</option>
               {patients.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
             </select>
           </div>
        </div>
      )}

      {loading ? (
        <div className="p-12 text-center flex flex-col items-center">
          <Loader2 className="animate-spin text-sakura mb-2" size={32}/>
          <span className="text-cinza">Carregando agenda...</span>
        </div>
      ) : Object.keys(groupedAppointments).length === 0 ? (
        <div className="bg-white p-12 text-center text-cinza border border-dashed border-sakura/30 rounded-2xl">
          Nenhum agendamento encontrado para os filtros selecionados.
        </div>
      ) : (
        <div className="space-y-6">
          {Object.keys(groupedAppointments).map(dateKey => (
            <div key={dateKey} className="bg-white rounded-2xl shadow-sm border border-sakura/20 overflow-hidden">
               <div className="bg-bege/30 px-6 py-3 border-b border-sakura/10 flex items-center gap-2">
                 <CalendarIcon size={18} className="text-sakura-dark"/>
                 <h3 className="font-serif font-bold text-cinza-dark">{formatDate(dateKey)}</h3>
               </div>
               
               <div className="divide-y divide-bege">
                 {groupedAppointments[dateKey].map(apt => (
                   <div key={apt.id} className="p-4 hover:bg-bege/10 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4">
                      
                      {/* Time and Status */}
                      <div className="flex items-center gap-4 min-w-[140px]">
                        <span className="text-lg font-bold text-cinza-dark">{apt.start_time}</span>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium border
                          ${apt.status === 'scheduled' ? 'bg-blue-50 text-blue-700 border-blue-100' : 
                            apt.status === 'cancelled' ? 'bg-red-50 text-red-700 border-red-100' : 
                            'bg-gray-100 text-gray-800 border-gray-200'}
                        `}>
                          {apt.status === 'scheduled' ? 'Agendado' : apt.status === 'cancelled' ? 'Cancelado' : apt.status}
                        </span>
                      </div>

                      {/* Info */}
                      <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-2">
                         <div className="flex items-center gap-2 text-sm text-cinza-dark">
                           <UserIcon size={16} className="text-menta-dark"/>
                           <span className="font-medium">
                             {user?.role === UserRole.PATIENT ? apt.professional_name : apt.patient_name}
                           </span>
                           {isAdmin && <span className="text-xs text-cinza">({user?.role === UserRole.PATIENT ? 'Profissional' : 'Paciente'})</span>}
                         </div>
                         
                         {isAdmin && (
                            <div className="flex items-center gap-2 text-sm text-cinza">
                               <span className="text-xs font-bold uppercase text-cinza/50">Prof:</span>
                               {apt.professional_name}
                            </div>
                         )}
                         
                         <div className="flex items-center gap-2">
                           {apt.agenda_type && (
                             <>
                               <span className="w-2 h-2 rounded-full" style={{backgroundColor: apt.agenda_type.color}}></span>
                               <span className="text-sm text-cinza">{apt.agenda_type.name}</span>
                             </>
                           )}
                         </div>
                      </div>

                      {/* Actions */}
                      <div className="flex justify-end">
                        {apt.status === 'scheduled' && (isAdmin || user?.id === apt.patient_id || user?.id === apt.professional_id) && (
                          <button 
                            onClick={() => handleCancel(apt.id)}
                            className="text-red-400 hover:text-red-600 hover:bg-red-50 p-2 rounded-lg transition-colors text-xs flex items-center gap-1"
                          >
                            <XCircle size={14} /> 
                            Cancelar
                          </button>
                        )}
                      </div>
                   </div>
                 ))}
               </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};