import * as THREE from 'three';
import { createMascot } from './mero-model';

describe('Mero procedural geometry', () => {
  it('recolors the actual luminous materials and restores the shipped default palette', () => {
    const mascot = createMascot({ detail: 'low' });
    const colors = () => {
      const values = new Set<string>();
      mascot.model.traverse((part) => {
        if (!(part instanceof THREE.Mesh)) return;
        const material = part.material;
        if (material instanceof THREE.MeshStandardMaterial && material.emissiveIntensity > 0) {
          values.add(material.emissive.getHexString());
        }
      });
      return values;
    };
    const defaults = colors();
    mascot.setGlowColor('#06b6d4');
    expect(colors()).toEqual(new Set(['06b6d4']));
    mascot.setGlowColor(null);
    expect(colors()).toEqual(defaults);
    mascot.dispose();
  });
  it('keeps low-detail geometry finite and substantially smaller', () => {
    const count = (detail: 'low' | 'standard') => {
      const mascot = createMascot({ detail });
      let triangles = 0;
      mascot.model.traverse((part) => {
        if (!(part instanceof THREE.Mesh)) return;
        triangles += part.geometry.index.count / 3;
        for (const value of part.geometry.attributes['position'].array) {
          expect(Number.isFinite(value)).toBe(true);
        }
      });
      mascot.dispose();
      return triangles;
    };
    const standard = count('standard');
    expect(standard).toBeLessThan(35000);
    expect(count('low')).toBeLessThan(standard / 2);
  });

  it('shows one expression and waves subtly only when happy and motion is allowed', () => {
    const mascot = createMascot();
    const left = mascot.model.getObjectByName('Left flipper')!;
    for (const mood of ['reference', 'happy', 'sad'] as const) {
      mascot.setMood(mood);
      mascot.update(Math.PI / 4.8, false, true);
      expect(
        mascot.model.children.filter((part) => part.name.endsWith('mouth') && part.visible),
      ).toHaveLength(1);
      expect(Math.abs(left.rotation.z)).toBeLessThanOrEqual(0.024);
      expect(left.rotation.z !== 0).toBe(mood === 'happy');
    }
    mascot.setMood('happy');
    mascot.update(1, false, false);
    expect(left.rotation.z).toBe(0);
    mascot.dispose();
  });
});
