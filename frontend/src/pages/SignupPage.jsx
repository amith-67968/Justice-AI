import React from 'react';
import { motion } from 'framer-motion';
import loginImage from '../assets/legal-3d.png';
import ModernAnimatedSignIn from '../components/ui/modern-animated-sign-in';

export default function SignupPage() {
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.6 }}
      className="fixed inset-0 w-full h-full z-20 flex flex-col md:flex-row bg-[#F8FAFC] overflow-hidden font-sans"
    >
      {/* LEFT SIDE (Image + Overlay) */}
      <motion.div 
        initial={{ opacity: 0, scale: 1.05, x: -50 }}
        animate={{ opacity: 1, scale: 1, x: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="hidden md:block w-1/2 h-full relative"
      >
        <img 
          src={loginImage} 
          alt="login visual" 
          className="absolute inset-0 w-full h-full object-cover"
        />
        {/* Subtle Dark Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-slate-900/90 via-slate-900/40 to-transparent" />
        
        {/* Overlay text on top of the image */}
        <div className="absolute bottom-16 left-12 max-w-md">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.8 }}
            className="text-white"
          >
            <h3 className="text-3xl font-bold mb-3 tracking-tight">JusticeAI</h3>
            <p className="text-slate-200 text-lg leading-relaxed">
              AI-powered legal intelligence for smarter decisions
            </p>
          </motion.div>
        </div>
      </motion.div>

      {/* RIGHT SIDE (Signup Form) */}
      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 0.2 }}
        className="w-full md:w-1/2 h-full flex flex-col items-center justify-center p-8 sm:p-12 lg:p-24 relative"
      >
        {/* Optional decorative blurs for the right side */}
        <div className="absolute top-10 right-10 w-64 h-64 bg-blue-100/30 rounded-full blur-[80px] -z-10" />
        <div className="absolute bottom-10 left-10 w-72 h-72 bg-indigo-50/40 rounded-full blur-[80px] -z-10" />

        <ModernAnimatedSignIn mode="signup" />
      </motion.div>
    </motion.div>
  );
}
