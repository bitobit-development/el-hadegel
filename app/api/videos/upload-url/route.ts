/**
 * Video Upload URL Generation API Route
 *
 * Handles client-side upload requests using Vercel Blob's handleUpload.
 * This bypasses the 4.5MB serverless function body limit by generating
 * signed URLs for direct client-to-Blob uploads.
 *
 * POST /api/videos/upload-url
 * - Requires NextAuth admin session
 * - Returns signed upload URL for direct blob upload
 * - Validates file metadata (size, format, name)
 */

import { NextResponse } from 'next/server';
import { handleUpload, type HandleUploadBody } from '@vercel/blob/client';
import { auth } from '@/auth';
import { VIDEO_CONSTRAINTS } from '@/types/video';

// Configure route to allow larger payloads for video uploads
export const maxDuration = 60; // Allow up to 60 seconds for upload URL generation

/**
 * Validate filename to prevent path traversal attacks
 * Allows Unicode characters (including Hebrew) and spaces
 */
function isValidFileName(fileName: string): boolean {
  // Block path traversal
  if (fileName.includes('..') || fileName.includes('/') || fileName.includes('\\')) {
    return false;
  }
  // Block null bytes
  if (fileName.includes('\0')) {
    return false;
  }
  // Block dangerous Windows/filesystem characters
  const invalidChars = /[<>:"|?*\x00-\x1F]/;
  if (invalidChars.test(fileName)) {
    return false;
  }
  // Check length
  if (fileName.length === 0 || fileName.length > 255) {
    return false;
  }
  return true;
}

/**
 * Get file extension from filename
 */
function getFileExtension(fileName: string): string {
  const parts = fileName.split('.');
  return parts[parts.length - 1].toLowerCase();
}

/**
 * POST /api/videos/upload-url
 *
 * Generate signed upload URL for direct Blob upload using handleUpload.
 * This is called by the client with upload metadata.
 */
export async function POST(request: Request): Promise<Response> {
  // 1. Authentication check - admin only
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json(
      { error: 'לא מורשה - נדרשת התחברות' },
      { status: 401 }
    );
  }

  try {
    // 2. Get the Blob token from environment
    const token = process.env.BLOB_READ_WRITE_TOKEN;
    if (!token) {
      throw new Error('BLOB_READ_WRITE_TOKEN not configured');
    }

    // 3. Parse the request body to get the upload event
    const body = await request.json();

    // 4. Use handleUpload to generate the signed URL
    // All validation happens inside onBeforeGenerateToken
    const jsonResponse = await handleUpload({
      body,
      request,
      token, // Required for generating client tokens
      onBeforeGenerateToken: async (pathname, clientPayload, multipart) => {
        // Parse client payload
        let metadata: { filename: string; contentType: string; size: number };
        try {
          metadata = JSON.parse(clientPayload || '{}');
        } catch {
          throw new Error('נתונים לא תקינים');
        }

        const { filename, contentType, size } = metadata;

        // Log multipart status for debugging
        console.log('Upload request:', { filename, size, multipart });

        // Validate required fields
        if (!filename || !contentType || typeof size !== 'number') {
          throw new Error('נתונים חסרים - נדרש filename, contentType, size');
        }

        // 3. Validate file size (max 500MB)
        if (size > VIDEO_CONSTRAINTS.MAX_FILE_SIZE) {
          const maxSizeMB = VIDEO_CONSTRAINTS.MAX_FILE_SIZE / (1024 * 1024);
          throw new Error(`קובץ גדול מדי - מקסימום ${maxSizeMB}MB`);
        }

        // 4. Validate file format
        const extension = getFileExtension(filename);
        if (!VIDEO_CONSTRAINTS.ALLOWED_FORMATS.includes(extension as any)) {
          throw new Error('פורמט לא נתמך - רק MP4, WebM או MOV');
        }

        // 5. Validate filename for security
        if (!isValidFileName(filename)) {
          throw new Error('שם הקובץ אינו תקין');
        }

        // 6. Generate safe filename preserving original name with timestamp
        // Keep original filename but add timestamp prefix for uniqueness
        const timestamp = Date.now();
        const baseNameWithoutExt = filename.substring(0, filename.lastIndexOf('.')) || filename;
        // Trim spaces from the filename
        const trimmedBaseName = baseNameWithoutExt.trim();
        const safeFileName = `${timestamp}-${trimmedBaseName}.${extension}`;

        // Return upload configuration
        return {
          allowedContentTypes: [contentType],
          maximumSizeInBytes: VIDEO_CONSTRAINTS.MAX_FILE_SIZE,
          addRandomSuffix: true, // Prevent duplicate filename errors
          tokenPayload: JSON.stringify({
            userId: session.user.email,
            originalFilename: filename,
            safeFileName: safeFileName,
          }),
        };
      },
      onUploadCompleted: async ({ blob, tokenPayload }) => {
        // Log successful upload
        console.log('Video upload completed:', {
          url: blob.url,
          pathname: blob.pathname,
          downloadUrl: blob.downloadUrl,
          tokenPayload,
        });
      },
    });

    // Log the response for debugging
    console.log('handleUpload response:', JSON.stringify(jsonResponse, null, 2));

    // Return the response from handleUpload as-is
    // handleUpload returns a properly formatted response object
    return Response.json(jsonResponse);

  } catch (error) {
    console.error('Upload URL generation error:', error);
    return NextResponse.json(
      { error: 'שגיאה ביצירת קישור העלאה: ' + (error instanceof Error ? error.message : 'Unknown error') },
      { status: 500 }
    );
  }
}
