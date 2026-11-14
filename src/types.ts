export type ExtractionMode = 'plain' | 'markdown' | 'handwriting' | 'json';

export type ViewMode = 'preview' | 'raw';

export interface DocumentFile {
  file: File;
  name: string;
  mimeType: string;
  sizeBytes: number;
  previewUrl: string;
  isPdf: boolean;
}

export interface ReceiptLineItem {
  description?: string;
  quantity?: number;
  unitPrice?: number;
  total?: number;
}

export interface ReceiptData {
  merchantName: string;
  date?: string;
  currency?: string;
  lineItems: ReceiptLineItem[];
  subtotal?: number;
  tax?: number;
  totalAmount: number;
}

export interface HistoryItem {
  id: string;
  fileName: string;
  mode: ExtractionMode;
  timestamp: number;
  extractedText: string;
}

export interface ModeDefinition {
  id: ExtractionMode;
  label: string;
  shortLabel: string;
  description: string;
}

export const EXTRACTION_MODES: ModeDefinition[] = [
  {
    id: 'plain',
    label: 'Clean Plain Text',
    shortLabel: 'Plain Text',
    description: 'Reconstructs broken column wraps into natural paragraphs.',
  },
  {
    id: 'markdown',
    label: 'Tables & Layout',
    shortLabel: 'Markdown',
    description: 'Preserves headings, bullet lists, and GFM tables.',
  },
  {
    id: 'handwriting',
    label: 'Handwriting & Notes',
    shortLabel: 'Handwriting',
    description: 'Deciphers cursive notes, whiteboards, and annotations.',
  },
  {
    id: 'json',
    label: 'Receipt / Invoice JSON',
    shortLabel: 'Receipt JSON',
    description: 'Extracts structured merchant, line items, tax, and totals.',
  },
];
