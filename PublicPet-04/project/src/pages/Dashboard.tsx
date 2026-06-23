import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, User, Package, ShoppingBag, LogOut } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useNavigate, useSearchParams } from 'react-router-dom';

// --- IMPORT THE SEPARATED PAGES ---
import { ManageProfile } from './ManageProfile';
import { ManageStore } from './ManageStore';
import { ManageOrders } from './ManageOrders';
import { CreateListingModal } from '../components/CreateListingModal';

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  const [sessionUser, setSessionUser] = useState<string | null>(null);
  const [fullName, setFullName] = useState<string>('');
  const [loading, setLoading] = useState(true);
  
  // UI State
  const [activeTab, setActiveTab] = useState<'profile' | 'store' | 'purchases'>('store');
  const [isModalOpen, setIsModalOpen] = useState(searchParams.get('new') === 'true');
  
  // Refresh Trigger (Used to refresh ManageStore when a new listing is added from the Dashboard header)
  const [storeRefreshKey, setStoreRefreshKey] = useState(0);

  useEffect(() => {
    const initDashboard = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.user) {
        navigate('/auth', { replace: true });
        return;
      }
      
      setSessionUser(session.user.id);

      // Fetch just the user's name for the welcome header
      const { data } = await supabase
        .from('users')
        .select('full_name')
        .eq('id', session.user.id)
        .single();

      if (data) setFullName(data.full_name);
      setLoading(false);
    };

    initDashboard();
  }, [navigate]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  const handleListingSuccess = () => {
    // Increment the key to force ManageStore to remount and fetch the new item
    setStoreRefreshKey(prev => prev + 1);
    // Optionally switch them to the store tab so they can see their new listing
    setActiveTab('store');
  };

  if (!sessionUser && loading) return <div className="min-h-screen bg-gray-50" />;

  const displayUserName = fullName?.split(' ')[0] || 'User';

  return (
    <div className="min-h-screen bg-gray-50 pb-32 pt-8 md:pt-12 px-6 md:px-12 lg:px-24 font-sans relative max-w-7xl mx-auto">
      
      {/* HEADER SECTION */}
      <div className="mb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-semibold text-gray-900 tracking-tight mb-1 flex items-center space-x-2">
            <span>Welcome back,</span>
            {loading ? (
              <div className="w-24 h-8 bg-gray-200 rounded-lg animate-pulse inline-block" />
            ) : (
              <span className="text-indigo-600">{displayUserName}</span>
            )}
          </h1>
          <p className="text-gray-500 font-medium text-sm">Here's your personal command center.</p>
        </div>
        
        <motion.button 
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setIsModalOpen(true)}
          className="flex items-center justify-center space-x-2 bg-gray-900 text-white px-5 py-2.5 rounded-full font-semibold hover:bg-gray-800 transition-colors shadow-md shadow-gray-900/10 text-sm"
        >
          <Plus size={16} />
          <span>New Listing</span>
        </motion.button>
      </div>

      {/* NATIVE TAB SWITCHER */}
      <div className="flex bg-white p-1.5 rounded-2xl mb-8 w-full max-w-md border border-gray-100 shadow-sm">
        {[
          { id: 'profile', label: 'Profile', icon: User }, 
          { id: 'store', label: 'Store', icon: Package },
          { id: 'purchases', label: 'Orders', icon: ShoppingBag }
        ].map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as 'profile' | 'store' | 'purchases')}
              className={`relative flex-1 flex items-center justify-center space-x-2 py-2.5 text-sm font-semibold rounded-xl transition-colors z-10 ${
                isActive ? 'text-indigo-600' : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              {isActive && (
                <motion.div
                  layoutId="dashboard-active-tab"
                  className="absolute inset-0 bg-indigo-50 rounded-xl -z-10"
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                />
              )}
              <tab.icon size={16} />
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* RENDER THE ACTIVE COMPONENT */}
      <div className="min-h-[50vh]">
        <AnimatePresence mode="wait">
          {activeTab === 'profile' && (
            <motion.div key="profile" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>
              <ManageProfile />
            </motion.div>
          )}
          
          {activeTab === 'store' && (
            <motion.div key="store" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>
              {/* Passing the refreshKey ensures this component remounts and fetches fresh data when a listing is added */}
              <ManageStore key={storeRefreshKey} />
            </motion.div>
          )}
          
          {activeTab === 'purchases' && (
            <motion.div key="purchases" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>
              <ManageOrders />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* GLOBAL SIGN OUT BUTTON */}
      <div className="mt-16 pt-8 border-t border-gray-200 flex justify-center pb-8">
        <button 
          onClick={handleSignOut}
          className="flex items-center space-x-2 text-red-500 hover:text-red-700 hover:bg-red-50 px-6 py-3 rounded-full font-semibold transition-colors text-sm"
        >
          <LogOut size={16} />
          <span>Sign Out Securely</span>
        </button>
      </div>

      {/* GLOBAL CREATE LISTING MODAL */}
      <CreateListingModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        userId={sessionUser || ''}
        onSuccess={handleListingSuccess}
      />
      
    </div>
  );
};