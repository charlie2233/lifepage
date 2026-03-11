import { Client } from "pg";
import { requireTestDatabaseUrl } from "./runtime";

const TABLES = [
  '"StripeWebhookEvent"',
  '"AgentArtifact"',
  '"Automation"',
  '"GeneratedProfile"',
  '"EvidenceItem"',
  '"PublicPageSettings"',
  '"UserProfile"',
  '"User"',
];

export async function resetDatabase() {
  const client = new Client({
    connectionString: requireTestDatabaseUrl(),
  });

  await client.connect();
  try {
    await client.query(`TRUNCATE TABLE ${TABLES.join(", ")} CASCADE;`);
  } finally {
    await client.end();
  }
}
