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
      console.log('[LOGIN] Attempting signInWithPassword for:', email);
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });

      if (error) {
        console.log('[LOGIN] signInWithPassword failed:', error.message);

        // --- Step 2: Check if this is a CSV-imported student ---
        const studentRecord = await db.getStudentByEmail(email);
        console.log('[LOGIN] Student record found:', !!studentRecord, studentRecord ? `index=${studentRecord.index_number}` : '');

        if (!studentRecord) {
          return Response.json({ success: false, message: 'Invalid login credentials.' }, { status: 400 });
        }

        // Normalize comparison — strip leading zeros from both sides so
        // 0325080328 matches 325080328 (CSV parsing may strip leading zeros)
        const normalizeId = (s) => String(s).trim().replace(/^0+(\d)/, '$1');
        const indexNum = String(studentRecord.index_number).trim();
        const enteredPassword = String(password).trim();

        const matches = enteredPassword === indexNum ||
                        normalizeId(enteredPassword) === normalizeId(indexNum);

        console.log('[LOGIN] Password match check:', JSON.stringify(enteredPassword), '===', JSON.stringify(indexNum), '->', matches);

        if (!matches) {
          return Response.json({ success: false, message: 'Invalid login credentials.' }, { status: 400 });
        }

        // --- Step 3: Auto-provision auth account via admin client ---
        const adminClient = getSupabaseAdmin();
        console.log('[LOGIN] Admin client available:', !!adminClient);

        if (!adminClient) {
          return Response.json({
            success: false,
            message: 'Server configuration error. Please contact the system administrator.'
          }, { status: 500 });
        }

        // Check if Supabase auth user already exists for this email
        const { data: usersData, error: listError } = await adminClient.auth.admin.listUsers({ perPage: 1000 });
        if (listError) {
          console.error('[LOGIN] listUsers error:', listError.message);
        }
        const existingAuthUser = usersData?.users?.find(u => u.email?.toLowerCase() === email.toLowerCase());
        console.log('[LOGIN] Existing auth user:', !!existingAuthUser, existingAuthUser?.id);

        let authUserId;

        if (existingAuthUser) {
          // Update password + confirm email so they can log in
          const { error: updateError } = await adminClient.auth.admin.updateUserById(
            existingAuthUser.id,
            { password: enteredPassword, email_confirm: true }
          );
          if (updateError) {
            console.error('[LOGIN] updateUserById error:', updateError.message);
            return Response.json({ success: false, message: 'Failed to activate account: ' + updateError.message }, { status: 500 });
          }
          authUserId = existingAuthUser.id;
          console.log('[LOGIN] Updated existing auth user:', authUserId);
        } else {
          // Create a brand-new confirmed auth user
          const { data: newAuthData, error: createError } = await adminClient.auth.admin.createUser({
            email,
            password: enteredPassword,
            email_confirm: true
          });
          if (createError) {
            console.error('[LOGIN] createUser error:', createError.message);
            return Response.json({ success: false, message: 'Failed to create account: ' + createError.message }, { status: 500 });
          }
          authUserId = newAuthData.user.id;
          console.log('[LOGIN] Created new auth user:', authUserId);
        }

        // --- Step 4: Ensure profile record exists ---
        let profile = await db.getProfile(email);
        console.log('[LOGIN] Existing profile:', !!profile);

        if (!profile) {
          profile = await db.createProfile({
            id: authUserId,
            email,
            role: 'student',
            full_name: studentRecord.full_name,
            department_id: studentRecord.department_id
          });
          console.log('[LOGIN] Created profile:', profile?.id);

          await db.addNotification(
            "Account Activated",
            `Welcome ${studentRecord.full_name}! Your student portal account has been activated.`,
            profile.id
          );
          await db.addAuditLog(profile.id, 'AUTO_REGISTRATION', `Student ${studentRecord.full_name} auto-registered via index number login.`);
        }

        // --- Step 5: Sign in with the now-confirmed credentials ---
        console.log('[LOGIN] Retrying signInWithPassword after provisioning...');
        const { error: retryError } = await supabase.auth.signInWithPassword({
          email,
          password: enteredPassword
        });

        if (retryError) {
          console.error('[LOGIN] Retry login failed:', retryError.message);
          return Response.json({ success: false, message: 'Account provisioned. Please try logging in again.' }, { status: 400 });
        }

        console.log('[LOGIN] Provisioned login SUCCESS for:', email);
        return Response.json({
          success: true,
          user: profile,
          mustChangePassword: true
        });
      }

      // --- Normal login succeeded ---
      console.log('[LOGIN] Normal login SUCCESS for:', email);
      let profile = await db.getProfile(email);
      const studentRecord = await db.getStudentByEmail(email);
      const isDefault = studentRecord && (String(password).trim() === String(studentRecord.index_number).trim());

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
      const isDefault = studentRecord && (password === studentRecord.index_number);

      const { password: _, ...userWithoutPassword } = profile;
      return Response.json({
        success: true,
        user: userWithoutPassword,
        mustChangePassword: isDefault
      });
    }
  } catch (err) {
    console.error('[LOGIN] Unexpected error:', err);
    return Response.json({ success: false, message: err.message || 'Internal Server Error' }, { status: 500 });
  }
}
