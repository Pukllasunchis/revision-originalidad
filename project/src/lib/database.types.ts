export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      weeks: {
        Row: {
          id: string
          start_date: string
          end_date: string
          reserved_slots: number
          created_at: string
        }
        Insert: {
          id?: string
          start_date: string
          end_date: string
          reserved_slots?: number
          created_at?: string
        }
        Update: {
          id?: string
          start_date?: string
          end_date?: string
          reserved_slots?: number
          created_at?: string
        }
      }
      requests: {
        Row: {
          id: string
          week_id: string | null
          queue_number: number
          training_modality: string
          study_program: string
          document_type: string
          review_number: number
          document_file_path: string
          status: string
          created_at: string
        }
        Insert: {
          id?: string
          week_id?: string | null
          queue_number: number
          training_modality: string
          study_program: string
          document_type: string
          review_number: number
          document_file_path: string
          status?: string
          created_at?: string
        }
        Update: {
          id?: string
          week_id?: string | null
          queue_number?: number
          training_modality?: string
          study_program?: string
          document_type?: string
          review_number?: number
          document_file_path?: string
          status?: string
          created_at?: string
        }
      }
      request_members: {
        Row: {
          id: string
          request_id: string
          full_name: string
          institutional_email: string
          phone_number: string
          payment_receipt_path: string
          created_at: string
        }
        Insert: {
          id?: string
          request_id: string
          full_name: string
          institutional_email: string
          phone_number: string
          payment_receipt_path: string
          created_at?: string
        }
        Update: {
          id?: string
          request_id?: string
          full_name?: string
          institutional_email?: string
          phone_number?: string
          payment_receipt_path?: string
          created_at?: string
        }
      }
    }
  }
}
