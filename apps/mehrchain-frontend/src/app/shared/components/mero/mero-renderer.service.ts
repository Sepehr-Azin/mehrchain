import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import { Injectable, InjectionToken, NgZone, OnDestroy, PLATFORM_ID, inject } from '@angular/core';
import type { MascotMood } from './mero-model';
import { meroPerformancePolicy } from './mero-performance';
import type { createMeroScene } from './mero-scene';

export const MERO_SCENE_LOADER = new InjectionToken<() => Promise<typeof import('./mero-scene')>>(
  'Mero scene loader',
  { providedIn: 'root', factory: () => () => import('./mero-scene') },
);

export interface MeroRenderOptions {
  mood: MascotMood;
  glow: number;
  size: number;
  glowColor?: string | null;
}

interface MeroTarget {
  context: CanvasRenderingContext2D;
  options: MeroRenderOptions;
  visible: boolean;
  dirty: boolean;
  ready: (value: boolean) => void;
}

@Injectable({ providedIn: 'root' })
export class MeroRendererService implements OnDestroy {
  private readonly document = inject(DOCUMENT);
  private readonly zone = inject(NgZone);
  private readonly browser = isPlatformBrowser(inject(PLATFORM_ID));
  private readonly loadScene = inject(MERO_SCENE_LOADER);
  private readonly targets = new Set<MeroTarget>();
  private scene?: ReturnType<typeof createMeroScene>;
  private loading = false;
  private unavailable = false;
  private destroyed = false;
  private frame?: number;
  private lastFrame = -Infinity;
  private slowFrames = 0;
  private animationDisabled = false;
  private readonly motion = this.browser
    ? this.document.defaultView?.matchMedia?.('(prefers-reduced-motion: reduce)')
    : undefined;
  private readonly policy = meroPerformancePolicy(
    this.browser
      ? (() => {
          const device = this.document.defaultView!.navigator as Navigator & {
            deviceMemory?: number;
            connection?: { saveData?: boolean };
          };
          return {
            cores: device.hardwareConcurrency,
            memory: device.deviceMemory,
            saveData: device.connection?.saveData,
          };
        })()
      : {},
  );

  constructor() {
    if (this.browser) {
      this.document.addEventListener('visibilitychange', this.onVisibilityChange);
      this.motion?.addEventListener('change', this.onMotionChange);
    }
  }

  attach(canvas: HTMLCanvasElement, options: MeroRenderOptions, ready: (v: boolean) => void) {
    // No browser-only APIs during SSR. The CSS character remains visible on failure.
    const context =
      this.browser && typeof WebGL2RenderingContext !== 'undefined'
        ? canvas.getContext('2d')
        : null;
    const target: MeroTarget | undefined = context
      ? { context, options, visible: false, dirty: true, ready }
      : undefined;
    if (target) this.targets.add(target);
    return {
      update: (next: MeroRenderOptions) => {
        if (!target) return;
        target.options = next;
        target.dirty = true;
        this.schedule();
      },
      setVisible: (visible: boolean) => {
        if (!target || target.visible === visible) return;
        target.visible = visible;
        target.dirty = true;
        if (visible) this.schedule();
        else if (![...this.targets].some((item) => item.visible)) this.cancelFrame();
      },
      destroy: () => {
        if (target) this.targets.delete(target);
        if (this.targets.size === 0) {
          this.cancelFrame();
          this.scene?.dispose();
          this.scene = undefined;
        }
      },
    };
  }

  private readonly onVisibilityChange = () => {
    if (this.document.hidden) this.cancelFrame();
    else {
      this.targets.forEach((target) => (target.dirty = true));
      this.schedule();
    }
  };

  private readonly onMotionChange = () => {
    this.targets.forEach((target) => (target.dirty = true));
    this.schedule();
  };

  private animated(target: MeroTarget) {
    return (
      this.policy.animate &&
      !this.animationDisabled &&
      !this.motion?.matches &&
      target.options.size >= 96 &&
      target.options.mood === 'happy'
    );
  }

  private schedule() {
    if (
      !this.browser ||
      this.destroyed ||
      this.unavailable ||
      this.document.hidden ||
      ![...this.targets].some((target) => target.visible)
    )
      return;
    if (!this.scene) {
      if (!this.loading) {
        this.loading = true;
        // Keep Three.js out of the initial application bundle and load only in view.
        void this.loadScene()
          .then(({ createMeroScene }) => {
            if (
              !this.destroyed &&
              [...this.targets].some((target) => target.visible) &&
              !this.document.hidden
            ) {
              this.scene = createMeroScene(this.policy.detail, () => this.fail());
            }
          })
          .catch(() => this.fail())
          .finally(() => {
            this.loading = false;
            this.schedule();
          });
      }
      return;
    }
    if (this.frame !== undefined) return;
    this.zone.runOutsideAngular(() => {
      this.frame = requestAnimationFrame(this.render);
    });
  }

  private readonly render = (time: number) => {
    this.frame = undefined;
    if (!this.scene || this.document.hidden) return;
    const moving = [...this.targets].some((target) => target.visible && this.animated(target));
    const dirty = [...this.targets].some((target) => target.visible && target.dirty);
    if (!dirty && time - this.lastFrame < this.policy.frameInterval) {
      if (moving) this.schedule();
      return;
    }
    const started = performance.now();
    try {
      for (const target of this.targets) {
        if (!target.visible || (!target.dirty && !this.animated(target))) continue;
        const pixels = Math.max(
          1,
          Math.min(
            this.policy.maxPixels,
            Math.round(
              target.options.size *
                Math.min(
                  this.document.defaultView?.devicePixelRatio || 1,
                  this.animationDisabled ? 1 : this.policy.pixelRatio,
                ),
            ),
          ),
        );
        this.scene.draw(
          target.context,
          pixels,
          target.options.mood,
          target.options.glow,
          time / 1000,
          this.animated(target),
          target.options.glowColor ?? null,
        );
        target.dirty = false;
        target.ready(true);
      }
    } catch {
      this.fail();
      return;
    }
    this.lastFrame = time;
    // Hints are imperfect. Sustained expensive frames also disable animation.
    this.slowFrames = performance.now() - started > 24 ? this.slowFrames + 1 : 0;
    if (this.slowFrames >= 5 && !this.animationDisabled) {
      this.animationDisabled = true;
      this.targets.forEach((target) => (target.dirty = true));
      this.schedule();
    } else if (moving) this.schedule();
  };

  private fail() {
    this.unavailable = true;
    this.cancelFrame();
    this.targets.forEach((target) => target.ready(false));
    this.scene?.dispose();
    this.scene = undefined;
  }

  private cancelFrame() {
    if (this.frame !== undefined) cancelAnimationFrame(this.frame);
    this.frame = undefined;
  }

  ngOnDestroy() {
    this.destroyed = true;
    this.cancelFrame();
    this.document.removeEventListener('visibilitychange', this.onVisibilityChange);
    this.motion?.removeEventListener('change', this.onMotionChange);
    this.scene?.dispose();
    this.targets.clear();
  }
}
