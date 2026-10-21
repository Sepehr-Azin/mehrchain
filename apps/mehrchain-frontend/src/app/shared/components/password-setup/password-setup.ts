import {
  Component,
  DestroyRef,
  effect,
  inject,
  input,
  output,
  signal,
  untracked,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-password-setup',
  imports: [FormsModule],
  template: `
    <section class="space-y-3" aria-label="Email-verified password setup">
      @if (done()) {
        <p role="status" class="text-sm text-foreground">Password saved. Sign in again.</p>
        <button
          type="button"
          (click)="complete.emit()"
          class="rounded-xl bg-primary px-4 py-3 text-primary-foreground"
        >
          Back to sign in
        </button>
      } @else {
        <form (ngSubmit)="submitted() ? confirm() : request()" class="space-y-3">
          <fieldset [disabled]="busy()" class="space-y-3 min-w-0">
            @if (!submitted()) {
              <label for="password-email" class="block text-xs text-muted-foreground"
                >Account email</label
              >
              <input
                id="password-email"
                name="email"
                type="email"
                autocomplete="email"
                required
                [readOnly]="lockedEmail()"
                [ngModel]="emailDraft()"
                (ngModelChange)="emailDraft.set($event)"
                class="w-full rounded-xl border border-border bg-background p-3 text-sm text-foreground"
              />
            } @else {
              <p role="status" class="text-xs text-muted-foreground">
                If eligible, check {{ challengeEmail() }} for a password code.
              </p>
              <label for="password-code" class="block text-xs text-muted-foreground"
                >Email code</label
              >
              <input
                id="password-code"
                name="code"
                inputmode="numeric"
                autocomplete="one-time-code"
                pattern="[0-9]{6}"
                maxlength="6"
                required
                [ngModel]="code()"
                (ngModelChange)="code.set($event)"
                class="w-full rounded-xl border border-border bg-background p-3 text-sm text-foreground"
              />
              <label for="new-password" class="block text-xs text-muted-foreground"
                >New password</label
              >
              <input
                id="new-password"
                name="password"
                type="password"
                autocomplete="new-password"
                minlength="6"
                maxlength="72"
                required
                [ngModel]="password()"
                (ngModelChange)="password.set($event)"
                class="w-full rounded-xl border border-border bg-background p-3 text-sm text-foreground"
              />
              <label for="confirm-password" class="block text-xs text-muted-foreground"
                >Confirm password</label
              >
              <input
                id="confirm-password"
                name="confirmation"
                type="password"
                autocomplete="new-password"
                required
                [ngModel]="confirmation()"
                (ngModelChange)="confirmation.set($event)"
                class="w-full rounded-xl border border-border bg-background p-3 text-sm text-foreground"
              />
              <p class="text-xs text-muted-foreground">Saving signs out active sessions.</p>
            }
            <button
              type="submit"
              class="rounded-xl bg-primary px-4 py-3 text-sm text-primary-foreground"
            >
              {{
                busy() ? 'Please wait…' : submitted() ? 'Save password' : 'Email a password code'
              }}
            </button>
            @if (submitted()) {
              <button
                type="button"
                (click)="submitted.set(false); code.set(''); error.set('')"
                class="ml-3 text-xs text-primary underline"
              >
                Request a new code
              </button>
            }
          </fieldset>
        </form>
      }
      @if (error()) {
        <p role="alert" class="text-xs text-destructive">{{ error() }}</p>
      }
    </section>
  `,
})
export class PasswordSetupComponent {
  readonly auth = inject(AuthService);
  readonly email = input('');
  readonly lockedEmail = input(false);
  readonly saved = output<void>();
  readonly complete = output<void>();
  readonly emailDraft = signal('');
  readonly challengeEmail = signal('');
  readonly code = signal('');
  readonly password = signal('');
  readonly confirmation = signal('');
  readonly submitted = signal(false);
  readonly done = signal(false);
  readonly busy = signal(false);
  readonly error = signal('');
  private destroyed = false;
  private binding = '';

  constructor() {
    inject(DestroyRef).onDestroy(() => {
      this.destroyed = true;
    });
    effect(() => {
      const seed = this.email();
      const key = `${seed}:${this.auth.currentUser()?.id}:${this.auth.getToken()}`;
      untracked(() => {
        if (key === this.binding) return;
        this.binding = key;
        this.emailDraft.set(seed.includes('@') && !seed.startsWith('@') ? seed : '');
        this.code.set('');
        this.password.set('');
        this.confirmation.set('');
        this.error.set('');
        this.submitted.set(false);
        this.done.set(false);
        this.busy.set(false);
      });
    });
  }

  private isCurrent(key: string) {
    return (
      !this.destroyed &&
      this.binding === key &&
      key === `${this.email()}:${this.auth.currentUser()?.id}:${this.auth.getToken()}`
    );
  }

  async request() {
    if (this.busy()) return;
    const email = this.emailDraft().trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      this.error.set('Enter your account email.');
      return;
    }
    const key = this.binding;
    this.busy.set(true);
    this.error.set('');
    try {
      const response = await this.auth.requestPassword(email);
      if (!this.isCurrent(key)) return;
      if (!response.accepted) throw new Error('Could not request a password code. Retry.');
      this.challengeEmail.set(email);
      this.submitted.set(true);
    } catch (error) {
      if (this.isCurrent(key))
        this.error.set(error instanceof Error ? error.message : 'Could not request a code. Retry.');
    } finally {
      if (this.isCurrent(key)) this.busy.set(false);
    }
  }

  async confirm() {
    if (this.busy()) return;
    if (
      !/^\d{6}$/.test(this.code()) ||
      this.password().length < 6 ||
      this.password() !== this.confirmation()
    ) {
      this.error.set('Enter the six-digit code and matching passwords of at least 6 characters.');
      return;
    }
    const key = this.binding;
    this.busy.set(true);
    this.error.set('');
    try {
      const response = await this.auth.resetPassword(
        this.challengeEmail(),
        this.code(),
        this.password(),
      );
      if (!this.isCurrent(key)) return;
      if (!response.success) throw new Error('Could not confirm the password change.');
      this.done.set(true);
      this.code.set('');
      this.password.set('');
      this.confirmation.set('');
      this.saved.emit();
    } catch (error) {
      if (this.isCurrent(key))
        this.error.set(error instanceof Error ? error.message : 'Could not save password. Retry.');
    } finally {
      if (this.isCurrent(key)) this.busy.set(false);
    }
  }
}
