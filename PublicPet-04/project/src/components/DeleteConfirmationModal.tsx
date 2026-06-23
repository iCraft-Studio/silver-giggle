import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, X, Loader2 } from 'lucide-react';

type DeleteConfirmationModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
};

export const DeleteConfirmationModal: React.FC<DeleteConfirmationModalProps> = ({ isOpen, onClose, onConfirm }) => {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleConfirm = async () => {
    setIsDeleting(true);
    await onConfirm();
    setIsDeleting(false);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
        <motion.div 
          initial={{ opacity: 0 }} 
          animate={{ opacity: 1 }} 
          exit={{ opacity: 0 }} 
          onClick={!isDeleting ? onClose : undefined} 
          className="absolute inset-0 bg-black/40 backdrop-blur-sm" 
        />
        
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="bg-white rounded-[2rem] shadow-2xl w-full max-w-sm relative z-10 overflow-hidden flex flex-col"
        >
          {/* Header */}
          <div className="flex justify-between items-center p-6 pb-2">
            <div className="w-12 h-12 bg-red-50 text-red-600 rounded-full flex items-center justify-center mb-2">
              <AlertTriangle size={24} />
            </div>
            {!isDeleting && (
              <button onClick={onClose} className="p-2 text-gray-400 hover:bg-gray-100 hover:text-black rounded-full transition-colors absolute top-4 right-4">
                <X size={20} />
              </button>
            )}
          </div>

          {/* Body */}
          <div className="px-6 pb-6">
            <h2 className="text-xl font-bold text-black tracking-tight mb-2">Delete Listing?</h2>
            <p className="text-gray-500 text-sm font-medium leading-relaxed">
              Are you sure you want to delete this listing? This action cannot be undone and it will be permanently removed from your shop.
            </p>
          </div>

          {/* Footer */}
          <div className="p-4 bg-gray-50 flex justify-end gap-3 border-t border-gray-100">
            <button 
              onClick={onClose} 
              disabled={isDeleting}
              className="px-6 py-2.5 rounded-full font-bold text-gray-600 hover:bg-gray-200 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button 
              onClick={handleConfirm} 
              disabled={isDeleting}
              className="flex items-center space-x-2 bg-red-600 text-white px-6 py-2.5 rounded-full font-bold shadow-lg shadow-red-600/20 hover:bg-red-700 transition-colors disabled:opacity-50"
            >
              {isDeleting ? <Loader2 size={16} className="animate-spin" /> : null}
              <span>{isDeleting ? 'Deleting...' : 'Yes, Delete'}</span>
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};