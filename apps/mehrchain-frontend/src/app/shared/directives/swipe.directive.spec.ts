import { SwipeDirective } from './swipe.directive';

describe('SwipeDirective gesture isolation', () => {
  let directive: SwipeDirective;
  let next: ReturnType<typeof vi.fn>;
  const event = (
    touches: number[][],
    changed: number[][] = [],
    target: HTMLElement = document.createElement('div'),
  ) =>
    ({
      target,
      touches: touches.map(([clientX, clientY]) => ({ clientX, clientY })),
      changedTouches: changed.map(([clientX, clientY]) => ({ clientX, clientY })),
    }) as unknown as TouchEvent;
  beforeEach(() => {
    directive = new SwipeDirective();
    next = vi.fn();
    directive.swipeLeft.subscribe(next);
  });
  it('allows a one-finger swipe including coordinate zero', () => {
    directive.onTouchStart(event([[100, 0]]));
    directive.onTouchEnd(event([], [[0, 0]]));
    expect(next).toHaveBeenCalledOnce();
  });
  it('cannot turn a pinch into navigation when a finger is lifted', () => {
    directive.onTouchStart(event([[100, 10]]));
    directive.onTouchStart(
      event([
        [100, 10],
        [200, 10],
      ]),
    );
    directive.onTouchEnd(event([[200, 10]], [[0, 10]]));
    directive.onTouchEnd(event([], [[0, 10]]));
    expect(next).not.toHaveBeenCalled();
  });
  it('cancels multi-touch movement and interrupted gestures', () => {
    directive.onTouchStart(event([[100, 10]]));
    directive.onTouchMove(
      event([
        [50, 10],
        [200, 10],
      ]),
    );
    directive.onTouchEnd(event([], [[0, 10]]));
    directive.onTouchStart(event([[100, 10]]));
    directive.onTouchCancel();
    directive.onTouchEnd(event([], [[0, 10]]));
    expect(next).not.toHaveBeenCalled();
  });
  it('does not navigate from form controls or mostly vertical movement', () => {
    directive.onTouchStart(event([[100, 10]], [], document.createElement('select')));
    directive.onTouchEnd(event([], [[0, 10]]));
    directive.onTouchStart(event([[100, 10]]));
    directive.onTouchEnd(event([], [[50, 80]]));
    expect(next).not.toHaveBeenCalled();
  });
});
