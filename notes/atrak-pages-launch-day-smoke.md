# Atrak Pages Launch-Day Smoke Checklist

## Primary host

- Load `https://pages.atrak.dev`
- Confirm landing page branding says **Atrak Pages**
- Confirm metadata and OG preview use the Atrak Pages asset and copy

## Auth and onboarding

- Load `/login`
- Load `/register`
- Create or log into a test account
- Confirm redirect into `/dashboard`

## Core product flows

- Import one public URL in `/dashboard`
- Confirm crawl succeeds and screenshot evidence appears
- Generate a public profile
- Open the generated public page at `/u/<username>`
- Open the generated resume at `/u/<username>/resume`

## Billing

- Start a Stripe checkout session
- Confirm checkout boots correctly
- Confirm the Stripe webhook endpoint receives the expected events

## Custom domains

- Save a launch-safe subdomain custom domain
- Confirm the dashboard shows requested hostname, required CNAME target, verification status, and SSL status
- Confirm missing-provider or failed-verification states remain actionable and non-cryptic

## Legacy and fallback paths

- Confirm `https://lifepage.one` redirects to `https://pages.atrak.dev`
- Confirm `https://charlie2233.github.io/My_portforlio/` serves the static fallback page
- Confirm GitHub Pages is not serving the real app runtime

## Monitoring after cutover

- Check the active Vercel deployment logs
- Check the Stripe webhook delivery dashboard
- Check custom-domain operator logs for `[atrak-pages custom domain]`
- Check sign-up funnel, profile generation success rate, and profile share events
