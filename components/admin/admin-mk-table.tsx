'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { MKData, PositionStatus, POSITION_LABELS } from '@/types/mk';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { PositionBadge } from '@/components/position-badge';
import { updateMKPosition, bulkUpdatePositions } from '@/app/actions/mk-actions';
import { PositionUpdateDialog } from './position-update-dialog';
import { PositionHistoryDialog } from './position-history-dialog';
import { Search, History } from 'lucide-react';
import { Input } from '@/components/ui/input';

interface AdminMKTableProps {
  mks: MKData[];
}

export function AdminMKTable({ mks }: AdminMKTableProps) {
  const router = useRouter();
  const [selectedMKs, setSelectedMKs] = useState<Set<number>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [editingMK, setEditingMK] = useState<MKData | null>(null);
  const [historyMK, setHistoryMK] = useState<MKData | null>(null);
  const [bulkUpdateDialogOpen, setBulkUpdateDialogOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const filteredMKs = mks.filter((mk) =>
    mk.nameHe.includes(searchQuery) || mk.faction.includes(searchQuery)
  );

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
      <Card>
        <CardHeader>
          <CardTitle className="text-right">ניהול עמדות חברי כנסת</CardTitle>
          <CardDescription className="text-right">
            סמן חברי כנסת לעדכון מוני או לחץ על שורה לעדכון פרטני
          </CardDescription>
          <div className="flex gap-4 items-center mt-4">
            <div className="relative flex-1">
              <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="חיפוש לפי שם או סיעה..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pr-10 text-right"
              />
            </div>
            {selectedMKs.size > 0 && (
              <Button onClick={() => setBulkUpdateDialogOpen(true)}>
                עדכון {selectedMKs.size} נבחרים
              </Button>
            )}
          </div>
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
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-4 text-sm text-muted-foreground text-right">
            מציג {filteredMKs.length} מתוך {mks.length} חברי כנסת
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
    </>
  );
}
