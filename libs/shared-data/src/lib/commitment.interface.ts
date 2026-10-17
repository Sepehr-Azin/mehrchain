export interface CommitmentCalendar {
  timeZone: string;
  currentDayKey: string;
  serverNow: string;
  nextDayAt: string;
}

export interface CommitmentSync {
  commitments: Commitment[];
  archivedCommitments?: Commitment[];
  calendar: CommitmentCalendar;
}

export interface Commitment {
  id: string;
  title: string;
  totalDays: number;
  currentDay: number;
  currentStreak: number;
  isCompletedToday: boolean;
  isGoalReached?: boolean;
  calendar?: CommitmentCalendar;
  consecutiveMissedDays?: number;
  category: 'health' | 'growth' | 'community' | 'environment';
  why?: string;
  rippleEffects?: string[];
  startDate: string;
  inactivityAnchorAt?: string | null;
  lastCompletedDate?: string;
  history?: string[];
  reminderTime?: string;
  isPublic?: boolean;
  isArchived?: boolean;
  isBroadcastedToday?: boolean;
  lastBroadcastDate?: string;
}
