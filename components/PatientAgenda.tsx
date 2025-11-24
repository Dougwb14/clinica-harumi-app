import React, { useState } from 'react';
import { MOCK_APPOINTMENTS } from '../constants';
import { MoreHorizontal, Plus, Search, Calendar as CalendarIcon, Ban, Check } from 'lucide-react';

export const PatientAgenda: React.FC = () => {
  const [filter, setFilter] = useState('all');

  return (
    <div className="space-y-6 animate-fade-in">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-serif text-cinza-dark mb-2">Minha Agenda</h2>
          <p className="text-cinza">Gerencie seus atendimentos clínicos.</p>
        </div>
        <div className="flex gap-3">
           <button className="flex items-center gap-2 px-4 py-2 bg-white text-cinza border border-bege-dark rounded-xl hover:bg-bege transition-colors">
              <Ban size={18} />
              Bloquear Horário
           </button>
           <button className="flex items-center gap-2 px-4 py-2 bg-sakura text-sakura-dark font-medium rounded-xl hover:bg-sakura-dark hover:text-white transition-colors shadow-sm">
              <Plus size={18} />
              Novo Agendamento
           </button>
        </div>
      </header>

      {/* Filters & Search */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-sakura/20 flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="relative w-full md:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-cinza/50" size={18} />
          <input 
            type="text" 
            placeholder="Buscar paciente..." 
            className="w-full pl-10 pr-4 py-2 bg-bege/50 rounded-xl text-cinza-dark text-sm focus:outline-none focus:ring-1 focus:ring-sakura"
          />
        </div>
        
        <div className="flex gap-2 w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
          {['Todos', 'Agendados', 'Realizados', 'Cancelados'].map((tab) => (
             <button 
              key={tab}
              className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap ${
                (filter === 'all' && tab === 'Todos') || filter === tab.toLowerCase()
                ? 'bg-menta/20 text-menta-dark' 
                : 'text-cinza hover:text-cinza-dark'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Appointment List */}
      <div className="bg-white rounded-2xl shadow-sm border border-sakura/20 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-bege/50 border-b border-bege-dark">
            <tr>
              <th className="p-4 text-xs font-semibold text-cinza uppercase tracking-wider">Horário</th>
              <th className="p-4 text-xs font-semibold text-cinza uppercase tracking-wider">Paciente</th>
              <th className="p-4 text-xs font-semibold text-cinza uppercase tracking-wider">Sala</th>
              <th className="p-4 text-xs font-semibold text-cinza uppercase tracking-wider">Status</th>
              <th className="p-4 text-xs font-semibold text-cinza uppercase tracking-wider text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-bege">
            {MOCK_APPOINTMENTS.map((apt) => (
              <tr key={apt.id} className="hover:bg-bege/20 transition-colors group">
                <td className="p-4">
                  <div className="flex items-center gap-2 text-cinza-dark font-medium">
                    <CalendarIcon size={16} className="text-menta" />
                    {new Date(apt.startTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                  </div>
                </td>
                <td className="p-4">
                   <div className="flex items-center gap-3">
                     <div className="w-8 h-8 rounded-full bg-sakura/30 flex items-center justify-center text-sakura-dark font-bold text-xs">
                       {apt.patientName.charAt(0)}
                     </div>
                     <span className="text-cinza-dark">{apt.patientName}</span>
                   </div>
                </td>
                <td className="p-4 text-sm text-cinza">
                  {apt.roomId === 'r1' ? 'Sala Cerejeira' : apt.roomId === 'r2' ? 'Sala Bambu' : 'Sala Online'}
                </td>
                <td className="p-4">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                    ${apt.status === 'scheduled' ? 'bg-blue-50 text-blue-700' : 
                      apt.status === 'completed' ? 'bg-green-50 text-green-700' :
                      'bg-gray-100 text-gray-800'
                    }
                  `}>
                    {apt.status === 'scheduled' ? 'Agendado' : apt.status === 'completed' ? 'Realizado' : apt.status}
                  </span>
                </td>
                <td className="p-4 text-right">
                  <button className="text-cinza hover:text-menta-dark p-2 hover:bg-menta/10 rounded-lg transition-colors">
                    <MoreHorizontal size={18} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        
        {/* Empty State visual helper */}
        {MOCK_APPOINTMENTS.length === 0 && (
          <div className="p-12 text-center flex flex-col items-center justify-center text-cinza">
            <CalendarIcon size={48} className="mb-4 text-bege-dark" />
            <p>Nenhum agendamento para este dia.</p>
          </div>
        )}
      </div>
    </div>
  );
};