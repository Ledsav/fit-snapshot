import {
  signInWithCredential,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User,
  GoogleAuthProvider,
} from 'firebase/auth';
import { auth } from '@/config/firebase';
import { GoogleSignin } from '@react-native-google-signin/google-signin';

// Configure Google Sign-In using Expo's built-in environment variables
GoogleSignin.configure({
  webClientId: process.env.EXPO_PUBLIC_ANDROID_CLIENT_ID,
  offlineAccess: false,
});

/**
 * Sign in with Google using native Google Sign-In SDK + Firebase
 * Simple, native implementation - no redirect URIs needed!
 */
export async function signInWithGoogle(): Promise<User | null> {
  try {
    // Check if device has Google Play Services
    await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });

    // Sign in with Google
    const { data } = await GoogleSignin.signIn();

    if (!data?.idToken) {
      throw new Error('No ID token received from Google');
    }

    // Create Firebase credential from Google ID token
    const credential = GoogleAuthProvider.credential(data.idToken);

    // Sign in to Firebase with the Google credential
    const userCredential = await signInWithCredential(auth, credential);
    return userCredential.user;
  } catch (error: any) {
    console.error('Error signing in with Google:', error);
    throw new Error(error.message || 'Failed to sign in with Google');
  }
}

/**
 * Sign out the current user
 */
export async function signOut(): Promise<void> {
  try {
    await firebaseSignOut(auth);
  } catch (error: any) {
    console.error('Error signing out:', error);
    throw new Error(error.message || 'Failed to sign out');
  }
}

/**
 * Get the current authenticated user
 */
export function getCurrentUser(): User | null {
  return auth.currentUser;
}

/**
 * Get the ID token for the current user
 * This token should be sent to your backend for authentication
 */
export async function getIdToken(): Promise<string | null> {
  try {
    const user = auth.currentUser;
    if (!user) {
      return null;
    }

    const token = await user.getIdToken();
    return token;
  } catch (error: any) {
    console.error('Error getting ID token:', error);
    return null;
  }
}

/**
 * Subscribe to auth state changes
 * Returns an unsubscribe function
 */
export function onAuthStateChange(callback: (user: User | null) => void): () => void {
  return onAuthStateChanged(auth, callback);
}

/**
 * Get user display info
 */
export function getUserInfo(user: User | null) {
  if (!user) return null;

  return {
    uid: user.uid,
    email: user.email,
    displayName: user.displayName,
    photoURL: user.photoURL,
  };
}
