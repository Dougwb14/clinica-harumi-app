import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Patient } from '../types';
import { Plus, Search, Edit2, Trash2, X, User, Phone, MapPin, FileText, Calendar, Loader2 } from 'lucide-react';

export const PatientManager: React.FC = () => {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const initialFormState = {
    name: '',
    email: '',
    cpf: '',
    rg: '',
    cellphone: '',
    birth_date: '',
    address: '',
    marital_status: 'Solteiro(a)',
    profession: '',
    religion: '',
    education_level: 'Ensino Médio Completo'
  };

  const [formData, setFormData] = useState(initialFormState);

  useEffect(() => {
    fetchPatients();
  }, []);

  const fetchPatients = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.from('patients').select('*').order('name');
      if (error) throw error;
      setPatients(data as any);
    } catch (error) {
      console.error('Erro ao buscar pacientes:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (patient?: Patient) => {
    if (patient) {
      setEditingId(patient.id);
      setFormData({
        name: patient.name,
        email: patient.email || '',
        cpf: patient.cpf || '',
        rg: patient.rg || '',
        cellphone: patient.phone || '',
        birth_date: patient.birth_date || '',
        address: patient.address || '',
        marital_status: patient.marital_status || 'Solteiro(a)',
        profession: patient.profession || '',
        religion: patient.religion || '',
        education_level: patient.education_level || 'Ensino Médio Completo'
      });
    } else {
      setEditingId(null);
      setFormData(initialFormState);
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      name: formData.name,
      email: formData.email,
      cpf: formData.cpf,
      rg: formData.rg,
      phone: formData.cellphone,
      birth_date: formData.birth_date || null,
      address: formData.address,
      marital_status: formData.marital_status,
      profession: formData.profession,
      religion: formData.religion,
      education_level: formData.education_level
    };

    try {
      if (editingId) {
        await supabase.from('patients').update(payload).eq('id', editingId);
      } else {
        await supabase.from('patients').insert(payload);
      }
      setIsModalOpen(false);
      fetchPatients();
    } catch (error) {
      alert('Erro ao salvar paciente. Verifique os dados.');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja remover este paciente?')) return;
    try {
      await supabase.from('patients').delete().eq('id', id);
      fetchPatients();
    } catch (error) {
      alert('Erro ao excluir.');
    }
  };

  const filteredPatients = patients.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.cpf?.includes(searchTerm)
  );

  return (
    <div className="space-y-6 animate-fade-in">
      <header className="flex flex-col md:flex-row justify-between md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-serif text-cinza-dark mb-2">Cadastro de Pacientes</h2>
          <p className="text-cinza">Gerencie o prontuário e dados cadastrais.</p>
        </div>
        <button 
          onClick={() => handleOpenModal()}
          className="bg-cinza-dark text-white px-6 py-3 rounded-xl flex items-center gap-2 hover:bg-black transition-colors shadow-lg"
        >
          <Plus size={20} /> Novo Paciente
        </button>
      </header>

      {/* Search Bar */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-sakura/20">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-cinza/50" size={20} />
          <input 
            type="text" 
            placeholder="Buscar por nome ou CPF..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-bege/30 rounded-xl text-cinza-dark outline-none focus:ring-1 focus:ring-sakura"
          />
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center p-12"><Loader2 className="animate-spin text-sakura" size={40}/></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredPatients.map(patient => (
            <div key={patient.id} className="bg-white p-6 rounded-2xl shadow-sm border border-sakura/20 hover:shadow-md transition-all group">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-menta/20 rounded-full flex items-center justify-center text-menta-dark font-serif font-bold text-lg">
                    {patient.name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="font-bold text-cinza-dark">{patient.name}</h3>
                    <p className="text-xs text-cinza">{patient.email || 'Sem e-mail'}</p>
                  </div>
                </div>
                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => handleOpenModal(patient)} className="text-cinza hover:text-menta-dark p-1"><Edit2 size={16}/></button>
                  <button onClick={() => handleDelete(patient.id)} className="text-cinza hover:text-red-400 p-1"><Trash2 size={16}/></button>
                </div>
              </div>
              
              <div className="space-y-2 text-sm text-cinza border-t border-bege pt-4">
                <div className="flex items-center gap-2">
                  <User size={14} className="text-sakura-dark"/>
                  <span>CPF: {patient.cpf || '-'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone size={14} className="text-sakura-dark"/>
                  <span>{patient.phone || '-'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin size={14} className="text-sakura-dark"/>
                  <span className="truncate">{patient.address || 'Endereço não informado'}</span>
                </div>
              </div>
            </div>
          ))}
          {filteredPatients.length === 0 && (
            <div className="col-span-full p-12 text-center text-cinza bg-white/50 border border-dashed border-sakura/30 rounded-2xl">
              Nenhum paciente encontrado.
            </div>
          )}
        </div>
      )}

      {/* Modal Cadastro/Edição */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/20 backdrop-blur-sm animate-fade-in">
          <div className="bg-white w-full max-w-4xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="bg-bege p-6 flex justify-between items-center border-b border-sakura/20">
              <h3 className="font-serif text-xl text-cinza-dark flex items-center gap-2">
                <User className="text-sakura-dark"/> 
                {editingId ? 'Editar Paciente' : 'Novo Paciente'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-cinza hover:text-red-400"><X size={24}/></button>
            </div>

            <form onSubmit={handleSubmit} className="overflow-y-auto p-8 custom-scrollbar">
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Grupo 1: Dados Pessoais */}
                <div className="col-span-full mb-2">
                  <h4 className="text-sm font-bold text-menta-dark uppercase tracking-wide border-b border-bege pb-1">Dados Pessoais</h4>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-cinza uppercase mb-1">Nome Completo</label>
                  <input required type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full p-3 bg-bege/30 rounded-xl border border-bege-dark outline-none focus:border-sakura"/>
                </div>

                <div>
                  <label className="block text-xs font-bold text-cinza uppercase mb-1">CPF</label>
                  <input type="text" placeholder="000.000.000-00" value={formData.cpf} onChange={e => setFormData({...formData, cpf: e.target.value})} className="w-full p-3 bg-bege/30 rounded-xl border border-bege-dark outline-none focus:border-sakura"/>
                </div>

                <div>
                  <label className="block text-xs font-bold text-cinza uppercase mb-1">RG</label>
                  <input type="text" value={formData.rg} onChange={e => setFormData({...formData, rg: e.target.value})} className="w-full p-3 bg-bege/30 rounded-xl border border-bege-dark outline-none focus:border-sakura"/>
                </div>

                <div>
                   <label className="block text-xs font-bold text-cinza uppercase mb-1">Data de Nascimento</label>
                   <input type="date" value={formData.birth_date} onChange={e => setFormData({...formData, birth_date: e.target.value})} className="w-full p-3 bg-bege/30 rounded-xl border border-bege-dark outline-none focus:border-sakura"/>
                </div>

                <div>
                  <label className="block text-xs font-bold text-cinza uppercase mb-1">Estado Civil</label>
                  <select value={formData.marital_status} onChange={e => setFormData({...formData, marital_status: e.target.value})} className="w-full p-3 bg-bege/30 rounded-xl border border-bege-dark outline-none focus:border-sakura">
                    <option>Solteiro(a)</option>
                    <option>Casado(a)</option>
                    <option>Divorciado(a)</option>
                    <option>Viúvo(a)</option>
                    <option>União Estável</option>
                  </select>
                </div>

                {/* Grupo 2: Contato e Endereço */}
                <div className="col-span-full mt-4 mb-2">
                  <h4 className="text-sm font-bold text-menta-dark uppercase tracking-wide border-b border-bege pb-1">Contato</h4>
                </div>

                <div>
                  <label className="block text-xs font-bold text-cinza uppercase mb-1">Celular/WhatsApp</label>
                  <input type="text" value={formData.cellphone} onChange={e => setFormData({...formData, cellphone: e.target.value})} className="w-full p-3 bg-bege/30 rounded-xl border border-bege-dark outline-none focus:border-sakura"/>
                </div>

                <div>
                  <label className="block text-xs font-bold text-cinza uppercase mb-1">E-mail</label>
                  <input type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full p-3 bg-bege/30 rounded-xl border border-bege-dark outline-none focus:border-sakura"/>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-cinza uppercase mb-1">Endereço Completo</label>
                  <input type="text" value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} className="w-full p-3 bg-bege/30 rounded-xl border border-bege-dark outline-none focus:border-sakura"/>
                </div>

                {/* Grupo 3: Social e Escolaridade */}
                <div className="col-span-full mt-4 mb-2">
                  <h4 className="text-sm font-bold text-menta-dark uppercase tracking-wide border-b border-bege pb-1">Perfil Social</h4>
                </div>

                <div>
                  <label className="block text-xs font-bold text-cinza uppercase mb-1">Profissão</label>
                  <input type="text" value={formData.profession} onChange={e => setFormData({...formData, profession: e.target.value})} className="w-full p-3 bg-bege/30 rounded-xl border border-bege-dark outline-none focus:border-sakura"/>
                </div>

                <div>
                  <label className="block text-xs font-bold text-cinza uppercase mb-1">Religião</label>
                  <input type="text" value={formData.religion} onChange={e => setFormData({...formData, religion: e.target.value})} className="w-full p-3 bg-bege/30 rounded-xl border border-bege-dark outline-none focus:border-sakura"/>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-cinza uppercase mb-1">Escolaridade</label>
                  <select value={formData.education_level} onChange={e => setFormData({...formData, education_level: e.target.value})} className="w-full p-3 bg-bege/30 rounded-xl border border-bege-dark outline-none focus:border-sakura">
                    <option>Fundamental Incompleto</option>
                    <option>Fundamental Completo</option>
                    <option>Ensino Médio Incompleto</option>
                    <option>Ensino Médio Completo</option>
                    <option>Ensino Superior Incompleto</option>
                    <option>Ensino Superior Completo</option>
                    <option>Pós-graduação</option>
                  </select>
                </div>

              </div>

              <div className="mt-8 pt-4 border-t border-bege flex gap-4">
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-3 border border-bege-dark text-cinza rounded-xl hover:bg-bege transition-colors font-medium"
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  className="flex-1 py-3 bg-cinza-dark text-white rounded-xl hover:bg-black transition-colors font-medium shadow-md"
                >
                  Salvar Paciente
                </button>
              </div>

            </form>
          </div>
        </div>
      )}
    </div>
  );
};