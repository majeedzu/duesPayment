import { db } from '@/lib/db';
import { paystack } from '@/lib/paystack';
import { getServerSession } from '@/lib/session';

export async function POST(req) {
  try {
    const session = getServerSession(req);
    if (!session || session.role !== 'student') {
      return Response.json({ success: false, message: 'Unauthorized.' }, { status: 401 });
    }

    const { indexNumber, email, amount, departmentId } = await req.json();

    if (!indexNumber || !email || !amount) {
      return Response.json({ success: false, message: 'Missing required payment fields.' }, { status: 400 });
    }

    // Prevent duplicate payments
    const existingPayments = await db.getPaymentsByStudent(indexNumber);
    const alreadyPaid = existingPayments.some(p => p.status === 'success');
    if (alreadyPaid) {
      return Response.json({ success: false, message: 'Dues already paid for this academic period.' }, { status: 400 });
    }

    // Generate unique reference
    const reference = `HTU-${indexNumber}-${Date.now()}`;

    // Initialize with Paystack (real or mock)
    const paystackRes = await paystack.initialize(email, parseFloat(amount), reference);

    // Save pending payment record
    await db.initializePayment({
      student_index_number: indexNumber,
      amount: parseFloat(amount),
      paystack_reference: reference,
      status: 'pending',
      receipt_id: null,
      payment_date: null,
    });

    await db.addAuditLog(session.id, 'PAYMENT_INITIATED', `Student ${indexNumber} initiated payment of GHS ${amount}. Ref: ${reference}`);

    return Response.json({
      success: true,
      authorizationUrl: paystackRes.authorization_url,
      reference: paystackRes.reference,
      isMock: paystackRes.isMock
    });
  } catch (err) {
    console.error("Payment Init Error:", err);
    return Response.json({ success: false, message: err.message || 'Internal Server Error' }, { status: 500 });
  }
}
