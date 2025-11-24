import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { FinancialTransaction } from '../types';
import { Plus, ArrowUpCircle, ArrowDownCircle, Trash2, CheckCircle2, Loader2, DollarSign } from 'lucide-react';

export const FinancialManager: React.FC = () => {
  const [transactions, setTransactions] = useState<FinancialTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    description: '',
    amount: '',
    type: 'EXPENSE',
    category: '',
    due_date: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('financial_transactions')
        .select('*')
        .order('due_date', { ascending: false });
      
      if (error) throw error;
      setTransactions(data as any);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { error } = await supabase.from('financial_transactions').insert({
        description: formData.description,
        amount: parseFloat(formData.amount),
        type: formData.type,
        category: formData.category,
        due_date: formData.due_date,
        status: 'PENDING'
      });

      if (error) throw error;
      setShowForm(false);
      setFormData({ description: '', amount: '', type: 'EXPENSE', category: '', due_date: new Date().toISOString().split('T')[0] });
      fetchTransactions();
    } catch (error) {
      alert('Erro ao adicionar transação');
    }
  };

  const handlePay = async (id: string) => {
    try {
      await supabase.from('financial_transactions').update({ status: 'PAID' }).eq('id', id);
      fetchTransactions();
    } catch (error) { console.error(error); }
  };

  const handleDelete = async (id: string) => {
    if(!confirm('Deletar transação?')) return;
    try {
      await supabase.from('financial_transactions').delete().eq('id', id);
      fetchTransactions();
    } catch (error) { console.error(error); }
  };

  const income = transactions.filter(t => t.type === 'INCOME').reduce((acc, curr) => acc + curr.amount, 0);
  const expense = transactions.filter(t => t.type === 'EXPENSE').reduce((acc, curr) => acc + curr.amount, 0);
  const balance = income - expense;

  return (
    <div className="space-y-6 animate-fade-in">
      <header className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-serif text-cinza-dark mb-2">Financeiro</h2>
          <p className="text-cinza">Gestão de contas a pagar e receber.</p>
        </div>
        <button 
          onClick={() => setShowForm(!showForm)}
          className="bg-cinza-dark text-white px-4 py-2 rounded-xl flex items-center gap-2 hover:bg-black transition-colors"
        >
          <Plus size={20} /> Nova Transação
        </button>
      </header>

      {/* Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-sakura/20 flex items-center gap-4">
          <div className="p-3 bg-menta/20 text-menta-dark rounded-full"><ArrowUpCircle size={24}/></div>
          <div>
            <p className="text-sm text-cinza">Entradas</p>
            <h3 className="text-2xl font-bold text-menta-dark">R$ {income.toFixed(2)}</h3>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-sakura/20 flex items-center gap-4">
          <div className="p-3 bg-red-100 text-red-500 rounded-full"><ArrowDownCircle size={24}/></div>
          <div>
            <p className="text-sm text-cinza">Saídas</p>
            <h3 className="text-2xl font-bold text-red-500">R$ {expense.toFixed(2)}</h3>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-sakura/20 flex items-center gap-4">
          <div className="p-3 bg-bege-dark text-cinza-dark rounded-full"><DollarSign size={24}/></div>
          <div>
            <p className="text-sm text-cinza">Balanço</p>
            <h3 className={`text-2xl font-bold ${balance >= 0 ? 'text-cinza-dark' : 'text-red-500'}`}>
              R$ {balance.toFixed(2)}
            </h3>
          </div>
        </div>
      </div>

      {showForm && (
        <form onSubmit={handleAdd} className="bg-white p-6 rounded-2xl shadow-md border border-sakura/30 animate-slide-up grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4 items-end">
          <div className="lg:col-span-2">
            <label className="text-xs font-bold text-cinza uppercase">Descrição</label>
            <input required type="text" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="w-full p-2 bg-bege/30 rounded-lg border border-bege-dark" />
          </div>
          <div className="lg:col-span-1">
             <label className="text-xs font-bold text-cinza uppercase">Valor (R$)</label>
             <input required type="number" step="0.01" value={formData.amount} onChange={e => setFormData({...formData, amount: e.target.value})} className="w-full p-2 bg-bege/30 rounded-lg border border-bege-dark" />
          </div>
          <div className="lg:col-span-1">
            <label className="text-xs font-bold text-cinza uppercase">Tipo</label>
            <select value={formData.type} onChange={e => setFormData({...formData, type: e.target.value as any})} className="w-full p-2 bg-bege/30 rounded-lg border border-bege-dark">
              <option value="INCOME">Receita</option>
              <option value="EXPENSE">Despesa</option>
            </select>
          </div>
          <div className="lg:col-span-1">
             <label className="text-xs font-bold text-cinza uppercase">Vencimento</label>
             <input required type="date" value={formData.due_date} onChange={e => setFormData({...formData, due_date: e.target.value})} className="w-full p-2 bg-bege/30 rounded-lg border border-bege-dark" />
          </div>
          <button type="submit" className="bg-menta text-white p-2 rounded-lg font-medium hover:bg-menta-dark transition-colors h-10">Salvar</button>
        </form>
      )}

      {/* List */}
      <div className="bg-white rounded-2xl shadow-sm border border-sakura/20 overflow-hidden">
        {loading ? <div className="p-8 flex justify-center"><Loader2 className="animate-spin text-sakura"/></div> : (
          <table className="w-full text-left">
            <thead className="bg-bege/50 border-b border-bege-dark">
              <tr>
                <th className="p-4 text-cinza text-xs font-bold uppercase">Data</th>
                <th className="p-4 text-cinza text-xs font-bold uppercase">Descrição</th>
                <th className="p-4 text-cinza text-xs font-bold uppercase">Categoria</th>
                <th className="p-4 text-cinza text-xs font-bold uppercase">Valor</th>
                <th className="p-4 text-cinza text-xs font-bold uppercase">Status</th>
                <th className="p-4 text-right"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-bege">
              {transactions.map(t => (
                <tr key={t.id} className="hover:bg-bege/20">
                  <td className="p-4 text-sm text-cinza-dark">{new Date(t.due_date).toLocaleDateString('pt-BR')}</td>
                  <td className="p-4 font-medium text-cinza-dark">{t.description}</td>
                  <td className="p-4 text-sm text-cinza">{t.category || '-'}</td>
                  <td className={`p-4 font-bold ${t.type === 'INCOME' ? 'text-menta-dark' : 'text-red-400'}`}>
                    {t.type === 'INCOME' ? '+' : '-'} R$ {t.amount.toFixed(2)}
                  </td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-bold ${t.status === 'PAID' ? 'bg-menta/20 text-menta-dark' : 'bg-yellow-100 text-yellow-600'}`}>
                      {t.status === 'PAID' ? 'Pago' : 'Pendente'}
                    </span>
                  </td>
                  <td className="p-4 text-right flex justify-end gap-2">
                    {t.status === 'PENDING' && (
                      <button onClick={() => handlePay(t.id)} className="text-menta hover:text-menta-dark" title="Marcar como Pago"><CheckCircle2 size={18}/></button>
                    )}
                    <button onClick={() => handleDelete(t.id)} className="text-gray-400 hover:text-red-400"><Trash2 size={18}/></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};