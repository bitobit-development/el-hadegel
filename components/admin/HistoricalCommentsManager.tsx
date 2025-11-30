'use client';

import { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
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
  Search,
  Filter,
  Eye,
  CheckCircle,
  XCircle,
  Trash2,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  Calendar,
  X as XIcon,
} from 'lucide-react';
import {
  formatCommentDate,
  truncateComment,
  getPlatformColor,
  getSourceTypeLabel,
  getCredibilityInfo,
} from '@/lib/comment-utils';
import {
  bulkVerifyHistoricalComments,
  bulkDeleteHistoricalComments,
} from '@/app/actions/admin-historical-comment-actions';
import { HistoricalCommentDetailDialog } from './HistoricalCommentDetailDialog';
import type { HistoricalCommentData } from '@/app/actions/historical-comment-actions';

interface HistoricalCommentsManagerProps {
  initialComments: (HistoricalCommentData & { mkName?: string; mkFaction?: string })[];
  totalCount: number;
  coalitionMKs: Array<{ id: number; nameHe: string; faction: string }>;
}

type SortField = 'mkName' | 'platform' | 'credibility' | 'date';
type SortDirection = 'asc' | 'desc';

const PLATFORMS = ['News', 'Twitter', 'Facebook', 'YouTube', 'Knesset', 'Interview', 'Other'];
const ITEMS_PER_PAGE = 50;

export function HistoricalCommentsManager({
  initialComments,
  totalCount,
  coalitionMKs,
}: HistoricalCommentsManagerProps) {
  const router = useRouter();
  const [comments] = useState(initialComments);
  const [selectedComments, setSelectedComments] = useState<Set<number>>(new Set());
  const [detailComment, setDetailComment] = useState<typeof initialComments[0] | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showFilters, setShowFilters] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMK, setSelectedMK] = useState<string>('all');
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
  const [verificationFilter, setVerificationFilter] = useState<'all' | 'verified' | 'unverified'>('all');
  const [sourceTypeFilter, setSourceTypeFilter] = useState<'all' | 'Primary' | 'Secondary'>('all');

  // Sorting and Pagination
  const [sortField, setSortField] = useState<SortField>('date');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [currentPage, setCurrentPage] = useState(1);

  // Apply filters
  const filteredComments = useMemo(() => {
    return comments.filter((comment) => {
      // Search filter
      if (searchQuery) {
        const searchLower = searchQuery.toLowerCase();
        if (
          !comment.content.toLowerCase().includes(searchLower) &&
          !(comment.mkName?.toLowerCase().includes(searchLower)) &&
          !(comment.sourceName?.toLowerCase().includes(searchLower))
        ) {
          return false;
        }
      }

      // MK filter
      if (selectedMK !== 'all' && comment.mkId !== parseInt(selectedMK)) {
        return false;
      }

      // Platform filter
      if (selectedPlatforms.length > 0 && !selectedPlatforms.includes(comment.sourcePlatform)) {
        return false;
      }

      // Verification filter
      if (verificationFilter === 'verified' && !comment.isVerified) return false;
      if (verificationFilter === 'unverified' && comment.isVerified) return false;

      // Source type filter
      if (sourceTypeFilter !== 'all' && comment.sourceType !== sourceTypeFilter) {
        return false;
      }

      return true;
    });
  }, [comments, searchQuery, selectedMK, selectedPlatforms, verificationFilter, sourceTypeFilter]);

  // Apply sorting
  const sortedComments = useMemo(() => {
    const sorted = [...filteredComments];
    sorted.sort((a, b) => {
      let comparison = 0;

      switch (sortField) {
        case 'mkName':
          comparison = (a.mkName || '').localeCompare(b.mkName || '', 'he');
          break;
        case 'platform':
          comparison = a.sourcePlatform.localeCompare(b.sourcePlatform);
          break;
        case 'credibility':
          comparison = a.sourceCredibility - b.sourceCredibility;
          break;
        case 'date':
          comparison = new Date(a.commentDate).getTime() - new Date(b.commentDate).getTime();
          break;
      }

      return sortDirection === 'asc' ? comparison : -comparison;
    });

    return sorted;
  }, [filteredComments, sortField, sortDirection]);

  // Pagination
  const totalPages = Math.ceil(sortedComments.length / ITEMS_PER_PAGE);
  const paginatedComments = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return sortedComments.slice(start, start + ITEMS_PER_PAGE);
  }, [sortedComments, currentPage]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedMK, selectedPlatforms, verificationFilter, sourceTypeFilter]);

  const activeFilterCount =
    (searchQuery ? 1 : 0) +
    (selectedMK !== 'all' ? 1 : 0) +
    selectedPlatforms.length +
    (verificationFilter !== 'all' ? 1 : 0) +
    (sourceTypeFilter !== 'all' ? 1 : 0);

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedMK('all');
    setSelectedPlatforms([]);
    setVerificationFilter('all');
    setSourceTypeFilter('all');
  };

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const togglePlatform = (platform: string) => {
    setSelectedPlatforms((prev) =>
      prev.includes(platform) ? prev.filter((p) => p !== platform) : [...prev, platform]
    );
  };

  const toggleComment = (id: number) => {
    const newSelected = new Set(selectedComments);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedComments(newSelected);
  };

  const toggleAllVisible = () => {
    if (selectedComments.size === paginatedComments.length) {
      setSelectedComments(new Set());
    } else {
      setSelectedComments(new Set(paginatedComments.map((c) => c.id)));
    }
  };

  const handleBulkVerify = async (verified: boolean) => {
    if (selectedComments.size === 0) return;

    const result = await bulkVerifyHistoricalComments(Array.from(selectedComments), verified);

    if (result.success > 0) {
      setSelectedComments(new Set());
      router.refresh();
    }

    if (result.failed > 0) {
      alert(`${result.failed} ציטוטים נכשלו באימות`);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedComments.size === 0) return;

    setIsDeleting(true);
    try {
      const result = await bulkDeleteHistoricalComments(Array.from(selectedComments));

      if (result.success > 0) {
        setSelectedComments(new Set());
        setShowDeleteConfirm(false);
        router.refresh();
      }

      if (result.failed > 0) {
        alert(`${result.failed} ציטוטים נכשלו במחיקה`);
      }
    } catch (error) {
      console.error('Error bulk deleting:', error);
      alert('אירעה שגיאה במחיקה');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
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
            {/* Search */}
            <div className="space-y-2">
              <Label htmlFor="search">חיפוש חופשי</Label>
              <div className="relative">
                <Search className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="חפש לפי תוכן, שם חבר כנסת או מקור..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pr-10 text-right"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* MK Filter */}
              <div className="space-y-2">
                <Label htmlFor="mk-filter">חבר כנסת</Label>
                <Select value={selectedMK} onValueChange={setSelectedMK}>
                  <SelectTrigger id="mk-filter">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">כל חברי הכנסת</SelectItem>
                    {coalitionMKs.map((mk) => (
                      <SelectItem key={mk.id} value={mk.id.toString()}>
                        {mk.nameHe} ({mk.faction})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Verification Filter */}
              <div className="space-y-2">
                <Label htmlFor="verification-filter">סטטוס אימות</Label>
                <Select
                  value={verificationFilter}
                  onValueChange={(v) => setVerificationFilter(v as any)}
                >
                  <SelectTrigger id="verification-filter">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">הכל</SelectItem>
                    <SelectItem value="verified">מאומתים</SelectItem>
                    <SelectItem value="unverified">לא מאומתים</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Source Type Filter */}
              <div className="space-y-2">
                <Label htmlFor="source-type-filter">סוג מקור</Label>
                <Select
                  value={sourceTypeFilter}
                  onValueChange={(v) => setSourceTypeFilter(v as any)}
                >
                  <SelectTrigger id="source-type-filter">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">הכל</SelectItem>
                    <SelectItem value="Primary">ראשוני</SelectItem>
                    <SelectItem value="Secondary">משני</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Platform Checkboxes */}
            <div className="space-y-2">
              <Label>פלטפורמות</Label>
              <div className="flex flex-wrap gap-3">
                {PLATFORMS.map((platform) => (
                  <div key={platform} className="flex items-center gap-2">
                    <Checkbox
                      id={`platform-${platform}`}
                      checked={selectedPlatforms.includes(platform)}
                      onCheckedChange={() => togglePlatform(platform)}
                    />
                    <Label
                      htmlFor={`platform-${platform}`}
                      className="cursor-pointer font-normal"
                    >
                      {platform}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Bulk Actions */}
      {selectedComments.size > 0 && (
        <Card className="bg-purple-50 border-purple-200">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between gap-4">
              <div className="text-sm font-medium">
                {selectedComments.size} ציטוטים נבחרו
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => handleBulkVerify(true)}
                  className="gap-2"
                  size="sm"
                >
                  <CheckCircle className="h-4 w-4" />
                  אמת הכל
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handleBulkVerify(false)}
                  className="gap-2"
                  size="sm"
                >
                  <XCircle className="h-4 w-4" />
                  בטל אימות
                </Button>
                {!showDeleteConfirm ? (
                  <Button
                    variant="destructive"
                    onClick={() => setShowDeleteConfirm(true)}
                    className="gap-2"
                    size="sm"
                  >
                    <Trash2 className="h-4 w-4" />
                    מחק
                  </Button>
                ) : (
                  <div className="flex gap-2">
                    <Button
                      variant="destructive"
                      onClick={handleBulkDelete}
                      disabled={isDeleting}
                      size="sm"
                    >
                      {isDeleting ? 'מוחק...' : 'אישור מחיקה'}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setShowDeleteConfirm(false)}
                      disabled={isDeleting}
                      size="sm"
                    >
                      ביטול
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-right">ציטוטים היסטוריים</CardTitle>
            <CardDescription className="text-right">
              מציג {paginatedComments.length} מתוך {sortedComments.length} ציטוטים
              {sortedComments.length !== totalCount && ` (סה"כ ${totalCount} במערכת)`}
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          {/* Desktop Table View */}
          <div className="hidden lg:block overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b text-right">
                  <th className="p-3 text-center w-12">
                    <Checkbox
                      checked={paginatedComments.length > 0 && selectedComments.size === paginatedComments.length}
                      onCheckedChange={toggleAllVisible}
                    />
                  </th>
                  <th className="p-3 font-semibold">
                    <button
                      onClick={() => toggleSort('mkName')}
                      className="flex items-center gap-1 hover:text-purple-600"
                    >
                      חבר כנסת
                      {sortField === 'mkName' && <ArrowUpDown className="h-3 w-3" />}
                    </button>
                  </th>
                  <th className="p-3 font-semibold">תוכן</th>
                  <th className="p-3 font-semibold">
                    <button
                      onClick={() => toggleSort('platform')}
                      className="flex items-center gap-1 hover:text-purple-600"
                    >
                      פלטפורמה
                      {sortField === 'platform' && <ArrowUpDown className="h-3 w-3" />}
                    </button>
                  </th>
                  <th className="p-3 font-semibold">סוג</th>
                  <th className="p-3 font-semibold">
                    <button
                      onClick={() => toggleSort('credibility')}
                      className="flex items-center gap-1 hover:text-purple-600"
                    >
                      אמינות
                      {sortField === 'credibility' && <ArrowUpDown className="h-3 w-3" />}
                    </button>
                  </th>
                  <th className="p-3 font-semibold">אימות</th>
                  <th className="p-3 font-semibold">
                    <button
                      onClick={() => toggleSort('date')}
                      className="flex items-center gap-1 hover:text-purple-600"
                    >
                      תאריך
                      {sortField === 'date' && <ArrowUpDown className="h-3 w-3" />}
                    </button>
                  </th>
                  <th className="p-3 font-semibold">פעולות</th>
                </tr>
              </thead>
              <tbody>
                {paginatedComments.map((comment) => {
                  const credibilityInfo = getCredibilityInfo(comment.sourceCredibility);
                  return (
                    <tr
                      key={comment.id}
                      className="border-b hover:bg-muted/50 transition-colors"
                    >
                      <td className="p-3 text-center" onClick={(e) => e.stopPropagation()}>
                        <Checkbox
                          checked={selectedComments.has(comment.id)}
                          onCheckedChange={() => toggleComment(comment.id)}
                        />
                      </td>
                      <td className="p-3">
                        <div className="text-sm font-medium">{comment.mkName}</div>
                        <div className="text-xs text-muted-foreground">{comment.mkFaction}</div>
                      </td>
                      <td className="p-3 max-w-md">
                        <div className="text-sm text-right">{truncateComment(comment.content, 100)}</div>
                      </td>
                      <td className="p-3">
                        <Badge variant="secondary" className={`text-xs ${getPlatformColor(comment.sourcePlatform)}`}>
                          {comment.sourcePlatform}
                        </Badge>
                      </td>
                      <td className="p-3">
                        <Badge
                          variant={comment.sourceType === 'Primary' ? 'default' : 'outline'}
                          className={`text-xs ${comment.sourceType === 'Primary' ? 'bg-green-600' : ''}`}
                        >
                          {getSourceTypeLabel(comment.sourceType)}
                        </Badge>
                      </td>
                      <td className="p-3">
                        <span className={`text-sm font-medium ${credibilityInfo.color}`}>
                          {comment.sourceCredibility}/10
                        </span>
                      </td>
                      <td className="p-3 text-center">
                        {comment.isVerified ? (
                          <CheckCircle className="h-4 w-4 text-green-600 inline-block" />
                        ) : (
                          <XCircle className="h-4 w-4 text-gray-400 inline-block" />
                        )}
                      </td>
                      <td className="p-3">
                        <div className="text-sm">{formatCommentDate(comment.commentDate)}</div>
                      </td>
                      <td className="p-3">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setDetailComment(comment)}
                          className="gap-1"
                        >
                          <Eye className="h-4 w-4" />
                          צפה
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile Card View */}
          <div className="lg:hidden space-y-4">
            {paginatedComments.map((comment) => (
              <Card key={comment.id} className="border-r-4 border-r-purple-500">
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-start gap-3">
                    <Checkbox
                      checked={selectedComments.has(comment.id)}
                      onCheckedChange={() => toggleComment(comment.id)}
                    />
                    <div className="flex-1 space-y-2">
                      <div>
                        <div className="font-medium">{comment.mkName}</div>
                        <div className="text-sm text-muted-foreground">{comment.mkFaction}</div>
                      </div>
                      <p className="text-sm text-right">{truncateComment(comment.content, 150)}</p>
                      <div className="flex flex-wrap gap-2 items-center">
                        <Badge variant="secondary" className={getPlatformColor(comment.sourcePlatform)}>
                          {comment.sourcePlatform}
                        </Badge>
                        <Badge variant={comment.sourceType === 'Primary' ? 'default' : 'outline'}>
                          {getSourceTypeLabel(comment.sourceType)}
                        </Badge>
                        {comment.isVerified && (
                          <Badge variant="outline" className="text-green-600 border-green-600">
                            מאומת
                          </Badge>
                        )}
                        <span className="text-xs text-muted-foreground">
                          {formatCommentDate(comment.commentDate)}
                        </span>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setDetailComment(comment)}
                        className="w-full gap-2"
                      >
                        <Eye className="h-4 w-4" />
                        צפה בפרטים
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Empty State */}
          {paginatedComments.length === 0 && (
            <div className="text-center py-12">
              <p className="text-muted-foreground">
                {activeFilterCount > 0 ? 'לא נמצאו ציטוטים התואמים לסינון' : 'אין ציטוטים במערכת'}
              </p>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-6 pt-4 border-t">
              <div className="text-sm text-muted-foreground">
                עמוד {currentPage} מתוך {totalPages}
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronRight className="h-4 w-4" />
                  הקודם
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                >
                  הבא
                  <ChevronLeft className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Detail Dialog */}
      {detailComment && (
        <HistoricalCommentDetailDialog
          comment={detailComment}
          isOpen={!!detailComment}
          onClose={() => setDetailComment(null)}
          onUpdate={() => {
            setDetailComment(null);
            router.refresh();
          }}
        />
      )}
    </>
  );
}
