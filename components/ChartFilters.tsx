'use client';

import { useState, useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Filter, ChevronDown } from 'lucide-react';
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
  const [isExpanded, setIsExpanded] = useState(false);

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
    <div className="w-full">
      {/* Toggle Button with Glow */}
      <button
        onClick={() => setIsExpanded((prev) => !prev)}
        aria-expanded={isExpanded}
        aria-controls="chart-filters"
        aria-label="פתח או סגור סינון תרשימים"
        className={cn(
          // Base styles
          'w-full flex items-center justify-between gap-3 px-6 py-4',
          'bg-white border border-gray-200 rounded-lg',
          'text-right chart-filter-btn',

          // Hover
          'hover:bg-gray-50 hover:border-gray-300',
          'transition-colors duration-200',

          // Focus
          'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',

          // Active state
          hasActiveFilters && 'border-blue-500 bg-blue-50 chart-filter-btn-active'
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
          <span className="font-medium text-gray-900">סינון נתונים</span>
        </div>

        {/* Right side: Count and Badge */}
        <div className="flex items-center gap-3">
          <span className="text-sm text-muted-foreground">
            {filteredCount} מתוך 120 ח״כים
          </span>
          {hasActiveFilters && (
            <>
              <Badge variant="default" className="bg-blue-600">
                {selectedFactions.length + selectedMKIds.length} פילטרים
              </Badge>
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onClearFilters();
                }}
                aria-label="נקה את כל הסינונים"
                className="h-7"
              >
                נקה סינון
              </Button>
            </>
          )}
        </div>
      </button>

      {/* Collapsible Filter Panel */}
      <div
        id="chart-filters"
        className={cn(
          // Collapsible animation
          'overflow-hidden transition-all duration-300 ease-in-out',
          isExpanded ? 'max-h-[600px] opacity-100' : 'max-h-0 opacity-0',

          // Layout
          'mt-4'
        )}
        aria-hidden={!isExpanded}
      >
        <Card className="w-full">
          <CardContent className="pt-6">
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
      </div>

      {/* Scoped glow animation styles */}
      <style jsx>{`
        /* Base glow for filter button */
        .chart-filter-btn {
          animation: filter-ambient-glow 4s ease-in-out infinite;
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        }

        @keyframes filter-ambient-glow {
          0%, 100% {
            box-shadow:
              0 4px 12px -2px rgba(0, 0, 0, 0.1),
              0 0 15px rgba(37, 99, 235, 0.15);
          }
          50% {
            box-shadow:
              0 6px 16px -2px rgba(0, 0, 0, 0.15),
              0 0 25px rgba(37, 99, 235, 0.3);
          }
        }

        /* Enhanced glow when filters are active */
        .chart-filter-btn-active {
          animation: filter-active-glow 3s ease-in-out infinite;
        }

        @keyframes filter-active-glow {
          0%, 100% {
            box-shadow:
              0 6px 16px -2px rgba(0, 0, 0, 0.15),
              0 0 20px rgba(37, 99, 235, 0.4);
          }
          50% {
            box-shadow:
              0 8px 20px -2px rgba(0, 0, 0, 0.2),
              0 0 35px rgba(37, 99, 235, 0.6);
          }
        }

        /* Hover enhancement */
        .chart-filter-btn:hover {
          box-shadow:
            0 8px 20px -3px rgba(0, 0, 0, 0.2),
            0 0 30px rgba(37, 99, 235, 0.5) !important;
          transform: translateY(-2px);
        }

        /* Accessibility: Respect reduced motion preference */
        @media (prefers-reduced-motion: reduce) {
          .chart-filter-btn,
          .chart-filter-btn-active {
            animation: none !important;
          }
          .chart-filter-btn:hover {
            transform: none !important;
          }
        }
      `}</style>
    </div>
  );
};
