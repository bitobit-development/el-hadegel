'use client';

import { useState } from 'react';
import { MKData, PositionStatus, POSITION_LABELS } from '@/types/mk';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { PositionBadge } from '@/components/position-badge';

interface PositionUpdateDialogProps {
  mk?: MKData;
  open: boolean;
  onClose: () => void;
  onUpdate: (position: PositionStatus, notes?: string) => Promise<void>;
  loading: boolean;
  isBulk?: boolean;
  count?: number;
}

export function PositionUpdateDialog({
  mk,
  open,
  onClose,
  onUpdate,
  loading,
  isBulk = false,
  count = 0,
}: PositionUpdateDialogProps) {
  const [selectedPosition, setSelectedPosition] = useState<PositionStatus | null>(null);
  const [notes, setNotes] = useState('');

  const handleSubmit = async () => {
    if (!selectedPosition) return;
    await onUpdate(selectedPosition, notes);
    setSelectedPosition(null);
    setNotes('');
  };

  const handleClose = () => {
    setSelectedPosition(null);
    setNotes('');
    onClose();
  };

  const positions: PositionStatus[] = ['SUPPORT', 'NEUTRAL', 'AGAINST'];

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]" dir="rtl">
        <DialogHeader>
          <DialogTitle>
            {isBulk ? `עדכון ${count} חברי כנסת` : `עדכון עמדה - ${mk?.nameHe}`}
          </DialogTitle>
          <DialogDescription>
            {isBulk
              ? 'בחר עמדה חדשה עבור כל חברי הכנסת הנבחרים'
              : `בחר עמדה חדשה עבור ${mk?.nameHe} בנושא חוק הגיוס`}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {!isBulk && mk && (
            <div className="space-y-2">
              <Label className="text-right block">עמדה נוכחית</Label>
              <PositionBadge position={mk.currentPosition} />
            </div>
          )}

          <div className="space-y-2">
            <Label className="text-right block">עמדה חדשה</Label>
            <div className="grid grid-cols-3 gap-2">
              {positions.map((position) => (
                <button
                  key={position}
                  type="button"
                  onClick={() => setSelectedPosition(position)}
                  className={`p-3 rounded-lg border-2 transition-all ${
                    selectedPosition === position
                      ? 'border-primary bg-primary/10'
                      : 'border-border hover:border-primary/50'
                  }`}
                  disabled={loading}
                >
                  <div className="flex flex-col items-center gap-2">
                    <PositionBadge position={position} showLabel={false} />
                    <span className="text-sm font-medium">{POSITION_LABELS[position]}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {!isBulk && (
            <div className="space-y-2">
              <Label htmlFor="notes" className="text-right block">
                הערות (אופציונלי)
              </Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="הוסף הערות או הסבר על העמדה..."
                className="text-right"
                rows={3}
                disabled={loading}
              />
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={loading}>
            ביטול
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!selectedPosition || loading}
          >
            {loading ? 'מעדכן...' : 'עדכן עמדה'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
