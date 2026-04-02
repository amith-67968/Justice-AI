import React from 'react';
import { motion as Motion } from 'framer-motion';

import loginImage from '../../assets/legal-3d.png';

export default function AuthShell({ children }) {
  return (
    <Motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.6 }}
      className="fixed inset-0 z-20 flex h-full w-full flex-col overflow-hidden bg-[#F8FAFC] font-sans md:flex-row"
    >
      <Motion.div
        initial={{ opacity: 0, scale: 1.05, x: -50 }}
        animate={{ opacity: 1, scale: 1, x: 0 }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
        className="relative hidden h-full w-1/2 md:block"
      >
        <img
          src={loginImage}
          alt="JusticeAI workspace"
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-slate-900/90 via-slate-900/40 to-transparent" />

        <div className="absolute bottom-16 left-12 max-w-md">
          <Motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.8 }}
            className="text-white"
          >
            <h3 className="mb-3 text-3xl font-bold tracking-tight">JusticeAI</h3>
            <p className="text-lg leading-relaxed text-slate-200">
              AI-powered legal intelligence for smarter decisions
            </p>
          </Motion.div>
        </div>
      </Motion.div>

      <Motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 0.2 }}
        className="relative flex h-full w-full flex-col items-center justify-center p-8 sm:p-12 lg:p-24 md:w-1/2"
      >
        <div className="absolute top-10 right-10 -z-10 h-64 w-64 rounded-full bg-blue-100/30 blur-[80px]" />
        <div className="absolute bottom-10 left-10 -z-10 h-72 w-72 rounded-full bg-indigo-50/40 blur-[80px]" />

        {children}
      </Motion.div>
    </Motion.div>
  );
}
