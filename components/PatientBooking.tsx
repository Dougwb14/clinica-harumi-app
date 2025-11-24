import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../contexts/AuthContext';
import { User, UserRole, AgendaType } from '../types';
import { Calendar, Clock, CheckCircle2, User as UserIcon, Loader2, Tag, DollarSign } from 'lucide-react';
import { TIME_SLOTS } from '../constants';

export const PatientBooking: React.FC = () => {
  const { user } = useAuth();
  const [professionals, setProfessionals] = useState<User[]>([]);
  const [agendaTypes, setAgendaTypes] = useState<AgendaType[]>([]);
  const [loading, setLoading] = useState(true);
  const [bookingLoading, setBookingLoading] = useState(false);
  
  const [step, setStep] = useState(1);
  const [selectedProf, setSelectedProf] = useState<string | null>(null);
  const [selectedAgendaType, setSelectedAgendaType] = useState<AgendaType | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    Promise.all([fetchProfessionals(), fetchAgendaTypes()]).then(() => setLoading(false));
  }, []);

  const fetchProfessionals = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'PROFESSIONAL');
        
      if (error) throw error;
      
      const mappedProfs: User[] = data.map((p: any) => ({
        id: p.id,
        name: p.name,
        email: p.email,
        role: UserRole.PROFESSIONAL,
        specialty: p.specialty,
        avatar_url: p.avatar_url
      }));
      
      setProfessionals(mappedProfs);
    } catch (error) {
      console.error('Erro ao buscar profissionais:', error);
    }
  };

  const fetchAgendaTypes = async () => {
    try {
      const { data } = await supabase.from('agenda_types').select('*').order('name');
      if (data) setAgendaTypes(data as any);
    } catch (error) {
      console.error(error);
    }
  };

  const handleBooking = async () => {
    if (!user || !selectedProf || !selectedDate || !selectedTime || !selectedAgendaType) return;
    
    setBookingLoading(true);
    try {
      const { error } = await supabase
        .from('appointments')
        .insert({
          patient_id: user.id,
          professional_id: selectedProf,
          agenda_type_id: selectedAgendaType.id,
          date: selectedDate,
          start_time: selectedTime,
          status: 'scheduled'
        });

      if (error) throw error;
      setSuccess(true);
    } catch (err) {
      alert('Erro ao agendar. Tente novamente.');
      console.error(err);
    } finally {
      setBookingLoading(false);
    }
  };

  if (success) {
    return (
      <div className="flex flex-col items-center justify-center p-12 bg-white rounded-2xl shadow-sm border border-sakura/20 animate-fade-in">
        <div className="w-16 h-16 bg-menta rounded-full flex items-center justify-center mb-6 text-white">
          <CheckCircle2 size={32} />
        </div>
        <h2 className="text-2xl font-serif text-cinza-dark mb-2">Agendamento Confirmado!</h2>
        <p className="text-cinza text-center mb-6">Sua consulta foi agendada com sucesso. Você pode visualizar os detalhes na sua agenda.</p>
        <button 
          onClick={() => {
            setSuccess(false);
            setStep(1);
            setSelectedProf(null);
            setSelectedAgendaType(null);
            setSelectedDate('');
            setSelectedTime(null);
          }}
          className="px-6 py-2 bg-sakura text-sakura-dark rounded-xl font-medium hover:bg-sakura-dark hover:text-white transition-colors"
        >
          Novo Agendamento
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <header>
        <h2 className="text-3xl font-serif text-cinza-dark mb-2">Agendar Consulta</h2>
        <p className="text-cinza">Siga os passos para marcar seu atendimento.</p>
      </header>

      {/* Steps Indicator */}
      <div className="flex items-center gap-4 mb-8 text-sm font-medium overflow-x-auto pb-2">
        <div className={`flex items-center gap-2 ${step >= 1 ? 'text-menta-dark' : 'text-cinza/50'}`}>
          <div className={`w-6 h-6 rounded-full flex items-center justify-center border ${step >= 1 ? 'bg-menta text-white border-menta' : 'border-current'}`}>1</div>
          Profissional
        </div>
        <div className="w-8 h-px bg-bege-dark shrink-0"></div>
        
        <div className={`flex items-center gap-2 ${step >= 2 ? 'text-menta-dark' : 'text-cinza/50'}`}>
          <div className={`w-6 h-6 rounded-full flex items-center justify-center border ${step >= 2 ? 'bg-menta text-white border-menta' : 'border-current'}`}>2</div>
          Serviço
        </div>
        <div className="w-8 h-px bg-bege-dark shrink-0"></div>

        <div className={`flex items-center gap-2 ${step >= 3 ? 'text-menta-dark' : 'text-cinza/50'}`}>
          <div className={`w-6 h-6 rounded-full flex items-center justify-center border ${step >= 3 ? 'bg-menta text-white border-menta' : 'border-current'}`}>3</div>
          Data e Hora
        </div>
      </div>

      {step === 1 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-slide-up">
          {loading ? (
             <div className="col-span-3 text-center py-12 text-cinza"><Loader2 className="animate-spin mx-auto"/> Carregando profissionais...</div>
          ) : professionals.map((prof) => (
            <div 
              key={prof.id}
              onClick={() => {
                setSelectedProf(prof.id);
                setStep(2);
              }}
              className="bg-white p-6 rounded-2xl shadow-sm border border-sakura/20 hover:border-menta hover:shadow-md cursor-pointer transition-all group"
            >
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-bege flex items-center justify-center text-cinza overflow-hidden">
                  {prof.avatar_url ? (
                    <img src={prof.avatar_url} alt={prof.name} className="w-full h-full object-cover" />
                  ) : (
                    <UserIcon size={32} />
                  )}
                </div>
                <div>
                  <h3 className="font-serif font-semibold text-lg text-cinza-dark group-hover:text-menta-dark transition-colors">{prof.name}</h3>
                  <span className="text-sm text-cinza">{prof.specialty || 'Clínico Geral'}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {step === 2 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-slide-up">
          <div className="col-span-full mb-2">
            <h3 className="text-xl font-medium text-cinza-dark">Qual tipo de atendimento você precisa?</h3>
          </div>
          {agendaTypes.map((type) => (
            <div 
              key={type.id}
              onClick={() => {
                setSelectedAgendaType(type);
                setStep(3);
              }}
              className="bg-white rounded-2xl p-6 shadow-sm border border-sakura/20 hover:border-menta hover:shadow-md cursor-pointer transition-all relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-2 h-full" style={{ backgroundColor: type.color }}></div>
              <div className="pl-4">
                <h3 className="font-serif font-bold text-lg text-cinza-dark mb-2">{type.name}</h3>
                <div className="space-y-1 text-sm text-cinza">
                   <div className="flex items-center gap-2">
                     <Clock size={14}/>
                     <span>Duração: 30 min</span>
                   </div>
                   <div className="flex items-center gap-2">
                     <DollarSign size={14}/>
                     <span>Valor: R$ {type.price.toFixed(2)}</span>
                   </div>
                </div>
              </div>
            </div>
          ))}
           <div className="col-span-full pt-4">
             <button onClick={() => setStep(1)} className="text-cinza hover:text-cinza-dark font-medium underline">
               Voltar para Profissionais
             </button>
           </div>
        </div>
      )}

      {step === 3 && (
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-sakura/20 animate-slide-up">
           <div className="flex flex-col md:flex-row gap-8">
             <div className="flex-1">
               <label className="block text-sm font-medium text-cinza mb-2">Selecione a Data</label>
               <input 
                 type="date" 
                 className="w-full p-4 bg-bege/30 rounded-xl border border-bege-dark text-cinza-dark outline-none focus:border-menta"
                 min={new Date().toISOString().split('T')[0]}
                 onChange={(e) => setSelectedDate(e.target.value)}
               />
             </div>
             
             {selectedDate && (
               <div className="flex-1 animate-fade-in">
                 <label className="block text-sm font-medium text-cinza mb-2">Horários Disponíveis</label>
                 <div className="grid grid-cols-3 gap-3">
                   {TIME_SLOTS.map(time => (
                     <button
                        key={time}
                        onClick={() => setSelectedTime(time)}
                        className={`py-2 px-4 rounded-lg text-sm font-medium transition-colors ${
                          selectedTime === time 
                            ? 'bg-menta text-white shadow-md' 
                            : 'bg-bege/30 text-cinza hover:bg-bege hover:text-cinza-dark'
                        }`}
                     >
                       {time}
                     </button>
                   ))}
                 </div>
               </div>
             )}
           </div>

           <div className="flex justify-between mt-8 pt-6 border-t border-bege">
             <button onClick={() => setStep(2)} className="text-cinza hover:text-cinza-dark font-medium">
               Voltar
             </button>
             <button 
               onClick={handleBooking}
               disabled={!selectedDate || !selectedTime || bookingLoading}
               className={`flex items-center gap-2 px-8 py-3 rounded-xl font-medium transition-all ${
                 !selectedDate || !selectedTime 
                   ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                   : 'bg-sakura text-sakura-dark hover:bg-sakura-dark hover:text-white shadow-md'
               }`}
             >
               {bookingLoading ? <Loader2 className="animate-spin" size={20}/> : <CheckCircle2 size={20} />}
               Confirmar Agendamento
             </button>
           </div>
        </div>
      )}
    </div>
  );
};