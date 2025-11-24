export enum UserRole {
  ADMIN = 'ADMIN',
  PROFESSIONAL = 'PROFESSIONAL',
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
  avatar_url?: string;
  specialty?: string;
}

export interface Room {
  id: string;
  name: string;
  type: RoomType;
  capacity: number;
  image_url?: string;
}

export interface RoomBooking {
  id: string;
  room_id: string;
  professional_id: string;
  start_time: string;
  end_time: string;
  date: string;
}

export interface Appointment {
  id: string;
  patient_id: string;
  professional_id: string;
  professional_name?: string; // Join field
  patient_name?: string;     // Join field
  date: string;
  start_time: string;
  status: 'scheduled' | 'completed' | 'cancelled';
  notes?: string;
}