export interface MeroDeviceHints {
  cores?: number;
  memory?: number;
  saveData?: boolean;
}

export function meroPerformancePolicy(hints: MeroDeviceHints) {
  const lowPower =
    hints.saveData === true ||
    (hints.cores !== undefined && hints.cores <= 4) ||
    (hints.memory !== undefined && hints.memory <= 4);

  return {
    detail: lowPower ? ('low' as const) : ('standard' as const),
    pixelRatio: lowPower ? 1 : 1.5,
    maxPixels: lowPower ? 192 : 384,
    animate: !lowPower,
    frameInterval: 1000 / 24,
  };
}
