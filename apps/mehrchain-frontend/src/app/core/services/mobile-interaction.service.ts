import { DOCUMENT } from '@angular/common';
import { DestroyRef, Injectable, inject, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class MobileInteractionService {
  private document = inject(DOCUMENT);
  readonly textSize = signal(100);

  constructor() {
    try {
      this.setTextSize(Number(localStorage.getItem('mehrchain_text_size')) || 100);
    } catch {}
    const view = this.document.defaultView;
    if (!view?.matchMedia) return;
    const mobile = view.matchMedia('(hover: none) and (pointer: coarse)');
    const viewport = this.document.querySelector('meta[name="viewport"]');
    const original = viewport?.getAttribute('content') || '';
    const apply = () =>
      viewport?.setAttribute(
        'content',
        original + (mobile.matches ? ', maximum-scale=1, user-scalable=no' : ''),
      );
    apply();
    mobile.addEventListener('change', apply);
    // Safari gesture events are restricted to mobile app surfaces; ordinary
    // single-finger touches, selection, keyboard events and desktop zoom pass.
    const gesture = (event: Event) => {
      if (
        mobile.matches &&
        event.target instanceof Element &&
        event.target.closest('app-root') &&
        event.cancelable
      )
        event.preventDefault();
    };
    this.document.addEventListener('gesturestart', gesture, { passive: false });
    this.document.addEventListener('gesturechange', gesture, { passive: false });
    inject(DestroyRef).onDestroy(() => {
      mobile.removeEventListener('change', apply);
      viewport?.setAttribute('content', original);
      this.document.removeEventListener('gesturestart', gesture);
      this.document.removeEventListener('gesturechange', gesture);
    });
  }

  setTextSize(size: number): void {
    if (![100, 125, 150, 175, 200].includes(size)) return;
    this.textSize.set(size);
    this.document.documentElement.style.fontSize = `${size}%`;
    try {
      localStorage.setItem('mehrchain_text_size', String(size));
    } catch {}
  }
}
