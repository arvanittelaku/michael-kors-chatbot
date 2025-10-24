/**
 * Wait for Render deployment to complete
 */

const axios = require('axios');

const API_URL = 'https://michael-kors-chatbot.onrender.com';
const MAX_WAIT = 180; // 3 minutes
const CHECK_INTERVAL = 10; // 10 seconds

async function testDeployment() {
  try {
    const response = await axios.post(`${API_URL}/chat`, {
      userId: 'deployment-check',
      message: 'peshqir nën 20'
    }, { timeout: 10000 });
    
    return response.data.products.length > 0;
  } catch (error) {
    return false;
  }
}

async function waitForDeployment() {
  console.log('⏳ Waiting for Render deployment to complete...');
  console.log(`   Testing every ${CHECK_INTERVAL}s for up to ${MAX_WAIT}s\n`);
  
  let elapsed = 0;
  
  while (elapsed < MAX_WAIT) {
    process.stdout.write(`   ⏱️  ${elapsed}s - Testing deployment... `);
    
    const isReady = await testDeployment();
    
    if (isReady) {
      console.log('✅ DEPLOYED!\n');
      console.log('🎉 Deployment successful! Price filtering is now working.');
      return true;
    }
    
    console.log('❌ Not yet');
    
    await new Promise(resolve => setTimeout(resolve, CHECK_INTERVAL * 1000));
    elapsed += CHECK_INTERVAL;
  }
  
  console.log('\n⚠️  Timeout reached. Deployment may still be in progress.');
  console.log('   You can manually rerun tests with: node test-suite-comprehensive.js');
  return false;
}

waitForDeployment().catch(console.error);

