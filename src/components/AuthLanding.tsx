import React, { useState } from 'react';
import { 
  Sparkles, 
  ShieldCheck, 
  Lock, 
  BookOpen, 
  BrainCircuit, 
  Compass, 
  CheckCircle2, 
  ArrowRight,
  UserCheck,
  AlertCircle
} from 'lucide-react';

interface AuthLandingProps {
  onSignInWithGoogle: () => Promise<void>;
  onSignInAsGuest: () => Promise<void>;
  isLoading: boolean;
  authError: string | null;
}

export const AuthLanding: React.FC<AuthLandingProps> = ({
  onSignInWithGoogle,
  onSignInAsGuest,
  isLoading,
  authError,
}) => {
  const [guestLoading, setGuestLoading] = useState(false);

  const handleGuest = async () => {
    setGuestLoading(true);
    try {
      await onSignInAsGuest();
    } finally {
      setGuestLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-65px)] flex flex-col justify-center items-center px-4 py-12 sm:px-6 lg:px-8 relative overflow-hidden bg-gradient-to-b from-[#f8f6f3] via-[#f4efe8] to-[#eae3d9]">
      {/* Subtle ambient lighting */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[350px] bg-[#6b7c5c]/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-1/4 w-[300px] h-[250px] bg-[#8a6d4b]/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-4xl mx-auto flex flex-col items-center text-center relative z-10">
        {/* Security / Privacy badge */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#ede6dc] border border-[#dcd4c7] text-[#4c5a40] text-xs font-medium mb-6 shadow-xs">
          <ShieldCheck className="w-4 h-4 text-[#6b7c5c]" />
          <span>Strict User-Isolated Cloud Firestore Storage</span>
        </div>

        {/* Hero Headline */}
        <h1 className="text-3xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-[#3d3a36] font-serif leading-[1.15] max-w-2xl">
          Converse with Gemini. <br />
          <span className="text-[#6b7c5c] italic">
            Reflect with Clarity.
          </span>
        </h1>

        <p className="mt-5 text-base sm:text-lg text-[#666059] max-w-xl leading-relaxed">
          A secure, multi-turn AI journal that guides your self-reflection, brainstorms creative breakthroughs, and structures actionable insights—stored safely in your isolated Firestore vault.
        </p>

        {/* Error Alert if any */}
        {authError && (
          <div className="mt-6 w-full max-w-md p-3.5 rounded-xl bg-[#9c6657]/10 border border-[#9c6657]/30 text-[#7a4c40] text-sm flex items-start gap-2.5 text-left">
            <AlertCircle className="w-5 h-5 text-[#9c6657] shrink-0 mt-0.5" />
            <div>
              <p className="font-medium">Authentication Notice</p>
              <p className="text-xs text-[#7a4c40]/90 mt-0.5">{authError}</p>
            </div>
          </div>
        )}

        {/* Auth CTA Card */}
        <div className="mt-8 w-full max-w-md p-6 sm:p-8 rounded-2xl bg-white/90 border border-[#e5e0d8] shadow-sm backdrop-blur-xl flex flex-col gap-4">
          <button
            id="google-signin-btn"
            onClick={onSignInWithGoogle}
            disabled={isLoading || guestLoading}
            className="w-full flex items-center justify-center gap-3 px-5 py-3.5 rounded-xl bg-[#3d3a36] hover:bg-[#2c2a27] active:bg-[#1f1d1b] text-white font-semibold text-sm transition-all shadow-xs hover:shadow-sm disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            {/* Google Vector Icon */}
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
              />
              <path
                fill="#34A853"
                d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.34 24 12 24z"
              />
              <path
                fill="#FBBC05"
                d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.98 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
              />
              <path
                fill="#EA4335"
                d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.34 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
              />
            </svg>
            <span>{isLoading ? 'Connecting to Google...' : 'Sign in with Google'}</span>
          </button>

          <div className="relative my-1">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[#e5e0d8]" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-2.5 py-0.5 rounded-full text-[#8c827a] font-mono text-[10px]">
                or try privately
              </span>
            </div>
          </div>

          <button
            id="guest-signin-btn"
            onClick={handleGuest}
            disabled={isLoading || guestLoading}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-[#dcd6cb] bg-[#f8f6f3] hover:bg-[#ede7dd] text-[#4d4842] font-medium text-xs sm:text-sm transition-colors disabled:opacity-50 cursor-pointer"
          >
            <UserCheck className="w-4 h-4 text-[#6b7c5c]" />
            <span>{guestLoading ? 'Starting Session...' : 'Continue as Guest (Anonymous)'}</span>
          </button>
        </div>

        {/* 3 Core Architecture Pillars */}
        <div className="mt-14 grid grid-cols-1 sm:grid-cols-3 gap-5 w-full text-left">
          <div className="p-5 rounded-xl bg-white/80 border border-[#e5e0d8] hover:border-[#6b7c5c]/40 transition-colors shadow-2xs">
            <div className="w-8 h-8 rounded-lg bg-[#6b7c5c]/10 border border-[#6b7c5c]/25 text-[#6b7c5c] flex items-center justify-center mb-3">
              <BrainCircuit className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-semibold text-[#3d3a36]">Gemini 3.6 Flash Engine</h3>
            <p className="mt-1.5 text-xs text-[#78716c] leading-relaxed">
              Multi-turn conversational reflections with auto-fallback ladder across resilient model tiers.
            </p>
          </div>

          <div className="p-5 rounded-xl bg-white/80 border border-[#e5e0d8] hover:border-[#6b7c5c]/40 transition-colors shadow-2xs">
            <div className="w-8 h-8 rounded-lg bg-[#8a6d4b]/10 border border-[#8a6d4b]/25 text-[#8a6d4b] flex items-center justify-center mb-3">
              <Lock className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-semibold text-[#3d3a36]">Isolated Firestore Vault</h3>
            <p className="mt-1.5 text-xs text-[#78716c] leading-relaxed">
              Strict owner-bound security rules ensure only your authenticated account can access your entries.
            </p>
          </div>

          <div className="p-5 rounded-xl bg-white/80 border border-[#e5e0d8] hover:border-[#6b7c5c]/40 transition-colors shadow-2xs">
            <div className="w-8 h-8 rounded-lg bg-[#4d6b75]/10 border border-[#4d6b75]/25 text-[#4d6b75] flex items-center justify-center mb-3">
              <Sparkles className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-semibold text-[#3d3a36]">Instant AI Synthesis</h3>
            <p className="mt-1.5 text-xs text-[#78716c] leading-relaxed">
              Extract key breakthroughs, executive summaries, and action checklists with a single click.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
