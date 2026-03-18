export const TRAINING_MODALITIES = {
  FID: 'Formación Inicial Docente (FID) - 5 años',
  PPD: 'Programa de Profesionalización Docente (PPD) - 1 año',
} as const;

export const STUDY_PROGRAMS = {
  INICIAL: 'Educación Inicial',
  PRIMARIA_EIB: 'Educación Primaria Intercultural Bilingüe',
  PRIMARIA: 'Educación Primaria',
} as const;

export const DOCUMENT_TYPES = {
  RESEARCH: 'Trabajo de Investigación',
  THESIS: 'Tesis',
} as const;

export interface Member {
  fullName: string;
  institutionalEmail: string;
  phoneNumber: string;
  paymentReceipt: File | null;
}

export interface RequestFormData {
  trainingModality: string;
  studyProgram: string;
  documentType: string;
  reviewNumber: number;
  document: File | null;
  members: Member[];
}

export interface Week {
  id: string;
  start_date: string;
  end_date: string;
  reserved_slots: number;
  created_at: string;
}

export interface Request {
  id: string;
  week_id: string | null;
  queue_number: number;
  training_modality: string;
  study_program: string;
  document_type: string;
  review_number: number;
  document_file_path: string;
  status: string;
  created_at: string;
}

export interface RequestMember {
  id: string;
  request_id: string;
  full_name: string;
  institutional_email: string;
  phone_number: string;
  payment_receipt_path: string;
  created_at: string;
}

export const MAX_REQUESTS_PER_WEEK = 10;
export const MAX_MEMBERS = 3;
export const MAX_REVIEWS = 3;
