import { resetDatabase } from "./support/db";
import { requireTestDatabaseUrl } from "./support/runtime";

async function globalSetup() {
  if (process.env.SKIP_E2E_DB_RESET === "1") {
    return;
  }
  process.env.DATABASE_URL = requireTestDatabaseUrl();
  await resetDatabase();
}

export default globalSetup;
