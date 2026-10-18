# Change: Integrate the Three.js Mero into the application

## Why

The approved Three.js mascot currently exists only in a standalone preview. The user requested its integration into onboarding, profile, and every existing Mero appearance, with protection for less powerful devices.

## What Changes

- Replace the shared raster mascot with the existing measured geometry, ported to TypeScript.
- Bind onboarding and profile expressions to existing application state.
- Lazy load a shared renderer, render small/static avatars on demand, and suspend hidden views.
- Reduce geometry, resolution, and motion on constrained devices; use a CSS character if WebGL cannot run.

## Impact

- Affected specs: mero-rendering (new).
- Affected code: frontend shared Mero, onboarding, profile, Mero state service, and required Three.js dependencies.
- Backend APIs and persisted data are unchanged.

## Authorization

The user explicitly requested implementation of this integration and its device performance safeguards in this task.
