import { db } from '@/lib/db';

export async function GET(req, { params }) {
  try {
    const { id } = await params;

    if (!id) {
      return Response.json({ success: false, message: 'Receipt ID is required.' }, { status: 400 });
    }

    // Try by receipt_id first, then fall back to paystack_reference
    let payment = await db.verifyReceipt(id);

    if (!payment) {
      // Also check by paystack_reference (for QR codes that encode the reference)
      payment = await db.getPaymentByRef(id);
      if (payment) {
        // Enrich with student data like verifyReceipt does
        const studentData = await db.getStudentByIndex(payment.student_index_number);
        payment = { ...payment, students: studentData || null };
      }
    }

    if (!payment || payment.status !== 'success') {
      return Response.json(
        { success: false, message: 'Receipt not found or payment not confirmed.' },
        { status: 404 }
      );
    }

    return Response.json({ success: true, data: payment });
  } catch (err) {
    console.error("Receipt Verify API Error:", err);
    return Response.json({ success: false, message: err.message || 'Internal Server Error' }, { status: 500 });
  }
}
