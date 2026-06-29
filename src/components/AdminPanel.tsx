import React, { useState, useEffect } from 'react';
import { 
  ShieldAlert, 
  Users, 
  ShoppingBag, 
  IndianRupee, 
  TrendingUp, 
  Plus, 
  Trash2, 
  Edit, 
  FileText,
  Grid,
  CheckCircle,
  Truck,
  RefreshCw,
  X,
  PieChart,
  Camera,
  Cpu
} from 'lucide-react';
import { Product, User, Order } from '../types';

interface AdminPanelProps {
  products: Product[];
  onRefreshProducts: () => Promise<void>;
}

export default function AdminPanel({
  products,
  onRefreshProducts
}: AdminPanelProps) {
  const [activeTab, setActiveTab] = useState<'analytics' | 'products' | 'orders' | 'users'>('analytics');
  
  // Analytics State
  const [analytics, setAnalytics] = useState<any>(null);
  const [isAnalyticsLoading, setIsAnalyticsLoading] = useState(true);

  // Users List
  const [usersList, setUsersList] = useState<any[]>([]);

  // Orders List
  const [ordersList, setOrdersList] = useState<Order[]>([]);

  // Modals / Editors
  const [showProductModal, setShowProductModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // New Product Form state
  const [prodName, setProdName] = useState('');
  const [prodBrand, setProdBrand] = useState('');
  const [prodCategory, setProdCategory] = useState('Luxury');
  const [prodPrice, setProdPrice] = useState(100);
  const [prodDesc, setProdDesc] = useState('');
  const [prodImage, setProdImage] = useState('');
  const [prodSizes, setProdSizes] = useState('S, M, L, XL');
  const [prodColors, setProdColors] = useState('Pitch Black:#111111, Ivory White:#FFFFFF');
  const [prodGender, setProdGender] = useState<'Men' | 'Women' | 'Kids' | 'Unisex'>('Unisex');
  const [prodTags, setProdTags] = useState('casual, custom');

  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');

  // Fetch admin stats
  const fetchAnalytics = async () => {
    setIsAnalyticsLoading(true);
    try {
      const token = localStorage.getItem('aurastyle_token');
      const res = await fetch('/api/admin/analytics', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setAnalytics(data.analytics);
      }
    } catch (err) {
      console.error('Error fetching admin analytics:', err);
    } finally {
      setIsAnalyticsLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('aurastyle_token');
      const res = await fetch('/api/admin/users', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setUsersList(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchOrders = async () => {
    try {
      const token = localStorage.getItem('aurastyle_token');
      const res = await fetch('/api/admin/orders', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setOrdersList(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchAnalytics();
    fetchUsers();
    fetchOrders();
  }, []);

  const handleUpdateOrderStatus = async (orderId: string, status: string) => {
    try {
      const token = localStorage.getItem('aurastyle_token');
      const res = await fetch(`/api/admin/orders/${orderId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status })
      });
      if (res.ok) {
        await fetchOrders();
        await fetchAnalytics();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteProduct = async (productId: string) => {
    if (!window.confirm('Are you absolutely sure you want to delete this product?')) return;
    try {
      const token = localStorage.getItem('aurastyle_token');
      const res = await fetch(`/api/admin/products/${productId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        await onRefreshProducts();
        await fetchAnalytics();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleOpenEdit = (p: Product) => {
    setEditingProduct(p);
    setProdName(p.name);
    setProdBrand(p.brand);
    setProdCategory(p.category);
    setProdPrice(p.price);
    setProdDesc(p.description);
    setProdImage(p.images[0] || '');
    setProdSizes(p.sizes.join(', '));
    setProdColors(p.colors.map(c => `${c.name}:${c.hex}`).join(', '));
    setProdGender(p.gender);
    setProdTags(p.tags.join(', '));
    setShowProductModal(true);
  };

  const handleOpenAdd = () => {
    setEditingProduct(null);
    setProdName('');
    setProdBrand('');
    setProdCategory('Luxury');
    setProdPrice(100);
    setProdDesc('');
    setProdImage('https://images.unsplash.com/photo-1544441893-675973e31985?auto=format&fit=crop&w=600&q=80');
    setProdSizes('S, M, L, XL');
    setProdColors('Pitch Black:#111111, Ivory White:#FFFFFF');
    setProdGender('Unisex');
    setProdTags('casual, custom, streetwear');
    setShowProductModal(true);
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');

    // Parse Sizes and Colors
    const sizesArr = prodSizes.split(',').map(s => s.trim()).filter(Boolean);
    const colorsArr = prodColors.split(',').map(c => {
      const parts = c.split(':');
      return {
        name: parts[0]?.trim() || 'Color',
        hex: parts[1]?.trim() || '#000000'
      };
    }).filter(col => col.name && col.hex);

    const tagsArr = prodTags.split(',').map(t => t.trim().toLowerCase()).filter(Boolean);

    const payload = {
      name: prodName,
      brand: prodBrand,
      category: prodCategory,
      price: Number(prodPrice),
      description: prodDesc,
      images: [prodImage],
      sizes: sizesArr,
      colors: colorsArr,
      gender: prodGender,
      tags: tagsArr
    };

    try {
      const token = localStorage.getItem('aurastyle_token');
      const url = editingProduct ? `/api/admin/products/${editingProduct.id}` : '/api/admin/products';
      const method = editingProduct ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        setFormSuccess(editingProduct ? 'Product synchronized successfully!' : 'New designer item uploaded successfully!');
        await onRefreshProducts();
        await fetchAnalytics();
        setTimeout(() => {
          setShowProductModal(false);
          setEditingProduct(null);
        }, 1500);
      } else {
        const data = await res.json();
        setFormError(data.error || 'Check fields and try again.');
      }
    } catch (err) {
      setFormError('Server validation issue.');
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-6 py-10" id="admin-panel-workspace">
      {/* Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-white/10 pb-6 mb-8 gap-4">
        <div className="flex items-center space-x-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-red-950/50 border border-red-500/30 text-red-500">
            <ShieldAlert className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white tracking-tight">Couture Control Tower</h1>
            <p className="text-xs text-neutral-400">AuraStyle Administration & Multimodal Search Analytics Engine</p>
          </div>
        </div>

        {/* Tab triggers */}
        <div className="flex bg-neutral-900 border border-white/5 rounded-full p-1 text-xs">
          <button 
            onClick={() => setActiveTab('analytics')}
            className={`px-4 py-2 rounded-full font-semibold transition-all ${activeTab === 'analytics' ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 'text-neutral-400 hover:text-white'}`}
          >
            Analytics & Logs
          </button>
          <button 
            onClick={() => setActiveTab('products')}
            className={`px-4 py-2 rounded-full font-semibold transition-all ${activeTab === 'products' ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 'text-neutral-400 hover:text-white'}`}
          >
            Manage Catalog
          </button>
          <button 
            onClick={() => setActiveTab('orders')}
            className={`px-4 py-2 rounded-full font-semibold transition-all ${activeTab === 'orders' ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 'text-neutral-400 hover:text-white'}`}
          >
            Verify Orders
          </button>
          <button 
            onClick={() => setActiveTab('users')}
            className={`px-4 py-2 rounded-full font-semibold transition-all ${activeTab === 'users' ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 'text-neutral-400 hover:text-white'}`}
          >
            Users Registry
          </button>
        </div>
      </div>

      {/* VIEW 1: ANALYTICS */}
      {activeTab === 'analytics' && (
        <div className="space-y-6">
          {/* Key Metrics */}
          {isAnalyticsLoading ? (
            <div className="text-neutral-500 py-6 text-xs font-mono animate-pulse">Calculating metrics...</div>
          ) : !analytics ? (
            <div className="text-neutral-500 text-xs py-4">Configure database details to view logs.</div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-5.5 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono text-neutral-400 uppercase tracking-widest font-semibold">Total Registry Users</span>
                    <Users className="h-4.5 w-4.5 text-red-400" />
                  </div>
                  <div className="text-2.5xl font-bold text-white font-mono">{analytics.totalUsers}</div>
                  <p className="text-[10px] text-neutral-500">Fully structured profiles created</p>
                </div>

                <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-5.5 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono text-neutral-400 uppercase tracking-widest font-semibold">Total Catalog Items</span>
                    <ShoppingBag className="h-4.5 w-4.5 text-red-400" />
                  </div>
                  <div className="text-2.5xl font-bold text-white font-mono">{analytics.totalProducts}</div>
                  <p className="text-[10px] text-neutral-500">16+ pre-seeded items</p>
                </div>

                <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-5.5 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono text-neutral-400 uppercase tracking-widest font-semibold">System Receipts</span>
                    <FileText className="h-4.5 w-4.5 text-red-400" />
                  </div>
                  <div className="text-2.5xl font-bold text-white font-mono">{analytics.totalOrders}</div>
                  <p className="text-[10px] text-neutral-500">Processed through checkout UI</p>
                </div>

                <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-5.5 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono text-neutral-400 uppercase tracking-widest font-semibold">Platform Revenue</span>
                    <IndianRupee className="h-4.5 w-4.5 text-green-400" />
                  </div>
                  <div className="text-2.5xl font-bold text-green-400 font-mono">₹{analytics.revenue}</div>
                  <p className="text-[10px] text-neutral-500">Excluding cancelled items</p>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Search Queries Analytics */}
                <div className="rounded-3xl border border-white/10 bg-neutral-950 p-6 space-y-4">
                  <h3 className="text-sm font-semibold text-white flex items-center space-x-2">
                    <Cpu className="h-4 w-4 text-red-400" />
                    <span>Neural Search Modalities Distribution</span>
                  </h3>
                  
                  {/* CSS-based Bar charts */}
                  <div className="space-y-3 pt-2">
                    {Object.entries(analytics.searchCountsByType).map(([key, count]: any) => {
                      const total: any = Object.values(analytics.searchCountsByType).reduce((a: any, b: any) => a + b, 0) || 1;
                      const pct = Math.round((count / total) * 100);
                      return (
                        <div key={key} className="space-y-1.5">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-mono text-neutral-300 uppercase">{key} Search</span>
                            <span className="font-mono font-semibold text-neutral-400">{count} logs ({pct}%)</span>
                          </div>
                          <div className="w-full bg-neutral-900 h-2.5 rounded-full overflow-hidden">
                            <div className="bg-gradient-to-r from-red-600 to-indigo-600 h-full rounded-full" style={{ width: `${pct}%` }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Most Searched Fashion terms */}
                <div className="rounded-3xl border border-white/10 bg-neutral-950 p-6 space-y-4">
                  <h3 className="text-sm font-semibold text-white flex items-center space-x-2">
                    <TrendingUp className="h-4 w-4 text-red-400" />
                    <span>Top Semantic Style Search Phrases</span>
                  </h3>

                  {analytics.mostSearched.length === 0 ? (
                    <div className="text-neutral-500 text-xs py-4 text-center">No queries captured yet. Perform text search to view metrics.</div>
                  ) : (
                    <div className="space-y-2 pt-1">
                      {analytics.mostSearched.map((item: any, idx: number) => (
                        <div 
                          key={idx}
                          className="flex items-center justify-between rounded-xl bg-white/[0.01] border border-white/5 p-3 text-xs"
                        >
                          <div className="flex items-center space-x-3">
                            <span className="text-neutral-500 font-mono font-bold">#0{idx + 1}</span>
                            <span className="text-white font-medium italic">"{item.query}"</span>
                          </div>
                          <span className="rounded-full bg-neutral-800 px-2.5 py-1 text-[10px] font-mono text-neutral-300 font-bold">
                            {item.count} query hits
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* VIEW 2: PRODUCTS CRUD */}
      {activeTab === 'products' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-white uppercase tracking-wider">Product Catalog ({products.length} Items)</h3>
            <button
              onClick={handleOpenAdd}
              className="rounded-full bg-red-600 px-4 py-2 text-xs font-semibold text-white hover:bg-red-500 transition-colors flex items-center space-x-1.5"
              id="admin-add-product-btn"
            >
              <Plus className="h-4 w-4" />
              <span>Add Custom Piece</span>
            </button>
          </div>

          {/* Product grid table */}
          <div className="overflow-x-auto rounded-2xl border border-white/10 bg-neutral-950">
            <table className="w-full text-left text-xs">
              <thead className="bg-neutral-900 text-neutral-400 uppercase font-mono tracking-wider">
                <tr>
                  <th className="px-6 py-4">Piece details</th>
                  <th className="px-6 py-4">Gender & Category</th>
                  <th className="px-6 py-4">Price</th>
                  <th className="px-6 py-4">Sizes</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-neutral-200">
                {products.map((p) => (
                  <tr key={p.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-6 py-4 flex items-center space-x-3.5">
                      <img src={p.images[0]} alt={p.name} className="h-11 w-9 rounded object-cover border border-white/5" />
                      <div>
                        <span className="font-semibold block text-[13px]">{p.name}</span>
                        <span className="text-[10px] text-neutral-500 font-mono uppercase">{p.brand}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="block font-medium">{p.category}</span>
                      <span className="text-[10px] text-neutral-500">{p.gender}</span>
                    </td>
                    <td className="px-6 py-4 font-mono font-semibold">₹{p.price}</td>
                    <td className="px-6 py-4 text-neutral-400 font-mono text-[11px]">{p.sizes.join(', ')}</td>
                    <td className="px-6 py-4 text-right space-x-2">
                      <button 
                        onClick={() => handleOpenEdit(p)}
                        className="p-1.5 hover:bg-neutral-800 rounded text-amber-500"
                        title="Edit Item"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button 
                        onClick={() => handleDeleteProduct(p.id)}
                        className="p-1.5 hover:bg-neutral-800 rounded text-red-500"
                        title="Delete Item"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* VIEW 3: ORDERS */}
      {activeTab === 'orders' && (
        <div className="space-y-6">
          <h3 className="text-sm font-semibold text-white uppercase tracking-wider">Checkout Order History ({ordersList.length} Invoices)</h3>

          {ordersList.length === 0 ? (
            <div className="rounded-2xl border border-white/5 bg-white/[0.01] p-10 text-center text-xs text-neutral-500">
              No orders checked out yet. Test checkout in user role to view logs.
            </div>
          ) : (
            <div className="space-y-4">
              {ordersList.map((ord) => (
                <div 
                  key={ord.id}
                  className="rounded-2xl border border-white/10 bg-neutral-950 p-5 space-y-4"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-white/5 pb-3 gap-2">
                    <div>
                      <span className="font-mono text-xs font-bold text-neutral-300 block">ID: {ord.id}</span>
                      <span className="text-[10px] text-neutral-500 font-mono">
                        Date: {new Date(ord.createdAt).toLocaleDateString()} at {new Date(ord.createdAt).toLocaleTimeString()}
                      </span>
                    </div>

                    {/* Status updater */}
                    <div className="flex items-center space-x-2 text-xs">
                      <span className="text-neutral-400 font-medium">Status:</span>
                      <select
                        value={ord.status}
                        onChange={(e) => handleUpdateOrderStatus(ord.id, e.target.value)}
                        className="rounded border border-white/10 bg-black px-2.5 py-1 text-xs text-white focus:outline-none"
                      >
                        <option value="Pending">Pending</option>
                        <option value="Shipped">Shipped</option>
                        <option value="Delivered">Delivered</option>
                        <option value="Cancelled">Cancelled</option>
                      </select>
                    </div>
                  </div>

                  {/* Order items */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <span className="text-[10px] text-neutral-500 font-mono uppercase tracking-widest block font-semibold">Purchased Items</span>
                      {ord.items.map((item, idx) => (
                        <div key={idx} className="flex items-center space-x-3 text-xs">
                          <img src={item.image} alt={item.name} className="h-8 w-6 rounded object-cover border border-white/5" />
                          <div className="flex-1">
                            <span className="text-neutral-200 block truncate font-medium">{item.name}</span>
                            <span className="text-[10px] text-neutral-500 font-mono">Size: {item.size} | Color: {item.color} | Qty: {item.quantity}</span>
                          </div>
                          <span className="font-mono text-neutral-300 font-semibold">₹{item.price * item.quantity}</span>
                        </div>
                      ))}
                    </div>

                    {/* Shipping info */}
                    <div className="text-xs space-y-1 bg-white/[0.01] border border-white/5 rounded-xl p-3">
                      <span className="text-[10px] text-neutral-500 font-mono uppercase tracking-widest block font-semibold mb-1">Shipping & Receipt Details</span>
                      <p className="font-semibold text-white">{ord.shippingAddress.fullName}</p>
                      <p className="text-neutral-400">{ord.shippingAddress.addressLine1}, {ord.shippingAddress.city}</p>
                      <p className="text-neutral-400">{ord.shippingAddress.state} - {ord.shippingAddress.postalCode}</p>
                      <p className="text-neutral-400">{ord.shippingAddress.country} | Phone: {ord.shippingAddress.phone}</p>
                      <div className="border-t border-white/5 pt-2 mt-2 flex justify-between font-bold text-sm text-white">
                        <span>Total Paid:</span>
                        <span className="font-mono">₹{ord.totalAmount}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* VIEW 4: USERS LIST */}
      {activeTab === 'users' && (
        <div className="space-y-6">
          <h3 className="text-sm font-semibold text-white uppercase tracking-wider">Registered System Accounts ({usersList.length} Profiles)</h3>

          <div className="overflow-x-auto rounded-2xl border border-white/10 bg-neutral-950">
            <table className="w-full text-left text-xs">
              <thead className="bg-neutral-900 text-neutral-400 uppercase font-mono tracking-wider">
                <tr>
                  <th className="px-6 py-4">Account ID</th>
                  <th className="px-6 py-4">Full Name</th>
                  <th className="px-6 py-4">Email Address</th>
                  <th className="px-6 py-4">System Role</th>
                  <th className="px-6 py-4">Join Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-neutral-200">
                {usersList.map((usr) => (
                  <tr key={usr.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-6 py-4 font-mono font-bold text-[11px] text-neutral-400">{usr.id}</td>
                    <td className="px-6 py-4 font-medium">{usr.name}</td>
                    <td className="px-6 py-4 font-mono text-neutral-300">{usr.email}</td>
                    <td className="px-6 py-4">
                      <span className={`rounded-full px-2 py-0.5 text-[9px] font-bold uppercase ${usr.role === 'admin' ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 'bg-neutral-800 text-neutral-300'}`}>
                        {usr.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-mono text-neutral-500">{new Date(usr.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* PRODUCT CREATOR MODAL */}
      {showProductModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4">
          <div className="relative w-full max-w-2xl rounded-3xl border border-white/10 bg-neutral-950 p-6 overflow-y-auto max-h-[90vh] space-y-4">
            
            {/* Header */}
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <h3 className="text-base font-bold text-white flex items-center space-x-1.5">
                <Grid className="h-5 w-5 text-red-500" />
                <span>{editingProduct ? 'Edit Designer Piece' : 'Catalogue Upload Wizard'}</span>
              </h3>
              <button 
                onClick={() => { setShowProductModal(false); setEditingProduct(null); }}
                className="rounded-lg p-1 text-neutral-400 hover:bg-white/10 hover:text-white transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {formError && <div className="text-xs text-red-400 bg-red-950/40 p-3 rounded-lg border border-red-500/20">{formError}</div>}
            {formSuccess && <div className="text-xs text-green-400 bg-green-950/40 p-3 rounded-lg border border-green-500/20">{formSuccess}</div>}

            {/* Form */}
            <form onSubmit={handleSaveProduct} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-semibold text-neutral-500 uppercase tracking-wider block">Product Name</label>
                  <input required type="text" value={prodName} onChange={(e) => setProdName(e.target.value)} className="w-full rounded-xl bg-neutral-900 border border-white/10 p-3 text-white focus:outline-none focus:border-red-500" placeholder="e.g. Corduroy Bomber Jacket" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-semibold text-neutral-500 uppercase tracking-wider block">Brand Label</label>
                  <input required type="text" value={prodBrand} onChange={(e) => setProdBrand(e.target.value)} className="w-full rounded-xl bg-neutral-900 border border-white/10 p-3 text-white focus:outline-none focus:border-red-500" placeholder="e.g. Aura Atelier" />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-semibold text-neutral-500 uppercase tracking-wider block">Category</label>
                  <select value={prodCategory} onChange={(e) => setProdCategory(e.target.value)} className="w-full rounded-xl bg-neutral-900 border border-white/10 p-3 text-white focus:outline-none focus:border-red-500">
                    <option value="Luxury">Luxury</option>
                    <option value="Streetwear">Streetwear</option>
                    <option value="Sports">Sports</option>
                    <option value="Accessories">Accessories</option>
                    <option value="Kids">Kids</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-semibold text-neutral-500 uppercase tracking-wider block">Price (INR)</label>
                  <input required type="number" value={prodPrice} onChange={(e) => setProdPrice(Number(e.target.value))} className="w-full rounded-xl bg-neutral-900 border border-white/10 p-3 text-white focus:outline-none focus:border-red-500" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-semibold text-neutral-500 uppercase tracking-wider block">Gender Alignment</label>
                  <select value={prodGender} onChange={(e) => setProdGender(e.target.value as any)} className="w-full rounded-xl bg-neutral-900 border border-white/10 p-3 text-white focus:outline-none focus:border-red-500">
                    <option value="Men">Men</option>
                    <option value="Women">Women</option>
                    <option value="Kids">Kids</option>
                    <option value="Unisex">Unisex</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-semibold text-neutral-500 uppercase tracking-wider block">Unsplash Product Image URL</label>
                <input required type="url" value={prodImage} onChange={(e) => setProdImage(e.target.value)} className="w-full rounded-xl bg-neutral-900 border border-white/10 p-3 text-white focus:outline-none focus:border-red-500" placeholder="https://images.unsplash.com/photo-..." />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-semibold text-neutral-500 uppercase tracking-wider block">Item Description</label>
                <textarea required value={prodDesc} onChange={(e) => setProdDesc(e.target.value)} className="w-full rounded-xl bg-neutral-900 border border-white/10 p-3 h-20 text-white focus:outline-none focus:border-red-500 resize-none" placeholder="Elaborated detail for Gemini matching..." />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-semibold text-neutral-500 uppercase tracking-wider block">Available Sizes (Comma Separated)</label>
                  <input type="text" value={prodSizes} onChange={(e) => setProdSizes(e.target.value)} className="w-full rounded-xl bg-neutral-900 border border-white/10 p-3 text-white focus:outline-none focus:border-red-500" placeholder="e.g. S, M, L, XL" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-semibold text-neutral-500 uppercase tracking-wider block">Aura Search Tags (Comma Separated)</label>
                  <input type="text" value={prodTags} onChange={(e) => setProdTags(e.target.value)} className="w-full rounded-xl bg-neutral-900 border border-white/10 p-3 text-white focus:outline-none focus:border-red-500" placeholder="e.g. summer, jacket, lightweight" />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-semibold text-neutral-500 uppercase tracking-wider block">Available Colors (Format: ColorName:HexColorCode, ...)</label>
                <input type="text" value={prodColors} onChange={(e) => setProdColors(e.target.value)} className="w-full rounded-xl bg-neutral-900 border border-white/10 p-3 text-white focus:outline-none focus:border-red-500" placeholder="e.g. Navy Blue:#0020C2, Desert Sand:#E5D3B3" />
              </div>

              <div className="flex justify-end pt-4 space-x-2">
                <button 
                  type="button" 
                  onClick={() => { setShowProductModal(false); setEditingProduct(null); }}
                  className="rounded-xl border border-white/10 bg-neutral-900 px-5 py-2.5 hover:bg-neutral-800 text-white"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="rounded-xl bg-red-600 px-6 py-2.5 font-bold hover:bg-red-500 text-white"
                >
                  Save Piece Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
