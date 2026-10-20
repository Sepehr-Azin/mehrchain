import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HeatmapCalendar } from '../../shared/components/heatmap-calendar/heatmap-calendar';
import { LucideAngularModule } from 'lucide-angular';
import { CommitmentService } from '../../core/services/commitment.service';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { completionDayKey } from '../../core/utils/completion-day';
import { DailyRulesComponent } from '../../shared/components/daily-rules/daily-rules';

import { McButtonComponent, McCardComponent } from '../../shared/ui';
import { JourneySkeletonComponent } from '../../shared/components/skeletons';

@Component({
  selector: 'app-journey',
  imports: [
    CommonModule,
    HeatmapCalendar,
    LucideAngularModule,
    McCardComponent,
    McButtonComponent,
    JourneySkeletonComponent,
    RouterLink,
    DailyRulesComponent,
  ],
  templateUrl: './journey.html',
  styleUrl: './journey.css',
})
export class Journey implements OnInit {
  commitmentService = inject(CommitmentService);
  private readonly auth = inject(AuthService);
  private readonly route = inject(ActivatedRoute);
  readonly timeZone = computed(
    () => this.commitmentService.calendar()?.timeZone ?? this.auth.currentUser()?.timeZone ?? 'UTC',
  );

  errorMessage = signal<string | null>(null);
  showArchived = signal(false);
  restoringIds = signal<ReadonlySet<string>>(new Set());
  restoredTitle = signal<string | null>(null);

  ngOnInit(): void {
    void this.commitmentService
      .syncWithBackend()
      .then(() => {
        if (
          this.route.snapshot.fragment === 'archived-habits' ||
          (this.activeCommitmentsCount() === 0 &&
            this.commitmentService.archivedCommitments().length > 0)
        ) {
          this.showArchived.set(true);
        }
      })
      .catch((error) => this.errorMessage.set(error.message));
  }

  toggleArchived(): void {
    this.showArchived.update((v) => !v);
  }

  async restoreHabit(id: string): Promise<void> {
    if (this.restoringIds().has(id)) return;
    const habit = this.commitmentService.archivedCommitments().find((h) => h.id === id);
    this.restoringIds.update((ids) => new Set([...ids, id]));
    try {
      await this.commitmentService.restoreCommitment(id);
      this.errorMessage.set(null);
      this.restoredTitle.set(habit?.title ?? 'Habit');
    } catch (error) {
      this.errorMessage.set(error instanceof Error ? error.message : 'Could not restore habit.');
    } finally {
      this.restoringIds.update((ids) => {
        const next = new Set(ids);
        next.delete(id);
        return next;
      });
    }
  }

  async permanentDeleteHabit(id: string): Promise<void> {
    if (this.restoringIds().has(id)) return;
    if (confirm('Are you sure you want to permanently delete this habit and all its history?')) {
      try {
        await this.commitmentService.permanentDeleteCommitment(id);
        this.errorMessage.set(null);
      } catch (error) {
        this.errorMessage.set(error instanceof Error ? error.message : 'Could not delete habit.');
      }
    }
  }

  activeCommitmentsCount = computed(() => this.commitmentService.commitments().length);

  private completionEntries = computed(() => {
    return this.historyCommitments().flatMap((habit) => {
      const dates = new Set(
        (habit.history ?? [])
          .map((value) => completionDayKey(value, this.timeZone()))
          .filter((key): key is string => key !== null),
      );
      return [...dates].map((date) => ({
        id: `${habit.id}:${date}`,
        title: habit.title,
        date,
        icon: this.getCategoryIcon(habit.category),
      }));
    });
  });
  recentActivities = computed(() =>
    [...this.completionEntries()]
      .sort((a, b) => b.date.localeCompare(a.date) || a.id.localeCompare(b.id))
      .slice(0, 10),
  );

  getCategoryIcon(cat: string): string {
    const icons: Record<string, string> = {
      health: 'heart',
      growth: 'trending-up',
      community: 'users',
      environment: 'leaf',
    };
    return icons[cat] || 'check';
  }

  allHistory = computed(() => this.completionEntries().map((entry) => entry.date));

  totalActivities = computed(() =>
    this.historyCommitments().reduce((total, habit) => total + (habit.currentDay || 0), 0),
  );
  private historyCommitments = computed(() => {
    const byId = new Map(
      [
        ...this.commitmentService.archivedCommitments(),
        ...this.commitmentService.commitments(),
      ].map((h) => [h.id, h]),
    );
    return [...byId.values()];
  });
  longestStreak = this.commitmentService.overallStreak;
}
