import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, Link } from 'react-router-dom';
import { Trash2, Plus, Minus, ArrowLeft, ShoppingBag, ShieldCheck } from 'lucide-react';
import { supabase } from '../lib/supabase';

// --- TYPES ---
type CartItem = {
  id: string; 
  quantity: number;
  product: {
    id: string;
    title: string;
    price: number;
    image_url: string;
    category: string;
  };
};

const CartSkeleton = () => (
  <div className="flex flex-col lg:flex-row gap-12 w-full pt-8">
    <div className="flex-1 space-y-6">
      {[1, 2, 3].map(i => (
        <div key={i} className="flex space-x-4 w-full bg-gray-50 p-4 rounded-[2rem] animate-pulse">
          <div className="w-24 h-24 bg-gray-200 rounded-2xl flex-shrink-0"></div>
          <div className="flex-1 space-y-3 py-2">
            <div className="h-5 w-3/4 bg-gray-200 rounded-full"></div>
            <div className="h-4 w-1/4 bg-gray-200 rounded-full"></div>
            <div className="h-8 w-1/3 bg-gray-200 rounded-full mt-4"></div>
          </div>
        </div>
      ))}
    </div>
    <div className="w-full lg:w-[400px]">
      <div className="bg-gray-50 rounded-[2rem] p-8 space-y-6 animate-pulse">
        <div className="h-6 w-1/2 bg-gray-200 rounded-full"></div>
        <div className="space-y-4">
          <div className="flex justify-between"><div className="h-4 w-1/4 bg-gray-200 rounded-full"></div><div className="h-4 w-1/4 bg-gray-200 rounded-full"></div></div>
          <div className="flex justify-between"><div className="h-4 w-1/4 bg-gray-200 rounded-full"></div><div className="h-4 w-1/4 bg-gray-200 rounded-full"></div></div>
        </div>
        <div className="h-12 w-full bg-gray-200 rounded-full mt-6"></div>
      </div>
    </div>
  </div>
);

export const Cart: React.FC = () => {
  const navigate = useNavigate();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    fetchCart();
  }, []);

  const fetchCart = async () => {
    setLoading(true);
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session?.user) {
      setIsAuthenticated(false);
      setLoading(false);
      return;
    }
    setIsAuthenticated(true);

    const { data, error } = await supabase
      .from('cart_items')
      .select(`
        id, quantity,
        product:products ( id, title, price, image_url, category )
      `)
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: false });

    if (!error && data) {
      // @ts-ignore - Supabase join typing workaround
      setCartItems(data as CartItem[]);
    }
    setLoading(false);
  };

  const updateQuantity = async (cartItemId: string, newQuantity: number) => {
    if (newQuantity < 1) return;

    // Optimistic UI update
    setCartItems(current => 
      current.map(item => item.id === cartItemId ? { ...item, quantity: newQuantity } : item)
    );

    await supabase
      .from('cart_items')
      .update({ quantity: newQuantity })
      .eq('id', cartItemId);
  };

  const removeItem = async (cartItemId: string) => {
    // Optimistic UI update
    setCartItems(current => current.filter(item => item.id !== cartItemId));

    await supabase
      .from('cart_items')
      .delete()
      .eq('id', cartItemId);
  };

  // --- CALCULATIONS ---
  const subtotal = cartItems.reduce((acc, item) => acc + (item.product.price * item.quantity), 0);
  const shippingEstimate = subtotal > 0 ? 25.00 : 0; 
  const total = subtotal + shippingEstimate;

  if (loading) {
    return (
      <div className="min-h-screen bg-white px-6 md:px-12 lg:px-24 pt-8 pb-32">
        <h1 className="text-3xl md:text-4xl font-bold text-black mb-2">Your Cart</h1>
        <CartSkeleton />
      </div>
    );
  }

  // Handle Unauthenticated State
  if (isAuthenticated === false) {
    return (
      <div className="min-h-screen bg-white px-6 flex flex-col items-center pt-32 text-center">
        <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center text-gray-400 mb-6">
          <ShoppingBag size={40} />
        </div>
        <h1 className="text-2xl font-bold text-black mb-2">Sign in to view your cart</h1>
        <p className="text-gray-500 mb-8 max-w-md">You need an account to save items, add to your cart, and securely checkout.</p>
        <button onClick={() => navigate('/auth')} className="bg-blue-600 text-white px-8 py-3.5 rounded-full font-bold shadow-lg shadow-blue-600/20 hover:bg-blue-700 transition-all">
          Sign In / Create Account
        </button>
      </div>
    );
  }

  // Handle Empty Cart
  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-white px-6 flex flex-col items-center pt-32 text-center">
        <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center text-gray-300 mb-6 shadow-sm border border-gray-100">
          <ShoppingBag size={40} />
        </div>
        <h1 className="text-2xl font-bold text-black mb-2">Your cart is empty</h1>
        <p className="text-gray-500 mb-8 max-w-sm">Looks like you haven't added any companions or essentials yet.</p>
        <Link to="/shop" className="bg-black text-white px-8 py-3.5 rounded-full font-bold hover:bg-gray-800 transition-all shadow-lg shadow-black/10">
          Start Shopping
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white px-6 md:px-12 lg:px-24 pt-8 pb-32 font-sans">
      
      <div className="flex items-center space-x-4 mb-8">
        <Link to="/shop" className="w-10 h-10 bg-gray-50 flex items-center justify-center rounded-full text-gray-500 hover:text-black transition-colors border border-gray-100">
          <ArrowLeft size={18} />
        </Link>
        <h1 className="text-3xl md:text-4xl font-bold text-black tracking-tight">Your Cart</h1>
        <span className="bg-blue-50 text-blue-600 font-bold px-3 py-1 rounded-full text-sm border border-blue-100">
          {cartItems.length} {cartItems.length === 1 ? 'Item' : 'Items'}
        </span>
      </div>

      <div className="flex flex-col lg:flex-row gap-10 lg:gap-16">
        
        {/* LEFT: CART ITEMS LIST */}
        <div className="flex-1 space-y-4">
          <AnimatePresence mode="popLayout">
            {cartItems.map((item) => (
              <motion.div
                key={item.id}
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, x: -50, scale: 0.95 }}
                transition={{ duration: 0.3, type: "spring", bounce: 0.2 }}
                className="flex flex-col sm:flex-row sm:items-center bg-white border border-gray-100 p-4 rounded-[2rem] shadow-sm hover:shadow-md transition-shadow gap-4"
              >
                {/* Product Image */}
                <Link to={`/product/${item.product.id}`} className="w-full sm:w-28 h-28 bg-gray-50 rounded-2xl overflow-hidden flex-shrink-0 border border-gray-100">
                  <img src={item.product.image_url} alt={item.product.title} className="w-full h-full object-cover hover:scale-105 transition-transform duration-500" />
                </Link>

                {/* Details */}
                <div className="flex-1 flex flex-col justify-center">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">{item.product.category.replace('_', ' ')}</p>
                  <Link to={`/product/${item.product.id}`} className="font-bold text-black text-lg leading-tight hover:text-blue-600 transition-colors line-clamp-1 mb-1">
                    {item.product.title}
                  </Link>
                  <p className="font-bold text-blue-600 text-base">
                    ${item.product.price.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </p>
                </div>

                {/* Actions (Quantity + Delete) */}
                <div className="flex items-center justify-between sm:flex-col sm:items-end gap-3 sm:gap-2">
                  <div className="flex items-center bg-gray-50 border border-gray-200 rounded-full p-1 shadow-sm">
                    <button 
                      onClick={() => updateQuantity(item.id, item.quantity - 1)}
                      className="w-8 h-8 flex items-center justify-center text-gray-500 hover:text-black hover:bg-white rounded-full transition-all"
                    >
                      <Minus size={14} />
                    </button>
                    <span className="w-8 text-center font-bold text-black text-sm">{item.quantity}</span>
                    <button 
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      className="w-8 h-8 flex items-center justify-center text-gray-500 hover:text-black hover:bg-white rounded-full transition-all"
                    >
                      <Plus size={14} />
                    </button>
                  </div>
                  
                  <button 
                    onClick={() => removeItem(item.id)}
                    className="flex items-center space-x-1 text-xs font-bold text-gray-400 hover:text-red-500 transition-colors p-2"
                  >
                    <Trash2 size={14} />
                    <span className="sm:hidden">Remove</span>
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* RIGHT: ORDER SUMMARY */}
        <div className="w-full lg:w-[400px]">
          <div className="bg-gray-50 border border-gray-100 rounded-[2rem] p-6 md:p-8 sticky top-28 shadow-sm">
            <h2 className="text-xl font-bold text-black mb-6 border-b border-gray-200 pb-4">Order Summary</h2>
            
            <div className="space-y-4 mb-6">
              <div className="flex justify-between text-gray-500 font-medium text-sm md:text-base">
                <span>Subtotal</span>
                <span className="text-black font-bold">${subtotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between text-gray-500 font-medium text-sm md:text-base">
                <span>Shipping Estimate</span>
                <span className="text-black font-bold">${shippingEstimate.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
              </div>
            </div>

            <div className="border-t border-gray-200 pt-4 mb-8 flex justify-between items-center">
              <span className="font-bold text-black text-lg">Total</span>
              <span className="font-bold text-blue-600 text-2xl">${total.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
            </div>

            <button 
              onClick={() => navigate('/checkout')}
              className="w-full bg-blue-600 text-white py-4 rounded-full font-bold text-base shadow-lg shadow-blue-600/20 hover:bg-blue-700 transition-all flex items-center justify-center space-x-2"
            >
              <span>Proceed to Checkout</span>
            </button>

            {/* NEW: 100% BUYER PROTECTION ESCROW GUARANTEE */}
            <div className="mt-6 bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
              <div className="flex items-start space-x-3">
                <div className="mt-0.5 text-blue-600 bg-blue-50 p-2 rounded-full border border-blue-100">
                  <ShieldCheck size={20} />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-black mb-1.5">100% Buyer Protection</h4>
                  <p className="text-xs text-gray-500 leading-relaxed font-medium">
                    We securely hold your funds in escrow. The seller only gets paid after you confirm you've received your pet exactly as described. <span className="text-blue-600 font-bold">100% refund guaranteed</span> if anything goes wrong.
                  </p>
                </div>
              </div>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
};