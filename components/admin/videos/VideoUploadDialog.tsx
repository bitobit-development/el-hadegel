'use client';

import { useState, useRef, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Upload, X, Video, FileVideo, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { upload } from '@vercel/blob/client';
import { createVideo } from '@/app/actions/video-actions';
import { VIDEO_CONSTRAINTS, type VideoData } from '@/types/video';

interface VideoUploadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: (newVideo: VideoData) => void;
}

type UploadStep = 'select' | 'uploading' | 'metadata';

interface VideoMetadata {
  title: string;
  description: string;
  fileName: string;
  duration?: number;
  thumbnailUrl?: string;
}

// Format file size for display
function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

// Format duration for display (seconds to MM:SS)
function formatDuration(seconds: number | undefined): string {
  if (!seconds) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

// Extract video duration using video element
async function getVideoDuration(file: File): Promise<number | undefined> {
  return new Promise((resolve) => {
    const video = document.createElement('video');
    video.preload = 'metadata';
    video.onloadedmetadata = () => {
      window.URL.revokeObjectURL(video.src);
      resolve(Math.floor(video.duration));
    };
    video.onerror = () => resolve(undefined);
    video.src = URL.createObjectURL(file);
  });
}

// Generate thumbnail from video file using canvas
async function generateThumbnail(file: File): Promise<string | undefined> {
  return new Promise((resolve) => {
    const video = document.createElement('video');
    video.preload = 'metadata';
    video.muted = true;

    // Seek to 2 seconds or 10% of duration (whichever comes first)
    video.onloadedmetadata = () => {
      const seekTime = Math.min(2, video.duration * 0.1);
      video.currentTime = seekTime;
    };

    video.onseeked = () => {
      try {
        // Create canvas with video dimensions
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;

        // Draw video frame to canvas
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(undefined);
          return;
        }

        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        // Convert canvas to JPEG data URL (80% quality)
        const thumbnailDataUrl = canvas.toDataURL('image/jpeg', 0.8);

        // Cleanup
        window.URL.revokeObjectURL(video.src);

        resolve(thumbnailDataUrl);
      } catch (error) {
        console.error('Error generating thumbnail:', error);
        resolve(undefined);
      }
    };

    video.onerror = () => {
      resolve(undefined);
    };

    video.src = URL.createObjectURL(file);
  });
}

export function VideoUploadDialog({ open, onOpenChange, onSuccess }: VideoUploadDialogProps) {
  const [step, setStep] = useState<UploadStep>('select');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [metadata, setMetadata] = useState<VideoMetadata>({
    title: '',
    description: '',
    fileName: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Validation
  const titleLength = metadata.title.length;
  const descriptionLength = metadata.description.length;
  const isTitleValid = titleLength > 0 && titleLength <= VIDEO_CONSTRAINTS.MAX_TITLE_LENGTH;
  const isDescriptionValid = descriptionLength <= VIDEO_CONSTRAINTS.MAX_DESCRIPTION_LENGTH;
  const isMetadataValid = isTitleValid && isDescriptionValid;

  const resetState = () => {
    setStep('select');
    setSelectedFile(null);
    setUploadProgress(0);
    setMetadata({
      title: '',
      description: '',
      fileName: '',
    });
    setIsSubmitting(false);
  };

  const handleClose = () => {
    if (step === 'uploading') {
      toast.error('לא ניתן לסגור בזמן העלאה');
      return;
    }
    resetState();
    onOpenChange(false);
  };

  const validateFile = (file: File): string | null => {
    // Check file size
    if (file.size > VIDEO_CONSTRAINTS.MAX_FILE_SIZE) {
      return `גודל הקובץ עולה על המקסימום (${formatFileSize(VIDEO_CONSTRAINTS.MAX_FILE_SIZE)})`;
    }

    // Check file type
    const fileExtension = file.name.split('.').pop()?.toLowerCase();
    if (!fileExtension || !VIDEO_CONSTRAINTS.ALLOWED_FORMATS.includes(fileExtension as any)) {
      return `פורמט לא נתמך. פורמטים מותרים: ${VIDEO_CONSTRAINTS.ALLOWED_FORMATS.join(', ')}`;
    }

    return null;
  };

  const handleFileSelect = useCallback(async (file: File) => {
    const validationError = validateFile(file);
    if (validationError) {
      toast.error(validationError);
      return;
    }

    setSelectedFile(file);
    setStep('uploading');

    try {
      // Extract video metadata in parallel
      const [duration, thumbnailUrl] = await Promise.all([
        getVideoDuration(file),
        generateThumbnail(file),
      ]);

      // Upload directly to Vercel Blob using the upload function
      // This handles signed URL generation and upload automatically
      const blob = await upload(file.name, file, {
        access: 'public',
        handleUploadUrl: '/api/videos/upload-url',
        clientPayload: JSON.stringify({
          filename: file.name,
          contentType: file.type,
          size: file.size,
        }),
        onUploadProgress: ({ percentage }) => {
          setUploadProgress(percentage);
        },
      });

      // Extract filename from blob URL or pathname
      const fileName = blob.pathname.split('/').pop() || `video-${Date.now()}.mp4`;

      // Set metadata for next step
      setMetadata({
        title: file.name.replace(/\.[^/.]+$/, ''), // Filename without extension
        description: '',
        fileName: fileName,
        duration,
        thumbnailUrl, // Use client-side generated thumbnail
      });
      setStep('metadata');
      toast.success('הקובץ הועלה בהצלחה');

    } catch (error) {
      console.error('Upload error:', error);
      const errorMessage = error instanceof Error ? error.message : 'שגיאה בהעלאת הקובץ';
      toast.error(errorMessage);
      resetState();
    }
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      setDragActive(false);

      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
        handleFileSelect(e.dataTransfer.files[0]);
      }
    },
    [handleFileSelect]
  );

  const handleDrag = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelect(e.target.files[0]);
    }
  };

  const handleSubmit = async () => {
    if (!isMetadataValid) return;

    setIsSubmitting(true);
    try {
      const newVideo = await createVideo({
        title: metadata.title,
        description: metadata.description || undefined,
        fileName: metadata.fileName,
        duration: metadata.duration,
        thumbnailUrl: metadata.thumbnailUrl,
      });

      toast.success('הסרטון נוצר בהצלחה');
      resetState();
      onSuccess(newVideo);
    } catch (error) {
      console.error('Create video error:', error);
      toast.error('שגיאה ביצירת הסרטון');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-right flex items-center gap-2">
            <Upload className="h-5 w-5" />
            העלאת סרטון
          </DialogTitle>
        </DialogHeader>

        {/* Step 1: File Selection */}
        {step === 'select' && (
          <div className="space-y-4">
            <div
              className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                dragActive
                  ? 'border-orange-500 bg-orange-50'
                  : 'border-gray-300 hover:border-orange-400 hover:bg-orange-50/50'
              }`}
              onDrop={handleDrop}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
            >
              <FileVideo className="h-16 w-16 mx-auto mb-4 text-orange-500" />
              <p className="text-lg font-medium mb-2">גרור קובץ וידאו לכאן</p>
              <p className="text-sm text-muted-foreground mb-4">או</p>
              <Button
                onClick={() => fileInputRef.current?.click()}
                variant="outline"
                className="gap-2"
              >
                <Upload className="h-4 w-4" />
                בחר קובץ מהמחשב
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept="video/mp4,video/webm,video/quicktime"
                onChange={handleFileInputChange}
                className="hidden"
              />
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-2 text-right">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
                <div className="text-sm text-blue-900">
                  <p className="font-medium mb-1">דרישות:</p>
                  <ul className="list-disc list-inside space-y-1">
                    <li>פורמטים נתמכים: MP4, WebM, QuickTime</li>
                    <li>גודל מקסימלי: {formatFileSize(VIDEO_CONSTRAINTS.MAX_FILE_SIZE)}</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Uploading */}
        {step === 'uploading' && (
          <div className="space-y-6 py-8">
            <div className="text-center">
              <Video className="h-16 w-16 mx-auto mb-4 text-orange-500 animate-pulse" />
              <p className="text-lg font-medium mb-2">מעלה קובץ...</p>
              {selectedFile && (
                <p className="text-sm text-muted-foreground">
                  {selectedFile.name} ({formatFileSize(selectedFile.size)})
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Progress value={uploadProgress} className="h-2" />
              <p className="text-center text-sm font-medium">{uploadProgress}%</p>
            </div>
          </div>
        )}

        {/* Step 3: Metadata Form with Previews */}
        {step === 'metadata' && (
          <div className="space-y-4">
            {/* Video Preview Section */}
            {metadata.fileName && (
              <div className="space-y-2">
                <Label className="text-sm font-medium">תצוגה מקדימה של הסרטון</Label>
                <div className="relative aspect-video bg-black rounded-lg overflow-hidden border border-gray-200 max-w-md mx-auto">
                  <video
                    src={`/api/videos/${metadata.fileName}`}
                    controls
                    className="w-full h-full"
                    poster={metadata.thumbnailUrl || undefined}
                    preload="metadata"
                  >
                    הדפדפן שלך לא תומך בתגית וידאו.
                  </video>
                </div>
                <div className="flex items-center justify-center gap-3 text-xs text-muted-foreground">
                  {selectedFile && (
                    <span>{selectedFile.name} • {formatFileSize(selectedFile.size)}</span>
                  )}
                  {metadata.duration && (
                    <span className="font-medium">משך: {formatDuration(metadata.duration)}</span>
                  )}
                </div>
              </div>
            )}

            {/* Thumbnail Preview Section */}
            {metadata.thumbnailUrl && (
              <div className="space-y-2">
                <Label className="text-sm font-medium">תמונת תצוגה מקדימה</Label>
                <div className="flex justify-center">
                  <img
                    src={metadata.thumbnailUrl}
                    alt="תמונת תצוגה מקדימה"
                    className="rounded-lg max-w-[240px] border border-gray-200"
                  />
                </div>
              </div>
            )}

            {/* Metadata Form */}
            <div className="space-y-4 pt-4 border-t">
              {/* Title */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="title">כותרת הסרטון *</Label>
                  <span className={`text-xs ${titleLength > VIDEO_CONSTRAINTS.MAX_TITLE_LENGTH ? 'text-red-600' : 'text-muted-foreground'}`}>
                    {titleLength}/{VIDEO_CONSTRAINTS.MAX_TITLE_LENGTH}
                  </span>
                </div>
                <Input
                  id="title"
                  value={metadata.title}
                  onChange={(e) => setMetadata({ ...metadata, title: e.target.value })}
                  placeholder="הכנס כותרת..."
                  className="text-right"
                  maxLength={VIDEO_CONSTRAINTS.MAX_TITLE_LENGTH}
                />
                {!isTitleValid && titleLength > 0 && (
                  <p className="text-xs text-red-600 text-right">כותרת חייבת להיות בין 1-{VIDEO_CONSTRAINTS.MAX_TITLE_LENGTH} תווים</p>
                )}
              </div>

              {/* Description */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="description">תיאור (אופציונלי)</Label>
                  <span className={`text-xs ${descriptionLength > VIDEO_CONSTRAINTS.MAX_DESCRIPTION_LENGTH ? 'text-red-600' : 'text-muted-foreground'}`}>
                    {descriptionLength}/{VIDEO_CONSTRAINTS.MAX_DESCRIPTION_LENGTH}
                  </span>
                </div>
                <Textarea
                  id="description"
                  value={metadata.description}
                  onChange={(e) => setMetadata({ ...metadata, description: e.target.value })}
                  placeholder="הכנס תיאור..."
                  className="text-right min-h-[100px]"
                  maxLength={VIDEO_CONSTRAINTS.MAX_DESCRIPTION_LENGTH}
                />
              </div>

              {/* Thumbnail URL */}
              <div className="space-y-2">
                <Label htmlFor="thumbnail">קישור לתמונת תצוגה מקדימה (אופציונלי)</Label>
                <Input
                  id="thumbnail"
                  value={metadata.thumbnailUrl || ''}
                  onChange={(e) => setMetadata({ ...metadata, thumbnailUrl: e.target.value })}
                  placeholder="https://example.com/thumbnail.jpg"
                  className="text-right"
                  type="url"
                />
              </div>

              {/* Duration (auto-filled, editable) */}
              <div className="space-y-2">
                <Label htmlFor="duration">משך הסרטון (שניות)</Label>
                <Input
                  id="duration"
                  type="number"
                  value={metadata.duration || ''}
                  onChange={(e) => setMetadata({ ...metadata, duration: parseInt(e.target.value) || undefined })}
                  placeholder="אוטומטי"
                  className="text-right"
                />
              </div>
            </div>
          </div>
        )}

        <DialogFooter className="gap-2">
          {step === 'metadata' && (
            <>
              <Button variant="outline" onClick={handleClose} disabled={isSubmitting}>
                ביטול
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={!isMetadataValid || isSubmitting}
                className="bg-orange-600 hover:bg-orange-700"
              >
                {isSubmitting ? 'שומר...' : 'שמור סרטון'}
              </Button>
            </>
          )}
          {step === 'select' && (
            <Button variant="outline" onClick={handleClose}>
              סגור
            </Button>
          )}
          {step === 'uploading' && (
            <Button variant="outline" disabled>
              מעלה...
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
