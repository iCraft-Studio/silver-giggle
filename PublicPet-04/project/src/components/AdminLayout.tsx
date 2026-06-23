import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useLocation, useNavigate, Outlet } from 'react-router-dom';
import { 
  LayoutDashboard, ShoppingBag, Package, Users, 
  Receipt, ArrowRightLeft, LogOut, Menu, X, ShieldCheck, Settings 
} from 'lucide-react';
import { supabase } from '../lib/supabase';

// --- ADMIN NAVIGATION CONFIG ---
const ADMIN_NAV = [
  { name: 'Overview', path: '/admin', icon: LayoutDashboard },
  { name: 'Orders', path: '/admin/orders', icon: ShoppingBag },
  { name: 'Products', path: '/admin/products', icon: Package },
  { name: 'Users', path: '/admin/users', icon: Users },
  { name: 'Checkouts', path: '/admin/checkouts', icon: Receipt },
  { name: 'Withdrawals', path: '/admin/withdrawals', icon: ArrowRightLeft },
  { name: 'Escrow Setup', path: '/admin/routing', icon: Settings }, // <-- FIXED: ADDED ESCROW ROUTING HERE!
];

export const AdminLayout: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  // State for the Admin's Profile details
  const [adminProfile, setAdminProfile] = useState<{ full_name: string; email: string; avatar_url?: string } | null>(null);

  useEffect(() => {
    const fetchAdminProfile = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        const { data } = await supabase
          .from('users')
          .select('full_name, email, avatar_url')
          .eq('id', session.user.id)
          .single();
          
        if (data) setAdminProfile(data as any);
      }
    };
    fetchAdminProfile();
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate('/auth');
  };

  // Close mobile menu when route changes
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-gray-50 flex font-sans">
      
      {/* --- DESKTOP SIDEBAR --- */}
      <aside className="hidden lg:flex flex-col w-72 bg-white border-r border-gray-100 fixed inset-y-0 z-50">
        
        {/* Admin Brand Header */}
        <div className="h-20 flex items-center px-8 border-b border-gray-100">
          <div className="flex items-center space-x-2.5 text-gray-900">
            <ShieldCheck className="text-indigo-600" size={28} />
            <span className="text-xl font-semibold tracking-tight">Platform Admin</span>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 overflow-y-auto px-4 py-6 space-y-1.5 hide-scrollbar">
          {ADMIN_NAV.map((item) => {
            // Exact match for overview, startsWith for nested routes
            const isActive = item.path === '/admin' 
              ? location.pathname === '/admin' 
              : location.pathname.startsWith(item.path);

            return (
              <Link
                key={item.name}
                to={item.path}
                className={`relative flex items-center space-x-3 px-4 py-3.5 rounded-xl font-semibold text-sm transition-all group ${
                  isActive 
                    ? 'text-indigo-600 bg-indigo-50/50' 
                    : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                {isActive && (
                  <motion.div
                    layoutId="admin-active-nav"
                    className="absolute inset-0 bg-indigo-50 border border-indigo-100/50 rounded-xl -z-10"
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  />
                )}
                <item.icon size={18} className={isActive ? 'text-indigo-600' : 'text-gray-400 group-hover:text-gray-600 transition-colors'} />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* Bottom Profile & Actions */}
        <div className="p-4 border-t border-gray-100">
          {adminProfile && (
            <div className="flex items-center space-x-3 px-4 py-3 mb-2 rounded-xl bg-gray-50/50 border border-gray-100/50">
              {adminProfile.avatar_url ? (
                <img src={adminProfile.avatar_url} alt="Admin" className="w-10 h-10 rounded-full object-cover shadow-sm" />
              ) : (
                <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-semibold text-sm shadow-sm">
                  {adminProfile.full_name?.charAt(0) || 'A'}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900 truncate">{adminProfile.full_name}</p>
                <p className="text-[10px] font-medium text-gray-500 truncate">{adminProfile.email}</p>
              </div>
            </div>
          )}
          
          <button 
            onClick={handleSignOut}
            className="w-full flex items-center space-x-3 px-4 py-3.5 text-red-600 hover:bg-red-50 rounded-xl font-semibold text-sm transition-colors"
          >
            <LogOut size={18} />
            <span>Sign Out Admin</span>
          </button>
        </div>
      </aside>

      {/* --- MOBILE HEADER & SLIDE OVER MENU --- */}
      <div className="lg:hidden fixed top-0 inset-x-0 h-16 bg-white border-b border-gray-100 z-50 flex items-center justify-between px-6 shadow-sm">
        <div className="flex items-center space-x-2 text-gray-900">
          <ShieldCheck className="text-indigo-600" size={24} />
          <span className="text-lg font-semibold tracking-tight">Admin</span>
        </div>
        <button 
          onClick={() => setIsMobileMenuOpen(true)}
          className="p-2 -mr-2 text-gray-500 hover:text-gray-900 transition-colors"
        >
          <Menu size={24} />
        </button>
      </div>

      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            {/* Mobile Backdrop */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileMenuOpen(false)}
              className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm z-[100] lg:hidden"
            />

            {/* Mobile Drawer */}
            <motion.div 
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: "spring", bounce: 0, duration: 0.4 }}
              className="fixed inset-y-0 right-0 w-4/5 max-w-sm bg-white shadow-2xl z-[101] flex flex-col lg:hidden"
            >
              <div className="h-16 flex items-center justify-between px-6 border-b border-gray-100">
                <span className="font-semibold text-gray-900">Menu</span>
                <button onClick={() => setIsMobileMenuOpen(false)} className="p-2 -mr-2 text-gray-500 hover:text-gray-900 bg-gray-50 rounded-full">
                  <X size={20} />
                </button>
              </div>

              <nav className="flex-1 overflow-y-auto px-4 py-6 space-y-2">
                {ADMIN_NAV.map((item) => {
                  const isActive = item.path === '/admin' ? location.pathname === '/admin' : location.pathname.startsWith(item.path);
                  return (
                    <Link
                      key={item.name}
                      to={item.path}
                      className={`flex items-center space-x-4 px-4 py-4 rounded-xl font-semibold text-base transition-colors ${
                        isActive ? 'text-indigo-600 bg-indigo-50' : 'text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      <item.icon size={20} className={isActive ? 'text-indigo-600' : 'text-gray-400'} />
                      <span>{item.name}</span>
                    </Link>
                  );
                })}
              </nav>

              <div className="p-6 border-t border-gray-100 space-y-4">
                {adminProfile && (
                  <div className="flex items-center space-x-3 px-2">
                    {adminProfile.avatar_url ? (
                      <img src={adminProfile.avatar_url} alt="Admin" className="w-10 h-10 rounded-full object-cover shadow-sm" />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-semibold text-sm shadow-sm">
                        {adminProfile.full_name?.charAt(0) || 'A'}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate">{adminProfile.full_name}</p>
                      <p className="text-[10px] font-medium text-gray-500 truncate">{adminProfile.email}</p>
                    </div>
                  </div>
                )}
                <button onClick={handleSignOut} className="w-full flex items-center justify-center space-x-2 bg-red-50 text-red-600 py-4 rounded-xl font-semibold transition-colors">
                  <LogOut size={18} />
                  <span>Sign Out</span>
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* --- MAIN CONTENT AREA --- */}
      <main className="flex-1 flex flex-col min-w-0 lg:pl-72 pt-16 lg:pt-0">
        <div className="flex-1 p-6 md:p-8 lg:p-12 w-full max-w-7xl mx-auto">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Outlet />
          </motion.div>
        </div>
      </main>

    </div>
  );
};