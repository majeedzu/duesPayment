import { db } from '@/lib/db';
import { paystack } from '@/lib/paystack';
import { getServerSession } from '@/lib/session';

export async function POST(req) {
  try {
    const session = getServerSession(req);
    if (!session || session.role !== 'student') {
      return Response.json({ success: false, message: 'Unauthorized.' }, { status: 401 });
    }

    const { indexNumber, email, amount, departmentId, semester = 'Both Semesters', academicYear = '2025/2026' } = await req.json();

    if (!indexNumber || !email) {
      return Response.json({ success: false, message: 'Missing required payment fields.' }, { status: 400 });
    }

    // Retrieve student and department to get the dues baseline
    const student = await db.getStudentByIndex(indexNumber);
    if (!student) {
      return Response.json({ success: false, message: 'Student records not found.' }, { status: 404 });
    }
    const department = await db.getDepartment(student.department_id);
    if (!department) {
      return Response.json({ success: false, message: 'Department records not found.' }, { status: 404 });
    }

    const baselineDues = parseFloat(department.dues_amount);
    let targetAmount = baselineDues;
    if (semester === '1st Semester' || semester === '2nd Semester') {
      targetAmount = baselineDues / 2;
    }

    // Prevent duplicate payments
    const existingPayments = await db.getPaymentsByStudent(indexNumber);
    const successfulPayments = existingPayments.filter(p => p.status === 'success' && (p.academic_year === academicYear || !p.academic_year));

    // Determine what has been paid already
    const hasPaidFull = successfulPayments.some(p => p.semester === 'Both Semesters' || !p.semester);
    const hasPaidFirst = successfulPayments.some(p => p.semester === '1st Semester');
    const hasPaidSecond = successfulPayments.some(p => p.semester === '2nd Semester');

    if (hasPaidFull) {
      return Response.json({ success: false, message: 'Dues are already fully paid for this academic period.' }, { status: 400 });
    }

    if (semester === 'Both Semesters' && (hasPaidFirst || hasPaidSecond)) {
      return Response.json({ success: false, message: 'You have already paid for a semester. Please pay for the outstanding semester individually.' }, { status: 400 });
    }

    if (semester === '1st Semester' && hasPaidFirst) {
      return Response.json({ success: false, message: '1st Semester dues are already paid.' }, { status: 400 });
    }

    if (semester === '2nd Semester' && hasPaidSecond) {
      return Response.json({ success: false, message: '2nd Semester dues are already paid.' }, { status: 400 });
    }

    // Generate unique reference
    const reference = `HTU-${indexNumber}-${Date.now()}`;

    // Initialize with Paystack (real or mock)
    const paystackRes = await paystack.initialize(email, targetAmount, reference);

    // Save pending payment record
    await db.initializePayment({
      student_index_number: indexNumber,
      amount: targetAmount,
      paystack_reference: reference,
      status: 'pending',
      receipt_id: null,
      payment_date: null,
      semester,
      academic_year: academicYear
    });

    await db.addAuditLog(session.id, 'PAYMENT_INITIATED', `Student ${indexNumber} initiated payment of GHS ${targetAmount} for ${semester}. Ref: ${reference}`);

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
