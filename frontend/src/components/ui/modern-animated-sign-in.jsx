import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, BrainCircuit, ScanFace } from 'lucide-react';

export default function ModernAnimatedSignIn({ mode = 'login' }) {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  const isLogin = mode === 'login';

  const validate = () => {
    const newErrors = {};
    if (!isLogin) {
      if (!username) newErrors.username = 'Username is required.';
      else if (username.length < 3) newErrors.username = 'Must be at least 3 characters.';
    }

    if (!email) {
      newErrors.email = 'Email is required.';
    } else if (!email.includes('@') || !email.includes('.')) {
      newErrors.email = 'Please enter a valid email address.';
    }

    if (!password) {
      newErrors.password = 'Password is required.';
    } else if (password.length < 6) {
      newErrors.password = 'Must be at least 6 characters.';
    }

    if (!isLogin) {
      if (!confirmPassword) newErrors.confirmPassword = 'Confirm password is required.';
      else if (confirmPassword !== password) newErrors.confirmPassword = 'Passwords must match.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;

    setIsLoading(true);
    // Simulate network delay
    setTimeout(() => {
      setIsLoading(false);
      navigate('/dashboard');
    }, 1200);
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { staggerChildren: 0.1, delayChildren: 0.2 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    visible: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
  };

  const getInputClass = (fieldName) => `
    w-full bg-white border text-slate-900 rounded-xl px-4 py-3.5 focus:outline-none focus:ring-2 transition-all placeholder:text-slate-400 shadow-sm disabled:opacity-50
    ${errors[fieldName] 
      ? 'border-red-400 focus:ring-red-400/20 focus:border-red-500 bg-red-50/50' 
      : 'border-slate-200 focus:ring-blue-500/20 focus:border-blue-500'}
  `;

  return (
    <div className="w-full max-w-sm mx-auto z-10 relative mt-4 overflow-y-auto max-h-[90vh] custom-scrollbar px-2 pb-6">
      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="text-center mb-8"
      >
        <motion.div variants={itemVariants} className="inline-flex items-center justify-center gap-2 mb-6 relative">
          <div className="absolute inset-0 bg-blue-500/20 blur-xl rounded-full auto-animate pointer-events-none" />
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white shadow-lg shadow-blue-500/30 relative z-10 animate-ripple">
            <BrainCircuit size={24} strokeWidth={2} />
          </div>
        </motion.div>
        
        <motion.h1 variants={itemVariants} className="text-3xl font-bold tracking-tight text-gray-900 mb-2">
          {isLogin ? "Welcome back" : "Create Account"}
        </motion.h1>
        <motion.p variants={itemVariants} className="text-sm font-medium text-slate-500">
          {isLogin ? "Sign in to your JusticeAI account" : "Join JusticeAI to get started"}
        </motion.p>
      </motion.div>

      <motion.form 
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        onSubmit={handleSubmit} 
        className="space-y-4 relative"
      >
        <AnimatePresence>
          {errors.global && (
            <motion.div 
              initial={{ opacity: 0, height: 0, marginBottom: 0 }}
              animate={{ opacity: 1, height: 'auto', marginBottom: 16 }}
              exit={{ opacity: 0, height: 0, marginBottom: 0 }}
              className="text-sm text-red-600 bg-red-50/80 backdrop-blur-sm px-4 py-3 rounded-xl border border-red-200"
            >
              {errors.global}
            </motion.div>
          )}
        </AnimatePresence>

        {!isLogin && (
          <motion.div variants={itemVariants}>
            <label className="block text-sm font-medium text-slate-700 mb-1.5 ml-1">Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => { setUsername(e.target.value); if(errors.username) setErrors({...errors, username: null})}}
              disabled={isLoading}
              placeholder="legal_eagle"
              className={getInputClass('username')}
            />
            {errors.username && <p className="text-xs text-red-500 mt-1.5 ml-1">{errors.username}</p>}
          </motion.div>
        )}

        <motion.div variants={itemVariants}>
          <label className="block text-sm font-medium text-slate-700 mb-1.5 ml-1">Email Address</label>
          <input
            type="email"
            value={email}
            onChange={(e) => { setEmail(e.target.value); if(errors.email) setErrors({...errors, email: null})}}
            disabled={isLoading}
            placeholder="attorney@lawfirm.com"
            className={getInputClass('email')}
          />
          {errors.email && <p className="text-xs text-red-500 mt-1.5 ml-1">{errors.email}</p>}
        </motion.div>
        
        <motion.div variants={itemVariants}>
          <div className="flex items-center justify-between mb-1.5 ml-1 mr-1">
            <label className="block text-sm font-medium text-slate-700">Password</label>
            {isLogin && (
              <a href="#" className="text-sm font-semibold text-blue-600 hover:text-blue-700 transition-colors">
                Forgot Password?
              </a>
            )}
          </div>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => { setPassword(e.target.value); if(errors.password) setErrors({...errors, password: null})}}
              disabled={isLoading}
              placeholder="••••••••"
              className={`${getInputClass('password')} pr-12`}
            />
            <button
               type="button"
               onClick={() => setShowPassword(!showPassword)}
               disabled={isLoading}
               className="absolute right-3 top-1/2 -translate-y-1/2 p-2 text-slate-400 hover:text-slate-600 transition-colors focus:outline-none"
             >
               {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
             </button>
          </div>
          {errors.password && <p className="text-xs text-red-500 mt-1.5 ml-1">{errors.password}</p>}
        </motion.div>

        {!isLogin && (
          <motion.div variants={itemVariants}>
            <label className="block text-sm font-medium text-slate-700 mb-1.5 ml-1">Confirm Password</label>
            <div className="relative">
              <input
                type={showConfirmPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => { setConfirmPassword(e.target.value); if(errors.confirmPassword) setErrors({...errors, confirmPassword: null})}}
                disabled={isLoading}
                placeholder="••••••••"
                className={`${getInputClass('confirmPassword')} pr-12`}
              />
              <button
                 type="button"
                 onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                 disabled={isLoading}
                 className="absolute right-3 top-1/2 -translate-y-1/2 p-2 text-slate-400 hover:text-slate-600 transition-colors focus:outline-none"
               >
                 {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
               </button>
            </div>
            {errors.confirmPassword && <p className="text-xs text-red-500 mt-1.5 ml-1">{errors.confirmPassword}</p>}
          </motion.div>
        )}

        <motion.div variants={itemVariants} className="pt-3">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            type="submit"
            disabled={isLoading}
            className="w-full bg-slate-900 hover:bg-slate-800 text-white font-semibold py-3.5 rounded-xl transition-all shadow-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-900 disabled:opacity-70 flex items-center justify-center gap-2 relative overflow-hidden group"
          >
            {isLoading ? (
              <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                {isLogin ? "Login" : "Sign Up"}
                <ScanFace size={18} className="opacity-0 -ml-4 group-hover:opacity-100 group-hover:ml-0 transition-all" />
              </>
            )}
            <div className="absolute inset-0 bg-white/10 opacity-0 group-active:opacity-100 transition-opacity" />
          </motion.button>
        </motion.div>

        <motion.div variants={itemVariants} className="flex items-center gap-3 py-4">
          <div className="flex-1 h-px bg-slate-200" />
          <span className="text-xs font-medium text-slate-400 uppercase tracking-widest">Or continue with</span>
          <div className="flex-1 h-px bg-slate-200" />
        </motion.div>

        <motion.div variants={itemVariants}>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            type="button"
            disabled={isLoading}
            className="w-full bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 font-semibold py-3.5 rounded-xl transition-all shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-100 flex items-center justify-center gap-3 disabled:opacity-50"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              <path d="M1 1h22v22H1z" fill="none"/>
            </svg>
            Google
          </motion.button>
        </motion.div>
      </motion.form>

      <motion.p variants={itemVariants} className="mt-8 text-center text-sm text-slate-500 font-medium pb-2">
        {isLogin ? "Don't have an account? " : "Already have an account? "}
        <Link 
          to={isLogin ? "/signup" : "/login"} 
          className="text-blue-600 font-bold hover:text-blue-700 hover:underline underline-offset-4 decoration-2 transition-all"
        >
          {isLogin ? "Sign up" : "Login"}
        </Link>
      </motion.p>
    </div>
  );
}
