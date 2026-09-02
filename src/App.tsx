import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { 
  auth, 
  signInWithGoogle, 
  signInAsGuest, 
  logOut, 
  mapFirebaseUser, 
  saveJournalInteraction, 
  deleteJournalInteraction, 
  subscribeToUserInteractions,
  getUserInteractions,
  syncUserProfile
} from './lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { JournalInteraction, ReflectionMode, UserProfile } from './types';
import { Navbar } from './components/Navbar';
import { AuthLanding } from './components/AuthLanding';
import { SidebarHistory } from './components/SidebarHistory';
import { ActiveSession } from './components/ActiveSession';
import { SummaryModal } from './components/SummaryModal';
import { PlanModal } from './components/PlanModal';
import { DeleteConfirmModal } from './components/DeleteConfirmModal';
import { Sparkles, RefreshCw, AlertCircle } from 'lucide-react';

export default function App() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);

  // Firestore Interactions State
  const [interactions, setInteractions] = useState<JournalInteraction[]>([]);
  const [activeInteractionId, setActiveInteractionId] = useState<string | null>(null);
  const [draftInteraction, setDraftInteraction] = useState<JournalInteraction | null>(null);
  const [syncStatus, setSyncStatus] = useState<'synced' | 'saving' | 'error'>('synced');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Modals & Mobile Drawer
  const [isSummaryModalOpen, setIsSummaryModalOpen] = useState(false);
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [isPlanModalOpen, setIsPlanModalOpen] = useState(false);
  const [isGeneratingPlan, setIsGeneratingPlan] = useState(false);
  const [planError, setPlanError] = useState<string | null>(null);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSidebarMobileOpen, setIsSidebarMobileOpen] = useState(false);

  // 1. Listen for Auth State Changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (fbUser) => {
      const profile = mapFirebaseUser(fbUser);
      setUser(profile);
      if (profile) {
        syncUserProfile(profile);
      }
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Helper: Create a fresh new blank interaction
  const createNewInteraction = useCallback((preferredMode: ReflectionMode = 'reflection'): JournalInteraction => {
    return {
      id: `interaction-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      userId: user?.uid || '',
      title: 'New Reflection',
      mode: preferredMode,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      turns: [],
      tags: [],
    };
  }, [user?.uid]);

  // Reference to current Firestore real-time unsubscribe callback
  const firestoreUnsubRef = useRef<(() => void) | null>(null);

  // 2. Fetch and Subscribe to Firestore when User is Authenticated
  useEffect(() => {
    const uid = user?.uid;
    if (!uid) {
      if (firestoreUnsubRef.current) {
        firestoreUnsubRef.current();
        firestoreUnsubRef.current = null;
      }
      setInteractions([]);
      setActiveInteractionId(null);
      setDraftInteraction(null);
      return;
    }

    // Direct fetch on load
    getUserInteractions(uid)
      .then((items) => {
        if (items.length > 0) {
          setInteractions(items);
          setActiveInteractionId((prev) => prev || items[0].id);
        }
      })
      .catch((err) => {
        console.warn('Initial interactions fetch:', err);
      });

    // Real-time Firestore onSnapshot subscription
    const unsubscribe = subscribeToUserInteractions(
      uid,
      (fetched) => {
        setInteractions(fetched);
        if (fetched.length > 0) {
          setActiveInteractionId((prev) => {
            if (prev && fetched.some((item) => item.id === prev)) {
              return prev;
            }
            if (prev && draftInteraction && draftInteraction.id === prev) {
              return prev;
            }
            return fetched[0].id;
          });
        }
      },
      (err) => {
        // Only trigger error state if the user is still actively signed in
        if (auth.currentUser && auth.currentUser.uid === uid) {
          console.error('Firestore subscription error:', err);
          setSyncStatus('error');
          setErrorMessage('Failed to connect to your Firestore database. Verify connection.');
        }
      }
    );

    firestoreUnsubRef.current = unsubscribe;

    return () => {
      if (firestoreUnsubRef.current) {
        firestoreUnsubRef.current();
        firestoreUnsubRef.current = null;
      }
    };
  }, [user?.uid]);

  // Auth Handlers
  const handleGoogleSignIn = async () => {
    setAuthError(null);
    try {
      await signInWithGoogle();
    } catch (err: any) {
      console.error('Sign-in failure:', err);
      setAuthError(err?.message || 'Google sign-in could not be completed.');
    }
  };

  const handleGuestSignIn = async () => {
    setAuthError(null);
    try {
      await signInAsGuest();
    } catch (err: any) {
      console.error('Guest sign-in failure:', err);
      setAuthError(err?.message || 'Guest sign-in could not be completed.');
    }
  };

  const handleSignOut = async () => {
    try {
      // 1. Immediately unsubscribe from Firestore BEFORE auth state changes
      if (firestoreUnsubRef.current) {
        firestoreUnsubRef.current();
        firestoreUnsubRef.current = null;
      }
      // 2. Clear application state cleanly
      setUser(null);
      setInteractions([]);
      setActiveInteractionId(null);
      setDraftInteraction(null);
      setErrorMessage(null);
      setSyncStatus('synced');

      // 3. Complete Firebase Auth sign out
      await logOut();
    } catch (err: any) {
      console.error('Sign out error:', err);
    }
  };

  // Resolve Active Interaction stably
  const activeInteraction = useMemo(() => {
    if (activeInteractionId) {
      const found = interactions.find((i) => i.id === activeInteractionId);
      if (found) return found;
      if (draftInteraction && draftInteraction.id === activeInteractionId) {
        return draftInteraction;
      }
    }
    if (draftInteraction) return draftInteraction;
    if (interactions.length > 0) return interactions[0];
    return user ? createNewInteraction() : null;
  }, [activeInteractionId, interactions, draftInteraction, user, createNewInteraction]);

  // Guaranteed Firestore Save with Immediate In-Memory Synchronization
  const handleSaveInteraction = async (updated: JournalInteraction) => {
    if (!user) return;
    setSyncStatus('saving');
    setErrorMessage(null);

    // 1. Optimistically update local interactions state so Journal History updates instantly
    setInteractions((prev) => {
      const exists = prev.some((i) => i.id === updated.id);
      if (exists) {
        return prev.map((i) => (i.id === updated.id ? updated : i));
      }
      return [updated, ...prev];
    });

    // Clear draft reference once it has become part of history
    if (draftInteraction?.id === updated.id) {
      setDraftInteraction(null);
    }
    setActiveInteractionId(updated.id);

    // 2. Persist to Cloud Firestore under authenticated user's isolated subcollection
    try {
      await saveJournalInteraction(user.uid, updated);
      setSyncStatus('synced');
    } catch (err: any) {
      console.error('Firestore save failed:', err);
      setSyncStatus('error');
      setErrorMessage(`Failed to save to Firestore: ${err?.message || 'Permission denied'}`);
      throw err;
    }
  };

  const handleNewEntry = (preferredMode: ReflectionMode = 'reflection') => {
    if (!user) return;
    const fresh = createNewInteraction(preferredMode);
    setDraftInteraction(fresh);
    setActiveInteractionId(fresh.id);
    setIsSidebarMobileOpen(false);
  };

  const handleSelectInteraction = (item: JournalInteraction) => {
    setActiveInteractionId(item.id);
    setDraftInteraction(null);
  };

  // Summarize Interaction
  const handleGenerateSummary = async () => {
    if (!user || !activeInteraction || activeInteraction.turns.length === 0) return;

    setIsSummarizing(true);
    setErrorMessage(null);

    try {
      const response = await fetch('/api/gemini/summarize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          turns: activeInteraction.turns,
          mode: activeInteraction.mode,
          currentTitle: activeInteraction.title,
        }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || `Summary request failed (${response.status})`);
      }

      const summaryData = await response.json();
      const updated: JournalInteraction = {
        ...activeInteraction,
        title: summaryData.title || activeInteraction.title,
        summary: summaryData.summary,
        keyInsights: summaryData.keyInsights || [],
        tags: summaryData.tags || [],
        updatedAt: new Date().toISOString(),
      };

      await handleSaveInteraction(updated);
      setIsSummaryModalOpen(true);
    } catch (err: any) {
      console.error('Summary generation error:', err);
      setErrorMessage(err?.message || 'Failed to generate AI summary.');
    } finally {
      setIsSummarizing(false);
    }
  };

  // Feature 1: Turn Reflection into an AI Insight, Goal & Action Plan
  const handleGeneratePlan = async () => {
    if (!user || !activeInteraction || activeInteraction.turns.length === 0) return;

    setIsGeneratingPlan(true);
    setPlanError(null);
    setIsPlanModalOpen(true);

    try {
      // Extract full reflection text from all user turns
      const userReflectionText = activeInteraction.turns
        .filter((t) => t.role === 'user')
        .map((t) => t.content)
        .join('\n\n');

      const fullDialogue = activeInteraction.turns
        .map((t) => `[${t.role === 'model' ? 'ReflectAI' : 'User'}]: ${t.content}`)
        .join('\n\n');

      const response = await fetch('/api/gemini/plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          turns: activeInteraction.turns,
          reflectionContent: userReflectionText || fullDialogue,
          fullReflectionText: userReflectionText || fullDialogue,
          dialogueTranscript: fullDialogue,
          mode: activeInteraction.mode,
          displayTitle: activeInteraction.title,
          currentTitle: activeInteraction.title,
          summary: activeInteraction.summary,
        }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || `Action Plan request failed (${response.status})`);
      }

      const planData = await response.json();
      const updated: JournalInteraction = {
        ...activeInteraction,
        plan: planData.plan,
        updatedAt: new Date().toISOString(),
      };

      await handleSaveInteraction(updated);
    } catch (err: any) {
      console.error('Plan generation error:', err);
      setPlanError(err?.message || 'Failed to generate Action Plan.');
    } finally {
      setIsGeneratingPlan(false);
    }
  };

  // Delete Handlers
  const handleDeleteRequest = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setDeleteTargetId(id);
  };

  const handleConfirmDelete = async () => {
    if (!user || !deleteTargetId) return;
    setIsDeleting(true);
    const idToDelete = deleteTargetId;
    try {
      // Immediate local state update
      setInteractions((prev) => prev.filter((i) => i.id !== idToDelete));
      if (activeInteractionId === idToDelete) {
        const remaining = interactions.filter((i) => i.id !== idToDelete);
        if (remaining.length > 0) {
          setActiveInteractionId(remaining[0].id);
        } else {
          const fresh = createNewInteraction();
          setDraftInteraction(fresh);
          setActiveInteractionId(fresh.id);
        }
      }

      // Persist deletion to Firestore
      await deleteJournalInteraction(user.uid, idToDelete);
      setDeleteTargetId(null);
    } catch (err: any) {
      console.error('Delete interaction failed:', err);
      setErrorMessage(`Failed to delete entry: ${err?.message || err}`);
    } finally {
      setIsDeleting(false);
    }
  };

  // Loading Screen while Firebase Auth initializes
  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#f8f6f3] flex flex-col items-center justify-center text-[#666059] gap-3">
        <RefreshCw className="w-6 h-6 animate-spin text-[#6b7c5c]" />
        <p className="text-xs font-mono text-[#57534e]">Initializing Secure Environment...</p>
      </div>
    );
  }

  // If Not Authenticated, show Landing Page with Sign In
  if (!user) {
    return (
      <div className="min-h-screen bg-[#f8f6f3] flex flex-col text-[#3d3a36]">
        <Navbar
          user={null}
          totalEntries={0}
          onNewEntry={() => {}}
          onSignOut={() => {}}
        />
        <AuthLanding
          onSignInWithGoogle={handleGoogleSignIn}
          onSignInAsGuest={handleGuestSignIn}
          isLoading={authLoading}
          authError={authError}
        />
      </div>
    );
  }

  const targetDeleteInteraction = interactions.find((i) => i.id === deleteTargetId);

  return (
    <div className="min-h-screen bg-[#f8f6f3] flex flex-col text-[#3d3a36]">
      {/* Top Navbar */}
      <Navbar
        user={user}
        totalEntries={interactions.length}
        onNewEntry={() => handleNewEntry()}
        onSignOut={handleSignOut}
      />

      {/* Main Workspace: Sidebar History + Active Reflection Session */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left History Sidebar */}
        <SidebarHistory
          interactions={interactions}
          activeId={activeInteractionId}
          onSelect={handleSelectInteraction}
          onNew={() => handleNewEntry()}
          onDelete={(id, e) => handleDeleteRequest(id, e)}
          isOpenMobile={isSidebarMobileOpen}
          onCloseMobile={() => setIsSidebarMobileOpen(false)}
        />

        {/* Active Reflection Area */}
        {activeInteraction ? (
          <ActiveSession
            interaction={activeInteraction}
            user={user}
            onUpdateInteraction={handleSaveInteraction}
            onGenerateSummary={handleGenerateSummary}
            onOpenSummaryModal={() => setIsSummaryModalOpen(true)}
            onTurnIntoPlan={handleGeneratePlan}
            onOpenPlanModal={() => setIsPlanModalOpen(true)}
            onDeleteSession={() => activeInteraction && handleDeleteRequest(activeInteraction.id)}
            onToggleSidebarMobile={() => setIsSidebarMobileOpen((prev) => !prev)}
            isSummarizing={isSummarizing}
            isGeneratingPlan={isGeneratingPlan}
            syncStatus={syncStatus}
            errorMessage={errorMessage}
            onClearError={() => setErrorMessage(null)}
          />
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-[#8c827a] bg-[#f8f6f3]">
            <Sparkles className="w-10 h-10 text-[#a8a199] mb-3" />
            <h3 className="text-base font-medium text-[#3d3a36]">No Active Reflection</h3>
            <p className="text-xs text-[#666059] mt-1 mb-4">
              Select a past entry from your history or start a new reflection session.
            </p>
            <button
              onClick={() => handleNewEntry()}
              className="px-4 py-2 rounded-xl bg-[#6b7c5c] text-white font-medium text-xs shadow-xs hover:bg-[#5a6a4d] transition-colors cursor-pointer"
            >
              Start New Entry
            </button>
          </div>
        )}
      </div>

      {/* Summary & Insights Modal */}
      <SummaryModal
        interaction={activeInteraction}
        isOpen={isSummaryModalOpen}
        onClose={() => setIsSummaryModalOpen(false)}
        onTurnIntoPlan={handleGeneratePlan}
      />

      {/* Feature 1: AI Insight, Goal & Action Plan Modal */}
      <PlanModal
        isOpen={isPlanModalOpen}
        onClose={() => setIsPlanModalOpen(false)}
        interaction={activeInteraction}
        isLoading={isGeneratingPlan}
        error={planError}
        onRegenerate={handleGeneratePlan}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={Boolean(deleteTargetId)}
        onClose={() => setDeleteTargetId(null)}
        onConfirm={handleConfirmDelete}
        title={targetDeleteInteraction?.title || 'this entry'}
        isDeleting={isDeleting}
      />
    </div>
  );
}
