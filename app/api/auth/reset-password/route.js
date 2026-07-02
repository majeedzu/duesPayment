import { db } from '@/lib/db';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

export async function POST(req) {
  try {
    const { email } = await req.json();

    if (!email) {
      return Response.json({ success: false, message: 'Email is required.' }, { status: 400 });
    }

    const emailRegex = /^[a-zA-Z0-9._%+-]+@htu\.edu\.gh$/;
    if (!emailRegex.test(email.toLowerCase())) {
      return Response.json({ success: false, message: 'Only HTU institutional emails are allowed.' }, { status: 400 });
    }

    const profile = await db.getProfile(email);
    if (!profile) {
      return Response.json({ success: false, message: 'No registered account found with this email.' }, { status: 404 });
    }

    if (isSupabaseConfigured()) {
      const origin = process.env.NEXT_PUBLIC_APP_URL || "https://dues-payment.vercel.app";
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${origin}/auth/update-password`,
      });

      if (error) {
        return Response.json({ success: false, message: error.message }, { status: 400 });
      }

      return Response.json({ success: true, message: 'Reset email sent successfully.' });
    } else {
      // Mock reset email logging
      await db.addAuditLog(profile.id, 'PASSWORD_RESET_REQUESTED', `Simulated password reset email sent to ${email}`);
      return Response.json({ success: true, message: 'Reset email simulated successfully.' });
    }
  } catch (err) {
    console.error("Reset Password API Error:", err);
    return Response.json({ success: false, message: err.message || 'Internal Server Error' }, { status: 500 });
  }
}
