import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { AgendaType } from '../types';
import { Plus, Trash2, Edit2, X, Tag, DollarSign, Palette, Loader2, Clock } from 'lucide-react';

export const AgendaTypeManager: React.FC = () => {
  const [types, setTypes] = useState<AgendaType[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    price: '',
    color: '#B5DAD7'
  });

  useEffect(() => {
    fetchTypes();
  }, []);

  const fetchTypes = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.from('agenda_types').select('*').order('name');
      if (error) throw error;
      setTypes(data as any);
    } catch (error) {
      console.error('Erro ao buscar tipos:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (type?: AgendaType) => {
    if (type) {
      setEditingId(type.id);
      setFormData({
        name: type.name,
        price: type.price.toString(),
        color: type.color
      });
    } else {
      setEditingId(null);
      setFormData({
        name: '',
        price: '',
        color: '#B5DAD7'
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // FORÇA LÓGICA DE 30 MINUTOS (1 slot)
    const payload = {
      name: formData.name,
      price: parseFloat(formData.price || '0'),
      duration_slots: 1, 
      color: formData.color
    };

    try {
      if (editingId) {
        await supabase.from('agenda_types').update(payload).eq('id', editingId);
      } else {
        await supabase.from('agenda_types').insert(payload);
      }
      setIsModalOpen(false);
      fetchTypes();
    } catch (error) {
      alert('Erro ao salvar.');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Excluir este tipo de agenda?')) return;
    try {
      await supabase.from('agenda_types').delete().eq('id', id);
      fetchTypes();
    } catch (error) {
      alert('Erro ao deletar.');
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <header className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-serif text-cinza-dark mb-2">Tipos de Agenda</h2>
          <p className="text-cinza">Defina os serviços (Duração padrão: 30 min).</p>
        </div>
        <button 
          onClick={() => handleOpenModal()}
          className="bg-cinza-dark text-white px-4 py-2 rounded-xl flex items-center gap-2 hover:bg-black transition-colors shadow-lg"
        >
          <Plus size={20} /> Novo Tipo
        </button>
      </header>

      {loading ? (
        <div className="flex justify-center p-12"><Loader2 className="animate-spin text-sakura" size={32}/></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {types.map((type) => (
            <div key={type.id} className="bg-white rounded-2xl p-6 shadow-sm border border-sakura/20 hover:shadow-md transition-all relative overflow-hidden group">
              <div className="absolute top-0 left-0 w-2 h-full" style={{ backgroundColor: type.color }}></div>
              
              <div className="pl-4">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-serif font-bold text-lg text-cinza-dark">{type.name}</h3>
                  <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => handleOpenModal(type)} className="text-cinza hover:text-menta-dark"><Edit2 size={16}/></button>
                    <button onClick={() => handleDelete(type.id)} className="text-cinza hover:text-red-400"><Trash2 size={16}/></button>
                  </div>
                </div>

                <div className="space-y-2 mt-4">
                   <div className="flex items-center gap-2 text-sm text-cinza">
                     <div className="w-6 h-6 rounded-full bg-bege flex items-center justify-center text-cinza-dark"><Clock size={14}/></div>
                     <span className="font-medium">30 min</span>
                   </div>
                   <div className="flex items-center gap-2 text-sm text-cinza">
                     <div className="w-6 h-6 rounded-full bg-bege flex items-center justify-center text-cinza-dark"><DollarSign size={14}/></div>
                     <span className="font-medium">R$ {type.price.toFixed(2)}</span>
                   </div>
                   <div className="flex items-center gap-2 text-sm text-cinza">
                     <div className="w-6 h-6 rounded-full bg-bege flex items-center justify-center text-cinza-dark"><Palette size={14}/></div>
                     <div className="flex items-center gap-2">
                        <span className="w-4 h-4 rounded-full border border-gray-200" style={{backgroundColor: type.color}}></span>
                        <span className="text-xs uppercase">{type.color}</span>
                     </div>
                   </div>
                </div>
              </div>
            </div>
          ))}
          {types.length === 0 && (
            <div className="col-span-full p-12 bg-white/50 border border-dashed border-sakura/30 rounded-2xl text-center text-cinza">
              Nenhum tipo de agenda cadastrado.
            </div>
          )}
        </div>
      )}

      {/* MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/20 backdrop-blur-sm animate-fade-in">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden">
            <div className="bg-bege p-4 flex justify-between items-center border-b border-sakura/20">
              <h3 className="font-medium text-cinza-dark">Tipos de Agenda</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-cinza hover:text-red-400"><X size={20}/></button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              <div className="space-y-1">
                <label className="text-xs font-bold text-cinza uppercase">Tipo</label>
                <input 
                  type="text" 
                  required
                  placeholder="Ex: Consulta Inicial"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full p-3 bg-bege/30 rounded-lg border border-bege-dark outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-cinza uppercase">Valor (R$)</label>
                <input 
                  type="number" 
                  step="0.01"
                  placeholder="0,00"
                  value={formData.price}
                  onChange={(e) => setFormData({...formData, price: e.target.value})}
                  className="w-full p-3 bg-bege/30 rounded-lg border border-bege-dark outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-cinza uppercase">Cor de Identificação</label>
                <div className="flex items-center gap-2 p-2 bg-bege/30 rounded-lg border border-bege-dark">
                  <input 
                    type="color" 
                    value={formData.color}
                    onChange={(e) => setFormData({...formData, color: e.target.value})}
                    className="h-8 w-full cursor-pointer bg-transparent border-none"
                  />
                </div>
              </div>

              <div className="pt-4 flex gap-3">
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-2 border border-bege-dark text-cinza rounded-xl hover:bg-bege"
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  className="flex-1 py-2 bg-menta text-white font-medium rounded-xl hover:bg-menta-dark"
                >
                  Salvar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};