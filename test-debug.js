const axios = require('axios');

async function testDebug() {
  try {
    console.log('Testing debug endpoint...');
    const response = await axios.get('http://localhost:5000/debug/last-search?q=kemishe');
    console.log('Debug response:', JSON.stringify(response.data, null, 2));
  } catch (error) {
    console.error('Error:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
    }
  }
}

testDebug();
