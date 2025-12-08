// Position status enum
export type PositionStatus = 'SUPPORT' | 'NEUTRAL' | 'AGAINST';

// Knesset Member data
export interface MKData {
  id: number;
  mkId: number;
  nameHe: string;
  faction: string;
  photoUrl: string | null;
  profileUrl: string;
  phone: string | null;
  mobileNumber: string | null; // Mobile number for WhatsApp contact
  email: string | null;
  currentPosition: PositionStatus;
  updatedAt: Date;
  createdAt: Date;
}

// Extended MK data with tweet count
export interface MKDataWithTweetCount extends MKData {
  tweetCount: number;
}

// Extended MK data with status info count
export interface MKDataWithStatusInfoCount extends MKData {
  statusInfoCount: number;
}

// Extended MK data with both tweet and status info counts
export interface MKDataWithCounts extends MKData {
  tweetCount: number;
  statusInfoCount: number;
  historicalCommentCount?: number;
}

// Position history entry
export interface PositionHistoryEntry {
  id: number;
  mkId: number;
  mkName: string;
  position: PositionStatus;
  notes: string | null;
  changedBy: string;
  changedAt: Date;
}

// Position statistics
export interface PositionStats {
  support: number;
  neutral: number;
  against: number;
  total: number;
}

// Filter options
export interface FilterOptions {
  factions: string[];
  positions: PositionStatus[];
  searchQuery: string;
  coalitionStatus: ('coalition' | 'opposition')[]; // Coalition/Opposition filter
}

// Admin filter options (includes coalition status)
export interface AdminFilterOptions {
  coalitionStatus: ('coalition' | 'opposition')[];
  positions: PositionStatus[];
  factions: string[];
  searchQuery: string;
}

// Chart filter options
export type ChartFilterOptions = {
  factions: string[];      // Selected faction names
  mkIds: number[];         // Selected MK IDs
};

// Filtered position statistics with breakdown
export type FilteredPositionStats = PositionStats & {
  filteredTotal: number;
  mkBreakdown: Array<{
    mkId: number;
    name: string;
    faction: string;
    position: PositionStatus;
  }>;
};

// Position badge labels in Hebrew
export const POSITION_LABELS: Record<PositionStatus, string> = {
  SUPPORT: 'תומך בחוק הפטור',
  NEUTRAL: 'מתנדנד',
  AGAINST: 'מתנגד לחוק הפטור',
};

// Position badge colors (Tailwind classes)
export const POSITION_COLORS: Record<PositionStatus, { bg: string; text: string; border: string }> = {
  SUPPORT: {
    bg: '!bg-red-700',
    text: 'text-white',
    border: '!border-red-700',
  },
  NEUTRAL: {
    bg: '!bg-orange-600',
    text: 'text-white',
    border: '!border-orange-600',
  },
  AGAINST: {
    bg: '!bg-green-500',
    text: 'text-white',
    border: '!border-green-500',
  },
};

// Position chart colors (hex values for charts/graphs)
// These MUST match the Tailwind classes above
export const POSITION_CHART_COLORS: Record<PositionStatus, string> = {
  SUPPORT: '#b91c1c',  // red-700 - Dark red for supporting the law
  NEUTRAL: '#f97316',  // orange-500 - Orange for neutral
  AGAINST: '#22c55e',  // green-500 - Green for against the law
};
