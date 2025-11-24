import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../contexts/AuthContext';
import { Appointment, UserRole, User } from '../types';
import { Calendar as CalendarIcon, Loader2, XCircle, RefreshCw, User as UserIcon, Filter, MapPin } from 'lucide-react';

interface UnifiedAppointment extends Appointment {
  source: 'appointment' | 'room_booking';
  room_name?: string;
}

interface PatientOption {
  id: string;
  name: string;
}

export const PatientAgenda: React.FC = () => {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState<UnifiedAppointment[]>([]);
  const [loading, setLoading] = useState(true);

  // Filtros
  const [filterProfessional, setFilterProfessional] = useState('');
  const [filterPatient, setFilterPatient] = useState('');
  
  // Dados Dropdown
  const [professionals, setProfessionals] = useState<User[]>([]);
  const [patientOptions, setPatientOptions] = useState<PatientOption[]>([]);

  const isAdmin = user?.role === UserRole.ADMIN;

  useEffect(() => {
    if (user) {
      if (isAdmin) fetchDropdowns();
      fetchData();
    }
  }, [user, filterProfessional, filterPatient]);

  const fetchDropdowns = async () => {
    try {
      // Profissionais
      const { data: profs } = await supabase.from('profiles').select('*').in('role', ['PROFESSIONAL', 'ADMIN']);
      if (profs) setProfessionals(profs as any);

      // Pacientes (Unificado)
      const combinedPatients: PatientOption[] = [];
      
      const { data: profilePatients } = await supabase.from('profiles').select('id, name').eq('role', 'PATIENT');
      if (profilePatients) profilePatients.forEach(p => combinedPatients.push({ id: p.id, name: p.name + ' (App)' }));

      const { data: recordPatients } = await supabase.from('patients').select('id, name');
      if (recordPatients) recordPatients.forEach(p => combinedPatients.push({ id: p.id, name: p.name + ' (Ficha)' }));

      combinedPatients.sort((a, b) => a.name.localeCompare(b.name));
      setPatientOptions(combinedPatients);
    } catch(e) { console.error(e); }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const unifiedList: UnifiedAppointment[] = [];

      let appQuery = supabase.from('appointments').select(`
        *,
        patient:patient_id(name),
        professional:professional_id(name),
        agenda_type:agenda_type_id(name, price, color)
      `);

      let roomQuery = supabase.from('room_bookings').select(`
        id, date, start_time, status, patient_id, professional_id, agenda_type_id,
        patient:patient_id(name),
        professional:profiles!professional_id(name),
        agenda_type:agenda_type_id(name, price, color),
        room:room_id(name)
      `);

      // Filtros
      if (!isAdmin) {
        if (user?.role === UserRole.PROFESSIONAL) {
          appQuery = appQuery.eq('professional_id', user.id);
          roomQuery = roomQuery.eq('professional_id', user.id);
        } else if (user?.role === UserRole.PATIENT) {
          appQuery = appQuery.eq('patient_id', user.id);
          roomQuery = roomQuery.eq('patient_id', user.id);
        }
      } else {
        if (filterProfessional) {
          appQuery = appQuery.eq('professional_id', filterProfessional);
          roomQuery = roomQuery.eq('professional_id', filterProfessional);
        }
        if (filterPatient) {
          appQuery = appQuery.eq('patient_id', filterPatient);
          roomQuery = roomQuery.eq('patient_id', filterPatient);
        }
      }

      const [appRes, roomRes] = await Promise.all([appQuery, roomQuery]);

      if (appRes.data) {
        appRes.data.forEach((item: any) => {
          unifiedList.push({
            id: item.id,
            date: item.date,
            start_time: item.start_time,
            status: item.status,
            patient_id: item.patient_id,
            professional_id: item.professional_id,
            patient_name: item.patient?.name,
            professional_name: item.professional?.name,
            agenda_type: item.agenda_type,
            source: 'appointment'
          });
        });
      }

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
            professional_name: item.professional?.name,
            agenda_type: item.agenda_type,
            room_name: item.room?.name,
            source: 'room_booking'
          });
        });
      }

      unifiedList.sort((a, b) => {
        const da = new Date(`${a.date}T${a.start_time}`);
        const db = new Date(`${b.date}T${b.start_time}`);
        return da.getTime() - db.getTime();
      });

      setAppointments(unifiedList);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async (item: UnifiedAppointment) => {
    if (!confirm('Cancelar agendamento?')) return;
    try {
      if (item.source === 'room_booking') {
        await supabase.from('room_bookings').delete().eq('id', item.id);
      } else {
        await supabase.from('appointments').update({ status: 'cancelled' }).eq('id', item.id);
      }
      fetchData(); 
    } catch (error) { alert('Erro ao cancelar.'); }
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    const [year, month, day] = dateStr.split('-');
    return `${day}/${month}/${year}`;
  };

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
    <div className="space-y-6 animate-fade-in">
      <header className="flex flex-col md:flex-row justify-between md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-serif text-cinza-dark mb-2">
            {user?.role === UserRole.PATIENT ? 'Meus Agendamentos' : 'Agenda Completa'}
          </h2>
          <p className="text-cinza text-sm">Visualização unificada de reservas e consultas.</p>
        </div>
        <button onClick={() => fetchData()} className="self-start md:self-auto p-2 text-cinza hover:bg-bege rounded-full" title="Atualizar"><RefreshCw size={20}/></button>
      </header>

      {isAdmin && (
        <div className="bg-white p-4 rounded-xl shadow-sm border border-sakura/20 flex flex-col md:flex-row gap-4 items-end">
           <div className="flex items-center gap-2 text-cinza-dark font-medium mr-2 self-start md:self-center">
             <Filter size={18} /> Filtros:
           </div>
           
           <div className="flex-1 w-full md:w-auto">
             <label className="block text-xs font-bold text-cinza uppercase mb-1">Profissional</label>
             <select value={filterProfessional} onChange={(e) => setFilterProfessional(e.target.value)} className="w-full p-2 bg-bege/30 rounded-lg border border-bege-dark text-sm">
               <option value="">Todos os Profissionais</option>
               {professionals.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
             </select>
           </div>

           <div className="flex-1 w-full md:w-auto">
             <label className="block text-xs font-bold text-cinza uppercase mb-1">Paciente</label>
             <select value={filterPatient} onChange={(e) => setFilterPatient(e.target.value)} className="w-full p-2 bg-bege/30 rounded-lg border border-bege-dark text-sm">
               <option value="">Todos os Pacientes</option>
               {patientOptions.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
             </select>
           </div>

           {(filterProfessional || filterPatient) && (
              <button onClick={clearFilters} className="text-xs text-red-400 hover:text-red-600 underline self-center md:self-end pb-2">Limpar</button>
           )}
        </div>
      )}

      {loading ? (
        <div className="p-12 text-center flex flex-col items-center"><Loader2 className="animate-spin text-sakura mb-2" size={32}/><span className="text-cinza">Carregando...</span></div>
      ) : Object.keys(groupedAppointments).length === 0 ? (
        <div className="bg-white p-12 text-center text-cinza border border-dashed border-sakura/30 rounded-2xl">
          Nenhum agendamento encontrado.
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
                      <div className="flex items-center gap-4 min-w-[140px]">
                        <span className="text-lg font-bold text-cinza-dark">{apt.start_time.substring(0, 5)}</span>
                        <div className="flex flex-col items-start gap-1">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${apt.status === 'scheduled' ? 'bg-menta/20 text-menta-dark border-menta/30' : 'bg-red-50 text-red-700 border-red-100'}`}>
                            {apt.status === 'scheduled' ? 'Confirmado' : 'Cancelado'}
                          </span>
                        </div>
                      </div>
                      <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-2">
                         <div className="flex items-center gap-2 text-sm text-cinza-dark">
                           <UserIcon size={16} className="text-sakura-dark shrink-0"/>
                           <span className="font-bold">{apt.patient_name || 'Sem Paciente'}</span>
                         </div>
                         {apt.room_name && (
                           <div className="flex items-center gap-2 text-sm text-cinza">
                             <MapPin size={16} className="text-cinza shrink-0"/>
                             <span>{apt.room_name}</span>
                           </div>
                         )}
                         <div className="flex items-center gap-2">
                           {apt.agenda_type ? (
                             <>
                               <span className="w-2 h-2 rounded-full shrink-0" style={{backgroundColor: apt.agenda_type.color}}></span>
                               <span className="text-sm text-cinza">{apt.agenda_type.name}</span>
                             </>
                           ) : <span className="text-sm text-cinza/50">-</span>}
                         </div>
                         {isAdmin && <div className="text-xs text-cinza mt-1">Prof: {apt.professional_name}</div>}
                      </div>
                      <div className="flex justify-end">
                        {apt.status !== 'cancelled' && (isAdmin || user?.id === apt.professional_id) && (
                          <button onClick={() => handleCancel(apt)} className="text-red-400 hover:text-red-600 p-2"><XCircle size={18}/></button>
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