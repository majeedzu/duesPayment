import { db } from '@/lib/db';
import { getServerSession } from '@/lib/session';
import { supabaseAdmin, isSupabaseConfigured } from '@/lib/supabase';

export async function POST(req) {
  try {
    const session = getServerSession(req);
    if (!session || session.role !== 'student') {
      return Response.json({ success: false, message: 'Unauthorized access.' }, { status: 401 });
    }

    const { password } = await req.json();
    if (!password || password.length < 6) {
      return Response.json({ success: false, message: 'Password must be at least 6 characters long.' }, { status: 400 });
    }

    if (isSupabaseConfigured()) {
      if (!supabaseAdmin) {
        return Response.json({ success: false, message: 'Supabase admin client not initialized.' }, { status: 500 });
      }

      // Update password in Supabase Auth
      const { data, error } = await supabaseAdmin.auth.admin.updateUserById(
        session.id,
        { password: password }
      );

      if (error) {
        return Response.json({ success: false, message: error.message }, { status: 400 });
      }

      await db.addAuditLog(session.id, 'PASSWORD_CHANGE', `Student updated password successfully.`);
    } else {
      // Mock database update
      const success = await db.updateProfilePassword(session.email, password);
      if (!success) {
        return Response.json({ success: false, message: 'Profile not found.' }, { status: 404 });
      }
      await db.addAuditLog(session.id, 'PASSWORD_CHANGE', `Student updated password successfully (Mock).`);
    }

    return Response.json({
      success: true,
      message: 'Password changed successfully.'
    });
  } catch (err) {
    console.error("Change Password API Error:", err);
    return Response.json({ success: false, message: err.message || 'Internal Server Error' }, { status: 500 });
  }
}
