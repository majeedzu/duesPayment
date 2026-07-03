import { db } from '@/lib/db';

// Public endpoint — no auth required. Returns department names, faculties, and dues amounts.
export async function GET() {
  try {
    const departments = await db.getDepartments();
    return Response.json({ success: true, departments });
  } catch (err) {
    console.error("Public Departments API Error:", err);
    return Response.json({ success: false, message: 'Failed to load departments.' }, { status: 500 });
  }
}
