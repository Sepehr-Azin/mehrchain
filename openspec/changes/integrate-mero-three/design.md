## Decisions

- Port the geometry from `codex/threejs-mascot` rather than bundling the standalone demo or its server. Preserve the measured silhouette and expressions while lowering tessellation for application sizes.
- One lazy-loaded WebGL scene renders into an offscreen canvas; each visible component receives an immediate canvas copy. Multiple small Mero avatars therefore share a single GPU context and model.
- Only happy avatars at least 96 CSS pixels wide animate, at no more than 24 frames per second. Smaller avatars render on changes only. Intersection and document visibility suspend work.
- Four or fewer CPU cores, four or fewer reported GB of RAM, or data-saving mode select lower detail, DPR 1, a 192-pixel render cap, and no animation. Other devices cap DPR at 1.5 and output at 384 pixels. Five consecutive rendering tasks over 24 ms disable animation. These are conservative heuristics, not a guarantee for every GPU.
- Reduced-motion preference stops hand motion. Hidden avatars retain their last canvas frame; GPU resources are released when the last component is destroyed.
- No Mero PNG is requested at runtime. A CSS-built character covers loading, unsupported WebGL2, context loss, and lazy-load failure. Existing source images remain in the repository.

## Risks / Trade-offs

- Three.js adds a deferred network payload and GPU initialization cost. Lazy loading keeps it outside the initial JavaScript bundle.
- Copying the shared rendering buffer adds a small cost, bounded by the pixel caps and static rendering policy.
- Real low-end hardware still requires physical device testing. Browser checks and unit tests verify safeguards, not battery life on all devices.
