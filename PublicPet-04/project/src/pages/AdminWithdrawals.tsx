import React, { useState, useEffect } from 'react';
import { ArrowRightLeft, Search, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';

type WithdrawalRequest = {
  id: string;
  user_id: string;
  amount: number;
  status: 'pending' | 'processing' | 'completed' | 'rejected';
  created_at: string;
  user?: { full_name: string, email: string };
};

export const AdminWithdrawals: React.FC = () => {
  const [requests, setRequests] = useState<WithdrawalRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    const fetchRequests = async () => {
      const { data, error } = await supabase
        .from('withdrawals')
        .select(`*, user:users(full_name, email)`)
        .order('created_at', { ascending: false });

      if (!error && data) {
        const formatted = data.map(d => ({
          ...d,
          user: Array.isArray(d.user) ? d.user[0] : d.user,
        }));
        setRequests(formatted as WithdrawalRequest[]);
      }
      setLoading(false);
    };

    fetchRequests();
  }, []);

  const handleUpdateStatus = async (id: string, newStatus: 'completed' | 'rejected') => {
    if (!window.confirm(`Are you sure you want to mark this payout as ${newStatus}?`)) return;
    setProcessingId(id);
    
    // NOTE: If rejected, you would ideally need a Trigger to return the funds to their wallet balance!
    const { error } = await supabase.from('withdrawals').update({ status: newStatus }).eq('id', id);
    if (!error) {
      setRequests(requests.map(r => r.id === id ? { ...r, status: newStatus } : r));
    } else {
      alert("Failed to update status.");
    }
    setProcessingId(null);
  };

  const filteredRequests = requests.filter(r => 
    r.user?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    r.user?.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 tracking-tight">Payout Requests</h1>
          <p className="text-gray-500 font-medium text-sm mt-1">Review and process seller withdrawals.</p>
        </div>
        
        <div className="relative">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input 
            type="text" 
            placeholder="Search by seller name..." 
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
                <th className="p-5">Request ID & Date</th>
                <th className="p-5">Seller Info</th>
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
              ) : filteredRequests.length > 0 ? (
                filteredRequests.map(req => (
                  <tr key={req.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="p-5">
                      <p className="font-mono text-xs font-semibold text-gray-900">{req.id.split('-')[0]}</p>
                      <p className="text-[10px] font-medium text-gray-500 mt-1">{new Date(req.created_at).toLocaleString()}</p>
                    </td>
                    <td className="p-5">
                      <p className="text-sm font-semibold text-gray-900">{req.user?.full_name}</p>
                      <p className="text-xs font-medium text-gray-500 mt-0.5">{req.user?.email}</p>
                    </td>
                    <td className="p-5">
                      <p className="text-sm font-bold text-gray-900">${req.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
                    </td>
                    <td className="p-5">
                      <span className={`inline-flex px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                        req.status === 'completed' ? 'bg-green-50 text-green-600' :
                        req.status === 'rejected' ? 'bg-red-50 text-red-600' :
                        'bg-yellow-50 text-yellow-600'
                      }`}>
                        {req.status}
                      </span>
                    </td>
                    <td className="p-5 text-right">
                      {req.status === 'pending' && (
                        <div className="flex justify-end space-x-2">
                          <button 
                            onClick={() => handleUpdateStatus(req.id, 'completed')}
                            disabled={processingId === req.id}
                            className="bg-green-50 text-green-600 hover:bg-green-100 p-2 rounded-lg transition-colors disabled:opacity-50"
                            title="Mark as Paid"
                          >
                            <CheckCircle2 size={16} />
                          </button>
                          <button 
                            onClick={() => handleUpdateStatus(req.id, 'rejected')}
                            disabled={processingId === req.id}
                            className="bg-red-50 text-red-600 hover:bg-red-100 p-2 rounded-lg transition-colors disabled:opacity-50"
                            title="Reject Request"
                          >
                            <AlertCircle size={16} />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="p-12 text-center text-gray-500">
                    <ArrowRightLeft size={24} className="mx-auto mb-2 opacity-50" />
                    <p className="font-medium text-sm">No payout requests found.</p>
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