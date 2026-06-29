import fs from 'fs/promises';
import path from 'path';

const DB_FILE_PATH = path.join(process.cwd(), 'src', 'db', 'db.json');

export interface User {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  role: 'admin' | 'user';
  createdAt: string;
}

export interface ProductColor {
  name: string;
  hex: string;
}

export interface Product {
  id: string;
  name: string;
  brand: string;
  category: string; // Luxury, Streetwear, Accessories, Sports, etc.
  price: number;
  description: string;
  images: string[];
  sizes: string[];
  colors: ProductColor[];
  rating: number;
  reviewsCount: number;
  gender: 'Men' | 'Women' | 'Kids' | 'Unisex';
  tags: string[];
  createdAt: string;
}

export interface OrderItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  size: string;
  color: string;
  image: string;
}

export interface Order {
  id: string;
  userId: string;
  items: OrderItem[];
  totalAmount: number;
  shippingAddress: {
    fullName: string;
    addressLine1: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
    phone: string;
  };
  couponApplied?: string;
  status: 'Pending' | 'Shipped' | 'Delivered' | 'Cancelled';
  createdAt: string;
}

export interface Review {
  id: string;
  productId: string;
  userId: string;
  userName: string;
  rating: number;
  comment: string;
  createdAt: string;
}

export interface SearchLog {
  id: string;
  userId: string | null;
  query: string;
  searchType: 'text' | 'image' | 'multimodal' | 'voice';
  createdAt: string;
}

export interface CartItem {
  productId: string;
  quantity: number;
  size: string;
  color: string;
}

export interface Cart {
  userId: string;
  items: CartItem[];
}

export interface Wishlist {
  userId: string;
  productIds: string[];
}

export interface DatabaseSchema {
  users: User[];
  products: Product[];
  orders: Order[];
  reviews: Review[];
  searchLogs: SearchLog[];
  carts: Cart[];
  wishlists: Wishlist[];
}

// Seed Data
const initialProducts: Product[] = [
  {
    id: 'prod_1',
    name: 'Oversized Core Fleece Hoodie',
    brand: 'Aura Streetwear',
    category: 'Streetwear',
    price: 9990,
    description: 'Designed for ultimate comfort. Engineered from heavy 450gsm organic cotton fleece, this drop-shoulder, double-lined hoodie delivers a relaxed streetwear drape perfect for seasonal layering.',
    images: [
      'https://images.unsplash.com/photo-1556821840-3a63f95609a7?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=600&q=80'
    ],
    sizes: ['S', 'M', 'L', 'XL'],
    colors: [
      { name: 'Pitch Black', hex: '#111111' },
      { name: 'Slate Gray', hex: '#555555' }
    ],
    rating: 4.8,
    reviewsCount: 34,
    gender: 'Men',
    tags: ['hoodie', 'oversized', 'winter', 'black', 'fleece', 'streetwear', 'casual'],
    createdAt: new Date().toISOString()
  },
  {
    id: 'prod_2',
    name: 'Tailored Double-Breasted Cashmere Overcoat',
    brand: 'Aura Atelier',
    category: 'Luxury',
    price: 35990,
    description: 'The epitome of classic tailoring. Crafted from a blend of Italian wool and grade-A cashmere, this double-breasted overcoat features structural peak lapels, side welt pockets, and a luxurious satin-lined interior.',
    images: [
      'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1544022613-e87ca75a784a?auto=format&fit=crop&w=600&q=80'
    ],
    sizes: ['XS', 'S', 'M', 'L'],
    colors: [
      { name: 'Camel', hex: '#C19A6B' },
      { name: 'Midnight Navy', hex: '#1A293E' }
    ],
    rating: 4.9,
    reviewsCount: 18,
    gender: 'Women',
    tags: ['coat', 'camel', 'luxury', 'cashmere', 'winter', 'outerwear', 'elegant'],
    createdAt: new Date().toISOString()
  },
  {
    id: 'prod_3',
    name: 'Slim-Fit Japanese Selvedge Denim',
    brand: 'Aura Denim Co.',
    category: 'Streetwear',
    price: 14990,
    description: 'Woven on heritage shuttle looms in Kojima, Japan. These raw 14oz indigo selvedge jeans will break in uniquely to your body over time. Finished with signature red-line selvedge ID, custom branded copper hardware, and a leather patch.',
    images: [
      'https://images.unsplash.com/photo-1542272604-787c3835535d?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1582562124811-c09040d0a901?auto=format&fit=crop&w=600&q=80'
    ],
    sizes: ['30', '32', '34', '36'],
    colors: [
      { name: 'Indigo Blue', hex: '#2E4057' }
    ],
    rating: 4.7,
    reviewsCount: 22,
    gender: 'Men',
    tags: ['denim', 'blue', 'jeans', 'casual', 'streetwear', 'pants'],
    createdAt: new Date().toISOString()
  },
  {
    id: 'prod_4',
    name: 'Pleated Emerald Silk Evening Gown',
    brand: 'Aura Atelier',
    category: 'Luxury',
    price: 44990,
    description: 'An ethereal silhouette for unforgettable evenings. Made from luxurious 100% mulberry silk crepe, this gown displays custom pleated bodice details, a fluid draped floor-length skirt, and a delicate open-back design.',
    images: [
      'https://images.unsplash.com/photo-1566174053879-31528523f8ae?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=600&q=80'
    ],
    sizes: ['XS', 'S', 'M', 'L'],
    colors: [
      { name: 'Emerald Green', hex: '#0F52BA' },
      { name: 'Crimson Red', hex: '#990000' }
    ],
    rating: 5.0,
    reviewsCount: 12,
    gender: 'Women',
    tags: ['dress', 'gown', 'luxury', 'green', 'silk', 'evening', 'party'],
    createdAt: new Date().toISOString()
  },
  {
    id: 'prod_5',
    name: 'Asymmetric Vintage Leather Biker Jacket',
    brand: 'Aura Streetwear',
    category: 'Streetwear',
    price: 25990,
    description: 'The ultimate rock-and-roll icon. Handcrafted from supple, distressed full-grain calfskin leather, this jacket features chunky steel zippers, an adjustable belted waist, and a quilted lining for warmth and longevity.',
    images: [
      'https://images.unsplash.com/photo-1551028719-00167b16eac5?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1521223890158-f9f7c3d5d504?auto=format&fit=crop&w=600&q=80'
    ],
    sizes: ['S', 'M', 'L', 'XL'],
    colors: [
      { name: 'Distressed Black', hex: '#1C1C1C' },
      { name: 'Mocha Brown', hex: '#4B3621' }
    ],
    rating: 4.8,
    reviewsCount: 29,
    gender: 'Men',
    tags: ['leather', 'jacket', 'black', 'biker', 'vintage', 'streetwear', 'outerwear'],
    createdAt: new Date().toISOString()
  },
  {
    id: 'prod_6',
    name: 'Active-Dry Tech Track Pants',
    brand: 'Aura Sports',
    category: 'Sports',
    price: 6990,
    description: 'Designed for athletes on the move. Engineered from lightweight, water-repellent, four-way stretch nylon blend, these tapered track pants offer secure zipped storage, laser-cut ventilation ports, and customizable ankle zips.',
    images: [
      'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=600&q=80'
    ],
    sizes: ['S', 'M', 'L', 'XL'],
    colors: [
      { name: 'Charcoal Gray', hex: '#3E424B' },
      { name: 'Aero Blue', hex: '#1E3D59' }
    ],
    rating: 4.6,
    reviewsCount: 15,
    gender: 'Men',
    tags: ['sports', 'track', 'gray', 'pants', 'tech', 'activewear', 'athletic'],
    createdAt: new Date().toISOString()
  },
  {
    id: 'prod_7',
    name: 'Ribbed Merino Wool Mockneck Sweater',
    brand: 'Aura Atelier',
    category: 'Luxury',
    price: 12990,
    description: 'Incredibly soft, warmth without weight. Knit from 100% fine merino wool in a high-density flat rib structure. Features a comfortable mockneck collar and beautiful raglan sleeve details.',
    images: [
      'https://images.unsplash.com/photo-1574164904299-3a102b110380?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1516762689617-e1cffcef479d?auto=format&fit=crop&w=600&q=80'
    ],
    sizes: ['XS', 'S', 'M', 'L'],
    colors: [
      { name: 'Ivory White', hex: '#FDFBF7' },
      { name: 'Warm Beige', hex: '#D2B48C' }
    ],
    rating: 4.9,
    reviewsCount: 41,
    gender: 'Women',
    tags: ['sweater', 'ivory', 'wool', 'winter', 'luxury', 'casual', 'knit'],
    createdAt: new Date().toISOString()
  },
  {
    id: 'prod_8',
    name: 'Run-Swift Split Shorts',
    brand: 'Aura Sports',
    category: 'Sports',
    price: 4490,
    description: 'Ultra-lightweight race shorts designed for peak endurance. Features high split side seams for uninhibited leg movement, an integrated supportive compression liner, and a zipper-secured pocket for energy gels.',
    images: [
      'https://images.unsplash.com/photo-1539185441755-769473a23570?auto=format&fit=crop&w=600&q=80'
    ],
    sizes: ['S', 'M', 'L'],
    colors: [
      { name: 'Neon Orange', hex: '#FF5E36' },
      { name: 'Active Black', hex: '#0A0A0A' }
    ],
    rating: 4.5,
    reviewsCount: 10,
    gender: 'Men',
    tags: ['sports', 'run', 'shorts', 'orange', 'activewear', 'athletic'],
    createdAt: new Date().toISOString()
  },
  {
    id: 'prod_9',
    name: 'Canvas MA-1 Flight Bomber Jacket',
    brand: 'Aura Streetwear',
    category: 'Streetwear',
    price: 11990,
    description: 'A robust utility outer shell. Inspired by military archives, this bomber jacket is crafted from rugged cotton canvas with quilted insulation, heavy-duty silver hardware, and secure utility sleeve compartments.',
    images: [
      'https://images.unsplash.com/photo-1544441893-675973e31985?auto=format&fit=crop&w=600&q=80'
    ],
    sizes: ['S', 'M', 'L'],
    colors: [
      { name: 'Olive Green', hex: '#556B2F' },
      { name: 'Pitch Black', hex: '#111111' }
    ],
    rating: 4.7,
    reviewsCount: 26,
    gender: 'Women',
    tags: ['jacket', 'olive', 'bomber', 'military', 'streetwear', 'outerwear'],
    createdAt: new Date().toISOString()
  },
  {
    id: 'prod_10',
    name: 'Premium Flax Linen Resort Shirt',
    brand: 'Aura Atelier',
    category: 'Luxury',
    price: 7990,
    description: 'Effortless warm-weather sophistication. Crafted from 100% sustainably-sourced French flax linen, pre-washed for exceptional softness. Styled with an airy camp collar, relaxed fit, and genuine mother-of-pearl buttons.',
    images: [
      'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&w=600&q=80'
    ],
    sizes: ['S', 'M', 'L', 'XL'],
    colors: [
      { name: 'Pristine White', hex: '#FFFFFF' },
      { name: 'Ocean Mist Blue', hex: '#D4F1F4' }
    ],
    rating: 4.8,
    reviewsCount: 19,
    gender: 'Men',
    tags: ['shirt', 'white', 'linen', 'summer', 'casual', 'resort', 'luxury'],
    createdAt: new Date().toISOString()
  },
  {
    id: 'prod_11',
    name: 'Aura Handcrafted Saffiano Leather Tote',
    brand: 'Aura Atelier',
    category: 'Accessories',
    price: 19990,
    description: 'A masterclass in functional luxury. Structured from durable scratch-resistant Saffiano leather, this tote features a roomy interior, padded laptop sleeve, customized gold-toned protective feet, and precise hand-painted raw edges.',
    images: [
      'https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=600&q=80'
    ],
    sizes: ['One Size'],
    colors: [
      { name: 'Tan Brown', hex: '#A0522D' },
      { name: 'Onyx Black', hex: '#0C0C0C' }
    ],
    rating: 4.9,
    reviewsCount: 33,
    gender: 'Unisex',
    tags: ['bag', 'accessory', 'leather', 'brown', 'tote', 'luxury', 'handbag'],
    createdAt: new Date().toISOString()
  },
  {
    id: 'prod_12',
    name: 'Monochrome Chronograph Titanium Watch',
    brand: 'Aura Atelier',
    category: 'Accessories',
    price: 29990,
    description: 'Sleek, high-grade lightweight design. Forged with a 40mm matte titanium case and fitted with custom sapphire crystal glass. Powered by a precision Japanese chronograph movement, water-resistant up to 50 meters.',
    images: [
      'https://images.unsplash.com/photo-1522312346375-d1a52e2b99b3?auto=format&fit=crop&w=600&q=80'
    ],
    sizes: ['One Size'],
    colors: [
      { name: 'Matte Titanium', hex: '#4A4A4A' }
    ],
    rating: 4.9,
    reviewsCount: 14,
    gender: 'Unisex',
    tags: ['watch', 'accessory', 'black', 'metal', 'luxury', 'jewelry'],
    createdAt: new Date().toISOString()
  },
  {
    id: 'prod_13',
    name: 'Plush Teddy Fleece Bear-Ear Hoodie',
    brand: 'Aura Kids',
    category: 'Kids',
    price: 3490,
    description: 'Unmatched warmth for playful days. This super-soft, high-pile plush teddy fleece hoodie features adorable bear ears on the hood, ribbed storm cuffs, and an easy-zip front designed for little hands.',
    images: [
      'https://images.unsplash.com/photo-1519457431-44ccd64a579b?auto=format&fit=crop&w=600&q=80'
    ],
    sizes: ['4Y', '6Y', '8Y', '10Y'],
    colors: [
      { name: 'Teddy Beige', hex: '#E1C699' },
      { name: 'Dusty Rose', hex: '#DCAE96' }
    ],
    rating: 4.8,
    reviewsCount: 27,
    gender: 'Kids',
    tags: ['kids', 'fleece', 'beige', 'hoodie', 'winter', 'cute', 'teddy'],
    createdAt: new Date().toISOString()
  },
  {
    id: 'prod_14',
    name: 'Retro Suede Low-Top Sneakers',
    brand: 'Aura Sports',
    category: 'Sports',
    price: 10990,
    description: 'Seventies-inspired sports style redefined. Crafted from supple calfskin suede with high-contrast leather stripe overlays, features a cushy vulcanized rubber sole and an eco-friendly cork footbed for natural support.',
    images: [
      'https://images.unsplash.com/photo-1549298916-b41d501d3772?auto=format&fit=crop&w=600&q=80'
    ],
    sizes: ['8', '9', '10', '11'],
    colors: [
      { name: 'Sand Beige', hex: '#E5D3B3' },
      { name: 'Cobalt Navy', hex: '#0020C2' }
    ],
    rating: 4.7,
    reviewsCount: 52,
    gender: 'Men',
    tags: ['sneakers', 'shoes', 'suede', 'sand', 'blue', 'sports', 'casual', 'streetwear'],
    createdAt: new Date().toISOString()
  },
  {
    id: 'prod_15',
    name: 'Seamless Impact Compression Bra',
    brand: 'Aura Sports',
    category: 'Sports',
    price: 4990,
    description: 'High-performance athletic support. Seamlessly knit with body-mapped zoning for maximum airflow and zero distraction. High-impact design featuring a racerback and removable padding.',
    images: [
      'https://images.unsplash.com/photo-1518310383802-640c2de311b2?auto=format&fit=crop&w=600&q=80'
    ],
    sizes: ['S', 'M', 'L'],
    colors: [
      { name: 'Dusty Pink', hex: '#DE6B92' },
      { name: 'Active Onyx', hex: '#0D0D0D' }
    ],
    rating: 4.6,
    reviewsCount: 30,
    gender: 'Women',
    tags: ['sports', 'pink', 'activewear', 'gym', 'seamless', 'undergarment'],
    createdAt: new Date().toISOString()
  },
  {
    id: 'prod_16',
    name: 'Tailored Pleated Trousers',
    brand: 'Aura Atelier',
    category: 'Luxury',
    price: 13990,
    description: 'Flawless structural draping. High-waisted trousers tailored from premium lightweight wool-blend. Engineered with neat double-front pleats, pressed creases, and deep side pockets.',
    images: [
      'https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?auto=format&fit=crop&w=600&q=80'
    ],
    sizes: ['XS', 'S', 'M', 'L'],
    colors: [
      { name: 'Slate Gray', hex: '#708090' },
      { name: 'Onyx Black', hex: '#0A0A0A' }
    ],
    rating: 4.8,
    reviewsCount: 16,
    gender: 'Women',
    tags: ['pants', 'gray', 'pleated', 'tailored', 'luxury', 'office', 'formal'],
    createdAt: new Date().toISOString()
  }
];

export class DatabaseService {
  private static async ensureInitialized(): Promise<DatabaseSchema> {
    try {
      await fs.mkdir(path.dirname(DB_FILE_PATH), { recursive: true });
      const content = await fs.readFile(DB_FILE_PATH, 'utf-8');
      return JSON.parse(content);
    } catch (error) {
      // Create with seed values
      const initialDb: DatabaseSchema = {
        users: [
          {
            id: 'user_admin',
            name: 'AuraStyle Faculty Admin',
            email: 'admin@aurastyle.com',
            // Default password: admin123 -> salt and PBKDF2 hash using salt below
            passwordHash: '8e815e985834fc07b5e804f32a514d88:4fb889e49a888c7f999bd9fc2ee03e35ef7d22bf0fc3d05be156f082e6ef296fa2fcd5c79658dbbc0cb73c52e8be48bf7613589b91e98cb573ff0a05847b2c93', // pbkdf2 with salt
            role: 'admin',
            createdAt: new Date().toISOString()
          },
          {
            id: 'user_demo',
            name: 'Demo Student User',
            email: 'user@aurastyle.com',
            // Default password: user123
            passwordHash: 'c6dbde27e04bf7cbf4d8e878345719bc:e327da8fae544a49688bc8a9b31d0446b3f81e3a9856f7ef57d7705cc8671fcaef6599268f7605d8f63459cfae9681b95f269da58f504ca2d765089e9f91a5ee',
            role: 'user',
            createdAt: new Date().toISOString()
          }
        ],
        products: initialProducts,
        orders: [],
        reviews: [
          {
            id: 'rev_1',
            productId: 'prod_1',
            userId: 'user_demo',
            userName: 'Demo Student User',
            rating: 5,
            comment: 'Incredibly thick hoodie. The organic cotton feels super high-end and is really soft on the inside. Highly recommended for winter!',
            createdAt: new Date().toISOString()
          }
        ],
        searchLogs: [],
        carts: [],
        wishlists: []
      };
      await fs.writeFile(DB_FILE_PATH, JSON.stringify(initialDb, null, 2), 'utf-8');
      return initialDb;
    }
  }

  private static async writeDb(db: DatabaseSchema): Promise<void> {
    await fs.mkdir(path.dirname(DB_FILE_PATH), { recursive: true });
    await fs.writeFile(DB_FILE_PATH, JSON.stringify(db, null, 2), 'utf-8');
  }

  // --- Users ---
  public static async getUsers(): Promise<User[]> {
    const db = await this.ensureInitialized();
    return db.users;
  }

  public static async getUserById(id: string): Promise<User | undefined> {
    const db = await this.ensureInitialized();
    return db.users.find(u => u.id === id);
  }

  public static async getUserByEmail(email: string): Promise<User | undefined> {
    const db = await this.ensureInitialized();
    return db.users.find(u => u.email.toLowerCase() === email.toLowerCase());
  }

  public static async createUser(user: Omit<User, 'id' | 'createdAt'>): Promise<User> {
    const db = await this.ensureInitialized();
    const newUser: User = {
      ...user,
      id: 'user_' + Math.random().toString(36).substr(2, 9),
      createdAt: new Date().toISOString()
    };
    db.users.push(newUser);
    await this.writeDb(db);
    return newUser;
  }

  // --- Products ---
  public static async getProducts(): Promise<Product[]> {
    const db = await this.ensureInitialized();
    return db.products;
  }

  public static async getProductById(id: string): Promise<Product | undefined> {
    const db = await this.ensureInitialized();
    return db.products.find(p => p.id === id);
  }

  public static async addProduct(product: Omit<Product, 'id' | 'createdAt'>): Promise<Product> {
    const db = await this.ensureInitialized();
    const newProduct: Product = {
      ...product,
      id: 'prod_' + Math.random().toString(36).substr(2, 9),
      createdAt: new Date().toISOString()
    };
    db.products.push(newProduct);
    await this.writeDb(db);
    return newProduct;
  }

  public static async editProduct(id: string, updatedProduct: Partial<Product>): Promise<Product | null> {
    const db = await this.ensureInitialized();
    const index = db.products.findIndex(p => p.id === id);
    if (index === -1) return null;

    db.products[index] = {
      ...db.products[index],
      ...updatedProduct
    };
    await this.writeDb(db);
    return db.products[index];
  }

  public static async deleteProduct(id: string): Promise<boolean> {
    const db = await this.ensureInitialized();
    const index = db.products.findIndex(p => p.id === id);
    if (index === -1) return false;

    db.products.splice(index, 1);
    await this.writeDb(db);
    return true;
  }

  // --- Cart ---
  public static async getCart(userId: string): Promise<CartItem[]> {
    const db = await this.ensureInitialized();
    const cart = db.carts.find(c => c.userId === userId);
    return cart ? cart.items : [];
  }

  public static async addToCart(userId: string, item: CartItem): Promise<CartItem[]> {
    const db = await this.ensureInitialized();
    let cart = db.carts.find(c => c.userId === userId);
    if (!cart) {
      cart = { userId, items: [] };
      db.carts.push(cart);
    }

    const existingIndex = cart.items.findIndex(
      i => i.productId === item.productId && i.size === item.size && i.color === item.color
    );

    if (existingIndex !== -1) {
      cart.items[existingIndex].quantity += item.quantity;
    } else {
      cart.items.push(item);
    }

    await this.writeDb(db);
    return cart.items;
  }

  public static async removeFromCart(userId: string, productId: string, size: string, color: string): Promise<CartItem[]> {
    const db = await this.ensureInitialized();
    const cart = db.carts.find(c => c.userId === userId);
    if (cart) {
      cart.items = cart.items.filter(
        i => !(i.productId === productId && i.size === size && i.color === color)
      );
      await this.writeDb(db);
    }
    return cart ? cart.items : [];
  }

  public static async updateCartQty(userId: string, productId: string, size: string, color: string, quantity: number): Promise<CartItem[]> {
    const db = await this.ensureInitialized();
    const cart = db.carts.find(c => c.userId === userId);
    if (cart) {
      const item = cart.items.find(
        i => i.productId === productId && i.size === size && i.color === color
      );
      if (item) {
        item.quantity = quantity;
        await this.writeDb(db);
      }
    }
    return cart ? cart.items : [];
  }

  public static async clearCart(userId: string): Promise<void> {
    const db = await this.ensureInitialized();
    const cart = db.carts.find(c => c.userId === userId);
    if (cart) {
      cart.items = [];
      await this.writeDb(db);
    }
  }

  // --- Wishlist ---
  public static async getWishlist(userId: string): Promise<string[]> {
    const db = await this.ensureInitialized();
    const wishlist = db.wishlists.find(w => w.userId === userId);
    return wishlist ? wishlist.productIds : [];
  }

  public static async toggleWishlist(userId: string, productId: string): Promise<string[]> {
    const db = await this.ensureInitialized();
    let wishlist = db.wishlists.find(w => w.userId === userId);
    if (!wishlist) {
      wishlist = { userId, productIds: [] };
      db.wishlists.push(wishlist);
    }

    const index = wishlist.productIds.indexOf(productId);
    if (index !== -1) {
      wishlist.productIds.splice(index, 1);
    } else {
      wishlist.productIds.push(productId);
    }

    await this.writeDb(db);
    return wishlist.productIds;
  }

  // --- Orders ---
  public static async getOrders(): Promise<Order[]> {
    const db = await this.ensureInitialized();
    return db.orders;
  }

  public static async getOrdersByUserId(userId: string): Promise<Order[]> {
    const db = await this.ensureInitialized();
    return db.orders.filter(o => o.userId === userId);
  }

  public static async createOrder(order: Omit<Order, 'id' | 'createdAt' | 'status'>): Promise<Order> {
    const db = await this.ensureInitialized();
    const newOrder: Order = {
      ...order,
      id: 'ord_' + Math.random().toString(36).substr(2, 9),
      status: 'Pending',
      createdAt: new Date().toISOString()
    };
    db.orders.push(newOrder);
    await this.writeDb(db);
    return newOrder;
  }

  public static async updateOrderStatus(id: string, status: Order['status']): Promise<Order | null> {
    const db = await this.ensureInitialized();
    const order = db.orders.find(o => o.id === id);
    if (!order) return null;

    order.status = status;
    await this.writeDb(db);
    return order;
  }

  // --- Reviews ---
  public static async getReviewsByProductId(productId: string): Promise<Review[]> {
    const db = await this.ensureInitialized();
    return db.reviews.filter(r => r.productId === productId);
  }

  public static async addReview(review: Omit<Review, 'id' | 'createdAt'>): Promise<Review> {
    const db = await this.ensureInitialized();
    const newReview: Review = {
      ...review,
      id: 'rev_' + Math.random().toString(36).substr(2, 9),
      createdAt: new Date().toISOString()
    };
    db.reviews.push(newReview);

    // Update product rating and count
    const product = db.products.find(p => p.id === review.productId);
    if (product) {
      const productReviews = db.reviews.filter(r => r.productId === review.productId);
      const totalRating = productReviews.reduce((sum, r) => sum + r.rating, 0);
      product.rating = parseFloat((totalRating / productReviews.length).toFixed(1));
      product.reviewsCount = productReviews.length;
    }

    await this.writeDb(db);
    return newReview;
  }

  // --- Search History Logs ---
  public static async addSearchLog(log: Omit<SearchLog, 'id' | 'createdAt'>): Promise<SearchLog> {
    const db = await this.ensureInitialized();
    const newLog: SearchLog = {
      ...log,
      id: 'log_' + Math.random().toString(36).substr(2, 9),
      createdAt: new Date().toISOString()
    };
    db.searchLogs.push(newLog);
    await this.writeDb(db);
    return newLog;
  }

  public static async getSearchLogsByUserId(userId: string): Promise<SearchLog[]> {
    const db = await this.ensureInitialized();
    return db.searchLogs.filter(log => log.userId === userId);
  }

  public static async getAllSearchLogs(): Promise<SearchLog[]> {
    const db = await this.ensureInitialized();
    return db.searchLogs;
  }
}
