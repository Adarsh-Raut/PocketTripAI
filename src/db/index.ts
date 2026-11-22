import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

import * as schema from "./schema";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  // Serverless instances are many and short-lived; keep each one's share small.
  max: 5,
});

export const db = drizzle(pool, { schema });

export type Db = typeof db;