import React, { useState, useEffect, useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { PawPrint, ShoppingBag, Heart, ArrowRight, ShieldCheck, Star, Truck } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';
import { ProductCard } from '../components/ProductCard'; 

const SkeletonCard = () => (
  <div className="flex flex-col space-y-4 w-full">
    <div className="w-full h-56 md:h-64 bg-gray-100 rounded-[2rem] animate-pulse"></div>
    <div className="space-y-2">
      <div className="h-4 bg-gray-100 rounded animate-pulse w-3/4"></div>
      <div className="h-4 bg-gray-100 rounded animate-pulse w-1/4"></div>
    </div>
  </div>
);

export const Home: React.FC = () => {
  const navigate = useNavigate();
  const [featuredItems, setFeaturedItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"]
  });

  const parallaxY1 = useTransform(scrollYProgress, [0, 1], [0, -300]);
  const parallaxY2 = useTransform(scrollYProgress, [0, 1], [0, 200]);
  const rotatePaw = useTransform(scrollYProgress, [0, 1], [0, 360]);

  useEffect(() => {
    const fetchFeatured = async () => {
      const { data, error } = await supabase
        .from('products')
        .select(`
          id, title, price, category, image_url, address, breed, gender, age, views,
          seller:users(full_name, avatar_url, is_verified)
        `)
        .eq('is_available', true)
        .order('created_at', { ascending: false })
        .limit(4);

      if (!error && data) {
        setFeaturedItems(data);
      }
      setTimeout(() => setLoading(false), 800); 
    };

    fetchFeatured();
  }, []);

  return (
    <div ref={containerRef} className="min-h-screen bg-white pb-24 font-sans overflow-clip relative w-full max-w-[100vw]">
      
      {/* Scroll-Reactive Background Decorations */}
      <motion.div 
        style={{ y: parallaxY1, rotate: rotatePaw }} 
        className="absolute top-1/4 -right-12 text-indigo-50 opacity-60 pointer-events-none z-0 hidden md:block"
      >
        <PawPrint size={250} />
      </motion.div>
      <motion.div 
        style={{ y: parallaxY2, rotate: rotatePaw }} 
        className="absolute bottom-1/4 -left-12 text-gray-50 opacity-60 pointer-events-none z-0 hidden md:block"
      >
        <PawPrint size={150} />
      </motion.div>

      {/* HERO SECTION - Reduced top padding here (pt-4 md:pt-12 lg:pt-16) */}
      <section className="relative z-10 pt-4 pb-12 md:pt-12 lg:pt-16 lg:pb-24 px-6 md:px-12 lg:px-24 flex flex-col lg:flex-row items-center justify-between gap-10 lg:gap-12 w-full">
        
        {/* Left Content Area */}
        <motion.div 
          className="flex-1 text-center lg:text-left w-full mt-2 lg:mt-0 order-2 lg:order-1"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, type: "spring", bounce: 0.4 }}
        >
          <motion.div 
            whileHover={{ scale: 1.05 }}
            className="inline-flex items-center space-x-2 bg-indigo-50 text-indigo-600 px-4 py-2 rounded-full mb-4 md:mb-6 font-medium text-xs md:text-sm shadow-sm"
          >
            <PawPrint size={16} />
            <span>Welcome to Public Pet</span>
          </motion.div>
          
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-semibold text-gray-900 tracking-tight leading-tight max-w-xl mx-auto lg:mx-0">
            Everything for your <span className="text-indigo-600 inline-block">best friend.</span> All in one place.
          </h1>
          
          <p className="mt-4 md:mt-6 text-gray-500 font-medium text-base md:text-xl max-w-lg mx-auto lg:mx-0">
            Discover local companions, premium nutrition, and luxury accessories. Buy and sell with confidence across your neighborhood.
          </p>
          
          <div className="mt-8 flex flex-col sm:flex-row justify-center lg:justify-start space-y-3 sm:space-y-0 sm:space-x-4 w-full">
            <motion.button 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate('/shop')}
              className="w-full sm:w-auto bg-indigo-600 text-white px-8 py-4 rounded-full font-medium flex items-center justify-center space-x-2 hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-600/20"
            >
              <span>Shop Essentials</span>
              <ShoppingBag size={18} />
            </motion.button>
            <motion.button 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate('/shop/pet_listing')}
              className="w-full sm:w-auto bg-white border-2 border-gray-100 text-gray-900 px-8 py-4 rounded-full font-medium flex items-center justify-center space-x-2 hover:border-indigo-600 hover:text-indigo-600 transition-colors"
            >
              <span>Meet Local Pets</span>
              <Heart size={18} />
            </motion.button>
          </div>
        </motion.div>

        {/* Right Image Collage */}
        <motion.div 
          className="flex-1 relative w-full h-[320px] sm:h-[450px] lg:h-[550px] max-w-[340px] sm:max-w-[400px] lg:max-w-[500px] mx-auto order-1 lg:order-2 mb-6 lg:mb-0"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.7, type: "spring", bounce: 0.4 }}
        >
          <motion.div 
            className="absolute right-0 top-0 w-[75%] h-[80%] rounded-[2rem] overflow-hidden shadow-2xl border-4 border-white z-10 bg-gray-100"
            animate={{ y: [0, -10, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          >
            <img 
              src="https://images.unsplash.com/photo-1583337130417-3346a1be7dee?auto=format&fit=crop&w=800&q=80" 
              alt="Happy Dog" 
              className="w-full h-full object-cover"
            />
          </motion.div>
          
          <motion.div 
            className="absolute left-0 bottom-[10%] w-[45%] h-[45%] rounded-3xl overflow-hidden shadow-xl border-4 border-white z-20 bg-gray-100"
            animate={{ y: [0, 15, 0] }}
            transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
          >
            <img 
              src="https://didofido.com/wp-content/uploads/2024/11/pet-apparel-and-accessories.jpg" 
              alt="Pet Accessories" 
              className="w-full h-full object-cover"
            />
          </motion.div>

          <motion.div 
            className="absolute right-[5%] -bottom-[5%] w-[40%] h-[40%] rounded-[2rem] overflow-hidden shadow-lg border-4 border-white z-30 bg-gray-100"
            animate={{ y: [0, -8, 0] }}
            transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
          >
            <img 
              src="https://images.unsplash.com/photo-1589924691995-400dc9ecc119?auto=format&fit=crop&w=400&q=80" 
              alt="Premium Pet Food" 
              className="w-full h-full object-cover"
            />
          </motion.div>
        </motion.div>
      </section>

      {/* TRUST BANNER SECTION */}
      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: false, margin: "0px 0px -50px 0px" }}
        transition={{ duration: 0.5, type: "spring" }}
        className="relative z-10 bg-gray-50 border-y border-gray-100 py-6 md:py-8 px-6 md:px-12 lg:px-24 flex flex-col sm:flex-row flex-wrap items-start sm:items-center justify-center gap-4 md:gap-8 mx-4 md:mx-12 rounded-3xl mt-4 md:mt-0"
      >
        {[
          { icon: ShieldCheck, text: "Verified Breeders" },
          { icon: Star, text: "Premium Marketplace" },
          { icon: Truck, text: "Worldwide Shipping" }
        ].map((item, idx) => (
          <motion.div 
            key={idx}
            whileHover={{ scale: 1.05 }}
            className="flex items-center space-x-3 text-gray-900 font-medium text-sm md:text-base cursor-pointer"
          >
            <item.icon className="text-indigo-600 flex-shrink-0" size={24} />
            <span>{item.text}</span>
          </motion.div>
        ))}
      </motion.div>

      {/* RECENTLY ADDED SECTION */}
      <section className="relative z-10 py-16 md:py-24 px-6 md:px-12 lg:px-24">
        <motion.div 
          className="flex justify-between items-end mb-8 md:mb-10"
          initial={{ opacity: 0, x: -20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: false, margin: "0px 0px -50px 0px" }}
        >
          <div>
            <h2 className="text-2xl md:text-4xl font-semibold text-gray-900 tracking-tight">Fresh on the Market</h2>
            <p className="text-gray-500 mt-1 md:mt-2 font-medium text-sm md:text-base">The latest listings and premium drops.</p>
          </div>
          <motion.button 
            whileHover={{ x: 5 }}
            onClick={() => navigate('/shop/all')}
            className="flex text-indigo-600 font-medium items-center space-x-1 hover:text-indigo-700 transition-colors text-sm md:text-base"
          >
            <span className="hidden sm:inline">View All</span>
            <ArrowRight size={18} />
          </motion.button>
        </motion.div>

        {/* DYNAMIC GRID - EXCLUSIVELY USING PRODUCTCARD COMPONENT */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 md:gap-8">
          {loading ? (
            Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)
          ) : featuredItems.length > 0 ? (
            featuredItems.map((item) => (
              <ProductCard 
                key={item.id} 
                product={item} 
              />
            ))
          ) : (
            <div className="col-span-full py-16 text-center text-gray-400">
              <PawPrint size={48} className="mx-auto mb-4 opacity-20" />
              <p className="font-medium">No inventory loaded yet. Ready for your first drop!</p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};