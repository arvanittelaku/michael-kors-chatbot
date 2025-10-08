const { normalizeColor } = require('./server/dist/services/chatbot/ColorNormalizer');

// Test the filtering logic
function testProductMatchesFilters(p, filters) {
  console.log(`\nTesting product: "${p.name}" with color "${p.color}"`);
  console.log(`Filter color: "${filters.color}"`);
  
  if (filters.color && p.color) {
    const filterColor = normalizeColor(filters.color);
    const productColor = normalizeColor(p.color);
    
    console.log(`Filter normalized: "${filterColor}"`);
    console.log(`Product normalized: "${productColor}"`);
    
    // If we can't normalize the filter color, skip color filtering
    if (!filterColor) {
      console.log(`⚠️ Cannot normalize filter color "${filters.color}", skipping color filter`);
      return true;
    }
    
    // If we can't normalize the product color, reject it (strict filtering)
    if (!productColor) {
      console.log(`❌ Cannot normalize product color "${p.color}", rejecting product`);
      return false;
    }
    
    // Only pass if colors match
    if (filterColor !== productColor) {
      console.log(`❌ Color mismatch: "${filterColor}" !== "${productColor}", rejecting product`);
      return false;
    }
    
    console.log(`✅ Color match: "${filterColor}" === "${productColor}", accepting product`);
    return true;
  }
  
  console.log(`No color filter applied`);
  return true;
}

// Test cases
const testProducts = [
  { name: "KËMISHË", color: "BLACK" },
  { name: "KËMISHË", color: "131" },
  { name: "KËMISHË", color: "NAVY" },
  { name: "KËMISHË", color: "DARK BLUE" },
  { name: "KËMISHË", color: "LIGHT/PASTEL BLUE" }
];

const filter = { color: "kaltër" };

console.log('Testing color filtering logic:');
testProducts.forEach(product => {
  const result = testProductMatchesFilters(product, filter);
  console.log(`Result: ${result ? 'PASS' : 'REJECT'}`);
});


