'use client';

import { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { CommentDetailDialog } from './CommentDetailDialog';
import {
  getAllLawComments,
  getLawCommentStats,
  approveComment,
  rejectComment,
  markCommentAsSpam,
  deleteComment,
  bulkApproveComments,
  bulkRejectComments,
} from '@/app/actions/law-comment-actions';
import type {
  LawCommentData,
  CommentStats,
  CommentFilters,
  PaginatedResponse,
} from '@/types/law-comment';
import { CommentStatus } from '@prisma/client';
import { COMMENT_STATUS_LABELS, COMMENT_STATUS_COLORS } from '@/types/law-comment';
import {
  CheckCircle,
  XCircle,
  Trash2,
  Eye,
  AlertCircle,
  Filter,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { toast } from 'sonner';

interface AdminLawCommentsManagerProps {
  adminId: number;
  adminName: string;
}

const ITEMS_PER_PAGE = 20;
const MAX_BULK_OPERATIONS = 100;

export function AdminLawCommentsManager({
  adminId,
  adminName,
}: AdminLawCommentsManagerProps) {
  const router = useRouter();

  // Data state
  const [stats, setStats] = useState<CommentStats | null>(null);
  const [commentsData, setCommentsData] = useState<PaginatedResponse<LawCommentData> | null>(null);
  const [paragraphOptions, setParagraphOptions] = useState<Array<{ id: number; title: string }>>([]);

  // Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<CommentStatus | 'ALL'>('ALL');
  const [paragraphFilter, setParagraphFilter] = useState<number | 'ALL'>('ALL');
  const [sortBy, setSortBy] = useState<'date-desc' | 'date-asc'>('date-desc');

  // Selection state
  const [selectedComments, setSelectedComments] = useState<Set<number>>(new Set());

  // Dialog state
  const [detailComment, setDetailComment] = useState<LawCommentData | null>(null);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);

  // Loading state
  const [loading, setLoading] = useState(false);

  // Load initial data
  useEffect(() => {
    loadStats();
    loadComments();
  }, [statusFilter, paragraphFilter, searchQuery, currentPage, sortBy]);

  const loadStats = async () => {
    try {
      const statsData = await getLawCommentStats();
      setStats(statsData);

      // Extract unique paragraphs
      if (statsData.byParagraph) {
        const paragraphs = statsData.byParagraph.map((p) => ({
          id: p.paragraphId,
          title: p.sectionTitle || `סעיף ${p.orderIndex + 1}`,
        }));
        setParagraphOptions(paragraphs);
      }
    } catch (error) {
      console.error('Error loading stats:', error);
      toast.error('שגיאה בטעינת סטטיסטיקות');
    }
  };

  const loadComments = async () => {
    try {
      setLoading(true);

      const filters: CommentFilters = {};

      if (statusFilter !== 'ALL') {
        filters.status = statusFilter;
      }

      if (paragraphFilter !== 'ALL') {
        filters.paragraphId = paragraphFilter;
      }

      if (searchQuery.trim()) {
        filters.search = searchQuery.trim();
      }

      const offset = (currentPage - 1) * ITEMS_PER_PAGE;

      const data = await getAllLawComments(filters, {
        limit: ITEMS_PER_PAGE,
        offset,
      });

      setCommentsData(data);
    } catch (error) {
      console.error('Error loading comments:', error);
      toast.error('שגיאה בטעינת תגובות');
    } finally {
      setLoading(false);
    }
  };

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [statusFilter, paragraphFilter, searchQuery, sortBy]);

  const handleResetFilters = () => {
    setSearchQuery('');
    setStatusFilter('ALL');
    setParagraphFilter('ALL');
    setSortBy('date-desc');
    setSelectedComments(new Set());
  };

  const handleToggleComment = (commentId: number) => {
    const newSelected = new Set(selectedComments);
    if (newSelected.has(commentId)) {
      newSelected.delete(commentId);
    } else {
      if (newSelected.size >= MAX_BULK_OPERATIONS) {
        toast.error(`ניתן לבחור עד ${MAX_BULK_OPERATIONS} תגובות בבת אחת`);
        return;
      }
      newSelected.add(commentId);
    }
    setSelectedComments(newSelected);
  };

  const handleToggleAll = () => {
    if (!commentsData) return;

    if (selectedComments.size === commentsData.data.length) {
      setSelectedComments(new Set());
    } else {
      const allIds = commentsData.data.slice(0, MAX_BULK_OPERATIONS).map((c) => c.id);
      setSelectedComments(new Set(allIds));
    }
  };

  const handleApprove = async (commentId: number) => {
    try {
      const result = await approveComment(commentId, adminId);
      if (result.success) {
        toast.success(result.message || 'התגובה אושרה');
        await loadStats();
        await loadComments();
        setSelectedComments(new Set());
      } else {
        toast.error(result.error || 'שגיאה באישור התגובה');
      }
    } catch (error) {
      console.error('Error approving comment:', error);
      toast.error('שגיאה באישור התגובה');
    }
  };

  const handleReject = async (commentId: number) => {
    try {
      const result = await rejectComment(commentId, adminId);
      if (result.success) {
        toast.success(result.message || 'התגובה נדחתה');
        await loadStats();
        await loadComments();
        setSelectedComments(new Set());
      } else {
        toast.error(result.error || 'שגיאה בדחיית התגובה');
      }
    } catch (error) {
      console.error('Error rejecting comment:', error);
      toast.error('שגיאה בדחיית התגובה');
    }
  };

  const handleMarkAsSpam = async (commentId: number) => {
    try {
      const result = await markCommentAsSpam(commentId, adminId);
      if (result.success) {
        toast.success(result.message || 'התגובה סומנה כספאם');
        await loadStats();
        await loadComments();
        setSelectedComments(new Set());
      } else {
        toast.error(result.error || 'שגיאה בסימון התגובה');
      }
    } catch (error) {
      console.error('Error marking as spam:', error);
      toast.error('שגיאה בסימון התגובה כספאם');
    }
  };

  const handleDelete = async (commentId: number) => {
    if (!confirm('האם למחוק תגובה זו לצמיתות? פעולה זו לא ניתנת לביטול!')) {
      return;
    }

    try {
      const result = await deleteComment(commentId);
      if (result.success) {
        toast.success(result.message || 'התגובה נמחקה');
        await loadStats();
        await loadComments();
        setSelectedComments(new Set());
      } else {
        toast.error(result.error || 'שגיאה במחיקת התגובה');
      }
    } catch (error) {
      console.error('Error deleting comment:', error);
      toast.error('שגיאה במחיקת התגובה');
    }
  };

  const handleBulkApprove = async () => {
    if (selectedComments.size === 0) {
      toast.error('לא נבחרו תגובות');
      return;
    }

    try {
      const result = await bulkApproveComments(Array.from(selectedComments), adminId);
      if (result.success) {
        toast.success(result.message || 'התגובות אושרו');
        await loadStats();
        await loadComments();
        setSelectedComments(new Set());
      } else {
        toast.error(result.error || 'שגיאה באישור התגובות');
      }
    } catch (error) {
      console.error('Error bulk approving:', error);
      toast.error('שגיאה באישור התגובות');
    }
  };

  const handleBulkReject = async () => {
    if (selectedComments.size === 0) {
      toast.error('לא נבחרו תגובות');
      return;
    }

    try {
      const result = await bulkRejectComments(Array.from(selectedComments), adminId);
      if (result.success) {
        toast.success(result.message || 'התגובות נדחו');
        await loadStats();
        await loadComments();
        setSelectedComments(new Set());
      } else {
        toast.error(result.error || 'שגיאה בדחיית התגובות');
      }
    } catch (error) {
      console.error('Error bulk rejecting:', error);
      toast.error('שגיאה בדחיית התגובות');
    }
  };

  const handleBulkDelete = async () => {
    if (selectedComments.size === 0) {
      toast.error('לא נבחרו תגובות');
      return;
    }

    if (
      !confirm(
        `האם למחוק ${selectedComments.size} תגובות לצמיתות? פעולה זו לא ניתנת לביטול!`
      )
    ) {
      return;
    }

    try {
      // Delete one by one (no bulk delete in actions)
      let deletedCount = 0;
      for (const commentId of selectedComments) {
        const result = await deleteComment(commentId);
        if (result.success) {
          deletedCount++;
        }
      }

      toast.success(`${deletedCount} תגובות נמחקו`);
      await loadStats();
      await loadComments();
      setSelectedComments(new Set());
    } catch (error) {
      console.error('Error bulk deleting:', error);
      toast.error('שגיאה במחיקת התגובות');
    }
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('he-IL', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(date));
  };

  const truncateText = (text: string, maxLength: number = 100) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  const totalPages = commentsData
    ? Math.ceil(commentsData.total / ITEMS_PER_PAGE)
    : 0;

  return (
    <div className="space-y-6">
      {/* Statistics Dashboard */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Total Comments */}
          <Card className="border-blue-200 bg-blue-50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-blue-800">
                סה״כ תגובות
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-900">{stats.total}</div>
              <p className="text-xs text-blue-600 mt-1">
                {stats.total > 0
                  ? `100% מכלל התגובות`
                  : 'אין תגובות במערכת'}
              </p>
            </CardContent>
          </Card>

          {/* Pending Comments - Highlighted */}
          <Card className="border-yellow-300 bg-yellow-50 shadow-md">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-yellow-800 flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                ממתינות לאישור
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-yellow-900">{stats.pending}</div>
              <p className="text-xs text-yellow-600 mt-1">
                {stats.total > 0
                  ? `${Math.round((stats.pending / stats.total) * 100)}% מהתגובות`
                  : '0%'}
              </p>
            </CardContent>
          </Card>

          {/* Approved Comments */}
          <Card className="border-green-200 bg-green-50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-green-800">
                תגובות מאושרות
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-900">{stats.approved}</div>
              <p className="text-xs text-green-600 mt-1">
                {stats.total > 0
                  ? `${Math.round((stats.approved / stats.total) * 100)}% מהתגובות`
                  : '0%'}
              </p>
            </CardContent>
          </Card>

          {/* Rejected/Spam Comments */}
          <Card className="border-red-200 bg-red-50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-red-800">
                נדחו / ספאם
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-red-900">
                {stats.rejected + stats.spam}
              </div>
              <p className="text-xs text-red-600 mt-1">
                {stats.total > 0
                  ? `${Math.round(((stats.rejected + stats.spam) / stats.total) * 100)}% מהתגובות`
                  : '0%'}
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filter Panel */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            סינון תגובות
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Search */}
            <div className="space-y-2">
              <Label htmlFor="search">חיפוש</Label>
              <Input
                id="search"
                type="text"
                placeholder="חפש לפי תוכן או שם..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="text-right"
              />
            </div>

            {/* Status Filter */}
            <div className="space-y-2">
              <Label htmlFor="status">סטטוס</Label>
              <Select
                value={statusFilter}
                onValueChange={(value) => setStatusFilter(value as CommentStatus | 'ALL')}
              >
                <SelectTrigger id="status">
                  <SelectValue placeholder="כל הסטטוסים" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">כל הסטטוסים</SelectItem>
                  <SelectItem value="PENDING">ממתין לאישור</SelectItem>
                  <SelectItem value="APPROVED">אושר</SelectItem>
                  <SelectItem value="REJECTED">נדחה</SelectItem>
                  <SelectItem value="SPAM">ספאם</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Paragraph Filter */}
            <div className="space-y-2">
              <Label htmlFor="paragraph">סעיף</Label>
              <Select
                value={paragraphFilter.toString()}
                onValueChange={(value) =>
                  setParagraphFilter(value === 'ALL' ? 'ALL' : parseInt(value))
                }
              >
                <SelectTrigger id="paragraph">
                  <SelectValue placeholder="כל הסעיפים" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">כל הסעיפים</SelectItem>
                  {paragraphOptions.map((p) => (
                    <SelectItem key={p.id} value={p.id.toString()}>
                      {p.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Sort */}
            <div className="space-y-2">
              <Label htmlFor="sort">מיון</Label>
              <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
                <SelectTrigger id="sort">
                  <SelectValue placeholder="מיין לפי..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="date-desc">תאריך (חדש לישן)</SelectItem>
                  <SelectItem value="date-asc">תאריך (ישן לחדש)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="mt-4 flex gap-2">
            <Button variant="outline" size="sm" onClick={handleResetFilters}>
              <RefreshCw className="h-4 w-4 ml-2" />
              איפוס סינונים
            </Button>
            {(searchQuery || statusFilter !== 'ALL' || paragraphFilter !== 'ALL') && (
              <div className="text-sm text-gray-600 flex items-center">
                סינונים פעילים: {[searchQuery && 'חיפוש', statusFilter !== 'ALL' && 'סטטוס', paragraphFilter !== 'ALL' && 'סעיף'].filter(Boolean).join(', ')}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Comments Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>תגובות ({commentsData?.total || 0})</span>
            {selectedComments.size > 0 && (
              <span className="text-sm font-normal text-gray-600">
                {selectedComments.size} נבחרו
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <RefreshCw className="h-8 w-8 animate-spin mx-auto text-gray-400" />
              <p className="text-gray-600 mt-2">טוען תגובות...</p>
            </div>
          ) : !commentsData || commentsData.data.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <AlertCircle className="h-12 w-12 mx-auto mb-2 text-gray-400" />
              <p>לא נמצאו תגובות</p>
            </div>
          ) : (
            <>
              {/* Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-right">
                  <thead className="border-b bg-gray-50">
                    <tr>
                      <th className="p-3 w-12">
                        <Checkbox
                          checked={
                            commentsData.data.length > 0 &&
                            selectedComments.size === commentsData.data.length
                          }
                          onCheckedChange={handleToggleAll}
                        />
                      </th>
                      <th className="p-3 font-medium text-gray-700">סעיף</th>
                      <th className="p-3 font-medium text-gray-700">שם</th>
                      <th className="p-3 font-medium text-gray-700">תגובה</th>
                      <th className="p-3 font-medium text-gray-700">סטטוס</th>
                      <th className="p-3 font-medium text-gray-700">תאריך</th>
                      <th className="p-3 font-medium text-gray-700">פעולות</th>
                    </tr>
                  </thead>
                  <tbody>
                    {commentsData.data.map((comment) => (
                      <tr
                        key={comment.id}
                        className="border-b hover:bg-gray-50 transition-colors"
                      >
                        <td className="p-3">
                          <Checkbox
                            checked={selectedComments.has(comment.id)}
                            onCheckedChange={() => handleToggleComment(comment.id)}
                          />
                        </td>
                        <td className="p-3">
                          <div className="text-sm font-medium">
                            {comment.paragraph?.sectionTitle ||
                              `סעיף ${(comment.paragraph?.orderIndex ?? 0) + 1}`}
                          </div>
                        </td>
                        <td className="p-3">
                          <div className="text-sm">
                            {comment.firstName} {comment.lastName}
                          </div>
                          <div className="text-xs text-gray-500">{comment.email}</div>
                        </td>
                        <td className="p-3 max-w-xs">
                          <div className="text-sm">{truncateText(comment.commentContent)}</div>
                          {comment.suggestedEdit && (
                            <div className="text-xs text-blue-600 mt-1">
                              יש הצעת תיקון
                            </div>
                          )}
                        </td>
                        <td className="p-3">
                          <Badge
                            variant="outline"
                            className={COMMENT_STATUS_COLORS[comment.status]}
                          >
                            {COMMENT_STATUS_LABELS[comment.status]}
                          </Badge>
                        </td>
                        <td className="p-3 text-sm text-gray-600">
                          {formatDate(comment.submittedAt)}
                        </td>
                        <td className="p-3">
                          <div className="flex gap-1">
                            {comment.status === 'PENDING' && (
                              <>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-8 px-2 text-green-600 hover:text-green-700 hover:bg-green-50"
                                  onClick={() => handleApprove(comment.id)}
                                  title="אשר"
                                >
                                  <CheckCircle className="h-4 w-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-8 px-2 text-red-600 hover:text-red-700 hover:bg-red-50"
                                  onClick={() => handleReject(comment.id)}
                                  title="דחה"
                                >
                                  <XCircle className="h-4 w-4" />
                                </Button>
                              </>
                            )}
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-8 px-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                              onClick={() => setDetailComment(comment)}
                              title="הצג פרטים"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-8 px-2 text-red-600 hover:text-red-700 hover:bg-red-50"
                              onClick={() => handleDelete(comment.id)}
                              title="מחק"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="mt-4 flex items-center justify-between">
                  <div className="text-sm text-gray-600">
                    עמוד {currentPage} מתוך {totalPages}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                    >
                      <ChevronRight className="h-4 w-4" />
                      הקודם
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                    >
                      הבא
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}

              {/* Bulk Actions */}
              {selectedComments.size > 0 && (
                <div className="mt-4 p-4 bg-gray-50 border rounded-lg">
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-medium">
                      {selectedComments.size} תגובות נבחרו
                      {selectedComments.size >= MAX_BULK_OPERATIONS && (
                        <span className="text-yellow-600 mr-2">
                          (מקסימום {MAX_BULK_OPERATIONS})
                        </span>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-green-600 hover:bg-green-50"
                        onClick={handleBulkApprove}
                      >
                        <CheckCircle className="h-4 w-4 ml-2" />
                        אשר הכל
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-red-600 hover:bg-red-50"
                        onClick={handleBulkReject}
                      >
                        <XCircle className="h-4 w-4 ml-2" />
                        דחה הכל
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-red-600 hover:bg-red-50"
                        onClick={handleBulkDelete}
                      >
                        <Trash2 className="h-4 w-4 ml-2" />
                        מחק הכל
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Detail Dialog */}
      {detailComment && (
        <CommentDetailDialog
          comment={detailComment}
          adminId={adminId}
          onClose={() => setDetailComment(null)}
          onAction={async () => {
            await loadStats();
            await loadComments();
            setDetailComment(null);
          }}
        />
      )}
    </div>
  );
}
