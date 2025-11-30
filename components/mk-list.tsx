'use client';

import { useState, useMemo } from 'react';
import { MKCard } from '@/components/mk-card';
import { FilterPanel } from '@/components/filter-panel';
import { MKDataWithCounts, PositionStatus } from '@/types/mk';
import { isCoalitionMember, type CoalitionStatus } from '@/lib/coalition';

interface MKListProps {
  mks: MKDataWithCounts[];
  factions: string[];
}

export function MKList({ mks, factions }: MKListProps) {
  const [selectedFactions, setSelectedFactions] = useState<string[]>([]);
  const [selectedPositions, setSelectedPositions] = useState<PositionStatus[]>([]);
  const [selectedCoalitionStatus, setSelectedCoalitionStatus] = useState<CoalitionStatus[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  // Filter MKs based on selected filters
  const filteredMKs = useMemo(() => {
    return mks.filter((mk) => {
      // Faction filter
      if (selectedFactions.length > 0 && !selectedFactions.includes(mk.faction)) {
        return false;
      }

      // Position filter
      if (selectedPositions.length > 0 && !selectedPositions.includes(mk.currentPosition)) {
        return false;
      }

      // Coalition status filter
      if (selectedCoalitionStatus.length > 0 && selectedCoalitionStatus.length !== 2) {
        // If both selected OR neither selected, show all (no filter)
        // Otherwise, filter by coalition membership
        const isMemberCoalition = isCoalitionMember(mk.faction);
        const matchesCoalition = selectedCoalitionStatus.some((status) => {
          return status === 'coalition' ? isMemberCoalition : !isMemberCoalition;
        });
        if (!matchesCoalition) {
          return false;
        }
      }

      // Search query (searches both name and faction)
      if (searchQuery.trim()) {
        const query = searchQuery.trim().toLowerCase();
        const nameMatch = mk.nameHe.toLowerCase().includes(query);
        const factionMatch = mk.faction.toLowerCase().includes(query);
        if (!nameMatch && !factionMatch) {
          return false;
        }
      }

      return true;
    });
  }, [mks, selectedFactions, selectedPositions, selectedCoalitionStatus, searchQuery]);

  const handleClearFilters = () => {
    setSelectedFactions([]);
    setSelectedPositions([]);
    setSelectedCoalitionStatus([]);
    setSearchQuery('');
  };

  return (
    <>
      <FilterPanel
        factions={factions}
        selectedFactions={selectedFactions}
        selectedPositions={selectedPositions}
        selectedCoalitionStatus={selectedCoalitionStatus}
        searchQuery={searchQuery}
        onFactionChange={setSelectedFactions}
        onPositionChange={setSelectedPositions}
        onCoalitionStatusChange={setSelectedCoalitionStatus}
        onSearchChange={setSearchQuery}
        onClearFilters={handleClearFilters}
      />

      {/* Results count */}
      <div className="mb-4 text-right text-sm text-muted-foreground">
        מציג {filteredMKs.length} מתוך {mks.length} חברי כנסת
      </div>

      {/* MK Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {filteredMKs.map((mk) => (
          <MKCard key={mk.id} mk={mk} />
        ))}
      </div>

      {/* Empty state */}
      {filteredMKs.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">לא נמצאו תוצאות התואמות לסינון</p>
        </div>
      )}
    </>
  );
}
