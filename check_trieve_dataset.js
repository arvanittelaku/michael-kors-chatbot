const axios = require('axios');

// Trieve Configuration
const TRIEVE_CONFIG = {
  apiKey: 'tr-HTv41SQt3FTCBEsIU6vT43X3xj8Qaolg',
  datasetId: 'da45df92-5f1e-45f3-94b0-e0c5a6562043',
  organizationId: '013878ea-2998-4fed-ac8e-1c4f10bcbd44',
  baseUrl: 'https://api.trieve.ai'
};

async function checkAndCreateDataset() {
  console.log('🔍 Checking Trieve dataset...\n');
  
  try {
    // First, let's try to get the dataset
    console.log('1️⃣ Checking if dataset exists...');
    const response = await axios.get(
      `${TRIEVE_CONFIG.baseUrl}/api/dataset/${TRIEVE_CONFIG.datasetId}`,
      {
        headers: {
          'Authorization': `Bearer ${TRIEVE_CONFIG.apiKey}`,
          'TR-Organization': TRIEVE_CONFIG.organizationId
        }
      }
    );
    
    console.log('✅ Dataset exists!');
    console.log('   Dataset info:', response.data);
    
  } catch (error) {
    if (error.response?.status === 404) {
      console.log('❌ Dataset not found. Let\'s create it...');
      await createDataset();
    } else {
      console.error('❌ Error checking dataset:', error.response?.data || error.message);
    }
  }
}

async function createDataset() {
  try {
    console.log('2️⃣ Creating new dataset...');
    
    const response = await axios.post(
      `${TRIEVE_CONFIG.baseUrl}/api/dataset`,
      {
        name: 'Michael Kors Products',
        description: 'Michael Kors handbags and accessories product catalog',
        dataset_id: TRIEVE_CONFIG.datasetId
      },
      {
        headers: {
          'Authorization': `Bearer ${TRIEVE_CONFIG.apiKey}`,
          'Content-Type': 'application/json',
          'TR-Organization': TRIEVE_CONFIG.organizationId
        }
      }
    );
    
    console.log('✅ Dataset created successfully!');
    console.log('   Dataset info:', response.data);
    
  } catch (error) {
    console.error('❌ Error creating dataset:', error.response?.data || error.message);
  }
}

async function listDatasets() {
  try {
    console.log('3️⃣ Listing all datasets...');
    
    const response = await axios.get(
      `${TRIEVE_CONFIG.baseUrl}/api/dataset`,
      {
        headers: {
          'Authorization': `Bearer ${TRIEVE_CONFIG.apiKey}`,
          'TR-Organization': TRIEVE_CONFIG.organizationId
        }
      }
    );
    
    console.log('✅ Available datasets:');
    response.data.forEach((dataset, index) => {
      console.log(`   ${index + 1}. ${dataset.name} (ID: ${dataset.id})`);
    });
    
  } catch (error) {
    console.error('❌ Error listing datasets:', error.response?.data || error.message);
  }
}

// Run the checks
async function main() {
  await checkAndCreateDataset();
  await listDatasets();
}

main();
