import { db } from '@/lib/db';
import { getServerSession } from '@/lib/session';

export async function PUT(req) {
  try {
    const session = getServerSession(req);
    if (!session || (session.role !== 'dept_admin' && session.role !== 'super_admin')) {
      return Response.json({ success: false, message: 'Unauthorized.' }, { status: 401 });
    }

    const { index_number, full_name, email, programme, level, faculty } = await req.json();

    if (!index_number) {
      return Response.json({ success: false, message: 'Student index number is required.' }, { status: 400 });
    }

    // 1. Fetch existing student
    const student = await db.getStudentByIndex(index_number);
    if (!student) {
      return Response.json({ success: false, message: 'Student not found.' }, { status: 404 });
    }

    // 2. Enforce department-level permission for department admins
    if (session.role === 'dept_admin' && student.department_id !== session.department_id) {
      return Response.json({ success: false, message: 'Access denied. You can only manage students within your department.' }, { status: 403 });
    }

    // 3. Prepare updates
    const updates = {};
    if (full_name) updates.full_name = full_name.trim();
    if (programme) updates.programme = programme.trim();
    if (level) updates.level = String(level).trim();
    if (faculty) updates.faculty = faculty.trim();

    if (email && email.toLowerCase().trim() !== student.email.toLowerCase()) {
      const targetEmail = email.toLowerCase().trim();
      // Validate email format
      const emailRegex = /^[a-zA-Z0-9._%+-]+@htu\.edu\.gh$/;
      if (!emailRegex.test(targetEmail)) {
        return Response.json({ success: false, message: 'Only official HTU institutional emails (@htu.edu.gh) are allowed.' }, { status: 400 });
      }

      // Check if email already in use
      const existingStudent = await db.getStudentByEmail(targetEmail);
      if (existingStudent && existingStudent.index_number !== index_number) {
        return Response.json({ success: false, message: 'Email address is already in use by another student.' }, { status: 400 });
      }

      const existingProfile = await db.getProfile(targetEmail);
      if (existingProfile && existingProfile.email.toLowerCase() !== student.email.toLowerCase()) {
        return Response.json({ success: false, message: 'Email address is already registered to a profile.' }, { status: 400 });
      }

      updates.email = targetEmail;
    }

    if (Object.keys(updates).length === 0) {
      return Response.json({ success: false, message: 'No fields to update.' }, { status: 400 });
    }

    // 4. Perform update
    const updatedStudent = await db.updateStudent(index_number, updates);

    // 5. Add audit log
    await db.addAuditLog(
      session.id,
      'UPDATE_STUDENT',
      `Updated student index ${index_number}: ${JSON.stringify(updates)}`
    );

    // 6. Notify student if they have an active profile
    const profile = await db.getProfile(updates.email || student.email);
    if (profile) {
      await db.addNotification(
        'Account Information Updated',
        `Your student profile details have been updated by the department administrator.`,
        profile.id,
        null
      );
    }

    return Response.json({ success: true, student: updatedStudent });
  } catch (err) {
    console.error("Update Student API Error:", err);
    return Response.json({ success: false, message: err.message || 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(req) {
  try {
    const session = getServerSession(req);
    if (!session || (session.role !== 'dept_admin' && session.role !== 'super_admin')) {
      return Response.json({ success: false, message: 'Unauthorized.' }, { status: 401 });
    }

    const { index_number } = await req.json();

    if (!index_number) {
      return Response.json({ success: false, message: 'Student index number is required.' }, { status: 400 });
    }

    // 1. Fetch student to verify department
    const student = await db.getStudentByIndex(index_number);
    if (!student) {
      return Response.json({ success: false, message: 'Student not found.' }, { status: 404 });
    }

    // 2. Enforce department-level permission for department admins
    if (session.role === 'dept_admin' && student.department_id !== session.department_id) {
      return Response.json({ success: false, message: 'Access denied. You can only manage students within your department.' }, { status: 403 });
    }

    // 3. Perform delete
    await db.deleteStudent(index_number, student.email);

    // 4. Add audit log
    await db.addAuditLog(
      session.id,
      'DELETE_STUDENT',
      `Deleted student record for ${student.full_name} (${student.email}) index ${index_number}`
    );

    return Response.json({ success: true, message: 'Student record deleted successfully.' });
  } catch (err) {
    console.error("Delete Student API Error:", err);
    return Response.json({ success: false, message: err.message || 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const session = getServerSession(req);
    if (!session || (session.role !== 'dept_admin' && session.role !== 'super_admin')) {
      return Response.json({ success: false, message: 'Unauthorized.' }, { status: 401 });
    }

    const { action, email, password } = await req.json();

    if (action !== 'reset-password') {
      return Response.json({ success: false, message: 'Invalid action. Only "reset-password" is supported.' }, { status: 400 });
    }

    if (!email || !password) {
      return Response.json({ success: false, message: 'Email and new password are required.' }, { status: 400 });
    }

    if (password.length < 6) {
      return Response.json({ success: false, message: 'Password must be at least 6 characters long.' }, { status: 400 });
    }

    // 1. Fetch student to verify department
    const student = await db.getStudentByEmail(email);
    if (!student) {
      return Response.json({ success: false, message: 'Student record not found.' }, { status: 404 });
    }

    // 2. Enforce department-level permission for department admins
    if (session.role === 'dept_admin' && student.department_id !== session.department_id) {
      return Response.json({ success: false, message: 'Access denied. You can only manage students within your department.' }, { status: 403 });
    }

    // 3. Perform password reset
    await db.resetStudentPassword(email.toLowerCase().trim(), password);

    // 3b. Reset password_changed flag so student is prompted to change on next login
    const profileForReset = await db.getProfile(email.toLowerCase().trim());
    if (profileForReset) {
      await db.resetPasswordChangedFlag(profileForReset.id);
    }

    // 4. Add audit log
    await db.addAuditLog(
      session.id,
      'RESET_STUDENT_PASSWORD',
      `Reset password for student ${student.full_name} (${email})`
    );

    // 5. Notify student
    const profile = await db.getProfile(email);
    if (profile) {
      await db.addNotification(
        'Password Reset by Administrator',
        `Your password has been reset by the department administrator. Please use the temporary credentials to log in and change your password.`,
        profile.id,
        null
      );
    }

    return Response.json({ success: true, message: 'Student password reset successfully.' });
  } catch (err) {
    console.error("Reset Student Password API Error:", err);
    return Response.json({ success: false, message: err.message || 'Internal Server Error' }, { status: 500 });
  }
}
