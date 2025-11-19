import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Helper function to safely get environment variables in various environments (Vite, etc.)
const getEnvVar = (key: string): string | undefined => {
  try {
    // Check import.meta.env (Vite standard)
    // @ts-ignore
    if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env[key]) {
      // @ts-ignore
      return import.meta.env[key];
    }
  } catch (e) {
    // Continue to next check
  }

  try {
    // Check process.env (Standard Node/Webpack)
    // @ts-ignore
    if (typeof process !== 'undefined' && process.env && process.env[key]) {
      // @ts-ignore
      return process.env[key];
    }
  } catch (e) {
    // Continue
  }

  return undefined;
};

// Try to get from Environment variables first (Best practice for Render/Production)
const envUrl = getEnvVar('VITE_SUPABASE_URL');
const envKey = getEnvVar('VITE_SUPABASE_ANON_KEY');

// Fallback to provided credentials if env vars are missing (Ensures "It just works" for the user)
const finalUrl = envUrl || 'https://wnvkxpgwufrzjliblast.supabase.co';
const finalKey = envKey || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indudmt4cGd3dWZyempsaWJsYXN0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMzNDA4NDYsImV4cCI6MjA3ODkxNjg0Nn0.BXVgWXHzIjuUP6u4zExSvmr8LlhRSblSJZyvwIpy3OA';

class SupabaseService {
    private static instance: SupabaseClient | null = null;

    public static getClient(): SupabaseClient {
        if (this.instance) {
            return this.instance;
        }

        if (finalUrl && finalKey) {
            this.instance = createClient(finalUrl, finalKey);
            return this.instance;
        }

        throw new Error("MISSING_CREDENTIALS");
    }
}

export default SupabaseService;