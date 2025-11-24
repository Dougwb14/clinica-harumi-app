import React, { useEffect, useState } from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';
import { CalendarCheck, Users, DoorOpen, Activity, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';

export const Dashboard: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    appointmentsToday: 0,
    roomsOccupied: 0,
    totalPatients: 0,
    income: 0
  });
  const [chartData, setChartData] = useState<any[]>([]);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      
      // 1. Fetch Appointments Today
      const { count: appointmentsToday } = await supabase
        .from('appointments')
        .select('*', { count: 'exact', head: true })
        .eq('date', today);

      // 2. Fetch Total Patients (Profiles with role PATIENT)
      const { count: totalPatients } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('role', 'PATIENT');

      // 3. Fetch Rooms Occupied Today
      const { count: roomsOccupied } = await supabase
        .from('room_bookings')
        .select('*', { count: 'exact', head: true })
        .eq('date', today);

      setStats({
        appointmentsToday: appointmentsToday || 0,
        roomsOccupied: roomsOccupied || 0,
        totalPatients: totalPatients || 0,
        income: (appointmentsToday || 0) * 150 // Mock value: R$150 per session
      });

      // 4. Fetch Chart Data (Appointments per day for the current week)
      // Note: In a real heavy app, this aggregation should be done via RPC or Edge Function.
      // For MVP, we fetch this week's data and aggregate in JS.
      const { data: weekData } = await supabase
        .from('appointments')
        .select('date')
        .gte('date', getMonday(new Date()).toISOString().split('T')[0])
        .lte('date', today);

      const days = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab'];
      const agg = weekData?.reduce((acc: any, curr) => {
        const d = new Date(curr.date).getDay();
        acc[d] = (acc[d] || 0) + 1;
        return acc;
      }, {}) || {};

      const formattedChartData = days.map((day, idx) => ({
        name: day,
        atendimentos: agg[idx] || 0
      }));
      setChartData(formattedChartData);

      // 5. Recent Activity (Latest 3 appointments created)
      const { data: recent } = await supabase
        .from('appointments')
        .select('created_at, status, patient:patient_id(name)')
        .order('created_at', { ascending: false })
        .limit(3);

      setRecentActivity(recent || []);

    } catch (error) {
      console.error('Error loading dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const getMonday = (d: Date) => {
    d = new Date(d);
    var day = d.getDay(),
        diff = d.getDate() - day + (day == 0 ? -6 : 1); 
    return new Date(d.setDate(diff));
  }

  if (loading) {
    return <div className="flex justify-center p-12"><Loader2 className="animate-spin text-sakura" size={40} /></div>;
  }

  return (
    <div className="space-y-8 animate-fade-in">
      <header>
        <h2 className="text-3xl font-serif text-cinza-dark mb-2">Painel de Controle</h2>
        <p className="text-cinza">Visão geral em tempo real da clínica.</p>
      </header>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { title: 'Atendimentos Hoje', value: stats.appointmentsToday, icon: CalendarCheck, color: 'bg-sakura text-sakura-dark' },
          { title: 'Reservas de Salas', value: stats.roomsOccupied, icon: DoorOpen, color: 'bg-menta text-white' },
          { title: 'Total Pacientes', value: stats.totalPatients, icon: Users, color: 'bg-bege-dark text-cinza-dark' },
          { title: 'Receita Est. (Dia)', value: `R$ ${stats.income}`, icon: Activity, color: 'bg-cinza text-white' },
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
          <h3 className="text-xl font-medium text-cinza-dark mb-6">Fluxo da Semana</h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
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
          <h3 className="text-xl font-medium text-cinza-dark mb-6">Atividade Recente</h3>
          <div className="space-y-4">
            {recentActivity.length === 0 ? (
              <p className="text-sm text-cinza">Nenhuma atividade recente.</p>
            ) : recentActivity.map((act, i) => (
              <div key={i} className="flex gap-3 items-start pb-3 border-b border-bege last:border-0">
                <div className="w-2 h-2 mt-2 rounded-full bg-sakura shrink-0"></div>
                <div>
                  <p className="text-sm text-cinza-dark">
                    Novo agendamento: <span className="font-medium">{act.patient?.name}</span>
                  </p>
                  <span className="text-xs text-cinza/70">
                    {new Date(act.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                  </span>
                </div>
              </div>
            ))}
          </div>
          <button className="w-full mt-6 py-2 text-sm text-menta-dark font-medium border border-menta rounded-lg hover:bg-menta/10 transition-colors">
            Ver tudo
          </button>
        </div>
      </div>
    </div>
  );
};