export interface Doctor {
  id: string;
  name: string;
  specialization: string;
  experience: number;
  consultationFee: number;
  rating?: number;
  availableSlots?: string[];
  image?: string;
  qualifications?: string[];
  role: 'doctor';
}

export interface ChatMessage {
  id: string;
  message: string;
  sender: 'user' | 'ai';
  timestamp: Date;
  suggestedDoctors?: Doctor[];
  isTyping?: boolean;
}

export interface AIResponse {
  analysis: string;
  specializations: string[];
  urgency: 'low' | 'medium' | 'high';
  recommendations: string[];
}
