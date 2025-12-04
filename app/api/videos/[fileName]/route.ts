/**
 * Video Streaming API Route
 *
 * Handles video file streaming with HTTP range request support for
 * efficient video playback and seeking. Supports partial content delivery
 * and proper caching headers.
 *
 * GET /api/videos/[fileName]
 * - Supports HTTP range requests (206 Partial Content)
 * - Returns video files from /videos directory
 * - Validates filenames to prevent path traversal
 * - Sets proper Content-Type and caching headers
 */

import { NextRequest, NextResponse } from 'next/server';
import { readFile, stat } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

/**
 * MIME type mapping for video file extensions
 *
 * Used to set correct Content-Type header for streaming response.
 */
const MIME_TYPES: Record<string, string> = {
  'mp4': 'video/mp4',
  'webm': 'video/webm',
  'mov': 'video/quicktime',
};

/**
 * Validate filename to prevent path traversal attacks
 *
 * Security function that blocks dangerous patterns:
 * - Path traversal: ../, ..\
 * - Absolute paths: /, \
 * - Only allows: alphanumeric, dash, underscore, dot
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

  // Only allow alphanumeric, dash, underscore, and dot
  const validPattern = /^[a-zA-Z0-9._-]+$/;
  return validPattern.test(fileName);
}

/**
 * Get MIME type from file extension
 *
 * @param fileName - Full filename with extension
 * @returns MIME type string or 'application/octet-stream' as fallback
 */
function getMimeType(fileName: string): string {
  const extension = fileName.split('.').pop()?.toLowerCase();
  return extension ? MIME_TYPES[extension] || 'application/octet-stream' : 'application/octet-stream';
}

/**
 * Parse Range header from HTTP request
 *
 * Extracts start and end byte positions from Range header.
 * Example: "bytes=0-1023" -> { start: 0, end: 1023 }
 *
 * @param rangeHeader - HTTP Range header value
 * @param fileSize - Total file size in bytes
 * @returns Object with start and end positions, or null if invalid
 */
function parseRange(rangeHeader: string | null, fileSize: number): { start: number; end: number } | null {
  if (!rangeHeader) {
    return null;
  }

  // Parse "bytes=start-end" format
  const match = rangeHeader.match(/bytes=(\d+)-(\d*)/);
  if (!match) {
    return null;
  }

  const start = parseInt(match[1], 10);
  const end = match[2] ? parseInt(match[2], 10) : fileSize - 1;

  // Validate range boundaries
  if (start >= fileSize || end >= fileSize || start > end) {
    return null;
  }

  return { start, end };
}

/**
 * GET /api/videos/[fileName]
 *
 * Stream video file with optional range request support.
 *
 * @param request - NextRequest with optional Range header
 * @param params - Route params with fileName
 * @returns Video file stream or error response
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

    // 2. Build file path
    const videosDir = join(process.cwd(), 'videos');
    const filePath = join(videosDir, fileName);

    // 3. Check file exists
    if (!existsSync(filePath)) {
      return NextResponse.json(
        { error: 'הקובץ לא נמצא' },
        { status: 404 }
      );
    }

    // 4. Get file stats (size, etc.)
    const fileStats = await stat(filePath);
    const fileSize = fileStats.size;
    const mimeType = getMimeType(fileName);

    // 5. Parse Range header (for video seeking)
    const rangeHeader = request.headers.get('range');
    const range = parseRange(rangeHeader, fileSize);

    // 6. Handle range request (206 Partial Content)
    if (range) {
      const { start, end } = range;
      const contentLength = end - start + 1;

      // Read only requested chunk
      const buffer = await readFile(filePath);
      const chunk = buffer.slice(start, end + 1);

      // Return 206 Partial Content with proper headers
      return new NextResponse(chunk, {
        status: 206,
        headers: {
          'Content-Range': `bytes ${start}-${end}/${fileSize}`,
          'Accept-Ranges': 'bytes',
          'Content-Length': contentLength.toString(),
          'Content-Type': mimeType,
          'Cache-Control': 'public, max-age=31536000, immutable', // Cache for 1 year
        },
      });
    }

    // 7. Full file request (200 OK)
    const buffer = await readFile(filePath);

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Accept-Ranges': 'bytes',
        'Content-Length': fileSize.toString(),
        'Content-Type': mimeType,
        'Cache-Control': 'public, max-age=31536000, immutable', // Cache for 1 year
      },
    });

  } catch (error) {
    console.error('Video streaming error:', error);
    return NextResponse.json(
      { error: 'שגיאה בהזרמת הקובץ' },
      { status: 500 }
    );
  }
}
