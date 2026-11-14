export const MAX_FILE_SIZE_BYTES = 15 * 1024 * 1024; // 15 MB

export const SUPPORTED_MIME_TYPES = new Set([
  'image/png',
  'image/jpeg',
  'image/webp',
  'application/pdf',
]);

export interface FileValidationResult {
  valid: boolean;
  error?: string;
}

export function validateDocumentFile(file: File): FileValidationResult {
  if (!SUPPORTED_MIME_TYPES.has(file.type)) {
    return {
      valid: false,
      error: `Unsupported file type (${file.type || 'unknown'}). Drop a PNG, JPG, WEBP, or PDF document.`,
    };
  }

  if (file.size > MAX_FILE_SIZE_BYTES) {
    const sizeMb = (file.size / (1024 * 1024)).toFixed(1);
    return {
      valid: false,
      error: `File size (${sizeMb} MB) exceeds the 15 MB limit. Please compress or split the document.`,
    };
  }

  return { valid: true };
}

export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result;
      if (typeof result !== 'string') {
        reject(new Error('Failed to read file contents.'));
        return;
      }
      const commaIndex = result.indexOf(',');
      const base64 = commaIndex >= 0 ? result.slice(commaIndex + 1) : result;
      resolve(base64);
    };
    reader.onerror = () => reject(new Error('Unable to read the selected file.'));
    reader.readAsDataURL(file);
  });
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export function computeTextStats(text: string): {
  words: number;
  characters: number;
  readingMinutes: number;
} {
  const trimmed = text.trim();
  if (!trimmed) {
    return { words: 0, characters: 0, readingMinutes: 0 };
  }
  const words = trimmed.split(/\s+/).filter(Boolean).length;
  const characters = text.length;
  const readingMinutes = Math.max(1, Math.ceil(words / 200));
  return { words, characters, readingMinutes };
}

export function downloadTextFile(
  content: string,
  filename: 'extracted-doc.txt' | 'extracted-doc.md' | 'extracted-doc.json',
  mimeType: string
): void {
  const blob = new Blob([content], { type: `${mimeType};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
