import React, { useEffect, useState } from 'react';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Home, ShoppingBag, MessageSquare, LayoutDashboard, Shield, PawPrint, Plus, ArrowLeft, Search, ShoppingCart } from 'lucide-react';
import { supabase } from '../lib/supabase';

// --- TYPES & CONSTANTS ---
type NavItem = {
  path: string;
  label: string;
  icon: React.ElementType;
  reqAdmin?: boolean;
  reqAuth?: boolean;
};

const navItems: NavItem[] = [
  { path: '/', label: 'Home', icon: Home },
  { path: '/shop', label: 'Shop', icon: ShoppingBag },
  { path: '/messages', label: 'Messages', icon: MessageSquare, reqAuth: true }, 
  { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, reqAuth: true },
  { path: '/admin', label: 'Admin', icon: Shield, reqAdmin: true },
];

interface NavigationShellProps {
  children: React.ReactNode;
  theme?: string;
}

export const NavigationShell: React.FC<NavigationShellProps> = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  // Verify Auth & Admin Status on Mount
  useEffect(() => {
    const checkUserRole = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user) {
        setIsAuthenticated(true);
        const { data, error } = await supabase
          .from('users')
          .select('is_admin')
          .eq('id', session.user.id)
          .single();
          
        if (!error && data?.is_admin) {
          setIsAdmin(true);
        }
      } else {
        setIsAuthenticated(false);
        setIsAdmin(false);
      }
      setIsCheckingAuth(false);
    };

    checkUserRole();

    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT') {
        setIsAuthenticated(false);
        setIsAdmin(false);
      }
      if (event === 'SIGNED_IN') checkUserRole();
    });

    return () => authListener.subscription.unsubscribe();
  }, []);

  // Filter out tabs based on authentication AND admin status
  const visibleNavItems = navItems.filter(item => {
    if (item.reqAdmin && !isAdmin) return false;
    if (item.reqAuth && !isAuthenticated) return false;
    return true;
  });

  // Active Item Helper
  const activeNavItem = visibleNavItems.find(item => 
    location.pathname === item.path || 
    (item.path !== '/' && location.pathname.startsWith(item.path))
  ) || navItems[0];

  // Dynamic Header Title Logic
  let headerTitle = activeNavItem.label;
  if (location.pathname === '/') {
    headerTitle = 'Public Pet';
  } else if (location.pathname === '/shop') {
    headerTitle = 'Categories';
  } else if (location.pathname.startsWith('/shop/')) {
    headerTitle = 'Marketplace';
  } else if (location.pathname === '/auth') {
    headerTitle = 'Sign In'; 
  }

  const isAuthPage = location.pathname === '/auth';

  // Handle the "New Listing" logic
  const handleNewListing = () => {
    if (!isAuthenticated) {
      navigate('/auth');
    } else {
      navigate('/dashboard?new=true'); 
    }
  };

  // Helper logic to split the mobile nav items so the action button sits perfectly in the center
  const midIndex = Math.ceil(visibleNavItems.length / 2);
  const leftNavItems = visibleNavItems.slice(0, midIndex);
  const rightNavItems = visibleNavItems.slice(midIndex);

  // Helper function to render mobile nav items cleanly
  const renderNavItem = (item: NavItem) => {
    const isActive = location.pathname === item.path || 
                    (item.path !== '/' && location.pathname.startsWith(item.path));
    
    return (
      <Link
        key={item.path}
        to={item.path}
        className="relative flex flex-col items-center justify-center w-16 h-full space-y-1 z-10"
      >
        <div className={`relative p-2 rounded-xl transition-colors duration-300 ${isActive ? 'text-indigo-600' : 'text-gray-400'}`}>
          {isActive && (
            <motion.div
              layoutId="mobile-active-glow"
              className="absolute inset-0 bg-indigo-50 rounded-xl -z-10 shadow-sm"
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
            />
          )}
          <item.icon size={22} className={isActive ? 'fill-indigo-50' : ''} />
        </div>
        <span className={`text-[10px] font-medium transition-colors ${isActive ? 'text-indigo-600' : 'text-gray-400'}`}>
          {item.label}
        </span>
      </Link>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 font-sans flex flex-col relative">
      
      {/* DESKTOP TOP NAVIGATION */}
      <header className="hidden md:flex fixed top-0 w-full bg-white/80 backdrop-blur-md border-b border-gray-100 z-50 px-8 h-20 items-center justify-between">
        <Link to="/" className="flex items-center space-x-2 group">
          <div className="w-10 h-10 bg-gray-900 rounded-xl flex items-center justify-center overflow-hidden transition-all duration-300 shadow-sm group-hover:scale-105">
            <img src="https://pnxglgezelwtkgceysvw.supabase.co/storage/v1/object/public/tpp/logo.jpg" alt="Public Pet Logo" className="w-full h-full object-cover" />
          </div>
          <span className="text-xl font-semibold text-gray-900 tracking-tight">Public Pet</span>
        </Link>

        <nav className="flex items-center space-x-1 relative">
          
          {isAuthPage ? (
            // BACK BUTTON (ONLY ON AUTH PAGE)
            <Link to="/" className="flex items-center space-x-2 text-gray-500 hover:text-gray-900 font-medium text-sm transition-colors bg-gray-50 px-4 py-2 rounded-full">
              <ArrowLeft size={16} />
              <span>Back to Hub</span>
            </Link>
          ) : (
            <>
              {/* GLOBAL SEARCH BUTTON */}
              <Link to="/shop/all" className="flex items-center justify-center w-10 h-10 bg-gray-50 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-full transition-colors mr-1">
                <Search size={18} />
              </Link>

              {/* CART BUTTON */}
              <Link to="/cart" className="flex items-center justify-center w-10 h-10 bg-gray-50 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-full transition-colors mr-2">
                <ShoppingCart size={18} />
              </Link>

              {/* NAV TABS */}
              {!isCheckingAuth && visibleNavItems.map((item) => {
                const isActive = location.pathname === item.path || 
                                (item.path !== '/' && location.pathname.startsWith(item.path));
                
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`relative px-5 py-2.5 rounded-full text-sm font-medium transition-colors z-10 ${
                      isActive ? 'text-indigo-600' : 'text-gray-500 hover:text-gray-900'
                    }`}
                  >
                    {isActive && (
                      <motion.div
                        layoutId="desktop-active-pill"
                        className="absolute inset-0 bg-indigo-50 rounded-full -z-10 shadow-sm"
                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                      />
                    )}
                    <div className="flex items-center space-x-2">
                      <item.icon size={18} />
                      <span>{item.label}</span>
                    </div>
                  </Link>
                );
              })}

              {/* DESKTOP LIST PET BUTTON */}
              {!isCheckingAuth && (
                <motion.button 
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleNewListing}
                  className="flex items-center justify-center space-x-2 bg-indigo-600 text-white px-6 py-2.5 rounded-full text-sm font-semibold shadow-lg shadow-indigo-600/20 hover:bg-indigo-700 transition-colors ml-2"
                >
                  <Plus size={18} />
                  <span>List Pet</span>
                </motion.button>
              )}

              {/* DYNAMIC DESKTOP SIGN IN BUTTON */}
              {!isCheckingAuth && !isAuthenticated && (
                <Link to="/auth" className="ml-4">
                  <motion.button 
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="bg-gray-900 text-white px-6 py-2.5 rounded-full text-sm font-semibold shadow-lg shadow-gray-900/10 hover:bg-gray-800 transition-colors"
                  >
                    Sign In
                  </motion.button>
                </Link>
              )}
            </>
          )}
        </nav>
      </header>

      {/* MOBILE TOP HEADER */}
      <header className="md:hidden fixed top-0 w-full bg-white/90 backdrop-blur-md border-b border-gray-100 z-50 px-6 h-16 flex items-center justify-between">
        
        {/* Left Side: Logo & Title */}
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-[0.6rem] overflow-hidden shadow-sm flex items-center justify-center bg-gray-50 border border-gray-100">
            <img src="https://pnxglgezelwtkgceysvw.supabase.co/storage/v1/object/public/tpp/logo.jpg" alt="Logo" className="w-full h-full object-cover" />
          </div>
          <span className="text-lg font-semibold text-gray-900 tracking-tight">
            {headerTitle}
          </span>
        </div>

        {/* Right Side: Actions */}
        <div className="flex items-center space-x-3">
          {isAuthPage ? (
            <Link to="/" className="flex items-center justify-center w-9 h-9 bg-gray-50 text-gray-500 hover:text-gray-900 rounded-full transition-colors">
              <ArrowLeft size={18} />
            </Link>
          ) : (
            <>
              {/* GLOBAL SEARCH ICON */}
              <Link to="/shop/all" className="text-gray-400 hover:text-indigo-600 transition-colors">
                <Search size={22} />
              </Link>
              
              {/* MOBILE CART ICON */}
              <Link to="/cart" className="text-gray-400 hover:text-indigo-600 transition-colors">
                <ShoppingCart size={22} />
              </Link>
              
              {/* DYNAMIC MOBILE SIGN IN BUTTON */}
              {!isCheckingAuth && !isAuthenticated && (
                <Link to="/auth">
                  <motion.button 
                    whileTap={{ scale: 0.9 }}
                    className="bg-gray-900 text-white px-4 py-1.5 rounded-full text-xs font-semibold shadow-md hover:bg-gray-800 transition-colors ml-1"
                  >
                    Sign In
                  </motion.button>
                </Link>
              )}
            </>
          )}
        </div>
      </header>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 w-full relative pt-16 md:pt-20 pb-20 md:pb-0">
        {children}
      </main>

      {/* MOBILE BOTTOM NAVIGATION */}
      {!isAuthPage && (
        <nav className="md:hidden fixed bottom-0 w-full bg-white border-t border-gray-100 z-40 pb-safe">
          <div className="flex justify-around items-center h-20 px-2 relative w-full">
            
            {/* Left Nav Tabs */}
            {!isCheckingAuth && leftNavItems.map(renderNavItem)}

            {/* INTEGRATED CENTER ACTION BUTTON */}
            {!isCheckingAuth && (
              <button
                onClick={handleNewListing}
                className="relative flex flex-col items-center justify-center w-16 h-full z-20 group"
              >
                <motion.div 
                  whileTap={{ scale: 0.9 }}
                  className="flex items-center justify-center w-12 h-12 bg-gray-900 text-white rounded-xl shadow-md group-hover:bg-indigo-600 transition-colors duration-300"
                >
                  <Plus size={24} />
                </motion.div>
              </button>
            )}

            {/* Right Nav Tabs */}
            {!isCheckingAuth && rightNavItems.map(renderNavItem)}

          </div>
        </nav>
      )}

    </div>
  );
};