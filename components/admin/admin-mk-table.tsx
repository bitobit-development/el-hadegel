'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { MKData, PositionStatus, POSITION_LABELS } from '@/types/mk';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { PositionBadge } from '@/components/position-badge';
import { updateMKPosition, bulkUpdatePositions } from '@/app/actions/mk-actions';
import { PositionUpdateDialog } from './position-update-dialog';
import { PositionHistoryDialog } from './position-history-dialog';
import { CreateStatusInfoDialog } from './CreateStatusInfoDialog';
import { AdminFilterPanel } from './admin-filter-panel';
import { History, Info } from 'lucide-react';
import { isStatusInfoEnabled } from '@/lib/feature-flags';
import { isCoalitionMember, CoalitionStatus } from '@/lib/coalition-utils';

interface AdminMKTableProps {
  mks: MKData[];
  adminEmail: string;
}

export function AdminMKTable({ mks, adminEmail }: AdminMKTableProps) {
  const router = useRouter();
  const [selectedMKs, setSelectedMKs] = useState<Set<number>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCoalitionStatus, setSelectedCoalitionStatus] = useState<CoalitionStatus[]>([]);
  const [selectedPositions, setSelectedPositions] = useState<PositionStatus[]>([]);
  const [selectedFactions, setSelectedFactions] = useState<string[]>([]);
  const [editingMK, setEditingMK] = useState<MKData | null>(null);
  const [historyMK, setHistoryMK] = useState<MKData | null>(null);
  const [statusInfoMK, setStatusInfoMK] = useState<MKData | null>(null);
  const [bulkUpdateDialogOpen, setBulkUpdateDialogOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  // Get unique factions
  const allFactions = useMemo(() => {
    const factions = Array.from(new Set(mks.map((mk) => mk.faction)));
    return factions.sort((a, b) => a.localeCompare(b, 'he'));
  }, [mks]);

  // Apply all filters
  const filteredMKs = useMemo(() => {
    return mks.filter((mk) => {
      // Search filter (name or faction)
      if (searchQuery && !mk.nameHe.includes(searchQuery) && !mk.faction.includes(searchQuery)) {
        return false;
      }

      // Coalition status filter
      if (selectedCoalitionStatus.length > 0) {
        const isCoalition = isCoalitionMember(mk.faction);
        const statusMatch = selectedCoalitionStatus.some((status) =>
          status === 'coalition' ? isCoalition : !isCoalition
        );
        if (!statusMatch) return false;
      }

      // Position filter
      if (selectedPositions.length > 0 && !selectedPositions.includes(mk.currentPosition)) {
        return false;
      }

      // Faction filter
      if (selectedFactions.length > 0 && !selectedFactions.includes(mk.faction)) {
        return false;
      }

      return true;
    });
  }, [mks, searchQuery, selectedCoalitionStatus, selectedPositions, selectedFactions]);

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedCoalitionStatus([]);
    setSelectedPositions([]);
    setSelectedFactions([]);
  };

  const activeFilterCount =
    (searchQuery ? 1 : 0) +
    selectedCoalitionStatus.length +
    selectedPositions.length +
    selectedFactions.length;

  const toggleMK = (mkId: number) => {
    const newSelected = new Set(selectedMKs);
    if (newSelected.has(mkId)) {
      newSelected.delete(mkId);
    } else {
      newSelected.add(mkId);
    }
    setSelectedMKs(newSelected);
  };

  const toggleAll = () => {
    if (selectedMKs.size === filteredMKs.length) {
      setSelectedMKs(new Set());
    } else {
      setSelectedMKs(new Set(filteredMKs.map((mk) => mk.id)));
    }
  };

  const handleSingleUpdate = async (
    position: PositionStatus,
    notes?: string
  ) => {
    if (!editingMK) return;

    setLoading(true);
    try {
      await updateMKPosition(editingMK.id, position, 'admin@el-hadegel.com', notes);
      router.refresh();
      setEditingMK(null);
    } catch (error) {
      console.error('Error updating position:', error);
      alert('אירעה שגיאה בעדכון העמדה');
    } finally {
      setLoading(false);
    }
  };

  const handleBulkUpdate = async (position: PositionStatus) => {
    if (selectedMKs.size === 0) return;

    setLoading(true);
    try {
      await bulkUpdatePositions(Array.from(selectedMKs), position, 'admin@el-hadegel.com');
      router.refresh();
      setSelectedMKs(new Set());
      setBulkUpdateDialogOpen(false);
    } catch (error) {
      console.error('Error bulk updating positions:', error);
      alert('אירעה שגיאה בעדכון המוני');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <AdminFilterPanel
        factions={allFactions}
        selectedCoalitionStatus={selectedCoalitionStatus}
        selectedPositions={selectedPositions}
        selectedFactions={selectedFactions}
        searchQuery={searchQuery}
        onCoalitionStatusChange={setSelectedCoalitionStatus}
        onPositionChange={setSelectedPositions}
        onFactionChange={setSelectedFactions}
        onSearchChange={setSearchQuery}
        onClearFilters={clearFilters}
      />

      <Card>
        <CardHeader>
          <CardTitle className="text-right">ניהול עמדות חברי כנסת</CardTitle>
          <CardDescription className="text-right">
            סמן חברי כנסת לעדכון מוני או לחץ על שורה לעדכון פרטני
          </CardDescription>
          {selectedMKs.size > 0 && (
            <div className="mt-4">
              <Button onClick={() => setBulkUpdateDialogOpen(true)}>
                עדכון {selectedMKs.size} נבחרים
              </Button>
            </div>
          )}
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b text-right">
                  <th className="p-3 text-center">
                    <Checkbox
                      checked={
                        filteredMKs.length > 0 && selectedMKs.size === filteredMKs.length
                      }
                      onCheckedChange={toggleAll}
                    />
                  </th>
                  <th className="p-3 font-semibold">שם</th>
                  <th className="p-3 font-semibold">סיעה</th>
                  <th className="p-3 font-semibold">עמדה נוכחית</th>
                  <th className="p-3 font-semibold">פעולות</th>
                </tr>
              </thead>
              <tbody>
                {filteredMKs.map((mk) => (
                  <tr
                    key={mk.id}
                    className="border-b hover:bg-muted/50 cursor-pointer transition-colors"
                    onClick={(e) => {
                      if ((e.target as HTMLElement).closest('button, input')) return;
                      setEditingMK(mk);
                    }}
                  >
                    <td className="p-3 text-center" onClick={(e) => e.stopPropagation()}>
                      <Checkbox
                        checked={selectedMKs.has(mk.id)}
                        onCheckedChange={() => toggleMK(mk.id)}
                      />
                    </td>
                    <td className="p-3 text-right font-medium">{mk.nameHe}</td>
                    <td className="p-3 text-right text-sm text-muted-foreground">
                      {mk.faction}
                    </td>
                    <td className="p-3">
                      <PositionBadge position={mk.currentPosition} />
                    </td>
                    <td className="p-3" onClick={(e) => e.stopPropagation()}>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setEditingMK(mk)}
                        >
                          עדכן עמדה
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setHistoryMK(mk)}
                          title="היסטוריית שינויים"
                        >
                          <History className="h-4 w-4" />
                        </Button>
                        {isStatusInfoEnabled() && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setStatusInfoMK(mk)}
                            title="הוסף מידע"
                          >
                            <Info className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-4 text-sm text-muted-foreground text-right">
            מציג {filteredMKs.length} מתוך {mks.length} חברי כנסת
            {activeFilterCount > 0 && ` (${activeFilterCount} סננים פעילים)`}
          </div>
        </CardContent>
      </Card>

      {editingMK && (
        <PositionUpdateDialog
          mk={editingMK}
          open={!!editingMK}
          onClose={() => setEditingMK(null)}
          onUpdate={handleSingleUpdate}
          loading={loading}
        />
      )}

      {bulkUpdateDialogOpen && (
        <PositionUpdateDialog
          open={bulkUpdateDialogOpen}
          onClose={() => setBulkUpdateDialogOpen(false)}
          onUpdate={(position) => handleBulkUpdate(position)}
          loading={loading}
          isBulk
          count={selectedMKs.size}
        />
      )}

      {historyMK && (
        <PositionHistoryDialog
          mk={historyMK}
          open={!!historyMK}
          onClose={() => setHistoryMK(null)}
        />
      )}

      {statusInfoMK && (
        <CreateStatusInfoDialog
          mkId={statusInfoMK.id}
          mkName={statusInfoMK.nameHe}
          adminEmail={adminEmail}
          open={!!statusInfoMK}
          onOpenChange={(open) => !open && setStatusInfoMK(null)}
        />
      )}
    </>
  );
}
