import { DialogAccessibilityDirective } from '../../directives/dialog-accessibility.directive';
import { CommonModule } from '@angular/common';
import { Component, computed, input, output } from '@angular/core';
import { LucideAngularModule } from 'lucide-angular';
import { Commitment } from '@mehrchain/shared-data';
import { McButtonComponent } from '../../ui';
import { personalMotivation } from '../../../core/utils/personal-motivation';

@Component({
  selector: 'app-delete-confirmation-modal',
  imports: [DialogAccessibilityDirective, CommonModule, LucideAngularModule, McButtonComponent],
  templateUrl: './delete-confirmation-modal.html',
})
export class DeleteConfirmationModal {
  commitment = input.required<Commitment>();
  isSubmitting = input(false);
  allowArchive = input(true);
  errorMessage = input<string | null>(null);
  reason = computed(() => personalMotivation(this.commitment().why));

  confirm = output<void>();
  archive = output<void>();
  cancel = output<void>();
}
