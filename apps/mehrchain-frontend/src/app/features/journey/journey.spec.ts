import { ComponentFixture, TestBed } from '@angular/core/testing';
import { patchState } from '@ngrx/signals';
import { commonTestProviders } from '../../../testing/test-providers';
import { CommitmentStore } from '../../core/store/commitment.store';
import { Journey } from './journey';
import { ChainConnection } from '@mehrchain/shared-data';
import { ChainService } from '../../core/services/chain.service';
import { AuthService } from '../../core/services/auth.service';
import { signal } from '@angular/core';

describe('Journey', () => {
  let component: Journey;
  let fixture: ComponentFixture<Journey>;
  let store: any;

  beforeEach(async () => {
    localStorage.clear();
    await TestBed.configureTestingModule({
      imports: [Journey],
      providers: [...commonTestProviders],
    }).compileComponents();

    store = TestBed.inject(CommitmentStore);
    fixture = TestBed.createComponent(Journey);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  afterEach(() => localStorage.clear());

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should compute active commitments and activities correctly', () => {
    patchState(store, {
      commitments: [
        {
          id: 'c1',
          title: 'Morning Yoga',
          category: 'health',
          totalDays: 21,
          currentDay: 1,
          currentStreak: 1,
          isCompletedToday: true,
          startDate: new Date().toISOString(),
          history: ['2026-10-02'],
        },
      ],
    });

    fixture.detectChanges();
    expect(component.activeCommitmentsCount()).toBe(1);
    expect(component.totalActivities()).toBe(1);
    expect(component.recentActivities().length).toBe(1);
  });

  it('should not render duplicate user profile card in Journey page', () => {
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    const text = compiled.querySelector('.truncate')?.textContent ?? '';
    expect(text).not.toContain('Signed In');
  });

  it('keeps archived effort in the calendar and recent activities', () => {
    patchState(store, {
      commitments: [],
      archivedCommitments: [
        {
          id: 'archived',
          title: 'Read',
          category: 'growth',
          totalDays: -1,
          currentDay: 2,
          currentStreak: 0,
          isCompletedToday: false,
          isArchived: true,
          startDate: '2026-10-01T00:00:00Z',
          history: ['2026-10-02', '2026-10-03'],
        },
      ],
    });
    expect(component.activeCommitmentsCount()).toBe(0);
    expect(component.allHistory()).toEqual(['2026-10-02', '2026-10-03']);
    expect(component.totalActivities()).toBe(2);
    expect(component.recentActivities()).toHaveLength(2);
  });

  it('should toggle archived flames section', () => {
    expect(component.showArchived()).toBe(false);
    component.toggleArchived();
    expect(component.showArchived()).toBe(true);
  });

  it('keeps same-named habits separate while deduplicating each habit date', () => {
    const habit = {
      title: 'Read',
      category: 'growth',
      totalDays: -1,
      currentDay: 2,
      currentStreak: 0,
      isCompletedToday: false,
      startDate: '2026-10-01T00:00:00Z',
      history: ['2026-10-02', '2026-10-02'],
    };
    patchState(store, {
      commitments: [{ ...habit, id: 'active' }],
      archivedCommitments: [{ ...habit, id: 'archived', isArchived: true }],
    });
    expect(component.recentActivities()).toHaveLength(2);
    expect(new Set(component.recentActivities().map((log) => log.id)).size).toBe(2);
    // The confirmed cumulative total can exceed surviving dated history. Never fabricate dates.
    expect(component.totalActivities()).toBe(4);
    expect(component.allHistory()).toEqual(['2026-10-02', '2026-10-02']);
  });

  it('paginates actual dated history and uses one filtered list without losing archived effort', () => {
    const habit = {
      title: 'Read',
      category: 'growth',
      totalDays: -1,
      currentDay: 12,
      currentStreak: 2,
      isCompletedToday: false,
      startDate: '2026-10-01T00:00:00Z',
    };
    patchState(store, {
      commitments: [
        {
          ...habit,
          id: 'active',
          history: [
            '2026-10-01',
            '2026-10-02',
            '2026-10-03',
            '2026-10-04',
            '2026-10-05',
            '2026-10-06',
          ],
        },
      ],
      archivedCommitments: [
        { ...habit, id: 'archived', isArchived: true, history: ['2026-10-06'] },
      ],
      calendar: { currentDayKey: '2026-10-20', timeZone: 'Asia/Tehran' },
    });
    expect(component.recentActivities()).toHaveLength(5);
    expect(component.hasMoreActivities()).toBe(true);
    component.showMoreActivities();
    expect(component.visibleActivities()).toHaveLength(7);
    expect(component.hasMoreActivities()).toBe(false);
    component.selectDate('2026-10-06');
    expect(component.activityGroups()).toHaveLength(1);
    expect(component.visibleActivities().map((entry) => entry.id)).toEqual([
      'active:2026-10-06',
      'archived:2026-10-06',
    ]);
    expect(component.totalActivities()).toBe(24); // No fabricated dates for the larger legacy total.
    component.selectDate('2026-10-07');
    expect(component.visibleActivities()).toHaveLength(0);
    component.selectDate('2026-10-21');
    expect(component.selectedDate()).toBe('2026-10-07'); // Server account date controls future selection.
    component.selectDate(null);
    expect(component.visibleActivities()).toHaveLength(5);
  });

  it('counts distinct accepted links and deduplicates own-habit support while hiding expired counts', async () => {
    const auth = TestBed.inject(AuthService);
    const chains = TestBed.inject(ChainService);
    vi.spyOn(auth, 'currentUser').mockReturnValue({
      id: 'owner',
      username: 'owner',
      email: '',
      createdAt: '',
    });
    vi.spyOn(chains, 'loadConnections').mockResolvedValue([]);
    const link = (id: string, habit: string, count: number, userId = 'owner'): ChainConnection => ({
      id,
      userId,
      partnerId: 'same-partner',
      userCommitmentId: habit,
      partnerCommitmentId: 'partner-habit',
      status: 'ACTIVE',
      consecutiveMissedDays: 0,
      heartSent: false,
      receivedHeartCount: count,
      createdAt: '',
    });
    vi.spyOn(chains, 'activeConnections').mockReturnValue([
      link('a', 'read', 2),
      link('a', 'read', 2),
      link('b', 'read', 2),
      link('c', 'walk', 1),
      link('foreign', 'foreign', 9, 'other'),
    ]);
    // Establish the mocked signed-in session before computed signals are evaluated.
    fixture.destroy();
    fixture = TestBed.createComponent(Journey);
    component = fixture.componentInstance;
    patchState(store, { activeUserId: 'owner', isStale: false });
    fixture.detectChanges();
    chains.supportStale.set(false);
    await component.refreshChains();
    expect(component.activeChainsCount()).toBe(3);
    expect(component.receivedSupportToday()).toBe(3); // Two for Read, one for Walk; not per connection.
    chains.supportStale.set(true);
    expect(component.activeChainsCount()).toBeNull();
    expect(component.receivedSupportToday()).toBe(0);
    chains.supportStale.set(false);
    chains.loadError.set('Refresh failed');
    expect(component.activeChainsCount()).toBeNull();
    chains.loadError.set(null);
    vi.mocked(chains.activeConnections).mockReturnValue([]);
    await component.refreshChains();
    expect(component.activeChainsCount()).toBe(0); // A confirmed empty response is different from failure.
  });

  it('ignores a previous account refresh and hides its history during an account switch', async () => {
    const auth = TestBed.inject(AuthService);
    const chains = TestBed.inject(ChainService);
    const user = signal({ id: 'first', username: 'first', email: '', createdAt: '' });
    vi.spyOn(auth, 'currentUser').mockImplementation(user);
    let finish!: (rows: ChainConnection[]) => void;
    vi.spyOn(chains, 'loadConnections').mockImplementation(
      () =>
        new Promise((resolve) => {
          finish = resolve;
        }),
    );
    patchState(store, {
      activeUserId: 'first',
      isStale: false,
      commitments: [
        {
          id: 'old',
          title: 'Private old habit',
          category: 'growth',
          currentDay: 1,
          history: ['2026-10-01'],
        },
      ],
    });
    fixture.detectChanges();
    chains.supportStale.set(false);
    const pending = component.refreshChains();
    user.set({ id: 'second', username: 'second', email: '', createdAt: '' });
    fixture.detectChanges();
    expect(component.allHistory()).toEqual([]);
    expect(component.totalActivities()).toBe(0);
    finish([]);
    await pending;
    expect(component.activeChainsCount()).toBeNull();
  });
});
