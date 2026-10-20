import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HeatmapCalendar } from './heatmap-calendar';
import { commonTestProviders } from '../../../../testing/test-providers';

describe('HeatmapCalendar (Monthly Grid)', () => {
  let component: HeatmapCalendar;
  let fixture: ComponentFixture<HeatmapCalendar>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HeatmapCalendar],
      providers: [...commonTestProviders],
    }).compileComponents();

    fixture = TestBed.createComponent(HeatmapCalendar);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create and display current month and year', () => {
    expect(component).toBeTruthy();
    expect(component.monthName()).toBeTruthy();
    expect(component.year()).toBeGreaterThan(2020);
    expect(component.monthDays().length).toBeGreaterThanOrEqual(28);
  });

  it('should navigate to previous and next month', () => {
    const initialMonth = component.viewDate().getUTCMonth();

    component.prevMonth();
    fixture.detectChanges();
    expect(component.viewDate().getUTCMonth()).toBe((initialMonth - 1 + 12) % 12);

    component.nextMonth();
    fixture.detectChanges();
    expect(component.viewDate().getUTCMonth()).toBe(initialMonth);
  });

  it('should correctly mark completed dates in the grid', () => {
    const today = new Date();
    const todayKey = today.toISOString().slice(0, 10);

    fixture.componentRef.setInput('completedDates', [todayKey]);
    fixture.detectChanges();

    expect(component.monthlyActiveCount()).toBe(1);
  });

  it('anchors today and the initial month to the server account date', () => {
    fixture.componentRef.setInput('timeZone', 'Asia/Tehran');
    fixture.componentRef.setInput('currentDayKey', '2026-11-01');
    fixture.componentRef.setInput('completedDates', ['2026-10-31T21:00:00Z']);
    fixture.detectChanges();
    expect(component.year()).toBe(2026);
    expect(component.viewDate().getUTCMonth()).toBe(10);
    expect(component.monthDays().find((day) => day.isToday)?.dateKey).toBe('2026-11-01');
    expect(component.monthlyActiveCount()).toBe(1);
    component.prevMonth();
    component.goToToday();
    expect(component.viewDate().getUTCMonth()).toBe(10);
  });

  it('counts one calendar date for multiple completions and selects through an accessible button', () => {
    fixture.componentRef.setInput('currentDayKey', '2026-10-20');
    fixture.componentRef.setInput('completedDates', ['2026-10-19', '2026-10-19']);
    fixture.componentRef.setInput('selectedDate', '2026-10-19');
    fixture.detectChanges();
    const emitted = vi.fn();
    component.dateSelected.subscribe(emitted);
    const button = (fixture.nativeElement as HTMLElement).querySelector<HTMLButtonElement>(
      'button[aria-pressed="true"]',
    )!;
    button.click();
    expect(component.monthlyActiveCount()).toBe(1);
    expect(button.getAttribute('aria-controls')).toBe('journey-history');
    expect(emitted).toHaveBeenCalledWith('2026-10-19');
  });

  it('allows an empty past date but disables future dates and future-month navigation', () => {
    fixture.componentRef.setInput('currentDayKey', '2026-10-20');
    fixture.detectChanges();
    const emitted = vi.fn();
    component.dateSelected.subscribe(emitted);
    const empty = component.monthDays().find((day) => day.dateKey === '2026-10-18')!;
    const future = component.monthDays().find((day) => day.dateKey === '2026-10-21')!;
    component.selectDay(empty);
    component.selectDay(future);
    expect(emitted).toHaveBeenCalledTimes(1);
    expect(emitted).toHaveBeenCalledWith('2026-10-18');
    const next = (fixture.nativeElement as HTMLElement).querySelector<HTMLButtonElement>(
      'button[aria-label="Next month"]',
    )!;
    expect(next.disabled).toBe(true);
    component.nextMonth();
    expect(component.viewDate().getUTCMonth()).toBe(9);
  });

  it('clears the history filter on month navigation and returning to the current month', () => {
    fixture.componentRef.setInput('currentDayKey', '2026-10-20');
    const emitted = vi.fn();
    component.dateSelected.subscribe(emitted);
    component.prevMonth();
    expect(component.canGoNext()).toBe(true);
    component.nextMonth();
    component.goToToday();
    expect(emitted.mock.calls).toEqual([[null], [null], [null]]);
  });
});
