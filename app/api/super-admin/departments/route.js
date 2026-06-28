import { db } from '@/lib/db';
import { getServerSession } from '@/lib/session';

export async function POST(req) {
  try {
    const session = getServerSession(req);
    if (!session || session.role !== 'super_admin') {
      return Response.json({ success: false, message: 'Unauthorized.' }, { status: 401 });
    }

    const { action, id, name, faculty, duesAmount } = await req.json();

    if (!action || (action !== 'create' && action !== 'update' && action !== 'edit')) {
      return Response.json({ success: false, message: 'Invalid action. Use "create" or "update".' }, { status: 400 });
    }

    if (!name || !faculty || duesAmount === undefined) {
      return Response.json({ success: false, message: 'Name, faculty, and dues amount are required.' }, { status: 400 });
    }

    if (action === 'create') {
      const newDept = await db.createDepartment({
        name: name.trim(),
        faculty: faculty.trim(),
        dues_amount: parseFloat(duesAmount)
      });

      await db.addAuditLog(
        session.id,
        'CREATE_DEPARTMENT',
        `Created department: ${name} under faculty ${faculty} with dues GHS ${duesAmount}`
      );

      return Response.json({ success: true, department: newDept });
    }

    if (action === 'update' || action === 'edit') {
      if (!id) {
        return Response.json({ success: false, message: 'Department ID is required for updates.' }, { status: 400 });
      }

      const updatedDept = await db.updateDepartment(
        id,
        name.trim(),
        faculty.trim(),
        parseFloat(duesAmount)
      );

      if (!updatedDept) {
        return Response.json({ success: false, message: 'Department not found.' }, { status: 404 });
      }

      await db.addAuditLog(
        session.id,
        'UPDATE_DEPARTMENT',
        `Updated department ID ${id}: ${name}, dues GHS ${duesAmount}`
      );

      return Response.json({ success: true, department: updatedDept });
    }
  } catch (err) {
    console.error("Super Admin Departments API Error:", err);
    return Response.json({ success: false, message: err.message || 'Internal Server Error' }, { status: 500 });
  }
}
