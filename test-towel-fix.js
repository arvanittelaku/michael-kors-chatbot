const axios = require('axios');

async function testTowelFix() {
  try {
    console.log('🧪 Testing towel category fix...');
    
    const response = await axios.post('http://localhost:5000/chat', {
      userId: 'test_user',
      message: 'Kam nevojë për peshqir'
    });
    
    console.log('✅ Response received');
    console.log('📝 AI Message:', response.data.message.substring(0, 100) + '...');
    console.log('📦 Products returned:', response.data.products.length);
    
    if (response.data.products.length > 0) {
      console.log('🏷️ Product names:', response.data.products.map(p => p.name).join(', '));
      console.log('🎨 Product colors:', response.data.products.map(p => p.color).join(', '));
      
      // Check if we only get face towels (peshqir) and not bath towels (mantel)
      const hasFaceTowels = response.data.products.some(p => 
        p.name.toLowerCase().includes('peshqir') || 
        p.name.toLowerCase().includes('face')
      );
      const hasBathTowels = response.data.products.some(p => 
        p.name.toLowerCase().includes('mantel') || 
        p.name.toLowerCase().includes('bath')
      );
      
      console.log('🔍 Face towels found:', hasFaceTowels);
      console.log('🔍 Bath towels found:', hasBathTowels);
      
      if (hasFaceTowels && !hasBathTowels) {
        console.log('✅ SUCCESS: Only face towels returned!');
      } else if (hasBathTowels) {
        console.log('❌ FAILED: Bath towels still being returned');
      } else {
        console.log('⚠️ WARNING: No towels found at all');
      }
    } else {
      console.log('⚠️ No products returned');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testTowelFix();
