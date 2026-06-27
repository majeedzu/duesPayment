import { isSupabaseConfigured } from '@/lib/supabase';

export async function GET() {
  return Response.json({
    isSupabaseConfigured: isSupabaseConfigured()
  });
}
