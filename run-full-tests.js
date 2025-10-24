/**
 * Test Runner - Waits for deployment and runs all tests
 */

const axios = require('axios');
const { spawn } = require('child_process');

const API_URL = 'https://michael-kors-chatbot.onrender.com';
const DEPLOYMENT_CHECK_INTERVAL = 10000; // 10 seconds
const MAX_WAIT_TIME = 300000; // 5 minutes

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

/**
 * Check if API is responding
 */
async function checkAPI() {
  try {
    const response = await axios.get(API_URL, { timeout: 5000 });
    return response.status === 200;
  } catch (error) {
    return false;
  }
}

/**
 * Wait for deployment to complete
 */
async function waitForDeployment() {
  console.log(`${colors.cyan}${colors.bright}Waiting for Render deployment...${colors.reset}`);
  console.log(`${colors.blue}Checking ${API_URL}${colors.reset}\n`);
  
  const startTime = Date.now();
  let attempts = 0;
  
  while (Date.now() - startTime < MAX_WAIT_TIME) {
    attempts++;
    process.stdout.write(`${colors.yellow}Attempt ${attempts}...${colors.reset} `);
    
    const isReady = await checkAPI();
    
    if (isReady) {
      console.log(`${colors.green}✓ API is ready!${colors.reset}\n`);
      return true;
    }
    
    console.log(`${colors.yellow}Not ready yet${colors.reset}`);
    await new Promise(resolve => setTimeout(resolve, DEPLOYMENT_CHECK_INTERVAL));
  }
  
  console.log(`${colors.yellow}\n⚠️  Max wait time reached. Proceeding with tests anyway...${colors.reset}\n`);
  return false;
}

/**
 * Run a test script
 */
function runTestScript(scriptName) {
  return new Promise((resolve, reject) => {
    console.log(`${colors.cyan}${colors.bright}Running ${scriptName}...${colors.reset}\n`);
    
    const testProcess = spawn('node', [scriptName], {
      stdio: 'inherit',
      shell: true
    });
    
    testProcess.on('close', (code) => {
      resolve(code);
    });
    
    testProcess.on('error', (error) => {
      reject(error);
    });
  });
}

/**
 * Main test runner
 */
async function main() {
  console.log(`${colors.bright}${colors.cyan}`);
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║              FULL CHATBOT TEST SUITE                      ║');
  console.log('╚════════════════════════════════════════════════════════════╝');
  console.log(colors.reset);
  console.log();
  
  // Wait for deployment
  await waitForDeployment();
  
  const results = {
    comprehensive: null,
    edgeCases: null
  };
  
  try {
    // Run comprehensive tests
    results.comprehensive = await runTestScript('test-chatbot-comprehensive.js');
  } catch (error) {
    console.error(`${colors.yellow}Comprehensive tests failed to run:${colors.reset}`, error.message);
    results.comprehensive = 1;
  }
  
  console.log('\n' + '═'.repeat(60) + '\n');
  
  try {
    // Run edge case tests
    results.edgeCases = await runTestScript('test-chatbot-edge-cases.js');
  } catch (error) {
    console.error(`${colors.yellow}Edge case tests failed to run:${colors.reset}`, error.message);
    results.edgeCases = 1;
  }
  
  // Final summary
  console.log('\n' + '═'.repeat(60));
  console.log(`${colors.bright}${colors.cyan}FINAL SUMMARY${colors.reset}`);
  console.log('═'.repeat(60) + '\n');
  
  console.log(`Comprehensive Tests: ${results.comprehensive === 0 ? colors.green + '✓ PASSED' : colors.yellow + '⚠ FAILED'}${colors.reset}`);
  console.log(`Edge Case Tests:     ${results.edgeCases === 0 ? colors.green + '✓ PASSED' : colors.yellow + '⚠ FAILED'}${colors.reset}`);
  
  const allPassed = results.comprehensive === 0 && results.edgeCases === 0;
  
  if (allPassed) {
    console.log(`\n${colors.green}${colors.bright}🎉 ALL TESTS PASSED! 🎉${colors.reset}`);
    console.log(`${colors.green}Chatbot is production-ready!${colors.reset}\n`);
  } else {
    console.log(`\n${colors.yellow}${colors.bright}⚠️  SOME TESTS FAILED${colors.reset}`);
    console.log(`${colors.yellow}Review the test output above for details.${colors.reset}\n`);
  }
  
  process.exit(allPassed ? 0 : 1);
}

main().catch(error => {
  console.error(`${colors.yellow}Fatal error:${colors.reset}`, error);
  process.exit(1);
});

