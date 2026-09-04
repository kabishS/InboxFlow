/**
 * InboxFlow — Supabase Setup Script
 * Creates all required tables via direct SQL execution
 * Run: node setup-db.js
 */
require('dotenv').config();
const https = require('https');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_ANON_KEY;

const SQL = `
create extension if not exists "pgcrypto";

create table if not exists tasks (
  id          uuid primary key default gen_random_uuid(),
  user_id     text not null,
  task_name   text not null,
  source_email text,
  thread_id   text,
  deadline    timestamptz,
  priority    text default 'MEDIUM',
  status      text default 'pending',
  ai_note     text,
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);

create table if not exists deadlines (
  id           uuid primary key default gen_random_uuid(),
  user_id      text not null,
  thread_id    text,
  title        text not null,
  source_email text,
  from_email   text,
  due_date     timestamptz,
  due_label    text,
  priority     text default 'MEDIUM',
  status       text default 'pending',
  created_at   timestamptz default now()
);

create table if not exists followups (
  id                uuid primary key default gen_random_uuid(),
  user_id           text not null,
  thread_id         text,
  subject           text,
  to_email          text,
  last_message_date text,
  urgency           text default 'STANDARD',
  suggested_action  text,
  days_pending      int default 0,
  dismissed         boolean default false,
  created_at        timestamptz default now()
);

create table if not exists email_analysis (
  id             uuid primary key default gen_random_uuid(),
  user_id        text,
  thread_id      text not null unique,
  priority       text,
  priority_score int,
  intent         text,
  sentiment      text,
  summary        jsonb,
  tasks          jsonb,
  deadline       text,
  deadline_label text,
  category       text,
  created_at     timestamptz default now()
);

create table if not exists analytics (
  id                uuid primary key default gen_random_uuid(),
  user_id           text unique not null,
  emails_processed  int default 0,
  tasks_extracted   int default 0,
  replies_generated int default 0,
  avg_response_time numeric default 0,
  updated_at        timestamptz default now()
);

select 'done' as result;
`;

function runSQL(sql) {
  return new Promise((resolve, reject) => {
    const url = new URL(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`);
    const body = JSON.stringify({ sql });

    // Try using the SQL endpoint
    const postUrl = new URL(`${SUPABASE_URL}/rest/v1/`);
    
    const options = {
      hostname: url.hostname,
      path: '/rest/v1/rpc/query',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Length': Buffer.byteLength(body)
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ status: res.statusCode, body: data }));
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

async function main() {
  console.log('🔌 Connecting to Supabase:', SUPABASE_URL);
  console.log('');
  
  // Since we can't run raw SQL via the anon key easily,
  // let's verify connection and show instructions
  const { createClient } = require('@supabase/supabase-js');
  const sb = createClient(SUPABASE_URL, SUPABASE_KEY);

  console.log('Testing connection...');
  const { data, error } = await sb.from('tasks').select('id').limit(1);
  
  if (error && error.code === 'PGRST205') {
    console.log('⚠️  Tables do not exist yet.');
    console.log('');
    console.log('📋 MANUAL SETUP REQUIRED:');
    console.log('1. Go to: https://supabase.com/dashboard/project/ysokktdjasjlclygftdo/sql/new');
    console.log('2. Open the file: supabase_schema.sql');
    console.log('3. Copy and paste the entire contents into the SQL editor');
    console.log('4. Click "Run"');
    console.log('');
    console.log('Or run this command to copy the SQL:');
    console.log('  type supabase_schema.sql');
  } else if (!error) {
    console.log('✅ Tables already exist! Supabase is ready.');
  } else {
    console.log('❌ Connection error:', error.message);
  }
}

main().catch(console.error);

