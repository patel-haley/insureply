import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Database types (will be generated from your schema)
export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          first_name: string | null
          last_name: string | null
          phone: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          first_name?: string | null
          last_name?: string | null
          phone?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          first_name?: string | null
          last_name?: string | null
          phone?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      admin_users: {
        Row: {
          id: string
          user_id: string
          admin_name: 'haley' | 'jigar' | 'priyal'
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          admin_name: 'haley' | 'jigar' | 'priyal'
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          admin_name?: 'haley' | 'jigar' | 'priyal'
          created_at?: string
        }
      }
      families: {
        Row: {
          id: string
          family_name: string
          primary_contact_email: string
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          family_name: string
          primary_contact_email: string
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          family_name?: string
          primary_contact_email?: string
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      family_members: {
        Row: {
          id: string
          family_id: string
          user_id: string
          relationship: string | null
          is_primary: boolean
          joined_at: string
        }
        Insert: {
          id?: string
          family_id: string
          user_id: string
          relationship?: string | null
          is_primary?: boolean
          joined_at?: string
        }
        Update: {
          id?: string
          family_id?: string
          user_id?: string
          relationship?: string | null
          is_primary?: boolean
          joined_at?: string
        }
      }
      policies: {
        Row: {
          id: string
          family_id: string
          policy_holder_id: string | null
          policy_number: string | null
          policy_type: string
          insurance_company: string | null
          premium_amount: number | null
          coverage_amount: number | null
          start_date: string | null
          end_date: string | null
          status: 'active' | 'inactive' | 'pending'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          family_id: string
          policy_holder_id?: string | null
          policy_number?: string | null
          policy_type: string
          insurance_company?: string | null
          premium_amount?: number | null
          coverage_amount?: number | null
          start_date?: string | null
          end_date?: string | null
          status?: 'active' | 'inactive' | 'pending'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          family_id?: string
          policy_holder_id?: string | null
          policy_number?: string | null
          policy_type?: string
          insurance_company?: string | null
          premium_amount?: number | null
          coverage_amount?: number | null
          start_date?: string | null
          end_date?: string | null
          status?: 'active' | 'inactive' | 'pending'
          created_at?: string
          updated_at?: string
        }
      }
      policy_requests: {
        Row: {
          id: string
          family_id: string
          requested_by: string
          request_type: 'new_policy' | 'edit_policy' | 'delete_policy'
          policy_id: string | null
          request_data: any
          status: 'pending' | 'approved' | 'rejected'
          admin_notes: string | null
          reviewed_by: string | null
          reviewed_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          family_id: string
          requested_by: string
          request_type: 'new_policy' | 'edit_policy' | 'delete_policy'
          policy_id?: string | null
          request_data: any
          status?: 'pending' | 'approved' | 'rejected'
          admin_notes?: string | null
          reviewed_by?: string | null
          reviewed_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          family_id?: string
          requested_by?: string
          request_type?: 'new_policy' | 'edit_policy' | 'delete_policy'
          policy_id?: string | null
          request_data?: any
          status?: 'pending' | 'approved' | 'rejected'
          admin_notes?: string | null
          reviewed_by?: string | null
          reviewed_at?: string | null
          created_at?: string
        }
      }
    }
  }
}