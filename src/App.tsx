import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  ScanText,
  Upload,
  FileText,
  Sparkles,
  Copy,
  Check,
  Download,
  History,
  Sun,
  Moon,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  RefreshCw,
  AlertCircle,
  X,
  Loader2,
  Eye,
  Code2,
  NotebookPen,
} from 'lucide-react';
import {
  DocumentFile,
  EXTRACTION_MODES,
  ExtractionMode,
  HistoryItem,
  ViewMode,
} from './types';
import {
  computeTextStats,
  downloadTextFile,
  fileToBase64,
  formatFileSize,
  validateDocumentFile,
} from './utils/fileHelpers';
import {
  generateSampleNoteImage,
  generateSampleReceiptImage,
} from './utils/sampleGenerator';
import { MarkdownRenderer } from './components/MarkdownRenderer';
import { ReceiptSummaryCard } from './components/ReceiptSummaryCard';
import { HistoryDrawer } from './components/HistoryDrawer';

const HISTORY_STORAGE_KEY = 'nivets_docuscan_history';
const THEME_STORAGE_KEY = 'nivets_docuscan_theme';
const MAX_HISTORY_ITEMS = 15;

function loadHistoryFromStorage(): HistoryItem[] {
  try {
    const raw = window.localStorage.getItem(HISTORY_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.slice(0, MAX_HISTORY_ITEMS);
  } catch {
    return [];
  }
}

function saveHistoryToStorage(items: HistoryItem[]): void {
  try {
    window.localStorage.setItem(
      HISTORY_STORAGE_KEY,
      JSON.stringify(items.slice(0, MAX_HISTORY_ITEMS))
    );
  } catch {
    // Ignore storage quota errors gracefully
  }
}

export default function App() {
  // Theme state
  const [isDark, setIsDark] = useState<boolean>(() => {
    if (typeof document !== 'undefined') {
      return document.documentElement.classList.contains('dark');
    }
    return false;
  });

  // Document & Extraction state
  const [selectedMode, setSelectedMode] = useState<ExtractionMode>('plain');
  const [outputMode, setOutputMode] = useState<ExtractionMode>('plain');
  const [documentFile, setDocumentFile] = useState<DocumentFile | null>(null);
  const [zoom, setZoom] = useState<number>(1);
  const [isDragging, setIsDragging] = useState<boolean>(false);

  // Output & Editor state
  const [outputText, setOutputText] = useState<string>('');
  const [lastExtractedFileKey, setLastExtractedFileKey] = useState<string | null>(null);
  const [lastExtractedMode, setLastExtractedMode] = useState<ExtractionMode | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('preview');
  const [isExtracting, setIsExtracting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [copied, setCopied] = useState<boolean>(false);

  // History Drawer state
  const [history, setHistory] = useState<HistoryItem[]>(() => loadHistoryFromStorage());
  const [isHistoryOpen, setIsHistoryOpen] = useState<boolean>(false);
  const [activeHistoryLabel, setActiveHistoryLabel] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const copyTimeoutRef = useRef<number | null>(null);
  const previewUrlRef = useRef<string | null>(null);

  // Sync dark mode class on <html> and persist in localStorage
  useEffect(() => {
    const root = document.documentElement;
    if (isDark) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, isDark ? 'dark' : 'light');
    } catch {
      // ignore
    }
  }, [isDark]);

  // Revoke object URL on unmount
  useEffect(() => {
    return () => {
      if (previewUrlRef.current) {
        URL.revokeObjectURL(previewUrlRef.current);
      }
      if (copyTimeoutRef.current) {
        window.clearTimeout(copyTimeoutRef.current);
      }
    };
  }, []);

  const addHistoryEntry = useCallback(
    (fileName: string, mode: ExtractionMode, extractedText: string) => {
      const entry: HistoryItem = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        fileName,
        mode,
        timestamp: Date.now(),
        extractedText,
      };
      setHistory((prev) => {
        const next = [entry, ...prev].slice(0, MAX_HISTORY_ITEMS);
        saveHistoryToStorage(next);
        return next;
      });
    },
    []
  );

  const runExtraction = useCallback(
    async (doc: DocumentFile, modeToRun: ExtractionMode) => {
      setIsExtracting(true);
      setErrorMessage(null);

      try {
        const base64Data = await fileToBase64(doc.file);
        const response = await fetch('/api/extract', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            base64Data,
            mimeType: doc.mimeType,
            mode: modeToRun,
          }),
        });

        const payload = (await response.json()) as { text?: string; error?: string };

        if (!response.ok) {
          throw new Error(
            payload.error || `Extraction failed with status ${response.status}.`
          );
        }

        const extracted = payload.text ?? '';
        setOutputText(extracted);
        setOutputMode(modeToRun);
        setLastExtractedFileKey(`${doc.name}-${doc.sizeBytes}`);
        setLastExtractedMode(modeToRun);
        setActiveHistoryLabel(null);
        setViewMode('preview');

        if (extracted.trim()) {
          addHistoryEntry(doc.name, modeToRun, extracted);
        }
      } catch (err: unknown) {
        const message =
          err instanceof Error
            ? err.message
            : 'Unable to extract text from this document. Please try again.';
        setErrorMessage(message);
      } finally {
        setIsExtracting(false);
      }
    },
    [addHistoryEntry]
  );

  const loadDocumentFile = useCallback(
    (file: File, options?: { autoExtractMode?: ExtractionMode }) => {
      const validation = validateDocumentFile(file);
      if (!validation.valid) {
        setErrorMessage(validation.error || 'Invalid document file.');
        return null;
      }

      if (previewUrlRef.current) {
        URL.revokeObjectURL(previewUrlRef.current);
      }

      const previewUrl = URL.createObjectURL(file);
      previewUrlRef.current = previewUrl;

      const doc: DocumentFile = {
        file,
        name: file.name || 'pasted-document.png',
        mimeType: file.type,
        sizeBytes: file.size,
        previewUrl,
        isPdf: file.type === 'application/pdf',
      };

      setDocumentFile(doc);
      setZoom(1);
      setErrorMessage(null);
      setActiveHistoryLabel(null);

      if (options?.autoExtractMode) {
        setSelectedMode(options.autoExtractMode);
        void runExtraction(doc, options.autoExtractMode);
      }

      return doc;
    },
    [runExtraction]
  );

  // Global clipboard paste handler (Ctrl+V / Cmd+V)
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (item.kind === 'file' && item.type.startsWith('image/')) {
          const file = item.getAsFile();
          if (file) {
            e.preventDefault();
            const ext = file.type.split('/')[1] || 'png';
            const namedFile = new File(
              [file],
              file.name && file.name !== 'image.png'
                ? file.name
                : `clipboard-scan-${Date.now()}.${ext}`,
              { type: file.type }
            );
            loadDocumentFile(namedFile);
            return;
          }
        }
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [loadDocumentFile]);

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      loadDocumentFile(file);
    }
    e.target.value = '';
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isDragging) setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      loadDocumentFile(file);
    }
  };

  const handleTrySampleReceipt = async () => {
    try {
      setErrorMessage(null);
      const file = await generateSampleReceiptImage();
      loadDocumentFile(file, { autoExtractMode: 'json' });
    } catch (err: unknown) {
      setErrorMessage(
        err instanceof Error ? err.message : 'Failed to generate sample receipt.'
      );
    }
  };

  const handleTrySampleNote = async () => {
    try {
      setErrorMessage(null);
      const file = await generateSampleNoteImage();
      loadDocumentFile(file, { autoExtractMode: 'handwriting' });
    } catch (err: unknown) {
      setErrorMessage(
        err instanceof Error ? err.message : 'Failed to generate sample note.'
      );
    }
  };

  const handleClearDocument = () => {
    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current);
      previewUrlRef.current = null;
    }
    setDocumentFile(null);
    setZoom(1);
    setLastExtractedFileKey(null);
    setLastExtractedMode(null);
  };

  const handleExtractClick = () => {
    if (!documentFile || isExtracting) return;
    void runExtraction(documentFile, selectedMode);
  };

  const handleCopyOutput = async () => {
    if (!outputText) return;
    try {
      await navigator.clipboard.writeText(outputText);
      setCopied(true);
      if (copyTimeoutRef.current) {
        window.clearTimeout(copyTimeoutRef.current);
      }
      copyTimeoutRef.current = window.setTimeout(() => {
        setCopied(false);
      }, 2000);
    } catch {
      setErrorMessage('Clipboard access was denied by your browser.');
    }
  };

  const handleSelectHistoryItem = (item: HistoryItem) => {
    setOutputText(item.extractedText);
    setSelectedMode(item.mode);
    setOutputMode(item.mode);
    setActiveHistoryLabel(item.fileName);
    setViewMode('preview');
    setErrorMessage(null);
  };

  const handleDeleteHistoryItem = (id: string) => {
    setHistory((prev) => {
      const next = prev.filter((item) => item.id !== id);
      saveHistoryToStorage(next);
      return next;
    });
  };

  const handleClearHistory = () => {
    setHistory([]);
    try {
      window.localStorage.removeItem(HISTORY_STORAGE_KEY);
    } catch {
      // ignore
    }
  };

  const stats = computeTextStats(outputText);
  const currentFileKey = documentFile
    ? `${documentFile.name}-${documentFile.sizeBytes}`
    : null;
  const hasAlreadyExtractedCurrent =
    Boolean(outputText) &&
    currentFileKey !== null &&
    lastExtractedFileKey === currentFileKey;
  const isReExtract =
    hasAlreadyExtractedCurrent ||
    (Boolean(outputText) && lastExtractedMode !== null && documentFile !== null);

  const activeModeObj = EXTRACTION_MODES.find((m) => m.id === selectedMode)!;
  const outputModeLabel =
    EXTRACTION_MODES.find((m) => m.id === outputMode)?.label ?? 'Plain Text';

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC] dark:bg-[#0B0F19] text-[#131B2E] dark:text-[#F1F5F9] transition-colors">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-30 border-b border-[#E2E8F0] dark:border-[#1E293B] bg-white/95 dark:bg-[#111827]/95 backdrop-blur-sm">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="h-8 w-8 rounded-md bg-[#4F46E5] text-white flex items-center justify-center shrink-0">
              <ScanText className="h-4 w-4" />
            </div>
            <span className="text-[15px] sm:text-base font-semibold tracking-tight text-[#131B2E] dark:text-[#F1F5F9] whitespace-nowrap shrink-0">
              Nivet&apos;s DocuScan AI
            </span>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setIsHistoryOpen(true)}
              className="h-9 px-3 rounded-md border border-[#E2E8F0] dark:border-[#1E293B] bg-white dark:bg-[#0B0F19] hover:bg-slate-50 dark:hover:bg-slate-800/70 text-xs font-medium text-[#131B2E] dark:text-[#F1F5F9] flex items-center gap-2 transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4F46E5]"
            >
              <History className="h-3.5 w-3.5 text-[#464555] dark:text-slate-400" />
              <span>History</span>
              <span className="font-mono tabular-nums text-[#464555] dark:text-slate-400">
                ({history.length})
              </span>
            </button>

            <button
              type="button"
              onClick={() => setIsDark((prev) => !prev)}
              aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
              title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
              className="h-9 w-9 rounded-md border border-[#E2E8F0] dark:border-[#1E293B] bg-white dark:bg-[#0B0F19] hover:bg-slate-50 dark:hover:bg-slate-800/70 flex items-center justify-center text-[#464555] dark:text-slate-300 transition-colors shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4F46E5]"
            >
              {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
          </div>
        </div>
      </header>

      {/* Main Split-Screen Workspace */}
      <main className="flex-1 max-w-[1440px] w-full mx-auto px-4 sm:px-6 py-5 flex flex-col gap-4">
        {/* Error Banner */}
        {errorMessage && (
          <div
            role="alert"
            className="rounded-lg border border-rose-200 dark:border-rose-900/60 bg-rose-50 dark:bg-rose-950/40 px-4 py-3 flex items-start justify-between gap-3"
          >
            <div className="flex items-start gap-2.5 min-w-0">
              <AlertCircle className="h-4 w-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
              <p className="text-sm text-rose-800 dark:text-rose-200 leading-snug">
                {errorMessage}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setErrorMessage(null)}
              aria-label="Dismiss error"
              className="text-rose-600 dark:text-rose-400 hover:text-rose-800 dark:hover:text-rose-200 p-0.5 cursor-pointer shrink-0"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* Hidden File Input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp,application/pdf"
          onChange={handleFileInputChange}
          className="hidden"
          aria-label="Upload document"
        />

        {/* 50/50 Split Grid */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-5 items-stretch">
          {/* LEFT PANE: Mode Selector, Document Dropzone / Preview, Extract CTA */}
          <section
            aria-label="Document input and preview"
            className="rounded-xl border border-[#E2E8F0] dark:border-[#1E293B] bg-white dark:bg-[#111827] flex flex-col overflow-hidden min-h-[560px] lg:min-h-[680px]"
          >
            {/* Mode Selector Header */}
            <div className="p-4 border-b border-[#E2E8F0] dark:border-[#1E293B] space-y-2.5">
              <div className="flex items-center justify-between gap-2">
                <h1 className="text-xs font-semibold uppercase tracking-wider text-[#464555] dark:text-slate-400">
                  Extraction Mode
                </h1>
                <span className="text-xs text-[#464555] dark:text-slate-400 hidden sm:inline truncate">
                  {activeModeObj.description}
                </span>
              </div>

              <div
                role="tablist"
                aria-label="Extraction modes"
                className="grid grid-cols-2 sm:grid-cols-4 gap-1 p-1 rounded-lg bg-[#F8FAFC] dark:bg-[#0B0F19] border border-[#E2E8F0] dark:border-[#1E293B]"
              >
                {EXTRACTION_MODES.map((mode) => {
                  const isActive = selectedMode === mode.id;
                  return (
                    <button
                      key={mode.id}
                      type="button"
                      role="tab"
                      aria-selected={isActive}
                      onClick={() => setSelectedMode(mode.id)}
                      className={`px-2.5 py-2 rounded-md text-xs font-medium transition-colors whitespace-nowrap truncate cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4F46E5] ${
                        isActive
                          ? 'bg-[#4F46E5] text-white'
                          : 'text-[#464555] dark:text-slate-300 hover:text-[#131B2E] dark:hover:text-white hover:bg-white/70 dark:hover:bg-slate-800/60'
                      }`}
                    >
                      {mode.shortLabel}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Dropzone or Active Viewer */}
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className="flex-1 flex flex-col min-h-0 relative"
            >
              {!documentFile ? (
                <div
                  className={`flex-1 m-4 rounded-lg border border-dashed transition-colors flex flex-col items-center justify-center px-6 py-10 text-center ${
                    isDragging
                      ? 'border-[#4F46E5] bg-[#4F46E5]/5 dark:bg-[#4F46E5]/10'
                      : 'border-[#CBD5E1] dark:border-[#334155] bg-[#F8FAFC]/60 dark:bg-[#0B0F19]/40'
                  }`}
                >
                  <div className="h-12 w-12 rounded-lg border border-[#E2E8F0] dark:border-[#1E293B] bg-white dark:bg-[#111827] flex items-center justify-center mb-4">
                    <Upload className="h-5 w-5 text-[#4F46E5] dark:text-[#818CF8]" />
                  </div>

                  <h2 className="text-base font-semibold text-[#131B2E] dark:text-[#F1F5F9]">
                    Drop a document or paste a screenshot
                  </h2>
                  <p className="mt-1.5 text-sm text-[#464555] dark:text-slate-400 max-w-sm leading-relaxed">
                    Supports PNG, JPG, WEBP, and PDF up to 15 MB. Press{' '}
                    <kbd className="px-1.5 py-0.5 rounded border border-[#E2E8F0] dark:border-[#1E293B] bg-white dark:bg-[#111827] font-mono text-[11px] text-[#131B2E] dark:text-slate-200">
                      Ctrl+V
                    </kbd>{' '}
                    or{' '}
                    <kbd className="px-1.5 py-0.5 rounded border border-[#E2E8F0] dark:border-[#1E293B] bg-white dark:bg-[#111827] font-mono text-[11px] text-[#131B2E] dark:text-slate-200">
                      Cmd+V
                    </kbd>{' '}
                    anywhere to paste.
                  </p>

                  <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="px-4 py-2 rounded-md border border-[#E2E8F0] dark:border-[#1E293B] bg-white dark:bg-[#111827] hover:bg-slate-50 dark:hover:bg-slate-800 text-sm font-medium text-[#131B2E] dark:text-[#F1F5F9] flex items-center gap-2 transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4F46E5]"
                    >
                      <FileText className="h-4 w-4 text-[#4F46E5] dark:text-[#818CF8]" />
                      <span>Choose File</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleTrySampleReceipt}
                      disabled={isExtracting}
                      className="px-4 py-2 rounded-md bg-[#4F46E5] hover:bg-[#4338CA] disabled:opacity-60 text-sm font-medium text-white flex items-center gap-2 transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4F46E5] focus-visible:ring-offset-2 dark:focus-visible:ring-offset-[#111827]"
                    >
                      <Sparkles className="h-4 w-4" />
                      <span>Try with Sample Receipt</span>
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={handleTrySampleNote}
                    disabled={isExtracting}
                    className="mt-3 text-xs font-medium text-[#464555] dark:text-slate-400 hover:text-[#4F46E5] dark:hover:text-[#818CF8] flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <NotebookPen className="h-3.5 w-3.5" />
                    <span>Or test with a sample handwritten note</span>
                  </button>
                </div>
              ) : (
                <div className="flex-1 flex flex-col min-h-0">
                  {/* Preview Controls Bar */}
                  <div className="px-4 py-2.5 border-b border-[#E2E8F0] dark:border-[#1E293B] bg-[#F8FAFC] dark:bg-[#0B0F19]/60 flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-xs font-medium text-[#131B2E] dark:text-[#F1F5F9] truncate max-w-[170px] sm:max-w-[230px]">
                        {documentFile.name}
                      </span>
                      <span aria-hidden="true" className="text-slate-400 text-xs">
                        ·
                      </span>
                      <span className="text-xs font-mono tabular-nums text-[#464555] dark:text-slate-400 whitespace-nowrap">
                        {formatFileSize(documentFile.sizeBytes)}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {!documentFile.isPdf && (
                        <div className="flex items-center rounded-md border border-[#E2E8F0] dark:border-[#1E293B] bg-white dark:bg-[#111827] mr-1">
                          <button
                            type="button"
                            onClick={() =>
                              setZoom((z) => Math.max(0.5, Number((z - 0.25).toFixed(2))))
                            }
                            disabled={zoom <= 0.5}
                            aria-label="Zoom out"
                            className="h-7 w-7 flex items-center justify-center text-[#464555] dark:text-slate-300 hover:text-[#131B2E] dark:hover:text-white disabled:opacity-40 cursor-pointer"
                          >
                            <ZoomOut className="h-3.5 w-3.5" />
                          </button>
                          <span className="px-1.5 font-mono tabular-nums text-[11px] text-[#131B2E] dark:text-[#F1F5F9] min-w-[44px] text-center">
                            {Math.round(zoom * 100)}%
                          </span>
                          <button
                            type="button"
                            onClick={() =>
                              setZoom((z) => Math.min(2.0, Number((z + 0.25).toFixed(2))))
                            }
                            disabled={zoom >= 2.0}
                            aria-label="Zoom in"
                            className="h-7 w-7 flex items-center justify-center text-[#464555] dark:text-slate-300 hover:text-[#131B2E] dark:hover:text-white disabled:opacity-40 cursor-pointer"
                          >
                            <ZoomIn className="h-3.5 w-3.5" />
                          </button>
                          {zoom !== 1 && (
                            <button
                              type="button"
                              onClick={() => setZoom(1)}
                              aria-label="Reset zoom"
                              title="Reset zoom to 100%"
                              className="h-7 px-1.5 border-l border-[#E2E8F0] dark:border-[#1E293B] text-[11px] text-[#464555] dark:text-slate-300 hover:text-[#131B2E] dark:hover:text-white flex items-center cursor-pointer"
                            >
                              <RotateCcw className="h-3 w-3" />
                            </button>
                          )}
                        </div>
                      )}

                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="h-7 px-2.5 rounded-md border border-[#E2E8F0] dark:border-[#1E293B] bg-white dark:bg-[#111827] hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-medium text-[#131B2E] dark:text-[#F1F5F9] transition-colors whitespace-nowrap cursor-pointer"
                      >
                        Replace File
                      </button>

                      <button
                        type="button"
                        onClick={handleClearDocument}
                        aria-label="Clear uploaded file"
                        title="Clear uploaded file"
                        className="h-7 w-7 rounded-md border border-[#E2E8F0] dark:border-[#1E293B] bg-white dark:bg-[#111827] hover:bg-rose-50 dark:hover:bg-rose-950/40 hover:text-rose-600 dark:hover:text-rose-400 flex items-center justify-center text-[#464555] dark:text-slate-400 transition-colors cursor-pointer"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Scrollable Preview Viewport */}
                  <div className="flex-1 overflow-auto bg-[#F1F5F9] dark:bg-[#0B0F19] p-4 flex justify-center items-start min-h-[340px] max-h-[540px]">
                    {documentFile.isPdf ? (
                      <iframe
                        src={documentFile.previewUrl}
                        title={documentFile.name}
                        className="w-full h-[480px] rounded-lg border border-[#E2E8F0] dark:border-[#1E293B] bg-white"
                      />
                    ) : (
                      <div className="inline-block origin-top transition-transform duration-150">
                        <img
                          src={documentFile.previewUrl}
                          alt={documentFile.name}
                          referrerPolicy="no-referrer"
                          style={{
                            transform: `scale(${zoom})`,
                            transformOrigin: 'top center',
                          }}
                          className="max-w-full rounded-md border border-[#E2E8F0] dark:border-[#1E293B] bg-white"
                        />
                      </div>
                    )}
                  </div>

                  {/* Drag overlay when replacing via drop */}
                  {isDragging && (
                    <div className="absolute inset-0 bg-[#4F46E5]/10 backdrop-blur-[1px] border-2 border-dashed border-[#4F46E5] m-2 rounded-lg flex items-center justify-center pointer-events-none">
                      <div className="px-4 py-2 rounded-md bg-white dark:bg-[#111827] border border-[#E2E8F0] dark:border-[#1E293B] text-sm font-medium text-[#3525CD] dark:text-[#C3C0FF]">
                        Drop to replace active document
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Bottom Primary CTA */}
            <div className="p-4 border-t border-[#E2E8F0] dark:border-[#1E293B] bg-white dark:bg-[#111827]">
              <button
                type="button"
                onClick={handleExtractClick}
                disabled={!documentFile || isExtracting}
                className="w-full h-11 px-5 rounded-lg bg-[#4F46E5] hover:bg-[#4338CA] disabled:bg-slate-200 dark:disabled:bg-slate-800 disabled:text-slate-400 dark:disabled:text-slate-500 text-white text-sm font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4F46E5] focus-visible:ring-offset-2 dark:focus-visible:ring-offset-[#111827]"
              >
                {isExtracting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Analyzing document layout...</span>
                  </>
                ) : isReExtract ? (
                  <>
                    <RefreshCw className="h-4 w-4" />
                    <span>Re-Extract with {activeModeObj.shortLabel}</span>
                  </>
                ) : (
                  <>
                    <ScanText className="h-4 w-4" />
                    <span>Extract Text</span>
                  </>
                )}
              </button>
            </div>
          </section>

          {/* RIGHT PANE: Output Toolbar, Formatted / Raw View, Telemetry Footer */}
          <section
            aria-label="Extracted output and export"
            className="rounded-xl border border-[#E2E8F0] dark:border-[#1E293B] bg-white dark:bg-[#111827] flex flex-col overflow-hidden min-h-[560px] lg:min-h-[680px]"
          >
            {/* Top Action Bar */}
            <div className="p-3 sm:px-4 sm:py-3 border-b border-[#E2E8F0] dark:border-[#1E293B] flex flex-wrap items-center justify-between gap-2.5">
              {/* View Toggle */}
              <div
                role="tablist"
                aria-label="Output view mode"
                className="inline-flex items-center p-0.5 rounded-lg bg-[#F8FAFC] dark:bg-[#0B0F19] border border-[#E2E8F0] dark:border-[#1E293B]"
              >
                <button
                  type="button"
                  role="tab"
                  aria-selected={viewMode === 'preview'}
                  onClick={() => setViewMode('preview')}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    viewMode === 'preview'
                      ? 'bg-white dark:bg-[#111827] text-[#131B2E] dark:text-[#F1F5F9] border border-[#E2E8F0] dark:border-[#1E293B]'
                      : 'text-[#464555] dark:text-slate-400 hover:text-[#131B2E] dark:hover:text-white border border-transparent'
                  }`}
                >
                  <Eye className="h-3.5 w-3.5" />
                  <span>Formatted Preview</span>
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={viewMode === 'raw'}
                  onClick={() => setViewMode('raw')}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    viewMode === 'raw'
                      ? 'bg-white dark:bg-[#111827] text-[#131B2E] dark:text-[#F1F5F9] border border-[#E2E8F0] dark:border-[#1E293B]'
                      : 'text-[#464555] dark:text-slate-400 hover:text-[#131B2E] dark:hover:text-white border border-transparent'
                  }`}
                >
                  <Code2 className="h-3.5 w-3.5" />
                  <span>Raw / Edit</span>
                </button>
              </div>

              {/* Quick Export Actions */}
              <div className="flex items-center gap-1.5 flex-wrap">
                <button
                  type="button"
                  onClick={handleCopyOutput}
                  disabled={!outputText || isExtracting}
                  className="h-8 px-2.5 rounded-md border border-[#E2E8F0] dark:border-[#1E293B] bg-white dark:bg-[#0B0F19] hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40 text-xs font-medium text-[#131B2E] dark:text-[#F1F5F9] flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 cursor-pointer disabled:cursor-not-allowed"
                >
                  {copied ? (
                    <>
                      <Check className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                      <span className="text-emerald-600 dark:text-emerald-400">
                        Copied!
                      </span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-3.5 w-3.5 text-[#464555] dark:text-slate-400" />
                      <span>Copy</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() =>
                    downloadTextFile(outputText, 'extracted-doc.txt', 'text/plain')
                  }
                  disabled={!outputText || isExtracting}
                  title="Download as extracted-doc.txt"
                  className="h-8 px-2.5 rounded-md border border-[#E2E8F0] dark:border-[#1E293B] bg-white dark:bg-[#0B0F19] hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40 text-xs font-mono font-medium text-[#131B2E] dark:text-[#F1F5F9] flex items-center gap-1 transition-colors whitespace-nowrap shrink-0 cursor-pointer disabled:cursor-not-allowed"
                >
                  <Download className="h-3 w-3 text-[#464555] dark:text-slate-400" />
                  <span>.txt</span>
                </button>

                <button
                  type="button"
                  onClick={() =>
                    downloadTextFile(outputText, 'extracted-doc.md', 'text/markdown')
                  }
                  disabled={!outputText || isExtracting}
                  title="Download as extracted-doc.md"
                  className="h-8 px-2.5 rounded-md border border-[#E2E8F0] dark:border-[#1E293B] bg-white dark:bg-[#0B0F19] hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40 text-xs font-mono font-medium text-[#131B2E] dark:text-[#F1F5F9] flex items-center gap-1 transition-colors whitespace-nowrap shrink-0 cursor-pointer disabled:cursor-not-allowed"
                >
                  <Download className="h-3 w-3 text-[#464555] dark:text-slate-400" />
                  <span>.md</span>
                </button>

                <button
                  type="button"
                  onClick={() =>
                    downloadTextFile(outputText, 'extracted-doc.json', 'application/json')
                  }
                  disabled={!outputText || isExtracting}
                  title="Download as extracted-doc.json"
                  className="h-8 px-2.5 rounded-md border border-[#E2E8F0] dark:border-[#1E293B] bg-white dark:bg-[#0B0F19] hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40 text-xs font-mono font-medium text-[#131B2E] dark:text-[#F1F5F9] flex items-center gap-1 transition-colors whitespace-nowrap shrink-0 cursor-pointer disabled:cursor-not-allowed"
                >
                  <Download className="h-3 w-3 text-[#464555] dark:text-slate-400" />
                  <span>.json</span>
                </button>
              </div>
            </div>

            {/* Restored History Context Notice (clean inline text, no pill) */}
            {activeHistoryLabel && !isExtracting && (
              <div className="px-5 py-2 border-b border-[#E2E8F0] dark:border-[#1E293B] bg-slate-50/70 dark:bg-[#0B0F19]/50 flex items-center justify-between gap-2 text-xs text-[#464555] dark:text-slate-400">
                <span className="truncate">
                  Loaded from session history: <strong className="font-medium text-[#131B2E] dark:text-[#F1F5F9]">{activeHistoryLabel}</strong>
                </span>
                <button
                  type="button"
                  onClick={() => setActiveHistoryLabel(null)}
                  className="text-xs hover:text-[#131B2E] dark:hover:text-white cursor-pointer shrink-0"
                >
                  Dismiss
                </button>
              </div>
            )}

            {/* Main Output Area */}
            <div className="flex-1 min-h-0 flex flex-col">
              {isExtracting ? (
                <div className="flex-1 p-6 flex flex-col justify-center space-y-5">
                  <div className="flex items-center gap-2.5 text-sm font-medium text-[#3525CD] dark:text-[#C3C0FF]">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Analyzing document layout...</span>
                  </div>
                  <div className="space-y-3 animate-pulse">
                    <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-3/4" />
                    <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-full" />
                    <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-5/6" />
                    <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-2/3" />
                    <div className="pt-2 h-24 bg-slate-100 dark:bg-slate-800/60 rounded-lg border border-[#E2E8F0] dark:border-[#1E293B]" />
                    <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-4/5" />
                    <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-1/2" />
                  </div>
                </div>
              ) : !outputText ? (
                <div className="flex-1 p-8 flex flex-col items-center justify-center text-center">
                  <div className="h-11 w-11 rounded-lg border border-[#E2E8F0] dark:border-[#1E293B] bg-[#F8FAFC] dark:bg-[#0B0F19] flex items-center justify-center mb-3.5">
                    <FileText className="h-5 w-5 text-slate-400" />
                  </div>
                  <h3 className="text-sm font-semibold text-[#131B2E] dark:text-[#F1F5F9]">
                    Ready for extraction
                  </h3>
                  <p className="mt-1.5 text-xs text-[#464555] dark:text-slate-400 max-w-[36ch] leading-relaxed">
                    Upload an image or PDF on the left and click Extract Text, or click Try with Sample Receipt to inspect live OCR output.
                  </p>
                </div>
              ) : viewMode === 'raw' ? (
                <textarea
                  value={outputText}
                  onChange={(e) => setOutputText(e.target.value)}
                  aria-label="Editable extracted text"
                  spellCheck={outputMode !== 'json'}
                  className="flex-1 w-full h-full min-h-[380px] p-5 bg-transparent resize-none font-mono text-[13px] leading-[1.65] text-[#131B2E] dark:text-[#F1F5F9] focus:outline-none"
                />
              ) : (
                <div className="flex-1 overflow-y-auto p-5 sm:p-6">
                  {outputMode === 'json' ? (
                    <ReceiptSummaryCard
                      rawJson={outputText}
                      onSwitchToRaw={() => setViewMode('raw')}
                    />
                  ) : outputMode === 'plain' ? (
                    <div className="space-y-4 max-w-[68ch]">
                      {outputText.split(/\n{2,}/).map((para, idx) => (
                        <p
                          key={idx}
                          className="text-[14px] leading-[1.7] text-[#131B2E] dark:text-slate-200 whitespace-pre-wrap"
                        >
                          {para}
                        </p>
                      ))}
                    </div>
                  ) : (
                    <MarkdownRenderer content={outputText} />
                  )}
                </div>
              )}
            </div>

            {/* Bottom Live Telemetry Status Bar */}
            <div className="px-4 py-2.5 border-t border-[#E2E8F0] dark:border-[#1E293B] bg-[#F8FAFC] dark:bg-[#0B0F19]/60 flex flex-wrap items-center justify-between gap-2 text-xs text-[#464555] dark:text-slate-400">
              <div className="flex flex-wrap items-center gap-2 font-mono tabular-nums">
                <span>Words: {stats.words}</span>
                <span aria-hidden="true">·</span>
                <span>Characters: {stats.characters}</span>
                <span aria-hidden="true">·</span>
                <span>
                  Read time: {stats.readingMinutes} min
                </span>
              </div>
              <div className="text-xs font-medium text-[#131B2E] dark:text-slate-300 truncate">
                {outputText ? outputModeLabel : activeModeObj.label}
              </div>
            </div>
          </section>
        </div>
      </main>

      {/* Session History Drawer */}
      <HistoryDrawer
        isOpen={isHistoryOpen}
        items={history}
        onClose={() => setIsHistoryOpen(false)}
        onSelectItem={handleSelectHistoryItem}
        onDeleteItem={handleDeleteHistoryItem}
        onClearAll={handleClearHistory}
      />
    </div>
  );
}
