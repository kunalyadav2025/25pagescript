import * as FileSystem from 'expo-file-system';
import { PDFDocument } from 'pdf-lib';

const MAX_PAGES = 25;
const MAX_FILE_SIZE_MB = 10;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

export interface PDFValidationResult {
  valid: boolean;
  pageCount: number;
  fileSize: number;
  error?: string;
}

/**
 * Validate a PDF file for upload
 * - Checks page count (max 25 pages)
 * - Checks file size (max 10MB)
 */
export async function validatePDF(fileUri: string): Promise<PDFValidationResult> {
  try {
    // Get file info
    const fileInfo = await FileSystem.getInfoAsync(fileUri);

    if (!fileInfo.exists) {
      return {
        valid: false,
        pageCount: 0,
        fileSize: 0,
        error: 'File does not exist',
      };
    }

    const fileSize = fileInfo.size || 0;

    // Check file size
    if (fileSize > MAX_FILE_SIZE_BYTES) {
      return {
        valid: false,
        pageCount: 0,
        fileSize,
        error: `File size exceeds ${MAX_FILE_SIZE_MB}MB limit`,
      };
    }

    // Read file as base64
    const base64Content = await FileSystem.readAsStringAsync(fileUri, {
      encoding: FileSystem.EncodingType.Base64,
    });

    // Convert base64 to Uint8Array (React Native compatible)
    const base64ToBytes = (base64: string): Uint8Array => {
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
      const lookup = new Uint8Array(256);
      for (let i = 0; i < chars.length; i++) {
        lookup[chars.charCodeAt(i)] = i;
      }

      let bufferLength = base64.length * 0.75;
      if (base64[base64.length - 1] === '=') bufferLength--;
      if (base64[base64.length - 2] === '=') bufferLength--;

      const bytes = new Uint8Array(bufferLength);
      let p = 0;

      for (let i = 0; i < base64.length; i += 4) {
        const encoded1 = lookup[base64.charCodeAt(i)];
        const encoded2 = lookup[base64.charCodeAt(i + 1)];
        const encoded3 = lookup[base64.charCodeAt(i + 2)];
        const encoded4 = lookup[base64.charCodeAt(i + 3)];

        bytes[p++] = (encoded1 << 2) | (encoded2 >> 4);
        bytes[p++] = ((encoded2 & 15) << 4) | (encoded3 >> 2);
        bytes[p++] = ((encoded3 & 3) << 6) | (encoded4 & 63);
      }

      return bytes;
    };

    const bytes = base64ToBytes(base64Content);

    // Load PDF and count pages
    const pdfDoc = await PDFDocument.load(bytes, {
      ignoreEncryption: true,
    });

    const pageCount = pdfDoc.getPageCount();

    // Check page count
    if (pageCount > MAX_PAGES) {
      return {
        valid: false,
        pageCount,
        fileSize,
        error: `Script exceeds ${MAX_PAGES} pages (has ${pageCount} pages)`,
      };
    }

    if (pageCount === 0) {
      return {
        valid: false,
        pageCount,
        fileSize,
        error: 'PDF has no pages',
      };
    }

    return {
      valid: true,
      pageCount,
      fileSize,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';

    // Handle common PDF errors
    if (message.includes('encrypted')) {
      return {
        valid: false,
        pageCount: 0,
        fileSize: 0,
        error: 'Cannot process encrypted PDF files',
      };
    }

    if (message.includes('Invalid PDF')) {
      return {
        valid: false,
        pageCount: 0,
        fileSize: 0,
        error: 'Invalid PDF file format',
      };
    }

    return {
      valid: false,
      pageCount: 0,
      fileSize: 0,
      error: `Failed to validate PDF: ${message}`,
    };
  }
}

/**
 * Read PDF file as base64 for upload
 */
export async function readPDFAsBase64(fileUri: string): Promise<string> {
  return FileSystem.readAsStringAsync(fileUri, {
    encoding: FileSystem.EncodingType.Base64,
  });
}

/**
 * Format file size for display
 */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) {
    return `${bytes} B`;
  }
  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
