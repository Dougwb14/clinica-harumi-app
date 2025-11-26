import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../contexts/AuthContext';
import { UserRole } from '../types';
import { Calendar as CalendarIcon, Loader2, XCircle, RefreshCw, User as UserIcon, Filter, MapPin, Clock, AlertCircle } from 'lucide-react';

interface UnifiedAppointment {
  id: string;
  source: 'appointment' | 'room_booking';
  date: string;
  start_time: string;
  status: string;
  patient_id?: string;
  professional_id: string;
  agenda_type_id?: string;
  room_id?: string;
  patient_name: string;
  professional_name: string;
  service_name: string;
  service_color: string;
  room_name?: string;
}

export const PatientAgenda: React.FC = () => {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState<UnifiedAppointment[]>([]);
  const [filteredAppointments, setFilteredAppointments] = useState<UnifiedAppointment[]>([]);
  const [loading, setLoading] = useState(true);

  // Filtros
  const [professionalsList, setProfessionalsList] = useState<{id: string, name: string}[]>([]);
  const [patientsList, setPatientsList] = useState<{id: string, name: string}[]>([]);
  const [filterProf, setFilterProf] = useState('');
  const [filterPat, setFilterPat] = useState('');

  const isAdmin = user?.role === UserRole.ADMIN;

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  useEffect(() => {
    let result = appointments;
    if (filterProf) result = result.filter(item => item.professional_id === filterProf);
    if (filterPat) result = result.filter(item => item.patient_id === filterPat);
    setFilteredAppointments(result);
  }, [appointments, filterProf, filterPat]);

  const loadData = async () => {
    setLoading(true);
    try {
      // 1. BUSCAR DADOS DE REFERÊNCIA (LOOKUPS)
      const [profilesRes, patientsRes, roomsRes, typesRes] = await Promise.all([
        supabase.from('profiles').select('id, name, role'),
        supabase.from('patients').select('id, name'),
        supabase.from('rooms').select('id, name'),
        supabase.from('agenda_types').select('id, name, color, price')
      ]);

      const profileMap = new Map<string, any>(profilesRes.data?.map((p: any) => [p.id, p]) || []);
      const patientMap = new Map<string, any>(patientsRes.data?.map((p: any) => [p.id, p]) || []);
      const roomMap = new Map<string, any>(roomsRes.data?.map((r: any) => [r.id, r]) || []);
      const typeMap = new Map<string, any>(typesRes.data?.map((t: any) => [t.id, t]) || []);

      // Preencher Listas de Filtro
      const profs = (profilesRes.data || []).filter((p: any) => p.role === 'PROFESSIONAL' || p.role === 'ADMIN');
      setProfessionalsList(profs.map((p: any) => ({ id: p.id, name: p.name })));

      const appPatients = (profilesRes.data || []).filter((p: any) => p.role === 'PATIENT').map((p: any) => ({ id: p.id, name: p.name + ' (App)' }));
      const recordPatients = (patientsRes.data || []).map((p: any) => ({ id: p.id, name: p.name + ' (Ficha)' }));
      setPatientsList([...appPatients, ...recordPatients].sort((a, b) => a.name.localeCompare(b.name)));

      // 2. BUSCAR DADOS DA AGENDA (CRUS)
      let appQuery = supabase.from('appointments').select('*');
      let roomQuery = supabase.from('room_bookings').select('*');

      if (!isAdmin) {
        if (user?.role === UserRole.PROFESSIONAL) {
          appQuery = appQuery.eq('professional_id', user.id);
          roomQuery = roomQuery.eq('professional_id', user.id);
        } else if (user?.role === UserRole.PATIENT) {
          appQuery = appQuery.eq('patient_id', user.id);
          roomQuery = roomQuery.eq('id', '0'); // Paciente não vê reservas técnicas
        }
      }

      const [appData, roomData] = await Promise.all([appQuery, roomQuery]);
      const unifiedList: UnifiedAppointment[] = [];

      // Função Helper para Resolver Nomes
      const resolvePatientName = (id?: string) => {
        if (!id) return 'Não informado';
        if (patientMap.has(id)) return patientMap.get(id).name;
        if (profileMap.has(id)) return profileMap.get(id).name;
        return 'Desconhecido';
      };

      // 3. MAPEAR AGENDAMENTOS
      (appData.data || []).forEach((item: any) => {
        const agendaType = item.agenda_type_id ? typeMap.get(item.agenda_type_id) : null;
        const prof = profileMap.get(item.professional_id);
        
        unifiedList.push({
          id: item.id,
          source: 'appointment',
          date: item.date,
          start_time: (item.start_time || '00:00').substring(0, 5),
          status: item.status,
          patient_id: item.patient_id,
          professional_id: item.professional_id,
          agenda_type_id: item.agenda_type_id,
          patient_name: resolvePatientName(item.patient_id),
          professional_name: prof ? prof.name : 'Profissional Desconhecido',
          service_name: agendaType ? agendaType.name : 'Consulta',
          service_color: agendaType ? agendaType.color : '#B5DAD7'
        });
      });

      // 4. MAPEAR RESERVAS DE SALA
      (roomData.data || []).forEach((item: any) => {
        const agendaType = item.agenda_type_id ? typeMap.get(item.agenda_type_id) : null;
        const room = item.room_id ? roomMap.get(item.room_id) : null;
        const prof = profileMap.get(item.professional_id);
        const time = (item.start_time || item.time_slot || '00:00').substring(0, 5);

        unifiedList.push({
          id: item.id,
          source: 'room_booking',
          date: item.date,
          start_time: time,
          status: 'scheduled',
          patient_id: item.patient_id,
          professional_id: item.professional_id,
          agenda_type_id: item.agenda_type_id,
          room_id: item.room_id,
          patient_name: item.patient_id ? resolvePatientName(item.patient_id) : '(Reserva de Sala)',
          professional_name: prof ? prof.name : 'Profissional Desconhecido',
          service_name: agendaType ? agendaType.name : 'Aluguel de Sala',
          service_color: agendaType ? agendaType.color : '#FADADD',
          room_name: room ? room.name : 'Sala Desconhecida'
        });
      });

      unifiedList.sort((a, b) => {
        const da = new Date(`${a.date}T${a.start_time}`);
        const db = new Date(`${b.date}T${b.start_time}`);
        return da.getTime() - db.getTime();
      });

      setAppointments(unifiedList);
    } catch (err) {
      console.error("Erro ao carregar agenda:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async (item: UnifiedAppointment) => {
    if (!confirm(`Cancelar ${item.service_name}?`)) return;
    try {
      const table = item.source === 'room_booking' ? 'room_bookings' : 'appointments';
      const action = item.source === 'room_booking' ? 
        supabase.from(table).delete().eq('id', item.id) : 
        supabase.from(table).update({ status: 'cancelled' }).eq('id', item.id);
        
      const { error } = await action;
      if (error) throw error;
      alert('Cancelado!');
      loadData();
    } catch (e: any) {
      console.error(e);
      alert('Erro ao cancelar: ' + e.message);
    }
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    const [year, month, day] = dateStr.split('-');
    return `${day}/${month}/${year}`;
  };

  const groupedAppointments = filteredAppointments.reduce((acc, apt) => {
    const key = apt.date;
    if (!acc[key]) acc[key] = [];
    acc[key].push(apt);
    return acc;
  }, {} as Record<string, UnifiedAppointment[]>);

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      <header className="flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
          <h2 className="text-3xl font-serif text-cinza-dark mb-2">Agenda Completa</h2>
          <p className="text-cinza text-sm">Visualização unificada (30 min).</p>
        </div>
        <button onClick={loadData} className="p-2 bg-white hover:bg-bege text-cinza rounded-full shadow-sm border border-bege"><RefreshCw size={20}/></button>
      </header>

      {isAdmin && (
        <div className="bg-white p-4 rounded-xl shadow-sm border border-sakura/20 flex flex-wrap gap-4 items-end">
           <div className="flex items-center gap-2 text-cinza-dark font-medium mr-2"><Filter size={18}/> Filtros:</div>
           <div className="flex-1 min-w-[200px]">
             <label className="text-xs font-bold text-cinza uppercase">Profissional</label>
             <select value={filterProf} onChange={e => setFilterProf(e.target.value)} className="w-full p-2 bg-bege/30 rounded-lg border border-bege-dark text-sm">
               <option value="">Todos</option>
               {professionalsList.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
             </select>
           </div>
           <div className="flex-1 min-w-[200px]">
             <label className="text-xs font-bold text-cinza uppercase">Paciente</label>
             <select value={filterPat} onChange={e => setFilterPat(e.target.value)} className="w-full p-2 bg-bege/30 rounded-lg border border-bege-dark text-sm">
               <option value="">Todos</option>
               {patientsList.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
             </select>
           </div>
           {(filterProf || filterPat) && <button onClick={() => {setFilterProf(''); setFilterPat('')}} className="text-xs text-red-400 underline">Limpar</button>}
        </div>
      )}

      {loading ? (
        <div className="p-12 text-center"><Loader2 className="animate-spin text-sakura mx-auto" size={32}/><span className="text-cinza">Carregando...</span></div>
      ) : Object.keys(groupedAppointments).length === 0 ? (
        <div className="bg-white p-12 text-center text-cinza border border-dashed border-sakura/30 rounded-2xl">Nenhum agendamento encontrado.</div>
      ) : (
        <div className="space-y-8">
          {Object.keys(groupedAppointments).map(dateKey => (
            <div key={dateKey} className="bg-white rounded-2xl shadow-sm border border-sakura/20 overflow-hidden">
               <div className="bg-bege/30 px-6 py-3 border-b border-sakura/10 flex items-center gap-2">
                 <CalendarIcon size={18} className="text-sakura-dark"/>
                 <h3 className="font-serif font-bold text-cinza-dark capitalize">{formatDate(dateKey)} <span className="text-xs font-normal text-cinza">({new Date(dateKey+'T12:00:00').toLocaleDateString('pt-BR', {weekday: 'long'})})</span></h3>
               </div>
               <div className="divide-y divide-bege">
                 {groupedAppointments[dateKey].map(apt => (
                   <div key={apt.id} className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-bege/10">
                      <div className="flex items-center gap-4 min-w-[150px]">
                        <div className="flex flex-col items-center bg-white border border-bege-dark rounded-lg p-2 min-w-[70px]">
                           <span className="text-lg font-serif font-bold text-cinza-dark leading-none">{apt.start_time}</span>
                           <span className="text-[10px] text-cinza mt-1 flex items-center gap-0.5"><Clock size={8}/> 30m</span>
                        </div>
                        <div className="flex flex-col gap-1">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border uppercase w-fit ${apt.status === 'cancelled' ? 'bg-red-50 text-red-600 border-red-100' : 'bg-menta/20 text-menta-dark border-menta/30'}`}>
                            {apt.status === 'cancelled' ? 'Cancelado' : 'Confirmado'}
                          </span>
                          {apt.source === 'room_booking' && <span className="text-[9px] text-cinza bg-bege px-1 rounded border border-bege-dark w-fit">SALA</span>}
                        </div>
                      </div>
                      <div className="flex-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                         <div className="flex items-center gap-2 text-sm"><UserIcon size={16} className="text-sakura-dark"/><div className="flex flex-col"><span className="text-xs text-cinza uppercase font-bold">Paciente</span><span className="font-medium">{apt.patient_name}</span></div></div>
                         {apt.room_name && <div className="flex items-center gap-2 text-sm"><MapPin size={16} className="text-cinza"/><div className="flex flex-col"><span className="text-xs text-cinza uppercase font-bold">Local</span><span className="font-medium">{apt.room_name}</span></div></div>}
                         <div className="flex items-center gap-2 text-sm"><div className="w-3 h-3 rounded-full" style={{backgroundColor: apt.service_color}}></div><div className="flex flex-col"><span className="text-xs text-cinza uppercase font-bold">Serviço</span><span className="font-medium">{apt.service_name}</span></div></div>
                         {isAdmin && <div className="col-span-full text-xs text-cinza border-t border-bege pt-2 mt-1">Profissional: <span className="font-bold">{apt.professional_name}</span></div>}
                      </div>
                      <div className="flex justify-end">
                        {apt.status !== 'cancelled' && (isAdmin || user?.id === apt.professional_id) && (
                          <button onClick={() => handleCancel(apt)} className="text-red-400 hover:text-red-600 hover:bg-red-50 px-3 py-2 rounded-lg flex items-center gap-2 text-xs font-medium"><XCircle size={16}/> CANCELAR</button>
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