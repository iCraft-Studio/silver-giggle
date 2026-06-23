import React from 'react';
import { motion } from 'framer-motion';
import { MapPin, Phone, Mail, ArrowRight } from 'lucide-react';
import { FaWhatsapp } from 'react-icons/fa6';

const Contact = () => {
  const whatsappNumber = "2347064068487";
  const defaultMessage = encodeURIComponent("Hello JewelMist, I would like to make an inquiry.");

  const handleWhatsApp = () => {
    window.open(`https://wa.me/${whatsappNumber}?text=${defaultMessage}`, '_blank');
  };

  const handleEmail = () => {
    window.location.href = "mailto:jewelmist.ng@gmail.com?subject=JewelMist%20Client%20Inquiry";
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { duration: 0.6 } }
  };

  return (
    <div className="bg-white dark:bg-black min-h-screen pt-32 pb-24 text-black dark:text-white transition-colors duration-500 relative z-0 overflow-hidden">
      
      {/* Ambient Gold Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[300px] sm:w-[600px] h-[300px] sm:h-[400px] bg-[#D4AF37]/10 dark:bg-[#D4AF37]/5 rounded-full blur-[100px] pointer-events-none -z-10 transition-colors duration-500"></div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* PAGE HEADER */}
        <div className="text-center mb-16 md:mb-24">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
            <h1 className="text-3xl md:text-5xl font-light tracking-[0.2em] uppercase mb-6 transition-colors duration-500">
              Private Client Services
            </h1>
            <p className="text-neutral-600 dark:text-neutral-400 text-xs md:text-sm font-light leading-relaxed max-w-2xl mx-auto transition-colors duration-500">
              For bespoke requests, vault inquiries, or general assistance, our concierge team is at your complete disposal. Connect with us directly through your preferred channel below.
            </p>
          </motion.div>
        </div>

        {/* DIRECT ACTION CARDS */}
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 mb-16"
        >
          {/* WhatsApp Card */}
          <motion.button 
            variants={itemVariants}
            onClick={handleWhatsApp}
            className="group bg-neutral-50 dark:bg-neutral-900/50 border border-neutral-200 dark:border-neutral-800 p-8 md:p-12 text-left hover:border-[#25D366]/50 dark:hover:border-[#25D366]/50 transition-all duration-500 relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-[#25D366]/5 rounded-bl-full -z-10 transform translate-x-16 -translate-y-16 group-hover:translate-x-0 group-hover:-translate-y-0 transition-transform duration-700"></div>
            
            <FaWhatsapp size={32} className="text-[#25D366] mb-6" />
            <h2 className="text-black dark:text-white text-sm md:text-base font-medium tracking-widest uppercase mb-3 transition-colors duration-500">
              WhatsApp Us
            </h2>
            <p className="text-neutral-500 dark:text-neutral-400 text-xs md:text-sm font-light leading-relaxed mb-8 transition-colors duration-500">
              Receive immediate assistance, request custom piece details, or finalize a direct bank transfer with our dedicated team.
            </p>
            <div className="flex items-center text-[#25D366] text-[10px] sm:text-xs font-semibold tracking-[0.2em] uppercase">
              Message Us <ArrowRight size={14} className="ml-2 group-hover:translate-x-2 transition-transform duration-300" />
            </div>
          </motion.button>

          {/* Email Card */}
          <motion.button 
            variants={itemVariants}
            onClick={handleEmail}
            className="group bg-neutral-50 dark:bg-neutral-900/50 border border-neutral-200 dark:border-neutral-800 p-8 md:p-12 text-left hover:border-[#D4AF37] dark:hover:border-[#D4AF37] transition-all duration-500 relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-[#D4AF37]/5 rounded-bl-full -z-10 transform translate-x-16 -translate-y-16 group-hover:translate-x-0 group-hover:-translate-y-0 transition-transform duration-700"></div>
            
            <Mail size={32} className="text-[#D4AF37] mb-6" strokeWidth={1.5} />
            <h2 className="text-black dark:text-white text-sm md:text-base font-medium tracking-widest uppercase mb-3 transition-colors duration-500">
              Email Correspondence
            </h2>
            <p className="text-neutral-500 dark:text-neutral-400 text-xs md:text-sm font-light leading-relaxed mb-8 transition-colors duration-500">
              For formal inquiries, brand partnerships, or detailed bespoke commission requests. We aim to respond within 6 hours.
            </p>
            <div className="flex items-center text-[#D4AF37] text-[10px] sm:text-xs font-semibold tracking-[0.2em] uppercase">
              Send Email <ArrowRight size={14} className="ml-2 group-hover:translate-x-2 transition-transform duration-300" />
            </div>
          </motion.button>
        </motion.div>

        {/* PHYSICAL ADDRESS INFO */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.4 }}
          className="border-t border-neutral-200 dark:border-neutral-900 pt-16 mt-16 text-center"
        >
          <h3 className="text-[#D4AF37] text-xs font-medium tracking-[0.2em] uppercase mb-8">The Showroom</h3>
          
          <div className="flex flex-col md:flex-row items-center justify-center gap-8 md:gap-16 text-neutral-600 dark:text-neutral-400">
            <div className="flex flex-col items-center gap-3">
              <MapPin size={24} className="text-neutral-400 dark:text-neutral-600" strokeWidth={1.5} />
              <p className="text-xs tracking-wider uppercase font-light text-center">
                Iyekhei Girls Rd, Opp Campus 3 Junction<br/>Auchi, Edo State, Nigeria
              </p>
            </div>
            
            <div className="hidden md:block w-px h-12 bg-neutral-200 dark:bg-neutral-800"></div>

            <div className="flex flex-col items-center gap-3">
              <Phone size={24} className="text-neutral-400 dark:text-neutral-600" strokeWidth={1.5} />
              <p className="text-xs tracking-wider uppercase font-light">
                +234 903 141 5519<br/>+234 706 406 8487
              </p>
            </div>
          </div>
        </motion.div>

      </div>
    </div>
  );
};

export default Contact;