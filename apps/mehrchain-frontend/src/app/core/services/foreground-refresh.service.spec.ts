import { DestroyRef } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ForegroundRefreshService } from './foreground-refresh.service';

describe('Foreground refresh', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.spyOn(document, 'visibilityState', 'get').mockReturnValue('visible');
    vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(true);
    TestBed.configureTestingModule({});
  });
  afterEach(() => {
    TestBed.resetTestingModule();
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it('coalesces focus, visibility and reconnect and cancels a hidden burst', () => {
    const listener = vi.fn();
    TestBed.inject(ForegroundRefreshService).onResume(listener, TestBed.inject(DestroyRef));
    window.dispatchEvent(new Event('focus'));
    document.dispatchEvent(new Event('visibilitychange'));
    window.dispatchEvent(new Event('online'));
    vi.advanceTimersByTime(200);
    expect(listener).toHaveBeenCalledTimes(1);
    window.dispatchEvent(new Event('focus'));
    vi.spyOn(document, 'visibilityState', 'get').mockReturnValue('hidden');
    document.dispatchEvent(new Event('visibilitychange'));
    vi.advanceTimersByTime(200);
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it('waits for online and removes destroyed subscribers', () => {
    const listener = vi.fn();
    let cleanup = () => {};
    const owner = {
      onDestroy: (callback: () => void) => {
        cleanup = callback;
        return () => {};
      },
    } as DestroyRef;
    TestBed.inject(ForegroundRefreshService).onResume(listener, owner);
    vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(false);
    window.dispatchEvent(new Event('focus'));
    vi.advanceTimersByTime(200);
    expect(listener).not.toHaveBeenCalled();
    vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(true);
    cleanup();
    window.dispatchEvent(new Event('online'));
    vi.advanceTimersByTime(200);
    expect(listener).not.toHaveBeenCalled();
  });
});
