import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Filter, PawPrint, ArrowLeft } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { ProductCard, ProductCardProps } from '../components/ProductCard';
import { useParams, Link } from 'react-router-dom';

type Product = ProductCardProps['product'];

const categoryNames: Record<string, string> = {
  'pet_listing': 'Local Pets',
  'food': 'Premium Nutrition',
  'accessory': 'Luxury Accessories',
  'all': 'All Listings'
};

const ShopSkeleton = () => (
  <div className="flex flex-col space-y-4 w-full">
    <div className="w-full aspect-square bg-gray-100 rounded-[2rem] animate-pulse"></div>
    <div className="flex items-center space-x-2 px-1">
      <div className="w-5 h-5 rounded-full bg-gray-100 animate-pulse"></div>
      <div className="h-3 bg-gray-100 rounded animate-pulse w-1/3"></div>
    </div>
  </div>
);

export const Shop: React.FC = () => {
  const { categoryId } = useParams<{ categoryId: string }>();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Fallback to 'all' if the URL is somehow malformed
  const safeCategory = categoryId && categoryNames[categoryId] ? categoryId : 'all';
  const pageTitle = categoryNames[safeCategory];

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      
      // FIXED: Added address, breed, gender, and age to the select query
      let query = supabase
        .from('products')
        .select(`
          id, title, price, category, image_url, address, breed, gender, age, views,
          seller:users(full_name, avatar_url)
        `)
        .eq('is_available', true)
        .order('created_at', { ascending: false });

      if (safeCategory !== 'all') {
        query = query.eq('category', safeCategory);
      }

      const { data, error } = await query;

      if (!error && data) {
        // @ts-ignore
        setProducts(data as Product[]);
      }
      
      setTimeout(() => setLoading(false), 600);
    };

    fetchProducts();
  }, [safeCategory]);

  const filteredProducts = products.filter(product => 
    product.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-white pb-32 font-sans">
      
      {/* HEADER & SEARCH SECTION */}
      <section className="pt-8 md:pt-12 px-6 md:px-12 lg:px-24 mb-10">
        
        {/* Breadcrumb Navigation */}
        <Link to="/shop" className="inline-flex items-center space-x-2 text-gray-400 hover:text-black font-bold text-sm mb-6 transition-colors">
          <ArrowLeft size={16} />
          <span>Back to Hub</span>
        </Link>

        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, type: "spring" }}
        >
          <div className="flex items-center space-x-3 mb-6">
            <h1 className="text-3xl md:text-5xl font-bold text-black tracking-tight">
              {pageTitle}
            </h1>
          </div>
          
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1 group">
              <Search className="absolute left-5 top-1/2 transform -translate-y-1/2 text-gray-400 group-focus-within:text-blue-600 transition-colors" size={20} />
              <input 
                type="text" 
                placeholder={`Search ${pageTitle.toLowerCase()}...`} 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-14 pr-6 py-4 bg-gray-50 border-2 border-transparent focus:border-blue-600 focus:bg-white rounded-full text-black font-bold outline-none transition-all shadow-sm"
              />
            </div>
            <motion.button 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="flex items-center justify-center space-x-2 bg-black text-white px-8 py-4 rounded-full font-bold shadow-lg shadow-black/10 hover:bg-gray-800 transition-colors"
            >
              <Filter size={18} />
              <span>Filters</span>
            </motion.button>
          </div>
        </motion.div>
      </section>

      {/* MULTI-VENDOR PRODUCT GRID */}
      <section className="px-6 md:px-12 lg:px-24">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 md:gap-8">
          {loading ? (
            Array.from({ length: 8 }).map((_, i) => <ShopSkeleton key={i} />)
          ) : filteredProducts.length > 0 ? (
            <AnimatePresence mode="popLayout">
              {filteredProducts.map((item) => (
                <ProductCard 
                  key={item.id} 
                  product={item} 
                  showSellerInfo={true}
                />
              ))}
            </AnimatePresence>
          ) : (
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="col-span-full py-20 flex flex-col items-center justify-center text-center bg-gray-50 rounded-[2rem] border-2 border-dashed border-gray-200"
            >
              <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-sm text-gray-300 mb-4">
                <PawPrint size={40} />
              </div>
              <h3 className="text-xl font-bold text-black mb-2">No listings found</h3>
              <p className="text-gray-500 font-medium max-w-md">
                We couldn't find anything matching your search in this category. Try adjusting your filters!
              </p>
            </motion.div>
          )}
        </div>
      </section>
      
    </div>
  );
};