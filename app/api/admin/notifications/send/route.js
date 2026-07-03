import { db } from '@/lib/db';
import { getServerSession } from '@/lib/session';

export async function POST(req) {
  try {
    const session = getServerSession(req);
    if (!session || (session.role !== 'dept_admin' && session.role !== 'super_admin')) {
      return Response.json({ success: false, message: 'Unauthorized.' }, { status: 401 });
    }

    const departmentId = session.department_id;
    // Super admins have no fixed department — they can't send dept-level notifications here
    if (!departmentId) {
      return Response.json({ success: false, message: 'No department assigned. Use the Super Admin broadcast panel to send notifications.' }, { status: 400 });
    }

    const body = await req.json();
    const { title, message } = body;

    if (!title || !message) {
      return Response.json({ success: false, message: 'Title and message are required.' }, { status: 400 });
    }

    await db.addNotificationToStudentsOfDepartment(title, message, departmentId);

    return Response.json({
      success: true,
      message: 'Broadcast notification sent successfully to all department students.'
    });
  } catch (err) {
    console.error("Admin Notification Send Error:", err);
    return Response.json({ success: false, message: err.message || 'Internal Server Error' }, { status: 500 });
  }
}
