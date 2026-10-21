/**
 * Where "View storefront" in the admin console should go.
 *
 * The console is served on admin.<domain> and treats every path on that host as admin (see App.jsx), so a plain
 * "/" link only reloads the console. On that host, send people to the public site on www.<domain>. Anywhere else
 * (localhost, a preview URL, or the console opened at /admin on the main site) "/" already leaves the console.
 */
export function storefrontUrl(loc = window.location) {
  const host = String(loc.hostname || '');
  if (!/^admin\./i.test(host)) return '/';
  const port = loc.port ? `:${loc.port}` : '';
  return `${loc.protocol}//www.${host.replace(/^admin\./i, '')}${port}/`;
}
