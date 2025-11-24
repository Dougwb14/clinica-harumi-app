import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../contexts/AuthContext';
import { Appointment, UserRole, User } from '../types';
import { Calendar as CalendarIcon, Loader2, XCircle, RefreshCw, User as UserIcon, Filter, MapPin } from 'lucide-react';

interface UnifiedAppointment extends Appointment {
  source: 'appointment' | 'room_booking';
  room_name?: string;
}

export const PatientAgenda: React.FC = () => {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState<UnifiedAppointment[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [filterProfessional, setFilterProfessional] = useState('');
  
  // Dropdown data
  const [professionals, setProfessionals] = useState<User[]>([]);

  const isAdmin = user?.role === UserRole.ADMIN;

  useEffect(() => {
    if (user) {
      if (isAdmin) fetchDropdowns();
      fetchData();
    }
  }, [user, filterProfessional]);

  const fetchDropdowns = async () => {
    try {
      const { data: profs } = await supabase.from('profiles').select('*').in('role', ['PROFESSIONAL', 'ADMIN']);
      if (profs) setProfessionals(profs as any);
    } catch(e) { console.error(e); }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const unifiedList: UnifiedAppointment[] = [];

      // 1. Fetch APPOINTMENTS
      let appQuery = supabase.from('appointments').select(`
        *,
        patient:patient_id(name),
        professional:professional_id(name),
        agenda_type:agenda_type_id(name, price, color)
      `);

      // 2. Fetch ROOM BOOKINGS
      let roomQuery = supabase.from('room_bookings').select(`
        id, date, start_time, status, patient_id, professional_id, agenda_type_id,
        patient:patient_id(name),
        professional:profiles!professional_id(name),
        agenda_type:agenda_type_id(name, price, color),
        room:room_id(name)
      `);

      // Filters
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
    if (!confirm('Cancelar este agendamento?')) return;
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

  return (
    <div className="space-y-6 animate-fade-in">
      <header className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-serif text-cinza-dark mb-2">Agenda Completa</h2>
          <p className="text-cinza">Visão unificada.</p>
        </div>
        <button onClick={() => fetchData()} className="p-2 text-cinza hover:bg-bege rounded-full"><RefreshCw size={20}/></button>
      </header>

      {isAdmin && (
        <div className="bg-white p-4 rounded-xl shadow-sm border border-sakura/20 flex gap-4 items-center">
           <Filter size={18} className="text-cinza"/>
           <select 
             value={filterProfessional} 
             onChange={(e) => setFilterProfessional(e.target.value)}
             className="flex-1 p-2 bg-bege/30 rounded-lg border border-bege-dark text-sm"
           >
             <option value="">Todos os Profissionais</option>
             {professionals.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
           </select>
        </div>
      )}

      {loading ? (
        <div className="p-12 text-center"><Loader2 className="animate-spin mx-auto text-sakura"/></div>
      ) : Object.keys(groupedAppointments).length === 0 ? (
        <div className="bg-white p-12 text-center text-cinza rounded-2xl border border-dashed border-sakura/30">
          Nada agendado.
        </div>
      ) : (
        <div className="space-y-6">
          {Object.keys(groupedAppointments).map(dateKey => (
            <div key={dateKey} className="bg-white rounded-2xl shadow-sm border border-sakura/20 overflow-hidden">
               <div className="bg-bege/30 px-6 py-3 border-b border-sakura/10 flex items-center gap-2">
                 <CalendarIcon size={18} className="text-sakura-dark"/>
                 <h3 className="font-bold text-cinza-dark">{formatDate(dateKey)}</h3>
               </div>
               <div className="divide-y divide-bege">
                 {groupedAppointments[dateKey].map(apt => (
                   <div key={apt.id} className="p-4 flex items-center justify-between hover:bg-bege/10">
                      <div className="flex gap-4 items-center">
                        <span className="font-bold text-lg text-cinza-dark">{apt.start_time.substring(0,5)}</span>
                        <div>
                           <p className="font-bold text-cinza-dark">{apt.patient_name || 'Sem Paciente'}</p>
                           <p className="text-xs text-cinza">Prof: {apt.professional_name} {apt.room_name && `• ${apt.room_name}`}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        {apt.agenda_type && (
                          <span className="text-xs px-2 py-1 rounded bg-gray-100 border border-gray-200">{apt.agenda_type.name}</span>
                        )}
                        {(isAdmin || user?.id === apt.professional_id) && apt.status !== 'cancelled' && (
                          <button onClick={() => handleCancel(apt)} className="text-red-400 hover:text-red-600"><XCircle size={18}/></button>
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