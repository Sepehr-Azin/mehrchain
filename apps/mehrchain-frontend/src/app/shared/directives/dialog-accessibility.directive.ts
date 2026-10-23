import { DOCUMENT } from '@angular/common';
import {
  afterNextRender,
  ApplicationRef,
  createComponent,
  DestroyRef,
  Directive,
  ElementRef,
  EnvironmentInjector,
  inject,
  output,
} from '@angular/core';
import { TextSizeComponent } from '../components/text-size/text-size';

/** Keep keyboard focus in an open dialog and return it to its trigger on close. */
@Directive({
  selector: '[appDialog]',
  host: {
    role: 'dialog',
    'aria-modal': 'true',
    tabindex: '-1',
    '(keydown)': 'handleKeydown($event)',
  },
})
export class DialogAccessibilityDirective {
  private readonly element = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  private readonly document = inject(DOCUMENT);
  readonly dialogDismiss = output<void>();

  constructor() {
    // Keep text resizing reachable inside the modal's focus boundary.
    const host = this.document.createElement('app-text-size');
    this.element.prepend(host);
    const control = createComponent(TextSizeComponent, {
      hostElement: host,
      environmentInjector: inject(EnvironmentInjector),
    });
    const app = inject(ApplicationRef);
    app.attachView(control.hostView);
    control.changeDetectorRef.detectChanges();
    const previousFocus = this.document.activeElement as HTMLElement | null;
    afterNextRender(() => this.element.focus({ preventScroll: true }));
    inject(DestroyRef).onDestroy(() => {
      app.detachView(control.hostView);
      control.destroy();
      host.remove();
      if (previousFocus?.isConnected) previousFocus.focus({ preventScroll: true });
    });
  }

  handleKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      event.preventDefault();
      event.stopPropagation();
      this.dialogDismiss.emit();
      return;
    }
    if (event.key !== 'Tab') return;

    const controls = Array.from(
      this.element.querySelectorAll<HTMLElement>(
        'a[href], button, input, select, textarea, [tabindex]',
      ),
    ).filter(
      (control) =>
        control.tabIndex >= 0 &&
        !control.matches(':disabled, [hidden], [inert]') &&
        control.getClientRects().length > 0,
    );
    const first = controls[0];
    const last = controls[controls.length - 1];
    const active = this.document.activeElement;
    if (!first) {
      event.preventDefault();
      this.element.focus();
    } else if (event.shiftKey && (active === first || active === this.element)) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && (active === last || active === this.element)) {
      event.preventDefault();
      first.focus();
    }
  }
}
