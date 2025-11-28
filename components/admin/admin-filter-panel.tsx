'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { PositionStatus, POSITION_LABELS } from '@/types/mk';
import { COALITION_STATUS_LABELS, CoalitionStatus } from '@/lib/coalition-utils';
import { Search, X, ChevronDown, ChevronUp } from 'lucide-react';

interface AdminFilterPanelProps {
  factions: string[];
  selectedCoalitionStatus: CoalitionStatus[];
  selectedPositions: PositionStatus[];
  selectedFactions: string[];
  searchQuery: string;
  onCoalitionStatusChange: (statuses: CoalitionStatus[]) => void;
  onPositionChange: (positions: PositionStatus[]) => void;
  onFactionChange: (factions: string[]) => void;
  onSearchChange: (query: string) => void;
  onClearFilters: () => void;
}

export function AdminFilterPanel({
  factions,
  selectedCoalitionStatus,
  selectedPositions,
  selectedFactions,
  searchQuery,
  onCoalitionStatusChange,
  onPositionChange,
  onFactionChange,
  onSearchChange,
  onClearFilters,
}: AdminFilterPanelProps) {
  const [showFilters, setShowFilters] = useState(false);

  const handleCoalitionStatusToggle = (status: CoalitionStatus) => {
    if (selectedCoalitionStatus.includes(status)) {
      onCoalitionStatusChange(selectedCoalitionStatus.filter((s) => s !== status));
    } else {
      onCoalitionStatusChange([...selectedCoalitionStatus, status]);
    }
  };

  const handlePositionToggle = (position: PositionStatus) => {
    if (selectedPositions.includes(position)) {
      onPositionChange(selectedPositions.filter((p) => p !== position));
    } else {
      onPositionChange([...selectedPositions, position]);
    }
  };

  const handleFactionToggle = (faction: string) => {
    if (selectedFactions.includes(faction)) {
      onFactionChange(selectedFactions.filter((f) => f !== faction));
    } else {
      onFactionChange([...selectedFactions, faction]);
    }
  };

  const hasActiveFilters =
    selectedCoalitionStatus.length > 0 ||
    selectedPositions.length > 0 ||
    selectedFactions.length > 0 ||
    searchQuery.length > 0;

  const activeFilterCount =
    selectedCoalitionStatus.length +
    selectedPositions.length +
    selectedFactions.length +
    (searchQuery.length > 0 ? 1 : 0);

  return (
    <Card className="mb-6">
      <CardContent className="p-6">
        <div className="space-y-4">
          {/* Search Bar */}
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

          {/* Filter Toggle & Clear */}
          <div className="flex justify-between items-center">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
              className="gap-2"
            >
              {showFilters ? (
                <>
                  <ChevronUp className="h-4 w-4" />
                  הסתר סינונים
                </>
              ) : (
                <>
                  <ChevronDown className="h-4 w-4" />
                  הצג סינונים
                  {activeFilterCount > 0 && (
                    <span className="mr-1 text-xs bg-primary text-primary-foreground rounded-full px-2 py-0.5">
                      {activeFilterCount}
                    </span>
                  )}
                </>
              )}
            </Button>

            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onClearFilters}
                className="text-muted-foreground hover:text-foreground gap-2"
              >
                <X className="h-4 w-4" />
                נקה סינונים
              </Button>
            )}
          </div>

          {/* Filters */}
          {showFilters && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4 border-t">
              {/* Coalition Status Filter */}
              <div className="space-y-3">
                <Label className="text-base font-semibold">סנן לפי מעמד</Label>
                <div className="space-y-2">
                  {(Object.keys(COALITION_STATUS_LABELS) as CoalitionStatus[]).map((status) => (
                    <div key={status} className="flex items-center space-x-2 space-x-reverse">
                      <Checkbox
                        id={`coalition-${status}`}
                        checked={selectedCoalitionStatus.includes(status)}
                        onCheckedChange={() => handleCoalitionStatusToggle(status)}
                      />
                      <Label
                        htmlFor={`coalition-${status}`}
                        className="text-sm font-normal cursor-pointer"
                      >
                        {COALITION_STATUS_LABELS[status]}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

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
