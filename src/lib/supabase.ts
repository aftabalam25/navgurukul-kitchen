import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface Profile {
  id: string;
  email: string;
  discord_id: string;
  full_name: string;
  is_admin: boolean;
  is_present: boolean;
  created_at: string;
  updated_at: string;
}

export interface KitchenSchedule {
  id: string;
  user_id: string;
  scheduled_date: string;
  is_completed: boolean;
  created_at: string;
  created_by: string | null;
  profile?: Profile;
}

export interface SwapRequest {
  id: string;
  requester_id: string;
  target_id: string;
  requester_schedule_id: string;
  target_schedule_id: string;
  status: 'pending' | 'accepted' | 'rejected';
  created_at: string;
  updated_at: string;
  requester?: Profile;
  target?: Profile;
  requester_schedule?: KitchenSchedule;
  target_schedule?: KitchenSchedule;
}
