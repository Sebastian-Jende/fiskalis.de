import type { APIRoute } from 'astro';

// Generated at build time so it can react to PUBLIC_PREVIEW_MODE — the same flag that
// forces noindex site-wide in BaseLayout.astro, see .env.example. While pitching from the
// unlisted pages.dev preview, this disallows crawling entirely (defense in depth alongside
// the per-page noindex tags) and drops the sitemap reference.
export const GET: APIRoute = () => {
  const previewMode = import.meta.env.PUBLIC_PREVIEW_MODE === 'true';

  const body = previewMode
    ? 'User-agent: *\nDisallow: /\n'
    : 'User-agent: *\nAllow: /\n\nSitemap: https://fiskalis.de/sitemap-index.xml\n';

  return new Response(body, {
    headers: { 'Content-Type': 'text/plain' },
  });
};
