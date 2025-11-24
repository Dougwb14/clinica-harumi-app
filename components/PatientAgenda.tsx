import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../contexts/AuthContext';
import { Appointment, UserRole, User } from '../types';
import { Calendar as CalendarIcon, Loader2, XCircle, RefreshCw, User as UserIcon, Filter, MapPin, Clock, AlertCircle } from 'lucide-react';

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

  // Filters
  const [filterProfessional, setFilterProfessional] = useState('');
  const [filterPatient, setFilterPatient] = useState('');
  
  // Dropdown Data
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
      const { data: profs } = await supabase
        .from('profiles')
        .select('id, name, role')
        .in('role', ['PROFESSIONAL', 'ADMIN'])
        .order('name');
      if (profs) setProfessionals(profs as any);

      // Pacientes Unificados
      const combinedPatients: PatientOption[] = [];
      
      // Do App
      const { data: profilePats } = await supabase
        .from('profiles')
        .select('id, name')
        .eq('role', 'PATIENT');
      if (profilePats) profilePats.forEach(p => combinedPatients.push({id: p.id, name: `${p.name} (App)`, source: 'profile'}));

      // Da Ficha
      const { data: recordPats } = await supabase
        .from('patients')
        .select('id, name');
      if (recordPats) recordPats.forEach(p => combinedPatients.push({id: p.id, name: `${p.name} (Ficha)`, source: 'record'}));

      combinedPatients.sort((a, b) => a.name.localeCompare(b.name));
      setPatientOptions(combinedPatients);
    } catch (e) { console.error(e); }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const unifiedList: UnifiedAppointment[] = [];

      // 1. APPOINTMENTS (App Direct)
      // Usamos sintaxe explicita para FKs para evitar ambiguidade
      let appQuery = supabase.from('appointments').select(`
        id, date, start_time, status, patient_id, professional_id, agenda_type_id,
        patient:profiles!patient_id(name),
        professional:profiles!professional_id(name),
        agenda_type:agenda_types(name, price, color)
      `);

      // 2. ROOM BOOKINGS (Admin/Prof Reservas)
      let roomQuery = supabase.from('room_bookings').select(`
        id, date, start_time, status, patient_id, professional_id, agenda_type_id,
        patient:patients(name),
        professional:profiles(name),
        agenda_type:agenda_types(name, price, color),
        room:rooms(name)
      `);

      // Apply Filters
      if (!isAdmin) {
        if (user?.role === UserRole.PROFESSIONAL) {
          appQuery = appQuery.eq('professional_id', user.id);
          roomQuery = roomQuery.eq('professional_id', user.id);
        } else if (user?.role === UserRole.PATIENT) {
          appQuery = appQuery.eq('patient_id', user.id);
          // Pacientes não veem room_bookings diretos normalmente, mas mantemos a query vazia/segura
          roomQuery = roomQuery.eq('patient_id', '00000000-0000-0000-0000-000000000000'); 
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

      // Process Appointments
      if (appRes.data) {
        appRes.data.forEach((item: any) => {
          unifiedList.push({
            id: item.id,
            date: item.date,
            start_time: item.start_time?.substring(0,5) || '00:00',
            status: item.status,
            patient_id: item.patient_id,
            professional_id: item.professional_id,
            patient_name: item.patient?.name || 'Paciente App',
            professional_name: item.professional?.name || 'Profissional',
            agenda_type: Array.isArray(item.agenda_type) ? item.agenda_type[0] : item.agenda_type,
            source: 'appointment'
          });
        });
      }

      // Process Room Bookings
      if (roomRes.data) {
        roomRes.data.forEach((item: any) => {
          unifiedList.push({
            id: item.id,
            date: item.date,
            start_time: item.start_time?.substring(0,5) || '00:00',
            status: 'scheduled',
            patient_id: item.patient_id,
            professional_id: item.professional_id,
            patient_name: item.patient?.name || '(Sem Paciente)',
            professional_name: item.professional?.name || 'Profissional',
            agenda_type: Array.isArray(item.agenda_type) ? item.agenda_type[0] : item.agenda_type,
            room_name: Array.isArray(item.room) ? item.room[0]?.name : item.room?.name,
            source: 'room_booking'
          });
        });
      }

      // Sort
      unifiedList.sort((a, b) => {
        const da = new Date(`${a.date}T${a.start_time}`);
        const db = new Date(`${b.date}T${b.start_time}`);
        return da.getTime() - db.getTime();
      });

      setAppointments(unifiedList);
    } catch (error) {
      console.error("Fetch Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async (item: UnifiedAppointment) => {
    if (!confirm('Cancelar este agendamento?')) return;
    try {
      let error;
      if (item.source === 'room_booking') {
        const res = await supabase.from('room_bookings').delete().eq('id', item.id);
        error = res.error;
      } else {
        const res = await supabase.from('appointments').update({status: 'cancelled'}).eq('id', item.id);
        error = res.error;
      }
      
      if (error) {
        console.error(error);
        alert(`Erro: ${error.message || 'Permissão negada.'}`);
      } else {
        alert('Cancelado com sucesso!');
        fetchData();
      }
    } catch (e) {
      alert('Erro inesperado ao cancelar.');
    }
  };

  const grouped = appointments.reduce((acc, curr) => {
    if (!acc[curr.date]) acc[curr.date] = [];
    acc[curr.date].push(curr);
    return acc;
  }, {} as Record<string, UnifiedAppointment[]>);

  const formatDate = (s: string) => {
    if (!s) return '';
    const [y, m, d] = s.split('-');
    return `${d}/${m}/${y}`;
  };

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      <header className="flex flex-col md:flex-row justify-between gap-4 items-center">
        <div>
          <h2 className="text-3xl font-serif text-cinza-dark mb-2">Agenda Completa</h2>
          <p className="text-cinza text-sm">Visualização unificada (30 min).</p>
        </div>
        <button onClick={fetchData} className="p-2 hover:bg-bege rounded-full text-cinza transition-colors"><RefreshCw size={20}/></button>
      </header>

      {isAdmin && (
        <div className="bg-white p-4 rounded-xl shadow-sm border border-sakura/20 flex flex-wrap gap-4 items-end">
          <div className="flex items-center gap-2 text-cinza font-medium mr-2"><Filter size={18}/> Filtros:</div>
          <div className="flex-1 min-w-[200px]">
            <label className="text-xs font-bold text-cinza uppercase">Profissional</label>
            <select value={filterProfessional} onChange={e => setFilterProfessional(e.target.value)} className="w-full p-2 bg-bege/30 rounded-lg border border-bege-dark text-sm outline-none">
              <option value="">Todos</option>
              {professionals.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
          <div className="flex-1 min-w-[200px]">
            <label className="text-xs font-bold text-cinza uppercase">Paciente</label>
            <select value={filterPatient} onChange={e => setFilterPatient(e.target.value)} className="w-full p-2 bg-bege/30 rounded-lg border border-bege-dark text-sm outline-none">
              <option value="">Todos</option>
              {patientOptions.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
          {(filterProfessional || filterPatient) && <button onClick={() => {setFilterProfessional(''); setFilterPatient('');}} className="text-xs text-red-400 underline pb-2">Limpar</button>}
        </div>
      )}

      {loading ? (
        <div className="p-12 text-center"><Loader2 className="animate-spin text-sakura mx-auto mb-2" size={32}/><span className="text-cinza">Carregando...</span></div>
      ) : Object.keys(grouped).length === 0 ? (
        <div className="bg-white p-12 text-center text-cinza border border-dashed border-sakura/30 rounded-2xl">
          <AlertCircle className="mx-auto mb-2 text-sakura" size={32}/>
          <p>Nenhum agendamento encontrado.</p>
        </div>
      ) : (
        <div className="space-y-8">
          {Object.keys(grouped).map(date => (
            <div key={date} className="bg-white rounded-2xl shadow-sm border border-sakura/20 overflow-hidden">
              <div className="bg-bege/30 px-6 py-3 border-b border-sakura/10 flex items-center gap-2">
                <CalendarIcon size={18} className="text-sakura-dark"/>
                <h3 className="font-serif font-bold text-cinza-dark">{formatDate(date)}</h3>
              </div>
              <div className="divide-y divide-bege">
                {grouped[date].map(apt => (
                  <div key={apt.id} className="p-4 hover:bg-bege/10 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-4 min-w-[160px]">
                      <div className="flex flex-col items-center bg-white border border-bege-dark rounded-lg p-2 min-w-[80px]">
                        <span className="text-lg font-serif font-bold text-cinza-dark">{apt.start_time}</span>
                        <span className="text-[10px] text-cinza flex items-center gap-1"><Clock size={10}/> 30m</span>
                      </div>
                      <div className="flex flex-col gap-1">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-bold border ${apt.status === 'cancelled' ? 'bg-red-50 text-red-600 border-red-100' : 'bg-menta/20 text-menta-dark border-menta/30'}`}>
                          {apt.status === 'cancelled' ? 'Cancelado' : 'Confirmado'}
                        </span>
                        {apt.source === 'room_booking' && <span className="text-[10px] text-cinza bg-bege px-1 rounded border border-bege-dark">Sala Reservada</span>}
                      </div>
                    </div>

                    <div className="flex-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                      <div className="flex items-center gap-2 text-sm text-cinza-dark">
                        <UserIcon size={16} className="text-sakura-dark shrink-0"/>
                        <span className="font-bold">{apt.patient_name}</span>
                      </div>
                      {apt.room_name && (
                        <div className="flex items-center gap-2 text-sm text-cinza">
                          <MapPin size={16} className="text-cinza shrink-0"/>
                          <span>{apt.room_name}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-2">
                        {apt.agenda_type ? (
                          <span className="px-2 py-0.5 rounded-full text-xs bg-white border border-gray-200" style={{borderColor: apt.agenda_type.color}}>
                            {apt.agenda_type.name}
                          </span>
                        ) : <span className="text-xs text-cinza italic">-</span>}
                      </div>
                      {isAdmin && (
                        <div className="lg:col-span-3 text-xs text-cinza mt-1 pt-1 border-t border-bege/50">
                          Profissional: <span className="font-medium">{apt.professional_name}</span>
                        </div>
                      )}
                    </div>

                    <div className="flex justify-end">
                      {apt.status !== 'cancelled' && (isAdmin || user?.id === apt.professional_id) && (
                        <button onClick={() => handleCancel(apt)} className="text-red-400 hover:text-red-600 hover:bg-red-50 p-2 rounded-lg flex items-center gap-1 transition-colors text-sm">
                          <XCircle size={18}/> Cancelar
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