import { resetDatabase } from "./support/db";
import { requireTestDatabaseUrl } from "./support/runtime";

async function globalSetup() {
  process.env.DATABASE_URL = requireTestDatabaseUrl();
  await resetDatabase();
}

export default globalSetup;
