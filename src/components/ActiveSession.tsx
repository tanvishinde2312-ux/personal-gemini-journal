import React, { useState, useRef, useEffect } from 'react';
import Markdown from 'react-markdown';
import { 
  JournalInteraction, 
  JournalTurn, 
  ReflectionMode, 
  UserProfile 
} from '../types';
import { REFLECTION_MODES } from '../lib/modes';
import { 
  Send, 
  Sparkles, 
  Sparkle,
  Compass, 
  CheckSquare, 
  HeartHandshake, 
  Copy, 
  Check, 
  FileText, 
  Trash2, 
  Menu, 
  User, 
  AlertCircle, 
  RefreshCw,
  CheckCircle2,
  Lock,
  ArrowDown,
  Target
} from 'lucide-react';

interface ActiveSessionProps {
  interaction: JournalInteraction | null;
  user: UserProfile;
  onUpdateInteraction: (updated: JournalInteraction) => Promise<void>;
  onGenerateSummary: () => Promise<void>;
  onOpenSummaryModal: () => void;
  onTurnIntoPlan: () => Promise<void>;
  onOpenPlanModal: () => void;
  onDeleteSession: () => void;
  onToggleSidebarMobile: () => void;
  isSummarizing: boolean;
  isGeneratingPlan: boolean;
  syncStatus: 'synced' | 'saving' | 'error';
  errorMessage: string | null;
  onClearError: () => void;
}

export const ActiveSession: React.FC<ActiveSessionProps> = ({
  interaction,
  user,
  onUpdateInteraction,
  onGenerateSummary,
  onOpenSummaryModal,
  onTurnIntoPlan,
  onOpenPlanModal,
  onDeleteSession,
  onToggleSidebarMobile,
  isSummarizing,
  isGeneratingPlan,
  syncStatus,
  errorMessage,
  onClearError,
}) => {
  const [inputText, setInputText] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [copiedTurnId, setCopiedTurnId] = useState<string | null>(null);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleInput, setTitleInput] = useState(interaction?.title || '');

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const currentMode = interaction?.mode
    ? (REFLECTION_MODES[interaction.mode] || REFLECTION_MODES.reflection)
    : REFLECTION_MODES.reflection;

  // Sync title when interaction changes
  useEffect(() => {
    setTitleInput(interaction?.title || '');
  }, [interaction?.id, interaction?.title]);

  // Auto-scroll to bottom on turns change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [interaction?.turns?.length, isGenerating]);

  // Auto-resize textarea
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputText(e.target.value);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 180)}px`;
    }
  };

  const handleModeChange = async (mode: ReflectionMode) => {
    if (!interaction || mode === interaction.mode) return;
    const updated: JournalInteraction = {
      ...interaction,
      mode,
      updatedAt: new Date().toISOString(),
    };
    await onUpdateInteraction(updated);
  };

  const handleTitleSubmit = async () => {
    if (!interaction) return;
    setIsEditingTitle(false);
    const newTitle = titleInput.trim() || 'Untitled Reflection';
    if (newTitle !== interaction.title) {
      await onUpdateInteraction({
        ...interaction,
        title: newTitle,
        updatedAt: new Date().toISOString(),
      });
    }
  };

  const handleCopyTurn = async (turnId: string, text: string) => {
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
      }
      setCopiedTurnId(turnId);
      setTimeout(() => setCopiedTurnId(null), 2000);
    } catch {
      // Gracefully ignore clipboard rejection in iframe sandbox
    }
  };

  const handleSendPrompt = async (promptToSend?: string) => {
    if (!interaction) return;
    const text = (promptToSend || inputText).trim();
    if (!text || isGenerating) return;

    onClearError();
    setIsGenerating(true);

    const userTurn: JournalTurn = {
      id: `turn-user-${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: new Date().toISOString(),
    };

    const currentTurns = interaction.turns || [];
    // Auto-generate title if this is the very first turn and title is empty/default
    const isFirstTurn = currentTurns.length === 0;
    const updatedTitle = isFirstTurn && (!interaction.title || interaction.title === 'New Reflection')
      ? text.length > 40 ? text.slice(0, 37) + '...' : text
      : (interaction.title || 'New Reflection');

    const newTurns = [...currentTurns, userTurn];

    // Optimistically update turns state
    const optimisticInteraction: JournalInteraction = {
      ...interaction,
      title: updatedTitle,
      turns: newTurns,
      updatedAt: new Date().toISOString(),
    };

    // Reset input box
    setInputText('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }

    try {
      // 1. Guaranteed local transaction save to Firestore
      await onUpdateInteraction(optimisticInteraction);

      // 2. Call backend Express Gemini endpoint
      const response = await fetch('/api/gemini/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          turns: currentTurns, // prior turns
          userPrompt: text,
          mode: interaction.mode || 'reflection',
          title: updatedTitle,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Server responded with status ${response.status}`);
      }

      const data = await response.json();
      const modelReply = data.reply || 'Thank you for sharing your thoughts.';

      const modelTurn: JournalTurn = {
        id: `turn-model-${Date.now()}`,
        role: 'model',
        content: modelReply,
        timestamp: new Date().toISOString(),
      };

      const finalInteraction: JournalInteraction = {
        ...optimisticInteraction,
        turns: [...newTurns, modelTurn],
        updatedAt: new Date().toISOString(),
      };

      // 3. Save finalized multi-turn interaction to Firestore
      await onUpdateInteraction(finalInteraction);
    } catch (err: any) {
      console.error('Failed to get reflection response:', err);
      // Restore input so user doesn't lose their writing
      setInputText(text);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault();
      handleSendPrompt();
    }
  };

  const getModeIcon = (modeId: ReflectionMode) => {
    switch (modeId) {
      case 'reflection': return <Compass className="w-3.5 h-3.5" />;
      case 'brainstorm': return <Sparkles className="w-3.5 h-3.5" />;
      case 'action_plan': return <CheckSquare className="w-3.5 h-3.5" />;
      case 'mindful': return <HeartHandshake className="w-3.5 h-3.5" />;
    }
  };

  if (!interaction) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-[#8c827a] bg-[#f8f6f3]">
        <Sparkles className="w-10 h-10 text-[#a8a199] mb-3" />
        <h3 className="text-base font-medium text-[#3d3a36]">No Active Reflection</h3>
        <p className="text-xs text-[#666059] mt-1 mb-4">
          Select a past entry from your history or start a new reflection session.
        </p>
      </div>
    );
  }

  const safeTurns = interaction.turns || [];

  return (
    <div className="flex-1 flex flex-col h-[calc(100vh-65px)] bg-[#f8f6f3] overflow-hidden relative">
      {/* Top Session Control Header */}
      <div className="px-4 py-3 border-b border-[#e5e0d8] bg-[#f8f6f3]/80 backdrop-blur-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-2">
          {/* Mobile sidebar trigger button */}
          <button
            onClick={onToggleSidebarMobile}
            className="lg:hidden p-1.5 rounded-lg text-[#78716c] hover:text-[#3d3a36] hover:bg-[#ede7dd] transition-colors"
            title="Toggle History"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Editable Session Title */}
          <div className="flex items-center gap-2 min-w-0">
            {isEditingTitle ? (
              <input
                type="text"
                value={titleInput}
                onChange={(e) => setTitleInput(e.target.value)}
                onBlur={handleTitleSubmit}
                onKeyDown={(e) => e.key === 'Enter' && handleTitleSubmit()}
                autoFocus
                className="bg-white border border-[#dcd6cb] rounded px-2 py-0.5 text-sm font-semibold text-[#3d3a36] focus:outline-none focus:border-[#6b7c5c] font-serif w-full max-w-[280px] shadow-2xs"
              />
            ) : (
              <h2
                onClick={() => setIsEditingTitle(true)}
                className="text-sm sm:text-base font-semibold text-[#3d3a36] font-serif truncate cursor-pointer hover:text-[#6b7c5c] transition-colors flex items-center gap-1.5"
                title="Click to rename entry"
              >
                <span>{interaction.title || 'New Reflection'}</span>
                <span className="text-[10px] text-[#8c827a] font-sans hidden sm:inline">
                  (edit)
                </span>
              </h2>
            )}
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 overflow-x-auto pb-0.5 sm:pb-0">
          {/* Firestore Sync Indicator */}
          <div className="flex items-center gap-1.5 text-[11px] font-mono px-2 py-1 rounded-md bg-white border border-[#e5e0d8] text-[#57534e] shadow-2xs">
            {syncStatus === 'saving' ? (
              <>
                <RefreshCw className="w-3 h-3 text-[#6b7c5c] animate-spin" />
                <span className="hidden sm:inline">Saving to Firestore...</span>
              </>
            ) : syncStatus === 'error' ? (
              <>
                <AlertCircle className="w-3 h-3 text-[#9c6657]" />
                <span className="text-[#9c6657]">Sync Error</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-3 h-3 text-[#6b7c5c]" />
                <span className="text-[#4c5a40] hidden sm:inline">Firestore Saved</span>
              </>
            )}
          </div>

          {/* AI Summary / Insights Button */}
          {safeTurns.length > 0 && (
            <>
              {interaction.summary ? (
                <button
                  id="view-summary-btn"
                  onClick={onOpenSummaryModal}
                  className="px-2.5 py-1 rounded-lg bg-[#6b7c5c]/10 hover:bg-[#6b7c5c]/20 border border-[#6b7c5c]/30 text-[#4c5a40] text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>View Synthesis</span>
                </button>
              ) : (
                <button
                  id="generate-summary-btn"
                  onClick={onGenerateSummary}
                  disabled={isSummarizing || safeTurns.length === 0}
                  className="px-2.5 py-1 rounded-lg bg-white hover:bg-[#ede7dd] border border-[#dcd6cb] text-[#3d3a36] text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50 whitespace-nowrap shadow-2xs"
                  title="Synthesize conversation into summary and takeaways"
                >
                  {isSummarizing ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#6b7c5c]" />
                  ) : (
                    <Sparkles className="w-3.5 h-3.5 text-[#6b7c5c]" />
                  )}
                  <span>{isSummarizing ? 'Synthesizing...' : 'Generate AI Summary'}</span>
                </button>
              )}

              {/* Feature 1: Turn Reflection into a Plan Action */}
              {interaction.plan ? (
                <button
                  id="view-plan-btn"
                  onClick={onOpenPlanModal}
                  className="px-2.5 py-1 rounded-lg bg-[#8a6d4b]/15 hover:bg-[#8a6d4b]/25 border border-[#8a6d4b]/30 text-[#6a4f32] text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap shadow-2xs"
                  title="View or regenerate AI Life & Productivity Action Plan"
                >
                  <Target className="w-3.5 h-3.5 text-[#8a6d4b]" />
                  <span>View Action Plan</span>
                </button>
              ) : (
                <button
                  id="turn-reflection-into-plan-btn"
                  onClick={onTurnIntoPlan}
                  disabled={isGeneratingPlan || safeTurns.length === 0}
                  className="px-2.5 py-1 rounded-lg bg-[#8a6d4b]/10 hover:bg-[#8a6d4b]/20 border border-[#8a6d4b]/30 text-[#6a4f32] text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50 whitespace-nowrap shadow-2xs"
                  title="Turn reflection into an AI Insight, Goal & Action Plan"
                >
                  {isGeneratingPlan ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#8a6d4b]" />
                  ) : (
                    <Target className="w-3.5 h-3.5 text-[#8a6d4b]" />
                  )}
                  <span>{isGeneratingPlan ? 'Creating Plan...' : 'Turn Reflection into a Plan'}</span>
                </button>
              )}
            </>
          )}

          {/* Delete Button */}
          <button
            onClick={onDeleteSession}
            className="p-1.5 rounded-lg border border-[#e5e0d8] bg-white text-[#8c827a] hover:text-[#9c6657] hover:bg-[#9c6657]/10 transition-colors shadow-2xs"
            title="Delete Reflection"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Mode Selector Strip */}
      <div className="px-4 py-2 border-b border-[#e5e0d8] bg-[#f2eee9]/60 flex items-center gap-2 overflow-x-auto no-scrollbar shrink-0 text-xs">
        <span className="text-[11px] font-mono uppercase text-[#8c827a] hidden md:inline">
          Reflective Lens:
        </span>
        {(Object.keys(REFLECTION_MODES) as ReflectionMode[]).map((modeKey) => {
          const cfg = REFLECTION_MODES[modeKey];
          const isCurrent = interaction.mode === modeKey;
          return (
            <button
              key={modeKey}
              onClick={() => handleModeChange(modeKey)}
              className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 font-medium transition-all whitespace-nowrap cursor-pointer ${
                isCurrent
                  ? 'bg-white text-[#3d3a36] border border-[#dcd6cb] shadow-xs'
                  : 'text-[#666059] hover:text-[#3d3a36] hover:bg-white/60'
              }`}
            >
              <span className={isCurrent ? cfg.accentColor : 'text-[#8c827a]'}>
                {getModeIcon(modeKey)}
              </span>
              <span>{cfg.label}</span>
            </button>
          );
        })}
      </div>

      {/* Error Banner */}
      {errorMessage && (
        <div className="mx-4 mt-3 p-3 rounded-xl bg-[#9c6657]/10 border border-[#9c6657]/30 text-[#7a4c40] text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-[#9c6657] shrink-0" />
            <span>{errorMessage}</span>
          </div>
          <button
            onClick={onClearError}
            className="text-[#9c6657] hover:text-[#7a4c40] font-bold px-1.5"
          >
            &times;
          </button>
        </div>
      )}

      {/* Conversation / Journal Stream */}
      <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-6 space-y-6">
        {safeTurns.length === 0 ? (
          /* Empty State / Welcome to mode */
          <div className="max-w-2xl mx-auto my-8 flex flex-col items-center text-center">
            <div className={`w-12 h-12 rounded-2xl ${currentMode.badgeBg} flex items-center justify-center mb-4`}>
              <Sparkles className="w-6 h-6" />
            </div>

            <h3 className="text-xl sm:text-2xl font-semibold text-[#3d3a36] font-serif">
              {currentMode.label}
            </h3>
            <p className="mt-2 text-sm text-[#666059] max-w-lg leading-relaxed">
              {currentMode.description}
            </p>

            {/* Quick Inspiration Prompts */}
            <div className="mt-8 w-full text-left">
              <p className="text-xs font-mono uppercase tracking-wider text-[#8c827a] mb-3 text-center">
                Select an inspiration prompt or write freely below
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {currentMode.examplePrompts.map((prompt, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSendPrompt(prompt)}
                    className="p-3.5 rounded-xl bg-white border border-[#e5e0d8] hover:border-[#6b7c5c]/40 hover:bg-[#faf8f5] text-left text-xs text-[#4d4842] transition-all leading-relaxed group cursor-pointer shadow-2xs"
                  >
                    <span className="line-clamp-2 group-hover:text-[#6b7c5c]">
                      "{prompt}"
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          /* Multi-Turn Dialogue Items */
          <div className="max-w-3xl mx-auto space-y-6">
            {safeTurns.map((turn, index) => {
              const isUser = turn.role === 'user';
              const isCopied = copiedTurnId === turn.id;

              return (
                <div
                  key={turn.id || index}
                  id={`turn-message-${turn.id || index}`}
                  className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}
                >
                  {/* Speaker Header */}
                  <div className="flex items-center gap-2 mb-1.5 px-1 text-[11px] font-mono text-[#8c827a]">
                    {isUser ? (
                      <>
                        <span className="text-[#57534e] font-medium">{user.displayName || 'You'}</span>
                        <span>&bull;</span>
                        <span>{new Date(turn.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </>
                    ) : (
                      <>
                        <span className="text-[#6b7c5c] font-medium flex items-center gap-1">
                          <Sparkle className="w-3 h-3" /> Gemini 3.6 Flash
                        </span>
                        <span>&bull;</span>
                        <span>{new Date(turn.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </>
                    )}
                  </div>

                  {/* Message Bubble */}
                  <div
                    className={`relative group max-w-[92%] sm:max-w-[85%] rounded-2xl px-4 py-3.5 text-sm transition-all shadow-xs ${
                      isUser
                        ? 'bg-[#6b7c5c] text-white border border-[#5a6a4d] rounded-tr-xs'
                        : 'bg-white text-[#3d3a36] border border-[#e5e0d8] rounded-tl-xs prose-reflection'
                    }`}
                  >
                    {isUser ? (
                      <p className="whitespace-pre-wrap leading-relaxed">{turn.content}</p>
                    ) : (
                      <div>
                        <Markdown>{turn.content}</Markdown>
                      </div>
                    )}

                    {/* Copy action on hover */}
                    <button
                      onClick={() => handleCopyTurn(turn.id, turn.content)}
                      className={`absolute right-2 bottom-2 opacity-0 group-hover:opacity-100 p-1 rounded transition-opacity text-xs ${
                        isUser
                          ? 'bg-[#5a6a4d] text-white hover:bg-[#4c5a40]'
                          : 'bg-[#f3efe9] hover:bg-[#e5e0d8] text-[#57534e]'
                      }`}
                      title="Copy to clipboard"
                    >
                      {isCopied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    </button>
                  </div>
                </div>
              );
            })}

            {/* Reflection Generating Animation */}
            {isGenerating && (
              <div className="flex flex-col items-start max-w-3xl">
                <div className="flex items-center gap-2 mb-1.5 px-1 text-[11px] font-mono text-[#6b7c5c]">
                  <Sparkle className="w-3 h-3 animate-spin" />
                  <span>Gemini 3.6 Flash is reflecting...</span>
                </div>
                <div className="rounded-2xl rounded-tl-xs px-5 py-4 bg-white border border-[#e5e0d8] flex items-center gap-2 shadow-2xs">
                  <div className="w-2 h-2 rounded-full bg-[#6b7c5c] animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-2 h-2 rounded-full bg-[#6b7c5c] animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-2 h-2 rounded-full bg-[#6b7c5c] animate-bounce" style={{ animationDelay: '300ms' }} />
                  <span className="text-xs text-[#78716c] ml-2 font-mono">Synthesizing perspectives...</span>
                </div>
              </div>
            )}

            {/* Action Plan Quick Banner */}
            {safeTurns.length > 0 && !isGenerating && (
              <div className="mt-4 p-3.5 rounded-xl bg-gradient-to-r from-[#f7f4ee] to-[#f2ede4] border border-[#e5ded4] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-2xs">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-[#8a6d4b]/15 text-[#6a4f32] border border-[#8a6d4b]/30 flex items-center justify-center shrink-0">
                    <Target className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-[#3d3a36]">
                      {interaction.plan ? 'Personal Productivity Plan' : 'Turn Reflection into a Plan'}
                    </p>
                    <p className="text-[11px] text-[#78716c] line-clamp-1">
                      {interaction.plan
                        ? `Goal: ${interaction.plan.suggestedGoal}`
                        : 'Transform this reflection into an insight, measurable goal, and actionable steps.'}
                    </p>
                  </div>
                </div>
                <button
                  id="banner-turn-into-plan-btn"
                  onClick={interaction.plan ? onOpenPlanModal : onTurnIntoPlan}
                  disabled={isGeneratingPlan}
                  className="px-3 py-1.5 rounded-lg bg-[#8a6d4b] hover:bg-[#73593b] text-white text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer shrink-0 shadow-2xs disabled:opacity-50"
                >
                  {isGeneratingPlan ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Target className="w-3.5 h-3.5" />
                  )}
                  <span>{isGeneratingPlan ? 'Generating Plan...' : interaction.plan ? 'View Action Plan' : 'Turn Reflection into a Plan'}</span>
                </button>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Persistent Journal Input Bar */}
      <div className="p-4 border-t border-[#e5e0d8] bg-[#f8f6f3]/90 backdrop-blur-md shrink-0">
        <div className="max-w-3xl mx-auto">
          <div className="relative rounded-2xl bg-white border border-[#dcd6cb] focus-within:border-[#6b7c5c] transition-all shadow-xs p-2">
            <textarea
              ref={textareaRef}
              id="journal-input"
              value={inputText}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder={`Write your reflection, thoughts, or prompt (${currentMode.label})...`}
              rows={2}
              className="w-full bg-transparent text-sm text-[#3d3a36] placeholder-[#8c827a] resize-none focus:outline-none px-2 pt-1 pb-8 leading-relaxed max-h-[180px]"
            />

            {/* Bottom Input Tooling */}
            <div className="absolute bottom-2.5 left-3 right-3 flex items-center justify-between text-xs text-[#8c827a]">
              <div className="flex items-center gap-2">
                <span className="font-mono text-[11px] text-[#57534e]">
                  {inputText.length} chars
                </span>
                <span className="hidden sm:inline text-[#dcd6cb]">&bull;</span>
                <span className="hidden sm:inline font-mono text-[11px] text-[#8c827a]">
                  Press <kbd className="px-1 py-0.5 rounded bg-[#ede7dd] text-[#3d3a36] text-[10px] border border-[#dcd6cb]">⌘</kbd> + <kbd className="px-1 py-0.5 rounded bg-[#ede7dd] text-[#3d3a36] text-[10px] border border-[#dcd6cb]">Enter</kbd> to reflect
                </span>
              </div>

              <button
                id="send-prompt-btn"
                onClick={() => handleSendPrompt()}
                disabled={!inputText.trim() || isGenerating}
                className="px-3.5 py-1.5 rounded-xl bg-[#6b7c5c] hover:bg-[#5a6a4d] active:bg-[#4c5a40] text-white font-semibold text-xs transition-all flex items-center gap-1.5 shadow-xs disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                <span>{isGenerating ? 'Thinking...' : 'Reflect'}</span>
                <Send className="w-3.5 h-3.5 stroke-[2.5]" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
