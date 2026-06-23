import React, { useState, useEffect } from 'react';
import { Users, Search, ShieldCheck, Mail, Phone, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';

type AdminUser = {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  is_verified: boolean;
  intent: string;
  created_at: string;
  wallet?: { balance: number, pending_balance: number };
};

export const AdminUsers: React.FC = () => {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchUsers = async () => {
      const { data, error } = await supabase
        .from('users')
        .select(`
          id, full_name, email, phone, is_verified, intent, created_at,
          wallet:wallets(balance, pending_balance)
        `)
        .order('created_at', { ascending: false });

      if (!error && data) {
        const formatted = data.map(d => ({
          ...d,
          wallet: Array.isArray(d.wallet) ? d.wallet[0] : d.wallet,
        }));
        setUsers(formatted as AdminUser[]);
      }
      setLoading(false);
    };

    fetchUsers();
  }, []);

  const handleToggleVerification = async (userId: string, currentStatus: boolean) => {
    if (!window.confirm(`Are you sure you want to ${currentStatus ? 'unverify' : 'verify'} this user?`)) return;
    
    const { error } = await supabase.from('users').update({ is_verified: !currentStatus }).eq('id', userId);
    if (!error) {
      setUsers(users.map(u => u.id === userId ? { ...u, is_verified: !currentStatus } : u));
    } else {
      alert("Failed to update verification status.");
    }
  };

  const filteredUsers = users.filter(u => 
    u.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    u.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 tracking-tight">Registered Users</h1>
          <p className="text-gray-500 font-medium text-sm mt-1">Manage accounts and verify trusted breeders.</p>
        </div>
        
        <div className="relative">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input 
            type="text" 
            placeholder="Search by name or email..." 
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
                <th className="p-5">User Details</th>
                <th className="p-5">Contact Info</th>
                <th className="p-5">Wallet Stats</th>
                <th className="p-5">Intent</th>
                <th className="p-5 text-right">Verification</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={5} className="p-12 text-center">
                    <Loader2 size={24} className="animate-spin text-indigo-600 mx-auto" />
                  </td>
                </tr>
              ) : filteredUsers.length > 0 ? (
                filteredUsers.map(user => (
                  <tr key={user.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="p-5">
                      <p className="text-sm font-semibold text-gray-900">{user.full_name || 'N/A'}</p>
                      <p className="text-[10px] font-medium text-gray-400 mt-1">Joined {new Date(user.created_at).toLocaleDateString()}</p>
                    </td>
                    <td className="p-5 space-y-1.5">
                      <div className="flex items-center space-x-2 text-xs font-medium text-gray-600">
                        <Mail size={12} className="text-gray-400" /> <span>{user.email}</span>
                      </div>
                      <div className="flex items-center space-x-2 text-xs font-medium text-gray-600">
                        <Phone size={12} className="text-gray-400" /> <span>{user.phone || 'N/A'}</span>
                      </div>
                    </td>
                    <td className="p-5">
                      <p className="text-sm font-bold text-gray-900">${user.wallet?.balance.toLocaleString() || '0.00'}</p>
                      <p className="text-[10px] font-medium text-indigo-600 mt-0.5">Pending: ${user.wallet?.pending_balance.toLocaleString() || '0.00'}</p>
                    </td>
                    <td className="p-5">
                      <span className="capitalize text-xs font-medium text-gray-500 bg-gray-100 px-2.5 py-1 rounded-md">{user.intent?.replace('_', ' ') || 'General'}</span>
                    </td>
                    <td className="p-5 text-right">
                      <button 
                        onClick={() => handleToggleVerification(user.id, user.is_verified)}
                        className={`flex items-center justify-center space-x-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider ml-auto transition-colors ${
                          user.is_verified ? 'bg-green-50 text-green-600 hover:bg-green-100' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                        }`}
                      >
                        <ShieldCheck size={14} /> <span>{user.is_verified ? 'Verified' : 'Unverified'}</span>
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="p-12 text-center text-gray-500">
                    <Users size={24} className="mx-auto mb-2 opacity-50" />
                    <p className="font-medium text-sm">No users found.</p>
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