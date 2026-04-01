import assert from "node:assert/strict";
import test from "node:test";
import { getCloudflareSaasCapability } from "@/lib/cloudflare-saas";
import {
  isInternalAppHostname,
  normalizeCustomDomain,
  shouldRedirectToPrimaryAppHostname,
} from "@/lib/custom-domain";
import {
  buildManagedCustomDomainState,
} from "@/lib/custom-domain-state";

function withEnv(
  overrides: Record<string, string | undefined>,
  run: () => void
) {
  const previous = Object.fromEntries(
    Object.keys(overrides).map((key) => [key, process.env[key]])
  );

  try {
    for (const [key, value] of Object.entries(overrides)) {
      if (value === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = value;
      }
    }
    run();
  } finally {
    for (const [key, value] of Object.entries(previous)) {
      if (value === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = value;
      }
    }
  }
}

test("normalizeCustomDomain accepts subdomains and rejects apex domains", () => {
  assert.equal(
    normalizeCustomDomain("Portfolio.Example.com"),
    "portfolio.example.com"
  );

  assert.throws(
    () => normalizeCustomDomain("example.com"),
    /Use a subdomain like portfolio\.example\.com/
  );
});

test("Cloudflare capability reports missing requirements when config is incomplete", () => {
  withEnv(
    {
      CLOUDFLARE_API_TOKEN: undefined,
      CLOUDFLARE_SAAS_ZONE_ID: undefined,
      CLOUDFLARE_SAAS_CNAME_TARGET: "customers.example.com",
      CLOUDFLARE_SAAS_FALLBACK_ORIGIN: undefined,
      E2E_TEST_MODE: "0",
      E2E_FAKE_CLOUDFLARE: "0",
    },
    () => {
      const capability = getCloudflareSaasCapability();
      assert.equal(capability.configured, false);
      assert.equal(capability.cnameTarget, "customers.example.com");
      assert.deepEqual(
        capability.missing.sort(),
        [
          "CLOUDFLARE_API_TOKEN",
          "CLOUDFLARE_SAAS_FALLBACK_ORIGIN",
          "CLOUDFLARE_SAAS_ZONE_ID",
        ]
      );
    }
  );
});

test("managed custom-domain state separates provider-setup and DNS readiness", () => {
  withEnv(
    {
      CLOUDFLARE_SAAS_CNAME_TARGET: "customers.example.com",
    },
    () => {
      const paused = buildManagedCustomDomainState({
        hostname: "portfolio.example.com",
        dnsVerified: false,
        dnsChecked: false,
        cloudflareConfigured: false,
        customDomainError:
          "The hostname was saved locally, but provisioning is paused.",
      });
      const pausedDiagnostics = paused.customDomainDiagnostics as {
        verification: { value: string | null };
      };

      assert.equal(paused.customDomainStatus, "configuration_required");
      assert.equal(paused.customDomainDnsStatus, "configuration_required");
      assert.equal(pausedDiagnostics.verification.value, "customers.example.com");

      const waitingOnSsl = buildManagedCustomDomainState({
        hostname: "portfolio.example.com",
        providerHostname: {
          id: "cf-host-123",
          hostname: "portfolio.example.com",
          status: "active",
          ssl: {
            status: "pending_validation",
          },
        },
        dnsVerified: true,
        dnsChecked: true,
        cloudflareConfigured: true,
      });
      const waitingDiagnostics = waitingOnSsl.customDomainDiagnostics as {
        nextAction: string;
      };

      assert.equal(waitingOnSsl.customDomainStatus, "verified");
      assert.equal(waitingOnSsl.customDomainDnsStatus, "verified");
      assert.match(waitingDiagnostics.nextAction, /certificate/i);
    }
  );
});

test("legacy and alias hosts redirect to the primary app hostname", () => {
  withEnv(
    {
      AUTH_URL: "https://pages.atrak.dev",
      NEXTAUTH_URL: undefined,
      NEXT_PUBLIC_SITE_URL: undefined,
      NEXT_PUBLIC_APP_URL: undefined,
      APP_URL: undefined,
    },
    () => {
      assert.equal(shouldRedirectToPrimaryAppHostname("lifepage.one"), true);
      assert.equal(shouldRedirectToPrimaryAppHostname("www.lifepage.one"), true);
      assert.equal(shouldRedirectToPrimaryAppHostname("www.pages.atrak.dev"), true);
      assert.equal(shouldRedirectToPrimaryAppHostname("pages.atrak.dev"), false);
      assert.equal(isInternalAppHostname("lifepage.one"), true);
    }
  );
});
