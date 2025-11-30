'use client';

import { useState, useRef, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { PositionStatus, POSITION_LABELS } from '@/types/mk';
import { COALITION_LABELS, type CoalitionStatus } from '@/lib/coalition';
import { Search, X, Filter, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FilterPanelProps {
  factions: string[];
  selectedFactions: string[];
  selectedPositions: PositionStatus[];
  selectedCoalitionStatus: CoalitionStatus[];
  searchQuery: string;
  onFactionChange: (factions: string[]) => void;
  onPositionChange: (positions: PositionStatus[]) => void;
  onCoalitionStatusChange: (statuses: CoalitionStatus[]) => void;
  onSearchChange: (query: string) => void;
  onClearFilters: () => void;
}

export function FilterPanel({
  factions,
  selectedFactions,
  selectedPositions,
  selectedCoalitionStatus,
  searchQuery,
  onFactionChange,
  onPositionChange,
  onCoalitionStatusChange,
  onSearchChange,
  onClearFilters,
}: FilterPanelProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

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

  const handleCoalitionStatusToggle = (status: CoalitionStatus) => {
    if (selectedCoalitionStatus.includes(status)) {
      onCoalitionStatusChange(selectedCoalitionStatus.filter((s) => s !== status));
    } else {
      onCoalitionStatusChange([...selectedCoalitionStatus, status]);
    }
  };

  // Calculate active filter count for badge
  const activeFilterCount =
    selectedFactions.length +
    selectedPositions.length +
    selectedCoalitionStatus.length +
    (searchQuery.length > 0 ? 1 : 0);

  // Auto-focus search input when panel opens
  useEffect(() => {
    if (isExpanded) {
      searchInputRef.current?.focus();
    }
  }, [isExpanded]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Escape to close panel
      if (e.key === 'Escape' && isExpanded) {
        setIsExpanded(false);
      }
      // Ctrl+F to toggle panel
      if (e.ctrlKey && e.key === 'f' && !e.shiftKey) {
        e.preventDefault();
        setIsExpanded((prev) => !prev);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isExpanded]);

  return (
    <div className="mb-6">
      {/* Toggle Button */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => setIsExpanded((prev) => !prev)}
          aria-expanded={isExpanded}
          aria-controls="filter-panel"
          aria-label="פתח או סגור אפשרויות סינון של חברי הכנסת"
          className={cn(
            // Base styles
            'flex-1 flex items-center justify-between gap-3 px-6 py-4',
            'bg-white border border-gray-200 rounded-lg',
            'text-right',

            // Hover
            'hover:bg-gray-50 hover:border-gray-300',
            'transition-colors duration-200',

            // Focus
            'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',

            // Active state
            activeFilterCount > 0 && 'border-blue-500 bg-blue-50'
          )}
        >
          {/* Left side: Icons and text */}
          <div className="flex items-center gap-2">
            <ChevronDown
              className={cn(
                'h-5 w-5 text-gray-600 transition-transform duration-300',
                isExpanded && 'rotate-180'
              )}
              aria-hidden="true"
            />
            <Filter className="h-5 w-5 text-gray-600" aria-hidden="true" />
            <span className="font-medium text-gray-900">סינון מתקדם של חברי הכנסת</span>
          </div>

          {/* Right side: Badge */}
          {activeFilterCount > 0 && (
            <Badge variant="default" className="bg-blue-600">
              {activeFilterCount} פילטרים
            </Badge>
          )}
        </button>

        {/* Clear Filters Button (shown when filters active) */}
        {activeFilterCount > 0 && (
          <Button
            variant="outline"
            size="icon"
            onClick={onClearFilters}
            aria-label="נקה את כל הפילטרים"
            className="shrink-0 text-red-600 hover:bg-red-50 hover:border-red-300"
          >
            <X className="h-5 w-5" />
          </Button>
        )}
      </div>

      {/* Collapsible Filter Panel */}
      <div
        id="filter-panel"
        className={cn(
          // Collapsible animation
          'overflow-hidden transition-all duration-300 ease-in-out',
          isExpanded ? 'max-h-[800px] opacity-100' : 'max-h-0 opacity-0',

          // Layout
          'mt-4 p-6 bg-gray-50 border border-gray-200 rounded-lg'
        )}
        aria-hidden={!isExpanded}
      >
        <div className="space-y-6">
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              ref={searchInputRef}
              type="text"
              placeholder="חיפוש לפי שם או סיעה..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pr-10 text-right"
            />
          </div>

          {/* Filter Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4 border-t">
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

            {/* Coalition Status Filters */}
            <div className="space-y-3">
              <Label className="text-base font-semibold">מעמד בכנסת</Label>
              <div className="space-y-2">
                {(['coalition', 'opposition'] as CoalitionStatus[]).map((status) => (
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
                      {COALITION_LABELS[status]}
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
        </div>
      </div>

      {/* Screen Reader Announcements */}
      <div role="status" aria-live="polite" className="sr-only">
        {activeFilterCount > 0
          ? `${activeFilterCount} פילטרים פעילים`
          : 'אין פילטרים פעילים'}
      </div>
    </div>
  );
}
