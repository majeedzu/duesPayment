import { supabase, isSupabaseConfigured, supabaseAdmin, getSupabaseAdmin } from './supabase';
import path from 'path';

// Dynamic import of fs/path to prevent Next.js client-side bundle errors
let fs = null;
if (typeof window === 'undefined') {
  fs = require('fs');
}

const getMockDbPath = () => path.join(process.cwd(), 'lib', 'mock_db.json');

const readMockDB = () => {
  if (!fs) return {};
  try {
    const data = fs.readFileSync(getMockDbPath(), 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error("Error reading mock DB:", error);
    return {};
  }
};

const writeMockDB = (data) => {
  if (!fs) return;
  try {
    fs.writeFileSync(getMockDbPath(), JSON.stringify(data, null, 2), 'utf8');
  } catch (error) {
    console.error("Error writing mock DB:", error);
  }
};

export const db = {
  // --- Departments ---
  async getDepartments() {
    if (isSupabaseConfigured()) {
      const { data, error } = await supabase.from('departments').select('*');
      if (error) throw error;
      return data;
    } else {
      return readMockDB().departments || [];
    }
  },

  async getDepartment(id) {
    if (isSupabaseConfigured()) {
      const { data, error } = await supabase.from('departments').select('*').eq('id', id).single();
      if (error) throw error;
      return data;
    } else {
      const dbData = readMockDB();
      return dbData.departments?.find(d => d.id === id) || null;
    }
  },

  async updateDepartmentDues(id, duesAmount) {
    if (isSupabaseConfigured()) {
      const { data, error } = await (supabaseAdmin || supabase).from('departments').update({ dues_amount: duesAmount }).eq('id', id).select().single();
      if (error) throw error;
      return data;
    } else {
      const dbData = readMockDB();
      const idx = dbData.departments?.findIndex(d => d.id === id);
      if (idx !== -1) {
        dbData.departments[idx].dues_amount = parseFloat(duesAmount);
        writeMockDB(dbData);
        return dbData.departments[idx];
      }
      return null;
    }
  },

  // --- Profiles (Auth Users) ---
  async getProfile(email) {
    if (isSupabaseConfigured()) {
      const { data, error } = await supabase.from('profiles').select('*').eq('email', email).single();
      if (error && error.code !== 'PGRST116') throw error; // PGRST116 is no rows
      return data;
    } else {
      const dbData = readMockDB();
      return dbData.profiles?.find(p => p.email.toLowerCase() === email.toLowerCase()) || null;
    }
  },

  async getProfileById(id) {
    if (isSupabaseConfigured()) {
      const { data, error } = await supabase.from('profiles').select('*').eq('id', id).single();
      if (error && error.code !== 'PGRST116') throw error;
      return data;
    } else {
      const dbData = readMockDB();
      return dbData.profiles?.find(p => p.id === id) || null;
    }
  },

  async createProfile(profile) {
    if (isSupabaseConfigured()) {
      const adminOrAnon = getSupabaseAdmin() || supabase;
      const { data, error } = await adminOrAnon.from('profiles').insert({ password_changed: false, ...profile }).select().single();
      if (error) throw error;
      return data;
    } else {
      const dbData = readMockDB();
      const newProfile = {
        id: `user-${Date.now()}`,
        avatar_url: null,
        ...profile
      };
      dbData.profiles.push(newProfile);
      writeMockDB(dbData);
      return newProfile;
    }
  },

  async updateProfileAvatar(email, avatarUrl) {
    if (isSupabaseConfigured()) {
      const { data, error } = await supabase.from('profiles').update({ avatar_url: avatarUrl }).eq('email', email).select().single();
      if (error) throw error;
      return data;
    } else {
      const dbData = readMockDB();
      const idx = dbData.profiles?.findIndex(p => p.email.toLowerCase() === email.toLowerCase());
      if (idx !== -1) {
        dbData.profiles[idx].avatar_url = avatarUrl;
        writeMockDB(dbData);
        return dbData.profiles[idx];
      }
      return null;
    }
  },

  async updateProfilePassword(email, newPassword) {
    if (isSupabaseConfigured()) {
      return true;
    } else {
      const dbData = readMockDB();
      const idx = dbData.profiles?.findIndex(p => p.email.toLowerCase() === email.toLowerCase());
      if (idx !== -1) {
        dbData.profiles[idx].password = newPassword;
        writeMockDB(dbData);
        return true;
      }
      return false;
    }
  },

  async setPasswordChanged(userId) {
    if (isSupabaseConfigured()) {
      const { error } = await (supabaseAdmin || supabase)
        .from('profiles')
        .update({ password_changed: true })
        .eq('id', userId);
      if (error) console.error('setPasswordChanged error:', error.message);
    } else {
      const dbData = readMockDB();
      const idx = dbData.profiles?.findIndex(p => p.id === userId);
      if (idx !== -1) {
        dbData.profiles[idx].password_changed = true;
        writeMockDB(dbData);
      }
    }
  },

  // Reset another admin/super_admin's password (called by super admin only)
  async resetAdminPassword(profileId, newPassword) {
    if (isSupabaseConfigured()) {
      if (!supabaseAdmin) throw new Error('Supabase admin client not configured.');
      const { data: profileData, error: profileErr } = await supabaseAdmin
        .from('profiles')
        .select('id')
        .eq('id', profileId)
        .single();
      if (profileErr) throw new Error('Profile not found.');

      const { error } = await supabaseAdmin.auth.admin.updateUserById(profileId, { password: newPassword });
      if (error) throw error;

      // Also reset the password_changed flag so the user is forced to change on next login
      await supabaseAdmin.from('profiles').update({ password_changed: false }).eq('id', profileId);
    } else {
      const dbData = readMockDB();
      const idx = dbData.profiles?.findIndex(p => p.id === profileId);
      if (idx === -1) throw new Error('Profile not found.');
      dbData.profiles[idx].password = newPassword;
      dbData.profiles[idx].password_changed = false;
      writeMockDB(dbData);
    }
  },

  // --- Students (CSV Imported Records) ---
  async getStudentByEmail(email) {
    if (isSupabaseConfigured()) {
      const { data, error } = await supabase.from('students').select('*').eq('email', email).single();
      if (error && error.code !== 'PGRST116') throw error;
      return data;
    } else {
      const dbData = readMockDB();
      return dbData.students?.find(s => s.email.toLowerCase() === email.toLowerCase()) || null;
    }
  },

  async getStudentByIndex(indexNumber) {
    if (isSupabaseConfigured()) {
      const { data, error } = await supabase.from('students').select('*').eq('index_number', indexNumber).single();
      if (error && error.code !== 'PGRST116') throw error;
      return data;
    } else {
      const dbData = readMockDB();
      return dbData.students?.find(s => s.index_number === indexNumber) || null;
    }
  },

  async getStudentsByDepartment(departmentId) {
    if (isSupabaseConfigured()) {
      const { data, error } = await supabase.from('students').select('*').eq('department_id', departmentId);
      if (error) throw error;
      return data;
    } else {
      const dbData = readMockDB();
      return dbData.students?.filter(s => s.department_id === departmentId) || [];
    }
  },

  async getAllStudents() {
    if (isSupabaseConfigured()) {
      const { data, error } = await supabase.from('students').select('*');
      if (error) throw error;
      return data;
    } else {
      return readMockDB().students || [];
    }
  },

  async importStudentsCSV(studentsList) {
    const indexNumbers = studentsList.map(s => s.index_number);

    if (isSupabaseConfigured()) {
      const adminOrAnon = getSupabaseAdmin() || supabase;
      
      // Fetch existing index numbers to differentiate inserts vs updates
      let existingIndexNumbers = [];
      try {
        const { data: existingData, error: fetchErr } = await adminOrAnon
          .from('students')
          .select('index_number')
          .in('index_number', indexNumbers);
        if (!fetchErr && existingData) {
          existingIndexNumbers = existingData.map(d => d.index_number);
        }
      } catch (err) {
        console.error("Error checking existing students during import:", err);
      }

      const { data, error } = await adminOrAnon.from('students').upsert(studentsList, { onConflict: 'index_number' }).select();
      if (error) throw error;

      const updatedCount = existingIndexNumbers.length;
      const insertedCount = Math.max(0, data.length - updatedCount);

      return { data, insertedCount, updatedCount };
    } else {
      const dbData = readMockDB();
      let insertedCount = 0;
      let updatedCount = 0;

      studentsList.forEach(newStudent => {
        const idx = dbData.students.findIndex(s => s.index_number === newStudent.index_number);
        if (idx !== -1) {
          dbData.students[idx] = { ...dbData.students[idx], ...newStudent };
          updatedCount++;
        } else {
          dbData.students.push(newStudent);
          insertedCount++;
        }
      });
      writeMockDB(dbData);
      return { data: studentsList, insertedCount, updatedCount };
    }
  },

  // --- Payments ---
  async getPaymentsByStudent(indexNumber) {
    if (isSupabaseConfigured()) {
      const { data, error } = await supabase.from('payments').select('*').eq('student_index_number', indexNumber).order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    } else {
      const dbData = readMockDB();
      return dbData.payments?.filter(p => p.student_index_number === indexNumber) || [];
    }
  },

  async getPaymentsByDepartment(departmentId) {
    if (isSupabaseConfigured()) {
      // Get student index numbers for this department first, then fetch payments
      const { data: students, error: studentsError } = await supabase
        .from('students')
        .select('index_number')
        .eq('department_id', departmentId);
      if (studentsError) throw studentsError;
      if (!students || students.length === 0) return [];
      const indexNumbers = students.map(s => s.index_number);
      const { data, error } = await supabase
        .from('payments')
        .select('*')
        .in('student_index_number', indexNumbers)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    } else {
      const dbData = readMockDB();
      const deptStudents = dbData.students.filter(s => s.department_id === departmentId).map(s => s.index_number);
      return dbData.payments?.filter(p => deptStudents.includes(p.student_index_number)) || [];
    }
  },

  async getAllPayments() {
    if (isSupabaseConfigured()) {
      const { data, error } = await supabase.from('payments').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    } else {
      return readMockDB().payments || [];
    }
  },

  async getPaymentByRef(reference) {
    if (isSupabaseConfigured()) {
      const { data, error } = await supabase.from('payments').select('*').eq('paystack_reference', reference).single();
      if (error && error.code !== 'PGRST116') throw error;
      return data;
    } else {
      const dbData = readMockDB();
      return dbData.payments?.find(p => p.paystack_reference === reference) || null;
    }
  },

  async initializePayment(payment) {
    if (isSupabaseConfigured()) {
      const { data, error } = await (supabaseAdmin || supabase).from('payments').insert(payment).select().single();
      if (error) throw error;
      return data;
    } else {
      const dbData = readMockDB();
      const newPayment = {
        id: `pay-${Date.now()}`,
        status: 'pending',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        ...payment
      };
      dbData.payments.push(newPayment);
      writeMockDB(dbData);
      return newPayment;
    }
  },

  async verifyReceipt(receiptId) {
    if (isSupabaseConfigured()) {
      const { data, error } = await supabase.from('payments').select('*, students(*)').eq('receipt_id', receiptId).single();
      if (error && error.code !== 'PGRST116') throw error;
      return data;
    } else {
      const dbData = readMockDB();
      const payment = dbData.payments?.find(p => p.receipt_id === receiptId);
      if (!payment) return null;
      const student = dbData.students?.find(s => s.index_number === payment.student_index_number);
      return { ...payment, students: student || null };
    }
  },

  async updatePaymentStatus(reference, status, receiptId) {
    if (isSupabaseConfigured()) {
      const { data, error } = await (supabaseAdmin || supabase)
        .from('payments')
        .update({ status, receipt_id: receiptId, payment_date: status === 'success' ? new Date().toISOString() : null, updated_at: new Date().toISOString() })
        .eq('paystack_reference', reference)
        .select()
        .single();
      if (error) throw error;
      return data;
    } else {
      const dbData = readMockDB();
      const idx = dbData.payments?.findIndex(p => p.paystack_reference === reference);
      if (idx !== -1) {
        dbData.payments[idx].status = status;
        if (status === 'success') {
          dbData.payments[idx].receipt_id = receiptId || `REC-HTU-${Date.now().toString().slice(-6)}`;
          dbData.payments[idx].payment_date = new Date().toISOString();
        }
        dbData.payments[idx].updated_at = new Date().toISOString();
        writeMockDB(dbData);
        return dbData.payments[idx];
      }
      return null;
    }
  },

  // --- Notifications ---
  async getNotifications(userId, role) {
    if (isSupabaseConfigured()) {
      // Fetch both user-specific and role-specific notifications
      let query = supabase.from('notifications').select('*');
      if (userId && role) {
        query = query.or(`user_id.eq.${userId},role.eq.${role}`);
      } else if (userId) {
        query = query.eq('user_id', userId);
      } else if (role) {
        query = query.eq('role', role);
      }
      const { data, error } = await query.order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    } else {
      const dbData = readMockDB();
      return dbData.notifications?.filter(n => 
        (userId && n.user_id === userId) || (role && n.role === role)
      ).sort((a, b) => new Date(b.created_at) - new Date(a.created_at)) || [];
    }
  },

  // Send notification to all admins of a specific department by looking up their profile user IDs
  async addNotificationToAdminOfDepartment(title, message, departmentId) {
    if (isSupabaseConfigured()) {
      // Find profile(s) for dept_admin assigned to this department
      const { data: admins, error } = await supabase.from('profiles').select('id').eq('role', 'dept_admin').eq('department_id', departmentId);
      if (error) throw error;
      if (admins && admins.length > 0) {
        for (const admin of admins) {
          await (supabaseAdmin || supabase).from('notifications').insert({ title, message, user_id: admin.id, role: null });
        }
      }
    }
    // No-op in mock mode; not critical for production flow
  },

  async addNotification(title, message, userId = null, role = null) {
    if (isSupabaseConfigured()) {
      const { data, error } = await (supabaseAdmin || supabase).from('notifications').insert({ title, message, user_id: userId, role }).select().single();
      if (error) throw error;
      return data;
    } else {
      const dbData = readMockDB();
      const newNotification = {
        id: `notif-${Date.now()}`,
        title,
        message,
        user_id: userId,
        role,
        is_read: false,
        created_at: new Date().toISOString()
      };
      dbData.notifications.push(newNotification);
      writeMockDB(dbData);
      return newNotification;
    }
  },

  async addNotificationToStudentsOfDepartment(title, message, departmentId) {
    if (isSupabaseConfigured()) {
      const { data: students, error } = await supabase
        .from('profiles')
        .select('id')
        .eq('role', 'student')
        .eq('department_id', departmentId);
      if (error) throw error;
      if (students && students.length > 0) {
        for (const s of students) {
          await this.addNotification(title, message, s.id, null);
        }
      }
    } else {
      const dbData = readMockDB();
      const studentProfiles = dbData.profiles?.filter(p => p.role === 'student' && p.department_id === departmentId) || [];
      for (const s of studentProfiles) {
        const newNotification = {
          id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          title,
          message,
          user_id: s.id,
          role: null,
          is_read: false,
          created_at: new Date().toISOString()
        };
        dbData.notifications.push(newNotification);
      }
      writeMockDB(dbData);
    }
  },

  async addNotificationToAllAdmins(title, message) {
    if (isSupabaseConfigured()) {
      const { data: admins, error } = await supabase
        .from('profiles')
        .select('id')
        .eq('role', 'dept_admin');
      if (error) throw error;
      if (admins && admins.length > 0) {
        for (const admin of admins) {
          await this.addNotification(title, message, admin.id, null);
        }
      }
    } else {
      const dbData = readMockDB();
      const adminProfiles = dbData.profiles?.filter(p => p.role === 'dept_admin') || [];
      for (const admin of adminProfiles) {
        const newNotification = {
          id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          title,
          message,
          user_id: admin.id,
          role: null,
          is_read: false,
          created_at: new Date().toISOString()
        };
        dbData.notifications.push(newNotification);
      }
      writeMockDB(dbData);
    }
  },

  async markNotificationRead(id) {
    if (isSupabaseConfigured()) {
      const { data, error } = await supabase.from('notifications').update({ is_read: true }).eq('id', id).select().single();
      if (error) throw error;
      return data;
    } else {
      const dbData = readMockDB();
      const idx = dbData.notifications?.findIndex(n => n.id === id);
      if (idx !== -1) {
        dbData.notifications[idx].is_read = true;
        writeMockDB(dbData);
        return dbData.notifications[idx];
      }
      return null;
    }
  },

  // --- Admin & Department Management (Super Admin) ---
  async getAdmins() {
    if (isSupabaseConfigured()) {
      const { data, error } = await supabase.from('profiles').select('*').in('role', ['dept_admin', 'super_admin']);
      if (error) throw error;
      return data;
    } else {
      const dbData = readMockDB();
      return dbData.profiles?.filter(p => p.role === 'dept_admin' || p.role === 'super_admin') || [];
    }
  },

  async getDeptAdmin(departmentId) {
    if (isSupabaseConfigured()) {
      const { data, error } = await supabase.from('profiles').select('*').eq('role', 'dept_admin').eq('department_id', departmentId).limit(1);
      if (error) throw error;
      return data && data.length > 0 ? data[0] : null;
    } else {
      const dbData = readMockDB();
      return dbData.profiles?.find(p => p.role === 'dept_admin' && p.department_id === departmentId) || null;
    }
  },

  async createAdmin(admin) {
    if (isSupabaseConfigured()) {
      if (!supabaseAdmin) {
        throw new Error("Supabase Admin client (Service Role Key) is not configured.");
      }

      // 1. Create the user in Supabase Auth first
      const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email: admin.email,
        password: 'password123', // default password, they can reset it later
        email_confirm: true
      });

      if (authError) throw authError;

      // 2. Insert profile record mapped to the created auth user ID
      const { data, error } = await (supabaseAdmin || supabase).from('profiles').insert({
        id: authData.user.id,
        email: admin.email,
        role: admin.role,
        full_name: admin.full_name,
        department_id: admin.department_id,
        avatar_url: admin.avatar_url || null,
        whatsapp: admin.whatsapp || null,
        password_changed: false
      }).select().single();

      if (error) {
        // Rollback auth user creation if profile insertion fails
        await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
        throw error;
      }

      return data;
    } else {
      const dbData = readMockDB();
      const newAdmin = {
        id: `admin-${Date.now()}`,
        avatar_url: null,
        password: "password123",
        ...admin
      };
      dbData.profiles.push(newAdmin);
      writeMockDB(dbData);
      return newAdmin;
    }
  },

  async deleteAdmin(id) {
    if (isSupabaseConfigured()) {
      if (supabaseAdmin) {
        // Deleting from auth.users will cascade-delete from profiles table due to foreign key cascade constraint
        const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(id);
        if (authError) throw authError;
      } else {
        const { error } = await supabase.from('profiles').delete().eq('id', id);
        if (error) throw error;
      }
      return true;
    } else {
      const dbData = readMockDB();
      dbData.profiles = dbData.profiles?.filter(p => p.id !== id) || [];
      writeMockDB(dbData);
      return true;
    }
  },

  async createDepartment(dept) {
    if (isSupabaseConfigured()) {
      const id = dept.id || `dept-${Date.now()}`;
      const { data, error } = await (supabaseAdmin || supabase).from('departments').insert({ id, ...dept }).select().single();
      if (error) throw error;
      return data;
    } else {
      const dbData = readMockDB();
      const newDept = {
        id: `dept-${Date.now()}`,
        ...dept
      };
      dbData.departments.push(newDept);
      writeMockDB(dbData);
      return newDept;
    }
  },

  async updateDepartment(id, name, faculty, duesAmount) {
    if (isSupabaseConfigured()) {
      const { data, error } = await (supabaseAdmin || supabase).from('departments').update({ name, faculty, dues_amount: parseFloat(duesAmount) }).eq('id', id).select().single();
      if (error) throw error;
      return data;
    } else {
      const dbData = readMockDB();
      const idx = dbData.departments?.findIndex(d => d.id === id);
      if (idx !== -1) {
        dbData.departments[idx] = {
          ...dbData.departments[idx],
          name,
          faculty,
          dues_amount: parseFloat(duesAmount)
        };
        writeMockDB(dbData);
        return dbData.departments[idx];
      }
      return null;
    }
  },

  async deleteDepartment(id) {
    if (isSupabaseConfigured()) {
      const { error } = await (supabaseAdmin || supabase).from('departments').delete().eq('id', id);
      if (error) throw error;
      return true;
    } else {
      const dbData = readMockDB();
      dbData.departments = dbData.departments?.filter(d => d.id !== id) || [];
      writeMockDB(dbData);
      return true;
    }
  },

  // --- Student Management (Admin / Super Admin) ---
  async deleteStudent(indexNumber, email) {
    if (isSupabaseConfigured()) {
      const adminOrAnon = getSupabaseAdmin() || supabase;
      const profile = await this.getProfile(email);
      if (profile && getSupabaseAdmin()) {
        const { error: authError } = await getSupabaseAdmin().auth.admin.deleteUser(profile.id);
        if (authError) throw authError;
      } else if (profile) {
        await adminOrAnon.from('profiles').delete().eq('id', profile.id);
      }
      const { error } = await adminOrAnon.from('students').delete().eq('index_number', indexNumber);
      if (error) throw error;
      return true;
    } else {
      const dbData = readMockDB();
      dbData.students = dbData.students?.filter(s => s.index_number !== indexNumber) || [];
      dbData.profiles = dbData.profiles?.filter(p => p.email.toLowerCase() !== email.toLowerCase()) || [];
      writeMockDB(dbData);
      return true;
    }
  },

  async updateStudent(indexNumber, updatedFields) {
    if (isSupabaseConfigured()) {
      const adminOrAnon = getSupabaseAdmin() || supabase;
      const student = await this.getStudentByIndex(indexNumber);
      if (!student) throw new Error("Student not found.");

      const { data, error } = await adminOrAnon
        .from('students')
        .update(updatedFields)
        .eq('index_number', indexNumber)
        .select()
        .single();
      if (error) throw error;

      const profile = await this.getProfile(student.email);
      if (profile) {
        const profileUpdates = {};
        if (updatedFields.full_name) profileUpdates.full_name = updatedFields.full_name;
        if (updatedFields.email) profileUpdates.email = updatedFields.email;
        if (updatedFields.department_id) profileUpdates.department_id = updatedFields.department_id;

        if (Object.keys(profileUpdates).length > 0) {
          const { error: profileError } = await adminOrAnon
            .from('profiles')
            .update(profileUpdates)
            .eq('id', profile.id);
          if (profileError) throw profileError;

          if (updatedFields.email && getSupabaseAdmin()) {
            const { error: authError } = await getSupabaseAdmin().auth.admin.updateUserById(
              profile.id,
              { email: updatedFields.email }
            );
            if (authError) throw authError;
          }
        }
      }
      return data;
    } else {
      const dbData = readMockDB();
      const sIdx = dbData.students?.findIndex(s => s.index_number === indexNumber);
      if (sIdx !== -1) {
        const oldEmail = dbData.students[sIdx].email;
        dbData.students[sIdx] = {
          ...dbData.students[sIdx],
          ...updatedFields
        };
        
        const pIdx = dbData.profiles?.findIndex(p => p.email.toLowerCase() === oldEmail.toLowerCase());
        if (pIdx !== -1) {
          if (updatedFields.full_name) dbData.profiles[pIdx].full_name = updatedFields.full_name;
          if (updatedFields.email) dbData.profiles[pIdx].email = updatedFields.email;
          if (updatedFields.department_id) dbData.profiles[pIdx].department_id = updatedFields.department_id;
        }

        writeMockDB(dbData);
        return dbData.students[sIdx];
      }
      return null;
    }
  },

  async resetStudentPassword(email, newPassword) {
    if (isSupabaseConfigured()) {
      const profile = await this.getProfile(email);
      if (!profile) {
        throw new Error("Student does not have an active login account (no profile found).");
      }
      if (!getSupabaseAdmin()) {
        throw new Error("Supabase admin client not configured.");
      }
      const { data, error } = await getSupabaseAdmin().auth.admin.updateUserById(
        profile.id,
        { password: newPassword }
      );
      if (error) throw error;
      return true;
    } else {
      const dbData = readMockDB();
      const pIdx = dbData.profiles?.findIndex(p => p.email.toLowerCase() === email.toLowerCase());
      if (pIdx !== -1) {
        dbData.profiles[pIdx].password = newPassword;
        writeMockDB(dbData);
        return true;
      }
      throw new Error("Student does not have an active login account (no profile found).");
    }
  },

  // Reset password_changed flag to false — forces user to change on next login
  async resetPasswordChangedFlag(profileId) {
    if (isSupabaseConfigured()) {
      const { error } = await (supabaseAdmin || getSupabaseAdmin() || supabase)
        .from('profiles')
        .update({ password_changed: false })
        .eq('id', profileId);
      if (error) console.error('resetPasswordChangedFlag error:', error.message);
    } else {
      const dbData = readMockDB();
      const idx = dbData.profiles?.findIndex(p => p.id === profileId);
      if (idx !== -1) {
        dbData.profiles[idx].password_changed = false;
        writeMockDB(dbData);
      }
    }
  },

  // --- Audit Logs ---
  async getAuditLogs() {
    if (isSupabaseConfigured()) {
      const { data, error } = await supabase.from('audit_logs').select('*, profiles(full_name, email)').order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    } else {
      const dbData = readMockDB();
      return dbData.audit_logs?.map(log => {
        const actor = dbData.profiles?.find(p => p.id === log.actor_id);
        return {
          ...log,
          profiles: actor ? { full_name: actor.full_name, email: actor.email } : null
        };
      }).sort((a, b) => new Date(b.created_at) - new Date(a.created_at)) || [];
    }
  },

  async addAuditLog(actorId, action, details) {
    if (isSupabaseConfigured()) {
      const { data, error } = await (supabaseAdmin || supabase).from('audit_logs').insert({ actor_id: actorId, action, details }).select().single();
      if (error) throw error;
      return data;
    } else {
      const dbData = readMockDB();
      const newLog = {
        id: `audit-${Date.now()}`,
        actor_id: actorId,
        action,
        details,
        created_at: new Date().toISOString()
      };
      dbData.audit_logs.push(newLog);
      writeMockDB(dbData);
      return newLog;
    }
  }
};
