import React from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';
import { CalendarCheck, Users, DoorOpen, Activity } from 'lucide-react';

const data = [
  { name: 'Seg', atendimentos: 12 },
  { name: 'Ter', atendimentos: 19 },
  { name: 'Qua', atendimentos: 15 },
  { name: 'Qui', atendimentos: 22 },
  { name: 'Sex', atendimentos: 18 },
  { name: 'Sab', atendimentos: 10 },
];

export const Dashboard: React.FC = () => {
  return (
    <div className="space-y-8 animate-fade-in">
      <header>
        <h2 className="text-3xl font-serif text-cinza-dark mb-2">Bem-vindo(a), Dra. Elisa</h2>
        <p className="text-cinza">Confira o resumo das atividades da clínica hoje.</p>
      </header>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { title: 'Atendimentos Hoje', value: '18', icon: CalendarCheck, color: 'bg-sakura text-sakura-dark' },
          { title: 'Salas Ocupadas', value: '3/5', icon: DoorOpen, color: 'bg-menta text-white' },
          { title: 'Novos Pacientes', value: '+4', icon: Users, color: 'bg-bege-dark text-cinza-dark' },
          { title: 'Receita Mensal', value: 'R$ 12k', icon: Activity, color: 'bg-cinza text-white' },
        ].map((card, idx) => (
          <div key={idx} className="bg-white p-6 rounded-2xl shadow-sm border border-sakura/20 flex items-center gap-4 hover:shadow-md transition-shadow">
            <div className={`p-4 rounded-xl ${card.color}`}>
              <card.icon size={24} />
            </div>
            <div>
              <p className="text-sm text-cinza">{card.title}</p>
              <h3 className="text-2xl font-bold text-cinza-dark">{card.value}</h3>
            </div>
          </div>
        ))}
      </div>

      {/* Main Chart Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-sakura/20">
          <h3 className="text-xl font-medium text-cinza-dark mb-6">Fluxo de Atendimentos (Semana)</h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#EBE0E0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#8C8C8C'}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#8C8C8C'}} />
                <Tooltip 
                  cursor={{fill: '#F6EFEF'}}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Bar dataKey="atendimentos" fill="#B5DAD7" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Side Panel: Notifications */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-sakura/20">
          <h3 className="text-xl font-medium text-cinza-dark mb-6">Avisos Recentes</h3>
          <div className="space-y-4">
            {[
              { text: 'Dra. Ana confirmou reserva da Sala Bambu', time: '10 min atrás', type: 'room' },
              { text: 'Paciente João solicitou reagendamento', time: '1h atrás', type: 'schedule' },
              { text: 'Manutenção do Ar Condicionado amanhã', time: 'Hoje', type: 'system' },
            ].map((note, i) => (
              <div key={i} className="flex gap-3 items-start pb-3 border-b border-bege last:border-0">
                <div className="w-2 h-2 mt-2 rounded-full bg-sakura shrink-0"></div>
                <div>
                  <p className="text-sm text-cinza-dark">{note.text}</p>
                  <span className="text-xs text-cinza/70">{note.time}</span>
                </div>
              </div>
            ))}
          </div>
          <button className="w-full mt-6 py-2 text-sm text-menta-dark font-medium border border-menta rounded-lg hover:bg-menta/10 transition-colors">
            Ver todas notificações
          </button>
        </div>
      </div>
    </div>
  );
};