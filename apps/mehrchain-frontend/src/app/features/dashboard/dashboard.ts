import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';
import { CommitmentService } from '../../core/services/commitment.service';
import { ChainService } from '../../core/services/chain.service';
import { NotificationService } from '../../core/services/notification.service';
import { Commitment } from '@mehrchain/shared-data';
import { CommitmentCardComponent } from '../../shared/components/commitment-card/commitment-card';
import { DeleteConfirmationModal } from '../../shared/components/delete-confirmation-modal/delete-confirmation-modal';
import { EditCommitmentModal } from '../../shared/components/edit-commitment-modal/edit-commitment-modal';
import { NewCommitmentModal } from '../../shared/components/new-commitment-modal/new-commitment-modal';
import { MeroComponent } from '../../shared/components/mero/mero';
import { HabitCardSkeletonComponent } from '../../shared/components/skeletons';
import { MeroCustomizationService } from '../../core/services/mero-customization.service';

@Component({
  selector: 'app-dashboard',
  imports: [
    CommonModule,
    CommitmentCardComponent,
    LucideAngularModule,
    NewCommitmentModal,
    DeleteConfirmationModal,
    EditCommitmentModal,
    MeroComponent,
    HabitCardSkeletonComponent,
  ],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
})
export class DashboardComponent {
  commitmentService = inject(CommitmentService);
  customization = inject(MeroCustomizationService);
  chainService = inject(ChainService);
  notificationService = inject(NotificationService);
  router = inject(Router);
  saving = signal(false);
  saveError = signal<string | null>(null);
  isModalOpen = signal(false);
  deletingCommitment = signal<Commitment | null>(null);
  removing = signal(false);
  removalError = signal<string | null>(null);
  editingCommitment = signal<Commitment | null>(null);
  toastMessage = signal<string | null>(null);
  completingIds = signal<ReadonlySet<string>>(new Set());
  completionErrors = signal<Record<string, string>>({});

  openNewCommitment() {
    this.saveError.set(null);
    this.isModalOpen.set(true);
  }

  async handleNewCommitment(data: any) {
    if (this.saving()) return;
    this.saving.set(true);
    this.saveError.set(null);
    try {
      const newCommitment = await this.commitmentService.addCommitment(data);
      this.isModalOpen.set(false);

      // Schedule notification if reminder time exists
      if (data.reminderTime) {
        const [hourStr, minuteStr] = data.reminderTime.split(':');
        const hour = parseInt(hourStr, 10) || 8;
        const minute = parseInt(minuteStr, 10) || 30;

        await this.notificationService
          .scheduleDailyHabitReminder({
            id: Math.floor(Math.random() * 100000) + 1,
            title: 'MehrChain Reminder ✨',
            body: `Time to light your lamp: ${data.title}`,
            hour,
            minute,
            commitmentId: newCommitment.id,
          })
          .catch(() => this.showToast('Habit saved. Reminder could not be scheduled.'));
      }
    } catch (error) {
      this.saveError.set(
        error instanceof Error ? error.message : 'Could not save habit. Try again.',
      );
    } finally {
      this.saving.set(false);
    }
  }

  async handleComplete(id: string) {
    if (this.completingIds().has(id)) return;
    this.completingIds.update((ids) => new Set([...ids, id]));
    this.completionErrors.update((errors) => {
      const next = { ...errors };
      delete next[id];
      return next;
    });
    try {
      await this.commitmentService.completeCommitment(id);
    } catch (error) {
      this.completionErrors.update((errors) => ({
        ...errors,
        [id]: error instanceof Error ? error.message : 'Could not save completion. Try again.',
      }));
    } finally {
      this.completingIds.update((ids) => {
        const next = new Set(ids);
        next.delete(id);
        return next;
      });
    }
  }

  private showToast(msg: string) {
    this.toastMessage.set(msg);
    setTimeout(() => {
      this.toastMessage.set(null);
    }, 3200);
  }

  promptDelete(id: string) {
    if (this.commitmentService.isStale() || this.completingIds().has(id)) return;
    const found = this.commitmentService.commitments().find((c) => c.id === id);
    if (found) {
      this.removalError.set(null);
      this.deletingCommitment.set(found);
    }
  }

  cancelDelete() {
    if (this.removing()) return;
    this.deletingCommitment.set(null);
  }

  async confirmDelete() {
    return this.removeSelected(true);
  }

  async archiveSelected() {
    return this.removeSelected(false);
  }

  private async removeSelected(permanent: boolean) {
    const target = this.deletingCommitment();
    if (target && !this.removing()) {
      this.removing.set(true);
      this.removalError.set(null);
      try {
        if (permanent) await this.commitmentService.permanentDeleteCommitment(target.id);
        else await this.commitmentService.removeCommitment(target.id);
        this.deletingCommitment.set(null);
      } catch (error) {
        this.removalError.set(
          error instanceof Error ? error.message : 'Could not remove habit. Retry.',
        );
      } finally {
        this.removing.set(false);
      }
    }
  }

  async handleArchive(id: string) {
    if (this.completingIds().has(id) || this.removing()) return;
    this.completingIds.update((ids) => new Set([...ids, id]));
    try {
      await this.commitmentService.removeCommitment(id);
    } catch (error) {
      this.showToast(error instanceof Error ? error.message : 'Could not archive habit.');
    } finally {
      this.completingIds.update((ids) => {
        const next = new Set(ids);
        next.delete(id);
        return next;
      });
    }
  }

  async handleContinue(id: string) {
    if (this.completingIds().has(id)) return;
    this.completingIds.update((ids) => new Set([...ids, id]));
    this.completionErrors.update((errors) => ({ ...errors, [id]: '' }));
    try {
      await this.commitmentService.updateCommitment(id, { totalDays: -1 });
    } catch (error) {
      this.completionErrors.update((errors) => ({
        ...errors,
        [id]: error instanceof Error ? error.message : 'Could not continue habit. Try again.',
      }));
    } finally {
      this.completingIds.update((ids) => {
        const next = new Set(ids);
        next.delete(id);
        return next;
      });
    }
  }

  openEdit(id: string) {
    const found = this.commitmentService.commitments().find((c) => c.id === id);
    if (found) {
      this.saveError.set(null);
      this.editingCommitment.set(found);
    }
  }

  closeEdit() {
    this.editingCommitment.set(null);
  }

  async handleUpdateCommitment(data: any) {
    if (this.saving()) return;
    this.saving.set(true);
    this.saveError.set(null);
    try {
      await this.commitmentService.updateCommitment(data.id, {
        title: data.title,
        why: data.why,
        totalDays: data.totalDays,
        category: data.category,
        reminderTime: data.reminderTime,
        isPublic: data.isPublic,
      });
      this.editingCommitment.set(null);
    } catch (error) {
      this.saveError.set(
        error instanceof Error ? error.message : 'Could not update habit. Try again.',
      );
    } finally {
      this.saving.set(false);
    }
  }
}
