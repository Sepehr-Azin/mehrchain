import { Component, inject } from '@angular/core';
import { MobileInteractionService } from '../../../core/services/mobile-interaction.service';

@Component({
  selector: 'app-text-size',
  template: `
    <label class="text-size-control">
      <span>Text size</span>
      <select
        aria-label="Text size"
        [value]="interaction.textSize()"
        (change)="interaction.setTextSize(+$any($event.target).value)"
      >
        <option value="100">100%</option>
        <option value="125">125%</option>
        <option value="150">150%</option>
        <option value="175">175%</option>
        <option value="200">200%</option>
      </select>
    </label>
  `,
})
export class TextSizeComponent {
  readonly interaction = inject(MobileInteractionService);
}
