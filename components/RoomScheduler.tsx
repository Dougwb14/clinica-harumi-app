import React, { useState } from 'react';
import { MOCK_ROOMS, TIME_SLOTS } from '../constants';
import { Calendar, Clock, CheckCircle2, Info } from 'lucide-react';
import { Room } from '../types';

export const RoomScheduler: React.FC = () => {
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [selectedRoom, setSelectedRoom] = useState<string | null>(null);
  const [selectedSlots, setSelectedSlots] = useState<string[]>([]);

  // Simple slot selection toggle
  const toggleSlot = (time: string) => {
    if (selectedSlots.includes(time)) {
      setSelectedSlots(selectedSlots.filter(t => t !== time));
    } else {
      setSelectedSlots([...selectedSlots, time]);
    }
  };

  const handleBooking = () => {
    alert(`Reservado! Sala: ${MOCK_ROOMS.find(r => r.id === selectedRoom)?.name}, Horários: ${selectedSlots.join(', ')}`);
    setSelectedSlots([]);
    setSelectedRoom(null);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <header className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-serif text-cinza-dark mb-2">Aluguel de Salas</h2>
          <p className="text-cinza">Reserve um espaço para seus atendimentos.</p>
        </div>
        <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-xl shadow-sm border border-sakura/30 text-cinza-dark">
          <Calendar size={18} className="text-sakura-dark" />
          <input 
            type="date" 
            value={selectedDate} 
            onChange={(e) => setSelectedDate(e.target.value)}
            className="bg-transparent border-none outline-none text-sm font-medium"
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

      {/* Scheduler Grid - Only shows if room is selected */}
      {selectedRoom && (
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-sakura/20 animate-slide-up">
          <div className="flex justify-between items-center mb-6">
             <h3 className="text-lg font-medium text-cinza-dark flex items-center gap-2">
               <Clock className="text-menta" size={20} />
               Horários Disponíveis
             </h3>
             <div className="flex items-center gap-4 text-sm">
                <span className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-bege-dark"></div> Indisponível</span>
                <span className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-white border border-gray-200"></div> Livre</span>
                <span className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-sakura text-white"></div> Selecionado</span>
             </div>
          </div>

          <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-12 gap-3">
            {TIME_SLOTS.map((time, idx) => {
              // Mock occupied slots
              const isOccupied = idx === 2 || idx === 5; 
              const isSelected = selectedSlots.includes(time);
              
              return (
                <button
                  key={time}
                  disabled={isOccupied}
                  onClick={() => toggleSlot(time)}
                  className={`
                    py-2 rounded-lg text-sm font-medium transition-colors
                    ${isOccupied 
                      ? 'bg-bege text-cinza/40 cursor-not-allowed' 
                      : isSelected 
                        ? 'bg-sakura text-sakura-dark shadow-sm scale-105' 
                        : 'bg-white border border-bege-dark text-cinza hover:border-menta hover:text-menta-dark'}
                  `}
                >
                  {time}
                </button>
              );
            })}
          </div>

          <div className="mt-8 flex justify-end">
             <button 
              disabled={selectedSlots.length === 0}
              onClick={handleBooking}
              className={`
                px-8 py-3 rounded-xl font-medium transition-all
                ${selectedSlots.length > 0 
                  ? 'bg-menta text-white hover:bg-menta-dark shadow-md' 
                  : 'bg-gray-100 text-gray-400 cursor-not-allowed'}
              `}
             >
               Confirmar Reserva ({selectedSlots.length})
             </button>
          </div>
        </div>
      )}
    </div>
  );
};

const UsersIcon = ({size}: {size: number}) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
);