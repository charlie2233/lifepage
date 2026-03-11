import {
  buildCustomDomainVerificationRecord,
  getManagedCustomDomainTargetHost,
} from "@/lib/custom-domain-lifecycle";

interface DnsResponse {
  Status?: number;
  Answer?: Array<{
    data?: string;
  }>;
}

async function queryDns(name: string, type: "CNAME") {
  const response = await fetch(
    `https://cloudflare-dns.com/dns-query?name=${encodeURIComponent(name)}&type=${type}`,
    {
      headers: {
        Accept: "application/dns-json",
      },
      cache: "no-store",
    }
  );

  if (!response.ok) {
    throw new Error(`DNS lookup failed with status ${response.status}.`);
  }

  return (await response.json()) as DnsResponse;
}

function normalizeDnsValue(value: string) {
  return value.trim().toLowerCase().replace(/\.+$/, "");
}

async function resolveRecordValues(name: string, type: "CNAME") {
  const result = await queryDns(name, type);
  return (result.Answer ?? [])
    .map((answer) => answer.data?.trim())
    .filter((value): value is string => Boolean(value))
    .map(normalizeDnsValue);
}

export async function verifyCustomDomainDns(hostname: string) {
  const verification = buildCustomDomainVerificationRecord(hostname);
  const targetHost = verification.value ?? getManagedCustomDomainTargetHost();

  if (!targetHost) {
    return {
      ok: false,
      error:
        "No Cloudflare SaaS CNAME target is configured. Set CLOUDFLARE_SAAS_CNAME_TARGET first.",
      verification,
    };
  }

  const normalizedTarget = normalizeDnsValue(targetHost);

  const cnameValues = await resolveRecordValues(hostname, "CNAME").catch(
    () => [] as string[]
  );
  if (cnameValues.includes(normalizedTarget)) {
    return { ok: true, verification };
  }

  return {
    ok: false,
    error: `DNS is not pointing ${hostname} to the required CNAME target ${targetHost} yet.`,
    verification,
  };
}
