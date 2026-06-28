import { db } from '@/lib/db';
import { getServerSession } from '@/lib/session';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

export async function POST(req) {
  try {
    const session = getServerSession(req);
    if (!session || (session.role !== 'dept_admin' && session.role !== 'super_admin')) {
      return Response.json({ success: false, message: 'Unauthorized.' }, { status: 401 });
    }

    const { students, departmentId } = await req.json();

    if (!students || !Array.isArray(students) || students.length === 0) {
      return Response.json({ success: false, message: 'No student records provided.' }, { status: 400 });
    }

    if (!departmentId) {
      return Response.json({ success: false, message: 'Department ID is required.' }, { status: 400 });
    }

    // Validate required fields in each row
    const required = ['index_number', 'full_name', 'email', 'programme', 'level', 'faculty'];
    const errors = [];
    const valid = [];
    const manualPayments = []; // students flagged with paid_status = 'paid'

    students.forEach((student, i) => {
      const missing = required.filter(f => !student[f] || !String(student[f]).trim());
      if (missing.length > 0) {
        errors.push(`Row ${i + 1}: Missing fields: ${missing.join(', ')}`);
        return;
      }

      const emailRegex = /^[a-zA-Z0-9._%+-]+@htu\.edu\.gh$/;
      if (!emailRegex.test(String(student.email).toLowerCase())) {
        errors.push(`Row ${i + 1}: Invalid email format: ${student.email}`);
        return;
      }

      const indexNum = String(student.index_number).trim();
      const paidStatus = String(student.paid_status || '').toLowerCase().trim();

      valid.push({
        index_number: indexNum,
        full_name: String(student.full_name).trim(),
        email: String(student.email).toLowerCase().trim(),
        programme: String(student.programme).trim(),
        level: String(student.level).trim(),
        faculty: String(student.faculty).trim(),
        department_id: departmentId
      });

      // Track manually-paid students for payment record creation
      if (paidStatus === 'paid' || paidStatus === 'yes' || paidStatus === '1') {
        manualPayments.push(indexNum);
      }
    });

    if (valid.length === 0) {
      return Response.json({ success: false, message: 'No valid records to import.', errors }, { status: 400 });
    }

    const imported = await db.importStudentsCSV(valid);

    // Create manual payment records for students with paid_status = paid
    let manualPaymentsCreated = 0;
    if (manualPayments.length > 0 && isSupabaseConfigured()) {
      const dept = await db.getDepartment(departmentId);
      const duesAmount = dept?.dues_amount || 0;

      for (const indexNum of manualPayments) {
        const existingPayments = await db.getPaymentsByStudent(indexNum);
        const alreadyPaid = existingPayments.some(p => p.status === 'success');
        if (!alreadyPaid) {
          const timestamp = Date.now();
          const reference = `MANUAL-${indexNum}-${timestamp}`;
          const receiptId = `REC-HTU-MAN-${timestamp.toString().slice(-6)}`;
          const { error: payErr } = await supabase.from('payments').insert({
            student_index_number: indexNum,
            amount: duesAmount,
            paystack_reference: reference,
            status: 'success',
            receipt_id: receiptId,
            payment_date: new Date().toISOString()
          });
          if (!payErr) manualPaymentsCreated++;
        }
      }
    }

    await db.addAuditLog(
      session.id,
      'CSV_IMPORT',
      `${session.full_name} imported ${imported.length} students into department ${departmentId}. ${manualPaymentsCreated} manual payment(s) recorded.`
    );

    // Notify only the uploading admin, not all dept admins
    await db.addNotification(
      'CSV Import Complete',
      `${imported.length} student record(s) imported. ${manualPaymentsCreated} manual payment(s) recorded. ${errors.length} row(s) skipped.`,
      session.id,
      null
    );

    return Response.json({
      success: true,
      imported: imported.length,
      manualPayments: manualPaymentsCreated,
      skipped: errors.length,
      errors
    });
  } catch (err) {
    console.error("CSV Import Error:", err);
    return Response.json({ success: false, message: err.message || 'Internal Server Error' }, { status: 500 });
  }
}
