import { CommonModule } from '@angular/common';
import { Component, input, output, signal } from '@angular/core';
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
  pending = input(false);
  errorMessage = input<string | null>(null);
  onComplete = output<string>();
  onDelete = output<string>();
  onArchive = output<string>();
  onEdit = output<string>();

  isMenuOpen = signal(false);

  toggleMenu(e: Event) {
    e.stopPropagation();
    this.isMenuOpen.update((v) => !v);
  }

  closeMenu() {
    this.isMenuOpen.set(false);
  }

  handleSpark() {
    if (this.pending() || this.commitment().isCompletedToday) return;
    this.onComplete.emit(this.commitment().id);
  }
}
