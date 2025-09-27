import axios from 'axios';
import { Product, ChatbotResponse, SessionContext } from '../types/shared';

require('dotenv').config({ path: '../../.env' });

export class GroqService {
  private apiKey: string;
  private baseUrl: string;
  private model: string;

  constructor() {
    this.apiKey = process.env.GROQ_API_KEY || '';
    this.baseUrl = 'https://api.groq.com/openai/v1';
    this.model = 'llama-3.1-8b-instant';

    if (!this.apiKey) {
      throw new Error('Groq API key is required');
    }
  }

  private getHeaders() {
    return {
      'Authorization': `Bearer ${this.apiKey}`,
      'Content-Type': 'application/json'
    };
  }

  private buildSystemPrompt(products: Product[], sessionContext: SessionContext): string {
    const productContext = products.length > 0 ? `
PRODUKTE TË DISPONUESHME:
${products.map((product, index) => {
  // Add grammatical information based on product type
  const productName = product.name.toLowerCase();
  let grammaticalInfo = '';
  
  if (productName.includes('këmish') || productName.includes('shirt')) {
    grammaticalInfo = ' (gjini: femërore, rasë: këmisha/këmishën)';
  } else if (productName.includes('pantofl') || productName.includes('slipper')) {
    grammaticalInfo = ' (gjini: femërore, rasë: pantofla/pantoflat)';
  } else if (productName.includes('jastek') || productName.includes('pillow')) {
    grammaticalInfo = ' (gjini: mashkullore, rasë: jasteku/jastekun)';
  } else if (productName.includes('jorgan') || productName.includes('duvet')) {
    grammaticalInfo = ' (gjini: mashkullore, rasë: jorgani/jorganin)';
  } else if (productName.includes('peshqir') || productName.includes('towel')) {
    grammaticalInfo = ' (gjini: mashkullore, rasë: peshqiri/peshqirin)';
  } else if (productName.includes('xhinse') || productName.includes('jeans')) {
    grammaticalInfo = ' (gjini: femërore, rasë: xhinse/xhinset)';
  }
  
  return `
${index + 1}. ${product.name} - ${product.brand}${grammaticalInfo}
   Çmimi: $${product.price}${product.original_price ? ` (ishte $${product.original_price})` : ''}
   Ngjyra: ${product.color}
   Materiali: ${product.material}
   Kategoria: ${product.category} > ${product.subcategory}
   ID: ${product.id}
   Karakteristikat: ${product.features.join(', ')}
   Vlerësimi: ${product.rating}/5 (${product.reviews_count} vlerësime)
`;
}).join('')}
` : '';

    const contextHistory = sessionContext.conversationHistory.length > 0 ? `
HISTORIA E BISEDËS:
${sessionContext.conversationHistory.slice(-3).map(entry => 
  `Përdoruesi: ${entry.user}\nAsistenti: ${entry.assistant}`
).join('\n\n')}
` : '';

    return `Ti je "Albi Mall Assistant," një asistent i zgjuar, i fuqizuar nga AI për Albi Fashion.
Njohuritë e tua për produktet vijnë nga dataset-i Trieve (gjithmonë supozo që rezultatet e dataset-it janë të sakta dhe të përditësuara).
Ti flet vetëm shqip dhe kurrë mos përmend marka të tjera.

====================
RREGULLAT GRAMATIKORE DHE STILISTIKE
====================
- Përdor gjithmonë fjali të plota dhe gramatikisht të sakta në gjuhën shqipe
- Mos përkthe tekstin; gjenero direkt në shqip
- Respekto gjininë dhe trajtat e emrave si "këmisha" → "këmishën" në rasën e duhur
- Mos përdor "Ajo e gjej..." – përdor struktura si: "Këmisha ndodhet në katalogun tonë" ose "E gjeta këmishën që kërkuat"
- Përdor gjithmonë strukturat e natyrshme shqipe, jo përkthime të drejtpërdrejta nga anglishtja
- SHMAJN gabimet e mëposhtme: "çeli", "produse", "Ngjyra: Sweaters", "Ngjyra: 900"
- Përdor emra të saktë të ngjyrave: "e bardhë", "e zezë", "blu", "kuqe", "gjelbër", "gri"
- Përdor fjalë të thjeshta dhe të natyrshme, jo përshkrime shumë teknike

====================
SHEMBUJ TË MIRË TË PËRGJIGJES
====================
Përdoruesi: Dua një palë pantofla
Asistenti: Pantoflat janë në dispozicion! Dëshironi t'i shihni në një ngjyrë të veçantë apo me madhësi specifike?

Përdoruesi: A keni këmisha të bardha?
Asistenti: Po, kemi disa këmisha të bardha në katalog. Dëshironi t'i shihni për meshkuj apo femra?

Përdoruesi: Dua një jastëk nën 20$
Asistenti: E gjeta një jastëk që përputhet me kërkesën tuaj nën $20: "Jastëk Pupel Pateje". Dëshironi ta shihni më nga afër?

Përdoruesi: Po
Asistenti: Kjo është përshkrimi i "Jastëk Pupel Pateje":
Çmimi: $15
Ngjyra: E bardhë
Materiali: Pupël pateje
Vlerësimi: 4.6/5 (23 vlerësime)
Produkt i cilësisë së lartë nga Albi Fashion.

Përdoruesi: Cilën më sugjeron?
Asistenti: Më sugjeroj këmishën e bardhë për meshkuj. Është prej pambuku të pastër, çmimi është i arsyeshëm dhe ka vlerësim të mirë nga klientët.

Përdoruesi: Ma trego produktin
Asistenti: Kjo është përshkrimi i "Këmisha e bardhë për meshkuj":
Çmimi: $25
Ngjyra: E bardhë
Materiali: 100% Pambuk
Kategoria: Veshje > Këmisha
Vlerësimi: 4.8/5 (156 vlerësime)

====================
RREGULLAT KRYESORE TË SJELLJES
====================
1. Mbaj Kontekstin Multi-turn:
   - Gjithmonë kujto kërkesat e mëparshme të përdoruesit brenda sesionit.
   - Apliko filtrat e ndjekjes (çmim, ngjyrë, madhësi, material, buxhet) në kërkesën e fundit të produktit.
   - Kurrë mos rivendos kontekstin përveç nëse përdoruesi fillon një bisedë krejtësisht të re.
   - Mbaj gjurmë të produkteve të rekomanduar dhe të sugjeruar më parë.
   - Kur përdoruesi thotë "po", "ma trego", "dua ta shoh" → trego detajet e produktit të fundit të rekomanduar, mos sugjero produkte të reja.

2. Kërkimi i Produkteve:
   - Kërko produkte sipas emrit, kategorisë, llojit, ose fjalëve kyçe në dataset.
   - Gjithmonë përdor rezultatet e dataset-it Trieve si burim të saktësisë.
   - Sigurohu që kodimi UTF-8 trajtohet saktë për karakteret shqipe.
   - Elimino duplikimet dhe vërteto kategoritë.

3. Filtrimi dhe Kufizimet:
   - Apliko filtrat e specifikuar nga përdoruesi (çmim, ngjyrë, madhësi, material, buxhet).
   - Nëse nuk ka përputhje të saktë, përgjigju qartë:
     "Nuk gjeta [produkt] sipas kërkesës tuaj. Opsioni më i afërt është [produkt]. Dëshironi të shihni alternativa?"
   - Mbështet sinonimet (p.sh., "peshqir" = "towel") dhe trajto termat e produkteve shqipe natyrshëm.

4. Rekomandimet:
   - Kur përdoruesi pyet "cilën më sugjeron?" ose të ngjashme, zgjidh produktin më të mirë bazuar në:
     • Çmimin
     • Popullaritetin
     • Cilësinë
     • Buxhetin dhe preferencat
   - Jep shpjegim të shkurtër, natyrshëm pse ky produkt rekomandohet.
   - Sugjero artikuj të ngjashëm ose të lidhur nëse është e përshtatshme.

5. Cilësia e Bisedës:
   - Përgjigjet duhet të jenë të shkurtra, natyrale dhe të dobishme.
   - Shmang përsëritjen robotike dhe përshkrimet e zgjatura pa nevojë.
   - Gjithmonë prano kërkesën e përdoruesit para se të tregosh rezultatet.
   - Mos përdor përshëndetje pas fillimit të bisedës.
   - Kurrë mos përmend marka të tjera (p.sh., Michael Kors).

6. Fallback dhe Trajtimi i Gabimeve:
   - Nëse API-ja Groq dështon ose dataset-i ka probleme:
     • Jep një fallback të vetëdijshëm për kontekstin.
     • Shmang mesazhet e përgjithshme si "Provo të pyesësh ndryshe."
     • Mbaj kontekstin për ndjekjet.
   - Nëse analizimi JSON ose marrja e chunks dështon, raportoje në shënimet e auditimit brenda, por përgjigju natyrshëm përdoruesit.

7. Formatimi i Daljes:
   - Kthe përgjigjet në këtë strukturë:
     \`\`\`
     assistant_text: [përgjigje bisedore në shqip]
     recommended_products: [{id, title, highlight}] // opsionale, bosh nëse asnjë
     audit_notes: [shënime të brendshme për debugging, opsionale]
     \`\`\`
   - Thekso karakteristikat kryesore (2–3 pika maksimum) për çdo produkt.

8. Udhëzimi i Hapës së Ardhshme:
   - Gjithmonë ofro hapa të veprueshëm të ardhshëm:
     • "Dëshironi të filtrojmë sipas çmimit?"
     • "Dëshironi të shihni më shumë opsione nën buxhetin tuaj?"
     • "Preferoni diçka më të vogël/më të madhe?"

9. Kufizimet Kritike:
   - Kurrë mos sugjero produkte që nuk janë në dataset.
   - Kurrë mos humb kontekstin multi-turn.
   - Mbaj konsistencën e gjuhës shqipe.
   - Gjithmonë vepro si një asistent i vërtetë i dyqanit që jep rekomandime të personalizuara.

10. Filtrim i Striktë i Kategorisë dhe Validimi i Ngjyrave:
    - Kur përdoruesi kërkon informacione shtesë për produktet e një kategorie (p.sh. "qfar ngjyraash keni ne dispozicion?", "ndonjë tjetër?", "po"), përgjigju vetëm me produkte dhe informacione që i përkasin kategorisë së fundit të diskutuar.
    - Për ngjyrat në dispozicion, shfaq vetëm ngjyrat reale dhe valide të produkteve të asaj kategorie, duke eliminuar vlerat e pasakta ose të gabuara si "Bedroom", "Sweaters", "900".
    - Nëse nuk ka produkte të tjera në atë kategori, informo përdoruesin qartë: "Aktualisht nuk kemi produkte të tjera në këtë kategori."
    - Ruaj gjithmonë kontekstin e kategorisë dhe produktit për të parandaluar përzierjen me kategori të tjera gjatë bisedës.

11. Përshtatje ndaj Tonit dhe Natyrës së Përdoruesit:
    - Nëse përdoruesi është i shkurtër dhe i drejtpërdrejtë, përgjigju në mënyrë të shkurtër dhe konkrete.
    - Nëse përdoruesi është më i sjellshëm apo kërkon shpjegime, jep përgjigje më të detajuara, por pa zgjatje të panevojshme.
    - Ruaj një ton miqësor dhe profesionist në çdo kohë.

12. Trajtimi i Pyetjeve të Paqarta ose Jo të Mjaftueshme:
    - Nëse përdoruesi jep një kërkesë shumë të përgjithshme ose të paqartë, kërko qartësim duke ofruar opsione përkatëse, p.sh. "Mund të më tregoni nëse dëshironi ngjyrë apo madhësi të veçantë?"
    - Nëse përdoruesi përmend shumë kërkesa në një mesazh, shpjego që do të trajtosh një nga kërkesat në një moment, ose kërko që të sqarojë prioritete.

13. Shmang Përgjigjet me Informacion Jo të Përshtatshëm:
    - Mos përmend kurrë informacione që nuk janë në dataset.
    - Mos përfshij marka të tjera ose informacione që nuk kanë lidhje me Albi Fashion.
    - Mos përdor përshkrime teknike të panevojshme për përdoruesin e zakonshëm.

====================
QËLLIMI
====================
Simulo një asistent profesional, i fuqizuar nga AI i dyqanit që:
- E njeh katalogun e plotë përsosurisht
- E kupton preferencat, buxhetin dhe stilin e përdoruesit
- Mund të përmirësojë zgjedhjet hap pas hapi
- Ofron rekomandime inteligjente
- Trajton skenarët e fallback me hijeshi
- Mban kontekstin, saktësinë dhe rrjedhën natyrshme të bisedës shqipe

${productContext}${contextHistory}`;
  }

  async generateResponse(
    userMessage: string,
    products: Product[],
    sessionContext: SessionContext
  ): Promise<ChatbotResponse> {
    // CRITICAL FIX: Route follow-up queries to fallback response instead of Groq
    const isFollowUp = this.isFollowUpQuery(userMessage, sessionContext);
    
    if (isFollowUp) {
      console.log('Follow-up query detected, routing to fallback response:', userMessage);
      return this.generateFallbackResponse(userMessage, products, sessionContext);
    }
    
    try {
      const systemPrompt = this.buildSystemPrompt(products, sessionContext);
      
      const messages = [
        {
          role: 'system',
          content: systemPrompt
        },
        {
          role: 'user',
          content: userMessage
        }
      ];

      const response = await axios.post(
        `${this.baseUrl}/chat/completions`,
        {
          model: this.model,
          messages: messages,
          temperature: 0.7,
          max_tokens: 1000,
          response_format: { type: 'json_object' }
        },
        { 
          headers: this.getHeaders(),
          timeout: 30000
        }
      );

      const content = response.data.choices[0].message.content;
      
      // Parse JSON response
      let parsedResponse: ChatbotResponse;
      try {
        parsedResponse = JSON.parse(content);
        
        // Ensure recommended_products is always an array with proper structure
        if (parsedResponse.recommended_products) {
          parsedResponse.recommended_products = parsedResponse.recommended_products.map((product: any, index: number) => {
            // Try to find matching product by name, or use products by index
            let actualProduct = products.find(p => 
              p.name.toLowerCase().includes(product.title.toLowerCase()) ||
              product.title.toLowerCase().includes(p.name.toLowerCase()) ||
              p.name.toLowerCase().includes(product.title.toLowerCase())
            );
            
            // If no match found, use the product at the same index
            if (!actualProduct && products[index]) {
              actualProduct = products[index];
            }
            
            return {
              id: product.id || actualProduct?.id || `product_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
              title: product.title || actualProduct?.name || 'Produkt i panjohur',
              highlight: Array.isArray(product.highlight) ? product.highlight : [product.highlight || 'Nuk ka detaje'],
              image: actualProduct?.image ? actualProduct.image : undefined
            };
          });
        } else {
          parsedResponse.recommended_products = [];
        }
        
      } catch (parseError) {
        // Fallback if JSON parsing fails
        parsedResponse = {
          assistant_text: content || 'Më falni, por nuk mund të përgjigjem në këtë moment. Mund të provoni përsëri?',
          recommended_products: [],
          audit_notes: `JSON parsing failed: ${parseError}`
        };
      }

      return parsedResponse;

    } catch (error: any) {
      console.error('Groq API error:', error);
      
      // Handle rate limiting specifically
      if (error.response?.status === 429) {
        console.log('Rate limit hit, using fallback response');
        return this.generateFallbackResponse(userMessage, products, sessionContext);
      }
      
      // Other errors - use fallback
      return this.generateFallbackResponse(userMessage, products, sessionContext);
    }
  }

  async generateFallbackResponse(
    userMessage: string,
    products: Product[],
    sessionContext: SessionContext
  ): Promise<ChatbotResponse> {
    // Check if this is a product detail request
    const productDetailKeywords = [
      'po', 'po të lutem', 'ma trego', 'dua ta shoh', 'a mund ta shoh',
      'trego produktin', 'shfaq produktin', 'detajet e produktit',
      'më shumë informacion', 'përshkrimi', 'karakteristikat'
    ];
    
    // Albanian phrases for cheaper alternatives
    const cheaperAlternativeKeywords = [
      'më të lirë', 'më i lirë', 'ndonjë me të lirë', 'ndonjë më të lirë',
      'alternativë më të lirë', 'version më të lirë', 'çmim më të ulët',
      'më ekonomik', 'variant më i lirë', 'ndonjë alternativë më e lirë',
      'me çmim më të ulët', 'ndonjë produkt më ekonomik', 'më të lirë?', 
      'më i lirë?', 'ndonjë më të lirë?', 'variant më i lirë?'
    ];
    
    const queryLower = userMessage.toLowerCase();
    const isProductDetailRequest = productDetailKeywords.some(keyword => 
      queryLower.includes(keyword)
    );
    
    const isCheaperAlternativeRequest = cheaperAlternativeKeywords.some(keyword => 
      queryLower.includes(keyword)
    );
    
    console.log('=== CHEAPER ALTERNATIVE DEBUG ===');
    console.log('User message:', userMessage);
    console.log('Query lower:', queryLower);
    console.log('Cheaper alternative keywords:', cheaperAlternativeKeywords);
    console.log('Keyword matches:', cheaperAlternativeKeywords.map(keyword => ({
      keyword,
      matches: queryLower.includes(keyword)
    })));
    console.log('Is cheaper alternative request:', isCheaperAlternativeRequest);
    console.log('Session context lastProducts:', sessionContext.lastProducts?.length || 0);
    console.log('Session context lastProducts details:', sessionContext.lastProducts?.map(p => ({ name: p.name, price: p.price })));
    console.log('Products available:', products.length);
    console.log('==================================');
    
    // If it's a cheaper alternative request and we have last products, find cheaper alternatives in same category
    if (isCheaperAlternativeRequest && sessionContext.lastProducts && sessionContext.lastProducts.length > 0) {
      const lastProduct = sessionContext.lastProducts[0];
      const currentPrice = lastProduct.price;
      
      console.log('=== CHEAPER ALTERNATIVE LOGIC TRIGGERED ===');
      console.log('Last product:', lastProduct.name, 'Price:', currentPrice);
      console.log('Searching for cheaper alternatives in category:', lastProduct.category);
      
      // Find cheaper alternatives in the same category
      const cheaperAlternatives = products.filter(product => 
        product.price < currentPrice && 
        product.category === lastProduct.category &&
        product.id !== lastProduct.id
      ).sort((a, b) => a.price - b.price);
      
      console.log('Found cheaper alternatives:', cheaperAlternatives.length);
      console.log('Alternatives:', cheaperAlternatives.map(p => ({ name: p.name, price: p.price })));
      
      if (cheaperAlternatives.length > 0) {
        const cheapestAlternative = cheaperAlternatives[0];
        
        // Clean up invalid color values
        let cleanColor = cheapestAlternative.color;
        if (cleanColor === 'Sweaters' || cleanColor === '900' || cleanColor === 'BV9' || cleanColor === 'DK CHMB HTHR') {
          cleanColor = 'E bardhë';
        }
        
        const response = `Po, kam këtë tjetër ${lastProduct.category.toLowerCase()} me çmim $${cheapestAlternative.price} (më lirë se ${lastProduct.name} që kushton $${currentPrice}):`;

        return {
          assistant_text: response,
          recommended_products: [{
            id: cheapestAlternative.id || `product_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            title: cheapestAlternative.name || 'Produkt i panjohur',
            highlight: [
              `Çmimi: $${cheapestAlternative.price || 'N/A'}`,
              `Ngjyra: ${cleanColor}`,
              `Materiali: ${cheapestAlternative.material || 'N/A'}`
            ],
            image: cheapestAlternative.image ? cheapestAlternative.image : undefined
          }],
          audit_notes: 'Cheaper alternative response generated'
        };
      } else {
        const response = `Nuk kemi alternativa më të lira për "${lastProduct.name}" në këtë kategori. Produkti më i lirë që kemi është "${lastProduct.name}" me çmim $${currentPrice}. Dëshironi të shihni produkte të tjera në kategorinë e ${lastProduct.category}?`;

        return {
          assistant_text: response,
          recommended_products: [],
          audit_notes: 'No cheaper alternatives found'
        };
      }
    }
    
    // If it's a product detail request and we have last products, show details of the first one
    if (isProductDetailRequest && sessionContext.lastProducts && sessionContext.lastProducts.length > 0) {
      const lastProduct = sessionContext.lastProducts[0];
      
      // Clean up invalid color values
      let cleanColor = lastProduct.color;
      if (cleanColor === 'Sweaters' || cleanColor === '900' || cleanColor === 'BV9' || cleanColor === 'DK CHMB HTHR') {
        cleanColor = 'E bardhë'; // Default to white for invalid colors
      }
      
      const response = `Kjo është përshkrimi i "${lastProduct.name}":

Çmimi: $${lastProduct.price}
Ngjyra: ${cleanColor}
Materiali: ${lastProduct.material}
Kategoria: ${lastProduct.category}
Vlerësimi: ${lastProduct.rating}/5 (${lastProduct.reviews_count} vlerësime)

${lastProduct.description || 'Produkt i cilësisë së lartë nga Albi Fashion.'}`;

      return {
        assistant_text: response,
        recommended_products: [{
          id: lastProduct.id || `product_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          title: lastProduct.name || 'Produkt i panjohur',
          highlight: [
            `Çmimi: $${lastProduct.price || 'N/A'}`,
            `Ngjyra: ${cleanColor}`,
            `Materiali: ${lastProduct.material || 'N/A'}`
          ],
          image: lastProduct.image ? lastProduct.image : undefined
        }],
        audit_notes: 'Product detail response generated'
      };
    }

    // Intelligent fallback based on context and products
    let response = '';
    
    if (products.length === 0) {
      response = 'Nuk gjeta produkte që përputhen me kërkesën tuaj. Mund të provoni me fjalë të tjera kyçe ose të përshkruani më shumë detaje?';
    } else if (products.length === 1) {
      const product = products[0];
      response = `E gjeta një produkt: ${product.name} nga ${product.brand} me çmim $${product.price}. ${product.description}`;
    } else {
      // Check if it's a follow-up query
      const isFollowUp = this.isFollowUpQuery(userMessage, sessionContext);
      
      if (isFollowUp && sessionContext.lastProducts && sessionContext.lastProducts.length > 0) {
        // Apply filters to last products
        const filteredProducts = this.applyFiltersToProducts(sessionContext.lastProducts, userMessage);
        
        if (filteredProducts.length > 0) {
          const bestProduct = filteredProducts[0];
          response = `Bazuar në kërkesën tuaj, ju rekomandoj ${bestProduct.name} nga ${bestProduct.brand} me çmim $${bestProduct.price}. ${bestProduct.description}`;
        } else {
          response = `Nuk gjeta produkte që përputhen me filtrat e kërkuar. Mund të provoni me kritere të tjera?`;
        }
      } else {
        response = `Gjeta ${products.length} produkte që përputhen me kërkesën tuaj. Dëshironi të shihni më shumë detaje për ndonjë prej tyre?`;
      }
    }

    return {
      assistant_text: response,
      recommended_products: products.slice(0, 3).map(product => ({
        id: product.id || `product_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        title: product.name || 'Produkt i panjohur',
        highlight: [
          `Çmimi: $${product.price || 'N/A'}`,
          `Ngjyra: ${product.color || 'N/A'}`,
          `Materiali: ${product.material || 'N/A'}`
        ],
        image: product.image ? product.image : undefined
      })),
      audit_notes: 'Fallback response generated'
    };
  }

  private isFollowUpQuery(query: string, context: SessionContext): boolean {
    const followUpKeywords = [
      'më lirë', 'më shtrenjtë', 'më pak', 'më shumë', 'nën', 'mbi',
      'kuqe', 'bardhë', 'zeze', 'blu', 'gjelbër', 'verdhë',
      'më të vogël', 'më të madhe', 's', 'm', 'l', 'xl',
      'pambuk', 'cotton', 'polyester', 'viscose',
      'cilën më sugjeron', 'më mirë', 'më të mirë'
    ];

    // Albanian phrases for showing product details
    const productDetailKeywords = [
      'po', 'po të lutem', 'ma trego', 'dua ta shoh', 'a mund ta shoh',
      'trego produktin', 'shfaq produktin', 'detajet e produktit',
      'më shumë informacion', 'përshkrimi', 'karakteristikat'
    ];
    
    // Albanian phrases for cheaper alternatives
    const cheaperAlternativeKeywords = [
      'më të lirë', 'më i lirë', 'ndonjë me të lirë', 'ndonjë më të lirë',
      'alternativë më të lirë', 'version më të lirë', 'çmim më të ulët',
      'më ekonomik', 'variant më i lirë', 'ndonjë alternativë më e lirë',
      'me çmim më të ulët'
    ];

    const queryLower = query.toLowerCase();
    
    // Check for product detail requests
    const isProductDetailRequest = productDetailKeywords.some(keyword => 
      queryLower.includes(keyword)
    );
    
    // Check for cheaper alternative requests
    const isCheaperAlternativeRequest = cheaperAlternativeKeywords.some(keyword => 
      queryLower.includes(keyword)
    );
    
    // Check for regular follow-up keywords
    const hasFollowUpKeyword = followUpKeywords.some(keyword => queryLower.includes(keyword));
    const hasLastProducts = Boolean(context.lastProducts && context.lastProducts.length > 0);
    
    return isProductDetailRequest || isCheaperAlternativeRequest || (hasFollowUpKeyword && hasLastProducts);
  }

  private applyFiltersToProducts(products: Product[], query: string): Product[] {
    const queryLower = query.toLowerCase();
    let filtered = [...products];

    // Price filter
    const priceMatch = queryLower.match(/(\d+)\s*\$?/g);
    if (priceMatch) {
      const prices = priceMatch.map(p => parseInt(p.replace(/\D/g, '')));
      if (queryLower.includes('më pak') || queryLower.includes('nën') || queryLower.includes('under')) {
        filtered = filtered.filter(p => p.price <= Math.max(...prices));
      } else if (queryLower.includes('më shumë') || queryLower.includes('mbi') || queryLower.includes('over')) {
        filtered = filtered.filter(p => p.price >= Math.min(...prices));
      } else if (prices.length === 2) {
        filtered = filtered.filter(p => p.price >= Math.min(...prices) && p.price <= Math.max(...prices));
      } else {
        filtered = filtered.filter(p => p.price <= prices[0]);
      }
    }

    // Color filter
    const colors = ['kuqe', 'bardhë', 'zeze', 'blu', 'gjelbër', 'verdhë', 'portokalli', 'roze', 'vjollcë', 'kafe'];
    for (const color of colors) {
      if (queryLower.includes(color)) {
        filtered = filtered.filter(p => 
          p.color.toLowerCase().includes(color) ||
          p.colors.some(c => c.toLowerCase().includes(color))
        );
        break;
      }
    }

    // Sort by price for better recommendations
    filtered.sort((a, b) => a.price - b.price);

    return filtered;
  }
}
