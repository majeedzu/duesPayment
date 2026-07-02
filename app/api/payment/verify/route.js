import { db } from '@/lib/db';
import { isSupabaseConfigured } from '@/lib/supabase';

export async function POST(req) {
  try {
    const { reference } = await req.json();

    if (!reference) {
      return Response.json({ success: false, message: 'Reference is required.' }, { status: 400 });
    }

    const existing = await db.getPaymentByRef(reference);
    if (!existing) {
      return Response.json({ success: false, message: 'Reference not found.' }, { status: 404 });
    }

    if (existing.status === 'success') {
      return Response.json({ success: true, message: 'Payment is already marked as success.', status: 'success' });
    }

    // Verify with Paystack (or mock if local/unconfigured)
    let isSuccess = false;
    let amountPaid = existing.amount;

    if (isSupabaseConfigured() && process.env.PAYSTACK_SECRET_KEY) {
      // Direct API verification with Paystack
      try {
        const paystackRes = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
          headers: {
            Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
          },
        });
        const paystackData = await paystackRes.json();
        if (paystackData.status && paystackData.data.status === 'success') {
          isSuccess = true;
          amountPaid = paystackData.data.amount / 100;
        }
      } catch (err) {
        console.error("Paystack API Verification Error:", err);
      }
    } else {
      // Mock mode fallback: treat verification checks as successful to let users verify mock checkouts
      isSuccess = true;
    }

    if (isSuccess) {
      const receiptId = `REC-HTU-${Date.now().toString().slice(-6)}-${reference.slice(-5).toUpperCase()}`;
      await db.updatePaymentStatus(reference, 'success', receiptId);

      // Notify student
      const student = await db.getStudentByIndex(existing.student_index_number);
      if (student) {
        const profile = await db.getProfile(student.email);
        if (profile) {
          await db.addNotification(
            'Payment Confirmed ✓',
            `Your departmental dues payment of GHS ${parseFloat(amountPaid).toFixed(2)} for ${existing.semester || 'Academic Year'} has been verified. Receipt: ${receiptId}`,
            profile.id,
            null
          );
        }
        if (student.department_id) {
          await db.addNotificationToAdminOfDepartment(
            'New Payment Received',
            `Student ${student.full_name} (${student.index_number}) has paid dues for ${existing.semester || 'Academic Year'}. Ref: ${reference}`,
            student.department_id
          );
        }
      }

      await db.addAuditLog(null, 'PAYMENT_VERIFIED_MANUALLY', `Manual check confirmed payment. Ref: ${reference}`);
      return Response.json({ success: true, message: 'Payment verified successfully.', status: 'success' });
    } else {
      await db.updatePaymentStatus(reference, 'failed');
      return Response.json({ success: true, message: 'Payment verification failed. Transaction was not successful.', status: 'failed' });
    }

  } catch (err) {
    console.error("Manual Payment Verification Error:", err);
    return Response.json({ success: false, message: 'Internal Server Error' }, { status: 500 });
  }
}
