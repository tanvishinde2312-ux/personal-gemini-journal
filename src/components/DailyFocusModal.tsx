import React, { useState, useEffect } from 'react';
import { JournalInteraction } from '../types';
import { 
  getLocalTodayDateString, 
  formatFocusDate, 
  getDailyFocusForDate, 
  getActionStepsFromPlan,
  saveDailyFocusSelection,
  toggleDailyFocusItem,
  getDailyFocusProgress,
  attachDailyFocusToInteraction 
} from '../lib/dailyFocus';
import { 
  Calendar, 
  Target, 
  CheckSquare, 
  Square, 
  CheckCircle2, 
  Sparkles, 
  ArrowRight, 
  Edit3, 
  X, 
  AlertCircle, 
  RefreshCw,
  ListTodo
} from 'lucide-react';

interface DailyFocusModalProps {
  isOpen: boolean;
  onClose: () => void;
  interaction: JournalInteraction | null;
  onUpdateInteraction: (updated: JournalInteraction) => Promise<void>;
  onOpenPlanModal: () => void;
}

export const DailyFocusModal: React.FC<DailyFocusModalProps> = ({
  isOpen,
  onClose,
  interaction,
  onUpdateInteraction,
  onOpenPlanModal,
}) => {
  const todayStr = getLocalTodayDateString();
  const existingRecord = getDailyFocusForDate(interaction, todayStr);
  const plan = interaction?.plan;
  const allSteps = getActionStepsFromPlan(plan);
  const goal = plan?.suggestedGoal || existingRecord?.goal || '';

  // Determine initial mode: if today's focus has items, show 'view'; otherwise 'select'
  const [isEditingSelection, setIsEditingSelection] = useState(false);
  const [selectedIndices, setSelectedIndices] = useState<number[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Sync selected indices when modal opens or existing record changes
  useEffect(() => {
    if (existingRecord && existingRecord.items.length > 0) {
      setSelectedIndices(existingRecord.items.map((it) => it.stepIndex));
      setIsEditingSelection(false);
    } else {
      // Default to first step if none selected yet
      if (allSteps.length > 0) {
        setSelectedIndices([0]);
      } else {
        setSelectedIndices([]);
      }
      setIsEditingSelection(true);
    }
    setSaveError(null);
  }, [existingRecord?.updatedAt, interaction?.id, isOpen]);

  if (!isOpen) return null;

  const hasItems = Boolean(existingRecord && existingRecord.items.length > 0);
  const progress = existingRecord ? getDailyFocusProgress(existingRecord.items) : null;

  // Toggle selection in selection mode (1 to 3 items)
  const handleToggleIndex = (idx: number) => {
    setSaveError(null);
    if (selectedIndices.includes(idx)) {
      setSelectedIndices((prev) => prev.filter((i) => i !== idx));
    } else {
      if (selectedIndices.length >= 3) {
        return; // Hard limit 3 tasks
      }
      setSelectedIndices((prev) => [...prev, idx].sort((a, b) => a - b));
    }
  };

  // Save selected 1-3 tasks as today's focus
  const handleSaveSelection = async () => {
    if (!interaction) return;
    if (selectedIndices.length === 0) {
      setSaveError('Please select at least 1 action step for today’s focus.');
      return;
    }
    if (selectedIndices.length > 3) {
      setSaveError('Please select a maximum of 3 action steps for today’s focus.');
      return;
    }

    setIsSaving(true);
    setSaveError(null);

    try {
      const updatedRecord = saveDailyFocusSelection(
        existingRecord,
        interaction,
        selectedIndices,
        todayStr
      );
      const updatedInteraction = attachDailyFocusToInteraction(interaction, updatedRecord);
      await onUpdateInteraction(updatedInteraction);
      setIsEditingSelection(false);
    } catch (err: any) {
      console.error('Failed to save daily focus:', err);
      setSaveError(err?.message || 'Failed to save Daily Focus to Firestore. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  // Toggle completion of an individual task
  const handleToggleItemCompletion = async (itemId: string) => {
    if (!interaction || !existingRecord) return;
    setSaveError(null);

    try {
      const updatedRecord = toggleDailyFocusItem(existingRecord, itemId);
      const updatedInteraction = attachDailyFocusToInteraction(interaction, updatedRecord);
      await onUpdateInteraction(updatedInteraction);
    } catch (err: any) {
      console.error('Failed to update task completion:', err);
      setSaveError(err?.message || 'Failed to update task status in Firestore. Please try again.');
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-[#3d3a36]/50 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div 
        id="daily-focus-modal"
        className="w-full max-w-xl bg-[#faf8f5] border border-[#e5e0d8] rounded-2xl shadow-xl overflow-hidden flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-[#e5e0d8] flex items-center justify-between bg-[#f5f1eb]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#6b7c5c]/15 border border-[#6b7c5c]/30 text-[#4c5a40] flex items-center justify-center shadow-2xs">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-semibold text-[#3d3a36] font-serif flex items-center gap-1.5">
                  <span>📅</span>
                  <span>Today's Focus</span>
                </h2>
                <span className="text-[10px] font-mono bg-[#6b7c5c]/10 text-[#4c5a40] px-2 py-0.5 rounded-full border border-[#6b7c5c]/25">
                  {formatFocusDate(todayStr)}
                </span>
              </div>
              <p className="text-xs text-[#78716c] line-clamp-1 mt-0.5">
                {interaction?.title || 'Reflection'} &bull; 1–3 focused action steps for today
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

        {/* Modal Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5 flex-1 bg-[#faf8f5]">
          {/* Error Banner */}
          {saveError && (
            <div className="p-3.5 rounded-xl bg-[#9c6657]/10 border border-[#9c6657]/20 text-[#7a4c40] flex items-start gap-2.5 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-[#9c6657]" />
              <div className="flex-1">
                <p className="font-medium">{saveError}</p>
              </div>
              <button 
                onClick={() => setSaveError(null)}
                className="text-[#9c6657] hover:text-[#7a4c40] font-bold"
              >
                &times;
              </button>
            </div>
          )}

          {/* EDGE CASE 1: No Action Plan Exists */}
          {!plan && (
            <div className="py-8 text-center space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-[#8a6d4b]/10 border border-[#8a6d4b]/20 flex items-center justify-center text-[#8a6d4b] mx-auto">
                <Sparkles className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-[#3d3a36] font-serif">
                  No Action Plan Created Yet
                </h3>
                <p className="text-xs text-[#78716c] mt-1.5 max-w-sm mx-auto leading-relaxed">
                  Daily Focus turns your AI Action Plan steps into today’s focus. Please generate an Action Plan for this reflection first.
                </p>
              </div>
              <div className="pt-2 flex items-center justify-center gap-2.5">
                <button
                  onClick={() => {
                    onClose();
                    onOpenPlanModal();
                  }}
                  className="px-4 py-2 rounded-xl bg-[#8a6d4b] hover:bg-[#73593b] text-white text-xs font-medium transition-colors cursor-pointer inline-flex items-center gap-1.5 shadow-2xs"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Generate Action Plan</span>
                </button>
                <button
                  onClick={onClose}
                  className="px-3.5 py-2 rounded-xl border border-[#dcd6cb] bg-white hover:bg-[#ede7dd] text-[#3d3a36] text-xs font-medium transition-colors cursor-pointer"
                >
                  Back to Journal
                </button>
              </div>
            </div>
          )}

          {/* EDGE CASE 2: Action Plan exists but has no action steps */}
          {plan && allSteps.length === 0 && (
            <div className="py-8 text-center space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-[#9c6657]/10 border border-[#9c6657]/20 flex items-center justify-center text-[#9c6657] mx-auto">
                <AlertCircle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-[#3d3a36] font-serif">
                  No Action Steps in Current Plan
                </h3>
                <p className="text-xs text-[#78716c] mt-1.5 max-w-sm mx-auto leading-relaxed">
                  Your current Action Plan does not have discrete action steps to select for Today’s Focus. Please regenerate your Action Plan.
                </p>
              </div>
              <div className="pt-2 flex items-center justify-center gap-2.5">
                <button
                  onClick={() => {
                    onClose();
                    onOpenPlanModal();
                  }}
                  className="px-4 py-2 rounded-xl bg-[#8a6d4b] hover:bg-[#73593b] text-white text-xs font-medium transition-colors cursor-pointer shadow-2xs"
                >
                  View &amp; Regenerate Plan
                </button>
                <button
                  onClick={onClose}
                  className="px-3.5 py-2 rounded-xl border border-[#dcd6cb] bg-white hover:bg-[#ede7dd] text-[#3d3a36] text-xs font-medium transition-colors cursor-pointer"
                >
                  Back to Journal
                </button>
              </div>
            </div>
          )}

          {/* MAIN CONTENT: Action Plan & Steps Exist */}
          {plan && allSteps.length > 0 && (
            <div className="space-y-5">
              {/* Related Goal Card (Always visible) */}
              <div className="p-4 rounded-xl bg-white border border-[#e5e0d8] shadow-2xs space-y-1.5">
                <div className="flex items-center gap-2 text-xs font-semibold text-[#6a4f32] uppercase tracking-wider">
                  <Target className="w-4 h-4 text-[#8a6d4b]" />
                  <span>Goal</span>
                </div>
                <p className="text-sm font-serif font-medium text-[#2d2a26] leading-relaxed">
                  {goal || plan.suggestedGoal || 'Focus on high-priority action steps today.'}
                </p>
              </div>

              {/* VIEW MODE: Today's Tasks & Progress */}
              {hasItems && !isEditingSelection && existingRecord && (
                <div className="space-y-4">
                  {/* Section Title & Change Action */}
                  <div className="flex items-center justify-between pt-1">
                    <div className="flex items-center gap-2 text-xs font-semibold text-[#4c5a40] uppercase tracking-wider">
                      <ListTodo className="w-4 h-4 text-[#6b7c5c]" />
                      <span>Today's Tasks</span>
                    </div>
                    <button
                      onClick={() => setIsEditingSelection(true)}
                      className="text-xs text-[#6b7c5c] hover:text-[#4c5a40] font-medium flex items-center gap-1 cursor-pointer transition-colors"
                      title="Adjust selected tasks for today"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>Change Tasks</span>
                    </button>
                  </div>

                  {/* Tasks List */}
                  <div className="space-y-2.5">
                    {existingRecord.items.map((item, idx) => {
                      const isDone = item.completed;
                      return (
                        <div
                          key={item.id}
                          id={`focus-task-item-${idx}`}
                          onClick={() => handleToggleItemCompletion(item.id)}
                          className={`flex items-start gap-3 p-3.5 rounded-xl border transition-all cursor-pointer select-none ${
                            isDone
                              ? 'bg-[#f4f7f2] border-[#c8dac0] text-[#4c5a40]'
                              : 'bg-white border-[#e5e0d8] hover:border-[#6b7c5c]/50 text-[#3d3a36] shadow-2xs'
                          }`}
                        >
                          <button
                            type="button"
                            className="mt-0.5 shrink-0 focus:outline-none cursor-pointer"
                            aria-label={isDone ? 'Mark task incomplete' : 'Mark task complete'}
                          >
                            {isDone ? (
                              <CheckSquare className="w-5 h-5 text-[#6b7c5c]" />
                            ) : (
                              <Square className="w-5 h-5 text-[#a8a199] hover:text-[#6b7c5c] transition-colors" />
                            )}
                          </button>
                          <div className="flex-1">
                            <p className={`text-xs sm:text-sm leading-relaxed ${
                              isDone ? 'line-through text-[#66725c]' : 'text-[#3d3a36]'
                            }`}>
                              {item.text}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Progress Section */}
                  {progress && (
                    <div className="p-4 rounded-xl bg-gradient-to-br from-[#f5f1eb] to-white border border-[#e5e0d8] shadow-2xs space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-[#3d3a36] uppercase tracking-wider">
                          Progress
                        </span>
                        <span className="font-mono font-medium text-[#4c5a40]">
                          {progress.progressText}
                        </span>
                      </div>

                      {/* Visual Progress Bar */}
                      <div className="w-full h-2 rounded-full bg-[#e5e0d8] overflow-hidden">
                        <div 
                          className="h-full bg-[#6b7c5c] transition-all duration-300 rounded-full"
                          style={{ width: `${progress.percent}%` }}
                        />
                      </div>

                      {progress.completed === progress.total && progress.total > 0 && (
                        <div className="flex items-center gap-1.5 text-xs text-[#4c5a40] font-medium pt-1">
                          <CheckCircle2 className="w-4 h-4 text-[#6b7c5c]" />
                          <span>All of today’s focus tasks completed! Outstanding work.</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* SELECTION MODE: Choose 1-3 tasks from Action Plan */}
              {(!hasItems || isEditingSelection) && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-semibold text-[#3d3a36] uppercase tracking-wider">
                        Select 1–3 Action Steps for Today
                      </h4>
                      <p className="text-[11px] text-[#78716c] mt-0.5">
                        Choose the highest-impact tasks you commit to completing today.
                      </p>
                    </div>
                    <span className={`text-xs font-mono px-2 py-0.5 rounded-full border ${
                      selectedIndices.length >= 1 && selectedIndices.length <= 3
                        ? 'bg-[#6b7c5c]/10 text-[#4c5a40] border-[#6b7c5c]/30'
                        : 'bg-[#9c6657]/10 text-[#9c6657] border-[#9c6657]/30'
                    }`}>
                      {selectedIndices.length} of 3 selected
                    </span>
                  </div>

                  {/* Steps selection list */}
                  <div className="space-y-2.5">
                    {allSteps.map((step, idx) => {
                      const isSelected = selectedIndices.includes(idx);
                      const isMaxReached = selectedIndices.length >= 3 && !isSelected;

                      return (
                        <div
                          key={idx}
                          id={`step-selection-${idx}`}
                          onClick={() => !isMaxReached && handleToggleIndex(idx)}
                          className={`flex items-start gap-3 p-3 rounded-xl border transition-all select-none ${
                            isSelected
                              ? 'bg-[#6b7c5c]/10 border-[#6b7c5c]/40 text-[#2f3927]'
                              : isMaxReached
                              ? 'bg-[#f5f1eb]/50 border-[#eee9e1] opacity-50 cursor-not-allowed text-[#8c827a]'
                              : 'bg-white border-[#e5e0d8] hover:border-[#6b7c5c]/30 cursor-pointer text-[#3d3a36] shadow-2xs'
                          }`}
                        >
                          <div className="mt-0.5 shrink-0">
                            {isSelected ? (
                              <CheckSquare className="w-5 h-5 text-[#6b7c5c]" />
                            ) : (
                              <Square className="w-5 h-5 text-[#a8a199]" />
                            )}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-1.5 mb-0.5">
                              <span className="text-[10px] font-mono text-[#8c827a]">
                                Step {idx + 1}
                              </span>
                            </div>
                            <p className="text-xs sm:text-sm leading-relaxed">
                              {step}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Selection Action Buttons */}
                  <div className="pt-2 flex items-center justify-between gap-3">
                    {hasItems && (
                      <button
                        onClick={() => setIsEditingSelection(false)}
                        className="px-3.5 py-1.5 rounded-lg border border-[#dcd6cb] bg-white hover:bg-[#ede7dd] text-[#3d3a36] text-xs font-medium transition-colors cursor-pointer"
                      >
                        Cancel
                      </button>
                    )}

                    <button
                      id="save-daily-focus-btn"
                      onClick={handleSaveSelection}
                      disabled={selectedIndices.length === 0 || isSaving}
                      className="ml-auto px-4 py-2 rounded-xl bg-[#6b7c5c] hover:bg-[#5a6a4d] disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-medium transition-all cursor-pointer flex items-center gap-1.5 shadow-2xs"
                    >
                      {isSaving ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          <span>Saving to Firestore...</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Save Today's Focus ({selectedIndices.length})</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[#e5e0d8] bg-[#f5f1eb] flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            {plan && (
              <button
                onClick={() => {
                  onClose();
                  onOpenPlanModal();
                }}
                className="px-3 py-1.5 rounded-lg border border-[#dcd6cb] bg-white hover:bg-[#ede7dd] text-[#3d3a36] text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
              >
                <Target className="w-3.5 h-3.5 text-[#8a6d4b]" />
                <span>View Full Plan</span>
              </button>
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
