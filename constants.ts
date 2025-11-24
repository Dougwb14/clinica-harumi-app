import { RoomType } from './types';

// Apenas dados estáticos que não dependem do banco de dados
export const TIME_SLOTS = [
  '08:00', '09:00', '10:00', '11:00', '12:00', 
  '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00'
];

export const MOCK_ROOM_IMAGES = {
  cerejeira: 'https://images.unsplash.com/photo-1600607686527-6fb886090705?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
  bambu: 'https://images.unsplash.com/photo-1598928506311-c55ded91a20c?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
  ludico: 'https://images.unsplash.com/photo-1519710164239-da123dc03ef4?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'
};

export const MOCK_ROOMS = [
  {
    id: 'cerejeira',
    name: 'Sala Cerejeira',
    type: RoomType.CONSULTORY,
    capacity: 2,
    imageUrl: MOCK_ROOM_IMAGES.cerejeira
  },
  {
    id: 'bambu',
    name: 'Sala Bambu',
    type: RoomType.GROUP,
    capacity: 8,
    imageUrl: MOCK_ROOM_IMAGES.bambu
  },
  {
    id: 'ludico',
    name: 'Espaço Lúdico',
    type: RoomType.CHILDREN,
    capacity: 4,
    imageUrl: MOCK_ROOM_IMAGES.ludico
  }
];