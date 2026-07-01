/**
 * HTU Clear Payments Script
 * Deletes all payment records from the Supabase database.
 * Run with: node clear-payments.js
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

async function clearPayments() {
  console.log('\n🧹 Clearing all payments from Supabase...\n');

  const { data, error } = await supabase
    .from('payments')
    .delete()
    .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all rows where ID matches anything

  if (error) {
    console.error('❌ Error clearing payments:', error.message);
    process.exit(1);
  }

  console.log('✅ Successfully cleared all payments from the live Supabase database!');
  console.log('🎉 You are now starting from scratch!');
}

clearPayments();
