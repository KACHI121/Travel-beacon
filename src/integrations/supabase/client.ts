import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  throw new Error('Supabase environment variables are not set.');
}

class SupabaseClient {
  private static instance: ReturnType<typeof createClient<Database>>;

  private constructor() {}

  public static getInstance(): ReturnType<typeof createClient<Database>> {
    if (!this.instance) {
      this.instance = createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY);
    }
    return this.instance;
  }
}

export const supabase = SupabaseClient.getInstance();
