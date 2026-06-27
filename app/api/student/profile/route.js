import { db } from '@/lib/db';
import { getServerSession } from '@/lib/session';

export async function GET(req) {
  try {
    const session = getServerSession(req);
    if (!session || session.role !== 'student') {
      return Response.json({ success: false, message: 'Unauthorized access.' }, { status: 401 });
    }

    const email = session.email;
    const profile = await db.getProfile(email);
    const student = await db.getStudentByEmail(email);

    if (!student) {
      return Response.json({ success: false, message: 'Student records not found in database.' }, { status: 404 });
    }

    const department = await db.getDepartment(student.department_id);
    const payments = await db.getPaymentsByStudent(student.index_number);
    const notifications = await db.getNotifications(profile?.id, 'student');

    return Response.json({
      success: true,
      data: {
        profile,
        student,
        department,
        payments,
        notifications
      }
    });
  } catch (err) {
    console.error("Student Profile API Error:", err);
    return Response.json({ success: false, message: err.message || 'Internal Server Error' }, { status: 500 });
  }
}
