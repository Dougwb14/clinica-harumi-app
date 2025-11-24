import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../contexts/AuthContext';
import { Appointment, UserRole, User } from '../types';
import { Calendar as CalendarIcon, Loader2, XCircle, RefreshCw, User as UserIcon, Filter, MapPin } from 'lucide-react';

// Extended interface to handle both sources
interface UnifiedAppointment extends Appointment {
  source: 'appointment' | 'room_booking';
  room_name?: string;
}

interface PatientOption {
  id: string;
  name: string;
  source: 'profile' | 'record';
}

export const PatientAgenda: React.FC = () => {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState<UnifiedAppointment[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters State
  const [filterProfessional, setFilterProfessional] = useState('');
  const [filterPatient, setFilterPatient] = useState('');
  
  // Dropdown Data
  const [professionals, setProfessionals] = useState<User[]>([]);
  const [patientOptions, setPatientOptions] = useState<PatientOption[]>([]);

  const isAdmin = user?.role === UserRole.ADMIN;

  useEffect(() => {
    if (user) {
      // Se for Admin, carrega os dados dos filtros
      if (isAdmin) {
        fetchDropdowns();
      }
      // Carrega a agenda
      fetchData();
    }
  }, [user, filterProfessional, filterPatient]);

  const fetchDropdowns = async () => {
    try {
      // 1. Carregar Profissionais
      // Nota: As políticas permitem leitura autenticada, então isso funcionará
      const { data: profs, error: profError } = await supabase
        .from('profiles')
        .select('*')
        .in('role', ['PROFESSIONAL', 'ADMIN']) 
        .order('name');
      
      if (profError) {
        console.error('Erro ao buscar profissionais:', profError);
      } else if (profs) {
        setProfessionals(profs as any);
      }

      // 2. Carregar Pacientes (Unificado)
      const combinedPatients: PatientOption[] = [];

      // 2a. App Users
      const { data: profilePatients } = await supabase
        .from('profiles')
        .select('id, name')
        .eq('role', 'PATIENT')
        .order('name');
      
      if (profilePatients) {
        profilePatients.forEach(p => combinedPatients.push({ id: p.id, name: `${p.name} (App)`, source: 'profile' }));
      }

      // 2b. Admin Records
      const { data: recordPatients } = await supabase
        .from('patients')
        .select('id, name')
        .order('name');

      if (recordPatients) {
        recordPatients.forEach(p => combinedPatients.push({ id: p.id, name: `${p.name} (Ficha)`, source: 'record' }));
      }

      // Remove duplicates & sort
      const uniquePatients = Array.from(new Map(combinedPatients.map(item => [item.id, item])).values());
      uniquePatients.sort((a, b) => a.name.localeCompare(b.name));
      
      setPatientOptions(uniquePatients);
    } catch (err) {
      console.error("Erro geral no dropdown:", err);
    }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const unifiedList: UnifiedAppointment[] = [];

      // ====================================================
      // QUERY 1: Agendamentos Diretos (Tabela appointments)
      // ====================================================
      let appQuery = supabase.from('appointments').select(`
        *,
        patient:patient_id(name),
        professional:professional_id(name),
        agenda_type:agenda_type_id(name, price, color)
      `);

      // ====================================================
      // QUERY 2: Reservas de Sala (Tabela room_bookings)
      // ====================================================
      let roomQuery = supabase.from('room_bookings').select(`
        id, date, start_time, status, patient_id, professional_id, agenda_type_id,
        patient:patient_id(name),
        professional:profiles!professional_id(name),
        agenda_type:agenda_type_id(name, price, color),
        room:room_id(name)
      `);

      // --- APLICAR FILTROS ---
      
      if (!isAdmin) {
        // Visão restrita para não-admins
        if (user?.role === UserRole.PROFESSIONAL) {
          appQuery = appQuery.eq('professional_id', user.id);
          roomQuery = roomQuery.eq('professional_id', user.id);
        } else if (user?.role === UserRole.PATIENT) {
          appQuery = appQuery.eq('patient_id', user.id);
          roomQuery = roomQuery.eq('patient_id', user.id);
        }
      } else {
        // Filtros de Admin
        if (filterProfessional) {
          appQuery = appQuery.eq('professional_id', filterProfessional);
          roomQuery = roomQuery.eq('professional_id', filterProfessional);
        }
        
        if (filterPatient) {
          appQuery = appQuery.eq('patient_id', filterPatient);
          roomQuery = roomQuery.eq('patient_id', filterPatient);
        }
      }

      // Executar queries em paralelo
      const [appRes, roomRes] = await Promise.all([appQuery, roomQuery]);

      if (appRes.error) console.error("Erro Appointments:", appRes.error);
      if (roomRes.error) console.error("Erro Rooms:", roomRes.error);

      // Processar dados de Appointments
      if (appRes.data) {
        appRes.data.forEach((item: any) => {
          unifiedList.push({
            id: item.id,
            date: item.date,
            start_time: item.start_time,
            status: item.status,
            patient_id: item.patient_id,
            professional_id: item.professional_id,
            patient_name: item.patient?.name || 'Desconhecido',
            professional_name: item.professional?.name || 'Desconhecido',
            agenda_type: item.agenda_type,
            source: 'appointment'
          });
        });
      }

      // Processar dados de Room Bookings
      if (roomRes.data) {
        roomRes.data.forEach((item: any) => {
          unifiedList.push({
            id: item.id,
            date: item.date,
            start_time: item.start_time,
            status: 'scheduled', 
            patient_id: item.patient_id,
            professional_id: item.professional_id,
            patient_name: item.patient?.name || '(Sem Paciente)',
            professional_name: item.professional?.name || 'Desconhecido',
            agenda_type: item.agenda_type,
            room_name: item.room?.name,
            source: 'room_booking'
          });
        });
      }

      // Ordenar: Data (Crescente) -> Hora (Crescente)
      unifiedList.sort((a, b) => {
        const dateA = new Date(`${a.date}T${a.start_time}`);
        const dateB = new Date(`${b.date}T${b.start_time}`);
        return dateA.getTime() - dateB.getTime();
      });

      setAppointments(unifiedList);
    } catch (error) {
      console.error("Erro fatal ao carregar agenda:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async (item: UnifiedAppointment) => {
    if (!confirm('Tem certeza que deseja cancelar este agendamento?')) return;
    
    try {
      if (item.source === 'room_booking') {
        const { error } = await supabase.from('room_bookings').delete().eq('id', item.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('appointments').update({ status: 'cancelled' }).eq('id', item.id);
        if (error) throw error;
      }
      
      // Recarregar dados após cancelamento
      fetchData(); 
    } catch (error) {
      alert('Erro ao cancelar.');
    }
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    const [year, month, day] = dateStr.split('-');
    return `${day}/${month}/${year}`;
  };

  // Agrupar por data para exibição
  const groupedAppointments = appointments.reduce((acc, apt) => {
    const dateKey = apt.date;
    if (!acc[dateKey]) acc[dateKey] = [];
    acc[dateKey].push(apt);
    return acc;
  }, {} as Record<string, UnifiedAppointment[]>);

  const clearFilters = () => {
    setFilterProfessional('');
    setFilterPatient('');
  };

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      <header className="flex flex-col md:flex-row justify-between md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-serif text-cinza-dark mb-2">
            {user?.role === UserRole.PATIENT ? 'Meus Agendamentos' : 'Agenda Completa'}
          </h2>
          <p className="text-cinza text-sm">Visualize e gerencie os atendimentos e reservas de sala.</p>
        </div>
        <button onClick={() => fetchData()} className="self-start md:self-auto p-2 text-cinza hover:bg-bege rounded-full transition-colors" title="Atualizar">
          <RefreshCw size={20} />
        </button>
      </header>

      {/* ADMIN FILTERS */}
      {isAdmin && (
        <div className="bg-white p-4 rounded-xl shadow-sm border border-sakura/20 flex flex-col md:flex-row gap-4 items-end">
           <div className="flex items-center gap-2 text-cinza-dark font-medium mr-2 self-start md:self-center">
             <Filter size={18} /> Filtros:
           </div>
           
           <div className="flex-1 w-full md:w-auto">
             <label className="block text-xs font-bold text-cinza uppercase mb-1">Profissional</label>
             <select 
               value={filterProfessional} 
               onChange={(e) => setFilterProfessional(e.target.value)}
               className="w-full p-2 bg-bege/30 rounded-lg border border-bege-dark text-sm outline-none focus:border-sakura"
             >
               <option value="">Todos os Profissionais</option>
               {professionals.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
             </select>
           </div>

           <div className="flex-1 w-full md:w-auto">
             <label className="block text-xs font-bold text-cinza uppercase mb-1">Paciente</label>
             <select 
               value={filterPatient} 
               onChange={(e) => setFilterPatient(e.target.value)}
               className="w-full p-2 bg-bege/30 rounded-lg border border-bege-dark text-sm outline-none focus:border-sakura"
             >
               <option value="">Todos os Pacientes</option>
               {patientOptions.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
             </select>
           </div>

           {(filterProfessional || filterPatient) && (
              <button 
                onClick={clearFilters}
                className="text-xs text-red-400 hover:text-red-600 underline self-center md:self-end pb-2"
              >
                Limpar
              </button>
           )}
        </div>
      )}

      {/* AGENDA LIST */}
      {loading ? (
        <div className="p-12 text-center flex flex-col items-center">
          <Loader2 className="animate-spin text-sakura mb-2" size={32}/>
          <span className="text-cinza">Carregando dados unificados...</span>
        </div>
      ) : Object.keys(groupedAppointments).length === 0 ? (
        <div className="bg-white p-12 text-center text-cinza border border-dashed border-sakura/30 rounded-2xl">
          Nenhum agendamento encontrado para os filtros selecionados.
        </div>
      ) : (
        <div className="space-y-8">
          {Object.keys(groupedAppointments).map(dateKey => (
            <div key={dateKey} className="bg-white rounded-2xl shadow-sm border border-sakura/20 overflow-hidden">
               <div className="bg-bege/30 px-6 py-3 border-b border-sakura/10 flex items-center gap-2">
                 <CalendarIcon size={18} className="text-sakura-dark"/>
                 <h3 className="font-serif font-bold text-cinza-dark capitalize">
                    {formatDate(dateKey)} <span className="text-xs font-normal text-cinza ml-2">({new Date(dateKey + 'T12:00:00').toLocaleDateString('pt-BR', {weekday: 'long'})})</span>
                 </h3>
               </div>
               
               <div className="divide-y divide-bege">
                 {groupedAppointments[dateKey].map(apt => (
                   <div key={apt.id} className="p-4 hover:bg-bege/10 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4">
                      
                      {/* Left: Time & Status */}
                      <div className="flex items-center gap-4 min-w-[140px]">
                        <span className="text-xl font-serif font-bold text-cinza-dark">{apt.start_time.substring(0, 5)}</span>
                        <div className="flex flex-col items-start gap-1">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium border
                            ${apt.status === 'scheduled' ? 'bg-menta/20 text-menta-dark border-menta/30' : 
                              apt.status === 'cancelled' ? 'bg-red-50 text-red-700 border-red-100' : 
                              'bg-gray-100 text-gray-800 border-gray-200'}
                          `}>
                            {apt.status === 'scheduled' ? 'Confirmado' : apt.status === 'cancelled' ? 'Cancelado' : apt.status}
                          </span>
                          {apt.source === 'room_booking' && (
                             <span className="text-[10px] text-cinza bg-bege px-1 rounded border border-bege-dark whitespace-nowrap">Sala Reservada</span>
                          )}
                        </div>
                      </div>

                      {/* Middle: Details */}
                      <div className="flex-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-4 gap-y-2">
                         {/* Paciente */}
                         <div className="flex items-center gap-2 text-sm text-cinza-dark">
                           <UserIcon size={16} className="text-sakura-dark shrink-0"/>
                           <div className="flex flex-col">
                             <span className="font-bold">{apt.patient_name || 'Paciente não vinculado'}</span>
                             {user?.role === UserRole.PATIENT && <span className="text-xs text-cinza">Profissional: {apt.professional_name}</span>}
                           </div>
                         </div>
                         
                         {/* Local */}
                         {apt.room_name && (
                           <div className="flex items-center gap-2 text-sm text-cinza">
                             <MapPin size={16} className="text-cinza shrink-0"/>
                             <span>{apt.room_name}</span>
                           </div>
                         )}

                         {/* Serviço */}
                         <div className="flex items-center gap-2">
                           {apt.agenda_type ? (
                             <>
                               <span className="w-2 h-2 rounded-full shrink-0" style={{backgroundColor: apt.agenda_type.color}}></span>
                               <span className="text-sm text-cinza truncate">{apt.agenda_type.name}</span>
                             </>
                           ) : (
                             <span className="text-sm text-cinza/50 italic">-</span>
                           )}
                         </div>

                         {/* Profissional (Visível para Admin) */}
                         {isAdmin && (
                            <div className="flex items-center gap-2 text-sm text-cinza lg:col-span-3 border-t border-bege/50 pt-2 mt-1">
                               <span className="text-xs font-bold uppercase text-cinza/50">Profissional:</span>
                               <span className="font-medium text-cinza-dark">{apt.professional_name}</span>
                            </div>
                         )}
                      </div>

                      {/* Right: Actions */}
                      <div className="flex justify-end">
                        {apt.status !== 'cancelled' && (isAdmin || user?.id === apt.professional_id) && (
                          <button 
                            onClick={() => handleCancel(apt)}
                            className="text-red-400 hover:text-red-600 hover:bg-red-50 p-2 rounded-lg transition-colors text-xs flex items-center gap-1 border border-transparent hover:border-red-200"
                            title="Cancelar Agendamento"
                          >
                            <XCircle size={16} /> 
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