import React, { useState } from 'react';
import { AnimatePresence, motion as Motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, BrainCircuit, Eye, EyeOff } from 'lucide-react';

import { useAuth } from '../../hooks/useAuth';

function GoogleIcon() {
  return (
    <svg aria-hidden="true" className="h-5 w-5" viewBox="0 0 24 24">
      <path
        fill="#4285F4"
        d="M21.6 12.23c0-.68-.06-1.33-.17-1.95H12v3.69h5.39a4.62 4.62 0 0 1-2 3.03v2.52h3.23c1.89-1.74 2.98-4.3 2.98-7.29Z"
      />
      <path
        fill="#34A853"
        d="M12 22c2.7 0 4.96-.9 6.61-2.44l-3.23-2.52c-.9.6-2.05.95-3.38.95-2.6 0-4.8-1.76-5.58-4.12H3.08v2.6A9.99 9.99 0 0 0 12 22Z"
      />
      <path
        fill="#FBBC05"
        d="M6.42 13.87A5.98 5.98 0 0 1 6.1 12c0-.65.11-1.28.32-1.87v-2.6H3.08A9.99 9.99 0 0 0 2 12c0 1.61.38 3.14 1.08 4.47l3.34-2.6Z"
      />
      <path
        fill="#EA4335"
        d="M12 6.01c1.47 0 2.79.5 3.83 1.49l2.87-2.87C16.95 2.99 14.69 2 12 2a9.99 9.99 0 0 0-8.92 5.53l3.34 2.6c.78-2.36 2.98-4.12 5.58-4.12Z"
      />
    </svg>
  );
}

const MODE_COPY = {
  login: {
    title: 'Welcome back',
    subtitle: 'Sign in to your JusticeAI workspace',
    submitLabel: 'Login',
    note: 'Use email/password, Google, or a reset link to reach your legal workspace securely.',
  },
  signup: {
    title: 'Create Account',
    subtitle: 'Start your JusticeAI account in a few seconds',
    submitLabel: 'Sign Up',
    note: 'Google sign-up creates the user directly in Supabase Authentication when the provider is enabled.',
  },
  'forgot-password': {
    title: 'Reset your password',
    subtitle: 'Enter your email and we will send a secure reset link',
    submitLabel: 'Send reset link',
    note: 'Supabase sends the reset email, so make sure the email provider and redirect URLs are configured in your project.',
  },
  'reset-password': {
    title: 'Choose a new password',
    subtitle: 'Set a fresh password for your JusticeAI account',
    submitLabel: 'Update password',
    note: 'This screen becomes active after you open the password-reset link from your email.',
  },
};

export default function ModernAnimatedAuth({ mode = 'login' }) {
  const navigate = useNavigate();
  const {
    authConfigError,
    isAuthenticated,
    isPasswordRecovery,
    requestPasswordReset,
    signIn,
    signInWithGoogle,
    signUp,
    updatePassword,
  } = useAuth();

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const isLogin = mode === 'login';
  const isSignup = mode === 'signup';
  const isForgotPassword = mode === 'forgot-password';
  const isResetPassword = mode === 'reset-password';
  const canUpdatePassword = isResetPassword ? isPasswordRecovery || isAuthenticated : true;
  const copy = MODE_COPY[mode] ?? MODE_COPY.login;

  const validate = () => {
    const newErrors = {};

    if (isSignup) {
      if (!username.trim()) {
        newErrors.username = 'Username is required.';
      } else if (username.trim().length < 3) {
        newErrors.username = 'Must be at least 3 characters.';
      }
    }

    if (!isResetPassword) {
      if (!email.trim()) {
        newErrors.email = 'Email is required.';
      } else if (!email.includes('@') || !email.includes('.')) {
        newErrors.email = 'Please enter a valid email address.';
      }
    }

    if (!isForgotPassword) {
      if (!password) {
        newErrors.password = 'Password is required.';
      } else if (password.length < 6) {
        newErrors.password = 'Must be at least 6 characters.';
      }
    }

    if (isSignup || isResetPassword) {
      if (!confirmPassword) {
        newErrors.confirmPassword = 'Confirm password is required.';
      } else if (confirmPassword !== password) {
        newErrors.confirmPassword = 'Passwords must match.';
      }
    }

    if (isResetPassword && !canUpdatePassword) {
      newErrors.global = 'Open the reset link from your email before setting a new password.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const clearFieldError = (fieldName) => {
    setErrors((currentErrors) => {
      if (!currentErrors[fieldName] && !currentErrors.global) {
        return currentErrors;
      }

      const nextErrors = { ...currentErrors };
      delete nextErrors[fieldName];
      delete nextErrors.global;
      return nextErrors;
    });

    if (successMessage) {
      setSuccessMessage('');
    }
  };

  const handleChange = (fieldName, setter) => (event) => {
    setter(event.target.value);
    clearFieldError(fieldName);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSuccessMessage('');

    if (!validate()) {
      return;
    }

    setErrors({});
    setIsLoading(true);

    try {
      const normalizedEmail = email.trim().toLowerCase();

      if (isLogin) {
        await signIn({ email: normalizedEmail, password });
        navigate('/dashboard', { replace: true });
        return;
      }

      if (isSignup) {
        const data = await signUp({
          email: normalizedEmail,
          password,
          username: username.trim(),
        });

        if (data.session) {
          navigate('/dashboard', { replace: true });
          return;
        }

        setSuccessMessage(
          'Account created. Check your email to confirm your address before signing in.'
        );
        setPassword('');
        setConfirmPassword('');
        return;
      }

      if (isForgotPassword) {
        await requestPasswordReset(normalizedEmail);
        setSuccessMessage(
          'Password reset link sent. Open the email from Supabase and follow the link to continue.'
        );
        setEmail('');
        return;
      }

      await updatePassword(password);
      navigate('/dashboard', { replace: true });
    } catch (error) {
      const fallbackMessage = isLogin
        ? 'Unable to sign in right now.'
        : isSignup
          ? 'Unable to create your account right now.'
          : isForgotPassword
            ? 'Unable to send the reset email right now.'
            : 'Unable to update your password right now.';

      setErrors({
        global: error instanceof Error ? error.message : fallbackMessage,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setSuccessMessage('');
    setErrors({});
    setIsLoading(true);

    try {
      await signInWithGoogle();
    } catch (error) {
      setErrors({
        global:
          error instanceof Error
            ? error.message
            : 'Unable to start Google sign-in right now.',
      });
      setIsLoading(false);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1, delayChildren: 0.2 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { type: 'spring', stiffness: 300, damping: 24 },
    },
  };

  const getInputClass = (fieldName) => `
    w-full rounded-xl border bg-white px-4 py-3.5 text-slate-900 shadow-sm transition-all placeholder:text-slate-400 focus:outline-none focus:ring-2 disabled:opacity-50
    ${
      errors[fieldName]
        ? 'border-red-400 bg-red-50/50 focus:border-red-500 focus:ring-red-400/20'
        : 'border-slate-200 focus:border-blue-500 focus:ring-blue-500/20'
    }
  `;

  return (
    <div className="relative z-10 mx-auto mt-4 max-h-[90vh] w-full max-w-sm overflow-y-auto px-2 pb-6">
      <Motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="mb-8 text-center"
      >
        <Motion.div
          variants={itemVariants}
          className="relative mb-6 inline-flex items-center justify-center gap-2"
        >
          <div className="pointer-events-none absolute inset-0 rounded-full bg-blue-500/20 blur-xl auto-animate" />
          <div className="relative z-10 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-500 text-white shadow-lg shadow-blue-500/30 animate-ripple">
            <BrainCircuit size={24} strokeWidth={2} />
          </div>
        </Motion.div>

        <Motion.h1
          variants={itemVariants}
          className="mb-2 text-3xl font-bold tracking-tight text-gray-900"
        >
          {copy.title}
        </Motion.h1>
        <Motion.p variants={itemVariants} className="text-sm font-medium text-slate-500">
          {copy.subtitle}
        </Motion.p>
      </Motion.div>

      <Motion.form
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        onSubmit={handleSubmit}
        className="relative space-y-4"
      >
        <AnimatePresence>
          {authConfigError && (
            <Motion.div
              initial={{ opacity: 0, height: 0, marginBottom: 0 }}
              animate={{ opacity: 1, height: 'auto', marginBottom: 16 }}
              exit={{ opacity: 0, height: 0, marginBottom: 0 }}
              className="rounded-xl border border-amber-200 bg-amber-50/90 px-4 py-3 text-sm text-amber-700 backdrop-blur-sm"
            >
              {authConfigError}
            </Motion.div>
          )}
          {!authConfigError && isResetPassword && !canUpdatePassword && (
            <Motion.div
              initial={{ opacity: 0, height: 0, marginBottom: 0 }}
              animate={{ opacity: 1, height: 'auto', marginBottom: 16 }}
              exit={{ opacity: 0, height: 0, marginBottom: 0 }}
              className="rounded-xl border border-blue-200 bg-blue-50/90 px-4 py-3 text-sm text-blue-700 backdrop-blur-sm"
            >
              Open the reset link from your email first. If it expired, request a fresh link below.
            </Motion.div>
          )}
          {errors.global && (
            <Motion.div
              initial={{ opacity: 0, height: 0, marginBottom: 0 }}
              animate={{ opacity: 1, height: 'auto', marginBottom: 16 }}
              exit={{ opacity: 0, height: 0, marginBottom: 0 }}
              className="rounded-xl border border-red-200 bg-red-50/80 px-4 py-3 text-sm text-red-600 backdrop-blur-sm"
            >
              {errors.global}
            </Motion.div>
          )}
          {successMessage && (
            <Motion.div
              initial={{ opacity: 0, height: 0, marginBottom: 0 }}
              animate={{ opacity: 1, height: 'auto', marginBottom: 16 }}
              exit={{ opacity: 0, height: 0, marginBottom: 0 }}
              className="rounded-xl border border-emerald-200 bg-emerald-50/90 px-4 py-3 text-sm text-emerald-700 backdrop-blur-sm"
            >
              {successMessage}
            </Motion.div>
          )}
        </AnimatePresence>

        {isSignup && (
          <Motion.div variants={itemVariants}>
            <label className="mb-1.5 ml-1 block text-sm font-medium text-slate-700">
              Username
            </label>
            <input
              type="text"
              value={username}
              onChange={handleChange('username', setUsername)}
              disabled={isLoading}
              placeholder="legal_eagle"
              className={getInputClass('username')}
            />
            {errors.username && (
              <p className="mt-1.5 ml-1 text-xs text-red-500">{errors.username}</p>
            )}
          </Motion.div>
        )}

        {!isResetPassword && (
          <Motion.div variants={itemVariants}>
            <label className="mb-1.5 ml-1 block text-sm font-medium text-slate-700">
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={handleChange('email', setEmail)}
              disabled={isLoading}
              placeholder="attorney@lawfirm.com"
              className={getInputClass('email')}
            />
            {errors.email && <p className="mt-1.5 ml-1 text-xs text-red-500">{errors.email}</p>}
          </Motion.div>
        )}

        {!isForgotPassword && (
          <Motion.div variants={itemVariants}>
            <div className="mb-1.5 flex items-center justify-between gap-3">
              <label className="ml-1 block text-sm font-medium text-slate-700">Password</label>
              {isLogin && (
                <Link
                  to="/forgot-password"
                  className="text-xs font-semibold text-blue-600 transition-colors hover:text-blue-700 hover:underline"
                >
                  Forgot password?
                </Link>
              )}
            </div>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={handleChange('password', setPassword)}
                disabled={isLoading}
                placeholder="Enter your password"
                className={`${getInputClass('password')} pr-12`}
              />
              <button
                type="button"
                onClick={() => setShowPassword((currentValue) => !currentValue)}
                disabled={isLoading}
                className="absolute top-1/2 right-3 -translate-y-1/2 p-2 text-slate-400 transition-colors hover:text-slate-600 focus:outline-none"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {errors.password && (
              <p className="mt-1.5 ml-1 text-xs text-red-500">{errors.password}</p>
            )}
          </Motion.div>
        )}

        {(isSignup || isResetPassword) && (
          <Motion.div variants={itemVariants}>
            <label className="mb-1.5 ml-1 block text-sm font-medium text-slate-700">
              Confirm Password
            </label>
            <div className="relative">
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={handleChange('confirmPassword', setConfirmPassword)}
                disabled={isLoading}
                placeholder="Confirm your password"
                className={`${getInputClass('confirmPassword')} pr-12`}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword((currentValue) => !currentValue)}
                disabled={isLoading}
                className="absolute top-1/2 right-3 -translate-y-1/2 p-2 text-slate-400 transition-colors hover:text-slate-600 focus:outline-none"
              >
                {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {errors.confirmPassword && (
              <p className="mt-1.5 ml-1 text-xs text-red-500">{errors.confirmPassword}</p>
            )}
          </Motion.div>
        )}

        <Motion.div variants={itemVariants} className="pt-3">
          <Motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            type="submit"
            disabled={isLoading || Boolean(authConfigError) || !canUpdatePassword}
            className="group relative flex w-full items-center justify-center gap-2 overflow-hidden rounded-xl bg-slate-900 py-3.5 font-semibold text-white shadow-md transition-all hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:ring-offset-2 disabled:opacity-70"
          >
            {isLoading ? (
              <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
            ) : (
              <>
                {copy.submitLabel}
                <ArrowRight
                  size={18}
                  className="transition-all group-hover:translate-x-0.5"
                />
              </>
            )}
            <div className="absolute inset-0 bg-white/10 opacity-0 transition-opacity group-active:opacity-100" />
          </Motion.button>
        </Motion.div>

        {(isLogin || isSignup) && (
          <Motion.div variants={itemVariants} className="space-y-3">
            <div className="relative py-1">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200" />
              </div>
              <div className="relative flex justify-center">
                <span className="bg-[#F8FAFC] px-3 text-xs font-medium uppercase tracking-[0.2em] text-slate-400">
                  or continue with
                </span>
              </div>
            </div>

            <Motion.button
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
              type="button"
              onClick={handleGoogleSignIn}
              disabled={isLoading || Boolean(authConfigError)}
              className="flex w-full items-center justify-center gap-3 rounded-xl border border-slate-200 bg-white py-3.5 font-semibold text-slate-700 shadow-sm transition-all hover:border-slate-300 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500/20 disabled:opacity-70"
            >
              <GoogleIcon />
              {isLogin ? 'Sign in with Google' : 'Continue with Google'}
            </Motion.button>
          </Motion.div>
        )}

        <Motion.p
          variants={itemVariants}
          className="rounded-2xl border border-slate-200 bg-white/70 px-4 py-3 text-xs leading-relaxed text-slate-500"
        >
          {isResetPassword && canUpdatePassword
            ? 'Your recovery session is active. Save the new password to finish the reset flow and continue to the dashboard.'
            : copy.note}
        </Motion.p>
      </Motion.form>

      <Motion.p
        variants={itemVariants}
        className="mt-8 pb-2 text-center text-sm font-medium text-slate-500"
      >
        {isLogin && (
          <>
            Don&apos;t have an account?{' '}
            <Link
              to="/signup"
              className="font-bold text-blue-600 decoration-2 underline-offset-4 transition-all hover:text-blue-700 hover:underline"
            >
              Sign up
            </Link>
          </>
        )}
        {isSignup && (
          <>
            Already have an account?{' '}
            <Link
              to="/login"
              className="font-bold text-blue-600 decoration-2 underline-offset-4 transition-all hover:text-blue-700 hover:underline"
            >
              Login
            </Link>
          </>
        )}
        {isForgotPassword && (
          <>
            Remembered your password?{' '}
            <Link
              to="/login"
              className="font-bold text-blue-600 decoration-2 underline-offset-4 transition-all hover:text-blue-700 hover:underline"
            >
              Back to login
            </Link>
          </>
        )}
        {isResetPassword && (
          <>
            Need a fresh reset link?{' '}
            <Link
              to="/forgot-password"
              className="font-bold text-blue-600 decoration-2 underline-offset-4 transition-all hover:text-blue-700 hover:underline"
            >
              Request one
            </Link>
          </>
        )}
      </Motion.p>
    </div>
  );
}
