import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../contexts/AuthContext';
import { TIME_SLOTS } from '../constants';
import { Patient, Room, AgendaType, UserRole } from '../types';
import { Calendar, Clock, CheckCircle2, Users as UsersIcon, Loader2, AlertCircle, Tag, Trash2, Info, User as UserIcon } from 'lucide-react';

export const RoomScheduler: React.FC = () => {
  const { user } = useAuth();
  
  const getLocalDate = () => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const [selectedDate, setSelectedDate] = useState<string>(getLocalDate());
  const [rooms, setRooms] = useState<Room[]>([]); 
  const [selectedRoom, setSelectedRoom] = useState<string | null>(null);
  const [selectedSlots, setSelectedSlots] = useState<string[]>([]);
  const [occupiedSlots, setOccupiedSlots] = useState<string[]>([]);
  const [bookingsMap, setBookingsMap] = useState<Record<string, any>>({}); 
  const [blockedSlots, setBlockedSlots] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [roomsLoading, setRoomsLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [agendaTypes, setAgendaTypes] = useState<AgendaType[]>([]);
  const [selectedPatientId, setSelectedPatientId] = useState<string>('');
  const [selectedAgendaTypeId, setSelectedAgendaTypeId] = useState<string>('');
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false); 
  const [selectedBookingDetail, setSelectedBookingDetail] = useState<any>(null); 

  const isAdmin = user?.role === UserRole.ADMIN;

  useEffect(() => {
    fetchRooms();
    fetchDropdownData();
  }, []);

  useEffect(() => {
    if (selectedRoom && selectedDate) {
      fetchSlots();
    }
  }, [selectedRoom, selectedDate]);

  const fetchDropdownData = async () => {
    const { data: patData } = await supabase.from('patients').select('id, name').order('name');
    if (patData) setPatients(patData as any);

    const { data: typeData } = await supabase.from('agenda_types').select('*').order('name');
    if (typeData) setAgendaTypes(typeData as any);
  };

  const fetchRooms = async () => {
    setRoomsLoading(true);
    try {
      const { data, error } = await supabase.from('rooms').select('*').order('name');
      if (error) throw error;
      setRooms(data as Room[]);
    } catch (error) {
      console.error('Error fetching rooms:', error);
    } finally {
      setRoomsLoading(false);
    }
  };

  const fetchSlots = async () => {
    setLoading(true);
    setOccupiedSlots([]);
    setBookingsMap({});
    setBlockedSlots([]);
    setSelectedSlots([]);
    
    try {
      const { data: bookings } = await supabase
        .from('room_bookings')
        .select(`
          id, 
          start_time, 
          time_slot, 
          professional_id, 
          patient:patients(name),
          professional:profiles(name),
          agenda_type:agenda_types(name, color)
        `) 
        .eq('room_id', selectedRoom)
        .eq('date', selectedDate);

      if (bookings) {
        const occupied: string[] = [];
        const bMap: Record<string, any> = {};

        bookings.forEach((b: any) => {
          const time = (b.start_time || b.time_slot || '').substring(0, 5);
          if (time) {
            occupied.push(time);
            bMap[time] = b;
          }
        });
        setOccupiedSlots(occupied);
        setBookingsMap(bMap);
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
             blockedTimes.push(block.start_time.substring(0, 5));
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

  const handleSlotClick = (time: string) => {
    const isOccupied = occupiedSlots.includes(time);
    const isBlocked = blockedSlots.includes(time);

    if (isBlocked) return;

    if (isOccupied) {
      if (isAdmin) {
        const booking = bookingsMap[time];
        if (booking) {
          setSelectedBookingDetail(booking);
          setShowDetailModal(true);
        }
      }
      return;
    }

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

  const handleCloseModal = () => {
    setShowConfirmModal(false);
    setShowDetailModal(false);
    setSelectedBookingDetail(null);
    setSelectedPatientId('');
    setSelectedAgendaTypeId('');
  };

  const calculateEndTime = (startTime: string) => {
    // Lógica EXATA: Adiciona 30 minutos ao horário de início
    const [hour, min] = startTime.split(':').map(Number);
    const date = new Date();
    date.setHours(hour, min, 0, 0);
    date.setMinutes(date.getMinutes() + 30);
    return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
  };

  const confirmBooking = async () => {
    if (!user || !selectedRoom) return;
    setProcessing(true);

    try {
      const bookingsToInsert = selectedSlots.map(time => ({
        room_id: selectedRoom,
        professional_id: user.id,
        patient_id: selectedPatientId || null,
        agenda_type_id: selectedAgendaTypeId || null,
        date: selectedDate,
        start_time: time,
        end_time: calculateEndTime(time), // Garante 30 min
        time_slot: time // Manter compatibilidade
      }));

      const { error } = await supabase
        .from('room_bookings')
        .insert(bookingsToInsert);

      if (error) throw error;

      alert('Reserva confirmada!');
      handleCloseModal();
      fetchSlots(); 
    } catch (error: any) {
      console.error(error);
      alert('Erro ao reservar: ' + error.message);
    } finally {
      setProcessing(false);
    }
  };

  const handleAdminCancel = async () => {
    if (!selectedBookingDetail) return;
    if (!confirm('Tem certeza que deseja cancelar esta reserva? Essa ação não pode ser desfeita.')) return;

    setProcessing(true);
    try {
      const { error } = await supabase
        .from('room_bookings')
        .delete()
        .eq('id', selectedBookingDetail.id);

      if (error) throw error;
      
      alert('Reserva cancelada.');
      handleCloseModal();
      fetchSlots();
    } catch (error) {
      alert('Erro ao cancelar reserva.');
    } finally {
      setProcessing(false);
    }
  };

  const formatDisplayDate = (dateStr: string) => {
    if (!dateStr) return '';
    const [year, month, day] = dateStr.split('-');
    return `${day}/${month}/${year}`;
  };

  return (
    <div className="space-y-6 animate-fade-in relative">
      <header className="flex flex-col md:flex-row justify-between md:items-end gap-4">
        <div>
          <h2 className="text-3xl font-serif text-cinza-dark mb-2">Aluguel de Salas</h2>
          <p className="text-cinza">Reserve um espaço (slots de 30 min).</p>
        </div>
        <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-xl shadow-sm border border-sakura/30 text-cinza-dark self-start md:self-auto">
          <Calendar size={18} className="text-sakura-dark" />
          <input 
            type="date" 
            value={selectedDate} 
            onChange={(e) => setSelectedDate(e.target.value)}
            className="bg-transparent border-none outline-none text-sm font-medium uppercase"
          />
        </div>
      </header>

      {roomsLoading ? (
        <div className="flex justify-center p-12"><Loader2 className="animate-spin text-sakura" size={32}/></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {rooms.map((room) => (
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
                 <img src={room.image_url || 'https://images.unsplash.com/photo-1519710164239-da123dc03ef4?ixlib=rb-4.0.3'} alt={room.name} className="w-full h-full object-cover" />
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
      )}

      {selectedRoom ? (
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-sakura/20 animate-slide-up">
          <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
             <h3 className="text-lg font-medium text-cinza-dark flex items-center gap-2">
               <Clock className="text-menta" size={20} />
               Horários Disponíveis ({formatDisplayDate(selectedDate)})
             </h3>
             <div className="flex items-center gap-4 text-sm flex-wrap">
                <span className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-red-200"></div> Bloqueado</span>
                <span className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-bege-dark"></div> Ocupado {isAdmin && '(Admin)'}</span>
                <span className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-white border border-gray-200"></div> Livre</span>
             </div>
          </div>

          {loading ? (
            <div className="py-12 flex justify-center"><Loader2 className="animate-spin text-sakura"/></div>
          ) : (
            <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3">
              {TIME_SLOTS.map((time, idx) => {
                const isOccupied = occupiedSlots.includes(time);
                const isBlocked = blockedSlots.includes(time);
                const isSelected = selectedSlots.includes(time);
                
                const canClick = !isBlocked && (!isOccupied || isAdmin); 
                
                return (
                  <button
                    key={time}
                    disabled={!canClick}
                    onClick={() => handleSlotClick(time)}
                    title={isOccupied && isAdmin ? "Clique para gerenciar esta reserva" : ""}
                    className={`
                      py-2 rounded-lg text-sm font-medium transition-colors relative
                      ${isBlocked
                        ? 'bg-red-50 text-red-300 cursor-not-allowed border border-red-100'
                        : isOccupied 
                          ? `bg-bege-dark text-cinza-dark border border-transparent ${isAdmin ? 'hover:bg-bege cursor-pointer ring-2 ring-transparent hover:ring-sakura' : 'cursor-not-allowed'}`
                          : isSelected 
                            ? 'bg-sakura text-sakura-dark shadow-sm scale-105 border border-sakura' 
                            : 'bg-white border border-bege-dark text-cinza hover:border-menta hover:text-menta-dark'}
                    `}
                  >
                    {time}
                    {isOccupied && isAdmin && (
                       <div className="absolute top-1 right-1 w-1.5 h-1.5 bg-sakura-dark rounded-full"></div>
                    )}
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

      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/20 backdrop-blur-sm animate-fade-in">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden">
            <div className="bg-bege p-4 border-b border-sakura/20">
              <h3 className="font-serif font-bold text-cinza-dark">Confirmar Reserva</h3>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-sm text-cinza">
                Você selecionou <strong>{selectedSlots.length} horários</strong> em <strong>{formatDisplayDate(selectedDate)}</strong>.
              </p>
              
              <div>
                <label className="text-xs font-bold text-cinza uppercase mb-1 block">Tipo de Agenda</label>
                <div className="relative">
                   <Tag className="absolute left-3 top-1/2 -translate-y-1/2 text-cinza/40" size={16}/>
                   <select 
                    value={selectedAgendaTypeId}
                    onChange={(e) => setSelectedAgendaTypeId(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-bege/30 rounded-lg border border-bege-dark outline-none focus:border-sakura text-cinza-dark appearance-none"
                   >
                     <option value="">Selecione o serviço...</option>
                     {agendaTypes.map(t => (
                       <option key={t.id} value={t.id}>{t.name} (R$ {t.price})</option>
                     ))}
                   </select>
                </div>
              </div>

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
              </div>

              <div className="flex gap-3 mt-6">
                <button 
                  onClick={handleCloseModal}
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

      {showDetailModal && selectedBookingDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/20 backdrop-blur-sm animate-fade-in">
          <div className="bg-white w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden border border-red-100">
            <div className="bg-red-50 p-4 border-b border-red-100 flex items-center gap-2">
              <Info className="text-red-400" size={20}/>
              <h3 className="font-bold text-red-900">Gerenciar Reserva</h3>
            </div>
            <div className="p-6 space-y-4">
              <div className="space-y-2 text-sm text-cinza-dark">
                <p><strong className="text-cinza">Horário:</strong> {selectedBookingDetail.start_time || selectedBookingDetail.time_slot}</p>
                <p><strong className="text-cinza">Profissional:</strong> {selectedBookingDetail.professional?.name || 'N/A'}</p>
                <p><strong className="text-cinza">Paciente:</strong> {selectedBookingDetail.patient?.name || 'Não informado'}</p>
                <p className="flex items-center gap-2">
                  <strong className="text-cinza">Serviço:</strong> 
                  {selectedBookingDetail.agenda_type ? (
                     <span className="px-2 py-0.5 rounded-full text-xs bg-gray-100 border border-gray-200" style={{borderColor: selectedBookingDetail.agenda_type.color}}>
                       {selectedBookingDetail.agenda_type.name}
                     </span>
                  ) : '-'}
                </p>
              </div>

              <div className="pt-4 flex gap-3">
                <button 
                  onClick={handleCloseModal}
                  className="flex-1 py-2 border border-gray-200 text-gray-500 rounded-xl hover:bg-gray-50"
                >
                  Fechar
                </button>
                <button 
                  onClick={handleAdminCancel}
                  disabled={processing}
                  className="flex-1 py-2 bg-red-500 text-white font-medium rounded-xl hover:bg-red-600 flex justify-center items-center gap-2"
                >
                  {processing ? <Loader2 className="animate-spin" size={16}/> : <><Trash2 size={16}/> Cancelar</>}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};