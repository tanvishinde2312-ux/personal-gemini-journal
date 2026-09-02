import React, { useState } from 'react';
import { JournalInteraction } from '../types';
import { REFLECTION_MODES } from '../lib/modes';
import { 
  X, 
  Sparkles, 
  CheckCircle2, 
  Copy, 
  Check, 
  Download, 
  Share2, 
  Tag, 
  BookOpen,
  FileText,
  Target
} from 'lucide-react';

interface SummaryModalProps {
  interaction: JournalInteraction | null;
  isOpen: boolean;
  onClose: () => void;
  onTurnIntoPlan?: () => void;
}

export const SummaryModal: React.FC<SummaryModalProps> = ({
  interaction,
  isOpen,
  onClose,
  onTurnIntoPlan,
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen || !interaction) return null;

  const modeConfig = REFLECTION_MODES[interaction.mode] || REFLECTION_MODES.reflection;

  const handleCopyMarkdown = async () => {
    const md = `# ${interaction.title || 'Journal Reflection'}
**Date:** ${new Date(interaction.createdAt).toLocaleString()}
**Mode:** ${modeConfig.label}

## AI Executive Summary
${interaction.summary || 'No summary recorded.'}

## Key Insights & Takeaways
${(interaction.keyInsights || []).map((k) => `- ${k}`).join('\n')}

## Tags
${(interaction.tags || []).map((t) => `#${t}`).join(' ')}

---
## Full Transcript
${(interaction.turns || []).map((t) => `### ${t.role === 'model' ? 'Gemini' : 'User'}\n${t.content}`).join('\n\n')}
`;
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(md);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Gracefully handle clipboard rejection in iframe sandbox
    }
  };

  const handleDownloadJSON = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(interaction, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `journal-entry-${interaction.id}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#3d3a36]/50 backdrop-blur-xs animate-in fade-in duration-150">
      <div 
        className="w-full max-w-2xl bg-[#faf8f5] border border-[#e5e0d8] rounded-2xl shadow-xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 border-b border-[#e5e0d8] flex items-center justify-between bg-[#faf8f5]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#6b7c5c]/10 border border-[#6b7c5c]/25 text-[#6b7c5c] flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-[#3d3a36] font-serif">
                Session Synthesis & Insights
              </h2>
              <p className="text-xs text-[#78716c]">
                AI extracted breakthroughs from your reflection
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#78716c] hover:text-[#3d3a36] hover:bg-[#ede7dd] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Content */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 bg-[#faf8f5]">
          {/* Title & Metadata */}
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className={`text-[11px] uppercase font-mono px-2 py-0.5 rounded border ${modeConfig.badgeBg}`}>
                {modeConfig.label}
              </span>
              <span className="text-xs text-[#8c827a] font-mono">
                {new Date(interaction.createdAt).toLocaleDateString(undefined, {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </span>
            </div>
            <h1 className="text-xl font-bold text-[#3d3a36] font-serif">
              {interaction.title || 'Untitled Session'}
            </h1>
          </div>

          {/* Executive Summary */}
          {interaction.summary && (
            <div className="p-4 rounded-xl bg-white border border-[#e5e0d8] shadow-2xs">
              <h3 className="text-xs font-semibold uppercase tracking-wider font-mono text-[#6b7c5c] mb-2 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5" /> Executive Summary
              </h3>
              <p className="text-sm text-[#4d4842] leading-relaxed">
                {interaction.summary}
              </p>
            </div>
          )}

          {/* Key Insights & Takeaways */}
          {interaction.keyInsights && interaction.keyInsights.length > 0 && (
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider font-mono text-[#4c5a40] mb-3 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#6b7c5c]" /> Key Breakthroughs & Takeaways
              </h3>
              <div className="space-y-2">
                {interaction.keyInsights.map((insight, index) => (
                  <div
                    key={index}
                    className="p-3 rounded-lg bg-white border border-[#e5e0d8] flex items-start gap-2.5 shadow-2xs"
                  >
                    <span className="w-5 h-5 rounded-full bg-[#6b7c5c]/15 text-[#4c5a40] flex items-center justify-center text-xs font-mono shrink-0 mt-0.5 font-bold">
                      {index + 1}
                    </span>
                    <p className="text-xs sm:text-sm text-[#3d3a36] leading-normal">
                      {insight}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Topic Tags */}
          {interaction.tags && interaction.tags.length > 0 && (
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider font-mono text-[#4d6b75] mb-2 flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5" /> Thematic Tags
              </h3>
              <div className="flex flex-wrap gap-1.5">
                {interaction.tags.map((tag, idx) => (
                  <span
                    key={idx}
                    className="px-2.5 py-1 rounded-full text-xs font-mono text-[#365059] bg-[#4d6b75]/10 border border-[#4d6b75]/25"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-[#e5e0d8] bg-[#faf8f5] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyMarkdown}
              className="px-3 py-1.5 rounded-lg border border-[#dcd6cb] bg-white hover:bg-[#ede7dd] text-[#3d3a36] text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-[#6b7c5c]" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied Markdown!' : 'Copy as Markdown'}</span>
            </button>

            <button
              onClick={handleDownloadJSON}
              className="px-3 py-1.5 rounded-lg border border-[#dcd6cb] bg-white hover:bg-[#ede7dd] text-[#3d3a36] text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export JSON</span>
            </button>

            {onTurnIntoPlan && (
              <button
                onClick={() => {
                  onClose();
                  onTurnIntoPlan();
                }}
                className="px-3 py-1.5 rounded-lg bg-[#8a6d4b] hover:bg-[#73593b] text-white text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
              >
                <Target className="w-3.5 h-3.5" />
                <span>Turn Reflection into a Plan</span>
              </button>
            )}
          </div>

          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-[#3d3a36] hover:bg-[#2c2a27] text-white text-xs font-medium transition-colors cursor-pointer shadow-2xs"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
