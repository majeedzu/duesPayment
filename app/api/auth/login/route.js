import { db } from '@/lib/db';
import { supabase, isSupabaseConfigured, getSupabaseAdmin } from '@/lib/supabase';

export async function POST(req) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return Response.json({ success: false, message: 'Email and password are required.' }, { status: 400 });
    }

    if (isSupabaseConfigured()) {
      // --- Step 1: Try normal Supabase login first ---
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });

      if (error) {
        // --- Step 2: Check if this is a CSV-imported student ---
        const studentRecord = await db.getStudentByEmail(email);

        if (!studentRecord) {
          return Response.json({ success: false, message: 'Invalid login credentials.' }, { status: 400 });
        }

        // Normalize — strip leading zeros so 0325080328 matches 325080328
        const normalizeId = (s) => String(s).trim().replace(/^0+(\d)/, '$1');
        const indexNum = String(studentRecord.index_number).trim();
        const enteredPassword = String(password).trim();

        const matches = enteredPassword === indexNum ||
                        normalizeId(enteredPassword) === normalizeId(indexNum);

        if (!matches) {
          return Response.json({ success: false, message: 'Invalid login credentials.' }, { status: 400 });
        }

        // --- Step 3: Auto-provision Supabase auth account ---
        const adminClient = getSupabaseAdmin();

        if (!adminClient) {
          return Response.json({
            success: false,
            message: 'Server configuration error. Please contact the system administrator.'
          }, { status: 500 });
        }

        // Check if a Supabase auth user already exists for this email
        const { data: usersData, error: listError } = await adminClient.auth.admin.listUsers({ perPage: 1000 });
        if (listError) console.error('[AUTH] listUsers error:', listError.message);

        const existingAuthUser = usersData?.users?.find(u => u.email?.toLowerCase() === email.toLowerCase());
        let authUserId;

        if (existingAuthUser) {
          // Auth user exists — confirm email + reset to entered password
          const { error: updateError } = await adminClient.auth.admin.updateUserById(
            existingAuthUser.id,
            { password: enteredPassword, email_confirm: true }
          );
          if (updateError) {
            console.error('[AUTH] updateUserById error:', updateError.message);
            return Response.json({ success: false, message: 'Failed to activate account: ' + updateError.message }, { status: 500 });
          }
          authUserId = existingAuthUser.id;
        } else {
          // No auth user — create a confirmed one
          const { data: newAuthData, error: createError } = await adminClient.auth.admin.createUser({
            email,
            password: enteredPassword,
            email_confirm: true
          });
          if (createError) {
            console.error('[AUTH] createUser error:', createError.message);
            return Response.json({ success: false, message: 'Failed to create account: ' + createError.message }, { status: 500 });
          }
          authUserId = newAuthData.user.id;
        }

        // --- Step 4: Ensure profile record exists ---
        let profile = await db.getProfile(email);

        if (!profile) {
          profile = await db.createProfile({
            id: authUserId,
            email,
            role: 'student',
            full_name: studentRecord.full_name,
            department_id: studentRecord.department_id
          });

          await db.addNotification(
            "Account Activated",
            `Welcome ${studentRecord.full_name}! Your student portal account has been activated.`,
            profile.id
          );
          await db.addAuditLog(profile.id, 'AUTO_REGISTRATION', `Student ${studentRecord.full_name} auto-registered via index number login.`);
        }

        // --- Step 5: Retry sign-in with confirmed credentials ---
        const { error: retryError } = await supabase.auth.signInWithPassword({
          email,
          password: enteredPassword
        });

        if (retryError) {
          return Response.json({ success: false, message: 'Account provisioned. Please try logging in again.' }, { status: 400 });
        }

        return Response.json({
          success: true,
          user: profile,
          mustChangePassword: true
        });
      }

      // --- Normal login succeeded ---
      let profile = await db.getProfile(email);
      const studentRecord = await db.getStudentByEmail(email);
      const isDefault = (String(password).trim() === 'password123') || (studentRecord && (String(password).trim() === String(studentRecord.index_number).trim()));

      if (!profile) {
        profile = await db.createProfile({
          id: data.user.id,
          email,
          role: 'student',
          full_name: studentRecord ? studentRecord.full_name : 'New Student',
          department_id: studentRecord ? studentRecord.department_id : null
        });
      }

      return Response.json({
        success: true,
        user: profile,
        mustChangePassword: isDefault
      });

    } else {
      // --- Mock Authentication (no Supabase) ---
      const profile = await db.getProfile(email);

      if (!profile) {
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

      await db.addAuditLog(profile.id, 'LOGIN_SUCCESS', `${profile.full_name} (${profile.role}) logged in.`);

      const studentRecord = await db.getStudentByEmail(email);
      const isDefault = (password === 'password123') || (studentRecord && (password === studentRecord.index_number));

      const { password: _, ...userWithoutPassword } = profile;
      return Response.json({
        success: true,
        user: userWithoutPassword,
        mustChangePassword: isDefault
      });
    }
  } catch (err) {
    console.error('[AUTH] Login error:', err);
    return Response.json({ success: false, message: err.message || 'Internal Server Error' }, { status: 500 });
  }
}
