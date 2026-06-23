import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ShoppingBag, Clock, CheckCircle, Search, ShieldCheck, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';

type AdminOrder = {
  id: string;
  product_title: string;
  amount: number;
  status: 'pending' | 'paid' | 'shipped' | 'delivered' | 'completed';
  created_at: string;
  full_name: string;
  buyer_id: string;
  seller_id: string;
  buyer?: { email: string };
  seller?: { full_name: string };
};

export const AdminOrders: React.FC = () => {
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    const fetchOrders = async () => {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          buyer:users!orders_buyer_id_fkey(email),
          seller:users!orders_seller_id_fkey(full_name)
        `)
        .order('created_at', { ascending: false });

      if (!error && data) {
        // Handle array returns from joins
        const formatted = data.map(d => ({
          ...d,
          buyer: Array.isArray(d.buyer) ? d.buyer[0] : d.buyer,
          seller: Array.isArray(d.seller) ? d.seller[0] : d.seller,
        }));
        setOrders(formatted as AdminOrder[]);
      }
      setLoading(false);
    };

    fetchOrders();
  }, []);

  const handleConfirmPayment = async (orderId: string) => {
    if (!window.confirm("Are you sure you want to confirm this payment? This will lock the funds in the seller's pending escrow.")) return;
    
    setProcessingId(orderId);
    
    // Just update the status. The trigger we created in SQL handles the rest (checkouts table & wallet update)
    const { error } = await supabase
      .from('orders')
      .update({ status: 'paid' })
      .eq('id', orderId);

    if (!error) {
      setOrders(orders.map(o => o.id === orderId ? { ...o, status: 'paid' as const } : o));
    } else {
      alert("Failed to confirm payment.");
      console.error(error);
    }
    setProcessingId(null);
  };

  const filteredOrders = orders.filter(o => 
    o.id.toLowerCase().includes(searchTerm.toLowerCase()) || 
    o.product_title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    o.full_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 tracking-tight">Platform Orders</h1>
          <p className="text-gray-500 font-medium text-sm mt-1">Manage and verify all marketplace transactions.</p>
        </div>
        
        <div className="relative">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input 
            type="text" 
            placeholder="Search by ID, product, or buyer..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full sm:w-80 bg-white border border-gray-200 focus:border-indigo-600 rounded-xl pl-10 pr-4 py-2.5 text-sm font-medium text-gray-900 outline-none transition-colors shadow-sm"
          />
        </div>
      </div>

      <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto hide-scrollbar">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/50 border-b border-gray-100 text-[10px] uppercase tracking-wider text-gray-500 font-semibold">
                <th className="p-5">Order ID & Date</th>
                <th className="p-5">Product & Amount</th>
                <th className="p-5">Buyer / Seller</th>
                <th className="p-5">Status</th>
                <th className="p-5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={5} className="p-12 text-center">
                    <Loader2 size={24} className="animate-spin text-indigo-600 mx-auto" />
                  </td>
                </tr>
              ) : filteredOrders.length > 0 ? (
                filteredOrders.map(order => (
                  <motion.tr 
                    key={order.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="hover:bg-gray-50/50 transition-colors"
                  >
                    <td className="p-5">
                      <p className="font-mono text-xs font-semibold text-gray-900">{order.id.split('-')[0]}</p>
                      <p className="text-[10px] font-medium text-gray-500 mt-1">{new Date(order.created_at).toLocaleDateString()}</p>
                    </td>
                    <td className="p-5">
                      <p className="text-sm font-semibold text-gray-900 truncate max-w-[150px]">{order.product_title}</p>
                      <p className="text-sm font-bold text-indigo-600 mt-0.5">${order.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
                    </td>
                    <td className="p-5">
                      <p className="text-xs font-semibold text-gray-900 truncate max-w-[150px]">{order.full_name}</p>
                      <p className="text-[10px] font-medium text-gray-500 mt-0.5 truncate max-w-[150px]">To: {order.seller?.full_name}</p>
                    </td>
                    <td className="p-5">
                      <div className={`inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                        order.status === 'pending' ? 'bg-yellow-50 text-yellow-600 border border-yellow-100' :
                        order.status === 'paid' ? 'bg-blue-50 text-blue-600 border border-blue-100' :
                        order.status === 'shipped' ? 'bg-indigo-50 text-indigo-600 border border-indigo-100' :
                        'bg-green-50 text-green-600 border border-green-100'
                      }`}>
                        {order.status === 'pending' ? <Clock size={10} /> : 
                         order.status === 'paid' ? <ShieldCheck size={10} /> :
                         order.status === 'shipped' ? <Package size={10} /> : <CheckCircle size={10} />}
                        <span>{order.status}</span>
                      </div>
                    </td>
                    <td className="p-5 text-right">
                      {order.status === 'pending' && (
                        <button 
                          onClick={() => handleConfirmPayment(order.id)}
                          disabled={processingId === order.id}
                          className="bg-gray-900 text-white hover:bg-gray-800 px-4 py-2 rounded-lg text-xs font-semibold transition-colors disabled:opacity-50"
                        >
                          {processingId === order.id ? 'Processing...' : 'Confirm Receipt'}
                        </button>
                      )}
                    </td>
                  </motion.tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="p-12 text-center text-gray-500">
                    <ShoppingBag size={24} className="mx-auto mb-2 opacity-50" />
                    <p className="font-medium text-sm">No orders found.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};