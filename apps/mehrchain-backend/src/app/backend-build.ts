// Webpack embeds these values in the artifact; runtime environment changes cannot
// make an old bundle claim to contain a newer Render revision.
declare const __BACKEND_BUILD__: { revision: string; builtAt: string };

export const backendBuild =
  typeof __BACKEND_BUILD__ === 'undefined'
    ? { revision: 'development', builtAt: 'unbundled' }
    : __BACKEND_BUILD__;
