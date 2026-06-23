import React, { useState, useEffect } from 'react';
import { Settings, Save, ShieldAlert, CheckCircle2, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';

type CheckoutAccount = {
  id: string;
  paypal_email: string;
  account_name: string;
  is_active: boolean;
};

export const AdminCheckoutAccount: React.FC = () => {
  const [account, setAccount] = useState<CheckoutAccount | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  // Form State
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');

  useEffect(() => {
    const fetchAccount = async () => {
      const { data, error } = await supabase
        .from('checkout_account')
        .select('*')
        .eq('is_active', true)
        .single();

      if (!error && data) {
        setAccount(data as CheckoutAccount);
        setEmail(data.paypal_email);
        setName(data.account_name || '');
      }
      setLoading(false);
    };

    fetchAccount();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!account) return;
    setSaving(true);
    setSuccess(false);

    const { error } = await supabase
      .from('checkout_account')
      .update({ paypal_email: email.trim(), account_name: name.trim() })
      .eq('id', account.id);

    setSaving(false);
    if (!error) {
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } else {
      alert("Failed to update escrow account.");
    }
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900 tracking-tight">Payment Routing</h1>
        <p className="text-gray-500 font-medium text-sm mt-1">Configure the central PayPal account used for the platform's Escrow Vault.</p>
      </div>

      {loading ? (
        <div className="h-64 bg-white rounded-[2rem] border border-gray-100 animate-pulse"></div>
      ) : (
        <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm p-6 md:p-10">
          
          <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-5 mb-8 flex items-start space-x-3">
            <ShieldAlert className="text-indigo-600 flex-shrink-0 mt-0.5" size={20} />
            <div className="text-sm font-medium text-indigo-900 leading-relaxed">
              <strong>Critical Setting:</strong> This is the exact email address shown to buyers on the manual checkout page. Ensure this account is secure and verified by PayPal to avoid frozen funds.
            </div>
          </div>

          <form onSubmit={handleSave} className="space-y-6">
            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Display Name (Optional)</label>
              <input 
                type="text" 
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Public Pet Escrow"
                className="w-full bg-gray-50 border-2 border-transparent focus:border-indigo-600 focus:bg-white rounded-xl px-4 py-3.5 text-sm font-medium text-gray-900 outline-none transition-all"
              />
            </div>
            
            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Official PayPal Email</label>
              <input 
                type="email" 
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@publicpet.com"
                className="w-full bg-gray-50 border-2 border-transparent focus:border-indigo-600 focus:bg-white rounded-xl px-4 py-3.5 text-sm font-medium text-gray-900 outline-none transition-all"
              />
            </div>

            <div className="pt-4 flex items-center justify-between">
              {success ? (
                <div className="flex items-center space-x-2 text-green-600 font-semibold text-sm">
                  <CheckCircle2 size={18} /> <span>Account Updated</span>
                </div>
              ) : <div />}
              
              <button 
                type="submit"
                disabled={saving || !email.trim()}
                className="flex items-center space-x-2 bg-gray-900 text-white px-6 py-3.5 rounded-xl font-semibold hover:bg-gray-800 transition-colors disabled:opacity-50"
              >
                {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                <span>Save Configuration</span>
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};