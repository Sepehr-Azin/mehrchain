import { TestBed } from '@angular/core/testing';
import { MERO_SCENE_LOADER, MeroRendererService, MeroRenderOptions } from './mero-renderer.service';
import type { createMeroScene } from './mero-scene';

describe('Mero shared rendering lifecycle', () => {
  let service: MeroRendererService;
  let frames: Map<number, FrameRequestCallback>;
  let nextFrame: number;
  let factory: ReturnType<typeof vi.fn<typeof createMeroScene>>;
  let scene: {
    draw: ReturnType<typeof vi.fn<ReturnType<typeof createMeroScene>['draw']>>;
    dispose: ReturnType<typeof vi.fn<() => void>>;
  };
  let visibility: ReturnType<typeof vi.spyOn>;
  let motion: EventTarget & { matches: boolean };
  const options: MeroRenderOptions = { mood: 'reference', glow: 1, size: 128 };

  beforeEach(() => {
    frames = new Map();
    nextFrame = 0;
    scene = { draw: vi.fn(), dispose: vi.fn() };
    factory = vi.fn<typeof createMeroScene>().mockReturnValue(scene);
    TestBed.configureTestingModule({
      providers: [
        {
          provide: MERO_SCENE_LOADER,
          useValue: () => Promise.resolve({ createMeroScene: factory }),
        },
      ],
    });
    vi.spyOn(navigator, 'hardwareConcurrency', 'get').mockReturnValue(8);
    visibility = vi.spyOn(document, 'hidden', 'get').mockReturnValue(false);
    motion = Object.assign(new EventTarget(), { matches: false });
    vi.stubGlobal('matchMedia', () => motion);
    vi.stubGlobal('WebGL2RenderingContext', class {});
    vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => {
      frames.set(++nextFrame, callback);
      return nextFrame;
    });
    vi.stubGlobal('cancelAnimationFrame', (id: number) => frames.delete(id));
    service = TestBed.inject(MeroRendererService);
  });

  afterEach(() => {
    service.ngOnDestroy();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });

  function attach(next = options) {
    const canvas = document.createElement('canvas');
    vi.spyOn(canvas, 'getContext').mockReturnValue({ canvas } as CanvasRenderingContext2D);
    const ready = vi.fn();
    return { handle: service.attach(canvas, next, ready), ready };
  }

  async function visible(handle: ReturnType<typeof service.attach>) {
    handle.setVisible(true);
    await vi.waitFor(() => expect(frames.size).toBe(1));
  }

  function frame(time = 100) {
    const pending = [...frames.values()];
    frames.clear();
    pending.forEach((callback) => callback(time));
  }

  it('does not initialize until visible; shares one renderer and renders static avatars on demand', async () => {
    const first = attach();
    const second = attach();
    expect(factory).not.toHaveBeenCalled();
    await visible(first.handle);
    second.handle.setVisible(true);
    frame();
    expect(factory).toHaveBeenCalledTimes(1);
    expect(scene.draw).toHaveBeenCalledTimes(2);
    expect(frames.size).toBe(0);
    first.handle.update({ ...options, mood: 'sad' });
    frame(200);
    expect(scene.draw).toHaveBeenCalledTimes(3);
    first.handle.destroy();
    expect(scene.dispose).not.toHaveBeenCalled();
    second.handle.destroy();
    expect(scene.dispose).toHaveBeenCalledOnce();
    expect(frames.size).toBe(0);
  });

  it('stops hidden views and tabs and redraws on return', async () => {
    const { handle } = attach({ ...options, mood: 'happy' });
    await visible(handle);
    frame();
    expect(frames.size).toBe(1);
    handle.setVisible(false);
    expect(frames.size).toBe(0);
    await visible(handle);
    visibility.mockReturnValue(true);
    document.dispatchEvent(new Event('visibilitychange'));
    expect(frames.size).toBe(0);
    visibility.mockReturnValue(false);
    document.dispatchEvent(new Event('visibilitychange'));
    frame(200);
    expect(scene.draw).toHaveBeenCalledTimes(2);
  });

  it('does not animate small happy avatars or reduced-motion views', async () => {
    const { handle } = attach({ ...options, mood: 'happy', size: 40 });
    await visible(handle);
    frame();
    expect(scene.draw.mock.calls[0][5]).toBe(false);
    expect(frames.size).toBe(0);
    motion.matches = true;
    motion.dispatchEvent(new Event('change'));
    handle.update({ ...options, mood: 'happy' });
    frame(200);
    expect(scene.draw.mock.calls[1][5]).toBe(false);
    expect(frames.size).toBe(0);
  });

  it('caps animation rate and disables it after sustained expensive rendering', async () => {
    const { handle } = attach({ ...options, mood: 'happy' });
    await visible(handle);
    frame(100);
    frame(110);
    expect(scene.draw).toHaveBeenCalledTimes(1);
    let elapsed = 0;
    vi.spyOn(performance, 'now').mockImplementation(() => (elapsed += 30));
    for (let i = 0; i < 5; i++) frame(200 + i * 50);
    frame(500);
    expect(scene.draw.mock.lastCall?.[5]).toBe(false);
    expect(frames.size).toBe(0);
  });

  it('returns to the CSS fallback on context loss and releases resources', async () => {
    const { handle, ready } = attach();
    await visible(handle);
    frame();
    expect(ready).toHaveBeenLastCalledWith(true);
    factory.mock.calls[0][1]();
    expect(ready).toHaveBeenLastCalledWith(false);
    expect(scene.dispose).toHaveBeenCalledOnce();
    handle.update(options);
    expect(frames.size).toBe(0);
  });

  it('retains the CSS character when WebGL2 is unavailable', () => {
    vi.stubGlobal('WebGL2RenderingContext', undefined);
    const { handle } = attach();
    handle.setVisible(true);
    expect(frames.size).toBe(0);
    expect(factory).not.toHaveBeenCalled();
  });

  it('uses low geometry, bounded resolution, and no animation on constrained devices', async () => {
    service.ngOnDestroy();
    vi.spyOn(navigator, 'hardwareConcurrency', 'get').mockReturnValue(4);
    service = TestBed.runInInjectionContext(() => new MeroRendererService());
    const { handle } = attach({ ...options, mood: 'happy', size: 512 });
    await visible(handle);
    frame();
    expect(factory).toHaveBeenCalledWith('low', expect.any(Function));
    expect(scene.draw.mock.lastCall?.[1]).toBe(256);
    expect(scene.draw.mock.lastCall?.[5]).toBe(false);
    expect(frames.size).toBe(0);
  });
});
