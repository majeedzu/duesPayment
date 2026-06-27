import { db } from '@/lib/db';
import { getServerSession } from '@/lib/session';

export async function POST(req) {
  try {
    const session = getServerSession(req);
    if (!session || session.role !== 'super_admin') {
      return Response.json({ success: false, message: 'Unauthorized.' }, { status: 401 });
    }

    const { action, id, email, full_name, department_id } = await req.json();

    if (!action || (action !== 'create' && action !== 'delete')) {
      return Response.json({ success: false, message: 'Invalid action. Use "create" or "delete".' }, { status: 400 });
    }

    if (action === 'create') {
      if (!email || !full_name || !department_id) {
        return Response.json({ success: false, message: 'Email, full name, and department ID are required.' }, { status: 400 });
      }

      // Check if email already exists
      const existing = await db.getProfile(email);
      if (existing) {
        return Response.json({ success: false, message: 'Email is already registered.' }, { status: 400 });
      }

      const newAdmin = await db.createAdmin({
        email: email.toLowerCase().trim(),
        full_name: full_name.trim(),
        role: 'dept_admin',
        department_id: department_id
      });

      await db.addAuditLog(
        session.id,
        'CREATE_ADMIN',
        `Created Admin account for ${full_name} (${email}) assigned to department ID ${department_id}`
      );

      return Response.json({ success: true, admin: newAdmin });
    }

    if (action === 'delete') {
      if (!id) {
        return Response.json({ success: false, message: 'Admin ID is required for deletion.' }, { status: 400 });
      }

      // Prevent self-deletion
      if (id === session.id) {
        return Response.json({ success: false, message: 'Cannot delete your own super admin account.' }, { status: 400 });
      }

      const result = await db.deleteAdmin(id);

      await db.addAuditLog(
        session.id,
        'DELETE_ADMIN',
        `Removed Admin profile ID ${id}`
      );

      return Response.json({ success: true });
    }
  } catch (err) {
    console.error("Super Admin Admins API Error:", err);
    return Response.json({ success: false, message: err.message || 'Internal Server Error' }, { status: 500 });
  }
}
