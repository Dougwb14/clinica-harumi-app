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

export interface FinancialTransaction {
  id: string;
  description: string;
  amount: number;
  type: 'INCOME' | 'EXPENSE';
  category: string;
  due_date: string;
  status: 'PENDING' | 'PAID';
}

export interface ScheduleBlock {
  id: string;
  target_type: 'ROOM' | 'PROFESSIONAL';
  target_id: string; // Room ID or User ID
  date: string;
  start_time?: string; // If null, full day
  end_time?: string;
  reason: string;
}

export interface AgendaType {
  id: string;
  name: string;
  price: number;
  duration_slots: number;
  color: string;
}