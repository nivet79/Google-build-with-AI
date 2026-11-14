import React, { useEffect } from 'react';
import { X, Trash2, Clock, FileText } from 'lucide-react';
import { EXTRACTION_MODES, HistoryItem } from '../types';

interface HistoryDrawerProps {
  isOpen: boolean;
  items: HistoryItem[];
  onClose: () => void;
  onSelectItem: (item: HistoryItem) => void;
  onDeleteItem: (id: string) => void;
  onClearAll: () => void;
}

function formatTimestamp(ts: number): string {
  const date = new Date(ts);
  return date.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function getModeLabel(modeId: HistoryItem['mode']): string {
  return EXTRACTION_MODES.find((m) => m.id === modeId)?.shortLabel ?? modeId;
}

export const HistoryDrawer: React.FC<HistoryDrawerProps> = ({
  isOpen,
  items,
  onClose,
  onSelectItem,
  onDeleteItem,
  onClearAll,
}) => {
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end"
      role="dialog"
      aria-modal="true"
      aria-label="Session History"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-950/40 backdrop-blur-[1px] transition-opacity"
        onClick={onClose}
      />

      {/* Drawer Panel */}
      <aside className="relative z-10 w-full max-w-md h-full bg-white dark:bg-[#111827] border-l border-[#E2E8F0] dark:border-[#1E293B] flex flex-col">
        <div className="px-5 py-4 border-b border-[#E2E8F0] dark:border-[#1E293B] flex items-center justify-between gap-4">
          <div className="min-w-0">
            <h2 className="text-base font-semibold text-[#131B2E] dark:text-[#F1F5F9]">
              Session History
            </h2>
            <p className="text-xs text-[#464555] dark:text-slate-400 mt-0.5 tabular-nums">
              {items.length} of 15 local extractions saved in browser
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close session history"
            className="h-9 w-9 rounded-md border border-[#E2E8F0] dark:border-[#1E293B] flex items-center justify-center text-[#464555] dark:text-slate-400 hover:text-[#131B2E] dark:hover:text-[#F1F5F9] hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Content List */}
        <div className="flex-1 overflow-y-auto divide-y divide-[#E2E8F0] dark:divide-[#1E293B]">
          {items.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center px-8 text-center">
              <div className="h-11 w-11 rounded-lg border border-[#E2E8F0] dark:border-[#1E293B] bg-slate-50 dark:bg-[#0B0F19] flex items-center justify-center mb-3">
                <Clock className="h-5 w-5 text-slate-400" />
              </div>
              <p className="text-sm font-medium text-[#131B2E] dark:text-[#F1F5F9]">
                No saved extractions yet
              </p>
              <p className="text-xs text-[#464555] dark:text-slate-400 mt-1 leading-relaxed max-w-[28ch]">
                Completed extractions are stored locally in your browser without uploading files to any database.
              </p>
            </div>
          ) : (
            items.map((item) => {
              const snippet = item.extractedText
                .replace(/\s+/g, ' ')
                .trim()
                .slice(0, 120);

              return (
                <div
                  key={item.id}
                  className="group px-5 py-3.5 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors flex items-start justify-between gap-3"
                >
                  <button
                    type="button"
                    onClick={() => {
                      onSelectItem(item);
                      onClose();
                    }}
                    className="flex-1 min-w-0 text-left cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4F46E5] rounded"
                  >
                    <div className="flex items-center gap-2">
                      <FileText className="h-3.5 w-3.5 text-[#4F46E5] dark:text-[#818CF8] shrink-0" />
                      <span className="text-sm font-medium text-[#131B2E] dark:text-[#F1F5F9] truncate">
                        {item.fileName}
                      </span>
                    </div>
                    <div className="mt-1 flex items-center gap-2 text-xs text-[#464555] dark:text-slate-400 font-mono tabular-nums">
                      <span>{getModeLabel(item.mode)}</span>
                      <span aria-hidden="true">·</span>
                      <span>{formatTimestamp(item.timestamp)}</span>
                    </div>
                    {snippet && (
                      <p className="mt-1.5 text-xs text-[#464555] dark:text-slate-400 line-clamp-2 leading-relaxed">
                        {snippet}
                      </p>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => onDeleteItem(item.id)}
                    aria-label={`Remove ${item.fileName} from history`}
                    className="h-8 w-8 rounded-md flex items-center justify-center text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors shrink-0 cursor-pointer"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              );
            })
          )}
        </div>

        {/* Footer with 1-click Clear History */}
        {items.length > 0 && (
          <div className="px-5 py-3.5 border-t border-[#E2E8F0] dark:border-[#1E293B] bg-slate-50/70 dark:bg-[#0B0F19] flex items-center justify-between gap-3">
            <span className="text-xs text-[#464555] dark:text-slate-400">
              Text only · no files stored
            </span>
            <button
              type="button"
              onClick={onClearAll}
              className="px-3 py-1.5 rounded-md border border-rose-200 dark:border-rose-900/60 bg-white dark:bg-[#111827] text-xs font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              Clear History
            </button>
          </div>
        )}
      </aside>
    </div>
  );
};
