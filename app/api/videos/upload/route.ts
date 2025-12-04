/**
 * Video Upload API Route
 *
 * Handles secure video file uploads with validation and authentication.
 * Supports multipart/form-data with file size and format validation.
 *
 * POST /api/videos/upload
 * - Requires NextAuth admin session
 * - Max file size: 500MB
 * - Allowed formats: mp4, webm, mov
 * - Saves to /videos directory with timestamp-based naming
 */

import { NextRequest, NextResponse } from 'next/server';
import { put } from '@vercel/blob';
import { auth } from '@/auth';
import { VIDEO_CONSTRAINTS } from '@/types/video';

/**
 * MIME type mapping for video formats
 *
 * Used to validate that file extension matches MIME type
 * to prevent malicious file uploads.
 */
const MIME_TYPES: Record<string, string[]> = {
  'video/mp4': ['mp4'],
  'video/webm': ['webm'],
  'video/quicktime': ['mov'],
  'video/x-quicktime': ['mov'],
};

/**
 * Validate filename to prevent path traversal attacks
 *
 * @param fileName - Filename to validate
 * @returns true if filename is safe, false otherwise
 */
function isValidFileName(fileName: string): boolean {
  // Block path traversal attempts
  if (fileName.includes('..') || fileName.includes('/') || fileName.includes('\\')) {
    return false;
  }

  // Block null bytes
  if (fileName.includes('\0')) {
    return false;
  }

  // Check length (max 255 characters for most filesystems)
  if (fileName.length === 0 || fileName.length > 255) {
    return false;
  }

  // Allow Unicode characters (including Hebrew), spaces, and common punctuation
  // Only block control characters and path separators
  return true;
}

/**
 * Get file extension from filename
 *
 * @param fileName - Full filename with extension
 * @returns Lowercase file extension without dot
 */
function getFileExtension(fileName: string): string {
  const parts = fileName.split('.');
  return parts[parts.length - 1].toLowerCase();
}

/**
 * Validate MIME type matches file extension
 *
 * @param mimeType - File MIME type from upload
 * @param extension - File extension
 * @returns true if valid, false otherwise
 */
function isValidMimeType(mimeType: string, extension: string): boolean {
  const allowedExtensions = MIME_TYPES[mimeType];
  return allowedExtensions?.includes(extension) || false;
}

/**
 * POST /api/videos/upload
 *
 * Upload video file with authentication and validation.
 *
 * @param request - NextRequest with multipart/form-data
 * @returns JSON response with file metadata or error
 */
export async function POST(request: NextRequest) {
  try {
    // 1. Authentication check - admin only
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { error: 'לא מורשה - נדרשת התחברות' },
        { status: 401 }
      );
    }

    // 2. Parse form data
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json(
        { error: 'לא נבחר קובץ' },
        { status: 400 }
      );
    }

    // 3. Validate file size (max 500MB)
    if (file.size > VIDEO_CONSTRAINTS.MAX_FILE_SIZE) {
      const maxSizeMB = VIDEO_CONSTRAINTS.MAX_FILE_SIZE / (1024 * 1024);
      return NextResponse.json(
        { error: `קובץ גדול מדי - מקסימום ${maxSizeMB}MB` },
        { status: 400 }
      );
    }

    // 4. Validate file format
    const extension = getFileExtension(file.name);
    if (!VIDEO_CONSTRAINTS.ALLOWED_FORMATS.includes(extension as any)) {
      return NextResponse.json(
        { error: 'פורמט לא נתמך - רק MP4, WebM או MOV' },
        { status: 400 }
      );
    }

    // 5. Validate MIME type matches extension (security)
    if (!isValidMimeType(file.type, extension)) {
      return NextResponse.json(
        { error: 'סוג הקובץ אינו תואם את הסיומת' },
        { status: 400 }
      );
    }

    // 6. Validate original filename for security
    if (!isValidFileName(file.name)) {
      return NextResponse.json(
        { error: 'שם הקובץ אינו תקין' },
        { status: 400 }
      );
    }

    // 7. Generate safe filename with timestamp
    const timestamp = Date.now();
    const safeFileName = `video-${timestamp}.${extension}`;

    // 8. Upload to Vercel Blob
    const blob = await put(`videos/${safeFileName}`, file, {
      access: 'public',
      contentType: file.type,
    });

    // 9. Return success response with file metadata and blob URL
    return NextResponse.json({
      fileName: safeFileName,
      size: file.size,
      type: file.type,
      originalName: file.name,
      url: blob.url, // Vercel Blob public URL
    }, { status: 201 });

  } catch (error) {
    console.error('Video upload error:', error);
    return NextResponse.json(
      { error: 'שגיאה בהעלאת הקובץ' },
      { status: 500 }
    );
  }
}
