'use client';

import { useState, useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { MKData } from '@/types/mk';
import { cn } from '@/lib/utils';

type ChartFiltersProps = {
  availableFactions: string[];
  allMKs: MKData[];
  selectedFactions: string[];
  selectedMKIds: number[];
  onFactionChange: (factions: string[]) => void;
  onMKChange: (mkIds: number[]) => void;
  onClearFilters: () => void;
};

export const ChartFilters = ({
  availableFactions,
  allMKs,
  selectedFactions,
  selectedMKIds,
  onFactionChange,
  onMKChange,
  onClearFilters,
}: ChartFiltersProps) => {
  const [mkSearchQuery, setMKSearchQuery] = useState('');

  // Filter MKs based on search query
  const filteredMKs = useMemo(() => {
    if (!mkSearchQuery.trim()) return allMKs;
    const query = mkSearchQuery.trim().toLowerCase();
    return allMKs.filter(mk => mk.nameHe.toLowerCase().includes(query));
  }, [allMKs, mkSearchQuery]);

  // Calculate filtered count
  const filteredCount = useMemo(() => {
    if (selectedFactions.length === 0 && selectedMKIds.length === 0) {
      return 120; // All MKs
    }

    let count = 0;
    const factionsSet = new Set(selectedFactions);
    const mkIdsSet = new Set(selectedMKIds);

    // If both filters are active, use AND logic
    if (selectedFactions.length > 0 && selectedMKIds.length > 0) {
      count = allMKs.filter(mk =>
        factionsSet.has(mk.faction) && mkIdsSet.has(mk.id)
      ).length;
    } else if (selectedFactions.length > 0) {
      count = allMKs.filter(mk => factionsSet.has(mk.faction)).length;
    } else if (selectedMKIds.length > 0) {
      count = selectedMKIds.length;
    }

    return count;
  }, [selectedFactions, selectedMKIds, allMKs]);

  const hasActiveFilters = selectedFactions.length > 0 || selectedMKIds.length > 0;

  const handleFactionToggle = (faction: string) => {
    const newFactions = selectedFactions.includes(faction)
      ? selectedFactions.filter(f => f !== faction)
      : [...selectedFactions, faction];
    onFactionChange(newFactions);
  };

  const handleMKToggle = (mkId: number) => {
    const newMKIds = selectedMKIds.includes(mkId)
      ? selectedMKIds.filter(id => id !== mkId)
      : [...selectedMKIds, mkId];
    onMKChange(newMKIds);
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            size="sm"
            onClick={onClearFilters}
            disabled={!hasActiveFilters}
            aria-label="נקה את כל הסינונים"
          >
            נקה סינון
          </Button>
          <div className="flex items-center gap-2">
            <p className="text-sm text-muted-foreground">
              {filteredCount} מתוך 120 ח״כים
            </p>
            <CardTitle className="text-right">סינון נתונים</CardTitle>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Horizontal Filter Layout for Full Width */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Faction Filter Section */}
          <div className="space-y-3">
            <Label className="text-base font-semibold text-right">
              סינון לפי סיעה {selectedFactions.length > 0 && `(${selectedFactions.length})`}
            </Label>
            <div className="max-h-[200px] overflow-y-auto space-y-2 border rounded-md p-3">
              {availableFactions.map(faction => (
                <div key={faction} className="flex items-center gap-2 text-right">
                  <Checkbox
                    id={`faction-${faction}`}
                    checked={selectedFactions.includes(faction)}
                    onCheckedChange={() => handleFactionToggle(faction)}
                    aria-label={`סנן לפי סיעת ${faction}`}
                  />
                  <Label
                    htmlFor={`faction-${faction}`}
                    className="flex-1 cursor-pointer text-right font-normal"
                  >
                    {faction}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          {/* MK Filter Section */}
          <div className="space-y-3">
            <Label className="text-base font-semibold text-right">
              סינון לפי חברי כנסת {selectedMKIds.length > 0 && `(${selectedMKIds.length})`}
            </Label>
            <Input
              type="text"
              placeholder="חיפוש ח״כ..."
              value={mkSearchQuery}
              onChange={(e) => setMKSearchQuery(e.target.value)}
              className="text-right"
              aria-label="חיפוש חבר כנסת"
            />
            <div className="max-h-[200px] overflow-y-auto space-y-2 border rounded-md p-3">
              {filteredMKs.length > 0 ? (
                filteredMKs.map(mk => (
                  <div key={mk.id} className="flex items-center gap-2 text-right">
                    <Checkbox
                      id={`mk-${mk.id}`}
                      checked={selectedMKIds.includes(mk.id)}
                      onCheckedChange={() => handleMKToggle(mk.id)}
                      aria-label={`סנן לפי ${mk.nameHe}`}
                    />
                    <Label
                      htmlFor={`mk-${mk.id}`}
                      className="flex-1 cursor-pointer text-right font-normal"
                    >
                      {mk.nameHe}
                      <span className="text-xs text-muted-foreground mr-1">
                        ({mk.faction})
                      </span>
                    </Label>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground text-right py-2">
                  לא נמצאו ח״כים מתאימים
                </p>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
