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
});
