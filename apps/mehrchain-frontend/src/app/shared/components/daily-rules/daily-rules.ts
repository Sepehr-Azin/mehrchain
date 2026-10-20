import { Component, computed, inject, input } from '@angular/core';
import { AuthService } from '../../../core/services/auth.service';
import { CommitmentService } from '../../../core/services/commitment.service';

@Component({
  selector: 'app-daily-rules',
  template: `
    <details
      [open]="!compact()"
      class="my-3 rounded-xl border border-border/50 p-3 text-xs text-muted-foreground"
    >
      <summary class="min-h-6 cursor-pointer font-semibold text-foreground">
        How daily habits work
      </summary>
      <div class="mt-2 space-y-2 leading-relaxed">
        <p>
          One completion per habit each date. A new day starts at midnight in {{ timeZone() }},
          regardless of your reminder or creation time.
        </p>
        <p>
          Endless has no finish target. Custom counts completed days, even across breaks. At your
          target, choose Continue or Archive.
        </p>
        <p>
          After one missed date, your next completion starts a streak of 1. No catch-up needed.
          After two fully missed dates, an unfinished habit archives and its Chains disconnect.
        </p>
        <p>
          The partial creation or restore date does not count as missed. Restore keeps earlier
          effort and earned colors; reconnecting needs a new invitation.
        </p>
        <p>
          Your account timezone stays the same across devices. Chain is optional. Your private
          reason is never shared with partners.
        </p>
      </div>
    </details>
  `,
})
export class DailyRulesComponent {
  compact = input(false);
  private readonly auth = inject(AuthService);
  private readonly commitments = inject(CommitmentService);
  readonly timeZone = computed(() => {
    const user = this.auth.currentUser();
    return (
      this.commitments.calendar()?.timeZone ??
      (user ? user.timeZone || 'UTC' : Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC')
    );
  });
}
