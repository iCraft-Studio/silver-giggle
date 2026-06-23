import React from 'react';
import { motion } from 'framer-motion';
import { PawPrint, PackageOpen, LayoutGrid, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const hubCategories = [
  { 
    id: 'pet_listing', 
    title: 'Meet Local Pets', 
    description: 'Find your new best friend from verified local breeders and shelters.',
    icon: PawPrint,
    color: 'bg-blue-50 text-blue-600',
    border: 'hover:border-blue-600'
  },
  { 
    id: 'food', 
    title: 'Premium Nutrition', 
    description: 'Top-tier kibble, raw diets, and treats for every dietary need.',
    icon: PackageOpen,
    color: 'bg-green-50 text-green-600',
    border: 'hover:border-green-600'
  },
  { 
    id: 'accessory', 
    title: 'Luxury Accessories', 
    description: 'Collars, beds, and toys to spoil your companion.',
    icon: Sparkles,
    color: 'bg-purple-50 text-purple-600',
    border: 'hover:border-purple-600'
  },
  { 
    id: 'all', 
    title: 'Browse Everything', 
    description: 'Not sure what you need? Explore the entire marketplace.',
    icon: LayoutGrid,
    color: 'bg-gray-100 text-gray-600',
    border: 'hover:border-black'
  }
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
};

const cardVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: { type: "spring", bounce: 0.4 } }
};

export const ShopHub: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-white pt-12 md:pt-24 pb-32 px-6 md:px-12 lg:px-24 font-sans flex flex-col items-center justify-center">
      
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-10 md:mb-12"
      >
        <h1 className="text-3xl md:text-4xl font-bold text-black tracking-tight mb-3">
          What are you looking for?
        </h1>
        <p className="text-gray-500 font-medium text-base md:text-lg max-w-md mx-auto">
          Select a category to explore verified listings across the marketplace.
        </p>
      </motion.div>

      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-3xl mx-auto"
      >
        {hubCategories.map((cat) => (
          <motion.div
            key={cat.id}
            variants={cardVariants}
            whileHover={{ y: -4, scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => navigate(`/shop/${cat.id}`)}
            className={`cursor-pointer bg-white p-5 rounded-3xl border-2 border-gray-100 shadow-sm hover:shadow-lg transition-all duration-300 ${cat.border} group`}
          >
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 transition-transform group-hover:scale-110 ${cat.color}`}>
              <cat.icon size={24} />
            </div>
            <h2 className="text-lg font-bold text-black mb-1">{cat.title}</h2>
            <p className="text-gray-500 font-medium text-sm leading-snug">{cat.description}</p>
          </motion.div>
        ))}
      </motion.div>

    </div>
  );
};