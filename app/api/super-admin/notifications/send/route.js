import { db } from '@/lib/db';
import { getServerSession } from '@/lib/session';

export async function POST(req) {
  try {
    const session = getServerSession(req);
    if (!session || session.role !== 'super_admin') {
      return Response.json({ success: false, message: 'Unauthorized.' }, { status: 401 });
    }

    const body = await req.json();
    const { title, message } = body;

    if (!title || !message) {
      return Response.json({ success: false, message: 'Title and message are required.' }, { status: 400 });
    }

    await db.addNotificationToAllAdmins(title, message);

    return Response.json({
      success: true,
      message: 'Broadcast notification sent successfully to all department administrators.'
    });
  } catch (err) {
    console.error("Super Admin Notification Send Error:", err);
    return Response.json({ success: false, message: err.message || 'Internal Server Error' }, { status: 500 });
  }
}
