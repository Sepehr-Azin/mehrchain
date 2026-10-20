export interface MeroSavedColor {
  slot: number;
  name: string;
  hex: string;
}

export interface MeroCollection {
  unlockedAt: string | null;
  capacity: number;
  collectionDays: number;
  acceptedPartners: number;
  nextDayTarget: number;
  nextPartnerTarget: number;
  selectedSlot: number;
  preferencesInitialized: boolean;
  hasSentSupport: boolean;
  currentStreak: number;
  colors: MeroSavedColor[];
}

/** Both paths fill the same ladder; the first milestone always gates capacity. */
export function meroColorCapacity(
  unlocked: boolean,
  collectionDays: number,
  acceptedPartners: number,
): number {
  return unlocked
    ? 1 + Math.max(Math.floor(collectionDays / 21), Math.ceil(acceptedPartners / 2))
    : 0;
}
