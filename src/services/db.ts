import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from '../models/schema'

const connectionString = 'postgres://user_muxtpcaoxt:qLdnNzPrhgWeX8j3gcPG@devinapps-backend-prod.cluster-clussqewa0rh.us-west-2.rds.amazonaws.com/db_ocbfbhuiwj?sslmode=require'

const client = postgres(connectionString)
export const db = drizzle(client, { schema })
