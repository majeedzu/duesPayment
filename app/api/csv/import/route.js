import { db } from '@/lib/db';
import { getServerSession } from '@/lib/session';

export async function POST(req) {
  try {
    const session = getServerSession(req);
    if (!session || (session.role !== 'dept_admin' && session.role !== 'super_admin')) {
      return Response.json({ success: false, message: 'Unauthorized.' }, { status: 401 });
    }

    const { students, departmentId } = await req.json();

    if (!students || !Array.isArray(students) || students.length === 0) {
      return Response.json({ success: false, message: 'No student records provided.' }, { status: 400 });
    }

    if (!departmentId) {
      return Response.json({ success: false, message: 'Department ID is required.' }, { status: 400 });
    }

    // Validate required fields in each row
    const required = ['index_number', 'full_name', 'email', 'programme', 'level', 'faculty'];
    const errors = [];
    const valid = [];

    students.forEach((student, i) => {
      const missing = required.filter(f => !student[f] || !String(student[f]).trim());
      if (missing.length > 0) {
        errors.push(`Row ${i + 1}: Missing fields — ${missing.join(', ')}`);
        return;
      }

      const emailRegex = /^[a-zA-Z0-9._%+-]+@htu\.edu\.gh$/;
      if (!emailRegex.test(String(student.email).toLowerCase())) {
        errors.push(`Row ${i + 1}: Invalid email format — ${student.email}`);
        return;
      }

      valid.push({
        index_number: String(student.index_number).trim(),
        full_name: String(student.full_name).trim(),
        email: String(student.email).toLowerCase().trim(),
        programme: String(student.programme).trim(),
        level: String(student.level).trim(),
        faculty: String(student.faculty).trim(),
        department_id: departmentId
      });
    });

    if (valid.length === 0) {
      return Response.json({ success: false, message: 'No valid records to import.', errors }, { status: 400 });
    }

    const imported = await db.importStudentsCSV(valid);

    await db.addAuditLog(
      session.id,
      'CSV_IMPORT',
      `${session.full_name} imported ${imported.length} students into department ${departmentId}.`
    );

    await db.addNotification(
      'CSV Import Complete',
      `${imported.length} student record(s) were successfully imported. ${errors.length} row(s) skipped.`,
      null,
      'dept_admin'
    );

    return Response.json({
      success: true,
      imported: imported.length,
      skipped: errors.length,
      errors
    });
  } catch (err) {
    console.error("CSV Import Error:", err);
    return Response.json({ success: false, message: err.message || 'Internal Server Error' }, { status: 500 });
  }
}
