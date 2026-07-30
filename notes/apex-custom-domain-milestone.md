# Future Milestone: Apex Custom Domains

## Title

Phase 2: Apex custom-domain support

## Why it is deferred

- The launch-safe path for subdomains is materially simpler because it relies on a user-managed CNAME.
- Apex/root domains require a different product and DNS support story, including ALIAS/ANAME or provider-specific flattening behavior.
- We should not promise apex domains in product copy until routing, verification, and support procedures are implemented end to end.

## Exit criteria

- User-facing apex-domain onboarding copy and validation
- Verified DNS instructions for supported DNS providers
- Production-safe routing and certificate issuance for apex domains
- Explicit support and rollback runbook
- E2E coverage for apex launch and removal flows

## Current product rule

Until this milestone is completed, LifePage only supports subdomain custom domains such as `portfolio.example.com`.
