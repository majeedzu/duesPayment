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

    // Calculate successful payments sum by student index
    const studentPayments = {};
    payments.forEach(p => {
      if (p.status === 'success') {
        const index = p.student_index_number;
        if (!studentPayments[index]) studentPayments[index] = 0;
        studentPayments[index] += parseFloat(p.amount);
      }
    });

    const baselineDues = parseFloat(department.dues_amount);

    const studentPaymentStatus = {};
    students.forEach(s => {
      const idx = s.index_number;
      const totalPaid = studentPayments[idx] || 0;

      if (totalPaid >= baselineDues) {
        studentPaymentStatus[idx] = 'Fully Paid';
      } else if (totalPaid > 0) {
        studentPaymentStatus[idx] = 'Partially Paid';
      } else {
        studentPaymentStatus[idx] = 'Unpaid';
      }
    });

    const paidCount = students.filter(s => studentPaymentStatus[s.index_number] === 'Fully Paid').length;
    const partiallyPaidCount = students.filter(s => studentPaymentStatus[s.index_number] === 'Partially Paid').length;
    const unpaidCount = students.length - paidCount - partiallyPaidCount;

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
          partiallyPaidCount,
          unpaidCount,
          totalRevenue
        },
        students: students.map(s => ({
          ...s,
          isPaid: studentPaymentStatus[s.index_number] === 'Fully Paid',
          paymentStatus: studentPaymentStatus[s.index_number]
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
