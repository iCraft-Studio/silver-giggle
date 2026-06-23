import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Loader2, Save } from 'lucide-react';
import { supabase } from '../lib/supabase';

type EditListingModalProps = {
  isOpen: boolean;
  onClose: () => void;
  productId: string | null;
  onSuccess: (updatedItem: any) => void;
};

export const EditListingModal: React.FC<EditListingModalProps> = ({ isOpen, onClose, productId, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  
  const [formData, setFormData] = useState({
    title: '',
    price: '',
    description: '',
    is_available: true
  });

  useEffect(() => {
    if (isOpen && productId) {
      fetchProduct();
    }
  }, [isOpen, productId]);

  const fetchProduct = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('products')
      .select('title, price, description, is_available')
      .eq('id', productId)
      .single();

    if (!error && data) {
      setFormData({
        title: data.title,
        price: data.price.toString(),
        description: data.description || '',
        is_available: data.is_available
      });
    }
    setLoading(false);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!productId) return;
    setSaving(true);

    const updates = {
      title: formData.title,
      price: parseFloat(formData.price),
      description: formData.description,
      is_available: formData.is_available
    };

    const { error } = await supabase
      .from('products')
      .update(updates)
      .eq('id', productId);

    setSaving(false);

    if (!error) {
      onSuccess({ id: productId, ...updates });
      onClose();
    } else {
      alert("Failed to update listing.");
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
        <motion.div 
          initial={{ opacity: 0 }} 
          animate={{ opacity: 1 }} 
          exit={{ opacity: 0 }} 
          onClick={onClose} 
          className="absolute inset-0 bg-black/40 backdrop-blur-sm" 
        />
        
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="bg-white rounded-[2rem] shadow-2xl w-full max-w-lg relative z-10 overflow-hidden flex flex-col max-h-[90vh]"
        >
          {/* Header */}
          <div className="flex justify-between items-center p-6 border-b border-gray-100">
            <h2 className="text-xl font-bold text-black tracking-tight">Edit Listing</h2>
            <button onClick={onClose} className="p-2 text-gray-400 hover:bg-gray-100 hover:text-black rounded-full transition-colors">
              <X size={20} />
            </button>
          </div>

          {/* Body */}
          <div className="p-6 overflow-y-auto flex-1 bg-gray-50/50">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-12">
                <Loader2 size={32} className="animate-spin text-blue-600 mb-4" />
                <p className="text-gray-500 font-medium">Loading details...</p>
              </div>
            ) : (
              <form id="edit-listing-form" onSubmit={handleSave} className="space-y-5">
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">Title</label>
                  <input required type="text" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} className="w-full bg-white border border-gray-200 focus:border-blue-600 rounded-xl px-4 py-3 text-sm font-medium text-black outline-none transition-all" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">Price ($)</label>
                  <input required type="number" step="0.01" value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} className="w-full bg-white border border-gray-200 focus:border-blue-600 rounded-xl px-4 py-3 text-sm font-medium text-black outline-none transition-all" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">Description</label>
                  <textarea rows={4} value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="w-full bg-white border border-gray-200 focus:border-blue-600 rounded-xl px-4 py-3 text-sm font-medium text-black outline-none transition-all resize-none" />
                </div>
                <div className="flex items-center space-x-3 bg-white border border-gray-200 rounded-xl p-4">
                  <input type="checkbox" id="is_available" checked={formData.is_available} onChange={e => setFormData({...formData, is_available: e.target.checked})} className="w-5 h-5 accent-blue-600 rounded" />
                  <label htmlFor="is_available" className="text-sm font-bold text-black cursor-pointer">Listing is Active & Available</label>
                </div>
              </form>
            )}
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-gray-100 bg-white flex justify-end gap-3">
            <button onClick={onClose} type="button" className="px-6 py-2.5 rounded-full font-bold text-gray-500 hover:bg-gray-100 transition-colors">Cancel</button>
            <button type="submit" form="edit-listing-form" disabled={saving || loading} className="flex items-center space-x-2 bg-blue-600 text-white px-6 py-2.5 rounded-full font-bold shadow-lg shadow-blue-600/20 hover:bg-blue-700 transition-colors disabled:opacity-50">
              {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
              <span>Save Changes</span>
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};