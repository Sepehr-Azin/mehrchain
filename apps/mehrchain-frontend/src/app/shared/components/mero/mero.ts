import { CommonModule } from '@angular/common';
import { Component, computed, inject, input } from '@angular/core';
import { MeroCustomizationService } from '../../../core/services/mero-customization.service';

export type MeroSize = 'xs' | 'sm' | 'md' | 'lg' | 'hero';

@Component({
  selector: 'app-mero',
  imports: [CommonModule],
  templateUrl: './mero.html',
  styleUrl: './mero.css',
})
export class MeroComponent {
  private customizationService = inject(MeroCustomizationService, { optional: true });

  // Inputs
  size = input<MeroSize>('md');
  showGlow = input<boolean>(true);
  customGradient = input<string | null>(null);

  // Effective glow gradient
  effectiveGradient = computed<string>(() => {
    if (this.customGradient()) {
      return this.customGradient()!;
    }
    return (
      this.customizationService?.effectiveGlowGradient() ??
      'radial-gradient(circle, rgba(254, 240, 138, 0.8) 0%, rgba(245, 158, 11, 0.35) 45%, transparent 72%)'
    );
  });

  // Size mapping classes
  sizeClasses = computed(() => {
    switch (this.size()) {
      case 'xs':
        return 'w-10 h-10';
      case 'sm':
        return 'w-14 h-14';
      case 'md':
        return 'w-20 h-20';
      case 'lg':
        return 'w-32 h-32';
      case 'hero':
        return 'w-56 h-56 sm:w-64 sm:h-64';
      default:
        return 'w-20 h-20';
    }
  });
}
