import React, { useState, useMemo } from 'react';
import { JournalInteraction, ReflectionMode } from '../types';
import { REFLECTION_MODES } from '../lib/modes';
import { 
  Search, 
  Trash2, 
  MessageSquare, 
  Sparkles, 
  Calendar, 
  Filter, 
  Plus, 
  ChevronRight,
  BookMarked,
  Tag,
  Target
} from 'lucide-react';

interface SidebarHistoryProps {
  interactions: JournalInteraction[];
  activeId: string | null;
  onSelect: (interaction: JournalInteraction) => void;
  onNew: () => void;
  onDelete: (id: string, e: React.MouseEvent) => void;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
}

export const SidebarHistory: React.FC<SidebarHistoryProps> = ({
  interactions,
  activeId,
  onSelect,
  onNew,
  onDelete,
  isOpenMobile,
  onCloseMobile,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilterMode, setSelectedFilterMode] = useState<string>('all');

  const filteredInteractions = useMemo(() => {
    return interactions.filter((item) => {
      // Mode filter
      if (selectedFilterMode !== 'all' && item.mode !== selectedFilterMode) {
        return false;
      }
      // Search query
      if (!searchQuery.trim()) return true;
      const query = searchQuery.toLowerCase();
      const matchTitle = item.title?.toLowerCase().includes(query);
      const matchSummary = item.summary?.toLowerCase().includes(query);
      const matchTags = item.tags?.some((t) => t.toLowerCase().includes(query));
      const matchTurns = item.turns?.some((t) => t.content.toLowerCase().includes(query));
      return matchTitle || matchSummary || matchTags || matchTurns;
    });
  }, [interactions, searchQuery, selectedFilterMode]);

  const formatDate = (isoString: string) => {
    if (!isoString) return '';
    try {
      const date = new Date(isoString);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

      if (diffDays === 0) {
        return `Today at ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
      } else if (diffDays === 1) {
        return `Yesterday at ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
      } else if (diffDays < 7) {
        return `${date.toLocaleDateString([], { weekday: 'short' })} at ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
      } else {
        return date.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
      }
    } catch {
      return '';
    }
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpenMobile && (
        <div
          className="fixed inset-0 bg-[#3d3a36]/40 z-40 lg:hidden backdrop-blur-xs transition-opacity"
          onClick={onCloseMobile}
        />
      )}

      <aside
        className={`fixed lg:static top-[57px] bottom-0 left-0 z-40 w-80 sm:w-88 bg-[#f3efe9] border-r border-[#e5e0d8] flex flex-col transition-transform duration-200 ease-in-out ${
          isOpenMobile ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Top bar: Title and New Button */}
        <div className="p-4 border-b border-[#e5e0d8] flex items-center justify-between gap-2 bg-[#f3efe9]">
          <div className="flex items-center gap-2">
            <BookMarked className="w-4 h-4 text-[#6b7c5c]" />
            <h2 className="text-sm font-semibold text-[#3d3a36] uppercase tracking-wider font-mono">
              Journal History
            </h2>
            <span className="text-xs px-2 py-0.5 rounded-full bg-[#e5e0d8] text-[#57534e] font-mono">
              {interactions.length}
            </span>
          </div>

          <button
            onClick={() => {
              onNew();
              onCloseMobile();
            }}
            className="p-1.5 rounded-lg bg-white border border-[#e5e0d8] hover:bg-[#ede7dd] text-[#3d3a36] transition-colors text-xs flex items-center gap-1 cursor-pointer shadow-2xs"
            title="Start New Reflection"
          >
            <Plus className="w-4 h-4 text-[#6b7c5c]" />
          </button>
        </div>

        {/* Search input */}
        <div className="p-3 border-b border-[#e5e0d8] bg-[#f3efe9]">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-[#8c827a] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search reflections, insights..."
              className="w-full bg-white border border-[#dcd6cb] rounded-lg pl-8 pr-3 py-1.5 text-xs text-[#3d3a36] placeholder-[#8c827a] focus:outline-none focus:border-[#6b7c5c] transition-colors shadow-2xs"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#8c827a] hover:text-[#3d3a36] text-xs"
              >
                &times;
              </button>
            )}
          </div>

          {/* Mode filter pills */}
          <div className="flex items-center gap-1 mt-2.5 overflow-x-auto pb-1 no-scrollbar text-[11px]">
            <button
              onClick={() => setSelectedFilterMode('all')}
              className={`px-2 py-0.5 rounded-md whitespace-nowrap transition-colors cursor-pointer ${
                selectedFilterMode === 'all'
                  ? 'bg-[#3d3a36] text-white font-medium shadow-2xs'
                  : 'text-[#666059] hover:text-[#3d3a36] hover:bg-[#e5e0d8]'
              }`}
            >
              All
            </button>
            {Object.values(REFLECTION_MODES).map((mode) => (
              <button
                key={mode.id}
                onClick={() => setSelectedFilterMode(mode.id)}
                className={`px-2 py-0.5 rounded-md whitespace-nowrap transition-colors cursor-pointer ${
                  selectedFilterMode === mode.id
                    ? 'bg-[#3d3a36] text-white font-medium shadow-2xs'
                    : 'text-[#666059] hover:text-[#3d3a36] hover:bg-[#e5e0d8]'
                }`}
              >
                {mode.label.split(' ')[0]}
              </button>
            ))}
          </div>
        </div>

        {/* Interaction List */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1.5 bg-[#f3efe9]">
          {filteredInteractions.length === 0 ? (
            <div className="p-8 text-center text-[#8c827a] flex flex-col items-center justify-center">
              <MessageSquare className="w-8 h-8 stroke-1 text-[#a8a199] mb-2" />
              <p className="text-xs font-medium text-[#57534e]">
                {searchQuery ? 'No matching entries found' : 'No reflections yet'}
              </p>
              <p className="text-[11px] text-[#8c827a] mt-1 max-w-[180px]">
                {searchQuery
                  ? 'Try changing search terms or clearing filters'
                  : 'Start writing your first entry to converse with Gemini'}
              </p>
            </div>
          ) : (
            filteredInteractions.map((item) => {
              const isActive = item.id === activeId;
              const modeConfig = REFLECTION_MODES[item.mode] || REFLECTION_MODES.reflection;
              const turnsCount = item.turns ? item.turns.length : 0;
              const hasSummary = Boolean(item.summary);

              return (
                <div
                  key={item.id}
                  id={`history-item-${item.id}`}
                  onClick={() => {
                    onSelect(item);
                    onCloseMobile();
                  }}
                  className={`group relative p-3 rounded-xl border transition-all cursor-pointer ${
                    isActive
                      ? 'bg-white border-[#6b7c5c] shadow-xs'
                      : 'bg-white/70 border-[#e5e0d8] hover:bg-white hover:border-[#dcd6cb]'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-1.5">
                      <span className={`text-[10px] uppercase font-mono px-1.5 py-0.5 rounded border ${modeConfig.badgeBg}`}>
                        {modeConfig.label}
                      </span>
                      {hasSummary && (
                        <span className="text-[10px] text-[#6b7c5c] flex items-center gap-0.5 font-medium" title="AI Summary Generated">
                          <Sparkles className="w-2.5 h-2.5" />
                        </span>
                      )}
                      {item.plan && (
                        <span className="text-[10px] text-[#8a6d4b] flex items-center gap-0.5 font-medium" title="Action Plan Ready">
                          <Target className="w-2.5 h-2.5" />
                        </span>
                      )}
                    </div>

                    <button
                      id={`delete-btn-${item.id}`}
                      onClick={(e) => onDelete(item.id, e)}
                      className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-[#9c6657]/15 text-[#8c827a] hover:text-[#7a4c40] transition-opacity"
                      title="Delete Entry"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <h3 className="text-xs sm:text-sm font-medium text-[#3d3a36] mt-2 line-clamp-1 group-hover:text-[#6b7c5c] transition-colors">
                    {item.title || 'Untitled Reflection'}
                  </h3>

                  {item.summary ? (
                    <p className="text-[11px] text-[#666059] mt-1 line-clamp-2 leading-relaxed">
                      {item.summary}
                    </p>
                  ) : item.turns && item.turns[0] ? (
                    <p className="text-[11px] text-[#666059] mt-1 line-clamp-2 leading-relaxed">
                      {item.turns[0].content}
                    </p>
                  ) : null}

                  {/* Tags */}
                  {item.tags && item.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {item.tags.slice(0, 3).map((tag, idx) => (
                        <span
                          key={idx}
                          className="text-[10px] text-[#57534e] bg-[#ede7dd] px-1.5 py-0.2 rounded border border-[#dcd6cb]"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Footer metadata */}
                  <div className="flex items-center justify-between text-[10px] text-[#8c827a] font-mono mt-2.5 pt-2 border-t border-[#e5e0d8]">
                    <span>{formatDate(item.updatedAt || item.createdAt)}</span>
                    <span className="flex items-center gap-1">
                      <MessageSquare className="w-3 h-3 text-[#8c827a]" />
                      {turnsCount} {turnsCount === 1 ? 'turn' : 'turns'}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </aside>
    </>
  );
};
