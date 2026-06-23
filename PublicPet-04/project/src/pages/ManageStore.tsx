import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Package, Edit2, Trash2, Wallet, Eye, ShieldCheck, 
  TrendingUp, User, Phone, MapPin, FileText, Truck, CheckCircle, WalletCards
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';
import { WalletDetailsModal } from '../components/WalletDetailsModal';
import { EditListingModal } from '../components/EditListingModal';
import { DeleteConfirmationModal } from '../components/DeleteConfirmationModal';

type Product = { id: string; title: string; price: number; image_url: string; is_available: boolean; views: number; };

type Order = {
  id: string; product_title: string; amount: number;
  status: 'pending' | 'paid' | 'shipped' | 'delivered' | 'completed';
  created_at: string; full_name?: string; phone_number?: string;
  nickname?: string; shipping_address?: string; landmark?: string; additional_notes?: string;
};

export const ManageStore: React.FC = () => {
  const navigate = useNavigate();
  const [sessionUser, setSessionUser] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const [listings, setListings] = useState<Product[]>([]);
  const [sellerOrders, setSellerOrders] = useState<Order[]>([]);
  const [walletBalance, setWalletBalance] = useState<number>(0);
  const [pendingBalance, setPendingBalance] = useState<number>(0);

  const [isWalletModalOpen, setIsWalletModalOpen] = useState(false);
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [deletingProductId, setDeletingProductId] = useState<string | null>(null);
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);

  useEffect(() => {
    const fetchStoreData = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) { navigate('/auth'); return; }
      setSessionUser(session.user.id);

      const [listingsRes, walletRes, sellerOrdersRes] = await Promise.all([
        supabase.from('products').select('*').eq('seller_id', session.user.id).order('created_at', { ascending: false }),
        supabase.from('wallets').select('balance, pending_balance').eq('user_id', session.user.id).single(),
        // SELLER ONLY SEES ORDERS THAT ARE NOT PENDING
        supabase.from('orders').select('*').eq('seller_id', session.user.id).neq('status', 'pending').order('created_at', { ascending: false })
      ]);

      setListings((listingsRes.data as Product[]) || []);
      setWalletBalance(walletRes.data?.balance || 0);
      setPendingBalance(walletRes.data?.pending_balance || 0);
      setSellerOrders((sellerOrdersRes.data as Order[]) || []);
      setLoading(false);
    };

    fetchStoreData();
  }, [navigate]);

  const handleDelete = async (id: string) => {
    setListings(listings.filter(item => item.id !== id));
    await supabase.from('products').delete().eq('id', id);
  };

  const handleConfirmShipment = async (orderId: string) => {
    setSellerOrders(sellerOrders.map(o => o.id === orderId ? { ...o, status: 'shipped' as const } : o));
    await supabase.from('orders').update({ status: 'shipped' }).eq('id', orderId);
  };

  // NEW: Finalize order and move funds to main wallet
  const handleFinalizeOrder = async (orderId: string, amount: number) => {
    try {
      const { error } = await supabase.rpc('seller_finalize_order', { p_order_id: orderId });
      if (error) throw error;
      
      setSellerOrders(sellerOrders.map(o => o.id === orderId ? { ...o, status: 'completed' as const } : o));
      setPendingBalance(prev => prev - amount);
      setWalletBalance(prev => prev + amount);
      alert("Order completed! Funds have been moved to your Available Balance.");
    } catch (err) {
      console.error(err);
      alert("Failed to finalize order.");
    }
  };

  const toggleOrderDetails = (orderId: string) => setExpandedOrderId(prev => prev === orderId ? null : orderId);
  const totalViews = listings.reduce((acc, item) => acc + (item.views || 0), 0);
  const activeCount = listings.filter(l => l.is_available).length;

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-8 max-w-7xl mx-auto">
      {/* STATS ROW */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 border border-gray-100 rounded-2xl bg-white shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <div className="text-gray-500 font-semibold text-xs uppercase tracking-wider">Wallet Balance</div>
            <div className="w-8 h-8 bg-green-50 text-green-600 rounded-lg flex items-center justify-center"><Wallet size={16} /></div>
          </div>
          <div className="flex flex-col mt-1">
            <div className="text-3xl font-semibold text-gray-900">
              {loading ? <div className="w-20 h-8 bg-gray-100 rounded animate-pulse" /> : `$${walletBalance.toFixed(2)}`}
            </div>
            <div className="flex items-center justify-between mt-3 border-t border-gray-50 pt-3">
              <div className="flex items-center space-x-1.5 text-xs font-medium text-gray-500">
                <ShieldCheck size={12} className="text-indigo-500" />
                <span>Pending Escrow: <strong className="text-gray-900">${pendingBalance.toFixed(2)}</strong></span>
              </div>
              <button onClick={() => setIsWalletModalOpen(true)} className="text-[11px] font-semibold text-indigo-600 bg-indigo-50 px-2 py-1 rounded-md hover:bg-indigo-100 transition-colors">
                View
              </button>
            </div>
          </div>
        </div>

        <div className="p-5 border border-gray-100 rounded-2xl bg-white shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <div className="text-gray-500 font-semibold text-xs uppercase tracking-wider">Active Listings</div>
            <div className="w-8 h-8 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center"><Package size={16} /></div>
          </div>
          <div className="text-3xl font-semibold text-gray-900 mt-2">{loading ? <div className="w-12 h-8 bg-gray-100 rounded animate-pulse" /> : activeCount}</div>
        </div>

        <div className="p-5 border border-gray-100 rounded-2xl bg-white shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <div className="text-gray-500 font-semibold text-xs uppercase tracking-wider">Total Views</div>
            <div className="w-8 h-8 bg-purple-50 text-purple-600 rounded-lg flex items-center justify-center"><Eye size={16} /></div>
          </div>
          <div className="text-3xl font-semibold text-gray-900 mt-2">{loading ? <div className="w-12 h-8 bg-gray-100 rounded animate-pulse" /> : totalViews}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* LEFT: INVENTORY */}
        <div className="lg:col-span-2">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 tracking-tight">Your Inventory</h2>
          <div className="flex flex-col space-y-3">
            {loading ? (
              <div className="space-y-3"><div className="h-20 bg-white rounded-2xl animate-pulse border border-gray-100" /><div className="h-20 bg-white rounded-2xl animate-pulse border border-gray-100" /></div>
            ) : listings.length > 0 ? (
              listings.map((item) => (
                <div key={item.id} className="group flex flex-row items-center justify-between p-3 border border-gray-100 rounded-2xl hover:border-indigo-200 hover:shadow-sm transition-all bg-white gap-4">
                  <div className="flex items-center space-x-4">
                    <div className="w-14 h-14 rounded-xl bg-gray-50 overflow-hidden flex-shrink-0 border border-gray-100">
                      {item.image_url ? <img src={item.image_url} alt={item.title} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-gray-300"><Package size={20} /></div>}
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 text-base line-clamp-1 group-hover:text-indigo-600 transition-colors">{item.title}</h3>
                      <div className="flex items-center space-x-2 mt-1">
                        <span className="text-indigo-600 font-semibold text-xs">${item.price.toFixed(2)}</span>
                        <span className="text-gray-300">•</span>
                        <span className="flex items-center text-[10px] font-semibold text-gray-400"><Eye size={10} className="mr-1" /> {item.views || 0}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-1 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                    <button onClick={() => setEditingProductId(item.id)} className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"><Edit2 size={16} /></button>
                    <button onClick={() => setDeletingProductId(item.id)} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"><Trash2 size={16} /></button>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-12 text-center border-2 border-dashed border-gray-100 rounded-2xl flex flex-col items-center bg-gray-50">
                <Package size={32} className="text-gray-300 mb-3" />
                <p className="text-gray-500 font-semibold text-sm">Your shop is empty.</p>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT: STORE ORDERS */}
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4 tracking-tight">Store Orders</h2>
          <div className="bg-gray-50 border border-gray-100 rounded-2xl p-4">
            {loading ? (
              <div className="h-20 bg-gray-100 rounded-xl animate-pulse" />
            ) : sellerOrders.length > 0 ? (
              <div className="space-y-4">
                {sellerOrders.map(order => (
                  <div key={order.id} className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm">
                    <div className="flex items-center justify-between cursor-pointer group" onClick={() => toggleOrderDetails(order.id)}>
                      <div>
                        <p className="text-sm font-semibold text-gray-900 line-clamp-1 group-hover:text-indigo-600 transition-colors">{order.product_title}</p>
                        <p className="text-[10px] font-medium text-gray-400 mt-1">{new Date(order.created_at).toLocaleDateString()}</p>
                      </div>
                      <span className="font-semibold text-green-600 text-sm whitespace-nowrap ml-3">+${order.amount.toFixed(2)}</span>
                    </div>

                    <AnimatePresence>
                      {expandedOrderId === order.id && (
                        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden mt-4 pt-4 border-t border-gray-50">
                          <div className="space-y-3 mb-4">
                            <div className="flex items-start space-x-2 text-sm">
                              <User size={14} className="text-gray-400 mt-0.5 flex-shrink-0" />
                              <div>
                                <p className="font-semibold text-gray-900">{order.full_name}</p>
                                {order.nickname && <p className="text-xs text-gray-500 font-medium">aka {order.nickname}</p>}
                              </div>
                            </div>
                            <div className="flex items-center space-x-2 text-sm">
                              <Phone size={14} className="text-gray-400 flex-shrink-0" />
                              <p className="font-medium text-gray-600">{order.phone_number}</p>
                            </div>
                            <div className="flex items-start space-x-2 text-sm">
                              <MapPin size={14} className="text-gray-400 mt-0.5 flex-shrink-0" />
                              <div>
                                <p className="font-medium text-gray-600 leading-snug">{order.shipping_address}</p>
                                {order.landmark && <p className="text-xs text-gray-500 mt-0.5">Landmark: {order.landmark}</p>}
                              </div>
                            </div>
                            {order.additional_notes && (
                              <div className="flex items-start space-x-2 text-sm bg-gray-50 p-2 rounded-lg mt-2">
                                <FileText size={14} className="text-gray-400 mt-0.5 flex-shrink-0" />
                                <p className="font-medium text-gray-600 italic">"{order.additional_notes}"</p>
                              </div>
                            )}
                          </div>

                          {order.status === 'paid' ? (
                            <button onClick={() => handleConfirmShipment(order.id)} className="w-full bg-gray-900 text-white hover:bg-gray-800 py-2.5 rounded-xl text-xs font-semibold transition-colors flex items-center justify-center space-x-2">
                              <Truck size={14} /><span>Confirm & Ship Order</span>
                            </button>
                          ) : order.status === 'delivered' ? (
                            <button onClick={() => handleFinalizeOrder(order.id, order.amount)} className="w-full bg-green-600 text-white hover:bg-green-700 py-2.5 rounded-xl text-xs font-semibold transition-colors flex items-center justify-center space-x-2 shadow-md shadow-green-600/20">
                              <WalletCards size={14} /><span>Complete & Claim Funds</span>
                            </button>
                          ) : order.status === 'completed' ? (
                            <div className="w-full flex items-center justify-center space-x-1.5 text-gray-500 bg-gray-100 py-2.5 rounded-xl text-xs font-semibold">
                              <CheckCircle size={14} /><span>Order Completed & Paid</span>
                            </div>
                          ) : (
                            <div className="w-full flex items-center justify-center space-x-1.5 text-indigo-600 bg-indigo-50 py-2.5 rounded-xl text-xs font-semibold">
                              <CheckCircle size={14} /><span>Shipped - Awaiting Buyer</span>
                            </div>
                          )}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6">
                <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center mx-auto mb-2 text-gray-300 shadow-sm border border-gray-100"><TrendingUp size={16} /></div>
                <p className="font-semibold text-gray-500 text-sm">No sales yet.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <WalletDetailsModal isOpen={isWalletModalOpen} onClose={() => setIsWalletModalOpen(false)} userId={sessionUser || ''} balance={walletBalance} />
      <EditListingModal isOpen={!!editingProductId} onClose={() => setEditingProductId(null)} productId={editingProductId} onSuccess={(updatedItem) => { setListings(listings.map(l => l.id === updatedItem.id ? { ...l, ...updatedItem } : l)); setEditingProductId(null); }} />
      <DeleteConfirmationModal isOpen={!!deletingProductId} onClose={() => setDeletingProductId(null)} onConfirm={async () => { if (deletingProductId) { await handleDelete(deletingProductId); setDeletingProductId(null); } }} />
    </motion.div>
  );
};