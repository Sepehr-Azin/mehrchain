import {
  Component,
  DestroyRef,
  ElementRef,
  Injector,
  OnInit,
  afterNextRender,
  computed,
  effect,
  inject,
  signal,
  untracked,
  viewChild,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { timer } from 'rxjs';
import { CommonModule } from '@angular/common';
import { HeatmapCalendar } from '../../shared/components/heatmap-calendar/heatmap-calendar';
import { LucideAngularModule } from 'lucide-angular';
import { CommitmentService } from '../../core/services/commitment.service';
import { ChainService } from '../../core/services/chain.service';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { completionDayKey } from '../../core/utils/completion-day';

import { McButtonComponent, McCardComponent } from '../../shared/ui';
import { JourneySkeletonComponent } from '../../shared/components/skeletons';
import { Commitment } from '@mehrchain/shared-data';
import { DeleteConfirmationModal } from '../../shared/components/delete-confirmation-modal/delete-confirmation-modal';

interface JourneyActivity {
  id: string;
  title: string;
  date: string;
  icon: string;
}

@Component({
  selector: 'app-journey',
  imports: [
    CommonModule,
    HeatmapCalendar,
    LucideAngularModule,
    McCardComponent,
    McButtonComponent,
    JourneySkeletonComponent,
    DeleteConfirmationModal,
    RouterLink,
  ],
  templateUrl: './journey.html',
  styleUrl: './journey.css',
})
export class Journey implements OnInit {
  commitmentService = inject(CommitmentService);
  readonly chainService = inject(ChainService);
  private readonly auth = inject(AuthService);
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);
  private readonly injector = inject(Injector);
  private readonly archiveToggle = viewChild<ElementRef<HTMLButtonElement>>('archiveToggle');
  private readonly historyHeading = viewChild<ElementRef<HTMLHeadingElement>>('historyHeading');
  private destroyed = false;
  private presentationUserId = this.auth.currentUser()?.id;
  private presentationToken = this.auth.getToken();
  readonly timeZone = computed(
    () =>
      (this.ownsHabitState() ? this.commitmentService.calendar()?.timeZone : undefined) ??
      this.auth.currentUser()?.timeZone ??
      'UTC',
  );

  errorMessage = signal<string | null>(null);
  showArchived = signal(false);
  restoringIds = signal<ReadonlySet<string>>(new Set());
  restoredTitle = signal<string | null>(null);
  readonly deletingIds = signal<ReadonlySet<string>>(new Set());
  readonly habitToDelete = signal<Commitment | null>(null);
  readonly selectedDate = signal<string | null>(null);
  private readonly recentLimit = signal(5);
  private readonly chainSnapshotOwner = signal<string | null>(null);
  private readonly ownsHabitState = computed(
    () => this.commitmentService.activeUserId() === (this.auth.currentUser()?.id ?? null),
  );
  readonly archivedHabits = computed(() =>
    this.ownsHabitState() ? this.commitmentService.archivedCommitments() : [],
  );
  readonly showInitialLoading = computed(
    () =>
      !this.ownsHabitState() ||
      (this.commitmentService.isLoading() && this.historyCommitments().length === 0),
  );
  readonly chainDataReady = computed(
    () =>
      !!this.auth.currentUser() &&
      this.chainSnapshotOwner() === this.auth.currentUser()?.id &&
      this.ownsHabitState() &&
      !this.commitmentService.isStale() &&
      !this.chainService.supportStale() &&
      !this.chainService.loadError(),
  );
  readonly activeChainsCount = computed(() => {
    if (!this.chainDataReady()) return null;
    const userId = this.auth.currentUser()!.id;
    return new Set(
      this.chainService
        .activeConnections()
        .filter((c) => c.userId === userId)
        .map((c) => c.id),
    ).size;
  });
  readonly receivedSupportToday = computed(() => {
    if (!this.chainDataReady()) return 0;
    const userId = this.auth.currentUser()!.id;
    const habitIds = new Set(
      this.chainService
        .activeConnections()
        .filter((c) => c.userId === userId)
        .map((c) => c.userCommitmentId),
    );
    return [...habitIds].reduce(
      (total, id) => total + this.chainService.getReceivedHeartCount(id),
      0,
    );
  });

  constructor() {
    this.destroyRef.onDestroy(() => (this.destroyed = true));
    effect(() => {
      // Presentation state must not survive an account change. Services own request isolation.
      const userId = this.auth.currentUser()?.id;
      const token = this.auth.getToken();
      untracked(() => {
        if (userId === this.presentationUserId && token === this.presentationToken) return;
        this.presentationUserId = userId;
        this.presentationToken = token;
        this.chainSnapshotOwner.set(null);
        this.selectedDate.set(null);
        this.recentLimit.set(5);
        this.showArchived.set(false);
        this.errorMessage.set(null);
        this.restoredTitle.set(null);
        this.restoringIds.set(new Set());
        this.deletingIds.set(new Set());
        this.habitToDelete.set(null);
      });
    });
    effect(() => {
      if (this.activeCommitmentsCount() === 0 && this.archivedHabits().length > 0)
        this.showArchived.set(true);
    });
  }

  ngOnInit(): void {
    const userId = this.auth.currentUser()?.id;
    const token = this.auth.getToken();
    void this.commitmentService.syncWithBackend().then(() => {
      if (
        !this.destroyed &&
        this.auth.currentUser()?.id === userId &&
        this.auth.getToken() === token &&
        this.route.snapshot.fragment === 'archived-habits'
      )
        this.openArchived();
    });
    this.route.fragment.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((fragment) => {
      if (fragment === 'archived-habits') this.openArchived();
    });
    // Match Chain's foreground cadence so a partner disconnect is reflected while Journey is open.
    timer(0, 15000)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        if (document.visibilityState === 'visible' && navigator.onLine !== false)
          void this.refreshChains();
      });
  }

  async refreshChains(): Promise<void> {
    const userId = this.auth.currentUser()?.id;
    const token = this.auth.getToken();
    await this.chainService.loadConnections();
    if (
      !this.destroyed &&
      userId &&
      this.auth.currentUser()?.id === userId &&
      this.auth.getToken() === token &&
      !this.chainService.supportStale() &&
      !this.chainService.loadError()
    )
      this.chainSnapshotOwner.set(userId);
  }

  openArchived(): void {
    this.showArchived.set(true);
    afterNextRender(
      () => {
        if (this.destroyed) return;
        const button = this.archiveToggle()?.nativeElement;
        button?.focus({ preventScroll: true });
        button?.scrollIntoView({ block: 'start' });
      },
      { injector: this.injector },
    );
  }

  toggleArchived(): void {
    this.showArchived.update((v) => !v);
  }

  async restoreHabit(id: string): Promise<void> {
    if (
      this.restoringIds().has(id) ||
      this.deletingIds().has(id) ||
      this.commitmentService.isStale()
    )
      return;
    const habit = this.archivedHabits().find((h) => h.id === id);
    if (!habit) return;
    const userId = this.auth.currentUser()?.id;
    const token = this.auth.getToken();
    const current = () =>
      !this.destroyed && this.auth.currentUser()?.id === userId && this.auth.getToken() === token;
    this.restoringIds.update((ids) => new Set([...ids, id]));
    try {
      await this.commitmentService.restoreCommitment(id);
      if (!current()) return;
      this.errorMessage.set(null);
      this.restoredTitle.set(habit?.title ?? 'Habit');
    } catch (error) {
      if (current())
        this.errorMessage.set(error instanceof Error ? error.message : 'Could not restore habit.');
    } finally {
      if (current())
        this.restoringIds.update((ids) => {
          const next = new Set(ids);
          next.delete(id);
          return next;
        });
    }
  }

  async permanentDeleteHabit(id: string): Promise<void> {
    if (
      this.restoringIds().has(id) ||
      this.deletingIds().has(id) ||
      this.commitmentService.isStale()
    )
      return;
    if (!this.archivedHabits().some((h) => h.id === id)) return;
    this.errorMessage.set(null);
    this.habitToDelete.set(this.archivedHabits().find((habit) => habit.id === id) ?? null);
  }

  async confirmPermanentDelete(): Promise<void> {
    const id = this.habitToDelete()?.id;
    if (!id || this.deletingIds().has(id) || this.commitmentService.isStale()) return;
    {
      const userId = this.auth.currentUser()?.id;
      const token = this.auth.getToken();
      const current = () =>
        !this.destroyed && this.auth.currentUser()?.id === userId && this.auth.getToken() === token;
      this.deletingIds.update((ids) => new Set([...ids, id]));
      try {
        await this.commitmentService.permanentDeleteCommitment(id);
        if (!current()) return;
        this.habitToDelete.set(null);
        this.errorMessage.set(null);
      } catch (error) {
        if (current())
          this.errorMessage.set(error instanceof Error ? error.message : 'Could not delete habit.');
      } finally {
        if (current())
          this.deletingIds.update((ids) => {
            const next = new Set(ids);
            next.delete(id);
            return next;
          });
      }
    }
  }

  activeCommitmentsCount = computed(() =>
    this.ownsHabitState() ? this.commitmentService.commitments().length : 0,
  );

  private completionEntries = computed<JourneyActivity[]>(() => {
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
  private readonly sortedActivities = computed(() =>
    [...this.completionEntries()].sort(
      (a, b) => b.date.localeCompare(a.date) || a.id.localeCompare(b.id),
    ),
  );
  recentActivities = computed(() => this.sortedActivities().slice(0, this.recentLimit()));
  readonly visibleActivities = computed(() => {
    const date = this.selectedDate();
    return date
      ? this.sortedActivities().filter((entry) => entry.date === date)
      : this.recentActivities();
  });
  readonly activityGroups = computed(() => {
    const groups = new Map<string, JourneyActivity[]>();
    for (const entry of this.visibleActivities()) {
      const entries = groups.get(entry.date) ?? [];
      entries.push(entry);
      groups.set(entry.date, entries);
    }
    return [...groups].map(([date, entries]) => ({ date, entries }));
  });
  readonly hasMoreActivities = computed(
    () => !this.selectedDate() && this.sortedActivities().length > this.recentLimit(),
  );

  selectDate(date: string | null): void {
    const today =
      this.commitmentService.calendar()?.currentDayKey ??
      completionDayKey(new Date().toISOString(), this.timeZone())!;
    if (date && (completionDayKey(date) !== date || date > today)) return;
    this.selectedDate.set(date);
    this.recentLimit.set(5);
  }

  backToRecent(): void {
    this.selectDate(null);
    afterNextRender(
      () => {
        if (!this.destroyed) this.historyHeading()?.nativeElement.focus();
      },
      { injector: this.injector },
    );
  }

  showMoreActivities(): void {
    this.recentLimit.update((limit) => limit + 5);
  }

  formatDate(date: string): string {
    return new Date(`${date}T12:00:00Z`).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      timeZone: 'UTC',
    });
  }

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
    if (!this.ownsHabitState()) return [];
    const byId = new Map(
      [
        ...this.commitmentService.archivedCommitments(),
        ...this.commitmentService.commitments(),
      ].map((h) => [h.id, h]),
    );
    return [...byId.values()];
  });
  longestStreak = computed(() =>
    this.ownsHabitState() ? this.commitmentService.overallStreak() : 0,
  );
}
