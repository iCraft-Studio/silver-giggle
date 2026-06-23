import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Sparkles, ShieldCheck, Gem, ArrowRight } from 'lucide-react';

const About = () => {
  // Animation variants for scroll reveals
  const fadeUp = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: "easeOut" } }
  };

  const staggerContainer = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.2 } }
  };

  return (
    <div className="bg-white dark:bg-black min-h-screen text-black dark:text-white overflow-hidden transition-colors duration-500">
      
      {/* 1. HERO MANIFESTO */}
      <section className="relative h-[70vh] flex items-center justify-center">
        {/* Abstract Gold Gradient Background adapting to light/dark */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#D4AF37]/10 via-white to-white dark:from-neutral-900 dark:via-black dark:to-black opacity-90 z-0 transition-colors duration-500"></div>
        <div className="absolute inset-0 bg-white/20 dark:bg-black/40 z-10 transition-colors duration-500"></div>
        
        <div className="relative z-20 text-center px-4 max-w-4xl mx-auto mt-16">
          <motion.div initial="hidden" animate="visible" variants={fadeUp}>
            <p className="text-[#D4AF37] text-[10px] md:text-xs tracking-[0.4em] uppercase mb-6 font-medium">
              The JewelMist Heritage
            </p>
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-light tracking-[0.1em] uppercase mb-8 leading-tight">
              An Aura of <br />
              <span className="italic font-serif lowercase text-neutral-600 dark:text-neutral-300 transition-colors duration-500">Absolute Distinction</span>
            </h1>
            <div className="h-px w-24 bg-[#D4AF37] mx-auto"></div>
          </motion.div>
        </div>
      </section>

      {/* 2. THE PHILOSOPHY (Split Layout) */}
      <section className="py-20 md:py-32 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="flex flex-col lg:flex-row items-center gap-16 lg:gap-24">
          
          <motion.div 
            initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }} variants={fadeUp}
            className="w-full lg:w-1/2 relative"
          >
            <div className="aspect-[3/4] md:aspect-square lg:aspect-[3/4] overflow-hidden bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 relative transition-colors duration-500">
              <img 
                src="https://lagqxxbctdgwjcbrreeg.supabase.co/storage/v1/object/public/jm/tb.jpg" 
                alt="Luxury Lifestyle" 
                className="w-full h-full object-cover grayscale-[20%]"
              />
              <div className="absolute inset-0 bg-gradient-to-tr from-white/40 dark:from-black/60 to-transparent transition-colors duration-500"></div>
            </div>
            {/* Decorative Gold Accents */}
            <div className="absolute -bottom-4 -right-4 w-24 h-24 border-b border-r border-[#D4AF37]"></div>
            <div className="absolute -top-4 -left-4 w-24 h-24 border-t border-l border-[#D4AF37]"></div>
          </motion.div>

          <motion.div 
            initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }} variants={fadeUp}
            className="w-full lg:w-1/2 space-y-8"
          >
            <h2 className="text-2xl md:text-4xl font-light tracking-widest uppercase leading-snug">
              We Don't Sell Products. <br />
              <span className="text-[#D4AF37]">We Curate Presence.</span>
            </h2>
            <div className="space-y-6 text-neutral-600 dark:text-neutral-400 font-light text-sm md:text-base leading-relaxed transition-colors duration-500">
              <p>
                Founded on the uncompromising belief that true luxury lies in the unseen details, JewelMist was established to serve a clientele that demands nothing short of perfection.
              </p>
              <p>
                From the precise weight of an 18k solid Italian gold chain resting against your skin, to the lingering sillage of an exclusive Oud extrait that announces your arrival before you even speak—we understand that your aesthetic is your silent introduction to the world.
              </p>
              <p>
                Rooted in Edo State but operating on a global standard of excellence, we source only authenticated, high-caliber pieces and premium niche fragrances.
              </p>
            </div>
          </motion.div>

        </div>
      </section>

      {/* 3. THE BRAND PILLARS */}
      <section className="py-20 md:py-32 bg-neutral-50 dark:bg-neutral-950 border-y border-neutral-200 dark:border-neutral-900 transition-colors duration-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <motion.div 
            initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}
            className="text-center mb-16 md:mb-24"
          >
            <h2 className="text-2xl md:text-3xl font-light tracking-widest uppercase">Our Standards</h2>
            <div className="h-px w-16 bg-[#D4AF37] mx-auto mt-6"></div>
          </motion.div>

          <motion.div 
            initial="hidden" whileInView="visible" viewport={{ once: true }} variants={staggerContainer}
            className="grid grid-cols-1 md:grid-cols-3 gap-12 md:gap-8 lg:gap-16"
          >
            {/* Pillar 1 */}
            <motion.div variants={fadeUp} className="text-center group">
              <div className="w-16 h-16 mx-auto bg-white dark:bg-black border border-neutral-200 dark:border-neutral-800 flex items-center justify-center mb-6 group-hover:border-[#D4AF37] dark:group-hover:border-[#D4AF37] transition-colors duration-500 shadow-sm">
                <ShieldCheck size={24} className="text-[#D4AF37]" strokeWidth={1} />
              </div>
              <h3 className="text-sm font-medium tracking-widest uppercase mb-4">Unverified Is Unacceptable</h3>
              <p className="text-neutral-500 text-xs md:text-sm font-light leading-relaxed px-4 transition-colors duration-500">
                Every timepiece, every diamond, and every fragrance bottle in our vault is rigorously authenticated. We guarantee the provenance and purity of every piece we dispatch.
              </p>
            </motion.div>

            {/* Pillar 2 */}
            <motion.div variants={fadeUp} className="text-center group">
              <div className="w-16 h-16 mx-auto bg-white dark:bg-black border border-neutral-200 dark:border-neutral-800 flex items-center justify-center mb-6 group-hover:border-[#D4AF37] dark:group-hover:border-[#D4AF37] transition-colors duration-500 shadow-sm">
                <Gem size={24} className="text-[#D4AF37]" strokeWidth={1} />
              </div>
              <h3 className="text-sm font-medium tracking-widest uppercase mb-4">Master Craftsmanship</h3>
              <p className="text-neutral-500 text-xs md:text-sm font-light leading-relaxed px-4 transition-colors duration-500">
                We partner with select jewelers and fragrance houses that respect the ancient arts of goldsmithing and perfumery. We curate for longevity, not fleeting trends.
              </p>
            </motion.div>

            {/* Pillar 3 */}
            <motion.div variants={fadeUp} className="text-center group">
              <div className="w-16 h-16 mx-auto bg-white dark:bg-black border border-neutral-200 dark:border-neutral-800 flex items-center justify-center mb-6 group-hover:border-[#D4AF37] dark:group-hover:border-[#D4AF37] transition-colors duration-500 shadow-sm">
                <Sparkles size={24} className="text-[#D4AF37]" strokeWidth={1} />
              </div>
              <h3 className="text-sm font-medium tracking-widest uppercase mb-4">The VIP Experience</h3>
              <p className="text-neutral-500 text-xs md:text-sm font-light leading-relaxed px-4 transition-colors duration-500">
                Our relationship does not end at checkout. From bespoke packaging to secure, discreet delivery, the JewelMist purchasing experience is as refined as the products themselves.
              </p>
            </motion.div>
          </motion.div>

        </div>
      </section>

      {/* 4. FINAL CTA */}
      <section className="py-24 md:py-32 relative overflow-hidden">
        {/* Subtle blur behind the CTA */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-[#D4AF37]/10 dark:bg-[#D4AF37]/5 rounded-full blur-[100px] pointer-events-none transition-colors duration-500"></div>
        
        <div className="relative z-10 max-w-3xl mx-auto px-4 text-center">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}>
            <h2 className="text-2xl md:text-4xl font-light tracking-widest uppercase mb-8">
              Ready to elevate your aesthetic?
            </h2>
            <Link to="/products" className="inline-flex items-center gap-3 bg-[#D4AF37] text-black px-10 py-5 text-xs font-bold tracking-widest uppercase hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black transition-colors duration-500 shadow-[0_0_30px_rgba(212,175,55,0.15)] group">
              Enter The Showcase
              <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
            </Link>
          </motion.div>
        </div>
      </section>

    </div>
  );
};

export default About;