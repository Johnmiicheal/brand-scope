#!/usr/bin/env node

// Test script for cron routes
const CRON_SECRET = process.env.CRON_SECRET;
const BASE_URL = 'http://localhost:3000';

async function testCronProcessQuery() {
  console.log('🧪 Testing cron-process-query...');
  console.log(`🔑 Using CRON_SECRET: ${CRON_SECRET.substring(0, 8)}...`);
  
  try {
    const response = await fetch(`${BASE_URL}/api/cron-process-query`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${CRON_SECRET}`,
        'Content-Type': 'application/json',
      },
    });

    console.log(`📡 Response Status: ${response.status}`);
    
    if (response.status === 401) {
      const text = await response.text();
      console.error('❌ Unauthorized! Check your CRON_SECRET.');
      console.error('Response:', text);
      return;
    }

    // Try to parse as JSON, fallback to text
    let data;
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    } else {
      data = await response.text();
    }
    
    console.log('✅ cron-process-query Response:');
    console.log(typeof data === 'string' ? data : JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('❌ cron-process-query Error:', error.message);
  }
}

async function testProcessNextBatch() {
  console.log('\n🧪 Testing process-next-batch...');
  console.log(`🔑 Using CRON_SECRET: ${CRON_SECRET.substring(0, 8)}...`);
  
  try {
    const response = await fetch(`${BASE_URL}/api/process-next-batch`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${CRON_SECRET}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        batchSize: 3,
        offset: 0
      })
    });

    console.log(`📡 Response Status: ${response.status}`);
    
    if (response.status === 401) {
      const text = await response.text();
      console.error('❌ Unauthorized! Check your CRON_SECRET.');
      console.error('Response:', text);
      return;
    }

    // Try to parse as JSON, fallback to text
    let data;
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    } else {
      data = await response.text();
    }
    
    console.log('✅ process-next-batch Response:');
    console.log(typeof data === 'string' ? data : JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('❌ process-next-batch Error:', error.message);
  }
}

async function runTests() {
  console.log('🚀 Starting cron route tests...\n');
  await testCronProcessQuery();
  await testProcessNextBatch();
  console.log('\n✨ Tests completed!');
}

runTests();