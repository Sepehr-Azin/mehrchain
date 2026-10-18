import { meroPerformancePolicy } from './mero-performance';

describe('Mero device policy', () => {
  it('limits unknown devices without assuming a high pixel ratio', () => {
    const policy = meroPerformancePolicy({});
    expect(policy.pixelRatio).toBe(1.5);
    expect(policy.maxPixels).toBe(384);
    expect(policy.frameInterval).toBeGreaterThanOrEqual(1000 / 24);
  });

  it.each([{ cores: 4 }, { memory: 2 }, { saveData: true }])(
    'disables motion and lowers detail for %o',
    (hints) => {
      expect(meroPerformancePolicy(hints)).toMatchObject({
        detail: 'low',
        pixelRatio: 1,
        maxPixels: 256,
        animate: false,
      });
    },
  );
});
