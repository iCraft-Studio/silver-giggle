import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Tag, Image as ImageIcon, Plus, MapPin, Package } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface CreateListingModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  onSuccess: (newListing: any) => void;
}

const HEALTH_OPTIONS = ['Vaccinated', 'Dewormed', 'Microchipped', 'Vet Checked', 'Health Certificate'];
const INCLUDED_OPTIONS = ['Starter Food', 'Toys', 'Mom\'s Scent Blanket', 'Registration Papers', 'Collar & Leash'];

export const CreateListingModal: React.FC<CreateListingModalProps> = ({ isOpen, onClose, userId, onSuccess }) => {
  const [submitting, setSubmitting] = useState(false);
  const [loadingText, setLoadingText] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Base State
  const [formData, setFormData] = useState({
    title: '', price: '', category: 'pet_listing', description: '', address: '', stock_quantity: '1'
  });

  // Pet Specific State
  const [petData, setPetData] = useState({
    pet_name: '', breed: '', gender: 'Male', male_quantity: '0', female_quantity: '0',
    age: '', birthday: '', color: '', weight: '', ready_to_go: true, ready_date: ''
  });

  // Array States for Chips
  const [healthInfo, setHealthInfo] = useState<string[]>([]);
  const [whatsIncluded, setWhatsIncluded] = useState<string[]>([]);

  // Images State
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);

  useEffect(() => {
    return () => previewUrls.forEach(url => URL.revokeObjectURL(url));
  }, [previewUrls]);

  const handleClose = () => {
    setFormData({ title: '', price: '', category: 'pet_listing', description: '', address: '', stock_quantity: '1' });
    setPetData({ pet_name: '', breed: '', gender: 'Male', male_quantity: '0', female_quantity: '0', age: '', birthday: '', color: '', weight: '', ready_to_go: true, ready_date: '' });
    setHealthInfo([]);
    setWhatsIncluded([]);
    setSelectedFiles([]);
    setPreviewUrls([]);
    onClose();
  };

  const toggleChip = (item: string, state: string[], setState: React.Dispatch<React.SetStateAction<string[]>>) => {
    setState(prev => prev.includes(item) ? prev.filter(i => i !== item) : [...prev, item]);
  };

  const compressImage = (file: File): Promise<File> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let { width, height } = img;
          if (width > height && width > 1200) { height *= 1200 / width; width = 1200; }
          else if (height > 1200) { width *= 1200 / height; height = 1200; }
          canvas.width = width; canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);
          canvas.toBlob(blob => {
            if (blob) resolve(new File([blob], `${Date.now()}-${Math.random().toString(36).substring(7)}.jpeg`, { type: 'image/jpeg' }));
            else reject(new Error('Compression failed'));
          }, 'image/jpeg', 0.7);
        };
      };
      reader.onerror = reject;
    });
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files);
      const newPreviews = filesArray.map(file => URL.createObjectURL(file));
      setSelectedFiles(prev => [...prev, ...filesArray]);
      setPreviewUrls(prev => [...prev, ...newPreviews]);
    }
  };

  const removeImage = (index: number) => {
    URL.revokeObjectURL(previewUrls[index]);
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
    setPreviewUrls(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    
    try {
      const uploadedImageUrls: string[] = [];
      for (const file of selectedFiles) {
        setLoadingText('Compressing images...');
        const compressedFile = await compressImage(file);
        setLoadingText('Uploading images...');
        const { data: uploadData, error } = await supabase.storage.from('product-images').upload(`${userId}/${compressedFile.name}`, compressedFile);
        if (error) throw error;
        const { data: { publicUrl } } = supabase.storage.from('product-images').getPublicUrl(uploadData.path);
        uploadedImageUrls.push(publicUrl);
      }

      setLoadingText('Publishing listing...');
      
      const newListing = {
        seller_id: userId,
        title: formData.title,
        price: parseFloat(formData.price),
        category: formData.category,
        description: formData.description,
        address: formData.address,
        stock_quantity: parseInt(formData.stock_quantity),
        image_url: uploadedImageUrls[0] || '',
        extra_images: uploadedImageUrls.slice(1),
        ...(formData.category === 'pet_listing' && {
          pet_name: petData.pet_name,
          breed: petData.breed,
          gender: petData.gender,
          male_quantity: parseInt(petData.male_quantity) || 0,
          female_quantity: parseInt(petData.female_quantity) || 0,
          age: petData.age,
          birthday: petData.birthday || null,
          color: petData.color,
          weight: petData.weight,
          ready_to_go: petData.ready_to_go,
          ready_date: !petData.ready_to_go ? petData.ready_date : null,
          health_info: healthInfo,
          whats_included: whatsIncluded
        })
      };

      const { data, error } = await supabase.from('products').insert([newListing]).select().single();
      if (error) throw error;
      onSuccess(data);
      handleClose();

    } catch (error) {
      console.error(error);
      alert("Failed to upload. Please try again.");
    } finally {
      setSubmitting(false);
      setLoadingText('');
    }
  };

  const InputClass = "w-full p-4 bg-gray-50 border-2 border-transparent focus:border-indigo-600 focus:bg-white rounded-2xl text-gray-900 font-medium outline-none transition-all";
  const LabelClass = "block text-sm font-medium text-gray-900 mb-2";

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center md:items-center sm:p-6 pointer-events-none">
          
          {/* Backdrop Layer */}
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }} 
            className="absolute inset-0 bg-black/40 backdrop-blur-sm pointer-events-auto" 
            onClick={handleClose} 
          />
          
          {/* Modal Container */}
          <motion.div 
            initial={{ opacity: 0, y: 100, scale: 0.95 }} 
            animate={{ opacity: 1, y: 0, scale: 1 }} 
            exit={{ opacity: 0, y: 100, scale: 0.95 }} 
            className="relative w-full md:w-[700px] bg-white rounded-t-[2rem] md:rounded-[2rem] shadow-2xl pointer-events-auto overflow-hidden flex flex-col max-h-[90vh] md:max-h-[85vh]"
          >
            
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-white sticky top-0 z-10">
              <h2 className="text-2xl font-semibold text-gray-900 tracking-tight">New Listing</h2>
              <button onClick={handleClose} className="p-2 bg-gray-50 hover:bg-gray-100 rounded-full text-gray-900 transition-colors"><X size={20} /></button>
            </div>

            <div className="p-6 overflow-y-auto hide-scrollbar flex-1 bg-white">
              <form id="listing-form" onSubmit={handleSubmit} className="space-y-8">
                
                {/* 1. IMAGES */}
                <div>
                  <label className={LabelClass}>Product Images</label>
                  <input type="file" multiple accept="image/*" className="hidden" ref={fileInputRef} onChange={handleImageSelect} />
                  {previewUrls.length === 0 ? (
                    <div onClick={() => fileInputRef.current?.click()} className="w-full h-40 border-2 border-dashed border-indigo-200 rounded-3xl flex flex-col items-center justify-center bg-indigo-50/50 hover:bg-indigo-50 cursor-pointer group transition-colors">
                      <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm text-indigo-600 group-hover:scale-110 transition-transform mb-3"><ImageIcon size={24} /></div>
                      <span className="text-sm font-medium text-indigo-600">Upload high-quality photos</span>
                    </div>
                  ) : (
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                      {previewUrls.map((url, idx) => (
                        <div key={idx} className="relative aspect-square rounded-2xl overflow-hidden border border-gray-100 group">
                          <img src={url} className="w-full h-full object-cover" alt="Preview" />
                          <button type="button" onClick={() => removeImage(idx)} className="absolute top-1.5 right-1.5 w-6 h-6 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center text-red-500 opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"><X size={14} /></button>
                        </div>
                      ))}
                      <div onClick={() => fileInputRef.current?.click()} className="aspect-square border-2 border-dashed border-gray-200 rounded-2xl flex flex-col items-center justify-center bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer text-gray-400"><Plus size={24} /></div>
                    </div>
                  )}
                </div>

                {/* 2. CORE DETAILS */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-lg text-gray-900 border-b border-gray-100 pb-2">Core Details</h3>
                  <div>
                    <label className={LabelClass}>Title</label>
                    <input required type="text" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} placeholder="e.g. Golden Retriever Puppy" className={InputClass} />
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className={LabelClass}>Category</label>
                      <select value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} className={`${InputClass} appearance-none cursor-pointer`}>
                        <option value="pet_listing">Live Pet</option>
                        <option value="food">Food</option>
                        <option value="accessory">Accessory</option>
                      </select>
                    </div>
                    <div>
                      <label className={LabelClass}>Price ($)</label>
                      <input required type="number" min="0" step="0.01" value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} placeholder="0.00" className={InputClass} />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className={LabelClass}>Location (City, State)</label>
                      <input required type="text" value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} placeholder="e.g. Austin, TX" className={InputClass} />
                    </div>
                    <div>
                      <label className={LabelClass}>Total Stock Quantity</label>
                      <input required type="number" min="1" value={formData.stock_quantity} onChange={e => setFormData({...formData, stock_quantity: e.target.value})} className={InputClass} />
                    </div>
                  </div>

                  <div>
                    <label className={LabelClass}>Description</label>
                    <textarea rows={3} value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} placeholder="Describe the item or pet in detail..." className={`${InputClass} resize-none`} />
                  </div>
                </div>

                {/* 3. CONDITIONAL PET LOGISTICS */}
                <AnimatePresence>
                  {formData.category === 'pet_listing' && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="space-y-6 overflow-hidden pt-4">
                      <h3 className="font-semibold text-lg text-gray-900 border-b border-gray-100 pb-2">Pet Specifics</h3>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className={LabelClass}>Pet Name (If applicable)</label>
                          <input type="text" value={petData.pet_name} onChange={e => setPetData({...petData, pet_name: e.target.value})} placeholder="e.g. Bella" className={InputClass} />
                        </div>
                        <div>
                          <label className={LabelClass}>Breed</label>
                          <input required type="text" value={petData.breed} onChange={e => setPetData({...petData, breed: e.target.value})} placeholder="e.g. Poodle" className={InputClass} />
                        </div>
                      </div>

                      <div className="p-4 bg-gray-50 border border-gray-100 rounded-2xl space-y-4">
                        <div>
                          <label className={LabelClass}>Gender / Litter Type</label>
                          <select value={petData.gender} onChange={e => setPetData({...petData, gender: e.target.value})} className={`${InputClass} bg-white appearance-none cursor-pointer`}>
                            <option value="Male">Single Male</option>
                            <option value="Female">Single Female</option>
                            <option value="Multiple">Multiple / Litter</option>
                          </select>
                        </div>
                        
                        {petData.gender === 'Multiple' && (
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className={LabelClass}># of Males</label>
                              <input type="number" min="0" value={petData.male_quantity} onChange={e => setPetData({...petData, male_quantity: e.target.value})} className={`${InputClass} bg-white`} />
                            </div>
                            <div>
                              <label className={LabelClass}># of Females</label>
                              <input type="number" min="0" value={petData.female_quantity} onChange={e => setPetData({...petData, female_quantity: e.target.value})} className={`${InputClass} bg-white`} />
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className={LabelClass}>Age</label>
                          <input required type="text" value={petData.age} onChange={e => setPetData({...petData, age: e.target.value})} placeholder="e.g. 8 Weeks" className={InputClass} />
                        </div>
                        <div>
                          <label className={LabelClass}>Birthday (Optional)</label>
                          <input type="date" value={petData.birthday} onChange={e => setPetData({...petData, birthday: e.target.value})} className={InputClass} />
                        </div>
                        <div>
                          <label className={LabelClass}>Color / Markings</label>
                          <input type="text" value={petData.color} onChange={e => setPetData({...petData, color: e.target.value})} placeholder="e.g. Fawn & White" className={InputClass} />
                        </div>
                        <div>
                          <label className={LabelClass}>Estimated Weight</label>
                          <input type="text" value={petData.weight} onChange={e => setPetData({...petData, weight: e.target.value})} placeholder="e.g. 10 lbs" className={InputClass} />
                        </div>
                      </div>

                      <div className="p-4 bg-gray-50 border border-gray-100 rounded-2xl space-y-4">
                        <label className="flex items-center space-x-3 cursor-pointer">
                          <input type="checkbox" checked={petData.ready_to_go} onChange={e => setPetData({...petData, ready_to_go: e.target.checked})} className="w-5 h-5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-600 transition-all" />
                          <span className="font-medium text-gray-900">Ready to go home now?</span>
                        </label>
                        {!petData.ready_to_go && (
                          <div>
                            <label className={LabelClass}>When will they be ready?</label>
                            <input type="date" required={!petData.ready_to_go} value={petData.ready_date} onChange={e => setPetData({...petData, ready_date: e.target.value})} className={`${InputClass} bg-white`} />
                          </div>
                        )}
                      </div>

                      {/* Interactive Chips for Logistics */}
                      <div>
                        <label className={LabelClass}>Health Status (Select all that apply)</label>
                        <div className="flex flex-wrap gap-2">
                          {HEALTH_OPTIONS.map(opt => (
                            <button type="button" key={opt} onClick={() => toggleChip(opt, healthInfo, setHealthInfo)} className={`px-4 py-2 rounded-full text-xs font-medium transition-colors border ${healthInfo.includes(opt) ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-gray-500 border-gray-200 hover:border-indigo-600'}`}>
                              {opt}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div>
                        <label className={LabelClass}>What's included when taking {petData.pet_name || 'them'} home?</label>
                        <div className="flex flex-wrap gap-2">
                          {INCLUDED_OPTIONS.map(opt => (
                            <button type="button" key={opt} onClick={() => toggleChip(opt, whatsIncluded, setWhatsIncluded)} className={`px-4 py-2 rounded-full text-xs font-medium transition-colors border ${whatsIncluded.includes(opt) ? 'bg-green-600 text-white border-green-600' : 'bg-white text-gray-500 border-gray-200 hover:border-green-600'}`}>
                              {opt}
                            </button>
                          ))}
                        </div>
                      </div>

                    </motion.div>
                  )}
                </AnimatePresence>

              </form>
            </div>

            <div className="p-6 border-t border-gray-100 bg-white z-10 sticky bottom-0">
              <button type="submit" form="listing-form" disabled={submitting || selectedFiles.length === 0} className="w-full bg-indigo-600 text-white py-4 rounded-full font-semibold hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-600/20 disabled:opacity-70 flex justify-center items-center">
                {submitting ? (<><div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-3"></div>{loadingText}</>) : "Publish Listing"}
              </button>
              {selectedFiles.length === 0 && !submitting && <p className="text-center text-xs text-red-500 font-medium mt-2">Please upload at least one image.</p>}
            </div>

          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};