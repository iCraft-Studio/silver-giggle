import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Wallet, X, ShieldCheck } from 'lucide-react'
import { supabase } from '../lib/supabase'

interface FundWalletModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const FundWalletModal: React.FC<FundWalletModalProps> = ({ isOpen, onClose }) => {
  const [fundAmount, setFundAmount] = useState('')
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user))
  }, [])

  const handlePayment = (e: React.FormEvent) => {
    e.preventDefault()
    
    const amount = Number(fundAmount)
    if (!amount || amount < 500) {
      alert("Minimum funding amount is ₦500")
      return
    }

    if (!user) {
      alert("Please log in to fund your wallet.")
      return
    }

    // Format: KOD_UserId_Timestamp (Critical for the Webhook to read the user ID)
    const tx_ref = `KOD_${user.id}_${Date.now()}`

    // @ts-ignore
    window.FlutterwaveCheckout({
      public_key: "FLWPUBK_TEST-YOUR-ACTUAL-KEY", // TODO: Replace with your FLW Public Key
      tx_ref: tx_ref,
      amount: amount,
      currency: "NGN",
      payment_options: "card, banktransfer, ussd",
      customer: {
        email: user.email,
        name: user.user_metadata?.full_name || "Kodera User",
      },
      customizations: {
        title: "Kodera Wallet",
        description: `Fund ₦${amount.toLocaleString()} to your account`,
        logo: "https://mpzujnkcdjwdhifzmepd.supabase.co/storage/v1/object/public/kodera/logo.jpg",
      },
      callback: function (data: any) {
        if (data.status === "successful") {
          alert("Payment processing! Your balance will update in a few seconds.")
          onClose()
          // Optionally reload the page or trigger a balance fetch here
        }
      },
    })
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="bg-white dark:bg-gray-800 rounded-3xl w-full max-w-md shadow-2xl overflow-hidden border border-gray-100 dark:border-gray-700"
          >
            <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <Wallet className="w-5 h-5 text-primary" /> Top-up Wallet
              </h3>
              <button onClick={onClose} className="p-2 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handlePayment} className="p-6 space-y-6">
              <div className="text-center">
                <label className="block text-sm font-semibold text-gray-500 dark:text-gray-400 mb-3 uppercase tracking-wider">
                  Amount to Fund
                </label>
                <div className="relative inline-block w-full">
                  <span className="absolute left-6 top-1/2 -translate-y-1/2 text-3xl font-bold text-gray-400">₦</span>
                  <input 
                    type="number"
                    value={fundAmount}
                    onChange={(e) => setFundAmount(e.target.value)}
                    placeholder="2000"
                    className="w-full pl-14 pr-6 py-6 bg-gray-50 dark:bg-gray-900/50 border-2 border-transparent focus:border-primary focus:bg-white dark:focus:bg-gray-900 rounded-2xl outline-none text-3xl font-bold text-gray-900 dark:text-white transition-all"
                    required
                  />
                </div>
                <p className="text-xs text-gray-500 mt-2">Minimum amount: ₦100</p>
              </div>

              <div className="bg-green-50 dark:bg-green-900/10 p-4 rounded-2xl flex gap-3 items-center border border-green-100 dark:border-green-900/30">
                <ShieldCheck className="w-6 h-6 text-green-600 dark:text-green-500" />
                <p className="text-xs text-green-700 dark:text-green-400 font-medium leading-relaxed">
                  Your payment is processed securely by Flutterwave.
                </p>
              </div>

              <button 
                type="submit"
                className="w-full bg-primary text-white font-bold py-5 px-6 rounded-2xl hover:bg-primary/90 transition-all shadow-lg shadow-primary/30 active:scale-[0.98] text-lg"
              >
                Pay ₦{Number(fundAmount).toLocaleString() || '0'}
              </button>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}