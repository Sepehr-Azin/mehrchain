import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { signal } from '@angular/core';
import { MeroCollection } from '@mehrchain/shared-data';
import { MeroCustomizationService, DEFAULT_GLOW_THEME } from './mero-customization.service';
import { AuthService } from './auth.service';
import { CommitmentService } from './commitment.service';
import { ThemeService } from './theme.service';
import { ColdStartService } from './cold-start.service';
import { ForegroundRefreshService } from './foreground-refresh.service';

const snapshot = (changes: Partial<MeroCollection> = {}): MeroCollection => ({
  unlockedAt: null,
  capacity: 0,
  collectionDays: 0,
  acceptedPartners: 0,
  nextDayTarget: 0,
  nextPartnerTarget: 1,
  selectedSlot: 0,
  preferencesInitialized: false,
  hasSentSupport: false,
  currentStreak: 0,
  colors: [],
  ...changes,
});
const earned = (changes: Partial<MeroCollection> = {}) =>
  snapshot({
    unlockedAt: '2026-10-20T12:00:00Z',
    capacity: 1,
    nextDayTarget: 21,
    ...changes,
  });

describe('Mero server collection', () => {
  let service: MeroCustomizationService;
  let http: HttpTestingController;
  let user: ReturnType<typeof signal<any>>;
  let habits: ReturnType<typeof signal<any[]>>;
  let dark: ReturnType<typeof signal<boolean>>;
  let token: string | null;
  const settle = async () => {
    await Promise.resolve();
    await Promise.resolve();
    await Promise.resolve();
  };

  beforeEach(() => {
    TestBed.resetTestingModule();
    localStorage.clear();
    user = signal(null);
    habits = signal([]);
    dark = signal(false);
    token = 'remote-owner';
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        {
          provide: AuthService,
          useValue: { currentUser: user, getToken: () => token, isLocalToken: () => false },
        },
        { provide: CommitmentService, useValue: { commitments: habits } },
        { provide: ThemeService, useValue: { isDark: dark } },
        { provide: ColdStartService, useValue: { startRequest: vi.fn(), finishRequest: vi.fn() } },
        { provide: ForegroundRefreshService, useValue: { onResume: vi.fn() } },
      ],
    });
    service = TestBed.inject(MeroCustomizationService);
    http = TestBed.inject(HttpTestingController);
    TestBed.tick();
  });
  afterEach(() => {
    try {
      http.verify();
    } finally {
      TestBed.resetTestingModule();
    }
  });

  async function login(data = snapshot()) {
    user.set({ id: 'owner' });
    TestBed.tick();
    http.expectOne((r) => r.url.endsWith('/mero/collection')).flush(data);
    await settle();
  }

  it('shares overlapping reads and schedules one fresh read after a habit changes', async () => {
    await login();
    const first = service.refresh();
    expect(service.refresh()).toBe(first);
    const pending = http.expectOne((r) => r.url.endsWith('/mero/collection'));
    habits.set([{ id: 'habit', currentStreak: 21 }]);
    TestBed.tick();
    pending.flush(snapshot());
    await first;
    http.expectOne((r) => r.url.endsWith('/mero/collection')).flush(earned());
    await settle();
    expect(service.isUnlocked()).toBe(true);
  });

  it('keeps a habit invalidation until both a read and a save have settled', async () => {
    await login(earned());
    const reading = service.refresh();
    const old = http.expectOne((r) => r.url.endsWith('/mero/collection'));
    const saving = service.selectColor(0);
    habits.set([{ id: 'habit', currentStreak: 22 }]);
    TestBed.tick();
    http.expectOne((r) => r.method === 'PATCH').flush(earned());
    await saving;
    http.expectNone((r) => r.url.endsWith('/mero/collection'));
    old.flush(earned());
    await reading;
    http.expectOne((r) => r.url.endsWith('/mero/collection')).flush(earned({ collectionDays: 1 }));
    await settle();
    expect(service.collection()?.collectionDays).toBe(1);
  });

  it('keeps Mero fixed and follows the confirmed default in both themes', () => {
    expect(service.nickname()).toBe('Mero');
    expect(service.effectiveGlowGradient()).toBe(DEFAULT_GLOW_THEME.lightGradient);
    dark.set(true);
    expect(service.effectiveGlowGradient()).toBe(DEFAULT_GLOW_THEME.darkGradient);
  });

  it('does not trust local eligibility, a cached habit streak, or an unscoped guest color', async () => {
    localStorage.setItem(
      'mehrchain_mero_customization_v1_owner',
      JSON.stringify({
        selectedThemeId: 'custom',
        customGlowName: 'Local',
        customGlowColor: '#06b6d4',
        unlocked: true,
      }),
    );
    localStorage.setItem(
      'mehrchain_mero_customization_v1',
      JSON.stringify({
        selectedThemeId: 'custom',
        customGlowName: 'Guest',
        customGlowColor: '#f43f5e',
      }),
    );
    habits.set([{ currentStreak: 99 }]);
    TestBed.tick(); // Settle the guest habit change before the signed-in session starts.
    await login(snapshot({ currentStreak: 20 }));
    expect(service.isUnlocked()).toBe(false);
    expect(service.selectedThemeId()).toBe('golden');
    http.expectNone((r) => r.url.endsWith('/mero/import'));
    expect(localStorage.getItem('mehrchain_mero_customization_v1_owner')).toContain('Local');
  });

  it('imports an eligible scoped legacy color only after server confirmation', async () => {
    localStorage.setItem(
      'mehrchain_mero_customization_v1_owner',
      JSON.stringify({
        selectedThemeId: 'custom',
        customGlowName: ' Aurora ',
        customGlowColor: '#06B6D4',
      }),
    );
    await login(earned());
    const request = http.expectOne((r) => r.url.endsWith('/mero/import'));
    expect(request.request.body).toEqual({
      name: 'Aurora',
      hex: '#06b6d4',
      selectedThemeId: 'custom',
    });
    expect(service.selectedThemeId()).toBe('golden');
    request.flush(
      earned({
        preferencesInitialized: true,
        selectedSlot: 1,
        colors: [{ slot: 1, name: 'Aurora', hex: '#06b6d4' }],
      }),
    );
    await settle();
    expect(service.effectiveGlowColor()).toBe('#06b6d4');
  });

  it('does not import another device over an initialized server collection', async () => {
    localStorage.setItem(
      'mehrchain_mero_customization_v1_owner',
      JSON.stringify({
        selectedThemeId: 'custom',
        customGlowName: 'Old',
        customGlowColor: '#06b6d4',
      }),
    );
    await login(earned({ preferencesInitialized: true }));
    http.expectNone((r) => r.url.endsWith('/mero/import'));
  });

  it('preserves confirmed appearance on failure and applies a color only after a saved response', async () => {
    await login(earned());
    const failed = service.saveColor(1, 'Aurora', '#06b6d4').catch((error) => error.message);
    const write = http.expectOne((r) => r.method === 'PUT');
    expect(service.effectiveGlowColor()).toBeNull();
    write.flush({ message: 'Please retry saving.' }, { status: 503, statusText: 'Unavailable' });
    expect(await failed).toBe('Please retry saving.');
    expect(service.effectiveGlowColor()).toBeNull();

    const saved = service.saveColor(1, 'Aurora', '06B6D4');
    http
      .expectOne((r) => r.method === 'PUT')
      .flush(
        earned({
          preferencesInitialized: true,
          selectedSlot: 1,
          colors: [{ slot: 1, name: 'Aurora', hex: '#06b6d4' }],
        }),
      );
    await saved;
    expect(service.activeTheme().name).toBe('Aurora');
    expect(service.effectiveGlowColor()).toBe('#06b6d4');
  });

  it('rejects stale writes after account/token changes and clears the earlier appearance immediately', async () => {
    await login(earned());
    const saving = service.saveColor(1, 'Owner color', '#06b6d4').catch((error) => error.message);
    const old = http.expectOne((r) => r.method === 'PUT');
    token = 'remote-second';
    user.set({ id: 'second' });
    expect(service.collection()).toBeNull();
    TestBed.tick();
    http.expectOne((r) => r.url.endsWith('/mero/collection')).flush(snapshot());
    await settle();
    old.flush(
      earned({
        preferencesInitialized: true,
        selectedSlot: 1,
        colors: [{ slot: 1, name: 'Owner color', hex: '#06b6d4' }],
      }),
    );
    expect(await saving).toContain('session changed');
    expect(service.collection()?.capacity).toBe(0);
    expect(service.effectiveGlowColor()).toBeNull();
  });

  it('ignores an older read that finishes after a confirmed save', async () => {
    await login(earned());
    const older = service.refresh();
    const old = http.expectOne((r) => r.url.endsWith('/mero/collection'));
    const newer = service.saveColor(1, 'Aurora', '#06b6d4');
    http
      .expectOne((r) => r.method === 'PUT')
      .flush(
        earned({
          preferencesInitialized: true,
          selectedSlot: 1,
          colors: [{ slot: 1, name: 'Aurora', hex: '#06b6d4' }],
          acceptedPartners: 3,
          capacity: 3,
          nextDayTarget: 63,
          nextPartnerTarget: 5,
        }),
      );
    await newer;
    old.flush(earned());
    await older;
    expect(service.collection()?.capacity).toBe(3);
    expect(service.effectiveGlowColor()).toBe('#06b6d4');
  });
});
