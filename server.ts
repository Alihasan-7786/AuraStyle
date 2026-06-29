import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';
import { GoogleGenAI, Type } from '@google/genai';
import { DatabaseService } from './src/db/databaseService.js';
import { hashPassword, verifyPassword, signToken, verifyToken } from './src/utils/crypto.js';

dotenv.config();

const app = express();
const PORT = 3000;

// Set up express body parsers with limits for base64 image uploads
app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ extended: true, limit: '15mb' }));

// Lazy init Gemini client to prevent crashes if key is missing
let aiClient: GoogleGenAI | null = null;
function getAiClient(): GoogleGenAI | null {
  if (!aiClient) {
    const key = process.env.GEMINI_API_KEY;
    if (key) {
      aiClient = new GoogleGenAI({
        apiKey: key,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          }
        }
      });
    }
  }
  return aiClient;
}

// Auth Middleware
function authenticateToken(req: any, res: any, next: any) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  const payload = verifyToken(token);
  if (!payload) {
    return res.status(403).json({ error: 'Invalid or expired token' });
  }

  req.user = payload;
  next();
}

function requireAdmin(req: any, res: any, next: any) {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin privileges required' });
  }
  next();
}

// Optional Auth Middleware for logs
function optionalAuthenticateToken(req: any, res: any, next: any) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (token) {
    const payload = verifyToken(token);
    if (payload) {
      req.user = payload;
    }
  }
  next();
}

// ==========================================
// AUTHENTICATION ENDPOINTS
// ==========================================

app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required' });
    }

    const existingUser = await DatabaseService.getUserByEmail(email);
    if (existingUser) {
      return res.status(409).json({ error: 'Email already registered' });
    }

    const passwordHash = hashPassword(password);
    const newUser = await DatabaseService.createUser({
      name,
      email,
      passwordHash,
      role: 'user'
    });

    const token = signToken({ id: newUser.id, name: newUser.name, email: newUser.email, role: newUser.role });
    res.status(201).json({
      token,
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role
      }
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Registration failed' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const user = await DatabaseService.getUserByEmail(email);
    if (!user || !verifyPassword(password, user.passwordHash)) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const token = signToken({ id: user.id, name: user.name, email: user.email, role: user.role });
    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Login failed' });
  }
});

app.get('/api/auth/me', authenticateToken, async (req: any, res) => {
  try {
    const user = await DatabaseService.getUserById(req.user.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt
      }
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/auth/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }
    const user = await DatabaseService.getUserByEmail(email);
    if (!user) {
      return res.status(404).json({ error: 'If the email exists, a password reset link has been sent' });
    }
    // Simulate reset link dispatch
    res.json({ message: 'A secure password reset link has been dispatched to your email address' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ==========================================
// PRODUCTS ENDPOINTS
// ==========================================

app.get('/api/products', async (req, res) => {
  try {
    const { category, gender, query } = req.query;
    let products = await DatabaseService.getProducts();

    if (category) {
      products = products.filter(p => p.category.toLowerCase() === String(category).toLowerCase());
    }
    if (gender) {
      products = products.filter(p => p.gender.toLowerCase() === String(gender).toLowerCase());
    }
    if (query) {
      const q = String(query).toLowerCase();
      products = products.filter(p => 
        p.name.toLowerCase().includes(q) || 
        p.brand.toLowerCase().includes(q) || 
        p.tags.some(t => t.toLowerCase().includes(q)) ||
        p.description.toLowerCase().includes(q)
      );
    }

    res.json(products);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/products/:id', async (req, res) => {
  try {
    const product = await DatabaseService.getProductById(req.params.id);
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    // Dynamic Similar Products Based on tag & category overlap
    const allProducts = await DatabaseService.getProducts();
    const similarProducts = allProducts
      .filter(p => p.id !== product.id && (p.category === product.category || p.gender === product.gender))
      .map(p => {
        // Calculate a basic tag overlap score
        const overlap = p.tags.filter(t => product.tags.includes(t)).length;
        return { product: p, score: overlap };
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, 4)
      .map(item => item.product);

    res.json({ product, similarProducts });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ==========================================
// CART ENDPOINTS
// ==========================================

app.get('/api/cart', authenticateToken, async (req: any, res) => {
  try {
    const items = await DatabaseService.getCart(req.user.id);
    res.json(items);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/cart/add', authenticateToken, async (req: any, res) => {
  try {
    const { productId, quantity, size, color } = req.body;
    if (!productId || !quantity || !size || !color) {
      return res.status(400).json({ error: 'productId, quantity, size, and color are required' });
    }
    const updatedCart = await DatabaseService.addToCart(req.user.id, {
      productId,
      quantity: Number(quantity),
      size,
      color
    });
    res.json(updatedCart);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/cart/remove', authenticateToken, async (req: any, res) => {
  try {
    const { productId, size, color } = req.body;
    if (!productId || !size || !color) {
      return res.status(400).json({ error: 'productId, size, and color are required' });
    }
    const updatedCart = await DatabaseService.removeFromCart(req.user.id, productId, size, color);
    res.json(updatedCart);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/cart/update', authenticateToken, async (req: any, res) => {
  try {
    const { productId, size, color, quantity } = req.body;
    if (!productId || !size || !color || quantity === undefined) {
      return res.status(400).json({ error: 'productId, size, color, and quantity are required' });
    }
    const updatedCart = await DatabaseService.updateCartQty(req.user.id, productId, size, color, Number(quantity));
    res.json(updatedCart);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ==========================================
// WISHLIST ENDPOINTS
// ==========================================

app.get('/api/wishlist', authenticateToken, async (req: any, res) => {
  try {
    const productIds = await DatabaseService.getWishlist(req.user.id);
    res.json(productIds);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/wishlist/toggle', authenticateToken, async (req: any, res) => {
  try {
    const { productId } = req.body;
    if (!productId) {
      return res.status(400).json({ error: 'productId is required' });
    }
    const productIds = await DatabaseService.toggleWishlist(req.user.id, productId);
    res.json(productIds);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ==========================================
// ORDERS ENDPOINTS
// ==========================================

app.get('/api/orders', authenticateToken, async (req: any, res) => {
  try {
    const orders = await DatabaseService.getOrdersByUserId(req.user.id);
    res.json(orders);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/orders', authenticateToken, async (req: any, res) => {
  try {
    const { items, totalAmount, shippingAddress, couponApplied } = req.body;
    if (!items || !totalAmount || !shippingAddress) {
      return res.status(400).json({ error: 'items, totalAmount, and shippingAddress are required' });
    }

    const order = await DatabaseService.createOrder({
      userId: req.user.id,
      items,
      totalAmount,
      shippingAddress,
      couponApplied
    });

    // Clear user's cart on successful checkout
    await DatabaseService.clearCart(req.user.id);

    res.status(201).json(order);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ==========================================
// REVIEWS ENDPOINTS
// ==========================================

app.get('/api/reviews/:productId', async (req, res) => {
  try {
    const reviews = await DatabaseService.getReviewsByProductId(req.params.productId);
    res.json(reviews);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/reviews', authenticateToken, async (req: any, res) => {
  try {
    const { productId, rating, comment } = req.body;
    if (!productId || !rating || !comment) {
      return res.status(400).json({ error: 'productId, rating, and comment are required' });
    }

    const newReview = await DatabaseService.addReview({
      productId,
      userId: req.user.id,
      userName: req.user.name,
      rating: Number(rating),
      comment
    });

    res.status(201).json(newReview);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ==========================================
// AI SEARCH & RECOMMENDATION LOGIC (GEMINI)
// ==========================================

// Helper to provide catalogue context to Gemini for search matching
async function getCatalogBrief() {
  const products = await DatabaseService.getProducts();
  return products.map(p => ({
    id: p.id,
    name: p.name,
    brand: p.brand,
    category: p.category,
    gender: p.gender,
    price: p.price,
    description: p.description,
    colors: p.colors.map(c => c.name),
    sizes: p.sizes,
    tags: p.tags
  }));
}

// 1. Text Search API (Semantic Neural Search)
app.post('/api/ai/search/text', optionalAuthenticateToken, async (req: any, res) => {
  try {
    const { query } = req.body;
    if (!query) {
      return res.status(400).json({ error: 'Query text is required' });
    }

    // Save search log
    await DatabaseService.addSearchLog({
      userId: req.user?.id || null,
      query,
      searchType: 'text'
    });

    const ai = getAiClient();
    const products = await DatabaseService.getProducts();

    if (!ai) {
      // Fallback keyword match if API key is not configured
      const q = query.toLowerCase();
      const filtered = products
        .map(p => {
          let score = 0;
          if (p.name.toLowerCase().includes(q)) score += 0.8;
          if (p.description.toLowerCase().includes(q)) score += 0.5;
          if (p.tags.some(t => t.toLowerCase().includes(q))) score += 0.7;
          return { product: p, score };
        })
        .filter(item => item.score > 0)
        .sort((a, b) => b.score - a.score)
        .map(item => ({
          productId: item.product.id,
          score: item.score,
          matchReason: `Matched keywords in product details.`
        }));

      return res.json({ matches: filtered.slice(0, 10), isFallback: true });
    }

    const catalog = await getCatalogBrief();

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: `You are AuraStyle's premium fashion neural similarity matchmaker.
Analyze the user's natural language style search query: "${query}".
Compare it meticulously against our modern clothing catalog:
${JSON.stringify(catalog, null, 2)}

Rank products based on how closely they fit the semantic meaning, style, occasion, cut, colors, and type of clothing requested.
Return a structured JSON list of the top matches, containing the productId, a score (0.0 to 1.0 indicating similarity confidence), and a human-readable 1-sentence matchReason explaining why this product is a spectacular styling match.`,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            matches: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  productId: { type: Type.STRING },
                  score: { type: Type.NUMBER },
                  matchReason: { type: Type.STRING }
                },
                required: ['productId', 'score', 'matchReason']
              }
            }
          },
          required: ['matches']
        }
      }
    });

    const result = JSON.parse(response.text || '{"matches":[]}');
    res.json({ matches: result.matches || [], isFallback: false });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 2. Vision/Image Search API
app.post('/api/ai/search/image', optionalAuthenticateToken, async (req: any, res) => {
  try {
    const { base64Image } = req.body; // Expects raw base64 or data-url
    if (!base64Image) {
      return res.status(400).json({ error: 'Base64 image data is required' });
    }

    await DatabaseService.addSearchLog({
      userId: req.user?.id || null,
      query: '[Uploaded Image]',
      searchType: 'image'
    });

    const ai = getAiClient();
    if (!ai) {
      // Return first 4 items as a fallback list if no Gemini API key configured
      const products = await DatabaseService.getProducts();
      const fallback = products.slice(0, 4).map(p => ({
        productId: p.id,
        score: 0.9,
        matchReason: 'Vibe match fallback (Configure your GEMINI_API_KEY in secrets to activate real neural vision search).'
      }));
      return res.json({ matches: fallback, isFallback: true });
    }

    // Clean base64 string
    const base64Data = base64Image.includes(',') ? base64Image.split(',')[1] : base64Image;
    const catalog = await getCatalogBrief();

    const imagePart = {
      inlineData: {
        mimeType: 'image/jpeg',
        data: base64Data
      }
    };

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: [
        imagePart,
        {
          text: `You are AuraStyle's visual search engine. Analyze this uploaded clothing photograph.
Identify the visual traits: type of garment, fit (e.g. oversized, slim), color scheme, fabric type, patterns, collar style, and overall aesthetics.
Find similar garments available in our catalog:
${JSON.stringify(catalog, null, 2)}

Rank products in order of visual similarity. Return a structured JSON list of the top matches containing productId, a score (0.0 to 1.0 confidence), and a 1-sentence matchReason describing the shared visual properties (colors, textures, fits).`
        }
      ],
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            matches: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  productId: { type: Type.STRING },
                  score: { type: Type.NUMBER },
                  matchReason: { type: Type.STRING }
                },
                required: ['productId', 'score', 'matchReason']
              }
            }
          },
          required: ['matches']
        }
      }
    });

    const result = JSON.parse(response.text || '{"matches":[]}');
    res.json({ matches: result.matches || [], isFallback: false });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 3. Multimodal Search API (Image + Text Modifier)
app.post('/api/ai/search/multimodal', optionalAuthenticateToken, async (req: any, res) => {
  try {
    const { base64Image, text } = req.body;
    if (!base64Image || !text) {
      return res.status(400).json({ error: 'Both base64Image and modification text are required' });
    }

    await DatabaseService.addSearchLog({
      userId: req.user?.id || null,
      query: `[Image] + "${text}"`,
      searchType: 'multimodal'
    });

    const ai = getAiClient();
    if (!ai) {
      const products = await DatabaseService.getProducts();
      const fallback = products.slice(2, 6).map(p => ({
        productId: p.id,
        score: 0.85,
        matchReason: `Multimodal fallback for "${text}" (Configure GEMINI_API_KEY for true AI composition).`
      }));
      return res.json({ matches: fallback, isFallback: true });
    }

    const base64Data = base64Image.includes(',') ? base64Image.split(',')[1] : base64Image;
    const catalog = await getCatalogBrief();

    const imagePart = {
      inlineData: {
        mimeType: 'image/jpeg',
        data: base64Data
      }
    };

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: [
        imagePart,
        {
          text: `You are AuraStyle's high-fidelity Multimodal composition engine.
The user uploaded this photo of clothing, BUT gave a specific text instruction: "${text}".
This means they want to find products from our catalog that are visual matches to the photo, BUT modified by the request (e.g., in a different color, dress vs pants, sporty vs luxury, summer version).

Analyze the photo, apply the text modification directive "${text}" to adapt the styling search, and scan our inventory catalogue:
${JSON.stringify(catalog, null, 2)}

Rank the best matched items from our catalog. Return a structured JSON containing:
1. "matches": An array of objects with productId, score (0.0 to 1.0 confidence), and matchReason (1 sentence highlighting how it implements the visual-text composite search).
2. "detectedColorPalette": An array of visual colors detected in the image or query.`
        }
      ],
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            matches: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  productId: { type: Type.STRING },
                  score: { type: Type.NUMBER },
                  matchReason: { type: Type.STRING }
                },
                required: ['productId', 'score', 'matchReason']
              }
            },
            detectedColorPalette: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            }
          },
          required: ['matches', 'detectedColorPalette']
        }
      }
    });

    const result = JSON.parse(response.text || '{"matches":[], "detectedColorPalette": []}');
    res.json({
      matches: result.matches || [],
      detectedColorPalette: result.detectedColorPalette || [],
      isFallback: false
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 4. Voice Search API
app.post('/api/ai/search/voice', optionalAuthenticateToken, async (req: any, res) => {
  try {
    const { transcript } = req.body;
    if (!transcript) {
      return res.status(400).json({ error: 'Voice transcript is required' });
    }

    await DatabaseService.addSearchLog({
      userId: req.user?.id || null,
      query: transcript,
      searchType: 'voice'
    });

    // Delegate to semantic text search engine directly
    const ai = getAiClient();
    const products = await DatabaseService.getProducts();

    if (!ai) {
      const q = transcript.toLowerCase();
      const filtered = products
        .map(p => {
          let score = 0;
          if (p.name.toLowerCase().includes(q)) score += 0.8;
          if (p.description.toLowerCase().includes(q)) score += 0.5;
          if (p.tags.some(t => t.toLowerCase().includes(q))) score += 0.7;
          return { product: p, score };
        })
        .filter(item => item.score > 0)
        .sort((a, b) => b.score - a.score)
        .map(item => ({
          productId: item.product.id,
          score: item.score,
          matchReason: `Voice matched: "${transcript}"`
        }));
      return res.json({ transcript, matches: filtered.slice(0, 10), isFallback: true });
    }

    const catalog = await getCatalogBrief();
    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: `You are AuraStyle's voice search processor. Translate and parse this speech-to-text transcript: "${transcript}".
Identify fashion descriptors (categories, occasions, colors, cuts) and find matches in our clothing catalogue:
${JSON.stringify(catalog, null, 2)}

Return a structured JSON list of the top matches containing productId, score (0.0 to 1.0 confidence), and a 1-sentence matchReason.`,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            matches: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  productId: { type: Type.STRING },
                  score: { type: Type.NUMBER },
                  matchReason: { type: Type.STRING }
                },
                required: ['productId', 'score', 'matchReason']
              }
            }
          },
          required: ['matches']
        }
      }
    });

    const result = JSON.parse(response.text || '{"matches":[]}');
    res.json({ transcript, matches: result.matches || [], isFallback: false });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 5. Dynamic Recommendation Engine API (Based on Search Logs, Cart, Wishlist, Categories)
app.post('/api/ai/recommend', optionalAuthenticateToken, async (req: any, res) => {
  try {
    const products = await DatabaseService.getProducts();
    const userId = req.user?.id;

    if (!userId) {
      // In guest mode, return trending, highest-rated items
      const trending = products.sort((a, b) => b.rating - a.rating).slice(0, 6);
      return res.json({
        recommendations: trending,
        reason: 'Trending best-sellers in current season.'
      });
    }

    const wishlistIds = await DatabaseService.getWishlist(userId);
    const cartItems = await DatabaseService.getCart(userId);
    const orders = await DatabaseService.getOrdersByUserId(userId);
    const searchLogs = await DatabaseService.getSearchLogsByUserId(userId);

    const hasInteractions = wishlistIds.length > 0 || cartItems.length > 0 || orders.length > 0 || searchLogs.length > 0;
    if (!hasInteractions) {
      // Fresh account: return diverse popular categories
      const recommended = products.slice(0, 6);
      return res.json({
        recommendations: recommended,
        reason: 'Recommended for your fresh profile.'
      });
    }

    const ai = getAiClient();
    if (!ai) {
      // Fallback: Recommend products of same categories as what is in wishlist/cart
      const interactedCats = new Set<string>();
      wishlistIds.forEach(id => {
        const p = products.find(prod => prod.id === id);
        if (p) interactedCats.add(p.category);
      });
      cartItems.forEach(item => {
        const p = products.find(prod => prod.id === item.productId);
        if (p) interactedCats.add(p.category);
      });

      const catList = Array.from(interactedCats);
      const recommended = products
        .filter(p => !wishlistIds.includes(p.id) && !cartItems.some(i => i.productId === p.id))
        .filter(p => catList.length === 0 || catList.includes(p.category))
        .slice(0, 6);

      return res.json({
        recommendations: recommended.length > 0 ? recommended : products.slice(0, 6),
        reason: 'Inspired by your categorized interests.'
      });
    }

    // AI-personalized recommendation based on real history
    const catalog = await getCatalogBrief();
    const userProfileSummary = {
      wishlistedProductIds: wishlistIds,
      cartProductIds: cartItems.map(c => c.productId),
      orderedProducts: orders.flatMap(o => o.items.map(item => item.name)),
      recentSearchQueries: searchLogs.map(l => l.query).slice(-5)
    };

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: `You are AuraStyle's dynamic personalized stylist.
Analyze this user's taste and activity profile:
${JSON.stringify(userProfileSummary, null, 2)}

Match their preferences against our catalog inventory:
${JSON.stringify(catalog, null, 2)}

Select 6 products that represent perfect recommendations for this user. Avoid items already in their cart/wishlist.
Explain why you curated this set. Return structured JSON with:
1. "recommendedIds": An array of matched productIds.
2. "curationReason": A warm, premium 2-sentence explanation of why these pieces suit their stylistic trajectory.`,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            recommendedIds: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            },
            curationReason: { type: Type.STRING }
          },
          required: ['recommendedIds', 'curationReason']
        }
      }
    });

    const result = JSON.parse(response.text || '{"recommendedIds":[], "curationReason":""}');
    const matchedProducts = products.filter(p => result.recommendedIds.includes(p.id));
    
    res.json({
      recommendations: matchedProducts.length > 0 ? matchedProducts : products.slice(0, 6),
      reason: result.curationReason || 'Custom tailored styling based on your wardrobe interactions.'
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 6. Interactive Fashion Chatbot (Styling & Outfit Recommender)
app.post('/api/ai/chat', optionalAuthenticateToken, async (req: any, res) => {
  try {
    const { messages, selectedProductId, currentSeason, currentOccasion } = req.body;
    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'messages array is required' });
    }

    const ai = getAiClient();
    const products = await DatabaseService.getProducts();

    if (!ai) {
      const lastMsg = messages[messages.length - 1]?.content || '';
      return res.json({
        message: `I would love to help you with your fashion styling! It looks like we are in offline sandbox mode (GEMINI_API_KEY is not configured yet in secrets).
        
        To answer your question briefly: "${lastMsg}" - We have amazing Streetwear, Luxury, and Activewear outfits in our catalog. Look around and feel free to ask again once the key is loaded!`
      });
    }

    const catalog = await getCatalogBrief();
    let productContext = '';
    if (selectedProductId) {
      const p = products.find(prod => prod.id === selectedProductId);
      if (p) {
        productContext = `The user is currently viewing the following product in detail: ${JSON.stringify(p, null, 2)}. You can suggest other items that complete an outfit with this item.`;
      }
    }

    const historyParts = messages.map(msg => ({
      text: `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}`
    }));

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: [
        ...historyParts,
        {
          text: `You are AuraStyle's digital Haute Couture Fashion Consultant. You are styling a highly elite client.
Current context:
- Catalog of items: ${JSON.stringify(catalog, null, 2)}
- Current Season: ${currentSeason || 'Any'}
- Current Occasion: ${currentOccasion || 'Casual'}
${productContext}

Provide a friendly, deeply creative, and descriptive fashion response. Speak with luxury fashion expertise, referencing colors, materials (merino wool, cashmere, French linen), and fit layering. In your advice, explicitly refer to product names in our catalog (putting them in bold) and suggest specific pairings to form complete outfit lookbooks. Keep your response highly readable with paragraphs and bullet points, under 200 words.`
        }
      ]
    });

    res.json({ message: response.text || "I am currently styling your wardrobe. Let's explore together!" });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ==========================================
// ADMIN DASHBOARD ENDPOINTS
// ==========================================

app.get('/api/admin/analytics', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const users = await DatabaseService.getUsers();
    const products = await DatabaseService.getProducts();
    const orders = await DatabaseService.getOrders();
    const logs = await DatabaseService.getAllSearchLogs();

    const totalUsers = users.length;
    const totalProducts = products.length;
    const totalOrders = orders.length;

    const revenue = orders
      .filter(o => o.status !== 'Cancelled')
      .reduce((sum, o) => sum + o.totalAmount, 0);

    // Compute most searched terms
    const searchStats: Record<string, number> = {};
    logs.forEach(log => {
      const q = log.query.trim().toLowerCase();
      if (q && q !== '[uploaded image]') {
        searchStats[q] = (searchStats[q] || 0) + 1;
      }
    });
    const mostSearched = Object.entries(searchStats)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([query, count]) => ({ query, count }));

    res.json({
      analytics: {
        totalUsers,
        totalProducts,
        totalOrders,
        revenue,
        mostSearched,
        searchCountsByType: {
          text: logs.filter(l => l.searchType === 'text').length,
          image: logs.filter(l => l.searchType === 'image').length,
          multimodal: logs.filter(l => l.searchType === 'multimodal').length,
          voice: logs.filter(l => l.searchType === 'voice').length
        }
      }
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/admin/users', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const users = await DatabaseService.getUsers();
    // Return users without password hashes
    const sanitized = users.map(u => ({ id: u.id, name: u.name, email: u.email, role: u.role, createdAt: u.createdAt }));
    res.json(sanitized);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/admin/orders', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const orders = await DatabaseService.getOrders();
    res.json(orders);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/admin/orders/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { status } = req.body;
    if (!status) {
      return res.status(400).json({ error: 'Status is required' });
    }
    const updated = await DatabaseService.updateOrderStatus(req.params.id, status);
    if (!updated) {
      return res.status(404).json({ error: 'Order not found' });
    }
    res.json(updated);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/admin/products', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { name, brand, category, price, description, images, sizes, colors, gender, tags } = req.body;
    if (!name || !brand || !category || price === undefined || !description || !images || !sizes || !colors || !gender || !tags) {
      return res.status(400).json({ error: 'All product fields are required' });
    }

    const newProd = await DatabaseService.addProduct({
      name,
      brand,
      category,
      price: Number(price),
      description,
      images,
      sizes,
      colors,
      gender,
      tags,
      rating: 5.0,
      reviewsCount: 0
    });

    res.status(201).json(newProd);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/admin/products/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const updated = await DatabaseService.editProduct(req.params.id, req.body);
    if (!updated) {
      return res.status(404).json({ error: 'Product not found' });
    }
    res.json(updated);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/admin/products/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const deleted = await DatabaseService.deleteProduct(req.params.id);
    if (!deleted) {
      return res.status(404).json({ error: 'Product not found' });
    }
    res.json({ message: 'Product deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});


// ==========================================
// VITE AND STATIC ASSETS ROUTING MIDDLEWARE
// ==========================================

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[AuraStyle Full-Stack Server] running on http://localhost:${PORT}`);
  });
}

startServer();
