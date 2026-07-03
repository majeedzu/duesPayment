import { db } from '@/lib/db';
import { getServerSession } from '@/lib/session';
import { supabase, isSupabaseConfigured, getSupabaseAdmin } from '@/lib/supabase';

export async function POST(req) {
  try {
    const session = getServerSession(req);
    if (!session || (session.role !== 'dept_admin' && session.role !== 'super_admin')) {
      return Response.json({ success: false, message: 'Unauthorized.' }, { status: 401 });
    }

    const { indexNumbers } = await req.json();

    if (!indexNumbers || !Array.isArray(indexNumbers) || indexNumbers.length === 0) {
      return Response.json({ success: false, message: 'No index numbers provided.' }, { status: 400 });
    }

    let existingStudents = [];

    if (isSupabaseConfigured()) {
      const adminOrAnon = getSupabaseAdmin() || supabase;
      const { data, error } = await adminOrAnon
        .from('students')
        .select('index_number, full_name, email, programme, level')
        .in('index_number', indexNumbers);

      if (error) throw error;
      existingStudents = data || [];
    } else {
      // Mock mode: use getStudentByIndex for each provided index number
      const results = await Promise.all(
        indexNumbers.map(idx => db.getStudentByIndex(idx))
      );
      existingStudents = results.filter(Boolean);
    }

    return Response.json({
      success: true,
      duplicates: existingStudents,
      duplicateCount: existingStudents.length
    });
  } catch (err) {
    console.error('Check duplicates error:', err);
    return Response.json({ success: false, message: err.message || 'Internal Server Error' }, { status: 500 });
  }
}
