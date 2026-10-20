import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-journey-skeleton',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div
      class="space-y-5 motion-safe:animate-pulse"
      role="status"
      aria-label="Loading your journey"
    >
      <span class="sr-only">Loading your journey…</span>
      <!-- Stats Grid Skeleton -->
      <div class="grid grid-cols-3 gap-2" aria-hidden="true">
        @for (box of [1, 2, 3]; track $index) {
          <div
            class="bg-card px-2 py-3.5 rounded-2xl border border-border/50 text-center space-y-2"
          >
            <div class="h-8 w-full max-w-16 mx-auto rounded bg-muted/60"></div>
            <div class="h-6 w-8 mx-auto rounded bg-muted/80"></div>
          </div>
        }
      </div>

      <!-- Heatmap Skeleton -->
      <div
        class="bg-card rounded-3xl p-4 shadow-soft border border-border/50 space-y-4"
        aria-hidden="true"
      >
        <div class="h-4 w-28 rounded bg-muted/80"></div>
        <div class="h-4 w-40 max-w-full rounded bg-muted/60"></div>
        <div class="h-64 w-full rounded-2xl bg-muted/30"></div>
      </div>
      <div class="space-y-2" aria-hidden="true">
        <div class="h-4 w-32 rounded bg-muted/60"></div>
        <div class="h-14 rounded-2xl bg-muted/30"></div>
      </div>
    </div>
  `,
})
export class JourneySkeletonComponent {}
