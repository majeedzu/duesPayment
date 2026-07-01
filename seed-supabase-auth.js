const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

function parseEnv() {
  const envPath = path.join(__dirname, '.env.local');
  if (!fs.existsSync(envPath)) {
    console.error('Error: .env.local file not found in project root.');
    return {};
  }
  const fileContent = fs.readFileSync(envPath, 'utf8');
  const env = {};
  fileContent.split('\n').forEach(line => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const parts = trimmed.split('=');
      const key = parts[0].trim();
      const val = parts.slice(1).join('=').trim().replace(/(^['"]|['"]$)/g, '');
      if (key) env[key] = val;
    }
  });
  return env;
}

async function runSeed() {
  const env = parseEnv();
  const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl) {
    console.error('Error: NEXT_PUBLIC_SUPABASE_URL is missing in .env.local.');
    return;
  }

  if (!serviceRoleKey) {
    console.error('\n========================================================================');
    console.error('ERROR: SUPABASE_SERVICE_ROLE_KEY is missing/empty in .env.local.');
    console.error('To proceed, please:');
    console.error('1. Go to your Supabase Dashboard (https://supabase.com/dashboard)');
    console.error('2. Navigate to Project Settings -> API');
    console.error('3. Copy the "service_role" secret key (NOT the anon/public key)');
    console.error('4. Paste it as SUPABASE_SERVICE_ROLE_KEY=your_key_here in .env.local');
    console.error('5. Save .env.local and ask me to run the seed script again.');
    console.error('========================================================================\n');
    return;
  }

  console.log('Connecting to Supabase...');
  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });

  const mockDbPath = path.join(__dirname, 'lib', 'mock_db.json');
  if (!fs.existsSync(mockDbPath)) {
    console.error('Error: mock_db.json not found at ' + mockDbPath);
    return;
  }

  const mockData = JSON.parse(fs.readFileSync(mockDbPath, 'utf8'));

  // 1. Seed Departments
  console.log('\nSeeding Departments...');
  if (mockData.departments && mockData.departments.length > 0) {
    for (const dept of mockData.departments) {
      const { error } = await supabase.from('departments').upsert(dept);
      if (error) {
        console.error(`Failed to seed department ${dept.name}:`, error.message);
      } else {
        console.log(`- Seeded department: ${dept.name} (${dept.id})`);
      }
    }
  }

  // 2. Seed Students
  console.log('\nSeeding Students...');
  if (mockData.students && mockData.students.length > 0) {
    for (const student of mockData.students) {
      const { error } = await supabase.from('students').upsert(student);
      if (error) {
        console.error(`Failed to seed student ${student.full_name}:`, error.message);
      } else {
        console.log(`- Seeded student: ${student.full_name} (${student.index_number})`);
      }
    }
  }

  // 3. Seed Users in Supabase Auth & public.profiles
  console.log('\nSeeding Users and Profiles to Supabase Auth...');
  if (mockData.profiles && mockData.profiles.length > 0) {
    for (const profile of mockData.profiles) {
      const { email, password, role, full_name, department_id } = profile;
      console.log(`Processing: ${email} (${role})`);

      // Check if user already exists in profiles
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', email)
        .maybeSingle();

      if (existingProfile) {
        console.log(`- Profile already exists for ${email}. Skipping.`);
        continue;
      }

      // Create user in Auth
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email,
        password: password || 'password123',
        email_confirm: true,
        user_metadata: { role, full_name }
      });

      if (authError) {
        console.error(`- Error creating Auth user for ${email}:`, authError.message);
        continue;
      }

      // Create profile record mapping to the auth user id
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: authData.user.id,
          email,
          role,
          full_name,
          department_id: department_id || null
        });

      if (profileError) {
        console.error(`- Error creating public profile for ${email}:`, profileError.message);
      } else {
        console.log(`- Successfully created Auth user & profile for: ${full_name} (${email})`);
      }
    }
  }

  console.log('\nSeeding process completed!');
}

runSeed().catch(err => {
  console.error('Unhandled Seeding Error:', err);
});
