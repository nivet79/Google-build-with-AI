import 'dotenv/config';
import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { GoogleGenAI, Type } from '@google/genai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT) || 3000;
const isProduction = process.env.NODE_ENV === 'production';

type ExtractionMode = 'plain' | 'markdown' | 'handwriting' | 'json';

interface ExtractRequestBody {
  base64Data?: string;
  mimeType?: string;
  mode?: ExtractionMode;
}

const ALLOWED_MIME_TYPES = new Set([
  'image/png',
  'image/jpeg',
  'image/webp',
  'application/pdf',
]);

const MODE_PROMPTS: Record<ExtractionMode, string> = {
  plain:
    'Extract all readable text from this document accurately. Reconstruct broken line wraps and hyphenations from scanned columns into smooth, natural paragraphs. Preserve paragraph breaks, remove stray OCR artifacts, and return ONLY the extracted plain text without conversational filler.',
  markdown:
    'Extract all text and structural layout from this document into clean GitHub Flavored Markdown. Convert any tables, invoices, forms, or aligned columns into valid Markdown tables (`| col | col |`). Use appropriate Markdown headings (`#`, `##`), bullet lists, and bold key-value pairs (`**Key:** Value`). Return ONLY the Markdown content.',
  handwriting:
    'Carefully transcribe all handwritten text, cursive writing, whiteboard notes, or annotations in this image/document. Use surrounding context to accurately decipher messy or ambiguous words, preserve bullet hierarchies, diagrams-as-lists, and underlined headings, and output clean, well-organized text/Markdown. Return ONLY the transcription.',
  json:
    'Extract all receipt or invoice fields from this document into structured JSON matching the provided schema. Ensure numeric quantities, unit prices, item totals, subtotal, tax, and totalAmount are numbers, and include the currency code or symbol.',
};

const RECEIPT_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    merchantName: { type: Type.STRING },
    date: { type: Type.STRING },
    currency: { type: Type.STRING },
    lineItems: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          description: { type: Type.STRING },
          quantity: { type: Type.NUMBER },
          unitPrice: { type: Type.NUMBER },
          total: { type: Type.NUMBER },
        },
      },
    },
    subtotal: { type: Type.NUMBER },
    tax: { type: Type.NUMBER },
    totalAmount: { type: Type.NUMBER },
  },
  required: ['merchantName', 'lineItems', 'totalAmount'],
};

async function startServer() {
  const app = express();

  // 25MB limit accommodates 15MB binary files encoded as base64 (~20MB)
  app.use(express.json({ limit: '25mb' }));

  app.post('/api/extract', async (req, res) => {
    try {
      const { base64Data, mimeType, mode } = (req.body || {}) as ExtractRequestBody;

      if (!base64Data || typeof base64Data !== 'string') {
        res.status(400).json({ error: 'Missing document payload.' });
        return;
      }

      if (!mimeType || !ALLOWED_MIME_TYPES.has(mimeType)) {
        res.status(400).json({
          error: 'Unsupported file format. Please upload PNG, JPG, WEBP, or PDF.',
        });
        return;
      }

      if (!mode || !(mode in MODE_PROMPTS)) {
        res.status(400).json({ error: 'Invalid extraction mode selected.' });
        return;
      }

      const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY;
      if (!apiKey) {
        res.status(500).json({
          error:
            'Gemini API key is not configured. Please check your environment secrets in Settings > Secrets.',
        });
        return;
      }

      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          },
        },
      });

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: {
          parts: [
            {
              inlineData: {
                mimeType,
                data: base64Data,
              },
            },
            {
              text: MODE_PROMPTS[mode],
            },
          ],
        },
        ...(mode === 'json'
          ? {
              config: {
                responseMimeType: 'application/json',
                responseSchema: RECEIPT_SCHEMA,
              },
            }
          : {}),
      });

      const rawText = (response.text ?? '').trim();
      if (!rawText) {
        res.status(502).json({
          error: 'No readable text could be extracted from this document.',
        });
        return;
      }

      let formattedText = rawText;
      if (mode === 'json') {
        try {
          const parsed = JSON.parse(rawText);
          formattedText = JSON.stringify(parsed, null, 2);
        } catch {
          formattedText = rawText;
        }
      }

      res.json({ text: formattedText });
    } catch (error: unknown) {
      const errObj = error as { status?: number; message?: string };
      const message =
        errObj?.message || 'An unexpected error occurred while processing the document.';

      if (message.includes('API_KEY_INVALID') || errObj?.status === 400) {
        res.status(400).json({
          error:
            'Gemini request was rejected. Verify that the document is valid and your API key is active in Settings > Secrets.',
        });
        return;
      }

      if (message.includes('PERMISSION_DENIED') || errObj?.status === 403) {
        res.status(403).json({
          error:
            'Permission denied by Gemini API. Please verify your API key in Settings > Secrets.',
        });
        return;
      }

      if (message.includes('RESOURCE_EXHAUSTED') || errObj?.status === 429) {
        res.status(429).json({
          error: 'Rate limit reached. Please wait a moment and try extracting again.',
        });
        return;
      }

      res.status(errObj?.status && errObj.status >= 400 ? errObj.status : 500).json({
        error: message,
      });
    }
  });

  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(__dirname, 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Nivet's DocuScan AI running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
