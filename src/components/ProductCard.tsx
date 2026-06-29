import React from 'react';
import { Heart, Star, ShoppingBag, Eye, Sparkles } from 'lucide-react';
import { Product } from '../types';

interface ProductCardProps {
  key?: string | number;
  product: Product;
  isWishlisted: boolean;
  onNavigate: (view: string, params?: any) => void;
  onToggleWishlist: (productId: string) => void;
  onQuickAdd: (product: Product, size: string, color: string) => void;
}

export default function ProductCard({
  product,
  isWishlisted,
  onNavigate,
  onToggleWishlist,
  onQuickAdd
}: ProductCardProps) {
  const defaultSize = product.sizes[0] || 'M';
  const defaultColor = product.colors[0]?.name || 'Default';

  return (
    <div 
      className="group relative flex flex-col overflow-hidden rounded-2xl border border-white/5 bg-[#0d0d0d]/40 backdrop-blur-md transition-all duration-300 hover:border-white/15 hover:bg-[#0d0d0d]/80 hover:shadow-2xl hover:shadow-black"
      id={`product-card-${product.id}`}
    >
      {/* Product Image Area */}
      <div className="relative aspect-[4/5] w-full overflow-hidden bg-neutral-950">
        <img 
          src={product.images[0]} 
          alt={product.name} 
          referrerPolicy="no-referrer"
          className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
          loading="lazy"
        />

        {/* Backdrop vignette shadow */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20" />

        {/* Gender / Category pill */}
        <div className="absolute top-3.5 left-3.5 flex items-center space-x-1.5 rounded-full bg-black/60 px-3 py-1 text-[9px] font-medium uppercase tracking-widest text-white/60 backdrop-blur-md border border-white/5">
          <span>{product.gender}</span>
          <span className="h-1 w-1 rounded-full bg-white/20" />
          <span>{product.category}</span>
        </div>

        {/* Luxury Sparkle Indicator for High Rating */}
        {product.rating >= 4.8 && (
          <div className="absolute top-3.5 right-14 flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500/10 backdrop-blur-md border border-emerald-500/20 text-emerald-400">
            <Sparkles className="h-3 w-3" />
          </div>
        )}

        {/* Wishlist Button */}
        <button 
          onClick={(e) => {
            e.stopPropagation();
            onToggleWishlist(product.id);
          }}
          className={`absolute top-3.5 right-3.5 flex h-7.5 w-7.5 items-center justify-center rounded-full bg-black/60 backdrop-blur-md border border-white/5 text-white/50 transition-all hover:scale-110 hover:border-white/20 hover:bg-black/90 hover:text-white ${isWishlisted ? 'text-emerald-400 border-emerald-500/20' : ''}`}
          id={`wishlist-toggle-${product.id}`}
        >
          <Heart className={`h-4 w-4 ${isWishlisted ? 'fill-emerald-400 text-emerald-400' : ''}`} />
        </button>

        {/* Overlay Action Buttons */}
        <div className="absolute inset-0 flex items-center justify-center space-x-3 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
          <button 
            onClick={() => onNavigate('product-detail', { id: product.id })}
            className="flex h-11 w-11 items-center justify-center rounded-full bg-white/10 backdrop-blur-md text-white border border-white/20 shadow-lg transition-transform duration-200 hover:scale-110 hover:bg-white hover:text-black"
            title="View Details"
            id={`view-details-${product.id}`}
          >
            <Eye className="h-4.5 w-4.5" />
          </button>
          <button 
            onClick={() => onQuickAdd(product, defaultSize, defaultColor)}
            className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-black shadow-lg transition-transform duration-200 hover:scale-110 hover:bg-neutral-200"
            title="Quick Add to Bag"
            id={`quick-add-${product.id}`}
          >
            <ShoppingBag className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Info Panel */}
      <div className="flex flex-1 flex-col p-4.5 justify-between">
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[9px] font-medium uppercase tracking-[0.18em] text-white/40 font-sans">
              {product.brand}
            </span>
            <div className="flex items-center space-x-1">
              <Star className="h-3 w-3 fill-emerald-400 text-emerald-400" />
              <span className="text-[11px] font-medium text-white/60 font-mono">
                {product.rating.toFixed(1)}
              </span>
            </div>
          </div>
          <h3 
            onClick={() => onNavigate('product-detail', { id: product.id })}
            className="cursor-pointer text-[13px] font-light leading-snug text-white/90 line-clamp-1 transition-colors hover:text-emerald-400 font-sans tracking-wide"
          >
            {product.name}
          </h3>
        </div>

        {/* Colors swatches preview */}
        <div className="flex items-center space-x-1.5 py-3">
          {product.colors.map((col, idx) => (
            <span 
              key={idx}
              className="h-2.5 w-2.5 rounded-full ring-1 ring-white/15 shadow-inner"
              style={{ backgroundColor: col.hex }}
              title={col.name}
            />
          ))}
          <span className="text-[10px] text-white/30 font-mono pl-1">
            {product.sizes.join(', ')}
          </span>
        </div>

        <div className="flex items-center justify-between border-t border-white/5 pt-3">
          <span className="text-sm font-light text-white/90 font-mono tracking-wide">
            ₹{product.price}
          </span>
          <button
            onClick={() => onNavigate('product-detail', { id: product.id })}
            className="text-[11px] font-light text-white/50 hover:text-white transition-colors flex items-center space-x-1 tracking-wider uppercase"
          >
            <span>Details</span>
            <span>&rarr;</span>
          </button>
        </div>
      </div>
    </div>
  );
}
