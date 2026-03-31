# LifePage Production Cutover Checklist

Last updated: 2026-03-31

## Canonical host choice

- Canonical production host: `https://lifepage.one`
- Secondary host: `https://www.lifepage.one`
- Redirect policy: `www -> apex` using a permanent redirect

## Current blocker

The cutover cannot be fully executed from this session because:

1. `lifepage.one` is not onboarded to Cloudflare as an authoritative zone.
2. The current account token cannot create the zone:
   - Cloudflare API response: `Requires permission "com.cloudflare.api.account.zone.create" to create zones for the selected account`
3. Registrar nameservers still point to Porkbun:
   - `maceio.ns.porkbun.com`
   - `salvador.ns.porkbun.com`
   - `fortaleza.ns.porkbun.com`
   - `curitiba.ns.porkbun.com`
4. GitHub Pages still owns the active production custom domain:
   - repository Pages `cname`: `lifepage.one`
   - current `https://lifepage.one` response served by `GitHub.com`

## Cutover checklist

### Cloudflare account

- Create or gain access to the `lifepage.one` zone in the target Cloudflare account.
- Confirm the zone becomes `active` after registrar nameserver update.
- Attach the Worker custom domains:
  - `lifepage.one`
  - `www.lifepage.one`
- Confirm the deployed Worker remains `lifepage-web`.

### Registrar and DNS

- Update Porkbun nameservers to the Cloudflare-assigned nameservers for the new zone.
- In Cloudflare DNS, point:
  - apex `lifepage.one` to the Worker custom domain
  - `www.lifepage.one` to the Worker custom domain
- Keep DNS proxied through Cloudflare.

### Application config

- Set Cloudflare Worker secret:
  - `AUTH_URL=https://lifepage.one`
- Update Stripe webhook destination to:
  - `https://lifepage.one/api/stripe/webhook`
- Confirm the app still uses `www -> apex` permanent redirects.

### GitHub Pages

- Remove the GitHub Pages custom domain setting for `lifepage.one`.
- Keep GitHub Pages published only at:
  - `https://charlie2233.github.io/My_portforlio/`
- Do not point any production DNS records at GitHub Pages.

### Validation

- `https://lifepage.one` returns the real Cloudflare-hosted app.
- `https://www.lifepage.one` redirects to `https://lifepage.one`.
- TLS certificate is valid on apex and `www`.
- Auth callbacks resolve on `https://lifepage.one`.
- Stripe webhook is configured to apex and receives requests successfully.
- Public portfolio links resolve to apex-hosted pages.
- `/robots.txt` and `/sitemap.xml` resolve on production.
- Metadata canonical URLs prefer apex.

## Rollback checklist

- Re-point DNS away from Cloudflare only if the Worker host is unusable.
- Restore the GitHub Pages custom domain setting for `lifepage.one` only if DNS is also restored to GitHub Pages.
- Set `AUTH_URL` back to the previous working hostname if production auth breaks during rollback.
- Restore the previous Stripe webhook hostname if webhook delivery fails and traffic is reverted.
- Re-verify:
  - homepage
  - login
  - dashboard redirect behavior
  - public portfolio pages
  - resume export

