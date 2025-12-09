/**
 * Video Streaming API Route
 *
 * Handles video file streaming by redirecting to Vercel Blob public URLs.
 * Vercel Blob automatically handles range requests for efficient video playback.
 *
 * GET /api/videos/[fileName]
 * - Redirects to Vercel Blob public URL
 * - Validates filenames to prevent path traversal
 * - Vercel Blob handles caching, range requests, and streaming
 */

import { NextRequest, NextResponse } from 'next/server';
import { head } from '@vercel/blob';

/**
 * Validate filename to prevent path traversal attacks
 *
 * Security function that blocks dangerous patterns:
 * - Path traversal: ../, ..\
 * - Absolute paths: /, \
 * - Allows: Unicode characters (including Hebrew), spaces, dash, underscore, dot
 *
 * @param fileName - Filename to validate
 * @returns true if filename is safe, false otherwise
 */
function isValidFileName(fileName: string): boolean {
  // Block path traversal and absolute paths
  if (
    fileName.includes('..') ||
    fileName.includes('/') ||
    fileName.includes('\\') ||
    fileName.startsWith('.') ||
    fileName.includes('\0') // Null byte injection
  ) {
    return false;
  }

  // Allow Unicode characters (including Hebrew), spaces, alphanumeric, dash, underscore, and dot
  // Block only dangerous filesystem characters (but allow all Unicode including Hebrew quotes)
  // Only block: < > : " | ? * and control characters
  const invalidChars = /[<>:"|?*\x00-\x1F]/;
  // But allow Hebrew and other Unicode characters by checking ASCII range only
  const asciiOnly = fileName.replace(/[^\x00-\x7F]/g, '');
  if (invalidChars.test(asciiOnly)) {
    return false;
  }

  // Ensure filename has valid length
  if (fileName.length === 0 || fileName.length > 255) {
    return false;
  }

  return true;
}

/**
 * GET /api/videos/[fileName]
 *
 * Fetch video from Vercel Blob and redirect to public URL.
 *
 * @param request - NextRequest
 * @param params - Route params with fileName
 * @returns Redirect to Vercel Blob URL or error response
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ fileName: string }> }
) {
  try {
    const { fileName: rawFileName } = await params;

    // 1. Decode URL-encoded filename (browsers encode Hebrew characters)
    // Example: %D7%93%D7%95%D7%93 → דוד
    const fileName = decodeURIComponent(rawFileName);

    // 2. Validate filename (security - prevent path traversal)
    if (!isValidFileName(fileName)) {
      return NextResponse.json(
        { error: 'שם קובץ לא תקין' },
        { status: 400 }
      );
    }

    // 3. Get blob metadata from Vercel Blob
    // Try multiple possible blob paths since storage format may vary
    let blob;
    const possiblePaths = [
      `videos/${fileName}`,  // Standard path with videos/ prefix
      fileName,              // Direct filename without prefix
    ];

    let lastError;
    for (const blobPath of possiblePaths) {
      try {
        blob = await head(blobPath);
        break; // Found it!
      } catch (err) {
        lastError = err;
        continue; // Try next path
      }
    }

    if (!blob) {
      // None of the paths worked
      console.error('Blob not found at any path:', possiblePaths, 'Last error:', lastError);
      return NextResponse.json(
        { error: 'הסרטון לא נמצא' },
        { status: 404 }
      );
    }

    // 4. Redirect to Vercel Blob public URL
    // Vercel Blob automatically handles:
    // - Range requests (206 Partial Content)
    // - Video streaming
    // - Caching headers
    // - Content-Type detection
    return NextResponse.redirect(blob.url, 302);

  } catch (error) {
    console.error('Video streaming error:', error);
    return NextResponse.json(
      { error: 'שגיאה בטעינת הסרטון' },
      { status: 500 }
    );
  }
}
