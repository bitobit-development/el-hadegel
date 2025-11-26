'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { PositionStatus, POSITION_LABELS } from '@/types/mk';
import { Search, X } from 'lucide-react';

interface FilterPanelProps {
  factions: string[];
  selectedFactions: string[];
  selectedPositions: PositionStatus[];
  searchQuery: string;
  onFactionChange: (factions: string[]) => void;
  onPositionChange: (positions: PositionStatus[]) => void;
  onSearchChange: (query: string) => void;
  onClearFilters: () => void;
}

export function FilterPanel({
  factions,
  selectedFactions,
  selectedPositions,
  searchQuery,
  onFactionChange,
  onPositionChange,
  onSearchChange,
  onClearFilters,
}: FilterPanelProps) {
  const [showFilters, setShowFilters] = useState(false);

  const handleFactionToggle = (faction: string) => {
    if (selectedFactions.includes(faction)) {
      onFactionChange(selectedFactions.filter((f) => f !== faction));
    } else {
      onFactionChange([...selectedFactions, faction]);
    }
  };

  const handlePositionToggle = (position: PositionStatus) => {
    if (selectedPositions.includes(position)) {
      onPositionChange(selectedPositions.filter((p) => p !== position));
    } else {
      onPositionChange([...selectedPositions, position]);
    }
  };

  const hasActiveFilters =
    selectedFactions.length > 0 || selectedPositions.length > 0 || searchQuery.length > 0;

  return (
    <Card className="mb-6">
      <CardContent className="p-6">
        {/* Search Bar */}
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="חיפוש לפי שם או סיעה..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pr-10 text-right"
            />
          </div>

          {/* Filter Toggle */}
          <div className="flex justify-between items-center">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
            >
              {showFilters ? 'הסתר סינונים' : 'הצג סינונים'}
            </Button>

            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onClearFilters}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4 ml-2" />
                נקה סינונים
              </Button>
            )}
          </div>

          {/* Filters */}
          {showFilters && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t">
              {/* Position Filters */}
              <div className="space-y-3">
                <Label className="text-base font-semibold">סנן לפי עמדה</Label>
                <div className="space-y-2">
                  {(Object.keys(POSITION_LABELS) as PositionStatus[]).map((position) => (
                    <div key={position} className="flex items-center space-x-2 space-x-reverse">
                      <Checkbox
                        id={`position-${position}`}
                        checked={selectedPositions.includes(position)}
                        onCheckedChange={() => handlePositionToggle(position)}
                      />
                      <Label
                        htmlFor={`position-${position}`}
                        className="text-sm font-normal cursor-pointer"
                      >
                        {POSITION_LABELS[position]}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Faction Filters */}
              <div className="space-y-3">
                <Label className="text-base font-semibold">סנן לפי סיעה</Label>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {factions.map((faction) => (
                    <div key={faction} className="flex items-center space-x-2 space-x-reverse">
                      <Checkbox
                        id={`faction-${faction}`}
                        checked={selectedFactions.includes(faction)}
                        onCheckedChange={() => handleFactionToggle(faction)}
                      />
                      <Label
                        htmlFor={`faction-${faction}`}
                        className="text-sm font-normal cursor-pointer"
                      >
                        {faction}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
