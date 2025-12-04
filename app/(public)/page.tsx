/*
 * AUTH PRESERVATION NOTES (2025-11-30)
 * =====================================
 * Landing page moved from (protected) to (public) route group to allow public access
 *
 * TO REVERT TO FULLY PROTECTED MODE:
 * 1. Move this file back to app/(protected)/page.tsx
 * 2. Delete app/(public)/ directory
 * 3. Restore PageHeader to receive user prop instead of fetching session (see PageHeader component)
 * 4. Uncomment session requirement in line 13 (change from optional to required)
 *
 * Original protected layout preserved at: app/(protected)/layout.tsx
 */

import { getMKs, getCoalitionPositionStats, getPositionStats, getFactions } from '../actions/mk-actions';
import { StatsDashboard } from '@/components/stats-dashboard';
import { ChartsPanel } from '@/components/ChartsPanel';
import { MKList } from '@/components/mk-list';
import { PageHeader } from '@/components/page-header';
import NewsPostsSection from '@/components/news-posts/NewsPostsSection';
import { VideoSection } from '@/components/video/VideoSection';
import { ElHadegelButton } from '@/components/ElHadegelButton';
import { auth } from '@/auth';
import { isCoalitionMember } from '@/lib/coalition';
import Image from 'next/image';

export default async function HomePage() {
  // Get session for header (optional - page is public)
  const session = await auth();

  // Fetch all data in parallel (including tweet counts, status info counts, and historical comment counts for MKs)
  const [mks, coalitionStats, allStats, factions] = await Promise.all([
    getMKs(undefined, true, true, true), // Include tweet counts, status info counts, and historical comment counts
    getCoalitionPositionStats(), // Coalition members only (~68 MKs) - for StatsDashboard
    getPositionStats(), // All 120 MKs - for ChartsPanel
    getFactions(),
  ]);

  // Filter coalition MKs for tooltip data
  const coalitionMKs = mks.filter(mk => isCoalitionMember(mk.faction));

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      <PageHeader session={session} />
      <div className="w-full px-4 sm:px-6 lg:px-12 py-8">
        {/* Main content - 2-column on desktop, stacked on mobile */}
        <div className="flex flex-col lg:grid lg:grid-cols-[65%_35%] lg:gap-8 gap-6 md:gap-8">

          {/* LEFT COLUMN - Statistics, Buttons, and Charts */}
          <div className="space-y-6 md:space-y-8 lg:space-y-12 order-1 lg:order-1 lg:col-start-1">

            {/* Statistics Dashboard */}
            <section className="relative overflow-visible rounded-2xl bg-white/90 backdrop-blur-sm shadow-xl z-50">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-50/30 to-green-50/30 pointer-events-none" />
              <div className="relative z-10 p-6 md:p-8">
                <StatsDashboard stats={coalitionStats} coalitionMKs={coalitionMKs} />
              </div>
            </section>

            {/* El Hadegel Buttons */}
            <div className="flex justify-center">
              <div className="flex flex-row items-center gap-3 sm:gap-4 md:gap-6">
                <ElHadegelButton
                  text="הצטרף לתנועה"
                  href="https://www.elhadegel.co.il/"
                  ariaLabel="הצטרף לתנועה - אל הדגל"
                />
                <ElHadegelButton
                  text="המתווה שלנו"
                  href="https://www.elhadegel.co.il/legislation"
                  ariaLabel="המתווה שלנו - אל הדגל"
                />
              </div>
            </div>

            {/* Video Section */}
            <section className="relative overflow-hidden rounded-2xl bg-white/80 backdrop-blur-sm shadow-lg">
              <div className="absolute inset-0 bg-gradient-to-br from-orange-50/50 to-red-50/50 pointer-events-none" />
              <div className="relative z-10 p-6">
                <VideoSection />
              </div>
            </section>

            {/* Interactive Charts */}
            <section className="relative overflow-hidden rounded-2xl bg-white/80 backdrop-blur-sm shadow-lg p-6">
              <div className="absolute inset-0 bg-gradient-to-tr from-[#0058ff]/5 to-[#23b33a]/5 pointer-events-none" />
              <div className="relative z-10">
                <ChartsPanel
                  initialStats={allStats}
                  availableFactions={factions}
                  allMKs={mks}
                />
              </div>
            </section>

          </div>

          {/* News Posts - sticky on desktop, appears before MK list on mobile */}
          <div className="lg:sticky lg:top-8 lg:self-start order-2 lg:order-2 lg:col-start-2 lg:row-start-1">
            <section className="relative overflow-hidden rounded-2xl bg-white/80 backdrop-blur-sm shadow-lg">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 to-indigo-50/50 pointer-events-none" />
              <div className="relative z-10">
                <NewsPostsSection />
              </div>
            </section>
          </div>

          {/* MK List with Filters - appears after news on mobile, spans full width in left column on desktop */}
          <section className="relative overflow-hidden rounded-2xl bg-white/80 backdrop-blur-sm shadow-lg p-6 order-3 lg:order-3 lg:col-start-1 lg:row-start-2">
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
