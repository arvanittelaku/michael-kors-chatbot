const fs = require('fs');

// Product templates and variations
const productTemplates = [
  {
    name: "Jet Set Travel",
    subcategory: "tote",
    basePrice: 298,
    collections: ["Jet Set Travel", "Jet Set Signature"],
    features: ["leather", "spacious", "multiple compartments", "adjustable straps", "everyday use", "travel"]
  },
  {
    name: "Hamilton",
    subcategory: "satchel", 
    basePrice: 328,
    collections: ["Hamilton", "Hamilton Signature"],
    features: ["leather", "signature lock", "classic design", "work appropriate", "weekend wear"]
  },
  {
    name: "Jet Set Crossbody",
    subcategory: "crossbody",
    basePrice: 198,
    collections: ["Jet Set", "Jet Set Signature"],
    features: ["crossbody", "adjustable strap", "compact", "hands-free", "leather"]
  },
  {
    name: "Rhea",
    subcategory: "backpack",
    basePrice: 228,
    collections: ["Rhea", "Rhea Signature"],
    features: ["backpack", "laptop compartment", "multiple pockets", "daily wear", "leather"]
  },
  {
    name: "Sloan",
    subcategory: "clutch",
    basePrice: 168,
    collections: ["Sloan", "Sloan Signature"],
    features: ["clutch", "evening wear", "compact", "elegant", "leather"]
  },
  {
    name: "Mercer",
    subcategory: "satchel",
    basePrice: 278,
    collections: ["Mercer", "Mercer Signature"],
    features: ["satchel", "structured", "professional", "work appropriate", "leather"]
  },
  {
    name: "Jet Set Travel",
    subcategory: "tote",
    basePrice: 248,
    collections: ["Jet Set Travel", "Jet Set Signature"],
    features: ["tote", "medium size", "organized compartments", "work appropriate", "leather"]
  },
  {
    name: "Hamilton",
    subcategory: "crossbody",
    basePrice: 218,
    collections: ["Hamilton", "Hamilton Signature"],
    features: ["crossbody", "signature lock", "classic design", "hands-free", "leather"]
  },
  {
    name: "Rhea",
    subcategory: "backpack",
    basePrice: 198,
    collections: ["Rhea", "Rhea Signature"],
    features: ["backpack", "compact", "daily wear", "stylish", "leather"]
  },
  {
    name: "Sloan",
    subcategory: "wristlet",
    basePrice: 98,
    collections: ["Sloan", "Sloan Signature"],
    features: ["wristlet", "compact", "evening wear", "elegant", "leather"]
  }
];

const colors = [
  "Black", "Brown", "Navy", "Cognac", "Saddle Brown", "Jet Set Signature",
  "Chestnut", "Taupe", "Burgundy", "Forest Green", "Charcoal", "Camel",
  "Espresso", "Midnight Blue", "Mahogany", "Olive", "Tan", "Chocolate"
];

const sizes = ["Small", "Medium", "Large"];
const materials = ["Leather", "Canvas", "Nylon", "Suede"];
const seasons = ["Spring", "Summer", "Fall", "Winter", "All Season"];
const availability = ["in_stock", "low_stock", "out_of_stock"];

function generateProduct(template, index) {
  const color = colors[Math.floor(Math.random() * colors.length)];
  const size = sizes[Math.floor(Math.random() * sizes.length)];
  const material = materials[Math.floor(Math.random() * materials.length)];
  const season = seasons[Math.floor(Math.random() * seasons.length)];
  const avail = availability[Math.floor(Math.random() * availability.length)];
  
  const basePrice = template.basePrice + Math.floor(Math.random() * 100) - 50;
  const originalPrice = basePrice + Math.floor(Math.random() * 100) + 50;
  const discount = Math.floor(((originalPrice - basePrice) / originalPrice) * 100);
  
  const rating = 4.0 + Math.random() * 1.0;
  const reviewsCount = Math.floor(Math.random() * 2000) + 100;
  
  const product = {
    id: `mk-${String(index + 1).padStart(3, '0')}`,
    name: `${template.name} ${size} ${template.subcategory.charAt(0).toUpperCase() + template.subcategory.slice(1)}`,
    brand: "Michael Kors",
    category: "bags",
    subcategory: template.subcategory,
    price: basePrice,
    original_price: originalPrice,
    discount_percentage: discount,
    color: color,
    colors: [color, ...colors.slice(0, 3).filter(c => c !== color)],
    size: size,
    sizes: sizes,
    material: material,
    description: generateDescription(template, color, size, material),
    features: template.features,
    tags: [template.subcategory, material.toLowerCase(), color.toLowerCase(), size.toLowerCase(), ...template.features],
    availability: avail,
    rating: Math.round(rating * 10) / 10,
    reviews_count: reviewsCount,
    image_url: `https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400&h=400&fit=crop&sig=${index}`,
    style_code: `MK-${template.name.replace(/\s+/g, '').substring(0, 3).toUpperCase()}-${template.subcategory.substring(0, 2).toUpperCase()}-${String(index + 1).padStart(3, '0')}`,
    collection: template.collections[Math.floor(Math.random() * template.collections.length)],
    season: season,
    care_instructions: generateCareInstructions(material),
    dimensions: generateDimensions(template.subcategory, size),
    weight: generateWeight(template.subcategory, size),
    warranty: "1 year manufacturer warranty",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
  
  return product;
}

function generateDescription(template, color, size, material) {
  const descriptions = {
    tote: [
      `Spacious ${color.toLowerCase()} ${material.toLowerCase()} tote perfect for everyday use and travel.`,
      `Large ${color.toLowerCase()} ${material.toLowerCase()} tote with organized compartments and comfortable straps.`,
      `Stylish ${color.toLowerCase()} ${material.toLowerCase()} tote ideal for work and weekend activities.`
    ],
    satchel: [
      `Classic ${color.toLowerCase()} ${material.toLowerCase()} satchel with signature design details.`,
      `Professional ${color.toLowerCase()} ${material.toLowerCase()} satchel perfect for work and meetings.`,
      `Elegant ${color.toLowerCase()} ${material.toLowerCase()} satchel with structured silhouette.`
    ],
    crossbody: [
      `Compact ${color.toLowerCase()} ${material.toLowerCase()} crossbody bag for hands-free convenience.`,
      `Stylish ${color.toLowerCase()} ${material.toLowerCase()} crossbody bag with adjustable strap.`,
      `Versatile ${color.toLowerCase()} ${material.toLowerCase()} crossbody bag perfect for daily wear.`
    ],
    backpack: [
      `Modern ${color.toLowerCase()} ${material.toLowerCase()} backpack with laptop compartment.`,
      `Functional ${color.toLowerCase()} ${material.toLowerCase()} backpack ideal for daily use.`,
      `Stylish ${color.toLowerCase()} ${material.toLowerCase()} backpack with multiple pockets.`
    ],
    clutch: [
      `Elegant ${color.toLowerCase()} ${material.toLowerCase()} clutch perfect for evening events.`,
      `Sophisticated ${color.toLowerCase()} ${material.toLowerCase()} clutch with refined details.`,
      `Chic ${color.toLowerCase()} ${material.toLowerCase()} clutch ideal for special occasions.`
    ],
    wristlet: [
      `Compact ${color.toLowerCase()} ${material.toLowerCase()} wristlet for essential items.`,
      `Stylish ${color.toLowerCase()} ${material.toLowerCase()} wristlet with chain strap.`,
      `Functional ${color.toLowerCase()} ${material.toLowerCase()} wristlet perfect for evenings out.`
    ]
  };
  
  const options = descriptions[template.subcategory] || descriptions.tote;
  return options[Math.floor(Math.random() * options.length)];
}

function generateCareInstructions(material) {
  const instructions = {
    "Leather": "Clean with leather cleaner, avoid water exposure, store in dust bag",
    "Canvas": "Spot clean with mild soap, air dry, avoid machine washing",
    "Nylon": "Wipe clean with damp cloth, air dry, avoid harsh chemicals",
    "Suede": "Use suede brush, avoid water, store in cool dry place"
  };
  return instructions[material] || instructions["Leather"];
}

function generateDimensions(subcategory, size) {
  const dimensions = {
    tote: { Small: "12\" x 9\" x 4\"", Medium: "14\" x 11\" x 5\"", Large: "16\" x 13\" x 6\"" },
    satchel: { Small: "11\" x 8\" x 4\"", Medium: "13\" x 10\" x 5\"", Large: "15\" x 12\" x 6\"" },
    crossbody: { Small: "8\" x 6\" x 2\"", Medium: "10\" x 7\" x 3\"", Large: "12\" x 8\" x 4\"" },
    backpack: { Small: "11\" x 9\" x 4\"", Medium: "13\" x 11\" x 5\"", Large: "15\" x 13\" x 6\"" },
    clutch: { Small: "7\" x 4\" x 1\"", Medium: "9\" x 5\" x 2\"", Large: "11\" x 6\" x 3\"" },
    wristlet: { Small: "6\" x 4\" x 1\"", Medium: "7\" x 5\" x 1\"", Large: "8\" x 6\" x 2\"" }
  };
  return dimensions[subcategory]?.[size] || dimensions.tote[size];
}

function generateWeight(subcategory, size) {
  const weights = {
    tote: { Small: "1.2 lbs", Medium: "1.7 lbs", Large: "2.1 lbs" },
    satchel: { Small: "1.0 lbs", Medium: "1.5 lbs", Large: "1.8 lbs" },
    crossbody: { Small: "0.6 lbs", Medium: "0.9 lbs", Large: "1.2 lbs" },
    backpack: { Small: "1.1 lbs", Medium: "1.5 lbs", Large: "1.9 lbs" },
    clutch: { Small: "0.3 lbs", Medium: "0.5 lbs", Large: "0.7 lbs" },
    wristlet: { Small: "0.2 lbs", Medium: "0.3 lbs", Large: "0.4 lbs" }
  };
  return weights[subcategory]?.[size] || weights.tote[size];
}

// Generate 300 products
const products = [];
for (let i = 0; i < 300; i++) {
  const template = productTemplates[i % productTemplates.length];
  products.push(generateProduct(template, i));
}

// Write to file
fs.writeFileSync('michael_kors_products_300.json', JSON.stringify(products, null, 2));

console.log('Generated 300 Michael Kors products successfully!');
console.log(`File saved as: michael_kors_products_300.json`);
console.log(`Total products: ${products.length}`);
console.log(`Categories: ${[...new Set(products.map(p => p.subcategory))].join(', ')}`);
console.log(`Colors: ${[...new Set(products.map(p => p.color))].length} unique colors`);
console.log(`Price range: $${Math.min(...products.map(p => p.price))} - $${Math.max(...products.map(p => p.price))}`);
