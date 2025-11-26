'use client';

import { useEffect, useState } from 'react';
import { MKData, PositionStatus } from '@/types/mk';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { PositionBadge } from '@/components/position-badge';
import { getMKPositionHistory } from '@/app/actions/mk-actions';
import { Card } from '@/components/ui/card';

interface PositionHistoryDialogProps {
  mk: MKData;
  open: boolean;
  onClose: () => void;
}

interface HistoryEntry {
  id: number;
  position: PositionStatus;
  notes: string | null;
  changedBy: string;
  changedAt: Date;
}

export function PositionHistoryDialog({ mk, open, onClose }: PositionHistoryDialogProps) {
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (open) {
      loadHistory();
    }
  }, [open, mk.id]);

  const loadHistory = async () => {
    setLoading(true);
    try {
      const data = await getMKPositionHistory(mk.id);
      setHistory(data);
    } catch (error) {
      console.error('Error loading history:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleString('he-IL', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]" dir="rtl">
        <DialogHeader>
          <DialogTitle>היסטוריית שינויים - {mk.nameHe}</DialogTitle>
          <DialogDescription>
            כל השינויים שבוצעו בעמדת חבר הכנסת
          </DialogDescription>
        </DialogHeader>

        <div className="max-h-[500px] overflow-y-auto">
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">טוען...</div>
          ) : history.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              אין היסטוריית שינויים
            </div>
          ) : (
            <div className="space-y-3">
              {history.map((entry, index) => (
                <Card key={entry.id} className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2">
                        <PositionBadge position={entry.position} />
                        {index === 0 && (
                          <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full font-medium">
                            עמדה נוכחית
                          </span>
                        )}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        <p>עודכן על ידי: {entry.changedBy}</p>
                        <p>{formatDate(entry.changedAt)}</p>
                      </div>
                      {entry.notes && (
                        <div className="text-sm bg-muted p-2 rounded-md">
                          <p className="font-medium mb-1">הערות:</p>
                          <p className="text-right">{entry.notes}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
