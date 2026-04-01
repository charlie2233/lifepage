# Custom Domains Runbook

## Launch scope

- Atrak Pages launch support is limited to user-owned subdomains such as `portfolio.example.com`.
- Apex/root domains such as `example.com` are explicitly out of scope for this phase.
- Public routing only activates when both the Cloudflare custom hostname status and SSL status are `active`.

## User flow

1. User saves a requested hostname in the dashboard.
2. Atrak Pages provisions a Cloudflare custom hostname when the provider configuration is available.
3. The dashboard shows the exact CNAME record name and target the user must configure.
4. `Verify DNS` checks that the requested hostname points at the required target and refreshes Cloudflare validation.
5. The dashboard continues to show lifecycle, DNS, hostname, and SSL state until the domain is fully active.

## Graceful fallback when Cloudflare SaaS is incomplete

- Saving a hostname does not hard-fail when Cloudflare SaaS is incomplete.
- The requested hostname is stored locally with a `configuration_required` lifecycle state.
- Verification remains paused and the dashboard explains that provider setup still needs to be completed.
- Clearing a hostname also succeeds locally. If provider cleanup could not be performed, the dashboard warns that an operator may need to remove the provider-side hostname later.

## Troubleshooting copy the dashboard should surface

- Subdomain-only launch constraint for any apex/root input
- Exact required CNAME record name and target
- Observed DNS target when it does not match the required value
- Provider status and SSL status from Cloudflare
- Clear next action for these cases:
  - provider setup missing
  - DNS record missing or incorrect
  - DNS verified but SSL still pending
  - provider-side error returned by Cloudflare

## Operator observability

- `PublicPageSettings.customDomainDiagnostics` stores the latest launch-safe diagnostic snapshot for a user domain.
- `PublicPageSettings.customDomainDnsStatus` stores DNS state separately from the higher-level lifecycle status.
- Domain actions emit structured logs prefixed with `[atrak-pages custom domain]`.

Example SQL for operator inspection:

```sql
select
  "userId",
  "customDomainNormalized",
  "customDomainStatus",
  "customDomainDnsStatus",
  "customDomainProviderStatus",
  "customDomainSslStatus",
  "customDomainError",
  "customDomainLastCheckedAt",
  "customDomainDiagnostics"
from "PublicPageSettings"
where "customDomainNormalized" is not null
order by "updatedAt" desc;
```

## Test coverage

- Unit tests cover normalization, subdomain-only enforcement, Cloudflare capability detection, and lifecycle/diagnostic derivation.
- E2E coverage covers:
  - paused verification when provider configuration is missing
  - apex-domain rejection
  - wrong DNS target
  - pending SSL
  - fully active domain routing
