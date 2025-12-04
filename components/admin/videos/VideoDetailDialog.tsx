'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Eye, ThumbsUp, ThumbsDown, Calendar, Trash2, Save } from 'lucide-react';
import { toast } from 'sonner';
import { updateVideo, deleteVideo } from '@/app/actions/video-actions';
import type { VideoData } from '@/types/video';
import { VIDEO_CONSTRAINTS } from '@/types/video';

interface VideoDetailDialogProps {
  video: VideoData;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdate: () => void;
  onDelete: () => void;
}

// Format date to Hebrew locale
function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('he-IL', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date));
}

export function VideoDetailDialog({
  video,
  open,
  onOpenChange,
  onUpdate,
  onDelete,
}: VideoDetailDialogProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    title: video.title,
    description: video.description || '',
    orderIndex: video.orderIndex,
    isPublished: video.isPublished,
  });

  // Validation
  const titleLength = formData.title.length;
  const descriptionLength = formData.description.length;
  const isTitleValid = titleLength > 0 && titleLength <= VIDEO_CONSTRAINTS.MAX_TITLE_LENGTH;
  const isDescriptionValid = descriptionLength <= VIDEO_CONSTRAINTS.MAX_DESCRIPTION_LENGTH;
  const isFormValid = isTitleValid && isDescriptionValid;

  // Reset form when video changes
  const resetForm = () => {
    setFormData({
      title: video.title,
      description: video.description || '',
      orderIndex: video.orderIndex,
      isPublished: video.isPublished,
    });
    setIsEditing(false);
  };

  const handleSave = async () => {
    if (!isFormValid) return;

    setIsSaving(true);
    try {
      await updateVideo(video.id, {
        title: formData.title,
        description: formData.description || null,
        orderIndex: formData.orderIndex,
        isPublished: formData.isPublished,
      });

      toast.success('הסרטון עודכן בהצלחה');
      setIsEditing(false);
      onUpdate();
    } catch (error) {
      console.error('Update error:', error);
      toast.error('שגיאה בעדכון הסרטון');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteClick = () => {
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    setIsDeleting(true);
    try {
      await deleteVideo(video.id);
      toast.success('הסרטון נמחק בהצלחה');
      setDeleteDialogOpen(false);
      onDelete();
    } catch (error) {
      console.error('Delete error:', error);
      toast.error('שגיאה במחיקת הסרטון');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-right">פרטי סרטון</DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            {/* Video Player */}
            <div className="aspect-video bg-black rounded-lg overflow-hidden">
              <video
                controls
                poster={video.thumbnailUrl || undefined}
                className="w-full h-full"
                src={`/api/videos/${video.fileName}`}
              >
                הדפדפן שלך לא תומך בנגן וידאו
              </video>
            </div>

            {/* Statistics Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <Card className="border-purple-200 bg-purple-50">
                <CardHeader className="pb-2 px-3 pt-3">
                  <CardTitle className="text-xs font-medium text-purple-900 flex items-center gap-1">
                    <Eye className="h-3 w-3" />
                    צפיות
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-3 pb-3">
                  <div className="text-2xl font-bold text-purple-600">{video.viewCount}</div>
                </CardContent>
              </Card>

              <Card className="border-green-200 bg-green-50">
                <CardHeader className="pb-2 px-3 pt-3">
                  <CardTitle className="text-xs font-medium text-green-900 flex items-center gap-1">
                    <ThumbsUp className="h-3 w-3" />
                    לייקים
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-3 pb-3">
                  <div className="text-2xl font-bold text-green-600">{video.likeCount || 0}</div>
                </CardContent>
              </Card>

              <Card className="border-red-200 bg-red-50">
                <CardHeader className="pb-2 px-3 pt-3">
                  <CardTitle className="text-xs font-medium text-red-900 flex items-center gap-1">
                    <ThumbsDown className="h-3 w-3" />
                    דיסלייקים
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-3 pb-3">
                  <div className="text-2xl font-bold text-red-600">{video.dislikeCount || 0}</div>
                </CardContent>
              </Card>

              <Card className="border-blue-200 bg-blue-50">
                <CardHeader className="pb-2 px-3 pt-3">
                  <CardTitle className="text-xs font-medium text-blue-900 flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    סטטוס
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-3 pb-3">
                  <Badge variant={video.isPublished ? 'default' : 'secondary'} className={video.isPublished ? 'bg-green-600' : 'bg-orange-500'}>
                    {video.isPublished ? 'פורסם' : 'טיוטה'}
                  </Badge>
                </CardContent>
              </Card>
            </div>

            {/* Edit Form */}
            <div className="space-y-4 border-t pt-4">
              {/* Title */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="title">כותרת *</Label>
                  <span className={`text-xs ${titleLength > VIDEO_CONSTRAINTS.MAX_TITLE_LENGTH ? 'text-red-600' : 'text-muted-foreground'}`}>
                    {titleLength}/{VIDEO_CONSTRAINTS.MAX_TITLE_LENGTH}
                  </span>
                </div>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  disabled={!isEditing}
                  className="text-right"
                  maxLength={VIDEO_CONSTRAINTS.MAX_TITLE_LENGTH}
                />
                {!isTitleValid && titleLength > 0 && isEditing && (
                  <p className="text-xs text-red-600 text-right">כותרת חייבת להיות בין 1-{VIDEO_CONSTRAINTS.MAX_TITLE_LENGTH} תווים</p>
                )}
              </div>

              {/* Description */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="description">תיאור</Label>
                  <span className={`text-xs ${descriptionLength > VIDEO_CONSTRAINTS.MAX_DESCRIPTION_LENGTH ? 'text-red-600' : 'text-muted-foreground'}`}>
                    {descriptionLength}/{VIDEO_CONSTRAINTS.MAX_DESCRIPTION_LENGTH}
                  </span>
                </div>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  disabled={!isEditing}
                  className="text-right min-h-[100px]"
                  maxLength={VIDEO_CONSTRAINTS.MAX_DESCRIPTION_LENGTH}
                />
              </div>

              {/* Order Index */}
              <div className="space-y-2">
                <Label htmlFor="orderIndex">מיקום בסדר</Label>
                <Input
                  id="orderIndex"
                  type="number"
                  value={formData.orderIndex}
                  onChange={(e) => setFormData({ ...formData, orderIndex: parseInt(e.target.value) || 0 })}
                  disabled={!isEditing}
                  className="text-right"
                  min={0}
                />
              </div>

              {/* Publish Toggle */}
              <div className="flex items-center justify-between p-3 border rounded-lg bg-muted/50">
                <Label htmlFor="isPublished" className="cursor-pointer">
                  פרסם סרטון
                </Label>
                <Switch
                  id="isPublished"
                  checked={formData.isPublished}
                  onCheckedChange={(checked: boolean) => setFormData({ ...formData, isPublished: checked })}
                  disabled={!isEditing}
                />
              </div>

              {/* Created Date (read-only) */}
              <div className="bg-gray-50 rounded-lg p-3 text-sm text-right">
                <p className="text-muted-foreground">
                  <span className="font-medium">תאריך יצירה:</span> {formatDate(video.createdAt)}
                </p>
                {video.updatedAt !== video.createdAt && (
                  <p className="text-muted-foreground mt-1">
                    <span className="font-medium">עדכון אחרון:</span> {formatDate(video.updatedAt)}
                  </p>
                )}
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2">
            {!isEditing ? (
              <>
                <Button variant="outline" onClick={() => onOpenChange(false)}>
                  סגור
                </Button>
                <Button variant="destructive" onClick={handleDeleteClick} className="gap-2">
                  <Trash2 className="h-4 w-4" />
                  מחק סרטון
                </Button>
                <Button onClick={() => setIsEditing(true)} className="gap-2 bg-orange-600 hover:bg-orange-700">
                  <Save className="h-4 w-4" />
                  ערוך
                </Button>
              </>
            ) : (
              <>
                <Button
                  variant="outline"
                  onClick={resetForm}
                  disabled={isSaving}
                >
                  ביטול
                </Button>
                <Button
                  onClick={handleSave}
                  disabled={!isFormValid || isSaving}
                  className="gap-2 bg-orange-600 hover:bg-orange-700"
                >
                  <Save className="h-4 w-4" />
                  {isSaving ? 'שומר...' : 'שמור שינויים'}
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-right">האם אתה בטוח שברצונך למחוק סרטון זה?</AlertDialogTitle>
            <AlertDialogDescription className="text-right">
              פעולה זו תמחק את הסרטון לצמיתות יחד עם כל הסטטיסטיקות והתגובות שלו. לא ניתן לשחזר את הסרטון לאחר המחיקה.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>ביטול</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isDeleting ? 'מוחק...' : 'אישור מחיקה'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
