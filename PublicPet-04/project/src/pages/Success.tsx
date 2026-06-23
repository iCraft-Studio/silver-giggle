import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Clock, Package, ArrowRight } from 'lucide-react';

export const Success: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-white font-sans flex flex-col items-center justify-center p-6 text-center relative overflow-hidden">
      
      {/* Soft Background Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-50 rounded-full blur-3xl -z-10"></div>

      <motion.div 
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 200, damping: 20 }}
        className="w-24 h-24 bg-indigo-600 text-white rounded-[2rem] flex items-center justify-center mb-8 shadow-2xl shadow-indigo-600/30"
      >
        <Clock size={48} />
      </motion.div>

      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.5 }}
        className="max-w-md"
      >
        <h1 className="text-3xl sm:text-4xl font-semibold text-gray-900 tracking-tight mb-4">Payment Pending Confirmation</h1>
        <p className="text-gray-500 font-medium text-base md:text-lg mb-8 leading-relaxed">
          We have received your payment request and are currently verifying the transfer. This usually takes between <strong className="text-gray-900">0 to 30 minutes</strong>. Once confirmed, your funds will be safely locked in our escrow vault.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center space-y-3 sm:space-y-0 sm:space-x-4">
          <button 
            onClick={() => navigate('/dashboard')}
            className="w-full sm:w-auto bg-gray-900 text-white px-8 py-4 rounded-full font-semibold flex items-center justify-center space-x-2 hover:bg-gray-800 transition-colors"
          >
            <Package size={18} />
            <span>Track Order Status</span>
          </button>
          
          <button 
            onClick={() => navigate('/')}
            className="w-full sm:w-auto bg-gray-50 text-gray-900 px-8 py-4 rounded-full font-semibold flex items-center justify-center space-x-2 hover:bg-gray-100 transition-colors"
          >
            <span>Back to Home</span>
            <ArrowRight size={18} />
          </button>
        </div>
      </motion.div>
    </div>
  );
};