import { db } from '@/lib/db';
import { getServerSession } from '@/lib/session';

export async function POST(req) {
  try {
    const session = getServerSession(req);
    if (!session || session.role !== 'student') {
      return Response.json({ success: false, message: 'Unauthorized access.' }, { status: 401 });
    }

    const body = await req.json();
    const { id, all } = body;

    if (all) {
      const profile = await db.getProfile(session.email);
      if (profile) {
        const notifications = await db.getNotifications(profile.id, 'student');
        for (const notif of notifications) {
          if (!notif.is_read) {
            await db.markNotificationRead(notif.id);
          }
        }
      }
      return Response.json({ success: true, message: 'All notifications marked as read.' });
    }

    if (!id) {
      return Response.json({ success: false, message: 'Notification ID is required.' }, { status: 400 });
    }

    await db.markNotificationRead(id);
    return Response.json({ success: true, message: 'Notification marked as read.' });
  } catch (err) {
    console.error("Mark Read Notification API Error:", err);
    return Response.json({ success: false, message: err.message || 'Internal Server Error' }, { status: 500 });
  }
}
