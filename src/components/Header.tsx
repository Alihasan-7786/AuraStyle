import React from 'react';
import { 
  Sparkles, 
  ShoppingBag, 
  Heart, 
  User as UserIcon, 
  Search, 
  Mic, 
  Image as ImageIcon,
  ShieldAlert,
  LogOut,
  Sliders,
  Compass
} from 'lucide-react';
import { User, CartItem } from '../types';

interface HeaderProps {
  currentUser: User | null;
  currentView: string;
  cart: CartItem[];
  wishlist: string[];
  onNavigate: (view: string, params?: any) => void;
  onLogout: () => void;
}

export default function Header({
  currentUser,
  currentView,
  cart,
  wishlist,
  onNavigate,
  onLogout
}: HeaderProps) {
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/5 bg-[#050505]/90 backdrop-blur-xl">
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-6">
        {/* Brand Logo */}
        <div 
          onClick={() => onNavigate('home')} 
          className="flex cursor-pointer items-center space-x-3 group"
          id="nav-logo"
        >
          <div className="relative flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-white/5 transition-colors duration-300 group-hover:border-white/30">
            <Sparkles className="h-4.5 w-4.5 text-white/80 group-hover:text-emerald-400 transition-colors" />
          </div>
          <span className="text-xl font-light tracking-[0.25em] uppercase italic text-white/95 font-sans">
            AuraStyle
          </span>
        </div>

        {/* Navigation Menus */}
        <nav className="hidden md:flex items-center space-x-8 text-[11px] uppercase tracking-[0.18em] font-light text-white/50">
          <button 
            onClick={() => onNavigate('home')}
            className={`transition-colors hover:text-white flex items-center gap-1.5 ${currentView === 'home' ? 'text-white font-normal border-b border-white/30 pb-0.5' : ''}`}
            id="nav-home-btn"
          >
            <Compass className="h-3.5 w-3.5" />
            Explore
          </button>
          <button 
            onClick={() => onNavigate('catalog')}
            className={`transition-colors hover:text-white flex items-center gap-1.5 ${currentView === 'catalog' ? 'text-white font-normal border-b border-white/30 pb-0.5' : ''}`}
            id="nav-catalog-btn"
          >
            <Sliders className="h-3.5 w-3.5" />
            Catalog
          </button>
          <button 
            onClick={() => onNavigate('ai-search')}
            className={`transition-colors hover:text-white flex items-center gap-1.5 ${currentView === 'ai-search' ? 'text-emerald-400 font-normal border-b border-emerald-500/30 pb-0.5' : ''}`}
            id="nav-ai-btn"
          >
            <Sparkles className="h-3.5 w-3.5 text-emerald-400 animate-pulse" />
            Aura Search
          </button>
        </nav>

        {/* User Actions & System Info */}
        <div className="flex items-center space-x-4">
          {/* Active AI Engine indicator */}
          <div className="hidden lg:flex text-[9px] tracking-widest uppercase px-3 py-1 border border-emerald-500/20 text-emerald-400 bg-emerald-500/5 rounded-full items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            Style Concierge
          </div>

          {/* Admin badge */}
          {currentUser?.role === 'admin' && (
            <button
              onClick={() => onNavigate('admin')}
              className={`flex items-center space-x-1 rounded-full border border-red-500/20 bg-red-950/20 px-3.5 py-1.5 text-[10px] uppercase tracking-wider font-medium text-red-400 backdrop-blur-md transition-all hover:bg-red-900/30 ${currentView === 'admin' ? 'ring-1 ring-red-500/50' : ''}`}
              id="nav-admin-btn"
            >
              <ShieldAlert className="h-3.5 w-3.5" />
              <span>Admin</span>
            </button>
          )}

          {/* Wishlist Icon */}
          <button 
            onClick={() => {
              if (!currentUser) onNavigate('login');
              else onNavigate('wishlist');
            }}
            className="relative p-2 text-white/50 transition-colors hover:text-white"
            title="Wishlist"
            id="nav-wishlist-btn"
          >
            <Heart className={`h-5 w-5 ${wishlist.length > 0 ? 'fill-emerald-500 text-emerald-500' : ''}`} />
            {wishlist.length > 0 && (
              <span className="absolute top-1.5 right-1.5 flex h-2 w-2 rounded-full bg-emerald-400" />
            )}
          </button>

          {/* Cart Icon */}
          <button 
            onClick={() => {
              if (!currentUser) onNavigate('login');
              else onNavigate('cart');
            }}
            className="relative p-2 text-white/50 transition-colors hover:text-white"
            title="Shopping Cart"
            id="nav-cart-btn"
          >
            <ShoppingBag className="h-5 w-5" />
            {cartCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 flex h-4.5 w-4.5 items-center justify-center rounded-full bg-white text-[9px] font-bold text-black border border-black shadow-md">
                {cartCount}
              </span>
            )}
          </button>

          {/* User Profile dropdown */}
          {currentUser ? (
            <div className="flex items-center space-x-3 border-l border-white/10 pl-4">
              <button 
                onClick={() => onNavigate('profile')}
                className="flex items-center space-x-2 text-white/70 hover:text-white group"
                id="nav-profile-btn"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-xs font-medium uppercase tracking-wide border border-white/20 group-hover:border-emerald-400 transition-colors">
                  {currentUser.name[0].toUpperCase()}
                </div>
                <span className="hidden lg:inline text-[10px] tracking-wider uppercase max-w-[100px] truncate">{currentUser.name.split(' ')[0]}</span>
              </button>
              <button 
                onClick={onLogout}
                className="p-1.5 text-white/30 hover:text-red-400 transition-colors"
                title="Logout"
                id="nav-logout-btn"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <button 
              onClick={() => onNavigate('login')}
              className="flex items-center space-x-1.5 rounded-full border border-white/20 bg-white/5 hover:bg-white hover:text-black px-4.5 py-2 text-[10px] uppercase tracking-widest font-medium text-white transition-all duration-200"
              id="nav-login-btn"
            >
              <UserIcon className="h-3.5 w-3.5" />
              <span>Login</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
