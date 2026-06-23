import React, { useState, useEffect } from 'react';
import { Receipt, Search, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';

type CheckoutRecord = {
  id: string;
  order_id: string;
  transaction_reference: string;
  amount: number;
  status: string;
  created_at: string;
};

export const AdminCheckouts: React.FC = () => {
  const [checkouts, setCheckouts] = useState<CheckoutRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    const fetchCheckouts = async () => {
      const { data, error } = await supabase
        .from('checkouts')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && data) {
        setCheckouts(data as CheckoutRecord[]);
      }
      setLoading(false);
    };

    fetchCheckouts();
  }, []);

  // --- THE FIX: ADDED ABILITY FOR ADMIN TO CONFIRM PAYMENT ---
  const handleVerifyPayment = async (checkoutId: string, orderId: string) => {
    if (!window.confirm("Confirm this PayPal payment has been received? This will notify the buyer and secure the funds in escrow.")) return;
    
    setProcessingId(checkoutId);

    try {
      // 1. Update the orders table so the buyer sees "Payment Secured"
      const { error: orderError } = await supabase
        .from('orders')
        .update({ status: 'paid' })
        .eq('id', orderId);

      if (orderError) throw orderError;

      // 2. Ensure the checkout table is synced to completed
      const { error: checkoutError } = await supabase
        .from('checkouts')
        .update({ status: 'completed' })
        .eq('id', checkoutId);

      if (checkoutError) throw checkoutError;

      // 3. Update the UI locally
      setCheckouts(checkouts.map(c => c.id === checkoutId ? { ...c, status: 'completed' } : c));
      alert("Payment verified successfully!");

    } catch (err) {
      console.error("Failed to verify payment:", err);
      alert("An error occurred while verifying the payment.");
    } finally {
      setProcessingId(null);
    }
  };

  const filteredCheckouts = checkouts.filter(c => 
    c.transaction_reference?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.order_id?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 tracking-tight">Checkout Ledger</h1>
          <p className="text-gray-500 font-medium text-sm mt-1">Verify manual payments and manage raw transaction records.</p>
        </div>
        
        <div className="relative">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input 
            type="text" 
            placeholder="Search by ref or Order ID..." 
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
                <th className="p-5">Transaction Ref</th>
                <th className="p-5">Linked Order ID</th>
                <th className="p-5">Amount</th>
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
              ) : filteredCheckouts.length > 0 ? (
                filteredCheckouts.map(record => (
                  <tr key={record.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="p-5">
                      <p className="font-mono text-xs font-semibold text-gray-900">{record.transaction_reference || 'N/A'}</p>
                      <p className="text-[10px] font-medium text-gray-500 mt-1">{new Date(record.created_at).toLocaleString()}</p>
                    </td>
                    <td className="p-5">
                      <p className="font-mono text-xs font-medium text-gray-500">{record.order_id}</p>
                    </td>
                    <td className="p-5">
                      <p className="text-sm font-bold text-gray-900">${record.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
                    </td>
                    <td className="p-5">
                      <span className={`inline-flex px-2 py-1 rounded border text-[10px] font-bold uppercase tracking-wider ${
                        record.status === 'completed' ? 'bg-green-50 text-green-600 border-green-100' : 'bg-yellow-50 text-yellow-600 border-yellow-100'
                      }`}>
                        {record.status}
                      </span>
                    </td>
                    <td className="p-5 text-right">
                      {/* --- ADMIN ACTION BUTTON --- */}
                      {record.status === 'pending' || record.status !== 'completed' ? (
                        <button 
                          onClick={() => handleVerifyPayment(record.id, record.order_id)}
                          disabled={processingId === record.id}
                          className="bg-indigo-600 text-white hover:bg-indigo-700 px-4 py-2 rounded-lg text-xs font-semibold transition-colors disabled:opacity-50"
                        >
                          {processingId === record.id ? <Loader2 size={14} className="animate-spin inline" /> : 'Verify Payment'}
                        </button>
                      ) : (
                        <div className="flex justify-end items-center text-green-600 space-x-1">
                          <CheckCircle2 size={16} />
                          <span className="text-xs font-semibold">Verified</span>
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="p-12 text-center text-gray-500">
                    <Receipt size={24} className="mx-auto mb-2 opacity-50" />
                    <p className="font-medium text-sm">No records found.</p>
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