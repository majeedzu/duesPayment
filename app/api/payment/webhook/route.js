import { db } from '@/lib/db';
import { paystack } from '@/lib/paystack';

// Real Paystack Webhook handler
export async function POST(req) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get('x-paystack-signature');

    // Verify webhook authenticity
    if (!paystack.verifyWebhookSignature(signature, rawBody)) {
      return Response.json({ message: 'Invalid signature.' }, { status: 401 });
    }

    const event = JSON.parse(rawBody);

    if (event.event === 'charge.success') {
      const { reference, amount, status } = event.data;

      // Idempotency: skip if already processed
      const existing = await db.getPaymentByRef(reference);
      if (!existing) {
        return Response.json({ message: 'Reference not found.' }, { status: 404 });
      }
      if (existing.status === 'success') {
        return Response.json({ message: 'Already processed.' }, { status: 200 });
      }

      const receiptId = `REC-HTU-${Date.now().toString().slice(-6)}-${reference.slice(-5).toUpperCase()}`;

      await db.updatePaymentStatus(reference, 'success', receiptId);

      // Notify student
      const student = await db.getStudentByIndex(existing.student_index_number);
      if (student) {
        const profile = await db.getProfile(student.email);
        if (profile) {
          await db.addNotification(
            'Payment Confirmed ✓',
            `Your departmental dues payment of GHS ${(amount / 100).toFixed(2)} for ${existing.semester || 'Both Semesters'} has been verified. Receipt: ${receiptId}`,
            profile.id,
            null
          );
        }
        // Notify only the admin of the student's specific department
        if (student.department_id) {
          await db.addNotificationToAdminOfDepartment(
            'New Payment Received',
            `Student ${student.full_name} (${student.index_number}) has paid dues for ${existing.semester || 'Both Semesters'}. Ref: ${reference}`,
            student.department_id
          );
        }
      }

      await db.addAuditLog(null, 'PAYMENT_CONFIRMED_WEBHOOK', `Paystack webhook confirmed payment. Ref: ${reference}`);
    }

    return Response.json({ received: true }, { status: 200 });
  } catch (err) {
    console.error("Webhook Error:", err);
    return Response.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
