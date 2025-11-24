import React from 'react';
import { supabase } from '../lib/supabaseClient';
import { FileDown, FileText } from 'lucide-react';

export const Reports: React.FC = () => {

  const exportCSV = async (table: string, filename: string) => {
    try {
      const { data, error } = await supabase.from(table).select('*');
      if (error) throw error;
      if (!data || data.length === 0) {
        alert('Sem dados para exportar.');
        return;
      }

      const headers = Object.keys(data[0]).join(',');
      const rows = data.map(obj => Object.values(obj).map(v => `"${v}"`).join(',')).join('\n');
      const csvContent = "data:text/csv;charset=utf-8," + headers + '\n' + rows;
      
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `${filename}_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

    } catch (error) {
      alert('Erro ao exportar relatório. Verifique se a tabela existe.');
      console.error(error);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <header>
        <h2 className="text-3xl font-serif text-cinza-dark mb-2">Relatórios</h2>
        <p className="text-cinza">Exporte dados para análise externa.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        
        {/* Card Agendamentos */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-sakura/20 hover:shadow-md transition-shadow">
          <div className="w-12 h-12 bg-bege rounded-full flex items-center justify-center mb-4 text-cinza-dark">
            <FileText size={24} />
          </div>
          <h3 className="text-xl font-medium text-cinza-dark mb-2">Histórico de Atendimentos</h3>
          <p className="text-sm text-cinza mb-6">Todos os agendamentos de pacientes (realizados e cancelados).</p>
          <button 
            onClick={() => exportCSV('appointments', 'relatorio_atendimentos')}
            className="w-full py-2 border border-cinza text-cinza-dark rounded-xl flex items-center justify-center gap-2 hover:bg-cinza hover:text-white transition-colors"
          >
            <FileDown size={18} /> Exportar CSV
          </button>
        </div>

        {/* Card Financeiro */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-sakura/20 hover:shadow-md transition-shadow">
          <div className="w-12 h-12 bg-menta/20 rounded-full flex items-center justify-center mb-4 text-menta-dark">
            <FileText size={24} />
          </div>
          <h3 className="text-xl font-medium text-cinza-dark mb-2">Relatório Financeiro</h3>
          <p className="text-sm text-cinza mb-6">Extrato completo de contas a pagar e receber.</p>
          <button 
             onClick={() => exportCSV('financial_transactions', 'relatorio_financeiro')}
             className="w-full py-2 border border-menta text-menta-dark rounded-xl flex items-center justify-center gap-2 hover:bg-menta hover:text-white transition-colors"
          >
            <FileDown size={18} /> Exportar CSV
          </button>
        </div>

        {/* Card Salas */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-sakura/20 hover:shadow-md transition-shadow">
          <div className="w-12 h-12 bg-sakura/20 rounded-full flex items-center justify-center mb-4 text-sakura-dark">
            <FileText size={24} />
          </div>
          <h3 className="text-xl font-medium text-cinza-dark mb-2">Ocupação de Salas</h3>
          <p className="text-sm text-cinza mb-6">Histórico de reservas de salas por profissionais.</p>
          <button 
             onClick={() => exportCSV('room_bookings', 'relatorio_salas')}
             className="w-full py-2 border border-sakura text-sakura-dark rounded-xl flex items-center justify-center gap-2 hover:bg-sakura hover:text-white transition-colors"
          >
            <FileDown size={18} /> Exportar CSV
          </button>
        </div>

      </div>
    </div>
  );
};