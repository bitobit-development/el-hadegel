import { getMKs, getPositionStats } from '@/app/actions/mk-actions';
import { AdminMKTable } from '@/components/admin/admin-mk-table';
import { StatsDashboard } from '@/components/stats-dashboard';

export default async function AdminPage() {
  const [mks, stats] = await Promise.all([getMKs(), getPositionStats()]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold mb-2 text-right">לוח בקרה</h1>
        <p className="text-muted-foreground text-right">
          נהל את עמדות חברי הכנסת על חוק הגיוס
        </p>
      </div>

      <StatsDashboard stats={stats} />

      <AdminMKTable mks={mks} />
    </div>
  );
}
