import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { DestroyRef, Injectable, computed, effect, inject, signal, untracked } from '@angular/core';
import { firstValueFrom, timeout, TimeoutError } from 'rxjs';
import { MeroCollection, meroColorCapacity } from '@mehrchain/shared-data';
import { environment } from '../../../environments/environment';
import { ColdStartService } from './cold-start.service';
import { AuthService } from './auth.service';
import { CommitmentService } from './commitment.service';
import { ThemeService } from './theme.service';
import { ForegroundRefreshService } from './foreground-refresh.service';

export type MeroGlowThemeId =
  | 'golden'
  | 'ocean'
  | 'nebula'
  | 'emerald'
  | 'sakura'
  | 'aurora'
  | 'cosmic_fire'
  | 'custom';

export type MeroPersonality = 'energetic' | 'calm' | 'focused';

export interface MeroGlowTheme {
  id: MeroGlowThemeId;
  name: string;
  nameEn: string;
  lightGradient: string;
  darkGradient: string;
  previewColor: string;
  accentColor: string;
  minStreak: number;
  badge?: string;
  description: string;
}

export interface PersonalityOption {
  id: MeroPersonality;
  title: string;
  subtitle: string;
  emoji: string;
  icon: string;
  greeting: (name: string) => string;
  streakPraise: (name: string, days: number) => string;
}

/**
 * Utility function to convert a Hex color code to RGBA string
 */
export function hexToRgba(hex: string, alpha: number): string {
  let cleanHex = hex.replace('#', '').trim();
  if (cleanHex.length === 3) {
    cleanHex = cleanHex
      .split('')
      .map((c) => c + c)
      .join('');
  }
  if (!/^[0-9a-fA-F]{6}$/.test(cleanHex)) {
    return `rgba(139, 92, 246, ${alpha})`;
  }
  const num = parseInt(cleanHex, 16);
  const r = (num >> 16) & 255;
  const g = (num >> 8) & 255;
  const b = num & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

/**
 * Generate matching light and dark radial gradients from a given Hex color
 */
export function generateCustomGlowGradients(hex: string) {
  const lightCenter = hexToRgba(hex, 0.9);
  const lightMid = hexToRgba(hex, 0.45);
  const darkCenter = hexToRgba(hex, 0.95);
  const darkMid = hexToRgba(hex, 0.55);

  return {
    lightGradient: `radial-gradient(circle, ${lightCenter} 0%, ${lightMid} 45%, transparent 72%)`,
    darkGradient: `radial-gradient(circle, ${darkCenter} 0%, ${darkMid} 45%, transparent 75%)`,
  };
}

export const DEFAULT_GLOW_THEME: MeroGlowTheme = {
  id: 'golden',
  name: 'Golden Warmth',
  nameEn: 'Golden Warmth',
  lightGradient:
    'radial-gradient(circle, rgba(254, 240, 138, 0.85) 0%, rgba(245, 158, 11, 0.4) 45%, transparent 72%)',
  darkGradient:
    'radial-gradient(circle, rgba(254, 240, 138, 0.9) 0%, rgba(245, 158, 11, 0.5) 45%, transparent 72%)',
  previewColor: '#f59e0b',
  accentColor: '#d97706',
  minStreak: 0,
  description: 'Classic warmth and radiant sunshine',
};

export const MERO_GLOW_THEMES: MeroGlowTheme[] = [DEFAULT_GLOW_THEME];

export const PERSONALITY_OPTIONS: PersonalityOption[] = [
  {
    id: 'energetic',
    title: 'Energetic & Vibrant',
    subtitle: 'Motivational, thrilling, and eager',
    emoji: '',
    icon: 'zap',
    greeting: (name) => `${name} is bursting with energy and ready to conquer the day!`,
    streakPraise: (name, days) =>
      `Incredible! ${days} amazing days in a row, nothing can stop you!`,
  },
  {
    id: 'calm',
    title: 'Calm & Mindful',
    subtitle: 'Gentle companion, stress-free and steady',
    emoji: '',
    icon: 'leaf',
    greeting: (name) => `${name} is right by your side with peace and serenity.`,
    streakPraise: (name, days) =>
      `Praise your patience and consistency, ${days} beautiful mindful steps.`,
  },
  {
    id: 'focused',
    title: 'Driven & Focused',
    subtitle: 'Laser focus, disciplined and razor-sharp',
    emoji: '',
    icon: 'sparkles',
    greeting: (name) => `${name} is locked in and ready to crush today's goals.`,
    streakPraise: (name, days) => `Target locked! ${days} flawless consecutive days achieved.`,
  },
];

@Injectable({
  providedIn: 'root',
})
export class MeroCustomizationService {
  private readonly auth = inject(AuthService);
  private readonly http = inject(HttpClient);
  private readonly themeService = inject(ThemeService);
  private readonly commitmentService = inject(CommitmentService);
  private readonly coldStart = inject(ColdStartService);
  private readonly api = `${environment.apiUrl}/mero`;
  private readonly confirmed = signal<{
    userId: string;
    token: string;
    data: MeroCollection;
  } | null>(null);
  private version = 0;
  private destroyed = false;
  private boundSession: string | null = null;
  private refreshRequest?: { key: string; promise: Promise<void> };
  private refreshPending = false;

  readonly collection = computed(() => {
    const state = this.confirmed();
    return state &&
      state.userId === this.auth.currentUser()?.id &&
      state.token === this.auth.getToken()
      ? state.data
      : null;
  });
  readonly loading = signal(false);
  readonly saving = signal(false);
  readonly loadError = signal<string | null>(null);
  readonly baseThemes = MERO_GLOW_THEMES;
  readonly personalityOptions = PERSONALITY_OPTIONS;
  readonly nickname = computed(() => 'Mero');
  readonly personality = signal<MeroPersonality>('calm');
  readonly selectedThemeId = computed<MeroGlowThemeId>(() =>
    this.collection()?.selectedSlot ? 'custom' : 'golden',
  );
  readonly customGlowColor = computed(() => this.selectedColor()?.hex ?? '#8b5cf6');
  readonly customGlowName = computed(() => this.selectedColor()?.name ?? 'Custom Aura');
  readonly selectedColor = computed(() => {
    const state = this.collection();
    return state?.colors.find((c) => c.slot === state.selectedSlot) ?? null;
  });
  readonly isUnlocked = computed(() => !!this.collection()?.unlockedAt);
  readonly availableThemes = computed<MeroGlowTheme[]>(() => {
    const colors = this.collection()?.colors ?? [];
    return [
      ...this.baseThemes,
      ...colors.map((color) => ({
        id: 'custom' as const,
        name: color.name,
        nameEn: color.name,
        ...generateCustomGlowGradients(color.hex),
        previewColor: color.hex,
        accentColor: color.hex,
        minStreak: 21,
        description: 'Your saved color',
      })),
    ];
  });
  readonly activeTheme = computed<MeroGlowTheme>(() => {
    const color = this.selectedColor();
    return color
      ? {
          id: 'custom',
          name: color.name,
          nameEn: color.name,
          ...generateCustomGlowGradients(color.hex),
          previewColor: color.hex,
          accentColor: color.hex,
          minStreak: 21,
          description: 'Your saved color',
        }
      : DEFAULT_GLOW_THEME;
  });
  readonly effectiveGlowGradient = computed(() =>
    this.themeService.isDark() ? this.activeTheme().darkGradient : this.activeTheme().lightGradient,
  );
  // Null preserves the shipped warm model palette rather than recoloring the default.
  readonly effectiveGlowColor = computed(() => this.selectedColor()?.hex ?? null);
  readonly activePersonality = computed(
    () =>
      this.personalityOptions.find((p) => p.id === this.personality()) ??
      this.personalityOptions[1],
  );
  readonly isThemeUnlocked = computed(
    () => (id: MeroGlowThemeId) => id === 'golden' || (id === 'custom' && this.isUnlocked()),
  );
  readonly unlockedThemesCount = computed(() => 1 + (this.collection()?.colors.length ?? 0));

  constructor() {
    const destroy = inject(DestroyRef);
    effect(() => {
      const user = this.auth.currentUser();
      untracked(() => {
        const key = user ? `${user.id}:${this.auth.getToken()}` : null;
        if (key === this.boundSession) return;
        this.boundSession = key;
        this.version++;
        this.refreshRequest = undefined;
        this.refreshPending = false;
        this.confirmed.set(null);
        this.loading.set(false);
        this.saving.set(false);
        this.loadError.set(null);
        this.personality.set('calm');
        const legacy = user ? this.readLegacy(user.id) : null;
        if (legacy && this.personalityOptions.some((p) => p.id === legacy['personality'])) {
          this.personality.set(legacy['personality']);
        }
        if (user) void this.refresh();
      });
    });
    // A confirmed habit mutation/calendar refresh can earn a slot on this page.
    let previousCommitments = this.commitmentService.commitments();
    effect(() => {
      const commitments = this.commitmentService.commitments();
      if (commitments === previousCommitments) return;
      previousCommitments = commitments;
      untracked(() => {
        if (this.refreshRequest || this.saving()) this.refreshPending = true;
        else if (this.collection()) void this.refresh();
      });
    });
    inject(ForegroundRefreshService).onResume(() => void this.refresh(), destroy);
    destroy.onDestroy(() => {
      this.destroyed = true;
      this.version++;
    });
  }

  private session() {
    const userId = this.auth.currentUser()?.id;
    const token = this.auth.getToken();
    if (!userId || !token || this.auth.isLocalToken(token)) {
      throw new Error('Sign in to load and save your color collection.');
    }
    return { userId, token };
  }

  private current(session: { userId: string; token: string }, version: number) {
    return (
      !this.destroyed &&
      this.version === version &&
      this.auth.currentUser()?.id === session.userId &&
      this.auth.getToken() === session.token
    );
  }

  private assertCollection(data: MeroCollection): MeroCollection {
    const integer = (n: number) => Number.isSafeInteger(n) && n >= 0;
    if (
      !data ||
      !integer(data.collectionDays) ||
      !integer(data.acceptedPartners) ||
      !integer(data.capacity) ||
      !integer(data.selectedSlot) ||
      !integer(data.currentStreak) ||
      data.capacity !==
        meroColorCapacity(!!data.unlockedAt, data.collectionDays, data.acceptedPartners) ||
      (data.unlockedAt !== null && !Number.isFinite(Date.parse(data.unlockedAt))) ||
      data.nextDayTarget !== data.capacity * 21 ||
      data.nextPartnerTarget !== Math.max(1, data.capacity * 2 - 1) ||
      typeof data.preferencesInitialized !== 'boolean' ||
      typeof data.hasSentSupport !== 'boolean' ||
      !Array.isArray(data.colors) ||
      data.colors.some(
        (c) =>
          !c ||
          !integer(c.slot) ||
          c.slot < 1 ||
          c.slot > data.capacity ||
          !this.validName(c.name) ||
          typeof c.hex !== 'string' ||
          !/^#[0-9a-f]{6}$/.test(c.hex),
      ) ||
      new Set(data.colors.map((c) => c.slot)).size !== data.colors.length ||
      (data.selectedSlot !== 0 && !data.colors.some((c) => c.slot === data.selectedSlot))
    ) {
      throw new Error('The server did not confirm your collection. Please retry.');
    }
    return data;
  }

  private async request(request: () => Promise<MeroCollection>) {
    this.coldStart.startRequest();
    try {
      return this.assertCollection(await request());
    } finally {
      this.coldStart.finishRequest();
    }
  }

  refresh(): Promise<void> {
    if (this.saving() || this.destroyed || !this.auth.currentUser()) return Promise.resolve();
    const key = `${this.auth.currentUser()!.id}:${this.auth.getToken()}`;
    if (this.refreshRequest?.key === key) return this.refreshRequest.promise;
    if (
      (typeof document !== 'undefined' && document.visibilityState === 'hidden') ||
      (typeof navigator !== 'undefined' && navigator.onLine === false)
    )
      return Promise.resolve();
    const promise = this.loadCollection().finally(() => {
      if (this.refreshRequest?.promise !== promise) return;
      this.refreshRequest = undefined;
      this.refreshIfPending();
    });
    this.refreshRequest = { key, promise };
    return promise;
  }

  private refreshIfPending(): void {
    // Keep the invalidation until both an older read and any save have settled.
    if (!this.refreshPending || this.refreshRequest || this.saving()) return;
    this.refreshPending = false;
    void this.refresh();
  }

  private async loadCollection(): Promise<void> {
    let session: { userId: string; token: string };
    try {
      session = this.session();
    } catch (error) {
      this.loadError.set(this.message(error));
      return;
    }
    const version = ++this.version;
    this.loading.set(true);
    this.loadError.set(null);
    try {
      let data = await this.request(() =>
        firstValueFrom(
          this.http
            .get<MeroCollection>(`${this.api}/collection`, { params: { 'ngsw-bypass': 'true' } })
            .pipe(timeout(90000)),
        ),
      );
      if (!this.current(session, version)) return;
      this.confirmed.set({ ...session, data });
      const legacy = this.legacyCandidate(session.userId);
      if (data.unlockedAt && !data.preferencesInitialized && legacy) {
        // Same conditional import is serialized on the server, so the first
        // explicit edit/import wins across devices. Never import eligibility.
        data = await this.request(() =>
          firstValueFrom(
            this.http.post<MeroCollection>(`${this.api}/import`, legacy).pipe(timeout(20000)),
          ),
        );
        if (!this.current(session, version)) return;
        this.confirmed.set({ ...session, data });
      }
    } catch (error) {
      if (this.current(session, version)) this.loadError.set(this.message(error));
    } finally {
      if (this.current(session, version)) this.loading.set(false);
    }
  }

  async saveColor(slot: number, name: string, hex: string): Promise<void> {
    const trimmedName = name.trim();
    if (!this.validName(trimmedName))
      throw new Error('Use a color name of 1–30 characters without control characters.');
    const trimmedHex = hex.trim().toLowerCase();
    const normalized = trimmedHex.startsWith('#') ? trimmedHex : `#${trimmedHex}`;
    if (!/^#[0-9a-f]{6}$/.test(normalized))
      throw new Error('Enter a six-digit hex color, such as #8b5cf6.');
    if (!Number.isSafeInteger(slot) || slot < 1 || slot > (this.collection()?.capacity ?? 0)) {
      throw new Error('This color slot is not earned yet.');
    }
    await this.mutate(() =>
      firstValueFrom(
        this.http
          .put<MeroCollection>(`${this.api}/colors/${slot}`, { name: trimmedName, hex: normalized })
          .pipe(timeout(20000)),
      ),
    );
  }

  async selectColor(slot: number): Promise<void> {
    await this.mutate(() =>
      firstValueFrom(
        this.http.patch<MeroCollection>(`${this.api}/selection`, { slot }).pipe(timeout(20000)),
      ),
    );
  }

  private async mutate(request: () => Promise<MeroCollection>) {
    if (this.saving()) throw new Error('Please wait for your current save.');
    const session = this.session();
    const version = ++this.version;
    this.loading.set(false);
    this.saving.set(true);
    this.loadError.set(null);
    try {
      const data = await this.request(request);
      if (!this.current(session, version)) throw new Error('Your session changed. Please reload.');
      this.confirmed.set({ ...session, data });
    } catch (error) {
      throw new Error(this.message(error));
    } finally {
      if (this.current(session, version)) {
        this.saving.set(false);
        this.refreshIfPending();
      }
    }
  }

  async setCustomGlow(name: string, hex: string): Promise<void> {
    await this.saveColor(this.collection()?.selectedSlot || 1, name, hex);
  }
  async setGlowTheme(themeId: MeroGlowThemeId): Promise<boolean> {
    if (themeId === 'golden') {
      await this.selectColor(0);
      return true;
    }
    const slot = this.collection()?.colors[0]?.slot;
    if (themeId !== 'custom' || !this.isUnlocked() || !slot) return false;
    await this.selectColor(slot);
    return true;
  }
  resetToDefaultGlow(): Promise<void> {
    return this.selectColor(0);
  }

  setPersonality(personality: MeroPersonality): void {
    if (!this.personalityOptions.some((p) => p.id === personality)) return;
    const userId = this.auth.currentUser()?.id;
    if (!userId) return;
    // Personality stays device-local and does not overwrite legacy color candidates.
    const legacy = this.readLegacy(userId) ?? {};
    localStorage.setItem(
      `mehrchain_mero_customization_v1_${userId}`,
      JSON.stringify({ ...legacy, personality }),
    );
    this.personality.set(personality);
  }
  getGreeting(): string {
    return this.activePersonality().greeting(this.nickname());
  }
  getStreakPraise(days: number): string {
    return this.activePersonality().streakPraise(this.nickname(), days);
  }

  private validName(name: unknown): name is string {
    return (
      typeof name === 'string' &&
      Array.from(name).length >= 1 &&
      Array.from(name).length <= 30 &&
      name === name.trim() &&
      !/[\u0000-\u001f\u007f]/u.test(name)
    );
  }

  private readLegacy(userId: string): Record<string, any> | null {
    try {
      const value = JSON.parse(
        localStorage.getItem(`mehrchain_mero_customization_v1_${userId}`) || 'null',
      );
      return value && typeof value === 'object' && !Array.isArray(value) ? value : null;
    } catch {
      return null;
    }
  }

  private legacyCandidate(userId: string) {
    const legacy = this.readLegacy(userId);
    const name =
      typeof legacy?.['customGlowName'] === 'string' ? legacy['customGlowName'].trim() : '';
    const color =
      typeof legacy?.['customGlowColor'] === 'string'
        ? legacy['customGlowColor'].trim().toLowerCase()
        : '';
    const hex = color.startsWith('#') ? color : `#${color}`;
    if (!this.validName(name) || !/^#[0-9a-f]{6}$/.test(hex)) return null;
    return {
      name,
      hex,
      selectedThemeId: legacy?.['selectedThemeId'] === 'custom' ? 'custom' : 'golden',
    };
  }

  private message(error: unknown): string {
    if (error instanceof TimeoutError) {
      return 'Could not confirm the request. Your draft is kept; refresh to check before retrying.';
    }
    if (error instanceof HttpErrorResponse) {
      if (typeof error.error?.message === 'string') return error.error.message;
      return 'Could not confirm your collection. Your draft is kept; refresh or retry.';
    }
    return error instanceof Error ? error.message : 'Could not save your color. Please retry.';
  }
}
