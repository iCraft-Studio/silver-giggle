import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingBag, Clock, Package, CheckCircle, ShieldCheck, MapPin, Phone, User, FileText } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';

type Order = {
  id: string; product_title: string; amount: number;
  status: 'pending' | 'paid' | 'shipped' | 'delivered' | 'completed';
  created_at: string; full_name?: string; phone_number?: string;
  shipping_address?: string; additional_notes?: string; seller_id: string;
  seller?: { full_name: string };
};

export const ManageOrders: React.FC = () => {
  const navigate = useNavigate();
  const [sessionUser, setSessionUser] = useState<string | null>(null);
  const [buyerOrders, setBuyerOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);

  useEffect(() => {
    const fetchOrders = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) { navigate('/auth'); return; }
      setSessionUser(session.user.id);

      // Fetch orders AND the seller's name so the buyer knows who they bought from
      const { data } = await supabase
        .from('orders')
        .select('*, seller:users(full_name)')
        .eq('buyer_id', session.user.id)
        .order('created_at', { ascending: false });
        
      if (data) {
        // Handle array mapping for seller data if needed
        const formattedData = data.map(d => ({
          ...d,
          seller: Array.isArray(d.seller) ? d.seller[0] : d.seller
        }));
        setBuyerOrders(formattedData as Order[]);
      }
      setLoading(false);
    };

    fetchOrders();
  }, [navigate]);

  const handleConfirmReceipt = async (orderId: string) => {
    setBuyerOrders(buyerOrders.map(o => o.id === orderId ? { ...o, status: 'delivered' as const } : o));
    await supabase.from('orders').update({ status: 'delivered' }).eq('id', orderId);
  };

  const toggleOrderDetails = (orderId: string) => setExpandedOrderId(prev => prev === orderId ? null : orderId);

  if (loading) return (
    <div className="max-w-4xl mx-auto space-y-4">
      <div className="h-24 bg-white rounded-2xl animate-pulse border border-gray-100" />
      <div className="h-24 bg-white rounded-2xl animate-pulse border border-gray-100" />
    </div>
  );

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="max-w-4xl mx-auto">
      <h2 className="text-lg font-semibold text-gray-900 mb-4 tracking-tight">Order History</h2>
      
      <div className="flex flex-col space-y-4">
        {buyerOrders.length > 0 ? (
          buyerOrders.map((order) => (
            <div key={order.id} className="flex flex-col bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden transition-all hover:border-indigo-100 hover:shadow-md">
              <div className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 cursor-pointer" onClick={() => toggleOrderDetails(order.id)}>
                <div>
                  <h3 className="font-semibold text-gray-900 text-base">{order.product_title}</h3>
                  <div className="flex items-center space-x-2 mt-1">
                    <span className="text-indigo-600 font-semibold text-sm">${order.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                    <span className="text-gray-300">•</span>
                    <span className="flex items-center text-[11px] font-semibold text-gray-400">
                      <Clock size={12} className="mr-1" /> {new Date(order.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                <div>
                  {order.status === 'pending' ? (
                     <div className="flex items-center space-x-1.5 text-yellow-600 bg-yellow-50 px-3 py-1.5 rounded-lg text-xs font-semibold border border-yellow-100 w-max">
                       <Clock size={12} /><span>Pending Platform Confirmation</span>
                     </div>
                  ) : order.status === 'paid' ? (
                     <div className="flex items-center space-x-1.5 text-blue-600 bg-blue-50 px-3 py-1.5 rounded-lg text-xs font-semibold border border-blue-100 w-max">
                       <ShieldCheck size={12} /><span>Payment Secured. Awaiting Shipment</span>
                     </div>
                  ) : order.status === 'shipped' ? (
                    <button onClick={(e) => { e.stopPropagation(); handleConfirmReceipt(order.id); }} className="bg-indigo-600 text-white hover:bg-indigo-700 px-4 py-2.5 rounded-xl text-xs font-semibold transition-colors flex items-center justify-center space-x-2 shadow-sm shadow-indigo-600/20">
                      <Package size={14} /><span>Confirm Receipt</span>
                    </button>
                  ) : (
                    <div className="flex items-center space-x-1.5 text-green-600 bg-green-50 px-3 py-1.5 rounded-lg text-xs font-semibold border border-green-100 w-max">
                      <CheckCircle size={14} /><span>{order.status === 'completed' ? 'Order Completed' : 'Delivered'}</span>
                    </div>
                  )}
                </div>
              </div>

              <AnimatePresence>
                {expandedOrderId === order.id && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="px-4 sm:px-5 pb-5 border-t border-gray-50 bg-gray-50/50">
                    <div className="pt-5 grid grid-cols-1 md:grid-cols-2 gap-6">
                      
                      {/* Left: Detailed Shipping Info */}
                      <div className="space-y-4">
                        <div>
                          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2 flex items-center space-x-1">
                            <MapPin size={12} /> <span>Delivery Address</span>
                          </p>
                          <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                            <p className="text-sm font-semibold text-gray-900">{order.full_name}</p>
                            <p className="text-sm font-medium text-gray-600 mt-1 leading-snug">{order.shipping_address}</p>
                          </div>
                        </div>

                        <div>
                          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2 flex items-center space-x-1">
                            <Phone size={12} /> <span>Contact Info</span>
                          </p>
                          <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex flex-col space-y-2">
                            <p className="text-sm font-medium text-gray-900">{order.phone_number}</p>
                            {order.additional_notes && (
                              <div className="flex items-start space-x-2 pt-2 border-t border-gray-50">
                                <FileText size={14} className="text-gray-400 mt-0.5" />
                                <p className="text-xs font-medium text-gray-500 italic">"{order.additional_notes}"</p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Right: Order Meta & Escrow Status */}
                      <div className="space-y-4">
                        <div>
                          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2 flex items-center space-x-1">
                            <ShieldCheck size={12} /> <span>Transaction Details</span>
                          </p>
                          <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm space-y-3">
                            <div className="flex justify-between items-center text-sm">
                              <span className="font-medium text-gray-500">Order ID:</span>
                              <span className="font-mono text-gray-900 text-xs">{order.id.split('-')[0]}...</span>
                            </div>
                            <div className="flex justify-between items-center text-sm">
                              <span className="font-medium text-gray-500">Seller:</span>
                              <span className="font-semibold text-indigo-600">{order.seller?.full_name || 'Verified User'}</span>
                            </div>
                            <div className="flex justify-between items-center text-sm">
                              <span className="font-medium text-gray-500">Date Placed:</span>
                              <span className="font-semibold text-gray-900">{new Date(order.created_at).toLocaleString()}</span>
                            </div>
                            <div className="pt-3 border-t border-gray-50 flex justify-between items-center">
                              <span className="font-semibold text-gray-900 text-sm">Total Paid:</span>
                              <span className="font-bold text-indigo-600">${order.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                            </div>
                          </div>
                        </div>

                        {/* Security Reminder */}
                        <div className="bg-indigo-50 border border-indigo-100 p-3 rounded-xl flex items-start space-x-2">
                          <ShieldCheck size={16} className="text-indigo-600 mt-0.5 flex-shrink-0" />
                          <p className="text-xs font-medium text-indigo-600/80 leading-relaxed">
                            Your funds are currently locked in the platform escrow vault. They will not be released to the seller until you confirm receipt.
                          </p>
                        </div>
                      </div>

                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))
        ) : (
          <div className="py-16 text-center border-2 border-dashed border-gray-100 rounded-2xl flex flex-col items-center bg-gray-50">
            <ShoppingBag size={32} className="text-gray-300 mb-3" />
            <h3 className="text-base font-semibold text-gray-900 mb-1">No orders yet</h3>
            <p className="text-gray-500 font-medium text-sm">When you buy something, you can track it here.</p>
          </div>
        )}
      </div>
    </motion.div>
  );
};