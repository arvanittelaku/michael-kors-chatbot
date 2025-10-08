// Debug environment variables
require('dotenv').config({ path: '../.env' });

console.log('🔍 Environment Variables Debug:');
console.log('================================');
console.log('TRIEVE_API_KEY:', process.env.TRIEVE_API_KEY ? 'Configured' : 'NOT CONFIGURED');
console.log('TRIEVE_DATASET_ID:', process.env.TRIEVE_DATASET_ID ? 'Configured' : 'NOT CONFIGURED');
console.log('TRIEVE_ORGANIZATION_ID:', process.env.TRIEVE_ORGANIZATION_ID ? 'Configured' : 'NOT CONFIGURED');

if (process.env.TRIEVE_API_KEY) {
  console.log('API Key length:', process.env.TRIEVE_API_KEY.length);
  console.log('API Key starts with:', process.env.TRIEVE_API_KEY.substring(0, 10) + '...');
}

if (process.env.TRIEVE_DATASET_ID) {
  console.log('Dataset ID:', process.env.TRIEVE_DATASET_ID);
}

if (process.env.TRIEVE_ORGANIZATION_ID) {
  console.log('Organization ID:', process.env.TRIEVE_ORGANIZATION_ID);
}
