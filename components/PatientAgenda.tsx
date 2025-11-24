import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../contexts/AuthContext';
import { Appointment, UserRole } from '../types';
import { MoreHorizontal, Calendar as CalendarIcon, Loader2 } from 'lucide-react';

export const PatientAgenda: React.FC = () => {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) fetchAppointments();
  }, [user]);

  const fetchAppointments = async () => {
    try {
      let query = supabase.from('appointments').select(`
        *,
        patient:patient_id(name),
        professional:professional_id(name)
      `);

      // If patient, only show own. If prof, show own. If Admin, show all.
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

  return (
    <div className="space-y-6 animate-fade-in">
      <header>
        <h2 className="text-3xl font-serif text-cinza-dark mb-2">
          {user?.role === UserRole.PATIENT ? 'Meus Agendamentos' : 'Agenda da Clínica'}
        </h2>
      </header>

      <div className="bg-white rounded-2xl shadow-sm border border-sakura/20 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center"><Loader2 className="animate-spin mx-auto text-sakura"/></div>
        ) : (
          <table className="w-full text-left">
            <thead className="bg-bege/50 border-b border-bege-dark">
              <tr>
                <th className="p-4 text-xs font-semibold text-cinza uppercase">Data/Hora</th>
                <th className="p-4 text-xs font-semibold text-cinza uppercase">
                  {user?.role === UserRole.PATIENT ? 'Profissional' : 'Paciente'}
                </th>
                <th className="p-4 text-xs font-semibold text-cinza uppercase">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-bege">
              {appointments.map((apt) => (
                <tr key={apt.id} className="hover:bg-bege/20 transition-colors">
                  <td className="p-4">
                    <div className="flex items-center gap-2 text-cinza-dark font-medium">
                      <CalendarIcon size={16} className="text-menta" />
                      {new Date(apt.date).toLocaleDateString()} às {apt.start_time}
                    </div>
                  </td>
                  <td className="p-4 text-cinza-dark">
                    {user?.role === UserRole.PATIENT ? apt.professional_name : apt.patient_name}
                  </td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium
                      ${apt.status === 'scheduled' ? 'bg-blue-50 text-blue-700' : 'bg-gray-100 text-gray-800'}
                    `}>
                      {apt.status === 'scheduled' ? 'Agendado' : apt.status}
                    </span>
                  </td>
                </tr>
              ))}
              {appointments.length === 0 && (
                <tr>
                  <td colSpan={3} className="p-8 text-center text-cinza">Nenhum agendamento encontrado.</td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};