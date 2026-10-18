import { CommonModule } from '@angular/common';
import { Component, computed, input, output, signal } from '@angular/core';
import { LucideAngularModule } from 'lucide-angular';
import { Commitment } from '@mehrchain/shared-data';
import { McCardComponent } from '../../ui';

@Component({
  selector: 'app-commitment-card',
  imports: [CommonModule, LucideAngularModule, McCardComponent],
  templateUrl: './commitment-card.html',
  styleUrl: './commitment-card.css',
})
export class CommitmentCardComponent {
  commitment = input.required<Commitment>();
  supportersCount = input<number>(0);
  receivedHeartCount = input<number>(0);
  pending = input(false);
  stale = input(false);
  goalReached = computed(
    () =>
      this.commitment().totalDays !== -1 &&
      this.commitment().currentDay >= this.commitment().totalDays,
  );
  errorMessage = input<string | null>(null);
  onComplete = output<string>();
  onDelete = output<string>();
  onArchive = output<string>();
  onEdit = output<string>();
  onContinue = output<string>();

  isMenuOpen = signal(false);

  toggleMenu(e: Event) {
    e.stopPropagation();
    this.isMenuOpen.update((v) => !v);
  }

  closeMenu() {
    this.isMenuOpen.set(false);
  }

  handleSpark() {
    if (this.pending() || this.stale() || this.goalReached() || this.commitment().isCompletedToday)
      return;
    this.onComplete.emit(this.commitment().id);
  }
}
