import { db } from '@/lib/db';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

export async function POST(req) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return Response.json({ success: false, message: 'Email and password are required.' }, { status: 400 });
    }

    // Email format validation (HTU institutional email format)
    const emailRegex = /^[a-zA-Z0-9._%+-]+@htu\.edu\.gh$/;
    if (!emailRegex.test(email.toLowerCase())) {
      return Response.json({ success: false, message: 'Only official HTU institutional emails (@htu.edu.gh) are allowed.' }, { status: 400 });
    }

    // Verify student exists in preloaded database
    const student = await db.getStudentByEmail(email);
    if (!student) {
      return Response.json({ 
        success: false, 
        message: 'This email is not registered in the university system. Please contact your Department Admin to upload your records.' 
      }, { status: 404 });
    }

    // Check if user is already registered
    const existingProfile = await db.getProfile(email);
    if (existingProfile) {
      return Response.json({ success: false, message: 'An account already exists for this email. Please log in.' }, { status: 400 });
    }

    if (isSupabaseConfigured()) {
      // Supabase Signup
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: student.full_name,
            role: 'student'
          }
        }
      });

      if (error) {
        return Response.json({ success: false, message: error.message }, { status: 400 });
      }

      // Create profile record mapping to department
      const newProfile = await db.createProfile({
        id: data.user.id,
        email,
        role: 'student',
        full_name: student.full_name,
        department_id: student.department_id
      });

      // Add a registration notification
      await db.addNotification(
        "Account Created Successfully",
        `Welcome ${student.full_name}! Your student portal account has been set up successfully.`,
        newProfile.id
      );

      return Response.json({
        success: true,
        message: 'Registration successful! You can now log in.',
        user: newProfile
      });
    } else {
      // Mock Registration
      const mockProfile = {
        email: email.toLowerCase(),
        role: 'student',
        full_name: student.full_name,
        department_id: student.department_id,
        password: password // In mock mode, we store password directly in plain text
      };

      const newProfile = await db.createProfile(mockProfile);

      // Add a registration notification
      await db.addNotification(
        "Account Created Successfully",
        `Welcome ${student.full_name}! Your student portal account has been set up successfully.`,
        newProfile.id
      );

      await db.addAuditLog(newProfile.id, 'REGISTRATION_SUCCESS', `Student ${student.full_name} registered their account.`);

      const { password: _, ...userWithoutPassword } = newProfile;
      return Response.json({
        success: true,
        message: 'Registration successful! You can now log in.',
        user: userWithoutPassword
      });
    }
  } catch (err) {
    console.error("Register API Error:", err);
    return Response.json({ success: false, message: err.message || 'Internal Server Error' }, { status: 500 });
  }
}
