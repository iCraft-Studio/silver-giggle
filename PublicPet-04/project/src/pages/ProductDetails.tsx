import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, MessageSquare, ShieldCheck, MapPin, 
  ChevronLeft, ChevronRight, User, Heart, CreditCard, Share2,
  Star, Flag, Send, Loader2, Eye, CheckCircle2
} from 'lucide-react';
import { supabase } from '../lib/supabase';

// --- TYPES ---
type ProductDetail = {
  id: string;
  seller_id: string;
  title: string;
  description: string;
  price: number;
  category: 'pet_listing' | 'food' | 'accessory';
  image_url: string;
  is_available: boolean;
  created_at: string;
  stock_quantity: number;
  updated_at: string;
  views: number;
  extra_images: string[] | null;
  address: string;
  pet_name?: string;
  breed?: string;
  gender?: string;
  male_quantity?: number;
  female_quantity?: number;
  age?: string;
  birthday?: string;
  ready_to_go?: boolean;
  ready_date?: string;
  color?: string;
  weight?: string;
  whats_included?: string[];
  health_info?: string[];
  seller?: {
    full_name: string;
    avatar_url: string;
    is_verified: boolean;
  };
};

type Review = {
  id: string;
  rating: number;
  comment: string;
  created_at: string;
  user: {
    full_name: string;
    avatar_url: string;
  };
};

// --- SKELETON LOADER ---
const ProductDetailsSkeleton = () => (
  <div className="min-h-screen bg-white pb-48 pt-6 md:pt-10 font-sans">
    <div className="max-w-7xl mx-auto px-6 md:px-12 grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16">
      <div className="space-y-4 w-full">
        <div className="w-24 h-10 bg-gray-100 rounded-full animate-pulse mb-4"></div>
        <div className="w-full aspect-square md:aspect-[4/3] lg:aspect-square bg-gray-100 rounded-[2rem] animate-pulse"></div>
        <div className="flex space-x-3 overflow-hidden">
          {[1, 2, 3].map(i => <div key={i} className="w-20 h-20 bg-gray-100 rounded-2xl animate-pulse flex-shrink-0"></div>)}
        </div>
      </div>

      <div className="flex flex-col space-y-8 w-full pt-2 lg:pt-12">
        <div className="space-y-4">
          <div className="flex justify-between">
            <div className="w-20 h-6 bg-gray-100 rounded-full animate-pulse"></div>
            <div className="w-16 h-6 bg-gray-100 rounded-full animate-pulse"></div>
          </div>
          <div className="w-3/4 h-10 md:h-12 bg-gray-100 rounded-xl animate-pulse"></div>
          <div className="w-1/3 h-8 md:h-10 bg-gray-100 rounded-xl animate-pulse"></div>
        </div>
        
        <div className="hidden lg:grid grid-cols-2 gap-4 border-y border-gray-100 py-6">
          <div className="h-14 bg-gray-100 rounded-full animate-pulse"></div>
          <div className="h-14 bg-gray-100 rounded-full animate-pulse"></div>
        </div>

        <div className="w-full h-24 bg-gray-100 rounded-[2rem] animate-pulse"></div>

        <div className="space-y-4">
          <div className="w-1/4 h-6 bg-gray-100 rounded-md animate-pulse"></div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map(i => <div key={i} className="h-16 bg-gray-100 rounded-2xl animate-pulse"></div>)}
          </div>
        </div>
      </div>
    </div>
  </div>
);

export const ProductDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const [product, setProduct] = useState<ProductDetail | null>(null);
  const [loading, setLoading] = useState(true);
  
  const [allImages, setAllImages] = useState<string[]>([]);
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  const [addingToCart, setAddingToCart] = useState(false);
  const [addedSuccess, setAddedSuccess] = useState(false);

  const [reviews, setReviews] = useState<Review[]>([]);
  const [newReviewRating, setNewReviewRating] = useState(5);
  const [newReviewText, setNewReviewText] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [isReporting, setIsReporting] = useState(false);

  useEffect(() => {
    const fetchProductDetails = async () => {
      // Safety net: if ID is somehow missing, stop the skeleton immediately
      if (!id) {
        setLoading(false);
        return;
      }
      
      setLoading(true);

      try {
        const { data: productData, error: productError } = await supabase
          .from('products')
          .select(`*, seller:users(full_name, avatar_url, is_verified)`)
          .eq('id', id)
          .single();

        if (!productError && productData) {
          setProduct(productData as ProductDetail);
          const images = [productData.image_url, ...(productData.extra_images || [])].filter(Boolean);
          setAllImages(images);

          // THE FIX: Safe Background View Increment (No .catch() on the builder)
          const incrementViews = async () => {
            await supabase.rpc('increment_product_views', { p_id: id });
          };
          incrementViews();
        }

        const { data: reviewData } = await supabase
          .from('product_reviews')
          .select(`*, user:users(full_name, avatar_url)`)
          .eq('product_id', id)
          .order('created_at', { ascending: false });

        if (reviewData) {
          setReviews(reviewData as unknown as Review[]);
        }
      } catch (err) {
        console.error("Fetch error:", err);
      } finally {
        setTimeout(() => setLoading(false), 500); 
      }
    };

    fetchProductDetails();
  }, [id]);

  const nextImage = () => setActiveImageIndex((prev) => (prev + 1) % allImages.length);
  const prevImage = () => setActiveImageIndex((prev) => (prev - 1 + allImages.length) % allImages.length);

  const handleShare = async () => {
    if (!product) return;
    const shareData = {
      title: product.title,
      text: `Check out ${product.title} on Public Pet!`,
      url: window.location.href,
    };
    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(window.location.href);
        alert("Link copied to clipboard!");
      }
    } catch (err) {
      console.error("Error sharing:", err);
    }
  };

  const handleAddToCart = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) {
      navigate('/auth');
      return;
    }

    setAddingToCart(true);
    const { error } = await supabase.from('cart_items').upsert({
      user_id: session.user.id,
      product_id: product?.id,
      quantity: 1
    }, { onConflict: 'user_id, product_id' });

    setAddingToCart(false);
    if (!error) {
      setAddedSuccess(true);
      setTimeout(() => setAddedSuccess(false), 3000);
    }
  };

  const handleMessageSeller = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) {
      navigate('/auth');
      return;
    }
    navigate(`/messages?user=${product?.seller_id}`);
  };

  const handleCheckout = () => {
    navigate(`/checkout?item=${product?.id}`);
  };

  const handleReportProduct = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) {
      alert("Please log in to report a listing.");
      navigate('/auth');
      return;
    }

    const reason = window.prompt("Why are you reporting this listing? (e.g., Scam, inappropriate content, fake item)");
    if (!reason || reason.trim() === '') return;

    setIsReporting(true);
    const { error } = await supabase.from('product_reports').insert({
      product_id: product?.id,
      reporter_id: session.user.id,
      reason: reason.trim()
    });
    setIsReporting(false);

    if (!error) {
      alert("Report submitted successfully. Our team will review this listing.");
    } else {
      alert("Failed to submit report. Please try again later.");
    }
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newReviewText.trim()) return;

    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) {
      alert("Please log in to leave a review.");
      navigate('/auth');
      return;
    }

    setSubmittingReview(true);
    const { data, error } = await supabase.from('product_reviews').insert({
      product_id: product?.id,
      user_id: session.user.id,
      rating: newReviewRating,
      comment: newReviewText.trim()
    }).select(`*, user:users(full_name, avatar_url)`).single();

    setSubmittingReview(false);

    if (!error && data) {
      setReviews([data as unknown as Review, ...reviews]);
      setNewReviewText('');
      setNewReviewRating(5);
    } else {
      alert("Failed to submit review.");
    }
  };

  if (loading) return <ProductDetailsSkeleton />;

  if (!product) {
    return (
      <div className="min-h-screen bg-white pt-32 px-6 flex flex-col items-center text-center">
        <h1 className="text-2xl font-semibold text-gray-900 mb-2">Product Not Found</h1>
        <p className="text-gray-500 mb-6">This listing may have been removed or sold.</p>
        <button onClick={() => navigate(-1)} className="bg-gray-900 text-white px-6 py-2.5 rounded-full font-semibold">Go Back</button>
      </div>
    );
  }

  const isPet = product.category === 'pet_listing';

  const formattedGender = product.gender === 'Multiple' 
    ? `Litter (${product.male_quantity || 0}M, ${product.female_quantity || 0}F)` 
    : product.gender;

  const averageRating = reviews.length > 0 
    ? (reviews.reduce((acc, rev) => acc + rev.rating, 0) / reviews.length).toFixed(1)
    : 'New';

  const isUnavailable = !product.is_available || product.stock_quantity === 0;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, type: "spring", bounce: 0.3 }}
      className="min-h-screen bg-white pb-48 pt-6 md:pt-10 font-sans"
    >
      <div className="max-w-7xl mx-auto px-6 md:px-12 grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16">
        
        {/* LEFT: IMAGE GALLERY */}
        <div className="space-y-4">
          <div className="flex items-center justify-between mb-4">
            <button 
              onClick={() => navigate(-1)} 
              className="flex items-center space-x-2 text-gray-500 hover:text-gray-900 font-medium text-sm transition-colors bg-gray-50 hover:bg-gray-100 px-4 py-2 rounded-full w-max"
            >
              <ArrowLeft size={16} /> <span>Back</span>
            </button>

            <button 
              onClick={handleShare} 
              className="flex items-center justify-center w-10 h-10 bg-gray-50 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-colors shadow-sm"
              title="Share Product"
            >
              <Share2 size={18} />
            </button>
          </div>

          <div className="relative w-full aspect-square md:aspect-[4/3] lg:aspect-square bg-gray-50 rounded-[2rem] overflow-hidden border border-gray-100 group shadow-sm">
            <AnimatePresence mode="wait">
              <motion.img 
                key={activeImageIndex}
                src={allImages[activeImageIndex]}
                alt={`${product.title} - Image ${activeImageIndex + 1}`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="w-full h-full object-cover"
              />
            </AnimatePresence>

            {isUnavailable && (
              <div className="absolute inset-0 bg-white/50 backdrop-blur-sm flex items-center justify-center z-10">
                <div className="bg-gray-900 text-white font-semibold px-6 py-3 rounded-full text-lg shadow-lg">
                  Out of Stock / Unavailable
                </div>
              </div>
            )}

            {allImages.length > 1 && !isUnavailable && (
              <>
                <button onClick={prevImage} className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/80 backdrop-blur rounded-full flex items-center justify-center text-gray-900 shadow-sm sm:opacity-0 group-hover:opacity-100 transition-opacity"><ChevronLeft size={20} /></button>
                <button onClick={nextImage} className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/80 backdrop-blur rounded-full flex items-center justify-center text-gray-900 shadow-sm sm:opacity-0 group-hover:opacity-100 transition-opacity"><ChevronRight size={20} /></button>
                
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex space-x-2 bg-gray-900/20 backdrop-blur px-3 py-1.5 rounded-full">
                  {allImages.map((_, idx) => (
                    <div key={idx} className={`w-1.5 h-1.5 rounded-full transition-colors ${idx === activeImageIndex ? 'bg-white' : 'bg-white/40'}`} />
                  ))}
                </div>
              </>
            )}
          </div>

          {allImages.length > 1 && (
            <div className="flex space-x-3 overflow-x-auto hide-scrollbar py-2">
              {allImages.map((img, idx) => (
                <button 
                  key={idx} 
                  onClick={() => setActiveImageIndex(idx)}
                  className={`relative w-20 h-20 flex-shrink-0 rounded-2xl overflow-hidden border-2 transition-all ${idx === activeImageIndex ? 'border-indigo-600 shadow-md' : 'border-transparent opacity-60 hover:opacity-100'}`}
                >
                  <img src={img} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* RIGHT: PRODUCT DETAILS */}
        <div className="flex flex-col space-y-8">
          
          <div>
            <div className="flex flex-wrap items-center gap-3 mb-4">
              <span className="bg-indigo-50 text-indigo-600 text-[10px] font-semibold px-3 py-1.5 rounded-full uppercase tracking-wider border border-indigo-100">
                {product.category.replace('_', ' ')}
              </span>
              {reviews.length > 0 && (
                <span className="flex items-center text-xs font-semibold text-yellow-600 bg-yellow-50 px-3 py-1.5 rounded-full border border-yellow-100">
                  <Star size={12} className="fill-yellow-500 text-yellow-500 mr-1" /> {averageRating}
                </span>
              )}
              <span className="flex items-center text-xs font-medium text-gray-500 bg-gray-50 px-3 py-1.5 rounded-full border border-gray-100">
                <MapPin size={12} className="mr-1.5 text-gray-400" /> {product.address || 'USA'}
              </span>
              <span className="flex items-center text-xs font-medium text-gray-500 bg-gray-50 px-3 py-1.5 rounded-full border border-gray-100">
                <Eye size={12} className="mr-1.5 text-gray-400" /> {product.views || 0} views
              </span>
            </div>
            
            <h1 className="text-3xl md:text-4xl font-semibold text-gray-900 tracking-tight leading-tight mb-2">
              {product.title}
            </h1>
            <p className="text-3xl font-semibold text-indigo-600">
              ${product.price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          </div>

          <div className="hidden lg:grid grid-cols-2 gap-4 border-y border-gray-100 py-6">
            <button 
              onClick={handleAddToCart}
              disabled={addingToCart || addedSuccess || isUnavailable}
              className="flex items-center justify-center space-x-2 bg-gray-50 hover:bg-gray-100 text-gray-900 px-6 py-4 rounded-full font-semibold transition-colors disabled:opacity-50"
            >
              {addedSuccess ? (
                <><Heart size={18} className="fill-green-500 text-green-500"/> <span className="text-green-600">Saved</span></>
              ) : (
                <><Heart size={18} /> <span>Save / Add to Cart</span></>
              )}
            </button>
            <button 
              onClick={handleCheckout}
              disabled={isUnavailable}
              className="flex items-center justify-center space-x-2 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-4 rounded-full font-semibold shadow-lg shadow-indigo-600/20 transition-all disabled:opacity-50 disabled:shadow-none"
            >
              <CreditCard size={18} /> <span>Checkout Now</span>
            </button>
          </div>

          {/* SELLER PROFILE CARD */}
          <div 
            onClick={() => navigate(`/profile/${product.seller_id}`)}
            className="bg-gray-50 border border-gray-100 rounded-[2rem] p-5 flex items-center justify-between cursor-pointer hover:bg-gray-100 transition-colors shadow-sm"
          >
            <div className="flex items-center space-x-4">
              {product.seller?.avatar_url ? (
                <img src={product.seller?.avatar_url} className="w-12 h-12 rounded-full object-cover shadow-sm" />
              ) : (
                <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center border border-gray-200 text-gray-400"><User size={20} /></div>
              )}
              <div>
                <div className="flex items-center space-x-1.5">
                  <p className="text-sm font-semibold text-gray-900">{product.seller?.full_name}</p>
                  {product.seller?.is_verified && <img src="/tick.svg" alt="Verified" className="w-3.5 h-3.5" />}
                </div>
                {product.seller?.is_verified ? (
                  <div className="flex items-center space-x-1 text-[10px] font-medium text-green-600 uppercase tracking-wider mt-0.5">
                    <ShieldCheck size={12} /> <span>Verified Seller</span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-1 text-[10px] font-medium text-gray-400 uppercase tracking-wider mt-0.5">
                    <span>Unverified Seller</span>
                  </div>
                )}
              </div>
            </div>
            <button 
              onClick={handleMessageSeller} 
              className="bg-white border border-gray-200 text-gray-900 p-3 rounded-xl hover:border-indigo-600 hover:text-indigo-600 transition-colors shadow-sm"
              title="Message Seller"
            >
              <MessageSquare size={18} />
            </button>
          </div>

          {isPet && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-900 tracking-tight border-b border-gray-100 pb-2">Pet Details</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {[
                  { label: "Name", value: product.pet_name },
                  { label: "Breed", value: product.breed },
                  { label: "Gender", value: formattedGender },
                  { label: "Age", value: product.age },
                  { label: "Birthday", value: product.birthday ? new Date(product.birthday).toLocaleDateString() : null },
                  { label: "Color", value: product.color },
                  { label: "Weight", value: product.weight },
                  { label: "Ready to Go", value: product.ready_to_go ? 'Yes, Now' : (product.ready_date ? new Date(product.ready_date).toLocaleDateString() : null) },
                ].map((spec, i) => spec.value && (
                  <div key={i} className="bg-gray-50 rounded-2xl p-4 border border-gray-100/50">
                    <p className="text-[10px] font-medium text-gray-500 uppercase tracking-wider mb-1">{spec.label}</p>
                    <p className="text-sm font-semibold text-gray-900">{spec.value}</p>
                  </div>
                ))}
              </div>

              {product.health_info && product.health_info.length > 0 && (
                <div>
                  <p className="text-[11px] font-medium text-gray-500 uppercase tracking-wider mb-2">Health & Records</p>
                  <div className="flex flex-wrap gap-2">
                    {product.health_info.map((item, i) => (
                      <span key={i} className="bg-indigo-50 text-indigo-600 border border-indigo-100 text-xs font-semibold px-3 py-1.5 rounded-full">{item}</span>
                    ))}
                  </div>
                </div>
              )}
              {product.whats_included && product.whats_included.length > 0 && (
                <div>
                  <p className="text-[11px] font-medium text-gray-500 uppercase tracking-wider mb-2">What's Included</p>
                  <div className="flex flex-wrap gap-2">
                    {product.whats_included.map((item, i) => (
                      <span key={i} className="bg-green-50 text-green-600 border border-green-100 text-xs font-semibold px-3 py-1.5 rounded-full">{item}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          <div>
            <h3 className="text-lg font-semibold text-gray-900 tracking-tight border-b border-gray-100 pb-2 mb-4">Description</h3>
            <p className="text-gray-600 text-sm md:text-base leading-relaxed whitespace-pre-line">
              {product.description || "No description provided."}
            </p>
          </div>

          <div>
            <button 
              onClick={handleReportProduct}
              disabled={isReporting}
              className="flex items-center space-x-2 text-sm font-medium text-gray-500 hover:text-red-600 transition-colors disabled:opacity-50"
            >
              <Flag size={14} /> <span>{isReporting ? 'Reporting...' : 'Report this listing'}</span>
            </button>
          </div>

        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 md:px-12 mt-16 pt-12 border-t border-gray-100">
        <h3 className="text-2xl font-semibold text-gray-900 tracking-tight mb-8">Customer Reviews</h3>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          <div className="lg:col-span-1 bg-gray-50 border border-gray-100 rounded-[2rem] p-6 h-max">
            <h4 className="text-base font-semibold text-gray-900 mb-4">Write a Review</h4>
            <form onSubmit={handleSubmitReview} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">Rating</label>
                <div className="flex items-center space-x-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button 
                      key={star} 
                      type="button" 
                      onClick={() => setNewReviewRating(star)}
                      className="focus:outline-none transition-transform hover:scale-110"
                    >
                      <Star size={24} className={newReviewRating >= star ? "fill-yellow-400 text-yellow-400" : "text-gray-300"} />
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">Your Comment</label>
                <textarea 
                  required
                  value={newReviewText}
                  onChange={(e) => setNewReviewText(e.target.value)}
                  placeholder="What did you think about this item?"
                  className="w-full bg-white border border-gray-200 focus:border-indigo-600 rounded-xl px-4 py-3 text-sm font-medium text-gray-900 outline-none transition-all resize-none h-24"
                />
              </div>
              <button 
                type="submit" 
                disabled={submittingReview}
                className="w-full flex items-center justify-center space-x-2 bg-gray-900 text-white px-6 py-3 rounded-xl font-semibold hover:bg-gray-800 transition-colors disabled:opacity-50"
              >
                {submittingReview ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                <span>Submit Review</span>
              </button>
            </form>
          </div>

          <div className="lg:col-span-2 space-y-6">
            {reviews.length > 0 ? (
              <AnimatePresence>
                {reviews.map((review) => (
                  <motion.div 
                    key={review.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="border-b border-gray-100 pb-6 last:border-0"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        {review.user?.avatar_url ? (
                          <img src={review.user.avatar_url} alt="Reviewer" className="w-10 h-10 rounded-full object-cover bg-gray-100" />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-400"><User size={16} /></div>
                        )}
                        <div>
                          <p className="font-semibold text-sm text-gray-900">{review.user?.full_name || 'Anonymous User'}</p>
                          <p className="text-[10px] font-medium text-gray-500 mt-0.5">{new Date(review.created_at).toLocaleDateString()}</p>
                        </div>
                      </div>
                      <div className="flex space-x-0.5">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} size={14} className={i < review.rating ? "fill-yellow-400 text-yellow-400" : "text-gray-200"} />
                        ))}
                      </div>
                    </div>
                    <p className="text-gray-600 text-sm leading-relaxed">{review.comment}</p>
                  </motion.div>
                ))}
              </AnimatePresence>
            ) : (
              <div className="py-12 flex flex-col items-center justify-center text-center bg-gray-50 rounded-[2rem] border border-gray-100">
                <Star size={32} className="text-gray-300 mb-3" />
                <h4 className="text-base font-semibold text-gray-900 mb-1">No reviews yet</h4>
                <p className="text-sm font-medium text-gray-500">Be the first to share your thoughts on this listing!</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="lg:hidden fixed bottom-20 left-0 w-full bg-white/90 backdrop-blur-md border-t border-gray-100 p-4 z-40 flex space-x-3 shadow-[0_-10px_30px_rgba(0,0,0,0.05)]">
        <button 
          onClick={handleAddToCart}
          disabled={addingToCart || addedSuccess || isUnavailable}
          className="flex-1 flex items-center justify-center bg-gray-50 border border-gray-200 text-gray-900 py-3.5 rounded-full font-semibold text-sm transition-colors"
        >
          {addedSuccess ? <Heart size={18} className="fill-green-500 text-green-500"/> : <Heart size={18} />}
        </button>
        <button 
          onClick={handleCheckout}
          disabled={isUnavailable}
          className="flex-[2] flex items-center justify-center bg-indigo-600 text-white py-3.5 rounded-full font-semibold text-sm shadow-lg shadow-indigo-600/20 disabled:opacity-50"
        >
          Checkout Now
        </button>
      </div>
    </motion.div>
  );
};