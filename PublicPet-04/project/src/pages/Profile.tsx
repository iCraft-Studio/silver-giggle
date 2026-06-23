import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MapPin, ShieldCheck, Mail, Phone, User, ArrowLeft, Calendar, 
  PackageOpen, MessageSquare, Star, Send, Loader2, TrendingUp, Clock, PackageCheck 
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { ProductCard, ProductCardProps } from '../components/ProductCard';

// --- TYPES ---
type UserProfile = {
  id: string;
  full_name: string;
  avatar_url: string;
  email: string;
  phone: string;
  state: string;
  intent: string;
  is_verified: boolean;
  about: string;
  created_at: string;
};

type Product = ProductCardProps['product'];

type Sale = {
  id: string;
  product_title: string;
  created_at: string;
};

type UserReview = {
  id: string;
  rating: number;
  comment: string;
  created_at: string;
  reviewer: {
    id: string;
    full_name: string;
    avatar_url: string;
  };
};

// --- SKELETON LOADERS ---
const ProfileSkeleton = () => (
  <div className="w-full pb-8 mb-8 border-b border-gray-100 animate-pulse mt-4">
    <div className="flex items-start space-x-5">
      <div className="w-20 h-20 md:w-24 md:h-24 bg-gray-100 rounded-full flex-shrink-0"></div>
      <div className="flex-1 space-y-3 pt-2">
        <div className="h-6 bg-gray-100 rounded-full w-2/3 md:w-1/3"></div>
        <div className="h-4 bg-gray-100 rounded-full w-1/2 md:w-1/4"></div>
      </div>
    </div>
    <div className="mt-6 space-y-2">
      <div className="h-4 bg-gray-100 rounded-full w-full"></div>
      <div className="h-4 bg-gray-100 rounded-full w-4/5"></div>
    </div>
    <div className="mt-6 h-12 bg-gray-100 rounded-full w-full md:w-48"></div>
  </div>
);

const GridSkeleton = () => (
  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
    {Array.from({ length: 4 }).map((_, i) => (
      <div key={i} className="flex flex-col space-y-3 w-full">
        <div className="w-full aspect-square bg-gray-100 rounded-[2rem] animate-pulse"></div>
        <div className="h-4 bg-gray-100 rounded-full w-3/4 animate-pulse"></div>
        <div className="h-3 bg-gray-100 rounded-full w-1/4 animate-pulse"></div>
      </div>
    ))}
  </div>
);

export const Profile: React.FC = () => {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();

  const [currentUser, setCurrentUser] = useState<string | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  
  // Data States
  const [products, setProducts] = useState<Product[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [reviews, setReviews] = useState<UserReview[]>([]);
  
  // UI States
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'listings' | 'sales' | 'reviews'>('listings');
  
  // Review Form States
  const [newReviewRating, setNewReviewRating] = useState(5);
  const [newReviewText, setNewReviewText] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  useEffect(() => {
    const fetchAllData = async () => {
      if (!userId) return;
      setLoading(true);

      const { data: { session } } = await supabase.auth.getSession();
      setCurrentUser(session?.user?.id || null);

      // 1. Fetch Profile
      const { data: profileData, error: profileError } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (!profileError && profileData) {
        setProfile(profileData as UserProfile);
      }

      // 2. Fetch Active Products
      const { data: productsData } = await supabase
        .from('products')
        .select(`id, title, price, category, image_url, address, breed, gender, age, views, seller:users(full_name, avatar_url, is_verified)`)
        .eq('seller_id', userId)
        .eq('is_available', true)
        .order('created_at', { ascending: false });

      if (productsData) setProducts(productsData as Product[]);

      // 3. Fetch Sales History
      const { data: salesData } = await supabase
        .from('sales')
        .select('id, product_title, created_at')
        .eq('seller_id', userId)
        .order('created_at', { ascending: false });

      if (salesData) setSales(salesData as Sale[]);

      // 4. Fetch User Reviews
      const { data: reviewsData } = await supabase
        .from('user_reviews')
        .select(`*, reviewer:users(id, full_name, avatar_url)`)
        .eq('target_user_id', userId)
        .order('created_at', { ascending: false });

      if (reviewsData) setReviews(reviewsData as unknown as UserReview[]);

      setTimeout(() => setLoading(false), 500);
    };

    fetchAllData();
  }, [userId]);

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newReviewText.trim() || !userId) return;

    if (!currentUser) {
      alert("Please log in to leave a review.");
      navigate('/auth');
      return;
    }

    setSubmittingReview(true);
    const { data, error } = await supabase.from('user_reviews').insert({
      target_user_id: userId,
      reviewer_id: currentUser,
      rating: newReviewRating,
      comment: newReviewText.trim()
    }).select(`*, reviewer:users(id, full_name, avatar_url)`).single();

    setSubmittingReview(false);

    if (!error && data) {
      setReviews([data as unknown as UserReview, ...reviews]);
      setNewReviewText('');
      setNewReviewRating(5);
    } else {
      alert("Failed to submit review.");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white px-6 md:px-12 lg:px-24 pt-6 pb-32 max-w-6xl mx-auto">
        <ProfileSkeleton />
        <GridSkeleton />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center text-center p-6">
        <User size={64} className="text-gray-200 mb-4" />
        <h1 className="text-2xl font-bold text-black mb-2">Profile Not Found</h1>
        <p className="text-gray-500 mb-6">This user does not exist or has been removed.</p>
        <button onClick={() => navigate(-1)} className="bg-black text-white px-6 py-2.5 rounded-full font-bold transition-all hover:scale-105">
          Go Back
        </button>
      </div>
    );
  }

  const averageRating = reviews.length > 0 
    ? (reviews.reduce((acc, rev) => acc + rev.rating, 0) / reviews.length).toFixed(1)
    : 'New';

  return (
    <div className="min-h-screen bg-white px-6 md:px-12 lg:px-24 pt-6 pb-32 font-sans max-w-6xl mx-auto">
      
      {/* NATIVE HEADER NAV */}
      <div className="flex items-center justify-between mb-6">
        <button 
          onClick={() => navigate(-1)} 
          className="flex items-center justify-center w-10 h-10 bg-gray-50 text-gray-600 hover:text-black hover:bg-gray-100 rounded-full transition-colors"
        >
          <ArrowLeft size={20} />
        </button>
      </div>

      {/* NATIVE PROFILE LAYOUT */}
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full pb-8 mb-8"
      >
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
          
          <div className="flex items-start space-x-5">
            {/* Avatar */}
            <div className="w-20 h-20 md:w-24 md:h-24 rounded-full bg-gray-50 border border-gray-100 flex-shrink-0 relative">
              {profile.avatar_url ? (
                <img src={profile.avatar_url} alt={profile.full_name} className="w-full h-full object-cover rounded-full" />
              ) : (
                <div className="w-full h-full rounded-full bg-blue-50 text-blue-600 flex items-center justify-center">
                  <User size={32} />
                </div>
              )}
            </div>

            {/* Core Info */}
            <div className="pt-1 md:pt-2">
              <h1 className="text-2xl md:text-3xl font-bold text-black tracking-tight flex items-center gap-2">
                <span>{profile.full_name}</span>
                {profile.is_verified && (
                  <ShieldCheck size={20} className="text-green-500 flex-shrink-0" />
                )}
              </h1>
              
              <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-xs md:text-sm font-bold text-gray-500 mt-2">
                {reviews.length > 0 && (
                  <span className="flex items-center text-yellow-600 bg-yellow-50 px-2 py-0.5 rounded-md">
                    <Star size={12} className="fill-yellow-500 mr-1" /> {averageRating} ({reviews.length})
                  </span>
                )}
                {profile.state && (
                  <span className="flex items-center">
                    <MapPin size={14} className="mr-1" /> {profile.state}
                  </span>
                )}
                <span className="flex items-center">
                  <Calendar size={14} className="mr-1" /> Joined {new Date(profile.created_at).getFullYear()}
                </span>
                {profile.intent && (
                  <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded-md capitalize">
                    {profile.intent.replace('_', ' ')}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Action Button */}
          {currentUser !== profile.id && (
            <button 
              onClick={() => navigate(`/messages?user=${profile.id}`)}
              className="w-full md:w-auto flex items-center justify-center space-x-2 bg-blue-600 text-white px-8 py-3.5 md:py-3 rounded-full font-bold shadow-md shadow-blue-600/20 hover:bg-blue-700 transition-colors"
            >
              <MessageSquare size={18} />
              <span>Message Seller</span>
            </button>
          )}
        </div>

        {/* Bio / About */}
        <div className="mt-6 md:mt-8">
          <p className="text-gray-700 text-sm md:text-base leading-relaxed max-w-3xl whitespace-pre-line">
            {profile.about || "This user hasn't added a bio yet."}
          </p>
        </div>

        {/* Contact Links (If verified/public) */}
        {(profile.phone || profile.email) && (
          <div className="mt-4 flex flex-wrap gap-4 pt-4">
            {profile.phone && (
              <a href={`tel:${profile.phone}`} className="flex items-center text-sm font-bold text-blue-600 hover:underline">
                <Phone size={14} className="mr-1.5" /> {profile.phone}
              </a>
            )}
            {profile.email && (
              <a href={`mailto:${profile.email}`} className="flex items-center text-sm font-bold text-blue-600 hover:underline">
                <Mail size={14} className="mr-1.5" /> {profile.email}
              </a>
            )}
          </div>
        )}
      </motion.div>

      {/* NATIVE TAB NAVIGATION */}
      <div className="flex space-x-6 border-b border-gray-100 mb-8 overflow-x-auto hide-scrollbar">
        {[
          { id: 'listings', label: 'Listings', count: products.length },
          { id: 'sales', label: 'Past Sales', count: sales.length },
          { id: 'reviews', label: 'Reviews', count: reviews.length }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`pb-4 text-sm font-bold transition-colors relative whitespace-nowrap ${
              activeTab === tab.id ? 'text-black' : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            <span>{tab.label}</span>
            <span className={`ml-2 px-2 py-0.5 rounded-full text-[10px] ${activeTab === tab.id ? 'bg-black text-white' : 'bg-gray-100 text-gray-500'}`}>
              {tab.count}
            </span>
            {activeTab === tab.id && (
              <motion.div layoutId="profileTabIndicator" className="absolute bottom-0 left-0 w-full h-0.5 bg-black rounded-t-full" />
            )}
          </button>
        ))}
      </div>

      {/* TAB CONTENT AREA */}
      <AnimatePresence mode="wait">
        
        {/* LISTINGS TAB */}
        {activeTab === 'listings' && (
          <motion.div key="listings" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>
            {products.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
                <AnimatePresence mode="popLayout">
                  {products.map((item) => (
                    <ProductCard key={item.id} product={item} />
                  ))}
                </AnimatePresence>
              </div>
            ) : (
              <div className="py-16 flex flex-col items-center justify-center text-center bg-gray-50 rounded-[2rem] border border-gray-100">
                <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-sm text-gray-300 mb-4">
                  <PackageOpen size={32} />
                </div>
                <h3 className="text-lg font-bold text-black mb-1">No active listings</h3>
                <p className="text-sm text-gray-500 font-medium max-w-xs">
                  This seller doesn't have any items listed right now.
                </p>
              </div>
            )}
          </motion.div>
        )}

        {/* SALES TAB */}
        {activeTab === 'sales' && (
          <motion.div key="sales" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }} className="max-w-2xl">
            {sales.length > 0 ? (
              <div className="bg-white border border-gray-100 rounded-[2rem] p-4 md:p-6 shadow-sm">
                <div className="space-y-4">
                  {sales.map((sale) => (
                    <div key={sale.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-100/50">
                      <div className="flex items-center space-x-4">
                        <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-green-500 shadow-sm border border-gray-100">
                          <PackageCheck size={18} />
                        </div>
                        <div>
                          <p className="font-bold text-black text-sm">{sale.product_title}</p>
                          <p className="text-xs font-semibold text-gray-400 flex items-center mt-0.5">
                            <Clock size={10} className="mr-1" /> {new Date(sale.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-green-600 bg-green-50 px-3 py-1 rounded-full border border-green-100">Sold</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="py-16 flex flex-col items-center justify-center text-center bg-gray-50 rounded-[2rem] border border-gray-100">
                <TrendingUp size={32} className="text-gray-300 mb-3" />
                <h3 className="text-lg font-bold text-black mb-1">No sales history yet</h3>
                <p className="text-sm text-gray-500 font-medium max-w-xs">This seller hasn't completed any tracked sales on the platform.</p>
              </div>
            )}
          </motion.div>
        )}

        {/* REVIEWS TAB */}
        {activeTab === 'reviews' && (
          <motion.div key="reviews" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }} className="max-w-3xl">
            
            {/* Submit Review Form (Hidden if viewing own profile) */}
            {currentUser && currentUser !== profile.id && (
              <div className="bg-gray-50 border border-gray-100 rounded-[2rem] p-6 mb-8">
                <h4 className="text-base font-bold text-black mb-4">Rate this Seller</h4>
                <form onSubmit={handleSubmitReview} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Rating</label>
                    <div className="flex items-center space-x-2">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button 
                          key={star} type="button" onClick={() => setNewReviewRating(star)}
                          className="focus:outline-none transition-transform hover:scale-110"
                        >
                          <Star size={24} className={newReviewRating >= star ? "fill-yellow-400 text-yellow-400" : "text-gray-300"} />
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Your Experience</label>
                    <textarea 
                      required value={newReviewText} onChange={(e) => setNewReviewText(e.target.value)}
                      placeholder="How was your experience with this seller?"
                      className="w-full bg-white border border-gray-200 focus:border-blue-600 rounded-xl px-4 py-3 text-sm font-medium text-black outline-none transition-all resize-none h-24"
                    />
                  </div>
                  <button 
                    type="submit" disabled={submittingReview}
                    className="flex items-center justify-center space-x-2 bg-black text-white px-6 py-3 rounded-full font-bold hover:bg-gray-800 transition-colors disabled:opacity-50 w-full sm:w-auto"
                  >
                    {submittingReview ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                    <span>Submit Review</span>
                  </button>
                </form>
              </div>
            )}

            {/* Reviews List */}
            <div className="space-y-6">
              {reviews.length > 0 ? (
                <AnimatePresence>
                  {reviews.map((review) => (
                    <motion.div 
                      key={review.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                      className="border-b border-gray-100 pb-6 last:border-0"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center space-x-3">
                          {review.reviewer?.avatar_url ? (
                            <img src={review.reviewer.avatar_url} alt="Reviewer" className="w-10 h-10 rounded-full object-cover bg-gray-100" />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-400"><User size={16} /></div>
                          )}
                          <div>
                            <p className="font-bold text-sm text-black">{review.reviewer?.full_name || 'Anonymous User'}</p>
                            <p className="text-[10px] font-bold text-gray-400 mt-0.5">{new Date(review.created_at).toLocaleDateString()}</p>
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
                  <h4 className="text-base font-bold text-black mb-1">No reviews yet</h4>
                  <p className="text-sm font-medium text-gray-500">No one has reviewed this seller yet.</p>
                </div>
              )}
            </div>
          </motion.div>
        )}

      </AnimatePresence>
    </div>
  );
};