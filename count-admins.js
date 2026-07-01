/**
 * HTU Count Active Admins
 * Queries the live Supabase database for the count of active administrators.
 * Run with: node count-admins.js
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceKey) {
  console.error('❌ Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceKey);

async function countAdmins() {
  const { data: deptAdmins, error: err1 } = await supabase
    .from('profiles')
    .select('full_name, email, role, departments(name)')
    .eq('role', 'dept_admin');

  const { data: superAdmins, error: err2 } = await supabase
    .from('profiles')
    .select('full_name, email, role')
    .eq('role', 'super_admin');

  if (err1 || err2) {
    console.error('❌ Error fetching profiles:', err1?.message || err2?.message);
    process.exit(1);
  }

  console.log('\n👥 Live Supabase Administrator Accounts:\n');
  
  console.log(`🔑 Super Administrators (${superAdmins.length}):`);
  superAdmins.forEach(admin => {
    console.log(`   • ${admin.full_name} (${admin.email})`);
  });

  console.log(`\n🏛️ Department Administrators (${deptAdmins.length}):`);
  deptAdmins.forEach(admin => {
    const deptName = admin.departments ? admin.departments.name : 'Unassigned';
    console.log(`   • ${admin.full_name} (${admin.email}) -> ${deptName}`);
  });
  console.log('');
}

countAdmins();
