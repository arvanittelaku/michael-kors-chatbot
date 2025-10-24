/**
 * Size Filtering Bug Test
 * Reproduces the dress size filtering issue
 */

const axios = require('axios');

const API_URL = 'https://michael-kors-chatbot.onrender.com';

const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

async function sendMessage(message, sessionId) {
  try {
    const response = await axios.post(`${API_URL}/chat`, {
      userId: sessionId,
      message: message
    }, {
      headers: { 'Content-Type': 'application/json' },
      timeout: 30000
    });
    
    return {
      success: true,
      message: response.data.message,
      products: response.data.products || []
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

async function testSizeFiltering() {
  console.log(`${colors.cyan}Testing Size Filtering Bug${colors.reset}\n`);
  
  const sessionId = `test_size_${Date.now()}`;
  
  // Step 1: List available dress brands
  console.log(`${colors.blue}Step 1: List dress brands${colors.reset}`);
  const r1 = await sendMessage('qfar brende te fustanave keni', sessionId);
  console.log(`Response: ${r1.message.substring(0, 80)}...`);
  console.log(`Products: ${r1.products.length} dresses`);
  console.log(`Sizes: ${r1.products.map(p => p.size).join(', ')}`);
  console.log(`Brands: ${[...new Set(r1.products.map(p => p.brand))].join(', ')}\n`);
  
  // Step 2: Request size 50 (doesn't exist)
  console.log(`${colors.blue}Step 2: Request dress size 50${colors.reset}`);
  const r2 = await sendMessage('dua nje te madhsise 50', sessionId);
  console.log(`Response: ${r2.message}`);
  console.log(`Products: ${r2.products.length}`);
  
  const saysNoDresses = r2.message.includes('Nuk gjeta fustan');
  const shouldSaySize = r2.message.includes('madhësi') || r2.message.includes('madhesi');
  
  if (saysNoDresses) {
    console.log(`${colors.red}❌ BUG: Says "Nuk gjeta fustan" (no dresses at all)${colors.reset}`);
    console.log(`${colors.yellow}Should say: "Size 50 not available, available sizes are: 40, 42, 44"${colors.reset}\n`);
  } else if (shouldSaySize) {
    console.log(`${colors.green}✓ Correctly mentions size availability${colors.reset}\n`);
  } else {
    console.log(`${colors.yellow}⚠️  Unknown response${colors.reset}\n`);
  }
  
  // Step 3: Request size XL (doesn't exist)
  console.log(`${colors.blue}Step 3: Request dress size XL${colors.reset}`);
  const r3 = await sendMessage('dua nje fustan te madhsise xl', sessionId);
  console.log(`Response: ${r3.message}`);
  console.log(`Products: ${r3.products.length}`);
  
  const saysNoDresses2 = r3.message.includes('Nuk gjeta fustan');
  const shouldSaySize2 = r3.message.includes('madhësi') || r3.message.includes('madhesi');
  
  if (saysNoDresses2) {
    console.log(`${colors.red}❌ BUG: Says "Nuk gjeta fustan" (no dresses at all)${colors.reset}`);
    console.log(`${colors.yellow}Should say: "Size XL not available, available sizes are: 40, 42, 44"${colors.reset}\n`);
  } else if (shouldSaySize2) {
    console.log(`${colors.green}✓ Correctly mentions size availability${colors.reset}\n`);
  } else {
    console.log(`${colors.yellow}⚠️  Unknown response${colors.reset}\n`);
  }
  
  // Step 4: Request size 42 (exists)
  console.log(`${colors.blue}Step 4: Request dress size 42 (should work)${colors.reset}`);
  const r4 = await sendMessage('dua nje fustan te madhsise 42', sessionId);
  console.log(`Response: ${r4.message.substring(0, 80)}...`);
  console.log(`Products: ${r4.products.length}`);
  console.log(`All size 42: ${r4.products.every(p => p.size == 42)}`);
  
  if (r4.products.length > 0 && r4.products.every(p => p.size == 42)) {
    console.log(`${colors.green}✓ Size 42 filtering works${colors.reset}\n`);
  } else if (r4.products.length === 0) {
    console.log(`${colors.red}❌ BUG: Size 42 should return dresses!${colors.reset}\n`);
  } else {
    console.log(`${colors.yellow}⚠️  Returned mixed sizes${colors.reset}\n`);
  }
  
  // Summary
  console.log(`${colors.cyan}═══════════════════════════════════════${colors.reset}`);
  console.log(`${colors.cyan}SUMMARY${colors.reset}`);
  console.log(`${colors.cyan}═══════════════════════════════════════${colors.reset}`);
  
  if (saysNoDresses || saysNoDresses2) {
    console.log(`${colors.red}BUG CONFIRMED:${colors.reset} Bot says "Nuk gjeta fustan" when size doesn't match`);
    console.log(`${colors.yellow}Expected:${colors.reset} Should say "Size not available, here are available sizes"`);
    console.log(`${colors.yellow}This is the SAME as the SHEFAME bug - filter vs existence confusion${colors.reset}`);
  } else {
    console.log(`${colors.green}Size filtering working correctly${colors.reset}`);
  }
}

testSizeFiltering().catch(error => {
  console.error(`${colors.red}Error:${colors.reset}`, error);
  process.exit(1);
});

