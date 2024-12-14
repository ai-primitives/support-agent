import type { Config } from "drizzle-kit"

export default {
  schema: "./src/models/schema.ts",
  out: "./drizzle",
  driver: "pg",
  dbCredentials: {
    connectionString: process.env.DATABASE_URL || "postgres://user_muxtpcaoxt:qLdnNzPrhgWeX8j3gcPG@devinapps-backend-prod.cluster-clussqewa0rh.us-west-2.rds.amazonaws.com/db_ocbfbhuiwj?sslmode=require"
  }
} satisfies Config
