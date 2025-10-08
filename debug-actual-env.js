// Debug actual environment variables being loaded
require('dotenv').config({ path: '../.env' });

console.log('🔍 Actual Environment Variables:');
console.log('================================');
console.log('TRIEVE_API_KEY:', process.env.TRIEVE_API_KEY);
console.log('TRIEVE_DATASET_ID:', process.env.TRIEVE_DATASET_ID);
console.log('TRIEVE_ORGANIZATION_ID:', process.env.TRIEVE_ORGANIZATION_ID);

console.log('\n🔍 Working Credentials (from test file):');
console.log('=========================================');
console.log('API_KEY: tr-KGyOrhtz7ngWpdrvrFsd8Rh7i64VRhfU');
console.log('DATASET_ID: d07948bc-576d-403c-9ca8-4b264b006aa1');
console.log('ORG_ID: 013878ea-2998-4fed-ac8e-1c4f10bcbd44');

console.log('\n🔍 Comparison:');
console.log('==============');
console.log('API_KEY match:', process.env.TRIEVE_API_KEY === 'tr-KGyOrhtz7ngWpdrvrFsd8Rh7i64VRhfU');
console.log('DATASET_ID match:', process.env.TRIEVE_DATASET_ID === 'd07948bc-576d-403c-9ca8-4b264b006aa1');
console.log('ORG_ID match:', process.env.TRIEVE_ORGANIZATION_ID === '013878ea-2998-4fed-ac8e-1c4f10bcbd44');



