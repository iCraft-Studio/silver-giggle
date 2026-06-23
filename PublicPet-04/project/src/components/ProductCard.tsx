import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { PawPrint, User, MapPin, Heart, Share2, Loader2, Star } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

// --- TYPES ---
export type ProductCardProps = {
  product: {
    id: string;
    title: string;
    price: number;
    category: 'pet_listing' | 'food' | 'accessory';
    image_url: string;
    address?: string;
    gender?: string;
    age?: string;
    rating?: number;
    views?: number;
    seller?: {
      full_name: string;
      avatar_url: string;
      is_verified?: boolean;
    } | any; 
  };
};

export const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const navigate = useNavigate();
  const isPet = product.category === 'pet_listing';
  
  // Robustly extract seller data
  const sellerData = Array.isArray(product.seller) ? product.seller[0] : product.seller;
  const sellerName = sellerData?.full_name?.trim() ? sellerData.full_name : 'User';
  const sellerAvatar = sellerData?.avatar_url;
  const isVerified = sellerData?.is_verified === true;
  
  const [isAdding, setIsAdding] = useState(false);
  const [isAdded, setIsAdded] = useState(false);

  // --- THE FIX: INSTANT NAVIGATION ---
  const handleCardClick = () => {
    // The view count is safely handled by ProductDetails on mount.
    // This just teleports the user instantly.
    navigate(`/product/${product.id}`);
  };

  const handleShare = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const shareData = {
      title: product.title,
      text: `Check out this ${product.category.replace('_', ' ')} on Public Pet!`,
      url: `${window.location.origin}/product/${product.id}`,
    };
    try {
      if (navigator.share) await navigator.share(shareData);
      else {
        await navigator.clipboard.writeText(shareData.url);
        alert("Link copied to clipboard!");
      }
    } catch (err) {
      console.error("Error sharing:", err);
    }
  };

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsAdding(true);
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) { navigate('/auth'); return; }

    const { error } = await supabase.from('cart_items').upsert({
      user_id: session.user.id,
      product_id: product.id,
      quantity: 1
    }, { onConflict: 'user_id, product_id' });

    setIsAdding(false);
    if (!error) {
      setIsAdded(true);
      setTimeout(() => setIsAdded(false), 2500);
    }
  };

  return (
    <motion.div
      onClick={handleCardClick}
      initial={{ opacity: 0, y: 30, scale: 0.95 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: false, margin: "0px 0px -50px 0px" }}
      transition={{ duration: 0.5, type: "spring", bounce: 0.3 }}
      whileHover={{ y: -8 }}
      className="group cursor-pointer flex flex-col w-full bg-white relative"
    >
      {/* Image Container */}
      <div className="w-full aspect-square bg-gray-50 rounded-[2rem] overflow-hidden mb-3 relative shadow-sm border border-gray-100/50">
        {product.image_url ? (
          <img src={product.image_url} alt={product.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-300 bg-gray-50"><PawPrint size={40} className="opacity-40" /></div>
        )}

        <div className="absolute top-4 left-4 bg-white/90 backdrop-blur shadow-sm text-[10px] font-semibold px-3 py-1 rounded-full uppercase tracking-wider text-gray-900 z-10">
          {product.category.replace('_', ' ')}
        </div>

        <div className="absolute bottom-4 right-4 flex flex-row items-center space-x-2 z-20 sm:opacity-0 group-hover:opacity-100 opacity-100">
          <button onClick={handleShare} className="p-2.5 bg-white/90 backdrop-blur-md rounded-full shadow-lg hover:text-indigo-600 transition-all"><Share2 size={18} /></button>
          <button onClick={handleAddToCart} disabled={isAdding || isAdded} className={`p-2.5 rounded-full shadow-lg backdrop-blur-md transition-all ${isAdded ? 'bg-green-50 text-green-600' : 'bg-white/90 text-gray-900 hover:bg-red-500 hover:text-white'}`}>
            {isAdding ? <Loader2 size={18} className="animate-spin" /> : <Heart size={18} className={isAdded ? 'fill-green-500' : ''} />}
          </button>
        </div>
      </div>

      {/* 1. Seller Info Row */}
      <div className="flex items-center space-x-1.5 px-1 mb-1.5">
        {sellerAvatar ? (
          <img src={sellerAvatar} alt={sellerName} className="w-5 h-5 rounded-full object-cover" />
        ) : (
          <div className="w-5 h-5 rounded-full bg-gray-100 flex items-center justify-center"><User size={10} className="text-gray-400" /></div>
        )}
        <span className="text-[11px] font-medium text-gray-500 truncate">{sellerName}</span>
        {isVerified && <img src="/tick.svg" alt="Verified" className="w-3 h-3" />}
      </div>

      {/* 2. Title & Price/Rating Row */}
      <div className="px-1 flex flex-col space-y-1">
        <h3 className="font-semibold text-gray-900 text-sm md:text-base leading-tight group-hover:text-indigo-600 truncate">{product.title}</h3>
        
        <div className="flex items-center justify-between">
          <p className="text-indigo-600 font-semibold text-sm md:text-base">
            ${product.price.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </p>
          <div className="flex items-center text-[10px] font-semibold text-yellow-600 bg-yellow-50 px-2 py-0.5 rounded-md border border-yellow-100">
            <Star size={10} className="fill-yellow-500 text-yellow-500 mr-1" />
            {product.rating ? product.rating.toFixed(1) : 'New'}
          </div>
        </div>
      </div>

      {/* 3. Footer Meta (Location/Pet Details) */}
      <div className="px-1 mt-1.5 flex items-center text-[10px] text-gray-400 font-medium gap-2">
        <div className="flex items-center">
            <MapPin size={10} className="mr-0.5" /> 
            <span className="truncate max-w-[80px]">{product.address || 'USA'}</span>
        </div>
        {isPet && (product.age || product.gender) && (
            <>
                <span className="text-gray-200">•</span>
                <span className="truncate">{[product.gender, product.age].filter(Boolean).join(' • ')}</span>
            </>
        )}
      </div>
    </motion.div>
  );
};