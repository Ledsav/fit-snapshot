import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from 'firebase/auth';
import {
  signInWithGoogle,
  signOut,
  getIdToken,
  onAuthStateChange,
  getUserInfo,
} from '@/services/authService';

interface AuthContextType {
  user: User | null;
  userInfo: {
    uid: string;
    email: string | null;
    displayName: string | null;
    photoURL: string | null;
  } | null;
  loading: boolean;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
  getToken: () => Promise<string | null>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log('AuthProvider: Initializing auth state listener');
    try {
      // Subscribe to auth state changes
      const unsubscribe = onAuthStateChange((authUser) => {
        console.log('AuthProvider: Auth state changed', authUser ? 'User logged in' : 'No user');
        setUser(authUser);
        setLoading(false);
      });

      return () => {
        console.log('AuthProvider: Cleaning up auth listener');
        unsubscribe();
      };
    } catch (error) {
      console.error('AuthProvider: Failed to initialize auth', error);
      setLoading(false);
    }
  }, []);

  const handleSignIn = async () => {
    try {
      setLoading(true);
      const signedInUser = await signInWithGoogle();
      // For redirect flow, user will be null initially
      // The onAuthStateChange listener will pick up the user after redirect
      if (signedInUser) {
        setUser(signedInUser);
      }
    } catch (error) {
      console.error('Sign in error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      setLoading(true);
      await signOut();
      setUser(null);
    } catch (error) {
      console.error('Sign out error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const handleGetToken = async (): Promise<string | null> => {
    return await getIdToken();
  };

  const userInfo = getUserInfo(user);

  const value: AuthContextType = {
    user,
    userInfo,
    loading,
    signIn: handleSignIn,
    signOut: handleSignOut,
    getToken: handleGetToken,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
