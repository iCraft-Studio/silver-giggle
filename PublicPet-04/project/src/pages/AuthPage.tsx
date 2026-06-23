import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PawPrint, Mail, Lock, ArrowRight, User, MapPin, Phone, Briefcase } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

export const AuthPage: React.FC = () => {
  const navigate = useNavigate();
  const [isSignUp, setIsSignUp] = useState(false);
  
  // Base Auth State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  // Extended Profile State (Only used for Sign Up)
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [stateLocation, setStateLocation] = useState('');
  const [intent, setIntent] = useState('buy'); // 'buy', 'sell', or 'both'

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const springConfig = { type: "spring", stiffness: 300, damping: 25 };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    try {
      if (isSignUp) {
        // Sign Up with extended metadata
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName,
              phone: phone,
              state: stateLocation,
              intent: intent
            }
          }
        });
        if (error) throw error;
        navigate('/dashboard'); 
      } else {
        // Standard Log In
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        navigate('/dashboard');
      }
    } catch (error: any) {
      setErrorMsg(error.message || 'Something went wrong. Let\'s try that again!');
    } finally {
      setLoading(false);
    }
  };

  return (
    // Adjusted container to fill the shell perfectly without the extra nav bar
    <div className="flex-1 min-h-[calc(100vh-80px)] w-full bg-gray-50 flex items-center justify-center p-6 font-sans relative overflow-hidden">
      
      {/* Playful Background Elements */}
      <motion.div 
        animate={{ rotate: 360 }}
        transition={{ duration: 150, repeat: Infinity, ease: "linear" }}
        className="absolute -top-32 -right-32 text-blue-50 opacity-40 pointer-events-none z-0"
      >
        <PawPrint size={400} />
      </motion.div>

      {/* MAIN FORM CONTAINER */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md bg-white border border-gray-100 rounded-[2rem] shadow-xl shadow-black/5 p-8 z-10 my-8"
      >
        
        {/* Header */}
        <div className="text-center mb-8">
          <motion.div 
            whileHover={{ scale: 1.1, rotate: 10 }}
            whileTap={{ scale: 0.9 }}
            className="w-16 h-16 bg-blue-50 text-blue-600 rounded-[1.2rem] flex items-center justify-center mx-auto mb-4 border border-blue-100 cursor-pointer"
          >
            <PawPrint size={32} />
          </motion.div>
          <h1 className="text-3xl font-bold text-black mb-2 tracking-tight">
            {isSignUp ? "Join the Pack!" : "Welcome Back!"}
          </h1>
          <p className="text-gray-500 font-medium">
            {isSignUp 
              ? "Set up your profile to adopt or sell." 
              : "Let's fetch your account details."}
          </p>
        </div>

        {/* Error Message Bubble */}
        <AnimatePresence>
          {errorMsg && (
            <motion.div 
              initial={{ opacity: 0, height: 0, scale: 0.9 }}
              animate={{ opacity: 1, height: 'auto', scale: 1 }}
              exit={{ opacity: 0, height: 0, scale: 0.9 }}
              className="bg-red-50 text-red-600 text-sm font-bold px-4 py-3 rounded-2xl mb-6 text-center border border-red-100"
            >
              {errorMsg}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Auth Form */}
        <form onSubmit={handleAuth} className="space-y-4">
          
          {/* EXPANDING SIGN UP FIELDS */}
          <AnimatePresence>
            {isSignUp && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-4 overflow-hidden"
              >
                <div className="relative group">
                  <User className="absolute left-5 top-1/2 transform -translate-y-1/2 text-gray-400 group-focus-within:text-blue-600 transition-colors" size={20} />
                  <input 
                    type="text" 
                    required={isSignUp}
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Full Name" 
                    className="w-full pl-14 pr-6 py-4 bg-gray-50 border-2 border-transparent focus:border-blue-600 focus:bg-white rounded-full text-black font-bold outline-none transition-all"
                  />
                </div>

                <div className="flex space-x-4">
                  <div className="relative group flex-1">
                    <MapPin className="absolute left-5 top-1/2 transform -translate-y-1/2 text-gray-400 group-focus-within:text-blue-600 transition-colors" size={20} />
                    <input 
                      type="text" 
                      required={isSignUp}
                      value={stateLocation}
                      onChange={(e) => setStateLocation(e.target.value)}
                      placeholder="State (e.g. TX)" 
                      className="w-full pl-14 pr-6 py-4 bg-gray-50 border-2 border-transparent focus:border-blue-600 focus:bg-white rounded-full text-black font-bold outline-none transition-all"
                    />
                  </div>
                  <div className="relative group flex-1">
                    <Phone className="absolute left-5 top-1/2 transform -translate-y-1/2 text-gray-400 group-focus-within:text-blue-600 transition-colors" size={20} />
                    <input 
                      type="tel" 
                      required={isSignUp}
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="Phone" 
                      className="w-full pl-14 pr-4 py-4 bg-gray-50 border-2 border-transparent focus:border-blue-600 focus:bg-white rounded-full text-black font-bold outline-none transition-all"
                    />
                  </div>
                </div>

                <div className="relative group">
                  <Briefcase className="absolute left-5 top-1/2 transform -translate-y-1/2 text-gray-400 group-focus-within:text-blue-600 transition-colors" size={20} />
                  <select 
                    value={intent}
                    onChange={(e) => setIntent(e.target.value)}
                    className="w-full pl-14 pr-6 py-4 bg-gray-50 border-2 border-transparent focus:border-blue-600 focus:bg-white rounded-full text-black font-bold outline-none transition-all appearance-none cursor-pointer"
                  >
                    <option value="buy">I am looking to Adopt/Buy</option>
                    <option value="sell">I am a Breeder/Seller</option>
                    <option value="both">I want to do Both</option>
                  </select>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* STANDARD LOGIN FIELDS */}
          <div className="relative group">
            <Mail className="absolute left-5 top-1/2 transform -translate-y-1/2 text-gray-400 group-focus-within:text-blue-600 transition-colors" size={20} />
            <input 
              type="email" 
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email address" 
              className="w-full pl-14 pr-6 py-4 bg-gray-50 border-2 border-transparent focus:border-blue-600 focus:bg-white rounded-full text-black font-bold outline-none transition-all"
            />
          </div>

          <div className="relative group">
            <Lock className="absolute left-5 top-1/2 transform -translate-y-1/2 text-gray-400 group-focus-within:text-blue-600 transition-colors" size={20} />
            <input 
              type="password" 
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password" 
              className="w-full pl-14 pr-6 py-4 bg-gray-50 border-2 border-transparent focus:border-blue-600 focus:bg-white rounded-full text-black font-bold outline-none transition-all"
            />
          </div>

          <motion.button 
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            disabled={loading}
            type="submit"
            className="w-full bg-blue-600 text-white py-4 rounded-full font-bold hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2 shadow-lg shadow-blue-600/20 disabled:opacity-70 mt-2"
          >
            {loading ? (
              <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <>
                <span>{isSignUp ? "Create Account" : "Log In"}</span>
                <ArrowRight size={18} />
              </>
            )}
          </motion.button>
        </form>

        {/* Toggle State */}
        <div className="mt-8 text-center border-t border-gray-100 pt-6">
          <p className="text-gray-500 font-medium text-sm">
            {isSignUp ? "Already have an account?" : "New to The Public Pet?"}
          </p>
          <button 
            type="button"
            onClick={() => {
              setIsSignUp(!isSignUp);
              setErrorMsg('');
            }}
            className="mt-2 text-black font-bold hover:text-blue-600 transition-colors relative inline-block"
          >
            {isSignUp ? "Log in instead" : "Create an account"}
            <motion.div 
              layoutId="underline"
              className="absolute -bottom-1 left-0 right-0 h-0.5 bg-blue-600"
              initial={false}
              transition={springConfig}
            />
          </button>
        </div>
        
      </motion.div>
    </div>
  );
}; 