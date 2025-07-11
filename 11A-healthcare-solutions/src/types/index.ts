export interface User {
  uid: string;
  email: string;
  role: 'patient' | 'doctor' | 'admin';
  name: string;
  phone?: string;
  createdAt: Date;
}

export interface Patient extends User {
  role: 'patient';
  age?: number;
  dateOfBirth?: string;
  bloodGroup?: string;
  address?: string;
  emergencyContact?: string;
  medicalHistory?: string[];
  allergies?: string[];
  profilePicture?: string;
}

export interface Doctor extends User {
  role: 'doctor';
  specialization: string;
  experience: number;
  qualification: string;
  consultationFee: number;
  availableSlots: TimeSlot[];
  rating?: number;
  profilePicture?: string;
}

export interface Admin extends User {
  role: 'admin';
  permissions: string[];
}

export interface TimeSlot {
  id: string;
  startTime: string;
  endTime: string;
  isAvailable: boolean;
  date: Date;
}

export interface Appointment {
  id: string;
  patientId: string;
  doctorId: string;
  patientName: string;
  doctorName: string;
  date: Date;
  time: string;
  status: 'scheduled' | 'completed' | 'cancelled';
  symptoms?: string;
  diagnosis?: string;
  prescription?: string;
  notes?: string;
  createdAt: Date;
}

export interface MedicalRecord {
  id: string;
  patientId: string;
  doctorId: string;
  appointmentId: string;
  diagnosis: string;
  prescription: string;
  notes: string;
  attachments?: string[];
  createdAt: Date;
}

export interface MedicalReport {
  id: string;
  patientId: string;
  doctorId: string;
  patientName: string;
  doctorName: string;
  diagnosis: string;
  prescription: string;
  notes?: string;
  symptoms?: string;
  treatmentPlan?: string;
  followUpDate?: Date | null;
  reportType: 'consultation' | 'uploaded_document';
  attachments?: string[];
  createdAt: Date;
  fileUrl?: string;
  aiSummary?: string;
}

export interface ChatMessage {
  id: string;
  message: string;
  sender: 'user' | 'ai';
  timestamp: Date;
  suggestedDoctors?: Doctor[];
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'appointment' | 'medical' | 'system' | 'message';
  read: boolean;
  createdAt: Date;
  relatedId?: string; // Can be appointmentId, medicalReportId, etc.
  link?: string; // Optional link to navigate to when clicked
}
export interface DoctorDocument {
  id: string;
  doctorId: string;
  name: string;
  url: string;
  type: string;
  size: number;
  createdAt: Date;
  folderId?: string | null;
}

export interface Folder {
  id: string;
  name: string;
  ownerId: string;
  createdAt: Date;
  privacy: 'private' | 'global';
}