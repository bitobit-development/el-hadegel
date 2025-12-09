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
  // Block only dangerous characters while allowing international filenames
  const invalidChars = /[<>:"|?*\x00-\x1F]/;
  if (invalidChars.test(fileName)) {
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
    const { fileName } = await params;

    // 1. Validate filename (security - prevent path traversal)
    if (!isValidFileName(fileName)) {
      return NextResponse.json(
        { error: 'שם קובץ לא תקין' },
        { status: 400 }
      );
    }

    // 2. Get blob metadata from Vercel Blob
    const blobPath = `videos/${fileName}`;

    try {
      const blob = await head(blobPath);

      // 3. Redirect to Vercel Blob public URL
      // Vercel Blob automatically handles:
      // - Range requests (206 Partial Content)
      // - Video streaming
      // - Caching headers
      // - Content-Type detection
      return NextResponse.redirect(blob.url, 302);

    } catch (error) {
      return NextResponse.json(
        { error: 'הסרטון לא נמצא' },
        { status: 404 }
      );
    }

  } catch (error) {
    console.error('Video streaming error:', error);
    return NextResponse.json(
      { error: 'שגיאה בטעינת הסרטון' },
      { status: 500 }
    );
  }
}
