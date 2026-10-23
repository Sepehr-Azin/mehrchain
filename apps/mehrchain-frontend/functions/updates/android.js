import { REPOSITORY, assetUrl, stableRelease, validateRelease } from '../../release-policy.mjs';

// No incoming cookies or authorization headers are forwarded to GitHub.
async function readJson(url, signal, limit = 262144) {
  const response = await fetch(url, {
    headers: { Accept: 'application/vnd.github+json', 'User-Agent': 'MehrChain-Updater' },
    signal,
  });
  if (!response.ok) throw new Error('Release metadata unavailable');
  const reader = response.body.getReader();
  const chunks = [];
  let length = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      length += value.byteLength;
      if (length > limit) throw new Error('Release metadata too large');
      chunks.push(value);
    }
  } finally {
    await reader.cancel();
  }
  const bytes = new Uint8Array(length);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.length;
  }
  return JSON.parse(new TextDecoder().decode(bytes));
}

const headers = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'X-Content-Type-Options': 'nosniff',
};

export async function onRequestGet({ request, env, waitUntil }) {
  // Cache per certificate as well as deployment host; query strings cannot bust it.
  const certificate = (env.ANDROID_SIGNING_CERT_SHA256 || '').toLowerCase().replace(/:/g, '');
  if (!/^[a-f0-9]{64}$/.test(certificate)) {
    return new Response(JSON.stringify({ error: 'Update signing identity is not configured' }), {
      status: 503,
      headers: { ...headers, 'Cache-Control': 'no-store' },
    });
  }
  const cacheKey = new Request(
    `${new URL(request.url).origin}/updates/android?identity=${certificate}`,
  );
  const cache = caches.default;
  const cached = await cache.match(cacheKey);
  if (cached) return cached;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);
  try {
    const releases = await readJson(
      `https://api.github.com/repos/${REPOSITORY}/releases?per_page=10`,
      controller.signal,
    );
    if (!Array.isArray(releases)) throw new Error('Invalid releases');
    const candidates = releases.filter(stableRelease).sort((a, b) => {
      const av = a.tag_name.replace(/^v/, '').split('.').map(Number);
      const bv = b.tag_name.replace(/^v/, '').split('.').map(Number);
      return bv[0] - av[0] || bv[1] - av[1] || bv[2] - av[2];
    });
    let release = null;
    for (const candidate of candidates.slice(0, 3)) {
      const manifestAsset = candidate.assets?.find((a) => a.name === 'release-manifest.json');
      if (
        !manifestAsset ||
        manifestAsset.state !== 'uploaded' ||
        manifestAsset.size > 8192 ||
        manifestAsset.browser_download_url !== assetUrl(candidate.tag_name, 'release-manifest.json')
      )
        continue;
      const manifest = await readJson(manifestAsset.browser_download_url, controller.signal, 8192);
      release = validateRelease(candidate, manifest, certificate);
      if (release) break;
    }
    const response = new Response(JSON.stringify({ release }), {
      headers: { ...headers, 'Cache-Control': 'public, max-age=900' },
    });
    waitUntil(cache.put(cacheKey, response.clone()));
    return response;
  } catch {
    const response = new Response(
      JSON.stringify({ error: 'Could not check updates. Try again later.' }),
      { status: 503, headers: { ...headers, 'Cache-Control': 'public, max-age=60' } },
    );
    waitUntil(cache.put(cacheKey, response.clone()));
    return response;
  } finally {
    clearTimeout(timeout);
  }
}
