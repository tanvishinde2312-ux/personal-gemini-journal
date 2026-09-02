import React, { useState } from 'react';
import { JournalInteraction } from '../types';
import { 
  Target, 
  Sparkles, 
  ArrowRight, 
  Copy, 
  Check, 
  RefreshCw, 
  X, 
  ListTodo, 
  CalendarClock, 
  Lightbulb,
  AlertCircle
} from 'lucide-react';

interface PlanModalProps {
  isOpen: boolean;
  onClose: () => void;
  interaction: JournalInteraction | null;
  isLoading: boolean;
  error: string | null;
  onRegenerate: () => Promise<void>;
}

export const PlanModal: React.FC<PlanModalProps> = ({
  isOpen,
  onClose,
  interaction,
  isLoading,
  error,
  onRegenerate,
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const plan = interaction?.plan;
  const steps = plan ? (plan.actionSteps || plan.actionPlan || []) : [];

  const handleCopyMarkdown = async () => {
    if (!plan || !interaction) return;

    const md = `# Action Plan: ${interaction.title || 'Reflection'}
*Generated with ReflectAI on ${new Date(plan.generatedAt).toLocaleDateString()}*

## 💭 Key Insight
${plan.keyInsight}

## 🎯 Suggested Goal
${plan.suggestedGoal}

## 📋 Suggested Action Plan
${steps.map((step, i) => `${i + 1}. ${step}`).join('\n')}

## 📅 Suggested Next Step
${plan.nextStep}
`;

    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(md);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Gracefully handle iframe clipboard restrictions
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-[#3d3a36]/50 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div 
        className="w-full max-w-2xl bg-[#faf8f5] border border-[#e5e0d8] rounded-2xl shadow-xl overflow-hidden flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-[#e5e0d8] flex items-center justify-between bg-[#f5f1eb]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#8a6d4b]/15 border border-[#8a6d4b]/30 text-[#6a4f32] flex items-center justify-center shadow-2xs">
              <Target className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-semibold text-[#3d3a36] font-serif">
                  Life & Productivity Action Plan
                </h2>
                <span className="text-[10px] font-mono uppercase bg-[#8a6d4b]/10 text-[#6a4f32] px-1.5 py-0.5 rounded border border-[#8a6d4b]/20">
                  AI Plan
                </span>
              </div>
              <p className="text-xs text-[#78716c] line-clamp-1 mt-0.5">
                {interaction?.title || 'Reflection'} &bull; Distilled into realistic goals & immediate next steps
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#78716c] hover:text-[#3d3a36] hover:bg-[#ede7dd] transition-colors cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5 flex-1 bg-[#faf8f5]">
          {/* Loading State */}
          {isLoading && (
            <div className="py-12 flex flex-col items-center justify-center text-center space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-[#8a6d4b]/10 border border-[#8a6d4b]/25 flex items-center justify-center text-[#6a4f32] animate-pulse">
                <RefreshCw className="w-6 h-6 animate-spin" />
              </div>
              <div>
                <h3 className="text-sm sm:text-base font-medium text-[#3d3a36]">
                  Analyzing Your Reflection...
                </h3>
                <p className="text-xs text-[#78716c] mt-1 max-w-sm">
                  Gemini is evaluating your insights to construct a realistic goal, practical action steps, and an immediate next step.
                </p>
              </div>
            </div>
          )}

          {/* Error State */}
          {!isLoading && error && (
            <div className="p-4 rounded-xl bg-[#9c6657]/10 border border-[#9c6657]/20 text-[#7a4c40] flex items-start gap-3">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-[#9c6657]" />
              <div className="flex-1">
                <h4 className="text-xs font-semibold">Unable to Generate Plan</h4>
                <p className="text-xs mt-0.5 text-[#7a4c40]/90">{error}</p>
                <button
                  onClick={onRegenerate}
                  className="mt-3 px-3 py-1.5 rounded-lg bg-[#9c6657] text-white text-xs font-medium hover:bg-[#855447] transition-colors cursor-pointer inline-flex items-center gap-1.5"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Try Again</span>
                </button>
              </div>
            </div>
          )}

          {/* Plan Content */}
          {!isLoading && !error && plan && (
            <div className="space-y-5">
              {/* Section 1: Key Insight */}
              <div className="p-4 sm:p-4.5 rounded-xl bg-white border border-[#e5e0d8] shadow-2xs space-y-2">
                <div className="flex items-center gap-2 text-xs font-semibold text-[#8a6d4b] uppercase tracking-wider">
                  <Lightbulb className="w-4 h-4" />
                  <span>Key Insight</span>
                </div>
                <p className="text-sm text-[#3d3a36] leading-relaxed">
                  {plan.keyInsight}
                </p>
              </div>

              {/* Section 2: Suggested Goal */}
              <div className="p-4 sm:p-4.5 rounded-xl bg-gradient-to-br from-[#f5f1eb] to-white border border-[#8a6d4b]/30 shadow-2xs space-y-2">
                <div className="flex items-center gap-2 text-xs font-semibold text-[#6a4f32] uppercase tracking-wider">
                  <Target className="w-4 h-4 text-[#8a6d4b]" />
                  <span>Suggested Goal</span>
                </div>
                <p className="text-sm sm:text-base font-serif font-medium text-[#2d2a26] leading-snug">
                  {plan.suggestedGoal}
                </p>
                <p className="text-[11px] text-[#78716c]">
                  Derived strictly from your reflection context as a clear, realistic focus target.
                </p>
              </div>

              {/* Section 3: Suggested Action Plan */}
              <div className="p-4 sm:p-4.5 rounded-xl bg-white border border-[#e5e0d8] shadow-2xs space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-semibold text-[#4c5a40] uppercase tracking-wider">
                    <ListTodo className="w-4 h-4 text-[#6b7c5c]" />
                    <span>Suggested Action Plan</span>
                  </div>
                  <span className="text-[11px] text-[#8c827a] font-mono">
                    {steps.length} manageable steps
                  </span>
                </div>

                <div className="space-y-2.5 pt-1">
                  {steps.map((step, idx) => (
                    <div 
                      key={idx} 
                      className="flex items-start gap-3 p-2.5 rounded-lg bg-[#faf8f5] border border-[#eee9e1] hover:border-[#dcd6cb] transition-colors"
                    >
                      <div className="w-5 h-5 rounded-full bg-[#6b7c5c]/15 text-[#4c5a40] border border-[#6b7c5c]/30 flex items-center justify-center text-[11px] font-mono font-medium shrink-0 mt-0.5">
                        {idx + 1}
                      </div>
                      <p className="text-xs sm:text-sm text-[#3d3a36] leading-relaxed flex-1">
                        {step}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Section 4: Suggested Next Step */}
              <div className="p-4 sm:p-4.5 rounded-xl bg-[#6b7c5c]/10 border border-[#6b7c5c]/30 shadow-2xs space-y-2">
                <div className="flex items-center gap-2 text-xs font-semibold text-[#4c5a40] uppercase tracking-wider">
                  <CalendarClock className="w-4 h-4 text-[#6b7c5c]" />
                  <span>Suggested Next Step</span>
                </div>
                <div className="flex items-start gap-2.5">
                  <ArrowRight className="w-4 h-4 text-[#4c5a40] shrink-0 mt-0.5" />
                  <p className="text-xs sm:text-sm font-medium text-[#2f3927] leading-relaxed">
                    {plan.nextStep}
                  </p>
                </div>
                <p className="text-[11px] text-[#5e6d53] pt-0.5">
                  One low-friction immediate action you can take right now to build momentum.
                </p>
              </div>
            </div>
          )}

          {/* Empty / No Plan Yet State */}
          {!isLoading && !error && !plan && (
            <div className="py-8 text-center space-y-3">
              <Sparkles className="w-8 h-8 text-[#8a6d4b] mx-auto" />
              <p className="text-sm text-[#3d3a36]">No action plan generated yet for this reflection.</p>
              <button
                onClick={onRegenerate}
                className="px-4 py-2 rounded-xl bg-[#8a6d4b] hover:bg-[#73593b] text-white text-xs font-medium transition-colors cursor-pointer"
              >
                Generate Action Plan Now
              </button>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-[#e5e0d8] bg-[#f5f1eb] flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            {plan && (
              <>
                <button
                  onClick={handleCopyMarkdown}
                  className="px-3 py-1.5 rounded-lg border border-[#dcd6cb] bg-white hover:bg-[#ede7dd] text-[#3d3a36] text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
                  title="Copy full markdown action plan"
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-[#6b7c5c]" />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-[#78716c]" />
                      <span>Copy Plan</span>
                    </>
                  )}
                </button>

                <button
                  onClick={onRegenerate}
                  disabled={isLoading}
                  className="px-3 py-1.5 rounded-lg border border-[#dcd6cb] bg-white hover:bg-[#ede7dd] text-[#3d3a36] text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50 shadow-2xs"
                  title="Generate a fresh action plan"
                >
                  <RefreshCw className={`w-3.5 h-3.5 text-[#78716c] ${isLoading ? 'animate-spin' : ''}`} />
                  <span>Regenerate</span>
                </button>
              </>
            )}
          </div>

          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-[#3d3a36] hover:bg-[#2b2926] text-white text-xs font-medium transition-colors cursor-pointer shadow-2xs"
          >
            Back to Journal
          </button>
        </div>
      </div>
    </div>
  );
};
