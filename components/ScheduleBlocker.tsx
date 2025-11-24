import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { MOCK_ROOMS } from '../constants';
import { User, ScheduleBlock } from '../types';
import { Lock, Trash2, Loader2 } from 'lucide-react';

export const ScheduleBlocker: React.FC = () => {
  const [blocks, setBlocks] = useState<ScheduleBlock[]>([]);
  const [professionals, setProfessionals] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Form State
  const [targetType, setTargetType] = useState<'ROOM' | 'PROFESSIONAL'>('ROOM');
  const [targetId, setTargetId] = useState('');
  const [date, setDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [reason, setReason] = useState('');

  useEffect(() => {
    Promise.all([fetchBlocks(), fetchProfessionals()]).then(() => setLoading(false));
  }, []);

  const fetchBlocks = async () => {
    const { data } = await supabase.from('schedule_blocks').select('*').order('date', {ascending: false});
    if(data) setBlocks(data as any);
  };

  const fetchProfessionals = async () => {
    const { data } = await supabase.from('profiles').select('*').eq('role', 'PROFESSIONAL');
    if(data) setProfessionals(data as any);
  };

  const handleBlock = async (e: React.FormEvent) => {
    e.preventDefault();
    if(!targetId || !date) return;

    try {
      const { error } = await supabase.from('schedule_blocks').insert({
        target_type: targetType,
        target_id: targetId,
        date,
        start_time: startTime || null, // Optional
        end_time: endTime || null, // Optional
        reason
      });
      if (error) throw error;
      alert('Bloqueio criado.');
      setReason('');
      fetchBlocks();
    } catch (error) {
      alert('Erro ao criar bloqueio');
    }
  };

  const handleDelete = async (id: string) => {
    if(!confirm('Remover bloqueio?')) return;
    await supabase.from('schedule_blocks').delete().eq('id', id);
    fetchBlocks();
  };

  const getTargetName = (block: ScheduleBlock) => {
    if(block.target_type === 'ROOM') {
      return MOCK_ROOMS.find(r => r.id === block.target_id)?.name || 'Sala Desconhecida';
    } else {
      return professionals.find(p => p.id === block.target_id)?.name || 'Profissional Desconhecido';
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <header>
        <h2 className="text-3xl font-serif text-cinza-dark mb-2">Bloqueio de Agenda</h2>
        <p className="text-cinza">Impeça agendamentos em datas específicas (Feriados, Manutenção, Férias).</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Form */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-sakura/20 h-fit">
          <h3 className="text-lg font-medium text-cinza-dark mb-4 flex items-center gap-2">
            <Lock size={20} className="text-sakura-dark"/> Novo Bloqueio
          </h3>
          <form onSubmit={handleBlock} className="space-y-4">
            <div>
              <label className="text-sm text-cinza block mb-1">Tipo de Bloqueio</label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" checked={targetType === 'ROOM'} onChange={() => setTargetType('ROOM')} className="text-sakura focus:ring-sakura" />
                  <span className="text-sm">Sala</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" checked={targetType === 'PROFESSIONAL'} onChange={() => setTargetType('PROFESSIONAL')} className="text-sakura focus:ring-sakura" />
                  <span className="text-sm">Profissional</span>
                </label>
              </div>
            </div>

            <div>
              <label className="text-sm text-cinza block mb-1">Alvo</label>
              <select className="w-full p-2 bg-bege/30 rounded-lg border border-bege-dark" value={targetId} onChange={e => setTargetId(e.target.value)} required>
                <option value="">Selecione...</option>
                {targetType === 'ROOM' 
                  ? MOCK_ROOMS.map(r => <option key={r.id} value={r.id}>{r.name}</option>)
                  : professionals.map(p => <option key={p.id} value={p.id}>{p.name}</option>)
                }
              </select>
            </div>

            <div>
               <label className="text-sm text-cinza block mb-1">Data</label>
               <input type="date" required className="w-full p-2 bg-bege/30 rounded-lg border border-bege-dark" value={date} onChange={e => setDate(e.target.value)} />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs text-cinza block mb-1">Início (Opcional)</label>
                <input type="time" className="w-full p-2 bg-bege/30 rounded-lg border border-bege-dark" value={startTime} onChange={e => setStartTime(e.target.value)} />
              </div>
              <div>
                <label className="text-xs text-cinza block mb-1">Fim (Opcional)</label>
                <input type="time" className="w-full p-2 bg-bege/30 rounded-lg border border-bege-dark" value={endTime} onChange={e => setEndTime(e.target.value)} />
              </div>
            </div>

            <div>
               <label className="text-sm text-cinza block mb-1">Motivo</label>
               <input type="text" required placeholder="Ex: Manutenção, Feriado" className="w-full p-2 bg-bege/30 rounded-lg border border-bege-dark" value={reason} onChange={e => setReason(e.target.value)} />
            </div>

            <button type="submit" className="w-full py-2 bg-cinza-dark text-white rounded-xl hover:bg-black transition-colors">Bloquear</button>
          </form>
        </div>

        {/* List */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-sakura/20">
          <h3 className="text-lg font-medium text-cinza-dark mb-4">Bloqueios Ativos</h3>
          {loading ? <Loader2 className="animate-spin mx-auto"/> : (
            <div className="space-y-3">
              {blocks.length === 0 && <p className="text-cinza text-sm text-center py-8">Nenhum bloqueio registrado.</p>}
              {blocks.map(b => (
                <div key={b.id} className="flex items-center justify-between p-4 bg-bege/20 rounded-xl border border-bege">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${b.target_type === 'ROOM' ? 'bg-menta/20 text-menta-dark' : 'bg-sakura/20 text-sakura-dark'}`}>
                        {b.target_type === 'ROOM' ? 'SALA' : 'PROF'}
                      </span>
                      <span className="font-medium text-cinza-dark">{getTargetName(b)}</span>
                    </div>
                    <p className="text-sm text-cinza">
                      {new Date(b.date).toLocaleDateString('pt-BR')} 
                      {b.start_time ? ` • ${b.start_time} - ${b.end_time}` : ' • Dia todo'}
                    </p>
                    <p className="text-xs text-cinza/70 italic mt-1">"{b.reason}"</p>
                  </div>
                  <button onClick={() => handleDelete(b.id)} className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-50 rounded-lg"><Trash2 size={18}/></button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};