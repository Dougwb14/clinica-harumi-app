import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { User, UserRole } from '../types';
import { Plus, Search, Mail, Trash2, Edit2, X, Briefcase, User as UserIcon, Loader2 } from 'lucide-react';

export const ProfessionalManager: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Only for editing existing professionals here since Creation is handled by Auth Sign Up usually, 
  // but we can add a simple "Invite" flow or just Edit/Delete. For MVP, we Edit/Delete.
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    specialty: '',
    role: UserRole.PROFESSIONAL
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .or(`role.eq.PROFESSIONAL,role.eq.ADMIN`);
      
      if (error) throw error;
      setUsers(data as any); // Cast simplified for MVP
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (user: User) => {
    setEditingUser(user);
    setFormData({
      name: user.name,
      specialty: user.specialty || '',
      role: user.role
    });
    setIsModalOpen(true);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          name: formData.name,
          specialty: formData.specialty,
          role: formData.role
        })
        .eq('id', editingUser.id);

      if (error) throw error;
      
      fetchUsers();
      setIsModalOpen(false);
    } catch (error) {
      alert('Erro ao atualizar');
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Atenção: Isso removerá o acesso deste usuário. Confirmar?')) {
      // In Supabase, deleting from Auth is usually required via Admin API, 
      // but we can delete the profile or set a flag. For MVP, we skip complex delete.
      alert('Funcionalidade restrita: Apenas administradores do banco podem deletar usuários.');
    }
  };

  const filteredUsers = users.filter(user => 
    user.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-fade-in relative">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-serif text-cinza-dark mb-2">Profissionais</h2>
          <p className="text-cinza">Gerencie a equipe da clínica.</p>
        </div>
      </header>

      <div className="bg-white p-4 rounded-2xl shadow-sm border border-sakura/20">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-cinza/50" size={20} />
          <input 
            type="text" 
            placeholder="Buscar por nome..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-bege/30 rounded-xl text-cinza-dark outline-none focus:ring-1 focus:ring-sakura"
          />
        </div>
      </div>

      {loading ? <Loader2 className="animate-spin mx-auto"/> : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredUsers.map((user) => (
            <div key={user.id} className="bg-white rounded-2xl p-6 shadow-sm border border-sakura/20 hover:shadow-md transition-all group">
              <div className="flex justify-between items-start mb-4">
                 <div className="flex gap-4">
                   <div className="w-16 h-16 rounded-full bg-bege border-2 border-bege-dark flex items-center justify-center text-cinza text-xl font-bold">
                      {user.avatar_url ? <img src={user.avatar_url} className="w-full h-full rounded-full object-cover"/> : user.name.charAt(0)}
                   </div>
                   <div>
                     <h3 className="font-serif font-semibold text-lg text-cinza-dark">{user.name}</h3>
                     <span className="inline-block px-2 py-0.5 bg-menta/20 text-menta-dark text-xs font-medium rounded-full mb-1">
                       {user.specialty || 'Geral'}
                     </span>
                     <div className="flex items-center gap-1 text-sm text-cinza">
                       <Mail size={12} />
                       {user.email}
                     </div>
                   </div>
                 </div>
                 <button onClick={() => handleOpenModal(user)} className="p-2 text-cinza hover:bg-bege hover:text-cinza-dark rounded-lg">
                    <Edit2 size={16} />
                 </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/20 backdrop-blur-sm">
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden">
            <div className="bg-gradient-to-r from-sakura/30 to-bege p-6 flex justify-between items-center">
              <h3 className="text-xl font-serif text-cinza-dark">Editar Profissional</h3>
              <button onClick={() => setIsModalOpen(false)}><X size={20}/></button>
            </div>
            <form onSubmit={handleUpdate} className="p-8 space-y-5">
              <div className="space-y-2">
                <label className="text-sm font-medium text-cinza">Nome</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full p-3 bg-bege/30 rounded-xl border border-bege-dark outline-none"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-cinza">Especialidade</label>
                <input
                  type="text"
                  value={formData.specialty}
                  onChange={(e) => setFormData({...formData, specialty: e.target.value})}
                  className="w-full p-3 bg-bege/30 rounded-xl border border-bege-dark outline-none"
                />
              </div>
              <button type="submit" className="w-full py-3 bg-menta text-white rounded-xl font-medium">Salvar</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};