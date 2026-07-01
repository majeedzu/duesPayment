import { db } from '@/lib/db';

// Mock webhook endpoint — called by the checkout simulator page
export async function POST(req) {
  try {
    const { reference, status, amount } = await req.json();

    if (!reference || !status) {
      return Response.json({ success: false, message: 'Missing reference or status.' }, { status: 400 });
    }

    const existing = await db.getPaymentByRef(reference);
    if (!existing) {
      return Response.json({ success: false, message: 'Payment reference not found.' }, { status: 404 });
    }

    if (existing.status === 'success') {
      return Response.json({ success: true, message: 'Already processed.' });
    }

    let receiptId = null;
    if (status === 'success') {
      receiptId = `REC-HTU-${Date.now().toString().slice(-6)}-${reference.slice(-5).toUpperCase()}`;
    }

    const updated = await db.updatePaymentStatus(reference, status, receiptId);

    if (status === 'success') {
      const student = await db.getStudentByIndex(existing.student_index_number);
      if (student) {
        const profile = await db.getProfile(student.email);
        if (profile) {
          await db.addNotification(
            'Payment Confirmed ✓',
            `Your dues payment of GHS ${parseFloat(amount).toFixed(2)} for ${existing.semester || 'Both Semesters'} was successful! Receipt ID: ${receiptId}`,
            profile.id,
            null
          );
        }
        await db.addNotificationToAdminOfDepartment(
            'New Payment Received',
            `${student.full_name} (${student.index_number}) paid departmental dues for ${existing.semester || 'Both Semesters'}. Ref: ${reference}`,
            student.department_id
          );
      }
      await db.addAuditLog(null, 'PAYMENT_CONFIRMED_MOCK', `Mock payment confirmed. Ref: ${reference}, Receipt: ${receiptId}`);
    } else {
      const student = await db.getStudentByIndex(existing.student_index_number);
      if (student) {
        const profile = await db.getProfile(student.email);
        if (profile) {
          await db.addNotification(
            'Payment Failed',
            `Your dues payment attempt was unsuccessful. Please try again.`,
            profile.id,
            null
          );
        }
      }
    }

    return Response.json({ success: true, payment: updated });
  } catch (err) {
    console.error("Mock Webhook Error:", err);
    return Response.json({ success: false, message: err.message || 'Internal Server Error' }, { status: 500 });
  }
}
