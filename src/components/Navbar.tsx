import React from 'react';
import { UserProfile } from '../types';
import { Sparkles, ShieldCheck, LogOut, Plus, BookOpen, User } from 'lucide-react';

interface NavbarProps {
  user: UserProfile | null;
  totalEntries: number;
  onNewEntry: () => void;
  onSignOut: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  user,
  totalEntries,
  onNewEntry,
  onSignOut,
}) => {
  return (
    <header className="border-b border-[#e5e0d8] bg-[#f8f6f3]/90 backdrop-blur-md sticky top-0 z-30 px-4 sm:px-6 py-3.5 flex items-center justify-between transition-colors">
      {/* Brand & Identity */}
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-[#6b7c5c]/10 border border-[#6b7c5c]/25 flex items-center justify-center text-[#6b7c5c] shadow-xs">
          <Sparkles className="w-4.5 h-4.5" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-base sm:text-lg font-semibold tracking-tight text-[#3d3a36] font-serif">
              ReflectAI
            </h1>
            <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#6b7c5c]/10 border border-[#6b7c5c]/20 text-[#4c5a40] font-medium">
              <ShieldCheck className="w-3 h-3 text-[#6b7c5c]" /> User Isolated
            </span>
          </div>
          <p className="text-xs text-[#78716c] hidden sm:block">
            Gemini 3.6 Flash &bull; Cloud Firestore
          </p>
        </div>
      </div>

      {/* Actions & User State */}
      <div className="flex items-center gap-2.5 sm:gap-4">
        {user && (
          <>
            <button
              id="new-reflection-btn"
              onClick={onNewEntry}
              className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-[#6b7c5c] hover:bg-[#5a6a4d] active:bg-[#4c5a40] text-white font-medium text-xs sm:text-sm transition-colors shadow-xs cursor-pointer"
              title="Start a new reflection session"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span className="hidden xs:inline font-semibold">New Entry</span>
            </button>

            <div className="h-6 w-px bg-[#e5e0d8] hidden sm:block" />

            {/* User profile capsule */}
            <div className="flex items-center gap-2.5 bg-[#f0eae1] border border-[#e5e0d8] rounded-full pl-2 pr-3 py-1 text-xs">
              {user.photoURL ? (
                <img
                  src={user.photoURL}
                  alt={user.displayName || 'User'}
                  className="w-6 h-6 rounded-full object-cover border border-[#6b7c5c]/30"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-6 h-6 rounded-full bg-[#6b7c5c]/15 border border-[#6b7c5c]/30 text-[#4c5a40] flex items-center justify-center text-[10px] font-bold">
                  {user.displayName ? user.displayName[0].toUpperCase() : <User className="w-3 h-3" />}
                </div>
              )}
              <span className="text-[#3d3a36] font-medium max-w-[120px] truncate hidden md:inline">
                {user.displayName || 'User'}
              </span>
              <span className="text-[#78716c] text-[11px] font-mono hidden lg:inline">
                ({totalEntries} {totalEntries === 1 ? 'entry' : 'entries'})
              </span>
            </div>

            {/* Logout button */}
            <button
              id="sign-out-btn"
              onClick={onSignOut}
              className="p-1.5 sm:px-2.5 sm:py-1.5 rounded-lg border border-[#e5e0d8] text-[#78716c] hover:text-[#3d3a36] hover:bg-[#eae4dc] transition-colors flex items-center gap-1.5 text-xs cursor-pointer"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Sign Out</span>
            </button>
          </>
        )}
      </div>
    </header>
  );
};
