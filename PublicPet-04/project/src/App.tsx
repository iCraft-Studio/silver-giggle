import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { supabase } from './lib/supabase';

// --- THE PUBLIC PET CORE PAGES ---
import { Home } from './pages/Home';
import { ShopHub } from './pages/ShopHub'; 
import { Shop } from './pages/Shop'; 
import { Cart } from './pages/Cart'; 
import { Checkout } from './pages/Checkout';
import { Success } from './pages/Success';
import { Messages } from './pages/Messages';
import { Dashboard } from './pages/Dashboard';
import { AuthPage } from './pages/AuthPage';
import { ProductDetails } from './pages/ProductDetails';
import { Profile } from './pages/Profile'; 

// --- ADMIN PAGES & LAYOUT ---
import { AdminLayout } from './components/AdminLayout'; 
import { AdminOverview } from './pages/AdminOverview';
import { AdminOrders } from './pages/AdminOrders'; 
import { AdminCheckouts } from './pages/AdminCheckouts'; 
import { AdminProducts } from './pages/AdminProducts';
import { AdminUsers } from './pages/AdminUsers';
import { AdminWithdrawals } from './pages/AdminWithdrawals';
import { AdminCheckoutAccount } from './pages/AdminCheckoutAccount';

// --- UTILITIES ---
import { NavigationShell } from './components/NavigationShell';
import { ScrollToTop } from './components/ScrollToTop';

// Minimal 404
const NotFound = () => (
  <div className="flex items-center justify-center min-h-[70vh] bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
    <div className="text-center">
      <h2 className="text-2xl font-semibold text-gray-900 dark:text-white tracking-tight">404 - Page Not Found</h2>
      <p className="text-gray-500 font-medium mt-2">This page chased a squirrel and got lost.</p>
    </div>
  </div>
);

// ==========================================
// ADMIN ROUTE GUARD (THE BOUNCER)
// ==========================================
const AdminProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);

  useEffect(() => {
    const verifyAdminStatus = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      // Not logged in? Not an admin.
      if (!session?.user) {
        setIsAuthorized(false);
        return;
      }

      // Check the specific is_admin column in the database
      const { data, error } = await supabase
        .from('users')
        .select('is_admin')
        .eq('id', session.user.id)
        .single();

      if (error || !data?.is_admin) {
        setIsAuthorized(false);
      } else {
        setIsAuthorized(true);
      }
    };

    verifyAdminStatus();
  }, []);

  // Show a blank native-feeling screen while verifying to prevent layout flashes
  if (isAuthorized === null) {
    return <div className="min-h-screen bg-gray-50 dark:bg-gray-900" />;
  }

  // THE FIX: If not authorized, redirect to a fake route (/404) 
  // so the public NavigationShell catches it and renders the standard 404 with header/footer.
  if (isAuthorized === false) {
    return <Navigate to="/404" replace />;
  }

  // If they are an admin, let them through to the layout
  return <>{children}</>;
};

export const App: React.FC = () => {
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');

  useEffect(() => {
    if (theme === 'dark' || document.documentElement.classList.contains('dark')) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }

    const handleStorageChange = () => {
      const newTheme = localStorage.getItem('theme') || 'light';
      setTheme(newTheme);
      if (newTheme === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [theme]);

  return (
    <Router>
      <ScrollToTop />

      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
        <Routes>
          
          {/* ==========================================
              ADMIN ROUTES (Secured by AdminProtectedRoute)
              ========================================== */}
          <Route 
            path="/admin" 
            element={
              <AdminProtectedRoute>
                <AdminLayout />
              </AdminProtectedRoute>
            }
          >
            <Route index element={<AdminOverview />} />
            <Route path="orders" element={<AdminOrders />} />
            <Route path="checkouts" element={<AdminCheckouts />} />
            <Route path="products" element={<AdminProducts />} />
            <Route path="users" element={<AdminUsers />} />
            <Route path="withdrawals" element={<AdminWithdrawals />} />
            <Route path="routing" element={<AdminCheckoutAccount />} />
          </Route>

          {/* ==========================================
              MAIN PUBLIC ROUTES (Wrapped in NavigationShell)
              ========================================== */}
          <Route 
            path="/*" 
            element={
              <NavigationShell theme={theme}>
                <Routes>
                  <Route path="/" element={<Home />} />
                  <Route path="/auth" element={<AuthPage />} />
                  
                  <Route path="/shop" element={<ShopHub />} />
                  <Route path="/cart" element={<Cart />} />
                  <Route path="/checkout" element={<Checkout />} />
                  <Route path="/success" element={<Success />} />
                  <Route path="/shop/:categoryId" element={<Shop />} />
                  
                  <Route path="/product/:id" element={<ProductDetails />} />
                  <Route path="/profile/:userId" element={<Profile />} />
                  
                  <Route path="/messages" element={<Messages />} />
                  <Route path="/dashboard" element={<Dashboard />} />
                  
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </NavigationShell>
            } 
          />

        </Routes>
      </div>
    </Router>
  );
};

export default App;