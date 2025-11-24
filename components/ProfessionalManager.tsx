import React, { useState } from 'react';
import { MOCK_PROFESSIONALS } from '../constants';
import { User, UserRole } from '../types';
import { Plus, Search, Mail, Trash2, Edit2, X, Briefcase, User as UserIcon } from 'lucide-react';

export const ProfessionalManager: React.FC = () => {
  const [users, setUsers] = useState<User[]>(MOCK_PROFESSIONALS);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    specialty: '',
    role: UserRole.PROFESSIONAL
  });

  const handleOpenModal = (user?: User) => {
    if (user) {
      setEditingUser(user);
      setFormData({
        name: user.name,
        email: user.email,
        specialty: user.specialty || '',
        role: user.role
      });
    } else {
      setEditingUser(null);
      setFormData({
        name: '',
        email: '',
        specialty: '',
        role: UserRole.PROFESSIONAL
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingUser(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editingUser) {
      // Update existing
      setUsers(users.map(u => u.id === editingUser.id ? { ...u, ...formData } : u));
    } else {
      // Create new
      const newUser: User = {
        id: `u${Date.now()}`,
        name: formData.name,
        email: formData.email,
        role: formData.role,
        specialty: formData.specialty,
        avatarUrl: `https://ui-avatars.com/api/?name=${encodeURIComponent(formData.name)}&background=FADADD&color=fff`
      };
      setUsers([...users, newUser]);
    }
    handleCloseModal();
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Tem certeza que deseja remover este profissional?')) {
      setUsers(users.filter(u => u.id !== id));
    }
  };

  const filteredUsers = users.filter(user => 
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.specialty?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-fade-in relative">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-serif text-cinza-dark mb-2">Profissionais</h2>
          <p className="text-cinza">Gerencie a equipe da clínica.</p>
        </div>
        <button 
          onClick={() => handleOpenModal()}
          className="flex items-center gap-2 px-6 py-3 bg-sakura text-sakura-dark font-medium rounded-xl hover:bg-sakura-dark hover:text-white transition-all shadow-sm"
        >
          <Plus size={20} />
          Novo Profissional
        </button>
      </header>

      {/* Search Bar */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-sakura/20">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-cinza/50" size={20} />
          <input 
            type="text" 
            placeholder="Buscar por nome ou especialidade..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-bege/30 rounded-xl text-cinza-dark focus:outline-none focus:ring-1 focus:ring-sakura border border-transparent focus:border-sakura transition-all"
          />
        </div>
      </div>

      {/* Grid of Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredUsers.map((user) => (
          <div key={user.id} className="bg-white rounded-2xl p-6 shadow-sm border border-sakura/20 hover:shadow-md transition-all group">
            <div className="flex justify-between items-start mb-4">
               <div className="flex gap-4">
                 <img 
                    src={user.avatarUrl} 
                    alt={user.name} 
                    className="w-16 h-16 rounded-full object-cover border-2 border-bege-dark"
                 />
                 <div>
                   <h3 className="font-serif font-semibold text-lg text-cinza-dark">{user.name}</h3>
                   <span className="inline-block px-2 py-0.5 bg-menta/20 text-menta-dark text-xs font-medium rounded-full mb-1">
                     {user.specialty || 'Sem especialidade'}
                   </span>
                   <div className="flex items-center gap-1 text-sm text-cinza">
                     <Mail size={12} />
                     {user.email}
                   </div>
                 </div>
               </div>
               <div className="flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => handleOpenModal(user)} className="p-2 text-cinza hover:bg-bege hover:text-cinza-dark rounded-lg">
                    <Edit2 size={16} />
                  </button>
                  <button onClick={() => handleDelete(user.id)} className="p-2 text-cinza hover:bg-red-50 hover:text-red-400 rounded-lg">
                    <Trash2 size={16} />
                  </button>
               </div>
            </div>
            
            <div className="pt-4 border-t border-bege flex justify-between items-center">
               <div className="text-xs font-medium text-cinza uppercase tracking-wide flex items-center gap-2">
                 <Briefcase size={14} className="text-sakura-dark"/>
                 {user.role === UserRole.ADMIN ? 'Administrador' : 'Profissional'}
               </div>
               <button className="text-sm text-menta-dark font-medium hover:underline">
                 Ver Agenda
               </button>
            </div>
          </div>
        ))}
      </div>

      {filteredUsers.length === 0 && (
         <div className="text-center py-12 text-cinza">
            <p>Nenhum profissional encontrado.</p>
         </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/20 backdrop-blur-sm animate-fade-in">
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden animate-slide-up">
            <div className="bg-gradient-to-r from-sakura/30 to-bege p-6 flex justify-between items-center border-b border-sakura/20">
              <h3 className="text-xl font-serif text-cinza-dark">
                {editingUser ? 'Editar Profissional' : 'Novo Profissional'}
              </h3>
              <button onClick={handleCloseModal} className="p-2 hover:bg-white/50 rounded-full transition-colors text-cinza-dark">
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-8 space-y-5">
              <div className="space-y-2">
                <label className="text-sm font-medium text-cinza">Nome Completo</label>
                <div className="relative">
                  <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-cinza/40" size={18} />
                  <input
                    required
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="w-full pl-10 pr-4 py-3 bg-bege/30 rounded-xl focus:outline-none focus:ring-1 focus:ring-menta border border-bege-dark transition-all text-cinza-dark"
                    placeholder="Ex: Dra. Ana Silva"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-cinza">E-mail</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-cinza/40" size={18} />
                  <input
                    required
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    className="w-full pl-10 pr-4 py-3 bg-bege/30 rounded-xl focus:outline-none focus:ring-1 focus:ring-menta border border-bege-dark transition-all text-cinza-dark"
                    placeholder="email@clinica.com"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-cinza">Especialidade</label>
                  <input
                    type="text"
                    value={formData.specialty}
                    onChange={(e) => setFormData({...formData, specialty: e.target.value})}
                    className="w-full px-4 py-3 bg-bege/30 rounded-xl focus:outline-none focus:ring-1 focus:ring-menta border border-bege-dark transition-all text-cinza-dark"
                    placeholder="Ex: Psicologia"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-cinza">Função</label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({...formData, role: e.target.value as UserRole})}
                    className="w-full px-4 py-3 bg-bege/30 rounded-xl focus:outline-none focus:ring-1 focus:ring-menta border border-bege-dark transition-all text-cinza-dark appearance-none"
                  >
                    <option value={UserRole.PROFESSIONAL}>Profissional</option>
                    <option value={UserRole.ADMIN}>Administrador</option>
                  </select>
                </div>
              </div>

              <div className="pt-4 flex justify-end gap-3">
                <button 
                  type="button" 
                  onClick={handleCloseModal}
                  className="px-6 py-2.5 rounded-xl border border-cinza/20 text-cinza hover:bg-bege transition-colors font-medium"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-menta text-white font-medium hover:bg-menta-dark hover:shadow-lg transition-all"
                >
                  {editingUser ? 'Salvar Alterações' : 'Cadastrar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};