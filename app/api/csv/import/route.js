import { db } from '@/lib/db';
import { getServerSession } from '@/lib/session';
import { supabase, isSupabaseConfigured, getSupabaseAdmin } from '@/lib/supabase';

export async function POST(req) {
  try {
    const session = getServerSession(req);
    if (!session || (session.role !== 'dept_admin' && session.role !== 'super_admin')) {
      return Response.json({ success: false, message: 'Unauthorized.' }, { status: 401 });
    }

    const { students, departmentId, skipDuplicates = false } = await req.json();

    if (!students || !Array.isArray(students) || students.length === 0) {
      return Response.json({ success: false, message: 'No student records provided.' }, { status: 400 });
    }

    if (!departmentId) {
      return Response.json({ success: false, message: 'Department ID is required.' }, { status: 400 });
    }

    // Dept isolation: a dept_admin can only import into their own department
    if (session.role === 'dept_admin' && session.department_id && session.department_id !== departmentId) {
      return Response.json({ success: false, message: 'Unauthorized: you can only import into your assigned department.' }, { status: 403 });
    }

    // Validate required fields in each row
    const required = ['index_number', 'full_name', 'email', 'programme', 'level', 'faculty'];
    const errors = [];
    const valid = [];
    const manualPaymentIndexes = []; // students flagged with paid_status = 'paid'

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
        manualPaymentIndexes.push(indexNum);
      }
    });

    if (valid.length === 0) {
      return Response.json({ success: false, message: 'No valid records to import.', errors }, { status: 400 });
    }

    // Pass skipDuplicates flag to the database layer
    const { data: importedData, insertedCount, updatedCount, skippedDuplicates } =
      await db.importStudentsCSV(valid, skipDuplicates);

    // Create manual payment records for students with paid_status = 'paid'.
    // When skipDuplicates is true, only create payments for newly inserted students.
    const insertedIndexNumbers = importedData.map(s => s.index_number);
    const paymentTargets = skipDuplicates
      ? manualPaymentIndexes.filter(idx => insertedIndexNumbers.includes(idx))
      : manualPaymentIndexes;

    let manualPaymentsCreated = 0;
    if (paymentTargets.length > 0 && isSupabaseConfigured()) {
      const dept = await db.getDepartment(departmentId);
      const duesAmount = dept?.dues_amount || 0;

      for (const indexNum of paymentTargets) {
        const existingPayments = await db.getPaymentsByStudent(indexNum);
        const alreadyPaid = existingPayments.some(p => p.status === 'success');
        if (!alreadyPaid) {
          const timestamp = Date.now();
          const reference = `MANUAL-${indexNum}-${timestamp}`;
          const receiptId = `REC-HTU-MAN-${timestamp.toString().slice(-6)}`;
          const adminOrAnon = getSupabaseAdmin() || supabase;
          const { error: payErr } = await adminOrAnon.from('payments').insert({
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

    const duplicateAction = skipDuplicates ? 'skipped' : 'updated';

    await db.addAuditLog(
      session.id,
      'CSV_IMPORT',
      `${session.full_name} imported students into department ${departmentId}: ` +
      `${insertedCount} new, ${updatedCount} ${duplicateAction}, ` +
      `${skippedDuplicates} duplicates skipped, ${manualPaymentsCreated} manual payment(s).`
    );

    await db.addNotification(
      'CSV Import Complete',
      `${insertedCount} new student(s) added. ` +
      `${updatedCount} existing record(s) updated. ` +
      `${skippedDuplicates} duplicate(s) skipped. ` +
      `${manualPaymentsCreated} cash payment(s) recorded. ` +
      `${errors.length} row(s) had validation errors.`,
      session.id,
      null
    );

    return Response.json({
      success: true,
      imported: insertedCount,
      updated: updatedCount,
      skippedDuplicates,
      manualPayments: manualPaymentsCreated,
      skipped: errors.length,
      errors
    });
  } catch (err) {
    console.error("CSV Import Error:", err);
    return Response.json({ success: false, message: err.message || 'Internal Server Error' }, { status: 500 });
  }
}
