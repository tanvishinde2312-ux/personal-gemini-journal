import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signOut as fbSignOut, 
  onAuthStateChanged,
  signInAnonymously,
  User 
} from 'firebase/auth';
import { 
  getFirestore, 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  query, 
  orderBy, 
  deleteDoc, 
  onSnapshot,
  Timestamp 
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import { JournalInteraction, UserProfile } from '../types';

// Initialize Firebase App singleton
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Initialize Auth
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

// Initialize Firestore with specific database ID if present in config
export const db = firebaseConfig.firestoreDatabaseId 
  ? getFirestore(app, firebaseConfig.firestoreDatabaseId)
  : getFirestore(app);

/**
 * Utility: Strips any undefined fields recursively to prevent Firestore write crashes
 */
export function sanitizeForFirestore<T>(data: T): T {
  if (data === null || data === undefined) {
    return data;
  }
  if (Array.isArray(data)) {
    return data.map((item) => sanitizeForFirestore(item)) as unknown as T;
  }
  if (typeof data === 'object' && !(data instanceof Date) && !(data instanceof Timestamp)) {
    const cleaned: Record<string, any> = {};
    for (const [key, value] of Object.entries(data as Record<string, any>)) {
      if (value !== undefined) {
        cleaned[key] = sanitizeForFirestore(value);
      }
    }
    return cleaned as T;
  }
  return data;
}

/**
 * Diagnose and format Firebase Auth errors into actionable messages
 */
export function formatAuthError(error: any): string {
  if (!error) return 'An unexpected authentication error occurred.';
  const code = error.code || '';
  const message = error.message || '';

  if (code === 'auth/admin-restricted-operation' || message.includes('admin-restricted-operation') || message.includes('restricted to administrators')) {
    return 'Anonymous Sign-In is not enabled on this Firebase project. Please click "Sign in with Google" (the enabled provider), or enable Anonymous Authentication in the Firebase Console under Authentication > Sign-in method.';
  }
  if (code === 'auth/operation-not-allowed' || message.includes('operation-not-allowed')) {
    return 'This sign-in provider is disabled in your Firebase project. Please use "Sign in with Google" or enable the provider in your Firebase Console.';
  }
  if (code === 'auth/popup-blocked' || message.includes('popup-blocked')) {
    return 'The sign-in popup was blocked by your browser. Please allow popups for this site and try again.';
  }
  if (code === 'auth/popup-closed-by-user' || message.includes('popup-closed-by-user')) {
    return 'The sign-in popup was closed before completing authentication. Please click "Sign in with Google" to retry.';
  }
  if (code === 'auth/unauthorized-domain' || message.includes('unauthorized-domain')) {
    return 'This app domain is not authorized in Firebase. Please add this domain to Firebase Console > Authentication > Settings > Authorized domains.';
  }
  if (code === 'auth/network-request-failed' || message.includes('network-request-failed')) {
    return 'Network connection issue while communicating with Firebase Authentication. Please check your connection and retry.';
  }
  return message || 'Authentication failed. Please verify your credentials or try again.';
}

/**
 * Sign In with Google popup with fallback handling
 */
export async function signInWithGoogle(): Promise<User> {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (error: any) {
    console.error('Google Sign-In Error:', error);
    throw new Error(formatAuthError(error));
  }
}

/**
 * Quick Guest Sign-In (for quick testing/offline fallback)
 */
export async function signInAsGuest(): Promise<User> {
  try {
    const result = await signInAnonymously(auth);
    return result.user;
  } catch (error: any) {
    console.error('Guest Sign-In Error:', error);
    throw new Error(formatAuthError(error));
  }
}

/**
 * Sign Out
 */
export async function logOut(): Promise<void> {
  await fbSignOut(auth);
}

/**
 * Convert Firebase User to clean UserProfile
 */
export function mapFirebaseUser(user: User | null): UserProfile | null {
  if (!user) return null;
  return {
    uid: user.uid,
    displayName: user.displayName || (user.isAnonymous ? 'Guest Reflecter' : 'Anonymous Thinker'),
    email: user.email,
    photoURL: user.photoURL,
    isAnonymous: user.isAnonymous,
  };
}

/**
 * Local cache helper for instant UI hydration and offline resilience per UID
 */
function getLocalCacheKey(userId: string): string {
  return `reflect_vault_${userId}`;
}

function readLocalVault(userId: string): JournalInteraction[] {
  if (!userId) return [];
  try {
    const raw = localStorage.getItem(getLocalCacheKey(userId));
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeLocalVault(userId: string, interactions: JournalInteraction[]): void {
  if (!userId) return;
  try {
    localStorage.setItem(getLocalCacheKey(userId), JSON.stringify(interactions));
  } catch (err) {
    console.warn('Failed to write local vault cache:', err);
  }
}

/**
 * Save user profile document to /users/{userId}
 */
export async function syncUserProfile(user: UserProfile): Promise<void> {
  if (!user || !user.uid) return;
  try {
    const userDocRef = doc(db, 'users', user.uid);
    await setDoc(
      userDocRef,
      sanitizeForFirestore({
        uid: user.uid,
        displayName: user.displayName || 'Anonymous Reflecter',
        email: user.email || '',
        photoURL: user.photoURL || '',
        lastLoginAt: new Date().toISOString(),
      }),
      { merge: true }
    );
  } catch (err) {
    console.warn('Sync user profile warning:', err);
  }
}

/**
 * Save or update a journal interaction strictly bound to the user's isolated subcollection:
 * Path: /users/{userId}/interactions/{interactionId}
 */
export async function saveJournalInteraction(
  userId: string, 
  interaction: JournalInteraction
): Promise<void> {
  const targetUid = userId || auth.currentUser?.uid;
  if (!targetUid) throw new Error('User UID is required to persist an interaction');
  if (!interaction.id) throw new Error('Interaction ID is required');

  const sanitized = sanitizeForFirestore<JournalInteraction>({
    ...interaction,
    id: interaction.id,
    userId: targetUid,
    updatedAt: new Date().toISOString(),
    createdAt: interaction.createdAt || new Date().toISOString(),
    turns: interaction.turns || [],
    tags: interaction.tags || [],
  });

  // 1. Update local cache immediately for zero-latency switching
  const currentVault = readLocalVault(targetUid);
  const existingIdx = currentVault.findIndex((i) => i.id === sanitized.id);
  let updatedVault: JournalInteraction[];
  if (existingIdx >= 0) {
    updatedVault = [...currentVault];
    updatedVault[existingIdx] = sanitized;
  } else {
    updatedVault = [sanitized, ...currentVault];
  }
  updatedVault.sort((a, b) => new Date(b.updatedAt || b.createdAt).getTime() - new Date(a.updatedAt || a.createdAt).getTime());
  writeLocalVault(targetUid, updatedVault);

  // 2. Persist to Cloud Firestore under /users/{userId}/interactions/{interactionId}
  const docRef = doc(db, 'users', targetUid, 'interactions', interaction.id);
  await setDoc(docRef, sanitized, { merge: true });
}

/**
 * Fetch a single journal interaction by ID
 */
export async function getJournalInteraction(
  userId: string, 
  interactionId: string
): Promise<JournalInteraction | null> {
  const targetUid = userId || auth.currentUser?.uid;
  if (!targetUid || !interactionId) return null;
  
  const docRef = doc(db, 'users', targetUid, 'interactions', interactionId);
  const snapshot = await getDoc(docRef);
  if (!snapshot.exists()) return null;
  const data = snapshot.data() as JournalInteraction;
  return { ...data, id: data.id || snapshot.id, userId: targetUid };
}

/**
 * Direct fetch of all interactions for an authenticated user from Firestore
 */
export async function getUserInteractions(userId: string): Promise<JournalInteraction[]> {
  const targetUid = userId || auth.currentUser?.uid;
  if (!targetUid) return [];

  // Seed with local vault cache if available
  const localItems = readLocalVault(targetUid);

  try {
    const interactionsRef = collection(db, 'users', targetUid, 'interactions');
    const snapshot = await getDocs(interactionsRef);
    const serverItems: JournalInteraction[] = [];
    
    snapshot.forEach((docSnap) => {
      const data = docSnap.data() as JournalInteraction;
      serverItems.push({
        ...data,
        id: data.id || docSnap.id,
        userId: targetUid,
        turns: data.turns || [],
        tags: data.tags || [],
      });
    });

    serverItems.sort((a, b) => new Date(b.updatedAt || b.createdAt).getTime() - new Date(a.updatedAt || a.createdAt).getTime());
    writeLocalVault(targetUid, serverItems);
    return serverItems;
  } catch (err) {
    console.warn('Error fetching user interactions from Firestore, falling back to cache:', err);
    return localItems;
  }
}

/**
 * Delete a journal interaction from Firestore and local cache
 */
export async function deleteJournalInteraction(
  userId: string, 
  interactionId: string
): Promise<void> {
  const targetUid = userId || auth.currentUser?.uid;
  if (!targetUid || !interactionId) return;

  // 1. Update local cache
  const currentVault = readLocalVault(targetUid);
  const remaining = currentVault.filter((i) => i.id !== interactionId);
  writeLocalVault(targetUid, remaining);

  // 2. Delete from Cloud Firestore
  const docRef = doc(db, 'users', targetUid, 'interactions', interactionId);
  await deleteDoc(docRef);
}

/**
 * Subscribe to the user's journal interactions in real-time
 */
export function subscribeToUserInteractions(
  userId: string, 
  callback: (interactions: JournalInteraction[]) => void,
  onError?: (error: Error) => void
) {
  const targetUid = userId || auth.currentUser?.uid;
  if (!targetUid) {
    callback([]);
    return () => {};
  }

  // Pre-load from local cache immediately
  const localCache = readLocalVault(targetUid);
  if (localCache.length > 0) {
    callback(localCache);
  }

  const interactionsRef = collection(db, 'users', targetUid, 'interactions');
  const q = query(interactionsRef);

  return onSnapshot(
    q, 
    (snapshot) => {
      const items: JournalInteraction[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data() as JournalInteraction;
        items.push({
          ...data,
          id: data.id || docSnap.id,
          userId: targetUid,
          turns: data.turns || [],
          tags: data.tags || [],
        });
      });

      // Sort in memory by updatedAt descending
      items.sort((a, b) => new Date(b.updatedAt || b.createdAt).getTime() - new Date(a.updatedAt || a.createdAt).getTime());
      writeLocalVault(targetUid, items);
      callback(items);
    },
    (err) => {
      // If the user has signed out or auth state is no longer active for this user,
      // suppression of normal teardown errors prevents console and UI noise
      if (!auth.currentUser || auth.currentUser.uid !== targetUid) {
        return;
      }
      console.error('Error in interactions subscription:', err);
      if (onError) onError(err);
    }
  );
}
