# 🧪 Chatbot Test Execution Guide

## Quick Start

```bash
# Install dependencies if needed
npm install axios

# Run the comprehensive test suite
node test-suite-comprehensive.js

# Results will be saved to test-results.json
```

## Expected Behavior Based on Code Analysis

### ✅ TEST SUITE A: Category Detection
**File:** `server/src/services/chatbot/MessageParser.ts` lines 191-248

**Test A1:** `"Kam nevojë për peshqir"`
- **Expected:** Returns towels list
- **Code Logic:**
  ```typescript
  // Category keywords include:
  peshqir: ['peshqir', 'peshqiri', 'towel', 'towels']
  ```
- **Should Return:** 7+ towel products with varied prices
- **Pass Criteria:** Products have price, brand, color fields; price range spans <$20 and >$20

---

### ✅ TEST SUITE B: Brand Filtering
**File:** `server/src/services/chatbot/MessageParser.ts` lines 338-457  
**File:** `server/src/services/chatbot/TrieveService.ts` lines 478-485

**Test B1:** `"pantolla marka TOM TAILOR"`
- **Expected:** Only TOM TAILOR pants
- **Code Logic:**
  ```typescript
  // Brand extracted after "marka" keyword (strong indicator)
  if (prevWord && strongBrandIndicators.includes(prevWord)) {
    return currentWord.toUpperCase(); // "TOM TAILOR"
  }
  
  // Then filtered:
  private static matchesBrand(product: Product, brand: string): boolean {
    return product.brand.toUpperCase() === brand.toUpperCase();
  }
  ```
- **Pass Criteria:** All returned products have `brand === "TOM TAILOR"`

---

### ✅ TEST SUITE C: Color Filtering (Disambiguation)
**File:** `server/src/services/chatbot/MessageParser.ts` lines 250-257, 417-420

**Test C1:** `"peshqir i kuq"` (masculine definite)
**Test C2:** `"peshqir te kuq"` (with preposition) ← **Critical disambiguation test**
**Test C3:** `"peshqir ngjyrë e kuqe"` (with color keyword)

- **Expected:** All return RED towels only
- **Code Logic:**
  ```typescript
  // Color mappings include:
  'kuq': 'red',
  'i kuq': 'red',
  'te kuq': 'red',     // ← Added for disambiguation
  'të kuq': 'red',
  'e kuqe': 'red',
  
  // Brand extraction skips known colors:
  if (knownColorWords.includes(brandCandidate)) {
    console.log('🎨 Skipping - it's a color, not a brand');
    continue; // ← Prevents "te kuq" from being detected as brand "KUQ"
  }
  ```
- **Pass Criteria:** 
  - Products have `color` containing "RED"
  - NO error message about brand "KUQ"
  - All three variants return same items

---

### ✅ TEST SUITE D: Price Filtering & Sorting
**File:** `server/src/services/chatbot/MessageParser.ts` lines 259-300  
**File:** `server/src/services/chatbot/ChatbotService.ts` lines 72-78

**Test D1:** `"peshqir nën $20"`
- **Expected:** Only towels < $20
- **Code Logic:**
  ```typescript
  // Price extraction:
  const underPattern = /(?:nen|poshte|ner|under)\s*(\d+)(?:\$|€)?/i;
  // Returns: { max: 20 }
  
  // Filtering:
  if (priceFilter.max && productPrice > priceFilter.max) return false;
  ```
- **Pass Criteria:** All products have `price < 20`

**Test D2:** `"peshqir më të lira"` ← **Critical false positive test**
- **Expected:** Towels sorted by price ascending, NO brand "LIRA" error
- **Code Logic:**
  ```typescript
  // Detects "më të lira" as price sort signal:
  const cheaperPattern = /(?:më\s*të\s*lira|me\s*te\s*lira|me\s*te\s*lire|...)/i;
  if (cheaperPattern.test(message)) {
    return { max: 0 }; // Special signal
  }
  
  // In ChatbotService:
  if (finalFilters.price?.max === 0) {
    sortPreference = 'cheap';
    delete finalFilters.price; // Remove signal
  }
  products = products.sort((a, b) => (a.price || 0) - (b.price || 0));
  
  // Brand extraction has "lira" in stop words:
  const albanianStopWords = ['lira', 'lire', ...];
  ```
- **Pass Criteria:** 
  - Products sorted: price[i] <= price[i+1]
  - NO error message containing "markën" or "LIRA"

---

### ✅ TEST SUITE E: Multi-turn Context
**File:** `server/src/services/chatbot/ChatbotService.ts` lines 216-275  
**File:** `server/src/services/chatbot/SessionManager.ts` lines 25-59

**Test E1:** `"peshqir"` → `"nën $20"`
- **Expected:** Second message filters first message's results
- **Code Logic:**
  ```typescript
  // Context preservation:
  if (finalFilters.price && !finalFilters.category && session.lastCategory) {
    finalFilters.category = session.lastCategory; // "peshqir"
  }
  
  // Session storage:
  sessionManager.updateSession(userId, {
    lastCategory: finalFilters.category,
    appliedFilters: finalFilters,
    lastProducts: products
  });
  ```
- **Pass Criteria:** 
  - Second response has fewer items than first
  - All items in second response have `price < 20`

---

### ✅ TEST SUITE F: Ambiguous Phrases
**File:** `server/src/services/chatbot/MessageParser.ts` lines 417-420

**Test F1:** `"peshqir te kuq"` → Should detect COLOR not BRAND
**Test F2:** `"pantolla te boss"` → Should detect BRAND
**Test F3:** `"me te lira"` → Should sort by PRICE not detect brand "LIRA"
**Test F4:** `"tom tailor"` → Should detect BRAND (lowercase)

- **Code Logic:**
  ```typescript
  // Known color words list:
  const knownColorWords = ['kuq', 'kuqe', 'zeze', 'zi', ...];
  
  // Disambiguation in brand extraction:
  if (prevWord && weakBrandIndicators.includes(prevWord)) { // "te"
    if (knownColorWords.includes(brandCandidate)) {
      console.log('🎨 Skipping - color, not brand');
      continue;
    }
    // Only non-color words become brands
  }
  
  // Known brands list (case-insensitive):
  const knownBrands = ['boss', 'hugo', 'tom tailor', 'ozdilek', ...];
  for (const knownBrand of knownBrands) {
    if (lowerMessage.includes(knownBrand)) {
      return knownBrand.toUpperCase();
    }
  }
  ```
- **Pass Criteria:**
  - F1: Products have `color: RED`, no brand error
  - F2: Products have `brand: BOSS`
  - F3: Products sorted, no "LIRA" error
  - F4: Products have `brand: TOM TAILOR`

---

## Code Coverage Map

| Test | Feature | Files | Lines |
|------|---------|-------|-------|
| A1 | Category detection | MessageParser.ts | 191-248 |
| B1 | Brand filtering | MessageParser.ts, TrieveService.ts | 338-457, 478-485 |
| C1-C3 | Color disambiguation | MessageParser.ts | 64-69, 417-420 |
| D1 | Price filtering | MessageParser.ts, TrieveService.ts | 277-281, 435-449 |
| D2 | Price sorting | MessageParser.ts, ChatbotService.ts | 263-269, 72-78 |
| E1 | Multi-turn context | ChatbotService.ts, SessionManager.ts | 231-234, 25-59 |
| F1-F4 | Ambiguity resolution | MessageParser.ts | 417-420, 348-353 |

---

## Critical Code Locations for Debugging

### If Brand Filter Fails:
1. **Extraction:** `server/src/services/chatbot/MessageParser.ts` line 338 (`extractBrand`)
2. **Matching:** `server/src/services/chatbot/TrieveService.ts` line 478 (`matchesBrand`)
3. **Known brands list:** `server/src/services/chatbot/MessageParser.ts` line 356

### If Color/Brand Ambiguity Fails:
1. **Color words list:** `server/src/services/chatbot/MessageParser.ts` line 348
2. **Disambiguation logic:** `server/src/services/chatbot/MessageParser.ts` line 417-420
3. **Color mappings:** `server/src/services/chatbot/MessageParser.ts` line 64-69

### If Price Sorting Fails:
1. **Pattern detection:** `server/src/services/chatbot/MessageParser.ts` line 263
2. **Stop words:** `server/src/services/chatbot/MessageParser.ts` line 341 (check "lira" is present)
3. **Sorting logic:** `server/src/services/chatbot/ChatbotService.ts` line 72-78

### If Multi-turn Context Fails:
1. **Session manager:** `server/src/services/chatbot/SessionManager.ts` line 25-59
2. **Context application:** `server/src/services/chatbot/ChatbotService.ts` line 231-234

---

## Running Individual Tests

```javascript
// Test specific functionality:
const axios = require('axios');

// Test brand filter
axios.post('https://michael-kors-chatbot.onrender.com/chat', {
  userId: 'test_123',
  message: 'pantolla marka TOM TAILOR'
}).then(r => console.log(r.data));

// Test color disambiguation
axios.post('https://michael-kors-chatbot.onrender.com/chat', {
  userId: 'test_456',
  message: 'peshqir te kuq'
}).then(r => console.log(r.data));

// Test price sorting
axios.post('https://michael-kors-chatbot.onrender.com/chat', {
  userId: 'test_789',
  message: 'peshqir më të lira'
}).then(r => console.log(r.data));
```

---

## Expected Test Results

Based on the implemented fixes:

| Test Suite | Expected Pass Rate | Notes |
|------------|-------------------|-------|
| A (Category) | 100% | Solid implementation |
| B (Brand) | 100% | Fixed with lowercase + known brands |
| C (Color) | 100% | Fixed with disambiguation logic |
| D (Price) | 100% | Fixed with stop words + sorting |
| E (Multi-turn) | 100% | Session management working |
| F (Ambiguity) | 100% | All disambiguation cases covered |
| **Overall** | **100%** | All critical bugs fixed |

---

## Next Steps If Tests Fail

1. **Check deployment:** Ensure Render has deployed the latest code (commit `4cb0c7b` or later)
2. **Check logs:** Look for console.log statements showing filter extraction
3. **Run with debug:** Add `console.log` to MessageParser to see what's extracted
4. **Compare data:** Verify Trieve dataset matches expected product structure

---

## Additional Robustness Tests (Phase 2)

Once core tests pass, add:
- Plural forms: "peshqirët", "pantollonat"
- Typos: "pshqir", "pantola"
- Mixed filters: "peshqir te kuq dhe nën $15"
- Negative tests: "produkte që nuk ekzistojnë"
- Edge prices: "peshqir pikërisht $20"
- Multiple colors: "peshqir te kuq ose te zi"

