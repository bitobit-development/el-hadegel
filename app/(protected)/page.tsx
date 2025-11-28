import { getMKs, getPositionStats, getFactions } from '../actions/mk-actions';
import { StatsDashboard } from '@/components/stats-dashboard';
import { ChartsPanel } from '@/components/ChartsPanel';
import { MKList } from '@/components/mk-list';
import { PageHeader } from '@/components/page-header';
import NewsPostsSection from '@/components/news-posts/NewsPostsSection';
import { auth } from '@/auth';
import Image from 'next/image';

export default async function HomePage() {
  // Get session for header
  const session = await auth();

  // Fetch all data in parallel (including tweet counts and status info counts for MKs)
  const [mks, stats, factions] = await Promise.all([
    getMKs(undefined, true, true), // Include tweet counts and status info counts
    getPositionStats(),
    getFactions(),
  ]);

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      <PageHeader user={session!.user} />
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Main content sections with consistent spacing */}
        <div className="space-y-6 md:space-y-8 lg:space-y-12">
          {/* News Posts Section - appears FIRST */}
          <section className="relative overflow-hidden rounded-2xl bg-white/80 backdrop-blur-sm shadow-lg">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 to-indigo-50/50 pointer-events-none" />
            <div className="relative z-10">
              <NewsPostsSection />
            </div>
          </section>

          {/* Statistics Dashboard with gradient overlay */}
          <section className="relative overflow-hidden rounded-2xl bg-white/80 backdrop-blur-sm shadow-lg">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 to-green-50/50 pointer-events-none" />
            <div className="relative z-10">
              <StatsDashboard stats={stats} />
            </div>
          </section>

          {/* Interactive Charts with gradient overlay */}
          <section className="relative overflow-hidden rounded-2xl bg-white/80 backdrop-blur-sm shadow-lg p-6">
            <div className="absolute inset-0 bg-gradient-to-tr from-[#0058ff]/5 to-[#23b33a]/5 pointer-events-none" />
            <div className="relative z-10">
              <ChartsPanel
                initialStats={stats}
                availableFactions={factions}
                allMKs={mks}
              />
            </div>
          </section>

          {/* MK List with Filters with gradient overlay */}
          <section className="relative overflow-hidden rounded-2xl bg-white/80 backdrop-blur-sm shadow-lg p-6">
            <div className="absolute inset-0 bg-gradient-to-bl from-blue-50/40 to-green-50/40 pointer-events-none" />
            <div className="relative z-10">
              <MKList mks={mks} factions={factions} />
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
