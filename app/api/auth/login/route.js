import { db } from '@/lib/db';
import { supabase, isSupabaseConfigured, supabaseAdmin } from '@/lib/supabase';

export async function POST(req) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return Response.json({ success: false, message: 'Email and password are required.' }, { status: 400 });
    }

    if (isSupabaseConfigured()) {
      // Supabase Authentication
      let { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        // Intercept failed login to see if it is a student logging in for the first time
        // using their index number as the default password.
        const studentRecord = await db.getStudentByEmail(email);
        if (studentRecord && password === studentRecord.index_number) {
          const existingProfile = await db.getProfile(email);
          if (!existingProfile && supabaseAdmin) {
            // Programmatically register the student in Supabase Auth
            const { data: authData, error: createError } = await supabaseAdmin.auth.admin.createUser({
              email,
              password, // index_number as password
              email_confirm: true
            });

            if (!createError && authData?.user) {
              const newProfile = await db.createProfile({
                id: authData.user.id,
                email,
                role: 'student',
                full_name: studentRecord.full_name,
                department_id: studentRecord.department_id
              });

              await db.addNotification(
                "Account Created Successfully",
                `Welcome ${studentRecord.full_name}! Your student portal account has been set up successfully.`,
                newProfile.id
              );

              await db.addAuditLog(newProfile.id, 'REGISTRATION_SUCCESS', `Student ${studentRecord.full_name} registered via default password login.`);

              return Response.json({
                success: true,
                user: newProfile
              });
            }
          }
        }
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
