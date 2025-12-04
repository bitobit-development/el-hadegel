import { AdminVideoManager } from '@/components/admin/videos/AdminVideoManager';
import { getAllVideos, getVideoStats } from '@/app/actions/video-actions';

// Force dynamic rendering to prevent caching issues
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function AdminVideosPage() {
  // Fetch videos and stats (auth handled by parent layout)
  const [videos, stats] = await Promise.all([
    getAllVideos(),
    getVideoStats(),
  ]);

  return (
    <div className="space-y-6">
      {/* Page Title */}
      <div>
        <h1 className="text-3xl font-bold mb-2 text-right">ניהול סרטונים</h1>
        <p className="text-muted-foreground text-right">
          העלאה, עריכה, מחיקה וסידור סרטוני וידאו
        </p>
      </div>

      {/* Main Component */}
      <AdminVideoManager initialVideos={videos} initialStats={stats} />
    </div>
  );
}
