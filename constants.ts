import { Room, RoomType, User, UserRole, Appointment, RoomBooking } from './types';

export const CURRENT_USER: User = {
  id: 'u1',
  name: 'Dra. Elisa Harumi',
  email: 'elisa@harumi.com',
  role: UserRole.ADMIN,
  specialty: 'Psicóloga Fundadora',
  avatarUrl: 'https://picsum.photos/id/64/200/200'
};

export const MOCK_ROOMS: Room[] = [
  {
    id: 'r1',
    name: 'Sala Cerejeira',
    type: RoomType.CONSULTORY,
    capacity: 3,
    imageUrl: 'https://images.unsplash.com/photo-1600607686527-6fb886090705?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'
  },
  {
    id: 'r2',
    name: 'Sala Bambu',
    type: RoomType.CONSULTORY,
    capacity: 3,
    imageUrl: 'https://images.unsplash.com/photo-1598928506311-c55ded91a20c?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'
  },
  {
    id: 'r3',
    name: 'Espaço Lúdico',
    type: RoomType.CHILDREN,
    capacity: 4,
    imageUrl: 'https://images.unsplash.com/photo-1519710164239-da123dc03ef4?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'
  }
];

export const MOCK_APPOINTMENTS: Appointment[] = [
  {
    id: 'a1',
    patientName: 'Ana Silva',
    professionalId: 'u1',
    roomId: 'r1',
    startTime: '2024-05-20T09:00:00',
    endTime: '2024-05-20T10:00:00',
    status: 'scheduled',
    notes: 'Primeira consulta'
  },
  {
    id: 'a2',
    patientName: 'Carlos Souza',
    professionalId: 'u1',
    roomId: 'r1',
    startTime: '2024-05-20T10:00:00',
    endTime: '2024-05-20T11:00:00',
    status: 'completed'
  },
  {
    id: 'a3',
    patientName: 'Mariana Lima',
    professionalId: 'u1',
    roomId: 'r2',
    startTime: '2024-05-20T14:00:00',
    endTime: '2024-05-20T15:00:00',
    status: 'scheduled'
  }
];

export const MOCK_BOOKINGS: RoomBooking[] = [
  {
    id: 'b1',
    roomId: 'r1',
    professionalId: 'u1',
    date: '2024-05-20',
    startTime: '08:00',
    endTime: '12:00'
  },
  {
    id: 'b2',
    roomId: 'r2',
    professionalId: 'u2',
    date: '2024-05-20',
    startTime: '13:00',
    endTime: '18:00'
  }
];

export const MOCK_PROFESSIONALS: User[] = [
  CURRENT_USER,
  {
    id: 'u2',
    name: 'Dr. Lucas Mendes',
    email: 'lucas@harumi.com',
    role: UserRole.PROFESSIONAL,
    specialty: 'Nutricionista Esportivo',
    avatarUrl: 'https://picsum.photos/id/91/200/200'
  },
  {
    id: 'u3',
    name: 'Dra. Fernanda Costa',
    email: 'fernanda@harumi.com',
    role: UserRole.PROFESSIONAL,
    specialty: 'Psicóloga Infantil',
    avatarUrl: 'https://picsum.photos/id/65/200/200'
  },
  {
    id: 'u4',
    name: 'Dr. Roberto Tanaka',
    email: 'roberto@harumi.com',
    role: UserRole.PROFESSIONAL,
    specialty: 'Psiquiatra',
    avatarUrl: 'https://picsum.photos/id/88/200/200'
  }
];

export const TIME_SLOTS = [
  '08:00', '09:00', '10:00', '11:00', '12:00', 
  '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00'
];