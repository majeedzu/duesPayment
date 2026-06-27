import { db } from '@/lib/db';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

export async function POST(req) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return Response.json({ success: false, message: 'Email and password are required.' }, { status: 400 });
    }

    if (isSupabaseConfigured()) {
      // Supabase Authentication
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        return Response.json({ success: false, message: error.message }, { status: 400 });
      }

      // Fetch user profile to determine role and department
      const profile = await db.getProfile(email);

      if (!profile) {
        // If profile doesn't exist but auth user does, create default profile (e.g. for student)
        const studentRecord = await db.getStudentByEmail(email);
        const role = studentRecord ? 'student' : 'student'; // default to student

        const newProfile = await db.createProfile({
          id: data.user.id,
          email,
          role,
          full_name: studentRecord ? studentRecord.full_name : 'New Student',
          department_id: studentRecord ? studentRecord.department_id : null
        });

        return Response.json({
          success: true,
          user: newProfile
        });
      }

      return Response.json({
        success: true,
        user: profile
      });
    } else {
      // Mock Authentication
      const profile = await db.getProfile(email);

      if (!profile) {
        // Check if student exists in CSV preloaded table but is not registered yet
        const studentRecord = await db.getStudentByEmail(email);
        if (studentRecord) {
          return Response.json({ 
            success: false, 
            needRegistration: true,
            message: 'First time logging in? Please register your password first.' 
          }, { status: 403 });
        }
        
        return Response.json({ success: false, message: 'User record not found.' }, { status: 404 });
      }

      if (profile.password !== password) {
        return Response.json({ success: false, message: 'Incorrect password.' }, { status: 401 });
      }

      // Log successful login activity
      await db.addAuditLog(profile.id, 'LOGIN_SUCCESS', `${profile.full_name} (${profile.role}) logged in.`);

      // Return profile information (excluding password for security)
      const { password: _, ...userWithoutPassword } = profile;
      return Response.json({
        success: true,
        user: userWithoutPassword
      });
    }
  } catch (err) {
    console.error("Login API Error:", err);
    return Response.json({ success: false, message: err.message || 'Internal Server Error' }, { status: 500 });
  }
}
