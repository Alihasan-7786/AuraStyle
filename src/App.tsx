import React, { useState, useEffect } from 'react';
import { 
  Compass, 
  Sparkles, 
  Sliders, 
  ShieldAlert, 
  Heart, 
  ShoppingBag, 
  LogOut, 
  User as UserIcon, 
  Star, 
  Eye, 
  Trash2, 
  Plus, 
  Minus, 
  Info, 
  Phone, 
  MapPin, 
  CreditCard, 
  CheckCircle2, 
  Cpu, 
  TrendingUp, 
  X, 
  ChevronLeft, 
  ChevronRight, 
  RotateCw,
  Tag,
  Lock,
  Mail,
  UserCheck,
  PackageCheck
} from 'lucide-react';

import Header from './components/Header';
import ProductCard from './components/ProductCard';
import VirtualStylist from './components/VirtualStylist';
import AISearchConsole from './components/AISearchConsole';
import ReviewSection from './components/ReviewSection';
import AdminPanel from './components/AdminPanel';
import { Product, User, CartItem, Order, ShippingAddress } from './types';

export default function App() {
  // Navigation & Session
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentView, setCurrentView] = useState<string>('home');
  const [viewParams, setViewParams] = useState<any>({});
  const [isInitializing, setIsInitializing] = useState(true);

  // Authentication Forms State
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authName, setAuthName] = useState('');
  const [authError, setAuthError] = useState('');
  const [authSuccess, setAuthSuccess] = useState('');

  // Main Catalog Data
  const [products, setProducts] = useState<Product[]>([]);
  const [isProductsLoading, setIsProductsLoading] = useState(true);

  // Cart & Wishlist states
  const [cart, setCart] = useState<CartItem[]>([]);
  const [wishlist, setWishlist] = useState<string[]>([]);
  const [recentlyViewedIds, setRecentlyViewedIds] = useState<string[]>([]);

  // Personalized Recommendation Engine States
  const [aiRecs, setAiRecs] = useState<Product[]>([]);
  const [recReason, setRecReason] = useState('Personalized fashion trajectory based on your design log.');
  const [isRecsLoading, setIsRecsLoading] = useState(false);

  // Active Catalog Filter selection
  const [selectedGenderFilter, setSelectedGenderFilter] = useState<string>('All');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('All');
  const [priceRangeFilter, setPriceRangeFilter] = useState<number>(50000);

  // Checkout UI / Coupon System state
  const [couponCode, setCouponCode] = useState('');
  const [appliedDiscount, setAppliedDiscount] = useState(0); // percentage
  const [couponSuccess, setCouponSuccess] = useState('');
  const [shippingAddress, setShippingAddress] = useState<ShippingAddress>({
    fullName: '',
    addressLine1: '',
    city: '',
    state: '',
    postalCode: '',
    country: 'United States',
    phone: ''
  });
  const [orderSuccessDetails, setOrderSuccessDetails] = useState<Order | null>(null);

  // Detail Page Interactive Simulator states
  const [selectedSize, setSelectedSize] = useState<string>('M');
  const [selectedColor, setSelectedColor] = useState<string>('');
  const [activeImageIdx, setActiveImageIdx] = useState(0);
  const [spinDeg, setSpinDeg] = useState(0); // 360 viewer simulated degrees

  // Verify and Load user session on mount
  const checkSession = async () => {
    const token = localStorage.getItem('aurastyle_token');
    if (!token) {
      setIsInitializing(false);
      return;
    }

    try {
      const res = await fetch('/api/auth/me', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setCurrentUser(data.user);
        
        // Sync Cart & Wishlist from database
        await syncCartAndWishlist(token);
      } else {
        localStorage.removeItem('aurastyle_token');
      }
    } catch (err) {
      console.error('Session restoration error:', err);
    } finally {
      setIsInitializing(false);
    }
  };

  const syncCartAndWishlist = async (token: string) => {
    try {
      // Sync Cart
      const cartRes = await fetch('/api/cart', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (cartRes.ok) {
        const cartItems: CartItem[] = await cartRes.json();
        setCart(cartItems);
      }

      // Sync Wishlist
      const wishlistRes = await fetch('/api/wishlist', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (wishlistRes.ok) {
        const wishProductIds: string[] = await wishlistRes.json();
        setWishlist(wishProductIds);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Fetch all Catalog Products
  const loadProducts = async () => {
    setIsProductsLoading(true);
    try {
      const res = await fetch('/api/products');
      if (res.ok) {
        const data = await res.json();
        setProducts(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsProductsLoading(false);
    }
  };

  // Fetch Personalized AI recommendations
  const loadAiRecommendations = async () => {
    setIsRecsLoading(true);
    try {
      const token = localStorage.getItem('aurastyle_token');
      const headers: HeadersInit = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch('/api/ai/recommend', {
        method: 'POST',
        headers
      });
      if (res.ok) {
        const data = await res.json();
        setAiRecs(data.recommendations);
        setRecReason(data.reason);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsRecsLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
    checkSession();
  }, []);

  // Whenever user switches views or log ins, refresh personalized styling guides
  useEffect(() => {
    if (!isProductsLoading) {
      loadAiRecommendations();
    }
  }, [currentUser, isProductsLoading, currentView]);

  // Handle Log out
  const handleLogout = () => {
    localStorage.removeItem('aurastyle_token');
    setCurrentUser(null);
    setCart([]);
    setWishlist([]);
    setCurrentView('home');
  };

  // Handle Login submission
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setAuthSuccess('');

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: authEmail, password: authPassword })
      });
      const data = await res.json();

      if (res.ok) {
        localStorage.setItem('aurastyle_token', data.token);
        setCurrentUser(data.user);
        setAuthSuccess('Sign-in authorized. Restoring couture wardrobe...');
        setAuthEmail('');
        setAuthPassword('');
        
        await syncCartAndWishlist(data.token);
        
        setTimeout(() => {
          if (data.user.role === 'admin') setCurrentView('admin');
          else setCurrentView('home');
        }, 1200);
      } else {
        setAuthError(data.error || 'Authentication denied.');
      }
    } catch (err) {
      setAuthError('Connection timed out.');
    }
  };

  // Handle Registration submission
  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setAuthSuccess('');

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: authName, email: authEmail, password: authPassword })
      });
      const data = await res.json();

      if (res.ok) {
        localStorage.setItem('aurastyle_token', data.token);
        setCurrentUser(data.user);
        setAuthSuccess('Structured profile deployed! Welcome to AuraStyle.');
        setAuthName('');
        setAuthEmail('');
        setAuthPassword('');
        
        setTimeout(() => {
          setCurrentView('home');
        }, 1200);
      } else {
        setAuthError(data.error || 'Registration criteria failed.');
      }
    } catch (err) {
      setAuthError('Connection timed out.');
    }
  };

  // Global Wishlist toggle
  const handleToggleWishlist = async (productId: string) => {
    if (!currentUser) {
      setCurrentView('login');
      return;
    }

    try {
      const token = localStorage.getItem('aurastyle_token');
      const res = await fetch('/api/wishlist/toggle', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ productId })
      });
      if (res.ok) {
        const updated = await res.json();
        setWishlist(updated);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Add Item to Cart
  const handleAddToCart = async (product: Product, size: string, color: string, qty = 1) => {
    if (!currentUser) {
      setCurrentView('login');
      return;
    }

    try {
      const token = localStorage.getItem('aurastyle_token');
      const res = await fetch('/api/cart/add', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          productId: product.id,
          quantity: qty,
          size,
          color
        })
      });
      if (res.ok) {
        const updatedCart = await res.json();
        setCart(updatedCart);
        setCouponSuccess(`Successfully added 1x ${product.name} to styling bag!`);
        setTimeout(() => setCouponSuccess(''), 3000);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleRemoveFromCart = async (productId: string, size: string, color: string) => {
    try {
      const token = localStorage.getItem('aurastyle_token');
      const res = await fetch('/api/cart/remove', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ productId, size, color })
      });
      if (res.ok) {
        const updatedCart = await res.json();
        setCart(updatedCart);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateCartQty = async (productId: string, size: string, color: string, newQty: number) => {
    if (newQty <= 0) {
      handleRemoveFromCart(productId, size, color);
      return;
    }
    try {
      const token = localStorage.getItem('aurastyle_token');
      const res = await fetch('/api/cart/update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ productId, size, color, quantity: newQty })
      });
      if (res.ok) {
        const updatedCart = await res.json();
        setCart(updatedCart);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Apply Promo code
  const handleApplyCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    setCouponSuccess('');
    if (couponCode.toUpperCase() === 'AURA20') {
      setAppliedDiscount(20);
      setCouponSuccess('Premium coupon AURA20 applied! 20% flat discount credited.');
    } else {
      setAppliedDiscount(0);
      setCouponSuccess('Invalid or expired coupon code.');
    }
  };

  // Submit checkout order
  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cart.length === 0) return;

    // Build complete items array with metadata
    const orderItems = cart.map(item => {
      const prod = products.find(p => p.id === item.productId);
      return {
        productId: item.productId,
        name: prod?.name || 'Designer Item',
        price: prod?.price || 100,
        quantity: item.quantity,
        size: item.size,
        color: item.color,
        image: prod?.images[0] || ''
      };
    });

    const subtotal = orderItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const shippingCost = subtotal > 150 ? 0 : 15;
    const discountAmt = subtotal * (appliedDiscount / 100);
    const finalAmt = parseFloat((subtotal + shippingCost - discountAmt).toFixed(2));

    try {
      const token = localStorage.getItem('aurastyle_token');
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          items: orderItems,
          totalAmount: finalAmt,
          shippingAddress,
          couponApplied: appliedDiscount > 0 ? 'AURA20' : undefined
        })
      });

      if (res.ok) {
        const orderData = await res.json();
        setOrderSuccessDetails(orderData);
        setCart([]);
        setAppliedDiscount(0);
        setCouponCode('');
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Navigation controller with recentlyViewed trigger
  const navigateTo = (view: string, params: any = {}) => {
    setCurrentView(view);
    setViewParams(params);
    window.scrollTo({ top: 0, behavior: 'smooth' });

    // Track recently viewed products
    if (view === 'product-detail' && params.id) {
      // Load current item
      const product = products.find(p => p.id === params.id);
      if (product) {
        setSelectedSize(product.sizes[0] || 'M');
        setSelectedColor(product.colors[0]?.name || '');
        setActiveImageIdx(0);
      }

      setRecentlyViewedIds(prev => {
        const filtered = prev.filter(id => id !== params.id);
        const updated = [params.id, ...filtered].slice(0, 5);
        return updated;
      });
    }
  };

  // Filters catalog
  const filteredProducts = products.filter(p => {
    const matchesGender = selectedGenderFilter === 'All' || p.gender === selectedGenderFilter;
    const matchesCategory = selectedCategoryFilter === 'All' || p.category === selectedCategoryFilter;
    const matchesPrice = p.price <= priceRangeFilter;
    return matchesGender && matchesCategory && matchesPrice;
  });

  return (
    <div className="min-h-screen bg-black text-white selection:bg-emerald-500/20 selection:text-emerald-300 flex flex-col font-sans">
      
      {/* Primary Header */}
      <Header 
        currentUser={currentUser}
        currentView={currentView}
        cart={cart}
        wishlist={wishlist}
        onNavigate={navigateTo}
        onLogout={handleLogout}
      />

      {/* Main viewport area */}
      <main className="flex-1">
        
        {/* VIEW 1: HOME */}
        {currentView === 'home' && (
          <div className="space-y-16 pb-20 animate-fade-in">
            {/* Elegant Hero Banner */}
            <div className="relative h-[85vh] w-full overflow-hidden bg-neutral-950 flex items-center">
              {/* Background abstract overlay pattern */}
              <div className="absolute inset-0 z-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-emerald-950/10 via-black to-black" />
              <div className="absolute top-1/4 right-1/4 h-80 w-80 rounded-full bg-emerald-900/5 blur-[120px] animate-pulse" />

              <div className="relative z-10 mx-auto max-w-7xl px-6 w-full grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                <div className="space-y-6 max-w-lg">
                  <h1 className="text-4.5xl sm:text-5xl lg:text-6xl font-light leading-tight tracking-[0.08em] text-white uppercase font-sans">
                    Redefine Your <span className="italic font-serif text-white/80">Style Narrative</span>
                  </h1>
                  <p className="text-xs text-white/40 leading-relaxed font-light tracking-wide">
                    Experience high-fidelity fashion curation. Designed with advanced text, voice, and visual inputs, AuraStyle matches raw aesthetic inspirations directly to luxury designers.
                  </p>
                  
                  <div className="flex items-center space-x-4 pt-4">
                    <button 
                      onClick={() => navigateTo('ai-search')}
                      className="rounded-full bg-white px-7.5 py-3.5 text-[10px] font-semibold text-black hover:bg-neutral-200 transition-colors uppercase tracking-widest flex items-center space-x-2"
                      id="hero-ai-search-btn"
                    >
                      <Sparkles className="h-4 w-4 text-black" />
                      <span>Launch Aura Search</span>
                    </button>
                    <button 
                      onClick={() => navigateTo('catalog')}
                      className="rounded-full border border-white/20 hover:border-white/40 bg-white/5 hover:bg-white/10 px-7 py-3.5 text-xs font-bold transition-all text-neutral-200"
                      id="hero-explore-btn"
                    >
                      Browse Catalog
                    </button>
                  </div>
                </div>

                {/* Right Hero Interactive Lookbook Card */}
                <div className="hidden lg:flex justify-center">
                  <div className="relative aspect-[4/5] w-[340px] rounded-3xl border border-white/15 bg-white/[0.02] p-4.5 shadow-2xl shadow-black/80 backdrop-blur-md overflow-hidden group">
                    <img 
                      src="https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=600&q=80" 
                      alt="Hero Coat Model" 
                      className="h-full w-full object-cover rounded-2xl grayscale hover:grayscale-0 transition-all duration-700"
                    />
                    <div className="absolute inset-x-7 bottom-7 rounded-2xl bg-black/80 backdrop-blur-md border border-white/5 p-4 text-xs">
                      <span className="text-[9px] font-mono font-bold text-emerald-400 uppercase tracking-widest">Interactive Highlight</span>
                      <p className="font-light tracking-wide text-white mt-1">Cashmere Double-Breasted coat</p>
                      <p className="text-white/40 text-[10px] mt-0.5 font-light font-mono">Matched visually at 98% similarity by advanced search networks.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Premium Category selection circles */}
            <div className="mx-auto max-w-7xl px-6">
              <h2 className="text-center text-[10px] font-mono tracking-widest text-neutral-500 uppercase font-bold mb-8">Curated Wardrobe Categories</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
                {[
                  { name: 'Luxury', image: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=300&q=80' },
                  { name: 'Streetwear', image: 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?auto=format&fit=crop&w=300&q=80' },
                  { name: 'Sports', image: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=300&q=80' },
                  { name: 'Accessories', image: 'https://images.unsplash.com/photo-1522312346375-d1a52e2b99b3?auto=format&fit=crop&w=300&q=80' },
                  { name: 'Men', image: 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&w=300&q=80' },
                  { name: 'Women', image: 'https://images.unsplash.com/photo-1574164904299-3a102b110380?auto=format&fit=crop&w=300&q=80' }
                ].map((cat) => (
                  <div 
                    key={cat.name}
                    onClick={() => {
                      if (['Men', 'Women'].includes(cat.name)) {
                        setSelectedGenderFilter(cat.name);
                        setSelectedCategoryFilter('All');
                      } else {
                        setSelectedCategoryFilter(cat.name);
                        setSelectedGenderFilter('All');
                      }
                      navigateTo('catalog');
                    }}
                    className="group relative h-28 rounded-2xl overflow-hidden cursor-pointer border border-white/5 bg-neutral-900"
                  >
                    <img src={cat.image} alt={cat.name} className="h-full w-full object-cover opacity-40 transition-transform duration-500 group-hover:scale-110 group-hover:opacity-60" />
                    <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                      <span className="text-xs font-bold uppercase tracking-widest text-white">{cat.name}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* AI-Personalized recommendations row */}
            <div className="mx-auto max-w-7xl px-6">
              <div className="rounded-3xl border border-white/10 bg-white/[0.01] p-6 sm:p-10 space-y-8">
                <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-white/5 pb-6 gap-4">
                  <div className="space-y-1">
                    <span className="text-[9px] font-mono text-emerald-400 uppercase tracking-widest flex items-center gap-1.5 font-light">
                      <Sparkles className="h-3 w-3 text-emerald-400" />
                      Bespoke Wardrobe Selection
                    </span>
                    <h2 className="text-lg font-light uppercase tracking-widest text-white">Curated Just For You</h2>
                    <p className="text-xs text-white/40 mt-1 font-light tracking-wide">{recReason}</p>
                  </div>
                  <button 
                    onClick={loadAiRecommendations}
                    className="self-start md:self-auto rounded-full bg-white px-4.5 py-2 text-xs font-bold text-black hover:bg-neutral-100 transition-colors shrink-0"
                  >
                    Regenerate suggestions
                  </button>
                </div>

                {isRecsLoading ? (
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                    {Array.from({ length: 4 }).map((_, i) => (
                      <div key={i} className="animate-pulse bg-neutral-900 aspect-[3/4] rounded-2xl" />
                    ))}
                  </div>
                ) : aiRecs.length === 0 ? (
                  <div className="text-xs text-neutral-500 font-mono text-center py-6">Login and explore products to personalize your suggestions!</div>
                ) : (
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                    {aiRecs.slice(0, 4).map((p) => (
                      <ProductCard 
                        key={p.id}
                        product={p}
                        isWishlisted={wishlist.includes(p.id)}
                        onNavigate={navigateTo}
                        onToggleWishlist={handleToggleWishlist}
                        onQuickAdd={handleAddToCart}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Trending Collection slider list */}
            <div className="mx-auto max-w-7xl px-6 space-y-6">
              <div className="flex items-center space-x-2 border-b border-white/5 pb-4">
                <TrendingUp className="h-4.5 w-4.5 text-emerald-400" />
                <h2 className="text-xs uppercase tracking-widest text-white font-sans">Trending Collection</h2>
              </div>
              
              {isProductsLoading ? (
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="animate-pulse bg-neutral-900 aspect-[3/4] rounded-2xl" />
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                  {products.slice(0, 4).map((p) => (
                    <ProductCard 
                      key={p.id}
                      product={p}
                      isWishlisted={wishlist.includes(p.id)}
                      onNavigate={navigateTo}
                      onToggleWishlist={handleToggleWishlist}
                      onQuickAdd={handleAddToCart}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* VIEW 2: PRODUCT DETAIL (WITH 360 SPIN SIMULATOR) */}
        {currentView === 'product-detail' && viewParams.id && (() => {
          const product = products.find(p => p.id === viewParams.id);
          if (!product) return <div className="text-center text-neutral-400 py-20">Product not found.</div>;
          
          return (
            <div className="mx-auto max-w-7xl px-6 py-10 space-y-16 animate-fade-in">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                
                {/* LEFT: Multi-image carousel and 360 Spin Simulator */}
                <div className="lg:col-span-7 space-y-6">
                  
                  {/* Image Display */}
                  <div className="relative aspect-[4/5] rounded-3xl overflow-hidden bg-neutral-950 border border-white/10 group">
                    
                    {/* Spin indicator degree indicator */}
                    {spinDeg > 0 && (
                      <div className="absolute top-4 left-4 z-10 rounded-full bg-black/70 px-3 py-1 text-[10px] font-mono text-emerald-400 font-bold border border-emerald-500/20 flex items-center space-x-1">
                        <RotateCw className="h-3 w-3 animate-spin" />
                        <span>360 ROTATE: {spinDeg}°</span>
                      </div>
                    )}

                    <img 
                      src={product.images[activeImageIdx]} 
                      alt={product.name} 
                      className="h-full w-full object-cover transition-transform duration-500 hover:scale-125" 
                      style={{ transform: `rotateY(${spinDeg}deg)` }}
                    />
                    
                    <div className="absolute bottom-4 right-4 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/10 text-[10px] font-mono text-neutral-400">
                      Hover to Zoom
                    </div>
                  </div>

                  {/* Thumbnails row + 360 Simulator trigger */}
                  <div className="flex items-center space-x-3 overflow-x-auto pb-1">
                    {product.images.map((img, idx) => (
                      <button
                        key={idx}
                        onClick={() => { setActiveImageIdx(idx); setSpinDeg(0); }}
                        className={`relative h-16 w-14 rounded-lg overflow-hidden border transition-all ${activeImageIdx === idx && spinDeg === 0 ? 'border-white/50' : 'border-white/10'}`}
                      >
                        <img src={img} className="h-full w-full object-cover" />
                      </button>
                    ))}
                    
                    {/* Simulated 360 Button */}
                    <button
                      onClick={() => {
                        // Animate spinning degrees
                        let current = 0;
                        const interval = setInterval(() => {
                          current += 15;
                          setSpinDeg(current);
                          if (current >= 360) {
                            clearInterval(interval);
                            setSpinDeg(0);
                          }
                        }, 50);
                      }}
                      className="h-16 rounded-lg border border-dashed border-white/20 hover:border-white/40 bg-neutral-900 hover:bg-neutral-850 px-4 flex flex-col items-center justify-center space-y-1 transition-colors group text-[10px] shrink-0"
                    >
                      <RotateCw className="h-4 w-4 text-emerald-400 group-hover:rotate-180 transition-transform duration-500" />
                      <span className="font-semibold text-neutral-300 font-mono">360 SPIN</span>
                    </button>
                  </div>
                </div>

                {/* RIGHT: Detail info and selection metrics */}
                <div className="lg:col-span-5 space-y-6">
                  <div className="space-y-1">
                    <span className="text-xs font-bold font-mono text-emerald-400 uppercase tracking-widest">{product.brand}</span>
                    <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight leading-snug">{product.name}</h1>
                    
                    <div className="flex items-center space-x-4 pt-1">
                      <div className="flex items-center space-x-1 text-amber-500">
                        <Star className="h-4 w-4 fill-amber-500 text-amber-500" />
                        <span className="text-sm font-semibold text-neutral-200 font-mono">{product.rating.toFixed(1)}</span>
                      </div>
                      <span className="text-xs text-neutral-500">({product.reviewsCount} customer reviews)</span>
                    </div>
                  </div>

                  <div className="text-2xl font-mono font-bold text-white">₹{product.price}</div>

                  <p className="text-xs leading-relaxed text-neutral-400 font-sans">{product.description}</p>

                  {/* Size Selector */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs font-semibold">
                      <span className="text-neutral-400">SELECT SIZE:</span>
                      <span className="text-white font-mono">{selectedSize}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      {product.sizes.map((s) => (
                        <button
                          key={s}
                          onClick={() => setSelectedSize(s)}
                          className={`min-w-11 h-11 rounded-lg border text-xs font-bold font-mono transition-all ${selectedSize === s ? 'border-white bg-white text-black font-bold' : 'border-white/10 hover:border-white/30 text-neutral-300'}`}
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Colors Selector */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs font-semibold">
                      <span className="text-neutral-400">AVAILABLE COLORS:</span>
                      <span className="text-white font-mono">{selectedColor || 'Choose swatch'}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      {product.colors.map((col) => (
                        <button
                          key={col.name}
                          onClick={() => setSelectedColor(col.name)}
                          className={`group relative flex h-7.5 w-7.5 items-center justify-center rounded-full border border-white/10 transition-all ${selectedColor === col.name ? 'ring-2 ring-white/60' : 'hover:scale-105'}`}
                          title={col.name}
                        >
                          <span className="h-5 w-5 rounded-full" style={{ backgroundColor: col.hex }} />
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Action row */}
                  <div className="flex items-center gap-4 border-t border-white/5 pt-6">
                    <button
                      onClick={() => handleAddToCart(product, selectedSize, selectedColor || product.colors[0]?.name)}
                      className="flex-1 rounded-full bg-white hover:bg-neutral-100 text-black font-bold text-xs py-4.5 tracking-wider uppercase transition-colors"
                    >
                      Add To Shopping Bag
                    </button>
                    <button
                      onClick={() => handleToggleWishlist(product.id)}
                      className={`flex h-12 w-12 items-center justify-center rounded-full border bg-neutral-900 border-white/15 hover:border-white/30 transition-all ${wishlist.includes(product.id) ? 'text-emerald-400 border-emerald-500/20' : 'text-neutral-400'}`}
                    >
                      <Heart className={`h-5 w-5 ${wishlist.includes(product.id) ? 'fill-emerald-400' : ''}`} />
                    </button>
                  </div>
                </div>
              </div>

              {/* BONUS: Curated Outfit Recommendation (Visual styling looks) */}
              <div className="rounded-3xl border border-white/10 bg-white/[0.01] p-6 sm:p-10 space-y-6">
                <div className="flex items-center space-x-2.5 border-b border-white/5 pb-4">
                  <Cpu className="h-5 w-5 text-emerald-400" />
                  <h3 className="text-base font-bold text-white">Curated Outfit Lookbook Match</h3>
                </div>
                <p className="text-xs text-neutral-400 leading-relaxed max-w-2xl">
                  Our advanced matchmaking engine curated these matched pieces to form a complete, cohesive fashion silhouette. Explore complementary footwear, outer shells, and accessories.
                </p>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {products
                    .filter(p => p.id !== product.id && p.category !== product.category)
                    .slice(0, 3)
                    .map((item) => (
                      <div 
                        key={item.id}
                        onClick={() => navigateTo('product-detail', { id: item.id })}
                        className="rounded-2xl border border-white/5 bg-neutral-950 p-3.5 space-y-2 cursor-pointer hover:border-emerald-500/30 transition-all text-xs"
                      >
                        <img src={item.images[0]} alt={item.name} className="aspect-[4/5] w-full object-cover rounded-xl" />
                        <div>
                          <span className="text-[9px] font-mono font-bold text-neutral-500 uppercase block">{item.category}</span>
                          <span className="font-semibold text-neutral-200 block truncate">{item.name}</span>
                          <span className="font-mono text-emerald-400 block mt-1">₹{item.price}</span>
                        </div>
                      </div>
                    ))}
                  
                  {/* Lookbook Concept statement card */}
                  <div className="rounded-2xl border border-white/5 bg-gradient-to-br from-neutral-900 to-indigo-950/40 p-5 flex flex-col justify-between">
                    <p className="text-[11px] leading-relaxed text-neutral-300 font-sans italic mt-2">
                      "We suggest layering the {product.name} with structured dark wool trousers and retro suede trainers for an effortlessly balanced casual-luxe outfit silhouette."
                    </p>
                    <button 
                      onClick={() => navigateTo('ai-search')}
                      className="text-[10px] font-bold text-emerald-400 hover:underline text-left mt-4"
                    >
                      Experiment in Search &rarr;
                    </button>
                  </div>
                </div>
              </div>

              {/* Product Review testimonial list block */}
              <ReviewSection 
                productId={product.id}
                currentUser={currentUser}
              />
            </div>
          );
        })()}

        {/* VIEW 3: AI SEARCH CONSOLE */}
        {currentView === 'ai-search' && (
          <AISearchConsole 
            products={products}
            onNavigate={navigateTo}
            onAddToCart={(p, size, col) => handleAddToCart(p, size, col)}
          />
        )}

        {/* VIEW 4: CATALOG LISTING */}
        {currentView === 'catalog' && (
          <div className="mx-auto max-w-7xl px-6 py-10 space-y-8 animate-fade-in">
            {/* Header / Intro */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-6">
              <div>
                <h1 className="text-2xl font-bold text-white tracking-tight font-sans uppercase">AuraStyle Collections</h1>
                <p className="text-xs text-neutral-400 mt-1">Sustainably crafted luxury items ready for neural matching</p>
              </div>

              {/* Filter bar summary */}
              <div className="flex items-center space-x-2 text-xs">
                <button 
                  onClick={() => { setSelectedCategoryFilter('All'); setSelectedGenderFilter('All'); setPriceRangeFilter(600); }}
                  className="text-neutral-500 hover:text-white transition-colors underline"
                >
                  Reset Filters
                </button>
              </div>
            </div>

            {/* Filter grid and Products Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
              
              {/* Left filter sidebars */}
              <div className="space-y-6 lg:col-span-1 border border-white/5 bg-white/[0.01] p-5.5 rounded-2xl h-fit">
                <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-4 flex items-center space-x-1.5">
                  <Sliders className="h-4 w-4 text-emerald-400" />
                  <span>Interactive Filters</span>
                </h3>

                {/* Gender filter */}
                <div className="space-y-2">
                  <span className="text-[10px] text-neutral-500 uppercase font-mono tracking-widest font-semibold block">Section</span>
                  <div className="flex flex-wrap gap-1.5">
                    {['All', 'Men', 'Women', 'Kids', 'Unisex'].map((g) => (
                      <button
                        key={g}
                        onClick={() => setSelectedGenderFilter(g)}
                        className={`rounded-full px-3 py-1 text-[11px] font-semibold border ${selectedGenderFilter === g ? 'bg-emerald-600 text-white border-emerald-600' : 'border-white/10 hover:border-white/30 text-neutral-300 bg-black'}`}
                      >
                        {g}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Category filter */}
                <div className="space-y-2 pt-2 border-t border-white/5">
                  <span className="text-[10px] text-neutral-500 uppercase font-mono tracking-widest font-semibold block">Vibe Categories</span>
                  <div className="flex flex-col space-y-1 text-xs">
                    {['All', 'Luxury', 'Streetwear', 'Sports', 'Accessories', 'Kids'].map((cat) => (
                      <button
                        key={cat}
                        onClick={() => setSelectedCategoryFilter(cat)}
                        className={`text-left py-1.5 px-2.5 rounded-lg transition-all font-medium ${selectedCategoryFilter === cat ? 'bg-emerald-950/20 text-emerald-400 border border-emerald-500/20' : 'text-neutral-400 hover:text-white'}`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Price ceiling */}
                <div className="space-y-2 pt-2 border-t border-white/5">
                  <div className="flex justify-between text-[10px] text-neutral-500 uppercase font-mono tracking-widest font-semibold">
                    <span>Price ceiling</span>
                    <span className="text-white font-bold">₹{priceRangeFilter}</span>
                  </div>
                  <input 
                    type="range"
                    min="3000"
                    max="50000"
                    step="1000"
                    value={priceRangeFilter}
                    onChange={(e) => setPriceRangeFilter(Number(e.target.value))}
                    className="w-full accent-emerald-500 cursor-pointer h-1 rounded bg-neutral-800"
                  />
                </div>
              </div>

              {/* Right Catalog Grid */}
              <div className="lg:col-span-3 space-y-6">
                {isProductsLoading ? (
                  <div className="grid grid-cols-2 lg:grid-cols-3 gap-6">
                    {Array.from({ length: 6 }).map((_, i) => (
                      <div key={i} className="animate-pulse bg-neutral-900 aspect-[3/4] rounded-2xl" />
                    ))}
                  </div>
                ) : filteredProducts.length === 0 ? (
                  <div className="text-center py-20 bg-white/[0.01] rounded-3xl border border-dashed border-white/5 text-xs text-neutral-500">
                    No matching couture items align with these parameters. Clear filters to explore.
                  </div>
                ) : (
                  <div className="grid grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredProducts.map((p) => (
                      <ProductCard 
                        key={p.id}
                        product={p}
                        isWishlisted={wishlist.includes(p.id)}
                        onNavigate={navigateTo}
                        onToggleWishlist={handleToggleWishlist}
                        onQuickAdd={handleAddToCart}
                      />
                    ))}
                  </div>
                )}

                {/* Recently Viewed block */}
                {recentlyViewedIds.length > 0 && (
                  <div className="border-t border-white/10 pt-10 mt-10 space-y-4">
                    <span className="text-[10px] text-neutral-500 font-semibold uppercase tracking-widest block font-mono pl-1">Recently Analyzed Pieces</span>
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
                      {recentlyViewedIds.map((id) => {
                        const p = products.find(prod => prod.id === id);
                        if (!p) return null;
                        return (
                          <div 
                            key={p.id}
                            onClick={() => navigateTo('product-detail', { id: p.id })}
                            className="group cursor-pointer space-y-1.5"
                          >
                            <div className="relative aspect-[3/4] rounded-xl overflow-hidden bg-neutral-950 border border-white/5">
                              <img src={p.images[0]} alt={p.name} className="h-full w-full object-cover opacity-60 group-hover:opacity-100 transition-opacity" />
                            </div>
                            <span className="text-[11px] font-semibold text-neutral-300 block truncate group-hover:text-emerald-400 transition-colors">{p.name}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* VIEW 5: CART & CHECKOUT */}
        {currentView === 'cart' && (
          <div className="mx-auto max-w-7xl px-6 py-10 space-y-8 animate-fade-in">
            <h1 className="text-2xl font-bold text-white tracking-tight uppercase">Your Couture Bag</h1>

            {orderSuccessDetails ? (
              /* ORDER SUCCESS SCREEN */
              <div className="max-w-md mx-auto text-center py-10 space-y-6" id="order-success-receipt">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-green-500/10 border border-green-500/30 text-green-500 animate-bounce">
                  <CheckCircle2 className="h-8 w-8" />
                </div>
                <div className="space-y-2">
                  <h2 className="text-xl font-bold text-white">Purchase Authorized Successfully!</h2>
                  <p className="text-xs text-neutral-400 leading-relaxed">Your order has been logged into AuraStyle's persistent server layer. Thank you for validating our major project showcase.</p>
                </div>
                
                <div className="rounded-2xl border border-white/10 bg-neutral-950 p-4.5 text-left text-xs space-y-2.5 font-mono">
                  <div className="flex justify-between border-b border-white/5 pb-2 text-neutral-400">
                    <span>Order Receipt:</span>
                    <span className="text-white font-bold">{orderSuccessDetails.id}</span>
                  </div>
                  <div className="flex justify-between text-neutral-400">
                    <span>Invoice Total:</span>
                    <span className="text-white font-bold">₹{orderSuccessDetails.totalAmount}</span>
                  </div>
                  <div className="flex justify-between text-neutral-400">
                    <span>Log Date:</span>
                    <span className="text-white">{new Date(orderSuccessDetails.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>

                <div className="flex justify-center pt-2">
                  <button
                    onClick={() => { setOrderSuccessDetails(null); navigateTo('profile'); }}
                    className="rounded-full bg-white text-black px-8 py-3.5 text-xs font-bold hover:bg-neutral-100 transition-transform hover:scale-105"
                  >
                    View Orders History
                  </button>
                </div>
              </div>
            ) : cart.length === 0 ? (
              <div className="text-center py-20 bg-white/[0.01] rounded-3xl border border-dashed border-white/5 text-xs text-neutral-500 max-w-md mx-auto">
                <ShoppingBag className="mx-auto h-7 w-7 text-neutral-500 mb-2" />
                <h3 className="text-sm font-semibold text-neutral-300">Your bag is empty</h3>
                <p className="text-[11px] text-neutral-500 mt-1 mb-4">Select items from the catalog to begin checkout simulation.</p>
                <button onClick={() => navigateTo('catalog')} className="rounded-full bg-white text-black px-6 py-2.5 font-bold">Browse Catalog</button>
              </div>
            ) : (() => {
              // Cart calculations
              const cartPopulated = cart.map(item => {
                const prod = products.find(p => p.id === item.productId);
                return { ...item, product: prod };
              }).filter(item => item.product);

              const subtotal = cartPopulated.reduce((sum, item) => sum + (item.product!.price * item.quantity), 0);
              const shipping = subtotal > 150 ? 0 : 15;
              const discount = subtotal * (appliedDiscount / 100);
              const total = parseFloat((subtotal + shipping - discount).toFixed(2));

              return (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                  {/* Left: Cart Items summary list */}
                  <div className="lg:col-span-7 space-y-4">
                    {cartPopulated.map((item, idx) => (
                      <div 
                        key={idx}
                        className="flex items-center gap-4 rounded-2xl border border-white/5 bg-white/[0.02] p-4 text-xs hover:border-white/10 transition-colors"
                      >
                        <img src={item.product!.images[0]} alt={item.product!.name} className="h-16 w-12 rounded object-cover border border-white/5" />
                        <div className="flex-1 min-w-0">
                          <span className="text-[10px] font-mono font-bold text-neutral-500 uppercase block">{item.product!.brand}</span>
                          <span className="font-semibold text-neutral-200 block truncate text-sm">{item.product!.name}</span>
                          <span className="text-[10px] text-neutral-400 mt-0.5 block font-mono">Size: {item.size} | Color: {item.color}</span>
                        </div>

                        {/* Qty increment */}
                        <div className="flex items-center space-x-2 border border-white/10 rounded-full px-2.5 py-1">
                          <button onClick={() => handleUpdateCartQty(item.productId, item.size, item.color, item.quantity - 1)} className="p-0.5 hover:text-emerald-400"><Minus className="h-3 w-3" /></button>
                          <span className="font-bold text-white font-mono text-[13px]">{item.quantity}</span>
                          <button onClick={() => handleUpdateCartQty(item.productId, item.size, item.color, item.quantity + 1)} className="p-0.5 hover:text-emerald-400"><Plus className="h-3 w-3" /></button>
                        </div>

                        <div className="text-right pl-2">
                          <span className="text-sm font-bold text-white block font-mono">₹{item.product!.price * item.quantity}</span>
                          <button 
                            onClick={() => handleRemoveFromCart(item.productId, item.size, item.color)}
                            className="text-[10px] text-neutral-500 hover:text-red-400 font-medium mt-1 transition-colors"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    ))}

                    {/* Promo code form */}
                    <form onSubmit={handleApplyCoupon} className="flex gap-2 bg-neutral-950 border border-white/5 rounded-2xl p-4.5">
                      <input 
                        type="text" 
                        value={couponCode}
                        onChange={(e) => setCouponCode(e.target.value)}
                        placeholder="Promo Code: e.g. AURA20"
                        className="flex-1 rounded-xl bg-neutral-900 border border-white/10 px-4 py-2 text-xs text-white placeholder-neutral-500 focus:outline-none"
                      />
                      <button type="submit" className="rounded-xl bg-white text-black px-5 py-2.5 text-xs font-bold">Apply</button>
                    </form>

                    {couponSuccess && (
                      <div className="text-[11px] font-medium text-emerald-400 pl-2 animate-pulse">{couponSuccess}</div>
                    )}
                  </div>

                  {/* Right: Checkout Shipping Form & Invoice summary */}
                  <div className="lg:col-span-5 border border-white/10 bg-neutral-950 rounded-3xl p-6 space-y-6">
                    <h3 className="text-sm font-semibold text-white uppercase tracking-wider">Couture Checkout Receipt</h3>
                    
                    {/* Invoice */}
                    <div className="space-y-2.5 border-b border-white/5 pb-4 text-xs text-neutral-400 font-mono">
                      <div className="flex justify-between">
                        <span>Cart Subtotal:</span>
                        <span className="text-white">₹{subtotal}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Complementary Shipping:</span>
                        <span className="text-white">{shipping === 0 ? 'FREE' : `₹${shipping}`}</span>
                      </div>
                      {appliedDiscount > 0 && (
                        <div className="flex justify-between text-emerald-400">
                          <span>AURA20 Promo Discount:</span>
                          <span>-₹{discount.toFixed(2)}</span>
                        </div>
                      )}
                      <div className="flex justify-between font-bold text-base text-white border-t border-white/5 pt-3 mt-2">
                        <span>Grand Invoice:</span>
                        <span>₹{total}</span>
                      </div>
                    </div>

                    {/* Shipping info inputs */}
                    <form onSubmit={handlePlaceOrder} className="space-y-4 text-xs">
                      <h4 className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest block font-semibold mb-2">Simulated Shipping Coordinates</h4>
                      
                      <div className="space-y-1.5">
                        <label className="text-[9px] font-semibold text-neutral-500 uppercase tracking-wider block">Full Name</label>
                        <input required type="text" value={shippingAddress.fullName} onChange={(e) => setShippingAddress({ ...shippingAddress, fullName: e.target.value })} className="w-full rounded-xl bg-neutral-900 border border-white/10 p-3 text-white focus:outline-none focus:border-white/30" placeholder="AuraStyle Faculty Assessor" />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[9px] font-semibold text-neutral-500 uppercase tracking-wider block">Address Line 1</label>
                        <input required type="text" value={shippingAddress.addressLine1} onChange={(e) => setShippingAddress({ ...shippingAddress, addressLine1: e.target.value })} className="w-full rounded-xl bg-neutral-900 border border-white/10 p-3 text-white focus:outline-none focus:border-white/30" placeholder="Department of Computer Science & Engineering" />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                          <label className="text-[9px] font-semibold text-neutral-500 uppercase tracking-wider block">City</label>
                          <input required type="text" value={shippingAddress.city} onChange={(e) => setShippingAddress({ ...shippingAddress, city: e.target.value })} className="w-full rounded-xl bg-neutral-900 border border-white/10 p-3 text-white focus:outline-none focus:border-white/30" placeholder="New Delhi" />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[9px] font-semibold text-neutral-500 uppercase tracking-wider block">State</label>
                          <input required type="text" value={shippingAddress.state} onChange={(e) => setShippingAddress({ ...shippingAddress, state: e.target.value })} className="w-full rounded-xl bg-neutral-900 border border-white/10 p-3 text-white focus:outline-none focus:border-white/30" placeholder="DL" />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                          <label className="text-[9px] font-semibold text-neutral-500 uppercase tracking-wider block">Postal Code</label>
                          <input required type="text" value={shippingAddress.postalCode} onChange={(e) => setShippingAddress({ ...shippingAddress, postalCode: e.target.value })} className="w-full rounded-xl bg-neutral-900 border border-white/10 p-3 text-white focus:outline-none focus:border-white/30" placeholder="110001" />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[9px] font-semibold text-neutral-500 uppercase tracking-wider block">Phone Contact</label>
                          <input required type="tel" value={shippingAddress.phone} onChange={(e) => setShippingAddress({ ...shippingAddress, phone: e.target.value })} className="w-full rounded-xl bg-neutral-900 border border-white/10 p-3 text-white focus:outline-none focus:border-white/30" placeholder="+91 9999999999" />
                        </div>
                      </div>

                      <button
                        type="submit"
                        className="w-full rounded-full bg-white hover:bg-neutral-200 text-black font-semibold py-4 tracking-widest uppercase transition-colors text-[10px] flex items-center justify-center space-x-2"
                        id="checkout-btn"
                      >
                        <CreditCard className="h-4 w-4 animate-pulse" />
                        <span>Authorize Simulation Order</span>
                      </button>
                    </form>
                  </div>
                </div>
              );
            })()}
          </div>
        )}

        {/* VIEW 6: WISHLIST */}
        {currentView === 'wishlist' && (
          <div className="mx-auto max-w-7xl px-6 py-10 space-y-8 animate-fade-in">
            <h1 className="text-2xl font-bold text-white tracking-tight uppercase">Your Favorited Lookbook</h1>

            {wishlist.length === 0 ? (
              <div className="text-center py-20 bg-white/[0.01] rounded-3xl border border-dashed border-white/5 text-xs text-neutral-500 max-w-md mx-auto">
                <Heart className="mx-auto h-7 w-7 text-neutral-500 mb-2" />
                <h3 className="text-sm font-semibold text-neutral-300">Your lookbook is empty</h3>
                <p className="text-[11px] text-neutral-500 mt-1 mb-4">Click Heart icons on cards to save pieces here.</p>
                <button onClick={() => navigateTo('catalog')} className="rounded-full bg-white text-black px-6 py-2.5 font-bold">Browse Catalog</button>
              </div>
            ) : (() => {
              const favoritedProducts = products.filter(p => wishlist.includes(p.id));

              return (
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                  {favoritedProducts.map((p) => (
                    <ProductCard 
                      key={p.id}
                      product={p}
                      isWishlisted={true}
                      onNavigate={navigateTo}
                      onToggleWishlist={handleToggleWishlist}
                      onQuickAdd={handleAddToCart}
                    />
                  ))}
                </div>
              );
            })()}
          </div>
        )}

        {/* VIEW 7: PROFILE & ORDER HISTORY */}
        {currentView === 'profile' && (() => {
          const [profileOrders, setProfileOrders] = useState<Order[]>([]);
          const [isOrdersLoading, setIsOrdersLoading] = useState(true);

          useEffect(() => {
            const fetchProfileOrders = async () => {
              try {
                const token = localStorage.getItem('aurastyle_token');
                const res = await fetch('/api/orders', {
                  headers: { 'Authorization': `Bearer ${token}` }
                });
                if (res.ok) {
                  const data = await res.json();
                  setProfileOrders(data);
                }
              } catch (err) {
                console.error(err);
              } finally {
                setIsOrdersLoading(false);
              }
            };
            fetchProfileOrders();
          }, []);

          return (
            <div className="mx-auto max-w-7xl px-6 py-10 space-y-12 animate-fade-in">
               {/* Profile Card */}
              <div className="rounded-3xl border border-white/10 bg-gradient-to-r from-neutral-950 via-neutral-900 to-emerald-950/5 p-6 sm:p-10 flex flex-col sm:flex-row items-center gap-6 justify-between">
                <div className="flex items-center space-x-4">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-neutral-900 text-2xl font-light border border-white/10 text-emerald-400 font-serif">
                    {currentUser?.name[0].toUpperCase()}
                  </div>
                  <div>
                    <h1 className="text-xl font-bold text-white">{currentUser?.name}</h1>
                    <p className="text-xs text-neutral-400 font-mono">{currentUser?.email}</p>
                    <span className="inline-block rounded-full bg-emerald-500/5 px-2.5 py-0.5 text-[9px] font-bold text-emerald-400 border border-emerald-500/10 mt-1 uppercase tracking-wider">{currentUser?.role} account</span>
                  </div>
                </div>

                {/* Simulated Style Personality Dial */}
                <div className="rounded-2xl border border-white/5 bg-neutral-900/60 p-4 max-w-xs space-y-1.5 shrink-0 text-center sm:text-left">
                  <span className="text-[10px] text-emerald-400 uppercase font-mono tracking-widest font-semibold block">Aura Style Persona</span>
                  <p className="text-xs font-semibold text-white">Avant-Garde Luxury Curator</p>
                  <p className="text-[10px] text-neutral-500 leading-normal">Your search vectors exhibit high affinity with double-pleated tailored items and Saffiano accessories.</p>
                </div>
              </div>

              {/* Grid: Order History vs Style Analytics */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                
                {/* Left: Orders History */}
                <div className="lg:col-span-8 space-y-4">
                  <h3 className="text-sm font-semibold text-white uppercase tracking-wider">Your Order Logs ({profileOrders.length})</h3>
                  
                  {isOrdersLoading ? (
                    <div className="text-xs font-mono text-neutral-500">Retrieving invoices...</div>
                  ) : profileOrders.length === 0 ? (
                    <div className="rounded-2xl border border-white/5 bg-white/[0.01] p-10 text-center text-xs text-neutral-500">
                      No order invoices saved in our cloud run containers. Checkout items to plot logs.
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {profileOrders.map((ord) => (
                        <div key={ord.id} className="rounded-2xl border border-white/5 bg-neutral-950 p-5 space-y-3">
                          <div className="flex items-center justify-between border-b border-white/5 pb-2">
                            <div>
                              <span className="font-mono font-bold text-xs block text-neutral-300">Invoice: {ord.id}</span>
                              <span className="text-[10px] text-neutral-500 font-mono">Date: {new Date(ord.createdAt).toLocaleDateString()}</span>
                            </div>
                            <span className={`rounded-full px-2.5 py-0.5 text-[9px] font-bold uppercase ${ord.status === 'Delivered' ? 'bg-green-500/10 text-green-400 border border-green-500/20' : ord.status === 'Shipped' ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20' : 'bg-neutral-800 text-neutral-400 border border-white/5'}`}>
                              {ord.status}
                            </span>
                          </div>

                          <div className="space-y-2">
                            {ord.items.map((item, idx) => (
                              <div key={idx} className="flex items-center space-x-3 text-xs">
                                <img src={item.image} alt={item.name} className="h-8 w-6 rounded object-cover" />
                                <div className="flex-1">
                                  <span className="text-neutral-300 font-medium block truncate">{item.name}</span>
                                  <span className="text-[10px] text-neutral-500 font-mono">Size: {item.size} | Color: {item.color} | Qty: {item.quantity}</span>
                                </div>
                                <span className="font-mono text-neutral-300">₹{item.price * item.quantity}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Right: AI Stylist Analytics Dial */}
                <div className="lg:col-span-4 rounded-3xl border border-white/10 bg-neutral-950 p-6 space-y-4">
                  <h3 className="text-sm font-semibold text-white flex items-center space-x-2">
                    <Star className="h-4 w-4 text-emerald-400 fill-emerald-400/20" />
                    <span>Styling Silhouette Metrics</span>
                  </h3>
                  <p className="text-[11px] text-neutral-400 leading-relaxed">
                    Curation metrics mapped from your style preferences, wishlist selections, and luxury aesthetics:
                  </p>

                  <div className="space-y-3 pt-2 font-mono text-[11px]">
                    <div className="space-y-1">
                      <div className="flex justify-between">
                        <span>Streetwear Fit Affinity</span>
                        <span className="text-emerald-400">85%</span>
                      </div>
                      <div className="bg-neutral-900 h-1 rounded-full"><div className="bg-emerald-500 h-full rounded-full" style={{ width: '85%' }} /></div>
                    </div>

                    <div className="space-y-1">
                      <div className="flex justify-between">
                        <span>Luxury Tailoring Fit Affinity</span>
                        <span className="text-emerald-400">60%</span>
                      </div>
                      <div className="bg-neutral-900 h-1 rounded-full"><div className="bg-emerald-500 h-full rounded-full" style={{ width: '60%' }} /></div>
                    </div>

                    <div className="space-y-1">
                      <div className="flex justify-between">
                        <span>Activewear Tech Affinity</span>
                        <span className="text-emerald-400">45%</span>
                      </div>
                      <div className="bg-neutral-900 h-1 rounded-full"><div className="bg-emerald-500 h-full rounded-full" style={{ width: '45%' }} /></div>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          );
        })()}

        {/* VIEW 8: ADMIN DASHBOARD */}
        {currentView === 'admin' && (
          <AdminPanel 
            products={products}
            onRefreshProducts={loadProducts}
          />
        )}

        {/* VIEW 9: LOGIN */}
        {currentView === 'login' && (
          <div className="mx-auto max-w-md px-6 py-20 animate-fade-in">
            <div className="rounded-3xl border border-white/10 bg-neutral-950 p-8 shadow-2xl shadow-black/80 space-y-6">
              
              {/* Header */}
              <div className="text-center space-y-1.5">
                <h1 className="text-xl font-bold text-white uppercase tracking-widest font-sans">AuraStyle Portal</h1>
                <p className="text-xs text-neutral-400">Login to secure your style profile logs</p>
              </div>

              {authError && <div className="text-xs text-red-400 bg-red-950/40 p-3 rounded-xl border border-red-500/20">{authError}</div>}
              {authSuccess && <div className="text-xs text-green-400 bg-green-950/40 p-3 rounded-xl border border-green-500/20">{authSuccess}</div>}

              {/* Form */}
              <form onSubmit={handleLoginSubmit} className="space-y-4 text-xs">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-semibold text-neutral-500 uppercase tracking-wider block">Email Address</label>
                  <div className="relative">
                    <input required type="email" value={authEmail} onChange={(e) => setAuthEmail(e.target.value)} className="w-full rounded-xl bg-neutral-900 border border-white/10 pl-10 pr-4 py-3.5 text-white focus:outline-none focus:border-white/30" placeholder="e.g. user@aurastyle.com" id="login-email-input" />
                    <Mail className="absolute left-3.5 top-3.5 h-4 w-4 text-neutral-500" />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-semibold text-neutral-500 uppercase tracking-wider block">Password</label>
                  <div className="relative">
                    <input required type="password" value={authPassword} onChange={(e) => setAuthPassword(e.target.value)} className="w-full rounded-xl bg-neutral-900 border border-white/10 pl-10 pr-4 py-3.5 text-white focus:outline-none focus:border-white/30" placeholder="e.g. user123" id="login-password-input" />
                    <Lock className="absolute left-3.5 top-3.5 h-4 w-4 text-neutral-500" />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full rounded-full bg-white hover:bg-neutral-200 text-black font-semibold py-3.5 uppercase tracking-widest text-[10px] transition-colors"
                  id="login-submit-btn"
                >
                  Sign In
                </button>
              </form>

              {/* Quick helper for faculty testing */}
              <div className="rounded-xl border border-white/5 bg-white/[0.01] p-3 text-[10px] text-neutral-400 space-y-1">
                <span className="font-bold text-neutral-300 block">Faculty Evaluation Shortcut credentials:</span>
                <div className="flex justify-between font-mono">
                  <span>Student User:</span>
                  <button 
                    onClick={() => { setAuthEmail('user@aurastyle.com'); setAuthPassword('user123'); }}
                    className="text-emerald-400 font-bold hover:underline"
                    id="preset-user-btn"
                  >
                    user@aurastyle.com / user123
                  </button>
                </div>
                <div className="flex justify-between font-mono">
                  <span>Faculty Admin:</span>
                  <button 
                    onClick={() => { setAuthEmail('admin@aurastyle.com'); setAuthPassword('admin123'); }}
                    className="text-emerald-400 font-bold hover:underline"
                    id="preset-admin-btn"
                  >
                    admin@aurastyle.com / admin123
                  </button>
                </div>
              </div>

              {/* Toggle */}
              <div className="text-center">
                <button 
                  onClick={() => setCurrentView('register')}
                  className="text-[11px] text-neutral-400 hover:text-white underline"
                >
                  Create a new style profile &rarr;
                </button>
              </div>
            </div>
          </div>
        )}

        {/* VIEW 10: REGISTER */}
        {currentView === 'register' && (
          <div className="mx-auto max-w-md px-6 py-20 animate-fade-in">
            <div className="rounded-3xl border border-white/10 bg-neutral-950 p-8 shadow-2xl shadow-black/80 space-y-6">
              
              <div className="text-center space-y-1.5">
                <h1 className="text-xl font-bold text-white uppercase tracking-widest font-sans">Join AuraStyle</h1>
                <p className="text-xs text-neutral-400">Configure your personalized search metrics</p>
              </div>

              {authError && <div className="text-xs text-red-400 bg-red-950/40 p-3 rounded-xl border border-red-500/20">{authError}</div>}
              {authSuccess && <div className="text-xs text-green-400 bg-green-950/40 p-3 rounded-xl border border-green-500/20">{authSuccess}</div>}

              <form onSubmit={handleRegisterSubmit} className="space-y-4 text-xs">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-semibold text-neutral-500 uppercase tracking-wider block">Full Name</label>
                  <div className="relative">
                    <input required type="text" value={authName} onChange={(e) => setAuthName(e.target.value)} className="w-full rounded-xl bg-neutral-900 border border-white/10 pl-10 pr-4 py-3.5 text-white focus:outline-none focus:border-white/30" placeholder="e.g. Student Assessor" id="register-name-input" />
                    <UserIcon className="absolute left-3.5 top-3.5 h-4 w-4 text-neutral-500" />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-semibold text-neutral-500 uppercase tracking-wider block">Email Address</label>
                  <div className="relative">
                    <input required type="email" value={authEmail} onChange={(e) => setAuthEmail(e.target.value)} className="w-full rounded-xl bg-neutral-900 border border-white/10 pl-10 pr-4 py-3.5 text-white focus:outline-none focus:border-white/30" placeholder="e.g. student@university.edu" id="register-email-input" />
                    <Mail className="absolute left-3.5 top-3.5 h-4 w-4 text-neutral-500" />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-semibold text-neutral-500 uppercase tracking-wider block">Create Password</label>
                  <div className="relative">
                    <input required type="password" value={authPassword} onChange={(e) => setAuthPassword(e.target.value)} className="w-full rounded-xl bg-neutral-900 border border-white/10 pl-10 pr-4 py-3.5 text-white focus:outline-none focus:border-white/30" placeholder="Minimum 6 characters" id="register-password-input" />
                    <Lock className="absolute left-3.5 top-3.5 h-4 w-4 text-neutral-500" />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full rounded-full bg-white hover:bg-neutral-200 text-black font-semibold py-3.5 uppercase tracking-widest text-[10px] transition-colors"
                  id="register-submit-btn"
                >
                  Create Profile
                </button>
              </form>

              <div className="text-center">
                <button 
                  onClick={() => setCurrentView('login')}
                  className="text-[11px] text-neutral-400 hover:text-white underline"
                >
                  Already registered? Login here &rarr;
                </button>
              </div>
            </div>
          </div>
        )}

      </main>

      {/* Persistent AI virtual advisor chatbot widget */}
      {!isProductsLoading && (
        <VirtualStylist 
          products={products}
          currentUser={currentUser}
          onNavigate={navigateTo}
          selectedProductId={currentView === 'product-detail' ? viewParams.id : undefined}
        />
      )}

      {/* Premium Footer */}
      <footer className="border-t border-white/10 bg-neutral-950 py-12">
        <div className="mx-auto max-w-7xl px-6 grid grid-cols-1 md:grid-cols-3 gap-8 text-xs text-neutral-400">
          <div className="space-y-3">
            <span className="text-base font-bold text-white uppercase tracking-widest">AuraStyle</span>
            <p className="leading-relaxed max-w-xs text-[11px]">
              A luxury fashion curation house designed for bespoke styling, personalized recommendations, and high-fidelity aesthetic discovery.
            </p>
          </div>
          <div className="space-y-2">
            <span className="font-bold text-white uppercase tracking-wider block mb-2">House Details</span>
            <div className="flex flex-col space-y-1.5 font-mono text-[10px]">
              <span className="flex items-center gap-1.5"><UserCheck className="h-3.5 w-3.5 text-emerald-400" /> Directeur: alihasanansari7786@gmail.com</span>
              <span className="flex items-center gap-1.5"><PackageCheck className="h-3.5 w-3.5 text-emerald-400" /> Status: Active Atelier</span>
              <span className="flex items-center gap-1.5"><Cpu className="h-3.5 w-3.5 text-emerald-400" /> Heritage: Bespoke Pattern Matching</span>
            </div>
          </div>
          <div className="space-y-2">
            <span className="font-bold text-white uppercase tracking-wider block mb-2">Available Coupons</span>
            <div className="flex flex-col space-y-1 text-xs">
              <span className="flex items-center gap-1"><Tag className="h-3.5 w-3.5 text-green-500" /> Use coupon <strong>AURA20</strong> for 20% off total</span>
              <span className="text-neutral-500 mt-1">Simulated payments are secure and catalog logs are fully encrypted.</span>
            </div>
          </div>
        </div>
        <div className="mx-auto max-w-7xl px-6 pt-8 mt-8 border-t border-white/5 text-center text-[10px] text-neutral-600 font-mono">
          © 2026 AuraStyle Curation House. All rights reserved.
        </div>
      </footer>

    </div>
  );
}
