import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  TrendingUp, Users, Package, ArrowRightLeft, 
  ChevronRight, Clock, ShoppingBag, ShieldCheck, Activity, Loader2 
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Link } from 'react-router-dom';

type DashboardStats = {
  totalRevenue: number;
  totalUsers: number;
  activeListings: number;
  pendingWithdrawals: number;
};

type RecentOrder = {
  id: string;
  product_title: string;
  amount: number;
  status: string;
  created_at: string;
  buyer?: { full_name: string };
};

export const AdminOverview: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats>({
    totalRevenue: 0,
    totalUsers: 0,
    activeListings: 0,
    pendingWithdrawals: 0
  });
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOverviewData = async () => {
      // 1. Fetch Revenue (Sum of all orders that are paid or completed)
      const { data: revenueData } = await supabase
        .from('orders')
        .select('amount')
        .in('status', ['paid', 'shipped', 'delivered', 'completed']);
      
      const totalRevenue = revenueData?.reduce((acc, order) => acc + (order.amount || 0), 0) || 0;

      // 2. Fetch Total Users count
      const { count: usersCount } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true });

      // 3. Fetch Active Listings count
      const { count: listingsCount } = await supabase
        .from('products')
        .select('*', { count: 'exact', head: true })
        .eq('is_available', true);

      // 4. Fetch Pending Withdrawals count
      const { count: withdrawalsCount } = await supabase
        .from('withdrawals')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending');

      // 5. Fetch Recent Orders
      const { data: ordersData } = await supabase
        .from('orders')
        .select(`
          id, product_title, amount, status, created_at,
          buyer:users!orders_buyer_id_fkey(full_name)
        `)
        .order('created_at', { ascending: false })
        .limit(5);

      if (ordersData) {
        const formattedOrders = ordersData.map(o => ({
          ...o,
          buyer: Array.isArray(o.buyer) ? o.buyer[0] : o.buyer
        }));
        setRecentOrders(formattedOrders as RecentOrder[]);
      }

      setStats({
        totalRevenue,
        totalUsers: usersCount || 0,
        activeListings: listingsCount || 0,
        pendingWithdrawals: withdrawalsCount || 0
      });
      
      setLoading(false);
    };

    fetchOverviewData();
  }, []);

  const STAT_CARDS = [
    { title: "Total Volume securely processed", value: `$${stats.totalRevenue.toLocaleString('en-US', { minimumFractionDigits: 2 })}`, icon: TrendingUp, color: "text-green-600", bg: "bg-green-50" },
    { title: "Registered Platform Users", value: stats.totalUsers.toLocaleString(), icon: Users, color: "text-indigo-600", bg: "bg-indigo-50" },
    { title: "Active Live Inventory", value: stats.activeListings.toLocaleString(), icon: Package, color: "text-blue-600", bg: "bg-blue-50" },
    { title: "Pending Payout Requests", value: stats.pendingWithdrawals.toLocaleString(), icon: ArrowRightLeft, color: "text-yellow-600", bg: "bg-yellow-50" },
  ];

  const QUICK_ACTIONS = [
    { title: "Verify Payments", desc: "Check pending manual transfers.", path: "/admin/orders", icon: ShieldCheck },
    { title: "Process Payouts", desc: "Approve seller withdrawals.", path: "/admin/withdrawals", icon: ArrowRightLeft },
    { title: "Review Users", desc: "Verify new breeders.", path: "/admin/users", icon: Users },
    { title: "Manage Inventory", desc: "Remove violating listings.", path: "/admin/products", icon: Package },
  ];

  return (
    <div className="space-y-8">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-semibold text-gray-900 tracking-tight">Platform Overview</h1>
          <p className="text-gray-500 font-medium text-sm mt-1">Real-time metrics and system health.</p>
        </div>
        <div className="flex items-center space-x-2 bg-white px-4 py-2 rounded-full shadow-sm border border-gray-100">
          <Activity size={16} className="text-green-500 animate-pulse" />
          <span className="text-xs font-bold text-gray-900 uppercase tracking-wider">System Operational</span>
        </div>
      </div>

      {/* STATS GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        {STAT_CARDS.map((stat, idx) => (
          <motion.div 
            key={idx}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm flex flex-col justify-between"
          >
            <div className="flex justify-between items-start mb-4">
              <div className={`p-3 rounded-xl ${stat.bg} ${stat.color}`}>
                <stat.icon size={20} />
              </div>
            </div>
            <div>
              <div className="text-3xl font-semibold text-gray-900 tracking-tight">
                {loading ? <div className="w-24 h-9 bg-gray-100 rounded-lg animate-pulse" /> : stat.value}
              </div>
              <p className="text-xs font-medium text-gray-500 mt-1">{stat.title}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* TWO COLUMN LAYOUT */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* RECENT ORDERS (Takes up 2 columns on large screens) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Recent Transactions</h2>
            <Link to="/admin/orders" className="text-sm font-semibold text-indigo-600 hover:text-indigo-700 transition-colors flex items-center">
              View All <ChevronRight size={16} className="ml-0.5" />
            </Link>
          </div>
          
          <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm overflow-hidden p-2">
            {loading ? (
              <div className="space-y-2 p-4">
                {[1, 2, 3, 4].map(i => <div key={i} className="h-16 bg-gray-50 rounded-xl animate-pulse" />)}
              </div>
            ) : recentOrders.length > 0 ? (
              <div className="divide-y divide-gray-50">
                {recentOrders.map(order => (
                  <div key={order.id} className="p-4 hover:bg-gray-50/50 transition-colors flex items-center justify-between rounded-xl">
                    <div className="flex items-center space-x-4">
                      <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                        <ShoppingBag size={16} className="text-gray-500" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-900">{order.product_title}</p>
                        <p className="text-[11px] font-medium text-gray-500 mt-0.5">By: {order.buyer?.full_name || 'Guest'}</p>
                      </div>
                    </div>
                    <div className="text-right flex flex-col items-end">
                      <p className="text-sm font-bold text-gray-900">${order.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
                      <span className={`mt-1 inline-flex px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${
                        order.status === 'pending' ? 'bg-yellow-50 text-yellow-600' :
                        order.status === 'paid' ? 'bg-blue-50 text-blue-600' :
                        order.status === 'shipped' ? 'bg-indigo-50 text-indigo-600' :
                        'bg-green-50 text-green-600'
                      }`}>
                        {order.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-12 text-center text-gray-500">
                <Clock size={24} className="mx-auto mb-2 opacity-50" />
                <p className="font-medium text-sm">No recent transactions.</p>
              </div>
            )}
          </div>
        </div>

        {/* QUICK ACTIONS */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">Quick Actions</h2>
          <div className="grid grid-cols-1 gap-3">
            {QUICK_ACTIONS.map((action, idx) => (
              <Link 
                key={idx} 
                to={action.path}
                className="group bg-white border border-gray-100 p-4 rounded-2xl shadow-sm hover:border-indigo-600 hover:shadow-md transition-all flex items-center justify-between"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center group-hover:bg-indigo-50 transition-colors">
                    <action.icon size={18} className="text-gray-500 group-hover:text-indigo-600 transition-colors" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900 group-hover:text-indigo-600 transition-colors">{action.title}</h3>
                    <p className="text-[11px] font-medium text-gray-500">{action.desc}</p>
                  </div>
                </div>
                <ChevronRight size={18} className="text-gray-300 group-hover:text-indigo-600 transition-colors" />
              </Link>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
};

export default AdminOverview;