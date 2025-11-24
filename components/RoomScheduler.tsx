import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../contexts/AuthContext';
import { MOCK_ROOMS, TIME_SLOTS } from '../constants';
import { Patient } from '../types';
import { Calendar, Clock, CheckCircle2, Users as UsersIcon, Loader2, AlertCircle, User as UserIcon } from 'lucide-react';

export const RoomScheduler: React.FC = () => {
  const { user } = useAuth();
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [selectedRoom, setSelectedRoom] = useState<string | null>(null);
  const [selectedSlots, setSelectedSlots] = useState<string[]>([]);
  const [occupiedSlots, setOccupiedSlots] = useState<string[]>([]);
  const [blockedSlots, setBlockedSlots] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState(false);
  
  // Patient Selection Logic
  const [patients, setPatients] = useState<Patient[]>([]);
  const [selectedPatientId, setSelectedPatientId] = useState<string>('');
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  useEffect(() => {
    if (selectedRoom && selectedDate) {
      fetchSlots();
    }
  }, [selectedRoom, selectedDate]);

  useEffect(() => {
    // Fetch patients for dropdown
    const fetchPatients = async () => {
      const { data } = await supabase.from('patients').select('id, name').order('name');
      if (data) setPatients(data as any);
    };
    fetchPatients();
  }, []);

  const fetchSlots = async () => {
    setLoading(true);
    setOccupiedSlots([]);
    setBlockedSlots([]);
    setSelectedSlots([]);
    
    try {
      const { data: bookings } = await supabase
        .from('room_bookings')
        .select('start_time')
        .eq('room_id', selectedRoom)
        .eq('date', selectedDate);

      if (bookings) {
        setOccupiedSlots(bookings.map((b: any) => b.start_time));
      }

      const { data: blocks } = await supabase
        .from('schedule_blocks')
        .select('*')
        .eq('target_type', 'ROOM')
        .eq('target_id', selectedRoom)
        .eq('date', selectedDate);
      
      let blockedTimes: string[] = [];
      if (blocks) {
        blocks.forEach((block: any) => {
          if (!block.start_time) {
            blockedTimes = [...TIME_SLOTS];
          } else {
             blockedTimes.push(block.start_time);
          }
        });
      }
      setBlockedSlots(blockedTimes);

    } catch (error) {
      console.error('Error fetching slots:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleSlot = (time: string) => {
    if (selectedSlots.includes(time)) {
      setSelectedSlots(selectedSlots.filter(t => t !== time));
    } else {
      setSelectedSlots([...selectedSlots, time]);
    }
  };

  const initiateBooking = () => {
    if (selectedSlots.length === 0) return;
    setShowConfirmModal(true);
  };

  const confirmBooking = async () => {
    if (!user || !selectedRoom) return;
    setProcessing(true);

    try {
      const bookingsToInsert = selectedSlots.map(time => ({
        room_id: selectedRoom,
        professional_id: user.id,
        patient_id: selectedPatientId || null, // Link Patient
        date: selectedDate,
        start_time: time,
        end_time: calculateEndTime(time)
      }));

      const { error } = await supabase
        .from('room_bookings')
        .insert(bookingsToInsert);

      if (error) throw error;

      alert('Reserva confirmada com sucesso!');
      setShowConfirmModal(false);
      setSelectedPatientId('');
      fetchSlots(); 
    } catch (error: any) {
      alert('Erro ao reservar: ' + error.message);
    } finally {
      setProcessing(false);
    }
  };

  const calculateEndTime = (startTime: string) => {
    const [hour, min] = startTime.split(':').map(Number);
    const endHour = hour + 1;
    return `${endHour.toString().padStart(2, '0')}:${min.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-6 animate-fade-in relative">
      <header className="flex flex-col md:flex-row justify-between md:items-end gap-4">
        <div>
          <h2 className="text-3xl font-serif text-cinza-dark mb-2">Aluguel de Salas</h2>
          <p className="text-cinza">Reserve um espaço para seus atendimentos.</p>
        </div>
        <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-xl shadow-sm border border-sakura/30 text-cinza-dark self-start md:self-auto">
          <Calendar size={18} className="text-sakura-dark" />
          <input 
            type="date" 
            value={selectedDate} 
            onChange={(e) => setSelectedDate(e.target.value)}
            className="bg-transparent border-none outline-none text-sm font-medium"
            min={new Date().toISOString().split('T')[0]}
          />
        </div>
      </header>

      {/* Room Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {MOCK_ROOMS.map((room) => (
          <div 
            key={room.id}
            onClick={() => setSelectedRoom(room.id)}
            className={`
              relative overflow-hidden rounded-2xl cursor-pointer transition-all duration-300 border
              ${selectedRoom === room.id 
                ? 'border-menta ring-2 ring-menta/30 shadow-lg transform -translate-y-1' 
                : 'border-white bg-white hover:border-sakura/50 hover:shadow-md'}
            `}
          >
            <div className="h-32 bg-gray-200 w-full relative">
               <img src={room.imageUrl} alt={room.name} className="w-full h-full object-cover" />
               <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
               <h3 className="absolute bottom-3 left-4 text-white font-medium text-lg">{room.name}</h3>
            </div>
            <div className="p-4">
              <div className="flex justify-between items-center text-sm text-cinza mb-2">
                <span>{room.type}</span>
                <span className="flex items-center gap-1"><UsersIcon size={14}/> {room.capacity}</span>
              </div>
              {selectedRoom === room.id && (
                <div className="absolute top-2 right-2 bg-menta text-white p-1 rounded-full">
                  <CheckCircle2 size={16} />
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Scheduler Grid */}
      {selectedRoom ? (
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-sakura/20 animate-slide-up">
          <div className="flex justify-between items-center mb-6">
             <h3 className="text-lg font-medium text-cinza-dark flex items-center gap-2">
               <Clock className="text-menta" size={20} />
               Horários Disponíveis <span className="text-sm font-normal text-cinza">({new Date(selectedDate).toLocaleDateString('pt-BR')})</span>
             </h3>
             <div className="flex items-center gap-4 text-sm flex-wrap">
                <span className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-red-200"></div> Bloqueado</span>
                <span className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-bege-dark"></div> Ocupado</span>
                <span className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-white border border-gray-200"></div> Livre</span>
             </div>
          </div>

          {loading ? (
            <div className="py-12 flex justify-center"><Loader2 className="animate-spin text-sakura"/></div>
          ) : (
            <div className="grid grid-cols-3 md:grid-cols-6 lg:grid-cols-12 gap-3">
              {TIME_SLOTS.map((time, idx) => {
                const isOccupied = occupiedSlots.includes(time);
                const isBlocked = blockedSlots.includes(time);
                const isSelected = selectedSlots.includes(time);
                
                return (
                  <button
                    key={time}
                    disabled={isOccupied || isBlocked}
                    onClick={() => toggleSlot(time)}
                    className={`
                      py-2 rounded-lg text-sm font-medium transition-colors
                      ${isBlocked
                        ? 'bg-red-50 text-red-300 cursor-not-allowed border border-red-100'
                        : isOccupied 
                          ? 'bg-bege text-cinza/40 cursor-not-allowed border border-transparent' 
                          : isSelected 
                            ? 'bg-sakura text-sakura-dark shadow-sm scale-105 border border-sakura' 
                            : 'bg-white border border-bege-dark text-cinza hover:border-menta hover:text-menta-dark'}
                    `}
                  >
                    {time}
                  </button>
                );
              })}
            </div>
          )}

          <div className="mt-8 flex justify-end">
             <button 
              disabled={selectedSlots.length === 0}
              onClick={initiateBooking}
              className={`
                px-8 py-3 rounded-xl font-medium transition-all flex items-center gap-2
                ${selectedSlots.length > 0 
                  ? 'bg-menta text-white hover:bg-menta-dark shadow-md' 
                  : 'bg-gray-100 text-gray-400 cursor-not-allowed'}
              `}
             >
               Reservar ({selectedSlots.length})
             </button>
          </div>
        </div>
      ) : (
        <div className="bg-white/50 border border-dashed border-sakura/30 rounded-2xl p-12 text-center text-cinza">
          <AlertCircle className="mx-auto mb-2 text-sakura" size={32} />
          <p>Selecione uma sala acima para ver a disponibilidade.</p>
        </div>
      )}

      {/* Confirm Modal with Patient Select */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/20 backdrop-blur-sm animate-fade-in">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden">
            <div className="bg-bege p-4 border-b border-sakura/20">
              <h3 className="font-serif font-bold text-cinza-dark">Confirmar Reserva</h3>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-sm text-cinza">
                Você selecionou <strong>{selectedSlots.length} horários</strong> em <strong>{new Date(selectedDate).toLocaleDateString()}</strong>.
              </p>
              
              <div>
                <label className="text-xs font-bold text-cinza uppercase mb-1 block">Paciente (Opcional)</label>
                <div className="relative">
                   <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-cinza/40" size={16}/>
                   <select 
                    value={selectedPatientId}
                    onChange={(e) => setSelectedPatientId(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-bege/30 rounded-lg border border-bege-dark outline-none focus:border-sakura text-cinza-dark appearance-none"
                   >
                     <option value="">Selecione um paciente...</option>
                     {patients.map(p => (
                       <option key={p.id} value={p.id}>{p.name}</option>
                     ))}
                   </select>
                </div>
                <p className="text-xs text-cinza mt-1">Isso vinculará o paciente à reserva no seu histórico.</p>
              </div>

              <div className="flex gap-3 mt-6">
                <button 
                  onClick={() => setShowConfirmModal(false)}
                  className="flex-1 py-2 border border-bege-dark text-cinza rounded-xl hover:bg-bege"
                >
                  Cancelar
                </button>
                <button 
                  onClick={confirmBooking}
                  disabled={processing}
                  className="flex-1 py-2 bg-menta text-white font-medium rounded-xl hover:bg-menta-dark flex justify-center items-center gap-2"
                >
                  {processing ? <Loader2 className="animate-spin" size={16}/> : 'Confirmar'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};