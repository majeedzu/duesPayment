import { db } from '@/lib/db';
import { getServerSession } from '@/lib/session';

export async function GET(req) {
  try {
    const session = getServerSession(req);
    if (!session || (session.role !== 'dept_admin' && session.role !== 'super_admin')) {
      return Response.json({ success: false, message: 'Unauthorized.' }, { status: 401 });
    }

    const departmentId = session.department_id;
    if (!departmentId) {
      return Response.json({ success: false, message: 'No department assigned to this admin.' }, { status: 400 });
    }

    const department = await db.getDepartment(departmentId);
    const students = await db.getStudentsByDepartment(departmentId);
    const payments = await db.getPaymentsByDepartment(departmentId);
    const notifications = await db.getNotifications(session.id, 'dept_admin');

    const paidStudentIndexes = new Set(
      payments.filter(p => p.status === 'success').map(p => p.student_index_number)
    );

    const paidCount = students.filter(s => paidStudentIndexes.has(s.index_number)).length;
    const unpaidCount = students.length - paidCount;
    const totalRevenue = payments
      .filter(p => p.status === 'success')
      .reduce((sum, p) => sum + parseFloat(p.amount), 0);

    return Response.json({
      success: true,
      data: {
        department,
        stats: {
          totalStudents: students.length,
          paidCount,
          unpaidCount,
          totalRevenue
        },
        students: students.map(s => ({
          ...s,
          isPaid: paidStudentIndexes.has(s.index_number)
        })),
        payments,
        notifications
      }
    });
  } catch (err) {
    console.error("Admin Stats Error:", err);
    return Response.json({ success: false, message: err.message || 'Internal Server Error' }, { status: 500 });
  }
}
