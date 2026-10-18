import { Injectable, computed, signal } from '@angular/core';

export type MeroState =
  | 'idle'
  | 'content'
  | 'happy'
  | 'waiting'
  | 'celebrating'
  | 'sleepy'
  | 'missing';

@Injectable({
  providedIn: 'root',
})
export class MeroService {
  readonly state = signal<MeroState>('idle');
  readonly mood = computed(() => {
    const state = this.state();
    if (state === 'missing') return 'sad';
    if (state === 'happy' || state === 'celebrating' || state === 'content') return 'happy';
    return 'reference';
  });

  setState(newState: MeroState) {
    this.state.set(newState);
  }
}
