import { Component, computed, input, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule } from 'lucide-angular';
import { ChainConnection } from '@mehrchain/shared-data';

export type ChainCardVisualState = 'COMPLETED_TODAY' | 'WAITING' | 'RESTING' | 'JOURNEY_COMPLETED';

@Component({
  selector: 'app-chain-card',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  templateUrl: './chain-card.html',
  styleUrls: ['./chain-card.css'],
})
export class ChainCardComponent {
  readonly connection = input.required<ChainConnection>();
  readonly myHabitTitle = input<string>('My Habit');
  readonly pending = input(false);
  readonly stale = input(false);
  readonly errorMessage = input<string | null>(null);
  readonly heartSend = output<string>();
  readonly disconnect = output<string>();
  readonly isMenuOpen = signal(false);

  readonly partnerUsername = computed(() => this.connection().partner?.username || 'partner');
  readonly partnerDisplayName = computed(
    () => this.connection().partner?.name || this.partnerUsername(),
  );
  readonly partnerHabitTitle = computed(
    () => this.connection().partnerCommitment?.title || 'Daily habit',
  );
  readonly partnerAvatarInitial = computed(() => this.partnerDisplayName()[0].toUpperCase());
  readonly isHeartSent = computed(() => !this.stale() && this.connection().heartSent);
  readonly visualState = computed<ChainCardVisualState>(() => {
    const conn = this.connection();
    if (conn.status === 'COMPLETED') return 'JOURNEY_COMPLETED';
    if (conn.partnerCommitment?.isCompletedToday) return 'COMPLETED_TODAY';
    if (conn.status === 'RESTING' || conn.consecutiveMissedDays === 1) return 'RESTING';
    return 'WAITING';
  });
  readonly stateLabel = computed(() => {
    if (this.stale()) return 'Refresh required';
    switch (this.visualState()) {
      case 'COMPLETED_TODAY':
        return 'Completed today';
      case 'JOURNEY_COMPLETED':
        return 'Goal reached';
      case 'RESTING':
        return 'Resting today';
      default:
        return 'Not completed today';
    }
  });

  sendHeart(): void {
    if (this.pending() || this.stale() || this.isHeartSent()) return;
    this.heartSend.emit(this.connection().id);
  }

  toggleMenu(): void {
    this.isMenuOpen.update((open) => !open);
  }

  closeMenu(): void {
    this.isMenuOpen.set(false);
  }

  handleDisconnect(): void {
    if (this.pending()) return;
    this.closeMenu();
    this.disconnect.emit(this.connection().id);
  }
}
