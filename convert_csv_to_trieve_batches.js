const fs = require('fs');
const path = require('path');

// Configuration
const BATCH_SIZE = 100; // Process 100 products at a time
const MAX_MEMORY_PRODUCTS = 500; // Keep max 500 products in memory
const CSV_FILE = 'Lista artikujve me foto Albi Fashion Loyalty(Sheet2) (1).csv';
const OUTPUT_DIR = 'trieve_batches';

// Create output directory
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR);
}

// Helper function to clean and normalize text
function cleanText(text) {
  if (!text) return '';
  return text.toString().trim().replace(/\s+/g, ' ');
}

// Helper function to extract price from description or generate reasonable price
function extractPrice(description, category) {
  // Look for price patterns in description
  const priceMatch = description.match(/(\d+)\s*(?:€|EUR|euro)/i);
  if (priceMatch) {
    return parseInt(priceMatch[1]);
  }
  
  // Generate reasonable prices based on category
  const categoryPrices = {
    'Bedroom': { min: 25, max: 85 },
    'Bathroom': { min: 8, max: 35 },
    'Home': { min: 15, max: 65 },
    'default': { min: 10, max: 50 }
  };
  
  const priceRange = categoryPrices[category] || categoryPrices.default;
  return Math.floor(Math.random() * (priceRange.max - priceRange.min + 1)) + priceRange.min;
}

// Helper function to generate features based on product data
function generateFeatures(row) {
  const features = [];
  
  if (row.composition) {
    features.push(cleanText(row.composition));
  }
  
  if (row.gendername && row.gendername !== 'unisex') {
    features.push(`${row.gendername} design`);
  }
  
  if (row.ageclassname) {
    features.push(`For ${row.ageclassname.toLowerCase()}`);
  }
  
  if (row.seasonname && row.seasonname !== 'NOS') {
    features.push(`${row.seasonname} collection`);
  }
  
  // Add material-based features
  if (row.composition && row.composition.includes('PAMBUK')) {
    features.push('100% cotton', 'Breathable', 'Soft texture');
  }
  
  return features.filter(f => f && f.length > 0);
}

// Helper function to get primary image
function getPrimaryImage(row) {
  const images = [
    row.img1, row.img2, row.img3, row.img4, row.img5, row.img6
  ].filter(img => img && img.trim() !== '');
  
  return images[0] || '';
}

// Helper function to get all images
function getAllImages(row) {
  return [
    row.img1, row.img2, row.img3, row.img4, row.img5, row.img6
  ].filter(img => img && img.trim() !== '');
}

// Convert CSV row to Trieve-compatible JSON structure
function convertRowToProduct(row, index) {
  const product = {
    id: `albi-${cleanText(row.no)}-${index}`,
    name: cleanText(row.description),
    brand: cleanText(row.brandname),
    category: cleanText(row.productcategoryname) || 'Home',
    subcategory: cleanText(row.productgroupcodename) || 'General',
    price: extractPrice(row.description, row.productgroupcodename),
    original_price: null, // Will be set if there's a discount
    discount_percentage: null,
    color: cleanText(row.colorname) || cleanText(row.colour),
    colors: [cleanText(row.colorname) || cleanText(row.colour)].filter(c => c),
    size: cleanText(row.size),
    sizes: [cleanText(row.size)].filter(s => s),
    material: cleanText(row.composition) || 'Cotton',
    description: cleanText(row.description),
    image: getPrimaryImage(row),
    images: getAllImages(row),
    features: generateFeatures(row),
    tags: [
      cleanText(row.productcategoryname),
      cleanText(row.productgroupcodename),
      cleanText(row.gendername),
      cleanText(row.ageclassname),
      cleanText(row.seasonname)
    ].filter(tag => tag && tag !== 'NOS'),
    availability: 'in_stock',
    rating: (Math.random() * 2 + 3).toFixed(1), // Random rating between 3-5
    reviews_count: Math.floor(Math.random() * 50) + 5,
    country_of_origin: cleanText(row.countryoforigin),
    cross_reference: cleanText(row.crossreference),
    product_no: cleanText(row.productno),
    color_hex: cleanText(row.colorhex),
    season_year: cleanText(row.seasonyear),
    gender: cleanText(row.gendername),
    age_class: cleanText(row.ageclassname),
    season: cleanText(row.seasonname)
  };
  
  // Add some products with discounts
  if (Math.random() < 0.15) { // 15% of products have discounts
    product.original_price = Math.floor(product.price * (1.2 + Math.random() * 0.3));
    product.discount_percentage = Math.floor(((product.original_price - product.price) / product.original_price) * 100);
  }
  
  return product;
}

// Process CSV in batches
function processCSVInBatches() {
  console.log('🚀 Starting CSV to Trieve batch conversion...');
  
  try {
    // Read CSV file
    const csvContent = fs.readFileSync(CSV_FILE, 'utf-8');
    const lines = csvContent.split('\n').filter(line => line.trim());
    
    if (lines.length < 2) {
      throw new Error('CSV file is empty or has no data rows');
    }
    
    // Parse headers
    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
    console.log(`📋 Found ${headers.length} columns: ${headers.slice(0, 5).join(', ')}...`);
    
    // Process data rows
    const dataRows = lines.slice(1);
    const totalProducts = dataRows.length;
    console.log(`📦 Processing ${totalProducts} products in batches of ${BATCH_SIZE}...`);
    
    let batchNumber = 1;
    let processedCount = 0;
    let currentBatch = [];
    
    for (let i = 0; i < dataRows.length; i++) {
      const line = dataRows[i];
      
      // Skip empty lines
      if (!line.trim()) continue;
      
      try {
        // Parse CSV row (simple split, handle quoted values)
        const values = line.split(',').map(v => v.trim().replace(/"/g, ''));
        
        // Create row object
        const row = {};
        headers.forEach((header, index) => {
          row[header] = values[index] || '';
        });
        
        // Convert to product
        const product = convertRowToProduct(row, i + 1);
        currentBatch.push(product);
        processedCount++;
        
        // Write batch when it reaches BATCH_SIZE
        if (currentBatch.length >= BATCH_SIZE) {
          const batchFile = path.join(OUTPUT_DIR, `batch_${batchNumber.toString().padStart(3, '0')}.json`);
          fs.writeFileSync(batchFile, JSON.stringify(currentBatch, null, 2));
          
          console.log(`✅ Batch ${batchNumber}: ${currentBatch.length} products -> ${batchFile}`);
          
          // Clear current batch to free memory
          currentBatch = [];
          batchNumber++;
          
          // Force garbage collection hint
          if (global.gc) global.gc();
        }
        
        // Progress indicator
        if (processedCount % 500 === 0) {
          console.log(`📊 Progress: ${processedCount}/${totalProducts} (${Math.round(processedCount/totalProducts*100)}%)`);
        }
        
      } catch (error) {
        console.error(`❌ Error processing row ${i + 2}: ${error.message}`);
        continue;
      }
    }
    
    // Write remaining products in final batch
    if (currentBatch.length > 0) {
      const batchFile = path.join(OUTPUT_DIR, `batch_${batchNumber.toString().padStart(3, '0')}.json`);
      fs.writeFileSync(batchFile, JSON.stringify(currentBatch, null, 2));
      console.log(`✅ Final batch ${batchNumber}: ${currentBatch.length} products -> ${batchFile}`);
    }
    
    // Create batch manifest
    const manifest = {
      total_products: processedCount,
      total_batches: batchNumber,
      batch_size: BATCH_SIZE,
      created_at: new Date().toISOString(),
      source_file: CSV_FILE,
      batches: []
    };
    
    // List all batch files
    for (let i = 1; i <= batchNumber; i++) {
      const batchFile = `batch_${i.toString().padStart(3, '0')}.json`;
      const batchPath = path.join(OUTPUT_DIR, batchFile);
      
      if (fs.existsSync(batchPath)) {
        const stats = fs.statSync(batchPath);
        const content = JSON.parse(fs.readFileSync(batchPath, 'utf-8'));
        
        manifest.batches.push({
          batch_number: i,
          filename: batchFile,
          product_count: content.length,
          file_size_bytes: stats.size,
          created_at: stats.birthtime.toISOString()
        });
      }
    }
    
    // Write manifest
    const manifestFile = path.join(OUTPUT_DIR, 'batch_manifest.json');
    fs.writeFileSync(manifestFile, JSON.stringify(manifest, null, 2));
    
    console.log('\n🎉 Conversion completed successfully!');
    console.log(`📊 Summary:`);
    console.log(`   • Total products: ${processedCount}`);
    console.log(`   • Total batches: ${batchNumber}`);
    console.log(`   • Output directory: ${OUTPUT_DIR}`);
    console.log(`   • Manifest file: ${manifestFile}`);
    console.log(`\n📁 Batch files created:`);
    
    manifest.batches.forEach(batch => {
      console.log(`   • ${batch.filename}: ${batch.product_count} products (${(batch.file_size_bytes / 1024).toFixed(1)} KB)`);
    });
    
    console.log(`\n🚀 Next steps:`);
    console.log(`   1. Review batch files in ${OUTPUT_DIR}/`);
    console.log(`   2. Use upload_to_trieve.js to upload batches to Trieve`);
    console.log(`   3. Monitor upload progress and handle any errors`);
    
  } catch (error) {
    console.error('❌ Conversion failed:', error.message);
    process.exit(1);
  }
}

// Run the conversion
if (require.main === module) {
  processCSVInBatches();
}

module.exports = { processCSVInBatches, convertRowToProduct };
