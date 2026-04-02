import React, { createContext, useEffect, useState } from 'react';

import {
  getSupabaseAuthConfigError,
  getSupabaseBrowserClient,
  isSupabaseAuthConfigured,
} from '../lib/supabase';

const AuthContext = createContext(null);
const PASSWORD_RECOVERY_STORAGE_KEY = 'justiceai-password-recovery';

function buildRedirectUrl(path) {
  if (typeof window === 'undefined') {
    return undefined;
  }

  return new URL(path, window.location.origin).toString();
}

function hasRecoveryTypeInLocation() {
  if (typeof window === 'undefined') {
    return false;
  }

  const searchParams = new URLSearchParams(window.location.search);
  const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ''));

  return (
    searchParams.get('type') === 'recovery' ||
    hashParams.get('type') === 'recovery'
  );
}

function readPasswordRecoveryState() {
  if (typeof window === 'undefined') {
    return false;
  }

  return (
    window.sessionStorage.getItem(PASSWORD_RECOVERY_STORAGE_KEY) === 'true' ||
    hasRecoveryTypeInLocation()
  );
}

function persistPasswordRecoveryState(isActive) {
  if (typeof window === 'undefined') {
    return;
  }

  if (isActive) {
    window.sessionStorage.setItem(PASSWORD_RECOVERY_STORAGE_KEY, 'true');
    return;
  }

  window.sessionStorage.removeItem(PASSWORD_RECOVERY_STORAGE_KEY);
}

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(() => isSupabaseAuthConfigured());
  const [authConfigError, setAuthConfigError] = useState(() => getSupabaseAuthConfigError());
  const [isPasswordRecovery, setIsPasswordRecovery] = useState(() =>
    readPasswordRecoveryState()
  );

  useEffect(() => {
    if (!isSupabaseAuthConfigured()) {
      return undefined;
    }

    const supabase = getSupabaseBrowserClient();
    let isMounted = true;

    const syncSession = (nextSession) => {
      if (!isMounted) {
        return;
      }

      setSession(nextSession ?? null);
      setUser(nextSession?.user ?? null);
      setAuthConfigError('');
      setIsLoading(false);
    };

    supabase.auth
      .getSession()
      .then(({ data, error }) => {
        if (error) {
          if (isMounted) {
            setAuthConfigError(error.message || 'Unable to restore the current session.');
            setIsLoading(false);
          }
          return;
        }

        syncSession(data.session);
      })
      .catch((error) => {
        if (isMounted) {
          setAuthConfigError(error.message || 'Unable to restore the current session.');
          setIsLoading(false);
        }
      });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, nextSession) => {
      if (event === 'PASSWORD_RECOVERY') {
        persistPasswordRecoveryState(true);
        setIsPasswordRecovery(true);
      } else if (event === 'SIGNED_OUT') {
        persistPasswordRecoveryState(false);
        setIsPasswordRecovery(false);
      }

      syncSession(nextSession);
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const ensureConfigured = () => {
    const message = getSupabaseAuthConfigError();
    if (message) {
      setAuthConfigError(message);
      throw new Error(message);
    }
  };

  const signIn = async ({ email, password }) => {
    ensureConfigured();

    const { data, error } = await getSupabaseBrowserClient().auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      throw error;
    }

    persistPasswordRecoveryState(false);
    setIsPasswordRecovery(false);
    setSession(data.session ?? null);
    setUser(data.user ?? data.session?.user ?? null);
    return data;
  };

  const signInWithGoogle = async () => {
    ensureConfigured();

    const { data, error } = await getSupabaseBrowserClient().auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: buildRedirectUrl('/dashboard'),
      },
    });

    if (error) {
      throw error;
    }

    persistPasswordRecoveryState(false);
    setIsPasswordRecovery(false);
    return data;
  };

  const signUp = async ({ email, password, username }) => {
    ensureConfigured();

    const emailRedirectTo = buildRedirectUrl('/login');

    const { data, error } = await getSupabaseBrowserClient().auth.signUp({
      email,
      password,
      options: {
        data: username ? { username } : {},
        ...(emailRedirectTo ? { emailRedirectTo } : {}),
      },
    });

    if (error) {
      throw error;
    }

    if (data.session) {
      persistPasswordRecoveryState(false);
      setIsPasswordRecovery(false);
      setSession(data.session);
      setUser(data.user ?? data.session.user ?? null);
    }

    return data;
  };

  const requestPasswordReset = async (email) => {
    ensureConfigured();

    const { data, error } = await getSupabaseBrowserClient().auth.resetPasswordForEmail(email, {
      redirectTo: buildRedirectUrl('/reset-password'),
    });

    if (error) {
      throw error;
    }

    persistPasswordRecoveryState(false);
    setIsPasswordRecovery(false);
    return data;
  };

  const updatePassword = async (password) => {
    ensureConfigured();

    const { data, error } = await getSupabaseBrowserClient().auth.updateUser({
      password,
    });

    if (error) {
      throw error;
    }

    persistPasswordRecoveryState(false);
    setIsPasswordRecovery(false);
    setUser(data.user ?? null);
    return data;
  };

  const signOut = async () => {
    ensureConfigured();

    const { error } = await getSupabaseBrowserClient().auth.signOut();

    if (error) {
      throw error;
    }

    persistPasswordRecoveryState(false);
    setIsPasswordRecovery(false);
    setSession(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        session,
        user,
        isLoading,
        isAuthenticated: Boolean(session?.user),
        isPasswordRecovery,
        authConfigError,
        signIn,
        signInWithGoogle,
        signUp,
        requestPasswordReset,
        updatePassword,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export default AuthContext;
