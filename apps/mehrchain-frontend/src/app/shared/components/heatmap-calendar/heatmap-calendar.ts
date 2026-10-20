import { CommonModule } from '@angular/common';
import { Component, computed, input, signal } from '@angular/core';
import { LucideAngularModule } from 'lucide-angular';
import { completionDayKey } from '../../../core/utils/completion-day';

export interface CalendarDay {
  date: Date;
  dayNumber: number;
  isCurrentMonth: boolean;
  isToday: boolean;
  isCompleted: boolean;
  isFuture: boolean;
  dateKey: string;
}

@Component({
  selector: 'app-heatmap-calendar',
  imports: [CommonModule, LucideAngularModule],
  templateUrl: './heatmap-calendar.html',
  styleUrl: './heatmap-calendar.css',
})
export class HeatmapCalendar {
  // Server day keys stay intact; legacy timestamps use the account zone.
  completedDates = input<string[]>([]);
  timeZone = input('UTC');
  currentDayKey = input<string | null>(null);
  readonly todayKey = computed(
    () => this.currentDayKey() || completionDayKey(new Date().toISOString(), this.timeZone())!,
  );

  private selectedMonth = signal<Date | null>(null);
  readonly viewDate = computed(() => this.selectedMonth() ?? this.accountToday());

  private accountToday(): Date {
    const [year, month, day] = this.todayKey().split('-').map(Number);
    return new Date(Date.UTC(year, month - 1, day, 12));
  }

  readonly weekDays = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];

  readonly monthName = computed(() => {
    return this.viewDate().toLocaleString('en-US', { month: 'long', timeZone: 'UTC' });
  });

  readonly year = computed(() => {
    return this.viewDate().getUTCFullYear();
  });

  readonly isViewingCurrentMonth = computed(() => {
    const now = this.accountToday();
    const current = this.viewDate();
    return (
      now.getUTCFullYear() === current.getUTCFullYear() &&
      now.getUTCMonth() === current.getUTCMonth()
    );
  });

  // Normalized set of completed date keys (YYYY-MM-DD)
  readonly completedSet = computed(() => {
    const set = new Set<string>();
    for (const value of this.completedDates()) {
      const key = completionDayKey(value, this.timeZone());
      if (key) set.add(key);
    }
    return set;
  });

  // Days matrix for the 7x5 or 7x6 calendar grid
  readonly monthDays = computed(() => {
    const current = this.viewDate();
    const year = current.getUTCFullYear();
    const month = current.getUTCMonth();

    const todayKey = this.todayKey();

    // UTC is only a grid coordinate here: device DST must not skip a calendar cell.
    const firstDayOfMonth = new Date(Date.UTC(year, month, 1));
    const lastDayOfMonth = new Date(Date.UTC(year, month + 1, 0));

    // Monday-based day of week (0 = Monday, ..., 6 = Sunday)
    let startDayOfWeek = firstDayOfMonth.getUTCDay() - 1;
    if (startDayOfWeek === -1) startDayOfWeek = 6; // Sunday becomes 6

    const days: CalendarDay[] = [];
    const completed = this.completedSet();

    // 1. Previous month leading days
    const prevMonthLastDay = new Date(Date.UTC(year, month, 0)).getUTCDate();
    for (let i = startDayOfWeek - 1; i >= 0; i--) {
      const dayNum = prevMonthLastDay - i;
      const d = new Date(Date.UTC(year, month - 1, dayNum));
      const key = this.formatDateKey(d);
      days.push({
        date: d,
        dayNumber: dayNum,
        isCurrentMonth: false,
        isToday: key === todayKey,
        isCompleted: completed.has(key),
        isFuture: key > todayKey,
        dateKey: key,
      });
    }

    // 2. Current month days
    const totalDaysInMonth = lastDayOfMonth.getUTCDate();
    for (let dayNum = 1; dayNum <= totalDaysInMonth; dayNum++) {
      const d = new Date(Date.UTC(year, month, dayNum));
      const key = this.formatDateKey(d);
      days.push({
        date: d,
        dayNumber: dayNum,
        isCurrentMonth: true,
        isToday: key === todayKey,
        isCompleted: completed.has(key),
        isFuture: key > todayKey,
        dateKey: key,
      });
    }

    // 3. Next month trailing days to complete full grid weeks
    const remainingDays = (7 - (days.length % 7)) % 7;
    for (let i = 1; i <= remainingDays; i++) {
      const d = new Date(Date.UTC(year, month + 1, i));
      const key = this.formatDateKey(d);
      days.push({
        date: d,
        dayNumber: i,
        isCurrentMonth: false,
        isToday: key === todayKey,
        isCompleted: completed.has(key),
        isFuture: key > todayKey,
        dateKey: key,
      });
    }

    return days;
  });

  // Total completed days in the viewed month
  readonly monthlyActiveCount = computed(() => {
    return this.monthDays().filter((d) => d.isCurrentMonth && d.isCompleted).length;
  });

  prevMonth(): void {
    const current = this.viewDate();
    this.selectedMonth.set(
      new Date(Date.UTC(current.getUTCFullYear(), current.getUTCMonth() - 1, 1, 12)),
    );
  }

  nextMonth(): void {
    const current = this.viewDate();
    this.selectedMonth.set(
      new Date(Date.UTC(current.getUTCFullYear(), current.getUTCMonth() + 1, 1, 12)),
    );
  }

  goToToday(): void {
    this.selectedMonth.set(null);
  }

  private formatDateKey(d: Date): string {
    const year = d.getUTCFullYear();
    const month = String(d.getUTCMonth() + 1).padStart(2, '0');
    const day = String(d.getUTCDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
}
