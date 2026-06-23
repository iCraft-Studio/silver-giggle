import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, Wallet, ShieldCheck, ArrowUpRight, 
  Clock, AlertCircle, Loader2, CheckCircle2 
} from 'lucide-react';
import { supabase } from '../lib/supabase';

interface WalletDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  balance?: number; // Passed from parent for immediate display, but we fetch fresh data anyway
}

type WalletData = {
  balance: number;
  pending_balance: number;
};

type Withdrawal = {
  id: string;
  amount: number;
  status: string;
  created_at: string;
};

export const WalletDetailsModal: React.FC<WalletDetailsModalProps> = ({ isOpen, onClose, userId }) => {
  const [loading, setLoading] = useState(true);
  const [wallet, setWallet] = useState<WalletData>({ balance: 0, pending_balance: 0 });
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  
  // Payout Form State
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  // Fetch fresh wallet data and recent withdrawals when modal opens
  useEffect(() => {
    if (!isOpen || !userId) return;

    const fetchWalletDetails = async () => {
      setLoading(true);
      setSuccessMsg('');
      setWithdrawAmount('');

      const [walletRes, withdrawalsRes] = await Promise.all([
        supabase.from('wallets').select('balance, pending_balance').eq('user_id', userId).single(),
        supabase.from('withdrawals').select('*').eq('user_id', userId).order('created_at', { ascending: false }).limit(5)
      ]);

      if (walletRes.data) {
        setWallet(walletRes.data as WalletData);
      }
      if (withdrawalsRes.data) {
        setWithdrawals(withdrawalsRes.data as Withdrawal[]);
      }

      setLoading(false);
    };

    fetchWalletDetails();
  }, [isOpen, userId]);

  const handleRequestPayout = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(withdrawAmount);

    if (isNaN(amount) || amount <= 0) return;
    if (amount > wallet.balance) {
      alert("You cannot withdraw more than your available balance.");
      return;
    }

    setIsSubmitting(true);

    try {
      // 1. Insert withdrawal request
      const { data: withdrawalData, error: withdrawalError } = await supabase
        .from('withdrawals')
        .insert({
          user_id: userId,
          amount: amount,
          status: 'pending'
        })
        .select()
        .single();

      if (withdrawalError) throw withdrawalError;

      // 2. Deduct from available balance immediately
      const newBalance = wallet.balance - amount;
      const { error: walletError } = await supabase
        .from('wallets')
        .update({ balance: newBalance })
        .eq('user_id', userId);

      if (walletError) throw walletError;

      // Update UI
      setWallet(prev => ({ ...prev, balance: newBalance }));
      setWithdrawals(prev => [withdrawalData as Withdrawal, ...prev]);
      setSuccessMsg(`Your payout request of $${amount.toFixed(2)} is being processed!`);
      setWithdrawAmount('');

    } catch (error) {
      console.error("Payout request failed:", error);
      alert("Failed to request payout. Please try again.");
    } finally {
      setIsSubmitting(false);
      // Clear success message after 4 seconds
      setTimeout(() => setSuccessMsg(''), 4000);
    }
  };

  const isAmountValid = parseFloat(withdrawAmount) > 0 && parseFloat(withdrawAmount) <= wallet.balance;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => !isSubmitting && onClose()}
            className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm z-[100]"
          />
          
          {/* Modal Container */}
          <div className="fixed inset-0 z-[101] flex items-end sm:items-center justify-center pointer-events-none p-0 sm:p-6">
            <motion.div 
              initial={{ opacity: 0, y: 100, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 100, scale: 0.95 }}
              transition={{ type: "spring", bounce: 0.3, duration: 0.5 }}
              className="w-full sm:max-w-md bg-white rounded-t-[2rem] sm:rounded-[2rem] shadow-2xl pointer-events-auto flex flex-col max-h-[90vh]"
            >
              
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-100 sticky top-0 bg-white/90 backdrop-blur-md z-10 rounded-t-[2rem]">
                <h2 className="text-xl font-semibold text-gray-900 flex items-center space-x-2">
                  <Wallet size={20} className="text-indigo-600" />
                  <span>Wallet Details</span>
                </h2>
                <button 
                  onClick={onClose} 
                  disabled={isSubmitting}
                  className="p-2 bg-gray-50 hover:bg-gray-100 rounded-full text-gray-500 hover:text-gray-900 transition-colors disabled:opacity-50"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Scrollable Content */}
              <div className="p-6 overflow-y-auto hide-scrollbar space-y-6">
                
                {/* Balances Block */}
                <div className="space-y-3">
                  {/* Available Balance */}
                  <div className="bg-gray-50 border border-gray-100 rounded-2xl p-5 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-green-500/10 rounded-full blur-2xl -mr-10 -mt-10" />
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Available Balance</p>
                    <div className="text-3xl font-semibold text-gray-900">
                      {loading ? <div className="w-24 h-8 bg-gray-200 rounded animate-pulse" /> : `$${wallet.balance.toFixed(2)}`}
                    </div>
                  </div>

                  {/* Pending Escrow */}
                  <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-5 flex items-start space-x-4">
                    <ShieldCheck size={24} className="text-indigo-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs font-semibold text-indigo-600/80 uppercase tracking-wider mb-1">Pending Escrow</p>
                      <div className="text-2xl font-semibold text-indigo-600 mb-2">
                        {loading ? <div className="w-20 h-6 bg-indigo-200/50 rounded animate-pulse" /> : `$${wallet.pending_balance.toFixed(2)}`}
                      </div>
                      <p className="text-[11px] font-medium text-indigo-600/80 leading-relaxed">
                        Funds are held safely in escrow. They will automatically move to your Available Balance 5 days after shipment, or sooner if the buyer confirms delivery.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Request Payout Form */}
                <div className="border-t border-gray-100 pt-6">
                  <h3 className="text-sm font-semibold text-gray-900 mb-4">Request Payout</h3>
                  
                  {successMsg ? (
                    <motion.div 
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-green-50 text-green-700 p-4 rounded-xl flex items-center space-x-3 border border-green-100 mb-4"
                    >
                      <CheckCircle2 size={20} className="flex-shrink-0" />
                      <p className="text-sm font-medium">{successMsg}</p>
                    </motion.div>
                  ) : (
                    <form onSubmit={handleRequestPayout} className="space-y-4">
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-semibold">$</span>
                        <input 
                          type="number" 
                          min="1"
                          step="0.01"
                          max={wallet.balance}
                          required
                          value={withdrawAmount}
                          onChange={(e) => setWithdrawAmount(e.target.value)}
                          placeholder="0.00"
                          className="w-full bg-gray-50 border-2 border-transparent focus:border-indigo-600 focus:bg-white rounded-xl pl-8 pr-4 py-3.5 text-gray-900 font-medium outline-none transition-all"
                        />
                      </div>
                      
                      <button 
                        type="submit"
                        disabled={isSubmitting || !isAmountValid || loading}
                        className="w-full bg-gray-900 hover:bg-gray-800 text-white py-3.5 rounded-xl font-semibold transition-colors flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                      >
                        {isSubmitting ? (
                          <><Loader2 size={16} className="animate-spin" /> <span>Processing...</span></>
                        ) : (
                          <><ArrowUpRight size={16} /> <span>Withdraw Funds</span></>
                        )}
                      </button>
                    </form>
                  )}
                </div>

                {/* Recent Withdrawals */}
                <div className="border-t border-gray-100 pt-6 pb-4">
                  <h3 className="text-sm font-semibold text-gray-900 mb-4">Recent Withdrawals</h3>
                  
                  {loading ? (
                    <div className="space-y-3">
                      <div className="h-12 bg-gray-50 rounded-xl animate-pulse" />
                      <div className="h-12 bg-gray-50 rounded-xl animate-pulse" />
                    </div>
                  ) : withdrawals.length > 0 ? (
                    <div className="space-y-3">
                      {withdrawals.map((req) => (
                        <div key={req.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-100">
                          <div className="flex items-center space-x-3">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                              req.status === 'completed' ? 'bg-green-100 text-green-600' :
                              req.status === 'rejected' ? 'bg-red-100 text-red-600' :
                              'bg-yellow-100 text-yellow-600'
                            }`}>
                              {req.status === 'completed' ? <CheckCircle2 size={14} /> :
                               req.status === 'rejected' ? <AlertCircle size={14} /> :
                               <Clock size={14} />}
                            </div>
                            <div>
                              <p className="text-xs font-semibold text-gray-900 capitalize">{req.status}</p>
                              <p className="text-[10px] font-medium text-gray-400 mt-0.5">
                                {new Date(req.created_at).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                          <span className="text-sm font-semibold text-gray-900">
                            ${req.amount.toFixed(2)}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-6 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                      <Wallet size={24} className="text-gray-300 mx-auto mb-2" />
                      <p className="text-xs font-medium text-gray-500">No recent payout requests.</p>
                    </div>
                  )}
                </div>

              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
};