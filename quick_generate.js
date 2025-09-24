const fs = require('fs');

// Product templates
const templates = [
  { name: "Jet Set Travel", subcategory: "tote", basePrice: 298, features: ["leather", "spacious", "multiple compartments", "adjustable straps", "everyday use", "travel"] },
  { name: "Hamilton", subcategory: "satchel", basePrice: 328, features: ["leather", "signature lock", "classic design", "work appropriate", "weekend wear"] },
  { name: "Jet Set Crossbody", subcategory: "crossbody", basePrice: 198, features: ["crossbody", "adjustable strap", "compact", "hands-free", "leather"] },
  { name: "Rhea", subcategory: "backpack", basePrice: 228, features: ["backpack", "laptop compartment", "multiple pockets", "daily wear", "leather"] },
  { name: "Sloan", subcategory: "clutch", basePrice: 168, features: ["clutch", "evening wear", "compact", "elegant", "leather"] },
  { name: "Mercer", subcategory: "satchel", basePrice: 278, features: ["satchel", "structured", "professional", "work appropriate", "leather"] },
  { name: "Jet Set Travel", subcategory: "tote", basePrice: 248, features: ["tote", "medium size", "organized compartments", "work appropriate", "leather"] },
  { name: "Hamilton", subcategory: "crossbody", basePrice: 218, features: ["crossbody", "signature lock", "classic design", "hands-free", "leather"] },
  { name: "Rhea", subcategory: "backpack", basePrice: 198, features: ["backpack", "compact", "daily wear", "stylish", "leather"] },
  { name: "Sloan", subcategory: "wristlet", basePrice: 98, features: ["wristlet", "compact", "evening wear", "elegant", "leather"] }
];

const colors = ["Black", "Brown", "Navy", "Cognac", "Saddle Brown", "Jet Set Signature", "Chestnut", "Taupe", "Burgundy", "Forest Green", "Charcoal", "Camel", "Espresso", "Midnight Blue", "Mahogany", "Olive", "Tan", "Chocolate"];
const sizes = ["Small", "Medium", "Large"];
const materials = ["Leather", "Canvas", "Nylon", "Suede"];

function generateProduct(template, index) {
  const color = colors[index % colors.length];
  const size = sizes[index % sizes.length];
  const material = materials[index % materials.length];
  
  const basePrice = template.basePrice + (index % 100) - 50;
  const originalPrice = basePrice + (index % 100) + 50;
  const discount = Math.floor(((originalPrice - basePrice) / originalPrice) * 100);
  
  return {
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
    description: `${color.toLowerCase()} ${material.toLowerCase()} ${template.subcategory} perfect for ${template.features[4] || 'daily use'}.`,
    features: template.features,
    tags: [template.subcategory, material.toLowerCase(), color.toLowerCase(), size.toLowerCase(), ...template.features],
    availability: "in_stock",
    rating: 4.0 + (index % 10) / 10,
    reviews_count: 100 + (index % 2000),
    image_url: `https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400&h=400&fit=crop&sig=${index}`,
    style_code: `MK-${template.name.replace(/\s+/g, '').substring(0, 3).toUpperCase()}-${template.subcategory.substring(0, 2).toUpperCase()}-${String(index + 1).padStart(3, '0')}`,
    collection: template.name,
    season: "all_season",
    care_instructions: "Clean with leather cleaner, avoid water exposure",
    dimensions: "12\" x 9\" x 4\"",
    weight: "1.5 lbs",
    warranty: "1 year manufacturer warranty"
  };
}

// Generate 300 products
const products = [];
for (let i = 0; i < 300; i++) {
  const template = templates[i % templates.length];
  products.push(generateProduct(template, i));
}

// Write to file
fs.writeFileSync('michael_kors_products_300.json', JSON.stringify(products, null, 2));
console.log('Generated 300 Michael Kors products!');
