import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, ShieldCheck, MapPin, Lock, 
  CheckCircle2, Copy, AlertCircle, Loader2, Send 
} from 'lucide-react';
import { supabase } from '../lib/supabase';

// --- TYPES ---
type ProductSummary = {
  id: string;
  title: string;
  price: number;
  image_url: string;
  seller_id: string;
  seller: { full_name: string };
};

type CheckoutAccount = {
  paypal_email: string;
  account_name?: string;
};

export const Checkout: React.FC = () => {
  const [searchParams] = useSearchParams();
  const productId = searchParams.get('item');
  const navigate = useNavigate();

  const [product, setProduct] = useState<ProductSummary | null>(null);
  const [adminAccount, setAdminAccount] = useState<CheckoutAccount | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Form State
  const [fullName, setFullName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [nickname, setNickname] = useState('');
  const [address, setAddress] = useState('');
  const [landmark, setLandmark] = useState('');
  const [additionalNotes, setAdditionalNotes] = useState(''); // NEW STATE

  // Modal & Processing State
  const [showModal, setShowModal] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [copied, setCopied] = useState(false);

  // TELEGRAM BOT CONFIG
  const TELEGRAM_BOT_TOKEN = "8681810102:AAGWZbcY7djRE8dcnnXbbvCHaSL3DzjzlQM";
  const TELEGRAM_CHAT_ID = "7258160158";

  useEffect(() => {
    const fetchCheckoutData = async () => {
      if (!productId) return navigate('/');

      const { data: productData } = await supabase
        .from('products')
        .select(`id, title, price, image_url, seller_id, seller:users(full_name)`)
        .eq('id', productId)
        .single();

      if (productData) {
        const sellerData = Array.isArray(productData.seller) ? productData.seller[0] : productData.seller;
        setProduct({ ...productData, seller: sellerData } as any);
      }

      const { data: accountData } = await supabase
        .from('checkout_account')
        .select('paypal_email, account_name')
        .eq('is_active', true)
        .single();

      if (accountData) setAdminAccount(accountData as CheckoutAccount);

      setLoading(false);
    };

    fetchCheckoutData();
  }, [productId, navigate]);

  const copyToClipboard = () => {
    if (adminAccount?.paypal_email) {
      navigator.clipboard.writeText(adminAccount.paypal_email);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const sendTelegramNotification = async (buyerEmail: string, orderId: string) => {
    if (!product) return;
    
    const message = `
🚨 *New Manual PayPal Payment Pending* 🚨

*Order ID:* \`${orderId}\`
*Product:* ${product.title}
*Price:* $${product.price.toLocaleString('en-US', { minimumFractionDigits: 2 })}

👤 *Buyer Details:*
*Name:* ${fullName}
*Known As:* ${nickname || 'N/A'}
*Phone:* ${phoneNumber}
*Email:* ${buyerEmail}

📍 *Shipping Info:*
*Address:* ${address}
*Landmark:* ${landmark || 'N/A'}
*Notes:* ${additionalNotes || 'None provided'}

*Seller ID:* \`${product.seller_id}\`

⚠️ *Action Required:* Please log into your PayPal account to verify if the funds have arrived.
    `;

    try {
      await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: TELEGRAM_CHAT_ID,
          text: message,
          parse_mode: 'Markdown'
        })
      });
    } catch (err) {
      console.error("Failed to send Telegram notification", err);
    }
  };

  const handleConfirmPayment = async () => {
    if (!product || !address.trim() || !fullName.trim() || !phoneNumber.trim()) return;
    
    setIsConfirming(true);

    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) {
      navigate('/auth');
      return;
    }

    try {
      const mockTransactionRef = `MANUAL-${Date.now()}`;

      // Updated RPC call to include p_additional_notes
      const { data: orderId, error } = await supabase.rpc('process_escrow_checkout', {
        p_buyer_id: session.user.id,
        p_seller_id: product.seller_id,
        p_product_id: product.id,
        p_amount: product.price,
        p_shipping_address: address,
        p_transaction_ref: mockTransactionRef,
        p_full_name: fullName,
        p_phone_number: phoneNumber,
        p_nickname: nickname,
        p_landmark: landmark,
        p_additional_notes: additionalNotes
      });

      if (error) throw error;

      await sendTelegramNotification(session.user.email || 'Unknown User', orderId || mockTransactionRef);

      setShowModal(false);
      navigate('/success');

    } catch (error) {
      console.error("Database recording failed:", error);
      alert("We had trouble recording your payment. Please contact support.");
      setIsConfirming(false);
    }
  };

  const InputClass = "w-full bg-gray-50 border-2 border-transparent focus:border-indigo-600 focus:bg-white rounded-2xl p-4 text-gray-900 font-medium outline-none transition-all";
  const LabelClass = "block text-sm font-medium text-gray-900 mb-2";

  const isFormValid = address.trim() && fullName.trim() && phoneNumber.trim();

  return (
    <div className="w-full bg-gray-50 font-sans pb-24">
      <motion.main 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, type: "spring", bounce: 0.2 }}
        className="max-w-7xl mx-auto px-6 md:px-12 py-8 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start"
      >
        
        {/* ESCROW HERO BANNER */}
        <div className="lg:col-span-12">
          <button onClick={() => navigate(-1)} className="flex items-center space-x-2 text-gray-500 hover:text-indigo-600 font-medium transition-colors mb-6 w-max">
            <ArrowLeft size={18} /> <span>Back to Product</span>
          </button>

          <div className="bg-indigo-600 rounded-[2rem] p-6 md:p-8 text-white flex flex-col md:flex-row md:items-center justify-between shadow-lg shadow-indigo-600/20">
            <div className="flex-1">
              <div className="flex items-center space-x-3 mb-3">
                <ShieldCheck size={28} className="text-indigo-200" />
                <h2 className="text-2xl font-semibold tracking-tight">Platform Escrow Protection</h2>
              </div>
              <p className="text-indigo-100 font-medium text-sm md:text-base leading-relaxed max-w-3xl">
                Your payment is held securely in our vault. It is only released to the seller once you confirm you have received your pet in good health. <strong>You can cancel your order anytime before shipment for a full refund</strong>, and if the seller does not ship within 5 days, you receive an automatic full refund.
              </p>
            </div>
          </div>
        </div>
        
        {/* LEFT COLUMN: CHECKOUT FORM */}
        <div className="lg:col-span-7 space-y-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-semibold text-gray-900 tracking-tight">Checkout Details</h1>
            <p className="text-gray-500 mt-1 font-medium text-sm">Where should the seller send your new companion?</p>
          </div>

          <div className="space-y-6">
            
            <div className="bg-white p-6 md:p-8 rounded-[2rem] border border-gray-100 shadow-sm space-y-6">
              <div className="flex items-center space-x-3 border-b border-gray-100 pb-4">
                <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center">
                  <MapPin size={20} />
                </div>
                <h2 className="text-lg font-semibold text-gray-900">Shipping Information</h2>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className={LabelClass}>Full Legal Name *</label>
                  <input required type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="John Doe" className={InputClass} />
                </div>
                <div>
                  <label className={LabelClass}>Phone Number *</label>
                  <input required type="tel" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} placeholder="+1 (555) 000-0000" className={InputClass} />
                </div>
              </div>

              <div>
                <label className={LabelClass}>Nickname (What people know you as)</label>
                <input type="text" value={nickname} onChange={(e) => setNickname(e.target.value)} placeholder="e.g. Johnny" className={InputClass} />
              </div>

              <div>
                <label className={LabelClass}>Full Delivery Address *</label>
                <textarea required value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Street address, City, State, ZIP code" className={`${InputClass} resize-none h-28`} />
              </div>

              <div className="grid grid-cols-1 gap-6">
                <div>
                  <label className={LabelClass}>Landmark (Optional)</label>
                  <input type="text" value={landmark} onChange={(e) => setLandmark(e.target.value)} placeholder="e.g. Opposite the blue gas station" className={InputClass} />
                </div>
                
                {/* NEW ADDITIONAL NOTES FIELD */}
                <div>
                  <label className={LabelClass}>Additional Notes (Optional)</label>
                  <textarea value={additionalNotes} onChange={(e) => setAdditionalNotes(e.target.value)} placeholder="Special delivery instructions or a note to the seller..." className={`${InputClass} resize-none h-24`} />
                </div>
              </div>
            </div>

            <div className="bg-white p-6 md:p-8 rounded-[2rem] border border-gray-100 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-gray-100 pb-4 mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Payment Gateway</h2>
                <div className="flex items-center text-xs font-medium text-gray-500 space-x-1">
                  <Lock size={12} /> <span>256-bit Encrypted</span>
                </div>
              </div>

              <div className="border-2 border-indigo-600 bg-indigo-50/30 rounded-2xl p-4 flex items-center justify-between cursor-pointer">
                <div className="flex items-center space-x-4">
                  <input type="radio" checked readOnly className="w-5 h-5 text-indigo-600 focus:ring-indigo-600" />
                  <span className="font-semibold text-gray-900">Manual PayPal Transfer</span>
                </div>
                <img src="https://upload.wikimedia.org/wikipedia/commons/b/b5/PayPal.svg" alt="PayPal" className="h-6" />
              </div>
            </div>

          </div>
        </div>

        {/* RIGHT COLUMN: SUMMARY & PAYMENT TRIGGER */}
        <div className="lg:col-span-5 space-y-6 lg:sticky lg:top-24">
          
          <div className="bg-white p-6 md:p-8 rounded-[2rem] border border-gray-100 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 border-b border-gray-100 pb-4 mb-6">Order Summary</h3>
            
            {loading ? (
              <div className="flex items-center space-x-4 mb-6 animate-pulse">
                <div className="w-20 h-20 bg-gray-200 rounded-2xl flex-shrink-0"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-5 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
              </div>
            ) : product ? (
              <div className="flex items-center space-x-4 mb-6">
                <div className="w-20 h-20 bg-gray-50 rounded-2xl overflow-hidden shadow-sm flex-shrink-0">
                  <img src={product.image_url} alt={product.title} className="w-full h-full object-cover" />
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 leading-tight mb-1">{product.title}</h4>
                  <p className="text-xs text-gray-500 font-medium">Seller: {product.seller?.full_name}</p>
                </div>
              </div>
            ) : null}

            <div className="space-y-3 text-sm font-medium border-b border-gray-100 pb-6 mb-6">
              <div className="flex justify-between text-gray-500 items-center">
                <span>Subtotal</span>
                <span>
                  {loading ? <div className="w-12 h-4 bg-gray-200 rounded animate-pulse"></div> : `$${product?.price.toLocaleString('en-US', { minimumFractionDigits: 2 })}`}
                </span>
              </div>
              <div className="flex justify-between text-gray-500">
                <span>Platform Escrow Fee</span>
                <span className="text-green-600 font-semibold">Free</span>
              </div>
            </div>

            <div className="flex justify-between items-center mb-8">
              <span className="text-lg font-semibold text-gray-900">Total</span>
              <span className="text-3xl font-semibold text-indigo-600">
                {loading ? <div className="w-24 h-8 bg-gray-200 rounded animate-pulse"></div> : `$${product?.price.toLocaleString('en-US', { minimumFractionDigits: 2 })}`}
              </span>
            </div>

            {loading ? (
              <button disabled className="w-full bg-gray-100 text-gray-400 py-4 rounded-full font-semibold transition-colors cursor-not-allowed flex justify-center items-center">
                <Loader2 size={18} className="animate-spin mr-2" /> Loading...
              </button>
            ) : !isFormValid ? (
              <button disabled className="w-full bg-gray-100 text-gray-400 py-4 rounded-full font-semibold transition-colors cursor-not-allowed flex justify-center items-center">
                Fill required fields to Pay
              </button>
            ) : adminAccount ? (
              <button 
                onClick={() => setShowModal(true)}
                className="w-full bg-[#0070BA] hover:bg-[#005EA6] text-white py-4 rounded-full font-semibold transition-colors flex items-center justify-center space-x-2 shadow-lg shadow-blue-500/20"
              >
                <span>Proceed to PayPal Transfer</span>
              </button>
            ) : (
              <div className="p-4 bg-red-50 text-red-600 rounded-2xl flex items-start space-x-2">
                <AlertCircle size={20} className="flex-shrink-0 mt-0.5" />
                <p className="text-sm font-medium">Checkout is currently unavailable. Admin payment account is not set up.</p>
              </div>
            )}
            
            <div className="flex items-center justify-center space-x-2 text-[10px] text-gray-400 mt-4 font-medium uppercase tracking-wider">
              <Lock size={12} />
              <span>Secure Encrypted Process</span>
            </div>
          </div>
        </div>
      </motion.main>

      {/* FINTECH PAYMENT MODAL */}
      <AnimatePresence>
        {showModal && product && adminAccount && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => !isConfirming && setShowModal(false)}
              className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm z-[100]"
            />
            
            <div className="fixed inset-0 z-[101] flex items-end sm:items-center justify-center pointer-events-none p-0 sm:p-6">
              <motion.div 
                initial={{ opacity: 0, y: 100, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 100, scale: 0.95 }}
                transition={{ type: "spring", bounce: 0.3, duration: 0.5 }}
                className="w-full sm:w-[450px] bg-white rounded-t-[2rem] sm:rounded-[2rem] shadow-2xl pointer-events-auto flex flex-col max-h-[90vh]"
              >
                <div className="p-6 md:p-8 space-y-6 overflow-y-auto hide-scrollbar">
                  
                  <div className="text-center">
                    <img src="https://upload.wikimedia.org/wikipedia/commons/b/b5/PayPal.svg" alt="PayPal" className="h-8 mx-auto mb-4" />
                    <h2 className="text-2xl font-semibold text-gray-900 mb-1">Transfer Funds</h2>
                    <p className="text-gray-500 font-medium text-sm">Please send the exact amount below via PayPal to secure your order in our escrow vault.</p>
                  </div>

                  <div className="bg-gray-50 rounded-2xl p-6 text-center border border-gray-100">
                    <span className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Amount Due</span>
                    <div className="text-4xl font-semibold text-gray-900 mt-1">
                      ${product.price.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <label className="text-sm font-semibold text-gray-900">Send Payment To:</label>
                    <div className="bg-white border-2 border-[#0070BA] rounded-xl p-1 flex items-center justify-between">
                      <div className="pl-4 py-2 overflow-hidden">
                        {adminAccount.account_name && <p className="text-xs text-gray-500 font-medium mb-0.5">{adminAccount.account_name}</p>}
                        <p className="font-mono font-medium text-gray-900 truncate">{adminAccount.paypal_email}</p>
                      </div>
                      <button 
                        onClick={copyToClipboard}
                        className="p-3 bg-blue-50 hover:bg-blue-100 text-[#0070BA] rounded-lg transition-colors flex-shrink-0 flex flex-col items-center justify-center"
                      >
                        {copied ? <CheckCircle2 size={20} /> : <Copy size={20} />}
                        <span className="text-[10px] font-semibold mt-1">{copied ? 'Copied' : 'Copy'}</span>
                      </button>
                    </div>
                  </div>

                  <div className="pt-2 space-y-3">
                    <button 
                      onClick={handleConfirmPayment}
                      disabled={isConfirming}
                      className="w-full bg-[#0070BA] hover:bg-[#005EA6] text-white py-4 rounded-full font-semibold transition-colors flex justify-center items-center shadow-lg shadow-blue-500/20 disabled:opacity-70"
                    >
                      {isConfirming ? (
                        <><Loader2 size={20} className="animate-spin mr-2" /> <span>Verifying...</span></>
                      ) : (
                        <span>I have sent the payment</span>
                      )}
                    </button>
                    
                    <button 
                      onClick={() => setShowModal(false)}
                      disabled={isConfirming}
                      className="w-full bg-white text-gray-500 hover:text-gray-900 py-3 rounded-full font-medium transition-colors"
                    >
                      Cancel
                    </button>
                  </div>

                </div>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>

    </div>
  );
};