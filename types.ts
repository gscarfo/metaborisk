
export interface Patient {
  id: string;
  userId?: string; // Links patient to a specific doctor/user
  firstName: string;
  lastName: string;
  birthDate: string;
  gender: 'M' | 'F';
  createdAt: string;
  
  // Anthropometric Data
  weight: number; // kg
  height: number; // cm
  idealWeight?: number; // kg
  bmi: number;

  // Lab Data
  glucose: number; // mg/dL
  insulin: number; // uIU/mL
  hdl: number; // mg/dL
  triglycerides: number; // mg/dL

  // Calculated Risk Metrics
  homaIr: number;
  tgHdlRatio: number;
  
  // AI Analysis
  aiAnalysis?: string;
}

export interface CalculationResult {
  value: number;
  status: 'Ottimo' | 'Buono' | 'Attenzione' | 'Rischio Elevato' | 'Grave';
  color: string;
  description: string;
}

export enum AppView {
  LOGIN = 'LOGIN',
  ADMIN_DASHBOARD = 'ADMIN_DASHBOARD',
  DASHBOARD = 'DASHBOARD',
  FORM = 'FORM',
  REPORT = 'REPORT',
  PROFILE = 'PROFILE'
}

export type UserRole = 'admin' | 'user';

export interface User {
  id: string;
  username: string;
  role: UserRole;
  isActive: boolean;
  expiresAt: string | null; // ISO Date string or null for no expiry
  createdAt: string;
  
  // Profile Fields
  firstName?: string;
  lastName?: string;
  title?: string; // e.g., "Dott.", "Prof."
  specialization?: string; // e.g., "Biologo Nutrizionista"
  email?: string;
  phone?: string;
}
