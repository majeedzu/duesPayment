/**
 * HTU Departments Seed Script
 * Inserts all 28 departments across all 5 HTU faculties into Supabase.
 * Run with: node seed-departments.js
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

const departments = [
  // Faculty of Applied Sciences and Technology
  { id: 'dept-cs-111',   name: 'Department of Computer Science',                    faculty: 'Faculty of Applied Sciences and Technology', dues_amount: 150.00 },
  { id: 'dept-agro-222', name: 'Department of Agro Enterprise Development',          faculty: 'Faculty of Applied Sciences and Technology', dues_amount: 150.00 },
  { id: 'dept-fst-333',  name: 'Department of Food Science and Technology',          faculty: 'Faculty of Applied Sciences and Technology', dues_amount: 150.00 },
  { id: 'dept-htm-444',  name: 'Department of Hospitality and Tourism Management',   faculty: 'Faculty of Applied Sciences and Technology', dues_amount: 150.00 },
  { id: 'dept-ms-555',   name: 'Department of Mathematics and Statistics',           faculty: 'Faculty of Applied Sciences and Technology', dues_amount: 150.00 },
  // Faculty of Engineering
  { id: 'dept-eee-601',  name: 'Electrical & Electronic Engineering',                faculty: 'Faculty of Engineering', dues_amount: 150.00 },
  { id: 'dept-auto-602', name: 'Automobile Engineering',                             faculty: 'Faculty of Engineering', dues_amount: 150.00 },
  { id: 'dept-civil-603',name: 'Civil Engineering',                                  faculty: 'Faculty of Engineering', dues_amount: 150.00 },
  { id: 'dept-aee-604',  name: 'Agricultural & Environmental Engineering',           faculty: 'Faculty of Engineering', dues_amount: 150.00 },
  { id: 'dept-ageng-605',name: 'Agricultural Engineering',                           faculty: 'Faculty of Engineering', dues_amount: 150.00 },
  { id: 'dept-dme-606',  name: 'Design & Manufacturing Engineering',                 faculty: 'Faculty of Engineering', dues_amount: 150.00 },
  { id: 'dept-btech-607',name: 'Building Technology',                               faculty: 'Faculty of Engineering', dues_amount: 150.00 },
  { id: 'dept-arch-608', name: 'Architectural Technology',                           faculty: 'Faculty of Engineering', dues_amount: 150.00 },
  { id: 'dept-fm-609',   name: 'Facilities Management',                             faculty: 'Faculty of Engineering', dues_amount: 150.00 },
  // Faculty of Art and Design
  { id: 'dept-fdt-701',  name: 'Fashion Design and Textiles',                       faculty: 'Faculty of Art and Design', dues_amount: 150.00 },
  { id: 'dept-ias-702',  name: 'Industrial Art with Sculpture',                      faculty: 'Faculty of Art and Design', dues_amount: 150.00 },
  { id: 'dept-paint-703',name: 'Painting',                                           faculty: 'Faculty of Art and Design', dues_amount: 150.00 },
  { id: 'dept-gd-704',   name: 'Graphic Design',                                    faculty: 'Faculty of Art and Design', dues_amount: 150.00 },
  { id: 'dept-cer-705',  name: 'Ceramics',                                           faculty: 'Faculty of Art and Design', dues_amount: 150.00 },
  { id: 'dept-tex-706',  name: 'Textiles',                                           faculty: 'Faculty of Art and Design', dues_amount: 150.00 },
  // Faculty of Business and Management Studies
  { id: 'dept-acct-801', name: 'Accounting & Taxation',                             faculty: 'Faculty of Business and Management Studies', dues_amount: 150.00 },
  { id: 'dept-mkt-802',  name: 'Marketing & IT',                                    faculty: 'Faculty of Business and Management Studies', dues_amount: 150.00 },
  { id: 'dept-psm-803',  name: 'Procurement & Supply Chain Management',             faculty: 'Faculty of Business and Management Studies', dues_amount: 150.00 },
  { id: 'dept-sms-804',  name: 'Secretaryship & Management Studies',                faculty: 'Faculty of Business and Management Studies', dues_amount: 150.00 },
  // Faculty of Applied Social Sciences
  { id: 'dept-comm-901', name: 'Communication Studies',                             faculty: 'Faculty of Applied Social Sciences', dues_amount: 150.00 },
  { id: 'dept-eng-902',  name: 'English',                                            faculty: 'Faculty of Applied Social Sciences', dues_amount: 150.00 },
  { id: 'dept-fr-903',   name: 'French',                                             faculty: 'Faculty of Applied Social Sciences', dues_amount: 150.00 },
];

async function seedDepartments() {
  console.log(`\n🌱 Seeding ${departments.length} departments into Supabase...\n`);

  const { data, error } = await supabase
    .from('departments')
    .upsert(departments, { onConflict: 'id' })
    .select();

  if (error) {
    console.error('❌ Error inserting departments:', error.message);
    process.exit(1);
  }

  console.log(`✅ Successfully seeded ${data.length} departments:\n`);

  const byFaculty = {};
  data.forEach(d => {
    if (!byFaculty[d.faculty]) byFaculty[d.faculty] = [];
    byFaculty[d.faculty].push(d.name);
  });

  Object.entries(byFaculty).forEach(([faculty, depts]) => {
    console.log(`📚 ${faculty} (${depts.length} dept${depts.length > 1 ? 's' : ''})`);
    depts.forEach(d => console.log(`   • ${d}`));
    console.log('');
  });

  console.log('🎉 Done! All departments are now live in Supabase.');
}

seedDepartments();
