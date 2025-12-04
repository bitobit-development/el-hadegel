'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
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
import {
  Video,
  Upload,
  Search,
  Filter,
  Edit,
  Trash2,
  Eye,
  ThumbsUp,
  ThumbsDown,
  GripVertical,
  X as XIcon,
  PlayCircle,
  CheckCircle2,
  Clock,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  deleteVideo,
  togglePublishStatus,
  reorderVideos,
} from '@/app/actions/video-actions';
import type { VideoData, VideoStats } from '@/types/video';
import { VideoUploadDialog } from './VideoUploadDialog';
import { VideoDetailDialog } from './VideoDetailDialog';

interface AdminVideoManagerProps {
  initialVideos: VideoData[];
  initialStats: VideoStats;
}

type SortField = 'orderIndex' | 'createdAt' | 'viewCount' | 'likeCount';
type SortOrder = 'asc' | 'desc';

// Format duration from seconds to mm:ss
function formatDuration(seconds: number | null): string {
  if (!seconds) return '--:--';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

// Truncate text with ellipsis
function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
}

// Sortable Row Component for Drag-and-Drop
interface SortableVideoRowProps {
  video: VideoData;
  isSelected: boolean;
  onSelect: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onTogglePublish: () => void;
}

function SortableVideoRow({
  video,
  isSelected,
  onSelect,
  onEdit,
  onDelete,
  onTogglePublish,
}: SortableVideoRowProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: video.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <tr ref={setNodeRef} style={style} className="border-b hover:bg-muted/50 transition-colors">
      <td className="p-3 text-center">
        <div className="flex items-center gap-2">
          <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing" suppressHydrationWarning>
            <GripVertical className="h-4 w-4 text-muted-foreground" />
          </div>
          <Checkbox checked={isSelected} onCheckedChange={onSelect} />
        </div>
      </td>
      <td className="p-3">
        {video.thumbnailUrl ? (
          <img
            src={video.thumbnailUrl}
            alt={video.title}
            className="w-28 h-16 object-cover rounded-lg border border-gray-200"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
              const placeholder = e.currentTarget.nextElementSibling as HTMLElement;
              if (placeholder) placeholder.style.display = 'flex';
            }}
          />
        ) : null}
        <div className={`w-28 h-16 bg-muted rounded-lg flex items-center justify-center border border-gray-200 ${video.thumbnailUrl ? 'hidden' : ''}`}>
          <PlayCircle className="h-8 w-8 text-muted-foreground" />
        </div>
      </td>
      <td className="p-3">
        <div className="max-w-md">
          <div className="font-medium text-right">{truncateText(video.title, 50)}</div>
          {video.description && (
            <div className="text-sm text-muted-foreground text-right">
              {truncateText(video.description, 60)}
            </div>
          )}
        </div>
      </td>
      <td className="p-3 text-center">{formatDuration(video.duration)}</td>
      <td className="p-3 text-center">
        <Badge variant={video.isPublished ? 'default' : 'secondary'} className={video.isPublished ? 'bg-green-600' : 'bg-orange-500'}>
          {video.isPublished ? 'פורסם' : 'טיוטה'}
        </Badge>
      </td>
      <td className="p-3 text-center">
        <div className="flex items-center justify-center gap-1">
          <Eye className="h-4 w-4 text-purple-600" />
          <span className="text-sm">{video.viewCount}</span>
        </div>
      </td>
      <td className="p-3 text-center">
        <div className="flex items-center justify-center gap-3">
          <div className="flex items-center gap-1 text-green-600">
            <ThumbsUp className="h-4 w-4" />
            <span className="text-sm">{video.likeCount || 0}</span>
          </div>
          <div className="flex items-center gap-1 text-red-600">
            <ThumbsDown className="h-4 w-4" />
            <span className="text-sm">{video.dislikeCount || 0}</span>
          </div>
        </div>
      </td>
      <td className="p-3">
        <div className="flex items-center gap-2">
          <Button
            variant={video.isPublished ? "default" : "outline"}
            size="sm"
            onClick={onTogglePublish}
            className={video.isPublished
              ? "bg-green-600 hover:bg-green-700 text-white gap-1"
              : "bg-orange-500 hover:bg-orange-600 text-white gap-1"
            }
          >
            {video.isPublished ? (
              <>
                <CheckCircle2 className="h-4 w-4" />
                <span>פורסם</span>
              </>
            ) : (
              <>
                <Clock className="h-4 w-4" />
                <span>טיוטה</span>
              </>
            )}
          </Button>
          <Button variant="ghost" size="sm" onClick={onEdit} className="gap-1">
            <Edit className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={onDelete} className="gap-1 text-red-600 hover:text-red-700">
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </td>
    </tr>
  );
}

export function AdminVideoManager({ initialVideos, initialStats }: AdminVideoManagerProps) {
  const router = useRouter();
  const [videos, setVideos] = useState(initialVideos);
  const [stats, setStats] = useState(initialStats);
  const [selectedVideos, setSelectedVideos] = useState<Set<number>>(new Set());
  const [detailVideo, setDetailVideo] = useState<VideoData | null>(null);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [videoToDelete, setVideoToDelete] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showFilters, setShowFilters] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'published' | 'draft'>('all');
  const [sortField, setSortField] = useState<SortField>('orderIndex');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');

  // Drag-and-Drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Apply filters
  const filteredVideos = useMemo(() => {
    return videos.filter((video) => {
      // Search filter
      if (searchQuery) {
        const searchLower = searchQuery.toLowerCase();
        if (
          !video.title.toLowerCase().includes(searchLower) &&
          !(video.description?.toLowerCase().includes(searchLower))
        ) {
          return false;
        }
      }

      // Status filter
      if (statusFilter === 'published' && !video.isPublished) return false;
      if (statusFilter === 'draft' && video.isPublished) return false;

      return true;
    });
  }, [videos, searchQuery, statusFilter]);

  // Apply sorting
  const sortedVideos = useMemo(() => {
    const sorted = [...filteredVideos];
    sorted.sort((a, b) => {
      let comparison = 0;

      switch (sortField) {
        case 'orderIndex':
          comparison = a.orderIndex - b.orderIndex;
          break;
        case 'createdAt':
          comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          break;
        case 'viewCount':
          comparison = a.viewCount - b.viewCount;
          break;
        case 'likeCount':
          comparison = (a.likeCount || 0) - (b.likeCount || 0);
          break;
      }

      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return sorted;
  }, [filteredVideos, sortField, sortOrder]);

  const activeFilterCount =
    (searchQuery ? 1 : 0) + (statusFilter !== 'all' ? 1 : 0);

  const clearFilters = () => {
    setSearchQuery('');
    setStatusFilter('all');
  };

  const toggleVideo = (id: number) => {
    const newSelected = new Set(selectedVideos);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedVideos(newSelected);
  };

  const toggleAllVisible = () => {
    if (selectedVideos.size === sortedVideos.length) {
      setSelectedVideos(new Set());
    } else {
      setSelectedVideos(new Set(sortedVideos.map((v) => v.id)));
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = videos.findIndex((v) => v.id === active.id);
      const newIndex = videos.findIndex((v) => v.id === over.id);

      const newVideos = arrayMove(videos, oldIndex, newIndex);

      // Update local state optimistically
      setVideos(newVideos);

      // Update orderIndex for all affected videos
      const updates = newVideos.map((video, index) => ({
        id: video.id,
        orderIndex: index,
      }));

      try {
        await reorderVideos(updates);
        toast.success('סדר הסרטונים עודכן בהצלחה');
        router.refresh();
      } catch (error) {
        toast.error('שגיאה בעדכון סדר הסרטונים');
        // Revert on error
        setVideos(initialVideos);
      }
    }
  };

  const handleTogglePublish = async (videoId: number) => {
    try {
      await togglePublishStatus(videoId);

      // Update local state immediately
      setVideos((prevVideos) =>
        prevVideos.map((v) =>
          v.id === videoId ? { ...v, isPublished: !v.isPublished } : v
        )
      );

      // Update statistics
      const video = videos.find((v) => v.id === videoId);
      if (video) {
        setStats((prevStats) => ({
          ...prevStats,
          published: video.isPublished
            ? prevStats.published - 1
            : prevStats.published + 1,
          draft: video.isPublished
            ? prevStats.draft + 1
            : prevStats.draft - 1,
        }));
      }

      toast.success('סטטוס הפרסום עודכן');
    } catch (error) {
      toast.error('שגיאה בעדכון סטטוס פרסום');
    }
  };

  const handleDeleteClick = (videoId: number) => {
    setVideoToDelete(videoId);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!videoToDelete) return;

    setIsDeleting(true);
    try {
      await deleteVideo(videoToDelete);

      // Find deleted video to update stats correctly
      const deletedVideo = videos.find((v) => v.id === videoToDelete);

      // Remove from local state immediately
      setVideos((prevVideos) => prevVideos.filter((v) => v.id !== videoToDelete));

      // Update statistics
      if (deletedVideo) {
        setStats((prevStats) => ({
          ...prevStats,
          total: prevStats.total - 1,
          published: deletedVideo.isPublished
            ? prevStats.published - 1
            : prevStats.published,
          draft: deletedVideo.isPublished
            ? prevStats.draft
            : prevStats.draft - 1,
        }));
      }

      toast.success('הסרטון נמחק בהצלחה');
      setDeleteDialogOpen(false);
      setVideoToDelete(null);
    } catch (error) {
      toast.error('שגיאה במחיקת הסרטון');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleBulkPublish = async () => {
    if (selectedVideos.size === 0) return;

    const promises = Array.from(selectedVideos).map((id) => togglePublishStatus(id));

    try {
      await Promise.all(promises);
      toast.success(`${selectedVideos.size} סרטונים פורסמו`);
      setSelectedVideos(new Set());
      router.refresh();
    } catch (error) {
      toast.error('שגיאה בפרסום סרטונים');
    }
  };

  const handleBulkDelete = async () => {
    if (selectedVideos.size === 0) return;

    const videosToDelete = Array.from(selectedVideos);
    const promises = videosToDelete.map((id) => deleteVideo(id));

    setIsDeleting(true);
    try {
      await Promise.all(promises);

      // Calculate statistics before removing videos
      const deletedPublished = videos.filter(
        (v) => selectedVideos.has(v.id) && v.isPublished
      ).length;
      const deletedDraft = selectedVideos.size - deletedPublished;

      // Remove from local state immediately
      setVideos((prevVideos) =>
        prevVideos.filter((v) => !selectedVideos.has(v.id))
      );

      // Update statistics
      setStats((prevStats) => ({
        ...prevStats,
        total: prevStats.total - selectedVideos.size,
        published: prevStats.published - deletedPublished,
        draft: prevStats.draft - deletedDraft,
      }));

      toast.success(`${selectedVideos.size} סרטונים נמחקו`);
      setSelectedVideos(new Set());
    } catch (error) {
      toast.error('שגיאה במחיקת סרטונים');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-blue-900">סה"כ סרטונים</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">{stats.total}</div>
          </CardContent>
        </Card>

        <Card className="border-green-200 bg-green-50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-green-900">פורסמו</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">{stats.published}</div>
          </CardContent>
        </Card>

        <Card className="border-orange-200 bg-orange-50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-orange-900">טיוטות</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-orange-600">{stats.draft}</div>
          </CardContent>
        </Card>

        <Card className="border-purple-200 bg-purple-50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-purple-900">צפיות</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-purple-600">{stats.totalViews}</div>
          </CardContent>
        </Card>

        <Card className="border-pink-200 bg-pink-50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-pink-900">לייקים</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-pink-600">{stats.totalLikes}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <CardTitle className="text-right flex items-center gap-2">
                <Filter className="h-5 w-5" />
                סינון וחיפוש
              </CardTitle>
              {activeFilterCount > 0 && (
                <CardDescription className="text-right">
                  {activeFilterCount} סננים פעילים
                </CardDescription>
              )}
            </div>
            <div className="flex gap-2">
              {activeFilterCount > 0 && (
                <Button variant="outline" onClick={clearFilters} size="sm">
                  <XIcon className="h-4 w-4 ml-1" />
                  נקה סננים
                </Button>
              )}
              <Button
                variant="ghost"
                onClick={() => setShowFilters(!showFilters)}
                size="sm"
              >
                {showFilters ? 'הסתר' : 'הצג'}
              </Button>
            </div>
          </div>
        </CardHeader>

        {showFilters && (
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Search */}
              <div className="space-y-2">
                <Label htmlFor="search">חיפוש</Label>
                <div className="relative">
                  <Search className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="search"
                    placeholder="חפש לפי כותרת או תיאור..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pr-10 text-right"
                  />
                </div>
              </div>

              {/* Status Filter */}
              <div className="space-y-2">
                <Label htmlFor="status-filter">סטטוס</Label>
                <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as any)}>
                  <SelectTrigger id="status-filter">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">הכל</SelectItem>
                    <SelectItem value="published">פורסם</SelectItem>
                    <SelectItem value="draft">טיוטה</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Sort */}
              <div className="space-y-2">
                <Label htmlFor="sort-filter">מיין לפי</Label>
                <div className="flex gap-2">
                  <Select value={sortField} onValueChange={(v) => setSortField(v as SortField)}>
                    <SelectTrigger id="sort-filter">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="orderIndex">סדר</SelectItem>
                      <SelectItem value="createdAt">תאריך יצירה</SelectItem>
                      <SelectItem value="viewCount">צפיות</SelectItem>
                      <SelectItem value="likeCount">לייקים</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                  >
                    {sortOrder === 'asc' ? '↑' : '↓'}
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Bulk Actions */}
      {selectedVideos.size > 0 && (
        <Card className="bg-orange-50 border-orange-200">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between gap-4">
              <div className="text-sm font-medium">
                {selectedVideos.size} סרטונים נבחרו
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={handleBulkPublish}
                  className="gap-2"
                  size="sm"
                >
                  <PlayCircle className="h-4 w-4" />
                  פרסם נבחרים
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleBulkDelete}
                  className="gap-2"
                  size="sm"
                  disabled={isDeleting}
                >
                  <Trash2 className="h-4 w-4" />
                  {isDeleting ? 'מוחק...' : 'מחק נבחרים'}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Upload Button */}
      <div className="flex justify-end">
        <Button onClick={() => setUploadDialogOpen(true)} className="gap-2 bg-orange-600 hover:bg-orange-700">
          <Upload className="h-4 w-4" />
          העלה סרטון
        </Button>
      </div>

      {/* Videos Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-right flex items-center gap-2">
              <Video className="h-5 w-5" />
              ניהול סרטונים
            </CardTitle>
            <CardDescription className="text-right">
              מציג {sortedVideos.length} מתוך {stats.total} סרטונים
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b text-right">
                    <th className="p-3 text-center w-24">
                      <Checkbox
                        checked={sortedVideos.length > 0 && selectedVideos.size === sortedVideos.length}
                        onCheckedChange={toggleAllVisible}
                      />
                    </th>
                    <th className="p-3 font-semibold">תמונה</th>
                    <th className="p-3 font-semibold">כותרת</th>
                    <th className="p-3 font-semibold text-center">משך</th>
                    <th className="p-3 font-semibold text-center">סטטוס</th>
                    <th className="p-3 font-semibold text-center">צפיות</th>
                    <th className="p-3 font-semibold text-center">תגובות</th>
                    <th className="p-3 font-semibold">פעולות</th>
                  </tr>
                </thead>
                <SortableContext items={sortedVideos.map(v => v.id)} strategy={verticalListSortingStrategy}>
                  <tbody>
                    {sortedVideos.map((video) => (
                      <SortableVideoRow
                        key={video.id}
                        video={video}
                        isSelected={selectedVideos.has(video.id)}
                        onSelect={() => toggleVideo(video.id)}
                        onEdit={() => setDetailVideo(video)}
                        onDelete={() => handleDeleteClick(video.id)}
                        onTogglePublish={() => handleTogglePublish(video.id)}
                      />
                    ))}
                  </tbody>
                </SortableContext>
              </table>
            </div>

            {/* Empty State */}
            {sortedVideos.length === 0 && (
              <div className="text-center py-12">
                <Video className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">
                  {activeFilterCount > 0 ? 'לא נמצאו סרטונים התואמים לסינון' : 'אין סרטונים במערכת'}
                </p>
                {activeFilterCount === 0 && (
                  <Button onClick={() => setUploadDialogOpen(true)} className="mt-4 gap-2">
                    <Upload className="h-4 w-4" />
                    העלה סרטון ראשון
                  </Button>
                )}
              </div>
            )}
          </DndContext>
        </CardContent>
      </Card>

      {/* Upload Dialog */}
      <VideoUploadDialog
        open={uploadDialogOpen}
        onOpenChange={setUploadDialogOpen}
        onSuccess={(newVideo) => {
          // Add new video to local state immediately at the end (highest orderIndex)
          setVideos(prevVideos => [...prevVideos, newVideo]);

          // Update statistics
          setStats(prevStats => ({
            ...prevStats,
            total: prevStats.total + 1,
            published: newVideo.isPublished ? prevStats.published + 1 : prevStats.published,
            draft: newVideo.isPublished ? prevStats.draft : prevStats.draft + 1,
          }));

          setUploadDialogOpen(false);
          toast.success('הסרטון הועלה בהצלחה');
        }}
      />

      {/* Detail Dialog */}
      {detailVideo && (
        <VideoDetailDialog
          video={detailVideo}
          open={!!detailVideo}
          onOpenChange={(open) => !open && setDetailVideo(null)}
          onUpdate={() => {
            setDetailVideo(null);
            router.refresh();
          }}
          onDelete={() => {
            setDetailVideo(null);
            router.refresh();
          }}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-right">האם אתה בטוח?</AlertDialogTitle>
            <AlertDialogDescription className="text-right">
              פעולה זו תמחק את הסרטון לצמיתות ולא ניתן לשחזר אותו.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>ביטול</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isDeleting ? 'מוחק...' : 'מחק'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
