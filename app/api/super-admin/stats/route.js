import { db } from '@/lib/db';
import { getServerSession } from '@/lib/session';

export async function GET(req) {
  try {
    const session = getServerSession(req);
    if (!session || session.role !== 'super_admin') {
      return Response.json({ success: false, message: 'Unauthorized. Super Admin access required.' }, { status: 401 });
    }

    const departments = await db.getDepartments();
    const students = await db.getAllStudents();
    const payments = await db.getAllPayments();
    const admins = await db.getAdmins();
    const auditLogs = await db.getAuditLogs();
    const notifications = await db.getNotifications(session.id, 'super_admin');

    // Aggregate statistics
    const totalStudents = students.length;
    const successfulPayments = payments.filter(p => p.status === 'success');
    const totalRevenue = successfulPayments.reduce((sum, p) => sum + parseFloat(p.amount), 0);
    const paidStudentIndexes = new Set(successfulPayments.map(p => p.student_index_number));
    const paidCount = students.filter(s => paidStudentIndexes.has(s.index_number)).length;
    const unpaidCount = totalStudents - paidCount;

    // Department-wise breakdown
    const departmentBreakdown = departments.map(dept => {
      const deptStudents = students.filter(s => s.department_id === dept.id);
      const deptStudentIndexes = new Set(deptStudents.map(s => s.index_number));
      
      const deptPayments = successfulPayments.filter(p => deptStudentIndexes.has(p.student_index_number));
      const deptRevenue = deptPayments.reduce((sum, p) => sum + parseFloat(p.amount), 0);
      const deptPaidCount = deptStudents.filter(s => paidStudentIndexes.has(s.index_number)).length;
      
      return {
        id: dept.id,
        name: dept.name,
        faculty: dept.faculty,
        duesAmount: dept.dues_amount,
        totalStudents: deptStudents.length,
        paidCount: deptPaidCount,
        unpaidCount: deptStudents.length - deptPaidCount,
        revenue: deptRevenue
      };
    });

    return Response.json({
      success: true,
      data: {
        stats: {
          totalStudents,
          paidCount,
          unpaidCount,
          totalRevenue,
          totalDepartments: departments.length,
          totalAdmins: admins.length
        },
        departments: departmentBreakdown,
        admins: admins.map(a => ({
          id: a.id,
          email: a.email,
          full_name: a.full_name,
          role: a.role,
          department_id: a.department_id
        })),
        payments: payments.slice(0, 50), // Send last 50 transactions
        auditLogs: auditLogs, // Full log history — UI handles pagination
        notifications
      }
    });
  } catch (err) {
    console.error("Super Admin Stats Error:", err);
    return Response.json({ success: false, message: err.message || 'Internal Server Error' }, { status: 500 });
  }
}
