import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Users, AlertTriangle, CheckCircle, XCircle, Trash2, Smartphone, Mail } from 'lucide-react';
import { supabase } from '../lib/supabase';

// --- TYPES ---
type AdminProduct = {
  id: string;
  title: string;
  category: string;
  price: number;
  status: 'pending' | 'approved' | 'rejected';
  seller: { full_name: string; email: string };
};

type PlatformUser = {
  id: string;
  full_name: string;
  email: string;
  phone_verified: boolean;
  email_verified: boolean;
  is_banned: boolean;
  created_at: string;
};

// --- SKELETON LOADER ---
const TableRowSkeleton = () => (
  <div className="flex items-center justify-between p-4 border-b border-gray-50">
    <div className="flex items-center space-x-4 w-1/3">
      <div className="w-10 h-10 rounded-lg bg-gray-100 animate-pulse"></div>
      <div className="space-y-2 flex-1">
        <div className="h-4 bg-gray-100 rounded animate-pulse w-3/4"></div>
        <div className="h-3 bg-gray-100 rounded animate-pulse w-1/2"></div>
      </div>
    </div>
    <div className="w-24 h-4 bg-gray-100 rounded animate-pulse"></div>
    <div className="w-20 h-8 bg-gray-100 rounded-lg animate-pulse"></div>
  </div>
);

export const AdminDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'moderation' | 'users'>('moderation');
  const [loading, setLoading] = useState(true);
  
  // Data States
  const [pendingListings, setPendingListings] = useState<AdminProduct[]>([]);
  const [platformUsers, setPlatformUsers] = useState<PlatformUser[]>([]);

  useEffect(() => {
    fetchAdminData();
  }, [activeTab]);

  const fetchAdminData = async () => {
    setLoading(true);
    // In production, these queries run against secure Admin views or via Supabase RPC functions 
    // to bypass standard RLS policies, ensuring you see everything.
    
    setTimeout(() => {
      if (activeTab === 'moderation') {
        // Mocking pending listings for UI demonstration
        setPendingListings([
          { id: '1', title: 'Golden Retriever Puppy', category: 'pet_listing', price: 0, status: 'pending', seller: { full_name: 'Sarah Jenkins', email: 'sarah@example.com' } },
          { id: '2', title: 'Premium Kibble 50lb', category: 'food', price: 45.99, status: 'pending', seller: { full_name: 'Local Pet Co', email: 'sales@localpet.com' } },
        ]);
      } else {
        // Mocking users with privacy-first verification stats
        setPlatformUsers([
          { id: '101', full_name: 'Sarah Jenkins', email: 'sarah@example.com', phone_verified: true, email_verified: true, is_banned: false, created_at: '2026-05-10' },
          { id: '102', full_name: 'Local Pet Co', email: 'sales@localpet.com', phone_verified: false, email_verified: true, is_banned: false, created_at: '2026-05-12' },
          { id: '103', full_name: 'Sketchy Vendor', email: 'burner@anon.com', phone_verified: false, email_verified: false, is_banned: true, created_at: '2026-05-15' },
        ]);
      }
      setLoading(false);
    }, 800);
  };

  const handleAction = (id: string, action: string) => {
    // Optimistic UI updates for admin actions
    if (activeTab === 'moderation') {
      setPendingListings(prev => prev.filter(item => item.id !== id));
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-32 pt-12 px-6 md:px-12 lg:px-24 font-sans">
      
      {/* HEADER */}
      <div className="mb-10">
        <div className="inline-flex items-center space-x-2 bg-black text-white px-4 py-2 rounded-full mb-4 font-bold text-xs uppercase tracking-wider">
          <Shield size={14} />
          <span>Admin Portal</span>
        </div>
        <h1 className="text-3xl md:text-5xl font-black text-black tracking-tight">
          Platform Overview
        </h1>
      </div>

      {/* METRICS CARDS */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
        {[
          { label: 'Total Users', value: '1,248', color: 'text-black' },
          { label: 'Active Listings', value: '842', color: 'text-black' },
          { label: 'Pending Review', value: pendingListings.length.toString(), color: 'text-blue-600' },
          { label: 'Flagged Items', value: '3', color: 'text-red-600' },
        ].map((stat, idx) => (
          <div key={idx} className="p-6 bg-white border border-gray-100 rounded-2xl shadow-sm">
            <div className="text-gray-500 text-sm font-semibold mb-1">{stat.label}</div>
            <div className={`text-3xl font-black ${stat.color}`}>{stat.value}</div>
          </div>
        ))}
      </div>

      {/* ADMIN NAVIGATION TABS */}
      <div className="flex space-x-2 mb-6 bg-white p-2 rounded-2xl border border-gray-100 w-fit shadow-sm">
        <button
          onClick={() => setActiveTab('moderation')}
          className={`flex items-center space-x-2 px-6 py-3 rounded-xl font-bold text-sm transition-all ${
            activeTab === 'moderation' ? 'bg-black text-white shadow-md' : 'text-gray-500 hover:text-black hover:bg-gray-50'
          }`}
        >
          <AlertTriangle size={18} />
          <span>Moderation Queue</span>
        </button>
        <button
          onClick={() => setActiveTab('users')}
          className={`flex items-center space-x-2 px-6 py-3 rounded-xl font-bold text-sm transition-all ${
            activeTab === 'users' ? 'bg-black text-white shadow-md' : 'text-gray-500 hover:text-black hover:bg-gray-50'
          }`}
        >
          <Users size={18} />
          <span>Vendor Directory</span>
        </button>
      </div>

      {/* DATA AREA */}
      <div className="bg-white border border-gray-100 rounded-3xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <div className="min-w-[800px]">
            
            {/* Table Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-100 bg-gray-50/50">
              <div className="text-xs font-bold text-gray-400 uppercase tracking-wider w-1/3">
                {activeTab === 'moderation' ? 'Listing Details' : 'Vendor Identity'}
              </div>
              <div className="text-xs font-bold text-gray-400 uppercase tracking-wider w-1/4">
                {activeTab === 'moderation' ? 'Category' : 'Verification Status'}
              </div>
              <div className="text-xs font-bold text-gray-400 uppercase tracking-wider w-1/4 text-right">
                Actions
              </div>
            </div>

            {/* Table Body */}
            <div className="divide-y divide-gray-50">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => <TableRowSkeleton key={i} />)
              ) : activeTab === 'moderation' ? (
                
                /* MODERATION VIEW */
                pendingListings.length > 0 ? pendingListings.map(item => (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} key={item.id} className="flex items-center justify-between p-6 hover:bg-gray-50 transition-colors">
                    <div className="w-1/3">
                      <h3 className="font-bold text-black">{item.title}</h3>
                      <p className="text-sm text-gray-500">by {item.seller.full_name}</p>
                    </div>
                    <div className="w-1/4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-bold bg-blue-50 text-blue-600 uppercase tracking-wider">
                        {item.category.replace('_', ' ')}
                      </span>
                    </div>
                    <div className="w-1/4 flex justify-end space-x-2">
                      <button onClick={() => handleAction(item.id, 'approve')} className="flex items-center space-x-1 px-3 py-2 bg-black text-white rounded-lg hover:bg-gray-800 text-sm font-semibold transition-colors">
                        <CheckCircle size={16} />
                        <span>Approve</span>
                      </button>
                      <button onClick={() => handleAction(item.id, 'reject')} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </motion.div>
                )) : (
                  <div className="p-12 text-center text-gray-400">Queue is clear. Excellent work.</div>
                )

              ) : (

                /* USERS VIEW */
                platformUsers.length > 0 ? platformUsers.map(user => (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} key={user.id} className="flex items-center justify-between p-6 hover:bg-gray-50 transition-colors">
                    <div className="w-1/3">
                      <h3 className={`font-bold ${user.is_banned ? 'text-gray-400 line-through' : 'text-black'}`}>
                        {user.full_name}
                      </h3>
                      <p className="text-sm text-gray-500">{user.email}</p>
                    </div>
                    <div className="w-1/4 flex items-center space-x-3">
                      {/* Privacy-First Verification Badges */}
                      <div className={`flex items-center space-x-1 text-xs font-bold px-2 py-1 rounded-md ${user.phone_verified ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-400'}`}>
                        <Smartphone size={12} />
                        <span>SMS</span>
                      </div>
                      <div className={`flex items-center space-x-1 text-xs font-bold px-2 py-1 rounded-md ${user.email_verified ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-400'}`}>
                        <Mail size={12} />
                        <span>Email</span>
                      </div>
                    </div>
                    <div className="w-1/4 flex justify-end space-x-2">
                      {user.is_banned ? (
                        <button className="px-3 py-2 bg-gray-100 text-gray-500 rounded-lg text-sm font-semibold cursor-not-allowed">
                          Banned
                        </button>
                      ) : (
                        <button className="flex items-center space-x-1 px-3 py-2 text-gray-500 border border-gray-200 rounded-lg hover:text-red-600 hover:border-red-200 hover:bg-red-50 text-sm font-semibold transition-all">
                          <XCircle size={16} />
                          <span>Ban User</span>
                        </button>
                      )}
                    </div>
                  </motion.div>
                )) : (
                  <div className="p-12 text-center text-gray-400">No users found.</div>
                )

              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};