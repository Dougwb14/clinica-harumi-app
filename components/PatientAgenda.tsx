import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../contexts/AuthContext';
import { Appointment, UserRole } from '../types';
import { Calendar as CalendarIcon, Loader2, XCircle, RefreshCw } from 'lucide-react';

export const PatientAgenda: React.FC = () => {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) fetchAppointments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const fetchAppointments = async () => {
    setLoading(true);
    try {
      let query = supabase.from('appointments').select(`
        *,
        patient:patient_id(name),
        professional:professional_id(name)
      `).order('date', { ascending: true });

      if (user?.role === UserRole.PATIENT) {
        query = query.eq('patient_id', user.id);
      } else if (user?.role === UserRole.PROFESSIONAL) {
        query = query.eq('professional_id', user.id);
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
        professional_name: apt.professional?.name
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
      
      fetchAppointments(); // Refresh
    } catch (error) {
      alert('Erro ao cancelar.');
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <header className="flex justify-between items-center">
        <h2 className="text-3xl font-serif text-cinza-dark mb-2">
          {user?.role === UserRole.PATIENT ? 'Meus Agendamentos' : 'Agenda Completa'}
        </h2>
        <button onClick={fetchAppointments} className="p-2 text-cinza hover:bg-bege rounded-full transition-colors" title="Atualizar">
          <RefreshCw size={20} />
        </button>
      </header>

      <div className="bg-white rounded-2xl shadow-sm border border-sakura/20 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center flex flex-col items-center">
            <Loader2 className="animate-spin text-sakura mb-2" size={32}/>
            <span className="text-cinza">Carregando agenda...</span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left min-w-[600px]">
              <thead className="bg-bege/50 border-b border-bege-dark">
                <tr>
                  <th className="p-4 text-xs font-semibold text-cinza uppercase">Data/Hora</th>
                  <th className="p-4 text-xs font-semibold text-cinza uppercase">
                    {user?.role === UserRole.PATIENT ? 'Profissional' : 'Paciente'}
                  </th>
                  <th className="p-4 text-xs font-semibold text-cinza uppercase">Status</th>
                  <th className="p-4 text-xs font-semibold text-cinza uppercase text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-bege">
                {appointments.map((apt) => (
                  <tr key={apt.id} className="hover:bg-bege/20 transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-2 text-cinza-dark font-medium">
                        <CalendarIcon size={16} className="text-menta" />
                        {new Date(apt.date).toLocaleDateString('pt-BR')} às {apt.start_time}
                      </div>
                    </td>
                    <td className="p-4 text-cinza-dark">
                      {user?.role === UserRole.PATIENT ? apt.professional_name : apt.patient_name}
                    </td>
                    <td className="p-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium border
                        ${apt.status === 'scheduled' ? 'bg-blue-50 text-blue-700 border-blue-100' : 
                          apt.status === 'cancelled' ? 'bg-red-50 text-red-700 border-red-100' : 
                          'bg-gray-100 text-gray-800 border-gray-200'}
                      `}>
                        {apt.status === 'scheduled' ? 'Agendado' : 
                         apt.status === 'cancelled' ? 'Cancelado' : apt.status}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      {apt.status === 'scheduled' && (
                        <button 
                          onClick={() => handleCancel(apt.id)}
                          className="text-red-400 hover:text-red-600 hover:bg-red-50 p-2 rounded-lg transition-colors text-sm flex items-center gap-1 ml-auto"
                        >
                          <XCircle size={16} /> Cancelar
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
                {appointments.length === 0 && (
                  <tr>
                    <td colSpan={4} className="p-12 text-center text-cinza">Nenhum agendamento encontrado.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};