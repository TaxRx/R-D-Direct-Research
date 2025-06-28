import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://hwnnaextfopoznlgzvpz.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh3bm5hZXh0Zm9wb3pubGd6dnB6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA3OTk5NjIsImV4cCI6MjA2NjM3NTk2Mn0.rs-FhUyptaU9UeIMcZS1nCn3RD43VfUKhltvJr25JmY';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Database types for TypeScript
export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          email: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      businesses: {
        Row: {
          id: string;
          name: string;
          user_id: string;
          business_type: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          user_id: string;
          business_type: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          user_id?: string;
          business_type?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      years: {
        Row: {
          id: string;
          business_id: string;
          year: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          business_id: string;
          year: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          business_id?: string;
          year?: number;
          created_at?: string;
        };
      };
      research_activities: {
        Row: {
          id: string;
          business_id: string;
          year: number;
          title: string;
          practice_percent: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          business_id: string;
          year: number;
          title: string;
          practice_percent: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          business_id?: string;
          year?: number;
          title?: string;
          practice_percent?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      steps: {
        Row: {
          id: string;
          research_activity_id: string;
          title: string;
          order_index: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          research_activity_id: string;
          title: string;
          order_index: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          research_activity_id?: string;
          title?: string;
          order_index?: number;
          created_at?: string;
        };
      };
      subcomponents: {
        Row: {
          id: string;
          step_id: string;
          title: string;
          year_percent: number;
          frequency_percent: number;
          time_percent: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          step_id: string;
          title: string;
          year_percent: number;
          frequency_percent: number;
          time_percent: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          step_id?: string;
          title?: string;
          year_percent?: number;
          frequency_percent?: number;
          time_percent?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      roles: {
        Row: {
          id: string;
          business_id: string;
          name: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          business_id: string;
          name: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          business_id?: string;
          name?: string;
          created_at?: string;
        };
      };
      employees: {
        Row: {
          id: string;
          business_id: string;
          year: number;
          first_name: string;
          last_name: string;
          role_id: string;
          wage: number;
          is_owner: boolean;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          business_id: string;
          year: number;
          first_name: string;
          last_name: string;
          role_id: string;
          wage: number;
          is_owner: boolean;
          is_active: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          business_id?: string;
          year?: number;
          first_name?: string;
          last_name?: string;
          role_id?: string;
          wage?: number;
          is_owner?: boolean;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      contractors: {
        Row: {
          id: string;
          business_id: string;
          year: number;
          contractor_type: 'individual' | 'business';
          first_name?: string;
          last_name?: string;
          business_name?: string;
          role_id: string;
          total_amount: number;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          business_id: string;
          year: number;
          contractor_type: 'individual' | 'business';
          first_name?: string;
          last_name?: string;
          business_name?: string;
          role_id: string;
          total_amount: number;
          is_active: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          business_id?: string;
          year?: number;
          contractor_type?: 'individual' | 'business';
          first_name?: string;
          last_name?: string;
          business_name?: string;
          role_id?: string;
          total_amount?: number;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      supplies: {
        Row: {
          id: string;
          business_id: string;
          year: number;
          name: string;
          category: string;
          total_value: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          business_id: string;
          year: number;
          name: string;
          category: string;
          total_value: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          business_id?: string;
          year?: number;
          name?: string;
          category?: string;
          total_value?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      qre_allocations: {
        Row: {
          id: string;
          business_id: string;
          year: number;
          research_activity_id: string;
          step_id: string;
          subcomponent_id: string;
          category: 'employee' | 'contractor' | 'supply';
          entity_id: string; // employee_id, contractor_id, or supply_id
          applied_percent: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          business_id: string;
          year: number;
          research_activity_id: string;
          step_id: string;
          subcomponent_id: string;
          category: 'employee' | 'contractor' | 'supply';
          entity_id: string;
          applied_percent: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          business_id?: string;
          year?: number;
          research_activity_id?: string;
          step_id?: string;
          subcomponent_id?: string;
          category?: 'employee' | 'contractor' | 'supply';
          entity_id?: string;
          applied_percent?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
  };
}

export type Tables = Database['public']['Tables'];
export type Row<T extends keyof Tables> = Tables[T]['Row'];
export type InsertDto<T extends keyof Tables> = Tables[T]['Insert'];
export type UpdateDto<T extends keyof Tables> = Tables[T]['Update']; 