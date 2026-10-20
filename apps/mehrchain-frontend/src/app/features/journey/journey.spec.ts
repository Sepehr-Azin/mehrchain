import { ComponentFixture, TestBed } from '@angular/core/testing';
import { patchState } from '@ngrx/signals';
import { commonTestProviders } from '../../../testing/test-providers';
import { CommitmentStore } from '../../core/store/commitment.store';
import { Journey } from './journey';

describe('Journey', () => {
  let component: Journey;
  let fixture: ComponentFixture<Journey>;
  let store: any;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Journey],
      providers: [...commonTestProviders],
    }).compileComponents();

    store = TestBed.inject(CommitmentStore);
    fixture = TestBed.createComponent(Journey);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

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
});
