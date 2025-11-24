export enum UserRole {
  ADMIN = 'ADMIN',
  PROFESSIONAL = 'PROFESSIONAL', // Psychologist or Nutritionist
  PATIENT = 'PATIENT'
}

export enum RoomType {
  CONSULTORY = 'Consultório Padrão',
  CHILDREN = 'Consultório Infantil',
  GROUP = 'Sala de Grupo'
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatarUrl?: string;
  specialty?: string; // e.g., "Psicologia Clínica", "Nutrição Esportiva"
}

export interface Room {
  id: string;
  name: string;
  type: RoomType;
  capacity: number;
  imageUrl?: string;
}

// A booking of a physical room by a professional
export interface RoomBooking {
  id: string;
  roomId: string;
  professionalId: string;
  startTime: string; // ISO String
  endTime: string; // ISO String
  date: string; // YYYY-MM-DD
}

// An appointment between a professional and a patient
export interface Appointment {
  id: string;
  patientName: string;
  professionalId: string;
  roomId: string; // Linked to a room booking usually, or virtual
  startTime: string; // ISO String
  endTime: string; // ISO String
  status: 'scheduled' | 'completed' | 'cancelled' | 'blocked';
  notes?: string;
}

export interface Notification {
  id: string;
  message: string;
  read: boolean;
  date: string;
}