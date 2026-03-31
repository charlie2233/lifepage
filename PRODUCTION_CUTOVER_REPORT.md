# LifePage Production Cutover Report

Last updated: 2026-03-31

## Current state

- Desired production domain: `https://lifepage.one`
- Desired secondary domain behavior: `https://www.lifepage.one` redirects to apex
- Current staging Worker: `https://lifepage-web.charliehan-lifepage.workers.dev`
- Current production host: GitHub Pages

## External audit

### DNS and hosting

- `dig +short NS lifepage.one` returns Porkbun nameservers, not Cloudflare.
- `dig +short lifepage.one` returns GitHub Pages IPs.
- `dig +short www.lifepage.one` returns `charlie2233.github.io`.
- `curl -I https://lifepage.one` returns `server: GitHub.com`.
- `curl -I https://www.lifepage.one` returns a GitHub Pages `301` to apex.

### GitHub Pages

- Repository Pages API currently reports:
  - `cname: lifepage.one`
  - `html_url: https://lifepage.one/`
  - source: `main` branch `/docs`

### Cloudflare

- Worker account auth is valid.
- No `lifepage.one` zone exists in the active Cloudflare account.
- No Worker custom domains are attached to `lifepage-web`.
- Attempting to create the zone fails because the current token lacks:
  - `com.cloudflare.api.account.zone.create`

## Repo and app readiness

The application is now cutover-ready in code:

- `www -> apex` permanent redirect behavior is implemented.
- canonical metadata is explicit
- `robots.txt` is present
- `sitemap.xml` is present
- canonical output follows `AUTH_URL`

## Validation

### Live staging Worker

- `https://lifepage-web.charliehan-lifepage.workers.dev/robots.txt` works
- `https://lifepage-web.charliehan-lifepage.workers.dev/sitemap.xml` works
- homepage canonical output on staging points to the staging Worker host

### Local production-host simulation

Validated with local Worker preview and `AUTH_URL=https://lifepage.one`:

- `HEAD /` with `Host: www.lifepage.one` returns:
  - `308 Permanent Redirect`
  - `Location: https://lifepage.one/`
- homepage canonical tag becomes:
  - `https://lifepage.one`
- homepage `og:url` becomes:
  - `https://lifepage.one`
- `robots.txt` advertises:
  - `Host: https://lifepage.one`
  - `Sitemap: https://lifepage.one/sitemap.xml`

## Why the real cutover is still blocked

The remaining work is external infrastructure, not repo code:

1. create or gain access to the `lifepage.one` Cloudflare zone
2. move registrar nameservers from Porkbun to Cloudflare
3. attach `lifepage.one` and `www.lifepage.one` to the Worker
4. remove the GitHub Pages custom-domain binding only after the Cloudflare path is live
5. update production `AUTH_URL` and Stripe webhook hostname to apex

See [CUTOVER_CHECKLIST.md](CUTOVER_CHECKLIST.md) for the exact forward and rollback steps.

