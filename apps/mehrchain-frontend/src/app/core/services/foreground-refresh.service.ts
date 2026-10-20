import { DestroyRef, Injectable, inject } from '@angular/core';

/** One notification for a burst of browser resume events; never sends requests itself. */
@Injectable({ providedIn: 'root' })
export class ForegroundRefreshService {
  private readonly listeners = new Set<() => void>();
  private timer?: ReturnType<typeof setTimeout>;

  constructor() {
    const destroy = inject(DestroyRef);
    if (typeof window === 'undefined' || typeof document === 'undefined') return;
    const resume = () => {
      clearTimeout(this.timer);
      if (document.visibilityState !== 'visible' || navigator.onLine === false) return;
      this.timer = setTimeout(() => {
        if (document.visibilityState !== 'visible' || navigator.onLine === false) return;
        for (const listener of this.listeners) listener();
      }, 200);
    };
    const events = ['focus', 'pageshow', 'online', 'offline'] as const;
    for (const event of events) window.addEventListener(event, resume);
    document.addEventListener('visibilitychange', resume);
    destroy.onDestroy(() => {
      clearTimeout(this.timer);
      this.listeners.clear();
      for (const event of events) window.removeEventListener(event, resume);
      document.removeEventListener('visibilitychange', resume);
    });
  }

  onResume(listener: () => void, destroy: DestroyRef): void {
    this.listeners.add(listener);
    destroy.onDestroy(() => this.listeners.delete(listener));
  }
}
